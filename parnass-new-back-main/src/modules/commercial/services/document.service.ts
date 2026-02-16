import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';

export interface DocumentDto {
  id?: string;
  entityType: 'contract' | 'prestation' | 'client';
  entityId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath?: string;
  storageBucket?: string;
  uploadedBy?: string;
  uploadedByName?: string;
}

export interface DocumentResponse {
  id: string;
  entityType: string;
  entityId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  storageBucket: string;
  uploadedBy: string | null;
  uploadedByName: string | null;
  createdAt: string;
  updatedAt: string;
  url?: string;
}

const STORAGE_BUCKET = 'commercial-documents';

// Allowed MIME types for document upload
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  /**
   * Upload a document and link it to a contract, prestation, or client
   */
  async upload(
    file: Express.Multer.File,
    entityType: 'contract' | 'prestation' | 'client',
    entityId: string,
    userId?: string,
    userName?: string,
  ): Promise<DocumentResponse> {
    // Validate file
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Type de fichier non autorisé. Formats acceptés: PDF, Excel, Word, images (PNG, JPEG, GIF, WEBP)',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        'Le fichier est trop volumineux (max 10 Mo)',
      );
    }

    // Generate unique storage path
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${entityType}/${entityId}/${timestamp}_${sanitizedName}`;

    // Upload to Supabase storage
    const { error: uploadError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      this.logger.error('Error uploading file to storage', uploadError);
      throw new BadRequestException(
        `Erreur lors de l'upload: ${uploadError.message}`,
      );
    }

    // Create document record in database
    const documentData = {
      entity_type: entityType,
      entity_id: entityId,
      name: file.originalname,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      storage_path: storagePath,
      storage_bucket: STORAGE_BUCKET,
      uploaded_by: userId || null,
      uploaded_by_name: userName || null,
    };

    const { data, error } = await this.supabase
      .from('document')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      // Clean up the uploaded file if database insert fails
      await this.supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      this.logger.error('Error creating document record', error);
      throw new BadRequestException(error.message);
    }

    return this.transformDocument(data);
  }

  /**
   * Get all documents for an entity
   */
  async findByEntity(
    entityType: 'contract' | 'prestation' | 'client',
    entityId: string,
  ): Promise<DocumentResponse[]> {
    const { data, error } = await this.supabase
      .from('document')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching documents', error);
      throw new BadRequestException(error.message);
    }

    return data.map((doc: any) => this.transformDocument(doc));
  }

  /**
   * Get a single document by ID
   */
  async findOne(id: string): Promise<DocumentResponse> {
    const { data, error } = await this.supabase
      .from('document')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }
      throw new BadRequestException(error.message);
    }

    return this.transformDocument(data);
  }

  /**
   * Delete a document
   */
  async remove(id: string): Promise<{ message: string }> {
    // Get document to get storage path
    const document = await this.findOne(id);

    // Delete from storage
    const { error: storageError } = await this.supabase.storage
      .from(document.storageBucket || STORAGE_BUCKET)
      .remove([document.storagePath]);

    if (storageError) {
      this.logger.warn('Error deleting file from storage', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error } = await this.supabase
      .from('document')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Error deleting document', error);
      throw new BadRequestException(error.message);
    }

    return { message: 'Document supprimé avec succès' };
  }

  /**
   * Get a signed URL for downloading a document
   */
  async getDownloadUrl(id: string): Promise<{ url: string; expiresIn: number }> {
    const document = await this.findOne(id);

    const { data, error } = await this.supabase.storage
      .from(document.storageBucket || STORAGE_BUCKET)
      .createSignedUrl(document.storagePath, 3600); // 1 hour expiry

    if (error) {
      this.logger.error('Error creating signed URL', error);
      throw new BadRequestException(
        `Erreur lors de la génération du lien: ${error.message}`,
      );
    }

    return {
      url: data.signedUrl,
      expiresIn: 3600,
    };
  }

  private transformDocument(data: any): DocumentResponse {
    return {
      id: data.id,
      entityType: data.entity_type,
      entityId: data.entity_id,
      name: data.name,
      originalName: data.original_name,
      mimeType: data.mime_type,
      size: data.size,
      storagePath: data.storage_path,
      storageBucket: data.storage_bucket,
      uploadedBy: data.uploaded_by,
      uploadedByName: data.uploaded_by_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

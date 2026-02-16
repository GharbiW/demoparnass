import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactService } from '../services/contact.service';
import { CreateContactDto, UpdateContactDto } from '../dto/contact';
import { SupabaseService } from '../../../config/supabase.service';

@Controller('commercial/contacts')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(
    private readonly contactService: ContactService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  findAll() {
    return this.contactService.findAll();
  }

  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto);
  }

  // Export/Import endpoints - must come before :id routes
  @Get('export')
  async exportToExcel(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Exporting contacts to Excel');
    const buffer = await this.contactService.exportToExcel();
    const filename = `contacts_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('import/template')
  getImportTemplate(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Generating contact import template');
    const buffer = this.contactService.getImportTemplate();
    const filename = 'modele_import_contacts.xlsx';

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('import/guidelines')
  getImportGuidelines(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Generating contact import guidelines');
    const content = this.contactService.getImportGuidelines();
    const filename = 'instructions_import_contacts.txt';

    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return content;
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('Importing contacts from Excel');

    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Le fichier doit être au format Excel (.xlsx ou .xls)',
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Le fichier est trop volumineux (max 10 Mo)');
    }

    return this.contactService.importFromExcel(file.buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactService.update(id, updateContactDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactService.remove(id);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `contact-${id}-${Date.now()}.${fileExt}`;
    const filePath = `contacts/${fileName}`;

    // Upload to Supabase storage
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.storage
      .from('commercial-avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('commercial-avatars').getPublicUrl(filePath);

    // Update contact with avatar URL
    return this.contactService.update(id, { avatarUrl: publicUrl });
  }
}

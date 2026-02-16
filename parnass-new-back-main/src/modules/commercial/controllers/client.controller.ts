import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { ClientService } from '../services/client.service';
import { CreateClientDto, UpdateClientDto } from '../dto/client';
import { SupabaseService } from '../../../config/supabase.service';

@Controller('commercial/clients')
export class ClientController {
  private readonly logger = new Logger(ClientController.name);

  constructor(
    private readonly clientService: ClientService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.clientService.findAll(includeInactive === 'true');
  }

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  // Export/Import endpoints - must come before :id routes
  @Get('export')
  async exportToExcel(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Exporting clients to Excel');
    const buffer = await this.clientService.exportToExcel();
    const filename = `clients_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('import/template')
  getImportTemplate(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Generating client import template');
    const buffer = this.clientService.getImportTemplate();
    const filename = 'modele_import_clients.xlsx';

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('import/guidelines')
  getImportGuidelines(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Generating client import guidelines');
    const content = this.clientService.getImportGuidelines();
    const filename = 'instructions_import_clients.txt';

    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return content;
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('Importing clients from Excel');

    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Le fichier doit être au format Excel (.xlsx ou .xls)',
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Le fichier est trop volumineux (max 10 Mo)');
    }

    return this.clientService.importFromExcel(file.buffer);
  }

  // Specific routes must come before generic :id routes
  @Get(':id/addresses')
  getAddresses(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.getAddresses(id);
  }

  @Get(':id/contacts')
  getContacts(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.getContacts(id);
  }

  @Get(':id/contracts')
  getContracts(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.getContracts(id);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(`Uploading avatar for client ${id}`);
    
    if (!file) {
      this.logger.error('No file provided');
      throw new BadRequestException('No file provided');
    }

    this.logger.log(`File received: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      this.logger.error(`Invalid file type: ${file.mimetype}`);
      throw new BadRequestException(
        'Invalid file type. Only images are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.logger.error(`File size too large: ${file.size}`);
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `client-${id}-${Date.now()}.${fileExt}`;
    const filePath = `clients/${fileName}`;

    this.logger.log(`Uploading to path: ${filePath}`);

    // Upload to Supabase storage
    const supabase = this.supabaseService.getClient();
    
    // Check if buffer exists
    if (!file.buffer) {
      this.logger.error('File buffer is missing');
      throw new BadRequestException('File buffer is missing');
    }
    
    const { data, error } = await supabase.storage
      .from('commercial-avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error('Supabase upload error:', error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }

    this.logger.log(`File uploaded successfully: ${data.path}`);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('commercial-avatars').getPublicUrl(filePath);

    this.logger.log(`Public URL: ${publicUrl}`);

    // Update client with avatar URL
    const updatedClient = await this.clientService.update(id, { avatarUrl: publicUrl });
    this.logger.log(`Client ${id} updated with avatar URL`);
    
    return updatedClient;
  }

  // Generic routes come after specific routes
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientService.remove(id);
  }
}

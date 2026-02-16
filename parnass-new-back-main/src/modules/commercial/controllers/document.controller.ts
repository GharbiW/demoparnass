import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from '../services/document.service';

@Controller('commercial/documents')
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {}

  /**
   * Upload a document for a contract, prestation, or client
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('entityType') entityType: 'contract' | 'prestation' | 'client',
    @Query('entityId') entityId: string,
  ) {
    this.logger.log(`Uploading document for ${entityType} ${entityId}`);

    if (
      !entityType ||
      !['contract', 'prestation', 'client'].includes(entityType)
    ) {
      throw new BadRequestException(
        'entityType doit être "contract", "prestation" ou "client"',
      );
    }

    if (!entityId) {
      throw new BadRequestException('entityId est requis');
    }

    return this.documentService.upload(
      file,
      entityType,
      entityId,
      undefined, // userId - would come from auth context
      undefined, // userName - would come from auth context
    );
  }

  /**
   * Get all documents for an entity
   */
  @Get()
  async findByEntity(
    @Query('entityType') entityType: 'contract' | 'prestation' | 'client',
    @Query('entityId') entityId: string,
  ) {
    if (
      !entityType ||
      !['contract', 'prestation', 'client'].includes(entityType)
    ) {
      throw new BadRequestException(
        'entityType doit être "contract", "prestation" ou "client"',
      );
    }

    if (!entityId) {
      throw new BadRequestException('entityId est requis');
    }

    return this.documentService.findByEntity(entityType, entityId);
  }

  /**
   * Get a single document
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.findOne(id);
  }

  /**
   * Get download URL for a document
   */
  @Get(':id/download')
  async getDownloadUrl(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.getDownloadUrl(id);
  }

  /**
   * Delete a document
   */
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.remove(id);
  }
}

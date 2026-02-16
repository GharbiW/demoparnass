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
import { PrestationService } from '../services/prestation.service';
import {
  CreatePrestationDto,
  UpdatePrestationDto,
  ArchivePrestationDto,
  ScheduleModificationDto,
} from '../dto/prestation';

@Controller('commercial/prestations')
export class PrestationController {
  private readonly logger = new Logger(PrestationController.name);

  constructor(private readonly prestationService: PrestationService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    const validStatuses = ['active', 'archived', 'all'];
    const statusFilter =
      status && validStatuses.includes(status)
        ? (status as 'active' | 'archived' | 'all')
        : 'active';
    return this.prestationService.findAll(statusFilter);
  }

  @Post()
  create(@Body() createPrestationDto: CreatePrestationDto) {
    return this.prestationService.create(createPrestationDto);
  }

  // Export/Import endpoints - must come before :id routes
  @Get('export')
  async exportToExcel(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Exporting prestations to Excel');
    const buffer = await this.prestationService.exportToExcel();
    const filename = `prestations_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('import/template')
  getImportTemplate(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Generating prestation import template');
    const buffer = this.prestationService.getImportTemplate();
    const filename = 'modele_import_prestations.xlsx';

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('import/guidelines')
  getImportGuidelines(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Generating prestation import guidelines');
    const content = this.prestationService.getImportGuidelines();
    const filename = 'instructions_import_prestations.txt';

    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return content;
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('Importing prestations from Excel');

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
      throw new BadRequestException(
        'Le fichier est trop volumineux (max 10 Mo)',
      );
    }

    return this.prestationService.importFromExcel(file.buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prestationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePrestationDto: UpdatePrestationDto,
  ) {
    return this.prestationService.update(id, updatePrestationDto);
  }

  // ============================================
  // Archive / Restore / Versioning endpoints
  // ============================================

  @Patch(':id/archive')
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ArchivePrestationDto,
  ) {
    return this.prestationService.archive(id, undefined, undefined, dto.reason);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.prestationService.restore(id);
  }

  @Post(':id/schedule-modification')
  scheduleModification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleModificationDto,
  ) {
    return this.prestationService.scheduleModification(id, dto);
  }

  @Get(':id/versions')
  getVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.prestationService.getVersions(id);
  }

  @Delete(':id/versions/:versionId')
  cancelScheduledVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.prestationService.cancelScheduledVersion(id, versionId);
  }

  // Hard delete - restricted (admin only in production)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.prestationService.hardDelete(id);
  }
}

import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CombinedImportService } from '../services/combined-import.service';

@Controller('commercial/import')
export class CombinedImportController {
  constructor(private readonly combinedImportService: CombinedImportService) {}

  /**
   * GET /commercial/import/client-full/template
   * Download Client Full Package template
   * NOTE: This must be defined BEFORE the :clientId route to avoid route collision
   */
  @Get('client-full/template')
  async getClientFullPackageTemplate(@Res() res: Response) {
    const buffer = await this.combinedImportService.generateClientFullPackageTemplate();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modele_import_client_complet.xlsx"',
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  /**
   * POST /commercial/import/client-full/:clientId
   * Import everything for an existing client (Addresses + Contacts + Contracts + Prestations)
   */
  @Post('client-full/:clientId')
  @UseInterceptors(FileInterceptor('file'))
  async importClientFullPackage(
    @Param('clientId') clientId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (!clientId) {
      throw new BadRequestException('ID du client requis');
    }

    // Validate file type
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Format de fichier invalide. Utilisez un fichier Excel (.xlsx)');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Fichier trop volumineux. Taille maximale: 5MB');
    }

    // TODO: Extract user info from JWT when auth is implemented
    const userId = undefined;
    const userName = undefined;

    return this.combinedImportService.importClientFullPackage(
      clientId,
      file.buffer,
      userId,
      userName,
    );
  }

  /**
   * POST /commercial/import/clients-package
   * Import Clients Package (Clients + Addresses + Contacts)
   */
  @Post('clients-package')
  @UseInterceptors(FileInterceptor('file'))
  async importClientsPackage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Validate file type
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Format de fichier invalide. Utilisez un fichier Excel (.xlsx)');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Fichier trop volumineux. Taille maximale: 5MB');
    }

    // TODO: Extract user info from JWT when auth is implemented
    const userId = undefined;
    const userName = undefined;

    return this.combinedImportService.importClientsPackage(
      file.buffer,
      userId,
      userName,
    );
  }

  /**
   * POST /commercial/import/contracts-package
   * Import Contracts Package (Contracts + Prestations)
   */
  @Post('contracts-package')
  @UseInterceptors(FileInterceptor('file'))
  async importContractsPackage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Validate file type
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Format de fichier invalide. Utilisez un fichier Excel (.xlsx)');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Fichier trop volumineux. Taille maximale: 5MB');
    }

    // TODO: Extract user info from JWT when auth is implemented
    const userId = undefined;
    const userName = undefined;

    return this.combinedImportService.importContractsPackage(
      file.buffer,
      userId,
      userName,
    );
  }

  /**
   * GET /commercial/import/clients-package/template
   * Download Clients Package template
   */
  @Get('clients-package/template')
  async getClientsPackageTemplate(@Res() res: Response) {
    const buffer = await this.combinedImportService.generateClientsPackageTemplate();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modele_import_clients.xlsx"',
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  /**
   * GET /commercial/import/contracts-package/template
   * Download Contracts Package template
   */
  @Get('contracts-package/template')
  async getContractsPackageTemplate(@Res() res: Response) {
    const buffer = await this.combinedImportService.generateContractsPackageTemplate();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modele_import_contrats.xlsx"',
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}

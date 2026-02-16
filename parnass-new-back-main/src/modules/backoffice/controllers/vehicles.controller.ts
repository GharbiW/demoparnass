import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Logger,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VehiclesCacheService } from '../services/vehicles-cache.service';
import { SyncService } from '../services/sync.service';
import {
  VehicleCacheResponseDto,
  VehicleStatsDto,
  UpdateVehicleManualFieldsDto,
  ListVehiclesQueryDto,
} from '../dto/vehicle.dto';
import { WincplImportResult } from '../types/wincpl.types';

@Controller('backoffice/vehicles')
export class VehiclesController {
  private readonly logger = new Logger(VehiclesController.name);

  constructor(
    private readonly vehiclesCacheService: VehiclesCacheService,
    private readonly syncService: SyncService,
  ) {}

  /**
   * GET /backoffice/vehicles
   * List all cached vehicles with optional filtering
   */
  @Get()
  async findAll(
    @Query() query: ListVehiclesQueryDto,
  ): Promise<VehicleCacheResponseDto[]> {
    this.logger.debug(`Récupération véhicules avec filtres: ${JSON.stringify(query)}`);
    return this.vehiclesCacheService.findAll(query);
  }

  /**
   * GET /backoffice/vehicles/stats/summary
   * Get vehicle statistics
   */
  @Get('stats/summary')
  async getStats(): Promise<VehicleStatsDto> {
    return this.vehiclesCacheService.getStats();
  }

  /**
   * POST /backoffice/vehicles/import/wincpl
   * Import vehicles from Wincpl XML files.
   * Accepts multipart/form-data with one or more XML files under field "files".
   * Also accepts JSON body with { xmlContents: string[] } for inline XML strings.
   */
  @Post('import/wincpl')
  @UseInterceptors(FilesInterceptor('files', 100))
  async importWincpl(
    @UploadedFiles() files?: Express.Multer.File[],
    @Body() body?: { xmlContents?: string[] },
  ): Promise<WincplImportResult> {
    const xmlContents: string[] = [];

    // From uploaded files
    if (files && files.length > 0) {
      for (const file of files) {
        if (!file.originalname.toLowerCase().endsWith('.xml')) {
          this.logger.warn(`Fichier ignoré (non-XML): ${file.originalname}`);
          continue;
        }
        // Wincpl XML uses ISO-8859-1 encoding
        const content = file.buffer.toString('latin1');
        xmlContents.push(content);
        this.logger.log(`Fichier XML chargé: ${file.originalname} (${file.size} bytes)`);
      }
    }

    // From JSON body
    if (body?.xmlContents && Array.isArray(body.xmlContents)) {
      xmlContents.push(...body.xmlContents);
    }

    if (xmlContents.length === 0) {
      throw new BadRequestException(
        'Aucun fichier XML fourni. Envoyez des fichiers en multipart/form-data (champ "files") ou un body JSON { xmlContents: string[] }',
      );
    }

    this.logger.log(`Import Wincpl: ${xmlContents.length} fichier(s) XML à traiter`);
    return this.syncService.importWincplXml(xmlContents);
  }

  /**
   * POST /backoffice/vehicles/import/wincpl/inline
   * Import vehicles from inline XML content (JSON body).
   * Body: { xmlContents: string[] }
   */
  @Post('import/wincpl/inline')
  async importWincplInline(
    @Body() body: { xmlContents: string[] },
  ): Promise<WincplImportResult> {
    if (!body?.xmlContents || !Array.isArray(body.xmlContents) || body.xmlContents.length === 0) {
      throw new BadRequestException(
        'Corps JSON requis: { xmlContents: ["<xml>...</xml>", ...] }',
      );
    }

    this.logger.log(`Import Wincpl inline: ${body.xmlContents.length} XML(s) à traiter`);
    return this.syncService.importWincplXml(body.xmlContents);
  }

  /**
   * GET /backoffice/vehicles/:id
   * Get a single vehicle by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<VehicleCacheResponseDto> {
    return this.vehiclesCacheService.findOne(id);
  }

  /**
   * PATCH /backoffice/vehicles/:id
   * Update manual fields for a vehicle
   */
  @Patch(':id')
  async updateManualFields(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleManualFieldsDto,
  ): Promise<VehicleCacheResponseDto> {
    this.logger.debug(`Mise à jour véhicule ${id}: ${JSON.stringify(dto)}`);
    return this.vehiclesCacheService.updateManualFields(id, dto);
  }
}

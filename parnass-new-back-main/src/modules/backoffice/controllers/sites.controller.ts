import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Logger,
} from '@nestjs/common';
import { SitesService } from '../services/sites.service';
import {
  SiteResponseDto,
  SiteStatsDto,
  CreateSiteDto,
  UpdateSiteDto,
  ListSitesQueryDto,
} from '../dto/site.dto';

@Controller('backoffice/sites')
export class SitesController {
  private readonly logger = new Logger(SitesController.name);

  constructor(private readonly sitesService: SitesService) {}

  /**
   * GET /backoffice/sites
   * List all sites with optional filtering
   */
  @Get()
  async findAll(
    @Query() query: ListSitesQueryDto,
  ): Promise<SiteResponseDto[]> {
    this.logger.debug(
      `Récupération sites avec filtres: ${JSON.stringify(query)}`,
    );
    return this.sitesService.findAll(query);
  }

  /**
   * GET /backoffice/sites/stats/summary
   * Get site statistics
   */
  @Get('stats/summary')
  async getStats(): Promise<SiteStatsDto> {
    return this.sitesService.getStats();
  }

  /**
   * GET /backoffice/sites/:id
   * Get a single site by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SiteResponseDto> {
    return this.sitesService.findOne(id);
  }

  /**
   * POST /backoffice/sites
   * Create a new site
   */
  @Post()
  async create(@Body() dto: CreateSiteDto): Promise<SiteResponseDto> {
    this.logger.debug(`Création site: ${JSON.stringify(dto)}`);
    return this.sitesService.create(dto);
  }

  /**
   * PATCH /backoffice/sites/:id
   * Update an existing site
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
  ): Promise<SiteResponseDto> {
    this.logger.debug(`Mise à jour site ${id}: ${JSON.stringify(dto)}`);
    return this.sitesService.update(id, dto);
  }

  /**
   * DELETE /backoffice/sites/:id
   * Delete a site
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    this.logger.debug(`Suppression site ${id}`);
    return this.sitesService.remove(id);
  }
}

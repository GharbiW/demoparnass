import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { DriversCacheService } from '../services/drivers-cache.service';
import {
  DriverCacheResponseDto,
  DriverStatsDto,
  UpdateDriverManualFieldsDto,
  ListDriversQueryDto,
} from '../dto/driver.dto';

@Controller('backoffice/drivers')
export class DriversController {
  private readonly logger = new Logger(DriversController.name);

  constructor(private readonly driversCacheService: DriversCacheService) {}

  /**
   * GET /backoffice/drivers
   * List all cached drivers with optional filtering
   */
  @Get()
  async findAll(
    @Query() query: ListDriversQueryDto,
  ): Promise<DriverCacheResponseDto[]> {
    this.logger.debug(`Récupération conducteurs avec filtres: ${JSON.stringify(query)}`);
    return this.driversCacheService.findAll(query);
  }

  /**
   * GET /backoffice/drivers/stats/summary
   * Get driver statistics
   */
  @Get('stats/summary')
  async getStats(): Promise<DriverStatsDto> {
    return this.driversCacheService.getStats();
  }

  /**
   * GET /backoffice/drivers/:id
   * Get a single driver by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DriverCacheResponseDto> {
    return this.driversCacheService.findOne(id);
  }

  /**
   * PATCH /backoffice/drivers/:id
   * Update manual fields for a driver
   */
  @Patch(':id')
  async updateManualFields(
    @Param('id') id: string,
    @Body() dto: UpdateDriverManualFieldsDto,
  ): Promise<DriverCacheResponseDto> {
    this.logger.debug(`Mise à jour conducteur ${id}: ${JSON.stringify(dto)}`);
    return this.driversCacheService.updateManualFields(id, dto);
  }
}

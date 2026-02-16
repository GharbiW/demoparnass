import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivityService, ActivityFilters } from '../services/activity.service';

@Controller('commercial/activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * GET /commercial/activities
   * Get all activities with optional filters
   */
  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
    @Query('contractId') contractId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: ActivityFilters = {
      type,
      userId,
      entityType,
      startDate,
      endDate,
      clientId,
      contractId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.activityService.findAll(filters);
  }

  /**
   * GET /commercial/activities/stats
   * Get activity statistics
   */
  @Get('stats')
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.activityService.getStats(startDate, endDate);
  }

  /**
   * GET /commercial/activities/:entityType/:entityId
   * Get activities for a specific entity
   */
  @Get(':entityType/:entityId')
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.activityService.findByEntity(entityType, entityId);
  }
}

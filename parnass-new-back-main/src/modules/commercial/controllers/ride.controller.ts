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
  Logger,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { RideService } from '../services/ride.service';
import { CreateRideDto, UpdateRideDto } from '../dto/ride';

@Controller('commercial/rides')
export class RideController {
  private readonly logger = new Logger(RideController.name);

  constructor(private readonly rideService: RideService) {}

  @Get()
  findAll(@Query('prestationId') prestationId?: string) {
    return this.rideService.findAll(prestationId);
  }

  // Export endpoint - must come before :id routes
  @Get('export')
  async exportToExcel(@Res({ passthrough: true }) res: Response) {
    const buffer = await this.rideService.exportToExcel();
    const filename = `trajets_export_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  // Search endpoint - must come before :id routes
  @Get('search')
  search(@Query('q') query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.rideService.search(query.trim());
  }

  // Search by reference endpoint
  @Get('by-reference/:reference')
  findByReference(@Param('reference') reference: string) {
    return this.rideService.findByReference(reference);
  }

  @Post()
  create(@Body() createRideDto: CreateRideDto) {
    return this.rideService.create(createRideDto);
  }

  // Reorder rides within a prestation
  @Post('reorder')
  reorder(
    @Body('prestationId') prestationId: string,
    @Body('rideIds') rideIds: string[],
  ) {
    return this.rideService.reorder(prestationId, rideIds);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rideService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRideDto: UpdateRideDto,
  ) {
    return this.rideService.update(id, updateRideDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rideService.remove(id);
  }
}

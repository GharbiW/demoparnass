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
} from '@nestjs/common';
import { SubcontractorsService } from '../services/subcontractors.service';
import {
  CreateSubcontractorDto,
  UpdateSubcontractorDto,
  ListSubcontractorsQueryDto,
} from '../dto/subcontractor.dto';

@Controller('conception/subcontractors')
export class SubcontractorsController {
  constructor(private readonly subcontractorsService: SubcontractorsService) {}

  @Get()
  async findAll(@Query() query: ListSubcontractorsQueryDto) {
    return this.subcontractorsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subcontractorsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSubcontractorDto) {
    return this.subcontractorsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubcontractorDto,
  ) {
    return this.subcontractorsService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.subcontractorsService.delete(id);
  }
}

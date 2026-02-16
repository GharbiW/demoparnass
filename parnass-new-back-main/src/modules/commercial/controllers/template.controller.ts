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
import { TemplateService } from '../services/template.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  InstantiateTemplateDto,
  CreateTemplateFromPrestationDto,
} from '../dto/template';

@Controller('commercial/templates')
export class TemplateController {
  private readonly logger = new Logger(TemplateController.name);

  constructor(private readonly templateService: TemplateService) {}

  /**
   * GET /commercial/templates
   * Get all templates with optional filters
   */
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('typeDemande') typeDemande?: string,
  ) {
    this.logger.log('Fetching all templates');
    return this.templateService.findAll({ search, category, typeDemande });
  }

  /**
   * GET /commercial/templates/categories
   * Get all unique categories
   */
  @Get('categories')
  getCategories() {
    this.logger.log('Fetching template categories');
    return this.templateService.getCategories();
  }

  /**
   * GET /commercial/templates/export
   * Export all templates to Excel
   */
  @Get('export')
  async exportToExcel(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Exporting templates to Excel');
    const buffer = await this.templateService.exportToExcel();
    const filename = `modeles_sup_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  /**
   * POST /commercial/templates
   * Create a new template
   */
  @Post()
  create(@Body() createTemplateDto: CreateTemplateDto) {
    this.logger.log(`Creating template: ${createTemplateDto.name}`);
    return this.templateService.create(createTemplateDto);
  }

  /**
   * POST /commercial/templates/from-prestation/:prestationId
   * Create a template from an existing prestation
   */
  @Post('from-prestation/:prestationId')
  createFromPrestation(
    @Param('prestationId', ParseUUIDPipe) prestationId: string,
    @Body() dto: CreateTemplateFromPrestationDto,
  ) {
    this.logger.log(`Creating template from prestation: ${prestationId}`);
    return this.templateService.createFromPrestation(prestationId, dto);
  }

  /**
   * GET /commercial/templates/:id
   * Get a single template by ID
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Fetching template: ${id}`);
    return this.templateService.findOne(id);
  }

  /**
   * PATCH /commercial/templates/:id
   * Update a template
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    this.logger.log(`Updating template: ${id}`);
    return this.templateService.update(id, updateTemplateDto);
  }

  /**
   * DELETE /commercial/templates/:id
   * Delete a template
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Deleting template: ${id}`);
    return this.templateService.remove(id);
  }

  /**
   * POST /commercial/templates/:id/instantiate
   * Create a prestation from a template
   */
  @Post(':id/instantiate')
  instantiate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() instantiateDto: InstantiateTemplateDto,
  ) {
    this.logger.log(
      `Instantiating template: ${id} for contract: ${instantiateDto.contractId}`,
    );
    return this.templateService.instantiate(id, instantiateDto);
  }
}

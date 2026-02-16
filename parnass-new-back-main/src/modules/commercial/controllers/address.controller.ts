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
import { AddressService } from '../services/address.service';
import { CreateAddressDto, UpdateAddressDto } from '../dto/address';

@Controller('commercial/addresses')
export class AddressController {
  private readonly logger = new Logger(AddressController.name);

  constructor(private readonly addressService: AddressService) {}

  @Get()
  findAll() {
    return this.addressService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.addressService.search(query, limit ? parseInt(limit, 10) : 20);
  }

  @Post()
  create(@Body() createAddressDto: CreateAddressDto) {
    return this.addressService.create(createAddressDto);
  }

  // Export/Import endpoints - must come before :id routes
  @Get('export')
  async exportToExcel(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Exporting addresses to Excel');
    const buffer = await this.addressService.exportToExcel();
    const filename = `adresses_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('import/template')
  getImportTemplate(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Generating address import template');
    const buffer = this.addressService.getImportTemplate();
    const filename = 'modele_import_adresses.xlsx';

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('import/guidelines')
  getImportGuidelines(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Generating address import guidelines');
    const content = this.addressService.getImportGuidelines();
    const filename = 'instructions_import_adresses.txt';

    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return content;
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('Importing addresses from Excel');

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
      throw new BadRequestException('Le fichier est trop volumineux (max 10 Mo)');
    }

    return this.addressService.importFromExcel(file.buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.addressService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressService.update(id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.addressService.remove(id);
  }
}

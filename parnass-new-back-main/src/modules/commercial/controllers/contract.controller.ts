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
import { ContractService } from '../services/contract.service';
import { CreateContractDto, UpdateContractDto } from '../dto/contract';

@Controller('commercial/contracts')
export class ContractController {
  private readonly logger = new Logger(ContractController.name);

  constructor(private readonly contractService: ContractService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.contractService.findAll(includeInactive === 'true');
  }

  @Post()
  create(@Body() createContractDto: CreateContractDto) {
    return this.contractService.create(createContractDto);
  }

  // Export/Import endpoints - must come before :id routes
  @Get('export')
  async exportToExcel(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Exporting contracts to Excel');
    const buffer = await this.contractService.exportToExcel();
    const filename = `contrats_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('import/template')
  getImportTemplate(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Generating contract import template');
    const buffer = this.contractService.getImportTemplate();
    const filename = 'modele_import_contrats.xlsx';

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('import/guidelines')
  getImportGuidelines(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Generating contract import guidelines');
    const content = this.contractService.getImportGuidelines();
    const filename = 'instructions_import_contrats.txt';

    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return content;
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('Importing contracts from Excel');

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

    return this.contractService.importFromExcel(file.buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContractDto: UpdateContractDto,
  ) {
    return this.contractService.update(id, updateContractDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.remove(id);
  }

  @Get(':id/prestations')
  getPrestations(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.getPrestations(id);
  }
}

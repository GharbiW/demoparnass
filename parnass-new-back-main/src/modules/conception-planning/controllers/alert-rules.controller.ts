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
import { AlertRulesService } from '../services/alert-rules.service';
import {
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  ListAlertRulesQueryDto,
} from '../dto/alert-rule.dto';

@Controller('conception/alert-rules')
export class AlertRulesController {
  constructor(private readonly alertRulesService: AlertRulesService) {}

  @Get()
  async findAll(@Query() query: ListAlertRulesQueryDto) {
    return this.alertRulesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertRulesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateAlertRuleDto) {
    return this.alertRulesService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlertRuleDto,
  ) {
    return this.alertRulesService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertRulesService.delete(id);
  }
}

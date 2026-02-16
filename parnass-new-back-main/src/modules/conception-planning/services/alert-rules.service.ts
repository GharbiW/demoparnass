import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import {
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  ListAlertRulesQueryDto,
} from '../dto/alert-rule.dto';

@Injectable()
export class AlertRulesService {
  private readonly logger = new Logger(AlertRulesService.name);
  private get supabase() {
    return this.supabaseService.getClient();
  }

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(query: ListAlertRulesQueryDto = {}) {
    let qb = this.supabase
      .from('alert_rule')
      .select('*')
      .order('created_at', { ascending: false });

    if (query.category) qb = qb.eq('category', query.category);
    if (query.enabled !== undefined) qb = qb.eq('enabled', query.enabled);
    if (query.search) {
      qb = qb.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }

    const { data, error } = await qb;
    if (error) {
      this.logger.error('Error fetching alert rules', error);
      throw new BadRequestException(error.message);
    }
    return (data || []).map((r: any) => this.transform(r));
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('alert_rule')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException(`Alert rule ${id} not found`);
      throw new BadRequestException(error.message);
    }
    return this.transform(data);
  }

  async create(dto: CreateAlertRuleDto) {
    const row: any = {
      name: dto.name,
      category: dto.category,
      severity: dto.severity,
    };
    if (dto.conditionText !== undefined) row.condition_text = dto.conditionText;
    if (dto.threshold !== undefined) row.threshold = dto.threshold;
    if (dto.tolerance !== undefined) row.tolerance = dto.tolerance;
    if (dto.targetDate !== undefined) row.target_date = dto.targetDate;
    if (dto.description !== undefined) row.description = dto.description;
    if (dto.enabled !== undefined) row.enabled = dto.enabled;

    const { data, error } = await this.supabase
      .from('alert_rule')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error creating alert rule', error);
      throw new BadRequestException(error.message);
    }
    return this.transform(data);
  }

  async update(id: string, dto: UpdateAlertRuleDto) {
    await this.findOne(id);

    const row: any = {};
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.category !== undefined) row.category = dto.category;
    if (dto.severity !== undefined) row.severity = dto.severity;
    if (dto.conditionText !== undefined) row.condition_text = dto.conditionText;
    if (dto.threshold !== undefined) row.threshold = dto.threshold;
    if (dto.tolerance !== undefined) row.tolerance = dto.tolerance;
    if (dto.targetDate !== undefined) row.target_date = dto.targetDate;
    if (dto.description !== undefined) row.description = dto.description;
    if (dto.enabled !== undefined) row.enabled = dto.enabled;

    const { data, error } = await this.supabase
      .from('alert_rule')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error updating alert rule', error);
      throw new BadRequestException(error.message);
    }
    return this.transform(data);
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('alert_rule')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Alert rule deleted' };
  }

  private transform(data: any) {
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      severity: data.severity,
      conditionText: data.condition_text,
      threshold: data.threshold,
      tolerance: data.tolerance,
      targetDate: data.target_date,
      description: data.description,
      enabled: data.enabled,
      isBuiltin: data.is_builtin,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

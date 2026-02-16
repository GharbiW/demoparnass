import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsIn,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAlertRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['amplitude', 'ressources', 'qualite', 'planning', 'custom'])
  category: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['critique', 'warning', 'info'])
  severity: string;

  @IsString()
  @IsOptional()
  conditionText?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  threshold?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  tolerance?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateAlertRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['amplitude', 'ressources', 'qualite', 'planning', 'custom'])
  category?: string;

  @IsString()
  @IsOptional()
  @IsIn(['critique', 'warning', 'info'])
  severity?: string;

  @IsString()
  @IsOptional()
  conditionText?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  threshold?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  tolerance?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class ListAlertRulesQueryDto {
  @IsString()
  @IsOptional()
  @IsIn(['amplitude', 'ressources', 'qualite', 'planning', 'custom'])
  category?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  enabled?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}

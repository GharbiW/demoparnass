import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsIn,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubcontractorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  siret?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  vehicleTypes?: string[];

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rating?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSubcontractorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  siret?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  vehicleTypes?: string[];

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rating?: number;

  @IsString()
  @IsOptional()
  @IsIn(['actif', 'inactif'])
  status?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  contractCount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  activeVehicles?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ListSubcontractorsQueryDto {
  @IsString()
  @IsOptional()
  @IsIn(['actif', 'inactif'])
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Site DTOs — Sites d'exploitation
// ============================================

/**
 * Response DTO for a site
 */
export class SiteResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  nom: string;

  @IsString()
  @IsIn(['depot', 'parking', 'garage', 'lieu_prise_service'])
  type: string;

  @IsBoolean()
  isLieuPriseService: boolean;

  // Address
  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  codePostal?: string;

  @IsString()
  @IsOptional()
  pays?: string;

  // GPS
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  // Contact
  @IsString()
  @IsOptional()
  contactNom?: string;

  @IsString()
  @IsOptional()
  contactTelephone?: string;

  // Operations
  @IsString()
  @IsOptional()
  horaires?: string;

  @IsNumber()
  @IsOptional()
  capacite?: number;

  // Timestamps
  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;
}

/**
 * DTO for creating a new site
 */
export class CreateSiteDto {
  @IsString()
  nom: string;

  @IsString()
  @IsIn(['depot', 'parking', 'garage', 'lieu_prise_service'])
  type: string;

  @IsBoolean()
  @IsOptional()
  isLieuPriseService?: boolean;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  codePostal?: string;

  @IsString()
  @IsOptional()
  pays?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsString()
  @IsOptional()
  contactNom?: string;

  @IsString()
  @IsOptional()
  contactTelephone?: string;

  @IsString()
  @IsOptional()
  horaires?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  capacite?: number;
}

/**
 * DTO for updating a site (all fields optional)
 */
export class UpdateSiteDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsIn(['depot', 'parking', 'garage', 'lieu_prise_service'])
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  isLieuPriseService?: boolean;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  codePostal?: string;

  @IsString()
  @IsOptional()
  pays?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsString()
  @IsOptional()
  contactNom?: string;

  @IsString()
  @IsOptional()
  contactTelephone?: string;

  @IsString()
  @IsOptional()
  horaires?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  capacite?: number;
}

/**
 * Query params for listing sites
 */
export class ListSitesQueryDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  isLieuPriseService?: string; // 'true' | 'false'

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

/**
 * DTO for site statistics
 */
export class SiteStatsDto {
  @IsNumber()
  total: number;

  @IsNumber()
  depots: number;

  @IsNumber()
  parkings: number;

  @IsNumber()
  garages: number;

  @IsNumber()
  lieuxPriseService: number;
}

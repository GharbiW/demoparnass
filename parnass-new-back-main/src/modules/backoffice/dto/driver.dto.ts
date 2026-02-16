import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsBoolean,
  IsIn,
  IsDate,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Driver Cache DTOs
// ============================================

/**
 * Response DTO for a driver from the cache
 * Includes metadata about which fields come from API vs manual entry
 */
export class DriverCacheResponseDto {
  @IsUUID()
  id: string;

  @IsNumber()
  factorialId: number;

  // ── Fields from Factorial API (standard employee) ──

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  loginEmail?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  birthday?: string;

  @IsNumber()
  @IsOptional()
  teamId?: number;

  @IsString()
  @IsOptional()
  teamName?: string;

  // ── Fields from Factorial API (custom fields) ──

  @IsString()
  @IsOptional()
  shift?: string;

  @IsString()
  @IsOptional()
  availableWeekends?: string;

  @IsString()
  @IsOptional()
  forfaitWeekend?: string;

  @IsString()
  @IsOptional()
  lieuPrisePoste?: string;

  // AS24 cards
  @IsString()
  @IsOptional()
  numeroCarteAs24?: string;

  @IsString()
  @IsOptional()
  dateRemiseCarteAs24?: string;

  @IsString()
  @IsOptional()
  dateRestitutionAs24?: string;

  // Permits / Habilitations / Medical (dates from Factorial custom fields)
  @IsString()
  @IsOptional()
  permisDeConduire?: string;

  @IsString()
  @IsOptional()
  fco?: string;

  @IsString()
  @IsOptional()
  adr?: string;

  @IsString()
  @IsOptional()
  habilitation?: string;

  @IsString()
  @IsOptional()
  formation1123911262?: string;

  @IsString()
  @IsOptional()
  visiteMedicale?: string;

  // ── Manual fields (not from API — shown underlined in UI) ──

  @IsString()
  @IsOptional()
  matricule?: string;

  @IsArray()
  @IsString({ each: true })
  permits: string[];

  @IsArray()
  @IsString({ each: true })
  certifications: string[];

  @IsString()
  @IsOptional()
  agence?: string;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsNumber()
  @IsOptional()
  amplitude?: number;

  @IsBoolean()
  @IsOptional()
  decoucher?: boolean;

  @IsString()
  @IsIn(['disponible', 'occupe', 'indisponible'])
  status: string;

  @IsString()
  @IsOptional()
  indisponibiliteRaison?: string;

  // ── Metadata ──

  @IsArray()
  @IsString({ each: true })
  _apiFields: string[];

  @IsString()
  syncedAt: string;

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;
}

/**
 * DTO for updating manual driver fields (not from API)
 */
export class UpdateDriverManualFieldsDto {
  @IsString()
  @IsOptional()
  matricule?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permits?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsString()
  @IsOptional()
  agence?: string;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsNumber()
  @IsOptional()
  amplitude?: number;

  @IsBoolean()
  @IsOptional()
  decoucher?: boolean;

  @IsString()
  @IsIn(['disponible', 'occupe', 'indisponible'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  indisponibiliteRaison?: string;
}

/**
 * DTO for driver stats summary
 */
export class DriverStatsDto {
  @IsNumber()
  total: number;

  @IsNumber()
  disponibles: number;

  @IsNumber()
  occupes: number;

  @IsNumber()
  indisponibles: number;

  @IsString()
  @IsOptional()
  lastSyncAt?: string;
}

/**
 * Query params for listing drivers
 */
export class ListDriversQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  teamName?: string;

  @IsString()
  @IsOptional()
  agence?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

// List of fields that come from Factorial API
// (standard employee fields + custom fields synced from Factorial)
export const DRIVER_API_FIELDS = [
  'factorialId',
  'firstName',
  'lastName',
  'email',
  'loginEmail',
  'phone',
  'address',
  'addressLine2',
  'postalCode',
  'city',
  'state',
  'country',
  'birthday',
  'teamId',
  'teamName',
  // Custom fields from Factorial
  'shift',
  'availableWeekends',
  'forfaitWeekend',
  'lieuPrisePoste',
  'numeroCarteAs24',
  'dateRemiseCarteAs24',
  'dateRestitutionAs24',
  'permisDeConduire',
  'fco',
  'adr',
  'habilitation',
  'formation1123911262',
  'visiteMedicale',
];

// List of manual fields (not from API)
export const DRIVER_MANUAL_FIELDS = [
  'matricule',
  'permits',
  'certifications',
  'agence',
  'zone',
  'amplitude',
  'decoucher',
  'status',
  'indisponibiliteRaison',
];

import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  IsArray,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateAddressDto {
  // Single reference field - auto-generated if empty (format: ADR-YYYY-XXXX)
  @IsString()
  @IsOptional()
  @MaxLength(50)
  reference?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  // Street address (rue)
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  countryCode?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  // GPS matching radius in meters (default 50m)
  @IsNumber()
  @IsOptional()
  @Min(10)
  @Max(1000)
  gpsRadius?: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  clientIds?: string[];
}

import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class CreateClientDto {
  // Single reference field - auto-generated if empty (format: CLI-YYYY-XXXX)
  @IsString()
  @IsOptional()
  @MaxLength(50)
  reference?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  siret?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  vatNumber?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  initials?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  color?: string;

  // Headquarters address fields
  @IsString()
  @IsOptional()
  headquartersAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  headquartersPostalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  headquartersCity?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  headquartersCountry?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  headquartersCountryCode?: string;

  // Billing address fields (MCom-006)
  @IsBoolean()
  @IsOptional()
  hasDifferentBillingAddress?: boolean;

  @IsString()
  @IsOptional()
  billingAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  billingPostalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  billingCity?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  billingCountry?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  billingCountryCode?: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;

  // Comment/Note field
  @IsString()
  @IsOptional()
  comment?: string;
}

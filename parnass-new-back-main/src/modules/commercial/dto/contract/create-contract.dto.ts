import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsIn,
  IsBoolean,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateContractDto {
  // Single reference field - auto-generated if empty (format: CTR-YYYY-XXXX)
  @IsString()
  @IsOptional()
  @MaxLength(50)
  reference?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  invoiceCode?: string;

  // Référence Facturation (synced with client.reference)
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceFacturation?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Annuel', 'Pluriannuel', 'Spot'])
  type?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'terminated'])
  status?: string;

  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  // Comment/Note field
  @IsString()
  @IsOptional()
  comment?: string;
}

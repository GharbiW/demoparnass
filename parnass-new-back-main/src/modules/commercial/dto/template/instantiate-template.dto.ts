import {
  IsUUID,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class InstantiateTemplateDto {
  @IsUUID()
  @IsNotEmpty({ message: 'Le contrat est requis pour créer une prestation' })
  contractId: string;

  @IsBoolean()
  @IsOptional()
  includeRideDetails?: boolean;

  // Optional client reference for the new prestation
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceClient?: string;
}

export class CreateTemplateFromPrestationDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du modèle est requis' })
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  codeArticle?: string;

  @IsBoolean()
  @IsOptional()
  includeRideDetails?: boolean;
}

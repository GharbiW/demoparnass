import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsIn,
  IsBoolean,
  IsArray,
  IsUUID,
  IsNumber,
  Min,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MOTEUR_CODES,
  TRACTE_CODES,
  ENERGIE_VALUES,
} from '../prestation/create-prestation.dto';

// DTO for each step in the itinerary (same as prestation)
export class TemplateEtapeDto {
  @IsUUID('4')
  @IsNotEmpty({ message: "L'adresse de l'étape est requise" })
  addressId: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "L'heure de départ doit être au format HH:mm",
  })
  heureDepart?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "L'heure d'arrivée doit être au format HH:mm",
  })
  heureArrivee?: string;

  @IsBoolean()
  @IsOptional()
  vide?: boolean;

  @IsString()
  @IsOptional()
  comment?: string;
}

// DTO for ride details storage
export class TemplateRideDetailDto {
  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "L'heure de présence au chargement doit être au format HH:mm",
  })
  presenceChargement?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "L'heure de départ chargement doit être au format HH:mm",
  })
  departChargement?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "L'heure d'arrivée livraison doit être au format HH:mm",
  })
  arriveeLivraison?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "L'heure de fin livraison doit être au format HH:mm",
  })
  finLivraison?: string;

  @IsBoolean()
  @IsOptional()
  vide?: boolean;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class CreateTemplateDto {
  // Template identification
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

  // Code article for billing
  @IsString()
  @IsOptional()
  @MaxLength(100)
  codeArticle?: string;

  // Client association
  @IsUUID('4')
  @IsOptional()
  clientId?: string;

  // Contract association
  @IsUUID('4')
  @IsOptional()
  contractId?: string;

  // Schedule
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  frequence?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['Régulière', 'SUP', 'MAD'])
  typeDemande?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'heureDepart must be in HH:mm format',
  })
  heureDepart?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'heureArrivee must be in HH:mm format',
  })
  heureArrivee?: string;

  // Itinerary - steps
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateEtapeDto)
  @IsOptional()
  etapes?: TemplateEtapeDto[];

  // ── Contrainte Matériel ─────────────────────
  // Moteur code (single select)
  @IsString()
  @IsOptional()
  @IsIn([...MOTEUR_CODES])
  typologieVehicule?: string;

  // Énergie auto-derived from moteur suffix
  @IsString()
  @IsOptional()
  @IsIn([...ENERGIE_VALUES])
  energieImposee?: string;

  // Véhicule Tracté code (single select)
  @IsString()
  @IsOptional()
  @IsIn([...TRACTE_CODES])
  typeRemorque?: string;

  // Spécificité Matériel (JSONB object with 5 sub-categories)
  @IsOptional()
  specificites?: any;

  // ── Contrainte Conducteur ───────────────────
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contraintesConducteur?: string[];

  @IsBoolean()
  @IsOptional()
  sensible?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  codeDechargement?: string;

  // Type tracteur auto-derived (VL / CM / SPL)
  @IsString()
  @IsOptional()
  typeTracteur?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  // Mileage (for MAD type)
  @IsNumber()
  @IsOptional()
  @Min(0)
  kilometragePrevu?: number;

  // Pricing
  @IsString()
  @IsOptional()
  @IsIn(['forfaitaire', 'terme_kilometrique', 'taux_horaire'])
  typeTarif?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  tarif?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  tarifUnite?: string;

  // MCom-25: Contractual billing amounts
  @IsNumber()
  @IsOptional()
  @Min(0)
  tarifKmContractuel?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  tarifHeuresContractuel?: number;

  // Ride details options
  @IsBoolean()
  @IsOptional()
  includeRideDetails?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateRideDetailDto)
  @IsOptional()
  rideDetails?: TemplateRideDetailDto[];
}

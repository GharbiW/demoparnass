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
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ──────────────────────────────────────────────
// Allowed codified values (Parnass classification)
// ──────────────────────────────────────────────
export const MOTEUR_CODES = [
  'PORGO',
  'PORGZ',
  'TRAGO',
  'TRAGZ',
  'U20GZ',
  'U20GO',
  'U03GO',
  'U06EL',
  'U06GO',
  'U12GO',
  'U12GZ',
  'U14GO',
  'UTPEL',
] as const;

export const TRACTE_CODES = [
  'AERBA',
  'AERCL',
  'AERFR',
  'AERME',
  'REMOR',
  'SRCLA',
  'SRFRI',
  'SRMFR',
  'SRPTE',
] as const;

export const ENERGIE_VALUES = ['Gazole', 'Gaz', 'Électrique'] as const;

export const CONTRAINTE_CONDUCTEUR_OPTIONS = [
  'ADR 1.3',
  'ADR 8.2',
  'Formation sûreté',
  'Habilitation préfectorale',
  'Semi Rouleaux',
  'Frigo',
  'BPD (Pharma)',
  'APSAD_P3 (SECURITAS)',
  'APSAD_P5 (TAPA)',
  'Formation transpalette électrique',
] as const;

// DTO for each ride in the itinerary (1 étape = 1 complete ride with departure + arrival)
export class EtapeDto {
  // Existing ride ID (for updates — allows syncing ride reference_client)
  @IsUUID('4')
  @IsOptional()
  rideId?: string;

  // Departure address (required)
  @IsUUID('4')
  @IsNotEmpty({ message: "L'adresse de départ est requise" })
  addressDepart: string;

  // Arrival address (required for non-MAD, same as departure for MAD)
  @IsUUID('4')
  @IsOptional()
  addressArrivee?: string;

  // Legacy field - kept for backward compatibility
  @IsUUID('4')
  @IsOptional()
  addressId?: string;

  // Editable client reference for this ride (EID)
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceClient?: string;

  // 4 mandatory timestamps for ride definition (HH:mm format)
  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "L'heure de présence doit être au format HH:mm",
  })
  heurePresence?: string;

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

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "L'heure de fin doit être au format HH:mm",
  })
  heureFin?: string;

  @IsBoolean()
  @IsOptional()
  vide?: boolean;

  // Comment for individual ride/step
  @IsString()
  @IsOptional()
  comment?: string;
}

export class CreatePrestationDto {
  @IsUUID()
  @IsNotEmpty()
  contractId: string;

  // Editable client reference - if empty, internal reference is used
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceClient?: string;

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

  // Array of ride objects: each étape = 1 complete ride
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EtapeDto)
  @ArrayMinSize(1, {
    message: 'Au moins 1 étape est requise',
  })
  @IsNotEmpty({ message: 'Les étapes sont requises' })
  etapes: EtapeDto[];

  // ── Contrainte Matériel ─────────────────────
  // Moteur code (required, single select)
  @IsString()
  @IsNotEmpty({ message: 'Le code moteur est requis' })
  @IsIn([...MOTEUR_CODES])
  typologieVehicule: string;

  // Énergie auto-derived from moteur suffix (GO=Gazole, GZ=Gaz, EL=Électrique)
  @IsString()
  @IsOptional()
  @IsIn([...ENERGIE_VALUES])
  energieImposee?: string;

  // Véhicule Tracté code (required, single select)
  @IsString()
  @IsNotEmpty({ message: 'Le code véhicule tracté est requis' })
  @IsIn([...TRACTE_CODES])
  typeRemorque: string;

  // Derived tracteur type (CM / SPL / VL) — auto-computed from moteur code
  // Accepted but NOT stored; kept so the frontend doesn't get a 400 error
  @IsString()
  @IsOptional()
  typeTracteur?: string;

  // Spécificité Matériel (JSONB object with 5 sub-categories)
  // { roues?: string, fermeture?: string, equipement?: string[], securite?: string, reglementaire?: string }
  @IsOptional()
  specificites?: any;

  // ── Contrainte Conducteur ───────────────────
  // Multi-select, not required
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

  @IsString()
  @IsOptional()
  comment?: string;

  // Billing flag (À facturer)
  @IsBoolean()
  @IsOptional()
  aFacturer?: boolean;

  // Planned mileage in km (mandatory for MAD type)
  @IsNumber()
  @IsOptional()
  @Min(0)
  kilometragePrevu?: number;

  // Actual mileage in km (from book P / Solide)
  @IsNumber()
  @IsOptional()
  @Min(0)
  kilometrageReel?: number;

  // MCom-0015: Price/Tariff with type
  @IsString()
  @IsOptional()
  @IsIn(['forfaitaire', 'terme_kilometrique', 'taux_horaire'])
  typeTarif?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  tarif?: number;

  // Tariff unit
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
}

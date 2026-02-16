import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsIn,
  IsDate,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Vehicle Cache DTOs — Unified Wincpl-based schema
// ============================================

/**
 * Response DTO for a vehicle from the cache.
 * Canonical schema based on Wincpl fields.
 * MyRentACar data is mapped to these fields via a conversion layer.
 */
export class VehicleCacheResponseDto {
  @IsUUID()
  id: string;

  // ── Data source tracking ──
  @IsString()
  dataSource: string; // 'wincpl' | 'myrentcar'

  @IsNumber()
  @IsOptional()
  myrentcarId?: number; // Legacy MyRentACar ID (null for Wincpl vehicles)

  @IsString()
  @IsOptional()
  wincplCode?: string; // Wincpl CODE_VEHICULE (null for MyRentACar vehicles)

  // ── Core identification ──
  @IsString()
  immatriculation: string;

  @IsString()
  @IsOptional()
  numero?: string; // Internal number (MyRentACar) / CODE_VEHICULE (Wincpl)

  @IsString()
  @IsOptional()
  marqueVehicule?: string; // MARQUE_VEHICULE (Wincpl) / brand part of MarqueType (MyRentACar)

  @IsString()
  @IsOptional()
  marqueModele?: string; // Full brand + model (legacy from MyRentACar, or MARQUE_VEHICULE for Wincpl)

  @IsString()
  @IsOptional()
  categorieVehicule?: string; // CATEGORIE_VEHICULE (MOT, PL, etc.)

  @IsString()
  @IsOptional()
  type?: string; // Vehicle type label

  @IsString()
  @IsOptional()
  typeCode?: string; // Vehicle type code

  @IsBoolean()
  @IsOptional()
  enActivite?: boolean;

  @IsNumber()
  @IsOptional()
  idSociete?: number;

  @IsNumber()
  @IsOptional()
  idAgence?: number;

  // ── Serial / Chassis ──
  @IsString()
  @IsOptional()
  numeroSerie?: string;

  @IsString()
  @IsOptional()
  numeroChassis?: string;

  @IsString()
  @IsOptional()
  numeroMoteur?: string;

  // ── Engine / Power ──
  @IsNumber()
  @IsOptional()
  puissanceVehicule?: number; // CV

  @IsNumber()
  @IsOptional()
  puissanceKw?: number;

  @IsNumber()
  @IsOptional()
  cylindree?: number; // cc

  @IsNumber()
  @IsOptional()
  nbCylindres?: number;

  @IsNumber()
  @IsOptional()
  nbVitesses?: number;

  @IsString()
  @IsOptional()
  codeMoteur?: string;

  @IsString()
  @IsOptional()
  typeTransmission?: string;

  @IsBoolean()
  @IsOptional()
  turboCompresseur?: boolean;

  // ── Dimensions ──
  @IsNumber()
  @IsOptional()
  longueurTotale?: number;

  @IsNumber()
  @IsOptional()
  largeurTotale?: number;

  @IsNumber()
  @IsOptional()
  hauteurTotale?: number;

  @IsNumber()
  @IsOptional()
  volumeVehicule?: number;

  @IsNumber()
  @IsOptional()
  volumeMaxi?: number;

  // ── Weight ──
  @IsString()
  @IsOptional()
  poidsVide?: string; // Legacy string format from MyRentACar

  @IsString()
  @IsOptional()
  poidsCharge?: string; // Legacy string format from MyRentACar

  @IsNumber()
  @IsOptional()
  chargeUtile?: number;

  @IsNumber()
  @IsOptional()
  ptac?: number;

  @IsNumber()
  @IsOptional()
  ptr?: number;

  @IsNumber()
  @IsOptional()
  poidsTotalRoulant?: number;

  @IsNumber()
  @IsOptional()
  nbEssieux?: number;

  // ── Body / Carrosserie ──
  @IsString()
  @IsOptional()
  typeCarrosserie?: string;

  @IsString()
  @IsOptional()
  typeCarrosserie2?: string;

  @IsString()
  @IsOptional()
  genreCarrosserie?: string;

  @IsNumber()
  @IsOptional()
  nbPlacesAssises?: number;

  @IsNumber()
  @IsOptional()
  nbPortes?: number;

  @IsNumber()
  @IsOptional()
  palVehicule?: number; // Pallet capacity

  // ── Energy / Fuel ──
  @IsString()
  @IsOptional()
  energie?: string; // Display label (legacy from MyRentACar)

  @IsString()
  @IsOptional()
  energieVehicule?: string; // Wincpl energy code (GO, GZ, etc.)

  @IsNumber()
  @IsOptional()
  energieId?: number; // Legacy MyRentACar fuel ID

  @IsNumber()
  @IsOptional()
  capaciteReservoir?: number; // Legacy MyRentACar

  @IsNumber()
  @IsOptional()
  contenanceReservoir?: number; // Wincpl CONT_RES

  @IsNumber()
  @IsOptional()
  consoUrbaine?: number;

  @IsNumber()
  @IsOptional()
  consoExtraUrbaine?: number;

  @IsNumber()
  @IsOptional()
  consoMixte?: number;

  // ── Pollution ──
  @IsString()
  @IsOptional()
  normePollution?: string; // EURO6, etc.

  @IsNumber()
  @IsOptional()
  critair?: number;

  @IsNumber()
  @IsOptional()
  co2?: number;

  @IsBoolean()
  @IsOptional()
  filtreAParticules?: boolean;

  @IsBoolean()
  @IsOptional()
  adblue?: boolean;

  // ── Dates & KM ──
  @IsNumber()
  @IsOptional()
  kilometrage?: number; // Legacy MyRentACar / KM_COMPTEUR

  @IsString()
  @IsOptional()
  dateDernierKm?: string; // Legacy MyRentACar

  @IsString()
  @IsOptional()
  dateMiseCirculation?: string;

  @IsString()
  @IsOptional()
  dateAchat?: string;

  @IsString()
  @IsOptional()
  dateCarteGrise?: string;

  @IsString()
  @IsOptional()
  dateFinGarantieVehicule?: string;

  @IsString()
  @IsOptional()
  dateFinGarantieMoteur?: string;

  @IsString()
  @IsOptional()
  immatriculationPrecedente?: string;

  // ── Insurance ──
  @IsString()
  @IsOptional()
  codeAssureur?: string;

  @IsString()
  @IsOptional()
  assuranceNumContrat?: string;

  @IsString()
  @IsOptional()
  assuranceDateEcheance?: string;

  @IsNumber()
  @IsOptional()
  assuranceMontant?: number;

  @IsNumber()
  @IsOptional()
  assuranceFranchise?: number;

  // ── Transport ──
  @IsString()
  @IsOptional()
  codeTypeSemi?: string;

  @IsString()
  @IsOptional()
  porteur?: string;

  @IsString()
  @IsOptional()
  commentaire?: string;

  // ── Legacy MyRentACar fields (kept for backward compat) ──
  @IsNumber()
  @IsOptional()
  primeVolume?: number;

  @IsString()
  @IsOptional()
  agenceProprietaire?: string;

  @IsString()
  @IsOptional()
  categoryCode?: string;

  // ── Manual fields (not from any API — edited in the platform) ──
  @IsString()
  @IsIn(['disponible', 'en_tournee', 'maintenance', 'indisponible'])
  status: string;

  @IsArray()
  @IsString({ each: true })
  semiCompatibles: string[];

  @IsArray()
  @IsString({ each: true })
  equipements: string[];

  @IsString()
  @IsOptional()
  localisation?: string;

  @IsString()
  @IsOptional()
  lastPositionUpdate?: string;

  @IsString()
  @IsOptional()
  prochainCt?: string;

  @IsString()
  @IsOptional()
  prochainEntretien?: string;

  @IsUUID()
  @IsOptional()
  titulaireId?: string;

  // Titulaire details (joined from driver_cache)
  @IsOptional()
  titulaire?: {
    id: string;
    nom: string;
  };

  // Maintenance details
  @IsOptional()
  maintenanceDetails?: {
    type: string;
    dateEntree: string;
    etr: string;
  };

  // Vehicle absences from Wincpl
  @IsOptional()
  absences?: VehicleAbsenceDto[];

  // Metadata
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
 * Absence period DTO
 */
export class VehicleAbsenceDto {
  @IsString()
  dateDebut: string;

  @IsString()
  @IsOptional()
  heureDebut?: string;

  @IsString()
  dateFin: string;

  @IsString()
  @IsOptional()
  heureFin?: string;

  @IsString()
  codeMotif: string;

  @IsString()
  @IsOptional()
  numero?: string;

  @IsNumber()
  @IsOptional()
  status?: number;
}

/**
 * DTO for updating manual vehicle fields (not from API)
 */
export class UpdateVehicleManualFieldsDto {
  @IsString()
  @IsIn(['disponible', 'en_tournee', 'maintenance', 'indisponible'])
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  semiCompatibles?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  equipements?: string[];

  @IsString()
  @IsOptional()
  localisation?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  lastPositionUpdate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  prochainCt?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  prochainEntretien?: Date;

  @IsUUID()
  @IsOptional()
  titulaireId?: string;

  @IsString()
  @IsOptional()
  maintenanceType?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  maintenanceDateEntree?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  maintenanceEtr?: Date;
}

/**
 * DTO for vehicle stats summary
 */
export class VehicleStatsDto {
  @IsNumber()
  total: number;

  @IsNumber()
  disponibles: number;

  @IsNumber()
  enTournee: number;

  @IsNumber()
  maintenance: number;

  @IsNumber()
  indisponibles: number;

  @IsString()
  @IsOptional()
  lastSyncAt?: string;
}

/**
 * Query params for listing vehicles
 */
export class ListVehiclesQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  energie?: string;

  @IsString()
  @IsOptional()
  dataSource?: string; // Filter by 'wincpl' or 'myrentcar'

  @IsString()
  @IsOptional()
  categorie?: string; // Filter by categorie_vehicule

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

// Fields from Wincpl / MyRentACar API (not manually entered)
export const VEHICLE_API_FIELDS = [
  'dataSource',
  'myrentcarId',
  'wincplCode',
  'numero',
  'immatriculation',
  'marqueVehicule',
  'marqueModele',
  'categorieVehicule',
  'type',
  'typeCode',
  'enActivite',
  'idSociete',
  'idAgence',
  'numeroSerie',
  'numeroChassis',
  'numeroMoteur',
  'puissanceVehicule',
  'puissanceKw',
  'cylindree',
  'nbCylindres',
  'nbVitesses',
  'codeMoteur',
  'typeTransmission',
  'turboCompresseur',
  'longueurTotale',
  'largeurTotale',
  'hauteurTotale',
  'volumeVehicule',
  'volumeMaxi',
  'poidsVide',
  'poidsCharge',
  'chargeUtile',
  'ptac',
  'ptr',
  'poidsTotalRoulant',
  'nbEssieux',
  'typeCarrosserie',
  'typeCarrosserie2',
  'genreCarrosserie',
  'nbPlacesAssises',
  'nbPortes',
  'palVehicule',
  'energie',
  'energieVehicule',
  'energieId',
  'capaciteReservoir',
  'contenanceReservoir',
  'consoUrbaine',
  'consoExtraUrbaine',
  'consoMixte',
  'normePollution',
  'critair',
  'co2',
  'filtreAParticules',
  'adblue',
  'kilometrage',
  'dateDernierKm',
  'dateMiseCirculation',
  'dateAchat',
  'dateCarteGrise',
  'dateFinGarantieVehicule',
  'dateFinGarantieMoteur',
  'immatriculationPrecedente',
  'codeAssureur',
  'assuranceNumContrat',
  'assuranceDateEcheance',
  'assuranceMontant',
  'assuranceFranchise',
  'codeTypeSemi',
  'porteur',
  'commentaire',
  'primeVolume',
  'agenceProprietaire',
  'categoryCode',
];

// List of manual fields (not from API)
export const VEHICLE_MANUAL_FIELDS = [
  'status',
  'semiCompatibles',
  'equipements',
  'localisation',
  'lastPositionUpdate',
  'prochainCt',
  'prochainEntretien',
  'titulaireId',
  'titulaire',
  'maintenanceDetails',
];

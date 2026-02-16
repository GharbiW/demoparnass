// ============================================
// MyRentACar API Response Types
// ============================================

export interface MyRentACarVehicle {
  ID: number;
  Numero: string;
  Immatriculation: string;
  Immatriculation2: string | null;
  Categorie: string;
  TypeVehicule: string;
  MarqueType: string;
  CapaciteReservoir: number;
  NumeroSerie: string;
}

export interface MyRentACarDetailedVehicle {
  ID: number;
  Numero: string;
  Immat1: string;
  MarqueType: string;
  Carburant: {
    Prix: number;
    ID: number;
    Intitule: string;
  };
  CapaciteReservoir: number;
  TypeVehicule: {
    Code: string;
    ID: number;
    Intitule: string;
  };
  Categorie: {
    Code: string;
    ID: number;
    Intitule: string;
  };
  DernierKm: number;
  DateDernierKm: string;
  DateMiseCirculation: string;
  PoidsVide: string;
  PoidsCharge: string;
  PrimeVolume: number;
  AgenceProprietaire: string;
}

export interface MyRentACarLoginCredentials {
  login: string;
  password: string;
}

// Category code mapping to vehicle/trailer types
export interface CategoryCodeMapping {
  vehicleType?: string;
  trailerType?: string;
  allowedVehicleTypes?: string[];
}

// Category code constants
export const CATEGORY_CODE_MAPPING: Record<string, CategoryCodeMapping> = {
  // Vehicles
  PORGO: { vehicleType: 'CAISSE_MOBILE_GO' },
  PORGZ: { vehicleType: 'CAISSE_MOBILE_GAZ' },
  TRAGO: { vehicleType: 'TRACTOR_GO' },
  TRAGZ: { vehicleType: 'TRACTOR_GAZ' },
  // Trailers
  AERBA: {
    trailerType: 'COVERED_AERIAL',
    allowedVehicleTypes: ['TRACTOR_GO', 'TRACTOR_GAZ'],
  },
  AERCL: {
    trailerType: 'CLASSIC_AERIAL',
    allowedVehicleTypes: ['TRACTOR_GO', 'TRACTOR_GAZ'],
  },
  AERFR: {
    trailerType: 'REFRIGERATED_AERIAL',
    allowedVehicleTypes: ['TRACTOR_GO', 'TRACTOR_GAZ'],
  },
  AERME: {
    trailerType: 'MEGA_AERIAL',
    allowedVehicleTypes: ['TRACTOR_GO', 'TRACTOR_GAZ'],
  },
  REMOR: {
    trailerType: 'TRAILER',
    allowedVehicleTypes: ['CAISSE_MOBILE_GO', 'CAISSE_MOBILE_GAZ'],
  },
  SRCLA: {
    trailerType: 'CLASSIC_SEMI_TRAILER',
    allowedVehicleTypes: ['TRACTOR_GO', 'TRACTOR_GAZ'],
  },
  SRFRI: {
    trailerType: 'REFRIGERATED_SEMI_TRAILER',
    allowedVehicleTypes: ['TRACTOR_GO', 'TRACTOR_GAZ'],
  },
  SRMFR: {
    trailerType: 'MEGA_REFRIGERATED_SEMI_TRAILER',
    allowedVehicleTypes: ['TRACTOR_GO', 'TRACTOR_GAZ'],
  },
};

// Helper to determine if a category is a vehicle or trailer
export function isVehicleCategory(categoryCode: string): boolean {
  const mapping = CATEGORY_CODE_MAPPING[categoryCode];
  return !!mapping?.vehicleType;
}

export function isTrailerCategory(categoryCode: string): boolean {
  const mapping = CATEGORY_CODE_MAPPING[categoryCode];
  return !!mapping?.trailerType;
}

import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
  Matches,
  IsDateString,
} from 'class-validator';

export class CreateRideDto {
  @IsUUID()
  @IsNotEmpty()
  prestationId: string;

  @IsUUID()
  @IsOptional()
  addressId?: string;

  @IsUUID()
  @IsOptional()
  addressDepart?: string; // Loading address

  @IsUUID()
  @IsOptional()
  addressArrivee?: string; // Delivery address

  // Editable client reference - if empty, internal reference is used
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceClient?: string;

  // Position in the prestation itinerary (0-indexed)
  @IsNumber()
  @IsOptional()
  @Min(0)
  orderIndex?: number;

  // Legacy time fields (kept for backwards compatibility)
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

  // MCom-0011: 4 mandatory timestamps for ride tracking
  // 1. Présence chargement (mise à quai)
  @IsDateString()
  @IsOptional()
  presenceChargement?: string;

  // 2. Départ chargement
  @IsDateString()
  @IsOptional()
  departChargement?: string;

  // 3. Arrivée livraison
  @IsDateString()
  @IsOptional()
  arriveeLivraison?: string;

  // 4. Fin de livraison
  @IsDateString()
  @IsOptional()
  finLivraison?: string;

  // Truck loaded/empty indicator
  @IsBoolean()
  @IsOptional()
  vide?: boolean;

  // Comment/Note field
  @IsString()
  @IsOptional()
  comment?: string;
}

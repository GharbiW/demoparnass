import { Trip } from "../types";

export type UnassignedRideReason = 
  | 'new_regular' 
  | 'new_client' 
  | 'sup' 
  | 'driver_absent' 
  | 'vehicle_unavailable' 
  | 'modification' 
  | 'tour_broken' 
  | 'combined_no_resource';

export type UnassignedRide = {
  id: string;
  ref: string;
  client: string;
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  slot: string; // HH:mm - HH:mm
  type: 'regular' | 'sup';
  reason: UnassignedRideReason;
  isSensitive: boolean;
  requiresSpecificHardware: boolean;
  missingResources: 'driver' | 'vehicle' | 'both' | 'none';
  originalTripId?: string; // If linked to an existing trip modification
};

export const mockUnassignedRides: UnassignedRide[] = [
  {
    id: "UR-001",
    ref: "PRE-2023-001",
    client: "Carrefour",
    origin: "Entrepôt A",
    destination: "Magasin Lyon Part-Dieu",
    date: "2026-02-12",
    slot: "06:00 - 08:00",
    type: "regular",
    reason: "driver_absent",
    isSensitive: true,
    requiresSpecificHardware: true,
    missingResources: "driver",
    originalTripId: "TRIP-123"
  },
  {
    id: "UR-002",
    ref: "PRE-2023-002",
    client: "Amazon",
    origin: "Platforme Nord",
    destination: "Hub Sud",
    date: "2026-02-12",
    slot: "14:00 - 18:00",
    type: "sup",
    reason: "sup",
    isSensitive: false,
    requiresSpecificHardware: false,
    missingResources: "both"
  },
  {
    id: "UR-003",
    ref: "PRE-2023-003",
    client: "IKEA",
    origin: "Dépôt St Priest",
    destination: "Toulouse",
    date: "2026-02-13",
    slot: "08:00 - 18:00",
    type: "regular",
    reason: "vehicle_unavailable",
    isSensitive: false,
    requiresSpecificHardware: true,
    missingResources: "vehicle"
  },
  {
    id: "UR-004",
    ref: "PRE-2023-004",
    client: "Nouveau Client SA",
    origin: "Paris",
    destination: "Lille",
    date: "2026-02-14",
    slot: "09:00 - 12:00",
    type: "regular",
    reason: "new_client",
    isSensitive: true,
    requiresSpecificHardware: false,
    missingResources: "both"
  },
   {
    id: "UR-005",
    ref: "PRE-2023-005",
    client: "Lidl",
    origin: "Base logistique",
    destination: "Supermarché Croix-Rousse",
    date: "2026-02-12",
    slot: "04:00 - 06:00",
    type: "regular",
    reason: "tour_broken",
    isSensitive: true,
    requiresSpecificHardware: true,
    missingResources: "driver"
  },
  {
    id: "UR-006",
    ref: "PRE-2023-006",
    client: "Decathlon",
    origin: "Entrepôt Bron",
    destination: "Magasin Confluence",
    date: "2026-02-15",
    slot: "10:00 - 11:00",
    type: "sup",
    reason: "sup",
    isSensitive: false,
    requiresSpecificHardware: false,
    missingResources: "both"
  },
  {
    id: "UR-007",
    ref: "PRE-2023-007",
    client: "Castorama",
    origin: "Dépôt Dardilly",
    destination: "Grenoble",
    date: "2026-02-16",
    slot: "07:00 - 12:00",
    type: "regular",
    reason: "modification",
    isSensitive: false,
    requiresSpecificHardware: true,
    missingResources: "driver"
  }
];

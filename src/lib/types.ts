

import type { LucideIcon } from "lucide-react";

export type KpiCardProps = {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: LucideIcon;
  description: string;
};

export type ChartData = {
  name: string;
  [key: string]: number | string;
};

export type Vehicle = {
  immatriculation: string;
  vin: string;
  site: string;
  status: 'Disponible' | 'En mission' | 'En maintenance' | 'En panne';
};

export type Driver = {
    id: string;
    name: string;
    site: string;
    status: 'Actif' | 'En repos' | 'En congé';
    // Added for expanded demo data
    phone?: string;
    truck?: string;
    scoreSecurite?: number;
    scoreEco?: number;
    driverType?: 'CM' | 'Polyvalent' | 'SPL' | 'VL';
};

export type Trip = {
    id: string;
    client: string;
    vin: string;
    driverId: string;
    driver2Id?: string;
    relayPoint?: string;
    pickupLocation: string;
    deliveryLocation: string;
    plannedStart: string; // ISO 8601
    plannedEnd: string; // ISO 8601
    actualStart?: string;
    actualEnd?: string;
    status: 'planned' | 'in_progress' | 'completed' | 'conflict';
    type: 'ligne' | 'express' | 'haut_le_pied';
    eta?: string;
    slaStatus?: 'on_time' | 'at_risk' | 'late';
    riskEta?: number;
    isColdChain?: boolean;
    isAdr?: boolean;
    coldChainSetpoint?: number;
    site?: string;
    hosRemainingMin?: number;
};

export type LeaveRequest = {
  id: string;
  driverId: string;
  driverName: string;
  driverType: 'CM' | 'Polyvalent' | 'SPL' | 'VL';
  site: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'En attente' | 'Approuvé' | 'Rejeté';
};

export type Contract = {
  id: string;
  client: string;
  originSite: string;
  destinationSite: string;
  daysOfWeek: string[]; // e.g., ['Lu', 'Ma', 'Me', 'Je', 'Ve']
  departureTime: string; // HH:mm
  arrivalTime: string; // HH:mm
  vehicleType: 'Semi-remorque' | 'Caisse mobile' | 'Frigo' | 'ADR';
  driverSkills: ('ADR' | 'Aéroportuaire' | 'Habilitation sûreté')[];
  contractStart: string; // YYYY-MM-DD
  contractEnd: string; // YYYY-MM-DD
  isSuspended: boolean;
  suspensionPeriods?: { start: string; end: string }[];
};

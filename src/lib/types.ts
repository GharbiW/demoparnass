

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
  marque?: string;
  modele?: string;
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

// Types for "A Placer" (Unassigned Courses) module
// Ride = template récurrent, Course = instance datée d'un Ride
export type Ride = {
  id: string;
  prestationId: string;
  sequence: number; // Order in the prestation (1, 2, 3...)
  startLocation: string;
  endLocation: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  estimatedDuration?: number; // minutes
};

export type Course = {
  id: string; // Reference Course
  rideId: string; // Reference to the Ride template
  prestationId: string; // Reference Prestation
  date: string; // YYYY-MM-DD - the day this course must be done
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  // Multi-destination support: a course can have multiple destinations
  startLocation: string;
  endLocation: string;
  intermediateLocations?: string[]; // For multi-destination: [A, B, C, D]
  // Assignment status - Standardized vocabulary
  assignmentStatus: 'non_affectee' | 'partiellement_affectee' | 'affectee';
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedVehicleId?: string;
  assignedVehicleImmat?: string;
  tourneeId?: string; // If assigned to a tournée
  tourneeNumber?: string; // Tournée number for display
  // Dual-driver (12h tour) support
  isDualDriver?: boolean; // true if this course is part of a 12h dual-driver tour
  driverSlot?: 'A' | 'B'; // Which driver slot this course belongs to
  // Constraints
  isSensitive: boolean;
  requiredVehicleType: 'Semi-remorque' | 'Caisse mobile' | 'Frigo' | 'ADR' | 'SPL' | 'VL';
  requiredVehicleEnergy?: 'Diesel' | 'Gaz' | 'Électrique';
  requiredVehicleEquipment?: string[]; // e.g., ['Remorque frigorifique', 'ADR']
  requiredDriverType?: 'CM' | 'Polyvalent' | 'SPL' | 'VL';
  requiredDriverSkills: ('ADR' | 'Aéroportuaire' | 'Habilitation sûreté')[];
  // Reason for non-placement
  nonPlacementReason: NonPlacementReason;
  missingResource?: 'vehicle' | 'driver' | 'both';
  constraintWarnings?: string[];
  blockReason?: string;
  // Planning-specific fields
  client?: string; // Client name (denormalized for display)
  prestationType?: 'régulière' | 'sup' | 'spot';
  // Temporary modifications (Conception only)
  temporaryModifications?: {
    address?: string;
    dates?: { start: string; end: string };
    times?: { start: string; end: string };
    validFrom?: string; // YYYY-MM-DD
    validTo?: string; // YYYY-MM-DD
    modifiedBy?: string;
    modifiedAt?: string;
  };
  // Temporary cancellation
  cancellation?: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
    reason: 'demande_client' | 'operationnel_parnass' | 'empechement_exterieur';
    delay?: '1j_avant' | 'plus_1j_avant' | 'annulation_sur_place';
    comment: string;
    cancelledBy?: string;
    cancelledAt?: string;
  };
  // Loading code (1 per day per Course)
  loadingCode?: string;
  // Comments
  comments?: Array<{
    id: string;
    text: string;
    author: string;
    timestamp: string;
  }>;
  // Subcontractor
  subcontractorId?: string;
  subcontractorName?: string;
  // Extended fields used by course-card and trajet-visualizer
  type?: string;
  codeArticle?: string;
  requiredDate?: string;
  requiredStartTime?: string;
  deadline?: string;
  segments?: Array<{
    id: string;
    sequence: number;
    startLocation: string;
    endLocation: string;
    startTime: string;
    endTime: string;
    estimatedDuration?: number;
    assignedDriverId?: string;
    assignedVehicleId?: string;
  }>;
  assignedSegments?: number;
};

export type TrajetSegment = {
  id: string;
  sequence: number;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string;
  estimatedDuration?: number;
  assignedDriverId?: string;
  assignedVehicleId?: string;
};

export type NonPlacementReason = 
  | 'nouvelle_prestation_reguliere'
  | 'premiere_presta_nouveau_client'
  | 'sup_client_existant'
  | 'conducteur_absent'
  | 'materiel_indisponible'
  | 'prestation_modifiee'
  | 'tournee_cassee'
  | 'tournee_modifiee'
  | 'rides_combines_sans_affectation';

export type Prestation = {
  id: string; // Reference Prestation (e.g., PRE-2023-001)
  client: string;
  codeArticle?: string;
  type: 'régulière' | 'sup' | 'spot';
  courses: Course[]; // All courses (rides) for this prestation
  // Resource requirements (from first course, or aggregated)
  requiredVehicleType: 'Semi-remorque' | 'Caisse mobile' | 'Frigo' | 'ADR' | 'SPL' | 'VL';
  requiredVehicleEnergy?: 'Diesel' | 'Gaz' | 'Électrique';
  requiredVehicleEquipment?: string[];
  requiredDriverType?: 'CM' | 'Polyvalent' | 'SPL' | 'VL';
  requiredDriverSkills: ('ADR' | 'Aéroportuaire' | 'Habilitation sûreté')[];
  // Metadata
  contractId?: string;
  priority: number; // Higher = more urgent
  hasSensitiveCourses: boolean;
  // Week indicator
  week: 'S+1' | 'S+2' | 'S+3' | 'S+4+';
};

// Legacy type for backward compatibility
export type UnassignedCourse = Course;

export type WeeklyAssignmentCount = {
  chauffeurId: string;
  trajetId: string; // Normalized trajet identifier (e.g., "Lyon->Paris->Marseille")
  week: string; // YYYY-WW format
  count: number;
};

export type AssignmentConstraintResult = {
  allowed: boolean;
  currentCount: number;
  maxCount: number;
  warning: boolean;
  message?: string;
};

export type ResourceCompatibility = {
  vehicleCompatible: boolean;
  driverCompatible: boolean;
  vehicleIssues: string[];
  driverIssues: string[];
  overallCompatible: boolean;
};

// ─── Planning Module Types ─────────────────────────────────────────────────

export type Tournee = {
  id: string;
  number: string; // e.g., "T-001"
  tourneeCode: string; // Unique code e.g., "T-LGN-001"
  vehicleId?: string; // Optional - can create tournée without vehicle
  vehicleImmat?: string;
  vehicleType?: string;
  vehicleEnergy?: string;
  driverId?: string; // Optional - can create tournée without driver
  driverName?: string;
  driverType?: string;
  // Dual-driver (12h tour) support
  isDualDriver?: boolean; // true if this is a 12h tour with 2 drivers
  driver2Id?: string; // Second driver ID
  driver2Name?: string; // Second driver name
  driver2Type?: string; // Second driver type
  // Repetition tracking
  daysOfWeek?: string[]; // e.g., ['Lu', 'Ma', 'Me', 'Je', 'Ve']
  courses: Course[];
  date: string; // YYYY-MM-DD
  status: 'draft' | 'published' | 'in_progress' | 'completed';
  servicePickup?: {
    location: string;
    time: string; // HH:mm
    kmFromBase: number;
  };
  // Second service pickup for dual-driver tournées (driver B starts from a different location)
  servicePickup2?: {
    location: string;
    time: string; // HH:mm
    kmFromBase: number;
  };
};

export type PlanningHealthMetrics = {
  absentDrivers: { type: string; count: number; impactedCourses: number }[];
  unavailableVehicles: { count: number; impactedCourses: number };
  coursesPlaced: number;
  coursesTotal: number;
  coursesSupToPlace: number;
  coursesRegToPlace: number;
  sensitivesToPlace: number;
  modifications: { annulations: number; changements: number };
  prestationsExpiring4Weeks: number;
  alertsByLevel: { critical: number; warning: number; info: number };
  driversOutOfAmplitude: { above: number; below: number };
};

export type PlanningVersion = {
  id: string;
  version: string; // e.g., "v1", "v2"
  status: 'draft' | 'published';
  createdAt: string;
  createdBy: string;
  publishedAt?: string;
  publishedBy?: string;
  tournees: Tournee[];
};

export type CancellationReason = 'demande_client' | 'operationnel_parnass' | 'empechement_exterieur';

export type CancellationDelay = '1j_avant' | 'plus_1j_avant' | 'annulation_sur_place';

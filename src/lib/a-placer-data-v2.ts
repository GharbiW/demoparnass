
import { Prestation, Course, NonPlacementReason, WeeklyAssignmentCount } from './types';
import { addDays, format, startOfWeek, getDay } from 'date-fns';
import { getWeekKey } from './assignment-constraints';

const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const clients = [
  'CARREFOUR', 'LECLERC', 'INTERMARCHE', 'SYSTEME U', 'AMAZON', 'DASSAULT', 
  'MICHELIN', 'NESTLE', 'SANOFI', 'LACTALIS', 'DANONE', 'AIRBUS', 
  'LVMH', 'PROCTER & GAMBLE', 'SAFRAN', 'SODEXO', "L'OREAL", 'TOTALENERGIES',
  'GEODIS', 'SCHNEIDER ELECTRIC'
];

const locations = {
  "Lyon": ["Entrepôt Vénissieux", "Plateforme Lyon Nord", "Port de Lyon", "Hub Lyon Sud"],
  "Paris": ["Entrepôt St-Quentin", "Plateforme Paris Sud", "CDG Hub", "Orly Hub"],
  "Marseille": ["Port de Marseille", "Entrepôt Avignon", "Plateforme Miramas", "Hub Marseille Est"],
  "Nantes": ["Entrepôt Nantes", "Plateforme Rennes", "Port de St-Nazaire"],
  "Lille": ["Entrepôt Lesquin", "Plateforme Dourges", "Port de Dunkerque"],
  "Bordeaux": ["Site de Mérignac", "Aéroport de Blagnac", "Port de Bordeaux"],
  "Strasbourg": ["Port de Strasbourg", "Entrepôt Reichstett"],
  "Toulouse": ["Plateforme logistique Eurocentre", "Aéroport de Blagnac"],
  "Nice": ["Aéroport Nice Côte d'Azur", "Marché d'Intérêt National"],
  "Rennes": ["Plateforme Logistique Rennes"],
  "Montpellier": ["Garosud", "Port de Sète"],
};

const sites = Object.keys(locations);

function getLocationFromSite(site: string): string {
  const siteLocations = locations[site as keyof typeof locations] || [];
  return sample(siteLocations);
}

function getWeekIndicator(date: Date): 'S+1' | 'S+2' | 'S+3' | 'S+4+' {
  const now = new Date();
  const weekDiff = Math.floor((date.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
  if (weekDiff <= 1) return 'S+1';
  if (weekDiff <= 2) return 'S+2';
  if (weekDiff <= 3) return 'S+3';
  return 'S+4+';
}

const DAY_MAP_REVERSE: Record<number, string> = { 1: "Lu", 2: "Ma", 3: "Me", 4: "Je", 5: "Ve", 6: "Sa", 0: "Di" };

const now = new Date();
const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
// Get the start of next week (Monday)
const nextMonday = addDays(baseDate, ((8 - baseDate.getDay()) % 7) || 7);

// Helper: get dates for specific days of week in next week
function getDatesForDays(daysOfWeek: number[], weekOffset: number = 0): Date[] {
  const monday = addDays(nextMonday, weekOffset * 7);
  return daysOfWeek.map(day => {
    const diff = ((day - 1 + 7) % 7); // Monday = 0 offset
    return addDays(monday, diff);
  });
}

// ─── Generate Prestations ────────────────────────────────────────────────────

const prestations: Prestation[] = [];

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 1: Repetitive Lu-Ma-Me-Je-Ve (5 days, same route) - CARREFOUR
// Scenario: New regular prestation, needs both vehicle and driver
// ═══════════════════════════════════════════════════════════════════════════════
{
  const startLoc = "Entrepôt Vénissieux";
  const endLoc = "Plateforme Paris Sud";
  const days = [1, 2, 3, 4, 5]; // Mon-Fri
  const dates = getDatesForDays(days);
  const courses: Course[] = dates.map((date, idx) => ({
    id: `CRS-001-${idx + 1}`,
    rideId: 'RIDE-001',
    prestationId: 'PRE-2024-001',
    date: format(date, 'yyyy-MM-dd'),
    startTime: '04:30',
    endTime: '07:00',
    startLocation: startLoc,
    endLocation: endLoc,
    assignmentStatus: idx < 2 ? 'affectee' as const : idx === 2 ? 'partiellement_affectee' as const : 'non_affectee' as const,
    assignedDriverId: idx < 2 ? 'DRV-ANA-001' : undefined,
    assignedDriverName: idx < 2 ? 'Anatole M.' : undefined,
    assignedVehicleId: idx < 2 ? 'VH-GL-123' : undefined,
    assignedVehicleImmat: idx < 2 ? 'GL-123-AB' : undefined,
    tourneeId: 'TRN-CM54',
    tourneeNumber: 'CM-54',
    isSensitive: false,
    requiredVehicleType: 'Caisse mobile' as const,
    requiredVehicleEnergy: 'Diesel' as const,
    requiredDriverType: 'CM' as const,
    requiredDriverSkills: [],
    nonPlacementReason: 'conducteur_absent' as NonPlacementReason,
    missingResource: idx >= 2 ? 'driver' as const : undefined,
  }));

  prestations.push({
    id: 'PRE-2024-001',
    client: 'CARREFOUR',
    codeArticle: 'ART-CF-001',
    type: 'régulière',
    courses,
    requiredVehicleType: 'Caisse mobile',
    requiredVehicleEnergy: 'Diesel',
    requiredDriverType: 'CM',
    requiredDriverSkills: [],
    priority: 10,
    hasSensitiveCourses: false,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 2: Repetitive Ma-Ve (2 days) - SANOFI - Sensitive ADR SUP
// 4 courses per day × 2 days = 8 courses total
// ═══════════════════════════════════════════════════════════════════════════════
{
  const startLoc = "CDG Hub";
  const endLoc = "Port de Marseille";
  const intermediateLoc1 = "Entrepôt Avignon";
  const intermediateLoc2 = "Entrepôt Avignon";
  const days = [2, 5]; // Tue, Fri
  const dates = getDatesForDays(days);
  const courses: Course[] = [];
  dates.forEach((date, dayIdx) => {
    // 4 courses per day (A→B, B→C, C→B, B→D)
    courses.push({
      id: `CRS-002-${dayIdx * 4 + 1}`,
      rideId: 'RIDE-002-A',
      prestationId: 'PRE-2024-002',
      date: format(date, 'yyyy-MM-dd'),
      startTime: '06:00',
      endTime: '09:00',
      startLocation: startLoc,
      endLocation: intermediateLoc1,
      assignmentStatus: 'non_affectee',
      isSensitive: true,
      requiredVehicleType: 'ADR',
      requiredVehicleEnergy: 'Diesel',
      requiredDriverType: 'CM',
      requiredDriverSkills: ['ADR'],
      nonPlacementReason: 'sup_client_existant',
      missingResource: 'driver',
    });
    courses.push({
      id: `CRS-002-${dayIdx * 4 + 2}`,
      rideId: 'RIDE-002-B',
      prestationId: 'PRE-2024-002',
      date: format(date, 'yyyy-MM-dd'),
      startTime: '09:30',
      endTime: '12:00',
      startLocation: intermediateLoc1,
      endLocation: endLoc,
      assignmentStatus: 'non_affectee',
      isSensitive: true,
      requiredVehicleType: 'ADR',
      requiredVehicleEnergy: 'Diesel',
      requiredDriverType: 'CM',
      requiredDriverSkills: ['ADR'],
      nonPlacementReason: 'sup_client_existant',
      missingResource: 'driver',
    });
    courses.push({
      id: `CRS-002-${dayIdx * 4 + 3}`,
      rideId: 'RIDE-002-C',
      prestationId: 'PRE-2024-002',
      date: format(date, 'yyyy-MM-dd'),
      startTime: '13:00',
      endTime: '16:00',
      startLocation: startLoc,
      endLocation: intermediateLoc2,
      assignmentStatus: 'non_affectee',
      isSensitive: true,
      requiredVehicleType: 'ADR',
      requiredVehicleEnergy: 'Diesel',
      requiredDriverType: 'CM',
      requiredDriverSkills: ['ADR'],
      nonPlacementReason: 'sup_client_existant',
      missingResource: 'driver',
    });
    courses.push({
      id: `CRS-002-${dayIdx * 4 + 4}`,
      rideId: 'RIDE-002-D',
      prestationId: 'PRE-2024-002',
      date: format(date, 'yyyy-MM-dd'),
      startTime: '16:30',
      endTime: '19:00',
      startLocation: intermediateLoc2,
      endLocation: endLoc,
      assignmentStatus: 'non_affectee',
      isSensitive: true,
      requiredVehicleType: 'ADR',
      requiredVehicleEnergy: 'Diesel',
      requiredDriverType: 'CM',
      requiredDriverSkills: ['ADR'],
      nonPlacementReason: 'sup_client_existant',
      missingResource: 'driver',
    });
  });

  prestations.push({
    id: 'PRE-2024-002',
    client: 'SANOFI',
    codeArticle: 'ART-SF-002',
    type: 'sup',
    courses,
    requiredVehicleType: 'ADR',
    requiredVehicleEnergy: 'Diesel',
    requiredDriverType: 'CM',
    requiredDriverSkills: ['ADR'],
    priority: 9,
    hasSensitiveCourses: true,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 3: Repetitive Lu-Ma-Me-Ve (4 days) - LECLERC - Driver absent
// ═══════════════════════════════════════════════════════════════════════════════
{
  const startLoc = "Port de Marseille";
  const endLoc = "Site de Mérignac";
  const days = [1, 2, 3, 5]; // Mon, Tue, Wed, Fri
  const dates = getDatesForDays(days);
  const courses: Course[] = dates.map((date, idx) => ({
    id: `CRS-003-${idx + 1}`,
    rideId: 'RIDE-003',
    prestationId: 'PRE-2024-003',
    date: format(date, 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '14:00',
    startLocation: startLoc,
    endLocation: endLoc,
    assignmentStatus: 'non_affectee' as const,
    isSensitive: false,
    requiredVehicleType: 'Caisse mobile' as const,
    requiredDriverType: 'CM' as const,
    requiredDriverSkills: [],
    nonPlacementReason: 'conducteur_absent' as NonPlacementReason,
    missingResource: 'driver' as const,
    tourneeId: 'TRN-CM32',
    tourneeNumber: 'CM-32',
  }));

  prestations.push({
    id: 'PRE-2024-003',
    client: 'LECLERC',
    codeArticle: 'ART-LC-003',
    type: 'régulière',
    courses,
    requiredVehicleType: 'Caisse mobile',
    requiredDriverType: 'CM',
    requiredDriverSkills: [],
    priority: 8,
    hasSensitiveCourses: false,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 4: Single day - MICHELIN - Material unavailable
// ═══════════════════════════════════════════════════════════════════════════════
{
  const startLoc = "Entrepôt Lesquin";
  const endLoc = "Entrepôt St-Quentin";
  const date = getDatesForDays([3])[0]; // Wed
  prestations.push({
    id: 'PRE-2024-004',
    client: 'MICHELIN',
    codeArticle: 'ART-MC-004',
    type: 'régulière',
    courses: [{
      id: 'CRS-004-1',
      rideId: 'RIDE-004',
      prestationId: 'PRE-2024-004',
      date: format(date, 'yyyy-MM-dd'),
      startTime: '07:00',
      endTime: '11:00',
      startLocation: startLoc,
      endLocation: endLoc,
      assignmentStatus: 'non_affectee',
      isSensitive: false,
      requiredVehicleType: 'Frigo',
      requiredVehicleEnergy: 'Diesel',
      requiredVehicleEquipment: ['Remorque frigorifique'],
      requiredDriverType: 'CM',
      requiredDriverSkills: [],
      nonPlacementReason: 'materiel_indisponible',
      missingResource: 'vehicle',
    }],
    requiredVehicleType: 'Frigo',
    requiredVehicleEnergy: 'Diesel',
    requiredVehicleEquipment: ['Remorque frigorifique'],
    requiredDriverType: 'CM',
    requiredDriverSkills: [],
    priority: 7,
    hasSensitiveCourses: false,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 5: Multi-destination A->B->C->D->E - AIRBUS - New client, sensitive
// ═══════════════════════════════════════════════════════════════════════════════
{
  const locs = ["Entrepôt St-Quentin", "Plateforme Lyon Nord", "Plateforme Miramas", "Aéroport Nice Côte d'Azur", "Plateforme logistique Eurocentre"];
  const days = [1, 3, 5]; // Mon, Wed, Fri
  const dates = getDatesForDays(days);
  const courses: Course[] = dates.map((date, idx) => ({
    id: `CRS-005-${idx + 1}`,
    rideId: 'RIDE-005',
    prestationId: 'PRE-2024-005',
    date: format(date, 'yyyy-MM-dd'),
    startTime: '05:00',
    endTime: '08:00',
    startLocation: locs[0],
    endLocation: locs[locs.length - 1],
    intermediateLocations: locs.slice(1, -1),
    assignmentStatus: 'non_affectee' as const,
    isSensitive: true,
    requiredVehicleType: 'Semi-remorque' as const,
    requiredDriverType: 'Polyvalent' as const,
    requiredDriverSkills: ['ADR', 'Aéroportuaire'] as ('ADR' | 'Aéroportuaire')[],
    nonPlacementReason: 'premiere_presta_nouveau_client' as NonPlacementReason,
    missingResource: 'both' as const,
  }));

  prestations.push({
    id: 'PRE-2024-005',
    client: 'AIRBUS',
    codeArticle: 'ART-AB-005',
    type: 'régulière',
    courses,
    requiredVehicleType: 'Semi-remorque',
    requiredDriverType: 'Polyvalent',
    requiredDriverSkills: ['ADR', 'Aéroportuaire'],
    priority: 9,
    hasSensitiveCourses: true,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 6: Rides combined without assignment - AMAZON - Lu-Ma-Me-Je-Ve-Sa
// ═══════════════════════════════════════════════════════════════════════════════
{
  const startLoc = "Orly Hub";
  const endLoc = "Entrepôt Nantes";
  const days = [1, 2, 3, 4, 5, 6]; // Mon-Sat
  const dates = getDatesForDays(days);
  const courses: Course[] = dates.map((date, idx) => ({
    id: `CRS-006-${idx + 1}`,
    rideId: 'RIDE-006',
    prestationId: 'PRE-2024-006',
    date: format(date, 'yyyy-MM-dd'),
    startTime: '14:00',
    endTime: '18:30',
    startLocation: startLoc,
    endLocation: endLoc,
    assignmentStatus: 'non_affectee' as const,
    isSensitive: false,
    requiredVehicleType: 'SPL' as const,
    requiredDriverType: 'SPL' as const,
    requiredDriverSkills: [],
    nonPlacementReason: 'rides_combines_sans_affectation' as NonPlacementReason,
    missingResource: 'both' as const,
    tourneeId: 'TRN-SPL12',
    tourneeNumber: 'SPL-12',
  }));

  prestations.push({
    id: 'PRE-2024-006',
    client: 'AMAZON',
    codeArticle: 'ART-AM-006',
    type: 'régulière',
    courses,
    requiredVehicleType: 'SPL',
    requiredDriverType: 'SPL',
    requiredDriverSkills: [],
    priority: 7,
    hasSensitiveCourses: false,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 7: Tournée broken - DANONE - Lu-Me-Ve
// ═══════════════════════════════════════════════════════════════════════════════
{
  const startLoc = "Entrepôt Reichstett";
  const endLoc = "Plateforme Dourges";
  const days = [1, 3, 5];
  const dates = getDatesForDays(days);
  const courses: Course[] = dates.map((date, idx) => ({
    id: `CRS-007-${idx + 1}`,
    rideId: 'RIDE-007',
    prestationId: 'PRE-2024-007',
    date: format(date, 'yyyy-MM-dd'),
    startTime: '03:00',
    endTime: '06:30',
    startLocation: startLoc,
    endLocation: endLoc,
    assignmentStatus: idx === 0 ? 'affectee' as const : 'non_affectee' as const,
    assignedDriverId: idx === 0 ? 'DRV-HMZ-003' : undefined,
    assignedDriverName: idx === 0 ? 'Hamza T.' : undefined,
    assignedVehicleId: idx === 0 ? 'VH-TR-456' : undefined,
    assignedVehicleImmat: idx === 0 ? 'TR-456-CD' : undefined,
    isSensitive: false,
    requiredVehicleType: 'Semi-remorque' as const,
    requiredDriverType: 'Polyvalent' as const,
    requiredDriverSkills: [],
    nonPlacementReason: 'tournee_cassee' as NonPlacementReason,
    missingResource: idx > 0 ? 'both' as const : undefined,
  }));

  prestations.push({
    id: 'PRE-2024-007',
    client: 'DANONE',
    codeArticle: 'ART-DN-007',
    type: 'régulière',
    courses,
    requiredVehicleType: 'Semi-remorque',
    requiredDriverType: 'Polyvalent',
    requiredDriverSkills: [],
    priority: 8,
    hasSensitiveCourses: false,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 8: Prestation modified - LVMH - Sensitive - Ma-Je
// ═══════════════════════════════════════════════════════════════════════════════
{
  const startLoc = "CDG Hub";
  const endLoc = "Aéroport de Blagnac";
  const days = [2, 4]; // Tue, Thu
  const dates = getDatesForDays(days);
  const courses: Course[] = dates.map((date, idx) => ({
    id: `CRS-008-${idx + 1}`,
    rideId: 'RIDE-008',
    prestationId: 'PRE-2024-008',
    date: format(date, 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '14:30',
    startLocation: startLoc,
    endLocation: endLoc,
    assignmentStatus: 'non_affectee' as const,
    isSensitive: true,
    requiredVehicleType: 'Semi-remorque' as const,
    requiredDriverType: 'CM' as const,
    requiredDriverSkills: ['Aéroportuaire', 'Habilitation sûreté'] as ('Aéroportuaire' | 'Habilitation sûreté')[],
    nonPlacementReason: 'prestation_modifiee' as NonPlacementReason,
    missingResource: 'both' as const,
  }));

  prestations.push({
    id: 'PRE-2024-008',
    client: 'LVMH',
    codeArticle: 'ART-LV-008',
    type: 'régulière',
    courses,
    requiredVehicleType: 'Semi-remorque',
    requiredDriverType: 'CM',
    requiredDriverSkills: ['Aéroportuaire', 'Habilitation sûreté'],
    priority: 9,
    hasSensitiveCourses: true,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 9: New regular prestation - NESTLE - Lu-Ma-Me-Je-Ve
// ═══════════════════════════════════════════════════════════════════════════════
{
  const startLoc = "Plateforme Lyon Nord";
  const endLoc = "Plateforme Rennes";
  const days = [1, 2, 3, 4, 5];
  const dates = getDatesForDays(days);
  const courses: Course[] = dates.map((date, idx) => ({
    id: `CRS-009-${idx + 1}`,
    rideId: 'RIDE-009',
    prestationId: 'PRE-2024-009',
    date: format(date, 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '13:00',
    startLocation: startLoc,
    endLocation: endLoc,
    assignmentStatus: 'non_affectee' as const,
    isSensitive: false,
    requiredVehicleType: 'Caisse mobile' as const,
    requiredVehicleEnergy: 'Gaz' as const,
    requiredDriverType: 'CM' as const,
    requiredDriverSkills: [],
    nonPlacementReason: 'nouvelle_prestation_reguliere' as NonPlacementReason,
    missingResource: 'both' as const,
  }));

  prestations.push({
    id: 'PRE-2024-009',
    client: 'NESTLE',
    codeArticle: 'ART-NS-009',
    type: 'régulière',
    courses,
    requiredVehicleType: 'Caisse mobile',
    requiredVehicleEnergy: 'Gaz',
    requiredDriverType: 'CM',
    requiredDriverSkills: [],
    priority: 6,
    hasSensitiveCourses: false,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 10: SUP - PROCTER & GAMBLE - Single day
// ═══════════════════════════════════════════════════════════════════════════════
{
  const date = getDatesForDays([4])[0]; // Thu
  prestations.push({
    id: 'PRE-2024-010',
    client: 'PROCTER & GAMBLE',
    codeArticle: 'ART-PG-010',
    type: 'sup',
    courses: [{
      id: 'CRS-010-1',
      rideId: 'RIDE-010',
      prestationId: 'PRE-2024-010',
      date: format(date, 'yyyy-MM-dd'),
      startTime: '11:00',
      endTime: '16:00',
      startLocation: "Port de Bordeaux",
      endLocation: "Entrepôt Vénissieux",
      assignmentStatus: 'non_affectee',
      isSensitive: false,
      requiredVehicleType: 'VL',
      requiredDriverType: 'VL',
      requiredDriverSkills: [],
      nonPlacementReason: 'sup_client_existant',
      missingResource: 'vehicle',
    }],
    requiredVehicleType: 'VL',
    requiredDriverType: 'VL',
    requiredDriverSkills: [],
    priority: 5,
    hasSensitiveCourses: false,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION 11: Tournée modified - LACTALIS - Lu-Ma-Me
// ═══════════════════════════════════════════════════════════════════════════════
{
  const startLoc = "Entrepôt Nantes";
  const endLoc = "Plateforme Paris Sud";
  const days = [1, 2, 3];
  const dates = getDatesForDays(days);
  const courses: Course[] = dates.map((date, idx) => ({
    id: `CRS-011-${idx + 1}`,
    rideId: 'RIDE-011',
    prestationId: 'PRE-2024-011',
    date: format(date, 'yyyy-MM-dd'),
    startTime: '22:00',
    endTime: '03:00',
    startLocation: startLoc,
    endLocation: endLoc,
    assignmentStatus: 'non_affectee' as const,
    isSensitive: false,
    requiredVehicleType: 'Semi-remorque' as const,
    requiredDriverType: 'CM' as const,
    requiredDriverSkills: [],
    nonPlacementReason: 'tournee_modifiee' as NonPlacementReason,
    missingResource: 'driver' as const,
    tourneeId: 'TRN-SR07',
    tourneeNumber: 'SR-07',
  }));

  prestations.push({
    id: 'PRE-2024-011',
    client: 'LACTALIS',
    codeArticle: 'ART-LA-011',
    type: 'régulière',
    courses,
    requiredVehicleType: 'Semi-remorque',
    requiredDriverType: 'CM',
    requiredDriverSkills: [],
    priority: 7,
    hasSensitiveCourses: false,
    week: 'S+1',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Add S+2 and S+3 prestations (mixed)
// ═══════════════════════════════════════════════════════════════════════════════
const reasons: NonPlacementReason[] = [
  'nouvelle_prestation_reguliere', 'sup_client_existant', 'conducteur_absent',
  'materiel_indisponible', 'prestation_modifiee', 'tournee_cassee',
  'tournee_modifiee', 'rides_combines_sans_affectation',
];

const vehicleTypes: Prestation['requiredVehicleType'][] = [
  'Semi-remorque', 'Caisse mobile', 'Frigo', 'ADR', 'SPL', 'VL'
];

for (let i = 12; i <= 25; i++) {
  const startSite = sample(sites);
  const endSite = sample(sites.filter(s => s !== startSite));
  const startLoc = getLocationFromSite(startSite);
  const endLoc = getLocationFromSite(endSite);
  const weekOffset = i <= 18 ? 1 : 2; // S+2 or S+3
  const vehicleType = sample(vehicleTypes);
  const types: ('régulière' | 'sup' | 'spot')[] = ['régulière', 'sup', 'spot'];
  const type = sample(types);
  const isSensitive = i % 4 === 0;
  const reason = sample(reasons);
  const missingResource = sample(['vehicle', 'driver', 'both'] as const);

  const skills: ('ADR' | 'Aéroportuaire' | 'Habilitation sûreté')[] = [];
  if (vehicleType === 'ADR' || Math.random() > 0.7) skills.push('ADR');
  if (Math.random() > 0.8) skills.push('Aéroportuaire');

  // Some are repetitive, some single-day
  const isRepetitive = Math.random() > 0.4;
  let daysList: number[];
  if (isRepetitive) {
    const patterns = [[1, 2, 3, 4, 5], [1, 3, 5], [2, 4], [1, 2, 3], [1, 2, 3, 4, 5, 6]];
    daysList = sample(patterns);
  } else {
    daysList = [sample([1, 2, 3, 4, 5])];
  }

  const dates = getDatesForDays(daysList, weekOffset);
  const week = getWeekIndicator(dates[0]);
  const startTime = `${String(Math.floor(Math.random() * 8) + 4).padStart(2, '0')}:${sample(['00', '15', '30'])}`;
  const startHour = parseInt(startTime.split(':')[0]);
  const endTime = `${String(Math.min(startHour + 3 + Math.floor(Math.random() * 5), 23)).padStart(2, '0')}:${sample(['00', '15', '30'])}`;

  const courses: Course[] = dates.map((date, idx) => ({
    id: `CRS-${String(i).padStart(3, '0')}-${idx + 1}`,
    rideId: `RIDE-${String(i).padStart(3, '0')}`,
    prestationId: `PRE-2024-${String(i).padStart(3, '0')}`,
    date: format(date, 'yyyy-MM-dd'),
    startTime,
    endTime,
    startLocation: startLoc,
    endLocation: endLoc,
    assignmentStatus: 'non_affectee' as const,
    isSensitive,
    requiredVehicleType: vehicleType,
    requiredVehicleEnergy: vehicleType === 'Frigo' ? 'Diesel' as const : undefined,
    requiredDriverType: vehicleType === 'SPL' ? 'SPL' as const : (vehicleType === 'VL' ? 'VL' as const : (Math.random() > 0.5 ? 'CM' as const : 'Polyvalent' as const)),
    requiredDriverSkills: skills,
    nonPlacementReason: reason,
    missingResource,
  }));

  prestations.push({
    id: `PRE-2024-${String(i).padStart(3, '0')}`,
    client: sample(clients),
    codeArticle: `ART-${String(i).padStart(4, '0')}`,
    type,
    courses,
    requiredVehicleType: vehicleType,
    requiredVehicleEnergy: vehicleType === 'Frigo' ? 'Diesel' : undefined,
    requiredDriverType: vehicleType === 'SPL' ? 'SPL' : (vehicleType === 'VL' ? 'VL' : 'CM'),
    requiredDriverSkills: skills,
    priority: Math.floor(Math.random() * 10) + 1,
    hasSensitiveCourses: isSensitive,
    week,
  });
}

// Sort by priority (highest first), then by week (S+1 first), then by sensitive
export const unassignedPrestations: Prestation[] = prestations.sort((a, b) => {
  // Sensible first if same priority
  if (a.priority === b.priority && a.hasSensitiveCourses !== b.hasSensitiveCourses) {
    return a.hasSensitiveCourses ? -1 : 1;
  }
  // Higher priority first
  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }
  // S+1 before S+2, etc.
  const weekOrder = { 'S+1': 1, 'S+2': 2, 'S+3': 3, 'S+4+': 4 };
  return weekOrder[a.week] - weekOrder[b.week];
});

// Helper to get all courses from prestations
export const allUnassignedCourses: Course[] = unassignedPrestations.flatMap(p => p.courses);

// Weekly assignment tracking (demo data)
const currentWeek = getWeekKey(baseDate);
export const weeklyAssignments: WeeklyAssignmentCount[] = [
  {
    chauffeurId: 'DRV-JDU-001',
    trajetId: 'Entrepôt Vénissieux->Entrepôt St-Quentin',
    week: currentWeek,
    count: 4,
  },
  {
    chauffeurId: 'DRV-MDU-002',
    trajetId: 'CDG Hub->Port de Marseille',
    week: currentWeek,
    count: 5,
  },
];

// Stats helper
export function getStatsByWeek(prestations: Prestation[]) {
  const stats = {
    'S+1': { count: 0, courses: 0 },
    'S+2': { count: 0, courses: 0 },
    'S+3': { count: 0, courses: 0 },
    'S+4+': { count: 0, courses: 0 },
  };
  
  prestations.forEach(p => {
    stats[p.week].count++;
    stats[p.week].courses += p.courses.length;
  });
  
  return stats;
}

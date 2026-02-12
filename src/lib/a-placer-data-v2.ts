
import { Prestation, Course, NonPlacementReason, WeeklyAssignmentCount } from './types';
import { addDays, addWeeks, format, startOfWeek, getWeek } from 'date-fns';
import { getWeekKey } from './assignment-constraints';

const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const clients = [
  'CARREFOUR', 'LECLERC', 'INTERMARCHE', 'SYSTEME U', 'AMAZON', 'DASSAULT', 
  'MICHELIN', 'NESTLE', 'SANOFI', 'LACTALIS', 'DANONE', 'AIRBUS', 
  'LVMH', 'PROCTER & GAMBLE', 'SAFRAN', 'SODEXO', 'L\'OREAL', 'TOTALENERGIES',
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

const now = new Date();
const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

// Generate prestations with multiple courses
const prestations: Prestation[] = [];

// Prestation 1: Multi-destination trajet (A -> B -> C -> D) - 3 courses
const prest1Sites = ['Lyon', 'Paris', 'Marseille', 'Nice'];
const prest1Locations = prest1Sites.map(s => getLocationFromSite(s));
prestations.push({
  id: 'PRE-2024-001',
  client: 'CARREFOUR',
  codeArticle: 'ART-CF-001',
  type: 'régulière',
  courses: [
    {
      id: 'COURSE-001-1',
      rideId: 'RIDE-001-1',
      prestationId: 'PRE-2024-001',
      date: format(addDays(baseDate, 1), 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '10:00',
      startLocation: prest1Locations[0],
      endLocation: prest1Locations[1],
      intermediateLocations: [prest1Locations[2], prest1Locations[3]], // Multi-destination
      assignmentStatus: 'non_affectee',
      isSensitive: false,
      requiredVehicleType: 'Semi-remorque',
      requiredDriverType: 'CM',
      requiredDriverSkills: [],
      nonPlacementReason: 'nouvelle_prestation_reguliere',
      missingResource: 'both',
    },
    {
      id: 'COURSE-001-2',
      rideId: 'RIDE-001-2',
      prestationId: 'PRE-2024-001',
      date: format(addDays(baseDate, 1), 'yyyy-MM-dd'),
      startTime: '10:30',
      endTime: '12:00',
      startLocation: prest1Locations[1],
      endLocation: prest1Locations[2],
      assignmentStatus: 'non_affectee',
      isSensitive: false,
      requiredVehicleType: 'Semi-remorque',
      requiredDriverType: 'CM',
      requiredDriverSkills: [],
      nonPlacementReason: 'nouvelle_prestation_reguliere',
      missingResource: 'both',
    },
    {
      id: 'COURSE-001-3',
      rideId: 'RIDE-001-3',
      prestationId: 'PRE-2024-001',
      date: format(addDays(baseDate, 1), 'yyyy-MM-dd'),
      startTime: '13:00',
      endTime: '15:00',
      startLocation: prest1Locations[2],
      endLocation: prest1Locations[3],
      assignmentStatus: 'non_affectee',
      isSensitive: false,
      requiredVehicleType: 'Semi-remorque',
      requiredDriverType: 'CM',
      requiredDriverSkills: [],
      nonPlacementReason: 'nouvelle_prestation_reguliere',
      missingResource: 'both',
    },
  ],
  requiredVehicleType: 'Semi-remorque',
  requiredDriverType: 'CM',
  requiredDriverSkills: [],
  priority: 10,
  hasSensitiveCourses: false,
  week: 'S+1',
});

// Prestation 2: SUP with sensitive course
const prest2Start = getLocationFromSite('Paris');
const prest2End = getLocationFromSite('Lyon');
prestations.push({
  id: 'PRE-2024-002',
  client: 'SANOFI',
  codeArticle: 'ART-SF-002',
  type: 'sup',
  courses: [
    {
      id: 'COURSE-002-1',
      rideId: 'RIDE-002-1',
      prestationId: 'PRE-2024-002',
      date: format(addDays(baseDate, 1), 'yyyy-MM-dd'),
      startTime: '06:00',
      endTime: '12:00',
      startLocation: prest2Start,
      endLocation: prest2End,
      assignmentStatus: 'non_affectee',
      isSensitive: true, // Sensible
      requiredVehicleType: 'ADR',
      requiredVehicleEnergy: 'Diesel',
      requiredDriverType: 'CM',
      requiredDriverSkills: ['ADR'],
      nonPlacementReason: 'sup_client_existant',
      missingResource: 'driver',
    },
  ],
  requiredVehicleType: 'ADR',
  requiredVehicleEnergy: 'Diesel',
  requiredDriverType: 'CM',
  requiredDriverSkills: ['ADR'],
  priority: 9,
  hasSensitiveCourses: true,
  week: 'S+1',
});

// Prestation 3: Conducteur absent
const prest3Start = getLocationFromSite('Marseille');
const prest3End = getLocationFromSite('Bordeaux');
prestations.push({
  id: 'PRE-2024-003',
  client: 'LECLERC',
  codeArticle: 'ART-LC-003',
  type: 'régulière',
  courses: [
    {
      id: 'COURSE-003-1',
      rideId: 'RIDE-003-1',
      prestationId: 'PRE-2024-003',
      date: format(addDays(baseDate, 2), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '14:00',
      startLocation: prest3Start,
      endLocation: prest3End,
      assignmentStatus: 'non_affectee',
      isSensitive: false,
      requiredVehicleType: 'Caisse mobile',
      requiredDriverType: 'CM',
      requiredDriverSkills: [],
      nonPlacementReason: 'conducteur_absent',
      missingResource: 'driver',
    },
  ],
  requiredVehicleType: 'Caisse mobile',
  requiredDriverType: 'CM',
  requiredDriverSkills: [],
  priority: 8,
  hasSensitiveCourses: false,
  week: 'S+1',
});

// Prestation 4: Matériel indisponible
const prest4Start = getLocationFromSite('Lille');
const prest4End = getLocationFromSite('Paris');
prestations.push({
  id: 'PRE-2024-004',
  client: 'MICHELIN',
  codeArticle: 'ART-MC-004',
  type: 'régulière',
  courses: [
    {
      id: 'COURSE-004-1',
      rideId: 'RIDE-004-1',
      prestationId: 'PRE-2024-004',
      date: format(addDays(baseDate, 3), 'yyyy-MM-dd'),
      startTime: '07:00',
      endTime: '11:00',
      startLocation: prest4Start,
      endLocation: prest4End,
      assignmentStatus: 'non_affectee',
      isSensitive: false,
      requiredVehicleType: 'Frigo',
      requiredVehicleEnergy: 'Diesel',
      requiredVehicleEquipment: ['Remorque frigorifique'],
      requiredDriverType: 'CM',
      requiredDriverSkills: [],
      nonPlacementReason: 'materiel_indisponible',
      missingResource: 'vehicle',
    },
  ],
  requiredVehicleType: 'Frigo',
  requiredVehicleEnergy: 'Diesel',
  requiredVehicleEquipment: ['Remorque frigorifique'],
  requiredDriverType: 'CM',
  requiredDriverSkills: [],
  priority: 7,
  hasSensitiveCourses: false,
  week: 'S+1',
});

// Prestation 5: Multi-destination complexe (A -> B -> C -> D -> E)
const prest5Sites = ['Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse'];
const prest5Locations = prest5Sites.map(s => getLocationFromSite(s));
prestations.push({
  id: 'PRE-2024-005',
  client: 'AIRBUS',
  codeArticle: 'ART-AB-005',
  type: 'régulière',
  courses: [
    {
      id: 'COURSE-005-1',
      rideId: 'RIDE-005-1',
      prestationId: 'PRE-2024-005',
      date: format(addDays(baseDate, 4), 'yyyy-MM-dd'),
      startTime: '05:00',
      endTime: '08:00',
      startLocation: prest5Locations[0],
      endLocation: prest5Locations[1],
      intermediateLocations: prest5Locations.slice(2), // Multi-destination
      assignmentStatus: 'non_affectee',
      isSensitive: true,
      requiredVehicleType: 'Semi-remorque',
      requiredDriverType: 'Polyvalent',
      requiredDriverSkills: ['ADR', 'Aéroportuaire'],
      nonPlacementReason: 'premiere_presta_nouveau_client',
      missingResource: 'both',
    },
  ],
  requiredVehicleType: 'Semi-remorque',
  requiredDriverType: 'Polyvalent',
  requiredDriverSkills: ['ADR', 'Aéroportuaire'],
  priority: 9,
  hasSensitiveCourses: true,
  week: 'S+1',
});

// Add more prestations for S+2, S+3
for (let i = 6; i <= 20; i++) {
  const startSite = sample(sites);
  const endSite = sample(sites.filter(s => s !== startSite));
  const startLoc = getLocationFromSite(startSite);
  const endLoc = getLocationFromSite(endSite);
  const date = addDays(baseDate, Math.floor(Math.random() * 21) + 1);
  const week = getWeekIndicator(date);
  
  const reasons: NonPlacementReason[] = [
    'nouvelle_prestation_reguliere',
    'sup_client_existant',
    'conducteur_absent',
    'materiel_indisponible',
    'prestation_modifiee',
    'tournee_cassee',
  ];
  
  const types: ('régulière' | 'sup' | 'spot')[] = ['régulière', 'sup', 'spot'];
  const type = sample(types);
  const isSensitive = i % 5 === 0;
  
  const vehicleTypes: Prestation['requiredVehicleType'][] = [
    'Semi-remorque', 'Caisse mobile', 'Frigo', 'ADR', 'SPL', 'VL'
  ];
  const vehicleType = sample(vehicleTypes);
  
  const skills: ('ADR' | 'Aéroportuaire' | 'Habilitation sûreté')[] = [];
  if (vehicleType === 'ADR' || Math.random() > 0.7) {
    skills.push('ADR');
  }
  if (Math.random() > 0.8) {
    skills.push('Aéroportuaire');
  }
  
  const missingResource = sample(['vehicle', 'driver', 'both'] as const);
  
  prestations.push({
    id: `PRE-2024-${String(i).padStart(3, '0')}`,
    client: sample(clients),
    codeArticle: `ART-${String(i).padStart(4, '0')}`,
    type,
    courses: [
      {
        id: `COURSE-${String(i).padStart(3, '0')}-1`,
        rideId: `RIDE-${String(i).padStart(3, '0')}-1`,
        prestationId: `PRE-2024-${String(i).padStart(3, '0')}`,
        date: format(date, 'yyyy-MM-dd'),
        startTime: `${String(Math.floor(Math.random() * 8) + 5).padStart(2, '0')}:${sample(['00', '15', '30', '45'])}`,
        endTime: `${String(Math.floor(Math.random() * 8) + 13).padStart(2, '0')}:${sample(['00', '15', '30', '45'])}`,
        startLocation: startLoc,
        endLocation: endLoc,
        assignmentStatus: 'non_affectee',
        isSensitive,
        requiredVehicleType: vehicleType,
        requiredVehicleEnergy: vehicleType === 'Frigo' ? 'Diesel' : undefined,
        requiredDriverType: vehicleType === 'SPL' ? 'SPL' : (vehicleType === 'VL' ? 'VL' : (Math.random() > 0.5 ? 'CM' : 'Polyvalent')),
        requiredDriverSkills: skills,
        nonPlacementReason: sample(reasons),
        missingResource,
      },
    ],
    requiredVehicleType: vehicleType,
    requiredVehicleEnergy: vehicleType === 'Frigo' ? 'Diesel' : undefined,
    requiredDriverType: vehicleType === 'SPL' ? 'SPL' : (vehicleType === 'VL' ? 'VL' : (Math.random() > 0.5 ? 'CM' : 'Polyvalent')),
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

// Weekly assignment tracking (demo data - in real app this would be calculated from trips)
const currentWeek = getWeekKey(baseDate);
export const weeklyAssignments: WeeklyAssignmentCount[] = [
  // Example: Jean Dupont has done Lyon->Paris 4 times this week
  {
    chauffeurId: 'DRV-JDU-001',
    trajetId: 'Entrepôt Vénissieux->Entrepôt St-Quentin',
    week: currentWeek,
    count: 4,
  },
  // Example: Marie Dubois has done Paris->Marseille 5 times (at limit)
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

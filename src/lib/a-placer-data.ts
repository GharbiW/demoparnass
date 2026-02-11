
import { UnassignedCourse, TrajetSegment, WeeklyAssignmentCount } from './types';
import { addDays, addWeeks, format } from 'date-fns';
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

// Generate realistic unassigned courses
const now = new Date();
const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

// Helper to get random location from a site
function getLocationFromSite(site: string): string {
  const siteLocations = locations[site as keyof typeof locations] || [];
  return sample(siteLocations);
}

// Single-point trajets
const singlePointCourses: any[] = Array.from({ length: 15 }, (_, i) => {
  const startSite = sample(sites);
  const endSite = sample(sites.filter(s => s !== startSite));
  const startLoc = getLocationFromSite(startSite);
  const endLoc = getLocationFromSite(endSite);
  
  const requiredDate = addDays(baseDate, Math.floor(Math.random() * 28));
  const isSup = i % 3 === 0;
  const isSensitive = i % 5 === 0;
  const hasDeadline = i % 4 === 0;
  
  const vehicleTypes: UnassignedCourse['requiredVehicleType'][] = [
    'Semi-remorque', 'Caisse mobile', 'Frigo', 'ADR', 'SPL', 'VL'
  ];
  const vehicleType = sample(vehicleTypes);
  
  const requiredSkills: ('ADR' | 'Aéroportuaire' | 'Habilitation sûreté')[] = [];
  if (vehicleType === 'ADR' || Math.random() > 0.7) {
    requiredSkills.push('ADR');
  }
  if (Math.random() > 0.8) {
    requiredSkills.push('Aéroportuaire');
  }
  if (Math.random() > 0.9) {
    requiredSkills.push('Habilitation sûreté');
  }

  return {
    id: `COURSE-${String(i + 1).padStart(4, '0')}`,
    client: sample(clients),
    codeArticle: `ART-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
    type: isSup ? 'sup' : (i % 7 === 0 ? 'spot' : 'régulière'),
    isSensitive: isSensitive,
    segments: [{
      id: `SEG-${i + 1}-1`,
      sequence: 1,
      startLocation: startLoc,
      endLocation: endLoc,
      estimatedDuration: Math.floor(Math.random() * 300) + 60, // 1-6 hours
    }],
    requiredDate: format(requiredDate, 'yyyy-MM-dd'),
    requiredStartTime: `${String(Math.floor(Math.random() * 12) + 6).padStart(2, '0')}:${sample(['00', '15', '30', '45'])}`,
    requiredEndTime: undefined,
    deadline: hasDeadline ? format(addWeeks(requiredDate, 4), 'yyyy-MM-dd') : undefined,
    requiredVehicleType: vehicleType,
    requiredVehicleEnergy: vehicleType === 'Frigo' ? 'Diesel' : (Math.random() > 0.7 ? 'Gaz' : undefined),
    requiredVehicleEquipment: vehicleType === 'ADR' ? ['ADR'] : (vehicleType === 'Frigo' ? ['Remorque frigorifique'] : []),
    requiredDriverType: vehicleType === 'SPL' ? 'SPL' : (vehicleType === 'VL' ? 'VL' : (Math.random() > 0.5 ? 'CM' : 'Polyvalent')),
    requiredDriverSkills: requiredSkills.length > 0 ? requiredSkills : [],
    assignmentStatus: 'unassigned',
    priority: Math.floor(Math.random() * 10) + 1,
  };
});

// Multi-point trajets (A -> B -> C)
const multiPointCourses: any[] = Array.from({ length: 12 }, (_, i) => {
  const startSite = sample(sites);
  const midSite = sample(sites.filter(s => s !== startSite));
  const endSite = sample(sites.filter(s => s !== startSite && s !== midSite));
  
  const startLoc = getLocationFromSite(startSite);
  const midLoc = getLocationFromSite(midSite);
  const endLoc = getLocationFromSite(endSite);
  
  const requiredDate = addDays(baseDate, Math.floor(Math.random() * 28));
  const isSup = i % 4 === 0;
  const isSensitive = i % 6 === 0;
  
  const vehicleType: UnassignedCourse['requiredVehicleType'] = sample(['Semi-remorque', 'Caisse mobile', 'Frigo']);
  
  const requiredSkills: ('ADR' | 'Aéroportuaire' | 'Habilitation sûreté')[] = [];
  if (Math.random() > 0.6) {
    requiredSkills.push('ADR');
  }

  return {
    id: `COURSE-MP-${String(i + 1).padStart(4, '0')}`,
    client: sample(clients),
    codeArticle: `ART-MP-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
    type: isSup ? 'sup' : 'régulière',
    isSensitive: isSensitive,
    segments: [
      {
        id: `SEG-MP-${i + 1}-1`,
        sequence: 1,
        startLocation: startLoc,
        endLocation: midLoc,
        estimatedDuration: Math.floor(Math.random() * 180) + 60,
      },
      {
        id: `SEG-MP-${i + 1}-2`,
        sequence: 2,
        startLocation: midLoc,
        endLocation: endLoc,
        estimatedDuration: Math.floor(Math.random() * 180) + 60,
      },
    ],
    requiredDate: format(requiredDate, 'yyyy-MM-dd'),
    requiredStartTime: `${String(Math.floor(Math.random() * 10) + 5).padStart(2, '0')}:${sample(['00', '15', '30', '45'])}`,
    requiredEndTime: undefined,
    requiredVehicleType: vehicleType,
    requiredVehicleEnergy: vehicleType === 'Frigo' ? 'Diesel' : undefined,
    requiredVehicleEquipment: vehicleType === 'Frigo' ? ['Remorque frigorifique'] : [],
    requiredDriverType: 'CM',
    requiredDriverSkills: requiredSkills,
    assignmentStatus: 'unassigned',
    priority: Math.floor(Math.random() * 10) + 1,
  };
});

// Add a few courses with 3+ segments
const complexMultiPointCourses: any[] = Array.from({ length: 3 }, (_, i) => {
  const sitesList = [...sites].sort(() => Math.random() - 0.5).slice(0, 4);
  const locationsList = sitesList.map(site => getLocationFromSite(site));
  
  const requiredDate = addDays(baseDate, Math.floor(Math.random() * 28));
  
  return {
    id: `COURSE-COMPLEX-${String(i + 1).padStart(4, '0')}`,
    client: sample(clients),
    codeArticle: `ART-CX-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
    type: 'régulière',
    isSensitive: i === 0,
    segments: locationsList.slice(0, -1).map((loc, idx) => ({
      id: `SEG-CX-${i + 1}-${idx + 1}`,
      sequence: idx + 1,
      startLocation: loc,
      endLocation: locationsList[idx + 1],
      estimatedDuration: Math.floor(Math.random() * 120) + 45,
    })),
    requiredDate: format(requiredDate, 'yyyy-MM-dd'),
    requiredStartTime: `${String(Math.floor(Math.random() * 8) + 4).padStart(2, '0')}:00`,
    requiredVehicleType: 'Semi-remorque',
    requiredDriverType: 'Polyvalent',
    requiredDriverSkills: ['ADR'],
    assignmentStatus: 'unassigned',
    priority: 8 + i,
  };
});

export const unassignedCourses: any[] = [
  ...singlePointCourses,
  ...multiPointCourses,
  ...complexMultiPointCourses,
];

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

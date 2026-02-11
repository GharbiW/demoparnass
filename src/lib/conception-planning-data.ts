import { Course, Tournee, PlanningHealthMetrics, PlanningVersion } from './types';
import { drivers } from './planning-data';
import { vehicles as allVehicleDetails } from './vehicles-data';
import { addDays, format, startOfWeek, addHours, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const clients = [
  'CARREFOUR', 'LECLERC', 'INTERMARCHE', 'SYSTEME U', 'AMAZON', 'DASSAULT',
  'MICHELIN', 'NESTLE', 'SANOFI', 'LACTALIS', 'DANONE', 'AIRBUS',
  'LVMH', 'PROCTER & GAMBLE', 'SAFRAN', 'SODEXO'
];

const locations: Record<string, string[]> = {
  "Lyon": ["Entrepôt Vénissieux", "Plateforme Lyon Nord", "Port de Lyon"],
  "Paris": ["Entrepôt St-Quentin", "Plateforme Paris Sud", "CDG Hub"],
  "Marseille": ["Port de Marseille", "Entrepôt Avignon", "Plateforme Miramas"],
  "Nantes": ["Entrepôt Nantes", "Plateforme Rennes"],
  "Lille": ["Entrepôt Lesquin", "Plateforme Dourges"],
  "Bordeaux": ["Site de Mérignac", "Port de Bordeaux"],
  "Strasbourg": ["Port de Strasbourg", "Entrepôt Reichstett"],
  "Toulouse": ["Plateforme Eurocentre", "Aéroport de Blagnac"],
};

const sites = Object.keys(locations);
function getLocation(site: string): string {
  const locs = locations[site] || [];
  return sample(locs);
}

const vehicleTypes: Course['requiredVehicleType'][] = ['Semi-remorque', 'Caisse mobile', 'Frigo', 'ADR', 'SPL', 'VL'];
const driverTypes: ('CM' | 'Polyvalent' | 'SPL' | 'VL')[] = ['CM', 'Polyvalent', 'SPL', 'VL'];
const energies: ('Diesel' | 'Gaz' | 'Électrique')[] = ['Diesel', 'Gaz', 'Électrique'];

// Base date for planning (use current week's Monday so data is visible immediately)
const now = new Date();
const planningBaseDate = startOfWeek(now, { weekStartsOn: 1 });

// ─── Generate Courses for Planning ──────────────────────────────────────────

function generatePlanningCourses(): Course[] {
  const courses: Course[] = [];
  let courseIdx = 1;

  // Generate for current week + next week (Mon-Sat × 2 weeks)
  for (let dayOffset = 0; dayOffset < 12; dayOffset++) {
    const dayDate = addDays(planningBaseDate, dayOffset);
    // Skip Sundays
    if (dayDate.getDay() === 0) continue;
    const dateStr = format(dayDate, 'yyyy-MM-dd');

    // Generate 15-25 courses per day
    const coursesPerDay = 15 + Math.floor(Math.random() * 11);

    for (let c = 0; c < coursesPerDay; c++) {
      const startSite = sample(sites);
      const endSite = sample(sites.filter(s => s !== startSite));
      const startLoc = getLocation(startSite);
      const endLoc = getLocation(endSite);

      const startHour = 4 + Math.floor(Math.random() * 14); // 04:00 - 18:00
      const duration = 2 + Math.floor(Math.random() * 6); // 2-7 hours
      const endHour = Math.min(startHour + duration, 23);
      const startMin = sample([0, 15, 30, 45]);
      const endMin = sample([0, 15, 30, 45]);

      const vehicleType = sample(vehicleTypes);
      const driverType = vehicleType === 'SPL' ? 'SPL' : (vehicleType === 'VL' ? 'VL' : sample(['CM', 'Polyvalent'] as const));
      const isSup = Math.random() > 0.85;
      const isSensitive = Math.random() > 0.9;
      const isAssigned = Math.random() > 0.3; // 70% assigned

      const skills: ('ADR' | 'Aéroportuaire' | 'Habilitation sûreté')[] = [];
      if (vehicleType === 'ADR') skills.push('ADR');
      if (Math.random() > 0.85) skills.push('Aéroportuaire');

      // Add intermediate locations for multi-destination (10% of courses)
      const intermediateLocations: string[] = [];
      if (Math.random() > 0.9) {
        const midSite = sample(sites.filter(s => s !== startSite && s !== endSite));
        intermediateLocations.push(getLocation(midSite));
      }

      const assignedDriver = isAssigned ? sample(drivers.filter(d => d.status === 'Actif')) : undefined;
      const assignedVehicle = isAssigned ? sample(allVehicleDetails.filter(v => v.statut === 'Disponible' || v.statut === 'En mission')) : undefined;

      const client = sample(clients);
      const prestationId = `PRE-PL-${String(courseIdx).padStart(3, '0')}`;
      const tourneeId = isAssigned ? `T-${String(Math.floor(courseIdx / 3) + 1).padStart(3, '0')}` : undefined;

      courses.push({
        id: `CRS-PL-${String(courseIdx).padStart(4, '0')}`,
        rideId: `RIDE-PL-${String(courseIdx).padStart(4, '0')}`,
        prestationId,
        date: dateStr,
        startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
        endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
        startLocation: startLoc,
        endLocation: endLoc,
        intermediateLocations: intermediateLocations.length > 0 ? intermediateLocations : undefined,
        assignmentStatus: isAssigned ? 'assigned' : 'unassigned',
        assignedDriverId: assignedDriver?.id,
        assignedDriverName: assignedDriver?.name,
        assignedVehicleId: assignedVehicle?.vin,
        assignedVehicleImmat: assignedVehicle?.immatriculation,
        tourneeId,
        tourneeNumber: tourneeId ? `Tour ${tourneeId.replace('T-', '')}` : undefined,
        isSensitive,
        requiredVehicleType: vehicleType,
        requiredVehicleEnergy: sample(energies),
        requiredDriverType: driverType,
        requiredDriverSkills: skills,
        nonPlacementReason: isAssigned ? 'nouvelle_prestation_reguliere' : sample([
          'nouvelle_prestation_reguliere',
          'conducteur_absent',
          'materiel_indisponible',
          'prestation_modifiee',
          'tournee_cassee',
          'sup_client_existant',
        ] as const),
        missingResource: isAssigned ? undefined : sample(['vehicle', 'driver', 'both'] as const),
        client,
        prestationType: isSup ? 'sup' : 'régulière',
        // Some courses have loading codes
        loadingCode: Math.random() > 0.7 ? `LC-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}` : undefined,
        // Some courses have comments
        comments: Math.random() > 0.8 ? [{
          id: `CMT-${courseIdx}`,
          text: sample([
            'Client exige ponctualité absolue',
            'Accès restreint - badge requis',
            'Chargement par l\'arrière uniquement',
            'Température contrôlée requise',
            'Livraison avant 14h impérative',
            'Client fermé le weekend',
          ]),
          author: sample(['J. Kader', 'S. Jawad', 'M. Dupont']),
          timestamp: new Date().toISOString(),
        }] : undefined,
      });

      courseIdx++;
    }
  }

  return courses;
}

export const planningCourses: Course[] = generatePlanningCourses();

// ─── Generate Tournees ──────────────────────────────────────────────────────

function generateTournees(): Tournee[] {
  const tournees: Tournee[] = [];
  const assignedCourses = planningCourses.filter(c => c.assignmentStatus === 'assigned' && c.tourneeId);

  // Group courses by tourneeId and date
  const grouped = new Map<string, Course[]>();
  assignedCourses.forEach(c => {
    const key = `${c.tourneeId}-${c.date}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  });

  grouped.forEach((courses, key) => {
    const [tourneeId, date] = key.split('-').length > 3
      ? [key.substring(0, key.lastIndexOf('-', key.lastIndexOf('-') - 1)), key.substring(key.lastIndexOf('-', key.lastIndexOf('-') - 1) + 1)]
      : [key.split('-').slice(0, 2).join('-'), key.split('-').slice(2).join('-')];

    const firstCourse = courses[0];
    const vehicle = allVehicleDetails.find(v => v.vin === firstCourse.assignedVehicleId);

    tournees.push({
      id: firstCourse.tourneeId || tourneeId,
      number: firstCourse.tourneeNumber || `Tour ${tourneeId.replace('T-', '')}`,
      vehicleId: firstCourse.assignedVehicleId || '',
      vehicleImmat: firstCourse.assignedVehicleImmat || vehicle?.immatriculation || 'N/A',
      vehicleType: firstCourse.requiredVehicleType,
      vehicleEnergy: firstCourse.requiredVehicleEnergy,
      driverId: firstCourse.assignedDriverId,
      driverName: firstCourse.assignedDriverName,
      driverType: firstCourse.requiredDriverType,
      courses: courses.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      date: firstCourse.date,
      status: 'draft',
    });
  });

  return tournees;
}

export const planningTournees: Tournee[] = generateTournees();

// ─── Health Metrics ─────────────────────────────────────────────────────────

export function getHealthMetrics(): PlanningHealthMetrics {
  const totalCourses = planningCourses.length;
  const assignedCourses = planningCourses.filter(c => c.assignmentStatus === 'assigned').length;
  const unassigned = planningCourses.filter(c => c.assignmentStatus !== 'assigned');
  const supToPlace = unassigned.filter(c => c.prestationType === 'sup').length;
  const regToPlace = unassigned.filter(c => c.prestationType === 'régulière').length;
  const sensitivesToPlace = unassigned.filter(c => c.isSensitive).length;

  return {
    absentDrivers: [
      { type: 'CM', count: 3, impactedCourses: 8 },
      { type: 'SPL', count: 1, impactedCourses: 3 },
      { type: 'VL', count: 2, impactedCourses: 4 },
      { type: 'Polyvalent', count: 1, impactedCourses: 2 },
    ],
    unavailableVehicles: { count: 4, impactedCourses: 9 },
    coursesPlaced: assignedCourses,
    coursesTotal: totalCourses,
    coursesSupToPlace: supToPlace,
    coursesRegToPlace: regToPlace,
    sensitivesToPlace,
    modifications: { annulations: 5, changements: 12 },
    prestationsExpiring4Weeks: 8,
    alertsByLevel: { critical: 3, warning: 7, info: 15 },
    driversOutOfAmplitude: { above: 4, below: 2 },
  };
}

// ─── Planning Versions ──────────────────────────────────────────────────────

export const planningVersions: PlanningVersion[] = [
  {
    id: 'PV-001',
    version: 'v1',
    status: 'draft',
    createdAt: new Date().toISOString(),
    createdBy: 'J. Kader',
    tournees: planningTournees,
  },
];

// ─── Stats Helpers ──────────────────────────────────────────────────────────

export function getPlanningStatsByDay(courses: Course[]) {
  const stats: Record<string, { total: number; assigned: number; unassigned: number; sensitive: number }> = {};

  courses.forEach(c => {
    if (!stats[c.date]) {
      stats[c.date] = { total: 0, assigned: 0, unassigned: 0, sensitive: 0 };
    }
    stats[c.date].total++;
    if (c.assignmentStatus === 'assigned') stats[c.date].assigned++;
    else stats[c.date].unassigned++;
    if (c.isSensitive) stats[c.date].sensitive++;
  });

  return stats;
}

export function getAvailableDrivers() {
  return drivers.filter(d => d.status === 'Actif');
}

export function getAvailableVehicles() {
  return allVehicleDetails.filter(v => v.statut === 'Disponible' || v.statut === 'En mission');
}

// AI Suggestions for resource assignment
export function getAISuggestions(course: Course) {
  const availableDrivers = getAvailableDrivers().slice(0, 3);
  const availableVehicles = getAvailableVehicles().slice(0, 3);

  return availableDrivers.map((driver, idx) => ({
    id: `suggestion-${idx + 1}`,
    driverId: driver.id,
    driverName: driver.name,
    driverType: driver.driverType,
    vehicleId: availableVehicles[idx]?.vin || '',
    vehicleImmat: availableVehicles[idx]?.immatriculation || 'N/A',
    score: Math.round(85 + Math.random() * 15),
    reasons: [
      `Conducteur ${driver.driverType} compatible`,
      idx === 0 ? 'Meilleur score global' : idx === 1 ? 'Proximité géographique' : 'Disponibilité immédiate',
      `${Math.floor(Math.random() * 3)} affectations cette semaine`,
    ],
    warnings: idx === 2 ? ['Approche limite hebdomadaire (4/5)'] : [],
  }));
}

// Subcontractors
export const subcontractors = [
  { id: 'ST-001', name: 'Trans Express', specialty: 'Longue distance', rating: 4.5 },
  { id: 'ST-002', name: 'RapidFret', specialty: 'Express & urbain', rating: 4.2 },
  { id: 'ST-003', name: 'EcoTransport', specialty: 'Frigo & ADR', rating: 4.8 },
  { id: 'ST-004', name: 'ProLog SAS', specialty: 'Polyvalent', rating: 3.9 },
];

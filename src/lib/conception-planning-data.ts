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
        assignmentStatus: isAssigned ? 'affectee' : 'non_affectee',
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

// Generate unique tournee code by site/agency (e.g., T-LGN-001, T-PAR-001)
function generateTourneeCode(site: string, index: number): string {
  const siteCode = site.substring(0, 3).toUpperCase();
  return `T-${siteCode}-${String(index).padStart(3, '0')}`;
}

function generateTournees(): Tournee[] {
  const tournees: Tournee[] = [];
  
  // Group courses by tourneeId and date (including unassigned courses that can form tournées)
  const grouped = new Map<string, Course[]>();
  
  // First, group assigned courses with tourneeId
  const assignedCourses = planningCourses.filter(c => c.tourneeId);
  assignedCourses.forEach(c => {
    const key = `${c.tourneeId}-${c.date}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  });

  // Also group unassigned courses that could form new tournées (by date and requirements)
  const unassignedCourses = planningCourses.filter(c => !c.tourneeId && c.assignmentStatus === 'non_affectee');
  const unassignedByDate = new Map<string, Course[]>();
  unassignedCourses.forEach(c => {
    if (!unassignedByDate.has(c.date)) unassignedByDate.set(c.date, []);
    unassignedByDate.get(c.date)!.push(c);
  });

  let tourneeIndex = 1;
  const siteTourneeCounts = new Map<string, number>();

  grouped.forEach((courses, key) => {
    const [tourneeId, date] = key.split('-').length > 3
      ? [key.substring(0, key.lastIndexOf('-', key.lastIndexOf('-') - 1)), key.substring(key.lastIndexOf('-', key.lastIndexOf('-') - 1) + 1)]
      : [key.split('-').slice(0, 2).join('-'), key.split('-').slice(2).join('-')];

    const firstCourse = courses[0];
    const vehicle = firstCourse.assignedVehicleId ? allVehicleDetails.find(v => v.vin === firstCourse.assignedVehicleId) : undefined;
    
    // Determine site for code generation (use first course's start location site)
    const site = sites.find(s => firstCourse.startLocation.includes(s)) || 'LGN';
    if (!siteTourneeCounts.has(site)) siteTourneeCounts.set(site, 0);
    siteTourneeCounts.set(site, siteTourneeCounts.get(site)! + 1);
    const tourneeCode = generateTourneeCode(site, siteTourneeCounts.get(site)!);

    // Generate service pickup for some tournees (70% have service pickup)
    const hasServicePickup = Math.random() > 0.3;
    const servicePickup = hasServicePickup ? {
      location: getLocation(site),
      time: `${String(5 + Math.floor(Math.random() * 2)).padStart(2, '0')}:${sample([0, 15, 30])}`,
      kmFromBase: 5 + Math.floor(Math.random() * 20), // 5-25 km from base
    } : undefined;

    tournees.push({
      id: firstCourse.tourneeId || tourneeId,
      number: firstCourse.tourneeNumber || `Tour ${tourneeId.replace('T-', '')}`,
      tourneeCode,
      vehicleId: firstCourse.assignedVehicleId,
      vehicleImmat: firstCourse.assignedVehicleImmat || vehicle?.immatriculation,
      vehicleType: firstCourse.requiredVehicleType,
      vehicleEnergy: firstCourse.requiredVehicleEnergy,
      driverId: firstCourse.assignedDriverId,
      driverName: firstCourse.assignedDriverName,
      driverType: firstCourse.requiredDriverType,
      courses: courses.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      date: firstCourse.date,
      status: 'draft',
      servicePickup,
    });
  });

  // Create tournées for unassigned courses (without vehicle/driver)
  unassignedByDate.forEach((courses, date) => {
    if (courses.length === 0) return;
    
    // Group by similar requirements (same vehicle type, same day)
    const byRequirements = new Map<string, Course[]>();
    courses.forEach(c => {
      const reqKey = `${c.requiredVehicleType}-${c.requiredVehicleEnergy || 'any'}`;
      if (!byRequirements.has(reqKey)) byRequirements.set(reqKey, []);
      byRequirements.get(reqKey)!.push(c);
    });

    byRequirements.forEach((reqCourses) => {
      if (reqCourses.length === 0) return;
      
      const firstCourse = reqCourses[0];
      const site = sites.find(s => firstCourse.startLocation.includes(s)) || 'LGN';
      if (!siteTourneeCounts.has(site)) siteTourneeCounts.set(site, 0);
      siteTourneeCounts.set(site, siteTourneeCounts.get(site)! + 1);
      const tourneeCode = generateTourneeCode(site, siteTourneeCounts.get(site)!);

      tournees.push({
        id: `T-UNASSIGNED-${tourneeIndex++}`,
        number: `Tour ${tourneeCode.replace('T-', '')}`,
        tourneeCode,
        // No vehicleId or driverId - tournée created without resources
        vehicleType: firstCourse.requiredVehicleType,
        vehicleEnergy: firstCourse.requiredVehicleEnergy,
        courses: reqCourses.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        date: firstCourse.date,
        status: 'draft',
      });
    });
  });

  return tournees;
}

export const planningTournees: Tournee[] = generateTournees();

// ─── Health Metrics ─────────────────────────────────────────────────────────

export function getHealthMetrics(): PlanningHealthMetrics {
  const totalCourses = planningCourses.length;
  const assignedCourses = planningCourses.filter(c => c.assignmentStatus === 'affectee').length;
  const unassigned = planningCourses.filter(c => c.assignmentStatus !== 'affectee');
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
    if (c.assignmentStatus === 'affectee') stats[c.date].assigned++;
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

// ─── Vehicle Availability (Pessimistic Rule) ────────────────────────────────
// Pessimistic rule: if ANY issue is detected for a vehicle during the planning window,
// the vehicle is marked unavailable for the ENTIRE day. This prevents optimistic
// assumptions and ensures reliable planning.

export interface VehicleAvailabilityEntry {
  vin: string;
  immatriculation: string;
  type: string;
  status: 'available' | 'maintenance' | 'breakdown' | 'inspection' | 'reserved';
  reason?: string;
  unavailableDates: string[]; // YYYY-MM-DD dates where vehicle is unavailable
  nextAvailableDate?: string;
}

export interface VehicleAvailabilitySummary {
  totalVehicles: number;
  availableToday: number;
  unavailableToday: number;
  maintenancePlanned: number;
  breakdowns: number;
  inspections: number;
  byType: Record<string, { total: number; available: number; unavailable: number }>;
  unavailableVehicles: VehicleAvailabilityEntry[];
  availabilityRate: number; // percentage
}

export function getVehicleAvailability(targetDate?: string): VehicleAvailabilitySummary {
  const dateStr = targetDate || format(new Date(), 'yyyy-MM-dd');
  
  // Generate pessimistic availability data from vehicles
  const allVehicles = allVehicleDetails;
  const entries: VehicleAvailabilityEntry[] = allVehicles.map(v => {
    const baseStatus = v.statut;
    let status: VehicleAvailabilityEntry['status'] = 'available';
    let reason: string | undefined;
    const unavailableDates: string[] = [];
    let nextAvailableDate: string | undefined;
    
    // Pessimistic rule: maintenance, panne → unavailable for longer periods
    if (baseStatus === 'En maintenance') {
      status = 'maintenance';
      reason = 'Maintenance préventive planifiée';
      // Pessimistic: mark unavailable for 2-3 days
      for (let i = 0; i < 3; i++) {
        unavailableDates.push(format(addDays(new Date(dateStr), i), 'yyyy-MM-dd'));
      }
      nextAvailableDate = format(addDays(new Date(dateStr), 3), 'yyyy-MM-dd');
    } else if (baseStatus === 'En panne') {
      status = 'breakdown';
      reason = 'Panne signalée — diagnostic en cours';
      // Pessimistic: mark unavailable for 5 days
      for (let i = 0; i < 5; i++) {
        unavailableDates.push(format(addDays(new Date(dateStr), i), 'yyyy-MM-dd'));
      }
      nextAvailableDate = format(addDays(new Date(dateStr), 5), 'yyyy-MM-dd');
    }
    // Also mark some "available" vehicles as reserved (pessimistic buffer)
    else if (Math.random() > 0.92) {
      status = 'reserved';
      reason = 'Réservé pour prestation prioritaire';
      unavailableDates.push(dateStr);
    }

    // Derive vehicle type from energy/model
    const derivedType = v.energie === 'Électrique' ? 'VL' : sample(vehicleTypes);
    
    return {
      vin: v.vin,
      immatriculation: v.immatriculation,
      type: derivedType,
      status,
      reason,
      unavailableDates,
      nextAvailableDate,
    };
  });
  
  const unavailableToday = entries.filter(e => e.unavailableDates.includes(dateStr));
  const availableToday = entries.filter(e => !e.unavailableDates.includes(dateStr));
  
  // By type breakdown
  const byType: Record<string, { total: number; available: number; unavailable: number }> = {};
  entries.forEach(e => {
    if (!byType[e.type]) byType[e.type] = { total: 0, available: 0, unavailable: 0 };
    byType[e.type].total++;
    if (e.unavailableDates.includes(dateStr)) {
      byType[e.type].unavailable++;
    } else {
      byType[e.type].available++;
    }
  });
  
  return {
    totalVehicles: entries.length,
    availableToday: availableToday.length,
    unavailableToday: unavailableToday.length,
    maintenancePlanned: entries.filter(e => e.status === 'maintenance').length,
    breakdowns: entries.filter(e => e.status === 'breakdown').length,
    inspections: 0, // Derived from control schedule when available
    byType,
    unavailableVehicles: unavailableToday,
    availabilityRate: entries.length > 0 
      ? Math.round((availableToday.length / entries.length) * 100)
      : 100,
  };
}

// ─── Plan vs Real (Simulated) ────────────────────────────────────────────────
// Simulated comparison of planned vs actual execution data

export interface PlanVsRealEntry {
  courseId: string;
  client: string;
  date: string;
  planned: {
    startTime: string;
    endTime: string;
    startLocation: string;
    endLocation: string;
    driverName?: string;
    vehicleImmat?: string;
  };
  actual: {
    startTime: string;
    endTime: string;
    startLocation: string;
    endLocation: string;
    driverName?: string;
    vehicleImmat?: string;
  };
  deviations: {
    startTimeDeviation: number; // minutes (positive = late)
    endTimeDeviation: number;
    driverChanged: boolean;
    vehicleChanged: boolean;
    locationChanged: boolean;
  };
  status: 'on_time' | 'minor_delay' | 'major_delay' | 'cancelled' | 'modified';
}

export interface PlanVsRealSummary {
  totalCompared: number;
  onTime: number;
  minorDelay: number;
  majorDelay: number;
  cancelled: number;
  modified: number;
  avgStartDeviation: number; // minutes
  avgEndDeviation: number;
  driverChangeRate: number; // percentage
  vehicleChangeRate: number;
  onTimeRate: number; // percentage
  entries: PlanVsRealEntry[];
}

export function getPlanVsRealData(): PlanVsRealSummary {
  // Simulate data for completed courses (current week courses that are "in the past")
  const now = new Date();
  const pastCourses = planningCourses
    .filter(c => {
      const courseDate = new Date(c.date);
      return courseDate < now && c.assignmentStatus === 'affectee';
    })
    .slice(0, 50); // Take a manageable sample

  const entries: PlanVsRealEntry[] = pastCourses.map(c => {
    // Simulate deviations
    const startDev = Math.floor(Math.random() * 30) - 5; // -5 to +25 min
    const endDev = Math.floor(Math.random() * 40) - 10; // -10 to +30 min
    const driverChanged = Math.random() > 0.88; // ~12% driver changes
    const vehicleChanged = Math.random() > 0.92; // ~8% vehicle changes

    let status: PlanVsRealEntry['status'] = 'on_time';
    if (Math.random() > 0.95) status = 'cancelled';
    else if (Math.random() > 0.9) status = 'modified';
    else if (Math.abs(startDev) > 15 || Math.abs(endDev) > 20) status = 'major_delay';
    else if (Math.abs(startDev) > 5 || Math.abs(endDev) > 10) status = 'minor_delay';

    // Simulate actual times with deviations
    const [ph, pm] = c.startTime.split(':').map(Number);
    const [eh, em] = c.endTime.split(':').map(Number);
    const actualStartMin = ph * 60 + pm + startDev;
    const actualEndMin = eh * 60 + em + endDev;
    const actualStartTime = `${String(Math.floor(Math.max(0, actualStartMin) / 60) % 24).padStart(2, '0')}:${String(Math.max(0, actualStartMin) % 60).padStart(2, '0')}`;
    const actualEndTime = `${String(Math.floor(Math.max(0, actualEndMin) / 60) % 24).padStart(2, '0')}:${String(Math.max(0, actualEndMin) % 60).padStart(2, '0')}`;

    const altDriver = driverChanged ? sample(drivers.filter(d => d.status === 'Actif')) : undefined;
    const altVehicle = vehicleChanged ? sample(allVehicleDetails.filter(v => v.statut === 'Disponible' || v.statut === 'En mission')) : undefined;

    return {
      courseId: c.id,
      client: c.client || 'N/A',
      date: c.date,
      planned: {
        startTime: c.startTime,
        endTime: c.endTime,
        startLocation: c.startLocation,
        endLocation: c.endLocation,
        driverName: c.assignedDriverName,
        vehicleImmat: c.assignedVehicleImmat,
      },
      actual: {
        startTime: actualStartTime,
        endTime: actualEndTime,
        startLocation: c.startLocation,
        endLocation: c.endLocation,
        driverName: driverChanged ? altDriver?.name || c.assignedDriverName : c.assignedDriverName,
        vehicleImmat: vehicleChanged ? altVehicle?.immatriculation || c.assignedVehicleImmat : c.assignedVehicleImmat,
      },
      deviations: {
        startTimeDeviation: startDev,
        endTimeDeviation: endDev,
        driverChanged,
        vehicleChanged,
        locationChanged: false,
      },
      status,
    };
  });

  const onTime = entries.filter(e => e.status === 'on_time').length;
  const minorDelay = entries.filter(e => e.status === 'minor_delay').length;
  const majorDelay = entries.filter(e => e.status === 'major_delay').length;
  const cancelled = entries.filter(e => e.status === 'cancelled').length;
  const modified = entries.filter(e => e.status === 'modified').length;

  const avgStartDev = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.deviations.startTimeDeviation, 0) / entries.length)
    : 0;
  const avgEndDev = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.deviations.endTimeDeviation, 0) / entries.length)
    : 0;

  const driverChangeRate = entries.length > 0
    ? Math.round((entries.filter(e => e.deviations.driverChanged).length / entries.length) * 100)
    : 0;
  const vehicleChangeRate = entries.length > 0
    ? Math.round((entries.filter(e => e.deviations.vehicleChanged).length / entries.length) * 100)
    : 0;

  return {
    totalCompared: entries.length,
    onTime,
    minorDelay,
    majorDelay,
    cancelled,
    modified,
    avgStartDeviation: avgStartDev,
    avgEndDeviation: avgEndDev,
    driverChangeRate,
    vehicleChangeRate,
    onTimeRate: entries.length > 0 ? Math.round((onTime / entries.length) * 100) : 100,
    entries,
  };
}

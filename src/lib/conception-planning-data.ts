import { Course, Tournee, PlanningHealthMetrics, PlanningVersion } from './types';
import { drivers } from './planning-data';
import { vehicles as allVehicleDetails } from './vehicles-data';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
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
const energies: ('Diesel' | 'Gaz' | 'Électrique')[] = ['Diesel', 'Gaz', 'Électrique'];

// Base date for planning (use current week's Monday so data is visible immediately)
const now = new Date();
const planningBaseDate = startOfWeek(now, { weekStartsOn: 1 });

// ─── Helper: format minutes to HH:mm ────────────────────────────────────────
function minToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const mins = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Get named active drivers for variety (ensure different named drivers in rows)
const activeDrivers = drivers.filter(d => d.status === 'Actif');
const namedDrivers = activeDrivers.slice(0, Math.min(activeDrivers.length, 15));
const availableVehicles = allVehicleDetails.filter(v => v.statut === 'Disponible' || v.statut === 'En mission');

// ─── Scenario Templates ─────────────────────────────────────────────────────
// Each scenario produces one tournée with sequential courses

interface ScenarioTemplate {
  tag: string; // label for debugging
  coursesCount: number;
  startMinute: number; // first course starts at this minute of day
  durations: number[]; // duration in minutes for each course
  gaps: number[]; // transit gap in minutes between courses (length = coursesCount - 1)
  vehicleType: Course['requiredVehicleType'];
  energy: 'Diesel' | 'Gaz' | 'Électrique';
  driverType: 'CM' | 'Polyvalent' | 'SPL' | 'VL';
  clients: string[];
  assigned: boolean;
  isSup: boolean;
  isSensitive: boolean;
  skills: ('ADR' | 'Aéroportuaire' | 'Habilitation sûreté')[];
  nonPlacementReason?: Course['nonPlacementReason'];
  missingResource?: 'vehicle' | 'driver' | 'both';
  hasComments: boolean;
}

// 14 diverse scenario templates — rotated & varied per day
const scenarioTemplates: ScenarioTemplate[] = [
  // 1. Standard morning: 2 courses, single driver, Caisse mobile
  {
    tag: 'morning-standard',
    coursesCount: 2, startMinute: 6 * 60, durations: [150, 120], gaps: [25],
    vehicleType: 'Caisse mobile', energy: 'Diesel', driverType: 'CM',
    clients: ['CARREFOUR', 'LECLERC'], assigned: true, isSup: false, isSensitive: false,
    skills: [], hasComments: false,
  },
  // 2. Full day 3 courses, Semi-remorque
  {
    tag: 'fullday-3courses',
    coursesCount: 3, startMinute: 5 * 60 + 30, durations: [180, 150, 120], gaps: [30, 25],
    vehicleType: 'Semi-remorque', energy: 'Diesel', driverType: 'CM',
    clients: ['AMAZON', 'NESTLE', 'SANOFI'], assigned: true, isSup: false, isSensitive: false,
    skills: [], hasComments: true,
  },
  // 3. Long dual-driver tournée (>8h total, 4 courses)
  {
    tag: 'dual-driver-long',
    coursesCount: 4, startMinute: 4 * 60 + 30, durations: [150, 120, 150, 120], gaps: [20, 30, 20],
    vehicleType: 'Semi-remorque', energy: 'Diesel', driverType: 'SPL',
    clients: ['MICHELIN', 'DANONE', 'AIRBUS', 'LVMH'], assigned: true, isSup: false, isSensitive: false,
    skills: [], hasComments: true,
  },
  // 4. Short single delivery (VL, quick)
  {
    tag: 'single-quick',
    coursesCount: 1, startMinute: 9 * 60, durations: [90], gaps: [],
    vehicleType: 'VL', energy: 'Électrique', driverType: 'VL',
    clients: ['DASSAULT'], assigned: true, isSup: false, isSensitive: false,
    skills: [], hasComments: false,
  },
  // 5. Afternoon Frigo tournée
  {
    tag: 'afternoon-frigo',
    coursesCount: 2, startMinute: 13 * 60 + 30, durations: [180, 150], gaps: [20],
    vehicleType: 'Frigo', energy: 'Diesel', driverType: 'CM',
    clients: ['LACTALIS', 'DANONE'], assigned: true, isSup: false, isSensitive: false,
    skills: [], hasComments: false,
  },
  // 6. SUP urgent (1 course)
  {
    tag: 'sup-urgent',
    coursesCount: 1, startMinute: 10 * 60 + 15, durations: [120], gaps: [],
    vehicleType: 'Caisse mobile', energy: 'Gaz', driverType: 'Polyvalent',
    clients: ['INTERMARCHE'], assigned: true, isSup: true, isSensitive: false,
    skills: [], hasComments: true,
  },
  // 7. Sensitive ADR tournée (2 courses)
  {
    tag: 'sensitive-adr',
    coursesCount: 2, startMinute: 7 * 60, durations: [150, 180], gaps: [30],
    vehicleType: 'ADR', energy: 'Diesel', driverType: 'SPL',
    clients: ['SAFRAN', 'AIRBUS'], assigned: true, isSup: false, isSensitive: true,
    skills: ['ADR'], hasComments: true,
  },
  // 8. Unassigned — driver absent (2 courses)
  {
    tag: 'unassigned-driver',
    coursesCount: 2, startMinute: 8 * 60, durations: [120, 120], gaps: [20],
    vehicleType: 'Semi-remorque', energy: 'Diesel', driverType: 'CM',
    clients: ['SYSTEME U', 'SODEXO'], assigned: false, isSup: false, isSensitive: false,
    skills: [], nonPlacementReason: 'conducteur_absent', missingResource: 'driver', hasComments: false,
  },
  // 9. Unassigned — vehicle unavailable (1 course)
  {
    tag: 'unassigned-vehicle',
    coursesCount: 1, startMinute: 11 * 60, durations: [150], gaps: [],
    vehicleType: 'Frigo', energy: 'Gaz', driverType: 'CM',
    clients: ['PROCTER & GAMBLE'], assigned: false, isSup: false, isSensitive: false,
    skills: [], nonPlacementReason: 'materiel_indisponible', missingResource: 'vehicle', hasComments: false,
  },
  // 10. Early bird SPL tournée (04:00 start, 3 courses)
  {
    tag: 'earlybird-spl',
    coursesCount: 3, startMinute: 4 * 60, durations: [120, 90, 120], gaps: [20, 15],
    vehicleType: 'SPL', energy: 'Diesel', driverType: 'SPL',
    clients: ['AMAZON', 'CARREFOUR', 'LECLERC'], assigned: true, isSup: false, isSensitive: false,
    skills: [], hasComments: false,
  },
  // 11. SUP + sensitive (2 courses, mixed)
  {
    tag: 'sup-sensitive-mix',
    coursesCount: 2, startMinute: 15 * 60, durations: [120, 90], gaps: [25],
    vehicleType: 'Caisse mobile', energy: 'Diesel', driverType: 'Polyvalent',
    clients: ['LVMH', 'SAFRAN'], assigned: true, isSup: true, isSensitive: true,
    skills: ['Habilitation sûreté'], hasComments: true,
  },
  // 12. Unassigned — both missing (SUP, 1 course)
  {
    tag: 'unassigned-both',
    coursesCount: 1, startMinute: 12 * 60, durations: [90], gaps: [],
    vehicleType: 'VL', energy: 'Électrique', driverType: 'VL',
    clients: ['NESTLE'], assigned: false, isSup: true, isSensitive: false,
    skills: [], nonPlacementReason: 'sup_client_existant', missingResource: 'both', hasComments: false,
  },
  // 13. Evening tournée (2 courses, late)
  {
    tag: 'evening-tournee',
    coursesCount: 2, startMinute: 17 * 60, durations: [120, 90], gaps: [20],
    vehicleType: 'Caisse mobile', energy: 'Gaz', driverType: 'CM',
    clients: ['SODEXO', 'INTERMARCHE'], assigned: true, isSup: false, isSensitive: false,
    skills: [], hasComments: false,
  },
  // 14. Dual-driver short (2 courses, borderline 8h)
  {
    tag: 'dual-driver-short',
    coursesCount: 3, startMinute: 6 * 60 + 30, durations: [180, 150, 180], gaps: [25, 30],
    vehicleType: 'Semi-remorque', energy: 'Diesel', driverType: 'CM',
    clients: ['MICHELIN', 'LECLERC', 'CARREFOUR'], assigned: true, isSup: false, isSensitive: false,
    skills: [], hasComments: false,
  },
];

// ─── Generate Courses for Planning ──────────────────────────────────────────

function generatePlanningCourses(): Course[] {
  const courses: Course[] = [];
  let courseIdx = 1;
  let tourneeCounter = 1;

  // Generate for current week + next week (Mon-Sat × 2 weeks)
  for (let dayOffset = 0; dayOffset < 12; dayOffset++) {
    const dayDate = addDays(planningBaseDate, dayOffset);
    // Skip Sundays
    if (dayDate.getDay() === 0) continue;
    const dateStr = format(dayDate, 'yyyy-MM-dd');

    // Shuffle scenarios and pick 10-14 per day for variety (but always include diverse types)
    const dayScenarios = [...scenarioTemplates];
    // Shuffle using Fisher-Yates
    for (let i = dayScenarios.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dayScenarios[i], dayScenarios[j]] = [dayScenarios[j], dayScenarios[i]];
    }

    // Use 10-13 scenarios per day (some days busier)
    const scenarioCount = 10 + (dayOffset % 4);
    const selectedScenarios = dayScenarios.slice(0, Math.min(scenarioCount, dayScenarios.length));

    // Slightly vary start times per day so data looks different each day
    const dayTimeOffset = (dayOffset * 7) % 30; // shift 0-29 min

    // Track which driver index to use to spread drivers across tournées
    let driverIdx = dayOffset % namedDrivers.length;

    selectedScenarios.forEach((scenario, scenIdx) => {
      const tourneeId = `T-${String(tourneeCounter).padStart(3, '0')}`;
      const tCode = tourneeId;
      tourneeCounter++;

      // Pick a different site for each scenario
      const siteIdx = (scenIdx + dayOffset) % sites.length;
      const startSite = sites[siteIdx];

      // Assign driver & vehicle (or not, based on scenario)
      const driver = scenario.assigned ? namedDrivers[driverIdx % namedDrivers.length] : undefined;
      driverIdx++;
      const vehicle = scenario.assigned ? availableVehicles[(scenIdx + dayOffset * 3) % availableVehicles.length] : undefined;

      // Build courses sequentially
      let currentMin = scenario.startMinute + dayTimeOffset;

      for (let ci = 0; ci < scenario.coursesCount; ci++) {
        const duration = scenario.durations[ci] || 120;
        const endMin = Math.min(currentMin + duration, 23 * 60 + 45);

        const endSiteIdx = (siteIdx + ci + 1) % sites.length;
        const endSite = sites[endSiteIdx];

        // Specific adjustments for variety
        const thisSensitive = scenario.isSensitive;
        const thisClient = scenario.clients[ci % scenario.clients.length];

        courses.push({
          id: `CRS-PL-${String(courseIdx).padStart(4, '0')}`,
          rideId: `RIDE-PL-${String(courseIdx).padStart(4, '0')}`,
          prestationId: `PRE-PL-${String(courseIdx).padStart(3, '0')}`,
          date: dateStr,
          startTime: minToTime(currentMin),
          endTime: minToTime(endMin),
          startLocation: getLocation(startSite),
          endLocation: getLocation(endSite),
          assignmentStatus: scenario.assigned ? 'affectee' : 'non_affectee',
          assignedDriverId: driver?.id,
          assignedDriverName: driver?.name,
          assignedVehicleId: vehicle?.vin,
          assignedVehicleImmat: vehicle?.immatriculation,
          tourneeId: scenario.assigned ? tourneeId : undefined,
          tourneeNumber: scenario.assigned ? `Tour ${tCode.replace('T-', '')}` : undefined,
          isSensitive: thisSensitive,
          requiredVehicleType: scenario.vehicleType,
          requiredVehicleEnergy: scenario.energy,
          requiredDriverType: scenario.driverType,
          requiredDriverSkills: [...scenario.skills],
          nonPlacementReason: scenario.assigned
            ? 'nouvelle_prestation_reguliere'
            : (scenario.nonPlacementReason || 'nouvelle_prestation_reguliere'),
          missingResource: scenario.assigned ? undefined : scenario.missingResource,
          client: thisClient,
          prestationType: scenario.isSup ? 'sup' : 'régulière',
          loadingCode: Math.random() > 0.6 ? `LC-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}` : undefined,
          comments: scenario.hasComments ? [{
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

        // Move to next course start: end + transit gap
        const gap = scenario.gaps[ci] || 20;
        currentMin = endMin + gap;
      }
    });

    // Also add 2-4 extra standalone unassigned courses (no tournée) for "À Placer" variety
    const extraUnassigned = 2 + (dayOffset % 3);
    for (let eu = 0; eu < extraUnassigned; eu++) {
      const startH = 6 + Math.floor(Math.random() * 12);
      const dur = 90 + Math.floor(Math.random() * 120);
      const vt = sample(vehicleTypes);
      const dt = vt === 'SPL' ? 'SPL' as const : vt === 'VL' ? 'VL' as const : sample(['CM', 'Polyvalent'] as const);

      courses.push({
        id: `CRS-PL-${String(courseIdx).padStart(4, '0')}`,
        rideId: `RIDE-PL-${String(courseIdx).padStart(4, '0')}`,
        prestationId: `PRE-PL-${String(courseIdx).padStart(3, '0')}`,
        date: dateStr,
        startTime: minToTime(startH * 60 + sample([0, 15, 30])),
        endTime: minToTime(Math.min(startH * 60 + dur, 23 * 60 + 45)),
        startLocation: getLocation(sample(sites)),
        endLocation: getLocation(sample(sites)),
        assignmentStatus: 'non_affectee',
        isSensitive: eu === 0,
        requiredVehicleType: vt,
        requiredVehicleEnergy: sample(energies),
        requiredDriverType: dt,
        requiredDriverSkills: vt === 'ADR' ? ['ADR'] : [],
        nonPlacementReason: sample([
          'conducteur_absent', 'materiel_indisponible', 'tournee_cassee', 'prestation_modifiee',
        ] as const),
        missingResource: sample(['vehicle', 'driver', 'both'] as const),
        client: sample(clients),
        prestationType: eu === 0 ? 'sup' : 'régulière',
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
    const key = `${c.tourneeId}|${c.date}`;
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

  // Determine which tourneeIds will be dual-driver
  // Rule: Use 2 conducteurs when total trajet duration > 8 hours
  const allTourneeKeys = Array.from(grouped.keys());

  // Helper function to calculate total duration in hours
  const calculateTotalDuration = (courses: Course[]): number => {
    if (courses.length === 0) return 0;
    const sorted = courses.sort((a, b) => a.startTime.localeCompare(b.startTime));
    const firstStart = timeToMinutes(sorted[0].startTime);
    const lastEnd = timeToMinutes(sorted[sorted.length - 1].endTime);
    // Handle midnight crossing
    const duration = lastEnd >= firstStart 
      ? (lastEnd - firstStart) / 60 
      : ((24 * 60 - firstStart) + lastEnd) / 60;
    return duration;
  };

  // Helper function to convert time string to minutes
  function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  // Determine dual-driver based on duration > 8 hours
  const dualDriverKeys = new Set<string>();
  allTourneeKeys.forEach(key => {
    const courses = grouped.get(key)!;
    if (courses.length >= 2 && !!courses[0].assignedDriverId) {
      const totalDuration = calculateTotalDuration(courses);
      if (totalDuration > 8) {
        dualDriverKeys.add(key);
      }
    }
  });

  grouped.forEach((courses, key) => {
    const [tourneeId] = key.split('|');

    const firstCourse = courses[0];
    const vehicle = firstCourse.assignedVehicleId ? allVehicleDetails.find(v => v.vin === firstCourse.assignedVehicleId) : undefined;
    
    // Determine site for code generation (use first course's start location site)
    const site = sites.find(s => firstCourse.startLocation.includes(s)) || 'LGN';
    if (!siteTourneeCounts.has(site)) siteTourneeCounts.set(site, 0);
    siteTourneeCounts.set(site, siteTourneeCounts.get(site)! + 1);
    const tourneeCode = generateTourneeCode(site, siteTourneeCounts.get(site)!);

    // Always generate service pickup — positioned 15-30 min before the first course
    const sortedForPickup = [...courses].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const firstCourseStart = sortedForPickup[0].startTime;
    const [fh, fm] = firstCourseStart.split(':').map(Number);
    const firstMin = fh * 60 + fm;
    const pickupOffset = 15 + Math.floor(Math.random() * 16); // 15-30 min before
    const pickupMin = Math.max(0, firstMin - pickupOffset);
    const pickupH = Math.floor(pickupMin / 60);
    const pickupM = pickupMin % 60;
    const servicePickup = {
      location: getLocation(site),
      time: `${String(pickupH).padStart(2, '0')}:${String(pickupM).padStart(2, '0')}`,
      kmFromBase: 5 + Math.floor(Math.random() * 20), // 5-25 km from base
    };

    // Dual-driver support — use 2 conducteurs when total trajet duration > 8 hours
    const isDualDriver = dualDriverKeys.has(key) && courses.length >= 2 && !!firstCourse.assignedDriverId;
    let driver2: typeof drivers[0] | undefined;
    if (isDualDriver) {
      // Pick a different active driver as second driver
      driver2 = sample(drivers.filter(d => d.status === 'Actif' && d.id !== firstCourse.assignedDriverId));
      // Tag courses with driver slots — first half → A, second half → B
      const sortedCourses = courses.sort((a, b) => a.startTime.localeCompare(b.startTime));
      const midIdx = Math.ceil(sortedCourses.length / 2);
      sortedCourses.forEach((c, i) => {
        c.isDualDriver = true;
        c.driverSlot = i < midIdx ? 'A' : 'B';
        // Update driver assignment for slot B courses
        if (c.driverSlot === 'B' && driver2) {
          c.assignedDriverId = driver2.id;
          c.assignedDriverName = driver2.name;
        }
      });
    }

    // Generate days of week for repetition tracking
    const dayOfWeek = new Date(firstCourse.date).getDay();
    const dayMap: Record<number, string> = { 1: 'Lu', 2: 'Ma', 3: 'Me', 4: 'Je', 5: 'Ve', 6: 'Sa', 0: 'Di' };
    // Most tours repeat Mon-Fri, some include Saturday
    const daysOfWeek = Math.random() > 0.3
      ? ['Lu', 'Ma', 'Me', 'Je', 'Ve']
      : Math.random() > 0.5
        ? ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']
        : [dayMap[dayOfWeek] || 'Lu'];

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
      isDualDriver: isDualDriver || false,
      driver2Id: driver2?.id,
      driver2Name: driver2?.name,
      driver2Type: driver2?.driverType,
      daysOfWeek,
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
        daysOfWeek: ['Lu', 'Ma', 'Me', 'Je', 'Ve'],
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

export type EcartType = 'conducteur' | 'vehicule' | 'horaire' | 'lieu' | 'annulation' | 'date' | 'rse';
export type GraviteLevel = 'mineur' | 'majeur' | 'annule';
export type EcartReason =
  | 'absence_conducteur'
  | 'panne_vehicule'
  | 'probleme_site'
  | 'annulation_demande_client'
  | 'annulation_operationnel_parnass'
  | 'annulation_empechement_exterieur'
  | 'retard_cascade'
  | 'alea_externe'
  | 'retard_demarrage'
  | 'modification_demande_client'
  | 'ecart_rse'
  | 'non_renseigne';

export interface PlanVsRealEntry {
  courseId: string;
  client: string;
  date: string;
  tourneeId?: string;
  tourneeNumber?: string;
  product: 'CM' | 'SPL' | 'VL' | 'PO';
  codeArticle?: string;
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
  ecartType?: EcartType;
  gravite?: GraviteLevel;
  ecartReason: EcartReason;
  retardMinutes?: number; // delay in minutes for non-conforming rides
  isConforme: boolean;
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
  // New aggregated data
  conformeCount: number;
  ecartCount: number;
  conformeRate: number; // percentage
  avgRetard: number; // average delay in minutes for rides with delay
  // 6-week trend
  weeklyTrend: { week: string; conformeRate: number; total: number }[];
  // Tournee breakdown
  tourneeEcarts: { tourneeNumber: string; ecartCount: number; totalCourses: number }[];
  // Ecart type breakdown
  ecartTypeBreakdown: Record<EcartType, number>;
  // Gravite breakdown
  graviteBreakdown: Record<GraviteLevel, number>;
  // Reason breakdown
  reasonBreakdown: Record<EcartReason, number>;
  reasonCompletude: number; // % of reasons that are not 'non_renseigne'
}

export function getPlanVsRealData(): PlanVsRealSummary {
  // Use deterministic seed-like approach with index for consistent results
  const now = new Date();
  const pastCourses = planningCourses
    .filter(c => {
      const courseDate = new Date(c.date);
      return courseDate < now && c.assignmentStatus === 'affectee' && c.prestationType !== 'sup';
    })
    .slice(0, 80); // Larger sample for richer data

  const productMap: Record<string, 'CM' | 'SPL' | 'VL' | 'PO'> = {
    'Caisse mobile': 'CM', 'SPL': 'SPL', 'VL': 'VL', 'Semi-remorque': 'PO', 'Frigo': 'CM', 'ADR': 'SPL',
  };
  const codeArticles = ['ART-1001', 'ART-1023', 'ART-2045', 'ART-3067', 'ART-4089', 'ART-5012', 'ART-6034'];
  const ecartTypes: EcartType[] = ['conducteur', 'vehicule', 'horaire', 'lieu', 'annulation', 'date', 'rse'];
  const ecartReasons: EcartReason[] = [
    'absence_conducteur', 'panne_vehicule', 'probleme_site', 'annulation_demande_client',
    'annulation_operationnel_parnass', 'annulation_empechement_exterieur', 'retard_cascade',
    'alea_externe', 'retard_demarrage', 'modification_demande_client', 'non_renseigne',
  ];

  // Weighted distributions to match spec percentages
  // Ecart types: Conducteur 35%, Vehicule 25%, Horaire 20%, Lieu 10%, Annulation 10%
  const ecartTypeWeights: { type: EcartType; weight: number }[] = [
    { type: 'conducteur', weight: 35 }, { type: 'vehicule', weight: 25 },
    { type: 'horaire', weight: 20 }, { type: 'lieu', weight: 10 },
    { type: 'annulation', weight: 10 },
  ];
  const pickEcartType = (idx: number): EcartType => {
    const roll = ((idx * 17 + 7) % 100);
    let cumulative = 0;
    for (const w of ecartTypeWeights) {
      cumulative += w.weight;
      if (roll < cumulative) return w.type;
    }
    return 'horaire';
  };

  // Gravite: Mineur 52%, Majeur 38%, Annulé 10%
  const pickGravite = (idx: number, isCancelled: boolean): GraviteLevel => {
    if (isCancelled) return 'annule';
    const roll = ((idx * 31 + 13) % 100);
    if (roll < 52) return 'mineur';
    if (roll < 90) return 'majeur';
    return 'annule';
  };

  // Reason: weighted
  const reasonWeights: { reason: EcartReason; weight: number }[] = [
    { reason: 'absence_conducteur', weight: 28 }, { reason: 'panne_vehicule', weight: 22 },
    { reason: 'probleme_site', weight: 15 }, { reason: 'annulation_demande_client', weight: 10 },
    { reason: 'non_renseigne', weight: 25 },
  ];
  const pickReason = (idx: number, ecartType: EcartType): EcartReason => {
    if (ecartType === 'annulation') {
      const annulReasons: EcartReason[] = ['annulation_demande_client', 'annulation_operationnel_parnass', 'annulation_empechement_exterieur'];
      return annulReasons[idx % 3];
    }
    if (ecartType === 'conducteur') return idx % 3 === 0 ? 'non_renseigne' : 'absence_conducteur';
    if (ecartType === 'vehicule') return idx % 4 === 0 ? 'non_renseigne' : 'panne_vehicule';
    if (ecartType === 'horaire') {
      const hReasons: EcartReason[] = ['retard_cascade', 'alea_externe', 'retard_demarrage', 'non_renseigne'];
      return hReasons[idx % 4];
    }
    if (ecartType === 'lieu') return idx % 3 === 0 ? 'non_renseigne' : 'modification_demande_client';
    const roll = ((idx * 23 + 5) % 100);
    let cumulative = 0;
    for (const w of reasonWeights) {
      cumulative += w.weight;
      if (roll < cumulative) return w.reason;
    }
    return 'non_renseigne';
  };

  const entries: PlanVsRealEntry[] = pastCourses.map((c, idx) => {
    // Deterministic deviations using index
    const startDev = ((idx * 7 + 3) % 35) - 5; // -5 to +29 min
    const endDev = ((idx * 11 + 5) % 45) - 10; // -10 to +34 min
    const driverChanged = (idx * 13 + 2) % 8 === 0; // ~12.5%
    const vehicleChanged = (idx * 17 + 3) % 12 === 0; // ~8.3%
    const locationChanged = (idx * 19 + 1) % 20 === 0; // ~5%

    // ~18% non-conforme, ~82% conforme
    const isConforme = ((idx * 23 + 11) % 100) >= 18;

    let status: PlanVsRealEntry['status'] = 'on_time';
    let ecartType: EcartType | undefined;
    let gravite: GraviteLevel | undefined;
    let retardMinutes: number | undefined;

    if (!isConforme) {
      ecartType = pickEcartType(idx);
      if (ecartType === 'annulation') {
        status = 'cancelled';
        gravite = 'annule';
        retardMinutes = undefined;
      } else {
        gravite = pickGravite(idx, false);
        if (gravite === 'mineur') {
          status = 'minor_delay';
          retardMinutes = 5 + ((idx * 3) % 10); // 5-14 min (DHL orange zone)
        } else {
          status = 'major_delay';
          retardMinutes = 15 + ((idx * 7) % 30); // 15-44 min (DHL red zone)
        }
      }
    }

    const ecartReason = isConforme ? 'non_renseigne' : pickReason(idx, ecartType!);

    // Simulate actual times with deviations
    const [ph, pm] = c.startTime.split(':').map(Number);
    const [eh, em] = c.endTime.split(':').map(Number);
    const actualStartMin = isConforme ? ph * 60 + pm : ph * 60 + pm + (retardMinutes || startDev);
    const actualEndMin = isConforme ? eh * 60 + em : eh * 60 + em + (retardMinutes || endDev);
    const actualStartTime = `${String(Math.floor(Math.max(0, actualStartMin) / 60) % 24).padStart(2, '0')}:${String(Math.max(0, actualStartMin) % 60).padStart(2, '0')}`;
    const actualEndTime = `${String(Math.floor(Math.max(0, actualEndMin) / 60) % 24).padStart(2, '0')}:${String(Math.max(0, actualEndMin) % 60).padStart(2, '0')}`;

    const altDriver = driverChanged && !isConforme ? sample(drivers.filter(d => d.status === 'Actif')) : undefined;
    const altVehicle = vehicleChanged && !isConforme ? sample(allVehicleDetails.filter(v => v.statut === 'Disponible' || v.statut === 'En mission')) : undefined;

    return {
      courseId: c.id,
      client: c.client || 'N/A',
      date: c.date,
      tourneeId: c.tourneeId,
      tourneeNumber: c.tourneeNumber,
      product: productMap[c.requiredVehicleType] || 'CM',
      codeArticle: codeArticles[idx % codeArticles.length],
      planned: {
        startTime: c.startTime,
        endTime: c.endTime,
        startLocation: c.startLocation,
        endLocation: c.endLocation,
        driverName: c.assignedDriverName,
        vehicleImmat: c.assignedVehicleImmat,
      },
      actual: {
        startTime: status === 'cancelled' ? '—' : actualStartTime,
        endTime: status === 'cancelled' ? '—' : actualEndTime,
        startLocation: locationChanged ? 'Lieu modifié' : c.startLocation,
        endLocation: locationChanged ? 'Lieu modifié' : c.endLocation,
        driverName: (driverChanged && !isConforme) ? (altDriver?.name || c.assignedDriverName) : c.assignedDriverName,
        vehicleImmat: (vehicleChanged && !isConforme) ? (altVehicle?.immatriculation || c.assignedVehicleImmat) : c.assignedVehicleImmat,
      },
      deviations: {
        startTimeDeviation: isConforme ? 0 : (retardMinutes || startDev),
        endTimeDeviation: isConforme ? 0 : (retardMinutes || endDev),
        driverChanged: driverChanged && !isConforme,
        vehicleChanged: vehicleChanged && !isConforme,
        locationChanged: locationChanged && !isConforme,
      },
      status,
      ecartType,
      gravite,
      ecartReason,
      retardMinutes,
      isConforme,
    };
  });

  const conformeCount = entries.filter(e => e.isConforme).length;
  const ecartCount = entries.filter(e => !e.isConforme).length;
  const onTime = entries.filter(e => e.status === 'on_time').length;
  const minorDelay = entries.filter(e => e.status === 'minor_delay').length;
  const majorDelay = entries.filter(e => e.status === 'major_delay').length;
  const cancelled = entries.filter(e => e.status === 'cancelled').length;
  const modified = entries.filter(e => e.status === 'modified').length;

  const delayEntries = entries.filter(e => e.retardMinutes && e.retardMinutes > 0);
  const avgRetard = delayEntries.length > 0
    ? Math.round(delayEntries.reduce((s, e) => s + (e.retardMinutes || 0), 0) / delayEntries.length)
    : 0;

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

  // 6-week trend (simulated)
  const weeklyTrend: PlanVsRealSummary['weeklyTrend'] = [];
  for (let w = 5; w >= 0; w--) {
    const weekDate = addWeeks(now, -w);
    const weekLabel = `S${format(weekDate, 'w', { locale: fr })}`;
    const total = 130 + ((w * 17 + 3) % 40);
    const confRate = w === 0 ? Math.round((conformeCount / Math.max(entries.length, 1)) * 100) : (72 + ((w * 7) % 18));
    weeklyTrend.push({ week: weekLabel, conformeRate: confRate, total });
  }

  // Tournee écarts
  const tourneeMap = new Map<string, { ecartCount: number; totalCourses: number }>();
  entries.forEach(e => {
    const tNum = e.tourneeNumber || 'Sans tournée';
    if (!tourneeMap.has(tNum)) tourneeMap.set(tNum, { ecartCount: 0, totalCourses: 0 });
    const t = tourneeMap.get(tNum)!;
    t.totalCourses++;
    if (!e.isConforme) t.ecartCount++;
  });
  const tourneeEcarts = Array.from(tourneeMap.entries())
    .map(([tourneeNumber, d]) => ({ tourneeNumber, ...d }))
    .filter(t => t.ecartCount > 0)
    .sort((a, b) => b.ecartCount - a.ecartCount)
    .slice(0, 10);

  // Ecart type breakdown
  const ecartTypeBreakdown: Record<EcartType, number> = { conducteur: 0, vehicule: 0, horaire: 0, lieu: 0, annulation: 0, date: 0, rse: 0 };
  entries.filter(e => !e.isConforme && e.ecartType).forEach(e => {
    ecartTypeBreakdown[e.ecartType!]++;
  });

  // Gravite breakdown
  const graviteBreakdown: Record<GraviteLevel, number> = { mineur: 0, majeur: 0, annule: 0 };
  entries.filter(e => !e.isConforme && e.gravite).forEach(e => {
    graviteBreakdown[e.gravite!]++;
  });

  // Reason breakdown
  const reasonBreakdown: Record<EcartReason, number> = {
    absence_conducteur: 0, panne_vehicule: 0, probleme_site: 0,
    annulation_demande_client: 0, annulation_operationnel_parnass: 0, annulation_empechement_exterieur: 0,
    retard_cascade: 0, alea_externe: 0, retard_demarrage: 0,
    modification_demande_client: 0, ecart_rse: 0, non_renseigne: 0,
  };
  entries.filter(e => !e.isConforme).forEach(e => {
    reasonBreakdown[e.ecartReason]++;
  });
  const totalNonConf = ecartCount || 1;
  const reasonCompletude = Math.round(((totalNonConf - (reasonBreakdown.non_renseigne || 0)) / totalNonConf) * 100);

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
    conformeCount,
    ecartCount,
    conformeRate: entries.length > 0 ? Math.round((conformeCount / entries.length) * 100) : 100,
    avgRetard,
    weeklyTrend,
    tourneeEcarts,
    ecartTypeBreakdown,
    graviteBreakdown,
    reasonBreakdown,
    reasonCompletude,
  };
}


import { 
  Course,
  WeeklyAssignmentCount, 
  AssignmentConstraintResult,
  ResourceCompatibility,
  Driver,
  Vehicle
} from './types';
import { Trip } from './types';
import { getWeek } from 'date-fns';

/**
 * Normalizes a trajet identifier from course
 * Creates a consistent ID like "Lyon->Paris->Marseille" for tracking
 */
export function normalizeTrajetId(course: Course): string {
  const locations = [
    course.startLocation,
    ...(course.intermediateLocations || []),
    course.endLocation
  ];
  return locations.join('->');
}

/**
 * Gets the week number in YYYY-WW format
 */
export function getWeekKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (!d || isNaN(d.getTime())) {
    // Fallback to current week if date is invalid
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeek(now, { weekStartsOn: 1 });
    return `${year}-W${String(week).padStart(2, '0')}`;
  }
  
  const year = d.getFullYear();
  const week = getWeek(d, { weekStartsOn: 1 });
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * Checks if a chauffeur can be assigned to a trajet based on weekly repetition limit
 * Rule: Same chauffeur can do same trajet max 5 times per week
 * Warning at 4, hard limit at 5
 */
export function checkWeeklyTrajetLimit(
  chauffeurId: string,
  course: Course,
  existingTrips: Trip[],
  weeklyAssignments: WeeklyAssignmentCount[]
): AssignmentConstraintResult {
  const trajetId = normalizeTrajetId(course);
  const weekKey = getWeekKey(course.date);
  
  // Find existing count for this chauffeur-trajet-week combination
  const existingCount = weeklyAssignments.find(
    wa => wa.chauffeurId === chauffeurId && 
          wa.trajetId === trajetId && 
          wa.week === weekKey
  )?.count || 0;

  // Also count from existing trips
  const tripsCount = existingTrips.filter(trip => {
    if (trip.driverId !== chauffeurId) return false;
    const tripWeek = getWeekKey(trip.plannedStart);
    if (tripWeek !== weekKey) return false;
    
    // Check if trip matches the trajet (simplified - in real app would need better matching)
    const tripTrajet = `${trip.pickupLocation}->${trip.deliveryLocation}`;
    const courseTrajet = normalizeTrajetId(course);
    return tripTrajet === courseTrajet || tripTrajet.includes(course.startLocation);
  }).length;

  const totalCount = existingCount + tripsCount;

  if (totalCount >= 5) {
    return {
      allowed: false,
      currentCount: totalCount,
      maxCount: 5,
      warning: false,
      message: `Limite atteinte: ce chauffeur a déjà effectué ce trajet ${totalCount} fois cette semaine (max: 5)`
    };
  }

  if (totalCount >= 4) {
    return {
      allowed: true,
      currentCount: totalCount,
      maxCount: 5,
      warning: true,
      message: `Attention: ce chauffeur a déjà effectué ce trajet ${totalCount} fois cette semaine (limite: 5)`
    };
  }

  return {
    allowed: true,
    currentCount: totalCount,
    maxCount: 5,
    warning: false,
    message: `Ce chauffeur a effectué ce trajet ${totalCount} fois cette semaine`
  };
}

/**
 * Checks resource compatibility between course requirements and available resources
 */
export function checkResourceCompatibility(
  course: Course,
  vehicle: Vehicle,
  driver: Driver
): ResourceCompatibility {
  const vehicleIssues: string[] = [];
  const driverIssues: string[] = [];

  // Vehicle type compatibility
  // Note: In a real app, vehicles would have a type field. For now, we'll do a simplified check.
  // This is a placeholder - actual implementation would check vehicle.type against course.requiredVehicleType
  // For MVP, we'll assume compatibility if vehicle status is available
  // In production, you'd have: if (vehicle.type !== course.requiredVehicleType) { ... }

  // Vehicle energy compatibility
  if (course.requiredVehicleEnergy && (vehicle as any).energie !== course.requiredVehicleEnergy) {
    vehicleIssues.push(`Énergie requise: ${course.requiredVehicleEnergy}`);
  }

  // Vehicle equipment compatibility (simplified - would need vehicle equipment data)
  if (course.requiredVehicleEquipment && course.requiredVehicleEquipment.length > 0) {
    // In real app, would check vehicle.equipment array
    // For now, we'll just note it
    if (course.requiredVehicleEquipment.includes('ADR') && !course.requiredVehicleType.includes('ADR')) {
      vehicleIssues.push('Équipement ADR requis');
    }
  }

  // Driver type compatibility
  if (course.requiredDriverType && driver.driverType !== course.requiredDriverType) {
    driverIssues.push(`Type de chauffeur requis: ${course.requiredDriverType} (actuel: ${driver.driverType || 'Non spécifié'})`);
  }

  // Driver skills compatibility
  // Note: In real app, driver would have a skills array. For now, we'll infer from driverType
  const driverSkillMap: Record<string, string[]> = {
    'CM': ['ADR'], // Simplified
    'SPL': ['ADR', 'Aéroportuaire'],
    'Polyvalent': ['ADR', 'Aéroportuaire', 'Habilitation sûreté'],
    'VL': []
  };

  const driverSkills = driverSkillMap[driver.driverType || ''] || [];
  const missingSkills = course.requiredDriverSkills.filter(skill => !driverSkills.includes(skill));
  
  if (missingSkills.length > 0) {
    driverIssues.push(`Compétences requises manquantes: ${missingSkills.join(', ')}`);
  }

  // Driver status check
  if (driver.status !== 'Actif') {
    driverIssues.push(`Chauffeur non disponible (statut: ${driver.status})`);
  }

  // Vehicle status check
  if (vehicle.status !== 'Disponible' && vehicle.status !== 'En mission') {
    vehicleIssues.push(`Véhicule non disponible (statut: ${vehicle.status})`);
  }

  const vehicleCompatible = vehicleIssues.length === 0;
  const driverCompatible = driverIssues.length === 0;
  const overallCompatible = vehicleCompatible && driverCompatible;

  return {
    vehicleCompatible,
    driverCompatible,
    vehicleIssues,
    driverIssues,
    overallCompatible
  };
}

/**
 * Validates if a course can be assigned to given resources
 * Returns comprehensive validation result
 */
export function validateAssignment(
  course: Course,
  vehicle: Vehicle,
  driver: Driver,
  existingTrips: Trip[],
  weeklyAssignments: WeeklyAssignmentCount[]
): {
  valid: boolean;
  weeklyLimit: AssignmentConstraintResult;
  compatibility: ResourceCompatibility;
  errors: string[];
  warnings: string[];
} {
  const weeklyLimit = checkWeeklyTrajetLimit(driver.id, course, existingTrips, weeklyAssignments);
  const compatibility = checkResourceCompatibility(course, vehicle, driver);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!weeklyLimit.allowed) {
    errors.push(weeklyLimit.message || 'Limite hebdomadaire dépassée');
  } else if (weeklyLimit.warning) {
    warnings.push(weeklyLimit.message || 'Limite hebdomadaire approchée');
  }

  if (!compatibility.vehicleCompatible) {
    errors.push(...compatibility.vehicleIssues);
  }

  if (!compatibility.driverCompatible) {
    errors.push(...compatibility.driverIssues);
  }

  return {
    valid: errors.length === 0,
    weeklyLimit,
    compatibility,
    errors,
    warnings
  };
}

/**
 * Checks if a course is a multi-destination trajet
 */
export function isMultiDestinationTrajet(course: Course): boolean {
  return (course.intermediateLocations?.length || 0) > 0;
}

/**
 * Checks if a course is a multi-point trajet (has segments)
 */
export function isMultiPointTrajet(course: Course): boolean {
  return (course.segments?.length || 0) > 1;
}

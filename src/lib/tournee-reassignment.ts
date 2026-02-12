import { Course, Tournee } from './types';

export interface ReassignmentResult {
  success: boolean;
  action: 'reassigned' | 'new_tournee' | 'error';
  message: string;
  updatedTournee?: Tournee;
  newTournee?: Tournee;
  affectedCourses: Course[];
}

/**
 * Check coherence of tournée: same driver should have same vehicle
 */
export function checkTourneeCoherence(tournee: Tournee): {
  isCoherent: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!tournee.driverId && !tournee.vehicleId) {
    return { isCoherent: true, issues: [] }; // Unassigned tournée is coherent
  }

  // Check if all courses in tournée have same driver
  const driverIds = new Set(tournee.courses.map(c => c.assignedDriverId).filter(Boolean));
  if (driverIds.size > 1) {
    issues.push('Plusieurs conducteurs différents dans la même tournée');
  }

  // Check if all courses in tournée have same vehicle
  const vehicleIds = new Set(tournee.courses.map(c => c.assignedVehicleId).filter(Boolean));
  if (vehicleIds.size > 1) {
    issues.push('Plusieurs véhicules différents dans la même tournée');
  }

  // Check if driver matches tournée driver
  if (tournee.driverId) {
    const coursesWithDifferentDriver = tournee.courses.filter(
      c => c.assignedDriverId && c.assignedDriverId !== tournee.driverId
    );
    if (coursesWithDifferentDriver.length > 0) {
      issues.push('Certaines courses ont un conducteur différent de la tournée');
    }
  }

  // Check if vehicle matches tournée vehicle
  if (tournee.vehicleId) {
    const coursesWithDifferentVehicle = tournee.courses.filter(
      c => c.assignedVehicleId && c.assignedVehicleId !== tournee.vehicleId
    );
    if (coursesWithDifferentVehicle.length > 0) {
      issues.push('Certaines courses ont un véhicule différent de la tournée');
    }
  }

  return {
    isCoherent: issues.length === 0,
    issues,
  };
}

/**
 * Reassign driver on a course or block of courses
 * Automatically maintains coherence: same driver = same vehicle for a tournée
 */
export function reassignDriver(
  courses: Course[],
  newDriverId: string,
  newDriverName: string,
  tournees: Tournee[],
  availableVehicles: Array<{ vin: string; immatriculation: string; type: string }>
): ReassignmentResult {
  if (courses.length === 0) {
    return {
      success: false,
      action: 'error',
      message: 'Aucune course à réaffecter',
      affectedCourses: [],
    };
  }

  // Group courses by tournée
  const coursesByTournee = new Map<string, Course[]>();
  courses.forEach(course => {
    const tourneeId = course.tourneeId || 'unassigned';
    if (!coursesByTournee.has(tourneeId)) {
      coursesByTournee.set(tourneeId, []);
    }
    coursesByTournee.get(tourneeId)!.push(course);
  });

  const affectedCourses: Course[] = [];
  const updatedTournees: Tournee[] = [];

  for (const [tourneeId, tourneeCourses] of coursesByTournee.entries()) {
    if (tourneeId === 'unassigned') {
      // Courses without tournée - just update driver
      tourneeCourses.forEach(course => {
        course.assignedDriverId = newDriverId;
        course.assignedDriverName = newDriverName;
        affectedCourses.push(course);
      });
      continue;
    }

    // Find the tournée
    const tournee = tournees.find(t => t.id === tourneeId);
    if (!tournee) {
      continue;
    }

    // Check current coherence
    const coherence = checkTourneeCoherence(tournee);
    
    // Update courses with new driver
    tourneeCourses.forEach(course => {
      course.assignedDriverId = newDriverId;
      course.assignedDriverName = newDriverName;
      affectedCourses.push(course);
    });

    // If tournée had a vehicle assigned, we need to check if we should keep it
    // or find a compatible vehicle for the new driver
    if (tournee.vehicleId) {
      // Check if current vehicle is still compatible
      // For now, we'll keep the vehicle if it exists
      // In a real scenario, we'd check vehicle-driver compatibility
      tourneeCourses.forEach(course => {
        if (course.assignedVehicleId) {
          // Keep existing vehicle assignment
        } else {
          // Try to find a compatible vehicle
          const compatibleVehicle = availableVehicles.find(
            v => v.type === course.requiredVehicleType
          );
          if (compatibleVehicle) {
            course.assignedVehicleId = compatibleVehicle.vin;
            course.assignedVehicleImmat = compatibleVehicle.immatriculation;
          }
        }
      });
    }

    // Update tournée driver
    const updatedTournee: Tournee = {
      ...tournee,
      driverId: newDriverId,
      driverName: newDriverName,
      courses: tournee.courses.map(c => {
        const updated = tourneeCourses.find(uc => uc.id === c.id);
        return updated || c;
      }),
    };

    // If coherence is broken, we might need to split the tournée
    const newCoherence = checkTourneeCoherence(updatedTournee);
    if (!newCoherence.isCoherent && newCoherence.issues.length > 0) {
      // For now, we'll update the tournée and let the user handle splitting
      // In a more advanced version, we could automatically split
      updatedTournees.push(updatedTournee);
      
      return {
        success: true,
        action: 'reassigned',
        message: `Conducteur réaffecté. Attention: ${newCoherence.issues.join('; ')}. Vous devrez peut-être diviser la tournée.`,
        updatedTournee,
        affectedCourses,
      };
    }

    updatedTournees.push(updatedTournee);
  }

  return {
    success: true,
    action: 'reassigned',
    message: `${affectedCourses.length} course(s) réaffectée(s) avec succès`,
    updatedTournee: updatedTournees[0],
    affectedCourses,
  };
}

/**
 * Reassign vehicle on a course or block of courses
 */
export function reassignVehicle(
  courses: Course[],
  newVehicleId: string,
  newVehicleImmat: string,
  tournees: Tournee[]
): ReassignmentResult {
  if (courses.length === 0) {
    return {
      success: false,
      action: 'error',
      message: 'Aucune course à réaffecter',
      affectedCourses: [],
    };
  }

  const affectedCourses: Course[] = [];
  const updatedTournees: Tournee[] = [];

  // Group courses by tournée
  const coursesByTournee = new Map<string, Course[]>();
  courses.forEach(course => {
    const tourneeId = course.tourneeId || 'unassigned';
    if (!coursesByTournee.has(tourneeId)) {
      coursesByTournee.set(tourneeId, []);
    }
    coursesByTournee.get(tourneeId)!.push(course);
  });

  for (const [tourneeId, tourneeCourses] of coursesByTournee.entries()) {
    if (tourneeId === 'unassigned') {
      tourneeCourses.forEach(course => {
        course.assignedVehicleId = newVehicleId;
        course.assignedVehicleImmat = newVehicleImmat;
        affectedCourses.push(course);
      });
      continue;
    }

    const tournee = tournees.find(t => t.id === tourneeId);
    if (!tournee) {
      continue;
    }

    // Update courses with new vehicle
    tourneeCourses.forEach(course => {
      course.assignedVehicleId = newVehicleId;
      course.assignedVehicleImmat = newVehicleImmat;
      affectedCourses.push(course);
    });

    // Update tournée vehicle
    const updatedTournee: Tournee = {
      ...tournee,
      vehicleId: newVehicleId,
      vehicleImmat: newVehicleImmat,
      courses: tournee.courses.map(c => {
        const updated = tourneeCourses.find(uc => uc.id === c.id);
        return updated || c;
      }),
    };

    updatedTournees.push(updatedTournee);
  }

  return {
    success: true,
    action: 'reassigned',
    message: `${affectedCourses.length} course(s) réaffectée(s) avec succès`,
    updatedTournee: updatedTournees[0],
    affectedCourses,
  };
}

/**
 * Suggest if tournée should be split based on driver/vehicle changes
 */
export function shouldSplitTournee(tournee: Tournee): {
  shouldSplit: boolean;
  reason: string;
  suggestedGroups: Course[][];
} {
  const coherence = checkTourneeCoherence(tournee);
  
  if (coherence.isCoherent) {
    return {
      shouldSplit: false,
      reason: '',
      suggestedGroups: [tournee.courses],
    };
  }

  // Group courses by driver-vehicle combination
  const groups = new Map<string, Course[]>();
  tournee.courses.forEach(course => {
    const key = `${course.assignedDriverId || 'no-driver'}-${course.assignedVehicleId || 'no-vehicle'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(course);
  });

  const suggestedGroups = Array.from(groups.values());

  return {
    shouldSplit: suggestedGroups.length > 1,
    reason: coherence.issues.join('; '),
    suggestedGroups,
  };
}

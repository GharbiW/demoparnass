/**
 * Standardized status vocabulary utilities
 * 
 * Standard vocabulary:
 * - non_affectee: Aucune ressource assignée
 * - partiellement_affectee: Conducteur OU véhicule (pas les deux)
 * - affectee: Conducteur ET véhicule assignés
 * - publiee: Planning publié (gelé)
 */

export type StandardStatus = 'non_affectee' | 'partiellement_affectee' | 'affectee';
export type LegacyStatus = 'unassigned' | 'partial' | 'assigned';

/**
 * Convert legacy status to standard status
 */
export function toStandardStatus(status: LegacyStatus | StandardStatus): StandardStatus {
  if (status === 'non_affectee' || status === 'partiellement_affectee' || status === 'affectee') {
    return status;
  }
  
  switch (status) {
    case 'unassigned':
      return 'non_affectee';
    case 'partial':
      return 'partiellement_affectee';
    case 'assigned':
      return 'affectee';
    default:
      return 'non_affectee';
  }
}

/**
 * Get display label for status
 */
export function getStatusLabel(status: StandardStatus | LegacyStatus): string {
  const standard = toStandardStatus(status);
  switch (standard) {
    case 'non_affectee':
      return 'Non affectée';
    case 'partiellement_affectee':
      return 'Partiellement affectée';
    case 'affectee':
      return 'Affectée';
  }
}

/**
 * Check if status is assigned (both driver and vehicle)
 */
export function isFullyAssigned(status: StandardStatus | LegacyStatus): boolean {
  return toStandardStatus(status) === 'affectee';
}

/**
 * Check if status is unassigned (no resources)
 */
export function isUnassigned(status: StandardStatus | LegacyStatus): boolean {
  return toStandardStatus(status) === 'non_affectee';
}

/**
 * Check if status is partial (only one resource)
 */
export function isPartiallyAssigned(status: StandardStatus | LegacyStatus): boolean {
  return toStandardStatus(status) === 'partiellement_affectee';
}

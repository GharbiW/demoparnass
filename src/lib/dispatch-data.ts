
// This file is now deprecated. Trip data has been centralized in src/lib/planning-data.ts
// and is now accessed via the mockDataService.
// This file is kept for now to avoid breaking imports but should be removed in a future cleanup.

import { Trip } from './types';

export const regularTrips: Trip[] = [];
export const expressTrips: Trip[] = [];

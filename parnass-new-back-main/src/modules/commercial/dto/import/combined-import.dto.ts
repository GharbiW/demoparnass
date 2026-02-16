import { ImportError } from '../../../shared/dto/import-result.dto';

/**
 * Result for a single entity type in a combined import
 */
export interface EntityImportResult {
  success: number;
  errors: ImportError[];
  createdIds: string[];
}

/**
 * Result for the Clients Package import (Clients + Addresses + Contacts)
 * Also used for Client Full Import (Addresses + Contacts + Contracts + Prestations for existing client)
 */
export interface ClientsPackageImportResult {
  clients?: EntityImportResult;
  addresses?: EntityImportResult;
  contacts?: EntityImportResult;
  contracts?: EntityImportResult;
  prestations?: EntityImportResult;
  totalSuccess: number;
  totalErrors: number;
}

/**
 * Result for the Contracts Package import (Contracts + Prestations + Rides)
 */
export interface ContractsPackageImportResult {
  contracts?: EntityImportResult;
  prestations?: EntityImportResult;
  rides?: EntityImportResult;
  totalSuccess: number;
  totalErrors: number;
}

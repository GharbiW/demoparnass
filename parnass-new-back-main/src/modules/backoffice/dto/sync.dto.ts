import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsUUID,
} from 'class-validator';

// ============================================
// Sync DTOs
// ============================================

/**
 * Response DTO for a sync operation result
 */
export class SyncResultDto {
  @IsString()
  @IsIn(['drivers', 'vehicles', 'all'])
  entityType: string;

  @IsString()
  @IsIn(['completed', 'failed'])
  status: string;

  @IsNumber()
  recordsSynced: number;

  @IsNumber()
  recordsCreated: number;

  @IsNumber()
  recordsUpdated: number;

  @IsString()
  startedAt: string;

  @IsString()
  completedAt: string;

  @IsNumber()
  durationMs: number;

  @IsString()
  @IsOptional()
  errorMessage?: string;
}

/**
 * Response DTO for sync status
 */
export class SyncStatusDto {
  @IsOptional()
  drivers?: {
    lastSyncAt: string;
    lastSyncStatus: string;
    recordsCount: number;
  };

  @IsOptional()
  vehicles?: {
    lastSyncAt: string;
    lastSyncStatus: string;
    recordsCount: number;
  };

  @IsOptional()
  currentSync?: {
    entityType: string;
    status: string;
    startedAt: string;
    recordsSynced: number;
  };
}

/**
 * Sync history entry DTO
 */
export class SyncHistoryEntryDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsIn(['drivers', 'vehicles', 'all'])
  entityType: string;

  @IsString()
  @IsIn(['pending', 'in_progress', 'completed', 'failed'])
  status: string;

  @IsString()
  startedAt: string;

  @IsString()
  @IsOptional()
  completedAt?: string;

  @IsNumber()
  recordsSynced: number;

  @IsNumber()
  recordsCreated: number;

  @IsNumber()
  recordsUpdated: number;

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsString()
  @IsOptional()
  triggeredBy?: string;
}

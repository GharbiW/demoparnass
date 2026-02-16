import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsArray,
  IsIn,
  IsDateString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Planning Course DTOs
// ============================================

export class CreateCourseDto {
  @IsUUID()
  @IsOptional()
  prestationId?: string;

  @IsUUID()
  @IsOptional()
  tourneeId?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime?: string;

  @IsString()
  @IsOptional()
  startLocation?: string;

  @IsString()
  @IsOptional()
  endLocation?: string;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  prestationReference?: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsOptional()
  driverName?: string;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  vehicleImmat?: string;

  @IsBoolean()
  @IsOptional()
  isSensitive?: boolean;

  @IsBoolean()
  @IsOptional()
  isSup?: boolean;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  vehicleEnergy?: string;

  @IsString()
  @IsOptional()
  driverType?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredSkills?: string[];

  @IsString()
  @IsOptional()
  site?: string;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class UpdateCourseDto {
  @IsUUID()
  @IsOptional()
  tourneeId?: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsOptional()
  driverName?: string;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  vehicleImmat?: string;

  @IsString()
  @IsOptional()
  @IsIn(['affectee', 'partiellement_affectee', 'non_affectee'])
  assignmentStatus?: string;

  @IsString()
  @IsOptional()
  nonPlacementReason?: string;

  @IsString()
  @IsOptional()
  missingResource?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime?: string;

  @IsString()
  @IsOptional()
  comments?: string;

  // Actual execution data
  @IsString()
  @IsOptional()
  actualStartTime?: string;

  @IsString()
  @IsOptional()
  actualEndTime?: string;

  @IsUUID()
  @IsOptional()
  actualDriverId?: string;

  @IsUUID()
  @IsOptional()
  actualVehicleId?: string;
}

// ============================================
// Planning Tournee DTOs
// ============================================

export class CreateTourneeDto {
  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  site?: string;

  @IsDateString()
  @IsNotEmpty()
  weekStart: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  energy?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTourneeDto {
  @IsString()
  @IsOptional()
  site?: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  energy?: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ============================================
// Generate / Publish DTOs
// ============================================

export class GenerateCoursesDto {
  @IsDateString()
  @IsNotEmpty()
  weekStart: string;
}

export class PublishPlanningDto {
  @IsDateString()
  @IsNotEmpty()
  weekStart: string;

  @IsString()
  @IsOptional()
  publishedBy?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ============================================
// Query DTOs
// ============================================

export class ListCoursesQueryDto {
  @IsDateString()
  @IsOptional()
  weekStart?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  @IsIn(['affectee', 'partiellement_affectee', 'non_affectee'])
  assignmentStatus?: string;

  @IsUUID()
  @IsOptional()
  tourneeId?: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

export class ListTourneesQueryDto {
  @IsDateString()
  @IsOptional()
  weekStart?: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

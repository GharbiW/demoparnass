import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateTourneeDto,
  UpdateTourneeDto,
  GenerateCoursesDto,
  PublishPlanningDto,
  ListCoursesQueryDto,
  ListTourneesQueryDto,
} from '../dto/planning.dto';

@Injectable()
export class PlanningService {
  private readonly logger = new Logger(PlanningService.name);
  private get supabase() {
    return this.supabaseService.getClient();
  }

  constructor(private readonly supabaseService: SupabaseService) {}

  // ============================================
  // Courses CRUD
  // ============================================

  async findAllCourses(query: ListCoursesQueryDto = {}) {
    let qb = this.supabase
      .from('planning_course')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (query.weekStart) {
      const weekEnd = this.addDays(query.weekStart, 6);
      qb = qb.gte('date', query.weekStart).lte('date', weekEnd);
    }
    if (query.dateFrom) qb = qb.gte('date', query.dateFrom);
    if (query.dateTo) qb = qb.lte('date', query.dateTo);
    if (query.assignmentStatus) qb = qb.eq('assignment_status', query.assignmentStatus);
    if (query.tourneeId) qb = qb.eq('tournee_id', query.tourneeId);
    if (query.driverId) qb = qb.eq('driver_id', query.driverId);
    if (query.search) {
      qb = qb.or(
        `client_name.ilike.%${query.search}%,prestation_reference.ilike.%${query.search}%,start_location.ilike.%${query.search}%,end_location.ilike.%${query.search}%`,
      );
    }
    if (query.limit) qb = qb.limit(query.limit);
    if (query.offset) qb = qb.range(query.offset, query.offset + (query.limit || 50) - 1);

    const { data, error } = await qb;
    if (error) {
      this.logger.error('Error fetching courses', error);
      throw new BadRequestException(error.message);
    }
    return (data || []).map((c: any) => this.transformCourse(c));
  }

  async findOneCourse(id: string) {
    const { data, error } = await this.supabase
      .from('planning_course')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException(`Course ${id} not found`);
      throw new BadRequestException(error.message);
    }
    return this.transformCourse(data);
  }

  async createCourse(dto: CreateCourseDto) {
    const row = this.courseDtoToDb(dto);

    // Compute assignment_status based on driver + vehicle
    row.assignment_status = this.computeAssignmentStatus(row.driver_id, row.vehicle_id);

    const { data, error } = await this.supabase
      .from('planning_course')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error creating course', error);
      throw new BadRequestException(error.message);
    }
    return this.transformCourse(data);
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.findOneCourse(id); // ensure exists

    const row: any = {};
    if (dto.tourneeId !== undefined) row.tournee_id = dto.tourneeId;
    if (dto.driverId !== undefined) row.driver_id = dto.driverId;
    if (dto.driverName !== undefined) row.driver_name = dto.driverName;
    if (dto.vehicleId !== undefined) row.vehicle_id = dto.vehicleId;
    if (dto.vehicleImmat !== undefined) row.vehicle_immat = dto.vehicleImmat;
    if (dto.assignmentStatus !== undefined) row.assignment_status = dto.assignmentStatus;
    if (dto.nonPlacementReason !== undefined) row.non_placement_reason = dto.nonPlacementReason;
    if (dto.missingResource !== undefined) row.missing_resource = dto.missingResource;
    if (dto.startTime !== undefined) row.start_time = dto.startTime;
    if (dto.endTime !== undefined) row.end_time = dto.endTime;
    if (dto.comments !== undefined) row.comments = dto.comments;
    if (dto.actualStartTime !== undefined) row.actual_start_time = dto.actualStartTime;
    if (dto.actualEndTime !== undefined) row.actual_end_time = dto.actualEndTime;
    if (dto.actualDriverId !== undefined) row.actual_driver_id = dto.actualDriverId;
    if (dto.actualVehicleId !== undefined) row.actual_vehicle_id = dto.actualVehicleId;

    // Auto-recompute assignment_status if driver or vehicle changed
    if (dto.driverId !== undefined || dto.vehicleId !== undefined) {
      // Fetch current row to get the other field if only one changed
      const current = await this.findOneCourse(id);
      const dId = dto.driverId !== undefined ? dto.driverId : current.driverId;
      const vId = dto.vehicleId !== undefined ? dto.vehicleId : current.vehicleId;
      row.assignment_status = this.computeAssignmentStatus(dId, vId);
      // Clear non-placement fields if fully assigned
      if (row.assignment_status === 'affectee') {
        row.non_placement_reason = null;
        row.missing_resource = null;
      }
    }

    const { data, error } = await this.supabase
      .from('planning_course')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error updating course', error);
      throw new BadRequestException(error.message);
    }
    return this.transformCourse(data);
  }

  async deleteCourse(id: string) {
    const { error } = await this.supabase
      .from('planning_course')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Course deleted' };
  }

  // ============================================
  // Tournees CRUD
  // ============================================

  async findAllTournees(query: ListTourneesQueryDto = {}) {
    let qb = this.supabase
      .from('planning_tournee')
      .select('*')
      .order('created_at', { ascending: false });

    if (query.weekStart) qb = qb.eq('week_start', query.weekStart);
    if (query.status) qb = qb.eq('status', query.status);
    if (query.search) {
      qb = qb.or(`reference.ilike.%${query.search}%,site.ilike.%${query.search}%`);
    }
    if (query.limit) qb = qb.limit(query.limit);
    if (query.offset) qb = qb.range(query.offset, query.offset + (query.limit || 50) - 1);

    const { data, error } = await qb;
    if (error) {
      this.logger.error('Error fetching tournees', error);
      throw new BadRequestException(error.message);
    }
    return (data || []).map((t: any) => this.transformTournee(t));
  }

  async findOneTournee(id: string) {
    const { data, error } = await this.supabase
      .from('planning_tournee')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException(`Tournee ${id} not found`);
      throw new BadRequestException(error.message);
    }
    return this.transformTournee(data);
  }

  async createTournee(dto: CreateTourneeDto) {
    const row: any = {
      week_start: dto.weekStart,
    };
    if (dto.reference) row.reference = dto.reference;
    if (dto.site) row.site = dto.site;
    if (dto.driverId) row.driver_id = dto.driverId;
    if (dto.vehicleId) row.vehicle_id = dto.vehicleId;
    if (dto.vehicleType) row.vehicle_type = dto.vehicleType;
    if (dto.energy) row.energy = dto.energy;
    if (dto.notes) row.notes = dto.notes;

    const { data, error } = await this.supabase
      .from('planning_tournee')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error creating tournee', error);
      throw new BadRequestException(error.message);
    }
    return this.transformTournee(data);
  }

  async updateTournee(id: string, dto: UpdateTourneeDto) {
    await this.findOneTournee(id);

    const row: any = {};
    if (dto.site !== undefined) row.site = dto.site;
    if (dto.driverId !== undefined) row.driver_id = dto.driverId;
    if (dto.vehicleId !== undefined) row.vehicle_id = dto.vehicleId;
    if (dto.vehicleType !== undefined) row.vehicle_type = dto.vehicleType;
    if (dto.energy !== undefined) row.energy = dto.energy;
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.notes !== undefined) row.notes = dto.notes;

    const { data, error } = await this.supabase
      .from('planning_tournee')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error updating tournee', error);
      throw new BadRequestException(error.message);
    }
    return this.transformTournee(data);
  }

  async deleteTournee(id: string) {
    const { error } = await this.supabase
      .from('planning_tournee')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Tournee deleted' };
  }

  // ============================================
  // Generate courses from prestations
  // ============================================

  async generateCoursesForWeek(dto: GenerateCoursesDto) {
    const weekStart = dto.weekStart;
    const weekEnd = this.addDays(weekStart, 6);
    this.logger.log(`Generating courses for week ${weekStart} to ${weekEnd}`);

    // Day-name to day-offset map (Monday=0 ... Sunday=6)
    const dayNameToOffset: Record<string, number> = {
      'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3,
      'Vendredi': 4, 'Samedi': 5, 'Dimanche': 6,
    };

    // 1. Fetch all active prestations with contract+client info
    const { data: prestations, error: pError } = await this.supabase
      .from('prestation')
      .select(`
        *,
        contract:contract_id (
          id, reference, name,
          client:client_id (id, name, reference)
        )
      `)
      .eq('status', 'active');

    if (pError) {
      this.logger.error('Error fetching prestations for generation', pError);
      throw new BadRequestException(pError.message);
    }

    // 2. Fetch all address IDs used in etapes
    const allAddrIds = new Set<string>();
    (prestations || []).forEach((p: any) => {
      if (p.etapes && Array.isArray(p.etapes)) {
        p.etapes.forEach((e: any) => {
          if (typeof e === 'string') allAddrIds.add(e);
          else if (e?.address_depart) allAddrIds.add(e.address_depart);
          if (e?.address_arrivee) allAddrIds.add(e.address_arrivee);
          if (e?.address_id) allAddrIds.add(e.address_id);
        });
      }
    });

    const addressMap = new Map<string, any>();
    if (allAddrIds.size > 0) {
      const { data: addresses } = await this.supabase
        .from('address')
        .select('id, name, address, city')
        .in('id', Array.from(allAddrIds));
      (addresses || []).forEach((a: any) => addressMap.set(a.id, a));
    }

    // 3. Check which courses already exist for this week to avoid duplicates
    const { data: existingCourses } = await this.supabase
      .from('planning_course')
      .select('prestation_id, date')
      .gte('date', weekStart)
      .lte('date', weekEnd);

    const existingKeys = new Set<string>();
    (existingCourses || []).forEach((c: any) => {
      existingKeys.add(`${c.prestation_id}_${c.date}`);
    });

    // 4. Generate course rows
    const coursesToInsert: any[] = [];

    for (const p of (prestations || [])) {
      const frequence: string[] = p.frequence || [];
      if (frequence.length === 0) continue;

      const clientName = p.contract?.client?.name || 'Client inconnu';
      const prestRef = p.reference_client || p.reference;

      // Get first and last address from etapes for start/end location
      let startLoc = '';
      let endLoc = '';
      const etapes = p.etapes || [];

      if (etapes.length > 0) {
        const firstEtape = etapes[0];
        const lastEtape = etapes[etapes.length - 1];

        const getAddrLabel = (addrId: string | undefined) => {
          if (!addrId) return '';
          const a = addressMap.get(addrId);
          return a ? `${a.name || a.address || ''} ${a.city || ''}`.trim() : '';
        };

        if (typeof firstEtape === 'string') {
          startLoc = getAddrLabel(firstEtape);
        } else {
          startLoc = getAddrLabel(firstEtape.address_depart || firstEtape.address_id);
        }
        if (typeof lastEtape === 'string') {
          endLoc = getAddrLabel(lastEtape);
        } else {
          endLoc = getAddrLabel(lastEtape.address_arrivee || lastEtape.address_id);
        }
      }

      // For each day in the frequence, create a course
      for (const dayName of frequence) {
        const offset = dayNameToOffset[dayName];
        if (offset === undefined) continue;

        const courseDate = this.addDays(weekStart, offset);
        const key = `${p.id}_${courseDate}`;
        if (existingKeys.has(key)) continue; // skip duplicates

        coursesToInsert.push({
          prestation_id: p.id,
          date: courseDate,
          start_time: p.heure_depart || null,
          end_time: p.heure_arrivee || null,
          start_location: startLoc,
          end_location: endLoc,
          client_name: clientName,
          prestation_reference: prestRef,
          is_sensitive: p.sensible || false,
          is_sup: p.type_demande === 'SUP',
          vehicle_type: p.typologie_vehicule || null,
          vehicle_energy: p.energie_imposee || null,
          assignment_status: 'non_affectee',
          site: null,
        });
      }
    }

    if (coursesToInsert.length === 0) {
      return { generated: 0, message: 'No new courses to generate' };
    }

    // 5. Bulk insert
    const { data: inserted, error: insertError } = await this.supabase
      .from('planning_course')
      .insert(coursesToInsert)
      .select('id');

    if (insertError) {
      this.logger.error('Error inserting generated courses', insertError);
      throw new BadRequestException(insertError.message);
    }

    this.logger.log(`Generated ${inserted?.length || 0} courses for week ${weekStart}`);
    return {
      generated: inserted?.length || 0,
      message: `${inserted?.length || 0} courses generated for week ${weekStart}`,
    };
  }

  // ============================================
  // Publish planning
  // ============================================

  async publishPlanning(dto: PublishPlanningDto) {
    const { weekStart, publishedBy, notes } = dto;

    // Get next version number for this week
    const { data: existingVersions } = await this.supabase
      .from('planning_version')
      .select('version_number')
      .eq('week_start', weekStart)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = (existingVersions?.[0]?.version_number || 0) + 1;

    // Count courses stats
    const weekEnd = this.addDays(weekStart, 6);
    const { data: courses } = await this.supabase
      .from('planning_course')
      .select('assignment_status')
      .gte('date', weekStart)
      .lte('date', weekEnd);

    const total = courses?.length || 0;
    const assigned = courses?.filter((c: any) => c.assignment_status === 'affectee').length || 0;
    const partial = courses?.filter((c: any) => c.assignment_status === 'partiellement_affectee').length || 0;
    const unassigned = courses?.filter((c: any) => c.assignment_status === 'non_affectee').length || 0;

    // Create planning version
    const { data: version, error: vError } = await this.supabase
      .from('planning_version')
      .insert({
        week_start: weekStart,
        version_number: nextVersion,
        status: 'publie',
        published_at: new Date().toISOString(),
        published_by: publishedBy || null,
        notes: notes || null,
        stats: { total, assigned, partial, unassigned },
      })
      .select('*')
      .single();

    if (vError) {
      this.logger.error('Error publishing planning', vError);
      throw new BadRequestException(vError.message);
    }

    // Update all tournees for this week to published
    await this.supabase
      .from('planning_tournee')
      .update({ status: 'published', version_id: version.id })
      .eq('week_start', weekStart)
      .eq('status', 'draft');

    return this.transformVersion(version);
  }

  // ============================================
  // Versions
  // ============================================

  async findAllVersions() {
    const { data, error } = await this.supabase
      .from('planning_version')
      .select('*')
      .order('week_start', { ascending: false })
      .order('version_number', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return (data || []).map((v: any) => this.transformVersion(v));
  }

  // ============================================
  // Health metrics
  // ============================================

  async getHealthMetrics(weekStart: string) {
    const weekEnd = this.addDays(weekStart, 6);

    const { data: courses } = await this.supabase
      .from('planning_course')
      .select('*')
      .gte('date', weekStart)
      .lte('date', weekEnd);

    const all = courses || [];
    const total = all.length;
    const assigned = all.filter((c: any) => c.assignment_status === 'affectee').length;
    const partial = all.filter((c: any) => c.assignment_status === 'partiellement_affectee').length;
    const unassigned = all.filter((c: any) => c.assignment_status === 'non_affectee').length;
    const sensitive = all.filter((c: any) => c.is_sensitive).length;
    const sups = all.filter((c: any) => c.is_sup).length;
    const missingDrivers = all.filter((c: any) => c.missing_resource === 'driver').length;
    const missingVehicles = all.filter((c: any) => c.missing_resource === 'vehicle').length;

    return {
      total,
      assigned,
      partial,
      unassigned,
      placementRate: total > 0 ? Math.round((assigned / total) * 100) : 0,
      sensitive,
      sups,
      missingDrivers,
      missingVehicles,
    };
  }

  // ============================================
  // Helpers
  // ============================================

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  private computeAssignmentStatus(driverId?: string | null, vehicleId?: string | null): string {
    if (driverId && vehicleId) return 'affectee';
    if (driverId || vehicleId) return 'partiellement_affectee';
    return 'non_affectee';
  }

  private courseDtoToDb(dto: CreateCourseDto): any {
    return {
      prestation_id: dto.prestationId || null,
      tournee_id: dto.tourneeId || null,
      date: dto.date,
      start_time: dto.startTime || null,
      end_time: dto.endTime || null,
      start_location: dto.startLocation || null,
      end_location: dto.endLocation || null,
      client_name: dto.clientName || null,
      prestation_reference: dto.prestationReference || null,
      driver_id: dto.driverId || null,
      driver_name: dto.driverName || null,
      vehicle_id: dto.vehicleId || null,
      vehicle_immat: dto.vehicleImmat || null,
      is_sensitive: dto.isSensitive || false,
      is_sup: dto.isSup || false,
      vehicle_type: dto.vehicleType || null,
      vehicle_energy: dto.vehicleEnergy || null,
      driver_type: dto.driverType || null,
      required_skills: dto.requiredSkills || [],
      site: dto.site || null,
      comments: dto.comments || null,
    };
  }

  private transformCourse(data: any) {
    return {
      id: data.id,
      prestationId: data.prestation_id,
      tourneeId: data.tournee_id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      startLocation: data.start_location,
      endLocation: data.end_location,
      clientName: data.client_name,
      prestationReference: data.prestation_reference,
      driverId: data.driver_id,
      driverName: data.driver_name,
      vehicleId: data.vehicle_id,
      vehicleImmat: data.vehicle_immat,
      assignmentStatus: data.assignment_status,
      isSensitive: data.is_sensitive,
      isSup: data.is_sup,
      vehicleType: data.vehicle_type,
      vehicleEnergy: data.vehicle_energy,
      driverType: data.driver_type,
      requiredSkills: data.required_skills || [],
      nonPlacementReason: data.non_placement_reason,
      missingResource: data.missing_resource,
      comments: data.comments,
      site: data.site,
      actualStartTime: data.actual_start_time,
      actualEndTime: data.actual_end_time,
      actualDriverId: data.actual_driver_id,
      actualVehicleId: data.actual_vehicle_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformTournee(data: any) {
    return {
      id: data.id,
      reference: data.reference,
      site: data.site,
      weekStart: data.week_start,
      driverId: data.driver_id,
      vehicleId: data.vehicle_id,
      vehicleType: data.vehicle_type,
      energy: data.energy,
      status: data.status,
      versionId: data.version_id,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformVersion(data: any) {
    return {
      id: data.id,
      weekStart: data.week_start,
      versionNumber: data.version_number,
      status: data.status,
      publishedAt: data.published_at,
      publishedBy: data.published_by,
      notes: data.notes,
      stats: data.stats,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

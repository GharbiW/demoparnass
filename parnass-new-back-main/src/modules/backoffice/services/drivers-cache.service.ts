import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import {
  DriverCacheResponseDto,
  DriverStatsDto,
  UpdateDriverManualFieldsDto,
  ListDriversQueryDto,
  DRIVER_API_FIELDS,
} from '../dto/driver.dto';

@Injectable()
export class DriversCacheService {
  private readonly logger = new Logger(DriversCacheService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  /**
   * Transform database row to response DTO
   */
  private transformDriver(row: any): DriverCacheResponseDto {
    return {
      id: row.id,
      factorialId: row.factorial_id,
      // Standard employee fields from Factorial
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      loginEmail: row.login_email,
      phone: row.phone,
      address: row.address,
      addressLine2: row.address_line_2,
      postalCode: row.postal_code,
      city: row.city,
      state: row.state,
      country: row.country,
      birthday: row.birthday,
      teamId: row.team_id,
      teamName: row.team_name,
      // Custom fields from Factorial
      shift: row.shift,
      availableWeekends: row.available_weekends,
      forfaitWeekend: row.forfait_weekend,
      lieuPrisePoste: row.lieu_prise_poste,
      numeroCarteAs24: row.numero_carte_as24,
      dateRemiseCarteAs24: row.date_remise_carte_as24,
      dateRestitutionAs24: row.date_restitution_as24,
      permisDeConduire: row.permis_de_conduire,
      fco: row.fco,
      adr: row.adr,
      habilitation: row.habilitation,
      formation1123911262: row.formation_11239_11262,
      visiteMedicale: row.visite_medicale,
      // Manual fields
      matricule: row.matricule,
      permits: row.permits || [],
      certifications: row.certifications || [],
      agence: row.agence,
      zone: row.zone,
      amplitude: row.amplitude,
      decoucher: row.decoucher,
      status: row.status || 'disponible',
      indisponibiliteRaison: row.indisponibilite_raison,
      // Metadata
      _apiFields: DRIVER_API_FIELDS,
      syncedAt: row.synced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Find all drivers with optional filtering
   */
  async findAll(query: ListDriversQueryDto): Promise<DriverCacheResponseDto[]> {
    let dbQuery = this.supabase.from('driver_cache').select('*');

    // Apply filters
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.teamName) {
      dbQuery = dbQuery.eq('team_name', query.teamName);
    }

    if (query.agence) {
      dbQuery = dbQuery.eq('agence', query.agence);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      dbQuery = dbQuery.or(
        `first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,matricule.ilike.%${searchLower}%`,
      );
    }

    // Pagination - default to 10000 to avoid Supabase's 1000 row limit
    const limit = query.limit || 10000;
    dbQuery = dbQuery.limit(limit);

    if (query.offset) {
      dbQuery = dbQuery.range(query.offset, query.offset + limit - 1);
    }

    // Order by name
    dbQuery = dbQuery.order('last_name').order('first_name');

    const { data, error } = await dbQuery;

    if (error) {
      this.logger.error('Erreur lors de la récupération des conducteurs', error);
      throw new BadRequestException(error.message);
    }

    return (data || []).map((row) => this.transformDriver(row));
  }

  /**
   * Find a single driver by ID
   */
  async findOne(id: string): Promise<DriverCacheResponseDto> {
    const { data, error } = await this.supabase
      .from('driver_cache')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Conducteur non trouvé: ${id}`);
    }

    return this.transformDriver(data);
  }

  /**
   * Find a driver by Factorial ID
   */
  async findByFactorialId(factorialId: number): Promise<DriverCacheResponseDto | null> {
    const { data, error } = await this.supabase
      .from('driver_cache')
      .select('*')
      .eq('factorial_id', factorialId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.transformDriver(data);
  }

  /**
   * Get driver statistics
   */
  async getStats(): Promise<DriverStatsDto> {
    // Use explicit count to get accurate total
    const { count: totalCount, error: countError } = await this.supabase
      .from('driver_cache')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      this.logger.error('Erreur lors du comptage des conducteurs', countError);
      throw new BadRequestException(countError.message);
    }

    // Get status breakdown with high limit
    const { data, error } = await this.supabase
      .from('driver_cache')
      .select('status, synced_at')
      .limit(50000);

    if (error) {
      this.logger.error('Erreur lors de la récupération des statistiques', error);
      throw new BadRequestException(error.message);
    }

    const stats: DriverStatsDto = {
      total: totalCount || 0,
      disponibles: 0,
      occupes: 0,
      indisponibles: 0,
      lastSyncAt: undefined,
    };

    let latestSyncDate: Date | null = null;

    (data || []).forEach((row: any) => {
      switch (row.status) {
        case 'disponible':
          stats.disponibles++;
          break;
        case 'occupe':
          stats.occupes++;
          break;
        case 'indisponible':
          stats.indisponibles++;
          break;
      }

      if (row.synced_at) {
        const syncDate = new Date(row.synced_at);
        if (!latestSyncDate || syncDate > latestSyncDate) {
          latestSyncDate = syncDate;
        }
      }
    });

    if (latestSyncDate !== null) {
      stats.lastSyncAt = (latestSyncDate as Date).toISOString();
    }

    return stats;
  }

  /**
   * Update manual fields (not synced from API)
   */
  async updateManualFields(
    id: string,
    dto: UpdateDriverManualFieldsDto,
  ): Promise<DriverCacheResponseDto> {
    // First check if driver exists
    await this.findOne(id);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.matricule !== undefined) updateData.matricule = dto.matricule;
    if (dto.permits !== undefined) updateData.permits = dto.permits;
    if (dto.certifications !== undefined) updateData.certifications = dto.certifications;
    if (dto.agence !== undefined) updateData.agence = dto.agence;
    if (dto.zone !== undefined) updateData.zone = dto.zone;
    if (dto.amplitude !== undefined) updateData.amplitude = dto.amplitude;
    if (dto.decoucher !== undefined) updateData.decoucher = dto.decoucher;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.indisponibiliteRaison !== undefined) {
      updateData.indisponibilite_raison = dto.indisponibiliteRaison;
    }

    const { data, error } = await this.supabase
      .from('driver_cache')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Erreur lors de la mise à jour du conducteur', error);
      throw new BadRequestException(error.message);
    }

    return this.transformDriver(data);
  }

  /**
   * Upsert a driver from Factorial API data
   * Preserves manual fields when updating
   */
  async upsertFromApi(apiData: {
    factorial_id: number;
    first_name: string;
    last_name: string;
    email?: string;
    login_email?: string;
    phone?: string;
    address?: string;
    address_line_2?: string;
    postal_code?: string;
    city?: string;
    state?: string;
    country?: string;
    birthday?: string;
    team_id?: number;
    team_name?: string;
    shift?: string;
    available_weekends?: string;
    forfait_weekend?: string;
    lieu_prise_poste?: string;
    numero_carte_as24?: string;
    date_remise_carte_as24?: string;
    date_restitution_as24?: string;
    permis_de_conduire?: string;
    fco?: string;
    adr?: string;
    habilitation?: string;
    formation_11239_11262?: string;
    visite_medicale?: string;
    // Availability from Factorial leaves
    status_from_leaves?: string;
    indisponibilite_raison_from_leaves?: string;
  }): Promise<{ created: boolean; updated: boolean }> {
    // Check if driver already exists
    const existing = await this.findByFactorialId(apiData.factorial_id);

    const now = new Date().toISOString();

    // Build the API-synced data payload
    const apiFields: any = {
      first_name: apiData.first_name,
      last_name: apiData.last_name,
      email: apiData.email,
      login_email: apiData.login_email,
      phone: apiData.phone,
      address: apiData.address,
      address_line_2: apiData.address_line_2,
      postal_code: apiData.postal_code,
      city: apiData.city,
      state: apiData.state,
      country: apiData.country,
      birthday: apiData.birthday,
      team_id: apiData.team_id,
      team_name: apiData.team_name,
      shift: apiData.shift,
      available_weekends: apiData.available_weekends,
      forfait_weekend: apiData.forfait_weekend,
      lieu_prise_poste: apiData.lieu_prise_poste,
      numero_carte_as24: apiData.numero_carte_as24,
      date_remise_carte_as24: apiData.date_remise_carte_as24 || null,
      date_restitution_as24: apiData.date_restitution_as24 || null,
      permis_de_conduire: apiData.permis_de_conduire || null,
      fco: apiData.fco || null,
      adr: apiData.adr || null,
      habilitation: apiData.habilitation,
      formation_11239_11262: apiData.formation_11239_11262 || null,
      visite_medicale: apiData.visite_medicale || null,
      synced_at: now,
      updated_at: now,
    };

    if (existing) {
      // Update only API fields, preserve manual fields
      const updatePayload: any = { ...apiFields };

      // If leaves tell us the driver is on leave, update status + reason
      // but only if not already manually set to 'occupe' (TMS assignment)
      if (apiData.status_from_leaves === 'indisponible') {
        if (existing.status !== 'occupe') {
          updatePayload.status = 'indisponible';
          updatePayload.indisponibilite_raison = apiData.indisponibilite_raison_from_leaves;
        }
      } else if (existing.status === 'indisponible') {
        // If previously indisponible from leaves but no longer on leave, reset to disponible
        updatePayload.status = 'disponible';
        updatePayload.indisponibilite_raison = null;
      }

      const { error } = await this.supabase
        .from('driver_cache')
        .update(updatePayload)
        .eq('factorial_id', apiData.factorial_id);

      if (error) {
        this.logger.error(`Erreur mise à jour conducteur ${apiData.factorial_id}`, error);
        throw new BadRequestException(error.message);
      }

      return { created: false, updated: true };
    } else {
      // Create new driver
      const insertPayload: any = {
        factorial_id: apiData.factorial_id,
        ...apiFields,
        status: apiData.status_from_leaves === 'indisponible' ? 'indisponible' : 'disponible',
        indisponibilite_raison: apiData.indisponibilite_raison_from_leaves || null,
        permits: [],
        certifications: [],
        created_at: now,
      };

      const { error } = await this.supabase.from('driver_cache').insert(insertPayload);

      if (error) {
        this.logger.error(`Erreur création conducteur ${apiData.factorial_id}`, error);
        throw new BadRequestException(error.message);
      }

      return { created: true, updated: false };
    }
  }

  /**
   * Delete all drivers whose factorial_id is NOT in the given set.
   * Used after sync to clean up drivers that are no longer in the target team.
   */
  async deleteNotInFactorialIds(keepIds: number[]): Promise<number> {
    if (keepIds.length === 0) {
      this.logger.warn('deleteNotInFactorialIds called with empty keepIds — skipping');
      return 0;
    }

    // Get all factorial_ids currently in cache
    const { data: allRows, error: fetchError } = await this.supabase
      .from('driver_cache')
      .select('id, factorial_id');

    if (fetchError) {
      this.logger.error('Erreur récupération des IDs pour nettoyage', fetchError);
      return 0;
    }

    const keepSet = new Set(keepIds);
    const toDelete = (allRows || []).filter(
      (row: any) => !keepSet.has(row.factorial_id),
    );

    if (toDelete.length === 0) {
      this.logger.log('Nettoyage: aucun conducteur obsolète à supprimer');
      return 0;
    }

    const deleteIds = toDelete.map((row: any) => row.id);
    // Delete in batches of 100 to avoid query size limits
    let deleted = 0;
    for (let i = 0; i < deleteIds.length; i += 100) {
      const batch = deleteIds.slice(i, i + 100);
      const { error: delError } = await this.supabase
        .from('driver_cache')
        .delete()
        .in('id', batch);

      if (delError) {
        this.logger.error(`Erreur suppression batch ${i}: ${delError.message}`);
      } else {
        deleted += batch.length;
      }
    }

    this.logger.log(`Nettoyage: ${deleted} conducteurs obsolètes supprimés`);
    return deleted;
  }

  /**
   * Get count of drivers in cache
   */
  async getCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('driver_cache')
      .select('*', { count: 'exact', head: true });

    if (error) {
      this.logger.error('Erreur lors du comptage des conducteurs', error);
      return 0;
    }

    return count || 0;
  }
}

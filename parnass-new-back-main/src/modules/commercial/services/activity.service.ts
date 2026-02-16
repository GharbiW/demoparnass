import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';

/**
 * Activity types for the commercial module
 */
export enum ActivityType {
  // Client activities
  CLIENT_AJOUTE = 'client_ajoute',
  CLIENT_MODIFIE = 'client_modifie',
  CLIENT_SUPPRIME = 'client_supprime',
  CLIENT_IMPORTE = 'client_importe',

  // Contract activities
  CONTRAT_SIGNE = 'contrat_signe',
  CONTRAT_RENOUVELE = 'contrat_renouvele',
  CONTRAT_MODIFIE = 'contrat_modifie',
  CONTRAT_TERMINE = 'contrat_termine',
  CONTRAT_SUPPRIME = 'contrat_supprime',
  CONTRAT_IMPORTE = 'contrat_importe',

  // Contact activities
  CONTACT_AJOUTE = 'contact_ajoute',
  CONTACT_MODIFIE = 'contact_modifie',
  CONTACT_SUPPRIME = 'contact_supprime',
  CONTACT_IMPORTE = 'contact_importe',

  // Address activities
  ADRESSE_AJOUTEE = 'adresse_ajoutee',
  ADRESSE_MODIFIEE = 'adresse_modifiee',
  ADRESSE_SUPPRIMEE = 'adresse_supprimee',
  ADRESSE_IMPORTEE = 'adresse_importee',

  // Prestation activities
  PRESTATION_AJOUTEE = 'prestation_ajoutee',
  PRESTATION_MODIFIEE = 'prestation_modifiee',
  PRESTATION_SUPPRIMEE = 'prestation_supprimee',
  PRESTATION_IMPORTEE = 'prestation_importee',
  PRESTATION_ARCHIVEE = 'prestation_archivee',
  PRESTATION_RESTAUREE = 'prestation_restauree',
  PRESTATION_VERSION_PLANIFIEE = 'prestation_version_planifiee',
  PRESTATION_VERSION_APPLIQUEE = 'prestation_version_appliquee',

  // Ride activities
  RIDE_AJOUTE = 'ride_ajoute',
  RIDE_MODIFIE = 'ride_modifie',
  RIDE_SUPPRIME = 'ride_supprime',
}

/**
 * Entity types for the commercial module
 */
export enum EntityType {
  CLIENT = 'client',
  CONTRACT = 'contract',
  CONTACT = 'contact',
  ADDRESS = 'address',
  PRESTATION = 'prestation',
  RIDE = 'ride',
}

export interface ActivityLogEntry {
  id: string;
  type: string;
  detail: string;
  reference: string;
  userId: string;
  userName: string;
  userInitials: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ActivityFilters {
  type?: string;
  userId?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  contractId?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Log an activity
   */
  async log(
    type: ActivityType | string,
    detail: string,
    reference: string,
    userId?: string,
    userName?: string,
    entityType?: EntityType | string,
    entityId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const userInitials = userName
        ? userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
        : 'SYS';

      const activityData = {
        type,
        detail,
        reference,
        user_id: userId || null,
        user_name: userName || 'Système',
        user_initials: userInitials,
        entity_type: entityType || null,
        entity_id: entityId || null,
        metadata: metadata || {},
      };

      const { error } = await this.supabase
        .getClient()
        .from('activity_log')
        .insert(activityData);

      if (error) {
        this.logger.error(
          `Failed to log activity: ${error.message}`,
          error.details,
        );
      }
    } catch (error) {
      this.logger.error('Failed to log activity', error);
    }
  }

  /**
   * Find all activities with optional filters
   */
  async findAll(filters: ActivityFilters = {}): Promise<{
    data: ActivityLogEntry[];
    total: number;
  }> {
    let query = this.supabase
      .getClient()
      .from('activity_log')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Filter by client - need to join with related entities
    if (filters.clientId) {
      // Get activities for the client itself and related contracts/prestations
      query = query.or(
        `and(entity_type.eq.client,entity_id.eq.${filters.clientId}),metadata->clientId.eq.${filters.clientId}`,
      );
    }

    // Filter by contract
    if (filters.contractId) {
      query = query.or(
        `and(entity_type.eq.contract,entity_id.eq.${filters.contractId}),metadata->contractId.eq.${filters.contractId}`,
      );
    }

    // Order by created_at descending (most recent first)
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch activities', error);
      throw error;
    }

    return {
      data: (data || []).map(this.transformActivity),
      total: count || 0,
    };
  }

  /**
   * Find activities for a specific entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<ActivityLogEntry[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('activity_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(
        `Failed to fetch activities for ${entityType}/${entityId}`,
        error,
      );
      throw error;
    }

    return (data || []).map(this.transformActivity);
  }

  /**
   * Get activity statistics
   */
  async getStats(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    total: number;
    byType: Record<string, number>;
    byEntityType: Record<string, number>;
  }> {
    let query = this.supabase
      .getClient()
      .from('activity_log')
      .select('type, entity_type');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch activity stats', error);
      throw error;
    }

    const byType: Record<string, number> = {};
    const byEntityType: Record<string, number> = {};

    (data || []).forEach((activity) => {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
      if (activity.entity_type) {
        byEntityType[activity.entity_type] =
          (byEntityType[activity.entity_type] || 0) + 1;
      }
    });

    return {
      total: data?.length || 0,
      byType,
      byEntityType,
    };
  }

  /**
   * Transform database row to API response format
   */
  private transformActivity(row: any): ActivityLogEntry {
    return {
      id: row.id,
      type: row.type,
      detail: row.detail,
      reference: row.reference,
      userId: row.user_id,
      userName: row.user_name,
      userInitials: row.user_initials,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata: row.metadata,
      createdAt: row.created_at,
    };
  }
}

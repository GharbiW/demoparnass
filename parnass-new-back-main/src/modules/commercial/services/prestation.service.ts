import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import {
  CreatePrestationDto,
  UpdatePrestationDto,
  EtapeDto,
  ScheduleModificationDto,
} from '../dto/prestation';
import { ExcelService } from '../../shared/services/excel.service';
import {
  ColumnConfig,
  ImportResult,
  ImportError,
} from '../../shared/dto/import-result.dto';
import { ActivityService, ActivityType, EntityType } from './activity.service';

// Base column configuration for Prestation import/export
// Note: Trajets (Trajet 1, Trajet 2, etc.) are handled dynamically
const PRESTATION_BASE_COLUMNS: ColumnConfig[] = [
  {
    frenchHeader: 'Référence contrat',
    field: 'contractReference',
    required: true,
    type: 'string',
  },
  {
    frenchHeader: 'Référence prestation client',
    field: 'referenceClient',
    required: false,
    type: 'string',
  },
];

// Trajet columns for the template (base 1 trajet - users can add more)
// Each trajet has: Adresse départ, Adresse arrivée, Date départ, H. présence, H. départ, Date arrivée, H. arrivée, H. fin, Vide
const PRESTATION_TRAJET_COLUMNS: ColumnConfig[] = [
  // Trajet 1
  {
    frenchHeader: 'Trajet 1 (Adresse départ)',
    field: 'trajet1_adresse_depart',
    required: true,
    type: 'string',
  },
  {
    frenchHeader: 'Trajet 1 (Adresse arrivée)',
    field: 'trajet1_adresse_arrivee',
    required: true,
    type: 'string',
  },
  {
    frenchHeader: 'Trajet 1 (Date départ)',
    field: 'trajet1_date_depart',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Trajet 1 (H. présence)',
    field: 'trajet1_h_presence',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Trajet 1 (H. départ)',
    field: 'trajet1_h_depart',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Trajet 1 (Date arrivée)',
    field: 'trajet1_date_arrivee',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Trajet 1 (H. arrivée)',
    field: 'trajet1_h_arrivee',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Trajet 1 (H. fin)',
    field: 'trajet1_h_fin',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Trajet 1 (Vide)',
    field: 'trajet1_vide',
    required: false,
    type: 'boolean',
  },
];

// Additional columns after steps
const PRESTATION_EXTRA_COLUMNS: ColumnConfig[] = [
  {
    frenchHeader: 'Type véhicule',
    field: 'typologieVehicule',
    required: false,
    type: 'enum',
    enumValues: ['VL', 'SPL', 'CM', 'Caisse Mobile'],
  },
  {
    frenchHeader: 'Énergie imposée',
    field: 'energieImposee',
    required: false,
    type: 'enum',
    enumValues: ['Gazole', 'Elec', 'Gaz'],
  },
  {
    frenchHeader: 'Type remorque',
    field: 'typeRemorque',
    required: false,
    type: 'enum',
    enumValues: ['Frigo', 'Hayon', 'Aérienne', 'Plateau', 'Tautliner'],
  },
  {
    frenchHeader: 'Sensible',
    field: 'sensible',
    required: false,
    type: 'boolean',
    defaultValue: false,
  },
  {
    frenchHeader: 'Code déchargement',
    field: 'codeDechargement',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Commentaire',
    field: 'comment',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Fréquence',
    field: 'frequence',
    required: false,
    type: 'array',
  },
];

// Combined columns for template generation
const PRESTATION_TEMPLATE_COLUMNS: ColumnConfig[] = [
  ...PRESTATION_BASE_COLUMNS,
  ...PRESTATION_TRAJET_COLUMNS,
  ...PRESTATION_EXTRA_COLUMNS,
];

const PRESTATION_EXAMPLE_ROW = {
  contractReference: 'CTR-2026-0001',
  referenceClient: 'ART-001',
  trajet1_adresse_depart: 'ADR-2026-0001',
  trajet1_adresse_arrivee: 'ADR-2026-0002',
  trajet1_date_depart: '01/02/2026',
  trajet1_h_presence: '08:00',
  trajet1_h_depart: '08:30',
  trajet1_date_arrivee: '01/02/2026',
  trajet1_h_arrivee: '12:00',
  trajet1_h_fin: '12:30',
  trajet1_vide: 'Non',
  typologieVehicule: 'SPL',
  energieImposee: 'Gazole',
  typeRemorque: 'Tautliner',
  sensible: 'Non',
  codeDechargement: 'ABC123',
  comment: 'Livraison standard',
  frequence: 'Lun, Mar, Mer, Jeu, Ven',
};

@Injectable()
export class PrestationService {
  private readonly logger = new Logger(PrestationService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly excelService: ExcelService,
    @Inject(forwardRef(() => ActivityService))
    private readonly activityService: ActivityService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findAll(statusFilter: 'active' | 'archived' | 'all' = 'active') {
    let query = this.supabase
      .from('prestation')
      .select(
        `
        *,
        contract:contract_id (
          id,
          reference,
          reference_client,
          name,
          client:client_id (
            id,
            name,
            initials,
            avatar_url,
            color,
            reference,
            reference_client
          )
        )
      `,
      )
      .order('created_at', { ascending: false });

    // Filter by status
    if (statusFilter === 'active') {
      query = query.eq('status', 'active');
    } else if (statusFilter === 'archived') {
      query = query.eq('status', 'archived');
    }
    // 'all' = no filter

    const { data, error } = await query;

    if (error) {
      this.logger.error('Error fetching prestations', error);
      throw new BadRequestException(error.message);
    }

    // Fetch address details for all etapes - handle corrupted format
    const allEtapeIds = new Set<string>();
    data.forEach((p: any) => {
      if (p.etapes && Array.isArray(p.etapes)) {
        const ids = this.extractAddressIds(p.etapes);
        ids.forEach((id) => allEtapeIds.add(id));
      }
    });

    const addressMap = new Map<string, any>();
    if (allEtapeIds.size > 0) {
      const { data: addresses } = await this.supabase
        .from('address')
        .select('id, name, address, postal_code, city, latitude, longitude')
        .in('id', Array.from(allEtapeIds));

      (addresses || []).forEach((addr: any) => {
        addressMap.set(addr.id, addr);
      });
    }

    return data.map((prestation: any) =>
      this.transformPrestation(prestation, addressMap),
    );
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('prestation')
      .select(
        `
        *,
        contract:contract_id (
          id,
          reference,
          reference_client,
          name,
          client:client_id (
            id,
            name,
            initials,
            avatar_url,
            color,
            reference,
            reference_client
          )
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Prestation with ID ${id} not found`);
      }
      throw new BadRequestException(error.message);
    }

    // Fetch address details for etapes - handle corrupted format
    const addressMap = new Map<string, any>();
    if (data.etapes && Array.isArray(data.etapes) && data.etapes.length > 0) {
      const etapeIds = this.extractAddressIds(data.etapes);

      if (etapeIds.length > 0) {
        const { data: addresses } = await this.supabase
          .from('address')
          .select('id, name, address, postal_code, city, latitude, longitude')
          .in('id', etapeIds);

        (addresses || []).forEach((addr: any) => {
          addressMap.set(addr.id, addr);
        });
      }
    }

    return this.transformPrestation(data, addressMap);
  }

  async create(
    createPrestationDto: CreatePrestationDto,
    userId?: string,
    userName?: string,
  ) {
    // Validate ride count based on type
    const isMAD = createPrestationDto.typeDemande === 'MAD';
    const etapesCount = createPrestationDto.etapes?.length || 0;

    if (etapesCount < 1) {
      throw new BadRequestException('Au moins 1 trajet est requis');
    }

    const prestationData = this.transformDtoToDb(createPrestationDto);

    const { data, error } = await this.supabase
      .from('prestation')
      .insert(prestationData)
      .select(
        `
        *,
        contract:contract_id (
          id,
          reference,
          name,
          client:client_id (
            id,
            name,
            initials,
            avatar_url,
            color
          )
        )
      `,
      )
      .single();

    if (error) {
      this.logger.error('Error creating prestation', error);
      throw new BadRequestException(error.message);
    }

    // Fetch address details for etapes
    const addressMap = new Map<string, any>();

    this.logger.log(
      `Creating prestation ${data.id}, etapes from DB: ${JSON.stringify(data.etapes)}`,
    );

    if (data.etapes && Array.isArray(data.etapes) && data.etapes.length > 0) {
      // Collect all unique address IDs from etapes (both depart and arrivee)
      const allAddressIds = new Set<string>();
      data.etapes.forEach((etape: any) => {
        if (etape.address_depart) allAddressIds.add(etape.address_depart);
        if (etape.address_arrivee) allAddressIds.add(etape.address_arrivee);
        // Legacy field
        if (etape.address_id) allAddressIds.add(etape.address_id);
      });

      const addressIds = Array.from(allAddressIds);
      this.logger.log(`Address IDs from etapes: ${JSON.stringify(addressIds)}`);

      if (addressIds.length > 0) {
        const { data: addresses } = await this.supabase
          .from('address')
          .select('id, name, address, postal_code, city, latitude, longitude')
          .in('id', addressIds);

        (addresses || []).forEach((addr: any) => {
          addressMap.set(addr.id, addr);
        });
      }

      // Create one ride per etape (each etape = 1 complete ride)
      const isMADType = data.type_demande === 'MAD';
      const etapesFromDto = createPrestationDto.etapes || [];

      this.logger.log(
        `Creating ${etapesFromDto.length} rides from etapes, typeDemande = ${data.type_demande}`,
      );

      for (let i = 0; i < etapesFromDto.length; i++) {
        const etape = etapesFromDto[i];
        const departAddr = etape.addressDepart || etape.addressId;
        const arriveeAddr =
          etape.addressArrivee || (isMADType ? departAddr : null);

        // Build timestamp from time string (use reference date for storage)
        const buildTimestamp = (timeStr: string | null | undefined) => {
          if (!timeStr) return null;
          return `2000-01-01T${timeStr}:00.000Z`;
        };

        const rideData: any = {
          prestation_id: data.id,
          address_depart: departAddr,
          address_arrivee: arriveeAddr || departAddr,
          order_index: i,
          presence_chargement: buildTimestamp(etape.heurePresence),
          depart_chargement: buildTimestamp(etape.heureDepart),
          arrivee_livraison: buildTimestamp(etape.heureArrivee),
          fin_livraison: buildTimestamp(etape.heureFin),
          // EID: Editable client reference for this ride
          reference_client: etape.referenceClient || null,
        };

        this.logger.log(`Creating ride ${i}: ${JSON.stringify(rideData)}`);

        const { data: rideResult, error: rideError } = await this.supabase
          .from('ride')
          .insert(rideData)
          .select()
          .single();

        if (rideError) {
          this.logger.error(
            `Error auto-creating ride ${i} for prestation ${data.id}`,
            rideError,
          );
          // Continue anyway - prestation was created
        } else {
          this.logger.log(`Ride ${i} created successfully: ${rideResult?.id}`);
        }
      }
    } else {
      this.logger.log(
        `No etapes found in data: etapes = ${JSON.stringify(data.etapes)}`,
      );
    }

    const prestation = this.transformPrestation(data, addressMap);

    // Log activity
    await this.activityService.log(
      ActivityType.PRESTATION_AJOUTEE,
      prestation.reference,
      prestation.reference,
      userId,
      userName,
      EntityType.PRESTATION,
      prestation.id,
      {
        contractId: prestation.contractId,
        clientId: data.contract?.client?.id,
      },
    );

    return prestation;
  }

  async update(
    id: string,
    updatePrestationDto: UpdatePrestationDto,
    userId?: string,
    userName?: string,
  ) {
    // First check if prestation exists
    await this.findOne(id);

    // Snapshot the current state before applying changes
    const { data: currentRaw } = await this.supabase
      .from('prestation')
      .select('*')
      .eq('id', id)
      .single();

    if (currentRaw) {
      const currentVersion = currentRaw.version || 1;
      const snapshot = this.buildSnapshot(currentRaw);
      await this.saveVersionSnapshot(
        id,
        currentVersion,
        new Date().toISOString(),
        snapshot,
        'applied',
        userId,
        userName,
        'Modification directe',
      );
    }

    const prestationData = this.transformDtoToDb(updatePrestationDto);

    // Increment version
    prestationData.version = (currentRaw?.version || 1) + 1;

    const { data, error } = await this.supabase
      .from('prestation')
      .update(prestationData)
      .eq('id', id)
      .select(
        `
        *,
        contract:contract_id (
          id,
          reference,
          name,
          client:client_id (
            id,
            name,
            initials,
            avatar_url,
            color
          )
        )
      `,
      )
      .single();

    if (error) {
      this.logger.error('Error updating prestation', error);
      throw new BadRequestException(error.message);
    }

    // Sync ride reference_client (EID) from etapes to ride table
    if (data.etapes && Array.isArray(data.etapes)) {
      for (const etape of data.etapes) {
        if (
          typeof etape === 'object' &&
          etape !== null &&
          etape.ride_id
        ) {
          const rideUpdate: any = {};
          // Always sync reference_client (even if null — clears the field)
          if ('reference_client' in etape) {
            rideUpdate.reference_client = etape.reference_client || null;
          }
          if (Object.keys(rideUpdate).length > 0) {
            const { error: rideErr } = await this.supabase
              .from('ride')
              .update(rideUpdate)
              .eq('id', etape.ride_id);
            if (rideErr) {
              this.logger.warn(
                `Failed to sync ride ${etape.ride_id} reference_client: ${rideErr.message}`,
              );
            }
          }
        }
      }
    }

    // Fetch address details for etapes
    const addressMap = new Map<string, any>();
    if (data.etapes && Array.isArray(data.etapes) && data.etapes.length > 0) {
      // Collect all unique address IDs (both new and legacy formats)
      const allAddrIds = new Set<string>();
      data.etapes.forEach((etape: any) => {
        if (typeof etape === 'string') {
          allAddrIds.add(etape);
        } else if (typeof etape === 'object' && etape !== null) {
          if (etape.address_depart) allAddrIds.add(etape.address_depart);
          if (etape.address_arrivee) allAddrIds.add(etape.address_arrivee);
          if (etape.address_id) allAddrIds.add(etape.address_id);
        }
      });

      const addrIds = Array.from(allAddrIds);
      if (addrIds.length > 0) {
        const { data: addresses } = await this.supabase
          .from('address')
          .select('id, name, address, postal_code, city, latitude, longitude')
          .in('id', addrIds);

        (addresses || []).forEach((addr: any) => {
          addressMap.set(addr.id, addr);
        });
      }
    }

    const prestation = this.transformPrestation(data, addressMap);

    // Build change summary for activity log
    const changes: string[] = [];
    const changedFields: Record<string, any> = {};
    if (currentRaw) {
      const fieldLabels: Record<string, string> = {
        frequence: 'Fréquence',
        type_demande: 'Type de demande',
        heure_depart: 'Heure de départ',
        heure_arrivee: "Heure d'arrivée",
        etapes: 'Itinéraire',
        typologie_vehicule: 'Moteur',
        energie_imposee: 'Énergie',
        type_remorque: 'Véhicule tracté',
        specificites: 'Spécificités',
        contraintes_conducteur: 'Contraintes conducteur',
        sensible: 'Sensible',
        code_dechargement: 'Code déchargement',
        comment: 'Commentaire',
        a_facturer: 'À facturer',
        kilometrage_prevu: 'Km prévu',
        kilometrage_reel: 'Km réel',
        type_tarif: 'Type tarif',
        tarif: 'Tarif',
        tarif_unite: 'Unité tarif',
        tarif_km_contractuel: 'Km contractuel',
        tarif_heures_contractuel: 'Heures contractuel',
        reference_client: 'Réf. client',
      };
      for (const [dbField, label] of Object.entries(fieldLabels)) {
        const oldVal = JSON.stringify(currentRaw[dbField] ?? null);
        const newVal = JSON.stringify(data[dbField] ?? null);
        if (oldVal !== newVal) {
          changes.push(label);
          changedFields[dbField] = {
            from: currentRaw[dbField],
            to: data[dbField],
          };
        }
      }
    }

    const detail =
      changes.length > 0
        ? `${prestation.reference} — ${changes.join(', ')}`
        : prestation.reference;

    // Log activity
    await this.activityService.log(
      ActivityType.PRESTATION_MODIFIEE,
      detail,
      prestation.reference,
      userId,
      userName,
      EntityType.PRESTATION,
      prestation.id,
      {
        contractId: prestation.contractId,
        clientId: data.contract?.client?.id,
        changedFields: Object.keys(changedFields),
        changes: changedFields,
      },
    );

    return prestation;
  }

  async archive(
    id: string,
    userId?: string,
    userName?: string,
    reason?: string,
  ) {
    const prestation = await this.findOne(id);

    const { error } = await this.supabase
      .from('prestation')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        archived_by: userId || null,
      })
      .eq('id', id);

    if (error) {
      this.logger.error('Error archiving prestation', error);
      throw new BadRequestException(error.message);
    }

    await this.activityService.log(
      ActivityType.PRESTATION_ARCHIVEE,
      `Prestation archivée${reason ? ` : ${reason}` : ''}`,
      prestation.reference,
      userId,
      userName,
      EntityType.PRESTATION,
      id,
      { contractId: prestation.contractId, reason },
    );

    return { message: 'Prestation archivée avec succès' };
  }

  async restore(id: string, userId?: string, userName?: string) {
    const prestation = await this.findOne(id);

    const { error } = await this.supabase
      .from('prestation')
      .update({
        status: 'active',
        archived_at: null,
        archived_by: null,
      })
      .eq('id', id);

    if (error) {
      this.logger.error('Error restoring prestation', error);
      throw new BadRequestException(error.message);
    }

    await this.activityService.log(
      ActivityType.PRESTATION_RESTAUREE,
      'Prestation restaurée',
      prestation.reference,
      userId,
      userName,
      EntityType.PRESTATION,
      id,
      { contractId: prestation.contractId },
    );

    return { message: 'Prestation restaurée avec succès' };
  }

  async hardDelete(id: string, userId?: string, userName?: string) {
    const prestation = await this.findOne(id);

    const { error } = await this.supabase
      .from('prestation')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Error deleting prestation', error);
      throw new BadRequestException(error.message);
    }

    await this.activityService.log(
      ActivityType.PRESTATION_SUPPRIMEE,
      prestation.reference,
      prestation.reference,
      userId,
      userName,
      EntityType.PRESTATION,
      id,
      { contractId: prestation.contractId },
    );

    return { message: 'Prestation supprimée définitivement' };
  }

  // ============================================
  // Versioning Methods
  // ============================================

  /**
   * Build a JSONB snapshot of the prestation's current state (raw DB fields)
   */
  private buildSnapshot(rawData: any): Record<string, any> {
    return {
      frequence: rawData.frequence,
      type_demande: rawData.type_demande,
      heure_depart: rawData.heure_depart,
      heure_arrivee: rawData.heure_arrivee,
      etapes: rawData.etapes,
      typologie_vehicule: rawData.typologie_vehicule,
      energie_imposee: rawData.energie_imposee,
      type_remorque: rawData.type_remorque,
      specificites: rawData.specificites,
      contraintes_conducteur: rawData.contraintes_conducteur,
      sensible: rawData.sensible,
      code_dechargement: rawData.code_dechargement,
      comment: rawData.comment,
      a_facturer: rawData.a_facturer,
      kilometrage_prevu: rawData.kilometrage_prevu,
      kilometrage_reel: rawData.kilometrage_reel,
      type_tarif: rawData.type_tarif,
      tarif: rawData.tarif,
      tarif_unite: rawData.tarif_unite,
      tarif_km_contractuel: rawData.tarif_km_contractuel,
      tarif_heures_contractuel: rawData.tarif_heures_contractuel,
      reference_client: rawData.reference_client,
      type_tracteur: rawData.type_tracteur,
    };
  }

  /**
   * Save a version snapshot for a prestation
   */
  private async saveVersionSnapshot(
    prestationId: string,
    versionNumber: number,
    dateEffet: string,
    snapshot: Record<string, any>,
    status: 'applied' | 'scheduled' = 'applied',
    userId?: string,
    userName?: string,
    changeDescription?: string,
  ) {
    const { data, error } = await this.supabase
      .from('prestation_version')
      .insert({
        prestation_id: prestationId,
        version_number: versionNumber,
        date_effet: dateEffet,
        status,
        snapshot,
        change_description: changeDescription || null,
        created_by: userId || null,
        created_by_name: userName || null,
        applied_at: status === 'applied' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error saving version snapshot', error);
      // Don't throw - version tracking failure shouldn't block the operation
    }

    return data;
  }

  /**
   * Schedule a modification for a future date
   */
  async scheduleModification(
    id: string,
    dto: ScheduleModificationDto,
    userId?: string,
    userName?: string,
  ) {
    const prestation = await this.findOne(id);

    // Validate date_effet is in the future
    const dateEffet = new Date(dto.dateEffet);
    if (dateEffet <= new Date()) {
      throw new BadRequestException("La date d'effet doit être dans le futur");
    }

    // Build the snapshot of the new state to apply
    const { dateEffet: _de, changeDescription: _cd, ...updateFields } = dto;
    const newStateSnapshot = this.transformDtoToDb(updateFields as any);

    // Get the raw prestation data to find current version
    const { data: rawData } = await this.supabase
      .from('prestation')
      .select('version')
      .eq('id', id)
      .single();

    const nextVersion = (rawData?.version || 1) + 1;

    await this.saveVersionSnapshot(
      id,
      nextVersion,
      dto.dateEffet,
      newStateSnapshot,
      'scheduled',
      userId,
      userName,
      dto.changeDescription,
    );

    await this.activityService.log(
      ActivityType.PRESTATION_VERSION_PLANIFIEE,
      `Modification planifiée pour le ${new Date(dto.dateEffet).toLocaleDateString('fr-FR')}${dto.changeDescription ? ` : ${dto.changeDescription}` : ''}`,
      prestation.reference,
      userId,
      userName,
      EntityType.PRESTATION,
      id,
      {
        contractId: prestation.contractId,
        dateEffet: dto.dateEffet,
        versionNumber: nextVersion,
      },
    );

    return {
      message: 'Modification planifiée avec succès',
      versionNumber: nextVersion,
    };
  }

  /**
   * Get version history for a prestation
   */
  async getVersions(prestationId: string) {
    // Verify prestation exists
    await this.findOne(prestationId);

    const { data, error } = await this.supabase
      .from('prestation_version')
      .select('*')
      .eq('prestation_id', prestationId)
      .order('version_number', { ascending: false });

    if (error) {
      this.logger.error('Error fetching prestation versions', error);
      throw new BadRequestException(error.message);
    }

    return (data || []).map((v: any) => ({
      id: v.id,
      prestationId: v.prestation_id,
      versionNumber: v.version_number,
      dateEffet: v.date_effet,
      status: v.status,
      snapshot: v.snapshot,
      changeDescription: v.change_description,
      createdBy: v.created_by,
      createdByName: v.created_by_name,
      appliedAt: v.applied_at,
      createdAt: v.created_at,
    }));
  }

  /**
   * Cancel a scheduled version
   */
  async cancelScheduledVersion(
    prestationId: string,
    versionId: string,
    userId?: string,
    userName?: string,
  ) {
    // Verify prestation exists
    const prestation = await this.findOne(prestationId);

    // Find the version
    const { data: version, error: findError } = await this.supabase
      .from('prestation_version')
      .select('*')
      .eq('id', versionId)
      .eq('prestation_id', prestationId)
      .single();

    if (findError || !version) {
      throw new NotFoundException('Version non trouvée');
    }

    if (version.status !== 'scheduled') {
      throw new BadRequestException(
        'Seules les versions planifiées peuvent être annulées',
      );
    }

    const { error } = await this.supabase
      .from('prestation_version')
      .update({ status: 'cancelled' })
      .eq('id', versionId);

    if (error) {
      this.logger.error('Error cancelling scheduled version', error);
      throw new BadRequestException(error.message);
    }

    await this.activityService.log(
      ActivityType.PRESTATION_VERSION_PLANIFIEE,
      `Modification planifiée annulée (v${version.version_number})`,
      prestation.reference,
      userId,
      userName,
      EntityType.PRESTATION,
      prestationId,
      { versionId, versionNumber: version.version_number },
    );

    return { message: 'Version planifiée annulée' };
  }

  /**
   * Apply all scheduled versions whose date_effet has passed.
   * Called by the cron service.
   */
  async applyScheduledVersions() {
    const now = new Date().toISOString();

    const { data: scheduledVersions, error } = await this.supabase
      .from('prestation_version')
      .select('*')
      .eq('status', 'scheduled')
      .lte('date_effet', now)
      .order('date_effet', { ascending: true });

    if (error) {
      this.logger.error('Error fetching scheduled versions', error);
      return { applied: 0, errors: 1 };
    }

    if (!scheduledVersions || scheduledVersions.length === 0) {
      return { applied: 0, errors: 0 };
    }

    let applied = 0;
    let errors = 0;

    for (const version of scheduledVersions) {
      try {
        // 1. Fetch current prestation raw data
        const { data: currentData, error: fetchError } = await this.supabase
          .from('prestation')
          .select('*')
          .eq('id', version.prestation_id)
          .single();

        if (fetchError || !currentData) {
          this.logger.error(
            `Prestation ${version.prestation_id} not found for scheduled version ${version.id}`,
          );
          errors++;
          continue;
        }

        // 2. Snapshot current state as an 'applied' version (preserve history)
        const currentSnapshot = this.buildSnapshot(currentData);
        await this.saveVersionSnapshot(
          version.prestation_id,
          currentData.version || 1,
          new Date().toISOString(),
          currentSnapshot,
          'applied',
          undefined,
          'Système',
          'Sauvegarde automatique avant application de la version planifiée',
        );

        // 3. Apply the scheduled version's snapshot to the live prestation
        const updateData = {
          ...version.snapshot,
          version: (currentData.version || 1) + 1,
        };

        const { error: updateError } = await this.supabase
          .from('prestation')
          .update(updateData)
          .eq('id', version.prestation_id);

        if (updateError) {
          this.logger.error(
            `Error applying scheduled version ${version.id}`,
            updateError,
          );
          errors++;
          continue;
        }

        // 4. Mark the scheduled version as applied
        await this.supabase
          .from('prestation_version')
          .update({
            status: 'applied',
            applied_at: new Date().toISOString(),
          })
          .eq('id', version.id);

        // 5. Log activity
        await this.activityService.log(
          ActivityType.PRESTATION_VERSION_APPLIQUEE,
          `Version planifiée v${version.version_number} appliquée automatiquement`,
          currentData.reference,
          version.created_by,
          version.created_by_name || 'Système',
          EntityType.PRESTATION,
          version.prestation_id,
          {
            versionId: version.id,
            versionNumber: version.version_number,
            dateEffet: version.date_effet,
          },
        );

        applied++;
        this.logger.log(
          `Applied scheduled version ${version.id} for prestation ${version.prestation_id}`,
        );
      } catch (err) {
        this.logger.error(
          `Unexpected error applying version ${version.id}`,
          err,
        );
        errors++;
      }
    }

    return { applied, errors };
  }

  // Helper to extract address IDs from etapes array
  // Handles corrupted format where address_id is a stringified JSON
  private extractAddressIds(etapes: any[]): string[] {
    this.logger.log(`extractAddressIds input: ${JSON.stringify(etapes)}`);
    const result = etapes
      .map((etape: any) => {
        this.logger.log(
          `Processing etape: ${JSON.stringify(etape)}, type: ${typeof etape}`,
        );
        if (typeof etape === 'string') return etape;
        if (typeof etape === 'object' && etape !== null) {
          if (
            typeof etape.address_id === 'string' &&
            etape.address_id.startsWith('{')
          ) {
            try {
              return JSON.parse(etape.address_id).address_id;
            } catch {
              return etape.address_id;
            }
          }
          return etape.address_id;
        }
        return null;
      })
      .filter(Boolean);
    this.logger.log(`extractAddressIds result: ${JSON.stringify(result)}`);
    return result;
  }

  private transformPrestation(data: any, addressMap?: Map<string, any>) {
    // Build itineraires array from etapes JSONB objects
    // Each etape: { address_id, heure_depart, heure_arrivee, vide }
    const etapes = data.etapes || [];
    const itineraires = etapes.map((etape: any, index: number) => {
      // Handle multiple formats:
      // 1. Old UUID format: etape is a string UUID
      // 2. New JSONB format: etape is { address_id: UUID, ... }
      // 3. Corrupted format: etape is { address_id: "{\"address_id\": \"UUID\", ...}", ... }
      let addressId: string | undefined;
      let heureDepart: string | null = null;
      let heureArrivee: string | null = null;
      let vide = false;

      if (typeof etape === 'string') {
        // Old UUID format
        addressId = etape;
      } else if (typeof etape === 'object' && etape !== null) {
        // Check if address_id is a stringified JSON (corrupted format)
        if (
          typeof etape.address_id === 'string' &&
          etape.address_id.startsWith('{')
        ) {
          try {
            const parsed = JSON.parse(etape.address_id);
            addressId = parsed.address_id;
            heureDepart = parsed.heure_depart || etape.heure_depart || null;
            heureArrivee = parsed.heure_arrivee || etape.heure_arrivee || null;
            vide = parsed.vide ?? etape.vide ?? false;
          } catch {
            // If parsing fails, use as-is
            addressId = etape.address_id;
            heureDepart = etape.heure_depart || null;
            heureArrivee = etape.heure_arrivee || null;
            vide = etape.vide ?? false;
          }
        } else {
          // Normal JSONB format
          addressId = etape.address_id;
          heureDepart = etape.heure_depart || null;
          heureArrivee = etape.heure_arrivee || null;
          vide = etape.vide ?? false;
        }
      }

      const addr = addressId ? addressMap?.get(addressId) : undefined;
      if (addr) {
        return {
          id: addr.id,
          name: addr.name,
          address: addr.address,
          postalCode: addr.postal_code,
          city: addr.city,
          latitude: addr.latitude,
          longitude: addr.longitude,
          order: index,
          heureDepart: heureDepart,
          heureArrivee: heureArrivee,
          vide: vide,
        };
      }
      // Fallback when address not found - still provide useful data
      return {
        id: addressId || `unknown-${index}`,
        name: `Adresse ${index + 1}`,
        order: index,
        heureDepart: heureDepart,
        heureArrivee: heureArrivee,
        vide: vide,
      };
    });

    // Also build etapes array of address IDs for backward compatibility
    const etapeIds = this.extractAddressIds(etapes);

    // Determine display reference: use reference_client if available, otherwise internal reference
    const displayReference = data.reference_client || data.reference;

    return {
      id: data.id,
      reference: data.reference,
      referenceClient: data.reference_client,
      displayReference: displayReference,
      status: data.status || 'active',
      version: data.version || 1,
      archivedAt: data.archived_at,
      archivedBy: data.archived_by,
      contractId: data.contract_id,
      contract: data.contract
        ? {
            id: data.contract.id,
            reference: data.contract.reference,
            referenceClient: data.contract.reference_client,
            displayReference:
              data.contract.reference_client || data.contract.reference,
            name: data.contract.name,
            client: data.contract.client
              ? {
                  id: data.contract.client.id,
                  name: data.contract.client.name,
                  initials: data.contract.client.initials,
                  avatarUrl: data.contract.client.avatar_url,
                  color: data.contract.client.color,
                  reference: data.contract.client.reference,
                  referenceClient: data.contract.client.reference_client,
                  displayReference:
                    data.contract.client.reference_client ||
                    data.contract.client.reference,
                }
              : null,
          }
        : null,
      frequence: data.frequence,
      typeDemande: data.type_demande,
      heureDepart: data.heure_depart,
      heureArrivee: data.heure_arrivee,
      // Return etapes as array of UUIDs for backward compatibility
      etapes: etapeIds,
      // Return itineraires as full address objects with step metadata for frontend
      itineraires: itineraires,
      typologieVehicule: data.typologie_vehicule,
      energieImposee: data.energie_imposee,
      typeRemorque: data.type_remorque,
      // MCom-0013: Equipment specificities (JSONB object or legacy array)
      specificites: data.specificites || [],
      // Contrainte Conducteur
      contraintesConducteur: data.contraintes_conducteur || [],
      sensible: data.sensible,
      codeDechargement: data.code_dechargement,
      typeTracteur: data.type_tracteur,
      comment: data.comment,
      // Billing fields
      aFacturer: data.a_facturer,
      dateFacturation: data.date_facturation,
      // Mileage fields (for MAD)
      kilometragePrevu: data.kilometrage_prevu,
      kilometrageReel: data.kilometrage_reel,
      // MCom-0015: Price/tariff fields with type
      typeTarif: data.type_tarif,
      tarif: data.tarif,
      tarifUnite: data.tarif_unite,
      // MCom-25: Contractual billing amounts
      tarifKmContractuel: data.tarif_km_contractuel,
      tarifHeuresContractuel: data.tarif_heures_contractuel,
      // Import tracking
      importedAt: data.imported_at,
      importedBy: data.imported_by,
      importedByName: data.imported_by_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformDtoToDb(dto: CreatePrestationDto | UpdatePrestationDto) {
    const result: any = {};

    if ('contractId' in dto && dto.contractId !== undefined)
      result.contract_id = dto.contractId;
    if ('referenceClient' in dto && dto.referenceClient !== undefined)
      result.reference_client = dto.referenceClient;
    if ('frequence' in dto && dto.frequence !== undefined)
      result.frequence = dto.frequence;
    if ('typeDemande' in dto && dto.typeDemande !== undefined)
      result.type_demande = dto.typeDemande;
    if ('heureDepart' in dto && dto.heureDepart !== undefined)
      result.heure_depart = dto.heureDepart;
    if ('heureArrivee' in dto && dto.heureArrivee !== undefined)
      result.heure_arrivee = dto.heureArrivee;

    // Auto-compute prestation-level times from etapes if not explicitly set
    if (
      dto.etapes &&
      dto.etapes.length > 0 &&
      !result.heure_depart &&
      !result.heure_arrivee
    ) {
      const firstEtape = dto.etapes[0];
      const lastEtape = dto.etapes[dto.etapes.length - 1];
      // Use presence or depart from first etape
      const computedDepart =
        firstEtape.heurePresence || firstEtape.heureDepart || null;
      // Use arrivee or fin from last etape
      const computedArrivee =
        lastEtape.heureFin || lastEtape.heureArrivee || null;
      if (computedDepart) result.heure_depart = computedDepart;
      if (computedArrivee) result.heure_arrivee = computedArrivee;
    }

    // Convert etapes EtapeDto[] to JSONB[] with snake_case keys
    // New ride-based format: each étape = 1 complete ride with departure + arrival
    if ('etapes' in dto && dto.etapes !== undefined) {
      result.etapes = dto.etapes.map((etape) => ({
        // Ride ID (for syncing on update)
        ride_id: etape.rideId || null,
        // New ride-based format
        address_depart: etape.addressDepart || etape.addressId || null,
        address_arrivee: etape.addressArrivee || null,
        // Legacy field for backward compatibility
        address_id: etape.addressDepart || etape.addressId || null,
        // EID: Editable client reference for this ride
        reference_client: etape.referenceClient || null,
        heure_presence: etape.heurePresence || null,
        heure_depart: etape.heureDepart || null,
        heure_arrivee: etape.heureArrivee || null,
        heure_fin: etape.heureFin || null,
        vide: etape.vide ?? false,
        comment: etape.comment || null,
      }));
    }
    if ('typologieVehicule' in dto && dto.typologieVehicule !== undefined)
      result.typologie_vehicule = dto.typologieVehicule;
    if ('energieImposee' in dto && dto.energieImposee !== undefined)
      result.energie_imposee = dto.energieImposee;
    if ('typeRemorque' in dto && dto.typeRemorque !== undefined)
      result.type_remorque = dto.typeRemorque;
    // MCom-0013: Equipment specificities (now JSONB object)
    if ('specificites' in dto && dto.specificites !== undefined)
      result.specificites = dto.specificites;
    // Contrainte Conducteur (TEXT array)
    if (
      'contraintesConducteur' in dto &&
      dto.contraintesConducteur !== undefined
    )
      result.contraintes_conducteur = dto.contraintesConducteur;
    if ('sensible' in dto && dto.sensible !== undefined)
      result.sensible = dto.sensible;
    // Code déchargement
    if ('codeDechargement' in dto && dto.codeDechargement !== undefined)
      result.code_dechargement = dto.codeDechargement;
    // Type tracteur (VL / CM / SPL)
    if ('typeTracteur' in dto && dto.typeTracteur !== undefined)
      result.type_tracteur = dto.typeTracteur;
    if ('comment' in dto && dto.comment !== undefined)
      result.comment = dto.comment;
    // Billing fields
    if ('aFacturer' in dto && dto.aFacturer !== undefined) {
      result.a_facturer = dto.aFacturer;
      // Set date_facturation when marking as billable
      if (dto.aFacturer) {
        result.date_facturation = new Date().toISOString();
      }
    }
    // Mileage fields (for MAD)
    if ('kilometragePrevu' in dto && dto.kilometragePrevu !== undefined)
      result.kilometrage_prevu = dto.kilometragePrevu;
    if ('kilometrageReel' in dto && dto.kilometrageReel !== undefined)
      result.kilometrage_reel = dto.kilometrageReel;
    // MCom-0015: Price/tariff fields with type
    if ('typeTarif' in dto && dto.typeTarif !== undefined)
      result.type_tarif = dto.typeTarif;
    if ('tarif' in dto && dto.tarif !== undefined) result.tarif = dto.tarif;
    if ('tarifUnite' in dto && dto.tarifUnite !== undefined)
      result.tarif_unite = dto.tarifUnite;
    // MCom-25: Contractual billing amounts
    if ('tarifKmContractuel' in dto && dto.tarifKmContractuel !== undefined)
      result.tarif_km_contractuel = dto.tarifKmContractuel;
    if (
      'tarifHeuresContractuel' in dto &&
      dto.tarifHeuresContractuel !== undefined
    )
      result.tarif_heures_contractuel = dto.tarifHeuresContractuel;

    return result;
  }

  // ============================================
  // Export/Import Methods
  // ============================================

  async exportToExcel(): Promise<Buffer> {
    // Get prestations with contract info
    const { data, error } = await this.supabase
      .from('prestation')
      .select(
        `
        *,
        contract:contract_id (reference)
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Get all prestation IDs
    const prestationIds = data.map((p: any) => p.id);

    // Fetch all rides for these prestations
    const { data: ridesData, error: ridesError } = await this.supabase
      .from('ride')
      .select('*')
      .in('prestation_id', prestationIds)
      .order('order_index', { ascending: true });

    if (ridesError) {
      throw new BadRequestException(ridesError.message);
    }

    // Group rides by prestation_id
    const ridesByPrestation = new Map<string, any[]>();
    (ridesData || []).forEach((ride: any) => {
      const rides = ridesByPrestation.get(ride.prestation_id) || [];
      rides.push(ride);
      ridesByPrestation.set(ride.prestation_id, rides);
    });

    // Collect all address IDs for lookup
    const allAddressIds = new Set<string>();
    (ridesData || []).forEach((ride: any) => {
      if (ride.address_depart) allAddressIds.add(ride.address_depart);
      if (ride.address_arrivee) allAddressIds.add(ride.address_arrivee);
      if (ride.address_id) allAddressIds.add(ride.address_id);
    });

    // Fetch address references
    const addressMap = new Map<string, string>();
    if (allAddressIds.size > 0) {
      const { data: addresses } = await this.supabase
        .from('address')
        .select('id, reference')
        .in('id', Array.from(allAddressIds));

      (addresses || []).forEach((addr: any) => {
        addressMap.set(addr.id, addr.reference);
      });
    }

    // Find max number of trajets
    let maxTrajets = 1;
    ridesByPrestation.forEach((rides) => {
      if (rides.length > maxTrajets) maxTrajets = rides.length;
    });

    // Build dynamic columns for each trajet (9 columns per trajet)
    const dynamicTrajetColumns: ColumnConfig[] = [];
    for (let i = 1; i <= maxTrajets; i++) {
      dynamicTrajetColumns.push(
        {
          frenchHeader: `Trajet ${i} (Adresse départ)`,
          field: `trajet${i}_adresse_depart`,
          required: i === 1,
          type: 'string',
        },
        {
          frenchHeader: `Trajet ${i} (Adresse arrivée)`,
          field: `trajet${i}_adresse_arrivee`,
          required: i === 1,
          type: 'string',
        },
        {
          frenchHeader: `Trajet ${i} (Date départ)`,
          field: `trajet${i}_date_depart`,
          required: false,
          type: 'string',
        },
        {
          frenchHeader: `Trajet ${i} (H. présence)`,
          field: `trajet${i}_h_presence`,
          required: false,
          type: 'string',
        },
        {
          frenchHeader: `Trajet ${i} (H. départ)`,
          field: `trajet${i}_h_depart`,
          required: false,
          type: 'string',
        },
        {
          frenchHeader: `Trajet ${i} (Date arrivée)`,
          field: `trajet${i}_date_arrivee`,
          required: false,
          type: 'string',
        },
        {
          frenchHeader: `Trajet ${i} (H. arrivée)`,
          field: `trajet${i}_h_arrivee`,
          required: false,
          type: 'string',
        },
        {
          frenchHeader: `Trajet ${i} (H. fin)`,
          field: `trajet${i}_h_fin`,
          required: false,
          type: 'string',
        },
        {
          frenchHeader: `Trajet ${i} (Vide)`,
          field: `trajet${i}_vide`,
          required: false,
          type: 'boolean',
        },
      );
    }

    const exportColumns = [
      ...PRESTATION_BASE_COLUMNS,
      ...dynamicTrajetColumns,
      ...PRESTATION_EXTRA_COLUMNS,
    ];

    // Helper to format timestamp to date and time
    const formatTimestamp = (
      ts: string | null,
    ): { date: string; time: string } => {
      if (!ts) return { date: '', time: '' };
      try {
        const d = new Date(ts);
        const date = d.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const time = d.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return { date, time };
      } catch {
        return { date: '', time: '' };
      }
    };

    // Build export data with dynamic trajet columns
    const exportData = data.map((prestation: any) => {
      const rides = ridesByPrestation.get(prestation.id) || [];

      const row: any = {
        contractReference: prestation.contract?.reference || '',
        referenceClient: prestation.reference_client || '',
        typologieVehicule: prestation.typologie_vehicule,
        energieImposee: prestation.energie_imposee,
        typeRemorque: prestation.type_remorque,
        sensible: prestation.sensible,
        codeDechargement: prestation.code_dechargement,
        comment: prestation.comment,
        frequence: prestation.frequence,
      };

      // Add trajet columns from rides
      rides.forEach((ride: any, index: number) => {
        const trajetNum = index + 1;

        // Get address references
        const adresseDepart = ride.address_depart
          ? addressMap.get(ride.address_depart) || ride.address_depart
          : '';
        const adresseArrivee = ride.address_arrivee
          ? addressMap.get(ride.address_arrivee) || ride.address_arrivee
          : '';

        // Parse timestamps
        const presenceTs = formatTimestamp(ride.presence_chargement);
        const departTs = formatTimestamp(ride.depart_chargement);
        const arriveeTs = formatTimestamp(ride.arrivee_livraison);
        const finTs = formatTimestamp(ride.fin_livraison);

        row[`trajet${trajetNum}_adresse_depart`] = adresseDepart;
        row[`trajet${trajetNum}_adresse_arrivee`] = adresseArrivee;
        row[`trajet${trajetNum}_date_depart`] =
          presenceTs.date || departTs.date;
        row[`trajet${trajetNum}_h_presence`] = presenceTs.time;
        row[`trajet${trajetNum}_h_depart`] = departTs.time;
        row[`trajet${trajetNum}_date_arrivee`] = arriveeTs.date || finTs.date;
        row[`trajet${trajetNum}_h_arrivee`] = arriveeTs.time;
        row[`trajet${trajetNum}_h_fin`] = finTs.time;
        row[`trajet${trajetNum}_vide`] = ride.vide ? 'Oui' : 'Non';
      });

      return row;
    });

    return this.excelService.generateExcel(exportData, exportColumns);
  }

  getImportTemplate(): Buffer {
    // Instructions for trajet-based import
    const trajetInstructions = [
      '--- INSTRUCTIONS POUR LES TRAJETS ---',
      '',
      'Chaque trajet comporte 9 colonnes:',
      '',
      "• Trajet N (Adresse départ) (*) = Référence de l'adresse de chargement",
      "• Trajet N (Adresse arrivée) (*) = Référence de l'adresse de livraison",
      '• Trajet N (Date départ) = Date de départ (format JJ/MM/AAAA)',
      '• Trajet N (H. présence) = Heure arrivée au quai chargement (format HH:mm)',
      '• Trajet N (H. départ) = Heure départ du chargement (format HH:mm)',
      "• Trajet N (Date arrivée) = Date d'arrivée (format JJ/MM/AAAA)",
      '• Trajet N (H. arrivée) = Heure arrivée livraison (format HH:mm)',
      '• Trajet N (H. fin) = Heure fin de livraison (format HH:mm)',
      '• Trajet N (Vide) = Trajet à vide? (Oui/Non)',
      '',
      'RÈGLES IMPORTANTES:',
      '• Minimum 1 trajet requis par prestation',
      '• Les adresses doivent référencer des adresses existantes par leur RÉFÉRENCE',
      '• Les références de trajet sont générées automatiquement (RDE-XXXXXX)',
      '',
      'EXEMPLE:',
      '  Trajet 1 (Adresse départ): "ADR-2026-0001" → Point de chargement',
      '  Trajet 1 (Adresse arrivée): "ADR-2026-0002" → Point de livraison',
      '  Trajet 1 (Date départ): "01/02/2026"',
      '  Trajet 1 (H. présence): "08:00" → Arrivée au quai',
      '  Trajet 1 (H. départ): "08:30" → Départ du chargement',
      '  Trajet 1 (Date arrivée): "01/02/2026"',
      '  Trajet 1 (H. arrivée): "12:00" → Arrivée à livraison',
      '  Trajet 1 (H. fin): "12:30" → Fin de déchargement',
      '  Trajet 1 (Vide): "Non" → Camion chargé',
      '',
      'AJOUTER PLUS DE TRAJETS:',
      '  Pour ajouter des trajets supplémentaires, créez 9 nouvelles colonnes',
      '  dans Excel avec les en-têtes Trajet 2 (Adresse départ), etc.',
      '  Vous pouvez ajouter autant de trajets que nécessaire.',
    ];

    return this.excelService.generateTemplate(
      PRESTATION_TEMPLATE_COLUMNS,
      'Prestations',
      PRESTATION_EXAMPLE_ROW,
      trajetInstructions,
    );
  }

  getImportGuidelines(): string {
    const trajetInstructions = [
      '',
      'RÈGLES POUR LES TRAJETS:',
      '-'.repeat(40),
      '',
      'Chaque trajet comporte 9 colonnes:',
      '• Trajet N (Adresse départ) (*) = Référence adresse chargement',
      '• Trajet N (Adresse arrivée) (*) = Référence adresse livraison',
      '• Trajet N (Date départ) = Date de départ (JJ/MM/AAAA)',
      '• Trajet N (H. présence) = Heure arrivée au quai (HH:mm)',
      '• Trajet N (H. départ) = Heure départ chargement (HH:mm)',
      "• Trajet N (Date arrivée) = Date d'arrivée (JJ/MM/AAAA)",
      '• Trajet N (H. arrivée) = Heure arrivée livraison (HH:mm)',
      '• Trajet N (H. fin) = Heure fin livraison (HH:mm)',
      '• Trajet N (Vide) = Trajet à vide? (Oui/Non)',
      '',
      'IMPORTANT:',
      '• Minimum 1 trajet requis par prestation',
      '• Les adresses doivent référencer des adresses existantes',
      '• Les références sont générées automatiquement (RDE-XXXXXX)',
      '',
      'EXEMPLE:',
      '  Trajet 1 (Adresse départ): "ADR-2026-0001"',
      '  Trajet 1 (Adresse arrivée): "ADR-2026-0002"',
      '  Trajet 1 (Date départ): "01/02/2026"',
      '  Trajet 1 (H. présence): "08:00"',
      '  Trajet 1 (H. départ): "08:30"',
      '  Trajet 1 (Date arrivée): "01/02/2026"',
      '  Trajet 1 (H. arrivée): "12:00"',
      '  Trajet 1 (H. fin): "12:30"',
      '  Trajet 1 (Vide): "Non"',
      '',
      'AJOUTER PLUS DE TRAJETS:',
      '  Créez 9 colonnes par trajet avec les en-têtes appropriés.',
    ];

    return this.excelService.generateGuidelinesTxt(
      PRESTATION_TEMPLATE_COLUMNS,
      'Prestations',
      trajetInstructions,
    );
  }

  async importFromExcel(
    buffer: Buffer,
    additionalContractMap?: Map<string, string>,
    additionalAddressMap?: Map<string, string>,
  ): Promise<ImportResult> {
    // Custom parsing for dynamic trajet columns
    const wb = await import('xlsx').then((m) =>
      m.read(buffer, { type: 'buffer' }),
    );
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];
    const rawData: any[][] = await import('xlsx').then((m) =>
      m.utils.sheet_to_json(ws, { header: 1 }),
    );

    if (rawData.length < 2) {
      return {
        success: false,
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        errors: [
          {
            row: 0,
            field: '',
            value: null,
            message: 'Le fichier est vide ou ne contient que des en-têtes',
          },
        ],
        createdIds: [],
      };
    }

    // Parse headers and identify trajet columns
    const headers = rawData[0].map((h: any) =>
      String(h || '')
        .trim()
        .replace(/\s*\(\*\)\s*$/, ''),
    );

    // Trajet column info: 9 columns per trajet
    interface TrajetColumnInfo {
      trajetNum: number;
      adresseDepartIndex?: number;
      adresseArriveeIndex?: number;
      dateDepartIndex?: number;
      hPresenceIndex?: number;
      hDepartIndex?: number;
      dateArriveeIndex?: number;
      hArriveeIndex?: number;
      hFinIndex?: number;
      videIndex?: number;
    }
    const trajetColumnsMap = new Map<number, TrajetColumnInfo>();

    headers.forEach((header, index) => {
      // Match "Trajet N (Type)" format
      const match = header.match(
        /^Trajet\s*(\d+)\s*\((Adresse départ|Adresse arrivée|Date départ|H\.\s*présence|H\.\s*départ|Date arrivée|H\.\s*arrivée|H\.\s*fin|Vide)\)$/i,
      );
      if (match) {
        const trajetNum = parseInt(match[1], 10);
        const type = match[2].toLowerCase();

        if (!trajetColumnsMap.has(trajetNum)) {
          trajetColumnsMap.set(trajetNum, { trajetNum });
        }
        const info = trajetColumnsMap.get(trajetNum)!;

        if (type === 'adresse départ') info.adresseDepartIndex = index;
        else if (type === 'adresse arrivée') info.adresseArriveeIndex = index;
        else if (type === 'date départ') info.dateDepartIndex = index;
        else if (type.includes('présence')) info.hPresenceIndex = index;
        else if (type === 'h. départ') info.hDepartIndex = index;
        else if (type === 'date arrivée') info.dateArriveeIndex = index;
        else if (type === 'h. arrivée') info.hArriveeIndex = index;
        else if (type === 'h. fin') info.hFinIndex = index;
        else if (type === 'vide') info.videIndex = index;
      }
    });

    // Convert map to sorted array
    const trajetColumns = Array.from(trajetColumnsMap.values())
      .filter(
        (t) =>
          t.adresseDepartIndex !== undefined ||
          t.adresseArriveeIndex !== undefined,
      )
      .sort((a, b) => a.trajetNum - b.trajetNum);

    // Collect all address references and contract references for lookup
    const addressRefs = new Set<string>();
    const contractRefs = new Set<string>();

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.every((cell: any) => !cell)) continue;

      // Get contract reference
      const contractRefIndex = headers.findIndex(
        (h) => h.toLowerCase() === 'référence contrat',
      );
      if (contractRefIndex !== -1 && row[contractRefIndex]) {
        contractRefs.add(String(row[contractRefIndex]).trim());
      }

      // Get all trajet address references
      trajetColumns.forEach((t) => {
        if (t.adresseDepartIndex !== undefined && row[t.adresseDepartIndex]) {
          addressRefs.add(String(row[t.adresseDepartIndex]).trim());
        }
        if (t.adresseArriveeIndex !== undefined && row[t.adresseArriveeIndex]) {
          addressRefs.add(String(row[t.adresseArriveeIndex]).trim());
        }
      });
    }

    // Build lookup maps
    const { data: contracts } = await this.supabase
      .from('contract')
      .select('id, reference')
      .in('reference', Array.from(contractRefs));

    const contractMap = new Map<string, string>();
    (contracts || []).forEach((c: any) => {
      contractMap.set(c.reference, c.id);
    });
    // Merge additional contract map (from combined imports)
    if (additionalContractMap) {
      additionalContractMap.forEach((id, ref) => contractMap.set(ref, id));
    }

    const addressMap = new Map<string, string>();
    if (addressRefs.size > 0) {
      const { data: addresses } = await this.supabase
        .from('address')
        .select('id, reference')
        .in('reference', Array.from(addressRefs));

      (addresses || []).forEach((a: any) => {
        addressMap.set(a.reference, a.id);
      });
    }
    // Merge additional address map (from combined imports)
    if (additionalAddressMap) {
      additionalAddressMap.forEach((id, ref) => addressMap.set(ref, id));
    }

    // Helper to get column value
    const getColumnValue = (row: any[], columnName: string): any => {
      const index = headers.findIndex(
        (h) => h.toLowerCase() === columnName.toLowerCase(),
      );
      return index !== -1 ? row[index] : undefined;
    };

    // Helper to parse boolean values
    const parseBoolValue = (val: any): boolean => {
      if (!val) return false;
      return ['oui', 'yes', 'true', '1', 'vrai'].includes(
        String(val).toLowerCase().trim(),
      );
    };

    // Helper to parse time values (HH:mm format)
    const parseTimeValue = (val: any): string | undefined => {
      if (!val) return undefined;
      const timeStr = String(val).trim();
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
        return timeStr;
      }
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(timeStr)) {
        return timeStr.substring(0, 5);
      }
      return undefined;
    };

    // Helper to parse date values (JJ/MM/AAAA format)
    const parseDateValue = (val: any): string | undefined => {
      if (!val) return undefined;
      const dateStr = String(val).trim();
      // Try DD/MM/YYYY format
      const parts = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (parts) {
        return `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
      // Try YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      return undefined;
    };

    // Helper to combine date and time into ISO timestamp
    const combineDateTime = (
      date: string | undefined,
      time: string | undefined,
    ): string | null => {
      if (!date) return null;
      const baseDate = date; // Already in YYYY-MM-DD format
      if (time) {
        return `${baseDate}T${time}:00`;
      }
      return `${baseDate}T00:00:00`;
    };

    const createdIds: string[] = [];
    const errors: ImportError[] = [];
    let successCount = 0;
    let totalRows = 0;

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.every((cell: any) => !cell)) continue;

      totalRows++;
      const rowNumber = i + 1;

      // Validate and get contract reference
      const contractRef = getColumnValue(row, 'Référence contrat');
      if (!contractRef) {
        errors.push({
          row: rowNumber,
          field: 'contractReference',
          value: null,
          message: 'Le champ "Référence contrat" est requis',
        });
        continue;
      }

      const contractId = contractMap.get(String(contractRef).trim());
      if (!contractId) {
        errors.push({
          row: rowNumber,
          field: 'contractReference',
          value: contractRef,
          message: `Contrat avec la référence "${contractRef}" introuvable`,
        });
        continue;
      }

      // Parse trajet columns - collect all valid trajets
      const trajets: Array<{
        addressDepartId: string;
        addressArriveeId: string;
        dateDepart?: string;
        hPresence?: string;
        hDepart?: string;
        dateArrivee?: string;
        hArrivee?: string;
        hFin?: string;
        vide: boolean;
      }> = [];
      let trajetError = false;

      for (const trajetInfo of trajetColumns) {
        const adresseDepartVal =
          trajetInfo.adresseDepartIndex !== undefined
            ? row[trajetInfo.adresseDepartIndex]
            : undefined;
        const adresseArriveeVal =
          trajetInfo.adresseArriveeIndex !== undefined
            ? row[trajetInfo.adresseArriveeIndex]
            : undefined;

        // Skip empty trajets
        if (!adresseDepartVal && !adresseArriveeVal) continue;

        // Validate addresses
        if (!adresseDepartVal) {
          errors.push({
            row: rowNumber,
            field: `trajet${trajetInfo.trajetNum}_adresse_depart`,
            value: null,
            message: `Trajet ${trajetInfo.trajetNum}: Adresse de départ requise`,
          });
          trajetError = true;
          break;
        }
        if (!adresseArriveeVal) {
          errors.push({
            row: rowNumber,
            field: `trajet${trajetInfo.trajetNum}_adresse_arrivee`,
            value: null,
            message: `Trajet ${trajetInfo.trajetNum}: Adresse d'arrivée requise`,
          });
          trajetError = true;
          break;
        }

        const adresseDepartRef = String(adresseDepartVal).trim();
        const adresseArriveeRef = String(adresseArriveeVal).trim();

        const addressDepartId = addressMap.get(adresseDepartRef);
        const addressArriveeId = addressMap.get(adresseArriveeRef);

        if (!addressDepartId) {
          errors.push({
            row: rowNumber,
            field: `trajet${trajetInfo.trajetNum}_adresse_depart`,
            value: adresseDepartRef,
            message: `Trajet ${trajetInfo.trajetNum}: Adresse départ "${adresseDepartRef}" introuvable`,
          });
          trajetError = true;
          break;
        }
        if (!addressArriveeId) {
          errors.push({
            row: rowNumber,
            field: `trajet${trajetInfo.trajetNum}_adresse_arrivee`,
            value: adresseArriveeRef,
            message: `Trajet ${trajetInfo.trajetNum}: Adresse arrivée "${adresseArriveeRef}" introuvable`,
          });
          trajetError = true;
          break;
        }

        // Get dates and times
        const dateDepart =
          trajetInfo.dateDepartIndex !== undefined
            ? parseDateValue(row[trajetInfo.dateDepartIndex])
            : undefined;
        const hPresence =
          trajetInfo.hPresenceIndex !== undefined
            ? parseTimeValue(row[trajetInfo.hPresenceIndex])
            : undefined;
        const hDepart =
          trajetInfo.hDepartIndex !== undefined
            ? parseTimeValue(row[trajetInfo.hDepartIndex])
            : undefined;
        const dateArrivee =
          trajetInfo.dateArriveeIndex !== undefined
            ? parseDateValue(row[trajetInfo.dateArriveeIndex])
            : undefined;
        const hArrivee =
          trajetInfo.hArriveeIndex !== undefined
            ? parseTimeValue(row[trajetInfo.hArriveeIndex])
            : undefined;
        const hFin =
          trajetInfo.hFinIndex !== undefined
            ? parseTimeValue(row[trajetInfo.hFinIndex])
            : undefined;
        const vide =
          trajetInfo.videIndex !== undefined
            ? parseBoolValue(row[trajetInfo.videIndex])
            : false;

        trajets.push({
          addressDepartId,
          addressArriveeId,
          dateDepart,
          hPresence,
          hDepart,
          dateArrivee,
          hArrivee,
          hFin,
          vide,
        });
      }

      if (trajetError) continue;

      // Validate minimum 1 trajet
      if (trajets.length < 1) {
        errors.push({
          row: rowNumber,
          field: 'trajets',
          value: null,
          message: 'Au moins 1 trajet est requis',
        });
        continue;
      }

      try {
        // Get other fields
        const referenceClient =
          getColumnValue(row, 'Référence prestation client') ||
          getColumnValue(row, 'Code article');
        const typologieVehicule = getColumnValue(row, 'Type véhicule');
        const energieImposee = getColumnValue(row, 'Énergie imposée');
        const typeRemorque = getColumnValue(row, 'Type remorque');
        const sensibleVal = getColumnValue(row, 'Sensible');
        const codeDechargement = getColumnValue(row, 'Code déchargement');
        const comment = getColumnValue(row, 'Commentaire');
        const frequenceVal = getColumnValue(row, 'Fréquence');

        const sensible = parseBoolValue(sensibleVal);
        const frequence = frequenceVal
          ? String(frequenceVal)
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s)
          : [];

        // Create prestation directly (without etapes - we'll create rides separately)
        const prestationData = {
          contract_id: contractId,
          reference_client: referenceClient ? String(referenceClient) : null,
          typologie_vehicule: typologieVehicule
            ? String(typologieVehicule)
            : 'SPL',
          energie_imposee: energieImposee ? String(energieImposee) : 'Gazole',
          type_remorque: typeRemorque ? String(typeRemorque) : 'Tautliner',
          sensible,
          code_dechargement: codeDechargement ? String(codeDechargement) : null,
          comment: comment ? String(comment) : null,
          frequence,
          etapes: [], // Empty - we use rides table now
        };

        const { data: createdPrestation, error: prestationError } =
          await this.supabase
            .from('prestation')
            .insert(prestationData)
            .select('id, reference')
            .single();

        if (prestationError) {
          throw new Error(prestationError.message);
        }

        // Create ride records for each trajet
        for (let idx = 0; idx < trajets.length; idx++) {
          const trajet = trajets[idx];

          // Build timestamps by combining date + time
          const presenceChargement = combineDateTime(
            trajet.dateDepart,
            trajet.hPresence,
          );
          const departChargement = combineDateTime(
            trajet.dateDepart,
            trajet.hDepart,
          );
          const arriveeLivraison = combineDateTime(
            trajet.dateArrivee,
            trajet.hArrivee,
          );
          const finLivraison = combineDateTime(trajet.dateArrivee, trajet.hFin);

          const rideData = {
            prestation_id: createdPrestation.id,
            address_depart: trajet.addressDepartId,
            address_arrivee: trajet.addressArriveeId,
            order_index: idx,
            presence_chargement: presenceChargement,
            depart_chargement: departChargement,
            arrivee_livraison: arriveeLivraison,
            fin_livraison: finLivraison,
            vide: trajet.vide,
            // reference is auto-generated by SQL trigger
          };

          const { error: rideError } = await this.supabase
            .from('ride')
            .insert(rideData);

          if (rideError) {
            this.logger.error(
              `Error creating ride for prestation ${createdPrestation.id}`,
              rideError,
            );
            // Continue anyway - prestation was created
          }
        }

        createdIds.push(createdPrestation.id);
        successCount++;
      } catch (error: any) {
        errors.push({
          row: rowNumber,
          field: '',
          value: null,
          message:
            error.message || 'Erreur lors de la création de la prestation',
        });
      }
    }

    return {
      success: errors.length === 0,
      totalRows,
      successCount,
      errorCount: errors.length,
      errors,
      createdIds,
    };
  }
}

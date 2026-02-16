import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import { CreateContractDto, UpdateContractDto } from '../dto/contract';
import { ExcelService } from '../../shared/services/excel.service';
import {
  ColumnConfig,
  ImportResult,
  ImportError,
} from '../../shared/dto/import-result.dto';
import { ActivityService, ActivityType, EntityType } from './activity.service';

// Column configuration for Contract import/export
// Single reference field - auto-generated if empty (format: CTR-YYYY-XXXX)
const CONTRACT_COLUMNS: ColumnConfig[] = [
  {
    frenchHeader: 'Référence',
    field: 'reference',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Référence client',
    field: 'clientReference',
    required: true,
    type: 'string',
  },
  {
    frenchHeader: 'Description',
    field: 'description',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Date début',
    field: 'startDate',
    required: true,
    type: 'date',
  },
  { frenchHeader: 'Date fin', field: 'endDate', required: false, type: 'date' },
  {
    frenchHeader: 'Renouvellement auto',
    field: 'autoRenew',
    required: false,
    type: 'boolean',
    defaultValue: false,
  },
  {
    frenchHeader: 'Statut',
    field: 'status',
    required: false,
    type: 'enum',
    enumValues: ['active', 'inactive', 'terminated'],
    defaultValue: 'active',
  },
  {
    frenchHeader: 'Commentaire',
    field: 'comment',
    required: false,
    type: 'string',
  },
];

const CONTRACT_EXAMPLE_ROW = {
  reference: 'CTR-2026-0001',
  clientReference: 'CLI-2026-0001',
  description: 'Contrat de transport régulier',
  startDate: '01/01/2026',
  endDate: '31/12/2026',
  autoRenew: 'Oui',
  status: 'active',
  comment: 'Commentaire contrat',
};

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly excelService: ExcelService,
    @Inject(forwardRef(() => ActivityService))
    private readonly activityService: ActivityService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findAll(includeInactive = false) {
    let query = this.supabase.from('contract').select(
      `
        *,
        client:client_id (
          id,
          reference,
          name,
          initials,
          avatar_url,
          color,
          siret,
          headquarters_city
        )
      `,
    );

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      this.logger.error('Error fetching contracts', error);
      throw new BadRequestException(error.message);
    }

    // Add prestation count for each contract
    const contractsWithCount = await Promise.all(
      data.map(async (contract: any) => {
        const { count } = await this.supabase
          .from('prestation')
          .select('*', { count: 'exact', head: true })
          .eq('contract_id', contract.id);

        return {
          ...this.transformContractWithClient(contract),
          prestationsCount: count || 0,
        };
      }),
    );

    return contractsWithCount;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('contract')
      .select(
        `
        *,
        client:client_id (
          id,
          reference,
          name,
          initials,
          avatar_url,
          color,
          siret,
          headquarters_city
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Contract with ID ${id} not found`);
      }
      throw new BadRequestException(error.message);
    }

    // Get prestation count
    const { count } = await this.supabase
      .from('prestation')
      .select('*', { count: 'exact', head: true })
      .eq('contract_id', id);

    return {
      ...this.transformContractWithClient(data),
      prestationsCount: count || 0,
    };
  }

  async create(
    createContractDto: CreateContractDto,
    userId?: string,
    userName?: string,
  ) {
    const contractData = this.transformDtoToDb(createContractDto);

    const { data, error } = await this.supabase
      .from('contract')
      .insert(contractData)
      .select(
        `
        *,
        client:client_id (
          id,
          reference,
          name,
          initials,
          avatar_url,
          color,
          siret,
          headquarters_city
        )
      `,
      )
      .single();

    if (error) {
      this.logger.error('Error creating contract', error);
      throw new BadRequestException(error.message);
    }

    const contract = {
      ...this.transformContractWithClient(data),
      prestationsCount: 0,
    };

    // Log activity
    await this.activityService.log(
      ActivityType.CONTRAT_SIGNE,
      contract.reference,
      contract.reference,
      userId,
      userName,
      EntityType.CONTRACT,
      contract.id,
      { clientId: contract.client?.id },
    );

    return contract;
  }

  /**
   * Sync Référence Facturation: update client.reference when changed on a contract
   */
  async syncReferenceFacturation(
    contractId: string,
    referenceFacturation: string,
  ) {
    // Get the contract to find the client
    const { data: contract, error: contractError } = await this.supabase
      .from('contract')
      .select('client_id')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    // Update client.reference
    const { error: clientError } = await this.supabase
      .from('client')
      .update({ reference: referenceFacturation })
      .eq('id', contract.client_id);

    if (clientError) {
      this.logger.error(
        'Error syncing reference facturation to client',
        clientError,
      );
      throw new BadRequestException(clientError.message);
    }
  }

  async update(
    id: string,
    updateContractDto: UpdateContractDto,
    userId?: string,
    userName?: string,
  ) {
    // First check if contract exists
    await this.findOne(id);

    const contractData = this.transformDtoToDb(updateContractDto, true);

    // If referenceFacturation is being updated, sync it to the client
    if (
      'referenceFacturation' in updateContractDto &&
      updateContractDto.referenceFacturation !== undefined
    ) {
      await this.syncReferenceFacturation(
        id,
        updateContractDto.referenceFacturation,
      );
    }

    const { data, error } = await this.supabase
      .from('contract')
      .update(contractData)
      .eq('id', id)
      .select(
        `
        *,
        client:client_id (
          id,
          reference,
          name,
          initials,
          avatar_url,
          color,
          siret,
          headquarters_city
        )
      `,
      )
      .single();

    if (error) {
      this.logger.error('Error updating contract', error);
      throw new BadRequestException(error.message);
    }

    // Get prestation count
    const { count } = await this.supabase
      .from('prestation')
      .select('*', { count: 'exact', head: true })
      .eq('contract_id', id);

    const contract = {
      ...this.transformContractWithClient(data),
      prestationsCount: count || 0,
    };

    // Log activity
    await this.activityService.log(
      ActivityType.CONTRAT_MODIFIE,
      contract.reference,
      contract.reference,
      userId,
      userName,
      EntityType.CONTRACT,
      contract.id,
      { clientId: contract.client?.id },
    );

    return contract;
  }

  async remove(id: string, userId?: string, userName?: string) {
    // First check if contract exists
    const contract = await this.findOne(id);

    const { error } = await this.supabase
      .from('contract')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Error deleting contract', error);
      throw new BadRequestException(error.message);
    }

    // Log activity
    await this.activityService.log(
      ActivityType.CONTRAT_SUPPRIME,
      contract.reference,
      contract.reference,
      userId,
      userName,
      EntityType.CONTRACT,
      id,
      { clientId: contract.client?.id },
    );

    return { message: 'Contract deleted successfully' };
  }

  async getPrestations(contractId: string) {
    // First check if contract exists
    await this.findOne(contractId);

    const { data, error } = await this.supabase
      .from('prestation')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching contract prestations', error);
      throw new BadRequestException(error.message);
    }

    // Collect all unique address IDs from etapes arrays
    // Handle JSONB objects and corrupted format
    const allAddressIds = new Set<string>();
    data.forEach((prestation: any) => {
      if (prestation.etapes && Array.isArray(prestation.etapes)) {
        const ids = this.extractAddressIdsFromEtapes(prestation.etapes);
        ids.forEach((id) => allAddressIds.add(id));
      }
    });

    // Fetch all addresses in one query
    let addressMap = new Map<string, any>();
    if (allAddressIds.size > 0) {
      const { data: addresses } = await this.supabase
        .from('address')
        .select('id, name, address, postal_code, city, latitude, longitude')
        .in('id', Array.from(allAddressIds));

      if (addresses) {
        addresses.forEach((addr: any) => {
          addressMap.set(addr.id, {
            id: addr.id,
            name: addr.name,
            address: addr.address,
            postalCode: addr.postal_code,
            city: addr.city,
            latitude: addr.latitude,
            longitude: addr.longitude,
          });
        });
      }
    }

    return data.map((prestation: any) =>
      this.transformPrestationWithAddresses(prestation, addressMap),
    );
  }

  // Helper to extract address IDs from etapes array
  // Handles: old UUID strings, new JSONB objects, corrupted stringified JSON
  private extractAddressIdsFromEtapes(etapes: any[]): string[] {
    return etapes
      .map((etape: any) => {
        if (typeof etape === 'string') return etape;
        if (typeof etape === 'object' && etape !== null) {
          // Check if address_id is a stringified JSON (corrupted format)
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
  }

  private transformContractWithClient(data: any) {
    return {
      id: data.id,
      reference: data.reference,
      invoiceCode: data.invoice_code,
      type: data.type,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      autoRenew: data.auto_renew,
      status: data.status,
      comment: data.comment,
      clientId: data.client_id,
      client: data.client
        ? {
            id: data.client.id,
            reference: data.client.reference,
            name: data.client.name,
            initials: data.client.initials,
            avatarUrl: data.client.avatar_url,
            color: data.client.color,
            siret: data.client.siret,
            city: data.client.headquarters_city,
          }
        : null,
      importedAt: data.imported_at,
      importedBy: data.imported_by,
      importedByName: data.imported_by_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformPrestationWithAddresses(
    data: any,
    addressMap: Map<string, any> = new Map(),
  ) {
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

      const addr = addressId ? addressMap.get(addressId) : undefined;
      if (addr) {
        return {
          id: addr.id,
          name: addr.name,
          address: addr.address,
          postalCode: addr.postalCode,
          city: addr.city,
          latitude: addr.latitude,
          longitude: addr.longitude,
          order: index,
          heureDepart: heureDepart,
          heureArrivee: heureArrivee,
          vide: vide,
        };
      }
      // Fallback when address not found
      return {
        id: addressId || `unknown-${index}`,
        name: `Adresse ${index + 1}`,
        order: index,
        heureDepart: heureDepart,
        heureArrivee: heureArrivee,
        vide: vide,
      };
    });

    return {
      id: data.id,
      reference: data.reference,
      contractId: data.contract_id,
      frequence: data.frequence,
      typeDemande: data.type_demande,
      heureDepart: data.heure_depart,
      heureArrivee: data.heure_arrivee,
      etapes: etapes,
      itineraires: itineraires,
      typologieVehicule: data.typologie_vehicule,
      energieImposee: data.energie_imposee,
      typeRemorque: data.type_remorque,
      sensible: data.sensible,
      codeDechargement: data.code_dechargement,
      comment: data.comment,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformDtoToDb(
    dto: CreateContractDto | UpdateContractDto,
    isUpdate = false,
  ) {
    const result: any = {};

    // Handle reference: for updates, ignore empty strings (don't update the field)
    // For creates, set to null to trigger auto-generation (format: CTR-YYYY-XXXX)
    if ('reference' in dto && dto.reference !== undefined) {
      if (isUpdate && (!dto.reference || dto.reference.trim() === '')) {
        // Don't include reference in update if it's empty (keep existing value)
        // Do nothing - don't add to result
      } else {
        result.reference =
          dto.reference && dto.reference.trim() !== ''
            ? dto.reference.trim()
            : null;
      }
    }
    if ('invoiceCode' in dto && dto.invoiceCode !== undefined)
      result.invoice_code = dto.invoiceCode;
    if ('type' in dto && dto.type !== undefined) result.type = dto.type;
    if ('description' in dto && dto.description !== undefined)
      result.description = dto.description;
    if ('startDate' in dto && dto.startDate !== undefined)
      result.start_date = dto.startDate;
    if ('endDate' in dto && dto.endDate !== undefined)
      result.end_date = dto.endDate;
    if ('autoRenew' in dto && dto.autoRenew !== undefined)
      result.auto_renew = dto.autoRenew;
    if ('status' in dto && dto.status !== undefined) result.status = dto.status;
    if ('clientId' in dto && dto.clientId !== undefined)
      result.client_id = dto.clientId;
    if ('comment' in dto && dto.comment !== undefined)
      result.comment = dto.comment;

    return result;
  }

  // ============================================
  // Export/Import Methods
  // ============================================

  async exportToExcel(): Promise<Buffer> {
    // Get contracts with client info for export
    const { data, error } = await this.supabase
      .from('contract')
      .select(
        `
        *,
        client:client_id (reference)
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Transform data for export with client reference
    const exportData = data.map((contract: any) => ({
      reference: contract.reference,
      clientReference: contract.client?.reference || '',
      description: contract.description,
      startDate: contract.start_date,
      endDate: contract.end_date,
      autoRenew: contract.auto_renew,
      status: contract.status,
      comment: contract.comment,
    }));

    return this.excelService.generateExcel(exportData, CONTRACT_COLUMNS);
  }

  getImportTemplate(): Buffer {
    return this.excelService.generateTemplate(
      CONTRACT_COLUMNS,
      'Contrats',
      CONTRACT_EXAMPLE_ROW,
    );
  }

  getImportGuidelines(): string {
    return this.excelService.generateGuidelinesTxt(
      CONTRACT_COLUMNS,
      'Contrats',
    );
  }

  async importFromExcel(buffer: Buffer): Promise<ImportResult> {
    const parseResult = this.excelService.parseExcel(buffer, CONTRACT_COLUMNS);

    if (parseResult.errors.length > 0 && parseResult.validRows.length === 0) {
      return {
        success: false,
        totalRows: parseResult.rows.length,
        successCount: 0,
        errorCount: parseResult.errors.length,
        errors: parseResult.errors,
        createdIds: [],
      };
    }

    // Build a map of client references to IDs
    const clientReferences = [
      ...new Set(
        parseResult.rows
          .filter((r) => r.errors.length === 0 && r.data.clientReference)
          .map((r) => r.data.clientReference),
      ),
    ];

    const { data: clients } = await this.supabase
      .from('client')
      .select('id, reference')
      .in('reference', clientReferences);

    const clientMap = new Map<string, string>();
    (clients || []).forEach((c: any) => {
      clientMap.set(c.reference, c.id);
    });

    const createdIds: string[] = [];
    const errors: ImportError[] = [...parseResult.errors];
    let successCount = 0;

    for (const row of parseResult.rows) {
      if (row.errors.length > 0) {
        continue;
      }

      // Look up client ID
      const clientId = clientMap.get(row.data.clientReference);
      if (!clientId) {
        errors.push({
          row: row.rowNumber,
          field: 'clientReference',
          value: row.data.clientReference,
          message: `Client avec la référence "${row.data.clientReference}" introuvable`,
        });
        continue;
      }

      try {
        const contractDto: CreateContractDto = {
          reference: row.data.reference || undefined,
          clientId,
          type: 'Annuel', // Default type, not imported
          description: row.data.description || undefined,
          startDate: row.data.startDate,
          endDate: row.data.endDate || undefined,
          autoRenew: row.data.autoRenew ?? false,
          status: row.data.status || 'active',
          comment: row.data.comment || undefined,
        };

        const created = await this.create(contractDto);
        createdIds.push(created.id);
        successCount++;
      } catch (error: any) {
        errors.push({
          row: row.rowNumber,
          field: '',
          value: null,
          message: error.message || 'Erreur lors de la création du contrat',
        });
      }
    }

    return {
      success: errors.length === 0,
      totalRows: parseResult.rows.length,
      successCount,
      errorCount: errors.length,
      errors,
      createdIds,
    };
  }
}

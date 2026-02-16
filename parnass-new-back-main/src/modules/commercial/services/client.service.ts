import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import { CreateClientDto, UpdateClientDto } from '../dto/client';
import { ExcelService } from '../../shared/services/excel.service';
import {
  ColumnConfig,
  ImportResult,
  ImportError,
} from '../../shared/dto/import-result.dto';
import { ActivityService, ActivityType, EntityType } from './activity.service';

// Column configuration for Client import/export
// Note: initials and color are auto-generated on client side, not imported
// Single reference field - auto-generated if empty (format: CLI-YYYY-XXXX)
const CLIENT_COLUMNS: ColumnConfig[] = [
  {
    frenchHeader: 'Référence Client',
    field: 'reference',
    required: false,
    type: 'string',
  },
  { frenchHeader: 'Nom', field: 'name', required: true, type: 'string' },
  { frenchHeader: 'SIRET', field: 'siret', required: false, type: 'string' },
  {
    frenchHeader: 'N° TVA',
    field: 'vatNumber',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Adresse siège',
    field: 'headquartersAddress',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Code postal siège',
    field: 'headquartersPostalCode',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Ville siège',
    field: 'headquartersCity',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Pays siège',
    field: 'headquartersCountry',
    required: false,
    type: 'string',
    defaultValue: 'France',
  },
  {
    frenchHeader: 'Code pays siège',
    field: 'headquartersCountryCode',
    required: false,
    type: 'string',
    defaultValue: 'FR',
  },
  {
    frenchHeader: 'Statut',
    field: 'status',
    required: false,
    type: 'enum',
    enumValues: ['active', 'inactive'],
    defaultValue: 'active',
  },
  {
    frenchHeader: 'Commentaire',
    field: 'comment',
    required: false,
    type: 'string',
  },
];

const CLIENT_EXAMPLE_ROW = {
  reference: 'CLI-2026-0001',
  name: 'Exemple SARL',
  siret: '12345678901234',
  vatNumber: 'FR12345678901',
  headquartersAddress: '123 Rue de la Paix',
  headquartersPostalCode: '75001',
  headquartersCity: 'Paris',
  headquartersCountry: 'France',
  headquartersCountryCode: 'FR',
  status: 'active',
  comment: 'Commentaire client',
};

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

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
    let query = this.supabase.from('client').select('*');

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query.order('name');

    if (error) {
      this.logger.error('Error fetching clients', error);
      throw new BadRequestException(error.message);
    }

    // Get active contracts count for each client
    const clientIds = data.map((c: any) => c.id);
    const { data: contractCounts, error: contractError } = await this.supabase
      .from('contract')
      .select('client_id')
      .in('client_id', clientIds)
      .eq('status', 'active');

    if (contractError) {
      this.logger.error('Error fetching contract counts', contractError);
    }

    // Create a map of client_id -> active contract count
    const activeContractsMap = new Map<string, number>();
    if (contractCounts) {
      contractCounts.forEach((contract: any) => {
        const count = activeContractsMap.get(contract.client_id) || 0;
        activeContractsMap.set(contract.client_id, count + 1);
      });
    }

    return data.map((item: any) => ({
      ...this.transformClient(item),
      activeContracts: activeContractsMap.get(item.id) || 0,
    }));
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('client')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }
      throw new BadRequestException(error.message);
    }

    return this.transformClient(data);
  }

  async create(
    createClientDto: CreateClientDto,
    userId?: string,
    userName?: string,
  ) {
    const clientData = this.transformDtoToDb(createClientDto);

    const { data, error } = await this.supabase
      .from('client')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating client', error);
      throw new BadRequestException(error.message);
    }

    const client = this.transformClient(data);

    // Log activity
    await this.activityService.log(
      ActivityType.CLIENT_AJOUTE,
      client.name,
      client.reference,
      userId,
      userName,
      EntityType.CLIENT,
      client.id,
    );

    return client;
  }

  // Create with import tracking (sets imported_at timestamp)
  async createWithImportTracking(
    createClientDto: CreateClientDto,
    userId?: string,
    userName?: string,
  ) {
    const clientData = {
      ...this.transformDtoToDb(createClientDto),
      imported_at: new Date().toISOString(),
      imported_by: userId || null,
      imported_by_name: userName || null,
    };

    const { data, error } = await this.supabase
      .from('client')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating client with import tracking', error);
      throw new BadRequestException(error.message);
    }

    return this.transformClient(data);
  }

  async update(
    id: string,
    updateClientDto: UpdateClientDto,
    userId?: string,
    userName?: string,
  ) {
    // First check if client exists
    await this.findOne(id);

    const clientData = this.transformDtoToDb(updateClientDto, true);

    const { data, error } = await this.supabase
      .from('client')
      .update(clientData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating client', error);
      throw new BadRequestException(error.message);
    }

    const client = this.transformClient(data);

    // Log activity
    await this.activityService.log(
      ActivityType.CLIENT_MODIFIE,
      client.name,
      client.reference,
      userId,
      userName,
      EntityType.CLIENT,
      client.id,
    );

    return client;
  }

  async remove(id: string, userId?: string, userName?: string) {
    // First check if client exists
    const client = await this.findOne(id);

    const { error } = await this.supabase.from('client').delete().eq('id', id);

    if (error) {
      this.logger.error('Error deleting client', error);
      throw new BadRequestException(error.message);
    }

    // Log activity
    await this.activityService.log(
      ActivityType.CLIENT_SUPPRIME,
      client.name,
      client.reference,
      userId,
      userName,
      EntityType.CLIENT,
      id,
    );

    return { message: 'Client deleted successfully' };
  }

  async getAddresses(clientId: string) {
    // First check if client exists
    await this.findOne(clientId);

    const { data, error } = await this.supabase
      .from('client_address')
      .select(
        `
        address:address_id (
          id,
          name,
          address,
          postal_code,
          city,
          country,
          country_code,
          latitude,
          longitude,
          comment,
          created_at,
          updated_at
        )
      `,
      )
      .eq('client_id', clientId);

    if (error) {
      this.logger.error('Error fetching client addresses', error);
      throw new BadRequestException(error.message);
    }

    return data.map((item: any) => this.transformAddress(item.address));
  }

  async getContacts(clientId: string) {
    // First check if client exists
    await this.findOne(clientId);

    const { data, error } = await this.supabase
      .from('contact')
      .select('*')
      .eq('client_id', clientId)
      .order('last_name');

    if (error) {
      this.logger.error('Error fetching client contacts', error);
      throw new BadRequestException(error.message);
    }

    return data.map((contact: any) => this.transformContact(contact));
  }

  async getContracts(clientId: string) {
    // First check if client exists
    await this.findOne(clientId);

    const { data, error } = await this.supabase
      .from('contract')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching client contracts', error);
      throw new BadRequestException(error.message);
    }

    return data.map((contract: any) => this.transformContract(contract));
  }

  // Transform database row to API response (snake_case to camelCase)
  private transformClient(data: any) {
    return {
      id: data.id,
      reference: data.reference,
      name: data.name,
      siret: data.siret,
      vatNumber: data.vat_number,
      avatarUrl: data.avatar_url,
      initials: data.initials,
      color: data.color,
      // Headquarters address
      headquartersAddress: data.headquarters_address,
      headquartersPostalCode: data.headquarters_postal_code,
      headquartersCity: data.headquarters_city,
      headquartersCountry: data.headquarters_country,
      headquartersCountryCode: data.headquarters_country_code,
      // Billing address (MCom-006)
      hasDifferentBillingAddress: data.has_different_billing_address || false,
      billingAddress: data.billing_address,
      billingPostalCode: data.billing_postal_code,
      billingCity: data.billing_city,
      billingCountry: data.billing_country,
      billingCountryCode: data.billing_country_code,
      status: data.status,
      comment: data.comment,
      importedAt: data.imported_at,
      importedBy: data.imported_by,
      importedByName: data.imported_by_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformClientList(data: any[]) {
    return data.map((item) => this.transformClient(item));
  }

  private transformAddress(data: any) {
    return {
      id: data.id,
      name: data.name,
      address: data.address,
      postalCode: data.postal_code,
      city: data.city,
      country: data.country,
      countryCode: data.country_code,
      latitude: data.latitude,
      longitude: data.longitude,
      comment: data.comment,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformContact(data: any) {
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      avatarUrl: data.avatar_url,
      clientId: data.client_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformContract(data: any) {
    return {
      id: data.id,
      reference: data.reference,
      name: data.name,
      invoiceCode: data.invoice_code,
      type: data.type,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      autoRenew: data.auto_renew,
      status: data.status,
      clientId: data.client_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Transform DTO to database format (camelCase to snake_case)
  private transformDtoToDb(
    dto: CreateClientDto | UpdateClientDto,
    isUpdate = false,
  ) {
    const result: any = {};

    // Handle reference: for updates, ignore empty strings (don't update the field)
    // For creates, set to null to trigger auto-generation (format: CLI-YYYY-XXXX)
    if (dto.reference !== undefined) {
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
    if (dto.name !== undefined) result.name = dto.name;
    if (dto.siret !== undefined) result.siret = dto.siret;
    if (dto.vatNumber !== undefined) result.vat_number = dto.vatNumber;
    if (dto.avatarUrl !== undefined) result.avatar_url = dto.avatarUrl;
    if (dto.initials !== undefined) result.initials = dto.initials;
    if (dto.color !== undefined) result.color = dto.color;
    if (dto.headquartersAddress !== undefined)
      result.headquarters_address = dto.headquartersAddress;
    if (dto.headquartersPostalCode !== undefined)
      result.headquarters_postal_code = dto.headquartersPostalCode;
    if (dto.headquartersCity !== undefined)
      result.headquarters_city = dto.headquartersCity;
    if (dto.headquartersCountry !== undefined)
      result.headquarters_country = dto.headquartersCountry;
    if (dto.headquartersCountryCode !== undefined)
      result.headquarters_country_code = dto.headquartersCountryCode;
    // Billing address fields (MCom-006)
    if (dto.hasDifferentBillingAddress !== undefined)
      result.has_different_billing_address = dto.hasDifferentBillingAddress;
    if (dto.billingAddress !== undefined)
      result.billing_address = dto.billingAddress;
    if (dto.billingPostalCode !== undefined)
      result.billing_postal_code = dto.billingPostalCode;
    if (dto.billingCity !== undefined) result.billing_city = dto.billingCity;
    if (dto.billingCountry !== undefined)
      result.billing_country = dto.billingCountry;
    if (dto.billingCountryCode !== undefined)
      result.billing_country_code = dto.billingCountryCode;
    if (dto.status !== undefined) result.status = dto.status;
    if (dto.comment !== undefined) result.comment = dto.comment;

    return result;
  }

  // ============================================
  // Export/Import Methods
  // ============================================

  async exportToExcel(): Promise<Buffer> {
    const clients = await this.findAll(true); // Include inactive
    return this.excelService.generateExcel(clients, CLIENT_COLUMNS);
  }

  getImportTemplate(): Buffer {
    return this.excelService.generateTemplate(
      CLIENT_COLUMNS,
      'Clients',
      CLIENT_EXAMPLE_ROW,
    );
  }

  getImportGuidelines(): string {
    return this.excelService.generateGuidelinesTxt(CLIENT_COLUMNS, 'Clients');
  }

  async importFromExcel(buffer: Buffer): Promise<ImportResult> {
    const parseResult = this.excelService.parseExcel(buffer, CLIENT_COLUMNS);

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

    const createdIds: string[] = [];
    const errors: ImportError[] = [...parseResult.errors];
    let successCount = 0;

    for (const row of parseResult.rows) {
      if (row.errors.length > 0) {
        continue; // Skip rows with validation errors
      }

      try {
        // Auto-generate initials from name (first 2 letters uppercase)
        const name = row.data.name || '';
        const autoInitials = name.substring(0, 2).toUpperCase();

        const clientDto: CreateClientDto = {
          reference: row.data.reference || undefined,
          name: row.data.name,
          siret: row.data.siret || undefined,
          vatNumber: row.data.vatNumber || undefined,
          initials: autoInitials || undefined,
          // Color will use default from backend
          headquartersAddress: row.data.headquartersAddress || undefined,
          headquartersPostalCode: row.data.headquartersPostalCode || undefined,
          headquartersCity: row.data.headquartersCity || undefined,
          headquartersCountry: row.data.headquartersCountry || undefined,
          headquartersCountryCode:
            row.data.headquartersCountryCode || undefined,
          status: row.data.status || 'active',
          comment: row.data.comment || undefined,
        };

        const created = await this.createWithImportTracking(clientDto);
        createdIds.push(created.id);
        successCount++;
      } catch (error: any) {
        errors.push({
          row: row.rowNumber,
          field: '',
          value: null,
          message: error.message || 'Erreur lors de la création du client',
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

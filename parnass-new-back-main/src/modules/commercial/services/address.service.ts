import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import { CreateAddressDto, UpdateAddressDto } from '../dto/address';
import { ExcelService } from '../../shared/services/excel.service';
import {
  ColumnConfig,
  ImportResult,
  ImportError,
} from '../../shared/dto/import-result.dto';
import { ActivityService, ActivityType, EntityType } from './activity.service';

// Column configuration for Address import/export
// Single reference field - auto-generated if empty (format: ADR-YYYY-XXXX)
const ADDRESS_COLUMNS: ColumnConfig[] = [
  {
    frenchHeader: 'Référence',
    field: 'reference',
    required: false,
    type: 'string',
  },
  { frenchHeader: 'Nom', field: 'name', required: true, type: 'string' },
  { frenchHeader: 'Rue', field: 'address', required: true, type: 'string' },
  {
    frenchHeader: 'Code postal',
    field: 'postalCode',
    required: false,
    type: 'string',
  },
  { frenchHeader: 'Ville', field: 'city', required: false, type: 'string' },
  {
    frenchHeader: 'Pays',
    field: 'country',
    required: false,
    type: 'string',
    defaultValue: 'France',
  },
  {
    frenchHeader: 'Latitude',
    field: 'latitude',
    required: false,
    type: 'number',
  },
  {
    frenchHeader: 'Longitude',
    field: 'longitude',
    required: false,
    type: 'number',
  },
  {
    frenchHeader: 'Commentaire',
    field: 'comment',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Références clients',
    field: 'clientReferences',
    required: false,
    type: 'array',
  },
];

const ADDRESS_EXAMPLE_ROW = {
  reference: 'ADR-2026-0001',
  name: 'Entrepôt Paris Nord',
  address: '123 Rue de la Logistique',
  postalCode: '95500',
  city: 'Gonesse',
  country: 'France',
  latitude: 48.9856,
  longitude: 2.4512,
  comment: 'Quai de déchargement n°3',
  clientReferences: 'CLI-2026-0001, CLI-2026-0002',
};

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly excelService: ExcelService,
    @Inject(forwardRef(() => ActivityService))
    private readonly activityService: ActivityService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('address')
      .select('*')
      .order('name');

    if (error) {
      this.logger.error('Error fetching addresses', error);
      throw new BadRequestException(error.message);
    }

    // Fetch ALL client associations in a single query (optimization to avoid N+1)
    const addressIds = data.map((a: any) => a.id);
    const clientsMap = await this.getAllAddressClients(addressIds);

    // Map addresses with their clients
    return data.map((address: any) => ({
      ...this.transformAddress(address),
      clients: clientsMap.get(address.id) || [],
    }));
  }

  /**
   * Batch fetch clients for multiple addresses in a single query
   * Optimizes N+1 query problem
   */
  private async getAllAddressClients(addressIds: string[]): Promise<Map<string, any[]>> {
    if (addressIds.length === 0) return new Map();

    const { data, error } = await this.supabase
      .from('client_address')
      .select(
        `
        address_id,
        client:client_id (
          id,
          name,
          initials,
          avatar_url,
          color
        )
      `,
      )
      .in('address_id', addressIds);

    if (error) {
      this.logger.error('Error fetching address clients (batch)', error);
      return new Map();
    }

    // Group clients by address_id
    const clientsMap = new Map<string, any[]>();
    for (const item of data || []) {
      const addressId = item.address_id;
      const client = item.client as any;
      if (!clientsMap.has(addressId)) {
        clientsMap.set(addressId, []);
      }
      if (client) {
        clientsMap.get(addressId)!.push({
          id: client.id,
          name: client.name,
          initials: client.initials,
          avatarUrl: client.avatar_url,
          color: client.color,
        });
      }
    }

    return clientsMap;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('address')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Address with ID ${id} not found`);
      }
      throw new BadRequestException(error.message);
    }

    const clients = await this.getAddressClients(id);
    return {
      ...this.transformAddress(data),
      clients,
    };
  }

  async create(createAddressDto: CreateAddressDto, userId?: string, userName?: string) {
    const { clientIds, ...addressData } = createAddressDto;
    const dbData = this.transformDtoToDb(addressData, false);

    const { data, error } = await this.supabase
      .from('address')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating address', error);
      throw new BadRequestException(error.message);
    }

    // Create client associations if provided
    if (clientIds && clientIds.length > 0) {
      await this.updateClientAssociations(data.id, clientIds);
    }

    const clients = await this.getAddressClients(data.id);
    const address = {
      ...this.transformAddress(data),
      clients,
    };

    // Log activity
    await this.activityService.log(
      ActivityType.ADRESSE_AJOUTEE,
      address.name,
      address.reference,
      userId,
      userName,
      EntityType.ADDRESS,
      address.id,
    );

    return address;
  }

  async update(id: string, updateAddressDto: UpdateAddressDto, userId?: string, userName?: string) {
    // First check if address exists
    await this.findOne(id);

    const { clientIds, ...addressData } = updateAddressDto;
    const dbData = this.transformDtoToDb(addressData, true);

    const { data, error } = await this.supabase
      .from('address')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating address', error);
      throw new BadRequestException(error.message);
    }

    // Update client associations if provided
    if (clientIds !== undefined) {
      await this.updateClientAssociations(id, clientIds);
    }

    const clients = await this.getAddressClients(id);
    const address = {
      ...this.transformAddress(data),
      clients,
    };

    // Log activity
    await this.activityService.log(
      ActivityType.ADRESSE_MODIFIEE,
      address.name,
      address.reference,
      userId,
      userName,
      EntityType.ADDRESS,
      address.id,
    );

    return address;
  }

  async remove(id: string, userId?: string, userName?: string) {
    // First check if address exists
    const address = await this.findOne(id);

    const { error } = await this.supabase.from('address').delete().eq('id', id);

    if (error) {
      this.logger.error('Error deleting address', error);
      throw new BadRequestException(error.message);
    }

    // Log activity
    await this.activityService.log(
      ActivityType.ADRESSE_SUPPRIMEE,
      address.name,
      address.reference,
      userId,
      userName,
      EntityType.ADDRESS,
      id,
    );

    return { message: 'Address deleted successfully' };
  }

  private async getAddressClients(addressId: string) {
    const { data, error } = await this.supabase
      .from('client_address')
      .select(
        `
        client:client_id (
          id,
          name,
          initials,
          avatar_url,
          color
        )
      `,
      )
      .eq('address_id', addressId);

    if (error) {
      this.logger.error('Error fetching address clients', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.client.id,
      name: item.client.name,
      initials: item.client.initials,
      avatarUrl: item.client.avatar_url,
      color: item.client.color,
    }));
  }

  private async updateClientAssociations(
    addressId: string,
    clientIds: string[],
  ) {
    // Remove existing associations
    await this.supabase
      .from('client_address')
      .delete()
      .eq('address_id', addressId);

    // Add new associations
    if (clientIds.length > 0) {
      const associations = clientIds.map((clientId) => ({
        client_id: clientId,
        address_id: addressId,
      }));

      const { error } = await this.supabase
        .from('client_address')
        .insert(associations);

      if (error) {
        this.logger.error('Error creating client associations', error);
        throw new BadRequestException(error.message);
      }
    }
  }

  private transformAddress(data: any) {
    return {
      id: data.id,
      reference: data.reference || null,
      name: data.name,
      address: data.address,
      postalCode: data.postal_code,
      city: data.city,
      country: data.country,
      countryCode: data.country_code,
      latitude: data.latitude,
      longitude: data.longitude,
      gpsRadius: data.gps_radius || 50,
      comment: data.comment,
      importedAt: data.imported_at,
      importedBy: data.imported_by,
      importedByName: data.imported_by_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformDtoToDb(dto: Partial<CreateAddressDto>, isUpdate = false) {
    const result: any = {};

    // Handle reference: for updates, ignore empty strings (don't update the field)
    // For creates, set to null to trigger auto-generation (format: ADR-YYYY-XXXX)
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
    if (dto.address !== undefined) result.address = dto.address;
    if (dto.postalCode !== undefined) result.postal_code = dto.postalCode;
    if (dto.city !== undefined) result.city = dto.city;
    if (dto.country !== undefined) result.country = dto.country;
    if (dto.countryCode !== undefined) result.country_code = dto.countryCode;
    if (dto.latitude !== undefined) result.latitude = dto.latitude;
    if (dto.longitude !== undefined) result.longitude = dto.longitude;
    if (dto.gpsRadius !== undefined) result.gps_radius = dto.gpsRadius;
    if (dto.comment !== undefined) result.comment = dto.comment;

    return result;
  }

  // ============================================
  // Export/Import Methods
  // ============================================

  async exportToExcel(): Promise<Buffer> {
    // Get addresses with client info for export
    const { data, error } = await this.supabase
      .from('address')
      .select('*')
      .order('name');

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Get client references for each address
    const exportData = await Promise.all(
      data.map(async (address: any) => {
        const { data: clientLinks } = await this.supabase
          .from('client_address')
          .select('client:client_id (reference)')
          .eq('address_id', address.id);

        const clientRefs = (clientLinks || [])
          .map((link: any) => link.client?.reference)
          .filter(Boolean);

        return {
          reference: address.reference,
          name: address.name,
          address: address.address,
          clientReferences: clientRefs,
        };
      }),
    );

    return this.excelService.generateExcel(exportData, ADDRESS_COLUMNS);
  }

  getImportTemplate(): Buffer {
    return this.excelService.generateTemplate(
      ADDRESS_COLUMNS,
      'Adresses',
      ADDRESS_EXAMPLE_ROW,
    );
  }

  getImportGuidelines(): string {
    return this.excelService.generateGuidelinesTxt(
      ADDRESS_COLUMNS,
      'Adresses',
    );
  }

  /**
   * Normalize address string for duplicate detection
   * - Lowercase
   * - Remove accents
   * - Trim whitespace
   * - Normalize multiple spaces
   */
  private normalizeAddressString(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate a normalized key for duplicate detection
   * Based on: address (rue) + postalCode + city + country
   */
  private generateDuplicateKey(
    address: string | null | undefined,
    postalCode: string | null | undefined,
    city: string | null | undefined,
    country: string | null | undefined,
  ): string {
    const parts = [
      this.normalizeAddressString(address),
      this.normalizeAddressString(postalCode),
      this.normalizeAddressString(city),
      this.normalizeAddressString(country || 'france'),
    ];
    return parts.join('|');
  }

  /**
   * Check if an address already exists based on normalized key
   */
  async checkDuplicate(
    address: string,
    postalCode: string | null,
    city: string | null,
    country: string | null,
  ): Promise<{ exists: boolean; existingId?: string }> {
    // Fetch all addresses and check for duplicates
    // Note: For better performance with large datasets, consider a database-side function
    const { data: existingAddresses } = await this.supabase
      .from('address')
      .select('id, address, postal_code, city, country');

    const newKey = this.generateDuplicateKey(address, postalCode, city, country);

    for (const existing of existingAddresses || []) {
      const existingKey = this.generateDuplicateKey(
        existing.address,
        existing.postal_code,
        existing.city,
        existing.country,
      );
      if (existingKey === newKey) {
        return { exists: true, existingId: existing.id };
      }
    }

    return { exists: false };
  }

  async importFromExcel(buffer: Buffer): Promise<ImportResult> {
    const parseResult = this.excelService.parseExcel(buffer, ADDRESS_COLUMNS);

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

    // Collect all unique client references for lookup
    const allClientRefs = new Set<string>();
    parseResult.rows.forEach((row) => {
      if (
        row.data.clientReferences &&
        Array.isArray(row.data.clientReferences)
      ) {
        row.data.clientReferences.forEach((ref: string) =>
          allClientRefs.add(ref),
        );
      }
    });

    // Build client reference to ID map
    const clientMap = new Map<string, string>();
    if (allClientRefs.size > 0) {
      const { data: clients } = await this.supabase
        .from('client')
        .select('id, reference')
        .in('reference', Array.from(allClientRefs));

      (clients || []).forEach((c: any) => {
        clientMap.set(c.reference, c.id);
      });
    }

    // Fetch existing addresses for duplicate detection
    const { data: existingAddresses } = await this.supabase
      .from('address')
      .select('id, address, postal_code, city, country');

    // Build a map of normalized keys to existing address IDs
    const existingKeysMap = new Map<string, string>();
    for (const existing of existingAddresses || []) {
      const key = this.generateDuplicateKey(
        existing.address,
        existing.postal_code,
        existing.city,
        existing.country,
      );
      existingKeysMap.set(key, existing.id);
    }

    const createdIds: string[] = [];
    const errors: ImportError[] = [...parseResult.errors];
    let successCount = 0;
    let duplicateCount = 0;

    for (const row of parseResult.rows) {
      if (row.errors.length > 0) {
        continue;
      }

      // Check for duplicate
      const newKey = this.generateDuplicateKey(
        row.data.address,
        row.data.postalCode,
        row.data.city,
        row.data.country || 'France',
      );

      if (existingKeysMap.has(newKey)) {
        duplicateCount++;
        errors.push({
          row: row.rowNumber,
          field: 'address',
          value: `${row.data.address}, ${row.data.postalCode} ${row.data.city}`,
          message: 'Adresse déjà existante (doublon détecté)',
        });
        continue;
      }

      // Resolve client references to IDs
      const clientIds: string[] = [];
      const clientRefs = row.data.clientReferences || [];
      let hasInvalidClient = false;

      for (const ref of clientRefs) {
        const clientId = clientMap.get(ref);
        if (!clientId) {
          errors.push({
            row: row.rowNumber,
            field: 'clientReferences',
            value: ref,
            message: `Client avec la référence "${ref}" introuvable`,
          });
          hasInvalidClient = true;
        } else {
          clientIds.push(clientId);
        }
      }

      if (hasInvalidClient) {
        continue;
      }

      try {
        const addressDto: CreateAddressDto = {
          reference: row.data.reference || undefined,
          name: row.data.name,
          address: row.data.address,
          postalCode: row.data.postalCode || undefined,
          city: row.data.city || undefined,
          country: row.data.country || 'France',
          countryCode: this.getCountryCode(row.data.country || 'France'),
          latitude: row.data.latitude || undefined,
          longitude: row.data.longitude || undefined,
          comment: row.data.comment || undefined,
          clientIds: clientIds.length > 0 ? clientIds : undefined,
        };

        const created = await this.create(addressDto);
        createdIds.push(created.id);
        // Add to map to prevent duplicates within the same import file
        existingKeysMap.set(newKey, created.id);
        successCount++;
      } catch (error: any) {
        errors.push({
          row: row.rowNumber,
          field: '',
          value: null,
          message: error.message || "Erreur lors de la création de l'adresse",
        });
      }
    }

    // Add summary message for duplicates
    const result: ImportResult = {
      success: errors.length === 0,
      totalRows: parseResult.rows.length,
      successCount,
      errorCount: errors.length,
      duplicateCount, // MCom-001: Include duplicate count in result
      errors,
      createdIds,
    };

    // Log summary
    if (duplicateCount > 0) {
      this.logger.log(
        `Import completed: ${successCount} created, ${duplicateCount} duplicates skipped`,
      );
    }

    return result;
  }

  /**
   * Get country code from country name
   */
  private getCountryCode(country: string): string {
    const countryMap: Record<string, string> = {
      france: 'FR',
      belgique: 'BE',
      belgium: 'BE',
      allemagne: 'DE',
      germany: 'DE',
      espagne: 'ES',
      spain: 'ES',
      italie: 'IT',
      italy: 'IT',
      'pays-bas': 'NL',
      netherlands: 'NL',
      luxembourg: 'LU',
      suisse: 'CH',
      switzerland: 'CH',
      'royaume-uni': 'GB',
      'united kingdom': 'GB',
      portugal: 'PT',
      autriche: 'AT',
      austria: 'AT',
      pologne: 'PL',
      poland: 'PL',
    };
    const normalized = country.toLowerCase().trim();
    return countryMap[normalized] || 'FR';
  }

  /**
   * Search addresses by query (name, city, reference, address)
   */
  async search(query: string, limit = 20) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    const { data, error } = await this.supabase
      .from('address')
      .select('*')
      .or(
        `name.ilike.${searchTerm},city.ilike.${searchTerm},address.ilike.${searchTerm},reference.ilike.${searchTerm}`,
      )
      .limit(limit)
      .order('name');

    if (error) {
      this.logger.error('Error searching addresses', error);
      throw new BadRequestException(error.message);
    }

    return data.map((addr: any) => this.transformAddress(addr));
  }
}

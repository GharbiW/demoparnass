import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import { CreateContactDto, UpdateContactDto } from '../dto/contact';
import { ExcelService } from '../../shared/services/excel.service';
import {
  ColumnConfig,
  ImportResult,
  ImportError,
} from '../../shared/dto/import-result.dto';
import { ActivityService, ActivityType, EntityType } from './activity.service';

// Column configuration for Contact import/export
const CONTACT_COLUMNS: ColumnConfig[] = [
  {
    frenchHeader: 'Prénom',
    field: 'firstName',
    required: true,
    type: 'string',
  },
  { frenchHeader: 'Nom', field: 'lastName', required: true, type: 'string' },
  { frenchHeader: 'Email', field: 'email', required: false, type: 'email' },
  {
    frenchHeader: 'Téléphone',
    field: 'phone',
    required: false,
    type: 'string',
  },
  { frenchHeader: 'Fonction', field: 'role', required: false, type: 'string' },
  {
    frenchHeader: 'Référence client',
    field: 'clientReference',
    required: true,
    type: 'string',
  },
  {
    frenchHeader: 'Notification exploitation',
    field: 'isNotifiableExploitation',
    required: false,
    type: 'boolean',
  },
];

const CONTACT_EXAMPLE_ROW = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@exemple.fr',
  phone: '+33 6 12 34 56 78',
  role: 'Responsable logistique',
  clientReference: 'CLI-2026-0001',
  isNotifiableExploitation: true,
};

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

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
      .from('contact')
      .select(
        `
        *,
        client:client_id (
          id,
          name,
          initials,
          avatar_url,
          color
        )
      `,
      )
      .order('last_name');

    if (error) {
      this.logger.error('Error fetching contacts', error);
      throw new BadRequestException(error.message);
    }

    return data.map((contact: any) => this.transformContactWithClient(contact));
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('contact')
      .select(
        `
        *,
        client:client_id (
          id,
          name,
          initials,
          avatar_url,
          color
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Contact with ID ${id} not found`);
      }
      throw new BadRequestException(error.message);
    }

    return this.transformContactWithClient(data);
  }

  async create(createContactDto: CreateContactDto, userId?: string, userName?: string) {
    const contactData = this.transformDtoToDb(createContactDto);

    const { data, error } = await this.supabase
      .from('contact')
      .insert(contactData)
      .select(
        `
        *,
        client:client_id (
          id,
          name,
          initials,
          avatar_url,
          color
        )
      `,
      )
      .single();

    if (error) {
      this.logger.error('Error creating contact', error);
      throw new BadRequestException(error.message);
    }

    const contact = this.transformContactWithClient(data);

    // Log activity
    await this.activityService.log(
      ActivityType.CONTACT_AJOUTE,
      `${contact.firstName} ${contact.lastName}`,
      contact.id,
      userId,
      userName,
      EntityType.CONTACT,
      contact.id,
      { clientId: contact.client?.id },
    );

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto, userId?: string, userName?: string) {
    // First check if contact exists
    await this.findOne(id);

    const contactData = this.transformDtoToDb(updateContactDto);

    const { data, error } = await this.supabase
      .from('contact')
      .update(contactData)
      .eq('id', id)
      .select(
        `
        *,
        client:client_id (
          id,
          name,
          initials,
          avatar_url,
          color
        )
      `,
      )
      .single();

    if (error) {
      this.logger.error('Error updating contact', error);
      throw new BadRequestException(error.message);
    }

    const contact = this.transformContactWithClient(data);

    // Log activity
    await this.activityService.log(
      ActivityType.CONTACT_MODIFIE,
      `${contact.firstName} ${contact.lastName}`,
      contact.id,
      userId,
      userName,
      EntityType.CONTACT,
      contact.id,
      { clientId: contact.client?.id },
    );

    return contact;
  }

  async remove(id: string, userId?: string, userName?: string) {
    // First check if contact exists
    const contact = await this.findOne(id);

    const { error } = await this.supabase.from('contact').delete().eq('id', id);

    if (error) {
      this.logger.error('Error deleting contact', error);
      throw new BadRequestException(error.message);
    }

    // Log activity
    await this.activityService.log(
      ActivityType.CONTACT_SUPPRIME,
      `${contact.firstName} ${contact.lastName}`,
      contact.id,
      userId,
      userName,
      EntityType.CONTACT,
      id,
      { clientId: contact.client?.id },
    );

    return { message: 'Contact deleted successfully' };
  }

  private transformContactWithClient(data: any) {
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      avatarUrl: data.avatar_url,
      clientId: data.client_id,
      isNotifiableExploitation: data.is_notifiable_exploitation,
      client: data.client
        ? {
            id: data.client.id,
            name: data.client.name,
            initials: data.client.initials,
            avatarUrl: data.client.avatar_url,
            color: data.client.color,
          }
        : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformDtoToDb(dto: CreateContactDto | UpdateContactDto) {
    const result: any = {};

    if ('firstName' in dto && dto.firstName !== undefined)
      result.first_name = dto.firstName;
    if ('lastName' in dto && dto.lastName !== undefined)
      result.last_name = dto.lastName;
    if ('email' in dto && dto.email !== undefined) result.email = dto.email;
    if ('phone' in dto && dto.phone !== undefined) result.phone = dto.phone;
    if ('role' in dto && dto.role !== undefined) result.role = dto.role;
    if ('avatarUrl' in dto && dto.avatarUrl !== undefined)
      result.avatar_url = dto.avatarUrl;
    if ('clientId' in dto && dto.clientId !== undefined)
      result.client_id = dto.clientId;
    if (
      'isNotifiableExploitation' in dto &&
      dto.isNotifiableExploitation !== undefined
    )
      result.is_notifiable_exploitation = dto.isNotifiableExploitation;

    return result;
  }

  // ============================================
  // Export/Import Methods
  // ============================================

  async exportToExcel(): Promise<Buffer> {
    const { data, error } = await this.supabase
      .from('contact')
      .select(
        `
        *,
        client:client_id (reference)
      `,
      )
      .order('last_name');

    if (error) {
      throw new BadRequestException(error.message);
    }

    const exportData = data.map((contact: any) => ({
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
      clientReference: contact.client?.reference || '',
      isNotifiableExploitation: contact.is_notifiable_exploitation || false,
    }));

    return this.excelService.generateExcel(exportData, CONTACT_COLUMNS);
  }

  getImportTemplate(): Buffer {
    return this.excelService.generateTemplate(
      CONTACT_COLUMNS,
      'Contacts',
      CONTACT_EXAMPLE_ROW,
    );
  }

  getImportGuidelines(): string {
    return this.excelService.generateGuidelinesTxt(CONTACT_COLUMNS, 'Contacts');
  }

  async importFromExcel(buffer: Buffer): Promise<ImportResult> {
    const parseResult = this.excelService.parseExcel(buffer, CONTACT_COLUMNS);

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

    // Build client reference to ID map
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
        const contactDto: CreateContactDto = {
          firstName: row.data.firstName,
          lastName: row.data.lastName,
          email: row.data.email || undefined,
          phone: row.data.phone || undefined,
          role: row.data.role || undefined,
          clientId,
          isNotifiableExploitation: row.data.isNotifiableExploitation ?? false,
        };

        const created = await this.create(contactDto);
        createdIds.push(created.id);
        successCount++;
      } catch (error: any) {
        errors.push({
          row: row.rowNumber,
          field: '',
          value: null,
          message: error.message || 'Erreur lors de la création du contact',
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

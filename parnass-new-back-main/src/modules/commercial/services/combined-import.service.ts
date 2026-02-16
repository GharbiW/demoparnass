import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import { ExcelService } from '../../shared/services/excel.service';
import { ClientService } from './client.service';
import { AddressService } from './address.service';
import { ContactService } from './contact.service';
import { ContractService } from './contract.service';
import { PrestationService } from './prestation.service';
import { ActivityService, ActivityType, EntityType } from './activity.service';
import {
  ClientsPackageImportResult,
  ContractsPackageImportResult,
  EntityImportResult,
} from '../dto/import';
import { ImportError, ColumnConfig } from '../../shared/dto/import-result.dto';
import * as XLSX from 'xlsx';

// Sheet names for the packages
const CLIENTS_PACKAGE_SHEETS = {
  CLIENTS: 'Clients',
  ADDRESSES: 'Adresses',
  CONTACTS: 'Contacts',
};

const CONTRACTS_PACKAGE_SHEETS = {
  CONTRACTS: 'Contrats',
  PRESTATIONS: 'Prestations',
  // RIDES: 'Trajets', // Rides are created via prestations import
};

// Sheet names for client full import
const CLIENT_FULL_IMPORT_SHEETS = {
  ADDRESSES: 'Adresses',
  CONTACTS: 'Contacts',
  CONTRACTS: 'Contrats',
  PRESTATIONS: 'Prestations',
};

// Column configurations (reused from individual services)
// Single reference field - auto-generated if empty
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
];

// Contact columns for client full import (no clientReference needed - will use selected client)
const CONTACT_COLUMNS_FOR_CLIENT_IMPORT: ColumnConfig[] = [
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
    frenchHeader: 'Notification exploitation',
    field: 'isNotifiableExploitation',
    required: false,
    type: 'boolean',
  },
];

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

// Contract columns for client full import (no clientReference needed - will use selected client)
const CONTRACT_COLUMNS_FOR_CLIENT_IMPORT: ColumnConfig[] = [
  {
    frenchHeader: 'Référence',
    field: 'reference',
    required: false,
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

@Injectable()
export class CombinedImportService {
  private readonly logger = new Logger(CombinedImportService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly excelService: ExcelService,
    private readonly clientService: ClientService,
    private readonly addressService: AddressService,
    private readonly contactService: ContactService,
    private readonly contractService: ContractService,
    private readonly prestationService: PrestationService,
    private readonly activityService: ActivityService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  /**
   * Import Clients Package (Clients + Addresses + Contacts)
   * Multi-sheet Excel file
   */
  async importClientsPackage(
    buffer: Buffer,
    userId?: string,
    userName?: string,
  ): Promise<ClientsPackageImportResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    const result: ClientsPackageImportResult = {
      totalSuccess: 0,
      totalErrors: 0,
    };

    // Import Clients first (other entities may reference them)
    if (sheetNames.includes(CLIENTS_PACKAGE_SHEETS.CLIENTS)) {
      const sheet = workbook.Sheets[CLIENTS_PACKAGE_SHEETS.CLIENTS];
      const sheetBuffer = this.sheetToBuffer(sheet, workbook);

      try {
        const importResult =
          await this.clientService.importFromExcel(sheetBuffer);
        result.clients = {
          success: importResult.successCount,
          errors: importResult.errors,
          createdIds: importResult.createdIds,
        };
        result.totalSuccess += importResult.successCount;
        result.totalErrors += importResult.errorCount;
      } catch (error) {
        this.logger.error('Error importing clients sheet', error);
        result.clients = {
          success: 0,
          errors: [{ row: 0, field: '', value: '', message: error.message }],
          createdIds: [],
        };
        result.totalErrors += 1;
      }
    }

    // Import Addresses
    if (sheetNames.includes(CLIENTS_PACKAGE_SHEETS.ADDRESSES)) {
      const sheet = workbook.Sheets[CLIENTS_PACKAGE_SHEETS.ADDRESSES];
      const sheetBuffer = this.sheetToBuffer(sheet, workbook);

      try {
        const importResult =
          await this.addressService.importFromExcel(sheetBuffer);
        result.addresses = {
          success: importResult.successCount,
          errors: importResult.errors,
          createdIds: importResult.createdIds,
        };
        result.totalSuccess += importResult.successCount;
        result.totalErrors += importResult.errorCount;
      } catch (error) {
        this.logger.error('Error importing addresses sheet', error);
        result.addresses = {
          success: 0,
          errors: [{ row: 0, field: '', value: '', message: error.message }],
          createdIds: [],
        };
        result.totalErrors += 1;
      }
    }

    // Import Contacts
    if (sheetNames.includes(CLIENTS_PACKAGE_SHEETS.CONTACTS)) {
      const sheet = workbook.Sheets[CLIENTS_PACKAGE_SHEETS.CONTACTS];
      const sheetBuffer = this.sheetToBuffer(sheet, workbook);

      try {
        const importResult =
          await this.contactService.importFromExcel(sheetBuffer);
        result.contacts = {
          success: importResult.successCount,
          errors: importResult.errors,
          createdIds: importResult.createdIds,
        };
        result.totalSuccess += importResult.successCount;
        result.totalErrors += importResult.errorCount;
      } catch (error) {
        this.logger.error('Error importing contacts sheet', error);
        result.contacts = {
          success: 0,
          errors: [{ row: 0, field: '', value: '', message: error.message }],
          createdIds: [],
        };
        result.totalErrors += 1;
      }
    }

    // Log activity for the combined import
    await this.activityService.log(
      ActivityType.CLIENT_IMPORTE,
      `Import groupé: ${result.totalSuccess} éléments`,
      `${result.clients?.success || 0} clients, ${result.addresses?.success || 0} adresses, ${result.contacts?.success || 0} contacts`,
      userId,
      userName,
      EntityType.CLIENT,
      undefined,
      { packageType: 'clients', ...result },
    );

    return result;
  }

  /**
   * Import Contracts Package (Contracts + Prestations)
   * Multi-sheet Excel file
   */
  async importContractsPackage(
    buffer: Buffer,
    userId?: string,
    userName?: string,
  ): Promise<ContractsPackageImportResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    const result: ContractsPackageImportResult = {
      totalSuccess: 0,
      totalErrors: 0,
    };

    // Track created contract references for prestations
    const createdContractMap = new Map<string, string>(); // reference -> id

    // Import Contracts first (prestations reference them)
    if (sheetNames.includes(CONTRACTS_PACKAGE_SHEETS.CONTRACTS)) {
      const sheet = workbook.Sheets[CONTRACTS_PACKAGE_SHEETS.CONTRACTS];
      const sheetBuffer = this.sheetToBuffer(sheet, workbook);

      try {
        const importResult =
          await this.contractService.importFromExcel(sheetBuffer);
        result.contracts = {
          success: importResult.successCount,
          errors: importResult.errors,
          createdIds: importResult.createdIds,
        };
        result.totalSuccess += importResult.successCount;
        result.totalErrors += importResult.errorCount;

        // Build contract map from created contracts
        if (importResult.createdIds.length > 0) {
          const { data: createdContracts } = await this.supabase
            .from('contract')
            .select('id, reference')
            .in('id', importResult.createdIds);

          (createdContracts || []).forEach((c: any) => {
            if (c.reference) {
              createdContractMap.set(c.reference, c.id);
            }
          });
        }
      } catch (error) {
        this.logger.error('Error importing contracts sheet', error);
        result.contracts = {
          success: 0,
          errors: [{ row: 0, field: '', value: '', message: error.message }],
          createdIds: [],
        };
        result.totalErrors += 1;
      }
    }

    // Import Prestations
    if (sheetNames.includes(CONTRACTS_PACKAGE_SHEETS.PRESTATIONS)) {
      const sheet = workbook.Sheets[CONTRACTS_PACKAGE_SHEETS.PRESTATIONS];
      const sheetBuffer = this.sheetToBuffer(sheet, workbook);

      try {
        // Pass created contract map so prestations can reference newly created contracts
        const importResult = await this.prestationService.importFromExcel(
          sheetBuffer,
          createdContractMap,
        );
        result.prestations = {
          success: importResult.successCount,
          errors: importResult.errors,
          createdIds: importResult.createdIds,
        };
        result.totalSuccess += importResult.successCount;
        result.totalErrors += importResult.errorCount;
      } catch (error) {
        this.logger.error('Error importing prestations sheet', error);
        result.prestations = {
          success: 0,
          errors: [{ row: 0, field: '', value: '', message: error.message }],
          createdIds: [],
        };
        result.totalErrors += 1;
      }
    }

    // Log activity for the combined import
    await this.activityService.log(
      ActivityType.CONTRAT_IMPORTE,
      `Import groupé: ${result.totalSuccess} éléments`,
      `${result.contracts?.success || 0} contrats, ${result.prestations?.success || 0} prestations`,
      userId,
      userName,
      EntityType.CONTRACT,
      undefined,
      { packageType: 'contracts', ...result },
    );

    return result;
  }

  /**
   * Generate Clients Package template
   */
  async generateClientsPackageTemplate(): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Create Clients sheet
    const clientsSheet = this.createTemplateSheet(CLIENT_COLUMNS, {
      reference: 'CLI-2026-0001',
      name: 'Exemple SARL',
      siret: '12345678901234',
      vatNumber: 'FR12345678901',
      headquartersAddress: '123 Rue de la Paix',
      headquartersPostalCode: '75001',
      headquartersCity: 'Paris',
      headquartersCountry: 'France',
      status: 'active',
      comment: 'Commentaire client',
    });
    XLSX.utils.book_append_sheet(
      workbook,
      clientsSheet,
      CLIENTS_PACKAGE_SHEETS.CLIENTS,
    );

    // Create Addresses sheet
    const addressesSheet = this.createTemplateSheet(ADDRESS_COLUMNS, {
      reference: 'ADR-2026-0001',
      name: 'Entrepôt Paris Nord',
      address: '123 Rue de la Logistique',
      postalCode: '95500',
      city: 'Gonesse',
      country: 'France',
      latitude: 48.9856,
      longitude: 2.4512,
      comment: 'Quai de déchargement n°3',
    });
    XLSX.utils.book_append_sheet(
      workbook,
      addressesSheet,
      CLIENTS_PACKAGE_SHEETS.ADDRESSES,
    );

    // Create Contacts sheet
    const contactsSheet = this.createTemplateSheet(CONTACT_COLUMNS, {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@exemple.fr',
      phone: '+33 6 12 34 56 78',
      role: 'Responsable logistique',
      clientReference: 'CLI-2026-0001',
      isNotifiableExploitation: 'Oui',
    });
    XLSX.utils.book_append_sheet(
      workbook,
      contactsSheet,
      CLIENTS_PACKAGE_SHEETS.CONTACTS,
    );

    // Add instructions sheet
    const instructionsSheet = this.createInstructionsSheet([
      "Ce fichier permet d'importer en une seule fois : Clients, Adresses et Contacts.",
      '',
      'FEUILLES :',
      `- ${CLIENTS_PACKAGE_SHEETS.CLIENTS} : Les clients à créer`,
      `- ${CLIENTS_PACKAGE_SHEETS.ADDRESSES} : Les adresses de livraison`,
      `- ${CLIENTS_PACKAGE_SHEETS.CONTACTS} : Les contacts des clients`,
      '',
      "ORDRE D'IMPORT :",
      '1. Les clients sont importés en premier',
      '2. Les adresses sont associées aux clients via "Références clients"',
      '3. Les contacts sont associés aux clients via "Référence client"',
      '',
      'CHAMPS OBLIGATOIRES :',
      '- Client : Nom',
      '- Adresse : Nom, Rue',
      '- Contact : Prénom, Nom, Référence client',
    ]);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
    return excelBuffer;
  }

  /**
   * Generate Contracts Package template
   */
  async generateContractsPackageTemplate(): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Create Contracts sheet
    const contractsSheet = this.createTemplateSheet(CONTRACT_COLUMNS, {
      reference: 'CTR-2026-0001',
      clientReference: 'CLI-2026-0001',
      description: 'Contrat de transport régulier',
      startDate: '01/01/2026',
      endDate: '31/12/2026',
      autoRenew: 'Oui',
      status: 'active',
      comment: 'Commentaire contrat',
    });
    XLSX.utils.book_append_sheet(
      workbook,
      contractsSheet,
      CONTRACTS_PACKAGE_SHEETS.CONTRACTS,
    );

    // Create Prestations sheet
    const prestationsSheet = this.createPrestationsTemplateSheet();
    XLSX.utils.book_append_sheet(
      workbook,
      prestationsSheet,
      CONTRACTS_PACKAGE_SHEETS.PRESTATIONS,
    );

    // Add instructions sheet
    const instructionsSheet = this.createInstructionsSheet([
      "Ce fichier permet d'importer en une seule fois : Contrats et Prestations.",
      '',
      'PRÉ-REQUIS :',
      "Les clients et adresses doivent exister avant l'import.",
      'Utilisez le modèle "Package Clients" pour les créer.',
      '',
      'FEUILLES :',
      `- ${CONTRACTS_PACKAGE_SHEETS.CONTRACTS} : Les contrats à créer`,
      `- ${CONTRACTS_PACKAGE_SHEETS.PRESTATIONS} : Les prestations des contrats`,
      '',
      "ORDRE D'IMPORT :",
      '1. Les contrats sont importés en premier',
      '2. Les prestations sont associées aux contrats via "Référence contrat"',
      '',
      'CHAMPS OBLIGATOIRES :',
      '- Contrat : Référence client, Date début',
      '- Prestation : Référence contrat, Trajet 1 (Adresse départ + Adresse arrivée)',
    ]);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
    return excelBuffer;
  }

  /**
   * Import Client Full Package (Addresses + Contacts + Contracts + Prestations for an EXISTING client)
   * Multi-sheet Excel file - all entities will be linked to the provided clientId
   */
  async importClientFullPackage(
    clientId: string,
    buffer: Buffer,
    userId?: string,
    userName?: string,
  ): Promise<ClientsPackageImportResult> {
    // Verify client exists first
    const client = await this.clientService.findOne(clientId);
    if (!client) {
      throw new BadRequestException(
        `Client avec l'ID "${clientId}" introuvable`,
      );
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    const result: ClientsPackageImportResult = {
      totalSuccess: 0,
      totalErrors: 0,
    };

    // Track created address references for prestations to use
    const createdAddressMap = new Map<string, string>(); // reference -> id

    // 1. Import Addresses (all linked to the selected client)
    if (sheetNames.includes(CLIENT_FULL_IMPORT_SHEETS.ADDRESSES)) {
      const sheet = workbook.Sheets[CLIENT_FULL_IMPORT_SHEETS.ADDRESSES];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (data.length > 1) {
        const addressErrors: ImportError[] = [];
        const addressCreatedIds: string[] = [];

        const headers = data[0] as string[];
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0) continue;

          try {
            const rowData: any = {};
            headers.forEach((header, idx) => {
              const col = ADDRESS_COLUMNS.find(
                (c) =>
                  c.frenchHeader === header ||
                  c.frenchHeader === header?.replace(' (*)', ''),
              );
              if (col) {
                rowData[col.field] = row[idx];
              }
            });

            if (!rowData.name) continue; // Skip empty rows

            const addressDto = {
              reference: rowData.reference || undefined,
              name: rowData.name,
              address: rowData.address || undefined,
              postalCode: rowData.postalCode || undefined,
              city: rowData.city || undefined,
              country: rowData.country || 'France',
              countryCode: 'FR',
              latitude: rowData.latitude
                ? parseFloat(rowData.latitude)
                : undefined,
              longitude: rowData.longitude
                ? parseFloat(rowData.longitude)
                : undefined,
              comment: rowData.comment || undefined,
              clientIds: [clientId], // Link to the selected client
            };

            const created = await this.addressService.create(addressDto);
            addressCreatedIds.push(created.id);
            if (created.reference) {
              createdAddressMap.set(created.reference, created.id);
            }
          } catch (error: any) {
            addressErrors.push({
              row: i + 1,
              field: '',
              value: null,
              message:
                error.message || "Erreur lors de la création de l'adresse",
            });
          }
        }

        result.addresses = {
          success: addressCreatedIds.length,
          errors: addressErrors,
          createdIds: addressCreatedIds,
        };
        result.totalSuccess += addressCreatedIds.length;
        result.totalErrors += addressErrors.length;
      }
    }

    // 2. Import Contacts (all linked to the selected client)
    if (sheetNames.includes(CLIENT_FULL_IMPORT_SHEETS.CONTACTS)) {
      const sheet = workbook.Sheets[CLIENT_FULL_IMPORT_SHEETS.CONTACTS];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (data.length > 1) {
        const contactErrors: ImportError[] = [];
        const contactCreatedIds: string[] = [];

        const headers = data[0] as string[];
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0) continue;

          try {
            const rowData: any = {};
            headers.forEach((header, idx) => {
              const col = CONTACT_COLUMNS_FOR_CLIENT_IMPORT.find(
                (c) =>
                  c.frenchHeader === header ||
                  c.frenchHeader === header?.replace(' (*)', ''),
              );
              if (col) {
                rowData[col.field] = row[idx];
              }
            });

            if (!rowData.firstName || !rowData.lastName) continue; // Skip empty rows

            const contactDto = {
              firstName: rowData.firstName,
              lastName: rowData.lastName,
              email: rowData.email || undefined,
              phone: rowData.phone || undefined,
              role: rowData.role || undefined,
              isNotifiableExploitation:
                rowData.isNotifiableExploitation === 'Oui' ||
                rowData.isNotifiableExploitation === true,
              clientId: clientId, // Link to the selected client
            };

            const created = await this.contactService.create(contactDto);
            contactCreatedIds.push(created.id);
          } catch (error: any) {
            contactErrors.push({
              row: i + 1,
              field: '',
              value: null,
              message: error.message || 'Erreur lors de la création du contact',
            });
          }
        }

        result.contacts = {
          success: contactCreatedIds.length,
          errors: contactErrors,
          createdIds: contactCreatedIds,
        };
        result.totalSuccess += contactCreatedIds.length;
        result.totalErrors += contactErrors.length;
      }
    }

    // Track created contract references for prestations
    const createdContractMap = new Map<string, string>(); // reference -> id

    // 3. Import Contracts (all linked to the selected client)
    if (sheetNames.includes(CLIENT_FULL_IMPORT_SHEETS.CONTRACTS)) {
      const sheet = workbook.Sheets[CLIENT_FULL_IMPORT_SHEETS.CONTRACTS];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (data.length > 1) {
        const contractErrors: ImportError[] = [];
        const contractCreatedIds: string[] = [];

        const headers = data[0] as string[];
        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0) continue;

          try {
            const rowData: any = {};
            headers.forEach((header, idx) => {
              const col = CONTRACT_COLUMNS_FOR_CLIENT_IMPORT.find(
                (c) =>
                  c.frenchHeader === header ||
                  c.frenchHeader === header?.replace(' (*)', ''),
              );
              if (col) {
                rowData[col.field] = row[idx];
              }
            });

            if (!rowData.startDate) continue; // Skip rows without start date

            const contractDto = {
              reference: rowData.reference || undefined,
              description: rowData.description || undefined,
              startDate: this.parseDate(rowData.startDate),
              endDate: rowData.endDate
                ? this.parseDate(rowData.endDate)
                : undefined,
              autoRenew:
                rowData.autoRenew === 'Oui' || rowData.autoRenew === true,
              status: rowData.status || 'active',
              comment: rowData.comment || undefined,
              clientId: clientId, // Link to the selected client
              type: 'Annuel',
            };

            const created = await this.contractService.create(contractDto);
            contractCreatedIds.push(created.id);
            if (created.reference) {
              createdContractMap.set(created.reference, created.id);
            }
          } catch (error: any) {
            contractErrors.push({
              row: i + 1,
              field: '',
              value: null,
              message: error.message || 'Erreur lors de la création du contrat',
            });
          }
        }

        result.contracts = {
          success: contractCreatedIds.length,
          errors: contractErrors,
          createdIds: contractCreatedIds,
        };
        result.totalSuccess += contractCreatedIds.length;
        result.totalErrors += contractErrors.length;
      }
    }

    // 4. Import Prestations (linked to contracts from this import)
    if (sheetNames.includes(CLIENT_FULL_IMPORT_SHEETS.PRESTATIONS)) {
      const sheet = workbook.Sheets[CLIENT_FULL_IMPORT_SHEETS.PRESTATIONS];
      const sheetBuffer = this.sheetToBuffer(sheet, workbook);

      try {
        // Pass created maps so prestations can reference newly created contracts and addresses
        const importResult = await this.prestationService.importFromExcel(
          sheetBuffer,
          createdContractMap,
          createdAddressMap,
        );
        result.prestations = {
          success: importResult.successCount,
          errors: importResult.errors,
          createdIds: importResult.createdIds,
        };
        result.totalSuccess += importResult.successCount;
        result.totalErrors += importResult.errorCount;
      } catch (error: any) {
        this.logger.error('Error importing prestations sheet', error);
        result.prestations = {
          success: 0,
          errors: [{ row: 0, field: '', value: '', message: error.message }],
          createdIds: [],
        };
        result.totalErrors += 1;
      }
    }

    // Log activity for the combined import
    await this.activityService.log(
      ActivityType.CLIENT_IMPORTE,
      `Import complet pour ${client.name}: ${result.totalSuccess} éléments`,
      `${result.addresses?.success || 0} adresses, ${result.contacts?.success || 0} contacts, ${result.contracts?.success || 0} contrats, ${result.prestations?.success || 0} prestations`,
      userId,
      userName,
      EntityType.CLIENT,
      clientId,
      { packageType: 'client-full', ...result },
    );

    return result;
  }

  /**
   * Generate Client Full Package template (for importing everything for an existing client)
   */
  async generateClientFullPackageTemplate(): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Create Addresses sheet (no clientReferences - will be linked automatically)
    const addressesSheet = this.createTemplateSheet(ADDRESS_COLUMNS, {
      reference: 'ADR-2026-0001',
      name: 'Entrepôt Paris Nord',
      address: '123 Rue de la Logistique',
      postalCode: '95500',
      city: 'Gonesse',
      country: 'France',
      latitude: 48.9856,
      longitude: 2.4512,
      comment: 'Quai de déchargement n°3',
    });
    XLSX.utils.book_append_sheet(
      workbook,
      addressesSheet,
      CLIENT_FULL_IMPORT_SHEETS.ADDRESSES,
    );

    // Create Contacts sheet (no clientReference - will be linked automatically)
    const contactsSheet = this.createTemplateSheet(
      CONTACT_COLUMNS_FOR_CLIENT_IMPORT,
      {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@exemple.fr',
        phone: '+33 6 12 34 56 78',
        role: 'Responsable logistique',
        isNotifiableExploitation: 'Oui',
      },
    );
    XLSX.utils.book_append_sheet(
      workbook,
      contactsSheet,
      CLIENT_FULL_IMPORT_SHEETS.CONTACTS,
    );

    // Create Contracts sheet (no clientReference - will be linked automatically)
    const contractsSheet = this.createTemplateSheet(
      CONTRACT_COLUMNS_FOR_CLIENT_IMPORT,
      {
        reference: 'CTR-2026-0001',
        description: 'Contrat de transport régulier',
        startDate: '01/01/2026',
        endDate: '31/12/2026',
        autoRenew: 'Oui',
        status: 'active',
        comment: 'Commentaire contrat',
      },
    );
    XLSX.utils.book_append_sheet(
      workbook,
      contractsSheet,
      CLIENT_FULL_IMPORT_SHEETS.CONTRACTS,
    );

    // Create Prestations sheet
    const prestationsSheet = this.createPrestationsTemplateSheet();
    XLSX.utils.book_append_sheet(
      workbook,
      prestationsSheet,
      CLIENT_FULL_IMPORT_SHEETS.PRESTATIONS,
    );

    // Add instructions sheet
    const instructionsSheet = this.createInstructionsSheet([
      "Ce fichier permet d'importer en une seule fois tout pour un client EXISTANT :",
      'Adresses, Contacts, Contrats et Prestations.',
      '',
      'IMPORTANT :',
      "Sélectionnez le client existant AVANT d'importer ce fichier.",
      'Toutes les données seront automatiquement liées à ce client.',
      '',
      'FEUILLES :',
      `- ${CLIENT_FULL_IMPORT_SHEETS.ADDRESSES} : Les adresses (auto-liées au client)`,
      `- ${CLIENT_FULL_IMPORT_SHEETS.CONTACTS} : Les contacts (auto-liés au client)`,
      `- ${CLIENT_FULL_IMPORT_SHEETS.CONTRACTS} : Les contrats (auto-liés au client)`,
      `- ${CLIENT_FULL_IMPORT_SHEETS.PRESTATIONS} : Les prestations (liées aux contrats)`,
      '',
      "ORDRE D'IMPORT :",
      '1. Les adresses sont importées et liées au client',
      '2. Les contacts sont importés et liés au client',
      '3. Les contrats sont importés et liés au client',
      '4. Les prestations sont liées aux contrats via "Référence contrat"',
      '',
      'CHAMPS OBLIGATOIRES :',
      '- Adresse : Nom, Rue',
      '- Contact : Prénom, Nom',
      '- Contrat : Date début',
      '- Prestation : Référence contrat, Trajet 1 (Adresse départ + Adresse arrivée)',
    ]);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
    return excelBuffer;
  }

  /**
   * Helper to parse date strings in various formats
   */
  private parseDate(dateValue: any): string {
    if (!dateValue) return '';

    // If it's already a string in ISO format
    if (typeof dateValue === 'string') {
      // Try to parse DD/MM/YYYY format
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return dateValue;
    }

    // If it's a Date object or number (Excel serial date)
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    return dateValue.toString();
  }

  /**
   * Convert a worksheet to a buffer for individual service import
   */
  private sheetToBuffer(
    sheet: XLSX.WorkSheet,
    workbook: XLSX.WorkBook,
  ): Buffer {
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, sheet, 'Data');
    return XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Create a template sheet with headers and example row
   */
  private createTemplateSheet(
    columns: ColumnConfig[],
    exampleRow: Record<string, any>,
  ): XLSX.WorkSheet {
    const headers = columns.map((col) =>
      col.required ? `${col.frenchHeader} (*)` : col.frenchHeader,
    );

    const exampleValues = columns.map((col) => exampleRow[col.field] ?? '');

    const data = [headers, exampleValues];
    return XLSX.utils.aoa_to_sheet(data);
  }

  /**
   * Create prestations template sheet with dynamic columns for trajets
   */
  private createPrestationsTemplateSheet(): XLSX.WorkSheet {
    const headers = [
      'Référence contrat (*)',
      'Code article',
      // Trajet 1 - 9 columns
      'Trajet 1 (Adresse départ) (*)',
      'Trajet 1 (Adresse arrivée) (*)',
      'Trajet 1 (Date départ)',
      'Trajet 1 (H. présence)',
      'Trajet 1 (H. départ)',
      'Trajet 1 (Date arrivée)',
      'Trajet 1 (H. arrivée)',
      'Trajet 1 (H. fin)',
      'Trajet 1 (Vide)',
      // Extra columns
      'Type véhicule',
      'Énergie imposée',
      'Type remorque',
      'Sensible',
      'Code déchargement',
      'Commentaire',
      'Fréquence',
    ];

    const exampleRow = [
      'CTR-001',
      'ART-001',
      // Trajet 1 example
      'ADR-001',
      'ADR-002',
      '01/02/2026',
      '08:00',
      '08:30',
      '01/02/2026',
      '12:00',
      '12:30',
      'Non',
      // Extra columns
      'SPL',
      'Gazole',
      'Tautliner',
      'Non',
      'ABC123',
      'Livraison standard',
      'Lun, Mar, Mer, Jeu, Ven',
    ];

    return XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  }

  /**
   * Create instructions sheet
   */
  private createInstructionsSheet(lines: string[]): XLSX.WorkSheet {
    const data = lines.map((line) => [line]);
    return XLSX.utils.aoa_to_sheet(data);
  }
}

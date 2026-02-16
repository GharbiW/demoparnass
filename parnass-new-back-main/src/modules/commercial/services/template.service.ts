import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import { ExcelService } from '../../shared/services/excel.service';
import { ColumnConfig } from '../../shared/dto/import-result.dto';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  InstantiateTemplateDto,
  CreateTemplateFromPrestationDto,
  TemplateEtapeDto,
} from '../dto/template';
import { PrestationService } from './prestation.service';

// Export columns configuration
const TEMPLATE_COLUMNS: ColumnConfig[] = [
  {
    frenchHeader: 'Référence',
    field: 'reference',
    required: true,
    type: 'string',
  },
  { frenchHeader: 'Nom', field: 'name', required: true, type: 'string' },
  {
    frenchHeader: 'Description',
    field: 'description',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Catégorie',
    field: 'category',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Code article',
    field: 'codeArticle',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Type de demande',
    field: 'typeDemande',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Heure départ',
    field: 'heureDepart',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Heure arrivée',
    field: 'heureArrivee',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Typologie véhicule',
    field: 'typologieVehicule',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Énergie imposée',
    field: 'energieImposee',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Type remorque',
    field: 'typeRemorque',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Spécificités',
    field: 'specificites',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Sensible',
    field: 'sensible',
    required: false,
    type: 'boolean',
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
    frenchHeader: 'Kilométrage prévu',
    field: 'kilometragePrevu',
    required: false,
    type: 'number',
  },
  {
    frenchHeader: 'Type tarif',
    field: 'typeTarif',
    required: false,
    type: 'string',
  },
  { frenchHeader: 'Tarif', field: 'tarif', required: false, type: 'number' },
  {
    frenchHeader: 'Unité tarif',
    field: 'tarifUnite',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Km contractuel',
    field: 'tarifKmContractuel',
    required: false,
    type: 'number',
  },
  {
    frenchHeader: 'Heures contractuel',
    field: 'tarifHeuresContractuel',
    required: false,
    type: 'number',
  },
  {
    frenchHeader: 'Fréquence',
    field: 'frequence',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Itinéraire',
    field: 'itineraire',
    required: false,
    type: 'string',
  },
  {
    frenchHeader: 'Inclure détails trajets',
    field: 'includeRideDetails',
    required: false,
    type: 'boolean',
  },
];

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly excelService: ExcelService,
    @Inject(forwardRef(() => PrestationService))
    private readonly prestationService: PrestationService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  /**
   * Get all templates with optional filters
   */
  async findAll(params?: {
    search?: string;
    category?: string;
    typeDemande?: string;
  }) {
    let query = this.supabase
      .from('prestation_template')
      .select(
        `
        *,
        client:client_id (
          id,
          name,
          initials,
          avatar_url,
          color,
          reference
        ),
        contract:contract_id (
          id,
          reference,
          client:client_id (
            id,
            name,
            initials,
            avatar_url,
            color,
            reference
          )
        )
      `,
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (params?.category) {
      query = query.eq('category', params.category);
    }
    if (params?.typeDemande) {
      query = query.eq('type_demande', params.typeDemande);
    }
    if (params?.search) {
      query = query.or(
        `name.ilike.%${params.search}%,description.ilike.%${params.search}%,reference.ilike.%${params.search}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Error fetching templates', error);
      throw new BadRequestException(error.message);
    }

    // Fetch address details for all etapes
    const allEtapeIds = new Set<string>();
    data.forEach((t: any) => {
      if (t.etapes && Array.isArray(t.etapes)) {
        const ids = this.extractAddressIds(t.etapes);
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

    return data.map((template: any) =>
      this.transformTemplate(template, addressMap),
    );
  }

  /**
   * Get a single template by ID
   */
  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('prestation_template')
      .select(
        `
        *,
        client:client_id (
          id,
          name,
          initials,
          avatar_url,
          color,
          reference
        ),
        contract:contract_id (
          id,
          reference,
          client:client_id (
            id,
            name,
            initials,
            avatar_url,
            color,
            reference
          )
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Modèle avec l'ID ${id} introuvable`);
      }
      throw new BadRequestException(error.message);
    }

    // Fetch address details for etapes
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

    return this.transformTemplate(data, addressMap);
  }

  /**
   * Create a new template
   */
  async create(createTemplateDto: CreateTemplateDto) {
    const templateData = this.transformDtoToDb(createTemplateDto);

    const { data, error } = await this.supabase
      .from('prestation_template')
      .insert(templateData)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error creating template', error);
      throw new BadRequestException(error.message);
    }

    // Fetch address details for etapes
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

    return this.transformTemplate(data, addressMap);
  }

  /**
   * Update an existing template
   */
  async update(id: string, updateTemplateDto: UpdateTemplateDto) {
    // First check if template exists
    await this.findOne(id);

    const templateData = this.transformDtoToDb(updateTemplateDto);

    const { data, error } = await this.supabase
      .from('prestation_template')
      .update(templateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error updating template', error);
      throw new BadRequestException(error.message);
    }

    // Fetch address details for etapes
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

    return this.transformTemplate(data, addressMap);
  }

  /**
   * Delete a template
   */
  async remove(id: string) {
    // First check if template exists
    await this.findOne(id);

    const { error } = await this.supabase
      .from('prestation_template')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Error deleting template', error);
      throw new BadRequestException(error.message);
    }

    return { message: 'Modèle supprimé avec succès' };
  }

  /**
   * Create a prestation from a template
   */
  async instantiate(
    id: string,
    dto: InstantiateTemplateDto,
    userId?: string,
    userName?: string,
  ) {
    // Get the template
    const template = await this.findOne(id);

    // Build the prestation DTO from template data
    const prestationDto: any = {
      contractId: dto.contractId,
      referenceClient: dto.referenceClient || undefined,
      frequence: template.frequence || [],
      typeDemande: template.typeDemande || 'Régulière',
      heureDepart: template.heureDepart,
      heureArrivee: template.heureArrivee,
      typologieVehicule: template.typologieVehicule || 'TRAGO',
      energieImposee: template.energieImposee || 'Gazole',
      typeRemorque: template.typeRemorque || 'SRCLA',
      specificites: template.specificites || [],
      contraintesConducteur: template.contraintesConducteur || [],
      sensible: template.sensible || false,
      codeDechargement: template.codeDechargement,
      typeTracteur: template.typeTracteur,
      comment: template.comment,
      kilometragePrevu: template.kilometragePrevu,
      typeTarif: template.typeTarif,
      tarif: template.tarif,
      tarifUnite: template.tarifUnite,
      // MCom-25: Contractual billing amounts
      tarifKmContractuel: template.tarifKmContractuel,
      tarifHeuresContractuel: template.tarifHeuresContractuel,
    };

    // Build etapes from template itineraires
    if (template.itineraires && template.itineraires.length > 0) {
      prestationDto.etapes = template.itineraires.map((it: any) => ({
        addressId: it.id,
        heureDepart: dto.includeRideDetails ? it.heureDepart : undefined,
        heureArrivee: dto.includeRideDetails ? it.heureArrivee : undefined,
        vide: dto.includeRideDetails ? it.vide : false,
        comment: dto.includeRideDetails ? it.comment : undefined,
      }));
    } else {
      prestationDto.etapes = [];
    }

    // Create the prestation using the existing service
    const prestation = await this.prestationService.create(
      prestationDto,
      userId,
      userName,
    );

    return prestation;
  }

  /**
   * Create a template from an existing prestation
   */
  async createFromPrestation(
    prestationId: string,
    dto: CreateTemplateFromPrestationDto,
  ) {
    // Get the prestation with full details
    const prestation = await this.prestationService.findOne(prestationId);

    // Build template DTO from prestation data
    const templateDto: CreateTemplateDto = {
      name: dto.name,
      description: dto.description,
      category: dto.category,
      codeArticle: dto.codeArticle,
      frequence: prestation.frequence || [],
      typeDemande: prestation.typeDemande || 'Régulière',
      heureDepart: prestation.heureDepart,
      heureArrivee: prestation.heureArrivee,
      typologieVehicule: prestation.typologieVehicule,
      energieImposee: prestation.energieImposee,
      typeRemorque: prestation.typeRemorque,
      specificites: prestation.specificites || [],
      contraintesConducteur: prestation.contraintesConducteur || [],
      sensible: prestation.sensible || false,
      codeDechargement: prestation.codeDechargement,
      typeTracteur: prestation.typeTracteur,
      comment: prestation.comment,
      kilometragePrevu: prestation.kilometragePrevu,
      typeTarif: prestation.typeTarif,
      tarif: prestation.tarif,
      tarifUnite: prestation.tarifUnite,
      // MCom-25: Contractual billing amounts
      tarifKmContractuel: prestation.tarifKmContractuel,
      tarifHeuresContractuel: prestation.tarifHeuresContractuel,
      includeRideDetails: dto.includeRideDetails || false,
    };

    // Build etapes from prestation itineraires
    if (prestation.itineraires && prestation.itineraires.length > 0) {
      templateDto.etapes = prestation.itineraires.map((it: any) => ({
        addressId: it.id,
        heureDepart: it.heureDepart,
        heureArrivee: it.heureArrivee,
        vide: it.vide,
        comment: it.comment,
      }));
    }

    // If includeRideDetails is true, fetch and store ride details
    if (dto.includeRideDetails) {
      const { data: rides } = await this.supabase
        .from('ride')
        .select('*')
        .eq('prestation_id', prestationId)
        .order('order_index', { ascending: true });

      if (rides && rides.length > 0) {
        templateDto.rideDetails = rides.map((ride: any) => ({
          orderIndex: ride.order_index,
          presenceChargement: this.extractTimeFromTimestamp(
            ride.presence_chargement,
          ),
          departChargement: this.extractTimeFromTimestamp(
            ride.depart_chargement,
          ),
          arriveeLivraison: this.extractTimeFromTimestamp(
            ride.arrivee_livraison,
          ),
          finLivraison: this.extractTimeFromTimestamp(ride.fin_livraison),
          vide: ride.vide || false,
          comment: ride.comment,
        }));
      }
    }

    // Create the template
    return this.create(templateDto);
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('prestation_template')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      this.logger.error('Error fetching categories', error);
      throw new BadRequestException(error.message);
    }

    // Get unique categories
    const categories = [...new Set(data.map((t: any) => t.category))].filter(
      Boolean,
    );
    return categories.sort();
  }

  /**
   * Export all templates to Excel
   */
  async exportToExcel(): Promise<Buffer> {
    // Get all templates
    const templates = await this.findAll();

    // Transform data for export
    const exportData = templates.map((template: any) => ({
      reference: template.reference,
      name: template.name,
      description: template.description || '',
      category: template.category || '',
      codeArticle: template.codeArticle || '',
      typeDemande: template.typeDemande || '',
      heureDepart: template.heureDepart || '',
      heureArrivee: template.heureArrivee || '',
      typologieVehicule: template.typologieVehicule || '',
      energieImposee: template.energieImposee || '',
      typeRemorque: template.typeRemorque || '',
      specificites: (template.specificites || []).join(', '),
      sensible: template.sensible || false,
      codeDechargement: template.codeDechargement || '',
      comment: template.comment || '',
      kilometragePrevu: template.kilometragePrevu || '',
      typeTarif: template.typeTarif || '',
      tarif: template.tarif || '',
      tarifUnite: template.tarifUnite || '',
      // MCom-25: Contractual billing amounts
      tarifKmContractuel: template.tarifKmContractuel || '',
      tarifHeuresContractuel: template.tarifHeuresContractuel || '',
      frequence: (template.frequence || []).join(', '),
      itineraire: (template.itineraires || [])
        .map((it: any) => it.name)
        .join(' → '),
      includeRideDetails: template.includeRideDetails || false,
    }));

    return this.excelService.generateExcel(exportData, TEMPLATE_COLUMNS);
  }

  // ============================================
  // Helper Methods
  // ============================================

  private extractAddressIds(etapes: any[]): string[] {
    return etapes
      .map((etape: any) => {
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
  }

  private extractTimeFromTimestamp(
    timestamp: string | null,
  ): string | undefined {
    if (!timestamp) return undefined;
    try {
      const d = new Date(timestamp);
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return undefined;
    }
  }

  private transformTemplate(data: any, addressMap?: Map<string, any>) {
    // Build itineraires array from etapes JSONB objects
    const etapes = data.etapes || [];
    const itineraires = etapes.map((etape: any, index: number) => {
      let addressId: string | undefined;
      let heureDepart: string | null = null;
      let heureArrivee: string | null = null;
      let vide = false;
      let comment: string | null = null;

      if (typeof etape === 'string') {
        addressId = etape;
      } else if (typeof etape === 'object' && etape !== null) {
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
            comment = parsed.comment || etape.comment || null;
          } catch {
            addressId = etape.address_id;
            heureDepart = etape.heure_depart || null;
            heureArrivee = etape.heure_arrivee || null;
            vide = etape.vide ?? false;
            comment = etape.comment || null;
          }
        } else {
          addressId = etape.address_id;
          heureDepart = etape.heure_depart || null;
          heureArrivee = etape.heure_arrivee || null;
          vide = etape.vide ?? false;
          comment = etape.comment || null;
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
          heureDepart,
          heureArrivee,
          vide,
          comment,
        };
      }
      return {
        id: addressId || `unknown-${index}`,
        name: `Adresse ${index + 1}`,
        order: index,
        heureDepart,
        heureArrivee,
        vide,
        comment,
      };
    });

    const etapeIds = this.extractAddressIds(etapes);

    return {
      id: data.id,
      reference: data.reference,
      name: data.name,
      description: data.description,
      category: data.category,
      codeArticle: data.code_article,
      clientId: data.client_id,
      client: data.client
        ? {
            id: data.client.id,
            name: data.client.name,
            initials: data.client.initials,
            avatarUrl: data.client.avatar_url,
            color: data.client.color,
            reference: data.client.reference,
          }
        : null,
      contractId: data.contract_id,
      contract: data.contract
        ? {
            id: data.contract.id,
            reference: data.contract.reference,
            client: data.contract.client
              ? {
                  id: data.contract.client.id,
                  name: data.contract.client.name,
                  initials: data.contract.client.initials,
                  avatarUrl: data.contract.client.avatar_url,
                  color: data.contract.client.color,
                  reference: data.contract.client.reference,
                }
              : null,
          }
        : null,
      frequence: data.frequence,
      typeDemande: data.type_demande,
      heureDepart: data.heure_depart,
      heureArrivee: data.heure_arrivee,
      etapes: etapeIds,
      itineraires,
      typologieVehicule: data.typologie_vehicule,
      energieImposee: data.energie_imposee,
      typeRemorque: data.type_remorque,
      specificites: data.specificites || [],
      contraintesConducteur: data.contraintes_conducteur || [],
      sensible: data.sensible,
      codeDechargement: data.code_dechargement,
      typeTracteur: data.type_tracteur,
      comment: data.comment,
      kilometragePrevu: data.kilometrage_prevu,
      typeTarif: data.type_tarif,
      tarif: data.tarif,
      tarifUnite: data.tarif_unite,
      // MCom-25: Contractual billing amounts
      tarifKmContractuel: data.tarif_km_contractuel,
      tarifHeuresContractuel: data.tarif_heures_contractuel,
      includeRideDetails: data.include_ride_details,
      rideDetails: data.ride_details || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformDtoToDb(dto: CreateTemplateDto | UpdateTemplateDto) {
    const result: any = {};

    if ('name' in dto && dto.name !== undefined) result.name = dto.name;
    if ('description' in dto && dto.description !== undefined)
      result.description = dto.description;
    if ('category' in dto && dto.category !== undefined)
      result.category = dto.category;
    if ('codeArticle' in dto && dto.codeArticle !== undefined)
      result.code_article = dto.codeArticle;
    if ('clientId' in dto && dto.clientId !== undefined)
      result.client_id = dto.clientId;
    if ('contractId' in dto && dto.contractId !== undefined)
      result.contract_id = dto.contractId;
    if ('frequence' in dto && dto.frequence !== undefined)
      result.frequence = dto.frequence;
    if ('typeDemande' in dto && dto.typeDemande !== undefined)
      result.type_demande = dto.typeDemande;
    if ('heureDepart' in dto && dto.heureDepart !== undefined)
      result.heure_depart = dto.heureDepart;
    if ('heureArrivee' in dto && dto.heureArrivee !== undefined)
      result.heure_arrivee = dto.heureArrivee;

    // Convert etapes to JSONB[] with snake_case keys
    if ('etapes' in dto && dto.etapes !== undefined) {
      result.etapes = dto.etapes.map((etape) => ({
        address_id: etape.addressId,
        heure_depart: etape.heureDepart || null,
        heure_arrivee: etape.heureArrivee || null,
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
    if ('codeDechargement' in dto && dto.codeDechargement !== undefined)
      result.code_dechargement = dto.codeDechargement;
    if ('typeTracteur' in dto && dto.typeTracteur !== undefined)
      result.type_tracteur = dto.typeTracteur;
    if ('comment' in dto && dto.comment !== undefined)
      result.comment = dto.comment;
    if ('kilometragePrevu' in dto && dto.kilometragePrevu !== undefined)
      result.kilometrage_prevu = dto.kilometragePrevu;
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
    if ('includeRideDetails' in dto && dto.includeRideDetails !== undefined)
      result.include_ride_details = dto.includeRideDetails;

    // Convert rideDetails to JSONB with snake_case keys
    if ('rideDetails' in dto && dto.rideDetails !== undefined) {
      result.ride_details = dto.rideDetails.map((rd) => ({
        order_index: rd.orderIndex,
        presence_chargement: rd.presenceChargement || null,
        depart_chargement: rd.departChargement || null,
        arrivee_livraison: rd.arriveeLivraison || null,
        fin_livraison: rd.finLivraison || null,
        vide: rd.vide ?? false,
        comment: rd.comment || null,
      }));
    }

    return result;
  }
}

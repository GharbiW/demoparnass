import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import {
  SiteResponseDto,
  SiteStatsDto,
  CreateSiteDto,
  UpdateSiteDto,
  ListSitesQueryDto,
} from '../dto/site.dto';

@Injectable()
export class SitesService {
  private readonly logger = new Logger(SitesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  /**
   * Transform a database row to a SiteResponseDto
   */
  private transformSite(row: any): SiteResponseDto {
    return {
      id: row.id,
      nom: row.nom,
      type: row.type,
      isLieuPriseService: row.is_lieu_prise_service ?? false,
      adresse: row.adresse,
      ville: row.ville,
      codePostal: row.code_postal,
      pays: row.pays,
      latitude: row.latitude ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude ? parseFloat(row.longitude) : undefined,
      contactNom: row.contact_nom,
      contactTelephone: row.contact_telephone,
      horaires: row.horaires,
      capacite: row.capacite,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Find all sites with optional filtering
   */
  async findAll(query: ListSitesQueryDto): Promise<SiteResponseDto[]> {
    let dbQuery = this.supabase.from('site').select('*');

    // Apply filters
    if (query.type) {
      dbQuery = dbQuery.eq('type', query.type);
    }

    if (query.ville) {
      dbQuery = dbQuery.ilike('ville', `%${query.ville}%`);
    }

    if (query.isLieuPriseService === 'true') {
      dbQuery = dbQuery.eq('is_lieu_prise_service', true);
    } else if (query.isLieuPriseService === 'false') {
      dbQuery = dbQuery.eq('is_lieu_prise_service', false);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      dbQuery = dbQuery.or(
        `nom.ilike.%${searchLower}%,ville.ilike.%${searchLower}%,adresse.ilike.%${searchLower}%`,
      );
    }

    // Pagination
    const limit = query.limit || 10000;
    dbQuery = dbQuery.limit(limit);

    if (query.offset) {
      dbQuery = dbQuery.range(query.offset, query.offset + limit - 1);
    }

    // Order by name
    dbQuery = dbQuery.order('nom');

    const { data, error } = await dbQuery;

    if (error) {
      this.logger.error('Erreur lors de la récupération des sites', error);
      throw new BadRequestException(error.message);
    }

    return (data || []).map((row) => this.transformSite(row));
  }

  /**
   * Find a single site by ID
   */
  async findOne(id: string): Promise<SiteResponseDto> {
    const { data, error } = await this.supabase
      .from('site')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Site non trouvé: ${id}`);
    }

    return this.transformSite(data);
  }

  /**
   * Create a new site
   */
  async create(dto: CreateSiteDto): Promise<SiteResponseDto> {
    const insertData: any = {
      nom: dto.nom,
      type: dto.type,
      is_lieu_prise_service:
        dto.isLieuPriseService ?? dto.type === 'lieu_prise_service',
      adresse: dto.adresse || null,
      ville: dto.ville || null,
      code_postal: dto.codePostal || null,
      pays: dto.pays || 'France',
      latitude: dto.latitude || null,
      longitude: dto.longitude || null,
      contact_nom: dto.contactNom || null,
      contact_telephone: dto.contactTelephone || null,
      horaires: dto.horaires || null,
      capacite: dto.capacite || 0,
    };

    const { data, error } = await this.supabase
      .from('site')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      this.logger.error('Erreur lors de la création du site', error);
      throw new BadRequestException(error.message);
    }

    return this.transformSite(data);
  }

  /**
   * Update an existing site
   */
  async update(id: string, dto: UpdateSiteDto): Promise<SiteResponseDto> {
    // First check the site exists
    await this.findOne(id);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.nom !== undefined) updateData.nom = dto.nom;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.isLieuPriseService !== undefined)
      updateData.is_lieu_prise_service = dto.isLieuPriseService;
    if (dto.adresse !== undefined) updateData.adresse = dto.adresse;
    if (dto.ville !== undefined) updateData.ville = dto.ville;
    if (dto.codePostal !== undefined) updateData.code_postal = dto.codePostal;
    if (dto.pays !== undefined) updateData.pays = dto.pays;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.contactNom !== undefined) updateData.contact_nom = dto.contactNom;
    if (dto.contactTelephone !== undefined)
      updateData.contact_telephone = dto.contactTelephone;
    if (dto.horaires !== undefined) updateData.horaires = dto.horaires;
    if (dto.capacite !== undefined) updateData.capacite = dto.capacite;

    const { data, error } = await this.supabase
      .from('site')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Erreur lors de la mise à jour du site', error);
      throw new BadRequestException(error.message);
    }

    return this.transformSite(data);
  }

  /**
   * Delete a site
   */
  async remove(id: string): Promise<{ deleted: boolean }> {
    // First check the site exists
    await this.findOne(id);

    const { error } = await this.supabase.from('site').delete().eq('id', id);

    if (error) {
      this.logger.error('Erreur lors de la suppression du site', error);
      throw new BadRequestException(error.message);
    }

    return { deleted: true };
  }

  /**
   * Get site statistics
   */
  async getStats(): Promise<SiteStatsDto> {
    const { data, error } = await this.supabase
      .from('site')
      .select('type, is_lieu_prise_service')
      .limit(50000);

    if (error) {
      this.logger.error(
        'Erreur lors de la récupération des statistiques des sites',
        error,
      );
      throw new BadRequestException(error.message);
    }

    const stats: SiteStatsDto = {
      total: (data || []).length,
      depots: 0,
      parkings: 0,
      garages: 0,
      lieuxPriseService: 0,
    };

    (data || []).forEach((row: any) => {
      switch (row.type) {
        case 'depot':
          stats.depots++;
          break;
        case 'parking':
          stats.parkings++;
          break;
        case 'garage':
          stats.garages++;
          break;
        case 'lieu_prise_service':
          stats.lieuxPriseService++;
          break;
      }
    });

    return stats;
  }
}

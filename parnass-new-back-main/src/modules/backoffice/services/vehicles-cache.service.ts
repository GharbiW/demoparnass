import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../../config/supabase.service';
import {
  VehicleCacheResponseDto,
  VehicleStatsDto,
  UpdateVehicleManualFieldsDto,
  ListVehiclesQueryDto,
  VEHICLE_API_FIELDS,
} from '../dto/vehicle.dto';
import { WincplVehicle, WincplAbsence } from '../types/wincpl.types';
import { WincplXmlParserService } from './wincpl-xml-parser.service';

@Injectable()
export class VehiclesCacheService {
  private readonly logger = new Logger(VehiclesCacheService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  /**
   * Transform database row to response DTO (unified for both Wincpl and MyRentACar)
   */
  private transformVehicle(row: any, titulaire?: any): VehicleCacheResponseDto {
    const response: VehicleCacheResponseDto = {
      id: row.id,
      dataSource: row.data_source || 'myrentcar',
      myrentcarId: row.myrentcar_id,
      wincplCode: row.wincpl_code,

      // Core identification
      immatriculation: row.immatriculation,
      numero: row.numero || row.wincpl_code,
      marqueVehicule: row.marque_vehicule,
      marqueModele: row.marque_modele || row.marque_vehicule,
      categorieVehicule: row.categorie_vehicule,
      type: row.type || row.type_carrosserie,
      typeCode: row.type_code,
      enActivite: row.en_activite,
      idSociete: row.id_societe,
      idAgence: row.id_agence,

      // Serial / Chassis
      numeroSerie: row.numero_serie,
      numeroChassis: row.numero_chassis,
      numeroMoteur: row.numero_moteur,

      // Engine / Power
      puissanceVehicule: row.puissance_vehicule,
      puissanceKw: row.puissance_kw,
      cylindree: row.cylindree,
      nbCylindres: row.nb_cylindres,
      nbVitesses: row.nb_vitesses,
      codeMoteur: row.code_moteur,
      typeTransmission: row.type_transmission,
      turboCompresseur: row.turbo_compresseur,

      // Dimensions
      longueurTotale: row.longueur_totale,
      largeurTotale: row.largeur_totale,
      hauteurTotale: row.hauteur_totale,
      volumeVehicule: row.volume_vehicule,
      volumeMaxi: row.volume_maxi,

      // Weight
      poidsVide: row.poids_vide,
      poidsCharge: row.poids_charge,
      chargeUtile: row.charge_utile,
      ptac: row.ptac,
      ptr: row.ptr,
      poidsTotalRoulant: row.poids_total_roulant,
      nbEssieux: row.nb_essieux,

      // Body
      typeCarrosserie: row.type_carrosserie,
      typeCarrosserie2: row.type_carrosserie_2,
      genreCarrosserie: row.genre_carrosserie,
      nbPlacesAssises: row.nb_places_assises,
      nbPortes: row.nb_portes,
      palVehicule: row.pal_vehicule,

      // Energy
      energie: row.energie || WincplXmlParserService.mapEnergyCode(row.energie_vehicule),
      energieVehicule: row.energie_vehicule,
      energieId: row.energie_id,
      capaciteReservoir: row.capacite_reservoir || row.contenance_reservoir,
      contenanceReservoir: row.contenance_reservoir,
      consoUrbaine: row.conso_urbaine,
      consoExtraUrbaine: row.conso_extra_urbaine,
      consoMixte: row.conso_mixte,

      // Pollution
      normePollution: row.norme_pollution,
      critair: row.critair,
      co2: row.co2,
      filtreAParticules: row.filtre_a_particules,
      adblue: row.adblue_flag,

      // Dates & KM
      kilometrage: row.kilometrage || row.km_compteur,
      dateDernierKm: row.date_dernier_km,
      dateMiseCirculation: row.date_mise_circulation,
      dateAchat: row.date_achat,
      dateCarteGrise: row.date_carte_grise || row.date_cg,
      dateFinGarantieVehicule: row.date_fin_garantie_vehicule,
      dateFinGarantieMoteur: row.date_fin_garantie_moteur,
      immatriculationPrecedente: row.immatriculation_precedente,

      // Insurance
      codeAssureur: row.code_assureur,
      assuranceNumContrat: row.assurance_num_contrat,
      assuranceDateEcheance: row.assurance_date_echeance,
      assuranceMontant: row.assurance_montant,
      assuranceFranchise: row.assurance_franchise,

      // Transport
      codeTypeSemi: row.code_type_semi,
      porteur: row.porteur,
      commentaire: row.commentaire,

      // Legacy MyRentACar fields
      primeVolume: row.prime_volume,
      agenceProprietaire: row.agence_proprietaire,
      categoryCode: row.category_code,

      // Manual fields
      status: row.status || 'disponible',
      semiCompatibles: row.semi_compatibles || [],
      equipements: row.equipements || [],
      localisation: row.localisation,
      lastPositionUpdate: row.last_position_update,
      prochainCt: row.prochain_ct,
      prochainEntretien: row.prochain_entretien,
      titulaireId: row.titulaire_id,

      // Absences (from Wincpl)
      absences: row.absences || [],

      // Metadata
      _apiFields: VEHICLE_API_FIELDS,
      syncedAt: row.synced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    // Add titulaire details if available
    if (titulaire) {
      response.titulaire = {
        id: titulaire.id,
        nom: `${titulaire.first_name} ${titulaire.last_name}`,
      };
    }

    // Add maintenance details if in maintenance
    if (row.status === 'maintenance' && row.maintenance_type) {
      response.maintenanceDetails = {
        type: row.maintenance_type,
        dateEntree: row.maintenance_date_entree,
        etr: row.maintenance_etr,
      };
    }

    return response;
  }

  /**
   * Find all vehicles with optional filtering
   */
  async findAll(query: ListVehiclesQueryDto): Promise<VehicleCacheResponseDto[]> {
    let dbQuery = this.supabase.from('vehicle_cache').select('*');

    // Apply filters
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.type) {
      dbQuery = dbQuery.eq('type', query.type);
    }

    if (query.energie) {
      dbQuery = dbQuery.eq('energie', query.energie);
    }

    if (query.dataSource) {
      dbQuery = dbQuery.eq('data_source', query.dataSource);
    }

    if (query.categorie) {
      dbQuery = dbQuery.eq('categorie_vehicule', query.categorie);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      dbQuery = dbQuery.or(
        `immatriculation.ilike.%${searchLower}%,marque_modele.ilike.%${searchLower}%,marque_vehicule.ilike.%${searchLower}%,numero.ilike.%${searchLower}%,wincpl_code.ilike.%${searchLower}%`,
      );
    }

    // Pagination
    const limit = query.limit || 10000;
    dbQuery = dbQuery.limit(limit);

    if (query.offset) {
      dbQuery = dbQuery.range(query.offset, query.offset + limit - 1);
    }

    // Order by immatriculation
    dbQuery = dbQuery.order('immatriculation');

    const { data, error } = await dbQuery;

    if (error) {
      this.logger.error('Erreur lors de la récupération des véhicules', error);
      throw new BadRequestException(error.message);
    }

    // Get titulaires for vehicles that have one
    const titulaireIds = (data || [])
      .filter((v: any) => v.titulaire_id)
      .map((v: any) => v.titulaire_id);

    let titulairesMap = new Map();
    if (titulaireIds.length > 0) {
      const { data: titulaires } = await this.supabase
        .from('driver_cache')
        .select('id, first_name, last_name')
        .in('id', titulaireIds);

      if (titulaires) {
        titulaires.forEach((t: any) => {
          titulairesMap.set(t.id, t);
        });
      }
    }

    return (data || []).map((row: any) =>
      this.transformVehicle(row, titulairesMap.get(row.titulaire_id)),
    );
  }

  /**
   * Find a single vehicle by ID
   */
  async findOne(id: string): Promise<VehicleCacheResponseDto> {
    const { data, error } = await this.supabase
      .from('vehicle_cache')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Véhicule non trouvé: ${id}`);
    }

    let titulaire: { id: string; first_name: string; last_name: string } | null = null;
    if (data.titulaire_id) {
      const { data: titulaireData } = await this.supabase
        .from('driver_cache')
        .select('id, first_name, last_name')
        .eq('id', data.titulaire_id)
        .single();
      titulaire = titulaireData;
    }

    return this.transformVehicle(data, titulaire);
  }

  /**
   * Find a vehicle by MyRentCar ID
   */
  async findByMyRentCarId(myrentcarId: number): Promise<VehicleCacheResponseDto | null> {
    const { data, error } = await this.supabase
      .from('vehicle_cache')
      .select('*')
      .eq('myrentcar_id', myrentcarId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.transformVehicle(data);
  }

  /**
   * Find a vehicle by Wincpl CODE_VEHICULE
   */
  async findByWincplCode(wincplCode: string): Promise<VehicleCacheResponseDto | null> {
    const { data, error } = await this.supabase
      .from('vehicle_cache')
      .select('*')
      .eq('wincpl_code', wincplCode)
      .single();

    if (error || !data) {
      return null;
    }

    return this.transformVehicle(data);
  }

  /**
   * Get vehicle statistics
   */
  async getStats(): Promise<VehicleStatsDto> {
    const { count: totalCount, error: countError } = await this.supabase
      .from('vehicle_cache')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      this.logger.error('Erreur lors du comptage des véhicules', countError);
      throw new BadRequestException(countError.message);
    }

    const { data, error } = await this.supabase
      .from('vehicle_cache')
      .select('status, synced_at')
      .limit(50000);

    if (error) {
      this.logger.error('Erreur lors de la récupération des statistiques', error);
      throw new BadRequestException(error.message);
    }

    const stats: VehicleStatsDto = {
      total: totalCount || 0,
      disponibles: 0,
      enTournee: 0,
      maintenance: 0,
      indisponibles: 0,
      lastSyncAt: undefined,
    };

    let latestSyncDate: Date | null = null;

    (data || []).forEach((row: any) => {
      switch (row.status) {
        case 'disponible':
          stats.disponibles++;
          break;
        case 'en_tournee':
          stats.enTournee++;
          break;
        case 'maintenance':
          stats.maintenance++;
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
   * Update manual fields
   */
  async updateManualFields(
    id: string,
    dto: UpdateVehicleManualFieldsDto,
  ): Promise<VehicleCacheResponseDto> {
    await this.findOne(id);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.semiCompatibles !== undefined) updateData.semi_compatibles = dto.semiCompatibles;
    if (dto.equipements !== undefined) updateData.equipements = dto.equipements;
    if (dto.localisation !== undefined) updateData.localisation = dto.localisation;
    if (dto.lastPositionUpdate !== undefined) updateData.last_position_update = dto.lastPositionUpdate;
    if (dto.prochainCt !== undefined) updateData.prochain_ct = dto.prochainCt;
    if (dto.prochainEntretien !== undefined) updateData.prochain_entretien = dto.prochainEntretien;
    if (dto.titulaireId !== undefined) updateData.titulaire_id = dto.titulaireId;
    if (dto.maintenanceType !== undefined) updateData.maintenance_type = dto.maintenanceType;
    if (dto.maintenanceDateEntree !== undefined) updateData.maintenance_date_entree = dto.maintenanceDateEntree;
    if (dto.maintenanceEtr !== undefined) updateData.maintenance_etr = dto.maintenanceEtr;

    const { data, error } = await this.supabase
      .from('vehicle_cache')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Erreur lors de la mise à jour du véhicule', error);
      throw new BadRequestException(error.message);
    }

    return this.transformVehicle(data);
  }

  /**
   * Upsert a vehicle from MyRentCar API data
   * Maps MyRentACar fields → Wincpl canonical columns
   */
  async upsertFromApi(apiData: {
    myrentcar_id: number;
    numero?: string;
    immatriculation: string;
    type?: string;
    type_code?: string;
    marque_modele?: string;
    energie?: string;
    energie_id?: number;
    kilometrage?: number;
    date_dernier_km?: string;
    date_mise_circulation?: string;
    capacite_reservoir?: number;
    poids_vide?: string;
    poids_charge?: string;
    prime_volume?: number;
    agence_proprietaire?: string;
    category_code?: string;
    numero_serie?: string;
  }): Promise<{ created: boolean; updated: boolean }> {
    const existing = await this.findByMyRentCarId(apiData.myrentcar_id);

    const now = new Date().toISOString();

    // Map MyRentACar → Wincpl canonical columns
    const mappedData = {
      // Legacy MyRentACar fields (kept as-is)
      myrentcar_id: apiData.myrentcar_id,
      numero: apiData.numero,
      immatriculation: apiData.immatriculation,
      type: apiData.type,
      type_code: apiData.type_code,
      marque_modele: apiData.marque_modele,
      energie: apiData.energie,
      energie_id: apiData.energie_id,
      kilometrage: apiData.kilometrage,
      date_dernier_km: apiData.date_dernier_km,
      date_mise_circulation: apiData.date_mise_circulation,
      capacite_reservoir: apiData.capacite_reservoir,
      poids_vide: apiData.poids_vide,
      poids_charge: apiData.poids_charge,
      prime_volume: apiData.prime_volume,
      agence_proprietaire: apiData.agence_proprietaire,
      category_code: apiData.category_code,
      numero_serie: apiData.numero_serie,
      // Also populate Wincpl canonical columns from MyRentACar data
      data_source: 'myrentcar',
      wincpl_code: apiData.numero, // Use MyRentACar internal number as wincpl_code
      marque_vehicule: apiData.marque_modele, // Full marque+modele
      categorie_vehicule: apiData.category_code,
      energie_vehicule: this.mapMyRentCarEnergyToWincpl(apiData.energie),
      contenance_reservoir: apiData.capacite_reservoir,
      km_compteur: apiData.kilometrage,
      type_carrosserie: apiData.type,
      en_activite: true,
    };

    if (existing) {
      const { error } = await this.supabase
        .from('vehicle_cache')
        .update({
          ...mappedData,
          synced_at: now,
          updated_at: now,
        })
        .eq('myrentcar_id', apiData.myrentcar_id);

      if (error) {
        this.logger.error(`Erreur mise à jour véhicule ${apiData.myrentcar_id}`, error);
        throw new BadRequestException(error.message);
      }

      return { created: false, updated: true };
    } else {
      const { error } = await this.supabase.from('vehicle_cache').insert({
        ...mappedData,
        status: 'disponible',
        semi_compatibles: [],
        equipements: [],
        synced_at: now,
        created_at: now,
        updated_at: now,
      });

      if (error) {
        this.logger.error(`Erreur création véhicule ${apiData.myrentcar_id}`, error);
        throw new BadRequestException(error.message);
      }

      return { created: true, updated: false };
    }
  }

  /**
   * Upsert a vehicle from Wincpl XML data
   * Wincpl fields are the canonical schema.
   */
  async upsertFromWincpl(vehicle: WincplVehicle): Promise<{ created: boolean; updated: boolean }> {
    const now = new Date().toISOString();

    const wincplData: any = {
      data_source: 'wincpl',
      wincpl_code: vehicle.codeVehicule,
      immatriculation: vehicle.immatriculation,
      numero: vehicle.codeVehicule,

      // Core
      id_societe: vehicle.idSociete,
      id_agence: vehicle.idAgence,
      categorie_vehicule: vehicle.categorieVehicule,
      type_vehicule_code: vehicle.typeVehicule,
      marque_vehicule: vehicle.marqueVehicule,
      marque_modele: vehicle.marqueVehicule, // Also populate legacy field
      en_activite: vehicle.enActivite,
      interne: vehicle.interne,

      // Serial / Chassis
      numero_serie: vehicle.numeroSerie,
      numero_chassis: vehicle.numeroChassis,
      numero_moteur: vehicle.numeroMoteur,
      numero_chassis_aux: vehicle.numeroChassisAux,

      // Engine / Power
      puissance_vehicule: vehicle.puissanceVehicule,
      puissance_kw: vehicle.puissanceKw,
      cylindree: vehicle.cylindree,
      nb_cylindres: vehicle.nbCylindres,
      nb_soupapes: vehicle.nbSoupapes,
      nb_vitesses: vehicle.nbVitesses,
      code_moteur: vehicle.codeMoteur,
      type_transmission: vehicle.typeTransmission,
      type_injection: vehicle.typeInjection,
      turbo_compresseur: vehicle.turboCompresseur,
      propulsion: vehicle.propulsion,
      vitesse_moteur: vehicle.vitesseMoteur,

      // Dimensions
      longueur_totale: vehicle.longueurTotale,
      largeur_totale: vehicle.largeurTotale,
      hauteur_totale: vehicle.hauteurTotale,
      volume_vehicule: vehicle.volumeVehicule,
      volume_maxi: vehicle.volumeMaxi,

      // Weight
      poids_vide: vehicle.poidsAVide?.toString(),
      charge_utile: vehicle.chargeUtile,
      poids_charge: vehicle.poidsEnCharge?.toString(),
      poids_total_roulant: vehicle.poidsTotalRoulant,
      poids_maxi_marchandises: vehicle.poidsMaxiMarchandises,
      ptac: vehicle.ptac,
      ptr: vehicle.ptr,
      nb_essieux: vehicle.nbEssieux,
      poids_moyen_essieu: vehicle.poidsMoyenEssieu,

      // Body
      type_carrosserie: vehicle.typeCarrosserie,
      type_carrosserie_2: vehicle.typeCarrosserie2,
      genre_carrosserie: vehicle.genreCarrosserie,
      carrosserie_cg: vehicle.carrosserieCg,
      genre_cg: vehicle.genreCg,
      type_carte_grise: vehicle.typeCarteGrise,
      type: vehicle.typeCarrosserie, // Also populate legacy field

      // Seats
      nb_places_assises: vehicle.nbPlacesAssises,
      nb_places_debout: vehicle.nbPlacesDebout,
      nb_couchettes: vehicle.nbCouchettes,
      nb_portes: vehicle.nbPortes,
      metre_plancher: vehicle.metrePlancher,
      pal_vehicule: vehicle.palVehicule,

      // Energy
      energie_vehicule: vehicle.energieVehicule,
      energie: WincplXmlParserService.mapEnergyCode(vehicle.energieVehicule), // Populate legacy field
      contenance_reservoir: vehicle.contenanceReservoir,
      capacite_reservoir: vehicle.contenanceReservoir, // Also populate legacy field
      contenance_reservoir_aux: vehicle.contenanceReservoirAux,
      conso_utac: vehicle.consoUtac,
      conso_urbaine: vehicle.consoUrbaine,
      conso_extra_urbaine: vehicle.consoExtraUrbaine,
      conso_mixte: vehicle.consoMixte,

      // Pollution
      co2: vehicle.co2,
      co2_urbain: vehicle.co2Urbain,
      co2_extra_urbain: vehicle.co2ExtraUrbain,
      emission_co2: vehicle.emissionCo2,
      profil_co2: vehicle.profilCo2,
      norme_pollution: vehicle.normePollution,
      critair: vehicle.critair,
      filtre_a_particules: vehicle.filtreAParticules,
      adblue_flag: vehicle.adblue,
      decibels_vehicule: vehicle.decibelsVehicule,
      regime_decibels: vehicle.regimeDecibels,

      // Oil
      contenance_huile: vehicle.contenanceHuile,
      contenance_huile_aux: vehicle.contenanceHuileAux,
      contenance_huile_boite: vehicle.contenanceHuileBoite,

      // Dates & KM
      date_achat: WincplXmlParserService.formatWincplDate(vehicle.dateAchat),
      km_achat: vehicle.kmAchat,
      date_sortie: WincplXmlParserService.formatWincplDate(vehicle.dateSortie),
      km_sortie: vehicle.kmSortie,
      date_mise_circulation: WincplXmlParserService.formatWincplDate(vehicle.dateMiseCirculation),
      date_carte_grise: WincplXmlParserService.formatWincplDate(vehicle.dateCarteGrise),
      date_cg: WincplXmlParserService.formatWincplDate(vehicle.dateCg),
      date_fin_garantie_vehicule: WincplXmlParserService.formatWincplDate(vehicle.dateFinGarantieVehicule),
      km_fin_garantie_vehicule: vehicle.kmFinGarantieVehicule,
      date_fin_garantie_moteur: WincplXmlParserService.formatWincplDate(vehicle.dateFinGarantieMoteur),
      km_fin_garantie_moteur: vehicle.kmFinGarantieMoteur,
      date_entree_groupe: WincplXmlParserService.formatWincplDate(vehicle.dateEntreeGroupe),
      km_entree_groupe: vehicle.kmEntreeGroupe,
      km_compteur: vehicle.kmCompteur,
      kilometrage: vehicle.kmCompteur, // Also populate legacy field
      immatriculation_precedente: vehicle.immatriculationPrecedente,

      // Insurance
      code_assureur: vehicle.codeAssureur,
      assurance_num_contrat: vehicle.assuranceNumContrat,
      assurance_date_echeance: WincplXmlParserService.formatWincplDate(vehicle.assuranceDateEcheance),
      assurance_montant: vehicle.assuranceMontant,
      assurance_franchise: vehicle.assuranceFranchise,
      assurance_devise: vehicle.assuranceDevise,

      // Transport
      type_transport: vehicle.typeTransport,
      sous_genre_vehicule: vehicle.sousGenreVehicule,
      nb_cuves: vehicle.nbCuves,
      code_type_semi: vehicle.codeTypeSemi,
      porteur: vehicle.porteur,
      contraintes: vehicle.contraintes,

      // Sale / Visibility
      en_vente: vehicle.enVente,
      vendu: vehicle.vendu,
      visible_transport: vehicle.visibleTransport,
      visible_garage: vehicle.visibleGarage,

      // Other
      commentaire: vehicle.commentaire,
      tel_vehicule: vehicle.telVehicule,
      licence: vehicle.licence,

      // Raw data
      wincpl_raw_data: vehicle,

      // Timestamps
      synced_at: now,
      updated_at: now,
    };

    // Check if vehicle already exists by wincpl_code
    const existing = await this.findByWincplCode(vehicle.codeVehicule);

    if (existing) {
      const { error } = await this.supabase
        .from('vehicle_cache')
        .update(wincplData)
        .eq('wincpl_code', vehicle.codeVehicule);

      if (error) {
        this.logger.error(`Erreur mise à jour véhicule Wincpl ${vehicle.codeVehicule}`, error);
        throw new BadRequestException(error.message);
      }

      return { created: false, updated: true };
    } else {
      const { error } = await this.supabase.from('vehicle_cache').insert({
        ...wincplData,
        status: 'disponible',
        semi_compatibles: [],
        equipements: [],
        absences: [],
        created_at: now,
      });

      if (error) {
        this.logger.error(`Erreur création véhicule Wincpl ${vehicle.codeVehicule}`, error);
        throw new BadRequestException(error.message);
      }

      return { created: true, updated: false };
    }
  }

  /**
   * Upsert absence data for a vehicle (by Wincpl CODE_VEHICULE)
   */
  async upsertAbsence(absence: WincplAbsence): Promise<boolean> {
    // Find the vehicle by its code
    const { data: vehicle, error: findError } = await this.supabase
      .from('vehicle_cache')
      .select('id, absences')
      .eq('wincpl_code', absence.codeLien)
      .single();

    if (findError || !vehicle) {
      this.logger.warn(
        `Véhicule Wincpl ${absence.codeLien} non trouvé pour l'absence`,
      );
      return false;
    }

    // Add/update absence in the array
    const existingAbsences: any[] = vehicle.absences || [];
    const absenceEntry = {
      dateDebut: WincplXmlParserService.formatWincplDate(absence.dateDebut),
      heureDebut: absence.heureDebut,
      dateFin: WincplXmlParserService.formatWincplDate(absence.dateFin),
      heureFin: absence.heureFin,
      codeMotif: absence.codeMotif,
      numero: absence.numero,
      status: absence.status,
    };

    // Replace existing absence with same numero or add new one
    const idx = existingAbsences.findIndex(
      (a: any) => a.numero === absence.numero,
    );
    if (idx >= 0) {
      existingAbsences[idx] = absenceEntry;
    } else {
      existingAbsences.push(absenceEntry);
    }

    const { error } = await this.supabase
      .from('vehicle_cache')
      .update({
        absences: existingAbsences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicle.id);

    if (error) {
      this.logger.error(
        `Erreur mise à jour absences pour ${absence.codeLien}`,
        error,
      );
      return false;
    }

    return true;
  }

  /**
   * Get count of vehicles in cache
   */
  async getCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('vehicle_cache')
      .select('*', { count: 'exact', head: true });

    if (error) {
      this.logger.error('Erreur lors du comptage des véhicules', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Helper: Map MyRentACar energy label to Wincpl energy code
   */
  private mapMyRentCarEnergyToWincpl(energie?: string): string | undefined {
    if (!energie) return undefined;
    const lower = energie.toLowerCase();
    if (lower.includes('gasoil') || lower.includes('diesel') || lower.includes('gazole')) return 'GO';
    if (lower.includes('gaz') && !lower.includes('gasoil')) return 'GZ';
    if (lower.includes('essence')) return 'ES';
    if (lower.includes('electri') || lower.includes('électri')) return 'EL';
    if (lower.includes('hybri')) return 'HY';
    if (lower.includes('gpl')) return 'GP';
    if (lower.includes('gnv') || lower.includes('gnc')) return 'GN';
    return undefined;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import {
  WincplVehicle,
  WincplAbsence,
  WincplKmReading,
  WincplParseResult,
} from '../types/wincpl.types';

@Injectable()
export class WincplXmlParserService {
  private readonly logger = new Logger(WincplXmlParserService.name);
  private readonly parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      parseAttributeValue: true,
      trimValues: true,
    });
  }

  /**
   * Parse one or more Wincpl XML strings.
   * Each string = content of one XML file.
   */
  parseMultiple(xmlContents: string[]): WincplParseResult {
    const result: WincplParseResult = {
      type: 'UNKNOWN',
      vehicles: [],
      absences: [],
      errors: [],
    };

    for (const xml of xmlContents) {
      try {
        const parsed = this.parseSingle(xml);
        result.vehicles.push(...parsed.vehicles);
        result.absences.push(...parsed.absences);
        if (parsed.type !== 'UNKNOWN') result.type = parsed.type;
        result.errors.push(...parsed.errors);
      } catch (err: any) {
        result.errors.push(`Parse error: ${err.message || err}`);
      }
    }

    return result;
  }

  /**
   * Parse a single Wincpl XML string
   */
  parseSingle(xmlContent: string): WincplParseResult {
    const result: WincplParseResult = {
      type: 'UNKNOWN',
      vehicles: [],
      absences: [],
      errors: [],
    };

    try {
      const parsed = this.parser.parse(xmlContent);
      const item = parsed?.ITEM;

      if (!item) {
        result.errors.push('No <ITEM> root element found');
        return result;
      }

      const type = item['@_Type'] as string;
      const action = item['@_Action'] as string;
      const date = String(item['@_Date'] || '');
      const heure = String(item['@_Heure'] || '');

      if (type === 'VEHICULE') {
        result.type = 'VEHICULE';
        const vehicle = this.parseVehicle(item, action, date, heure);
        result.vehicles.push(vehicle);
      } else if (type === 'ABSENCE') {
        result.type = 'ABSENCE';
        const absence = this.parseAbsence(item, action, date, heure);
        result.absences.push(absence);
      } else {
        result.errors.push(`Unknown ITEM Type: ${type}`);
      }
    } catch (err: any) {
      result.errors.push(`XML parse error: ${err.message || err}`);
    }

    return result;
  }

  // ── Private helpers ──

  private parseVehicle(
    item: any,
    action: string,
    date: string,
    heure: string,
  ): WincplVehicle {
    const str = (key: string): string | undefined => {
      const v = item[key];
      if (v === undefined || v === null || v === '') return undefined;
      return String(v);
    };

    const num = (key: string): number | undefined => {
      const v = item[key];
      if (v === undefined || v === null || v === '') return undefined;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    };

    const bool = (key: string): boolean | undefined => {
      const v = item[key];
      if (v === undefined || v === null || v === '') return undefined;
      return v === 1 || v === '1' || v === true;
    };

    // Parse nested KM readings
    const kmReadings: WincplKmReading[] = [];
    const kmSection = item['VEHICULE_KM'];
    if (kmSection) {
      const kmEntries = Array.isArray(kmSection.KM)
        ? kmSection.KM
        : kmSection.KM
          ? [kmSection.KM]
          : [];
      for (const km of kmEntries) {
        if (km.DATE && km.KM !== undefined) {
          kmReadings.push({
            date: String(km.DATE),
            km: Number(km.KM),
          });
        }
      }
    }

    return {
      _action: action,
      _date: date,
      _heure: heure,

      // Core
      idSociete: num('IDSOCIETE'),
      idAgence: num('IDAGENCE'),
      codeVehicule: str('CODE_VEHICULE') || '',
      immatriculation: str('IMMATRICULATION') || '',
      categorieVehicule: str('CATEGORIE_VEHICULE'),
      typeVehicule: num('TYPE_VEHICULE'),
      marqueVehicule: str('MARQUE_VEHICULE'),
      enActivite: bool('EN_ACTIVITE'),
      interne: str('INTERNE'),

      // Serial / Chassis
      numeroSerie: str('NUMERO_SERIE'),
      numeroMoteur: str('NUMERO_MOTEUR'),
      numeroChassis: str('NUMERO_CHASSIS'),
      numeroChassisAux: str('NUMERO_CHASSIS_AUX'),

      // Engine / Power
      puissanceVehicule: num('PUISSANCE_VEHICULE'),
      puissanceKw: num('PUISSANCE_KW'),
      cylindree: num('CYLINDREE'),
      nbCylindres: num('NB_CYLINDRES'),
      nbSoupapes: num('NB_SOUPAPES'),
      nbVitesses: num('NB_VITESSES'),
      codeMoteur: str('CODE_MOTEUR'),
      typeTransmission: str('TYPE_TRANSMISSION'),
      typeInjection: str('TYPE_INJECTION'),
      turboCompresseur: bool('TURBO_COMPR'),
      propulsion: str('PROPULSION'),
      vitesseMoteur: num('VITESSE_MOTEUR'),

      // Dimensions
      longueurTotale: num('LONGUEUR_TOTALE'),
      largeurTotale: num('LARGEUR_TOTALE'),
      hauteurTotale: num('HAUTEUR_TOTALE'),
      volumeVehicule: num('VOLUME_VEHICULE'),
      volumeMaxi: num('VOLUME_MAXI'),

      // Weight
      poidsAVide: num('POIDS_A_VIDE'),
      chargeUtile: num('CHARGE_UTILE'),
      poidsEnCharge: num('POIDS_EN_CHARGE'),
      poidsTotalRoulant: num('POIDS_TOTAL_ROULANT'),
      poidsMaxiMarchandises: num('POIDS_MAXI_MARCHANDISES'),
      ptac: num('PTAC'),
      ptr: num('PTR'),
      nbEssieux: num('NB_ESSIEUX'),
      poidsMoyenEssieu: num('POIDS_MOYEN_ESSIEU'),

      // Body
      typeCarrosserie: str('TYPE_CARROSSERIE'),
      typeCarrosserie2: str('TYPE_CARROSSERIE_2'),
      genreCarrosserie: str('GENRE_CARROSSERIE'),
      carrosserieCg: str('CARROSSERIE_CG'),
      genreCg: str('GENRE_CG'),
      typeCarteGrise: str('TYPE_CARTE_GRISE'),

      // Seats
      nbPlacesAssises: num('NB_PLACES_ASSISES'),
      nbPlacesDebout: num('NB_PLACES_DEBOUT'),
      nbCouchettes: num('NB_COUCHETTES'),
      nbPortes: num('NB_PORTES'),
      metrePlancher: num('METRE_PLANCHER'),
      palVehicule: num('PAL_VEHICULE'),

      // Energy
      energieVehicule: str('ENERGIE_VEHICULE'),
      contenanceReservoir: num('CONT_RES'),
      contenanceReservoirAux: num('CONT_RES_AUX'),
      consoUtac: num('CONSO_UTAC'),
      consoUrbaine: num('CONSO_URBAINE'),
      consoExtraUrbaine: num('CONSO_EXTRAURBAINE'),
      consoMixte: num('CONSO_MIXTE'),

      // Pollution
      co2: num('CO2'),
      co2Urbain: num('CO2_URBAIN'),
      co2ExtraUrbain: num('CO2_EXTRAURBAIN'),
      emissionCo2: num('EMISSION_CO2'),
      profilCo2: str('PROFIL_CO2'),
      normePollution: str('NORME_POLLUTION'),
      critair: num('CRITAIR'),
      filtreAParticules: bool('FILTRE_A_PARTICULES'),
      adblue: bool('ADBLUE'),
      decibelsVehicule: num('DECIBELS_VEHICULE'),
      regimeDecibels: num('REGIME_DECIBELS'),

      // Oil
      contenanceHuile: num('CONT_HUILE'),
      contenanceHuileAux: num('CONT_HUILE_AUX'),
      contenanceHuileBoite: num('CONT_HUILE_BOITE'),

      // Dates & KM
      dateAchat: str('DATE_ACHAT'),
      kmAchat: num('KM_ACHAT'),
      dateSortie: str('DATE_SORTIE'),
      kmSortie: num('KM_SORTIE'),
      dateMiseCirculation: str('DATE_MISE_CIRCUL'),
      dateCarteGrise: str('DATE_CARTEGRISE'),
      dateCg: str('DATE_CG'),
      dateFinGarantieVehicule: str('DATE_FIN_GARANTIE_VEH'),
      kmFinGarantieVehicule: num('KM_FIN_GARANTIE_VEH'),
      dateFinGarantieMoteur: str('DATE_FIN_GARANTIE_MOT'),
      kmFinGarantieMoteur: num('KM_FIN_GARANTIE_MOT'),
      dateEntreeGroupe: str('DATE_ENTREE_GROUPE'),
      kmEntreeGroupe: num('KM_ENTREE_GROUPE'),
      kmCompteur: num('KM_COMPTEUR'),
      immatriculationPrecedente: str('IMMATRICUL_PRECEDENTE'),

      // Insurance
      codeAssureur: str('CODE_ASSUREUR'),
      assuranceNumContrat: str('ASSUR_NUM_CONTRAT'),
      assuranceDateEcheance: str('ASSUR_DATE_ECHEANCE'),
      assuranceMontant: num('ASSUR_MONTANT_ASSURANCE'),
      assuranceFranchise: num('ASSUR_MONTANT_FRANCHISE'),
      assuranceDevise: str('ASSUR_CODE_DEVISE'),

      // Transport
      typeTransport: str('TYPE_TRANSPORT'),
      sousGenreVehicule: str('SOUSGENRE_VEHICULE'),
      vitesseCommercialeMoyenne: num('VITESSE_CIALE_MOYENNE'),
      nbCuves: num('NB_CUVES'),
      codeTypeSemi: str('CODE_TYPE_SEMI'),
      contraintes: str('CONTRAINTES'),
      porteur: str('PORTEUR'),
      listeUsages: str('LISTE_USAGES'),

      // Sale
      enVente: bool('EN_VENTE'),
      vendu: bool('VENDU'),

      // Visibility
      visibleTransport: bool('VISIBLE_TRANSP'),
      visibleGarage: bool('VISIBLE_GARAGE'),

      // CG
      typeVinCg: str('TYPE_VIN_CG'),
      versionCg: str('VERSION_CG'),
      mentionsCg: str('MENTIONS_CG'),
      licence: str('LICENCE'),
      nSerie: str('N_SERIE'),

      // Integration
      codeIe: str('CODE_IE'),
      libelleIe: str('LIBELLE_IE'),
      codeIe2: str('CODE_IE2'),
      libelleIe2: str('LIBELLE_IE2'),
      codeEliotime: str('CODE_ELIOTIME'),
      envoiMission: str('ENVOI_MISSION'),

      // Other
      telVehicule: str('TEL_VEHICULE'),
      compteAnalytique: str('COMPTE_ANALYTIQUE'),
      siteWebConstructeur: str('SITE_WEB_CONSTRUCTEUR'),
      commentaire: str('COMMENTAIRE'),

      // KM readings
      kmReadings,
    };
  }

  private parseAbsence(
    item: any,
    action: string,
    date: string,
    heure: string,
  ): WincplAbsence {
    return {
      _action: action,
      _date: date,
      _heure: heure,
      idSociete: item['IDSOCIETE'] ? Number(item['IDSOCIETE']) : undefined,
      idAgence: item['IDAGENCE'] ? Number(item['IDAGENCE']) : undefined,
      typeLien: String(item['TYPE_LIEN'] || ''),
      codeLien: String(item['CODE_LIEN'] || ''),
      dateDebut: String(item['DATE_DEBUT'] || ''),
      heureDebut: item['HEURE_DEBUT'] ? String(item['HEURE_DEBUT']) : undefined,
      dateFin: String(item['DATE_FIN'] || ''),
      heureFin: item['HEURE_FIN'] ? String(item['HEURE_FIN']) : undefined,
      codeMotif: String(item['CODE_MOTIF'] || ''),
      typeNumero: item['TYPENUMERO'] ? String(item['TYPENUMERO']) : undefined,
      numero: item['NUMERO'] ? String(item['NUMERO']) : undefined,
      status: item['STATUS'] !== undefined ? Number(item['STATUS']) : undefined,
      texteAffiche: item['TEXTE_AFFICHE'] ? String(item['TEXTE_AFFICHE']) : undefined,
    };
  }

  /**
   * Convert YYYYMMDD string to ISO date (YYYY-MM-DD)
   */
  static formatWincplDate(wincplDate?: string): string | undefined {
    if (!wincplDate || wincplDate.length < 8) return undefined;
    const d = wincplDate.replace(/\D/g, '');
    if (d.length < 8) return undefined;
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }

  /**
   * Map Wincpl energy code to a display label
   */
  static mapEnergyCode(code?: string): string | undefined {
    if (!code) return undefined;
    const map: Record<string, string> = {
      GO: 'Gasoil',
      GZ: 'Gaz',
      ES: 'Essence',
      EL: 'Électrique',
      HY: 'Hybride',
      GP: 'GPL',
      GN: 'GNV',
    };
    return map[code.toUpperCase()] || code;
  }
}

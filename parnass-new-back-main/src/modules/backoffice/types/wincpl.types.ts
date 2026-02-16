// ============================================
// Wincpl XML Data Types
// Canonical vehicle schema — all other sources (MyRentACar, etc.)
// are mapped to these fields.
// ============================================

/**
 * Parsed VEHICULE XML item from Wincpl
 * Covers all fields from <ITEM Type="VEHICULE">
 */
export interface WincplVehicle {
  // ── XML metadata ──
  _version?: string;       // Version="1"
  _action?: string;        // Action="C" (create/update)
  _date?: string;          // Date="20260211"
  _heure?: string;         // Heure="14331748"

  // ── Core identification ──
  idSociete?: number;             // IDSOCIETE
  idAgence?: number;              // IDAGENCE
  codeVehicule: string;           // CODE_VEHICULE (unique key)
  immatriculation: string;        // IMMATRICULATION
  categorieVehicule?: string;     // CATEGORIE_VEHICULE (MOT, PL, etc.)
  typeVehicule?: number;          // TYPE_VEHICULE (-1 = default)
  marqueVehicule?: string;        // MARQUE_VEHICULE
  enActivite?: boolean;           // EN_ACTIVITE (1/0)
  interne?: string;               // INTERNE

  // ── Serial / Chassis ──
  numeroSerie?: string;           // NUMERO_SERIE
  numeroMoteur?: string;          // NUMERO_MOTEUR
  numeroChassis?: string;         // NUMERO_CHASSIS
  numeroChassisAux?: string;      // NUMERO_CHASSIS_AUX

  // ── Engine / Power ──
  puissanceVehicule?: number;     // PUISSANCE_VEHICULE (CV)
  puissanceKw?: number;           // PUISSANCE_KW
  cylindree?: number;             // CYLINDREE (cc)
  nbCylindres?: number;           // NB_CYLINDRES
  nbSoupapes?: number;            // NB_SOUPAPES
  nbVitesses?: number;            // NB_VITESSES
  codeMoteur?: string;            // CODE_MOTEUR
  typeTransmission?: string;      // TYPE_TRANSMISSION
  typeInjection?: string;         // TYPE_INJECTION
  turboCompresseur?: boolean;     // TURBO_COMPR (1/0)
  propulsion?: string;            // PROPULSION
  vitesseMoteur?: number;         // VITESSE_MOTEUR

  // ── Dimensions ──
  longueurTotale?: number;        // LONGUEUR_TOTALE
  largeurTotale?: number;         // LARGEUR_TOTALE
  hauteurTotale?: number;         // HAUTEUR_TOTALE
  volumeVehicule?: number;        // VOLUME_VEHICULE
  volumeMaxi?: number;            // VOLUME_MAXI

  // ── Weight ──
  poidsAVide?: number;            // POIDS_A_VIDE
  chargeUtile?: number;           // CHARGE_UTILE
  poidsEnCharge?: number;         // POIDS_EN_CHARGE
  poidsTotalRoulant?: number;     // POIDS_TOTAL_ROULANT
  poidsMaxiMarchandises?: number; // POIDS_MAXI_MARCHANDISES
  ptac?: number;                  // PTAC
  ptr?: number;                   // PTR
  nbEssieux?: number;             // NB_ESSIEUX
  poidsMoyenEssieu?: number;      // POIDS_MOYEN_ESSIEU

  // ── Body / Carrosserie ──
  typeCarrosserie?: string;       // TYPE_CARROSSERIE (BREAK, etc.)
  typeCarrosserie2?: string;      // TYPE_CARROSSERIE_2 (TOUT-TERRAIN, etc.)
  genreCarrosserie?: string;      // GENRE_CARROSSERIE (VP, etc.)
  carrosserieCg?: string;         // CARROSSERIE_CG
  genreCg?: string;               // GENRE_CG
  typeCarteGrise?: string;        // TYPE_CARTE_GRISE

  // ── Seats / Capacity ──
  nbPlacesAssises?: number;       // NB_PLACES_ASSISES
  nbPlacesDebout?: number;        // NB_PLACES_DEBOUT
  nbCouchettes?: number;          // NB_COUCHETTES
  nbPortes?: number;              // NB_PORTES
  metrePlancher?: number;         // METRE_PLANCHER
  palVehicule?: number;           // PAL_VEHICULE (pallets)

  // ── Energy / Fuel ──
  energieVehicule?: string;       // ENERGIE_VEHICULE (GO, GZ, EL, etc.)
  contenanceReservoir?: number;   // CONT_RES
  contenanceReservoirAux?: number;// CONT_RES_AUX
  consoUtac?: number;             // CONSO_UTAC
  consoUrbaine?: number;          // CONSO_URBAINE
  consoExtraUrbaine?: number;     // CONSO_EXTRAURBAINE
  consoMixte?: number;            // CONSO_MIXTE

  // ── Pollution / Environment ──
  co2?: number;                   // CO2
  co2Urbain?: number;             // CO2_URBAIN
  co2ExtraUrbain?: number;        // CO2_EXTRAURBAIN
  emissionCo2?: number;           // EMISSION_CO2
  profilCo2?: string;             // PROFIL_CO2
  normePollution?: string;        // NORME_POLLUTION (EURO6, etc.)
  critair?: number;               // CRITAIR (1-5)
  filtreAParticules?: boolean;    // FILTRE_A_PARTICULES
  adblue?: boolean;               // ADBLUE
  decibelsVehicule?: number;      // DECIBELS_VEHICULE
  regimeDecibels?: number;        // REGIME_DECIBELS

  // ── Oil / Fluid capacities ──
  contenanceHuile?: number;       // CONT_HUILE
  contenanceHuileAux?: number;    // CONT_HUILE_AUX
  contenanceHuileBoite?: number;  // CONT_HUILE_BOITE

  // ── Dates & Kilometers ──
  dateAchat?: string;             // DATE_ACHAT
  kmAchat?: number;               // KM_ACHAT
  dateSortie?: string;            // DATE_SORTIE
  kmSortie?: number;              // KM_SORTIE
  dateMiseCirculation?: string;   // DATE_MISE_CIRCUL
  dateCarteGrise?: string;        // DATE_CARTEGRISE
  dateCg?: string;                // DATE_CG
  dateFinGarantieVehicule?: string;  // DATE_FIN_GARANTIE_VEH
  kmFinGarantieVehicule?: number; // KM_FIN_GARANTIE_VEH
  dateFinGarantieMoteur?: string; // DATE_FIN_GARANTIE_MOT
  kmFinGarantieMoteur?: number;   // KM_FIN_GARANTIE_MOT
  dateEntreeGroupe?: string;      // DATE_ENTREE_GROUPE
  kmEntreeGroupe?: number;        // KM_ENTREE_GROUPE
  kmCompteur?: number;            // KM_COMPTEUR
  immatriculationPrecedente?: string; // IMMATRICUL_PRECEDENTE

  // ── Insurance ──
  codeAssureur?: string;          // CODE_ASSUREUR
  assuranceNumContrat?: string;   // ASSUR_NUM_CONTRAT
  assuranceDateEcheance?: string; // ASSUR_DATE_ECHEANCE
  assuranceMontant?: number;      // ASSUR_MONTANT_ASSURANCE
  assuranceFranchise?: number;    // ASSUR_MONTANT_FRANCHISE
  assuranceDevise?: string;       // ASSUR_CODE_DEVISE

  // ── Transport / Usage ──
  typeTransport?: string;         // TYPE_TRANSPORT
  sousGenreVehicule?: string;     // SOUSGENRE_VEHICULE
  vitesseCommercialeMoyenne?: number; // VITESSE_CIALE_MOYENNE
  nbCuves?: number;               // NB_CUVES
  codeTypeSemi?: string;          // CODE_TYPE_SEMI
  contraintes?: string;           // CONTRAINTES
  porteur?: string;               // PORTEUR
  listeUsages?: string;           // LISTE_USAGES

  // ── Sale status ──
  enVente?: boolean;              // EN_VENTE
  vendu?: boolean;                // VENDU

  // ── Visibility ──
  visibleTransport?: boolean;     // VISIBLE_TRANSP
  visibleGarage?: boolean;        // VISIBLE_GARAGE

  // ── Registration (CG) ──
  typeVinCg?: string;             // TYPE_VIN_CG
  versionCg?: string;             // VERSION_CG
  mentionsCg?: string;            // MENTIONS_CG
  licence?: string;               // LICENCE
  nSerie?: string;                // N_SERIE

  // ── Integration codes ──
  codeIe?: string;                // CODE_IE
  libelleIe?: string;             // LIBELLE_IE
  codeIe2?: string;               // CODE_IE2
  libelleIe2?: string;            // LIBELLE_IE2
  codeEliotime?: string;          // CODE_ELIOTIME
  envoiMission?: string;          // ENVOI_MISSION

  // ── Other ──
  telVehicule?: string;           // TEL_VEHICULE
  compteAnalytique?: string;      // COMPTE_ANALYTIQUE
  siteWebConstructeur?: string;   // SITE_WEB_CONSTRUCTEUR
  commentaire?: string;           // COMMENTAIRE

  // ── KM readings (nested) ──
  kmReadings?: WincplKmReading[];
}

export interface WincplKmReading {
  date: string;   // YYYYMMDD
  km: number;
}

/**
 * Parsed ABSENCE XML item from Wincpl
 * Vehicle unavailability periods (maintenance, inspection, etc.)
 */
export interface WincplAbsence {
  // ── XML metadata ──
  _version?: string;
  _action?: string;
  _date?: string;
  _heure?: string;

  // ── Identification ──
  idSociete?: number;           // IDSOCIETE
  idAgence?: number;            // IDAGENCE
  typeLien: string;             // TYPE_LIEN (V = vehicle)
  codeLien: string;             // CODE_LIEN (links to CODE_VEHICULE)

  // ── Period ──
  dateDebut: string;            // DATE_DEBUT (YYYYMMDD)
  heureDebut?: string;          // HEURE_DEBUT (HHMM)
  dateFin: string;              // DATE_FIN (YYYYMMDD)
  heureFin?: string;            // HEURE_FIN (HHMM)

  // ── Reason ──
  codeMotif: string;            // CODE_MOTIF (EXAMEN, MAINTENANCE, etc.)
  typeNumero?: string;          // TYPENUMERO (OR, etc.)
  numero?: string;              // NUMERO (reference)
  status?: number;              // STATUS (9 = confirmed, etc.)
  texteAffiche?: string;        // TEXTE_AFFICHE
}

/**
 * Result of parsing a Wincpl XML file
 */
export interface WincplParseResult {
  type: 'VEHICULE' | 'ABSENCE' | 'UNKNOWN';
  vehicles: WincplVehicle[];
  absences: WincplAbsence[];
  errors: string[];
}

/**
 * Import result returned by the import endpoint
 */
export interface WincplImportResult {
  filesProcessed: number;
  vehiclesImported: number;
  vehiclesUpdated: number;
  absencesImported: number;
  errors: string[];
}

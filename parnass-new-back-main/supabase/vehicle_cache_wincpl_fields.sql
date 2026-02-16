-- ============================================
-- Migration: Add Wincpl fields to vehicle_cache
-- Wincpl becomes the canonical vehicle schema.
-- Existing MyRentACar fields are kept for backward compatibility.
-- ============================================

-- ── Data source tracking ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'myrentcar';
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS wincpl_code TEXT;

-- ── Core identification (Wincpl-specific) ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS id_societe INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS id_agence INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS categorie_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_vehicule_code INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS marque_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS en_activite BOOLEAN DEFAULT true;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS interne TEXT;

-- ── Serial / Chassis ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS numero_chassis TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS numero_moteur TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS numero_chassis_aux TEXT;

-- ── Engine / Power ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS puissance_vehicule NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS puissance_kw NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS cylindree NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_cylindres INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_soupapes INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_vitesses INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS code_moteur TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_transmission TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_injection TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS turbo_compresseur BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS propulsion TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS vitesse_moteur NUMERIC;

-- ── Dimensions ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS longueur_totale NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS largeur_totale NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS hauteur_totale NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS volume_vehicule NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS volume_maxi NUMERIC;

-- ── Weight (Wincpl-specific — complement existing poids_vide/poids_charge) ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS charge_utile NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS poids_total_roulant NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS poids_maxi_marchandises NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS ptac NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS ptr NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_essieux INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS poids_moyen_essieu NUMERIC;

-- ── Body / Carrosserie ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_carrosserie TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_carrosserie_2 TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS genre_carrosserie TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS carrosserie_cg TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS genre_cg TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_carte_grise TEXT;

-- ── Seats / Capacity ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_places_assises INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_places_debout INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_couchettes INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_portes INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS metre_plancher NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS pal_vehicule INTEGER;

-- ── Energy / Fuel (Wincpl-specific — complement existing energie/capacite_reservoir) ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS energie_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contenance_reservoir NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contenance_reservoir_aux NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS conso_utac NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS conso_urbaine NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS conso_extra_urbaine NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS conso_mixte NUMERIC;

-- ── Pollution / Environment ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS co2 NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS co2_urbain NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS co2_extra_urbain NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS emission_co2 NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS profil_co2 TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS norme_pollution TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS critair INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS filtre_a_particules BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS adblue_flag BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS decibels_vehicule NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS regime_decibels NUMERIC;

-- ── Oil / Fluid capacities ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contenance_huile NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contenance_huile_aux NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contenance_huile_boite NUMERIC;

-- ── Dates & KM (Wincpl-specific — complement existing date_mise_circulation/kilometrage) ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_achat TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_achat NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_sortie TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_sortie NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_carte_grise TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_cg TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_fin_garantie_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_fin_garantie_vehicule NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_fin_garantie_moteur TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_fin_garantie_moteur NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS date_entree_groupe TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_entree_groupe NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS km_compteur NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS immatriculation_precedente TEXT;

-- ── Insurance ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS code_assureur TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS assurance_num_contrat TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS assurance_date_echeance TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS assurance_montant NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS assurance_franchise NUMERIC;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS assurance_devise TEXT;

-- ── Transport / Usage ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS type_transport TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS sous_genre_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS nb_cuves INTEGER;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS code_type_semi TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS porteur TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS contraintes TEXT;

-- ── Sale / Visibility ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS en_vente BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS vendu BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS visible_transport BOOLEAN;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS visible_garage BOOLEAN;

-- ── Other ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS commentaire TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS tel_vehicule TEXT;
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS licence TEXT;

-- ── Full raw Wincpl data (JSONB for any field not in columns) ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS wincpl_raw_data JSONB;

-- ── Vehicle absence periods ──
ALTER TABLE vehicle_cache ADD COLUMN IF NOT EXISTS absences JSONB DEFAULT '[]'::jsonb;

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_wincpl_code ON vehicle_cache(wincpl_code) WHERE wincpl_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_data_source ON vehicle_cache(data_source);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_en_activite ON vehicle_cache(en_activite);
CREATE INDEX IF NOT EXISTS idx_vehicle_cache_categorie ON vehicle_cache(categorie_vehicule) WHERE categorie_vehicule IS NOT NULL;

-- Make myrentcar_id nullable (Wincpl vehicles won't have one)
ALTER TABLE vehicle_cache ALTER COLUMN myrentcar_id DROP NOT NULL;

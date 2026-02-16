-- ============================================
-- Driver Cache: Add Missing Factorial Custom Fields
-- Adds columns for AS24 cards, permits/habilitations dates,
-- lieu de prise de poste, and additional employee standard fields
-- ============================================

-- AS24 card fields (from Factorial custom fields)
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS numero_carte_as24 TEXT;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS date_remise_carte_as24 DATE;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS date_restitution_as24 DATE;

-- Permits / Habilitations / Medical dates (from Factorial custom fields)
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS permis_de_conduire DATE;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS fco DATE;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS adr DATE;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS habilitation TEXT;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS formation_11239_11262 DATE;

-- Poste / Organisation (from Factorial custom fields)
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS lieu_prise_poste TEXT;

-- Preferences (from Factorial custom fields - forfait_weekend replaces simple available_weekends)
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS forfait_weekend TEXT;

-- Additional standard employee fields from Factorial
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS login_email TEXT;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE driver_cache ADD COLUMN IF NOT EXISTS state TEXT;

-- Comments on new columns
COMMENT ON COLUMN driver_cache.numero_carte_as24 IS 'Numéro de carte AS24 (custom field Factorial)';
COMMENT ON COLUMN driver_cache.date_remise_carte_as24 IS 'Date de remise de la carte AS24 (custom field Factorial)';
COMMENT ON COLUMN driver_cache.date_restitution_as24 IS 'Date de restitution de la carte AS24 (custom field Factorial)';
COMMENT ON COLUMN driver_cache.permis_de_conduire IS 'Date expiration permis de conduire (custom field Factorial)';
COMMENT ON COLUMN driver_cache.fco IS 'Date expiration FCO (custom field Factorial)';
COMMENT ON COLUMN driver_cache.adr IS 'Date expiration ADR (custom field Factorial)';
COMMENT ON COLUMN driver_cache.habilitation IS 'Habilitation texte (custom field Factorial)';
COMMENT ON COLUMN driver_cache.formation_11239_11262 IS 'Date formation 11.2.3.9 et 11.2.6.2 (custom field Factorial)';
COMMENT ON COLUMN driver_cache.lieu_prise_poste IS 'Lieu de prise de poste (custom field Factorial)';
COMMENT ON COLUMN driver_cache.forfait_weekend IS 'Forfait week-end (custom field Factorial single_choice)';
COMMENT ON COLUMN driver_cache.login_email IS 'Email de connexion Factorial (standard employee field)';
COMMENT ON COLUMN driver_cache.address_line_2 IS 'Complément adresse (standard employee field)';
COMMENT ON COLUMN driver_cache.state IS 'Région / État (standard employee field)';

-- Note: visite_medicale column already exists — it transitions from manual to API-synced.
-- No schema change needed for visite_medicale, only sync logic changes.

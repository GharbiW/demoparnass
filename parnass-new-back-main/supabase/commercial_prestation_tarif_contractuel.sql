-- MCom-25: Tarification - Ajout des quantités contractuelles
-- Adds contractual billing fields for TK (km) and hourly rate (hours) tariff types

-- Contractual km for TK tariff type
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS tarif_km_contractuel DECIMAL(10, 2);
COMMENT ON COLUMN prestation.tarif_km_contractuel IS 'Contractual km amount for TK billing';

-- Contractual hours for hourly rate tariff type
ALTER TABLE prestation ADD COLUMN IF NOT EXISTS tarif_heures_contractuel DECIMAL(10, 2);
COMMENT ON COLUMN prestation.tarif_heures_contractuel IS 'Contractual hours amount for hourly rate billing';

-- Same for templates
ALTER TABLE prestation_template ADD COLUMN IF NOT EXISTS tarif_km_contractuel DECIMAL(10, 2);
COMMENT ON COLUMN prestation_template.tarif_km_contractuel IS 'Contractual km amount for TK billing';

ALTER TABLE prestation_template ADD COLUMN IF NOT EXISTS tarif_heures_contractuel DECIMAL(10, 2);
COMMENT ON COLUMN prestation_template.tarif_heures_contractuel IS 'Contractual hours amount for hourly rate billing';

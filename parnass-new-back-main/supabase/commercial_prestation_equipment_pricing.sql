-- Migration: Add equipment specificities and tariff type to prestation table
-- MCom-0013: Equipment specificities (multi-select)
-- MCom-0015: Pricing types (Forfaitaire, TK, Taux horaire)

-- Add new columns to prestation table
ALTER TABLE IF EXISTS prestation
ADD COLUMN IF NOT EXISTS specificites TEXT[],
ADD COLUMN IF NOT EXISTS type_tarif VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN prestation.specificites IS 'Equipment specificities - multi-select array (e.g., hayon_electrique, double_plancher, sangles)';
COMMENT ON COLUMN prestation.type_tarif IS 'Tariff type: forfaitaire (fixed), tk (price per km), taux_horaire (hourly rate)';

-- Drop code_dechargement column (MCom-0010) - safely ignore if doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'prestation' AND column_name = 'code_dechargement') THEN
    ALTER TABLE prestation DROP COLUMN code_dechargement;
  END IF;
END$$;

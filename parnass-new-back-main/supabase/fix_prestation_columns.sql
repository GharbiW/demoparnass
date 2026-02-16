-- ================================================================
-- FIX: Add missing columns to prestation and prestation_template
-- Safe to run multiple times (idempotent)
-- ================================================================

-- 1. Add contraintes_conducteur column to prestation table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestation' AND column_name = 'contraintes_conducteur'
  ) THEN
    ALTER TABLE prestation ADD COLUMN contraintes_conducteur TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added contraintes_conducteur to prestation';
  ELSE
    RAISE NOTICE 'contraintes_conducteur already exists on prestation';
  END IF;
END $$;

-- 2. Add code_dechargement column to prestation table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestation' AND column_name = 'code_dechargement'
  ) THEN
    ALTER TABLE prestation ADD COLUMN code_dechargement VARCHAR(50);
    RAISE NOTICE 'Added code_dechargement to prestation';
  ELSE
    RAISE NOTICE 'code_dechargement already exists on prestation';
  END IF;
END $$;

-- 3. Add type_tracteur column to prestation table (VL / CM / SPL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestation' AND column_name = 'type_tracteur'
  ) THEN
    ALTER TABLE prestation ADD COLUMN type_tracteur VARCHAR(50);
    RAISE NOTICE 'Added type_tracteur to prestation';
  ELSE
    RAISE NOTICE 'type_tracteur already exists on prestation';
  END IF;
END $$;

-- 4. Add type_tracteur column to prestation_template table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestation_template' AND column_name = 'type_tracteur'
  ) THEN
    ALTER TABLE prestation_template ADD COLUMN type_tracteur VARCHAR(50);
    RAISE NOTICE 'Added type_tracteur to prestation_template';
  ELSE
    RAISE NOTICE 'type_tracteur already exists on prestation_template';
  END IF;
END $$;

-- 5. Add contraintes_conducteur column to prestation_template table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestation_template' AND column_name = 'contraintes_conducteur'
  ) THEN
    ALTER TABLE prestation_template ADD COLUMN contraintes_conducteur TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added contraintes_conducteur to prestation_template';
  ELSE
    RAISE NOTICE 'contraintes_conducteur already exists on prestation_template';
  END IF;
END $$;

-- 4. Add code_dechargement column to prestation_template table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestation_template' AND column_name = 'code_dechargement'
  ) THEN
    ALTER TABLE prestation_template ADD COLUMN code_dechargement VARCHAR(50);
    RAISE NOTICE 'Added code_dechargement to prestation_template';
  ELSE
    RAISE NOTICE 'code_dechargement already exists on prestation_template';
  END IF;
END $$;

-- 5. Change specificites column type from TEXT[] to JSONB (if it's TEXT[])
-- This allows storing structured objects with sub-categories
DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns 
  WHERE table_name = 'prestation' AND column_name = 'specificites';
  
  IF col_type = 'ARRAY' OR col_type = 'text[]' THEN
    -- Convert existing data: TEXT[] -> JSONB (array of strings)
    ALTER TABLE prestation 
      ALTER COLUMN specificites TYPE JSONB 
      USING CASE 
        WHEN specificites IS NULL THEN '[]'::JSONB
        ELSE to_jsonb(specificites)
      END;
    ALTER TABLE prestation ALTER COLUMN specificites SET DEFAULT '[]'::JSONB;
    RAISE NOTICE 'Converted prestation.specificites from TEXT[] to JSONB';
  ELSIF col_type IS NOT NULL THEN
    RAISE NOTICE 'prestation.specificites is already type: %', col_type;
  ELSE
    -- Column doesn't exist, create it as JSONB
    ALTER TABLE prestation ADD COLUMN specificites JSONB DEFAULT '[]'::JSONB;
    RAISE NOTICE 'Created prestation.specificites as JSONB';
  END IF;
END $$;

-- Same for prestation_template
DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns 
  WHERE table_name = 'prestation_template' AND column_name = 'specificites';
  
  IF col_type = 'ARRAY' OR col_type = 'text[]' THEN
    ALTER TABLE prestation_template 
      ALTER COLUMN specificites TYPE JSONB 
      USING CASE 
        WHEN specificites IS NULL THEN '[]'::JSONB
        ELSE to_jsonb(specificites)
      END;
    ALTER TABLE prestation_template ALTER COLUMN specificites SET DEFAULT '[]'::JSONB;
    RAISE NOTICE 'Converted prestation_template.specificites from TEXT[] to JSONB';
  ELSIF col_type IS NOT NULL THEN
    RAISE NOTICE 'prestation_template.specificites is already type: %', col_type;
  ELSE
    ALTER TABLE prestation_template ADD COLUMN specificites JSONB DEFAULT '[]'::JSONB;
    RAISE NOTICE 'Created prestation_template.specificites as JSONB';
  END IF;
END $$;

-- 6. Drop old CHECK constraints on typologie_vehicule, energie_imposee, type_remorque if they exist
-- These were restrictive and need to allow new codified values
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Drop all CHECK constraints on the columns that might be restrictive
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON con.conrelid = rel.oid
    WHERE rel.relname = 'prestation'
      AND con.contype = 'c'
      AND (
        pg_get_constraintdef(con.oid) LIKE '%typologie_vehicule%'
        OR pg_get_constraintdef(con.oid) LIKE '%energie_imposee%'
        OR pg_get_constraintdef(con.oid) LIKE '%type_remorque%'
        OR pg_get_constraintdef(con.oid) LIKE '%type_demande%'
      )
  LOOP
    EXECUTE format('ALTER TABLE prestation DROP CONSTRAINT IF EXISTS %I', constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END LOOP;
  
  -- Same for prestation_template
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON con.conrelid = rel.oid
    WHERE rel.relname = 'prestation_template'
      AND con.contype = 'c'
      AND (
        pg_get_constraintdef(con.oid) LIKE '%typologie_vehicule%'
        OR pg_get_constraintdef(con.oid) LIKE '%energie_imposee%'
        OR pg_get_constraintdef(con.oid) LIKE '%type_remorque%'
        OR pg_get_constraintdef(con.oid) LIKE '%type_demande%'
      )
  LOOP
    EXECUTE format('ALTER TABLE prestation_template DROP CONSTRAINT IF EXISTS %I', constraint_name);
    RAISE NOTICE 'Dropped template constraint: %', constraint_name;
  END LOOP;
END $$;

-- 7. Ensure heure_depart and heure_arrivee exist on prestation table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestation' AND column_name = 'heure_depart'
  ) THEN
    ALTER TABLE prestation ADD COLUMN heure_depart VARCHAR(5);
    RAISE NOTICE 'Added heure_depart to prestation';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestation' AND column_name = 'heure_arrivee'
  ) THEN
    ALTER TABLE prestation ADD COLUMN heure_arrivee VARCHAR(5);
    RAISE NOTICE 'Added heure_arrivee to prestation';
  END IF;
END $$;

-- 8. Backfill: compute heure_depart and heure_arrivee from rides for prestations that don't have them
DO $$
DECLARE
  prest RECORD;
  first_time TEXT;
  last_time TEXT;
BEGIN
  FOR prest IN
    SELECT p.id
    FROM prestation p
    WHERE (p.heure_depart IS NULL OR p.heure_arrivee IS NULL)
      AND EXISTS (SELECT 1 FROM ride r WHERE r.prestation_id = p.id)
  LOOP
    -- First ride's time
    SELECT 
      COALESCE(
        TO_CHAR(r.presence_chargement AT TIME ZONE 'UTC', 'HH24:MI'),
        TO_CHAR(r.depart_chargement AT TIME ZONE 'UTC', 'HH24:MI')
      ) INTO first_time
    FROM ride r
    WHERE r.prestation_id = prest.id
    ORDER BY r.order_index ASC
    LIMIT 1;
    
    -- Last ride's time
    SELECT 
      COALESCE(
        TO_CHAR(r.fin_livraison AT TIME ZONE 'UTC', 'HH24:MI'),
        TO_CHAR(r.arrivee_livraison AT TIME ZONE 'UTC', 'HH24:MI')
      ) INTO last_time
    FROM ride r
    WHERE r.prestation_id = prest.id
    ORDER BY r.order_index DESC
    LIMIT 1;
    
    IF first_time IS NOT NULL OR last_time IS NOT NULL THEN
      UPDATE prestation
      SET 
        heure_depart = COALESCE(heure_depart, first_time),
        heure_arrivee = COALESCE(heure_arrivee, last_time)
      WHERE id = prest.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill of prestation times from rides completed';
END $$;

-- Done!
-- Run this SQL in the Supabase SQL Editor.

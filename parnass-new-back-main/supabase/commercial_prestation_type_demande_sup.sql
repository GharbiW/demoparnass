-- Migration: Rename type_demande value 'Spot' to 'SUP' for prestations and templates

-- 1. Drop existing CHECK constraints on type_demande (auto-generated names)
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all check constraints on prestation.type_demande
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'prestation'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%type_demande%'
  LOOP
    EXECUTE 'ALTER TABLE prestation DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;

  -- Drop all check constraints on prestation_template.type_demande
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'prestation_template'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%type_demande%'
  LOOP
    EXECUTE 'ALTER TABLE prestation_template DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- 2. Update existing prestation data
UPDATE prestation SET type_demande = 'SUP' WHERE type_demande = 'Spot';

-- 3. Update existing template data
UPDATE prestation_template SET type_demande = 'SUP' WHERE type_demande = 'Spot';

-- 4. Add new CHECK constraints
ALTER TABLE prestation ADD CONSTRAINT prestation_type_demande_check
  CHECK (type_demande IN ('Régulière', 'SUP', 'MAD'));

ALTER TABLE prestation_template ADD CONSTRAINT prestation_template_type_demande_check
  CHECK (type_demande IN ('Régulière', 'SUP', 'MAD'));

-- Update comments
COMMENT ON COLUMN prestation.type_demande IS 'Service type: Régulière, SUP, or MAD';
COMMENT ON COLUMN prestation_template.type_demande IS 'Service type: Régulière, SUP, or MAD';

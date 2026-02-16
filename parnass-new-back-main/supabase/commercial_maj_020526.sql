-- =============================================
-- Commercial Module: MAJ 05/02/2026
-- - Contract: make reference NOT NULL (Référence Contrat obligatoire)
-- - Prestation: rename tariff type 'tk' to 'terme_kilometrique'
-- - Template: rename tariff type 'tk' to 'terme_kilometrique'
-- Safe to re-run (idempotent)
-- =============================================

-- ============================================
-- 1. Contract: Ensure reference is NOT NULL
-- ============================================
-- First, fill any NULL references with auto-generated ones
DO $$
DECLARE
    rec RECORD;
    year_part VARCHAR(4);
    next_num INTEGER;
    new_ref VARCHAR(50);
BEGIN
    FOR rec IN SELECT id FROM contract WHERE reference IS NULL OR TRIM(reference) = '' LOOP
        year_part := TO_CHAR(NOW(), 'YYYY');
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'CTR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num
        FROM contract
        WHERE reference LIKE 'CTR-' || year_part || '-%';
        new_ref := 'CTR-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
        UPDATE contract SET reference = new_ref WHERE id = rec.id;
    END LOOP;
END $$;

-- Now make it NOT NULL (safe to re-run)
ALTER TABLE contract ALTER COLUMN reference SET NOT NULL;

-- ============================================
-- 2. Rename tariff type 'tk' to 'terme_kilometrique'
-- ============================================

-- Step A: Update existing data FIRST (before any constraint changes)
UPDATE prestation SET type_tarif = 'terme_kilometrique' WHERE type_tarif = 'tk';
UPDATE prestation_template SET type_tarif = 'terme_kilometrique' WHERE type_tarif = 'tk';

-- Step B: Drop old constraints on type_tarif (by querying pg_constraint)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all type_tarif check constraints on prestation_template
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'prestation_template'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%type_tarif%'
    LOOP
        EXECUTE 'ALTER TABLE prestation_template DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;

    -- Drop all type_tarif check constraints on prestation
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'prestation'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%type_tarif%'
    LOOP
        EXECUTE 'ALTER TABLE prestation DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Step C: Re-add constraints with updated values
ALTER TABLE prestation_template ADD CONSTRAINT prestation_template_type_tarif_check
    CHECK (type_tarif IN ('forfaitaire', 'terme_kilometrique', 'taux_horaire'));

DO $$
BEGIN
    ALTER TABLE prestation ADD CONSTRAINT prestation_type_tarif_check
        CHECK (type_tarif IN ('forfaitaire', 'terme_kilometrique', 'taux_horaire'));
EXCEPTION WHEN duplicate_object THEN
    NULL; -- constraint already exists
END $$;

-- ============================================
-- Migration complete
-- ============================================

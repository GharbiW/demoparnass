-- =============================================
-- Commercial Module: Prestation Reference Format Update
-- Changes auto-generation format from PRE-XXXXXX to PREST-YY-XXXXXX
-- MAJ 05/02/2026
-- =============================================

-- Update the auto-generation function for prestation references
CREATE OR REPLACE FUNCTION generate_prestation_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(2);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    year_part := TO_CHAR(NOW(), 'YY');

    -- Count based on new format for the current year
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'PREST-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM prestation
    WHERE reference LIKE 'PREST-' || year_part || '-%';

    -- If no new-format references exist yet, also check old format to avoid conflicts
    IF next_num = 1 THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'PRE-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num
        FROM prestation
        WHERE reference LIKE 'PRE-%';
    END IF;

    new_reference := 'PREST-' || year_part || '-' || LPAD(next_num::TEXT, 6, '0');
    NEW.reference := new_reference;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_generate_prestation_reference ON prestation;
CREATE TRIGGER trigger_generate_prestation_reference
    BEFORE INSERT ON prestation
    FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_prestation_reference();

-- Update comments
COMMENT ON COLUMN prestation.reference IS 'Auto-generated unique reference (PREST-YY-XXXXXX)';

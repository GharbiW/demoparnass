-- =============================================
-- Commercial Module: Ride Reference Format Update
-- Changes auto-generation format from RDE-XXXXXX to RDE-YY-XXXXXX
-- MAJ 05/02/2026
-- =============================================

-- Update the auto-generation function for ride references
CREATE OR REPLACE FUNCTION generate_ride_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(2);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    year_part := TO_CHAR(NOW(), 'YY');

    -- Count based on new format for the current year
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'RDE-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM ride
    WHERE reference LIKE 'RDE-' || year_part || '-%';

    -- If no new-format references exist yet, also check old format to avoid conflicts
    IF next_num = 1 THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'RDE-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num
        FROM ride
        WHERE reference LIKE 'RDE-%' AND reference NOT LIKE 'RDE-__-%';
    END IF;

    new_reference := 'RDE-' || year_part || '-' || LPAD(next_num::TEXT, 6, '0');
    NEW.reference := new_reference;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_generate_ride_reference ON ride;
CREATE TRIGGER trigger_generate_ride_reference
    BEFORE INSERT ON ride FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_ride_reference();

-- Update comments
COMMENT ON COLUMN ride.reference IS 'Auto-generated internal reference (RDE-YY-XXXXXX)';

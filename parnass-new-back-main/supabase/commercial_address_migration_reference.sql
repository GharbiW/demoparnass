-- Commercial Module: Address Table Migration - Add Reference with Auto-generation
-- Run this if you already have the address table

-- Step 1: Add reference column
ALTER TABLE address ADD COLUMN IF NOT EXISTS reference VARCHAR(50) UNIQUE;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_address_reference ON address(reference);

-- Step 3: Create function to auto-generate reference if not provided
CREATE OR REPLACE FUNCTION generate_address_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    -- Only generate if reference is NULL or empty
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        year_part := TO_CHAR(NOW(), 'YYYY');
        
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'ADR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num
        FROM address
        WHERE reference LIKE 'ADR-' || year_part || '-%';
        
        new_reference := 'ADR-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
        NEW.reference := new_reference;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to auto-generate reference on insert if not provided
DROP TRIGGER IF EXISTS trigger_generate_address_reference ON address;
CREATE TRIGGER trigger_generate_address_reference
    BEFORE INSERT ON address
    FOR EACH ROW
    WHEN (NEW.reference IS NULL OR TRIM(NEW.reference) = '')
    EXECUTE FUNCTION generate_address_reference();

-- Step 5: Update the comment
COMMENT ON COLUMN address.reference IS 'User-specified unique reference (auto-generated if not provided)';

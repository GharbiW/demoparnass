-- Commercial Module: Contract Table Migration - Make Reference Optional with Auto-generation
-- Run this if you already have the contract table

-- Step 1: Drop the old trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_generate_contract_reference ON contract;
DROP FUNCTION IF EXISTS generate_contract_reference();

-- Step 2: Make reference column nullable (if it's currently NOT NULL)
-- Note: This will fail if you have existing NULL references and the column is UNIQUE
-- You may need to update existing NULL references first
ALTER TABLE contract ALTER COLUMN reference DROP NOT NULL;

-- Step 3: Create function to auto-generate reference if not provided
CREATE OR REPLACE FUNCTION generate_contract_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    next_num INTEGER;
    new_reference VARCHAR(50);
BEGIN
    -- Only generate if reference is NULL or empty
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        year_part := TO_CHAR(NOW(), 'YYYY');
        
        SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'CTR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
        INTO next_num
        FROM contract
        WHERE reference LIKE 'CTR-' || year_part || '-%';
        
        new_reference := 'CTR-' || year_part || '-' || LPAD(next_num::TEXT, 4, '0');
        NEW.reference := new_reference;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to auto-generate reference on insert if not provided
CREATE TRIGGER trigger_generate_contract_reference
    BEFORE INSERT ON contract
    FOR EACH ROW
    WHEN (NEW.reference IS NULL OR TRIM(NEW.reference) = '')
    EXECUTE FUNCTION generate_contract_reference();

-- Step 5: Update the comment
COMMENT ON COLUMN contract.reference IS 'User-specified unique reference (auto-generated if not provided)';

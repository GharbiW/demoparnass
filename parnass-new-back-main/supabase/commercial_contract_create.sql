-- Commercial Module: Contract Table
-- Creates the contract table for storing client contracts (also serves as CDC - Cahier des Charges)

CREATE TABLE IF NOT EXISTS contract (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    invoice_code VARCHAR(50),
    type VARCHAR(50) DEFAULT 'Annuel' CHECK (type IN ('Annuel', 'Pluriannuel', 'Spot')),
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_contract_reference ON contract(reference);
CREATE INDEX IF NOT EXISTS idx_contract_client ON contract(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_status ON contract(status);
CREATE INDEX IF NOT EXISTS idx_contract_dates ON contract(start_date, end_date);

-- Function to auto-generate contract reference if not provided
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

-- Trigger to auto-generate reference on insert if not provided
DROP TRIGGER IF EXISTS trigger_generate_contract_reference ON contract;
CREATE TRIGGER trigger_generate_contract_reference
    BEFORE INSERT ON contract
    FOR EACH ROW
    WHEN (NEW.reference IS NULL OR TRIM(NEW.reference) = '')
    EXECUTE FUNCTION generate_contract_reference();

-- Function to auto-generate invoice code based on reference
CREATE OR REPLACE FUNCTION generate_contract_invoice_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_code IS NULL THEN
        NEW.invoice_code := 'INV-' || NEW.reference;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice code
DROP TRIGGER IF EXISTS trigger_generate_contract_invoice_code ON contract;
CREATE TRIGGER trigger_generate_contract_invoice_code
    BEFORE INSERT ON contract
    FOR EACH ROW
    EXECUTE FUNCTION generate_contract_invoice_code();

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_contract_updated_at ON contract;
CREATE TRIGGER trigger_contract_updated_at
    BEFORE UPDATE ON contract
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE contract IS 'Client contracts (also serves as CDC - Cahier des Charges)';
COMMENT ON COLUMN contract.reference IS 'User-specified unique reference (auto-generated if not provided)';
COMMENT ON COLUMN contract.invoice_code IS 'Code used for invoicing';
COMMENT ON COLUMN contract.type IS 'Contract type: Annuel, Pluriannuel, or Spot';
COMMENT ON COLUMN contract.auto_renew IS 'Whether the contract auto-renews';
COMMENT ON COLUMN contract.status IS 'Contract status: active, inactive, or terminated';

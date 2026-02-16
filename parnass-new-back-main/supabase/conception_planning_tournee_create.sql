-- Conception Planning Module: planning_tournee table
-- A tournee groups daily courses with an assigned driver and vehicle for a given week.

CREATE TABLE IF NOT EXISTS planning_tournee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    site VARCHAR(100),
    week_start DATE NOT NULL,
    driver_id UUID,        -- references driver_cache(id) logically
    vehicle_id UUID,       -- references vehicle_cache(id) logically
    vehicle_type VARCHAR(50),
    energy VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    version_id UUID,       -- references planning_version(id), set on publish
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_planning_tournee_week ON planning_tournee(week_start);
CREATE INDEX IF NOT EXISTS idx_planning_tournee_driver ON planning_tournee(driver_id);
CREATE INDEX IF NOT EXISTS idx_planning_tournee_vehicle ON planning_tournee(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_planning_tournee_status ON planning_tournee(status);

-- Auto-generate reference TRN-XXXXXX
CREATE OR REPLACE FUNCTION generate_tournee_reference()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'TRN-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM planning_tournee;
    NEW.reference := 'TRN-' || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_tournee_reference ON planning_tournee;
CREATE TRIGGER trigger_generate_tournee_reference
    BEFORE INSERT ON planning_tournee
    FOR EACH ROW
    WHEN (NEW.reference IS NULL)
    EXECUTE FUNCTION generate_tournee_reference();

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_planning_tournee_updated_at ON planning_tournee;
CREATE TRIGGER trigger_planning_tournee_updated_at
    BEFORE UPDATE ON planning_tournee
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE planning_tournee IS 'Conception planning tournees grouping daily courses with driver/vehicle assignments';

-- Conception Planning Module: planning_version table
-- Tracks published versions of the weekly planning.

CREATE TABLE IF NOT EXISTS planning_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    version_number INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publie', 'archive')),
    published_at TIMESTAMP WITH TIME ZONE,
    published_by TEXT,
    notes TEXT,
    stats JSONB DEFAULT '{}'::JSONB,  -- snapshot of planning stats at publish time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planning_version_week ON planning_version(week_start);
CREATE INDEX IF NOT EXISTS idx_planning_version_status ON planning_version(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_planning_version_week_num ON planning_version(week_start, version_number);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_planning_version_updated_at ON planning_version;
CREATE TRIGGER trigger_planning_version_updated_at
    BEFORE UPDATE ON planning_version
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE planning_version IS 'Planning version tracking for weekly publish workflow';

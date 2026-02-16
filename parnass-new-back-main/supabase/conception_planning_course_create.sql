-- Conception Planning Module: planning_course table
-- A course is a daily occurrence of a prestation, optionally assigned to a tournee/driver/vehicle.

CREATE TABLE IF NOT EXISTS planning_course (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestation_id UUID REFERENCES prestation(id) ON DELETE CASCADE,
    tournee_id UUID REFERENCES planning_tournee(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    start_location TEXT,
    end_location TEXT,
    client_name VARCHAR(200),
    prestation_reference VARCHAR(100),
    driver_id UUID,        -- references driver_cache(id) logically
    driver_name VARCHAR(200),
    vehicle_id UUID,       -- references vehicle_cache(id) logically
    vehicle_immat VARCHAR(50),
    assignment_status VARCHAR(30) DEFAULT 'non_affectee'
        CHECK (assignment_status IN ('affectee', 'partiellement_affectee', 'non_affectee')),
    is_sensitive BOOLEAN DEFAULT FALSE,
    is_sup BOOLEAN DEFAULT FALSE,
    vehicle_type VARCHAR(50),
    vehicle_energy VARCHAR(50),
    driver_type VARCHAR(50),
    required_skills JSONB DEFAULT '[]'::JSONB,
    non_placement_reason VARCHAR(50),
    missing_resource VARCHAR(20),
    comments TEXT,
    site VARCHAR(100),
    -- Actual execution data (for reporting plan vs real)
    actual_start_time TIME,
    actual_end_time TIME,
    actual_driver_id UUID,
    actual_vehicle_id UUID,
    actual_start_location TEXT,
    actual_end_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_planning_course_date ON planning_course(date);
CREATE INDEX IF NOT EXISTS idx_planning_course_prestation ON planning_course(prestation_id);
CREATE INDEX IF NOT EXISTS idx_planning_course_tournee ON planning_course(tournee_id);
CREATE INDEX IF NOT EXISTS idx_planning_course_driver ON planning_course(driver_id);
CREATE INDEX IF NOT EXISTS idx_planning_course_vehicle ON planning_course(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_planning_course_status ON planning_course(assignment_status);
CREATE INDEX IF NOT EXISTS idx_planning_course_date_status ON planning_course(date, assignment_status);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_planning_course_updated_at ON planning_course;
CREATE TRIGGER trigger_planning_course_updated_at
    BEFORE UPDATE ON planning_course
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE planning_course IS 'Daily course occurrences generated from prestations for the conception planning';

-- Commercial Module: Activity Log Table
-- Creates the activity_log table for tracking user actions

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    detail VARCHAR(255),
    reference VARCHAR(100),
    user_id UUID,
    user_name VARCHAR(255),
    user_initials VARCHAR(10),
    entity_type VARCHAR(50),
    entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- Comments
COMMENT ON TABLE activity_log IS 'Activity log for tracking commercial module actions';
COMMENT ON COLUMN activity_log.type IS 'Action type (e.g., contrat_signe, client_ajoute, contact_ajoute)';
COMMENT ON COLUMN activity_log.detail IS 'Description or entity name';
COMMENT ON COLUMN activity_log.reference IS 'Entity reference (e.g., CLI-2024-0001)';
COMMENT ON COLUMN activity_log.user_id IS 'User who performed the action';
COMMENT ON COLUMN activity_log.user_name IS 'Display name of the user';
COMMENT ON COLUMN activity_log.user_initials IS 'User initials for avatar';
COMMENT ON COLUMN activity_log.entity_type IS 'Type of entity (client, contract, contact, etc.)';
COMMENT ON COLUMN activity_log.entity_id IS 'ID of the affected entity';

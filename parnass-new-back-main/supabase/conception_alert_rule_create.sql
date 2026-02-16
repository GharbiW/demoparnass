-- Conception Planning Module: alert_rule table
-- Stores configurable alert rules for planning (thresholds, severity, conditions).

CREATE TABLE IF NOT EXISTS alert_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'amplitude', 'ressources', 'qualite', 'planning', 'custom'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN (
        'critique', 'warning', 'info'
    )),
    condition_text TEXT,
    threshold NUMERIC DEFAULT 0,
    tolerance NUMERIC DEFAULT 0,
    target_date DATE,
    description TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    is_builtin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rule_category ON alert_rule(category);
CREATE INDEX IF NOT EXISTS idx_alert_rule_enabled ON alert_rule(enabled);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_alert_rule_updated_at ON alert_rule;
CREATE TRIGGER trigger_alert_rule_updated_at
    BEFORE UPDATE ON alert_rule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE alert_rule IS 'Alert rules for conception planning (amplitude, resources, quality, etc.)';

-- Commercial Module: Contact Table
-- Creates the contact table for storing client contact persons

CREATE TABLE IF NOT EXISTS contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    avatar_url TEXT,
    client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_client ON contact(client_id);
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact(email);
CREATE INDEX IF NOT EXISTS idx_contact_name ON contact(last_name, first_name);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_contact_updated_at ON contact;
CREATE TRIGGER trigger_contact_updated_at
    BEFORE UPDATE ON contact
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE contact IS 'Contact persons associated with clients';
COMMENT ON COLUMN contact.first_name IS 'Contact first name';
COMMENT ON COLUMN contact.last_name IS 'Contact last name';
COMMENT ON COLUMN contact.role IS 'Job title or role (e.g., Directeur Logistique)';
COMMENT ON COLUMN contact.avatar_url IS 'URL to contact avatar image in Supabase storage';
COMMENT ON COLUMN contact.client_id IS 'Reference to the parent client';

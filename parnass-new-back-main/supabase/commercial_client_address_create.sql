-- Commercial Module: Client-Address Junction Table
-- Creates the many-to-many relationship between clients and addresses

CREATE TABLE IF NOT EXISTS client_address (
    client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    address_id UUID NOT NULL REFERENCES address(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (client_id, address_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_address_client ON client_address(client_id);
CREATE INDEX IF NOT EXISTS idx_client_address_address ON client_address(address_id);

-- Comments
COMMENT ON TABLE client_address IS 'Junction table linking clients to their delivery addresses (many-to-many)';
COMMENT ON COLUMN client_address.client_id IS 'Reference to the client';
COMMENT ON COLUMN client_address.address_id IS 'Reference to the address';

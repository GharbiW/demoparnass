-- Migration: Add billing address fields to client table
-- MCom-006: Support separate billing address vs headquarters address

-- Add billing address columns to client table
ALTER TABLE IF EXISTS client
ADD COLUMN IF NOT EXISTS has_different_billing_address BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100) DEFAULT 'France',
ADD COLUMN IF NOT EXISTS billing_country_code VARCHAR(10) DEFAULT 'FR';

-- Add comment for documentation
COMMENT ON COLUMN client.has_different_billing_address IS 'Flag indicating if billing address differs from headquarters';
COMMENT ON COLUMN client.billing_address IS 'Street address for billing (if different from headquarters)';
COMMENT ON COLUMN client.billing_postal_code IS 'Postal code for billing address';
COMMENT ON COLUMN client.billing_city IS 'City for billing address';
COMMENT ON COLUMN client.billing_country IS 'Country for billing address';
COMMENT ON COLUMN client.billing_country_code IS 'ISO country code for billing address';

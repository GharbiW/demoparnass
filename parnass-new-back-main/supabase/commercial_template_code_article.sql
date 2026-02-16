-- Add code_article column to prestation_template table
-- This field is used to identify the article code for billing/invoicing purposes

ALTER TABLE prestation_template ADD COLUMN IF NOT EXISTS code_article VARCHAR(100);
COMMENT ON COLUMN prestation_template.code_article IS 'Article code for billing/invoicing';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prestation_template_code_article ON prestation_template(code_article);

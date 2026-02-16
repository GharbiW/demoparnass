-- Commercial Module: Client Table Migration
-- Run this if you already have the client table with auto-generated references

-- Step 1: Drop the old auto-generation trigger and function (if they exist)
DROP TRIGGER IF EXISTS trigger_generate_client_reference ON client;
DROP FUNCTION IF EXISTS generate_client_reference();

-- Step 2: Ensure reference column is NOT NULL (user-specified)
-- Note: If you have existing NULL references, you'll need to update them first
-- ALTER TABLE client ALTER COLUMN reference SET NOT NULL;

-- Step 3: Update the comment
COMMENT ON COLUMN client.reference IS 'User-specified unique reference';

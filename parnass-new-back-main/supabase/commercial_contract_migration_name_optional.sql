-- Commercial Module: Contract Table Migration - Make Name Optional
-- Run this if you already have the contract table

-- Step 1: Make name column nullable
ALTER TABLE contract ALTER COLUMN name DROP NOT NULL;

-- Step 2: Update the comment (optional)
COMMENT ON COLUMN contract.name IS 'Contract name (optional)';

-- Rollback: Remove contract fields from activities table
-- Feature: 006-contract-activity-fields
-- Date: 2025-12-25
-- Description: Rollback script to remove contract_date and contract_value fields

USE crm_database;  -- Replace with actual database name if different

-- Drop indexes first
DROP INDEX IF EXISTS idx_activities_contract_value ON activities;
DROP INDEX IF EXISTS idx_activities_contract_date ON activities;

-- Drop constraint
ALTER TABLE activities
DROP CONSTRAINT IF EXISTS chk_contract_value_non_negative;

-- Drop columns
ALTER TABLE activities
DROP COLUMN IF EXISTS contract_value;

ALTER TABLE activities
DROP COLUMN IF EXISTS contract_date;

-- Verification query (run separately to verify rollback)
-- DESCRIBE activities;

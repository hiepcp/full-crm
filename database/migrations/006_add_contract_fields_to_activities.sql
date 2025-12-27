-- Migration: Add contract fields to activities table
-- Feature: 006-contract-activity-fields
-- Date: 2025-12-25
-- Description: Adds contract_date and contract_value fields to support contract-type activities

USE crm_database;  -- Replace with actual database name if different

-- Add contract_date column
ALTER TABLE activities
ADD COLUMN contract_date DATE NULL
COMMENT 'Date when contract was signed or becomes effective (contract-type activities only)';

-- Add contract_value column
ALTER TABLE activities
ADD COLUMN contract_value DECIMAL(18, 2) NULL
COMMENT 'Financial value of the contract (contract-type activities only)';

-- Add constraint to ensure contract_value is non-negative if provided
ALTER TABLE activities
ADD CONSTRAINT chk_contract_value_non_negative
CHECK (contract_value IS NULL OR contract_value >= 0);

-- Optional: Add index for contract_date filtering (improves query performance)
-- Only indexes non-NULL values to save space
CREATE INDEX idx_activities_contract_date
ON activities(contract_date)
WHERE contract_date IS NOT NULL;

-- Optional: Add index for contract_value filtering (improves query performance)
-- Only indexes non-NULL values to save space
CREATE INDEX idx_activities_contract_value
ON activities(contract_value)
WHERE contract_value IS NOT NULL;

-- Verification query (run separately to verify migration)
-- DESCRIBE activities;
-- SHOW INDEX FROM activities;

-- Migration: 002 - Add Contract Fields to Activity
-- Task: 007-fix-missing-contractdate-and-contractvalue-values
-- Date: 2025-12-29
-- Description: Add ContractDate and ContractValue columns to crm_activity table for contract activity persistence

USE crm_sys_db;

-- Disable foreign key checks during migration
SET FOREIGN_KEY_CHECKS = 0;

-- ===========================================
-- STEP 1: EXTEND EXISTING crm_activity TABLE
-- ===========================================

ALTER TABLE crm_activity
  -- Add contract-specific fields
  ADD COLUMN ContractDate DATE NULL COMMENT 'Contract signature or effective date (NULL for non-contract activities)',
  ADD COLUMN ContractValue DECIMAL(18,2) NULL COMMENT 'Contract monetary value (NULL for non-contract activities)',

  -- Add constraint for contract value validation
  ADD CONSTRAINT chk_contract_value_non_negative
    CHECK (ContractValue IS NULL OR ContractValue >= 0);

SELECT 'Extended crm_activity table with contract fields' AS step1_complete;

-- ===========================================
-- STEP 2: ADD CONSTRAINT FOR FIELD PAIRING
-- ===========================================

-- Ensure ContractDate and ContractValue are both set or both NULL
-- This maintains data integrity for contract activities
ALTER TABLE crm_activity
  ADD CONSTRAINT chk_contract_fields_paired
    CHECK (
      (ContractDate IS NULL AND ContractValue IS NULL) OR
      (ContractDate IS NOT NULL AND ContractValue IS NOT NULL)
    );

SELECT 'Added constraint to ensure ContractDate and ContractValue are paired' AS step2_complete;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

SELECT 'Migration 002_add_contract_fields_to_activity.sql completed successfully!' AS migration_complete;
SELECT 'Summary:' AS summary;
SELECT '  - Added ContractDate (DATE NULL) column to crm_activity' AS change1;
SELECT '  - Added ContractValue (DECIMAL(18,2) NULL) column to crm_activity' AS change2;
SELECT '  - Added non-negative value constraint' AS change3;
SELECT '  - Added field pairing constraint (both set or both NULL)' AS change4;

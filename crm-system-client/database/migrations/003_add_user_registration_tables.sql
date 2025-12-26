-- ============================================================================
-- Migration: 003_add_user_registration_tables.sql
-- Feature: User Sale Registration (003-user-sale-registration)
-- Purpose: Add database schema for user registration from HCM workers
-- Date: 2025-12-26
-- ============================================================================

-- Note: Based on research.md findings, the current User entity supports
-- a single role field (not multi-role). This migration adapts to that constraint.

-- ============================================================================
-- 1. ALTER crm_user table - Add personnel_number field
-- ============================================================================

ALTER TABLE crm_user
ADD COLUMN IF NOT EXISTS personnel_number VARCHAR(50) NULL COMMENT 'HCM personnel/employee number';

-- Add UNIQUE constraint on personnel_number (allow NULL for manual entries)
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_user_personnel_number
ON crm_user(personnel_number);

-- ============================================================================
-- 2. ALTER crm_user table - Ensure email UNIQUE constraint exists
-- ============================================================================

-- Check if UNIQUE constraint on email already exists, if not add it
-- Note: This may fail if duplicate emails exist - must be resolved manually
ALTER TABLE crm_user
ADD UNIQUE INDEX IF NOT EXISTS idx_crm_user_email (email);

-- ============================================================================
-- 3. CREATE crm_user_audit_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_user_audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Audit log entry ID',
    administrator_id INT NULL COMMENT 'ID of admin who performed the registration',
    registered_user_id INT NULL COMMENT 'ID of the created user',
    registered_user_email VARCHAR(255) NOT NULL COMMENT 'Email of registered user',
    assigned_role VARCHAR(50) NULL COMMENT 'Role assigned to user (single role)',
    registration_source ENUM('HCM', 'Manual') NOT NULL DEFAULT 'Manual' COMMENT 'Source of registration data',
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Registration timestamp',

    -- Foreign keys (nullable to handle cases where users may be deleted)
    CONSTRAINT fk_audit_administrator
        FOREIGN KEY (administrator_id) REFERENCES crm_user(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_registered_user
        FOREIGN KEY (registered_user_id) REFERENCES crm_user(id) ON DELETE SET NULL,

    -- Indexes for efficient querying
    INDEX idx_audit_administrator (administrator_id),
    INDEX idx_audit_created_on (created_on),
    INDEX idx_audit_registered_user_email (registered_user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail for user registration events';

-- ============================================================================
-- 4. Verify and update existing crm_user table structure
-- ============================================================================

-- Ensure crm_user has required fields for the registration feature
-- (These should already exist based on plan.md, but verify)

-- Check for email field (should be VARCHAR with UNIQUE constraint)
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'crm_user'
  AND COLUMN_NAME IN ('id', 'email', 'full_name', 'personnel_number', 'role', 'is_active', 'created_by', 'created_on', 'updated_by', 'updated_on');

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- Research Findings (research.md):
-- - Current User entity has single 'role' field (string), NOT multi-role
-- - Allowed values: 'admin', 'manager', 'sales', 'support', 'user'
-- - NO user_roles junction table needed for MVP
-- - Azure AD sync is MANUAL, not automated

-- Deviations from original plan.md:
-- - Removed user_roles junction table (not supported by current schema)
-- - Changed assigned_roles (JSON array) to assigned_role (single VARCHAR)
-- - MVP uses single-role selection dropdown in UI

-- Future Enhancements:
-- - If multi-role support is added later, create user_roles junction table
-- - Add database migration for role assignment history

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration:
-- ALTER TABLE crm_user DROP COLUMN IF EXISTS personnel_number;
-- DROP INDEX IF EXISTS idx_crm_user_personnel_number ON crm_user;
-- DROP INDEX IF EXISTS idx_crm_user_email ON crm_user;
-- DROP TABLE IF EXISTS crm_user_audit_log;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

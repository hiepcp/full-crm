-- =============================================================================
-- Migration: Add audit columns for sales teams and team members
-- Version: V3.0.1
-- Description: Add created/updated tracking columns used by BaseEntity
-- =============================================================================

ALTER TABLE crm_sales_teams
  ADD COLUMN IF NOT EXISTS CreatedBy VARCHAR(255) NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS UpdatedBy VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS UpdatedOn DATETIME NULL ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE crm_team_members
  ADD COLUMN IF NOT EXISTS CreatedBy VARCHAR(255) NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS UpdatedBy VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS UpdatedOn DATETIME NULL ON UPDATE CURRENT_TIMESTAMP;

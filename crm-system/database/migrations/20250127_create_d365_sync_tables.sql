-- ============================================================
-- Migration: Create Dynamics 365 Category Synchronization Tables
-- Date: 2025-01-27
-- Description: Creates tables for D365 category sync state tracking,
--              audit logging, and category mapping between CRM and D365
-- ============================================================

-- Table: CRM_dynamics365_category_sync
-- Purpose: Tracks sync state for individual categories between CRM and D365
CREATE TABLE IF NOT EXISTS CRM_dynamics365_category_sync (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  CRMCategoryId BIGINT NULL,
  Dynamics365CategoryId VARCHAR(100) NULL,
  LastSyncedOn DATETIME NULL,
  SyncStatus VARCHAR(50) NOT NULL DEFAULT 'Pending',
  SyncDirection VARCHAR(20) NULL,
  ErrorMessage TEXT NULL,
  RetryCount INT NOT NULL DEFAULT 0,
  NextRetryOn DATETIME NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_d365_category_sync_crm_id (CRMCategoryId),
  INDEX idx_crm_d365_category_sync_d365_id (Dynamics365CategoryId),
  INDEX idx_crm_d365_category_sync_status (SyncStatus),
  INDEX idx_crm_d365_category_sync_last_synced (LastSyncedOn),
  INDEX idx_crm_d365_category_sync_retry (NextRetryOn),
  INDEX idx_crm_d365_category_sync_created_on (CreatedOn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: CRM_category_sync_audit_log
-- Purpose: Audit trail for all category synchronization operations
CREATE TABLE IF NOT EXISTS CRM_category_sync_audit_log (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  SyncStartedOn DATETIME NOT NULL,
  SyncCompletedOn DATETIME NULL,
  SyncStatus VARCHAR(50) NOT NULL DEFAULT 'Running',
  SyncDirection VARCHAR(20) NULL,
  CategoriesCreated INT NOT NULL DEFAULT 0,
  CategoriesUpdated INT NOT NULL DEFAULT 0,
  CategoriesDeleted INT NOT NULL DEFAULT 0,
  ConflictsResolved INT NOT NULL DEFAULT 0,
  ErrorsEncountered INT NOT NULL DEFAULT 0,
  ErrorDetails TEXT NULL,
  ChangesSummary TEXT NULL,
  TriggerSource VARCHAR(50) NULL,
  TriggeredBy VARCHAR(255) NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_category_sync_audit_started (SyncStartedOn),
  INDEX idx_crm_category_sync_audit_completed (SyncCompletedOn),
  INDEX idx_crm_category_sync_audit_status (SyncStatus),
  INDEX idx_crm_category_sync_audit_direction (SyncDirection),
  INDEX idx_crm_category_sync_audit_trigger_source (TriggerSource),
  INDEX idx_crm_category_sync_audit_triggered_by (TriggeredBy),
  INDEX idx_crm_category_sync_audit_created_on (CreatedOn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: CRM_category_mapping
-- Purpose: Stores mappings between CRM and D365 category names/IDs
CREATE TABLE IF NOT EXISTS CRM_category_mapping (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  CRMCategoryName VARCHAR(255) NOT NULL,
  CRMCategoryId VARCHAR(100) NULL,
  Dynamics365CategoryName VARCHAR(255) NOT NULL,
  Dynamics365CategoryId VARCHAR(100) NULL,
  IsActive TINYINT(1) NOT NULL DEFAULT 1,
  Notes TEXT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_category_mapping_crm_name (CRMCategoryName),
  INDEX idx_crm_category_mapping_crm_id (CRMCategoryId),
  INDEX idx_crm_category_mapping_d365_name (Dynamics365CategoryName),
  INDEX idx_crm_category_mapping_d365_id (Dynamics365CategoryId),
  INDEX idx_crm_category_mapping_active (IsActive),
  INDEX idx_crm_category_mapping_created_on (CreatedOn),
  UNIQUE KEY uk_crm_category_mapping_crm_d365 (CRMCategoryName, Dynamics365CategoryName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- End of Migration
-- ============================================================

-- Migration: 001 - Goal Interface Redesign
-- Feature: Goal Interface Redesign
-- Date: 2025-12-23
-- Description: Add support for auto-calculation, goal hierarchy, templates, progress history, notifications, comments, and audit logs

USE crm_sys_db;

-- Disable foreign key checks during migration
SET FOREIGN_KEY_CHECKS = 0;

-- ===========================================
-- STEP 1: EXTEND EXISTING crm_goal TABLE
-- ===========================================

-- Add ParentGoalId column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'crm_goal';
SET @columnname = 'ParentGoalId';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column ParentGoalId already exists" AS step1_1_status;',
  'ALTER TABLE crm_goal ADD COLUMN ParentGoalId BIGINT NULL COMMENT ''Parent goal for hierarchy (NULL for root goals)'';'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add CalculationSource column if it doesn't exist
SET @columnname = 'CalculationSource';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column CalculationSource already exists" AS step1_2_status;',
  'ALTER TABLE crm_goal ADD COLUMN CalculationSource ENUM(''manual'', ''auto_calculated'') NOT NULL DEFAULT ''manual'' COMMENT ''How progress is updated'';'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add LastCalculatedAt column if it doesn't exist
SET @columnname = 'LastCalculatedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column LastCalculatedAt already exists" AS step1_3_status;',
  'ALTER TABLE crm_goal ADD COLUMN LastCalculatedAt DATETIME NULL COMMENT ''Last auto-calculation timestamp'';'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add CalculationFailed column if it doesn't exist
SET @columnname = 'CalculationFailed';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column CalculationFailed already exists" AS step1_4_status;',
  'ALTER TABLE crm_goal ADD COLUMN CalculationFailed TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Indicates calculation failure'';'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add ManualOverrideReason column if it doesn't exist
SET @columnname = 'ManualOverrideReason';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column ManualOverrideReason already exists" AS step1_5_status;',
  'ALTER TABLE crm_goal ADD COLUMN ManualOverrideReason TEXT NULL COMMENT ''Justification for manual override (FR-018)'';'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for ParentGoalId if it doesn't exist
SET @indexname = 'idx_parent_goal_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT "Index idx_parent_goal_id already exists" AS step1_6_status;',
  'ALTER TABLE crm_goal ADD INDEX idx_parent_goal_id (ParentGoalId);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for CalculationSource if it doesn't exist
SET @indexname = 'idx_calculation_source';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT "Index idx_calculation_source already exists" AS step1_7_status;',
  'ALTER TABLE crm_goal ADD INDEX idx_calculation_source (CalculationSource);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for CalculationFailed if it doesn't exist
SET @indexname = 'idx_calculation_failed';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT "Index idx_calculation_failed already exists" AS step1_8_status;',
  'ALTER TABLE crm_goal ADD INDEX idx_calculation_failed (CalculationFailed);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key for ParentGoalId if it doesn't exist
SET @constraintname = 'fk_parent_goal';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (CONSTRAINT_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (CONSTRAINT_NAME = @constraintname)
      AND (CONSTRAINT_TYPE = 'FOREIGN KEY')
  ) > 0,
  'SELECT "Foreign key fk_parent_goal already exists" AS step1_9_status;',
  'ALTER TABLE crm_goal ADD CONSTRAINT fk_parent_goal FOREIGN KEY (ParentGoalId) REFERENCES crm_goal(Id) ON DELETE SET NULL;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SELECT 'Extended crm_goal table with hierarchy and auto-calculation fields' AS step1_complete;

-- ===========================================
-- STEP 2: CREATE NEW TABLES
-- ===========================================

-- 2.1. Progress History Table
CREATE TABLE IF NOT EXISTS crm_goal_progress_history (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  GoalId BIGINT NOT NULL COMMENT 'Associated goal',
  ProgressValue DECIMAL(18,2) NOT NULL COMMENT 'Progress at snapshot time',
  TargetValue DECIMAL(18,2) NOT NULL COMMENT 'Target at snapshot time (may change)',
  ProgressPercentage DECIMAL(5,2) NOT NULL COMMENT 'Calculated percentage (progress/target * 100)',
  SnapshotSource ENUM('significant_change', 'daily_snapshot', 'manual_adjustment', 'status_change') NOT NULL COMMENT 'What triggered snapshot',
  SnapshotTimestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When snapshot was taken',
  CreatedBy BIGINT NULL COMMENT 'User if manual adjustment, NULL if auto',
  Notes TEXT NULL COMMENT 'Optional notes (e.g., why manual adjustment)',

  INDEX idx_goal_timestamp (GoalId, SnapshotTimestamp DESC),
  INDEX idx_snapshot_source (SnapshotSource),

  FOREIGN KEY (GoalId) REFERENCES crm_goal(Id) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES crm_user(Id) ON DELETE SET NULL,

  CHECK (ProgressPercentage >= 0 AND ProgressPercentage <= 200)
) COMMENT='Captures timestamped snapshots of goal progress for trend analysis and velocity calculations';

SELECT 'Created crm_goal_progress_history table' AS step2_1_complete;

-- 2.2. Goal Template Table
CREATE TABLE IF NOT EXISTS crm_goal_template (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL COMMENT 'Template display name (e.g., "Monthly Revenue Goal")',
  Description TEXT NULL COMMENT 'Template description',
  GoalType ENUM('revenue', 'deals', 'activities', 'tasks', 'performance') NOT NULL COMMENT 'Default goal type',
  Timeframe ENUM('this_week', 'this_month', 'this_quarter', 'this_year', 'custom') NOT NULL COMMENT 'Default timeframe',
  OwnerType ENUM('individual', 'team', 'company') NOT NULL COMMENT 'Default ownership level',
  SuggestedTargetValue DECIMAL(18,2) NULL COMMENT 'Suggested target (user can override)',
  Recurring TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Default recurring setting',
  IsSystemTemplate TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'TRUE for built-in templates, FALSE for custom',
  CreatedBy BIGINT NULL COMMENT 'User who created (NULL for system templates)',
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
  UpdatedBy BIGINT NULL COMMENT 'Last user who updated',
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  IsActive TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Soft delete flag',

  INDEX idx_template_type (GoalType),
  INDEX idx_is_system (IsSystemTemplate),
  INDEX idx_is_active (IsActive),

  FOREIGN KEY (CreatedBy) REFERENCES crm_user(Id) ON DELETE SET NULL,
  FOREIGN KEY (UpdatedBy) REFERENCES crm_user(Id) ON DELETE SET NULL,

  UNIQUE KEY unique_custom_template_name (Name, CreatedBy)
) COMMENT='Pre-configured goal settings for common scenarios enabling quick goal creation';

SELECT 'Created crm_goal_template table' AS step2_2_complete;

-- 2.3. Goal Hierarchy Link Table
CREATE TABLE IF NOT EXISTS crm_goal_hierarchy_link (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ParentGoalId BIGINT NOT NULL COMMENT 'Parent goal',
  ChildGoalId BIGINT NOT NULL COMMENT 'Child goal',
  ContributionWeight DECIMAL(5,2) NOT NULL DEFAULT 1.0 COMMENT 'Weight for weighted average roll-up (future use)',
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Link creation timestamp',
  CreatedBy BIGINT NULL COMMENT 'User who created link',

  INDEX idx_parent (ParentGoalId),
  INDEX idx_child (ChildGoalId),

  FOREIGN KEY (ParentGoalId) REFERENCES crm_goal(Id) ON DELETE CASCADE,
  FOREIGN KEY (ChildGoalId) REFERENCES crm_goal(Id) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES crm_user(Id) ON DELETE SET NULL,

  UNIQUE KEY unique_parent_child (ParentGoalId, ChildGoalId),
  CHECK (ParentGoalId != ChildGoalId)
) COMMENT='Explicitly tracks parent-child relationships between goals for hierarchical structures and roll-up calculations';

SELECT 'Created crm_goal_hierarchy_link table' AS step2_3_complete;

-- 2.4. Goal Notification Table
CREATE TABLE IF NOT EXISTS crm_goal_notification (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  GoalId BIGINT NOT NULL COMMENT 'Associated goal',
  RecipientUserId BIGINT NOT NULL COMMENT 'User to notify',
  NotificationType ENUM('created', 'assigned', 'completed', 'at_risk', 'overdue', 'milestone') NOT NULL COMMENT 'Event type',
  Message TEXT NOT NULL COMMENT 'Notification message',
  IsRead TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Read status',
  SentAt DATETIME NULL COMMENT 'When notification was sent (NULL = pending)',
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Notification creation timestamp',

  INDEX idx_recipient_read (RecipientUserId, IsRead),
  INDEX idx_goal_type (GoalId, NotificationType),
  INDEX idx_sent_at (SentAt),

  FOREIGN KEY (GoalId) REFERENCES crm_goal(Id) ON DELETE CASCADE,
  FOREIGN KEY (RecipientUserId) REFERENCES crm_user(Id) ON DELETE CASCADE
) COMMENT='Stores notifications for goal events (creation, assignment, at-risk status, overdue) to be sent to users';

SELECT 'Created crm_goal_notification table' AS step2_4_complete;

-- 2.5. Goal Comment Table
CREATE TABLE IF NOT EXISTS crm_goal_comment (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  GoalId BIGINT NOT NULL COMMENT 'Associated goal',
  CommentText TEXT NOT NULL COMMENT 'Comment content',
  CreatedBy BIGINT NOT NULL COMMENT 'User who created comment',
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Comment creation timestamp',
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',

  INDEX idx_goal_id (GoalId),
  INDEX idx_created_by (CreatedBy),
  INDEX idx_created_on (CreatedOn),

  FOREIGN KEY (GoalId) REFERENCES crm_goal(Id) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES crm_user(Id) ON DELETE CASCADE
) COMMENT='User-generated notes and discussions attached to specific goals for collaboration and context sharing';

SELECT 'Created crm_goal_comment table' AS step2_5_complete;

-- 2.6. Goal Audit Log Table
CREATE TABLE IF NOT EXISTS crm_goal_audit_log (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  GoalId BIGINT NOT NULL COMMENT 'Associated goal',
  EventType ENUM('create', 'update', 'delete', 'progress_update', 'status_change', 'ownership_change', 'calculation_event', 'hierarchy_change') NOT NULL COMMENT 'Type of event',
  BeforeValue TEXT NULL COMMENT 'Value before change (JSON)',
  AfterValue TEXT NULL COMMENT 'Value after change (JSON)',
  ChangeDetails TEXT NULL COMMENT 'Additional context (JSON)',
  ChangedBy BIGINT NULL COMMENT 'User who made the change (NULL for system events)',
  ChangedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When change occurred',

  INDEX idx_goal_id (GoalId),
  INDEX idx_event_type (EventType),
  INDEX idx_changed_on (ChangedOn),
  INDEX idx_changed_by (ChangedBy),

  FOREIGN KEY (GoalId) REFERENCES crm_goal(Id) ON DELETE CASCADE,
  FOREIGN KEY (ChangedBy) REFERENCES crm_user(Id) ON DELETE SET NULL
) COMMENT='Comprehensive audit trail of all goal changes for compliance, debugging, and historical analysis';

SELECT 'Created crm_goal_audit_log table' AS step2_6_complete;

-- 2.7. Background Job Lock Table
CREATE TABLE IF NOT EXISTS crm_background_job_lock (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  JobName VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique job identifier',
  LockedBy VARCHAR(255) NULL COMMENT 'Instance ID that acquired the lock',
  LockedAt DATETIME NULL COMMENT 'When lock was acquired',
  ExpiresAt DATETIME NULL COMMENT 'When lock expires (prevents deadlock if instance crashes)',

  INDEX idx_job_name (JobName),
  INDEX idx_expires_at (ExpiresAt)
) COMMENT='Distributed lock mechanism for background jobs to prevent concurrent execution across multiple API instances';

SELECT 'Created crm_background_job_lock table' AS step2_7_complete;

-- ===========================================
-- STEP 3: INSERT SYSTEM TEMPLATES
-- ===========================================

INSERT IGNORE INTO crm_goal_template (Name, Description, GoalType, Timeframe, OwnerType, SuggestedTargetValue, IsSystemTemplate, IsActive)
VALUES
  ('Monthly Revenue Goal', 'Track monthly revenue targets', 'revenue', 'this_month', 'individual', 100000.00, 1, 1),
  ('Quarterly Deals Goal', 'Track deals closed per quarter', 'deals', 'this_quarter', 'team', 50.00, 1, 1),
  ('Weekly Activity Goal', 'Track weekly activity completion', 'activities', 'this_week', 'individual', 20.00, 1, 1),
  ('Annual Company Revenue', 'Company-wide annual revenue target', 'revenue', 'this_year', 'company', 1000000.00, 1, 1),
  ('Quarterly Team Performance', 'Team performance metrics for the quarter', 'performance', 'this_quarter', 'team', 100.00, 1, 1);

SELECT 'Inserted system goal templates' AS step3_complete;

-- ===========================================
-- STEP 4: INITIALIZE JOB LOCKS
-- ===========================================

INSERT IGNORE INTO crm_background_job_lock (JobName)
VALUES
  ('goal-snapshot-job'),
  ('goal-progress-calculation-job'),
  ('goal-notification-job');

SELECT 'Initialized background job locks' AS step4_complete;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

SELECT 'Migration 001_goal_interface_redesign.sql completed successfully!' AS migration_complete;
SELECT 'Summary:' AS summary;
SELECT '  - Extended crm_goal table with 5 new columns' AS change1;
SELECT '  - Created 7 new tables (progress_history, template, hierarchy_link, notification, comment, audit_log, job_lock)' AS change2;
SELECT '  - Inserted 5 system templates' AS change3;
SELECT '  - Initialized 3 job locks' AS change4;

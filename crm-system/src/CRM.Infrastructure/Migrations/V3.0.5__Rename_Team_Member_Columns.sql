-- =============================================================================
-- Migration: Rename crm_team_members columns to PascalCase
-- Version: V3.0.5
-- Description: Align team member columns with PascalCase naming
-- =============================================================================

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'team_id'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'TeamId'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_team_members CHANGE COLUMN team_id TeamId BIGINT NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'user_email'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'UserEmail'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_team_members CHANGE COLUMN user_email UserEmail VARCHAR(255) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'joined_at'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'JoinedAt'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_team_members CHANGE COLUMN joined_at JoinedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

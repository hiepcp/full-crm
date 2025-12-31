-- =============================================================================
-- Migration: Drop sales team user foreign keys
-- Version: V3.0.4
-- Description: Remove FK constraints from crm_sales_teams and crm_team_members to crm_user
-- =============================================================================

-- crm_sales_teams
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_sales_teams'
    AND CONSTRAINT_NAME = 'fk_teams_created_by'
);
SET @sql := IF(
  @fk_exists = 1,
  'ALTER TABLE crm_sales_teams DROP FOREIGN KEY fk_teams_created_by',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_sales_teams'
    AND CONSTRAINT_NAME = 'fk_teams_updated_by'
);
SET @sql := IF(
  @fk_exists = 1,
  'ALTER TABLE crm_sales_teams DROP FOREIGN KEY fk_teams_updated_by',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- crm_team_members
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND CONSTRAINT_NAME = 'fk_members_user'
);
SET @sql := IF(
  @fk_exists = 1,
  'ALTER TABLE crm_team_members DROP FOREIGN KEY fk_members_user',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

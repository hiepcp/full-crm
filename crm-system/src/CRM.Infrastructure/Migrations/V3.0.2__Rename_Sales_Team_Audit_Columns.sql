-- =============================================================================
-- Migration: Rename sales team audit columns to PascalCase
-- Version: V3.0.2
-- Description: Rename created/updated columns to match BaseEntity naming
-- =============================================================================

-- crm_sales_teams
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_sales_teams'
    AND COLUMN_NAME = 'created_by'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_sales_teams'
    AND COLUMN_NAME = 'CreatedBy'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_sales_teams CHANGE COLUMN created_by CreatedBy VARCHAR(255) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_sales_teams'
    AND COLUMN_NAME = 'created_on'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_sales_teams'
    AND COLUMN_NAME = 'CreatedOn'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_sales_teams CHANGE COLUMN created_on CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_sales_teams'
    AND COLUMN_NAME = 'updated_by'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_sales_teams'
    AND COLUMN_NAME = 'UpdatedBy'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_sales_teams CHANGE COLUMN updated_by UpdatedBy VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_sales_teams'
    AND COLUMN_NAME = 'updated_on'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_sales_teams'
    AND COLUMN_NAME = 'UpdatedOn'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_sales_teams CHANGE COLUMN updated_on UpdatedOn DATETIME NULL ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- crm_team_members
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'created_by'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'CreatedBy'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_team_members CHANGE COLUMN created_by CreatedBy VARCHAR(255) NOT NULL DEFAULT ''system''',
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
    AND COLUMN_NAME = 'created_on'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'CreatedOn'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_team_members CHANGE COLUMN created_on CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
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
    AND COLUMN_NAME = 'updated_by'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'UpdatedBy'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_team_members CHANGE COLUMN updated_by UpdatedBy VARCHAR(255) NULL',
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
    AND COLUMN_NAME = 'updated_on'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_team_members'
    AND COLUMN_NAME = 'UpdatedOn'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_team_members CHANGE COLUMN updated_on UpdatedOn DATETIME NULL ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

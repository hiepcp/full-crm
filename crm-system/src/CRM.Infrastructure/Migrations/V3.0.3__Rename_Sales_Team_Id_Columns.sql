-- =============================================================================
-- Migration: Rename sales_team_id columns to PascalCase
-- Version: V3.0.3
-- Description: Align sales team foreign keys with PascalCase naming
-- =============================================================================

-- crm_customer
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_customer'
    AND COLUMN_NAME = 'sales_team_id'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_customer'
    AND COLUMN_NAME = 'SalesTeamId'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_customer CHANGE COLUMN sales_team_id SalesTeamId BIGINT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- crm_deal
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_deal'
    AND COLUMN_NAME = 'sales_team_id'
);
SET @col_new_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crm_deal'
    AND COLUMN_NAME = 'SalesTeamId'
);
SET @sql := IF(
  @col_exists = 1 AND @col_new_exists = 0,
  'ALTER TABLE crm_deal CHANGE COLUMN sales_team_id SalesTeamId BIGINT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

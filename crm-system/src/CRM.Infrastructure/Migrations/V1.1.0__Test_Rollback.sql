-- =============================================================================
-- Test Rollback Migration
-- Version: V1.1.0
-- Description: This migration contains an intentional syntax error to test
--              rollback behavior. It should fail and trigger a transaction
--              rollback, leaving the database state unchanged.
-- =============================================================================

-- This is valid SQL
CREATE TABLE IF NOT EXISTS `TestRollbackTable` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY,
  `TestColumn` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INTENTIONAL SYNTAX ERROR: This will cause the migration to fail
-- The keyword "TABEL" is misspelled (should be "TABLE")
CREATE TABEL IF NOT EXISTS `ThisWillFail` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY
);

-- This SQL would execute if the error above didn't stop the migration
CREATE TABLE IF NOT EXISTS `ShouldNotBeCreated` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY,
  `Name` VARCHAR(255) NOT NULL
);

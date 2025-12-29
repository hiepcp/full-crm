-- CRM System - Drop All Tables Script
-- This script drops all CRM tables in the correct dependency order
-- Run this before running the setup script to reset the database

USE crm_sys_db;

-- Disable foreign key checks during table drops
SET FOREIGN_KEY_CHECKS = 0;

-- ===========================================
-- DROP JUNCTION/RELATIONSHIP TABLES FIRST
-- ===========================================

-- Tables with foreign keys (drop these first)
DROP TABLE IF EXISTS crm_pipeline_log;
DROP TABLE IF EXISTS crm_activity_attachment;
DROP TABLE IF EXISTS crm_deal_quotation;
DROP TABLE IF EXISTS crm_activity_participant;
DROP TABLE IF EXISTS crm_assignee;

-- ===========================================
-- DROP MAIN ENTITY TABLES
-- ===========================================

-- Tables that are referenced by foreign keys
DROP TABLE IF EXISTS crm_goal;
DROP TABLE IF EXISTS crm_appointment;
DROP TABLE IF EXISTS crm_email;
DROP TABLE IF EXISTS crm_activity;
DROP TABLE IF EXISTS crm_deal;
DROP TABLE IF EXISTS crm_quotation;
DROP TABLE IF EXISTS crm_contact;
DROP TABLE IF EXISTS crm_customer;
DROP TABLE IF EXISTS crm_lead;
DROP TABLE IF EXISTS crm_user;

-- ===========================================
-- VERIFY ALL TABLES DROPPED
-- ===========================================

-- Check if any CRM tables still exist
SELECT 'Checking for remaining CRM tables...' AS status;

-- Show remaining tables (should be none)
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'crm_sys_db'
  AND TABLE_NAME LIKE 'crm_%';

-- Count remaining tables
SELECT COUNT(*) as remaining_crm_tables
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'crm_sys_db'
  AND TABLE_NAME LIKE 'crm_%';

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ All CRM tables dropped successfully!' AS status;
SELECT 'Database is now clean and ready for fresh setup.' AS message;

-- Test MySQL Connection Script
-- Run this to verify your connection before running the full setup

SELECT '✅ MySQL Connection Successful!' AS status;
SELECT VERSION() AS mysql_version;
SELECT DATABASE() AS current_database;
SELECT USER() AS current_user;
SELECT NOW() AS current_time;

-- Check if database exists
SELECT 'Database crm_sys_db exists and is accessible' AS database_check;

-- Sample data for crm_user table
-- Generated from mockUsers.json
-- This script inserts 5 sample user records for testing and development

USE crm_sys_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Insert sample user data
INSERT INTO crm_user (
    Id, Email, FirstName, LastName, Role, Avatar, IsActive,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(101, 'henrik.kristensen@coreone.dk', 'Henrik Sig', 'Kristensen', 'Sales Director',
 'https://avatars.githubusercontent.com/u/101?v=4', 1,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com'),

(102, 'anders.rask@coreone.dk', 'Anders Hejgaard', 'Rask', 'Sales Manager',
 'https://avatars.githubusercontent.com/u/102?v=4', 1,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com'),

(103, 'karina.skaerlund@coreone.dk', 'Karina', 'Skærlund', 'Internal Sales Manager',
 'https://avatars.githubusercontent.com/u/103?v=4', 1,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com'),

(104, 'charlotte.rasmussen@coreone.dk', 'Charlotte Tidemand', 'Rasmussen', 'Sales Coordinator',
 'https://avatars.githubusercontent.com/u/104?v=4', 1,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com'),

(105, 'camilla.rommel@coreone.dk', 'Camilla Josefine Tang', 'Rommel', 'Sales Coordinator',
 'https://avatars.githubusercontent.com/u/105?v=4', 1,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Display success message
SELECT 'Sample user data inserted successfully. Total records: 5' AS message;

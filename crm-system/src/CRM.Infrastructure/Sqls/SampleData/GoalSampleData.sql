-- Sample data for crm_goal table
-- This script inserts 7 sample goal records for testing and development
-- Includes Individual, Team, and Company goals

USE crm_sys_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Insert sample goal data
INSERT INTO crm_goal (
    Id, Name, Description, TargetValue, StartDate, EndDate, OwnerUserId, OwnerType, OwnerId, Type, Timeframe, Recurring, Status, Progress,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
-- Individual Goals
(1001, 'Q1 Sales Target', 'Achieve $500,000 in sales for Q1 2025', 500000.00, '2025-01-01', '2025-03-31', 101, 'individual', 101, 'revenue', 'this_quarter', 0, 'active', 35.50,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-15 00:00:00', 'system@crm.com'),

(1002, 'Monthly Deal Closures', 'Close 15 deals this month', 15.00, '2025-01-01', '2025-01-31', 102, 'individual', 102, 'deals', 'this_month', 1, 'active', 66.67,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-20 00:00:00', 'system@crm.com'),

(1003, 'Weekly Activity Goal', 'Complete 50 activities per week', 50.00, '2025-01-06', '2025-01-12', 103, 'individual', 103, 'activities', 'this_week', 1, 'active', 78.00,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-10 00:00:00', 'system@crm.com'),

-- Team Goals
(1004, 'Team Lead Conversion', 'Convert 30% of leads to customers quarterly', 30.00, '2025-01-01', '2025-03-31', NULL, 'team', NULL, 'performance', 'this_quarter', 0, 'active', 22.50,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-25 00:00:00', 'system@crm.com'),

(1005, 'Team Revenue Target', 'Achieve $2M in team revenue for Q1', 2000000.00, '2025-01-01', '2025-03-31', NULL, 'team', NULL, 'revenue', 'this_quarter', 0, 'active', 45.20,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-15 00:00:00', 'system@crm.com'),

-- Company Goals
(1006, 'Annual Revenue Goal', 'Reach $10M in annual revenue', 10000000.00, '2025-01-01', '2025-12-31', NULL, 'company', NULL, 'revenue', 'this_year', 0, 'active', 12.50,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-20 00:00:00', 'system@crm.com'),

(1007, 'Customer Satisfaction', 'Maintain 4.8+ average customer satisfaction', 4.80, '2025-01-01', '2025-12-31', NULL, 'company', NULL, 'performance', 'this_year', 0, 'active', 4.65,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-25 00:00:00', 'system@crm.com');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Display success message
SELECT 'Sample goal data inserted successfully. Total records: 7' AS message;
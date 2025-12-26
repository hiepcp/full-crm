-- SQL Script to insert Lead, Deal, Activity, and Contact pages into menus table
-- Based on existing customers menu structure (Id=14, ParentId=13)

-- Note: Adjust the following values based on your actual database:
-- - Id values (15, 16, 17, 18) - ensure they don't conflict with existing records
-- - ParentId (13) - assuming same parent as customers menu
-- - ResourceId - set appropriate resource IDs if you have them, or NULL
-- - AppId (3) - same as customers menu
-- - Icon values - choose appropriate icons for your UI library

-- Insert Lead page
INSERT INTO `menus` (`Id`, `ParentId`, `Code`, `Name`, `Icon`, `HideInMenu`, `Url`, `ResourceId`, `AppId`, `SortOrder`, `CanAccess`) 
VALUES (15, 13, 'leads', 'Leads', 'user-add', 0, '/leads', NULL, 3, 2, 0);

-- Insert Deal page
INSERT INTO `menus` (`Id`, `ParentId`, `Code`, `Name`, `Icon`, `HideInMenu`, `Url`, `ResourceId`, `AppId`, `SortOrder`, `CanAccess`) 
VALUES (16, 13, 'deals', 'Deals', 'dollar', 0, '/deals', NULL, 3, 3, 0);

-- Insert Activity page
INSERT INTO `menus` (`Id`, `ParentId`, `Code`, `Name`, `Icon`, `HideInMenu`, `Url`, `ResourceId`, `AppId`, `SortOrder`, `CanAccess`) 
VALUES (17, 13, 'activities', 'Activities', 'calendar', 0, '/activities', NULL, 3, 4, 0);

-- Insert Contact page
INSERT INTO `menus` (`Id`, `ParentId`, `Code`, `Name`, `Icon`, `HideInMenu`, `Url`, `ResourceId`, `AppId`, `SortOrder`, `CanAccess`) 
VALUES (18, 13, 'contacts', 'Contacts', 'contacts', 0, '/contacts', NULL, 3, 5, 0);

-- Verify the inserted records
SELECT * FROM `menus` WHERE `Code` IN ('leads', 'deals', 'activities', 'contacts');


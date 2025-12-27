-- SQL Script to insert Lead, Deal, Activity, and Contact pages into menus table
-- Using AUTO_INCREMENT (without specifying Id)
-- Based on existing customers menu structure

-- Note: Adjust the following values based on your actual database:
-- - ParentId (13) - assuming same parent as customers menu
-- - ResourceId - set appropriate resource IDs if you have them, or NULL
-- - AppId (3) - same as customers menu
-- - SortOrder - order in which menus appear
-- - Icon values - choose appropriate icons for your UI library

-- Insert Lead page
INSERT INTO `menus` (`ParentId`, `Code`, `Name`, `Icon`, `HideInMenu`, `Url`, `ResourceId`, `AppId`, `SortOrder`, `CanAccess`) 
VALUES (13, 'leads', 'Leads', 'user-add', 0, '/leads', NULL, 3, 2, 0);

-- Insert Deal page
INSERT INTO `menus` (`ParentId`, `Code`, `Name`, `Icon`, `HideInMenu`, `Url`, `ResourceId`, `AppId`, `SortOrder`, `CanAccess`) 
VALUES (13, 'deals', 'Deals', 'dollar', 0, '/deals', NULL, 3, 3, 0);

-- Insert Activity page
INSERT INTO `menus` (`ParentId`, `Code`, `Name`, `Icon`, `HideInMenu`, `Url`, `ResourceId`, `AppId`, `SortOrder`, `CanAccess`) 
VALUES (13, 'activities', 'Activities', 'calendar', 0, '/activities', NULL, 3, 4, 0);

-- Insert Contact page
INSERT INTO `menus` (`ParentId`, `Code`, `Name`, `Icon`, `HideInMenu`, `Url`, `ResourceId`, `AppId`, `SortOrder`, `CanAccess`) 
VALUES (13, 'contacts', 'Contacts', 'contacts', 0, '/contacts', NULL, 3, 5, 0);

-- Verify the inserted records
SELECT * FROM `menus` WHERE `Code` IN ('leads', 'deals', 'activities', 'contacts') ORDER BY `SortOrder`;


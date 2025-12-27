-- SQL Script to insert Goals page into menus table
-- Based on existing structure (ParentId=13 for main CRM items)

-- Note: Adjust the Id (19) if it conflicts with existing records
INSERT INTO `menus` (`Id`, `ParentId`, `Code`, `Name`, `Icon`, `HideInMenu`, `Url`, `ResourceId`, `AppId`, `SortOrder`, `CanAccess`) 
VALUES (19, 13, 'goals', 'Goals', 'flag', 0, '/goals', NULL, 3, 6, 0);

-- Verify the inserted record
SELECT * FROM `menus` WHERE `Code` = 'goals';


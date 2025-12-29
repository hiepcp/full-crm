INSERT INTO applications (AppCode, AppName) VALUES
('ComplApi', 'Compliance system'),
('Qarma', 'Qarma system');

INSERT INTO users (Email, FullName) VALUES
('thiennh@response.com.vn', 'Nguyen Hoang Thien');

INSERT INTO actions (Name, Code) VALUES
('GetAll', 'ReadAll'),
('GetById', 'ReadOne'),
('Add', 'Create'),
('Update', 'Update'),
('Delete', 'Delete');

-- Add sample resources for ApiA and ApiB
INSERT INTO resources (AppId, Name, Code)
VALUES
( (SELECT AppId FROM applications WHERE AppCode='ComplApi'), 'Product', 'Product' ),
( (SELECT AppId FROM applications WHERE AppCode='Qarma'), 'Product', 'Product' );

INSERT INTO resources (AppId, Code, Name) VALUES
(1, 'AllCompliance', 'All compliances'),
(1, 'ComplianceDetail', 'Compliance detail'),
(1, 'DocumentType', 'Document type'),
(1, 'Templates', 'Templates');

-- Auto-generate permissions for all resources x all actions (for our two resources)
INSERT INTO permissions (ResourceId, ActionId, Code)
SELECT r.ResourceId, a.ActionId, CONCAT(r.Code, '.', a.Code)
FROM resources r
CROSS JOIN actions a
WHERE r.AppId IN (
  SELECT AppId FROM applications WHERE AppCode IN ('ComplApi','QarmaApi')
);

-- Insert roles per app
INSERT INTO roles (AppId, RoleName, Description)
SELECT a.AppId, r.RoleName, r.RoleName
FROM applications a
CROSS JOIN ( SELECT 'ProductReader' AS RoleName
             UNION ALL SELECT 'ProductEditor'
             UNION ALL SELECT 'Admin' ) r
WHERE a.AppCode IN ('ComplApi', 'Qarma'); -- create same role names for both apps (you can adjust)

-- Assign permissions to roles for each app separately
-- ProductReader => ReadAll, ReadOne
INSERT INTO role_permissions (RoleId, PermissionId)
SELECT r.RoleId, p.PermissionId
FROM roles r
JOIN applications a ON r.AppId = a.AppId
JOIN permissions p ON p.ResourceId IN (
    SELECT ResourceId FROM resources WHERE AppId = a.AppId AND Code = 'Product'
)
JOIN actions act ON p.ActionId = act.ActionId
WHERE r.RoleName = 'ProductReader' AND act.Code IN ('ReadAll','ReadOne');

-- ProductEditor => Create, Update
INSERT INTO role_permissions (RoleId, PermissionId)
SELECT r.RoleId, p.PermissionId
FROM roles r
JOIN applications a ON r.AppId = a.AppId
JOIN permissions p ON p.ResourceId IN (
    SELECT ResourceId FROM resources WHERE AppId = a.AppId AND Code = 'Product'
)
JOIN actions act ON p.ActionId = act.ActionId
WHERE r.RoleName = 'ProductEditor' AND act.Code IN ('Create','Update');

-- Admin => all permissions for app resource(s)
INSERT INTO role_permissions (RoleId, PermissionId)
SELECT r.RoleId, p.PermissionId
FROM roles r
JOIN applications a ON r.AppId = a.AppId
JOIN permissions p ON p.ResourceId IN (
    SELECT ResourceId FROM resources WHERE AppId = a.AppId
)
WHERE r.RoleName = 'Admin';

-- Assign sample data:
-- User "thiennh" là Admin của ApiA
INSERT INTO user_roles (UserId, RoleId, AppId)
SELECT u.UserId, r.RoleId, a.AppId
FROM users u, roles r, applications a
WHERE u.Email = 'thiennh@response.com.vn' AND r.RoleName = 'Admin' AND a.AppCode = 'ComplApi';

-- User "thiennh" là ProductReader của ApiB
INSERT INTO user_roles (UserId, RoleId, AppId)
SELECT u.UserId, r.RoleId, a.AppId
FROM users u, roles r, applications a
WHERE u.Email = 'thiennh@response.com.vn' AND r.RoleName = 'ProductReader' AND a.AppCode = 'Qarma';


-- Menus for Compliance system (AppId=1)
-- Root group (không gắn Resource, chỉ grouping)
INSERT INTO menus (ParentId, Code, Name, Icon, HideInMenu, Url, ResourceId, AppId, SortOrder)
VALUES
(NULL, 'compliance-system', 'Compliance system', 'home', FALSE, NULL, NULL, 1, 0);

-- Level 1 children
INSERT INTO menus (ParentId, Code, Name, Icon, HideInMenu, Url, ResourceId, AppId, SortOrder)
VALUES
(1, 'all-compliances', 'All compliances', 'topic', FALSE, '/all-compliances', 1, 1, 1),
(1, 'compliance-detail', 'Compliance detail', 'topic', FALSE, '/compliance-detail', 2, 1, 2),
(1, 'compliance-setup', 'Compliance setup', 'settings', FALSE, NULL, NULL, 1, 3);

-- Level 2 under Compliance setup
INSERT INTO menus (ParentId, Code, Name, Icon, HideInMenu, Url, ResourceId, AppId, SortOrder)
VALUES
(4, 'document-type', 'Document type', 'attach_file', FALSE, '/document-type', 3, 1, 1),
(4, 'templates', 'Templates', 'attach_file', FALSE, '/templates', 4, 1, 2);

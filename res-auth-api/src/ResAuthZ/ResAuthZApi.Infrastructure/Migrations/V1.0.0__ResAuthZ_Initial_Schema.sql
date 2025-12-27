-- =============================================================================
-- ResAuthZ Initial Schema Migration
-- Version: V1.0.0
-- Description: Initial database schema for ResAuthZ authorization service
-- Tables: applications, users, resources, actions, permissions, roles,
--         role_permissions, user_roles, menus, resource_actions
-- Procedures: sp_get_role_permissions, sp_get_user_menus,
--             sp_get_user_menus_with_permissions, sp_get_user_permissions,
--             sp_update_role_permissions
-- =============================================================================

-- =============================================================================
-- TABLES
-- =============================================================================

-- =========================
-- 1. Applications
-- =========================
CREATE TABLE applications (
    AppId INT AUTO_INCREMENT PRIMARY KEY,
    AppCode VARCHAR(50) NOT NULL UNIQUE,
    AppName VARCHAR(200) NOT NULL
);

-- =========================
-- 2. Users
-- =========================
CREATE TABLE users (
    UserId INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(200) NOT NULL UNIQUE,
    UserName VARCHAR(200) NULL,
    FullName VARCHAR(200) NULL
);

-- =========================
-- 3. Resources (scoped per App)
-- =========================
CREATE TABLE resources (
    ResourceId INT AUTO_INCREMENT PRIMARY KEY,
    AppId INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Code VARCHAR(100) NOT NULL,
    Description VARCHAR(255),
    CONSTRAINT uq_resources_app_code UNIQUE (AppId, Code),
    FOREIGN KEY (AppId) REFERENCES applications(AppId) ON DELETE CASCADE
);

-- =========================
-- 4. Actions (global)
-- =========================
CREATE TABLE actions (
    ActionId INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Code VARCHAR(100) NOT NULL UNIQUE
);

-- =========================
-- 5. Permissions (Resource + Action)
--    Code = ResourceCode + '.' + ActionCode (e.g. Product.ReadAll)
-- =========================
CREATE TABLE permissions (
    PermissionId INT AUTO_INCREMENT PRIMARY KEY,
    ResourceId INT NOT NULL,
    ActionId INT NOT NULL,
    Code VARCHAR(150) NOT NULL,
    Description VARCHAR(255),
    CONSTRAINT uq_permissions_res_action UNIQUE (ResourceId, ActionId),
    CONSTRAINT uq_permissions_code UNIQUE (Code),
    FOREIGN KEY (ResourceId) REFERENCES resources(ResourceId) ON DELETE CASCADE,
    FOREIGN KEY (ActionId) REFERENCES actions(ActionId) ON DELETE CASCADE
);

-- =========================
-- 6. Roles (scoped per App)
-- =========================
CREATE TABLE roles (
    RoleId INT AUTO_INCREMENT PRIMARY KEY,
    AppId INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(255),
    CONSTRAINT uq_roles_app_role UNIQUE (AppId, RoleName),
    FOREIGN KEY (AppId) REFERENCES applications(AppId) ON DELETE CASCADE
);

-- =========================
-- 7. RolePermissions (mapping)
-- =========================
CREATE TABLE role_permissions (
    RoleId INT NOT NULL,
    PermissionId INT NOT NULL,
    PRIMARY KEY (RoleId, PermissionId),
    FOREIGN KEY (RoleId) REFERENCES roles(RoleId) ON DELETE CASCADE,
    FOREIGN KEY (PermissionId) REFERENCES permissions(PermissionId) ON DELETE CASCADE
);

-- =========================
-- 8. UserRoles (assign user to role within app)
-- =========================
CREATE TABLE user_roles (
    UserId INT NOT NULL,
    RoleId INT NOT NULL,
    AppId INT NOT NULL,
    PRIMARY KEY (UserId, RoleId, AppId),
    FOREIGN KEY (UserId) REFERENCES users(UserId),
    FOREIGN KEY (RoleId) REFERENCES roles(RoleId),
    FOREIGN KEY (AppId) REFERENCES applications(AppId)
);

-- =========================
-- 9. Menus
-- =========================
CREATE TABLE menus (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ParentId INT NULL,
    Code VARCHAR(100) NOT NULL UNIQUE,
    Name VARCHAR(200) NOT NULL,
    Icon VARCHAR(100) NULL,
    HideInMenu BOOLEAN NOT NULL DEFAULT FALSE,
    Url VARCHAR(255) NULL,
    ResourceId INT NULL,
    AppId INT NOT NULL,
    SortOrder INT DEFAULT 0,
    CONSTRAINT fk_menu_parent FOREIGN KEY (ParentId) REFERENCES menus(Id),
    CONSTRAINT fk_menu_resource FOREIGN KEY (ResourceId) REFERENCES resources(ResourceId),
    CONSTRAINT fk_menu_app FOREIGN KEY (AppId) REFERENCES applications(AppId)
);

-- =========================
-- 10. ResourceActions
-- =========================
CREATE TABLE resource_actions (
    ResourceId INT NOT NULL,
    ActionId INT NOT NULL,
    PRIMARY KEY (ResourceId, ActionId),
    FOREIGN KEY (ResourceId) REFERENCES resources(ResourceId),
    FOREIGN KEY (ActionId) REFERENCES actions(ActionId)
);

-- =============================================================================
-- STORED PROCEDURES
-- =============================================================================

DELIMITER //

CREATE PROCEDURE sp_get_role_permissions(
    IN p_roleId INT,
    IN p_appCode VARCHAR(50)
)
BEGIN
    /*
      Trả ra danh sách resources, actions
      - enabled = resource có action này không (mapping resource_actions)
      - granted = role có permission này không
    */
    SELECT
        r.ResourceId,
        r.Code        AS ResourceCode,
        r.Name        AS ResourceName,
        a.ActionId,
        a.Code        AS ActionCode,
        a.Name        AS ActionName,
        CASE
            WHEN ra.ResourceId IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS Enabled,
        CASE
            WHEN rp.RoleId IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS Granted,
        p.PermissionId,
        p.Code AS PermissionCode
    FROM resources r
    CROSS JOIN actions a
    LEFT JOIN resource_actions ra
           ON ra.ResourceId = r.ResourceId
          AND ra.ActionId = a.ActionId
    LEFT JOIN permissions p
           ON p.ResourceId = r.ResourceId
          AND p.ActionId = a.ActionId
    LEFT JOIN role_permissions rp
           ON rp.PermissionId = p.PermissionId
          AND rp.RoleId = p_roleId
    LEFT JOIN applications ap ON r.AppId = ap.AppId
    WHERE ap.AppCode = p_appCode
    ORDER BY r.ResourceId, a.ActionId;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE `sp_get_user_menus`(
    IN p_appCode VARCHAR(50),
    IN p_email VARCHAR(200)
)
BEGIN
    -- Lấy menu có resource mà user có quyền
    SELECT DISTINCT
        m.Id,
        m.ParentId,
        m.Code,
        m.Name,
        m.Icon,
        m.HideInMenu,
        m.Url,
        m.SortOrder,
        TRUE AS CanAccess
    FROM users u
    JOIN user_roles ur ON u.Id = ur.UserId
    JOIN applications a ON ur.AppId = a.AppId
    JOIN roles r ON ur.RoleId = r.RoleId
    JOIN role_permissions rp ON r.RoleId = rp.RoleId
    JOIN permissions p ON rp.PermissionId = p.PermissionId
    JOIN resources res ON p.ResourceId = res.ResourceId
    JOIN menus m ON m.ResourceId = res.ResourceId AND m.AppId = a.AppId
    WHERE u.Email = p_email
      AND a.AppCode = p_appCode

    UNION

    -- Lấy menu group cha (không có resource) để build cây menu
    SELECT DISTINCT
        m.Id,
        m.ParentId,
        m.Code,
        m.Name,
        m.Icon,
        m.HideInMenu,
        m.Url,
        m.SortOrder,
        TRUE AS CanAccess
    FROM menus m
    JOIN applications a ON m.AppId = a.AppId
    WHERE m.ResourceId IS NULL
      AND a.AppCode = p_appCode

    ORDER BY ParentId, SortOrder;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE `sp_get_user_menus_with_permissions`(
    IN p_appCode VARCHAR(50),
    IN p_email VARCHAR(200)
)
BEGIN
    -- Lấy menu có resource mà user có quyền + gom permissions
    SELECT DISTINCT
        m.Id,
        m.ParentId,
        m.Code,
        m.Name,
        m.Icon,
        m.HideInMenu,
        m.Url,
        m.SortOrder,
        TRUE AS CanAccess,
        COALESCE(
            (
                SELECT JSON_ARRAYAGG(a.Code)
                FROM role_permissions rp2
                JOIN permissions p2 ON rp2.PermissionId = p2.PermissionId
                JOIN actions a ON p2.ActionId = a.ActionId
                JOIN roles r2 ON rp2.RoleId = r2.RoleId
                JOIN user_roles ur2 ON r2.RoleId = ur2.RoleId
                JOIN users u2 ON ur2.UserId = u2.Id
                WHERE p2.ResourceId = m.ResourceId
                  AND u2.Email = p_email
            ),
            JSON_ARRAY()
        ) AS Permissions
    FROM users u
    JOIN user_roles ur ON u.Id = ur.UserId
    JOIN applications a ON ur.AppId = a.AppId
    JOIN roles r ON ur.RoleId = r.RoleId
    JOIN role_permissions rp ON r.RoleId = rp.RoleId
    JOIN permissions p ON rp.PermissionId = p.PermissionId
    JOIN resources res ON p.ResourceId = res.ResourceId
    JOIN menus m ON m.ResourceId = res.ResourceId AND m.AppId = a.AppId
    WHERE u.Email = p_email
      AND a.AppCode = p_appCode

    UNION

    -- Lấy menu group cha (không có resource) để build cây menu
    SELECT DISTINCT
        m.Id,
        m.ParentId,
        m.Code,
        m.Name,
        m.Icon,
        m.HideInMenu,
        m.Url,
        m.SortOrder,
        TRUE AS CanAccess,
        JSON_ARRAY() AS Permissions
    FROM menus m
    JOIN applications a ON m.AppId = a.AppId
    WHERE m.ResourceId IS NULL
      AND a.AppCode = p_appCode

    ORDER BY ParentId, SortOrder;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE sp_get_user_permissions(
    IN p_AppCode VARCHAR(100),
    IN p_Email VARCHAR(255)
)
BEGIN
    SELECT DISTINCT p.Code as PermissionCode
    FROM Users u
    JOIN User_Roles ur ON u.Id = ur.UserId
    JOIN Roles r ON ur.RoleId = r.RoleId
    JOIN Applications a ON r.AppId = a.AppId
    JOIN Role_Permissions rp ON r.RoleId = rp.RoleId
    JOIN Permissions p ON rp.PermissionId = p.PermissionId
    WHERE u.Email = p_Email
      AND a.AppCode = p_AppCode;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE sp_update_role_permissions(
    IN p_roleId INT,
    IN p_permissionIds TEXT
)
proc: BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE curPermissionId VARCHAR(50);
    DECLARE curPos INT DEFAULT 1;
    DECLARE strLen INT;

    -- Xóa tất cả quyền cũ của role
    DELETE FROM role_permissions WHERE RoleId = p_roleId;

    SET strLen = CHAR_LENGTH(p_permissionIds);

    -- Nếu chuỗi rỗng thì thoát
    IF strLen = 0 OR p_permissionIds IS NULL THEN
        LEAVE proc;
    END IF;

    -- Lặp qua chuỗi CSV
    WHILE curPos > 0 DO
        SET curPos = INSTR(p_permissionIds, ',');

        IF curPos > 0 THEN
            SET curPermissionId = SUBSTRING(p_permissionIds, 1, curPos - 1);
            SET p_permissionIds = SUBSTRING(p_permissionIds, curPos + 1);
        ELSE
            SET curPermissionId = p_permissionIds;
        END IF;

        -- Insert nếu có giá trị
        IF TRIM(curPermissionId) <> '' THEN
            INSERT INTO role_permissions (RoleId, PermissionId)
            VALUES (p_roleId, CAST(curPermissionId AS UNSIGNED));
        END IF;
    END WHILE;

END //

DELIMITER ;

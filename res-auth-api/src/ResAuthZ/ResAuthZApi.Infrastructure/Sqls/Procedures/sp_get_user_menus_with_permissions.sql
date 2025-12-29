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

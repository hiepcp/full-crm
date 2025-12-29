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

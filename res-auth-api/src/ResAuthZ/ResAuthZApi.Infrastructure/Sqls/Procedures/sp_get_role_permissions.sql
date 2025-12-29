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

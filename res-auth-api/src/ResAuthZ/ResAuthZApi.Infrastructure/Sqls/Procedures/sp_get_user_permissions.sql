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
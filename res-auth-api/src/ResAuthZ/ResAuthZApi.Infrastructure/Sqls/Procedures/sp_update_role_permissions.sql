DELIMITER $$
CREATE PROCEDURE sp_update_role_permissions(
    IN p_roleId INT,
    IN p_permissionIds TEXT
)
proc: BEGIN  -- Thêm label 'proc' ở đây
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
    
END $$
DELIMITER ;

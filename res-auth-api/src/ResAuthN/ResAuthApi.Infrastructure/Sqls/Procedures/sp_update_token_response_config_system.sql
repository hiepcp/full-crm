DELIMITER //
CREATE PROCEDURE `sp_update_token_response_config_system`(
	IN `p_Id` INT,
	IN `p_AccessToken` TEXT,
	IN `p_TokenExpiry` BIGINT
)
BEGIN
    UPDATE response_config_system
    SET 
        AccessToken = p_AccessToken,
        TokenExpiry = p_TokenExpiry
    WHERE Id = p_Id;
END//
DELIMITER ;
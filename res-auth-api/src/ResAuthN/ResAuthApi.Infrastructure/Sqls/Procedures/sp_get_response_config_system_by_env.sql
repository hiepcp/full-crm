DELIMITER //
CREATE PROCEDURE `sp_get_response_config_system_by_env`(
    IN `p_AppName` VARCHAR(50),
	IN `p_Env` INT,
	IN `p_ServiceName` VARCHAR(255)
)
BEGIN
    SELECT * 
    FROM response_config_system
    WHERE AppName = p_AppName 
     AND Env = p_Env 
	 AND ServiceName = p_ServiceName;
END//
DELIMITER ;

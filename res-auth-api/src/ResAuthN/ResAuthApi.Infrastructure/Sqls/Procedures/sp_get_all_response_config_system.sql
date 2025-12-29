DELIMITER //
CREATE PROCEDURE `sp_get_all_response_config_system`()
BEGIN
    SELECT * FROM response_config_system;
END//
DELIMITER ;

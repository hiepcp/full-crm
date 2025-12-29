DELIMITER //
CREATE PROCEDURE `sp_get_response_config_system_by_id`(
    IN p_Id INT
)
BEGIN
    SELECT * 
    FROM response_config_system
    WHERE id = p_Id;
END//
DELIMITER ;
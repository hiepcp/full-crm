-- =============================================================================
-- ResAuthN Initial Schema Migration
-- Version: V1.0.0
-- Description: Initial database schema for ResAuthN authentication service
-- Tables: users, refresh_tokens, response_config_system
-- Procedures: sp_get_all_response_config_system, sp_get_response_config_system_by_env,
--             sp_get_response_config_system_by_id, sp_update_token_response_config_system
-- =============================================================================

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(255) DEFAULT NULL,
  `Email` VARCHAR(50) DEFAULT NULL,
  `FirstName` VARCHAR(255) DEFAULT NULL,
  `LastName` VARCHAR(255) DEFAULT NULL,
  `AvatarUrl` VARCHAR(255) DEFAULT NULL,
  `CreatedBy` VARCHAR(50) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Active` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UK_Email` (`Email`)
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    Id CHAR(36) NOT NULL PRIMARY KEY, -- UUID
    TokenHash VARCHAR(128) NOT NULL UNIQUE,
    Email VARCHAR(256) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReplacedByHash VARCHAR(128),
    RemoteIp VARCHAR(64),
    UserAgent VARCHAR(512),
    IsRevoked BOOLEAN NOT NULL DEFAULT FALSE,
    RevokedAt DATETIME,
    RevokeReason VARCHAR(255),
    ClientType VARCHAR(50) NOT NULL DEFAULT 'web'
);

CREATE INDEX IX_RefreshTokens_Email ON refresh_tokens (Email);
CREATE INDEX IX_RefreshTokens_ExpiresAt ON refresh_tokens (ExpiresAt);

-- Response config system table
CREATE TABLE IF NOT EXISTS `response_config_system` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `AppName` VARCHAR(255) DEFAULT NULL,
  `Env` INT DEFAULT NULL, -- 1: Dev, 2: SandBox, 3: Production, etc.
  `ServiceName` VARCHAR(255) DEFAULT NULL, -- e.g. "Dynamics", "SharePoint", "Graph-based"
  `AuthUrl` VARCHAR(255) DEFAULT NULL,
  `TenantId` VARCHAR(40) DEFAULT NULL,
  `ClientId` VARCHAR(255) DEFAULT NULL,
  `ClientSecret` TEXT DEFAULT NULL,
  `GrantType` VARCHAR(50) DEFAULT NULL,
  `Resource` VARCHAR(255) DEFAULT NULL,
  `Scope` TEXT DEFAULT NULL,
  `AccessToken` varchar(2000) DEFAULT NULL,
  `TokenExpiry` bigint DEFAULT NULL,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
);

-- =============================================================================
-- STORED PROCEDURES
-- =============================================================================

DELIMITER //
CREATE PROCEDURE `sp_get_all_response_config_system`()
BEGIN
    SELECT * FROM response_config_system;
END//
DELIMITER ;

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

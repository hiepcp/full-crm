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

INSERT INTO response_config_system (
  AppName,	
  AuthUrl,
  TenantId,
  ClientId,
  ClientSecret,
  GrantType,
  Resource,
  Scope,
  Env,
  ServiceName
) VALUES (
  'ResAuthApi',
  'https://login.microsoftonline.com',
  'f286906e-f0af-4d95-8ac0-76cbdfb897fa',
  'b62fe2d9-d42c-4d40-a9fd-26438050b9ae',
  'EvorNVHDNPx4016hOZWXsrSYfLL91uEeCiK/ZsdMy86b80XJjXle43NjGNszrJ1wowR10bZDdefg9x45C40Fcp6fygXFgBaaml2FHASmAnVO1p567Gq694ikLNwMZXER4U1uhgT7tMMEJR9oHfNO0Q==',
  'client_credentials',
  'https://graph.microsoft.com',
  'https://graph.microsoft.com/.default',
  1,
  'dynamics'
);

CREATE TABLE IF NOT EXISTS crm_user (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  Email VARCHAR(320) NOT NULL UNIQUE,
  FirstName VARCHAR(128) NULL,
  LastName VARCHAR(128) NULL,
  Role VARCHAR(100) NULL,
  Avatar VARCHAR(500) NULL,
  IsActive TINYINT(1) NOT NULL DEFAULT 1,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_user_email (Email),
  INDEX idx_crm_user_first_name_last_name (FirstName, LastName),
  INDEX idx_crm_user_role (Role),
  INDEX idx_crm_user_is_active (IsActive),
  INDEX idx_crm_user_created_on (CreatedOn),
  INDEX idx_crm_user_updated_on (UpdatedOn)
);

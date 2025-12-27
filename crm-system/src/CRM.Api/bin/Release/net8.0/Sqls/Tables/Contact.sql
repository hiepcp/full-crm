CREATE TABLE IF NOT EXISTS crm_contact (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  CustomerId BIGINT NULL,
  Salutation VARCHAR(20) NULL,
  FirstName VARCHAR(128) NULL,
  MiddleName VARCHAR(128) NULL,
  LastName VARCHAR(128) NULL,
  Email VARCHAR(320) NULL,
  Phone VARCHAR(64) NULL,
  MobilePhone VARCHAR(64) NULL,
  Fax VARCHAR(64) NULL,
  JobTitle VARCHAR(255) NULL,
  Address TEXT NULL,
  Notes TEXT NULL,
  IsPrimary TINYINT(1) NOT NULL DEFAULT 0,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_contact_customer_id (CustomerId),
  INDEX idx_crm_contact_email (Email),
  INDEX idx_crm_contact_first_name_last_name (FirstName, LastName),
  INDEX idx_crm_contact_is_primary (IsPrimary),
  INDEX idx_crm_contact_created_on (CreatedOn),
  INDEX idx_crm_contact_updated_on (UpdatedOn),

  FOREIGN KEY (CustomerId) REFERENCES crm_customer(Id) ON DELETE SET NULL
);

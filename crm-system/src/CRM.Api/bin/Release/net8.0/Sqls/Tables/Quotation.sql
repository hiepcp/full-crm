CREATE TABLE IF NOT EXISTS crm_quotation (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  QuotationNumber VARCHAR(50) NOT NULL UNIQUE,
  Name VARCHAR(255) NOT NULL,
  Description TEXT NULL,
  TotalAmount DECIMAL(15,2) NULL,
  Status ENUM('draft','sent','accepted','rejected','expired','cancelled') NOT NULL DEFAULT 'draft',
  ValidUntil DATE NULL,
  Notes TEXT NULL,
  CustomerId BIGINT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_quotation_quotation_number (QuotationNumber),
  INDEX idx_crm_quotation_status (Status),
  INDEX idx_crm_quotation_valid_until (ValidUntil),
  INDEX idx_crm_quotation_total_amount (TotalAmount),
  INDEX idx_crm_quotation_customer (CustomerId),
  INDEX idx_crm_quotation_created_on (CreatedOn),
  INDEX idx_crm_quotation_updated_on (UpdatedOn),

  FOREIGN KEY (CustomerId) REFERENCES crm_customer(Id) ON DELETE SET NULL
);

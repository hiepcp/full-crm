CREATE TABLE IF NOT EXISTS crm_deal_quotation (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  DealId BIGINT NOT NULL,
  QuotationNumber VARCHAR(50) NOT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,

  INDEX idx_crm_deal_quotation_deal_id (DealId),
  INDEX idx_crm_deal_quotation_quotation_number (QuotationNumber),
  INDEX idx_crm_deal_quotation_created_on (CreatedOn),

  UNIQUE KEY unique_deal_id_quotation_number (DealId, QuotationNumber),
  FOREIGN KEY (DealId) REFERENCES crm_deal(Id) ON DELETE CASCADE
);

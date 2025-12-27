CREATE TABLE IF NOT EXISTS crm_pipeline_log (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  DealId BIGINT NOT NULL,
  OldStage VARCHAR(50) NULL,
  NewStage VARCHAR(50) NOT NULL,
  ChangedBy VARCHAR(255) NULL,
  ChangedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Notes TEXT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_pipeline_log_deal_id (DealId),
  INDEX idx_crm_pipeline_log_old_stage (OldStage),
  INDEX idx_crm_pipeline_log_new_stage (NewStage),
  INDEX idx_crm_pipeline_log_changed_by (ChangedBy),
  INDEX idx_crm_pipeline_log_changed_at (ChangedAt),
  INDEX idx_crm_pipeline_log_created_on (CreatedOn),
  INDEX idx_crm_pipeline_log_updated_on (UpdatedOn),

  FOREIGN KEY (DealId) REFERENCES crm_deal(Id) ON DELETE CASCADE
);

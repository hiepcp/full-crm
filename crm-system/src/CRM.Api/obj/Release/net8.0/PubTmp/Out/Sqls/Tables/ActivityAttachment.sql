CREATE TABLE IF NOT EXISTS crm_activity_attachment (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  IdRef VARCHAR(255) NULL,
  ActivityId BIGINT NOT NULL,
  FileName VARCHAR(255) NOT NULL,
  FilePath VARCHAR(500) NOT NULL,
  FileSize BIGINT NULL,
  MimeType VARCHAR(100) NULL,
  UpdatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,

  INDEX idx_crm_activity_attachment_activity (ActivityId),
  INDEX idx_crm_activity_attachment_fileName (FileName),
  INDEX idx_crm_activity_attachment_mimeType (MimeType),
  INDEX idx_crm_activity_attachment_updated_on (UpdatedOn),
  INDEX idx_crm_activity_attachment_createdOn (CreatedOn),

  FOREIGN KEY (ActivityId) REFERENCES crm_activity(Id) ON DELETE CASCADE
);

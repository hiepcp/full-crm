CREATE TABLE IF NOT EXISTS crm_assignee (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  RelationType VARCHAR(50) NOT NULL,
  RelationId BIGINT NOT NULL,
  UserId BIGINT NOT NULL,
  Role VARCHAR(100) NOT NULL DEFAULT 'collaborator',
  AssignedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Notes TEXT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_assignee_relation_type (RelationType),
  INDEX idx_crm_assignee_relation_id (RelationId),
  INDEX idx_crm_assignee_user_id (UserId),
  INDEX idx_crm_assignee_role (Role),
  INDEX idx_crm_assignee_assigned_at (AssignedAt),
  INDEX idx_crm_assignee_created_on (CreatedOn),

  UNIQUE KEY unique_assignee_relation_type_relation_id_user_id (RelationType, RelationId, UserId),
  FOREIGN KEY (UserId) REFERENCES crm_user(Id) ON DELETE CASCADE
);

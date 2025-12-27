CREATE TABLE IF NOT EXISTS crm_activity_participant (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ActivityId BIGINT NOT NULL,
  ContactId BIGINT NULL,
  UserId BIGINT NULL,
  Role VARCHAR(50) NOT NULL DEFAULT 'attendee',
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,

  INDEX idx_crm_activity_participant_activity_id (ActivityId),
  INDEX idx_crm_activity_participant_contact_id (ContactId),
  INDEX idx_crm_activity_participant_user_id (UserId),
  INDEX idx_crm_activity_participant_role (Role),
  INDEX idx_crm_activity_participant_created_on (CreatedOn),

  FOREIGN KEY (ActivityId) REFERENCES crm_activity(Id) ON DELETE CASCADE,
  FOREIGN KEY (ContactId) REFERENCES crm_contact(Id) ON DELETE CASCADE,
  FOREIGN KEY (UserId) REFERENCES crm_user(Id) ON DELETE CASCADE
);

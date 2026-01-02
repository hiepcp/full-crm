-- CRM System Complete Database Reset Script
-- This script completely resets the CRM database
-- Drop all tables, recreate them, and insert sample data

USE crm_sys_db;

-- ===========================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ===========================================

-- Disable foreign key checks during table drops
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS crm_reference_types;

-- Drop junction/relationship tables first
DROP TABLE IF EXISTS crm_pipeline_log;
DROP TABLE IF EXISTS crm_activity_attachment;
DROP TABLE IF EXISTS crm_deal_quotation;
DROP TABLE IF EXISTS crm_activity_participant;
DROP TABLE IF EXISTS crm_assignee;
DROP TABLE IF EXISTS crm_sharepoint_files;
DROP TABLE IF EXISTS crm_team_members;
DROP TABLE IF EXISTS crm_sales_teams;

-- Drop email template tables
DROP TABLE IF EXISTS crm_email_template_variables;
DROP TABLE IF EXISTS crm_email_templates;

-- Drop lead score rule table
DROP TABLE IF EXISTS crm_lead_score_rule;

-- Drop notification tables
DROP TABLE IF EXISTS crm_notifications;

-- Drop main entity tables
DROP TABLE IF EXISTS crm_goal;
DROP TABLE IF EXISTS crm_customer_address;
DROP TABLE IF EXISTS crm_lead_address;
DROP TABLE IF EXISTS crm_email;
DROP TABLE IF EXISTS crm_activity;
DROP TABLE IF EXISTS crm_deal;
DROP TABLE IF EXISTS crm_quotation;
DROP TABLE IF EXISTS crm_contact;
DROP TABLE IF EXISTS crm_customer;
DROP TABLE IF EXISTS crm_lead;
DROP TABLE IF EXISTS crm_user;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'All existing CRM tables dropped!' AS step1_complete;

-- ===========================================
-- STEP 2: CREATE ALL TABLES
-- ===========================================

-- Disable foreign key checks during table creation
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Reference types table
CREATE TABLE IF NOT EXISTS crm_reference_types (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  Code VARCHAR(100) NOT NULL UNIQUE,
  Name VARCHAR(255) NOT NULL,
  Description TEXT NULL,
  SortOrder INT NOT NULL DEFAULT 0,
  ComplType INT NOT NULL DEFAULT 0,
  Kind INT NOT NULL DEFAULT 0,
  Model VARCHAR(255) NULL,
  ModelType INT NOT NULL DEFAULT 0,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_reference_types_code (Code),

  INDEX idx_crm_reference_types_name (Name),
  INDEX idx_crm_reference_types_sort_order (SortOrder),
  INDEX idx_crm_reference_types_compl_type (ComplType),
  INDEX idx_crm_reference_types_kind (Kind),
  INDEX idx_crm_reference_types_model (Model),
  INDEX idx_crm_reference_types_model_type (ModelType),
  INDEX idx_crm_reference_types_created_on (CreatedOn),
  INDEX idx_crm_reference_types_updated_on (UpdatedOn)
);

-- 1. User table (foundation table)
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
  INDEX idx_crm_user_name (FirstName, LastName),
  INDEX idx_crm_user_role (Role),
  INDEX idx_crm_user_active (IsActive),
  INDEX idx_crm_user_createdOn (CreatedOn),
  INDEX idx_crm_user_updatedOn (UpdatedOn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1b. Goal table
CREATE TABLE IF NOT EXISTS crm_goal (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  Description TEXT NULL,
  TargetValue DECIMAL(15,2) NULL,
  StartDate DATE NULL,
  EndDate DATE NULL,
  OwnerUserId BIGINT NULL,
  OwnerType ENUM('individual','team','company') NOT NULL DEFAULT 'individual',
  OwnerId BIGINT NULL,
  Type VARCHAR(50) NULL,
  Timeframe VARCHAR(50) NULL,
  Recurring TINYINT(1) NOT NULL DEFAULT 0,
  Status ENUM('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
  Progress DECIMAL(5,2) NULL DEFAULT 0.00,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_goal_name (Name),
  INDEX idx_crm_goal_owner (OwnerUserId),
  INDEX idx_crm_goal_owner_type (OwnerType),
  INDEX idx_crm_goal_owner_id (OwnerId),
  INDEX idx_crm_goal_type (Type),
  INDEX idx_crm_goal_timeframe (Timeframe),
  INDEX idx_crm_goal_recurring (Recurring),
  INDEX idx_crm_goal_status (Status),
  INDEX idx_crm_goal_dates (StartDate, EndDate),
  INDEX idx_crm_goal_progress (Progress),
  INDEX idx_crm_goal_createdOn (CreatedOn),
  INDEX idx_crm_goal_updatedOn (UpdatedOn),

  FOREIGN KEY (OwnerUserId) REFERENCES crm_user(Id) ON DELETE SET NULL,
  FOREIGN KEY (OwnerId) REFERENCES crm_user(Id) ON DELETE SET NULL
);

-- 1c. Email Template Tables
-- Main Email Templates Table
CREATE TABLE IF NOT EXISTS crm_email_templates (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  Subject VARCHAR(500) NOT NULL,
  Body LONGTEXT NOT NULL, -- HTML content from CKEditor
  Description VARCHAR(1000) NULL,
  
  -- Ownership & Sharing
  IsShared TINYINT(1) NOT NULL DEFAULT 0, -- If true, visible to all users
  
  -- Template metadata
  Category INT NOT NULL DEFAULT 9, -- EmailTemplateCategory enum: 1=LeadFollowUp, 2=DealProposal, 3=CustomerWelcome, 4=Meeting, 5=FollowUp, 6=ThankYou, 7=Invoice, 8=Quote, 9=General
  
  -- Status & Tracking
  IsActive TINYINT(1) NOT NULL DEFAULT 1,
  UsageCount INT NOT NULL DEFAULT 0, -- Track how many times used
  LastUsedAt DATETIME NULL,
  
  -- Audit fields (CreatedBy and UpdatedBy are user emails)
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NOT NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,
  DeletedAt DATETIME NULL, -- Soft delete
  
  INDEX idx_crm_email_templates_created_by (CreatedBy),
  INDEX idx_crm_email_templates_is_shared (IsShared),
  INDEX idx_crm_email_templates_category (Category),
  INDEX idx_crm_email_templates_is_active (IsActive, DeletedAt)
);

-- Email Template Variables (Metadata for UI)
-- This table stores metadata about available variables for the UI
-- Actual values are fetched dynamically from related tables when rendering
CREATE TABLE IF NOT EXISTS crm_email_template_variables (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  VariableKey VARCHAR(100) NOT NULL UNIQUE, -- e.g., '{{user_name}}', '{{lead_name}}'
  VariableName VARCHAR(255) NOT NULL, -- Display name for UI
  Description VARCHAR(500) NULL,
  EntityType VARCHAR(50) NOT NULL, -- 'user', 'lead', 'deal', 'contact', 'customer', 'system'
  FieldPath VARCHAR(255) NOT NULL, -- Database field path (e.g., 'FirstName', 'Email')
  ExampleValue VARCHAR(255) NULL, -- Example for preview
  IsActive TINYINT(1) NOT NULL DEFAULT 1,
  DisplayOrder INT NOT NULL DEFAULT 0,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_crm_email_template_variables_entity_type (EntityType),
  INDEX idx_crm_email_template_variables_is_active (IsActive)
);

-- 1d. Lead Score Rule Table (Simplified)
-- Single table design: if field has value, award points
CREATE TABLE IF NOT EXISTS crm_lead_score_rule (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  RuleName VARCHAR(200) NOT NULL COMMENT 'Rule name (e.g., "Company Name Provided")',
  Description TEXT COMMENT 'Rule description',
  FieldName VARCHAR(100) NOT NULL COMMENT 'Column name in crm_lead table (Source, Email, Company, VatNumber...)',
  Score INT NOT NULL COMMENT 'Points awarded when field has value',
  IsActive TINYINT(1) DEFAULT 1 COMMENT 'Enable/disable rule',
  CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255),
  UpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255),
  DeletedAt DATETIME DEFAULT NULL,
  UNIQUE INDEX uq_field_name (FieldName, DeletedAt),
  INDEX idx_is_active (IsActive),
  INDEX idx_deleted_at (DeletedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Lead scoring rules - if field has value (not null, not empty), award points';

-- 2. Lead table
CREATE TABLE IF NOT EXISTS crm_lead (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  Email VARCHAR(320) NULL,
  TelephoneNo VARCHAR(64) NULL,
  FirstName VARCHAR(128) NULL,
  LastName VARCHAR(128) NULL,
  Company VARCHAR(255) NULL,
  Website VARCHAR(253) NULL,
  Country VARCHAR(3) NULL,
  VatNumber VARCHAR(64) NULL,
  PaymentTerms VARCHAR(100) NULL,
  Source ENUM('web','event','referral','ads','facebook','other') NULL,
  Status ENUM('working','qualified','unqualified') NULL,
  Type INT NOT NULL DEFAULT 1 COMMENT 'Lead type: 0=Draft (from public form), 1=Active (from internal system)',
  OwnerId BIGINT NULL,
  Score INT NULL,
  IsConverted TINYINT(1) NOT NULL DEFAULT 0,
  ConvertedAt DATETIME NULL,
  CustomerId BIGINT NULL,
  ContactId BIGINT NULL,
  DealId BIGINT NULL,
  IsDuplicate TINYINT(1) NOT NULL DEFAULT 0,
  DuplicateOf BIGINT NULL,
  Note TEXT NULL,
  FollowUpDate DATE NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_lead_email (Email),
  INDEX idx_crm_lead_website (Website),
  INDEX idx_crm_lead_country (Country),
  INDEX idx_crm_lead_owner (OwnerId),
  INDEX idx_crm_lead_status (Status),
  INDEX idx_crm_lead_type (Type),
  INDEX idx_crm_lead_source (Source),
  INDEX idx_crm_lead_score (Score),
  INDEX idx_crm_lead_createdOn (CreatedOn),
  INDEX idx_crm_lead_updatedOn (UpdatedOn)
);

-- 2b. Lead address table (supports multiple address types per lead)
CREATE TABLE IF NOT EXISTS crm_lead_address (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  LeadId BIGINT NOT NULL,
  AddressType ENUM('legal','delivery','forwarder','forwarder_agent_asia','other') NOT NULL,
  CompanyName VARCHAR(255) NULL,
  AddressLine TEXT NULL,
  Postcode VARCHAR(32) NULL,
  City VARCHAR(128) NULL,
  Country VARCHAR(3) NULL,
  ContactPerson VARCHAR(255) NULL,
  Email VARCHAR(320) NULL,
  TelephoneNo VARCHAR(64) NULL,
  PortOfDestination VARCHAR(255) NULL,
  IsPrimary TINYINT(1) NOT NULL DEFAULT 0,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_lead_address_lead (LeadId),
  INDEX idx_crm_lead_addressType (AddressType),
  INDEX idx_crm_lead_address_primary (LeadId, AddressType, IsPrimary),

  FOREIGN KEY (LeadId) REFERENCES crm_lead(Id) ON DELETE CASCADE
);

-- 3. Customer table
CREATE TABLE IF NOT EXISTS crm_customer (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  Domain VARCHAR(253) NULL,
  Phone VARCHAR(64) NULL,
  Email VARCHAR(320) NULL,
  BillingAddress TEXT NULL,
  ShippingAddress TEXT NULL,
  Website VARCHAR(500) NULL,
  Type ENUM('Customer','Prospect','Partner','Supplier','Other') NOT NULL DEFAULT 'Customer',
  OwnerId BIGINT NULL,
  VatNumber VARCHAR(50) NULL,
  Currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  Country VARCHAR(3) NULL,
  Industry VARCHAR(100) NULL,
  Notes TEXT NULL,
  PaymentTerms VARCHAR(100) NULL,
  DeliveryTerms VARCHAR(200) NULL,
  ContactPerson VARCHAR(255) NULL,
  SalesTeamId BIGINT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_customer_name (Name),
  INDEX idx_crm_customer_domain (Domain),
  INDEX idx_crm_customer_email (Email),
  INDEX idx_crm_customer_owner (OwnerId),
  INDEX idx_crm_customer_type (Type),
  INDEX idx_crm_customer_country (Country),
  INDEX idx_crm_customer_industry (Industry),
  INDEX idx_crm_customer_createdOn (CreatedOn),
  INDEX idx_crm_customer_updatedOn (UpdatedOn),
  INDEX idx_crm_customer_sales_team_id (SalesTeamId)
);

-- 3b. Customer address table (supports multiple address types per customer)
CREATE TABLE IF NOT EXISTS crm_customer_address (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  CustomerId BIGINT NOT NULL,
  AddressType ENUM('legal','delivery','forwarder','forwarder_agent_asia','other') NOT NULL,
  CompanyName VARCHAR(255) NULL,
  AddressLine TEXT NULL,
  Postcode VARCHAR(32) NULL,
  City VARCHAR(128) NULL,
  Country VARCHAR(3) NULL,
  ContactPerson VARCHAR(255) NULL,
  Email VARCHAR(320) NULL,
  TelephoneNo VARCHAR(64) NULL,
  PortOfDestination VARCHAR(255) NULL,
  IsPrimary TINYINT(1) NOT NULL DEFAULT 0,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_customer_address_customer (CustomerId),
  INDEX idx_crm_customer_addressType (AddressType),
  INDEX idx_crm_customer_address_primary (CustomerId, AddressType, IsPrimary),

  FOREIGN KEY (CustomerId) REFERENCES crm_customer(Id) ON DELETE CASCADE
);

-- 3c. Sales Teams tables
CREATE TABLE IF NOT EXISTS crm_sales_teams (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  CreatedBy VARCHAR(255) NOT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255),
  UpdatedOn DATETIME ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_teams_name (name),
  INDEX idx_teams_created_by (CreatedBy),
  UNIQUE KEY uk_teams_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_team_members (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  TeamId BIGINT NOT NULL,
  UserEmail VARCHAR(255) NOT NULL,
  Role ENUM('TeamLead', 'Member', 'Observer') NOT NULL DEFAULT 'Member',
  JoinedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NOT NULL DEFAULT 'system',
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255),
  UpdatedOn DATETIME ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_members_team (TeamId),
  INDEX idx_members_user (UserEmail),
  UNIQUE KEY uk_members_team_user (TeamId, UserEmail),
  CONSTRAINT fk_members_team
    FOREIGN KEY (TeamId) REFERENCES crm_sales_teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Contact table
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

  INDEX idx_crm_contact_customer (CustomerId),
  INDEX idx_crm_contact_email (Email),
  INDEX idx_crm_contact_name (FirstName, LastName),
  INDEX idx_crm_contact_primary (IsPrimary),
  INDEX idx_crm_contact_createdOn (CreatedOn),
  INDEX idx_crm_contact_updatedOn (UpdatedOn),

  FOREIGN KEY (CustomerId) REFERENCES crm_customer(Id) ON DELETE SET NULL
);

-- 5. Deal table
CREATE TABLE IF NOT EXISTS crm_deal (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  CustomerId BIGINT NULL,
  OwnerId BIGINT NULL,
  LeadId BIGINT NULL,
  Name VARCHAR(255) NOT NULL,
  Description TEXT NULL,
  Stage ENUM('Prospecting','Quotation','Proposal','Negotiation','Closed Won','Closed Lost','On Hold') NOT NULL DEFAULT 'Prospecting',
  ExpectedRevenue DECIMAL(15,2) NULL,
  ActualRevenue DECIMAL(15,2) NULL,
  CloseDate DATE NULL,
  ContactId BIGINT NULL,
  Note TEXT NULL,
  SalesTeamId BIGINT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_deal_customer (CustomerId),
  INDEX idx_crm_deal_owner (OwnerId),
  INDEX idx_crm_deal_lead (LeadId),
  INDEX idx_crm_deal_stage (Stage),
  INDEX idx_crm_deal_closeDate (CloseDate),
  INDEX idx_crm_deal_contact (ContactId),
  INDEX idx_crm_deal_expectedRevenue (ExpectedRevenue),
  INDEX idx_crm_deal_createdOn (CreatedOn),
  INDEX idx_crm_deal_updatedOn (UpdatedOn),
  INDEX idx_crm_deal_sales_team_id (SalesTeamId),

  FOREIGN KEY (CustomerId) REFERENCES crm_customer(Id) ON DELETE SET NULL,
  FOREIGN KEY (LeadId) REFERENCES crm_lead(Id) ON DELETE SET NULL,
  FOREIGN KEY (ContactId) REFERENCES crm_contact(Id) ON DELETE SET NULL,
  FOREIGN KEY (SalesTeamId) REFERENCES crm_sales_teams(id) ON DELETE SET NULL
);

-- 6. Quotation table
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

  INDEX idx_crm_quotationNumber (QuotationNumber),
  INDEX idx_crm_quotation_status (Status),
  INDEX idx_crm_quotation_validUntil (ValidUntil),
  INDEX idx_crm_quotation_totalAmount (TotalAmount),
  INDEX idx_crm_quotation_customer (CustomerId),
  INDEX idx_crm_quotation_createdOn (CreatedOn),
  INDEX idx_crm_quotation_updatedOn (UpdatedOn),

  FOREIGN KEY (CustomerId) REFERENCES crm_customer(Id) ON DELETE SET NULL
);

-- 7. Activity table
CREATE TABLE IF NOT EXISTS crm_activity (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ExternalId VARCHAR(255) NULL,
  ConversationId VARCHAR(255) NULL,
  SourceFrom VARCHAR(100) NULL,
  Subject VARCHAR(500) NULL,
  Body LONGTEXT NULL,
  ActivityType ENUM('email','call','meeting','task','note','contract') NOT NULL DEFAULT 'note',
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,
  DueAt DATETIME NULL,
  CompletedAt DATETIME NULL,
  StartAt DATETIME NULL,
  EndAt DATETIME NULL,
  Status ENUM('open','in_progress','completed','cancelled','overdue') NOT NULL DEFAULT 'open',
  Priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  AssignedTo VARCHAR(255) NULL,
  RelationType VARCHAR(50) NULL,
  RelationId BIGINT NULL,
  CallDuration INT NULL,
  CallOutcome VARCHAR(100) NULL,
  ContractDate DATE NULL COMMENT 'Date when contract was signed or becomes effective (contract-type activities only)',
  ContractValue DECIMAL(18, 2) NULL COMMENT 'Financial value of the contract (contract-type activities only)',

  INDEX idx_crm_activity_externalId (ExternalId),
  INDEX idx_crm_activity_conversationId (ConversationId),
  INDEX idx_crm_activityType (ActivityType),
  INDEX idx_crm_activity_status (Status),
  INDEX idx_crm_activity_priority (Priority),
  INDEX idx_crm_activity_assignedTo (AssignedTo),
  INDEX idx_crm_activity_relation (RelationType, RelationId),
  INDEX idx_crm_activity_dueAt (DueAt),
  INDEX idx_crm_activity_startAt (StartAt),
  INDEX idx_crm_activity_endAt (EndAt),
  INDEX idx_crm_activity_completedAt (CompletedAt),
  INDEX idx_crm_activity_createdOn (CreatedOn),
  INDEX idx_crm_activity_updatedOn (UpdatedOn),
  INDEX idx_crm_activity_contract_date (ContractDate),
  INDEX idx_crm_activity_contract_value (ContractValue),

  CONSTRAINT chk_contract_value_non_negative CHECK (ContractValue IS NULL OR ContractValue >= 0)
);

CREATE TABLE IF NOT EXISTS crm_email (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  MailId VARCHAR(255) NULL,
  ConversationId VARCHAR(255) NULL,
  Subject VARCHAR(500) NULL,
  BodyPreview TEXT NULL,
  BodyContent LONGTEXT NULL,
  BodyContentType VARCHAR(50) DEFAULT 'text',
  Importance VARCHAR(20) DEFAULT 'normal',
  HasAttachments TINYINT(1) NOT NULL DEFAULT 0,
  IsRead TINYINT(1) NOT NULL DEFAULT 0,
  IsDraft TINYINT(1) NOT NULL DEFAULT 0,
  FromName VARCHAR(255) NULL,
  FromAddress VARCHAR(320) NULL,
  SenderName VARCHAR(255) NULL,
  SenderAddress VARCHAR(320) NULL,
  ToRecipients TEXT NULL,
  CcRecipients TEXT NULL,
  BccRecipients TEXT NULL,
  ReplyTo TEXT NULL,
  ReceivedDateTime DATETIME NULL,
  SentDateTime DATETIME NULL,
  CreatedDateTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  LastModifiedDateTime DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  InternetMessageId VARCHAR(500) NULL,
  ActivityId BIGINT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_email_conversationId (ConversationId),
  INDEX idx_crm_email_subject (Subject(100)),
  INDEX idx_crm_email_fromAddress (FromAddress),
  INDEX idx_crm_email_senderAddress (SenderAddress),
  INDEX idx_crm_email_isRead (IsRead),
  INDEX idx_crm_email_isDraft (IsDraft),
  INDEX idx_crm_email_receivedDateTime (ReceivedDateTime),
  INDEX idx_crm_email_sentDateTime (SentDateTime),
  INDEX idx_crm_email_activity (ActivityId),
  INDEX idx_crm_email_createdOn (CreatedOn),
  INDEX idx_crm_email_mail_id (MailId),

  FOREIGN KEY (ActivityId) REFERENCES crm_activity(Id) ON DELETE SET NULL
);

-- 9. Appointment table
CREATE TABLE IF NOT EXISTS crm_appointment (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  MailId VARCHAR(255) NULL,
  ICalUId VARCHAR(255) NULL,
  ConversationId VARCHAR(255) NULL,
  Subject VARCHAR(500) NULL,
  BodyPreview TEXT NULL,
  BodyContent LONGTEXT NULL,
  BodyContentType VARCHAR(50) DEFAULT 'html',
  OrganizerName VARCHAR(255) NULL,
  OrganizerAddress VARCHAR(320) NULL,
  Attendees TEXT NULL,
  StartDateTime DATETIME NOT NULL,
  EndDateTime DATETIME NULL,
  StartTimeZone VARCHAR(100) NULL,
  EndTimeZone VARCHAR(100) NULL,
  DurationMinutes INT NULL,
  LocationName VARCHAR(255) NULL,
  LocationAddress VARCHAR(500) NULL,
  IsOnlineMeeting TINYINT(1) NOT NULL DEFAULT 0,
  JoinUrl VARCHAR(1000) NULL,
  Platform VARCHAR(100) NULL,
  ShowAs VARCHAR(50) NULL,
  Importance VARCHAR(20) DEFAULT 'normal',
  Status VARCHAR(50) NULL,
  HasAttachments TINYINT(1) NOT NULL DEFAULT 0,
  LastModifiedDateTime DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  ActivityId BIGINT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_appointment_mail_id (MailId),
  INDEX idx_crm_appointment_ical_uid (ICalUId),
  INDEX idx_crm_appointment_conversation (ConversationId),
  INDEX idx_crm_appointment_start (StartDateTime),
  INDEX idx_crm_appointment_end (EndDateTime),
  INDEX idx_crm_appointment_activity (ActivityId),

  FOREIGN KEY (ActivityId) REFERENCES crm_activity(Id) ON DELETE SET NULL
);

-- 10. Assignee table
CREATE TABLE IF NOT EXISTS crm_assignee (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  RelationType VARCHAR(50) NOT NULL,
  RelationId BIGINT NOT NULL,
  UserEmail VARCHAR(320) NOT NULL COMMENT 'User email from crm_user table',
  Role VARCHAR(100) NOT NULL DEFAULT 'collaborator',
  AssignedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Notes TEXT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,

  INDEX idx_crm_assignee_relation (RelationType, RelationId),
  INDEX idx_crm_assignee_user_email (UserEmail),
  INDEX idx_crm_assignee_role (Role),
  INDEX idx_crm_assignee_assignedAt (AssignedAt),
  INDEX idx_crm_assignee_createdOn (CreatedOn),

  UNIQUE KEY unique_assignee_relation (RelationType, RelationId, UserEmail),
  FOREIGN KEY (UserEmail) REFERENCES crm_user(Email) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User assignments to entities (Lead, Deal, Customer, etc.) - uses email for flexibility';

-- 11. ActivityParticipant table
CREATE TABLE IF NOT EXISTS crm_activity_participant (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ActivityId BIGINT NOT NULL,
  ContactId BIGINT NULL,
  UserId BIGINT NULL,
  Role VARCHAR(50) NOT NULL DEFAULT 'attendee',
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,

  INDEX idx_crm_activity_participant_activity (ActivityId),
  INDEX idx_crm_activity_participant_contact (ContactId),
  INDEX idx_crm_activity_participant_user (UserId),
  INDEX idx_crm_activity_participant_role (Role),
  INDEX idx_crm_activity_participant_createdOn (CreatedOn),

  FOREIGN KEY (ActivityId) REFERENCES crm_activity(Id) ON DELETE CASCADE,
  FOREIGN KEY (ContactId) REFERENCES crm_contact(Id) ON DELETE CASCADE,
  FOREIGN KEY (UserId) REFERENCES crm_user(Id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crm_deal_quotation (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  DealId BIGINT NOT NULL,
  QuotationNumber VARCHAR(50) NOT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,

  INDEX idx_crm_deal_quotation_deal (DealId),
  INDEX idx_crm_deal_quotation_quotation_number (QuotationNumber),
  INDEX idx_crm_deal_quotation_createdOn (CreatedOn),

  UNIQUE KEY unique_deal_quotation (DealId, QuotationNumber),
  FOREIGN KEY (DealId) REFERENCES crm_deal(Id) ON DELETE CASCADE
);

-- 12. ActivityAttachment table
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

-- 13. SharePoint Files table
CREATE TABLE IF NOT EXISTS crm_sharepoint_files (
  Id BIGINT NOT NULL AUTO_INCREMENT,
  ItemId VARCHAR(255) NOT NULL COLLATE utf8mb4_0900_ai_ci,
  DriveId VARCHAR(255) NOT NULL COLLATE utf8mb4_0900_ai_ci,
  Name VARCHAR(500) NOT NULL COLLATE utf8mb4_0900_ai_ci,
  WebUrl TEXT NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,
  DownloadUrl TEXT NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,
  MimeType VARCHAR(100) NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,
  Size BIGINT NULL DEFAULT NULL,
  Etag VARCHAR(255) NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,
  Ctag VARCHAR(255) NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,
  CreatedBy VARCHAR(255) NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,
  CreatedDatetime DATETIME NULL DEFAULT NULL,
  LastModifiedBy VARCHAR(255) NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,
  LastModifiedDatetime DATETIME NULL DEFAULT NULL,
  ParentId VARCHAR(255) NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,
  ParentName VARCHAR(255) NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,
  ParentPath TEXT NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,
  RawJson JSON NULL DEFAULT NULL,
  CreatedOn DATETIME NULL DEFAULT (NOW()),
  UpdatedOn DATETIME NULL DEFAULT (NOW()) ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(50) NULL DEFAULT NULL COLLATE utf8mb4_0900_ai_ci,

  PRIMARY KEY (Id) USING BTREE,
  UNIQUE INDEX uq_sharepoint_item (ItemId, DriveId) USING BTREE
) COLLATE = utf8mb4_0900_ai_ci
  ENGINE = InnoDB
  AUTO_INCREMENT = 1;

-- 14. PipelineLog table
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

  INDEX idx_crm_pipeline_log_deal (DealId),
  INDEX idx_crm_pipeline_log_oldStage (OldStage),
  INDEX idx_crm_pipeline_log_newStage (NewStage),
  INDEX idx_crm_pipeline_log_changedBy (ChangedBy),
  INDEX idx_crm_pipeline_log_changedAt (ChangedAt),
  INDEX idx_crm_pipeline_log_createdOn (CreatedOn),
  INDEX idx_crm_pipeline_log_updatedOn (UpdatedOn),

  FOREIGN KEY (DealId) REFERENCES crm_deal(Id) ON DELETE CASCADE
);

-- 15. Notifications table
CREATE TABLE IF NOT EXISTS crm_notifications (
  Id CHAR(36) PRIMARY KEY,
  UserId BIGINT NOT NULL,
  Type VARCHAR(50) NOT NULL COMMENT 'LEAD_CREATED, DEAL_STAGE_CHANGED, FOLLOW_UP_DUE, etc.',
  Title VARCHAR(200) NOT NULL,
  Message VARCHAR(500) NOT NULL,
  
  -- Entity reference (which entity triggered this notification)
  EntityType VARCHAR(50) NULL COMMENT 'lead, deal, customer, contact, activity',
  EntityId BIGINT NULL,
  
  -- Status
  IsRead TINYINT(1) NOT NULL DEFAULT 0,
  ReadAt DATETIME NULL,
  
  -- UI/UX metadata
  Metadata JSON NULL COMMENT 'Flexible data for UI customization',
  
  -- Audit
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedAt DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_notifications_userId_isRead_createdAt (UserId, IsRead, CreatedAt DESC),
  INDEX idx_notifications_entityReference (EntityType, EntityId),
  INDEX idx_notifications_type (Type),
  INDEX idx_notifications_createdAt (CreatedAt),
  
  FOREIGN KEY (UserId) REFERENCES crm_user(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='All notifications for users - both event-driven and scheduled';

SELECT '🏗️ All CRM tables created!' AS step2_complete;

-- ===========================================
-- STEP 3: INSERT SAMPLE DATA
-- ===========================================

-- Insert sample reference types
INSERT INTO crm_reference_types (Id, Code, Name, Description, SortOrder, ComplType, Kind, Model, ModelType, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy) VALUES
(2, 'Customer', 'Customer', 'Customer', 2, 0, 0, 'RSVNCustTableEntities', 0, '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com'),
(7, 'HcmWorker', 'HCM Worker', 'HCM Worker', 7, 0, 0, 'RSVNHcmWorkers', 0, '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com');

-- Insert sample users
INSERT INTO crm_user (
    Id, Email, FirstName, LastName, Role, Avatar, IsActive,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(101, 'henrik.kristensen@coreone.dk', 'Henrik Sig', 'Kristensen', 'Sales Director',
 'https://avatars.githubusercontent.com/u/101?v=4', 1,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com'),
(102, 'anders.rask@coreone.dk', 'Anders Hejgaard', 'Rask', 'Sales Manager',
 'https://avatars.githubusercontent.com/u/102?v=4', 1,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com'),
(103, 'karina.skaerlund@coreone.dk', 'Karina', 'Skærlund', 'Internal Sales Manager',
 'https://avatars.githubusercontent.com/u/103?v=4', 1,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com'),
(104, 'charlotte.rasmussen@coreone.dk', 'Charlotte Tidemand', 'Rasmussen', 'Sales Coordinator',
 'https://avatars.githubusercontent.com/u/104?v=4', 1,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com'),
(105, 'camilla.rommel@coreone.dk', 'Camilla Josefine Tang', 'Rommel', 'Sales Coordinator',
 'https://avatars.githubusercontent.com/u/105?v=4', 1,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-01 00:00:00', 'system@crm.com');

-- Insert sample email template variables
INSERT INTO crm_email_template_variables (Id, VariableKey, VariableName, Description, EntityType, FieldPath, ExampleValue, DisplayOrder) VALUES
-- User variables
(1, '{{user_name}}', 'User Name', 'Full name of current user', 'user', 'CONCAT(FirstName, " ", LastName)', 'Henrik Sig Kristensen', 10),
(2, '{{user_firstname}}', 'User First Name', 'First name of current user', 'user', 'FirstName', 'Henrik', 11),
(3, '{{user_lastname}}', 'User Last Name', 'Last name of current user', 'user', 'LastName', 'Kristensen', 12),
(4, '{{user_email}}', 'User Email', 'Email of current user', 'user', 'Email', 'henrik.kristensen@coreone.dk', 13),
(5, '{{user_role}}', 'User Role', 'Role of current user', 'user', 'Role', 'Sales Director', 14),

-- Lead variables
(10, '{{lead_name}}', 'Lead Name', 'Full name of lead', 'lead', 'CONCAT(FirstName, " ", LastName)', 'Henrik Kristensen', 20),
(11, '{{lead_firstname}}', 'Lead First Name', 'First name of lead', 'lead', 'FirstName', 'Henrik', 21),
(12, '{{lead_lastname}}', 'Lead Last Name', 'Last name of lead', 'lead', 'LastName', 'Kristensen', 22),
(13, '{{lead_email}}', 'Lead Email', 'Email of lead', 'lead', 'Email', 'henrik.kristensen@ilva.dk', 23),
(14, '{{lead_phone}}', 'Lead Phone', 'Phone number of lead', 'lead', 'TelephoneNo', '+45 75 55 11 37', 24),
(15, '{{lead_company}}', 'Lead Company', 'Company name of lead', 'lead', 'Company', 'ILVA A/S', 25),
(16, '{{lead_source}}', 'Lead Source', 'Source of lead', 'lead', 'Source', 'Web', 26),

-- Deal variables
(20, '{{deal_name}}', 'Deal Name', 'Name of deal', 'deal', 'Title', 'Q4 Enterprise Deal', 30),
(21, '{{deal_value}}', 'Deal Value', 'Value of deal', 'deal', 'EstimatedRevenue', '$500,000', 31),
(22, '{{deal_stage}}', 'Deal Stage', 'Current stage of deal', 'deal', 'Stage', 'Negotiation', 32),
(23, '{{deal_probability}}', 'Deal Probability', 'Win probability of deal', 'deal', 'Probability', '75%', 33),

-- Contact variables
(30, '{{contact_name}}', 'Contact Name', 'Full name of contact', 'contact', 'CONCAT(FirstName, " ", MiddleName, " ", LastName)', 'Henrik Sig Kristensen', 40),
(31, '{{contact_firstname}}', 'Contact First Name', 'First name of contact', 'contact', 'FirstName', 'Henrik', 41),
(32, '{{contact_lastname}}', 'Contact Last Name', 'Last name of contact', 'contact', 'LastName', 'Kristensen', 42),
(33, '{{contact_email}}', 'Contact Email', 'Email of contact', 'contact', 'Email', 'henrik.kristensen@ilva.dk', 43),
(34, '{{contact_phone}}', 'Contact Phone', 'Phone number of contact', 'contact', 'Phone', '+45 75 55 11 37', 44),
(35, '{{contact_position}}', 'Contact Position', 'Position of contact', 'contact', 'JobTitle', 'Sales Responsible', 45),

-- Customer variables
(40, '{{customer_name}}', 'Customer Name', 'Name of customer', 'customer', 'Name', 'ILVA A/S', 50),
(41, '{{customer_email}}', 'Customer Email', 'Email of customer', 'customer', 'Email', 'ilva@ilva.dk', 51),
(42, '{{customer_phone}}', 'Customer Phone', 'Phone of customer', 'customer', 'Phone', '+45 75 55 11 37', 52),
(43, '{{customer_country}}', 'Customer Country', 'Country of customer', 'customer', 'Country', 'Denmark', 53),

-- System variables
(50, '{{company_name}}', 'Company Name', 'Your company name', 'system', 'static', 'CoreOne CRM', 60),
(51, '{{company_email}}', 'Company Email', 'Your company email', 'system', 'static', 'info@coreone.dk', 61),
(52, '{{company_phone}}', 'Company Phone', 'Your company phone', 'system', 'static', '+45 12 34 56 78', 62),
(53, '{{current_date}}', 'Current Date', 'Current date', 'system', 'CURDATE()', '2025-12-09', 63),
(54, '{{current_time}}', 'Current Time', 'Current time', 'system', 'CURTIME()', '14:30', 64);

-- Insert sample email templates (Category: 1=LeadFollowUp, 2=DealProposal, 3=CustomerWelcome, 4=Meeting, 5=FollowUp, 6=ThankYou, 7=Invoice, 8=Quote, 9=General)
INSERT INTO crm_email_templates (Id, Name, Subject, Body, Description, IsShared, Category, UsageCount, CreatedOn, CreatedBy, UpdatedBy) VALUES
(1, 'Lead Follow-up Template',
 'Following up on your inquiry - {{lead_company}}',
 '<p>Dear {{lead_name}},</p>
<p>Thank you for your interest in our services. I wanted to follow up on your recent inquiry regarding {{lead_company}}.</p>
<p>I would love to schedule a call to discuss how we can help you achieve your business goals.</p>
<p>Please let me know your availability this week.</p>
<p>Best regards,<br/>
{{user_name}}<br/>
{{user_role}}<br/>
{{user_email}}</p>',
 'Standard template for lead follow-up',
 1, 1, 0, '2025-01-01 00:00:00', 'henrik.kristensen@coreone.dk', 'henrik.kristensen@coreone.dk'),

(2, 'Deal Proposal Template',
 'Proposal for {{deal_name}}',
 '<p>Dear {{contact_name}},</p>
<p>I am pleased to present our proposal for <strong>{{deal_name}}</strong>.</p>
<p><strong>Proposal Details:</strong></p>
<ul>
    <li>Deal Value: {{deal_value}}</li>
    <li>Current Stage: {{deal_stage}}</li>
    <li>Win Probability: {{deal_probability}}</li>
</ul>
<p>Please find the detailed proposal attached. I look forward to discussing this opportunity with you.</p>
<p>Best regards,<br/>
{{user_name}}<br/>
{{company_name}}</p>',
 'Template for sending deal proposals',
 1, 2, 0, '2025-01-01 00:00:00', 'henrik.kristensen@coreone.dk', 'henrik.kristensen@coreone.dk'),

(3, 'Welcome New Customer',
 'Welcome to {{company_name}}!',
 '<p>Dear {{customer_name}},</p>
<p>Welcome to {{company_name}}! We are thrilled to have you as our customer.</p>
<p>Your account has been successfully set up. Here are your next steps:</p>
<ol>
    <li>Complete your profile information</li>
    <li>Review our services and features</li>
    <li>Contact your dedicated account manager</li>
</ol>
<p>If you have any questions, please do not hesitate to reach out to us at {{company_email}} or {{company_phone}}.</p>
<p>Thank you for choosing us!</p>
<p>Best regards,<br/>
The {{company_name}} Team</p>',
 'Welcome email for new customers',
 1, 3, 0, '2025-01-01 00:00:00', 'anders.rask@coreone.dk', 'anders.rask@coreone.dk'),

(4, 'Meeting Confirmation',
 'Meeting Confirmation - {{current_date}}',
 '<p>Dear {{contact_name}},</p>
<p>This email confirms our upcoming meeting scheduled for {{current_date}}.</p>
<p><strong>Meeting Details:</strong></p>
<ul>
    <li>Company: {{customer_name}}</li>
    <li>Contact: {{contact_position}}</li>
    <li>Email: {{contact_email}}</li>
    <li>Phone: {{contact_phone}}</li>
</ul>
<p>Looking forward to our conversation!</p>
<p>Best regards,<br/>
{{user_name}}<br/>
{{user_email}}</p>',
 'Template for confirming meetings',
 1, 4, 0, '2025-01-01 00:00:00', 'anders.rask@coreone.dk', 'anders.rask@coreone.dk'),

(5, 'Thank You After Call',
 'Thank you for your time today',
 '<p>Dear {{contact_name}},</p>
<p>Thank you for taking the time to speak with me today regarding {{deal_name}}.</p>
<p>As discussed, I will follow up with the additional information you requested.</p>
<p>Please feel free to reach out if you have any questions in the meantime.</p>
<p>Best regards,<br/>
{{user_name}}<br/>
{{user_role}}<br/>
{{company_name}}</p>',
 'Follow-up after sales call',
 1, 5, 0, '2025-01-01 00:00:00', 'karina.skaerlund@coreone.dk', 'karina.skaerlund@coreone.dk');

-- Insert sample goals
INSERT INTO crm_goal (
    Id, Name, Description, TargetValue, StartDate, EndDate, OwnerUserId, OwnerType, OwnerId, Type, Timeframe, Recurring, Status, Progress,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
-- Individual Goals
(1001, 'Q1 Sales Target', 'Achieve $500,000 in sales for Q1 2025', 500000.00, '2025-01-01', '2025-03-31', 101, 'individual', 101, 'revenue', 'this_quarter', 0, 'active', 35.50,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-15 00:00:00', 'system@crm.com'),

(1002, 'Monthly Deal Closures', 'Close 15 deals this month', 15.00, '2025-01-01', '2025-01-31', 102, 'individual', 102, 'deals', 'this_month', 1, 'active', 66.67,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-20 00:00:00', 'system@crm.com'),

-- Team Goals
(1005, 'Team Revenue Target', 'Achieve $2M in team revenue for Q1', 2000000.00, '2025-01-01', '2025-03-31', NULL, 'team', NULL, 'revenue', 'this_quarter', 0, 'active', 45.20,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-15 00:00:00', 'system@crm.com'),

-- Company Goals
(1006, 'Annual Revenue Goal', 'Reach $10M in annual revenue', 10000000.00, '2025-01-01', '2025-12-31', NULL, 'company', NULL, 'revenue', 'this_year', 0, 'active', 12.50,
 '2025-01-01 00:00:00', 'system@crm.com', '2025-01-20 00:00:00', 'system@crm.com');

-- Insert simplified lead score rules
-- Simple logic: if field has value (not null, not empty), award points
INSERT INTO crm_lead_score_rule (
  RuleName, Description, FieldName, Score, 
  CreatedOn, CreatedBy
) VALUES
('Lead Source Provided', 'Lead source indicates where lead came from', 'source', 10, '2025-01-01 00:00:00', 'system@crm.com'),
('First Name Provided', 'Contact first name for personalization', 'firstName', 0, '2025-01-01 00:00:00', 'system@crm.com'),
('Last Name Provided', 'Contact last name for formal communication', 'lastName', 0, '2025-01-01 00:00:00', 'system@crm.com'),
('Company Name Provided', 'Company name indicates B2B lead, typically higher value', 'company', 10, '2025-01-01 00:00:00', 'system@crm.com'),
('VAT Number Provided', 'VAT number indicates registered business entity, serious buyer', 'vatNumber', 5, '2025-01-01 00:00:00', 'system@crm.com'),
('Email Provided', 'Email is essential for communication and follow-up', 'email', 25, '2025-01-01 00:00:00', 'system@crm.com'),
('Telephone Provided', 'Phone number enables direct contact, shows high intent', 'telephoneNo', 9, '2025-01-01 00:00:00', 'system@crm.com'),
('Website Provided', 'Website indicates established business presence', 'website', 8, '2025-01-01 00:00:00', 'system@crm.com'),
('Payment Terms Discussed', 'Payment terms discussed means negotiation is underway', 'paymentTerms', 8, '2025-01-01 00:00:00', 'system@crm.com'),
('Country Specified', 'Country helps with geographic targeting and logistics planning', 'country', 8, '2025-01-01 00:00:00', 'system@crm.com'),
('Lead Owner Assigned', 'Assigned owner means lead is being actively worked', 'ownerId', 5, '2025-01-01 00:00:00', 'system@crm.com'),
('Follow-up Scheduled', 'Scheduled follow-up shows active engagement process', 'followUpDate', 7, '2025-01-01 00:00:00', 'system@crm.com'),
('Notes Added', 'Notes provide additional context and show engagement', 'note', 5, '2025-01-01 00:00:00', 'system@crm.com');

SELECT '✅ Lead Score Rules seeded successfully!' AS status,
  (SELECT COUNT(*) FROM crm_lead_score_rule WHERE IsActive = 1) AS total_rules,
  (SELECT SUM(Score) FROM crm_lead_score_rule WHERE IsActive = 1) AS max_possible_score;

-- Insert sample customers
INSERT INTO crm_customer (
    Id, Name, Domain, Phone, Email, BillingAddress, ShippingAddress, Website, Type,
    OwnerId, VatNumber, Currency, Country, Industry, Notes, PaymentTerms, DeliveryTerms,
    ContactPerson, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(10501, 'ILVA A/S', 'ilva.dk', '+45 75 55 11 37', 'ilva@ilva.dk',
 'ILVA A/S\nAarhus, Denmark', 'Aarhus, Denmark (Taulov)', 'https://ilva.dk', 'Customer',
 101, '28505108', 'USD', 'DNK', 'Furniture',
 'FOB customer. Documents for customs clearance to be sent to: ilva.aar@scangl.com and import@ilva.dk.',
 'CAD', 'FOB, HCMC', 'Henrik Sig Kristensen',
 '2025-10-02 16:45:00', 'system@crm.com', '2025-10-02 16:45:00', 'sales@crm.com'),
(10545, 'Response Vietnam Co., Ltd.', 'responsevietnam.com', '+84 28 3775 0888', 'info@responsevietnam.com',
 'Response Vietnam Co., Ltd.\nHo Chi Minh City, Vietnam', 'Ho Chi Minh City, Vietnam', 'https://responsevietnam.com', 'Customer',
 102, '', 'USD', 'VNM', 'Manufacturing',
 'FOB customer. Inventory location: CO. Telex Release shipment.',
 'TT', 'FOB, HCMC', 'Karina Skærlund',
 '2025-10-01 12:00:00', 'sales@crm.com', '2025-10-01 12:00:00', 'sales@crm.com'),
(10570, 'Hugga Design', 'huggadesign.com', '+86 574 5551 13137', 'info@huggadesign.com',
 'Hugga Design\nNingbo, China', 'Ningbo, China', 'https://huggadesign.com', 'Customer',
 103, '', 'USD', 'CHN', 'Design',
 'FOB customer with Mandarin text name requirements.',
 '30CAD', 'FOB, HCMC', 'Anders Hejgaard Rask',
 '2025-09-28 10:00:00', 'sales@crm.com', '2025-10-01 14:30:00', 'sales@crm.com'),
(10547, 'Paul Anthony Furnishings', 'paulanthony.co.uk', '+44 20 7123 4567', 'orders@paulanthony.co.uk',
 'Paul Anthony Furnishings\nLondon, United Kingdom', 'London, United Kingdom', 'https://paulanthony.co.uk', 'Customer',
 101, '519 0317 64', 'GBP', 'GBR', 'Furniture',
 'UK-based customer with EXW delivery terms.',
 'NET', 'EXW', '',
 '2025-09-20 09:00:00', 'sales@crm.com', '2025-09-30 16:00:00', 'sales@crm.com'),
(10571, 'Mr Living CO. LTD', 'mrliving.com.tw', '+886 2 2999 9999', 'contact@mrliving.com.tw',
 'Mr Living CO. LTD\nTaipei, Taiwan', 'Taipei, Taiwan', 'https://mrliving.com.tw', 'Customer',
  102, '', 'USD', 'TWN', 'Furniture',
 'Taiwan furniture customer with Mandarin requirements.',
 'TT', 'FOB, HCMC', 'Frank Hsia',
 '2025-09-10 10:00:00', 'sales@crm.com', '2025-09-15 13:30:00', 'sales@crm.com');

-- Additional customers to support full seed coverage
INSERT INTO crm_customer (
    Id, Name, Domain, Phone, Email, BillingAddress, ShippingAddress, Website, Type,
    OwnerId, VatNumber, Currency, Country, Industry, Notes, PaymentTerms, DeliveryTerms,
    ContactPerson, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(10573, 'Khori International Inc', 'khoriintl.com', '+82 32 123 4567', 'info@khoriintl.com',
 'Khori International Inc.\nIncheon, Korea', 'Incheon, Korea', 'https://khoriintl.com', 'Partner',
 101, '121-86-18437', 'USD', 'KOR', 'Furniture',
 'FOB customer. Place of delivery: Incheon, Korea. Requires Telex Release and FTA Vietnam-Korea documentation.',
 '30CAD', 'FOB, HCMC', 'Anders Hejgaard Rask',
 '2025-09-05 14:00:00', 'sales@crm.com', '2025-09-28 09:30:00', 'sales@crm.com'),
(10574, 'John Lewis', 'johnlewis.com', '+44 20 7828 1000', 'info@johnlewis.co.uk',
 'John Lewis PLC\nSouthampton, UK', 'Southampton, UK', 'https://johnlewis.com', 'Partner',
 102, '232457280', 'USD', 'GBR', 'Retail',
 'FOB customer. Special AI/SM requirements; Ligentia as booking agent. SWB only; fumigation and inspection required.',
 '60Days', 'FOB, HCMC', 'Henrik Sig Kristensen',
 '2025-08-28 11:00:00', 'sales@crm.com', '2025-09-20 15:00:00', 'sales@crm.com');

-- Insert sample customer addresses
INSERT INTO crm_customer_address (
    CustomerId, AddressType, CompanyName, AddressLine, Postcode, City, Country,
    ContactPerson, Email, TelephoneNo, PortOfDestination, IsPrimary,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
-- Customer 10501 - ILVA A/S
(10501, 'legal',
  'ILVA A/S',
  'Aarhus, Denmark',
  '8000',
  'Aarhus',
  'DNK',
  'Henrik Sig Kristensen',
  'ilva@ilva.dk',
  '+45 75 55 11 37',
  'Aarhus / Taulov',
  1,
  NOW(), 'system@crm.com', NOW(), 'system@crm.com'),
(10501, 'delivery',
  'ILVA A/S Warehouse',
  'Taulov, Denmark',
  '7000',
  'Fredericia',
  'DNK',
  'Warehouse Manager',
  'warehouse@ilva.dk',
  '+45 75 55 11 37',
  'Aarhus',
  1,
  NOW(), 'system@crm.com', NOW(), 'system@crm.com'),
-- Customer 10545 - Response Vietnam Co., Ltd.
(10545, 'legal',
  'Response Vietnam Co., Ltd.',
  'Ho Chi Minh City, Vietnam',
  '700000',
  'Ho Chi Minh City',
  'VNM',
  'Karina Skærlund',
  'info@responsevietnam.com',
  '+84 28 3775 0888',
  'Cat Lai Port, HCMC',
  1,
  NOW(), 'system@crm.com', NOW(), 'system@crm.com'),
-- Customer 10570 - Hugga Design
(10570, 'legal',
  'Hugga Design',
  'Ningbo, Zhejiang Province, China',
  '315000',
  'Ningbo',
  'CHN',
  'Anders Hejgaard Rask',
  'info@huggadesign.com',
  '+86 574 5551 13137',
  'Ningbo Port',
  1,
  NOW(), 'system@crm.com', NOW(), 'system@crm.com');

-- Insert sample contacts
INSERT INTO crm_contact (
    Id, CustomerId, Salutation, FirstName, MiddleName, LastName, Email,
    Phone, MobilePhone, Fax, JobTitle, Address, Notes, IsPrimary,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(301, 10501, 'Mr', 'Henrik', 'Sig', 'Kristensen', 'henrik.kristensen@ilva.dk',
 '+45 75 55 11 37', '+45 75 55 11 37', NULL, 'Sales Responsible',
 'ILVA A/S, Aarhus, Denmark',
 'Main sales contact for ILVA A/S. Handles FOB customer requirements.', 1,
 '2025-10-02 16:45:00', 'sales@crm.com', '2025-10-02 16:45:00', 'sales@crm.com'),
(302, 10545, 'Ms', 'Karina', '', 'Skærlund', 'karina.skaelund@responsevietnam.com',
 '+84 2743 653 974', '+84 2743 653 974', NULL, 'Import Manager',
 'Response Vietnam Co., Ltd., Ho Chi Minh City, Vietnam',
 'Main contact for Response Vietnam Co., Ltd. Handles EXW delivery terms.', 1,
 '2025-10-01 12:00:00', 'sales@crm.com', '2025-10-01 12:00:00', 'sales@crm.com'),
(303, 10570, 'Mr', 'Anders', '', 'Hejgaard', 'anders.hejgaard@huggadesign.com',
 '+8657338962412', '+8657338962412', NULL, 'Design Manager',
 'Hugga Design, Ningbo, China',
 'Main contact for Hugga Design. Handles Mandarin text requirements.', 1,
 '2025-09-28 10:00:00', 'sales@crm.com', '2025-10-01 14:30:00', 'sales@crm.com'),
(304, 10547, 'Mr', 'Paul', '', 'Anthony', 'paul.anthony@paulanthony.co.uk',
 '+447796754806', '+447796754806', NULL, 'Managing Director',
 'Paul Anthony Furnishings, London, United Kingdom',
 'Main contact for UK operations.', 1,
 '2025-09-20 09:00:00', 'sales@crm.com', '2025-09-30 16:00:00', 'sales@crm.com'),
(305, 10571, 'Ms', 'Anne', 'Lyngshede', 'Lund', 'anne.lund@scangl.com',
 '+886-916-099359', '+886-916-099359', NULL, 'Branch Manager',
 'Scan Global Logistics A/S, DK-8260 Viby J., Denmark',
 'Main contact for logistics partnership. Vietnam office coordination.', 1,
 '2025-09-15 13:30:00', 'sales@crm.com', '2025-10-02 11:00:00', 'sales@crm.com'),
(306, 10573, 'Mr', 'Frank', 'F', 'Hsia', 'frank.hsia@khoriintl.com',
 '+82-32-584-9971', '+82-32-584-9971', NULL, 'Production Coordinator',
 'Khori International Inc, Incheon, Korea',
 'Main contact for production coordination and manufacturing partnership. Website: www.khori.co.kr', 1,
 '2025-09-05 14:00:00', 'sales@crm.com', '2025-09-28 09:30:00', 'sales@crm.com'),
(307, 10574, 'Ms', 'Alice', 'Forbes', '', 'alice.forbes@johnlewis.com',
 '+44 20 7931 4100', '+44 20 7931 4100', NULL, 'Branch Manager',
 'Ligentia A/S, Aarhus, Denmark',
 'Vietnam logistics contact. Handles FOB shipments and customs clearance. Website: www.johnlewis.com', 1,
 '2025-08-28 11:00:00', 'sales@crm.com', '2025-09-20 15:00:00', 'sales@crm.com'),
(309, 10501, 'Ms', 'Sarah', '', 'Johansen', 'sarah.johansen@ilva.dk',
 '+45 75 55 11 39', '+45 75 55 11 39', NULL, 'Import Coordinator',
 'ILVA A/S, Aarhus, Denmark',
 'Secondary contact for ILVA A/S. Handles import coordination and customs documentation.', 0,
 '2025-10-03 09:00:00', 'sales@crm.com', '2025-10-03 09:00:00', 'sales@crm.com'),
 (310, 10501, 'Mr', 'Claus', '', 'Funderskov', 'claus.funderskov@ilva.dk',
 '+45 75 55 11 37', '+45 75 55 11 37', NULL, 'Sales Manager',
 'ILVA A/S, Aarhus, Denmark',
 'Additional sales contact for ILVA A/S.', 0,
 '2025-10-03 10:00:00', 'sales@crm.com', '2025-10-03 10:00:00', 'sales@crm.com'),
 (311, 10501, 'Mr', 'Michael', '', 'Colberg', 'michael.colberg@ilva.dk',
 '+45 75 55 11 37', '+45 75 55 11 37', NULL, 'Account Manager',
 'ILVA A/S, Aarhus, Denmark',
 'Account management contact for ILVA A/S.', 0,
 '2025-10-03 10:30:00', 'sales@crm.com', '2025-10-03 10:30:00', 'sales@crm.com'),
 (312, 10570, 'Ms', 'Lynn', '', 'Chen', 'lynn.chen@huggadesign.com',
 '+8657338962412', '+8657338962412', NULL, 'Project Coordinator',
 'Hugga Design, Ningbo, China',
 'Project coordination contact for Hugga Design.', 0,
 '2025-10-03 11:00:00', 'sales@crm.com', '2025-10-03 11:00:00', 'sales@crm.com');

-- Insert sample leads
INSERT INTO crm_lead (
    Id, Email, TelephoneNo, FirstName, LastName, Company, Website, Country, Source, Status, Type,
    OwnerId, Score, IsConverted, ConvertedAt, CustomerId, ContactId, DealId,
    Note, FollowUpDate, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(1, 'henrik.kristensen@ilva.dk', '+45 75 55 11 37', 'Henrik', 'Kristensen', 'ILVA A/S', 'ilva.dk', 'DNK', 'web', 'working', 1,
  101, 75, 0, NULL, NULL, NULL, NULL,
  'Interested in our premium services. Follow up needed regarding pricing.',
  '2025-10-15', '2025-10-01 08:30:00', 'system@crm.com', '2025-10-01 08:30:00', 'system@crm.com'),
(3, 'anders.hejgaard@huggadesign.com', '+86 574 5551 13137', 'Anders', 'Hejgaard', 'Hugga Design', 'huggadesign.com', 'CHN', 'referral', 'qualified', 1,
  101, 90, 1, '2025-10-02 16:45:00', 10570, 303, 403,
  'Converted to customer.', '2025-10-15', '2025-09-25 10:00:00', 'sales@crm.com', '2025-10-02 16:45:00', 'sales@crm.com');

-- Additional leads to match mock data
INSERT INTO crm_lead (
    Id, Email, TelephoneNo, FirstName, LastName, Company, Website, Country, Source, Status, Type,
    OwnerId, Score, IsConverted, ConvertedAt, CustomerId, ContactId, DealId,
    Note, FollowUpDate, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(4, 'paul.anthony@paulanthony.co.uk', '+44 20 7123 4567', 'Paul', 'Anthony', 'Paul Anthony Furnishings', 'paulanthony.co.uk', 'GBR', 'ads', 'working', 1,
 103, 60, 0, NULL, NULL, NULL, NULL,
 NULL, '2025-10-15', '2025-09-30 11:30:00', 'marketing@crm.com', '2025-10-01 13:20:00', 'marketing@crm.com'),
(5, 'anne.lund@scangl.com', '+45 32 48 00 17', 'Anne', 'Lund', 'Scan Global Logistics A/S', 'scangl.com', 'DNK', 'facebook', 'working', 1,
 102, 45, 0, NULL, NULL, NULL, NULL,
 'Logistics partner for ILVA A/S. Contact regarding shipping arrangements and documentation requirements.', '2025-10-15', '2025-10-02 15:45:00', 'system@crm.com', '2025-10-02 15:45:00', 'system@crm.com'),
(7, 'alice.forbes@johnlewis.com', '+44 20 7931 4100', 'Alice', 'Forbes', 'John Lewis PLC', 'johnlewis.com', 'GBR', 'referral', 'qualified', 1,
 103, 88, 0, NULL, 10574, 307, 404,
 'Forwarding agent for John Lewis shipments. Handles UK logistics and documentation.', '2025-10-15', '2025-09-27 13:00:00', 'sales@crm.com', '2025-10-02 14:00:00', 'sales@crm.com'),
(12, 'karina.skaelund@responsevietnam.com', '+84 28 3775 0888', 'Karina', 'Skærlund', 'Response Vietnam Co., Ltd.', 'responsevietnam.com', 'VNM', 'web', 'qualified', 1,
 101, 92, 1, '2025-10-01 12:00:00', 10545, 302, 402,
 NULL, '2025-10-15', '2025-09-24 09:30:00', 'sales@crm.com', '2025-10-01 12:00:00', 'sales@crm.com'),
(16, 'contact@mrliving.com.tw', '+886 2 2999 9999', 'Frank', 'Hsia', 'Mr Living CO. LTD', 'mrliving.com.tw', 'TWN', 'referral', 'qualified', 1,
 102, 85, 1, '2025-09-15 13:30:00', 10571, 305, 405,
 'Taiwan furniture customer with Mandarin requirements. Dimerco Vietfracht forwarding partner.', NULL, '2025-09-10 10:00:00', 'sales@crm.com', '2025-09-15 13:30:00', 'sales@crm.com'),
(17, 'info@khoriintl.com', '+82 32 123 4567', 'Contact', 'Manager', 'Khori International Inc', 'khoriintl.com', 'KOR', 'web', 'working', 1,
 101, 75, 0, NULL, NULL, NULL, NULL,
 'Korean customer interested in FTA Vietnam-Korea documentation and Telex Release shipments.', '2025-10-15', '2025-09-20 09:00:00', 'sales@crm.com', '2025-09-28 09:30:00', 'sales@crm.com');

-- Insert sample lead addresses
INSERT INTO crm_lead_address (
    LeadId, AddressType, CompanyName, AddressLine, Postcode, City, Country,
    ContactPerson, Email, TelephoneNo, PortOfDestination, IsPrimary,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
-- Lead 1 - ILVA A/S (Denmark)
(1, 'legal',
  'ILVA A/S',
  'Aarhus, Denmark',
  '8000',
  'Aarhus',
  'DNK',
  'Henrik Sig Kristensen',
  'henrik.kristensen@ilva.dk',
  '+45 75 55 11 37',
  'Aarhus / Taulov',
  1,
  NOW(), 'system@crm.com', NOW(), 'system@crm.com'),
(1, 'delivery',
  'ILVA A/S Warehouse',
  'Taulov, Denmark',
  '7000',
  'Fredericia',
  'DNK',
  'Logistics Department',
  'logistics@ilva.dk',
  '+45 75 55 11 37',
  'Aarhus',
  1,
  NOW(), 'system@crm.com', NOW(), 'system@crm.com'),
-- Lead 3 - Hugga Design (China)
(3, 'legal',
  'Hugga Design',
  'Ningbo, Zhejiang Province, China',
  '315000',
  'Ningbo',
  'CHN',
  'Anders Hejgaard',
  'anders.hejgaard@huggadesign.com',
  '+86 574 5551 13137',
  'Ningbo Port',
  1,
  NOW(), 'system@crm.com', NOW(), 'system@crm.com'),
-- Lead 5 - Scan Global Logistics (forwarder)
(5, 'forwarder',
  'Scan Global Logistics A/S',
  'Nordre Frihavnsgade 4, 2100 Copenhagen',
  '2100',
  'Copenhagen',
  'DNK',
  'Anne Lyngshede Lund',
  'anne.lund@scangl.com',
  '+45 32 48 00 17',
  'Copenhagen Port',
  1,
  NOW(), 'system@crm.com', NOW(), 'system@crm.com');

-- Insert sample deals
INSERT INTO crm_deal (
    Id, CustomerId, OwnerId, LeadId, Name, Description, Stage,
    ExpectedRevenue, ActualRevenue, CloseDate, ContactId, Note,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(401, 10501, 101, 3, 'ILVA A/S - Enterprise CRM Implementation',
 'Full implementation of CRM system for ILVA A/S with 50 users. Including custom integrations with existing tools.',
 'Closed Won', 45000.00, 45000.00, '2025-10-02', 301,
 'Converted from lead. Very satisfied with demo. Ready to start immediately.',
 '2025-10-02 16:45:00', 'sales@crm.com', '2025-10-02 16:50:00', 'sales@crm.com'),
(402, 10545, 101, 12, 'Deal with Response Vietnam Co., Ltd. (sample)',
 'CRM solution for managing logistics operations across multiple countries.',
 'Closed Won', 56000.00, 56000.00, '2025-10-30', 302,
 'Converted from lead. Very satisfied with demo. Ready to start immediately.',
 '2025-10-02 16:45:00', 'sales@crm.com', '2025-10-02 16:50:00', 'sales@crm.com'),
(403, 10570, 103, NULL, 'Hugga Design - Design Process Automation',
 'CRM with focus on design process automation and project management.',
 'Prospecting', 32000.00, NULL, '2025-10-20', 303,
 'Prospecting. Waiting for feedback from their design team.',
'2025-09-28 10:00:00', 'sales@crm.com', '2025-10-02 14:00:00', 'sales@crm.com');

-- Additional deals to match mock data
INSERT INTO crm_deal (
    Id, CustomerId, OwnerId, LeadId, Name, Description, Stage,
    ExpectedRevenue, ActualRevenue, CloseDate, ContactId, Note,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(404, 10547, 101, NULL, 'Paul Anthony Furnishings - UK Market Expansion',
 'Strategic partnership for CRM integration with UK furniture market.',
 'Prospecting', 95000.00, NULL, '2025-11-01', 304,
 'Partner deal. Discussing white-label options and revenue sharing.',
 '2025-09-20 09:00:00', 'sales@crm.com', '2025-10-01 16:00:00', 'sales@crm.com'),
(405, 10571, 102, NULL, 'Scan Global Logistics - Logistics CRM Solution',
 'CRM solution for managing logistics operations across multiple countries.',
 'Prospecting', 56000.00, NULL, '2025-10-30', 305,
 'Initial discussions. They need to evaluate current systems first.',
 '2025-09-15 13:30:00', 'sales@crm.com', '2025-10-02 11:00:00', 'sales@crm.com'),
(406, 10501, 101, NULL, 'ILVA A/S - Additional Licenses',
 'Expansion deal for 25 additional user licenses due to team growth.',
 'Prospecting', 15000.00, NULL, '2025-11-15', 301,
 'Upsell deal. They\'re growing fast and need more seats.',
 '2025-10-03 10:00:00', 'sales@crm.com', '2025-10-03 10:00:00', 'sales@crm.com'),
(407, 10573, 101, NULL, 'Core One A/S - Manufacturing Process CRM',
 'CRM implementation for manufacturing process optimization.',
 'Prospecting', 22000.00, NULL, '2025-10-25', 306,
 'Interested in manufacturing process automation capabilities.',
 '2025-10-01 15:00:00', 'sales@crm.com', '2025-10-02 13:00:00', 'sales@crm.com'),
(408, 10574, 102, NULL, 'Thami Shipping - Logistics Integration',
 'Integration with shipping and freight management systems.',
 'Prospecting', 18000.00, NULL, '2025-10-18', 307,
 'Technical requirements gathered. Preparing detailed quotation.',
 '2025-09-25 14:00:00', 'sales@crm.com', '2025-10-02 16:00:00', 'sales@crm.com');

-- Insert sample assignees
INSERT INTO crm_assignee (
    Id, RelationType, RelationId, UserEmail, Role, AssignedAt, Notes,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(7001, 'lead', 1, 'henrik.kristensen@coreone.dk', 'owner', '2025-10-01 08:30:00', 'Primary owner for ILVA lead',
 '2025-10-01 08:30:00', 'system@crm.com', '2025-10-01 08:30:00', 'system@crm.com'),
(7002, 'lead', 2, 'anders.rask@coreone.dk', 'owner', '2025-09-28 14:20:00', 'Handles Response Vietnam lead',
 '2025-09-28 14:20:00', 'system@crm.com', '2025-09-28 14:20:00', 'system@crm.com'),
(7003, 'lead', 3, 'karina.skaerlund@coreone.dk', 'owner', '2025-09-25 10:00:00', 'Converted to customer',
 '2025-09-25 10:00:00', 'system@crm.com', '2025-09-25 10:00:00', 'system@crm.com'),
(7004, 'deal', 401, 'henrik.kristensen@coreone.dk', 'owner', '2025-10-02 16:45:00', 'Lead conversion owner for ILVA deal',
 '2025-10-02 16:45:00', 'sales@crm.com', '2025-10-02 16:45:00', 'sales@crm.com'),
(7005, 'deal', 402, 'henrik.kristensen@coreone.dk', 'owner', '2025-10-02 16:45:00', 'Primary AE for Response Vietnam deal',
 '2025-10-02 16:45:00', 'sales@crm.com', '2025-10-02 16:45:00', 'sales@crm.com'),
(7006, 'deal', 402, 'anders.rask@coreone.dk', 'collaborator', '2025-10-02 14:30:00', 'Supports pricing and logistics',
 '2025-10-02 14:30:00', 'sales@crm.com', '2025-10-02 14:30:00', 'sales@crm.com'),
(7007, 'deal', 403, 'karina.skaerlund@coreone.dk', 'owner', '2025-09-28 10:00:00', 'Owner for Hugga Design project',
 '2025-09-28 10:00:00', 'sales@crm.com', '2025-09-28 10:00:00', 'sales@crm.com'),
(7008, 'customer', 10501, 'henrik.kristensen@coreone.dk', 'owner', '2025-10-02 16:45:00', 'Account owner for ILVA A/S',
 '2025-10-02 16:45:00', 'sales@crm.com', '2025-10-02 16:45:00', 'sales@crm.com'),
(7009, 'customer', 10545, 'anders.rask@coreone.dk', 'owner', '2025-10-02 09:00:00', 'Account owner for Response Vietnam',
 '2025-10-02 09:00:00', 'sales@crm.com', '2025-10-02 09:00:00', 'sales@crm.com'),
(7010, 'customer', 10570, 'karina.skaerlund@coreone.dk', 'owner', '2025-09-28 10:00:00', 'Account owner for Hugga Design',
 '2025-09-28 10:00:00', 'sales@crm.com', '2025-09-28 10:00:00', 'sales@crm.com');

INSERT INTO crm_quotation (
    Id, QuotationNumber, Name, Description, TotalAmount, Status, ValidUntil,
    Notes, CustomerId, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(501, 'QT-2025-001', 'CRM Enterprise Package - ILVA A/S',
 'Full CRM implementation with 50 user licenses, custom integrations, and training.',
 45000.00, 'accepted', '2025-10-15',
 'Includes implementation, training, and 1 year support.',
 10501, -- ILVA A/S
 '2025-10-02 16:45:00', 'sales@crm.com', '2025-10-02 16:50:00', 'sales@crm.com'),

(502, 'QT-2025-002', 'CRM Upgrade - Response Vietnam Co., Ltd.',
 'Upgrade to enterprise plan with logistics features for 200 users.',
 78000.00, 'sent', '2025-10-20',
 'Pending approval from finance department.',
 10545, -- Response Vietnam Co., Ltd.
 '2025-10-03 09:30:00', 'sales@crm.com', '2025-10-03 09:30:00', 'sales@crm.com'),

(503, 'QT-2025-003', 'CRM Professional Package - Hugga Design',
 'Professional CRM package with design process automation features.',
 32000.00, 'sent', '2025-10-25',
 'Includes custom design workflow integrations.',
 10570, -- Hugga Design
 '2025-09-28 10:15:00', 'sales@crm.com', '2025-10-01 14:30:00', 'sales@crm.com'),

(504, 'QT-2025-004', 'CRM Procurement Integration - John Lewis',
 'CRM integration package focused on procurement and supplier management.',
 75000.00, 'draft', '2025-11-01',
 'Custom integration with existing procurement systems.',
 NULL, -- Không có customer tương ứng
 '2025-09-27 13:30:00', 'sales@crm.com', '2025-10-02 14:00:00', 'sales@crm.com'),

(505, 'QT-2025-005', 'CRM Taiwan Localization - Mr Living',
 'CRM package with full Mandarin localization and Taiwan market features.',
 28000.00, 'accepted', '2025-09-20',
 'Includes Mandarin interface and local payment integrations.',
 10571, -- Mr Living CO. LTD
 '2025-09-10 10:30:00', 'sales@crm.com', '2025-09-15 13:30:00', 'sales@crm.com'),

(506, 'QT-2025-006', 'CRM Analytics Add-on - ILVA A/S',
 'Advanced analytics module add-on for existing CRM implementation.',
 15000.00, 'sent', '2025-11-20',
 'Additional module for existing customers.',
 10501, -- ILVA A/S
 '2025-10-05 09:15:00', 'sales@crm.com', '2025-10-05 09:15:00', 'sales@crm.com'),

(507, 'QT-2025-007', 'CRM Multi-language Module - Response Vietnam',
 'Multi-language support module for international operations.',
 22000.00, 'draft', '2025-11-05',
 'Supports Vietnamese, English, and Chinese interfaces.',
 10545, -- Response Vietnam Co., Ltd.
 '2025-10-03 14:15:00', 'sales@crm.com', '2025-10-03 14:15:00', 'sales@crm.com'),

(508, 'QT-2025-008', 'CRM Logistics Solution - Khori International',
 'CRM solution tailored for logistics and supply chain management.',
 42000.00, 'sent', '2025-12-05',
 'Includes FTA documentation and customs clearance features.',
 NULL, -- Không có customer tương ứng
 '2025-09-20 09:30:00', 'sales@crm.com', '2025-09-28 09:30:00', 'sales@crm.com');

-- Insert sample deal quotations
INSERT INTO crm_deal_quotation (
    Id, DealId, QuotationNumber, CreatedOn, CreatedBy
) VALUES
(1, 402, 'QO03815', '2025-12-10 14:56:31', NULL);

-- Insert sample activities
INSERT INTO crm_activity (
    Id, ExternalId, ConversationId, SourceFrom, Subject, Body, ActivityType,
    CreatedOn, DueAt, CompletedAt, Status, Priority, AssignedTo,
    RelationType, RelationId, CreatedBy, CallDuration, CallOutcome,
    UpdatedOn, UpdatedBy
) VALUES
(1, 'email_001', 'conv_001', 'gmail-email',
 'Inquiry about CRM solution for furniture business',
 'Hi, I''m interested in learning more about your CRM solution for our furniture manufacturing company ILVA A/S.',
 'email', '2025-10-01 08:30:00', NULL, NULL, 'completed', 'normal', 'sales@crm.com',
 'lead', 1, 'system@crm.com', NULL, NULL, '2025-10-01 08:30:00', 'system@crm.com'),
(2, 'call_001', NULL, 'phone-call',
 'Follow-up call with ILVA A/S',
 'Discussed product features and pricing for furniture business. Client interested in enterprise plan.',
 'call', '2025-10-01 14:15:00', NULL, '2025-10-01 14:45:00', 'completed', 'high', 'sales@crm.com',
 'lead', 1, 'sales@crm.com', 30, 'positive', '2025-10-01 14:45:00', 'sales@crm.com');

-- Additional activities to align with mock data
INSERT INTO crm_activity (
    Id, ExternalId, ConversationId, SourceFrom, Subject, Body, ActivityType,
    CreatedOn, DueAt, CompletedAt, Status, Priority, AssignedTo,
    RelationType, RelationId, CreatedBy, CallDuration, CallOutcome,
    UpdatedOn, UpdatedBy
) VALUES
(3, 'email_002', 'conv_002', 'gmail-email',
 'Meeting request for demo - Response Vietnam',
 'Would like to schedule a product demo for manufacturing processes at Response Vietnam.',
 'email', '2025-09-28 14:20:00', NULL, NULL, 'completed', 'high', 'sales@crm.com',
 'lead', 2, 'sales@crm.com', NULL, NULL, '2025-09-28 14:20:00', 'sales@crm.com'),
(4, 'task_001', NULL, 'system-task',
 'Send proposal to Response Vietnam Co., Ltd.',
 'Prepare and send detailed proposal with pricing for manufacturing CRM package.',
 'task', '2025-10-02 09:00:00', '2025-10-04 17:00:00', NULL, 'in_progress', 'high', 'sales@crm.com',
 'lead', 2, 'sales@crm.com', NULL, NULL, '2025-10-02 09:00:00', 'sales@crm.com'),
(5, 'meeting_001', NULL, 'calendar-meeting',
 'Product Demo - StartupXYZ',
 'Online demo session covering all features and Q&A.',
 'meeting', '2025-09-26 10:00:00', '2025-09-30 15:00:00', '2025-09-30 16:00:00', 'completed', 'high', 'sales@crm.com',
 'lead', 3, 'sales@crm.com', NULL, NULL, '2025-09-30 16:00:00', 'sales@crm.com'),
(6, 'email_003', 'conv_003', 'gmail-email',
 'Contract signed!',
 'Great news! We\'ve signed the contract and ready to proceed.',
 'email', '2025-10-02 16:30:00', NULL, NULL, 'completed', 'normal', 'sales@crm.com',
 'deal', 401, 'sales@crm.com', NULL, NULL, '2025-10-02 16:30:00', 'sales@crm.com'),
(7, 'note_001', NULL, 'system-note',
 'Client meeting notes',
 'Discussed implementation timeline. Client prefers starting in Q4 2025.',
 'note', '2025-10-01 11:30:00', NULL, NULL, 'completed', 'normal', 'sales@crm.com',
 'lead', 4, 'sales@crm.com', NULL, NULL, '2025-10-01 11:30:00', 'sales@crm.com'),
(8, 'call_002', NULL, 'phone-call',
 'Budget discussion',
 'Client needs to discuss with finance team. Follow up next week.',
 'call', '2025-10-01 13:20:00', NULL, '2025-10-01 13:45:00', 'completed', 'normal', 'marketing@crm.com',
 'lead', 4, NULL, NULL, NULL, '2025-10-01 13:45:00', 'marketing@crm.com'),
(9, 'task_002', NULL, 'system-task',
 'Follow up with Digital Agency',
 'Check interest level and schedule intro call.',
 'task', '2025-10-02 16:00:00', '2025-10-05 12:00:00', NULL, 'open', 'low', 'sales@crm.com',
 'lead', 5, NULL, NULL, NULL, '2025-10-02 16:00:00', 'sales@crm.com'),
(12, 'meeting_002', NULL, 'calendar-meeting',
 'Qualification call - Cloud Services Asia',
 'Assess fit and discuss requirements.',
 'meeting', '2025-10-02 13:00:00', '2025-10-04 10:00:00', NULL, 'open', 'high', 'sales@crm.com',
 'lead', 7, NULL, NULL, NULL, '2025-10-02 13:00:00', 'sales@crm.com'),
(14, 'call_003', NULL, 'phone-call',
 'Discovery call - FinTech Innovations',
 'Understanding their current process and pain points.',
 'call', '2025-10-02 08:30:00', NULL, '2025-10-02 09:15:00', 'completed', 'high', 'marketing@crm.com',
 'lead', 9, NULL, NULL, NULL, '2025-10-02 09:15:00', 'marketing@crm.com'),
(15, 'task_004', NULL, 'system-task',
 'Send case studies',
 'Share relevant case studies from financial services industry.',
 'task', '2025-10-02 09:00:00', '2025-10-03 12:00:00', NULL, 'open', 'normal', 'marketing@crm.com',
 'lead', 9, NULL, NULL, NULL, '2025-10-02 09:00:00', 'marketing@crm.com'),
(16, 'email_006', 'conv_006', 'gmail-email',
 'CRM Upgrade Proposal - Final Terms',
 'Attached is our final proposal for the CRM upgrade to enterprise plan. Includes pricing for 200 users and advanced logistics features.',
 'email', '2025-10-02 11:00:00', NULL, NULL, 'completed', 'high', 'sales@crm.com',
 'deal', 402, NULL, NULL, NULL, '2025-10-02 11:00:00', 'sales@crm.com'),
(17, 'call_004', NULL, 'phone-call',
 'Pricing negotiation - Response Vietnam Co., Ltd.',
 'Discussed pricing concerns. Client wants to reduce setup costs by 15%. Agreed to review and get back within 48 hours.',
 'call', '2025-10-02 14:30:00', NULL, '2025-10-02 15:15:00', 'completed', 'high', 'sales@crm.com',
 'deal', 402, NULL, NULL, NULL, '2025-10-02 15:15:00', 'sales@crm.com'),
(18, 'task_005', NULL, 'system-task',
 'Prepare revised pricing proposal',
 'Create updated proposal with reduced setup costs for Response Vietnam Co., Ltd.. Target 10% reduction while maintaining margins.',
 'task', '2025-10-02 15:30:00', '2025-10-03 17:00:00', NULL, 'in_progress', 'high', 'sales@crm.com',
 'deal', 402, NULL, NULL, NULL, '2025-10-02 15:30:00', 'sales@crm.com'),
(19, 'meeting_003', NULL, 'calendar-meeting',
 'Implementation Timeline Review - Response Vietnam Co., Ltd.',
 'Reviewed 6-week implementation timeline. Client concerned about business disruption during transition.',
 'meeting', '2025-10-01 09:00:00', '2025-10-01 10:30:00', '2025-10-01 10:30:00', 'completed', 'high', 'sales@crm.com',
 'deal', 402, NULL, NULL, NULL, '2025-10-01 10:30:00', 'sales@crm.com');

-- Insert sample emails
INSERT INTO crm_email (
    Id, MailId, ConversationId, Subject, BodyPreview, BodyContent, BodyContentType,
    Importance, HasAttachments, IsRead, IsDraft, FromName, FromAddress,
    SenderName, SenderAddress, ToRecipients, CcRecipients, BccRecipients,
    ReplyTo, ReceivedDateTime, SentDateTime, CreatedDateTime,
    LastModifiedDateTime, InternetMessageId, ActivityId,
    CreatedOn, CreatedBy
) VALUES
(1, 'AAMkAGI2THVSAAA=', 'AAQkAGI2THVSAAA=',
 'Inquiry about CRM Enterprise Solution for Furniture Business',
 'Hi, I''m interested in learning more about your CRM solution...',
 '<html><body><p>Hi,</p><p>I''m interested in learning more about your CRM solution...</p></body></html>',
 'html', 'normal', 1, 1, 0,
 'Henrik Kristensen', 'henrik.kristensen@ilva.dk',
 'Henrik Kristensen', 'henrik.kristensen@ilva.dk',
 '[{"name":"Sales Team","address":"sales@crm.com"}]',
 '[{"name":"Henrik Kristensen","address":"henrik.kristensen@ilva.dk"}]',
 '[]', '[]',
 '2025-10-01 08:30:00', '2025-10-01 08:28:00', '2025-10-01 08:28:00', '2025-10-01 08:30:00',
 '<email_001@startupxyz.io>', 1,
 '2025-10-01 08:28:00', 'system@crm.com');

-- Insert sample SharePoint files
INSERT INTO crm_sharepoint_files (
    Id, ItemId, DriveId, Name, WebUrl, DownloadUrl, MimeType, Size,
    Etag, Ctag, CreatedBy, CreatedDatetime, LastModifiedBy, LastModifiedDatetime,
    ParentId, ParentName, ParentPath, RawJson, CreatedOn, UpdatedOn, UpdatedBy
) VALUES
(9001, '01ABCDILVA001', 'drive-main', 'ILVA A/S Contract.pdf',
 'https://contoso.sharepoint.com/sites/crm/ILVA/Contract.pdf',
 'https://contoso.sharepoint.com/sites/crm/ILVA/Contract.pdf?download=1',
 'application/pdf', 524288,
 'etag-ilva-1', 'ctag-ilva-1',
 'henrik.kristensen@ilva.dk', '2025-10-01 08:35:00',
 'sales@crm.com', '2025-10-02 16:45:00',
 'folder-ilva-contracts', 'Contracts', '/Accounts/ILVA/Contracts',
 '{"id":"01ABCDILVA001","driveId":"drive-main","name":"ILVA A/S Contract.pdf","webUrl":"https://contoso.sharepoint.com/sites/crm/ILVA/Contract.pdf"}',
 '2025-10-02 16:45:00', '2025-10-02 16:50:00', 'sales@crm.com'),
(9002, '01RESPVIEPROPOSAL', 'drive-main', 'Response Vietnam - Proposal.docx',
 'https://contoso.sharepoint.com/sites/crm/Response/Proposal.docx',
 'https://contoso.sharepoint.com/sites/crm/Response/Proposal.docx?download=1',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 262144,
 'etag-response-1', 'ctag-response-1',
 'karina.skaelund@responsevietnam.com', '2025-09-28 14:25:00',
 'sales@crm.com', '2025-10-02 15:30:00',
 'folder-response-proposals', 'Proposals', '/Leads/Response/Proposals',
 '{"id":"01RESPVIEPROPOSAL","driveId":"drive-main","name":"Response Vietnam - Proposal.docx","webUrl":"https://contoso.sharepoint.com/sites/crm/Response/Proposal.docx"}',
 '2025-10-02 15:30:00', '2025-10-02 15:32:00', 'sales@crm.com'),
(9003, '01HUGGADSGNWIREFRAME', 'drive-design', 'Hugga Design - Wireframes.zip',
 'https://contoso.sharepoint.com/sites/crm/Hugga/Wireframes.zip',
 'https://contoso.sharepoint.com/sites/crm/Hugga/Wireframes.zip?download=1',
 'application/zip', 7340032,
 'etag-hugga-1', 'ctag-hugga-1',
 'anders.hejgaard@huggadesign.com', '2025-09-28 11:15:00',
 'sales@crm.com', '2025-10-01 14:30:00',
 'folder-hugga-design', 'Design Assets', '/Deals/Hugga/Design Assets',
 '{"id":"01HUGGADSGNWIREFRAME","driveId":"drive-design","name":"Hugga Design - Wireframes.zip","webUrl":"https://contoso.sharepoint.com/sites/crm/Hugga/Wireframes.zip"}',
 '2025-10-01 14:30:00', '2025-10-01 14:35:00', 'sales@crm.com'),
(9004, '01JOHNLEWISBRIEF', 'drive-main', 'John Lewis - Procurement Brief.pdf',
 'https://contoso.sharepoint.com/sites/crm/JohnLewis/ProcurementBrief.pdf',
 'https://contoso.sharepoint.com/sites/crm/JohnLewis/ProcurementBrief.pdf?download=1',
 'application/pdf', 1048576,
 'etag-john-1', 'ctag-john-1',
 'alice.forbes@johnlewis.com', '2025-09-27 13:45:00',
 'sales@crm.com', '2025-10-02 14:05:00',
 'folder-john-briefs', 'Briefs', '/Partners/JohnLewis/Briefs',
 '{"id":"01JOHNLEWISBRIEF","driveId":"drive-main","name":"John Lewis - Procurement Brief.pdf","webUrl":"https://contoso.sharepoint.com/sites/crm/JohnLewis/ProcurementBrief.pdf"}',
 '2025-10-02 14:05:00', '2025-10-02 14:10:00', 'sales@crm.com'),
(9005, '01RESPTIMELINE', 'drive-main', 'Response Vietnam - Implementation Timeline.xlsx',
 'https://contoso.sharepoint.com/sites/crm/Response/ImplementationTimeline.xlsx',
 'https://contoso.sharepoint.com/sites/crm/Response/ImplementationTimeline.xlsx?download=1',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 393216,
 'etag-response-2', 'ctag-response-2',
 'sales@crm.com', '2025-10-01 09:10:00',
 'sales@crm.com', '2025-10-02 15:45:00',
 'folder-response-projects', 'Project Docs', '/Deals/Response/Project Docs',
 '{"id":"01RESPTIMELINE","driveId":"drive-main","name":"Response Vietnam - Implementation Timeline.xlsx","webUrl":"https://contoso.sharepoint.com/sites/crm/Response/ImplementationTimeline.xlsx"}',
 '2025-10-02 15:45:00', '2025-10-02 15:46:00', 'sales@crm.com');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================
-- FINAL VERIFICATION
-- ===========================================

SELECT '🔄 CRM DATABASE RESET COMPLETED SUCCESSFULLY!' AS status;
SELECT 'Database has been completely reset and repopulated.' AS message;

-- Show final statistics
SELECT
    'Users' AS entity,
    COUNT(*) AS count
FROM crm_user
UNION ALL
SELECT 'Leads', COUNT(*) FROM crm_lead
UNION ALL
SELECT 'Customers', COUNT(*) FROM crm_customer
UNION ALL
SELECT 'Contacts', COUNT(*) FROM crm_contact
UNION ALL
SELECT 'Deals', COUNT(*) FROM crm_deal
UNION ALL
SELECT 'DealQuotations', COUNT(*) FROM crm_deal_quotation
UNION ALL
SELECT 'Quotations', COUNT(*) FROM crm_quotation
UNION ALL
SELECT 'Activities', COUNT(*) FROM crm_activity
UNION ALL
SELECT 'Emails', COUNT(*) FROM crm_email
UNION ALL
SELECT 'SharePointFiles', COUNT(*) FROM crm_sharepoint_files
UNION ALL
SELECT 'Notifications', COUNT(*) FROM crm_notifications
ORDER BY count DESC;

SELECT CONCAT('Total records in reset database: ',
    (SELECT COUNT(*) FROM crm_user) +
    (SELECT COUNT(*) FROM crm_lead) +
    (SELECT COUNT(*) FROM crm_customer) +
    (SELECT COUNT(*) FROM crm_contact) +
    (SELECT COUNT(*) FROM crm_deal) +
    (SELECT COUNT(*) FROM crm_deal_quotation) +
    (SELECT COUNT(*) FROM crm_quotation) +
    (SELECT COUNT(*) FROM crm_activity) +
    (SELECT COUNT(*) FROM crm_email) +
    (SELECT COUNT(*) FROM crm_sharepoint_files) +
    (SELECT COUNT(*) FROM crm_notifications)
) AS final_summary;


SELECT '✅ Notification tables seeded successfully!' AS status,
  (SELECT COUNT(*) FROM crm_notifications) AS total_notifications;


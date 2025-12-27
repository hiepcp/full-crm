-- =============================================================================
-- CRM Initial Schema Migration
-- Version: V1.0.0
-- Description: Initial database schema for CRM system
-- Tables: User, Customer, CustomerAddress, Contact, Lead, LeadAddress,
--         Activity, ActivityAttachment, ActivityParticipant, Appointment,
--         Email, Deal, DealQuotation, Quotation, PipelineLog, Assignee
-- =============================================================================

-- =============================================================================
-- CORE TABLES (No Dependencies)
-- =============================================================================

-- User table
CREATE TABLE IF NOT EXISTS `User` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `Name` VARCHAR(255) NOT NULL,
  `Email` VARCHAR(255) NOT NULL UNIQUE,
  `FirstName` VARCHAR(255) DEFAULT NULL,
  `LastName` VARCHAR(255) DEFAULT NULL,
  `PhoneNumber` VARCHAR(50) DEFAULT NULL,
  `AvatarUrl` VARCHAR(500) DEFAULT NULL,
  `Role` VARCHAR(50) DEFAULT 'User',
  `Department` VARCHAR(100) DEFAULT NULL,
  `IsActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX IX_User_Email ON `User` (Email);
CREATE INDEX IX_User_IsActive ON `User` (IsActive);
CREATE INDEX IX_User_CreatedAt ON `User` (CreatedAt);

-- Customer table
CREATE TABLE IF NOT EXISTS `Customer` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `Name` VARCHAR(255) NOT NULL,
  `Email` VARCHAR(255) DEFAULT NULL,
  `PhoneNumber` VARCHAR(50) DEFAULT NULL,
  `CompanyName` VARCHAR(255) DEFAULT NULL,
  `Industry` VARCHAR(100) DEFAULT NULL,
  `Website` VARCHAR(500) DEFAULT NULL,
  `TaxId` VARCHAR(50) DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Active',
  `CustomerType` VARCHAR(50) DEFAULT 'Individual', -- Individual, Corporate
  `Notes` TEXT DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX IX_Customer_Email ON Customer (Email);
CREATE INDEX IX_Customer_CompanyName ON Customer (CompanyName);
CREATE INDEX IX_Customer_Status ON Customer (Status);
CREATE INDEX IX_Customer_CreatedAt ON Customer (CreatedAt);

-- Contact table
CREATE TABLE IF NOT EXISTS `Contact` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `FirstName` VARCHAR(255) NOT NULL,
  `LastName` VARCHAR(255) NOT NULL,
  `Email` VARCHAR(255) DEFAULT NULL,
  `PhoneNumber` VARCHAR(50) DEFAULT NULL,
  `MobileNumber` VARCHAR(50) DEFAULT NULL,
  `JobTitle` VARCHAR(100) DEFAULT NULL,
  `Department` VARCHAR(100) DEFAULT NULL,
  `CompanyName` VARCHAR(255) DEFAULT NULL,
  `LinkedIn` VARCHAR(500) DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Active',
  `Notes` TEXT DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX IX_Contact_Email ON Contact (Email);
CREATE INDEX IX_Contact_LastName ON Contact (LastName);
CREATE INDEX IX_Contact_CompanyName ON Contact (CompanyName);
CREATE INDEX IX_Contact_Status ON Contact (Status);
CREATE INDEX IX_Contact_CreatedAt ON Contact (CreatedAt);

-- Lead table
CREATE TABLE IF NOT EXISTS `Lead` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `FirstName` VARCHAR(255) NOT NULL,
  `LastName` VARCHAR(255) NOT NULL,
  `Email` VARCHAR(255) DEFAULT NULL,
  `PhoneNumber` VARCHAR(50) DEFAULT NULL,
  `CompanyName` VARCHAR(255) DEFAULT NULL,
  `JobTitle` VARCHAR(100) DEFAULT NULL,
  `Industry` VARCHAR(100) DEFAULT NULL,
  `LeadSource` VARCHAR(100) DEFAULT NULL, -- Website, Referral, Cold Call, etc.
  `Status` VARCHAR(50) DEFAULT 'New', -- New, Contacted, Qualified, Lost, Converted
  `Score` INT DEFAULT 0,
  `EstimatedValue` DECIMAL(18, 2) DEFAULT NULL,
  `EstimatedCloseDate` DATE DEFAULT NULL,
  `Notes` TEXT DEFAULT NULL,
  `ConvertedToCustomerId` CHAR(36) DEFAULT NULL,
  `ConvertedAt` DATETIME DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX IX_Lead_Email ON Lead (Email);
CREATE INDEX IX_Lead_Status ON Lead (Status);
CREATE INDEX IX_Lead_LeadSource ON Lead (LeadSource);
CREATE INDEX IX_Lead_CreatedAt ON Lead (CreatedAt);
CREATE INDEX IX_Lead_ConvertedToCustomerId ON Lead (ConvertedToCustomerId);

-- Quotation table
CREATE TABLE IF NOT EXISTS `Quotation` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `QuotationNumber` VARCHAR(50) NOT NULL UNIQUE,
  `Title` VARCHAR(255) NOT NULL,
  `Description` TEXT DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Draft', -- Draft, Sent, Accepted, Rejected, Expired
  `TotalAmount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  `DiscountAmount` DECIMAL(18, 2) DEFAULT 0.00,
  `TaxAmount` DECIMAL(18, 2) DEFAULT 0.00,
  `GrandTotal` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  `Currency` VARCHAR(10) DEFAULT 'USD',
  `ValidUntil` DATE DEFAULT NULL,
  `Notes` TEXT DEFAULT NULL,
  `Terms` TEXT DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX IX_Quotation_QuotationNumber ON Quotation (QuotationNumber);
CREATE INDEX IX_Quotation_Status ON Quotation (Status);
CREATE INDEX IX_Quotation_CreatedAt ON Quotation (CreatedAt);

-- =============================================================================
-- DEPENDENT TABLES (Foreign Keys)
-- =============================================================================

-- CustomerAddress table
CREATE TABLE IF NOT EXISTS `CustomerAddress` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `CustomerId` CHAR(36) NOT NULL,
  `AddressType` VARCHAR(50) DEFAULT 'Billing', -- Billing, Shipping, Other
  `Street` VARCHAR(255) DEFAULT NULL,
  `City` VARCHAR(100) DEFAULT NULL,
  `State` VARCHAR(100) DEFAULT NULL,
  `PostalCode` VARCHAR(20) DEFAULT NULL,
  `Country` VARCHAR(100) DEFAULT NULL,
  `IsPrimary` BOOLEAN NOT NULL DEFAULT FALSE,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (CustomerId) REFERENCES Customer(Id) ON DELETE CASCADE
);

CREATE INDEX IX_CustomerAddress_CustomerId ON CustomerAddress (CustomerId);
CREATE INDEX IX_CustomerAddress_AddressType ON CustomerAddress (AddressType);

-- LeadAddress table
CREATE TABLE IF NOT EXISTS `LeadAddress` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `LeadId` CHAR(36) NOT NULL,
  `AddressType` VARCHAR(50) DEFAULT 'Primary',
  `Street` VARCHAR(255) DEFAULT NULL,
  `City` VARCHAR(100) DEFAULT NULL,
  `State` VARCHAR(100) DEFAULT NULL,
  `PostalCode` VARCHAR(20) DEFAULT NULL,
  `Country` VARCHAR(100) DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (LeadId) REFERENCES Lead(Id) ON DELETE CASCADE
);

CREATE INDEX IX_LeadAddress_LeadId ON LeadAddress (LeadId);

-- Deal table
CREATE TABLE IF NOT EXISTS `Deal` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `Title` VARCHAR(255) NOT NULL,
  `CustomerId` CHAR(36) DEFAULT NULL,
  `ContactId` CHAR(36) DEFAULT NULL,
  `Amount` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  `Currency` VARCHAR(10) DEFAULT 'USD',
  `Stage` VARCHAR(50) DEFAULT 'Prospecting', -- Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost
  `Probability` INT DEFAULT 0, -- 0-100%
  `ExpectedCloseDate` DATE DEFAULT NULL,
  `ActualCloseDate` DATE DEFAULT NULL,
  `LeadSource` VARCHAR(100) DEFAULT NULL,
  `Description` TEXT DEFAULT NULL,
  `Notes` TEXT DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Open', -- Open, Won, Lost
  `LostReason` VARCHAR(255) DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (CustomerId) REFERENCES Customer(Id) ON DELETE SET NULL,
  FOREIGN KEY (ContactId) REFERENCES Contact(Id) ON DELETE SET NULL
);

CREATE INDEX IX_Deal_CustomerId ON Deal (CustomerId);
CREATE INDEX IX_Deal_ContactId ON Deal (ContactId);
CREATE INDEX IX_Deal_Stage ON Deal (Stage);
CREATE INDEX IX_Deal_Status ON Deal (Status);
CREATE INDEX IX_Deal_ExpectedCloseDate ON Deal (ExpectedCloseDate);
CREATE INDEX IX_Deal_CreatedAt ON Deal (CreatedAt);

-- DealQuotation table (junction table between Deal and Quotation)
CREATE TABLE IF NOT EXISTS `DealQuotation` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `DealId` CHAR(36) NOT NULL,
  `QuotationId` CHAR(36) NOT NULL,
  `IsActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (DealId) REFERENCES Deal(Id) ON DELETE CASCADE,
  FOREIGN KEY (QuotationId) REFERENCES Quotation(Id) ON DELETE CASCADE,
  UNIQUE KEY UK_DealQuotation (DealId, QuotationId)
);

CREATE INDEX IX_DealQuotation_DealId ON DealQuotation (DealId);
CREATE INDEX IX_DealQuotation_QuotationId ON DealQuotation (QuotationId);

-- Activity table
CREATE TABLE IF NOT EXISTS `Activity` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `Subject` VARCHAR(255) NOT NULL,
  `ActivityType` VARCHAR(50) NOT NULL, -- Call, Email, Meeting, Task, Note
  `Description` TEXT DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Planned', -- Planned, In Progress, Completed, Cancelled
  `Priority` VARCHAR(50) DEFAULT 'Medium', -- Low, Medium, High, Urgent
  `StartDate` DATETIME DEFAULT NULL,
  `EndDate` DATETIME DEFAULT NULL,
  `DueDate` DATETIME DEFAULT NULL,
  `CompletedAt` DATETIME DEFAULT NULL,
  `CustomerId` CHAR(36) DEFAULT NULL,
  `ContactId` CHAR(36) DEFAULT NULL,
  `DealId` CHAR(36) DEFAULT NULL,
  `LeadId` CHAR(36) DEFAULT NULL,
  `AssignedToUserId` CHAR(36) DEFAULT NULL,
  `Location` VARCHAR(255) DEFAULT NULL,
  `Notes` TEXT DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (CustomerId) REFERENCES Customer(Id) ON DELETE CASCADE,
  FOREIGN KEY (ContactId) REFERENCES Contact(Id) ON DELETE CASCADE,
  FOREIGN KEY (DealId) REFERENCES Deal(Id) ON DELETE CASCADE,
  FOREIGN KEY (LeadId) REFERENCES Lead(Id) ON DELETE CASCADE,
  FOREIGN KEY (AssignedToUserId) REFERENCES `User`(Id) ON DELETE SET NULL
);

CREATE INDEX IX_Activity_ActivityType ON Activity (ActivityType);
CREATE INDEX IX_Activity_Status ON Activity (Status);
CREATE INDEX IX_Activity_Priority ON Activity (Priority);
CREATE INDEX IX_Activity_CustomerId ON Activity (CustomerId);
CREATE INDEX IX_Activity_ContactId ON Activity (ContactId);
CREATE INDEX IX_Activity_DealId ON Activity (DealId);
CREATE INDEX IX_Activity_LeadId ON Activity (LeadId);
CREATE INDEX IX_Activity_AssignedToUserId ON Activity (AssignedToUserId);
CREATE INDEX IX_Activity_DueDate ON Activity (DueDate);
CREATE INDEX IX_Activity_CreatedAt ON Activity (CreatedAt);

-- ActivityAttachment table
CREATE TABLE IF NOT EXISTS `ActivityAttachment` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `ActivityId` CHAR(36) NOT NULL,
  `FileName` VARCHAR(255) NOT NULL,
  `FileSize` BIGINT DEFAULT NULL,
  `FilePath` VARCHAR(500) NOT NULL,
  `FileType` VARCHAR(100) DEFAULT NULL,
  `Description` TEXT DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ActivityId) REFERENCES Activity(Id) ON DELETE CASCADE
);

CREATE INDEX IX_ActivityAttachment_ActivityId ON ActivityAttachment (ActivityId);

-- ActivityParticipant table
CREATE TABLE IF NOT EXISTS `ActivityParticipant` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `ActivityId` CHAR(36) NOT NULL,
  `UserId` CHAR(36) DEFAULT NULL,
  `ContactId` CHAR(36) DEFAULT NULL,
  `ParticipantType` VARCHAR(50) DEFAULT 'Attendee', -- Organizer, Required, Optional, Attendee
  `ResponseStatus` VARCHAR(50) DEFAULT 'Pending', -- Pending, Accepted, Declined, Tentative
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ActivityId) REFERENCES Activity(Id) ON DELETE CASCADE,
  FOREIGN KEY (UserId) REFERENCES `User`(Id) ON DELETE CASCADE,
  FOREIGN KEY (ContactId) REFERENCES Contact(Id) ON DELETE CASCADE
);

CREATE INDEX IX_ActivityParticipant_ActivityId ON ActivityParticipant (ActivityId);
CREATE INDEX IX_ActivityParticipant_UserId ON ActivityParticipant (UserId);
CREATE INDEX IX_ActivityParticipant_ContactId ON ActivityParticipant (ContactId);

-- Appointment table
CREATE TABLE IF NOT EXISTS `Appointment` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `Title` VARCHAR(255) NOT NULL,
  `Description` TEXT DEFAULT NULL,
  `StartTime` DATETIME NOT NULL,
  `EndTime` DATETIME NOT NULL,
  `Location` VARCHAR(255) DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, Confirmed, Completed, Cancelled
  `CustomerId` CHAR(36) DEFAULT NULL,
  `ContactId` CHAR(36) DEFAULT NULL,
  `DealId` CHAR(36) DEFAULT NULL,
  `AssignedToUserId` CHAR(36) DEFAULT NULL,
  `ReminderMinutes` INT DEFAULT 15,
  `IsAllDay` BOOLEAN NOT NULL DEFAULT FALSE,
  `Notes` TEXT DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (CustomerId) REFERENCES Customer(Id) ON DELETE CASCADE,
  FOREIGN KEY (ContactId) REFERENCES Contact(Id) ON DELETE CASCADE,
  FOREIGN KEY (DealId) REFERENCES Deal(Id) ON DELETE CASCADE,
  FOREIGN KEY (AssignedToUserId) REFERENCES `User`(Id) ON DELETE SET NULL
);

CREATE INDEX IX_Appointment_StartTime ON Appointment (StartTime);
CREATE INDEX IX_Appointment_Status ON Appointment (Status);
CREATE INDEX IX_Appointment_CustomerId ON Appointment (CustomerId);
CREATE INDEX IX_Appointment_ContactId ON Appointment (ContactId);
CREATE INDEX IX_Appointment_DealId ON Appointment (DealId);
CREATE INDEX IX_Appointment_AssignedToUserId ON Appointment (AssignedToUserId);

-- Email table
CREATE TABLE IF NOT EXISTS `Email` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `Subject` VARCHAR(500) NOT NULL,
  `Body` TEXT DEFAULT NULL,
  `FromAddress` VARCHAR(255) NOT NULL,
  `ToAddress` TEXT NOT NULL, -- Can be comma-separated
  `CcAddress` TEXT DEFAULT NULL,
  `BccAddress` TEXT DEFAULT NULL,
  `SentAt` DATETIME DEFAULT NULL,
  `Status` VARCHAR(50) DEFAULT 'Draft', -- Draft, Queued, Sent, Failed, Bounced
  `Direction` VARCHAR(50) DEFAULT 'Outbound', -- Inbound, Outbound
  `CustomerId` CHAR(36) DEFAULT NULL,
  `ContactId` CHAR(36) DEFAULT NULL,
  `DealId` CHAR(36) DEFAULT NULL,
  `LeadId` CHAR(36) DEFAULT NULL,
  `HasAttachments` BOOLEAN NOT NULL DEFAULT FALSE,
  `ErrorMessage` TEXT DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedBy` VARCHAR(255) DEFAULT NULL,
  `UpdatedAt` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (CustomerId) REFERENCES Customer(Id) ON DELETE SET NULL,
  FOREIGN KEY (ContactId) REFERENCES Contact(Id) ON DELETE SET NULL,
  FOREIGN KEY (DealId) REFERENCES Deal(Id) ON DELETE SET NULL,
  FOREIGN KEY (LeadId) REFERENCES Lead(Id) ON DELETE SET NULL
);

CREATE INDEX IX_Email_Status ON Email (Status);
CREATE INDEX IX_Email_SentAt ON Email (SentAt);
CREATE INDEX IX_Email_CustomerId ON Email (CustomerId);
CREATE INDEX IX_Email_ContactId ON Email (ContactId);
CREATE INDEX IX_Email_DealId ON Email (DealId);
CREATE INDEX IX_Email_LeadId ON Email (LeadId);
CREATE INDEX IX_Email_CreatedAt ON Email (CreatedAt);

-- PipelineLog table (tracks deal stage changes)
CREATE TABLE IF NOT EXISTS `PipelineLog` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `DealId` CHAR(36) NOT NULL,
  `FromStage` VARCHAR(50) DEFAULT NULL,
  `ToStage` VARCHAR(50) NOT NULL,
  `ChangeReason` TEXT DEFAULT NULL,
  `ChangedByUserId` CHAR(36) DEFAULT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (DealId) REFERENCES Deal(Id) ON DELETE CASCADE,
  FOREIGN KEY (ChangedByUserId) REFERENCES `User`(Id) ON DELETE SET NULL
);

CREATE INDEX IX_PipelineLog_DealId ON PipelineLog (DealId);
CREATE INDEX IX_PipelineLog_CreatedAt ON PipelineLog (CreatedAt);
CREATE INDEX IX_PipelineLog_ChangedByUserId ON PipelineLog (ChangedByUserId);

-- Assignee table (generic assignment tracking)
CREATE TABLE IF NOT EXISTS `Assignee` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `EntityType` VARCHAR(50) NOT NULL, -- Deal, Lead, Activity, etc.
  `EntityId` CHAR(36) NOT NULL,
  `UserId` CHAR(36) NOT NULL,
  `AssignedRole` VARCHAR(50) DEFAULT 'Owner', -- Owner, Collaborator, Viewer
  `AssignedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `AssignedBy` VARCHAR(255) NOT NULL,
  `CreatedBy` VARCHAR(255) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UserId) REFERENCES `User`(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Assignee_EntityType_EntityId ON Assignee (EntityType, EntityId);
CREATE INDEX IX_Assignee_UserId ON Assignee (UserId);
CREATE INDEX IX_Assignee_AssignedAt ON Assignee (AssignedAt);

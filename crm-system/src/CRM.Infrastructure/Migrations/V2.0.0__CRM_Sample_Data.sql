-- =============================================================================
-- CRM Sample Data Migration
-- Version: V2.0.0
-- Description: Sample data for CRM system development and testing
-- Tables: User, Customer, CustomerAddress, Contact, Lead, LeadAddress,
--         Activity, Appointment, Deal, Quotation, DealQuotation, Email
-- =============================================================================

-- =============================================================================
-- SAMPLE USERS
-- =============================================================================

INSERT INTO `User` (Id, Name, Email, FirstName, LastName, PhoneNumber, AvatarUrl, Role, Department, IsActive, CreatedBy, CreatedAt)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Smith', 'john.smith@company.com', 'John', 'Smith', '+1-555-0101', NULL, 'Admin', 'Sales', TRUE, 'System', '2024-01-01 08:00:00'),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'sarah.johnson@company.com', 'Sarah', 'Johnson', '+1-555-0102', NULL, 'User', 'Sales', TRUE, 'System', '2024-01-01 08:00:00'),
  ('33333333-3333-3333-3333-333333333333', 'Michael Brown', 'michael.brown@company.com', 'Michael', 'Brown', '+1-555-0103', NULL, 'User', 'Marketing', TRUE, 'System', '2024-01-01 08:00:00'),
  ('44444444-4444-4444-4444-444444444444', 'Emily Davis', 'emily.davis@company.com', 'Emily', 'Davis', '+1-555-0104', NULL, 'User', 'Support', TRUE, 'System', '2024-01-01 08:00:00'),
  ('55555555-5555-5555-5555-555555555555', 'David Wilson', 'david.wilson@company.com', 'David', 'Wilson', '+1-555-0105', NULL, 'Manager', 'Sales', TRUE, 'System', '2024-01-01 08:00:00');

-- =============================================================================
-- SAMPLE CUSTOMERS
-- =============================================================================

INSERT INTO `Customer` (Id, Name, Email, PhoneNumber, CompanyName, Industry, Website, TaxId, Status, CustomerType, Notes, CreatedBy, CreatedAt)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Acme Corporation', 'info@acmecorp.com', '+1-555-1001', 'Acme Corporation', 'Technology', 'https://acmecorp.com', 'TAX-001', 'Active', 'Corporate', 'Long-term customer since 2020', 'john.smith@company.com', '2024-01-15 10:00:00'),
  ('c2222222-2222-2222-2222-222222222222', 'TechStart Inc', 'contact@techstart.io', '+1-555-1002', 'TechStart Inc', 'Software', 'https://techstart.io', 'TAX-002', 'Active', 'Corporate', 'Fast-growing startup', 'sarah.johnson@company.com', '2024-02-01 11:00:00'),
  ('c3333333-3333-3333-3333-333333333333', 'Global Retail Co', 'support@globalretail.com', '+1-555-1003', 'Global Retail Co', 'Retail', 'https://globalretail.com', 'TAX-003', 'Active', 'Corporate', 'Chain of 50+ stores nationwide', 'michael.brown@company.com', '2024-02-15 14:00:00'),
  ('c4444444-4444-4444-4444-444444444444', 'Jane Anderson', 'jane.anderson@email.com', '+1-555-1004', NULL, NULL, NULL, NULL, 'Active', 'Individual', 'Small business owner', 'emily.davis@company.com', '2024-03-01 09:00:00'),
  ('c5555555-5555-5555-5555-555555555555', 'Manufacturing Plus', 'info@mfgplus.com', '+1-555-1005', 'Manufacturing Plus', 'Manufacturing', 'https://mfgplus.com', 'TAX-005', 'Inactive', 'Corporate', 'On hold pending contract renewal', 'david.wilson@company.com', '2024-03-20 15:00:00');

-- =============================================================================
-- SAMPLE CUSTOMER ADDRESSES
-- =============================================================================

INSERT INTO `CustomerAddress` (Id, CustomerId, AddressType, Street, City, State, PostalCode, Country, IsPrimary, CreatedBy, CreatedAt)
VALUES
  ('ca111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Billing', '123 Main Street', 'New York', 'NY', '10001', 'USA', TRUE, 'john.smith@company.com', '2024-01-15 10:00:00'),
  ('ca222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Shipping', '456 Warehouse Rd', 'Newark', 'NJ', '07102', 'USA', FALSE, 'john.smith@company.com', '2024-01-15 10:05:00'),
  ('ca333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'Billing', '789 Innovation Blvd', 'San Francisco', 'CA', '94102', 'USA', TRUE, 'sarah.johnson@company.com', '2024-02-01 11:00:00'),
  ('ca444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 'Billing', '321 Commerce Ave', 'Chicago', 'IL', '60601', 'USA', TRUE, 'michael.brown@company.com', '2024-02-15 14:00:00'),
  ('ca555555-5555-5555-5555-555555555555', 'c4444444-4444-4444-4444-444444444444', 'Billing', '654 Oak Lane', 'Austin', 'TX', '78701', 'USA', TRUE, 'emily.davis@company.com', '2024-03-01 09:00:00');

-- =============================================================================
-- SAMPLE CONTACTS
-- =============================================================================

INSERT INTO `Contact` (Id, FirstName, LastName, Email, PhoneNumber, MobileNumber, JobTitle, Department, CompanyName, LinkedIn, Status, Notes, CreatedBy, CreatedAt)
VALUES
  ('ct111111-1111-1111-1111-111111111111', 'Robert', 'Martinez', 'robert.martinez@acmecorp.com', '+1-555-2001', '+1-555-2101', 'CTO', 'Engineering', 'Acme Corporation', 'https://linkedin.com/in/robertmartinez', 'Active', 'Technical decision maker', 'john.smith@company.com', '2024-01-15 10:30:00'),
  ('ct222222-2222-2222-2222-222222222222', 'Lisa', 'Chen', 'lisa.chen@techstart.io', '+1-555-2002', '+1-555-2102', 'CEO', 'Executive', 'TechStart Inc', 'https://linkedin.com/in/lisachen', 'Active', 'Founder and CEO', 'sarah.johnson@company.com', '2024-02-01 11:30:00'),
  ('ct333333-3333-3333-3333-333333333333', 'James', 'Taylor', 'james.taylor@globalretail.com', '+1-555-2003', '+1-555-2103', 'VP of Operations', 'Operations', 'Global Retail Co', 'https://linkedin.com/in/jamestaylor', 'Active', 'Handles procurement', 'michael.brown@company.com', '2024-02-15 14:30:00'),
  ('ct444444-4444-4444-4444-444444444444', 'Patricia', 'Moore', 'patricia.moore@techstart.io', '+1-555-2004', '+1-555-2104', 'CFO', 'Finance', 'TechStart Inc', NULL, 'Active', 'Budget approver', 'sarah.johnson@company.com', '2024-02-10 12:00:00'),
  ('ct555555-5555-5555-5555-555555555555', 'Kevin', 'Lee', 'kevin.lee@mfgplus.com', '+1-555-2005', '+1-555-2105', 'Purchasing Manager', 'Procurement', 'Manufacturing Plus', NULL, 'Inactive', 'Contract on hold', 'david.wilson@company.com', '2024-03-20 15:00:00');

-- =============================================================================
-- SAMPLE LEADS
-- =============================================================================

INSERT INTO `Lead` (Id, FirstName, LastName, Email, PhoneNumber, CompanyName, JobTitle, Industry, LeadSource, Status, Score, EstimatedValue, EstimatedCloseDate, Notes, ConvertedToCustomerId, ConvertedAt, CreatedBy, CreatedAt)
VALUES
  ('l1111111-1111-1111-1111-111111111111', 'Thomas', 'White', 'thomas.white@newventure.com', '+1-555-3001', 'New Venture LLC', 'Director of IT', 'Technology', 'Website', 'Qualified', 75, 50000.00, '2024-06-30', 'Interested in enterprise solution', NULL, NULL, 'john.smith@company.com', '2024-03-10 09:00:00'),
  ('l2222222-2222-2222-2222-222222222222', 'Maria', 'Garcia', 'maria.garcia@innovate.com', '+1-555-3002', 'Innovate Solutions', 'VP Sales', 'Software', 'Referral', 'Contacted', 60, 75000.00, '2024-07-15', 'Referred by existing customer', NULL, NULL, 'sarah.johnson@company.com', '2024-03-15 10:00:00'),
  ('l3333333-3333-3333-3333-333333333333', 'Daniel', 'Harris', 'daniel.harris@startup.io', '+1-555-3003', 'Startup Dynamics', 'Founder', 'Consulting', 'Cold Call', 'New', 40, 25000.00, '2024-08-01', 'Initial contact made', NULL, NULL, 'michael.brown@company.com', '2024-03-25 11:00:00'),
  ('l4444444-4444-4444-4444-444444444444', 'Jennifer', 'Clark', 'jennifer.clark@enterprise.com', '+1-555-3004', 'Enterprise Holdings', 'CIO', 'Finance', 'Website', 'Qualified', 85, 150000.00, '2024-06-15', 'High-value opportunity', NULL, NULL, 'david.wilson@company.com', '2024-04-01 08:00:00'),
  ('l5555555-5555-5555-5555-555555555555', 'Christopher', 'Lewis', 'chris.lewis@converted.com', '+1-555-3005', 'Converted Corp', 'Manager', 'Retail', 'Website', 'Converted', 90, 100000.00, NULL, 'Successfully converted to customer', 'c1111111-1111-1111-1111-111111111111', '2024-02-01 10:00:00', 'john.smith@company.com', '2024-01-10 09:00:00');

-- =============================================================================
-- SAMPLE LEAD ADDRESSES
-- =============================================================================

INSERT INTO `LeadAddress` (Id, LeadId, AddressType, Street, City, State, PostalCode, Country, CreatedBy, CreatedAt)
VALUES
  ('la111111-1111-1111-1111-111111111111', 'l1111111-1111-1111-1111-111111111111', 'Primary', '999 Tech Park Dr', 'Seattle', 'WA', '98101', 'USA', 'john.smith@company.com', '2024-03-10 09:00:00'),
  ('la222222-2222-2222-2222-222222222222', 'l2222222-2222-2222-2222-222222222222', 'Primary', '888 Innovation Way', 'Boston', 'MA', '02101', 'USA', 'sarah.johnson@company.com', '2024-03-15 10:00:00'),
  ('la333333-3333-3333-3333-333333333333', 'l4444444-4444-4444-4444-444444444444', 'Primary', '777 Financial Plaza', 'Charlotte', 'NC', '28201', 'USA', 'david.wilson@company.com', '2024-04-01 08:00:00');

-- =============================================================================
-- SAMPLE QUOTATIONS
-- =============================================================================

INSERT INTO `Quotation` (Id, QuotationNumber, Title, Description, Status, TotalAmount, DiscountAmount, TaxAmount, GrandTotal, Currency, ValidUntil, Notes, Terms, CreatedBy, CreatedAt)
VALUES
  ('q1111111-1111-1111-1111-111111111111', 'QT-2024-001', 'Enterprise Software License', 'Annual license for 100 users', 'Sent', 100000.00, 10000.00, 7200.00, 97200.00, 'USD', '2024-04-30', 'First year discount applied', 'Payment terms: Net 30', 'john.smith@company.com', '2024-03-01 09:00:00'),
  ('q2222222-2222-2222-2222-222222222222', 'QT-2024-002', 'Implementation Services', 'Full implementation and training package', 'Accepted', 50000.00, 5000.00, 3600.00, 48600.00, 'USD', '2024-05-15', 'Accepted by client', 'Payment terms: 50% upfront, 50% on completion', 'sarah.johnson@company.com', '2024-03-15 10:00:00'),
  ('q3333333-3333-3333-3333-333333333333', 'QT-2024-003', 'Support Package - Premium', '24/7 premium support for 1 year', 'Draft', 25000.00, 0.00, 2000.00, 27000.00, 'USD', '2024-06-30', 'Draft pending approval', 'Payment terms: Quarterly billing', 'michael.brown@company.com', '2024-04-05 11:00:00'),
  ('q4444444-4444-4444-4444-444444444444', 'QT-2024-004', 'Custom Development', 'Custom feature development - 200 hours', 'Rejected', 40000.00, 0.00, 3200.00, 43200.00, 'USD', '2024-04-15', 'Client went with competitor', 'Payment terms: Monthly milestones', 'emily.davis@company.com', '2024-03-20 14:00:00');

-- =============================================================================
-- SAMPLE DEALS
-- =============================================================================

INSERT INTO `Deal` (Id, Title, CustomerId, ContactId, Amount, Currency, Stage, Probability, ExpectedCloseDate, ActualCloseDate, LeadSource, Description, Notes, Status, LostReason, CreatedBy, CreatedAt)
VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Acme Corp - Software Expansion', 'c1111111-1111-1111-1111-111111111111', 'ct111111-1111-1111-1111-111111111111', 100000.00, 'USD', 'Proposal', 70, '2024-05-31', NULL, 'Existing Customer', 'Expansion of current software license', 'Positive feedback from stakeholders', 'Open', NULL, 'john.smith@company.com', '2024-03-01 09:00:00'),
  ('d2222222-2222-2222-2222-222222222222', 'TechStart - Implementation', 'c2222222-2222-2222-2222-222222222222', 'ct222222-2222-2222-2222-222222222222', 50000.00, 'USD', 'Negotiation', 85, '2024-04-30', NULL, 'Referral', 'Full implementation services package', 'Contract review in progress', 'Open', NULL, 'sarah.johnson@company.com', '2024-03-15 10:00:00'),
  ('d3333333-3333-3333-3333-333333333333', 'Global Retail - POS Integration', 'c3333333-3333-3333-3333-333333333333', 'ct333333-3333-3333-3333-333333333333', 150000.00, 'USD', 'Qualification', 60, '2024-07-31', NULL, 'Cold Call', 'Point of sale system integration', 'Waiting for technical requirements', 'Open', NULL, 'michael.brown@company.com', '2024-04-01 11:00:00'),
  ('d4444444-4444-4444-4444-444444444444', 'Manufacturing Plus - Consulting', 'c5555555-5555-5555-5555-555555555555', 'ct555555-5555-5555-5555-555555555555', 30000.00, 'USD', 'Prospecting', 30, '2024-06-30', NULL, 'Website', 'Process optimization consulting', 'Initial discussion scheduled', 'Lost', 'Budget constraints', 'david.wilson@company.com', '2024-03-20 15:00:00'),
  ('d5555555-5555-5555-5555-555555555555', 'Closed Deal - Training', 'c1111111-1111-1111-1111-111111111111', 'ct111111-1111-1111-1111-111111111111', 25000.00, 'USD', 'Closed Won', 100, '2024-03-15', '2024-03-14', 'Existing Customer', 'Employee training program', 'Successfully closed', 'Won', NULL, 'john.smith@company.com', '2024-02-15 09:00:00');

-- =============================================================================
-- SAMPLE DEAL QUOTATIONS (Junction Table)
-- =============================================================================

INSERT INTO `DealQuotation` (Id, DealId, QuotationId, IsActive, CreatedBy, CreatedAt)
VALUES
  ('dq111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', TRUE, 'john.smith@company.com', '2024-03-01 09:00:00'),
  ('dq222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'q2222222-2222-2222-2222-222222222222', TRUE, 'sarah.johnson@company.com', '2024-03-15 10:00:00'),
  ('dq333333-3333-3333-3333-333333333333', 'd5555555-5555-5555-5555-555555555555', 'q2222222-2222-2222-2222-222222222222', FALSE, 'john.smith@company.com', '2024-02-15 09:00:00');

-- =============================================================================
-- SAMPLE ACTIVITIES
-- =============================================================================

INSERT INTO `Activity` (Id, Subject, ActivityType, Description, Status, Priority, StartDate, EndDate, DueDate, CompletedAt, CustomerId, ContactId, DealId, LeadId, AssignedToUserId, Location, Notes, CreatedBy, CreatedAt)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Initial discovery call with Acme', 'Call', 'Discuss current pain points and requirements', 'Completed', 'High', '2024-03-01 14:00:00', '2024-03-01 15:00:00', '2024-03-01 14:00:00', '2024-03-01 15:00:00', 'c1111111-1111-1111-1111-111111111111', 'ct111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', NULL, '11111111-1111-1111-1111-111111111111', 'Phone', 'Productive conversation, sent proposal', 'john.smith@company.com', '2024-03-01 09:00:00'),
  ('a2222222-2222-2222-2222-222222222222', 'Product demo for TechStart', 'Meeting', 'Live demonstration of software features', 'Completed', 'High', '2024-03-18 10:00:00', '2024-03-18 11:30:00', '2024-03-18 10:00:00', '2024-03-18 11:30:00', 'c2222222-2222-2222-2222-222222222222', 'ct222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', NULL, '22222222-2222-2222-2222-222222222222', 'Online - Zoom', 'Very positive response from team', 'sarah.johnson@company.com', '2024-03-15 10:00:00'),
  ('a3333333-3333-3333-3333-333333333333', 'Follow-up email to Global Retail', 'Email', 'Send technical documentation and pricing', 'Completed', 'Medium', NULL, NULL, '2024-04-03', '2024-04-03 09:30:00', 'c3333333-3333-3333-3333-333333333333', 'ct333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', NULL, '33333333-3333-3333-3333-333333333333', NULL, 'Documentation sent', 'michael.brown@company.com', '2024-04-01 11:00:00'),
  ('a4444444-4444-4444-4444-444444444444', 'Prepare proposal for New Venture', 'Task', 'Create customized proposal based on requirements', 'In Progress', 'High', NULL, NULL, '2024-04-15', NULL, NULL, NULL, NULL, 'l1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, 'Working on proposal draft', 'john.smith@company.com', '2024-03-12 10:00:00'),
  ('a5555555-5555-5555-5555-555555555555', 'Quarterly business review with Acme', 'Meeting', 'Review performance metrics and discuss expansion', 'Planned', 'Medium', '2024-04-25 14:00:00', '2024-04-25 16:00:00', '2024-04-25 14:00:00', NULL, 'c1111111-1111-1111-1111-111111111111', 'ct111111-1111-1111-1111-111111111111', NULL, NULL, '11111111-1111-1111-1111-111111111111', 'Acme Corp Office, NY', 'Prepare Q1 performance report', 'john.smith@company.com', '2024-04-10 09:00:00');

-- =============================================================================
-- SAMPLE ACTIVITY PARTICIPANTS
-- =============================================================================

INSERT INTO `ActivityParticipant` (Id, ActivityId, UserId, ContactId, ParticipantType, ResponseStatus, CreatedBy, CreatedAt)
VALUES
  ('ap111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, 'Organizer', 'Accepted', 'john.smith@company.com', '2024-03-01 09:00:00'),
  ('ap222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', NULL, 'ct111111-1111-1111-1111-111111111111', 'Required', 'Accepted', 'john.smith@company.com', '2024-03-01 09:00:00'),
  ('ap333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, 'Organizer', 'Accepted', 'sarah.johnson@company.com', '2024-03-15 10:00:00'),
  ('ap444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', NULL, 'ct222222-2222-2222-2222-222222222222', 'Required', 'Accepted', 'sarah.johnson@company.com', '2024-03-15 10:00:00'),
  ('ap555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', NULL, 'Optional', 'Pending', 'john.smith@company.com', '2024-04-10 09:00:00');

-- =============================================================================
-- SAMPLE APPOINTMENTS
-- =============================================================================

INSERT INTO `Appointment` (Id, Title, Description, StartTime, EndTime, Location, Status, CustomerId, ContactId, DealId, AssignedToUserId, ReminderMinutes, IsAllDay, Notes, CreatedBy, CreatedAt)
VALUES
  ('apt11111-1111-1111-1111-111111111111', 'Contract signing with TechStart', 'Final contract review and signing ceremony', '2024-04-20 10:00:00', '2024-04-20 11:00:00', 'TechStart Office, San Francisco', 'Scheduled', 'c2222222-2222-2222-2222-222222222222', 'ct222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 30, FALSE, 'Bring contract copies and company seal', 'sarah.johnson@company.com', '2024-04-15 09:00:00'),
  ('apt22222-2222-2222-2222-222222222222', 'Site visit - Global Retail HQ', 'Tour of retail facilities and IT infrastructure', '2024-04-30 09:00:00', '2024-04-30 12:00:00', 'Global Retail HQ, Chicago', 'Confirmed', 'c3333333-3333-3333-3333-333333333333', 'ct333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 60, FALSE, 'Bring technical questionnaire', 'michael.brown@company.com', '2024-04-20 10:00:00'),
  ('apt33333-3333-3333-3333-333333333333', 'Kickoff meeting - Acme expansion', 'Project kickoff for software expansion', '2024-05-05 14:00:00', '2024-05-05 16:00:00', 'Online - Microsoft Teams', 'Scheduled', 'c1111111-1111-1111-1111-111111111111', 'ct111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 15, FALSE, 'Prepare project timeline and milestones', 'john.smith@company.com', '2024-04-25 11:00:00');

-- =============================================================================
-- SAMPLE EMAILS
-- =============================================================================

INSERT INTO `Email` (Id, Subject, Body, FromAddress, ToAddress, CcAddress, BccAddress, SentAt, Status, Direction, CustomerId, ContactId, DealId, LeadId, HasAttachments, ErrorMessage, CreatedBy, CreatedAt)
VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Proposal for Enterprise Software License', 'Dear Robert,\n\nThank you for taking the time to discuss your requirements. Please find attached our proposal for the enterprise software license.\n\nBest regards,\nJohn Smith', 'john.smith@company.com', 'robert.martinez@acmecorp.com', NULL, NULL, '2024-03-01 16:00:00', 'Sent', 'Outbound', 'c1111111-1111-1111-1111-111111111111', 'ct111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', NULL, TRUE, NULL, 'john.smith@company.com', '2024-03-01 15:45:00'),
  ('e2222222-2222-2222-2222-222222222222', 'Thank you for the demo', 'Hi Sarah,\n\nThank you for the excellent product demonstration. Our team was very impressed. We would like to move forward with the implementation.\n\nBest,\nLisa Chen', 'lisa.chen@techstart.io', 'sarah.johnson@company.com', 'patricia.moore@techstart.io', NULL, '2024-03-18 14:30:00', 'Sent', 'Inbound', 'c2222222-2222-2222-2222-222222222222', 'ct222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', NULL, FALSE, NULL, 'sarah.johnson@company.com', '2024-03-18 14:30:00'),
  ('e3333333-3333-3333-3333-333333333333', 'Follow-up: Technical Documentation', 'Dear James,\n\nAs promised, please find attached the technical documentation and integration guides for our POS integration solution.\n\nPlease let me know if you have any questions.\n\nBest regards,\nMichael Brown', 'michael.brown@company.com', 'james.taylor@globalretail.com', NULL, NULL, '2024-04-03 09:30:00', 'Sent', 'Outbound', 'c3333333-3333-3333-3333-333333333333', 'ct333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', NULL, TRUE, NULL, 'michael.brown@company.com', '2024-04-03 09:15:00'),
  ('e4444444-4444-4444-4444-444444444444', 'Introduction to our services', 'Dear Thomas,\n\nThank you for your interest in our enterprise solutions. I would love to schedule a call to discuss your specific needs.\n\nBest regards,\nJohn Smith', 'john.smith@company.com', 'thomas.white@newventure.com', NULL, NULL, NULL, 'Draft', 'Outbound', NULL, NULL, NULL, 'l1111111-1111-1111-1111-111111111111', FALSE, NULL, 'john.smith@company.com', '2024-03-11 10:00:00');

-- =============================================================================
-- SAMPLE PIPELINE LOGS
-- =============================================================================

INSERT INTO `PipelineLog` (Id, DealId, FromStage, ToStage, ChangeReason, ChangedByUserId, CreatedBy, CreatedAt)
VALUES
  ('pl111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Prospecting', 'Qualification', 'Initial requirements gathering completed', '11111111-1111-1111-1111-111111111111', 'john.smith@company.com', '2024-03-05 10:00:00'),
  ('pl222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'Qualification', 'Proposal', 'Proposal sent to client', '11111111-1111-1111-1111-111111111111', 'john.smith@company.com', '2024-03-10 14:00:00'),
  ('pl333333-3333-3333-3333-333333333333', 'd2222222-2222-2222-2222-222222222222', 'Proposal', 'Negotiation', 'Contract negotiations started', '22222222-2222-2222-2222-222222222222', 'sarah.johnson@company.com', '2024-03-20 11:00:00'),
  ('pl444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Negotiation', 'Closed Won', 'Contract signed and executed', '11111111-1111-1111-1111-111111111111', 'john.smith@company.com', '2024-03-14 16:00:00');

-- =============================================================================
-- SAMPLE ASSIGNEES
-- =============================================================================

INSERT INTO `Assignee` (Id, EntityType, EntityId, UserId, AssignedRole, AssignedAt, AssignedBy, CreatedBy, CreatedAt)
VALUES
  ('as111111-1111-1111-1111-111111111111', 'Deal', 'd1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Owner', '2024-03-01 09:00:00', 'System', 'System', '2024-03-01 09:00:00'),
  ('as222222-2222-2222-2222-222222222222', 'Deal', 'd2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Owner', '2024-03-15 10:00:00', 'System', 'System', '2024-03-15 10:00:00'),
  ('as333333-3333-3333-3333-333333333333', 'Deal', 'd3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Owner', '2024-04-01 11:00:00', 'System', 'System', '2024-04-01 11:00:00'),
  ('as444444-4444-4444-4444-444444444444', 'Lead', 'l1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Owner', '2024-03-10 09:00:00', 'System', 'System', '2024-03-10 09:00:00'),
  ('as555555-5555-5555-5555-555555555555', 'Activity', 'a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Owner', '2024-03-12 10:00:00', 'System', 'System', '2024-03-12 10:00:00');

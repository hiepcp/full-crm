-- Sample data for crm_contact table
-- Generated from mockContacts.json
-- This script inserts 11 sample contact records for testing and development

USE crm_sys_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Insert sample contact data
INSERT INTO crm_contact (
    Id, CustomerId, Salutation, FirstName, MiddleName, LastName, Email,
    Phone, MobilePhone, Fax, JobTitle, Address, OwnerId, Notes, IsPrimary,
    CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(301, 10501, 'Mr', 'Henrik', 'Sig', 'Kristensen', 'henrik.kristensen@ilva.dk',
 '+45 75 55 11 37', '+45 75 55 11 37', NULL, 'Sales Responsible',
 'ILVA A/S, Aarhus, Denmark', 101,
 'Main sales contact for ILVA A/S. Handles FOB customer requirements.', 1,
 '2025-10-02 16:45:00', 'sales@crm.com', '2025-10-02 16:45:00', 'sales@crm.com'),

(302, 10545, 'Ms', 'Karina', '', 'Skærlund', 'karina.skaelund@responsevietnam.com',
 '+84 2743 653 974', '+84 2743 653 974', NULL, 'Import Manager',
 'Response Vietnam Co., Ltd., Ho Chi Minh City, Vietnam', 102,
 'Main contact for Response Vietnam Co., Ltd. Handles EXW delivery terms.', 1,
 '2025-10-01 12:00:00', 'sales@crm.com', '2025-10-01 12:00:00', 'sales@crm.com'),

(303, 10570, 'Mr', 'Anders', '', 'Hejgaard', 'anders.hejgaard@huggadesign.com',
 '+8657338962412', '+8657338962412', NULL, 'Design Manager',
 'Hugga Design, Ningbo, China', 103,
 'Main contact for Hugga Design. Handles Mandarin text requirements.', 1,
 '2025-09-28 10:00:00', 'sales@crm.com', '2025-10-01 14:30:00', 'sales@crm.com'),

(312, 10570, 'Ms', 'Lynn', '', 'Chen', 'lynn.chen@huggadesign.com',
 '+8657338962412', '+8657338962412', NULL, 'Project Coordinator',
 'Hugga Design, Ningbo, China', 103,
 'Project coordination contact for Hugga Design.', 0,
 '2025-10-03 11:00:00', 'sales@crm.com', '2025-10-03 11:00:00', 'sales@crm.com'),

(304, 10547, 'Mr', 'Paul', '', 'Anthony', 'paul.anthony@paulanthony.co.uk',
 '+447796754806', '+447796754806', NULL, 'Managing Director',
 'Paul Anthony Furnishings, London, United Kingdom', 101,
 'Main contact for UK operations.', 1,
 '2025-09-20 09:00:00', 'sales@crm.com', '2025-09-30 16:00:00', 'sales@crm.com'),

(305, 10571, 'Ms', 'Anne', 'Lyngshede', 'Lund', 'anne.lund@scangl.com',
 '+886-916-099359', '+886-916-099359', NULL, 'Branch Manager',
 'Scan Global Logistics A/S, DK-8260 Viby J., Denmark', 102,
 'Main contact for logistics partnership. Vietnam office coordination.', 1,
 '2025-09-15 13:30:00', 'sales@crm.com', '2025-10-02 11:00:00', 'sales@crm.com'),

(306, 10573, 'Mr', 'Frank', 'F', 'Hsia', 'frank.hsia@khoriintl.com',
 '+82-32-584-9971', '+82-32-584-9971', NULL, 'Production Coordinator',
 'Khori International Inc, Incheon, Korea', 101,
 'Main contact for production coordination and manufacturing partnership. Website: www.khori.co.kr', 1,
 '2025-09-05 14:00:00', 'sales@crm.com', '2025-09-28 09:30:00', 'sales@crm.com'),

(307, 10574, 'Ms', 'Alice', 'Forbes', '', 'alice.forbes@johnlewis.com',
 '+44 20 7931 4100', '+44 20 7931 4100', NULL, 'Branch Manager',
 'Ligentia A/S, Aarhus, Denmark', 102,
 'Vietnam logistics contact. Handles FOB shipments and customs clearance. Website: www.johnlewis.com', 1,
 '2025-08-28 11:00:00', 'sales@crm.com', '2025-09-20 15:00:00', 'sales@crm.com'),

(309, 10501, 'Ms', 'Sarah', '', 'Johansen', 'sarah.johansen@ilva.dk',
 '+45 75 55 11 39', '+45 75 55 11 39', NULL, 'Import Coordinator',
 'ILVA A/S, Aarhus, Denmark', 101,
 'Secondary contact for ILVA A/S. Handles import coordination and customs documentation.', 0,
 '2025-10-03 09:00:00', 'sales@crm.com', '2025-10-03 09:00:00', 'sales@crm.com'),

(310, 10501, 'Mr', 'Claus', '', 'Funderskov', 'claus.funderskov@ilva.dk',
 '+45 75 55 11 37', '+45 75 55 11 37', NULL, 'Sales Manager',
 'ILVA A/S, Aarhus, Denmark', 101,
 'Additional sales contact for ILVA A/S.', 0,
 '2025-10-03 10:00:00', 'sales@crm.com', '2025-10-03 10:00:00', 'sales@crm.com'),

(311, 10501, 'Mr', 'Michael', '', 'Colberg', 'michael.colberg@ilva.dk',
 '+45 75 55 11 37', '+45 75 55 11 37', NULL, 'Account Manager',
 'ILVA A/S, Aarhus, Denmark', 101,
 'Account management contact for ILVA A/S.', 0,
 '2025-10-03 10:30:00', 'sales@crm.com', '2025-10-03 10:30:00', 'sales@crm.com');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Display success message
SELECT 'Sample contact data inserted successfully. Total records: 11' AS message;

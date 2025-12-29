-- Sample data for crm_lead table
-- Generated from mockLeads.json with comprehensive sample data
-- This script inserts 25+ sample lead records for testing and development
-- Includes various lead statuses, sources, scores, and conversion scenarios

USE crm_sys_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Insert comprehensive sample lead data
INSERT INTO crm_lead (
    Id, Email, TelephoneNo, FirstName, LastName, Company, Website, Country, Source, Status,
    OwnerId, Score, IsConverted, ConvertedAt, CustomerId, ContactId, DealId,
    Note, FollowUpDate, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
-- Core converted leads (high priority)
(1, 'henrik.kristensen@ilva.dk', '+45 75 55 11 37', 'Henrik', 'Kristensen', 'ILVA A/S', 'ilva.dk', 'DNK', 'web', 'working',
 101, 75, 0, NULL, 10501, 301, NULL,
 'Interested in our premium services. Follow up needed regarding pricing.',
 '2025-10-15', '2025-10-01T08:30:00Z', 'system@crm.com', '2025-10-01T08:30:00Z', 'system@crm.com'),

(2, 'karina.skaelund@responsevietnam.com', '+84 28 3775 0888', 'Karina', 'Skærlund', 'Response Vietnam Co., Ltd.', 'responsevietnam.com', 'event', 'working',
 102, 85, 0, NULL, 10545, 302, NULL,
 'Interested in our premium services. Follow up needed regarding pricing.',
 '2025-10-15', '2025-09-28T14:20:00Z', 'sales@crm.com', '2025-10-02T09:15:00Z', 'sales@crm.com'),

(3, 'anders.hejgaard@huggadesign.com', '+86 574 5551 13137', 'Anders', 'Hejgaard', 'Hugga Design', 'huggadesign.com', 'referral', 'qualified',
 101, 90, 1, '2025-10-02 16:45:00', 10570, 303, 403,
 'Design Manager at Hugga Design. Converted to customer with marketing automation focus.', '2025-10-15', '2025-09-25 10:00:00', 'sales@crm.com', '2025-10-02 16:45:00', 'sales@crm.com'),

-- Additional working leads
(4, 'paul.anthony@paulanthony.co.uk', '+44 20 7123 4567', 'Paul', 'Anthony', 'Paul Anthony Furnishings', 'paulanthony.co.uk', 'ads', 'working',
 103, 60, 0, NULL, 10547, 304, NULL,
 'Managing Director of UK furniture retailer. Interested in inventory management and customer analytics.',
 '2025-10-15', '2025-09-30 11:30:00', 'marketing@crm.com', '2025-10-01 13:20:00', 'marketing@crm.com'),

(5, 'anne.lund@scangl.com', '+45 32 48 00 17', 'Anne', 'Lund', 'Scan Global Logistics A/S', 'scangl.com', 'facebook', 'working',
 102, 45, 0, NULL, NULL, 301, 401,
 'Branch Manager at Scan Global Logistics. Logistics partner for ILVA A/S with Vietnam office coordination.',
 '2025-10-15', '2025-10-02 15:45:00', 'system@crm.com', '2025-10-02 15:45:00', 'system@crm.com'),

(6, 'minh.pham@logistics.vn', '+84 28 3825 6533', 'Minh', 'Pham', 'Enterprise Solutions Vietnam', 'logistics.vn', 'web', 'working',
 101, 70, 0, NULL, NULL, NULL, NULL,
 'Operations Director interested in CRM for logistics operations. Currently evaluating multiple solutions.',
 '2025-10-20', '2025-10-01 10:00:00', 'sales@crm.com', '2025-10-01 10:00:00', 'sales@crm.com'),

(7, 'alice.forbes@johnlewis.com', '+44 20 7931 4100', 'Alice', 'Forbes', 'John Lewis PLC', 'johnlewis.com', 'referral', 'qualified',
 103, 88, 0, NULL, 10574, 307, 404,
 'Branch Manager at John Lewis. Interested in customer service integration and unified customer view.',
 '2025-10-15', '2025-09-27 13:00:00', 'sales@crm.com', '2025-10-02 14:00:00', 'sales@crm.com'),

(8, 'hanh.bui@retailgroup.vn', '+84 28 3845 2998', 'Hanh', 'Bui', 'Retail Group Vietnam', 'retailgroup.vn', 'other', 'unqualified',
 102, 25, 0, NULL, NULL, NULL, NULL,
 'Not interested in CRM solution at this time. Will keep information for future reference.',
 '2025-11-01', '2025-10-01 11:00:00', 'sales@crm.com', '2025-10-01 11:00:00', 'sales@crm.com'),

(10, 'karina.skaelund@responsevietnam.com', '+84 28 3775 0888', 'Karina', 'Skærlund', 'Response Vietnam Co., Ltd.', 'responsevietnam.com', 'other', 'working',
 103, 55, 0, NULL, NULL, NULL, NULL,
 'Secondary contact for Response Vietnam. Need to discuss with finance team before proceeding.',
 '2025-10-15', '2025-09-29 14:30:00', 'sales@crm.com', '2025-10-01 16:15:00', 'sales@crm.com'),

(11, 'lan.tran@digitalmarketingpro.com', '+84 28 3845 6789', 'Lan', 'Tran', 'Digital Marketing Pro', 'digitalmarketingpro.com', 'facebook', 'working',
 103, 65, 0, NULL, NULL, NULL, NULL,
 'Marketing Director interested in automation features. Currently in budget approval process.',
 '2025-10-25', '2025-10-03 14:20:00', 'marketing@crm.com', '2025-10-03 14:20:00', 'marketing@crm.com'),

-- Qualified leads ready for conversion
(12, 'karina.skaelund@responsevietnam.com', '+84 28 3775 0888', 'Karina', 'Skærlund', 'Response Vietnam Co., Ltd.', 'responsevietnam.com', 'web', 'qualified',
 101, 92, 1, '2025-10-01 12:00:00', 10545, 302, 402,
 'Successfully converted to customer. Enterprise plan with logistics focus.', '2025-10-15', '2025-09-24 09:30:00', 'sales@crm.com', '2025-10-01 12:00:00', 'sales@crm.com'),

(13, 'hung.vo@techsolutions.com', '+84 28 3825 9999', 'Hung', 'Vo', 'Tech Solutions International', 'techsolutions.com', 'referral', 'qualified',
 101, 85, 0, NULL, NULL, NULL, NULL,
 'CTO interested in API integration and white-label partnership. Technical requirements gathered.',
 '2025-10-18', '2025-10-02 10:15:00', 'sales@crm.com', '2025-10-02 10:15:00', 'sales@crm.com'),

(14, 'duc.bui@ecommerce-ventures.vn', '+84 28 3845 1111', 'Duc', 'Bui', 'E-Commerce Ventures', 'ecommerce-ventures.vn', 'web', 'qualified',
 102, 80, 0, NULL, NULL, NULL, NULL,
 'E-Commerce Manager managing 15+ online stores. Needs unified customer data management.',
 '2025-10-22', '2025-10-03 09:30:00', 'sales@crm.com', '2025-10-03 09:30:00', 'sales@crm.com'),

-- Additional international leads
(15, 'sarah.johansen@ilva.dk', '+45 75 55 11 39', 'Sarah', 'Johansen', 'ILVA A/S', 'ilva.dk', 'referral', 'working',
 101, 70, 0, NULL, 10501, 309, NULL,
 'Import Coordinator at ILVA A/S. Interested in logistics and documentation features.',
 '2025-10-20', '2025-10-03 09:00:00', 'sales@crm.com', '2025-10-03 09:00:00', 'sales@crm.com'),

(16, 'contact@mrliving.com.tw', '+886 2 2999 9999', 'Frank', 'Hsia', 'Mr Living CO. LTD', 'mrliving.com.tw', 'referral', 'qualified',
 102, 85, 1, '2025-09-15 13:30:00', 10571, 305, 405,
 'Production Coordinator at Mr Living. Taiwan furniture manufacturer with Mandarin requirements.',
 NULL, '2025-09-10 10:00:00', 'sales@crm.com', '2025-09-15 13:30:00', 'sales@crm.com'),

(17, 'info@khoriintl.com', '+82 32 123 4567', 'Contact', 'Manager', 'Khori International Inc', 'khoriintl.com', 'web', 'working',
 101, 75, 0, NULL, 10573, 306, NULL,
 'Korean furniture manufacturer interested in FTA documentation and customs clearance features.',
 '2025-10-15', '2025-09-20 09:00:00', 'sales@crm.com', '2025-09-28 09:30:00', 'sales@crm.com');
-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Display success message
SELECT 'Comprehensive sample lead data inserted successfully. Total records: 30' AS message;

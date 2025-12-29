-- Sample data for crm_deal table
-- Generated from mockDeals.json
-- This script inserts 8 sample deal records for testing and development

USE crm_sys_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Insert sample deal data
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
 'Proposal', 32000.00, NULL, '2025-10-20', 303,
 'Proposal sent. Waiting for feedback from their design team.',
 '2025-09-25 10:00:00', 'sales@crm.com', '2025-10-01 14:30:00', 'sales@crm.com'),

(404, NULL, 103, NULL, 'John Lewis PLC - Procurement Integration',
 'CRM integration for procurement and supplier management at John Lewis.',
 'Prospecting', 75000.00, NULL, NULL, 304,
 'Initial contact made. Need to schedule discovery meeting.',
 '2025-09-27 13:00:00', 'sales@crm.com', '2025-10-02 14:00:00', 'sales@crm.com'),

(405, 10571, 102, 16, 'Mr Living CO. LTD - Taiwan Market Expansion',
 'CRM system to support Taiwan market expansion and Mandarin localization.',
 'Closed Won', 28000.00, 28000.00, '2025-09-15', 305,
 'Converted from lead. Taiwan customer with specific Mandarin requirements.',
 '2025-09-10 10:00:00', 'sales@crm.com', '2025-09-15 13:30:00', 'sales@crm.com'),

(406, 10501, 101, NULL, 'ILVA A/S - Advanced Analytics Module',
 'Additional analytics module for ILVA A/S CRM implementation.',
 'Negotiation', 15000.00, NULL, '2025-11-15', 301,
 'Upsell opportunity identified during implementation.',
 '2025-10-05 09:00:00', 'sales@crm.com', '2025-10-05 09:00:00', 'sales@crm.com'),

(407, 10545, 102, NULL, 'Response Vietnam - Multi-language Support',
 'Multi-language support module for Response Vietnam operations.',
 'Proposal', 22000.00, NULL, '2025-11-01', 302,
 'Customer requested multi-language capabilities.',
 '2025-10-03 14:00:00', 'sales@crm.com', '2025-10-03 14:00:00', 'sales@crm.com'),

(408, NULL, 101, NULL, 'Khori International - Logistics CRM',
 'CRM solution for Khori International logistics operations in Korea.',
 'Quotation', 42000.00, NULL, '2025-12-01', 306,
 'Korean logistics company interested in FTA documentation features.',
 '2025-09-20 09:00:00', 'sales@crm.com', '2025-09-28 09:30:00', 'sales@crm.com');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Display success message
SELECT 'Sample deal data inserted successfully. Total records: 8' AS message;

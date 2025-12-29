-- Sample data for crm_quotation table
-- Generated from mockQuotations.json
-- This script inserts 8 sample quotation records for testing and development

USE crm_sys_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Insert sample quotation data
INSERT INTO crm_quotation (
    Id, QuotationNumber, Name, Description, TotalAmount, Status, ValidUntil,
    Notes, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(501, 'QT-2025-001', 'CRM Enterprise Package - ILVA A/S',
 'Full CRM implementation with 50 user licenses, custom integrations, and training.',
 45000.00, 'accepted', '2025-10-15',
 'Includes implementation, training, and 1 year support.',
 '2025-10-02 16:45:00', 'sales@crm.com', '2025-10-02 16:50:00', 'sales@crm.com'),

(502, 'QT-2025-002', 'CRM Upgrade - Response Vietnam Co., Ltd.',
 'Upgrade to enterprise plan with logistics features for 200 users.',
 78000.00, 'sent', '2025-10-20',
 'Pending approval from finance department.',
 '2025-10-03 09:30:00', 'sales@crm.com', '2025-10-03 09:30:00', 'sales@crm.com'),

(503, 'QT-2025-003', 'CRM Professional Package - Hugga Design',
 'Professional CRM package with design process automation features.',
 32000.00, 'sent', '2025-10-25',
 'Includes custom design workflow integrations.',
 '2025-09-28 10:15:00', 'sales@crm.com', '2025-10-01 14:30:00', 'sales@crm.com'),

(504, 'QT-2025-004', 'CRM Procurement Integration - John Lewis',
 'CRM integration package focused on procurement and supplier management.',
 75000.00, 'draft', '2025-11-01',
 'Custom integration with existing procurement systems.',
 '2025-09-27 13:30:00', 'sales@crm.com', '2025-10-02 14:00:00', 'sales@crm.com'),

(505, 'QT-2025-005', 'CRM Taiwan Localization - Mr Living',
 'CRM package with full Mandarin localization and Taiwan market features.',
 28000.00, 'accepted', '2025-09-20',
 'Includes Mandarin interface and local payment integrations.',
 '2025-09-10 10:30:00', 'sales@crm.com', '2025-09-15 13:30:00', 'sales@crm.com'),

(506, 'QT-2025-006', 'CRM Analytics Add-on - ILVA A/S',
 'Advanced analytics module add-on for existing CRM implementation.',
 15000.00, 'sent', '2025-11-20',
 'Additional module for existing customers.',
 '2025-10-05 09:15:00', 'sales@crm.com', '2025-10-05 09:15:00', 'sales@crm.com'),

(507, 'QT-2025-007', 'CRM Multi-language Module - Response Vietnam',
 'Multi-language support module for international operations.',
 22000.00, 'draft', '2025-11-05',
 'Supports Vietnamese, English, and Chinese interfaces.',
 '2025-10-03 14:15:00', 'sales@crm.com', '2025-10-03 14:15:00', 'sales@crm.com'),

(508, 'QT-2025-008', 'CRM Logistics Solution - Khori International',
 'CRM solution tailored for logistics and supply chain management.',
 42000.00, 'sent', '2025-12-05',
 'Includes FTA documentation and customs clearance features.',
 '2025-09-20 09:30:00', 'sales@crm.com', '2025-09-28 09:30:00', 'sales@crm.com');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Display success message
SELECT 'Sample quotation data inserted successfully. Total records: 8' AS message;

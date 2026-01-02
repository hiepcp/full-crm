-- Sample data for crm_activity table
-- Generated from mockActivities.json
-- This script inserts 15 sample activity records for testing and development

USE crm_sys_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Insert sample activity data
INSERT INTO crm_activity (
    Id, ExternalId, ConversationId, SourceFrom, Subject, Body, ActivityType,
    CreatedOn, DueAt, StartAt, EndAt, CompletedAt, Status, Priority, AssignedTo,
    RelationType, RelationId, CreatedBy, CallDuration, CallOutcome,
    UpdatedOn, UpdatedBy
) VALUES
(1, 'email_001', 'conv_001', 'gmail-email',
 'Inquiry about CRM solution for furniture business',
 'Hi, I''m interested in learning more about your CRM solution for our furniture manufacturing company ILVA A/S.',
 'email', '2025-10-01 08:30:00', NULL, NULL, NULL, NULL, 'completed', 'normal', 'sales@crm.com',
 'lead', 1, 'system@crm.com', NULL, NULL, '2025-10-01 08:30:00', 'system@crm.com'),

(2, 'call_001', NULL, 'phone-call',
 'Follow-up call with ILVA A/S',
 'Discussed product features and pricing for furniture business. Client interested in enterprise plan.',
 'call', '2025-10-01 14:15:00', NULL, NULL, NULL, '2025-10-01 14:45:00', 'completed', 'high', 'sales@crm.com',
 'lead', 1, 'sales@crm.com', 30, 'positive', '2025-10-01 14:45:00', 'sales@crm.com'),

(3, 'email_002', 'conv_002', 'gmail-email',
 'Meeting request for demo - Response Vietnam',
 'Would like to schedule a product demo for manufacturing processes at Response Vietnam.',
 'email', '2025-09-28 14:20:00', NULL, NULL, NULL, NULL, 'completed', 'high', 'sales@crm.com',
 'lead', 2, 'sales@crm.com', NULL, NULL, '2025-09-28 14:20:00', 'sales@crm.com'),

(4, 'task_001', NULL, 'system-task',
 'Send proposal to Response Vietnam Co., Ltd.',
 'Prepare and send detailed proposal with pricing for manufacturing CRM package.',
 'task', '2025-10-02 09:00:00', '2025-10-04 17:00:00', NULL, NULL, NULL, 'in_progress', 'high', 'sales@crm.com',
 'lead', 2, 'sales@crm.com', NULL, NULL, '2025-10-02 09:00:00', 'sales@crm.com'),

(5, 'meeting_001', NULL, 'calendar-meeting',
 'Product Demo - StartupXYZ',
 'Online demo session covering all features and Q&A.',
 'meeting', '2025-09-26 10:00:00', '2025-09-30 15:00:00', '2025-09-30 15:00:00', '2025-09-30 16:00:00', '2025-09-30 16:00:00', 'completed', 'high', 'sales@crm.com',
 'lead', 3, 'sales@crm.com', NULL, NULL, '2025-09-30 16:00:00', 'sales@crm.com'),

(6, 'email_003', 'conv_003', 'gmail-email',
 'Contract signed!',
 'Great news! We''ve signed the contract and ready to proceed.',
 'email', '2025-10-02 16:30:00', NULL, NULL, NULL, NULL, 'completed', 'normal', 'sales@crm.com',
 'deal', 401, 'sales@crm.com', NULL, NULL, '2025-10-02 16:30:00', 'sales@crm.com'),

(7, 'call_002', NULL, 'phone-call',
 'Negotiation call with Response Vietnam',
 'Discussed pricing terms and contract conditions. Client requested some modifications.',
 'call', '2025-10-02 10:30:00', NULL, NULL, NULL, '2025-10-02 11:00:00', 'completed', 'high', 'sales@crm.com',
 'deal', 402, 'sales@crm.com', 30, 'positive', '2025-10-02 11:00:00', 'sales@crm.com'),

(8, 'task_002', NULL, 'system-task',
 'Prepare contract for Hugga Design',
 'Review contract terms and prepare final version for signature.',
 'task', '2025-09-28 11:00:00', '2025-10-01 17:00:00', NULL, NULL, NULL, 'open', 'normal', 'sales@crm.com',
 'deal', 403, 'sales@crm.com', NULL, NULL, '2025-09-28 11:00:00', 'sales@crm.com'),

(9, 'meeting_002', NULL, 'calendar-meeting',
 'Discovery meeting with John Lewis PLC',
 'Initial meeting to understand procurement requirements and pain points.',
 'meeting', '2025-09-27 14:00:00', '2025-10-01 10:00:00', '2025-10-01 09:00:00', '2025-10-01 10:00:00', NULL, 'open', 'high', 'sales@crm.com',
 'deal', 404, 'sales@crm.com', NULL, NULL, '2025-09-27 14:00:00', 'sales@crm.com'),

(10, 'email_004', 'conv_004', 'gmail-email',
 'Taiwan market requirements discussion',
 'Discussed specific requirements for Mandarin localization and Taiwan market features.',
 'email', '2025-09-12 09:00:00', NULL, NULL, NULL, NULL, 'completed', 'normal', 'sales@crm.com',
 'deal', 405, 'sales@crm.com', NULL, NULL, '2025-09-12 09:00:00', 'sales@crm.com'),

(11, 'task_003', NULL, 'system-task',
 'Follow up on analytics module quote',
 'Send follow-up email regarding analytics module pricing and features.',
 'task', '2025-10-06 08:00:00', '2025-10-08 17:00:00', NULL, NULL, NULL, 'open', 'normal', 'sales@crm.com',
 'deal', 406, 'sales@crm.com', NULL, NULL, '2025-10-06 08:00:00', 'sales@crm.com'),

(12, 'call_003', NULL, 'phone-call',
 'Multi-language support discussion',
 'Discussed requirements for Vietnamese, English, and Chinese language support.',
 'call', '2025-10-04 13:00:00', NULL, NULL, NULL, NULL, 'open', 'normal', 'sales@crm.com',
 'deal', 407, 'sales@crm.com', NULL, NULL, '2025-10-04 13:00:00', 'sales@crm.com'),

(13, 'meeting_003', NULL, 'calendar-meeting',
 'Logistics workflow demo for Khori International',
 'Demo of CRM features specifically for logistics and supply chain management.',
 'meeting', '2025-09-22 11:00:00', '2025-09-25 14:00:00', '2025-09-25 14:00:00', '2025-09-25 15:30:00', '2025-09-25 15:30:00', 'completed', 'high', 'sales@crm.com',
 'deal', 408, 'sales@crm.com', NULL, NULL, '2025-09-25 15:30:00', 'sales@crm.com'),

(14, 'note_001', NULL, 'system-note',
 'Customer feedback from demo',
 'Customer provided positive feedback on demo. Interested in advanced reporting features.',
 'note', '2025-10-03 16:00:00', NULL, NULL, NULL, NULL, 'completed', 'low', 'sales@crm.com',
 'customer', 10501, 'sales@crm.com', NULL, NULL, '2025-10-03 16:00:00', 'sales@crm.com'),

(15, 'reminder_001', NULL, 'system-reminder',
 'Quarterly review meeting',
 'Scheduled quarterly business review with key customers.',
 'reminder', '2025-10-01 09:00:00', '2025-12-31 10:00:00', NULL, NULL, NULL, 'open', 'normal', 'sales@crm.com',
 'customer', 10545, 'sales@crm.com', NULL, NULL, '2025-10-01 09:00:00', 'sales@crm.com');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Display success message
SELECT 'Sample activity data inserted successfully. Total records: 15' AS message;

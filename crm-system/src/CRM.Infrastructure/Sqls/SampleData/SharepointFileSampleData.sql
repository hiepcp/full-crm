-- Sample data for crm_sharepoint_files table
-- Generated from mock SharePoint sync dataset
-- Inserts representative SharePoint file metadata records

USE crm_sys_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

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

-- Display success message
SELECT 'Sample SharePoint file metadata inserted successfully. Total records: 5' AS message;


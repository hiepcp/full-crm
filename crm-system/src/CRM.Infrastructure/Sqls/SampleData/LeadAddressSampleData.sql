-- Sample data for crm_lead_address table
-- Provides example legal and delivery addresses for existing sample leads

USE crm_sys_db;

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO crm_lead_address (
  LeadId,
  AddressType,
  CompanyName,
  AddressLine,
  Postcode,
  City,
  Country,
  ContactPerson,
  Email,
  TelephoneNo,
  PortOfDestination,
  IsPrimary,
  CreatedOn,
  CreatedBy,
  UpdatedOn,
  UpdatedBy
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
  NOW(),
  'system@crm.com',
  NOW(),
  'system@crm.com'),
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
  NOW(),
  'system@crm.com',
  NOW(),
  'system@crm.com'),

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
  NOW(),
  'system@crm.com',
  NOW(),
  'system@crm.com'),

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
  NOW(),
  'system@crm.com',
  NOW(),
  'system@crm.com');

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Sample lead address data inserted successfully.' AS message;

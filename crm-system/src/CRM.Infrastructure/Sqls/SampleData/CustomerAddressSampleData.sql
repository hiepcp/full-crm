-- Sample data for crm_customer_address table
-- Provides example legal and delivery/forwarder addresses for existing sample customers

USE crm_sys_db;

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO crm_customer_address (
  CustomerId,
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
  NOW(),
  'system@crm.com',
  NOW(),
  'system@crm.com'),
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
  NOW(),
  'system@crm.com',
  NOW(),
  'system@crm.com'),

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
  NOW(),
  'system@crm.com',
  NOW(),
  'system@crm.com'),

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
  NOW(),
  'system@crm.com',
  NOW(),
  'system@crm.com');

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Sample customer address data inserted successfully.' AS message;

-- Sample data for crm_customer table
-- Generated from mockCustomers.json
-- This script inserts 5 sample customer records for testing and development

USE crm_sys_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Insert sample customer data
INSERT INTO crm_customer (
    Id, Name, Domain, Phone, Email, BillingAddress, ShippingAddress, Website, Type,
    OwnerId, VatNumber, Currency, Country, Industry, Notes, PaymentTerms, DeliveryTerms,
    ContactPerson, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
) VALUES
(10501, 'ILVA A/S', 'ilva.dk', '+45 75 55 11 37', 'ilva@ilva.dk',
 'ILVA A/S\nAarhus, Denmark', 'Aarhus, Denmark (Taulov)', 'https://ilva.dk', 'Customer',
 101, '28505108', 'USD', 'DNK', 'Furniture',
 'FOB customer. Documents for customs clearance to be sent to: ilva.aar@scangl.com and import@ilva.dk. Notifying Party: Scan Global Logistics A/S, DK-8260 Viby J. Forwarder in Denmark/Notify party: Scan Global Logistics A/S, iddesign.aar@scangl.com, Ms. Anne Lyngshede Lund, Tel. +45 3248 0017. Forwarder in Vietnam: Scan Global Logistics (Vietnam) Ltd, 10Fl, Waseco Tower, Bloc C, 10 Pho Quang, Ward 2, Tan Binh district, HCMC, Contact: Mrs. Ta Phuong – ttph@scangl.com, +84 988 700 846, sea.hcm@scangl.com, Phone: 028 7770 2288 (ext: 400). Early shipment: If earlier than 1 week, this must be approved by customer before booking. Late shipment: Penalty if we ship more than 1 week late. EUTR is required once a year (June).',
 'CAD', 'FOB, HCMC', 'Henrik Sig Kristensen',
 '2025-10-02 16:45:00', 'system@crm.com', '2025-10-02 16:45:00', 'sales@crm.com'),

(10545, 'Response Vietnam Co., Ltd.', 'responsevietnam.com', '+84 28 3775 0888', 'info@responsevietnam.com',
 'Response Vietnam Co., Ltd.\nHo Chi Minh City, Vietnam', 'Ho Chi Minh City, Vietnam', 'https://responsevietnam.com', 'Customer',
 102, '', 'USD', 'VNM', 'Manufacturing',
 'FOB customer. Inventory location: CO. Telex Release shipment.',
 'TT', 'FOB, HCMC', 'Karina Skærlund',
 '2025-10-01 12:00:00', 'sales@crm.com', '2025-10-01 12:00:00', 'sales@crm.com'),

(10570, 'Hugga Design', 'huggadesign.com', '+86 574 5551 13137', 'info@huggadesign.com',
 'Hugga Design\nNingbo, China', 'Ningbo, China', 'https://huggadesign.com', 'Customer',
 103, '', 'USD', 'CHN', 'Design',
 'FOB customer with Mandarin text name requirements. Place of delivery: Ningbo, China. Notifying Party: Core One A/S, Lene Haus Vej 9B, DK-7430 Ikast. Booking agent in Vietnam: Tuyet Anh, Thami Shipping & Airfreight Corp., 161 Khanh Hoi St., Dist. 4, Ho Chi Minh City, Vietnam. Liaison office: 25-25A Street81, Tan Quy Ward, Dist. 7, Ho Chi Minh City. Tel. +84 8 37750888 (ext 101), fax +84 8 37755673/44, Hp. +84 985 963 491, E-mail: import1@thamico.com. Shipment is to be Telex Released as per advise from Core One Denmark (Once customer settled Payment). Invoice + Packinglist from Core One (e-mail). Original C/O to be send to forwarder by courier from Response. Certificate of Origin Form E to be send to: Ningbo Jinbo Imp & Exp Co Ltd, Room 1018, Zhongnongxin Mansion, No. 181 Eeast Zhongshan Road, Ningbo, China, Tel +86 574 555113137 / fax +86 574 87029903. Forwarder: Thami Shipping & Air. Contact: Anders Hejgaard Rask. Status: In-Active.',
 '30CAD', 'FOB, HCMC', 'Anders Hejgaard Rask',
 '2025-09-28 10:00:00', 'sales@crm.com', '2025-10-01 14:30:00', 'sales@crm.com'),

(10547, 'Paul Anthony Furnishings', 'paulanthony.co.uk', '+44 20 7123 4567', 'orders@paulanthony.co.uk',
 'Paul Anthony Furnishings\nLondon, United Kingdom', 'London, United Kingdom', 'https://paulanthony.co.uk', 'Customer',
 101, '519 0317 64', 'GBP', 'GBR', 'Furniture',
 'UK-based customer with EXW delivery terms. Status: In-Active.',
 'NET', 'EXW', '',
 '2025-09-20 09:00:00', 'sales@crm.com', '2025-09-30 16:00:00', 'sales@crm.com'),

(10571, 'Mr Living CO. LTD', 'mrliving.com.tw', '+886 2 2999 9999', 'contact@mrliving.com.tw',
 'Mr Living CO. LTD\nTaipei, Taiwan', 'Taipei, Taiwan', 'https://mrliving.com.tw', 'Customer',
 102, '', 'USD', 'TWN', 'Furniture',
 'Taiwan furniture customer with Mandarin requirements. Dimerco Vietfracht forwarding partner.',
 'TT', 'FOB, HCMC', 'Frank Hsia',
 '2025-09-10 10:00:00', 'sales@crm.com', '2025-09-15 13:30:00', 'sales@crm.com');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Display success message
SELECT 'Sample customer data inserted successfully. Total records: 5' AS message;

# End-to-End Verification: Evolve Migrations Across All Services

**Date:** 2025-12-27
**Subtask:** subtask-6-1
**Services:** ResAuthApi (ResAuthN + ResAuthZ), CRM.Api

---

## 📋 Overview

This document provides comprehensive end-to-end verification steps for all 3 database services using Evolve migrations. This verification confirms that the migration strategy has been successfully implemented across the entire system.

---

## ✅ Pre-Verification Checklist

### 1. Migration Files Exist

**ResAuthN:**
- ✓ `./res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/Migrations/V1.0.0__ResAuthN_Initial_Schema.sql`

**ResAuthZ:**
- ✓ `./res-auth-api/res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/Migrations/V1.0.0__ResAuthZ_Initial_Schema.sql`

**CRM:**
- ✓ `./crm-system/src/CRM.Infrastructure/Migrations/V1.0.0__CRM_Initial_Schema.sql`
- ✓ `./crm-system/src/CRM.Infrastructure/Migrations/V2.0.0__CRM_Sample_Data.sql`
- ⚠️ `./crm-system/src/CRM.Infrastructure/Migrations/V1.1.0__Test_Rollback.sql` (test file - should be removed)

### 2. Program.cs Evolve Integration

**ResAuthApi (lines 183-208):**
- ✓ Locations: `["Migrations"]`
- ✓ IsEraseDisabled: `true`
- ✓ MetadataTableName: `"changelog"`
- ✓ CommandTimeout: `60` seconds
- ✓ Logging: Emoji pattern (📦 🚀 ✅ ❌)

**CRM.Api (lines 122-147):**
- ✓ Locations: `["Migrations"]`
- ✓ IsEraseDisabled: `true`
- ✓ MetadataTableName: `"changelog"`
- ✓ CommandTimeout: `60` seconds
- ✓ Logging: Emoji pattern (📦 🚀 ✅ ❌)

### 3. .csproj Configuration

**ResAuthN Infrastructure:**
- ✓ Evolve package installed (v3.2.0)
- ✓ Migration files copy configuration: `<None Include="Migrations\\**\\*.sql" CopyToOutputDirectory="Always" />`

**ResAuthZ Infrastructure:**
- ✓ Evolve package installed (v3.2.0)
- ✓ Migration files copy configuration: `<None Include="Migrations\\**\\*.sql" CopyToOutputDirectory="Always" />`

**CRM Infrastructure:**
- ✓ Evolve package installed (v3.2.0)
- ✓ Migration files copy configuration: `<None Include="Migrations\\**\\*.sql" CopyToOutputDirectory="Always" />`

---

## 🧪 Manual Verification Steps

### Step 1: Clean Test Rollback Migration

Before starting the E2E verification, remove the test rollback migration file that was created in Phase 4:

```bash
# Remove test rollback migration from CRM
rm -f ./crm-system/src/CRM.Infrastructure/Migrations/V1.1.0__Test_Rollback.sql

# Verify it's removed
ls ./crm-system/src/CRM.Infrastructure/Migrations/
```

**Expected Output:**
```
V1.0.0__CRM_Initial_Schema.sql
V2.0.0__CRM_Sample_Data.sql
```

### Step 2: Drop All Databases

Connect to MySQL and drop all 3 databases to start fresh:

```sql
-- Connect to MySQL
mysql -h 10.123.10.222 -u root -p

-- Drop all databases
DROP DATABASE IF EXISTS res_auth_db;
DROP DATABASE IF EXISTS crm_db;

-- Verify databases are dropped
SHOW DATABASES;
-- Should NOT see res_auth_db or crm_db
```

### Step 3: Start ResAuthApi Service

Open a terminal and start the ResAuthApi service:

```bash
cd ./res-auth-api/res-auth-api/src/ResAuthApi.Api
dotnet restore
dotnet run
```

**Expected Console Output:**

```
📦 Starting database migrations...
Evolve: Validating migration checksums...
Evolve: Executing migration V1.0.0__ResAuthN_Initial_Schema.sql
Evolve: Executing migration V1.0.0__ResAuthZ_Initial_Schema.sql
✅ Database migrations completed successfully.
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7016
```

**Verification Checks:**
- ✓ Migration started log: `📦 Starting database migrations...`
- ✓ Migration success log: `✅ Database migrations completed successfully.`
- ✓ No error messages (❌)
- ✓ Application started successfully on port 7016

### Step 4: Verify ResAuthDb Migration History

While the ResAuthApi is running (or after stopping it), connect to MySQL and verify:

```sql
USE res_auth_db;

-- Check changelog table exists
SHOW TABLES LIKE 'changelog';
-- Expected: 'changelog' table

-- Query migration history
SELECT id, version, description, type, installed_by, installed_on, success
FROM changelog
ORDER BY installed_rank;

-- Expected Output (2 rows):
-- | id | version | description                   | type | installed_by | installed_on        | success |
-- |----|---------|-------------------------------|------|--------------|---------------------|---------|
-- | 1  | 1.0.0   | ResAuthN_Initial_Schema       | SQL  | sa           | 2025-12-27 XX:XX:XX | 1       |
-- | 2  | 1.0.0   | ResAuthZ_Initial_Schema       | SQL  | sa           | 2025-12-27 XX:XX:XX | 1       |
```

### Step 5: Verify ResAuth Tables Created

```sql
USE res_auth_db;

-- Show all tables
SHOW TABLES;

-- Expected Tables (13 tables):
-- ResAuthN tables (3):
--   - Users
--   - RefreshTokens
--   - ResponseConfigSystem
--
-- ResAuthZ tables (10):
--   - Applications
--   - Users (ResAuthZ version)
--   - Resources
--   - Actions
--   - Permissions
--   - Roles
--   - RolePermissions
--   - UserRoles
--   - Menus
--   - ResourceActions
--
-- Metadata table (1):
--   - changelog

-- Verify specific tables exist
DESCRIBE Users;
DESCRIBE RefreshTokens;
DESCRIBE Applications;
DESCRIBE Roles;
DESCRIBE Permissions;
```

### Step 6: Verify ResAuth Stored Procedures

```sql
USE res_auth_db;

-- Show all stored procedures
SHOW PROCEDURE STATUS WHERE Db = 'res_auth_db';

-- Expected Procedures (9 total):
-- ResAuthN procedures (4):
--   - sp_get_all_response_config_system
--   - sp_get_response_config_system_by_env
--   - sp_get_response_config_system_by_id
--   - sp_update_token_response_config_system
--
-- ResAuthZ procedures (5):
--   - sp_get_role_permissions
--   - sp_get_user_menus
--   - sp_get_user_menus_with_permissions
--   - sp_get_user_permissions
--   - sp_update_role_permissions
```

### Step 7: Start CRM.Api Service

Open another terminal and start the CRM.Api service:

```bash
cd ./crm-system/src/CRM.Api
dotnet restore
dotnet run
```

**Expected Console Output:**

```
📦 Starting database migrations...
Evolve: Validating migration checksums...
Evolve: Executing migration V1.0.0__CRM_Initial_Schema.sql
Evolve: Executing migration V2.0.0__CRM_Sample_Data.sql
✅ Database migrations completed successfully.
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7141
```

**Verification Checks:**
- ✓ Migration started log: `📦 Starting database migrations...`
- ✓ Migration success log: `✅ Database migrations completed successfully.`
- ✓ No error messages (❌)
- ✓ Application started successfully on port 7141

### Step 8: Verify CRM Migration History

```sql
USE crm_db;

-- Check changelog table exists
SHOW TABLES LIKE 'changelog';
-- Expected: 'changelog' table

-- Query migration history
SELECT id, version, description, type, installed_by, installed_on, success
FROM changelog
ORDER BY installed_rank;

-- Expected Output (2 rows):
-- | id | version | description           | type | installed_by | installed_on        | success |
-- |----|---------|----------------------|------|--------------|---------------------|---------|
-- | 1  | 1.0.0   | CRM_Initial_Schema   | SQL  | sa           | 2025-12-27 XX:XX:XX | 1       |
-- | 2  | 2.0.0   | CRM_Sample_Data      | SQL  | sa           | 2025-12-27 XX:XX:XX | 1       |
```

### Step 9: Verify CRM Tables Created

```sql
USE crm_db;

-- Show all tables
SHOW TABLES;

-- Expected Tables (17 tables):
-- Business tables (16):
--   - User
--   - Customer
--   - CustomerAddress
--   - Contact
--   - Lead
--   - LeadAddress
--   - Activity
--   - ActivityAttachment
--   - ActivityParticipant
--   - Appointment
--   - Email
--   - Deal
--   - DealQuotation
--   - Quotation
--   - PipelineLog
--   - Assignee
--
-- Metadata table (1):
--   - changelog

-- Verify specific tables
DESCRIBE User;
DESCRIBE Customer;
DESCRIBE Lead;
DESCRIBE Activity;
DESCRIBE Deal;
```

### Step 10: Verify CRM Sample Data Inserted

```sql
USE crm_db;

-- Check sample data counts
SELECT 'User' AS TableName, COUNT(*) AS RecordCount FROM User
UNION ALL
SELECT 'Customer', COUNT(*) FROM Customer
UNION ALL
SELECT 'Contact', COUNT(*) FROM Contact
UNION ALL
SELECT 'Lead', COUNT(*) FROM Lead
UNION ALL
SELECT 'Quotation', COUNT(*) FROM Quotation
UNION ALL
SELECT 'Deal', COUNT(*) FROM Deal
UNION ALL
SELECT 'Activity', COUNT(*) FROM Activity
UNION ALL
SELECT 'Appointment', COUNT(*) FROM Appointment
UNION ALL
SELECT 'Email', COUNT(*) FROM Email;

-- Expected Output:
-- | TableName    | RecordCount |
-- |--------------|-------------|
-- | User         | 5           |
-- | Customer     | 5           |
-- | Contact      | 5           |
-- | Lead         | 5           |
-- | Quotation    | 4           |
-- | Deal         | 5           |
-- | Activity     | 5           |
-- | Appointment  | 3           |
-- | Email        | 4           |
```

### Step 11: Test Idempotency (Restart Applications)

**Test ResAuthApi:**
```bash
# Stop the running ResAuthApi (Ctrl+C)
# Start it again
cd ./res-auth-api/res-auth-api/src/ResAuthApi.Api
dotnet run
```

**Expected Output:**
```
📦 Starting database migrations...
Evolve: Database is up to date. No migration needed.
✅ Database migrations completed successfully.
```

**Test CRM.Api:**
```bash
# Stop the running CRM.Api (Ctrl+C)
# Start it again
cd ./crm-system/src/CRM.Api
dotnet run
```

**Expected Output:**
```
📦 Starting database migrations...
Evolve: Database is up to date. No migration needed.
✅ Database migrations completed successfully.
```

**Verification:**
- ✓ No migrations re-executed (idempotent)
- ✓ Applications start successfully
- ✓ No duplicate data inserted

### Step 12: Verify IsEraseDisabled Configuration

Check that all Evolve configurations have `IsEraseDisabled = true`:

```bash
# ResAuthApi Program.cs
grep -A 5 "IsEraseDisabled" ./res-auth-api/res-auth-api/src/ResAuthApi.Api/Program.cs

# CRM.Api Program.cs
grep -A 5 "IsEraseDisabled" ./crm-system/src/CRM.Api/Program.cs
```

**Expected Output (both files):**
```
IsEraseDisabled = true, // CRITICAL: Disable erase in production
```

---

## 📊 Verification Summary

### Database Count Verification

After all steps complete, you should have:

**Databases Created:** 2
- `res_auth_db` (ResAuthN + ResAuthZ combined)
- `crm_db` (CRM system)

**Migration History Records:** 4 total
- res_auth_db: 2 migrations (ResAuthN V1.0.0, ResAuthZ V1.0.0)
- crm_db: 2 migrations (CRM V1.0.0, CRM V2.0.0)

**Tables Created:** 30 total
- res_auth_db: 13 tables (3 ResAuthN + 10 ResAuthZ + 1 changelog)
- crm_db: 17 tables (16 business + 1 changelog)

**Stored Procedures Created:** 9 total
- res_auth_db: 9 procedures (4 ResAuthN + 5 ResAuthZ)
- crm_db: 0 procedures

**Sample Data Records:** 41 total (CRM only)
- 5 Users
- 5 Customers
- 5 Contacts
- 5 Leads
- 4 Quotations
- 5 Deals
- 5 Activities
- 3 Appointments
- 4 Emails

---

## ✅ Success Criteria Checklist

All items must be checked for successful verification:

### Configuration
- [ ] Evolve v3.2.0 installed in all 3 Infrastructure projects
- [ ] Migration files copied to output directory (verified in bin/Debug/net8.0/)
- [ ] IsEraseDisabled=true in all Program.cs configurations
- [ ] CommandTimeout=60 in all Evolve configurations
- [ ] MetadataTableName="changelog" in all configurations

### Migrations
- [ ] ResAuthN V1.0.0 migration file exists and is valid SQL
- [ ] ResAuthZ V1.0.0 migration file exists and is valid SQL
- [ ] CRM V1.0.0 schema migration file exists and is valid SQL
- [ ] CRM V2.0.0 sample data migration file exists and is valid SQL
- [ ] Test rollback migration V1.1.0 removed from CRM

### Application Startup
- [ ] ResAuthApi starts successfully after fresh database drop
- [ ] CRM.Api starts successfully after fresh database drop
- [ ] Both applications show 📦 emoji at migration start
- [ ] Both applications show ✅ emoji at migration success
- [ ] No ❌ error logs during migration
- [ ] Both applications restart successfully (idempotency test)

### Database State
- [ ] res_auth_db database created automatically
- [ ] crm_db database created automatically
- [ ] changelog table exists in res_auth_db
- [ ] changelog table exists in crm_db
- [ ] All 13 expected tables exist in res_auth_db
- [ ] All 17 expected tables exist in crm_db
- [ ] All 9 stored procedures exist in res_auth_db

### Migration History
- [ ] res_auth_db changelog shows 2 migrations executed
- [ ] crm_db changelog shows 2 migrations executed
- [ ] All migration records show success=1
- [ ] Migration versions are correct (V1.0.0, V2.0.0)
- [ ] No duplicate migration records after restart

### Sample Data
- [ ] CRM User table has 5 records
- [ ] CRM Customer table has 5 records
- [ ] CRM Lead table has 5 records
- [ ] CRM Deal table has 5 records
- [ ] Sample data not duplicated after restart (idempotency)

### Logging
- [ ] Serilog emoji pattern used consistently (📦 🚀 ✅ ❌)
- [ ] Migration logs visible in console output
- [ ] Error handling logs present (try/catch with ❌ emoji)
- [ ] No console warnings or errors during startup

---

## 🚨 Known Issues & Resolutions

### Issue 1: Test Rollback Migration Still Present
**Problem:** V1.1.0__Test_Rollback.sql from Phase 4 testing is still in Migrations folder
**Resolution:** Remove the file before E2E verification (Step 1 above)

### Issue 2: Database Connection String
**Problem:** Connection string might not match local MySQL setup
**Resolution:** Update appsettings.Development.json with correct credentials:
- Server: 10.123.10.222 (or localhost)
- User: root
- Password: Dev@123 (or your MySQL password)

### Issue 3: Port Conflicts
**Problem:** Ports 7016 or 7141 already in use
**Resolution:** Kill existing processes or update launchSettings.json

---

## 📝 Notes

1. **ResAuthN + ResAuthZ Database Sharing:** Both services use the same database (`res_auth_db`) with separate migration files. This is by design and verified in the implementation.

2. **Migration Ordering:** Evolve executes migrations in lexicographical order by version number. V1.0.0 migrations run before V2.0.0.

3. **Seed Data Strategy:** Schema migrations use V1.x.x versions, seed data uses V2.x.x versions to separate concerns.

4. **Transaction Safety:** All migrations run in a transaction. If any SQL statement fails, the entire migration rolls back.

5. **Checksum Validation:** Evolve calculates checksums for executed migrations. Modifying an executed migration file will cause startup failure.

---

## 🎯 Expected Final State

After successful E2E verification:

```
✅ All 3 services using Evolve migrations
✅ All databases created automatically on first startup
✅ All tables and procedures created via migrations
✅ Migration history tracked in changelog tables
✅ Applications start successfully on clean databases
✅ Applications restart without re-running migrations (idempotent)
✅ Emoji logging pattern preserved across all services
✅ IsEraseDisabled=true ensures production safety
✅ Sample data inserted once (not duplicated on restart)
✅ Developer documentation (MIGRATIONS.md) complete
```

---

**Verification Completed By:** _________________
**Date:** _________________
**All Checks Passed:** [ ] YES  [ ] NO
**Notes:** _______________________________________

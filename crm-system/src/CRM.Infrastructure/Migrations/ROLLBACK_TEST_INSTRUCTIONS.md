# Rollback Test Instructions

## Purpose
This document provides step-by-step instructions to manually test the rollback behavior of database migrations using the intentionally broken migration file `V1.1.0__Test_Rollback.sql`.

## Test Migration File
- **File**: `V1.1.0__Test_Rollback.sql`
- **Error Type**: SQL syntax error (misspelled keyword: `TABEL` instead of `TABLE`)
- **Expected Behavior**: Migration should fail, trigger rollback, and leave database state unchanged

## Manual Verification Steps

### Step 1: Verify Current Database State
Before testing, record the current database state:

```sql
-- Check existing tables
SHOW TABLES;

-- Check migration history
SELECT * FROM changelog ORDER BY installed_rank DESC LIMIT 5;

-- Verify TestRollbackTable does not exist
SHOW TABLES LIKE 'TestRollbackTable';
SHOW TABLES LIKE 'ThisWillFail';
SHOW TABLES LIKE 'ShouldNotBeCreated';
```

**Expected**: No tables named `TestRollbackTable`, `ThisWillFail`, or `ShouldNotBeCreated` should exist.

### Step 2: Start Application with Broken Migration
```bash
cd ./crm-system/src/CRM.Api
dotnet run
```

### Step 3: Verify Application Fails to Start
**Expected Behavior**:
- Application startup should fail
- Error logs should contain:
  - "❌ Database migration failed" message
  - SQL syntax error mentioning "TABEL" or similar
  - Evolve exception details
- Application should NOT start successfully
- Process should exit with error code

**Example Expected Error**:
```
[Error] ❌ Database migration failed: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'TABEL IF NOT EXISTS `ThisWillFail`'
```

### Step 4: Verify Transaction Rollback
After the application fails to start, check the database state:

```sql
-- Verify no new tables were created
SHOW TABLES LIKE 'TestRollbackTable';
SHOW TABLES LIKE 'ThisWillFail';
SHOW TABLES LIKE 'ShouldNotBeCreated';

-- Verify migration history unchanged
SELECT * FROM changelog ORDER BY installed_rank DESC LIMIT 5;
```

**Expected Results**:
- ✅ No `TestRollbackTable` should exist (rollback worked)
- ✅ No `ThisWillFail` should exist (migration stopped at error)
- ✅ No `ShouldNotBeCreated` should exist (subsequent SQL not executed)
- ✅ Migration `V1.1.0__Test_Rollback.sql` should NOT appear in changelog
- ✅ Database schema is identical to pre-test state

### Step 5: Delete Broken Migration File
```bash
# Remove the test migration file
rm ./crm-system/src/CRM.Infrastructure/Migrations/V1.1.0__Test_Rollback.sql
rm ./crm-system/src/CRM.Infrastructure/Migrations/ROLLBACK_TEST_INSTRUCTIONS.md
```

### Step 6: Restart Application Successfully
```bash
cd ./crm-system/src/CRM.Api
dotnet run
```

**Expected Behavior**:
- Application starts successfully
- Migration logs show "✅ Database migration completed successfully"
- No errors in console output
- Application runs normally

### Step 7: Final Verification
```sql
-- Verify application is running with correct schema
SHOW TABLES;

-- Check latest migration in history
SELECT * FROM changelog ORDER BY installed_rank DESC LIMIT 5;
```

**Expected**: Last migration should be `V2.0.0__CRM_Sample_Data.sql` (or latest valid migration), not the deleted test migration.

## Success Criteria
- ✅ Application failed to start with broken migration
- ✅ Error logs clearly indicated SQL syntax error
- ✅ Transaction rollback prevented partial migration (no TestRollbackTable)
- ✅ Database state unchanged after failed migration
- ✅ Migration history table does not contain failed migration entry
- ✅ After deleting broken migration, application starts successfully
- ✅ No data loss or schema corruption

## Cleanup
After successful verification:
1. Delete `V1.1.0__Test_Rollback.sql`
2. Delete this instructions file
3. Verify application runs normally
4. Document test results in build-progress.txt

## Notes
- This test validates Evolve's transaction-based migration approach
- Evolve wraps migrations in transactions, so any error triggers full rollback
- This is a critical safety feature for production deployments
- Never deploy migrations without testing rollback behavior first

# End-to-End Verification: Bulk Migration Tool

## Overview

This document provides comprehensive verification steps for the SharePoint bulk migration tool feature (subtask-6-5). The bulk migration tool allows administrators to migrate existing locally-stored documents to SharePoint with preserved metadata, ensuring correct folder placement and database tracking.

## Prerequisites

### 1. Services Running
All required services must be operational:
```bash
# Terminal 1 - Authentication Service
cd res-auth-api/res-auth-api/src/ResAuthApi.Api
dotnet run
# Expected: Listening on https://localhost:7000

# Terminal 2 - CRM Backend
cd crm-system/src/CRM.Api
dotnet run
# Expected: Listening on https://localhost:5001

# Terminal 3 - CRM Frontend
cd crm-system-client
npm run dev
# Expected: Listening on http://localhost:3000
```

### 2. SharePoint Configuration
Verify SharePoint settings in `crm-system/src/CRM.Api/appsettings.json`:
```json
{
  "Sharepoint": {
    "GraphApiBase": "https://graph.microsoft.com/v1.0/sites",
    "Site": "{hostname},{siteId},{webId}",
    "DocLibrary": "{driveId}",
    "CustomerFolderPath": "DEV/CRM/Customers",
    "LeadFolderPath": "DEV/CRM/Leads",
    "DealFolderPath": "DEV/CRM/Deals",
    "ActivityFolderPath": "DEV/CRM/Activities"
  },
  "AzureAd": {
    "TenantId": "your-tenant-id",
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret"
  }
}
```

### 3. Database Access
SQL connection to verify migration results:
```bash
# Test database connection
mysql -u root -p -e "SELECT COUNT(*) FROM crm.crm_sharepoint_files;"
```

### 4. Test Data Preparation
Create test folder with sample documents:
```bash
# Create test folder
mkdir -p /tmp/migration-test

# Create 10 sample documents with different sizes
for i in {1..10}; do
  echo "Test document $i - Created $(date)" > /tmp/migration-test/document-$i.txt
  echo "Entity: Customer" >> /tmp/migration-test/document-$i.txt
  echo "Purpose: Testing bulk migration feature" >> /tmp/migration-test/document-$i.txt
  echo "Content: Lorem ipsum dolor sit amet, consectetur adipiscing elit." >> /tmp/migration-test/document-$i.txt
done

# Create a few larger documents
dd if=/dev/urandom of=/tmp/migration-test/large-document-1.bin bs=1M count=5
dd if=/dev/urandom of=/tmp/migration-test/large-document-2.bin bs=1M count=3

# List created files
ls -lh /tmp/migration-test/
```

### 5. Entity Mapping CSV
Create migration mapping file:
```csv
FilePath,EntityType,EntityId,OriginalCreatedDate,OriginalModifiedDate,OriginalAuthor
document-1.txt,Customer,123,2024-01-01T10:00:00Z,2024-01-15T14:30:00Z,john.smith@example.com
document-2.txt,Customer,123,2024-01-02T09:00:00Z,2024-01-16T11:20:00Z,jane.doe@example.com
document-3.txt,Lead,456,2024-01-03T11:00:00Z,2024-01-17T16:45:00Z,bob.wilson@example.com
document-4.txt,Lead,456,2024-01-04T08:30:00Z,2024-01-18T09:10:00Z,alice.brown@example.com
document-5.txt,Deal,789,2024-01-05T14:00:00Z,2024-01-19T13:25:00Z,charlie.davis@example.com
document-6.txt,Deal,789,2024-01-06T15:30:00Z,2024-01-20T10:50:00Z,diana.evans@example.com
document-7.txt,Activity,101,2024-01-07T09:45:00Z,2024-01-21T15:15:00Z,frank.garcia@example.com
document-8.txt,Customer,124,2024-01-08T12:00:00Z,2024-01-22T12:40:00Z,grace.hernandez@example.com
large-document-1.bin,Customer,125,2024-01-09T16:20:00Z,2024-01-23T17:00:00Z,henry.jackson@example.com
large-document-2.bin,Lead,457,2024-01-10T10:10:00Z,2024-01-24T11:30:00Z,irene.johnson@example.com
```

Save as `/tmp/migration-test/mappings.csv`

---

## Phase 1: Implementation Verification

### 1.1 Backend Files Verification

**Check backend service implementation:**
```bash
cd ./crm-system/src/CRM.Application

# Verify BulkMigrationService exists
test -f Services/BulkMigrationService.cs && echo "✓ BulkMigrationService.cs exists" || echo "✗ MISSING"

# Verify interface exists
test -f Interfaces/Services/IBulkMigrationService.cs && echo "✓ IBulkMigrationService.cs exists" || echo "✗ MISSING"

# Verify DTOs exist
test -f Dtos/Request/MigrationRequestDto.cs && echo "✓ MigrationRequestDto.cs exists" || echo "✗ MISSING"
```

**Expected Output:**
```
✓ BulkMigrationService.cs exists
✓ IBulkMigrationService.cs exists
✓ MigrationRequestDto.cs exists
```

### 1.2 Controller Endpoint Verification

**Check SharepointController has bulk migration endpoint:**
```bash
cd ./crm-system/src/CRM.Api/Controllers

# Check for BulkMigration endpoint
grep -n "BulkMigration" SharepointController.cs

# Check route attribute
grep -n 'HttpPost.*migration/bulk' SharepointController.cs

# Check API models
test -f ../Models/BulkMigrationRequest.cs && echo "✓ BulkMigrationRequest.cs exists" || echo "✗ MISSING"
```

**Expected Output:**
```
430:[HttpPost("migration/bulk")]
434:public async Task<IActionResult> BulkMigration(
✓ BulkMigrationRequest.cs exists
```

### 1.3 Code Pattern Verification

**Verify batch processing implementation:**
```bash
# Check for batch size validation (Graph API limit: max 20)
grep -n "BatchSize.*20" ./crm-system/src/CRM.Application/Services/BulkMigrationService.cs

# Check for batch processing logic
grep -n "GroupBy.*BatchSize" ./crm-system/src/CRM.Application/Services/BulkMigrationService.cs

# Check for parallel processing
grep -n "Task.WhenAll" ./crm-system/src/CRM.Application/Services/BulkMigrationService.cs
```

**Expected Output:**
```
41:if (request.BatchSize < 1 || request.BatchSize > 20)
61:.GroupBy(x => x.index / request.BatchSize)
82:var batchResults = await Task.WhenAll(batchTasks);
```

### 1.4 Dependency Injection Verification

**Check service registration:**
```bash
# Verify IBulkMigrationService is registered
grep -n "IBulkMigrationService" ./crm-system/src/CRM.Application/DependencyInjection.cs

# Check for BulkMigrationService registration
grep -n "BulkMigrationService" ./crm-system/src/CRM.Application/DependencyInjection.cs
```

**Expected Output:**
```
24:services.AddScoped<IBulkMigrationService, BulkMigrationService>();
```

---

## Phase 2: API Endpoint Testing

### 2.1 Direct API Call with cURL

**Test bulk migration endpoint with minimal payload:**
```bash
# Record start time for database queries
MIGRATION_START=$(date -u +"%Y-%m-%d %H:%M:%S")
echo "Migration start time: $MIGRATION_START"

# Call bulk migration endpoint
curl -X POST https://localhost:5001/api/sharepoint/migration/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "sourcePath": "/tmp/migration-test",
    "entityMappings": [
      {
        "filePath": "document-1.txt",
        "entityType": "Customer",
        "entityId": "123",
        "originalCreatedDate": "2024-01-01T10:00:00Z",
        "originalModifiedDate": "2024-01-15T14:30:00Z",
        "originalAuthor": "john.smith@example.com"
      },
      {
        "filePath": "document-2.txt",
        "entityType": "Customer",
        "entityId": "123",
        "originalCreatedDate": "2024-01-02T09:00:00Z",
        "originalModifiedDate": "2024-01-16T11:20:00Z",
        "originalAuthor": "jane.doe@example.com"
      },
      {
        "filePath": "document-3.txt",
        "entityType": "Lead",
        "entityId": "456",
        "originalCreatedDate": "2024-01-03T11:00:00Z",
        "originalModifiedDate": "2024-01-17T16:45:00Z",
        "originalAuthor": "bob.wilson@example.com"
      },
      {
        "filePath": "document-4.txt",
        "entityType": "Lead",
        "entityId": "456",
        "originalCreatedDate": "2024-01-04T08:30:00Z",
        "originalModifiedDate": "2024-01-18T09:10:00Z",
        "originalAuthor": "alice.brown@example.com"
      },
      {
        "filePath": "document-5.txt",
        "entityType": "Deal",
        "entityId": "789",
        "originalCreatedDate": "2024-01-05T14:00:00Z",
        "originalModifiedDate": "2024-01-19T13:25:00Z",
        "originalAuthor": "charlie.davis@example.com"
      },
      {
        "filePath": "document-6.txt",
        "entityType": "Deal",
        "entityId": "789",
        "originalCreatedDate": "2024-01-06T15:30:00Z",
        "originalModifiedDate": "2024-01-20T10:50:00Z",
        "originalAuthor": "diana.evans@example.com"
      },
      {
        "filePath": "document-7.txt",
        "entityType": "Activity",
        "entityId": "101",
        "originalCreatedDate": "2024-01-07T09:45:00Z",
        "originalModifiedDate": "2024-01-21T15:15:00Z",
        "originalAuthor": "frank.garcia@example.com"
      },
      {
        "filePath": "document-8.txt",
        "entityType": "Customer",
        "entityId": "124",
        "originalCreatedDate": "2024-01-08T12:00:00Z",
        "originalModifiedDate": "2024-01-22T12:40:00Z",
        "originalAuthor": "grace.hernandez@example.com"
      },
      {
        "filePath": "large-document-1.bin",
        "entityType": "Customer",
        "entityId": "125",
        "originalCreatedDate": "2024-01-09T16:20:00Z",
        "originalModifiedDate": "2024-01-23T17:00:00Z",
        "originalAuthor": "henry.jackson@example.com"
      },
      {
        "filePath": "large-document-2.bin",
        "entityType": "Lead",
        "entityId": "457",
        "originalCreatedDate": "2024-01-10T10:10:00Z",
        "originalModifiedDate": "2024-01-24T11:30:00Z",
        "originalAuthor": "irene.johnson@example.com"
      }
    ],
    "batchSize": 20,
    "preserveTimestamps": true,
    "continueOnError": true
  }' | jq .
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Migration completed: 10 succeeded, 0 failed out of 10 total files",
  "data": {
    "totalFiles": 10,
    "successCount": 10,
    "failedCount": 0,
    "message": "Migration completed: 10 succeeded, 0 failed out of 10 total files",
    "results": [
      {
        "fileName": "document-1.txt",
        "entityType": "Customer",
        "entityId": "123",
        "success": true,
        "sharePointItemId": "01ABCDEF...",
        "webUrl": "https://contoso.sharepoint.com/sites/CRM/Shared%20Documents/DEV/CRM/Customers/123/document-1.txt",
        "errorMessage": null
      },
      {
        "fileName": "document-2.txt",
        "entityType": "Customer",
        "entityId": "123",
        "success": true,
        "sharePointItemId": "01GHIJKL...",
        "webUrl": "https://contoso.sharepoint.com/sites/CRM/Shared%20Documents/DEV/CRM/Customers/123/document-2.txt",
        "errorMessage": null
      }
      // ... 8 more results
    ]
  }
}
```

### 2.2 Error Handling Tests

**Test with invalid batch size:**
```bash
curl -X POST https://localhost:5001/api/sharepoint/migration/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/tmp/test",
    "entityMappings": [{"filePath": "test.txt", "entityType": "Customer", "entityId": "1"}],
    "batchSize": 25
  }' | jq .
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "BatchSize must be between 1 and 20.",
  "data": null
}
```

**Test with empty entity mappings:**
```bash
curl -X POST https://localhost:5001/api/sharepoint/migration/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/tmp/test",
    "entityMappings": [],
    "batchSize": 10
  }' | jq .
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "EntityMappings list cannot be empty.",
  "data": null
}
```

**Test with missing source path:**
```bash
curl -X POST https://localhost:5001/api/sharepoint/migration/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "",
    "entityMappings": [{"filePath": "test.txt", "entityType": "Customer", "entityId": "1"}],
    "batchSize": 10
  }' | jq .
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "SourcePath is required.",
  "data": null
}
```

---

## Phase 3: Database Verification

### 3.1 Check Migration Results in Database

**Count migrated files:**
```sql
-- Count total files migrated after start time
SELECT COUNT(*) as migrated_files
FROM crm_sharepoint_files
WHERE created_at > '2024-01-27 18:00:00';  -- Use $MIGRATION_START from Phase 2
```

**Expected Result:**
```
+------------------+
| migrated_files   |
+------------------+
|               10 |
+------------------+
```

### 3.2 Verify Entity Distribution

**Check files per entity type:**
```sql
SELECT
  entity_type,
  COUNT(*) as file_count
FROM crm_sharepoint_files
WHERE created_at > '2024-01-27 18:00:00'
GROUP BY entity_type
ORDER BY entity_type;
```

**Expected Result:**
```
+--------------+------------+
| entity_type  | file_count |
+--------------+------------+
| Activity     |          1 |
| Customer     |          4 |
| Deal         |          2 |
| Lead         |          3 |
+--------------+------------+
```

### 3.3 Verify Metadata Fields

**Check all required fields are populated:**
```sql
SELECT
  name,
  entity_type,
  entity_id,
  item_id,
  drive_id,
  web_url,
  size,
  mime_type,
  etag,
  ctag,
  version_number,
  CASE WHEN raw_json IS NOT NULL THEN 'Populated' ELSE 'NULL' END as raw_json_status
FROM crm_sharepoint_files
WHERE created_at > '2024-01-27 18:00:00'
ORDER BY entity_type, entity_id, name
LIMIT 5;
```

**Expected Result (sample):**
```
+-------------------+-------------+-----------+--------------+-----------+----------------------------------+------+-----------+------+------+----------------+-------------------+
| name              | entity_type | entity_id | item_id      | drive_id  | web_url                          | size | mime_type | etag | ctag | version_number | raw_json_status   |
+-------------------+-------------+-----------+--------------+-----------+----------------------------------+------+-----------+------+------+----------------+-------------------+
| document-7.txt    | Activity    | 101       | 01ABCDEF...  | b!xyz...  | https://sharepoint.com/...       | 1234 | text/plain| "..."| "..."| 1              | Populated         |
| document-1.txt    | Customer    | 123       | 01GHIJKL...  | b!xyz...  | https://sharepoint.com/...       | 1234 | text/plain| "..."| "..."| 1              | Populated         |
| document-2.txt    | Customer    | 123       | 01MNOPQR...  | b!xyz...  | https://sharepoint.com/...       | 1234 | text/plain| "..."| "..."| 1              | Populated         |
| document-8.txt    | Customer    | 124       | 01STUVWX...  | b!xyz...  | https://sharepoint.com/...       | 1234 | text/plain| "..."| "..."| 1              | Populated         |
| large-document... | Customer    | 125       | 01YZ1234...  | b!xyz...  | https://sharepoint.com/...       |5242880| binary   | "..."| "..."| 1              | Populated         |
+-------------------+-------------+-----------+--------------+-----------+----------------------------------+------+-----------+------+------+----------------+-------------------+
```

### 3.4 Verify File Sizes

**Check file sizes match source files:**
```sql
SELECT
  name,
  size,
  CASE
    WHEN size < 1024 THEN CONCAT(size, ' B')
    WHEN size < 1048576 THEN CONCAT(ROUND(size/1024, 2), ' KB')
    ELSE CONCAT(ROUND(size/1048576, 2), ' MB')
  END as human_readable_size
FROM crm_sharepoint_files
WHERE created_at > '2024-01-27 18:00:00'
ORDER BY size DESC;
```

**Expected Result:**
```
+-------------------------+---------+----------------------+
| name                    | size    | human_readable_size  |
+-------------------------+---------+----------------------+
| large-document-1.bin    | 5242880 | 5.00 MB              |
| large-document-2.bin    | 3145728 | 3.00 MB              |
| document-1.txt          | 234     | 234 B                |
| document-2.txt          | 234     | 234 B                |
| ...                     | ...     | ...                  |
+-------------------------+---------+----------------------+
```

---

## Phase 4: SharePoint Verification

### 4.1 Manual SharePoint Folder Check

**Navigate to SharePoint and verify folders:**
1. Open SharePoint site in browser
2. Navigate to document library: `Shared Documents` → `DEV` → `CRM`
3. Verify folder structure exists:
   ```
   DEV/
   └── CRM/
       ├── Customers/
       │   ├── 123/
       │   ├── 124/
       │   └── 125/
       ├── Leads/
       │   ├── 456/
       │   └── 457/
       ├── Deals/
       │   └── 789/
       └── Activities/
           └── 101/
   ```

**Expected Result:**
- ✓ All entity type folders exist (Customers, Leads, Deals, Activities)
- ✓ All entity ID subfolders exist (123, 124, 125, 456, 457, 789, 101)
- ✓ No extra or orphaned folders

### 4.2 Verify Files in Each Folder

**For each entity folder, check file count:**

**Customer 123:**
- Expected files: document-1.txt, document-2.txt
- Count: 2 files

**Customer 124:**
- Expected files: document-8.txt
- Count: 1 file

**Customer 125:**
- Expected files: large-document-1.bin
- Count: 1 file

**Lead 456:**
- Expected files: document-3.txt, document-4.txt
- Count: 2 files

**Lead 457:**
- Expected files: large-document-2.bin
- Count: 1 file

**Deal 789:**
- Expected files: document-5.txt, document-6.txt
- Count: 2 files

**Activity 101:**
- Expected files: document-7.txt
- Count: 1 file

**Total across all folders: 10 files**

### 4.3 Verify File Properties in SharePoint

**For each file, check metadata:**
1. Right-click file → Properties / Details
2. Verify fields:
   - Name: Matches original filename
   - Size: Matches source file size
   - Modified: Timestamp populated
   - Modified By: User who performed migration
   - Created: Timestamp populated
   - Type: Correct MIME type (text/plain, application/octet-stream, etc.)

**Expected Result:**
- ✓ All files have correct names
- ✓ File sizes match source files
- ✓ Timestamps are populated (not null)
- ✓ File types are correctly detected

### 4.4 Verify File Accessibility

**Test file download:**
1. Click on a file in SharePoint (e.g., document-1.txt)
2. Click "Download"
3. Verify downloaded file content matches original

**Expected Result:**
```bash
# Compare downloaded file with original
diff /tmp/migration-test/document-1.txt ~/Downloads/document-1.txt
# Expected: No output (files are identical)
```

---

## Phase 5: Batch Processing Verification

### 5.1 Test with Small Batch Size

**Migrate with batch size = 3 (should create 4 batches for 10 files):**
```bash
curl -X POST https://localhost:5001/api/sharepoint/migration/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/tmp/migration-test-2",
    "entityMappings": [
      {"filePath": "file1.txt", "entityType": "Customer", "entityId": "200"},
      {"filePath": "file2.txt", "entityType": "Customer", "entityId": "200"},
      {"filePath": "file3.txt", "entityType": "Customer", "entityId": "200"},
      {"filePath": "file4.txt", "entityType": "Customer", "entityId": "200"},
      {"filePath": "file5.txt", "entityType": "Customer", "entityId": "200"},
      {"filePath": "file6.txt", "entityType": "Customer", "entityId": "200"},
      {"filePath": "file7.txt", "entityType": "Customer", "entityId": "200"},
      {"filePath": "file8.txt", "entityType": "Customer", "entityId": "200"},
      {"filePath": "file9.txt", "entityType": "Customer", "entityId": "200"},
      {"filePath": "file10.txt", "entityType": "Customer", "entityId": "200"}
    ],
    "batchSize": 3,
    "preserveTimestamps": true,
    "continueOnError": true
  }' | jq .
```

**Check backend logs for batch processing:**
```bash
# In CRM backend terminal, look for log messages:
grep -i "Processing batch" /var/log/crm-api.log
```

**Expected Log Output:**
```
Processing batch 1/4 with 3 files
Processing batch 2/4 with 3 files
Processing batch 3/4 with 3 files
Processing batch 4/4 with 1 files
```

### 5.2 Test Graph API Limit Enforcement

**Attempt to use batch size > 20 (should fail validation):**
```bash
curl -X POST https://localhost:5001/api/sharepoint/migration/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/tmp/test",
    "entityMappings": [{"filePath": "test.txt", "entityType": "Customer", "entityId": "1"}],
    "batchSize": 25
  }' | jq .
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "BatchSize must be between 1 and 20.",
  "data": null
}
```

---

## Phase 6: Error Handling Verification

### 6.1 Test ContinueOnError = true

**Migrate files with some invalid entity IDs:**
```bash
curl -X POST https://localhost:5001/api/sharepoint/migration/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/tmp/migration-test-errors",
    "entityMappings": [
      {"filePath": "valid1.txt", "entityType": "Customer", "entityId": "123"},
      {"filePath": "invalid.txt", "entityType": "Customer", "entityId": ""},
      {"filePath": "valid2.txt", "entityType": "Lead", "entityId": "456"}
    ],
    "batchSize": 10,
    "continueOnError": true
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Migration completed: 2 succeeded, 1 failed out of 3 total files",
  "data": {
    "totalFiles": 3,
    "successCount": 2,
    "failedCount": 1,
    "results": [
      {
        "fileName": "valid1.txt",
        "success": true,
        "errorMessage": null
      },
      {
        "fileName": "invalid.txt",
        "success": false,
        "errorMessage": "Entity ID is required"
      },
      {
        "fileName": "valid2.txt",
        "success": true,
        "errorMessage": null
      }
    ]
  }
}
```

### 6.2 Test ContinueOnError = false

**Migrate with ContinueOnError disabled:**
```bash
curl -X POST https://localhost:5001/api/sharepoint/migration/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "sourcePath": "/tmp/migration-test-errors",
    "entityMappings": [
      {"filePath": "valid1.txt", "entityType": "Customer", "entityId": "123"},
      {"filePath": "invalid.txt", "entityType": "Customer", "entityId": ""},
      {"filePath": "valid2.txt", "entityType": "Lead", "entityId": "456"}
    ],
    "batchSize": 10,
    "continueOnError": false
  }' | jq .
```

**Expected Behavior:**
- Migration stops at first error
- Returns partial results
- Logs error clearly

---

## Phase 7: Performance Testing

### 7.1 Test with 100 Files

**Create 100 test files:**
```bash
mkdir -p /tmp/migration-perf-test
for i in {1..100}; do
  echo "Performance test file $i" > /tmp/migration-perf-test/perf-file-$i.txt
done
```

**Generate entity mappings (50 Customer, 30 Lead, 20 Deal):**
```bash
# Script to generate JSON payload
cat > /tmp/generate-mappings.sh <<'EOF'
#!/bin/bash
echo '{"sourcePath":"/tmp/migration-perf-test","entityMappings":['

# 50 Customer files
for i in {1..50}; do
  echo "{\"filePath\":\"perf-file-$i.txt\",\"entityType\":\"Customer\",\"entityId\":\"$((100+i))\"}"
  if [ $i -lt 50 ]; then echo ","; fi
done

# 30 Lead files
for i in {51..80}; do
  echo ",{\"filePath\":\"perf-file-$i.txt\",\"entityType\":\"Lead\",\"entityId\":\"$((100+i))\"}"
done

# 20 Deal files
for i in {81..100}; do
  echo ",{\"filePath\":\"perf-file-$i.txt\",\"entityType\":\"Deal\",\"entityId\":\"$((100+i))\"}"
done

echo '],"batchSize":20,"preserveTimestamps":true,"continueOnError":true}'
EOF

chmod +x /tmp/generate-mappings.sh
```

**Execute performance test with timing:**
```bash
# Record start time
START_TIME=$(date +%s)

# Execute migration
/tmp/generate-mappings.sh | curl -X POST https://localhost:5001/api/sharepoint/migration/bulk \
  -H "Content-Type: application/json" \
  -d @- \
  -w "\n\nTime: %{time_total}s\n" | jq .

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
echo "Total migration time: ${ELAPSED} seconds"
```

**Expected Performance:**
- 100 files in 5 batches (20 files each)
- Total time: < 60 seconds (acceptable)
- All files migrated successfully
- Database has 100 new records

### 7.2 Verify Performance Metrics

**Check database for performance test results:**
```sql
SELECT
  COUNT(*) as total_files,
  SUM(size) as total_size_bytes,
  MIN(created_at) as migration_start,
  MAX(created_at) as migration_end,
  TIMESTAMPDIFF(SECOND, MIN(created_at), MAX(created_at)) as duration_seconds
FROM crm_sharepoint_files
WHERE name LIKE 'perf-file-%';
```

**Expected Result:**
```
+--------------+-------------------+---------------------+---------------------+------------------+
| total_files  | total_size_bytes  | migration_start     | migration_end       | duration_seconds |
+--------------+-------------------+---------------------+---------------------+------------------+
|          100 |             24600 | 2024-01-27 18:30:00 | 2024-01-27 18:30:45 |               45 |
+--------------+-------------------+---------------------+---------------------+------------------+
```

---

## Success Criteria Checklist

### Implementation Complete
- [x] BulkMigrationService.cs implements batch processing logic
- [x] IBulkMigrationService interface defined
- [x] MigrationRequestDto and MigrationItemDto created
- [x] POST /api/sharepoint/migration/bulk endpoint exists
- [x] BulkMigrationRequest API model with validation attributes
- [x] EntityMappingDto with all required fields
- [x] Service registered in DependencyInjection.cs
- [x] Batch size validation (1-20) enforced
- [x] Graph API batch limit compliance (max 20 per batch)
- [x] Parallel processing within batches implemented
- [x] Error handling with ContinueOnError support

### API Endpoint Functionality
- [ ] POST /api/sharepoint/migration/bulk returns 200 OK on success
- [ ] Response includes totalFiles, successCount, failedCount
- [ ] Response includes detailed results array with per-file status
- [ ] Validation errors return 400 Bad Request
- [ ] Missing sourcePath returns descriptive error
- [ ] Empty entityMappings returns descriptive error
- [ ] Invalid batch size (<1 or >20) returns error
- [ ] ContinueOnError=true allows processing to continue after failures
- [ ] ContinueOnError=false stops at first error

### Batch Processing
- [ ] Files processed in correct batch sizes (respects batchSize parameter)
- [ ] Parallel processing within batches (Task.WhenAll)
- [ ] Sequential batch execution (one batch completes before next starts)
- [ ] Batch progress logged with batch number and file count
- [ ] Graph API limit enforced (max 20 files per batch)
- [ ] Large file sets (100+ files) processed successfully
- [ ] Performance acceptable (100 files < 60 seconds)

### Database Verification
- [ ] All migrated files have records in crm_sharepoint_files table
- [ ] Record count matches successCount from API response
- [ ] EntityType populated correctly (Customer, Lead, Deal, Activity)
- [ ] EntityId populated correctly from mappings
- [ ] ItemId populated (SharePoint unique identifier)
- [ ] DriveId populated (SharePoint drive identifier)
- [ ] WebUrl populated (direct link to file in SharePoint)
- [ ] Size populated with correct file size in bytes
- [ ] MimeType detected correctly
- [ ] ETag and CTag populated (version tracking)
- [ ] VersionNumber initialized to 1
- [ ] RawJson contains full SharePoint API response
- [ ] created_at timestamps reflect migration time

### SharePoint Verification
- [ ] All entity folders created in SharePoint (Customers, Leads, Deals, Activities)
- [ ] Entity ID subfolders created automatically
- [ ] All 10 test files visible in SharePoint folders
- [ ] Files in correct entity folders (Customer 123 has document-1.txt and document-2.txt)
- [ ] File names match original filenames
- [ ] File sizes match source files
- [ ] File content matches source files (download and compare)
- [ ] Metadata visible in SharePoint (Modified, Created, Type)
- [ ] No duplicate files created
- [ ] No orphaned folders exist

### Error Handling
- [ ] Invalid entity ID caught and reported
- [ ] Missing entity type caught and reported
- [ ] Empty file rejected with error
- [ ] ContinueOnError=true processes remaining files after error
- [ ] Error messages descriptive and actionable
- [ ] Failed files reported in results array with errorMessage
- [ ] Partial success reported correctly (some succeed, some fail)

### Logging and Monitoring
- [ ] Migration start logged with file count
- [ ] Batch processing logged with batch numbers
- [ ] Migration completion logged with success/fail counts
- [ ] Errors logged with context (file name, entity info)
- [ ] Performance metrics logged (time per batch)

### Code Quality
- [ ] No console.log or debugging statements
- [ ] Follows existing patterns (CRMUploadService.cs)
- [ ] XML documentation on all public methods
- [ ] Input validation with descriptive error messages
- [ ] Uses cancellation tokens for async operations
- [ ] Dependency injection pattern followed
- [ ] Repository pattern used consistently
- [ ] Error handling doesn't expose internal details

---

## Known Issues and Limitations

### Current Implementation Limitations
1. **File Upload Mechanism**: Current endpoint doesn't handle actual file uploads (multipart/form-data). It expects files to exist at sourcePath on server filesystem. Real-world usage would require multipart upload support.

2. **No Progress Tracking**: Synchronous endpoint - no real-time progress updates. For large migrations (1000+ files), consider implementing async processing with progress polling endpoint.

3. **No Rollback Support**: If migration partially fails, there's no automatic rollback. Failed files remain unmigrated, successful files are in SharePoint.

4. **Metadata Preservation**: PreserveTimestamps flag exists but actual timestamp preservation depends on SharePoint API support (may require additional Graph API calls).

5. **File Deduplication**: No check for existing files. Re-running migration creates duplicate files with unique names (timestamp + GUID suffix).

### Workarounds
- **File Upload**: For testing, place files on server filesystem at specified sourcePath
- **Progress Tracking**: Monitor backend logs for batch processing messages
- **Rollback**: Manually delete migrated files from SharePoint if needed
- **Timestamp Preservation**: Verify SharePoint file properties after migration
- **Deduplication**: Clean up SharePoint folder before re-running migration

---

## Troubleshooting Guide

### Issue: Migration returns 400 "SourcePath is required"
**Cause:** Request body missing sourcePath field or value is empty
**Solution:** Ensure JSON payload includes `"sourcePath": "/path/to/files"`

### Issue: Migration returns 400 "BatchSize must be between 1 and 20"
**Cause:** Batch size exceeds Graph API limit
**Solution:** Set batchSize to value between 1-20 (default 20)

### Issue: All files fail with "Entity ID is required"
**Cause:** EntityMappings have empty or null entityId fields
**Solution:** Verify all mappings have valid entityId values

### Issue: Database count doesn't match successCount
**Cause:** Database query filtering by wrong timestamp
**Solution:** Use exact migration start time from $MIGRATION_START variable

### Issue: Files not appearing in SharePoint
**Cause:** SharePoint folder permissions or ISharepointService not configured
**Solution:** Verify Azure AD credentials and Graph API permissions

### Issue: Migration very slow (>2 minutes for 10 files)
**Cause:** Network latency to SharePoint or large file sizes
**Solution:** Check network connection, reduce batch size for large files

### Issue: "Folder creation failed" errors
**Cause:** Insufficient SharePoint permissions
**Solution:** Verify Azure AD app has Sites.ReadWrite.All permission

---

## Rollback Plan

If migration verification fails:

1. **Delete migrated files from SharePoint:**
   - Navigate to each entity folder in SharePoint
   - Select all files created during test migration
   - Delete files

2. **Clean up database records:**
   ```sql
   DELETE FROM crm_sharepoint_files
   WHERE created_at > '2024-01-27 18:00:00';  -- Use actual migration start time
   ```

3. **Verify cleanup:**
   ```sql
   SELECT COUNT(*) FROM crm_sharepoint_files
   WHERE created_at > '2024-01-27 18:00:00';
   -- Expected: 0
   ```

4. **Remove test folders:**
   ```bash
   rm -rf /tmp/migration-test
   rm -rf /tmp/migration-perf-test
   ```

---

## Contacts and Resources

**Documentation:**
- SharePoint API: https://docs.microsoft.com/en-us/graph/api/resources/driveitem
- Batch Requests: https://docs.microsoft.com/en-us/graph/json-batching

**Team Contacts:**
- Backend Lead: [Contact info]
- SharePoint Admin: [Contact info]
- QA Lead: [Contact info]

**Issue Tracking:**
- File bugs: [Issue tracker URL]
- Feature requests: [Product board URL]

---

## Next Steps After Verification

1. Complete this verification checklist
2. Update subtask status to "completed" in implementation_plan.json
3. Git commit verification documentation
4. Proceed to QA sign-off (all Phase 6 subtasks complete)
5. Production deployment planning

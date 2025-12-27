# End-to-End Verification: Unified Search Functionality

## Document Information
- **Verification ID**: E2E-SEARCH-001
- **Subtask**: subtask-6-3
- **Phase**: End-to-End Integration & Verification
- **Created**: 2025-12-28
- **Status**: Ready for Manual Testing

---

## Overview

This document provides comprehensive verification steps for the unified search functionality that aggregates results from both the CRM database and SharePoint repositories. The unified search enables users to find documents across both platforms from a single search interface.

---

## Prerequisites

### 1. Services Running
Ensure all required services are running:

```bash
# Terminal 1: Authentication Service
cd res-auth-api/res-auth-api/src/ResAuthApi.Api
dotnet run
# Expected: Running on https://localhost:7000

# Terminal 2: CRM Backend API
cd crm-system/src/CRM.Api
dotnet run
# Expected: Running on https://localhost:5001

# Terminal 3: CRM Frontend
cd crm-system-client
npm run dev
# Expected: Running on http://localhost:3000
```

### 2. Configuration Requirements

**Backend (appsettings.json):**
```json
{
  "Sharepoint": {
    "GraphApiBase": "https://graph.microsoft.com/v1.0/sites",
    "Site": "{hostname},{siteId},{webId}",
    "DocLibrary": "{driveId}",
    "DealFolderPath": "DEV/CRM/Deals"
  },
  "AzureAd": {
    "TenantId": "your-tenant-id",
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret"
  }
}
```

**Azure AD App Registration:**
- Graph API Permissions: `Files.ReadWrite.All`, `Sites.ReadWrite.All`, `Sites.Search.All`
- Admin consent granted

### 3. Test Data Preparation

You'll need:
- A test PDF document named **'Q4 Proposal.pdf'** (create a simple PDF with searchable text)
- Content in the PDF should include unique searchable terms like "proposal", "Q4", "quarterly report"
- A Deal entity with ID **456** in the CRM database
- Database access to verify search results

---

## Implementation Verification

### Backend Components

**✅ UnifiedSearchService** (`CRM.Application/Services/UnifiedSearchService.cs`):
- Searches CRM database (crm_sharepoint_files table)
- Searches SharePoint via Graph API
- Merges and deduplicates results by ItemId
- Sorts by relevance score and last modified date
- Returns SearchResultDto with source indicator

**✅ SharepointController Search Endpoint** (`CRM.Api/Controllers/SharepointController.cs`):
- Route: `GET /api/sharepoint/search`
- Query parameters: `q` (required), `entityType` (optional), `entityId` (optional)
- Validation, logging, error handling
- Returns ApiResponse wrapper with search results

**✅ SearchResultDto** (`CRM.Application/Dtos/Response/SearchResultDto.cs`):
- Fields: Id, Name, WebUrl, Size, MimeType
- Timestamps: LastModifiedDateTime, LastModifiedBy
- Entity metadata: EntityType, EntityId, FolderPath
- Search metadata: **Source** (CRM/SharePoint), RelevanceScore, MatchedSnippet

### Frontend Components

**✅ SharePoint API Client** (`crm-system-client/src/infrastructure/api/sharepointApi.js`):
- `searchDocuments(query, entityType, entityId)` method
- Handles optional filters dynamically
- Maps to backend endpoint correctly

**✅ SearchDocumentsUseCase** (`crm-system-client/src/application/usecases/sharepoint/SearchDocumentsUseCase.js`):
- Constructor-based dependency injection
- `execute(query, entityType, entityId)` method
- Clean separation of concerns

---

## Verification Steps

### Phase 1: Document Upload for Testing

**Objective**: Upload test document to Deal 456 for search verification

**Steps**:

1. **Prepare Test Document**
   ```bash
   # Create a simple test PDF with searchable content
   # Ensure it contains the word "proposal" and "Q4"
   ```

2. **Upload via API**
   ```bash
   # Using curl or Postman
   curl -X POST https://localhost:5001/api/sharepoint/upload \
     -H "Content-Type: multipart/form-data" \
     -F "file=@Q4_Proposal.pdf" \
     -F "FolderPath=DEV/CRM/Deals/456" \
     -F "EntityType=Deal" \
     -F "EntityId=456"
   ```

   **Expected Response**:
   ```json
   {
     "success": true,
     "data": "{fileId}",
     "message": "Upload file successfully"
   }
   ```

3. **Verify Database Entry**
   ```sql
   SELECT
     Id, ItemId, Name, EntityType, EntityId,
     WebUrl, Size, MimeType, CreatedDateTime
   FROM crm_sharepoint_files
   WHERE EntityType = 'Deal' AND EntityId = '456'
   ORDER BY CreatedDateTime DESC
   LIMIT 1;
   ```

   **Expected Result**: Row with 'Q4 Proposal.pdf' (or sanitized version)

4. **Wait for SharePoint Indexing**
   ```bash
   # SharePoint search requires content indexing
   # Wait 30 seconds for SharePoint to index the new document
   sleep 30
   ```

---

### Phase 2: Basic Search Functionality

**Objective**: Verify search returns results from both CRM database and SharePoint

**Test 1: Search by Filename**

```bash
# API Call
curl -X GET "https://localhost:5001/api/sharepoint/search?q=proposal" \
  -H "Accept: application/json"
```

**Expected Response Structure**:
```json
{
  "success": true,
  "data": [
    {
      "id": "{database-id}",
      "itemId": "{sharepoint-item-id}",
      "name": "Q4_Proposal_{timestamp}_{guid}.pdf",
      "webUrl": "https://{tenant}.sharepoint.com/sites/{site}/Shared%20Documents/DEV/CRM/Deals/456/Q4_Proposal_*.pdf",
      "size": 123456,
      "mimeType": "application/pdf",
      "lastModifiedDateTime": "2025-12-28T...",
      "lastModifiedBy": "user@domain.com",
      "entityType": "Deal",
      "entityId": "456",
      "folderPath": "DEV/CRM/Deals/456",
      "source": "CRM",
      "relevanceScore": 0.95,
      "matchedSnippet": "...Q4 Proposal..."
    }
  ],
  "message": "Found 1 document(s) matching 'proposal'"
}
```

**Verification Checklist**:
- [ ] Response status: 200 OK
- [ ] Response contains at least 1 result
- [ ] Result includes `name` field
- [ ] Result includes `webUrl` field (SharePoint link)
- [ ] Result includes `size` field (in bytes)
- [ ] Result includes `lastModifiedDateTime` field
- [ ] Result includes **`source`** field with value "CRM" or "SharePoint"
- [ ] Result includes `entityType` = "Deal"
- [ ] Result includes `entityId` = "456"
- [ ] `webUrl` is a valid SharePoint URL

**Test 2: Search with Entity Filter**

```bash
# Search filtered by entity type
curl -X GET "https://localhost:5001/api/sharepoint/search?q=proposal&entityType=Deal" \
  -H "Accept: application/json"
```

**Expected**: Results filtered to only Deal documents

**Test 3: Search with Specific Entity ID**

```bash
# Search filtered by specific entity
curl -X GET "https://localhost:5001/api/sharepoint/search?q=proposal&entityType=Deal&entityId=456" \
  -H "Accept: application/json"
```

**Expected**: Results filtered to only Deal 456 documents

---

### Phase 3: Multi-Source Verification

**Objective**: Verify results come from BOTH CRM database AND SharePoint

**Setup**: Upload another document directly via SharePoint (bypassing CRM API)

1. **Upload via SharePoint Web Interface**
   - Navigate to SharePoint site manually
   - Go to folder: `DEV/CRM/Deals/456/`
   - Upload another test file: `Marketing_Plan.pdf`
   - This file will NOT be in CRM database initially

2. **Wait for SharePoint Indexing**
   ```bash
   sleep 30
   ```

3. **Search for Both Documents**
   ```bash
   curl -X GET "https://localhost:5001/api/sharepoint/search?q=.pdf&entityType=Deal&entityId=456"
   ```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "Q4_Proposal_*.pdf",
      "source": "CRM",
      "entityType": "Deal",
      "entityId": "456",
      ...
    },
    {
      "name": "Marketing_Plan.pdf",
      "source": "SharePoint",
      "entityType": "Deal",  // Parsed from folder path
      "entityId": "456",     // Parsed from folder path
      ...
    }
  ],
  "message": "Found 2 document(s) matching '.pdf'"
}
```

**Verification Checklist**:
- [ ] Response contains results from BOTH sources
- [ ] CRM result has `source: "CRM"`
- [ ] SharePoint-only result has `source: "SharePoint"`
- [ ] Both results include all required fields (name, webUrl, size, lastModified)
- [ ] Entity metadata correctly parsed for SharePoint results
- [ ] Results are deduplicated (no duplicates if same ItemId)

---

### Phase 4: Content Search Verification

**Objective**: Verify SharePoint content indexing searches document content

**Note**: This requires SharePoint's search indexing to be fully operational. Content search searches inside document text, not just filenames.

**Test: Search for Unique Term in Document Content**

1. **Ensure Test Document Has Unique Term**
   - Open 'Q4 Proposal.pdf'
   - Add unique text: "FiscalYearEndGoals2025"
   - Save and re-upload if necessary

2. **Wait for Content Indexing**
   ```bash
   # SharePoint content indexing can take several minutes
   sleep 120  # 2 minutes
   ```

3. **Search for Content Term**
   ```bash
   curl -X GET "https://localhost:5001/api/sharepoint/search?q=FiscalYearEndGoals2025"
   ```

**Expected**: Document appears in results even though "FiscalYearEndGoals2025" is not in the filename

**Verification Checklist**:
- [ ] Search returns the document containing the unique term
- [ ] `matchedSnippet` field contains context around the matched term
- [ ] `relevanceScore` is present and reasonable (e.g., > 0.5)

---

### Phase 5: Error Handling Verification

**Test 1: Missing Query Parameter**

```bash
curl -X GET "https://localhost:5001/api/sharepoint/search" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": false,
  "data": null,
  "message": "Search query 'q' is required.",
  "error": null
}
```

**Status Code**: 400 Bad Request

**Test 2: Empty Query Parameter**

```bash
curl -X GET "https://localhost:5001/api/sharepoint/search?q=" \
  -H "Accept: application/json"
```

**Expected**: 400 Bad Request with validation error

**Test 3: No Results**

```bash
curl -X GET "https://localhost:5001/api/sharepoint/search?q=NonExistentDocument12345XYZ"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [],
  "message": "Found 0 document(s) matching 'NonExistentDocument12345XYZ'"
}
```

**Status Code**: 200 OK (empty results, not error)

---

### Phase 6: Frontend Integration (Optional)

**Objective**: Verify search functionality in UI (if search page exists)

**Note**: Current implementation (Phase 5) added DocumentSection to entity detail pages. A global search page may be added separately.

**If Search UI Exists**:

1. **Navigate to Search Page**
   ```
   http://localhost:3000/search
   ```

2. **Enter Search Query**
   - Type: "proposal"
   - Press Enter or click Search button

3. **Verify Results Display**
   - [ ] Results appear in a list/table
   - [ ] Each result shows: Name, Entity Type, Last Modified, Source icon/badge
   - [ ] Click on result opens document in SharePoint (new tab)
   - [ ] Filter options work (entity type dropdown)
   - [ ] No console errors in browser DevTools

---

## Database Verification Queries

### Query 1: Check Document Metadata

```sql
-- Verify uploaded document has complete metadata
SELECT
  Id, ItemId, DriveId, Name, WebUrl, Size, MimeType,
  EntityType, EntityId, FolderPath,
  ETag, CTag, VersionNumber,
  CreatedDateTime, LastModifiedDateTime, LastModifiedBy,
  RawJson
FROM crm_sharepoint_files
WHERE EntityType = 'Deal' AND EntityId = '456'
ORDER BY CreatedDateTime DESC;
```

**Expected**:
- All fields populated (except nullable ones like PermissionLevel)
- `RawJson` contains full SharePoint API response
- `EntityType` = "Deal"
- `EntityId` = "456"

### Query 2: Verify Search Would Find Document

```sql
-- Simulate CRM database search
SELECT
  Id, Name, EntityType, EntityId, MimeType
FROM crm_sharepoint_files
WHERE
  (Name LIKE '%proposal%' OR
   EntityType LIKE '%proposal%' OR
   MimeType LIKE '%proposal%')
  AND EntityType = 'Deal'
  AND EntityId = '456';
```

**Expected**: Returns the 'Q4 Proposal.pdf' document

---

## SharePoint Verification (Manual)

### 1. Verify Folder Structure

1. Navigate to SharePoint site in browser
2. Go to Document Library
3. Navigate to: `DEV/CRM/Deals/456/`

**Expected**:
- Folder exists
- Contains uploaded file 'Q4_Proposal_{timestamp}_{guid}.pdf'
- File is accessible (can download/open)

### 2. Verify Search in SharePoint

1. Use SharePoint's native search box
2. Search for: "proposal"

**Expected**:
- SharePoint search returns the uploaded document
- Document appears in search results
- Content indexing is working (if searching for content terms)

### 3. Check File Metadata

1. Right-click document in SharePoint
2. Select "Details" or "Properties"

**Expected**:
- Created date matches upload time
- Modified date matches upload time (for new file)
- Creator is the service account or user who uploaded

---

## Success Criteria Checklist

Mark each item as complete when verified:

### API Functionality
- [ ] GET /api/sharepoint/search returns 200 OK for valid queries
- [ ] Search returns results from CRM database
- [ ] Search returns results from SharePoint (when content exists)
- [ ] Results contain all required fields: name, webUrl, size, lastModified, source
- [ ] `source` field correctly indicates "CRM" or "SharePoint"
- [ ] Entity filters (entityType, entityId) work correctly
- [ ] Error handling returns 400 for missing query parameter
- [ ] Empty results return 200 with empty array (not error)

### Data Integrity
- [ ] CRM database has complete metadata for uploaded files
- [ ] Search results match database query results
- [ ] SharePoint folder structure is correct (DEV/CRM/Deals/456/)
- [ ] Uploaded files exist in SharePoint at correct paths

### Multi-Source Aggregation
- [ ] Search results include documents from BOTH CRM and SharePoint
- [ ] Results are correctly deduplicated by ItemId
- [ ] CRM results take precedence in deduplication
- [ ] SharePoint-only files are included in results
- [ ] Entity metadata correctly parsed from SharePoint folder paths

### Content Search (if applicable)
- [ ] SharePoint content indexing searches document text
- [ ] Search for terms inside documents returns correct results
- [ ] MatchedSnippet field contains relevant context
- [ ] RelevanceScore is present and reasonable

### Performance
- [ ] Search completes in < 2 seconds for typical queries
- [ ] Parallel execution of CRM and SharePoint searches
- [ ] No timeouts or hanging requests

### Error Handling
- [ ] Missing query parameter returns 400 error
- [ ] Empty query returns 400 error
- [ ] Non-existent search terms return empty results (not error)
- [ ] Service failures are logged but don't crash application
- [ ] Partial results returned if one source fails

---

## Known Issues & Limitations

### 1. SharePoint Content Indexing Delay
**Issue**: SharePoint content indexing is not real-time. After uploading a document, it may take 30 seconds to several minutes before content search works.

**Workaround**:
- Wait 30 seconds minimum after upload before testing content search
- For comprehensive testing, wait 5-10 minutes
- Filename/metadata search works immediately

### 2. Graph API Search Permissions
**Issue**: Graph API search requires `Sites.Search.All` permission which may require admin consent.

**Workaround**:
- Ensure Azure AD app has required permissions
- Request admin consent if search returns 403 errors
- Check Graph API permissions in Azure Portal

### 3. Path Parsing for SharePoint-Only Files
**Issue**: Files uploaded directly to SharePoint (not via CRM API) need entity metadata parsed from folder path.

**Status**: Implementation includes path parsing logic (`ExtractEntityInfoFromPath` method in UnifiedSearchService)

**Limitation**: Only works if folder path follows pattern: `DEV/CRM/{EntityType}/{EntityId}/`

### 4. Search Performance with Large Datasets
**Issue**: Searching large number of files (>10,000) may be slow.

**Mitigation**:
- Implement pagination if needed
- Add caching for frequent searches
- Consider search index optimization

---

## Rollback Plan

If verification fails and issues cannot be resolved:

1. **Disable Search Endpoint** (immediate):
   ```csharp
   // In SharepointController.cs, add [Obsolete] or comment out endpoint
   // [HttpGet("search")]
   // public async Task<IActionResult> Search(...) { ... }
   ```

2. **Revert Database Changes** (if needed):
   ```sql
   -- No database schema changes in this subtask
   -- Only data changes (uploaded files)
   DELETE FROM crm_sharepoint_files WHERE EntityType = 'Deal' AND EntityId = '456';
   ```

3. **Remove Frontend Integration** (if UI was added):
   ```javascript
   // Comment out search API calls in sharepointApi.js
   // searchDocuments: (query, entityType, entityId) => { ... },
   ```

4. **Restore Previous Code**:
   ```bash
   git revert HEAD
   git push
   ```

---

## Troubleshooting Guide

### Issue: Search Returns Empty Results

**Diagnosis**:
1. Check if document was uploaded successfully:
   ```sql
   SELECT * FROM crm_sharepoint_files WHERE EntityType = 'Deal' AND EntityId = '456';
   ```
2. Check if SharePoint indexing is complete (wait longer)
3. Check if search query matches filename or content

**Resolution**:
- Verify upload step completed successfully
- Wait for SharePoint indexing (30+ seconds)
- Try searching for exact filename first
- Check Graph API permissions

### Issue: 403 Forbidden from SharePoint

**Diagnosis**:
- Graph API permission issue
- Missing `Sites.Search.All` permission

**Resolution**:
1. Go to Azure Portal → App Registrations → Your App
2. Navigate to "API Permissions"
3. Add `Sites.Search.All` (Application permission)
4. Click "Grant admin consent"
5. Restart backend service

### Issue: Source Field Always "CRM"

**Diagnosis**:
- SharePoint search not returning results
- Graph API integration not working

**Resolution**:
1. Check ISharepointService.SearchDocuments() implementation
2. Verify Graph API credentials in appsettings.json
3. Test Graph API directly with Postman:
   ```
   GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives/{drive-id}/root/search(q='proposal')
   Authorization: Bearer {token}
   ```

### Issue: Duplicate Results

**Diagnosis**:
- Deduplication logic not working
- Different ItemIds for same file

**Resolution**:
- Check UnifiedSearchService.MergeAndDeduplicateResults() method
- Verify ItemId consistency between CRM and SharePoint
- Review deduplication logic uses ItemId as unique key

---

## Performance Benchmarks

Expected performance targets:

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Simple search (1-10 results) | < 500ms | API response time |
| Complex search (100+ results) | < 2s | API response time |
| Content search (indexed) | < 1s | API response time |
| Search with filters | < 1s | API response time |

**Measurement Method**:
```bash
# Using curl with timing
time curl -X GET "https://localhost:5001/api/sharepoint/search?q=proposal"

# Or check response headers
curl -w "@curl-format.txt" -o /dev/null -s "https://localhost:5001/api/sharepoint/search?q=proposal"

# curl-format.txt content:
# time_total: %{time_total}s
```

---

## Next Steps

After successful verification:

1. **Mark Subtask Complete**:
   - Update implementation_plan.json
   - Set subtask-6-3 status to "completed"

2. **Git Commit**:
   ```bash
   git add .
   git commit -m "auto-claude: subtask-6-3 - Unified search functionality verification complete"
   git push
   ```

3. **Proceed to Next Subtask**: subtask-6-4 (Version tracking and history verification)

4. **Update Documentation**:
   - Add search usage examples to user documentation
   - Document any configuration requirements
   - Note performance characteristics

---

## Contacts & Resources

**Documentation References**:
- Microsoft Graph API Search: https://learn.microsoft.com/en-us/graph/api/driveitem-search
- SharePoint Search Query: https://learn.microsoft.com/en-us/sharepoint/dev/general-development/sharepoint-search-rest-api-overview

**Related Files**:
- Backend Service: `./crm-system/src/CRM.Application/Services/UnifiedSearchService.cs`
- API Controller: `./crm-system/src/CRM.Api/Controllers/SharepointController.cs`
- Frontend API: `./crm-system-client/src/infrastructure/api/sharepointApi.js`
- Use Case: `./crm-system-client/src/application/usecases/sharepoint/SearchDocumentsUseCase.js`

**Support**:
- For Graph API issues: Check Azure Portal → App Registrations
- For SharePoint issues: Check SharePoint Admin Center
- For CRM issues: Check application logs (ILogger output)

---

## Verification Sign-off

**Tester Name**: ___________________________

**Date**: ___________________________

**Test Environment**:
- Backend API Version: ___________________________
- Frontend Version: ___________________________
- SharePoint Site: ___________________________

**Test Results**:
- [ ] All success criteria met
- [ ] Known issues documented
- [ ] Performance acceptable
- [ ] Ready for production

**Notes**:
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

**Signature**: ___________________________

# End-to-End Verification: Version Tracking and History

**Subtask:** subtask-6-4
**Feature:** SharePoint Document Management Integration
**Component:** Version Tracking and History Display
**Verification Type:** E2E Integration Testing
**Status:** Ready for Verification
**Date:** 2025-12-28

---

## Overview

This document provides comprehensive verification steps for the **Version Tracking and History** feature, which enables users to view and track SharePoint document version history directly from the CRM interface.

### Feature Description

When a document is uploaded to SharePoint and subsequently modified (either through SharePoint's web interface or Office 365 applications), SharePoint automatically creates version snapshots. This feature retrieves that version history via Microsoft Graph API and displays it in the CRM UI.

### Workflow

```
1. User uploads document 'test.docx' to Customer 789
   ↓
2. CRM uploads to SharePoint via Graph API
   ↓
3. User manually edits file in SharePoint (Word Online)
   ↓
4. SharePoint creates version 2 automatically
   ↓
5. User clicks "Version History" button in CRM
   ↓
6. CRM calls GET /api/sharepoint/files/{fileId}/versions
   ↓
7. Backend calls Graph API /drives/{driveId}/items/{itemId}/versions
   ↓
8. Frontend displays VersionHistoryDialog with all versions
   ↓
9. User sees timestamps, authors, file sizes, and ETags for each version
```

---

## Prerequisites

### 1. Environment Requirements

**Backend Service (crm-system):**
- ✅ ASP.NET Core 8.0 runtime
- ✅ Connection to CRM database
- ✅ SharePoint configuration in appsettings.json
- ✅ Azure AD credentials with Graph API permissions

**Frontend Service (crm-system-client):**
- ✅ Node.js 18+ and npm
- ✅ Vite dev server running on port 3000
- ✅ Authentication configured (MSAL)

**SharePoint Configuration:**
- ✅ Azure AD app registration with Graph API permissions:
  - `Files.ReadWrite.All` (Delegated + Application)
  - `Sites.ReadWrite.All` (Delegated + Application)
- ✅ SharePoint site with document library accessible
- ✅ Folder structure: DEV/CRM/Customers/
- ✅ Version tracking enabled on SharePoint library (should be default)

**Database Requirements:**
- ✅ `crm_sharepoint_files` table exists
- ✅ Test customer record with ID = 789

### 2. Test Data Requirements

**Test Document:**
- File: `test.docx` (Word document)
- Content: Simple text content that can be easily edited
- Size: < 10 MB (for simple upload without upload sessions)

**Test Customer:**
- Customer ID: 789
- Must exist in CRM database
- User must have access permissions

### 3. Service Status Verification

Before starting verification, ensure all services are running:

```bash
# Terminal 1: Backend API
cd crm-system/src/CRM.Api
dotnet run
# Expected: Listening on https://localhost:5001

# Terminal 2: Frontend
cd crm-system-client
npm run dev
# Expected: Running on http://localhost:3000

# Terminal 3: Auth Service (if required)
cd res-auth-api/res-auth-api/src/ResAuthApi.Api
dotnet run
# Expected: Listening on https://localhost:7000
```

**Verify Services:**
```bash
# Check backend health
curl -k https://localhost:5001/health
# Expected: 200 OK

# Check frontend
curl http://localhost:3000
# Expected: HTML response
```

---

## Implementation Verification

### Backend Components

#### 1. SharepointController.cs - GetFileVersionHistory Endpoint

**File:** `./crm-system/src/CRM.Api/Controllers/SharepointController.cs`
**Lines:** 354-419

**Verification Points:**
```bash
# Check endpoint exists
grep -A 10 "GetFileVersionHistory" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs

# Verify route
grep "files/{fileId}/versions" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs
# Expected: [HttpGet("files/{fileId}/versions")]

# Verify response type
grep "ProducesResponseType" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs | grep -A 3 "GetFileVersionHistory"
# Expected: 200, 400, 404, 500 status codes
```

**Implementation Features:**
- ✅ HTTP GET endpoint at `/api/sharepoint/files/{fileId}/versions`
- ✅ Input validation (fileId required, not null/whitespace)
- ✅ Calls `_sharepointService.GetFileVersionHistory(fileId)`
- ✅ Returns version fields: Id, LastModifiedDateTime, LastModifiedBy, Size, ETag
- ✅ Error handling with 404 for file not found
- ✅ Comprehensive logging for audit trail
- ✅ ApiResponse wrapper for consistent response format

#### 2. ISharepointService Interface Extension

**File:** `./crm-system/src/CRM.Application/Interfaces/Services/ISharepointService.cs`

**Verification Points:**
```bash
# Check GetFileVersionHistory method signature
grep -A 5 "GetFileVersionHistory" ./crm-system/src/CRM.Application/Interfaces/Services/ISharepointService.cs

# Check SharePointFileVersion DTO
grep -A 10 "class SharePointFileVersion" ./crm-system/src/CRM.Application/Interfaces/Services/ISharepointService.cs
```

**Expected Interface:**
```csharp
Task<IEnumerable<SharePointFileVersion>> GetFileVersionHistory(string fileId);
```

**Expected DTO Fields:**
- `Id` (string) - Version identifier
- `LastModifiedDateTime` (DateTime?) - Timestamp of version creation
- `LastModifiedBy` (string) - User who created the version
- `Size` (long?) - File size in bytes for this version
- `ETag` (string) - Version tag for conflict detection

### Frontend Components

#### 3. VersionHistoryDialog Component

**File:** `./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx`

**Verification Points:**
```bash
# Check component exists
ls -la ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx

# Verify use case import
grep "GetVersionHistoryUseCase" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx

# Verify repository usage
grep "RestSharePointRepository" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx
```

**Component Features:**
- ✅ Material-UI Dialog component
- ✅ Props: `open`, `onClose`, `document` (with itemId)
- ✅ Uses GetVersionHistoryUseCase to fetch versions
- ✅ Loading state with LinearProgress
- ✅ Error state with Alert component
- ✅ Empty state when no versions available
- ✅ Version list with formatted display:
  - Version label (Current / v1, v2, v3)
  - Timestamp with human-readable format
  - File size with formatting (B, KB, MB, GB)
  - Modified by (author name/email)
  - ETag display
- ✅ Version chips (Current highlighted in primary color)

#### 4. GetVersionHistoryUseCase

**File:** `./crm-system-client/src/application/usecases/sharepoint/GetVersionHistoryUseCase.js`

**Verification Points:**
```bash
# Check use case exists
cat ./crm-system-client/src/application/usecases/sharepoint/GetVersionHistoryUseCase.js

# Verify export
grep "GetVersionHistoryUseCase" ./crm-system-client/src/application/usecases/sharepoint/index.js
```

**Expected Implementation:**
```javascript
class GetVersionHistoryUseCase {
  constructor(sharepointRepository) {
    this.sharepointRepository = sharepointRepository;
  }

  async execute(fileId) {
    return await this.sharepointRepository.getVersionHistory(fileId);
  }
}
```

#### 5. SharePoint API Client

**File:** `./crm-system-client/src/infrastructure/api/sharepointApi.js`

**Verification Points:**
```bash
# Check getVersionHistory method
grep -A 3 "getVersionHistory" ./crm-system-client/src/infrastructure/api/sharepointApi.js
```

**Expected Implementation:**
```javascript
getVersionHistory: (fileId) => {
  return axiosInstance.get(`/sharepoint/files/${fileId}/versions`);
}
```

#### 6. DocumentSection Integration

**File:** `./crm-system-client/src/presentation/components/sharepoint/DocumentSection.jsx`

**Verification Points:**
```bash
# Check VersionHistoryDialog import
grep "VersionHistoryDialog" ./crm-system-client/src/presentation/components/sharepoint/DocumentSection.jsx

# Check version history button
grep -i "version history" ./crm-system-client/src/presentation/components/sharepoint/DocumentSection.jsx
```

**Expected Features:**
- ✅ Import VersionHistoryDialog component
- ✅ "Version History" IconButton in actions column
- ✅ State management for dialog open/close
- ✅ Pass selected document to dialog
- ✅ Dialog closes on user action

---

## Manual Verification Steps

### Phase 1: Initial Document Upload

**Objective:** Upload a test document and capture the fileId for version tracking

**Steps:**

1. **Start all services** (backend, frontend, auth) as described in Prerequisites

2. **Navigate to Customer Detail Page:**
   ```
   URL: http://localhost:3000/customer/789
   ```
   - Login with test credentials if required
   - Verify customer 789 loads successfully

3. **Upload Test Document:**
   - Locate the "Documents" section (should be visible in the page)
   - Click "Upload" button
   - Select `test.docx` from your file system
   - Wait for upload to complete
   - ✅ **Verify:** Success notification appears
   - ✅ **Verify:** Document appears in the document list

4. **Capture FileId from Response:**

   **Option A: Browser DevTools Network Tab**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Upload the document
   - Find the POST request to `/sharepoint/upload`
   - Inspect the response body
   - Note the `fileId` or `itemId` value

   **Option B: Backend Logs**
   - Check backend console logs
   - Look for upload success log with ItemId
   ```
   2025-12-28 08:30:15 [INFO] File uploaded to SharePoint: ItemId=ABC123XYZ
   ```
   - Note the ItemId value

   **Option C: Database Query**
   ```sql
   SELECT ItemId, Name, EntityType, EntityId, WebUrl
   FROM crm_sharepoint_files
   WHERE EntityType = 'Customer' AND EntityId = '789'
   ORDER BY CreatedDateTime DESC
   LIMIT 1;
   ```
   - Note the ItemId from the result

5. **Record FileId for Later Steps:**
   ```
   FileId: ________________________
   (Fill in the actual value from step 4)
   ```

**Expected Outcome:**
- ✅ Document uploaded successfully to SharePoint
- ✅ Document visible in CRM document list
- ✅ FileId/ItemId captured for verification
- ✅ Database record exists in `crm_sharepoint_files` table

**Database Verification:**
```sql
-- Verify upload metadata
SELECT
    Id,
    ItemId,
    DriveId,
    Name,
    EntityType,
    EntityId,
    WebUrl,
    Size,
    ETag,
    CTag,
    VersionNumber,
    CreatedDateTime,
    LastModifiedBy
FROM crm_sharepoint_files
WHERE EntityType = 'Customer' AND EntityId = '789'
  AND Name LIKE '%test.docx%'
ORDER BY CreatedDateTime DESC;
```

**Expected Results:**
- 1 row returned
- ItemId populated (not null)
- DriveId populated
- WebUrl populated (SharePoint URL)
- ETag populated (version tag)
- VersionNumber = 1 (initial version)

---

### Phase 2: SharePoint Document Modification

**Objective:** Modify the document in SharePoint to create version 2

**Steps:**

1. **Open Document in SharePoint:**
   - From the CRM document list, click the document name or "View in SharePoint" link
   - This should open SharePoint in a new browser tab
   - ✅ **Verify:** SharePoint page loads with the document

2. **Edit Document in Word Online:**

   **Option A: Word Online (Recommended for quick testing)**
   - In SharePoint, click the document filename
   - Document opens in Word Online (browser)
   - Make a simple change (add text: "Version 2 - Modified content")
   - File auto-saves automatically (wait for "Saved" indicator)
   - Close the browser tab

   **Option B: Desktop Word (Creates explicit version)**
   - In SharePoint, click "..." menu next to document
   - Select "Open" → "Open in app"
   - Word desktop application opens
   - Edit the document (add text, change formatting)
   - Save the file (Ctrl+S or File → Save)
   - Close Word
   - Return to SharePoint
   - ✅ **Verify:** "Last modified" timestamp updated

3. **Verify Version Created in SharePoint:**
   - In SharePoint document library, right-click the document
   - Select "Version history" from context menu
   - ✅ **Verify:** At least 2 versions shown:
     - Version 1.0 (initial upload)
     - Version 2.0 (your edit)
   - Note the timestamps and authors

4. **Wait for SharePoint Indexing:**
   ```
   ⏳ Wait 10-30 seconds for SharePoint to finalize the version
   ```
   - SharePoint may need a moment to process the version
   - For testing, 30 seconds is usually sufficient

**Expected Outcome:**
- ✅ Document modified successfully in SharePoint
- ✅ Version 2.0 created in SharePoint version history
- ✅ Timestamps and authors recorded
- ✅ Ready for API retrieval

**SharePoint Verification (Manual):**
- Navigate to SharePoint document library
- Document shows updated "Modified" timestamp
- Version history shows multiple versions
- Authors correctly attributed

---

### Phase 3: API Endpoint Direct Testing

**Objective:** Test the backend API endpoint directly to verify version retrieval

**Prerequisites:**
- FileId from Phase 1
- At least 2 versions in SharePoint from Phase 2

**Steps:**

1. **Test GET Endpoint with curl:**

   Replace `{fileId}` with your actual ItemId from Phase 1:

   ```bash
   # Example with sample fileId
   curl -k -X GET "https://localhost:5001/api/sharepoint/files/ABC123XYZ/versions" \
     -H "Content-Type: application/json" \
     | jq .
   ```

   **Expected Response (200 OK):**
   ```json
   {
     "data": [
       {
         "id": "2.0",
         "lastModifiedDateTime": "2025-12-28T08:35:00Z",
         "lastModifiedBy": "user@company.com",
         "size": 15234,
         "eTag": "\"{ABC123XYZ},2\""
       },
       {
         "id": "1.0",
         "lastModifiedDateTime": "2025-12-28T08:30:00Z",
         "lastModifiedBy": "user@company.com",
         "size": 14890,
         "eTag": "\"{ABC123XYZ},1\""
       }
     ],
     "message": "Retrieved 2 version(s) for file 'ABC123XYZ'",
     "succeeded": true
   }
   ```

2. **Verify Response Structure:**
   - ✅ Status code: 200 OK
   - ✅ `data` array present
   - ✅ At least 2 version objects in array
   - ✅ Each version has required fields:
     - `id` (version number)
     - `lastModifiedDateTime` (timestamp)
     - `lastModifiedBy` (author)
     - `size` (file size in bytes)
     - `eTag` (version tag)
   - ✅ `message` field indicates count
   - ✅ `succeeded` = true

3. **Test Error Cases:**

   **Invalid FileId (404 Not Found):**
   ```bash
   curl -k -X GET "https://localhost:5001/api/sharepoint/files/INVALID_ID/versions" \
     -H "Content-Type: application/json"
   ```
   **Expected Response:**
   ```json
   {
     "data": null,
     "message": "File with ID 'INVALID_ID' not found",
     "succeeded": false
   }
   ```
   - ✅ Status code: 404 Not Found
   - ✅ Error message clear and descriptive

   **Empty FileId (400 Bad Request):**
   ```bash
   curl -k -X GET "https://localhost:5001/api/sharepoint/files/ /versions" \
     -H "Content-Type: application/json"
   ```
   **Expected Response:**
   ```json
   {
     "data": null,
     "message": "File ID is required.",
     "succeeded": false
   }
   ```
   - ✅ Status code: 400 Bad Request
   - ✅ Validation error message

4. **Check Backend Logs:**

   Backend console should show:
   ```
   [INFO] Retrieving version history for file: ABC123XYZ
   [INFO] Retrieved 2 version(s) for file 'ABC123XYZ'
   ```

   - ✅ No error logs
   - ✅ Request logged with fileId
   - ✅ Success logged with version count

**Expected Outcome:**
- ✅ API endpoint responds with version data
- ✅ At least 2 versions returned
- ✅ All version fields populated correctly
- ✅ Error handling works for invalid inputs
- ✅ Logging captures all requests

---

### Phase 4: Frontend Version History Dialog Testing

**Objective:** Test the version history dialog in the CRM UI

**Steps:**

1. **Navigate to Customer Detail Page:**
   ```
   URL: http://localhost:3000/customer/789
   ```

2. **Locate Uploaded Document:**
   - Find the "Documents" section
   - Locate the `test.docx` document in the table
   - ✅ **Verify:** Document is listed

3. **Open Version History Dialog:**
   - In the document row, locate the "Actions" column
   - Click the "Version History" button (History icon)
   - ✅ **Verify:** Dialog opens

4. **Verify Dialog Content:**

   **Dialog Header:**
   - ✅ Title: "Version History"
   - ✅ History icon displayed
   - ✅ Close button (X) in top-right corner

   **Document Name:**
   - ✅ Document name displayed: "test.docx"

   **Version List:**
   - ✅ At least 2 versions displayed
   - ✅ Latest version shown first

   **Version 1 (Current):**
   - ✅ Label: "Current" chip (primary color, filled)
   - ✅ Timestamp displayed (e.g., "Dec 28, 2025, 08:35 AM")
   - ✅ File size displayed (e.g., "14.9 KB")
   - ✅ Author displayed with person icon
   - ✅ ETag displayed (e.g., "ETag: {ABC123XYZ},2")

   **Version 2 (Previous):**
   - ✅ Label: "v1" chip (default color, outlined)
   - ✅ Timestamp displayed (earlier than Current)
   - ✅ File size displayed
   - ✅ Author displayed
   - ✅ ETag displayed

   **Visual Elements:**
   - ✅ Versions separated by dividers
   - ✅ Clean, readable layout
   - ✅ Consistent spacing and alignment

5. **Test Dialog Interactions:**
   - Click "Close" button at bottom
   - ✅ **Verify:** Dialog closes
   - Re-open version history
   - Click "X" button in header
   - ✅ **Verify:** Dialog closes
   - Re-open version history
   - Click outside dialog (on backdrop)
   - ✅ **Verify:** Dialog closes

6. **Test Multiple Documents:**
   - Upload another document (e.g., `test2.docx`)
   - Open version history for the new document
   - ✅ **Verify:** Shows only 1 version (initial upload)
   - ✅ **Verify:** Correct document name displayed
   - Open version history for original `test.docx`
   - ✅ **Verify:** Still shows 2 versions (data not mixed)

**Expected Outcome:**
- ✅ Version history dialog opens successfully
- ✅ All versions displayed in chronological order (newest first)
- ✅ All version metadata displayed correctly
- ✅ Visual design follows Material-UI patterns
- ✅ Dialog interactions work smoothly
- ✅ No JavaScript errors in browser console

**Browser Console Verification:**
```javascript
// Open browser DevTools Console (F12 → Console tab)
// Should see NO errors related to:
// - VersionHistoryDialog
// - GetVersionHistoryUseCase
// - sharepointApi
// - Uncaught exceptions

// Network tab should show:
// - GET /api/sharepoint/files/{fileId}/versions
// - Status: 200 OK
// - Response time: < 2 seconds
```

---

### Phase 5: Cross-Browser and Responsiveness Testing

**Objective:** Verify version history dialog works across different browsers and screen sizes

**Steps:**

1. **Test in Chrome/Edge:**
   - Open http://localhost:3000/customer/789
   - Open version history dialog
   - ✅ **Verify:** Dialog renders correctly
   - ✅ **Verify:** No console errors

2. **Test in Firefox:**
   - Open http://localhost:3000/customer/789
   - Open version history dialog
   - ✅ **Verify:** Dialog renders correctly
   - ✅ **Verify:** No console errors

3. **Test Responsiveness:**

   **Desktop (1920x1080):**
   - ✅ Dialog width: maxWidth="sm" (~600px)
   - ✅ Content readable, not stretched

   **Tablet (768x1024):**
   - Open browser DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Select iPad preset
   - ✅ Dialog scales appropriately
   - ✅ Content remains readable

   **Mobile (375x667 - iPhone SE):**
   - Select iPhone SE preset
   - ✅ Dialog takes full width
   - ✅ Content stacks vertically
   - ✅ Touch targets large enough

4. **Test with Many Versions:**

   If possible, create a document with 5+ versions:
   - Upload document
   - Edit 4 more times in SharePoint
   - Open version history
   - ✅ **Verify:** List scrolls if needed
   - ✅ **Verify:** All versions displayed
   - ✅ **Verify:** Performance acceptable (no lag)

**Expected Outcome:**
- ✅ Works in all major browsers
- ✅ Responsive design adapts to screen sizes
- ✅ Handles multiple versions gracefully
- ✅ No visual glitches or layout issues

---

### Phase 6: Error Handling and Edge Cases

**Objective:** Test error scenarios and edge cases

**Steps:**

1. **Test with Non-Existent File:**

   **Backend API Test:**
   ```bash
   curl -k -X GET "https://localhost:5001/api/sharepoint/files/FAKE_FILE_ID/versions"
   ```
   - ✅ **Verify:** 404 Not Found response
   - ✅ **Verify:** Error message: "File with ID 'FAKE_FILE_ID' not found"

   **Frontend Test:**
   - Manually trigger version history with invalid fileId (requires dev modification or mock)
   - ✅ **Verify:** Error Alert displayed in dialog
   - ✅ **Verify:** Error message user-friendly

2. **Test Network Failure Simulation:**

   **Option A: Disconnect Backend**
   - Stop backend API server
   - In frontend, open version history dialog
   - ✅ **Verify:** Loading indicator appears
   - ✅ **Verify:** Error Alert appears after timeout
   - ✅ **Verify:** Error message indicates network issue
   - Restart backend

   **Option B: Browser DevTools Offline Mode**
   - Open DevTools → Network tab
   - Check "Offline" checkbox
   - Open version history dialog
   - ✅ **Verify:** Error Alert displayed
   - Uncheck "Offline"

3. **Test Empty Version History:**

   **Scenario:** File with no version history (edge case)
   - Requires mocking or special SharePoint setup
   - Expected: Empty state displayed
   - ✅ Message: "No version history available"
   - ✅ History icon shown (greyed out)

4. **Test Loading State:**

   **Slow Network Simulation:**
   - Open DevTools → Network tab
   - Set throttling to "Slow 3G"
   - Open version history dialog
   - ✅ **Verify:** LinearProgress bar appears at top
   - ✅ **Verify:** "Loading..." indicator or similar
   - ✅ **Verify:** Content appears after load completes
   - Reset throttling to "No throttling"

5. **Test Missing Metadata:**

   **Scenario:** Version with null/missing fields
   - If possible, create a version with missing author
   - ✅ **Verify:** Dialog handles gracefully
   - ✅ **Verify:** No JavaScript errors
   - ✅ **Verify:** Missing fields show "Unknown" or are hidden

**Expected Outcome:**
- ✅ All error scenarios handled gracefully
- ✅ User-friendly error messages displayed
- ✅ No application crashes or console errors
- ✅ Loading states provide feedback
- ✅ Edge cases (empty data, missing fields) handled

---

### Phase 7: Integration with Document Lifecycle

**Objective:** Verify version tracking integrates with complete document workflow

**Steps:**

1. **Upload → Edit → Version Check:**
   - Upload new document `lifecycle-test.pdf`
   - Note fileId
   - Edit in SharePoint (add annotation or replace file)
   - Wait 30 seconds
   - Open version history in CRM
   - ✅ **Verify:** 2 versions shown
   - ✅ **Verify:** Timestamps match SharePoint

2. **Delete → Version Access:**
   - Delete document from CRM (if delete feature implemented)
   - Try to access version history
   - ✅ **Verify:** Appropriate error (404 or deleted message)

3. **Multi-User Scenario:**
   - User A uploads document
   - User B edits document in SharePoint
   - User A refreshes CRM and opens version history
   - ✅ **Verify:** User B shown as author of version 2
   - ✅ **Verify:** Both users' edits tracked

4. **Entity Context Verification:**
   - Upload document to Customer 789
   - Upload document to Lead 456 (if available)
   - Open version history for Customer document
   - ✅ **Verify:** Shows only Customer document versions
   - Open version history for Lead document
   - ✅ **Verify:** Shows only Lead document versions
   - ✅ **Verify:** No cross-contamination of version data

**Expected Outcome:**
- ✅ Version tracking works throughout document lifecycle
- ✅ Multi-user edits tracked correctly
- ✅ Entity context maintained (no data mixing)
- ✅ Deleted documents handled appropriately

---

## Success Criteria Checklist

### Backend Implementation (100%)

- [ ] **Endpoint Implemented:** GET /api/sharepoint/files/{fileId}/versions
- [ ] **Input Validation:** fileId required, not null/whitespace
- [ ] **Service Integration:** Calls ISharepointService.GetFileVersionHistory()
- [ ] **Response Format:** Returns Id, LastModifiedDateTime, LastModifiedBy, Size, ETag
- [ ] **Error Handling:** 404 for file not found, 400 for invalid input, 500 for errors
- [ ] **Logging:** All requests logged with fileId and result count
- [ ] **ApiResponse Wrapper:** Consistent response format with success/fail status

### Frontend Implementation (100%)

- [ ] **Dialog Component:** VersionHistoryDialog.jsx exists and renders
- [ ] **Use Case:** GetVersionHistoryUseCase implemented with repository pattern
- [ ] **API Client:** sharepointApi.js has getVersionHistory(fileId) method
- [ ] **UI Integration:** DocumentSection has "Version History" button
- [ ] **Loading State:** LinearProgress shown during API call
- [ ] **Error State:** Alert component displays errors
- [ ] **Empty State:** User-friendly message when no versions
- [ ] **Version Display:** Shows version label, timestamp, size, author, ETag
- [ ] **Visual Design:** Follows Material-UI patterns, responsive
- [ ] **Interactions:** Dialog opens/closes correctly, no memory leaks

### End-to-End Verification (Manual Testing)

- [ ] **Phase 1 Complete:** Document uploaded, fileId captured
- [ ] **Phase 2 Complete:** Document edited in SharePoint, version 2 created
- [ ] **Phase 3 Complete:** API endpoint returns version data correctly
- [ ] **Phase 4 Complete:** Frontend dialog displays versions accurately
- [ ] **Phase 5 Complete:** Cross-browser and responsive design verified
- [ ] **Phase 6 Complete:** Error handling and edge cases tested
- [ ] **Phase 7 Complete:** Integration with document lifecycle verified

### Database Verification

- [ ] **Upload Record:** crm_sharepoint_files has record for test.docx
- [ ] **Metadata Complete:** ItemId, DriveId, WebUrl, ETag populated
- [ ] **Version Number:** VersionNumber field updated (if applicable)

### SharePoint Verification

- [ ] **Document Exists:** test.docx visible in SharePoint library
- [ ] **Folder Structure:** DEV/CRM/Customers/789/ contains the file
- [ ] **Version History:** SharePoint shows at least 2 versions
- [ ] **Metadata Match:** Authors and timestamps match API response

### Quality Assurance

- [ ] **No Console Errors:** Browser DevTools console clean (no red errors)
- [ ] **No Backend Errors:** Backend logs show no exceptions
- [ ] **Performance:** Version history loads in < 2 seconds
- [ ] **Security:** No Graph API tokens exposed in frontend logs
- [ ] **Accessibility:** Dialog keyboard navigable, screen reader friendly
- [ ] **Code Quality:** No console.log statements, follows existing patterns

---

## Known Issues and Limitations

### Current Implementation Notes

1. **Graph API Integration:**
   - ISharepointService.GetFileVersionHistory() must be implemented in Shared.ExternalServices DLL
   - Current implementation expects this method to exist
   - If not implemented, will get runtime error

2. **Version Number Limitations:**
   - SharePoint version IDs may be "1.0", "2.0" or just integers
   - Frontend handles both formats gracefully
   - Version labels start from "Current" then "v1", "v2", etc.

3. **File Size Accuracy:**
   - Version file sizes should come from SharePoint API
   - If not provided, will display "Unknown"

4. **Author Display:**
   - Author format depends on SharePoint configuration
   - May be email, display name, or both
   - Frontend displays whatever SharePoint returns

5. **ETag Format:**
   - ETags are SharePoint-specific strings
   - Used for conflict detection and caching
   - Format: "{itemId},versionNumber" (example)

### Testing Limitations

1. **Manual SharePoint Editing Required:**
   - Automated version creation not available without SharePoint API write access
   - Testers must manually edit in SharePoint UI or Word Online

2. **Timing Dependencies:**
   - SharePoint may take 10-30 seconds to finalize versions
   - Network latency affects API response times

3. **Permissions Required:**
   - User must have write access to SharePoint to create versions
   - Read access required to view version history

### Future Enhancements

1. **Version Restoration:**
   - Currently read-only (view version history)
   - Future: Add "Restore this version" button
   - Requires Graph API restore endpoint

2. **Version Comparison:**
   - Future: Compare two versions side-by-side
   - Show diff of changes

3. **Version Comments:**
   - SharePoint supports version comments
   - Future: Display comments in version list

4. **Download Specific Version:**
   - Future: Add download button for each version
   - Current: Only latest version downloadable

---

## Troubleshooting Guide

### Issue: Dialog Opens But Shows "No version history available"

**Possible Causes:**
1. FileId is incorrect or missing
2. SharePoint API returns empty array
3. File has only 1 version (initial upload)

**Solutions:**
1. Check browser console for API response
2. Verify fileId matches ItemId in database
3. Check SharePoint manually for version count
4. Edit document again to create version 2

### Issue: API Returns 404 Not Found

**Possible Causes:**
1. File deleted from SharePoint
2. Incorrect fileId in request
3. SharePoint DriveId/ItemId mismatch

**Solutions:**
1. Verify file exists in SharePoint
2. Check database for correct ItemId
3. Re-upload document if necessary
4. Check backend logs for Graph API errors

### Issue: Dialog Shows Loading Spinner Forever

**Possible Causes:**
1. Backend API not responding
2. Network error (firewall, CORS)
3. Graph API authentication failure

**Solutions:**
1. Check backend service is running
2. Verify API endpoint accessible: curl https://localhost:5001/api/sharepoint/files/{fileId}/versions
3. Check browser DevTools Network tab for error status
4. Review backend logs for exceptions
5. Verify Graph API credentials in appsettings.json

### Issue: Version Timestamps Don't Match SharePoint

**Possible Causes:**
1. Timezone conversion issues
2. SharePoint returns UTC, frontend displays local time
3. Date formatting differences

**Solutions:**
1. This is expected behavior (UTC → local time conversion)
2. Verify timestamps are consistent with timezone offset
3. Check formatDate() function in VersionHistoryDialog.jsx

### Issue: Author Shows as Email Instead of Name

**Possible Causes:**
1. SharePoint returns email by default
2. Display name not configured in SharePoint

**Solutions:**
1. This is expected behavior
2. SharePoint Graph API returns whatever is configured
3. No action needed (both email and name are valid)

### Issue: Error "Graph API permissions denied"

**Possible Causes:**
1. Azure AD app registration missing required scopes
2. Admin consent not granted
3. User doesn't have access to SharePoint site

**Solutions:**
1. Check Azure AD app registration permissions:
   - Files.ReadWrite.All (Delegated + Application)
   - Sites.ReadWrite.All (Delegated + Application)
2. Grant admin consent in Azure Portal
3. Verify user has access to SharePoint site
4. Check backend logs for detailed Graph API error

---

## Performance Benchmarks

### Expected Performance

| Operation | Target | Maximum Acceptable |
|-----------|--------|-------------------|
| API Response Time | < 500ms | < 2 seconds |
| Frontend Render Time | < 100ms | < 500ms |
| Dialog Open Time | < 200ms | < 1 second |
| Version List (10 versions) | < 1 second | < 3 seconds |
| Version List (100 versions) | < 3 seconds | < 10 seconds |

### Performance Testing Steps

1. **Measure API Response Time:**
   ```bash
   time curl -k https://localhost:5001/api/sharepoint/files/{fileId}/versions
   ```
   - ✅ Expected: < 2 seconds

2. **Measure Frontend Render:**
   - Open browser DevTools → Performance tab
   - Start recording
   - Open version history dialog
   - Stop recording
   - Analyze timeline
   - ✅ Expected: Total time < 1 second

3. **Test with Many Versions:**
   - Create document with 20+ versions (if possible)
   - Open version history dialog
   - Measure load time
   - ✅ Expected: Reasonable performance, no UI freezing

---

## Rollback Plan

If verification fails and cannot be resolved:

### Step 1: Identify Failing Component

- **Backend API Issue:** Check Phase 3 results
- **Frontend Dialog Issue:** Check Phase 4 results
- **Integration Issue:** Check Phase 7 results

### Step 2: Disable Version History Feature (Temporary)

**Option A: Hide Version History Button (Frontend Only)**

Edit `./crm-system-client/src/presentation/components/sharepoint/DocumentSection.jsx`:

```javascript
// Comment out or remove the Version History IconButton
{/* Version History Button - Temporarily Disabled
<Tooltip title="Version History">
  <IconButton onClick={() => handleVersionHistory(doc)} size="small">
    <HistoryIcon />
  </IconButton>
</Tooltip>
*/}
```

**Option B: Return Empty Version List (Backend Fallback)**

Edit `./crm-system/src/CRM.Api/Controllers/SharepointController.cs`:

```csharp
// Temporary: Return empty list instead of calling SharePoint
public async Task<IActionResult> GetFileVersionHistory(
    string fileId,
    CancellationToken ct)
{
    // Temporary workaround: Return empty version list
    return Ok(ApiResponse<IEnumerable<object>>.Ok(
        new List<object>(),
        "Version history temporarily unavailable"));
}
```

### Step 3: Document Issue

Create issue in tracking system:
- **Title:** Version Tracking Verification Failed - Phase X
- **Description:** Detailed description of failure
- **Logs:** Attach backend logs, browser console errors
- **Steps to Reproduce:** From this verification document
- **Priority:** Medium (feature enhancement, not critical bug)

### Step 4: Revert Changes (If Necessary)

```bash
# Revert frontend changes
cd crm-system-client
git log --oneline | head -10
git revert {commit-hash-of-version-history-dialog}

# Revert backend changes
cd ../crm-system
git log --oneline | head -10
git revert {commit-hash-of-getfileversionhistory-endpoint}

# Push reverts
git push origin main
```

---

## Next Steps After Verification

### If Verification Passes:

1. **Update Subtask Status:**
   ```json
   {
     "subtask-6-4": {
       "status": "completed",
       "notes": "Version tracking and history verification passed. All 7 phases completed successfully. API endpoint returns correct version data, frontend dialog displays versions accurately, cross-browser testing passed, error handling verified."
     }
   }
   ```

2. **Update build-progress.txt:**
   - Document completion date/time
   - Note any issues encountered and resolutions
   - Record performance benchmarks

3. **Proceed to Next Subtask:**
   - **subtask-6-5:** Bulk migration tool verification
   - Follow E2E-VERIFICATION-BULK-MIGRATION.md (when created)

4. **QA Sign-off Preparation:**
   - Collect all verification evidence (screenshots, logs)
   - Prepare demo for QA team
   - Update test documentation

### If Verification Fails:

1. **Document Failure Details:**
   - Which phase failed
   - Error messages and logs
   - Screenshots of issues

2. **Create Bug Report:**
   - Assign to development team
   - Include reproduction steps
   - Attach verification evidence

3. **Implement Rollback Plan:**
   - Follow steps in Rollback Plan section above
   - Notify stakeholders of temporary feature disablement

4. **Schedule Fix and Re-verification:**
   - Estimate fix timeline
   - Plan re-verification session
   - Update project timeline

---

## Contacts and Resources

### Support Contacts

- **Backend Developer:** [Name/Email]
- **Frontend Developer:** [Name/Email]
- **QA Lead:** [Name/Email]
- **SharePoint Administrator:** [Name/Email]

### Documentation Links

- **Microsoft Graph API - Versions:** https://learn.microsoft.com/en-us/graph/api/driveitem-list-versions
- **SharePoint Version History:** https://support.microsoft.com/en-us/office/view-the-version-history-of-an-item-or-file-in-a-list-or-library
- **Material-UI Dialog:** https://mui.com/material-ui/react-dialog/
- **Spec Document:** ./.auto-claude/specs/002-sharepoint-document-management-integration/spec.md

### Related Verification Documents

- **Upload Flow:** E2E-VERIFICATION-UPLOAD-FLOW.md
- **Permission Sync:** E2E-VERIFICATION-PERMISSION-SYNC.md
- **Search Functionality:** E2E-VERIFICATION-SEARCH.md
- **Bulk Migration:** E2E-VERIFICATION-BULK-MIGRATION.md (pending)

---

## Appendix A: API Response Examples

### Successful Version History Response

```json
{
  "data": [
    {
      "id": "3.0",
      "lastModifiedDateTime": "2025-12-28T10:15:00Z",
      "lastModifiedBy": "john.doe@company.com",
      "size": 16842,
      "eTag": "\"{ABC123XYZ},3\""
    },
    {
      "id": "2.0",
      "lastModifiedDateTime": "2025-12-28T09:30:00Z",
      "lastModifiedBy": "jane.smith@company.com",
      "size": 15234,
      "eTag": "\"{ABC123XYZ},2\""
    },
    {
      "id": "1.0",
      "lastModifiedDateTime": "2025-12-28T08:00:00Z",
      "lastModifiedBy": "admin@company.com",
      "size": 14890,
      "eTag": "\"{ABC123XYZ},1\""
    }
  ],
  "message": "Retrieved 3 version(s) for file 'ABC123XYZ'",
  "succeeded": true
}
```

### Error Responses

**404 Not Found:**
```json
{
  "data": null,
  "message": "File with ID 'INVALID_ID' not found",
  "succeeded": false
}
```

**400 Bad Request:**
```json
{
  "data": null,
  "message": "File ID is required.",
  "succeeded": false
}
```

**500 Internal Server Error:**
```json
{
  "data": null,
  "message": "An error occurred while retrieving version history.",
  "errorDetails": "Graph API authentication failed",
  "succeeded": false
}
```

---

## Appendix B: Database Queries

### Check Document Metadata

```sql
-- Find uploaded document
SELECT
    Id,
    ItemId,
    DriveId,
    Name,
    EntityType,
    EntityId,
    WebUrl,
    Size,
    MimeType,
    ETag,
    CTag,
    VersionNumber,
    CreatedDateTime,
    LastModifiedDateTime,
    LastModifiedBy
FROM crm_sharepoint_files
WHERE EntityType = 'Customer'
  AND EntityId = '789'
  AND Name LIKE '%test.docx%'
ORDER BY CreatedDateTime DESC;
```

### Check All Customer Documents

```sql
-- List all documents for customer 789
SELECT
    ItemId,
    Name,
    Size,
    VersionNumber,
    CreatedDateTime,
    WebUrl
FROM crm_sharepoint_files
WHERE EntityType = 'Customer'
  AND EntityId = '789'
ORDER BY CreatedDateTime DESC;
```

### Check Version Updates

```sql
-- Check if VersionNumber field is being updated
SELECT
    ItemId,
    Name,
    ETag,
    CTag,
    VersionNumber,
    LastModifiedDateTime
FROM crm_sharepoint_files
WHERE ItemId = 'ABC123XYZ'
ORDER BY LastModifiedDateTime DESC;
```

---

## Appendix C: SharePoint Manual Verification

### Access SharePoint Directly

1. **Navigate to SharePoint Site:**
   - URL from appsettings.json: `Site` value
   - Example: `https://company.sharepoint.com/sites/CRM`

2. **Navigate to Document Library:**
   - Click "Documents" or configured library name
   - Path: `DEV/CRM/Customers/789/`

3. **Check Version History in SharePoint:**
   - Right-click document → "Version history"
   - Verify versions match API response
   - Note: SharePoint UI shows versions in reverse order (oldest first by default)

### SharePoint Version History UI

**Expected UI Elements:**
- Version number (1.0, 2.0, 3.0)
- Modified date/time
- Modified by (user name or email)
- File size
- Comments (if any)
- "Restore" button (for previous versions)
- "Delete" button (for version cleanup)

---

**End of Verification Document**

**Document Version:** 1.0
**Last Updated:** 2025-12-28
**Author:** Auto-Claude
**Subtask:** subtask-6-4

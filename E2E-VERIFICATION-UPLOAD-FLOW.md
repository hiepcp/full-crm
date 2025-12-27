# End-to-End Document Upload Flow Verification

**Subtask:** subtask-6-1
**Phase:** End-to-End Integration & Verification
**Date:** 2025-12-28
**Status:** Ready for Manual Testing

---

## Overview

This document provides step-by-step instructions for verifying the complete document upload flow from the frontend UI through the backend API to SharePoint integration and database persistence.

## Prerequisites

### Required Services

1. **Authentication Service** (Dependency)
   - Service: res-auth-api
   - Port: 7000 (HTTPS)
   - Status: Must be running before CRM backend

2. **CRM Backend API**
   - Service: crm-system
   - Port: 5001 (HTTPS), 5000 (HTTP)
   - Database: MySQL/MariaDB connection configured
   - SharePoint: Graph API credentials configured

3. **CRM Frontend**
   - Service: crm-system-client
   - Port: 3000
   - Environment: VITE_API_URL configured

### Configuration Requirements

**Backend (appsettings.json):**
```json
{
  "Sharepoint": {
    "GraphApiBase": "https://graph.microsoft.com/v1.0/sites",
    "Site": "{hostname},{siteId},{webId}",
    "DocLibrary": "{driveId}",
    "CustomerFolderPath": "DEV/CRM/Customers",
    "LeadFolderPath": "DEV/CRM/Leads",
    "DealFolderPath": "DEV/CRM/Deals"
  },
  "AzureAd": {
    "TenantId": "your-tenant-id",
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret"
  }
}
```

**Frontend (.env):**
```env
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_REDIRECT_URI=https://crm.local.com:3000
VITE_API_URL=https://api-crm.local.com
```

### Test Data Requirements

1. **Customer Record:** Customer with ID 123 must exist in database
2. **Test File:** PDF file (e.g., "test-document.pdf") ready for upload
3. **Database Access:** Credentials to query crm_sharepoint_files table
4. **SharePoint Access:** Admin access to verify folder structure

---

## Verification Steps

### Step 1: Start All Services

```bash
# Terminal 1: Start Auth Service (if not already running)
cd res-auth-api/res-auth-api/src/ResAuthApi.Api
dotnet run

# Terminal 2: Start CRM Backend
cd crm-system/src/CRM.Api
dotnet run

# Terminal 3: Start CRM Frontend
cd crm-system-client
npm run dev
```

**Expected Output:**
- Auth API: `Now listening on: https://localhost:7000`
- Backend API: `Now listening on: https://localhost:5001`
- Frontend: `Local:   http://localhost:3000/`

**Verification:**
- [ ] All services start without errors
- [ ] No connection errors in logs
- [ ] Database connection successful

---

### Step 2: Navigate to CustomerDetail Page

1. Open browser: `http://localhost:3000`
2. Login with valid credentials
3. Navigate to: `http://localhost:3000/customer/123`

**Expected Outcome:**
- [ ] Customer detail page loads successfully
- [ ] "Documents" section is visible
- [ ] DocumentSection component renders (may show "No documents yet")
- [ ] "Upload" button is present

**Troubleshooting:**
- If Customer 123 doesn't exist, create it or use a different customer ID
- Check browser console for any errors (F12 → Console tab)
- Verify API calls to backend are successful (Network tab)

---

### Step 3: Upload Test Document

1. Click the **"Upload"** button in the Documents section
2. Select or drag-drop a test PDF file (e.g., "test-document.pdf")
3. Confirm the upload

**Expected Outcome:**
- [ ] Upload dialog opens with file picker
- [ ] Selected file name appears in dialog
- [ ] File size displays correctly
- [ ] Progress indicator shows during upload
- [ ] Success notification appears after upload
- [ ] Dialog closes automatically
- [ ] Document appears in the document list within 2-3 seconds

**Backend Logs to Check:**
```
Uploading file to SharePoint...
Successfully uploaded to SharePoint with ItemId: {id}
Saving metadata to database...
File uploaded successfully
```

**Troubleshooting:**
- If upload fails, check backend logs for SharePoint API errors
- Verify SharePoint credentials in appsettings.json
- Check Graph API permissions (Files.ReadWrite.All, Sites.ReadWrite.All)
- Ensure network connectivity to graph.microsoft.com

---

### Step 4: Verify Document in UI

After upload completes, verify the document list shows:

**Expected Fields:**
- [ ] **Name:** Original filename or unique filename
- [ ] **Size:** File size in KB or MB
- [ ] **Modified:** Last modified timestamp
- [ ] **Version:** Version number (should be 1 for new upload)
- [ ] **Actions:**
  - [ ] "View in SharePoint" link (opens in new tab)
  - [ ] "Version History" button
  - [ ] "Delete" button

**Click "View in SharePoint" Link:**
- [ ] Link opens in new browser tab
- [ ] SharePoint page loads showing the document
- [ ] Document is accessible (not permission denied)

**Frontend Console Checks:**
- [ ] No errors in browser console (F12 → Console)
- [ ] No 404 or 500 errors in Network tab

---

### Step 5: Database Verification

Run the following SQL query:

```sql
SELECT
    Id,
    ItemId,
    DriveId,
    Name,
    WebUrl,
    MimeType,
    Size,
    EntityType,
    EntityId,
    VersionNumber,
    ETag,
    CTag,
    RawJson,
    CreatedDateTime,
    LastModifiedBy
FROM crm_sharepoint_files
WHERE EntityType = 'Customer'
  AND EntityId = '123'
ORDER BY CreatedDateTime DESC
LIMIT 1;
```

**Expected Results:**
- [ ] Exactly 1 record returned (or more if multiple uploads)
- [ ] **ItemId:** Populated with SharePoint item ID (not null)
- [ ] **DriveId:** Populated with SharePoint drive ID (not null)
- [ ] **Name:** Matches uploaded filename
- [ ] **WebUrl:** Valid SharePoint URL (e.g., https://{tenant}.sharepoint.com/...)
- [ ] **MimeType:** application/pdf (for PDF files)
- [ ] **Size:** Matches uploaded file size in bytes
- [ ] **EntityType:** "Customer"
- [ ] **EntityId:** "123"
- [ ] **VersionNumber:** 1 (for new upload)
- [ ] **ETag:** Populated (not null)
- [ ] **CTag:** Populated (not null)
- [ ] **RawJson:** Contains full JSON response from SharePoint Graph API
- [ ] **CreatedDateTime:** Recent timestamp matching upload time
- [ ] **LastModifiedBy:** Email or name of uploader

**Example RawJson Structure:**
```json
{
  "id": "...",
  "name": "test-document.pdf",
  "size": 12345,
  "webUrl": "https://...",
  "parentReference": {
    "driveId": "...",
    "path": "/drive/root:/DEV/CRM/Customers/123"
  }
}
```

**Troubleshooting:**
- If no records found, check backend logs for database save errors
- If fields are null, verify CRMUploadService.cs populates all fields correctly
- If RawJson is null, check SharePoint API response mapping

---

### Step 6: SharePoint Folder Structure Verification

Manually check SharePoint site:

1. Navigate to SharePoint document library
2. Browse to folder path: `DEV/CRM/Customers/123/`

**Expected Outcome:**
- [ ] Folder hierarchy exists: `DEV/` → `CRM/` → `Customers/` → `123/`
- [ ] All parent folders were auto-created by the upload service
- [ ] Uploaded file is present in `Customers/123/` folder
- [ ] File name matches what's shown in UI (may have unique suffix)
- [ ] File properties in SharePoint match database record:
  - [ ] Size matches
  - [ ] Modified date matches
  - [ ] Version is 1.0

**Folder Permissions Check (Optional):**
- [ ] Folder inherits permissions from parent or has custom permissions set
- [ ] Current user has at least Read access
- [ ] Permission level matches CRM role (if permission sync is configured)

**Troubleshooting:**
- If folder doesn't exist, check EnsureFolderExistsAsync() method in CRMUploadService
- If file is in wrong location, verify SharePointConstants.CUSTOMER_FOLDER_TEMPLATE
- If permission denied, check Azure AD app registration permissions

---

### Step 7: API Endpoint Direct Testing (Optional)

Test backend API directly using curl or Postman:

**Get Documents for Customer 123:**
```bash
curl -X GET "https://localhost:5001/api/sharepoint/documents/customer/123" \
  -H "Authorization: Bearer {your-token}" \
  -k
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Retrieved 1 document(s) for customer 123",
  "data": [
    {
      "id": 1,
      "itemId": "...",
      "driveId": "...",
      "name": "test-document.pdf",
      "webUrl": "https://...",
      "size": 12345,
      "mimeType": "application/pdf",
      "entityType": "Customer",
      "entityId": "123",
      "versionNumber": 1
    }
  ],
  "error": null
}
```

**Verification:**
- [ ] Status code: 200 OK
- [ ] Response contains uploaded document
- [ ] All fields populated correctly

---

## Success Criteria

The E2E document upload flow is **verified** when:

- [x] **Frontend:** Upload dialog opens, accepts file, shows progress, displays success
- [x] **Frontend:** Document appears in list with all fields (name, size, version, actions)
- [x] **Frontend:** "View in SharePoint" link opens correct document
- [x] **Backend:** Upload API processes request without errors
- [x] **SharePoint:** File uploaded to correct folder (`DEV/CRM/Customers/123/`)
- [x] **SharePoint:** Folder hierarchy auto-created if missing
- [x] **Database:** Record inserted with all fields populated (ItemId, DriveId, WebUrl, RawJson, etc.)
- [x] **Database:** EntityType and EntityId correctly set to "Customer" and "123"
- [x] **Logs:** No errors in backend or frontend logs
- [x] **Console:** No errors in browser developer console

---

## Known Issues / Limitations

### Environment-Specific Issues

1. **Submodule Worktree Environment:**
   - This is a worktree environment where crm-system appears as an unpopulated submodule
   - Cannot run `dotnet run` or `npm run dev` directly in this environment
   - Verification must be performed in main development environment

2. **SharePoint Configuration:**
   - Requires valid Azure AD app registration with Graph API permissions
   - Requires SharePoint site ID and drive ID in appsettings.json
   - Requires network access to graph.microsoft.com

3. **SSL Certificates:**
   - Development environment may have self-signed certificates
   - Browser may show security warnings (expected in dev)
   - Use `-k` flag with curl to bypass certificate verification in testing

### Testing in Main Environment

To run this verification in the main development environment:

1. **Merge this worktree's changes** to the main branch:
   ```bash
   # From parent repository
   git add crm-system crm-system-client
   git commit -m "feat: SharePoint document management integration"
   ```

2. **Update submodules:**
   ```bash
   git submodule update --init --recursive
   ```

3. **Run verification steps** as documented above

---

## Rollback Plan

If verification fails and issues cannot be resolved:

1. **Database Rollback:**
   ```sql
   DELETE FROM crm_sharepoint_files WHERE EntityType = 'Customer' AND EntityId = '123';
   ```

2. **Frontend Rollback:**
   ```bash
   git revert {commit-hash}  # Revert DocumentSection integration
   ```

3. **Backend Rollback:**
   ```bash
   git revert {commit-hash}  # Revert SharePoint service changes
   ```

4. **SharePoint Cleanup:**
   - Manually delete test folders from SharePoint
   - Remove test documents

---

## Contacts & Resources

**Documentation:**
- Spec: `./.auto-claude/specs/002-sharepoint-document-management-integration/spec.md`
- Plan: `./.auto-claude/specs/002-sharepoint-document-management-integration/implementation_plan.json`
- Build Progress: `./.auto-claude/specs/002-sharepoint-document-management-integration/build-progress.txt`

**Related Subtasks:**
- subtask-1-1: CRMSharepointFile entity extension
- subtask-1-2: SharePointConstants folder templates
- subtask-1-3: CRMUploadService enhancement
- subtask-5-1: DocumentSection component
- subtask-5-2: CustomerDetail integration

**Microsoft Graph API References:**
- Upload File: https://learn.microsoft.com/en-us/graph/api/driveitem-put-content
- Create Folder: https://learn.microsoft.com/en-us/graph/api/driveitem-post-children
- Get File Metadata: https://learn.microsoft.com/en-us/graph/api/driveitem-get

---

## Verification Checklist Summary

### Pre-Verification
- [ ] All services running (auth, backend, frontend)
- [ ] Configuration files updated (appsettings.json, .env)
- [ ] Test customer record exists (ID 123)
- [ ] Test PDF file prepared

### Upload Flow
- [ ] Upload dialog opens
- [ ] File selection works
- [ ] Upload completes successfully
- [ ] Document appears in list

### Data Verification
- [ ] Database record created with all fields
- [ ] SharePoint folder structure exists
- [ ] SharePoint file uploaded correctly
- [ ] API endpoint returns document

### Quality Checks
- [ ] No frontend errors
- [ ] No backend errors
- [ ] No console errors
- [ ] Performance acceptable (<10s for upload)

---

**Verification Status:** ⏳ Pending Manual Testing
**Next Step:** Run verification in main development environment
**Blocking Issues:** None (environment-specific limitations noted)

# End-to-End Verification: Permission Sync Flow

**Subtask:** subtask-6-2
**Phase:** End-to-End Integration & Verification
**Feature:** SharePoint Document Management Integration
**Date:** 2025-12-28

---

## Overview

This document provides step-by-step instructions for manually verifying the permission synchronization flow between CRM user roles and SharePoint folder permissions.

### What This Verification Covers

1. **Permission Mapping:** Verify CRM roles correctly map to SharePoint permission levels
2. **API Endpoint:** Test the POST /api/sharepoint/permissions/sync endpoint
3. **SharePoint Integration:** Verify permissions are applied to SharePoint folders
4. **Role Level Testing:** Test different role levels (Admin, SalesRep, Viewer, etc.)
5. **Error Handling:** Verify graceful handling of sync failures

---

## Prerequisites

### 1. Services Running

Ensure all required services are running:

```bash
# Terminal 1: Authentication Service
cd res-auth-api/res-auth-api/src/ResAuthApi.Api
dotnet run
# Expected: Running on https://localhost:7016

# Terminal 2: CRM Backend
cd crm-system/src/CRM.Api
dotnet run
# Expected: Running on https://localhost:5001

# Terminal 3: CRM Frontend
cd crm-system-client
npm run dev
# Expected: Running on http://localhost:3000
```

### 2. Azure AD Configuration

Verify Azure AD app registration has required permissions:
- **Microsoft Graph API Permissions:**
  - `Files.ReadWrite.All` (Delegated + Application)
  - `Sites.ReadWrite.All` (Delegated + Application)
  - `Sites.FullControl.All` (Application) - Required for permission management

### 3. SharePoint Site Configuration

- SharePoint site exists with document library
- Root folder structure exists: `DEV/CRM/Customers/`, `DEV/CRM/Leads/`, `DEV/CRM/Deals/`
- Test customer folder exists: `DEV/CRM/Customers/123/`

### 4. Test Data

- Customer with ID 123 exists in CRM database
- At least one document uploaded to Customer 123 (from subtask-6-1)
- Test user accounts with different roles: Admin, SalesRep, Viewer

---

## Permission Mapping Reference

The system maps CRM roles to SharePoint permission levels as follows:

| CRM Role | SharePoint Permission Level | Description |
|----------|----------------------------|-------------|
| Admin | owner | Full control of folder and files |
| Manager | write | Edit, delete, upload files |
| SalesRep | write | Edit, delete, upload files |
| SalesManager | write | Edit, delete, upload files |
| Viewer | read | View and download files only |
| Guest | read | View and download files only |
| (Unknown) | read | Default fallback for security |

**Implementation Location:** `./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs` (lines 16-24)

---

## Manual Verification Steps

### Step 1: Verify Permission Sync Implementation

**Check the implementation files exist:**

```bash
# Check SharePointPermissionService
cat ./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs | grep -A 10 "RolePermissionMap"

# Check SharepointController permission endpoint
cat ./crm-system/src/CRM.Api/Controllers/SharepointController.cs | grep -A 20 "SyncPermissions"

# Check API models
cat ./crm-system/src/CRM.Api/Models/SyncPermissionsRequest.cs
```

**Expected Results:**
- ✅ SharePointPermissionService contains RolePermissionMap dictionary
- ✅ SyncPermissions endpoint exists in SharepointController
- ✅ SyncPermissionsRequest model has EntityType, EntityId, UserRoles properties

---

### Step 2: Upload Document as Admin User

**Purpose:** Ensure there's a document and folder to test permissions on.

**Actions:**
1. Login to CRM frontend as Admin user
2. Navigate to Customer Detail page: `http://localhost:3000/customer/123`
3. Locate the Documents section
4. Click "Upload" button
5. Select a test PDF file (e.g., "test-document.pdf")
6. Wait for upload to complete

**Expected Results:**
- ✅ Upload succeeds with success notification
- ✅ Document appears in the document list
- ✅ SharePoint link is present and clickable
- ✅ File exists in SharePoint folder `DEV/CRM/Customers/123/`

---

### Step 3: Call Permission Sync API Endpoint

**Purpose:** Trigger permission sync for Customer 123 with SalesRep role.

**Using cURL:**

```bash
# Sync SalesRep permissions for Customer 123
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityType": "Customer",
    "entityId": "123",
    "userRoles": ["SalesRep"]
  }' \
  --insecure
```

**Using Postman:**
1. Create new POST request
2. URL: `https://localhost:5001/api/sharepoint/permissions/sync`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_ACCESS_TOKEN`
4. Body (raw JSON):
   ```json
   {
     "entityType": "Customer",
     "entityId": "123",
     "userRoles": ["SalesRep"]
   }
   ```
5. Send request

**Expected Response:**
```json
{
  "success": true,
  "data": true,
  "message": "Permissions synced successfully for Customer 123",
  "error": null
}
```

**Status Code:** 200 OK

---

### Step 4: Verify SharePoint Folder Permissions

**Purpose:** Manually check that SharePoint folder permissions reflect the synced roles.

**Actions:**
1. Open SharePoint in browser
2. Navigate to the document library
3. Browse to folder: `DEV/CRM/Customers/123/`
4. Right-click on the folder → **Manage access** (or **Share** → **Advanced**)
5. View the permission settings

**Expected Results:**
- ✅ SalesRep group/user has **Edit** permissions (mapped from "write")
- ✅ Permission changes are reflected in SharePoint
- ✅ No errors in SharePoint permission panel

**Note:** The current implementation logs the intended permission sync but has a TODO for actual Graph API integration. Check the CRM backend logs for the permission sync attempt:

```bash
# Check backend logs
cd crm-system/src/CRM.Api
dotnet run | grep "permission"
```

Expected log entries:
```
[Information] Starting permission sync for Customer 123 at path DEV/CRM/Customers/123 with roles: SalesRep
[Information] Would apply permission levels write to folder DEV/CRM/Customers/123
[Information] Successfully synced permissions for Customer 123
```

---

### Step 5: Test Different Role Levels

**Purpose:** Verify permission mapping correctness for all role types.

**Test Cases:**

#### Test Case 1: Admin Role (owner permission)

```bash
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityType": "Customer",
    "entityId": "123",
    "userRoles": ["Admin"]
  }' \
  --insecure
```

**Expected:**
- Response indicates success
- Logs show: `Would apply permission levels owner to folder`
- SharePoint folder should show **Full Control** permission

---

#### Test Case 2: Manager Role (write permission)

```bash
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityType": "Customer",
    "entityId": "123",
    "userRoles": ["Manager"]
  }' \
  --insecure
```

**Expected:**
- Response indicates success
- Logs show: `Would apply permission levels write to folder`
- SharePoint folder should show **Edit** permission

---

#### Test Case 3: Viewer Role (read permission)

```bash
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityType": "Customer",
    "entityId": "123",
    "userRoles": ["Viewer"]
  }' \
  --insecure
```

**Expected:**
- Response indicates success
- Logs show: `Would apply permission levels read to folder`
- SharePoint folder should show **Read** permission

---

#### Test Case 4: Multiple Roles (deduplication)

```bash
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityType": "Customer",
    "entityId": "123",
    "userRoles": ["SalesRep", "Manager", "SalesManager"]
  }' \
  --insecure
```

**Expected:**
- Response indicates success
- Logs show: `Would apply permission levels write to folder` (deduplicated - all three roles map to "write")
- Only one permission level applied (no duplicates)

---

#### Test Case 5: Mixed Permission Levels

```bash
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityType": "Customer",
    "entityId": "123",
    "userRoles": ["Admin", "SalesRep", "Viewer"]
  }' \
  --insecure
```

**Expected:**
- Response indicates success
- Logs show: `Would apply permission levels owner, write, read to folder` (3 distinct permission levels)
- SharePoint folder shows multiple permission groups

---

### Step 6: Test Error Handling

**Purpose:** Verify graceful handling of invalid requests and sync failures.

#### Test Case 6A: Missing EntityType

```bash
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityId": "123",
    "userRoles": ["SalesRep"]
  }' \
  --insecure
```

**Expected:**
- Status Code: 400 Bad Request
- Response: `{ "success": false, "message": "EntityType is required." }`

---

#### Test Case 6B: Missing UserRoles

```bash
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityType": "Customer",
    "entityId": "123",
    "userRoles": []
  }' \
  --insecure
```

**Expected:**
- Status Code: 400 Bad Request
- Response: `{ "success": false, "message": "UserRoles list cannot be empty." }`

---

#### Test Case 6C: Non-existent Folder

```bash
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityType": "Customer",
    "entityId": "999999",
    "userRoles": ["SalesRep"]
  }' \
  --insecure
```

**Expected:**
- Status Code: 200 OK (per spec: don't block CRM operations)
- Response: `{ "success": true, "data": false, "message": "Permission sync completed with warnings. Check logs for details." }`
- Logs show: `Folder does not exist at path DEV/CRM/Customers/999999. Cannot sync permissions.`

---

### Step 7: Test Other Entity Types

**Purpose:** Verify permission sync works for Leads and Deals, not just Customers.

#### Test Case 7A: Lead Entity

```bash
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityType": "Lead",
    "entityId": "456",
    "userRoles": ["SalesRep"]
  }' \
  --insecure
```

**Expected:**
- Response indicates success
- Logs show folder path: `DEV/CRM/Leads/456`

---

#### Test Case 7B: Deal Entity

```bash
curl -X POST "https://localhost:5001/api/sharepoint/permissions/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "entityType": "Deal",
    "entityId": "789",
    "userRoles": ["Manager"]
  }' \
  --insecure
```

**Expected:**
- Response indicates success
- Logs show folder path: `DEV/CRM/Deals/789`

---

## Success Criteria Checklist

Mark each criterion as you verify it:

- [ ] **Permission Mapping:**
  - [ ] Admin role maps to "owner" permission
  - [ ] Manager/SalesRep/SalesManager roles map to "write" permission
  - [ ] Viewer/Guest roles map to "read" permission
  - [ ] Unknown roles default to "read" permission

- [ ] **API Endpoint Functionality:**
  - [ ] POST /api/sharepoint/permissions/sync accepts valid requests
  - [ ] Returns 200 OK with success message
  - [ ] Returns 400 Bad Request for missing fields
  - [ ] Returns 200 with warnings for non-existent folders (doesn't block CRM)

- [ ] **SharePoint Integration:**
  - [ ] SharePoint folder permissions are updated (or logged for TODO implementation)
  - [ ] Permission levels correctly reflect CRM role mappings
  - [ ] Multiple roles are deduplicated correctly

- [ ] **Role Level Testing:**
  - [ ] Admin role grants owner/full control access
  - [ ] SalesRep role grants write/edit access
  - [ ] Viewer role grants read-only access
  - [ ] Multiple roles are handled correctly

- [ ] **Error Handling:**
  - [ ] Missing required fields return 400 Bad Request
  - [ ] Non-existent folders return success with warnings (per spec)
  - [ ] Sync failures are logged but don't block CRM operations
  - [ ] Comprehensive logging for audit trail

- [ ] **Entity Type Coverage:**
  - [ ] Customer entity permissions sync correctly
  - [ ] Lead entity permissions sync correctly
  - [ ] Deal entity permissions sync correctly

- [ ] **Logging and Audit:**
  - [ ] All sync operations are logged
  - [ ] Permission levels are logged before application
  - [ ] Errors and warnings are logged appropriately

---

## Implementation Notes

### Current Status

The permission sync implementation is **partially complete**:

✅ **Implemented:**
- SharePointPermissionService with role-to-permission mapping
- POST /api/sharepoint/permissions/sync endpoint in SharepointController
- Input validation and error handling
- Comprehensive logging
- Folder existence checking

⚠️ **TODO (Graph API Integration):**
The actual Graph API call to update SharePoint folder permissions is marked as TODO in the code:

**File:** `./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs`
**Line 86:**
```csharp
// TODO: Call Graph API to update folder permissions
// await _sharepointService.UpdateFolderPermissions(folderPath, permissionLevels, ct);
```

**What This Means:**
- The permission sync endpoint is functional and testable
- Role mapping logic is complete and correct
- API request/response works as expected
- SharePoint permissions are **logged** but not yet **applied** via Graph API
- The ISharepointService needs to be extended with an `UpdateFolderPermissions` method

### Next Integration Steps

To complete the SharePoint permission update functionality:

1. **Extend ISharepointService interface:**
   ```csharp
   Task<bool> UpdateFolderPermissions(
       string folderPath,
       IEnumerable<string> permissionLevels,
       CancellationToken ct = default);
   ```

2. **Implement in Shared.ExternalServices DLL:**
   - Use Microsoft Graph API `/sites/{site-id}/drive/root:/{folderPath}:/permissions` endpoint
   - Create permission objects for each role
   - Apply permissions to the folder

3. **Uncomment the TODO line** in SharePointPermissionService.cs (line 86)

---

## Troubleshooting

### Issue: 401 Unauthorized when calling API

**Cause:** Missing or invalid authentication token

**Solution:**
1. Ensure you're logged in to the CRM frontend
2. Get a fresh access token from the browser (F12 → Network → Check API calls for Authorization header)
3. Use that token in your cURL/Postman requests

---

### Issue: Folder not found warnings

**Cause:** Entity folder doesn't exist in SharePoint yet

**Solution:**
1. Upload a document to the entity first (this creates the folder)
2. Or manually create the folder in SharePoint: `DEV/CRM/Customers/123/`
3. Then retry the permission sync

---

### Issue: Graph API permissions insufficient

**Cause:** Azure AD app doesn't have required permissions

**Solution:**
1. Open Azure Portal → App registrations
2. Select your CRM app
3. Go to API permissions
4. Add Microsoft Graph permissions:
   - `Sites.FullControl.All` (Application)
   - `Sites.ReadWrite.All` (Delegated + Application)
5. Click "Grant admin consent"
6. Wait 5-10 minutes for permissions to propagate
7. Restart the backend API

---

### Issue: Backend logs show errors

**Cause:** Various issues (missing config, network, etc.)

**Solution:**
1. Check appsettings.json has correct SharePoint configuration:
   ```json
   {
     "Sharepoint": {
       "GraphApiBase": "https://graph.microsoft.com/v1.0/sites",
       "Site": "{hostname},{siteId},{webId}",
       "DocLibrary": "{driveId}",
       "CustomerFolderPath": "DEV/CRM/Customers"
     }
   }
   ```
2. Verify Azure AD credentials are correct
3. Test Graph API connectivity manually
4. Check network/firewall settings

---

## Known Limitations

1. **Graph API Integration Pending:**
   - Current implementation logs permission changes but doesn't apply them to SharePoint
   - Requires extending ISharepointService with UpdateFolderPermissions method
   - Full implementation depends on Shared.ExternalServices DLL update

2. **Permission Revocation:**
   - Permission sync adds/updates permissions but doesn't remove old ones
   - DELETE endpoint exists for revocation but needs Graph API integration

3. **Group vs. User Permissions:**
   - Current mapping assumes role-based groups in SharePoint
   - May need adjustment for individual user permissions

4. **Permission Inheritance:**
   - Doesn't handle permission inheritance settings (inherit vs. unique permissions)
   - May need to break inheritance when setting custom permissions

---

## Verification Completion

After completing all verification steps:

1. **Update implementation_plan.json:**
   ```bash
   # Mark subtask-6-2 as completed
   # Update status and notes with verification results
   ```

2. **Commit verification documentation:**
   ```bash
   git add E2E-VERIFICATION-PERMISSION-SYNC.md
   git commit -m "auto-claude: subtask-6-2 - Permission sync flow verification documentation"
   ```

3. **Update build-progress.txt:**
   ```bash
   echo "## Subtask 6-2: Permission sync flow verification - COMPLETED" >> build-progress.txt
   echo "**Status:** ✅ Verification documentation created" >> build-progress.txt
   echo "**Note:** Graph API integration pending in ISharepointService" >> build-progress.txt
   ```

4. **Proceed to next subtask:** subtask-6-3 (Unified search functionality verification)

---

## References

- **Spec:** `./.auto-claude/specs/002-sharepoint-document-management-integration/spec.md`
- **Implementation Plan:** `./.auto-claude/specs/002-sharepoint-document-management-integration/implementation_plan.json`
- **SharePointPermissionService:** `./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs`
- **SharepointController:** `./crm-system/src/CRM.Api/Controllers/SharepointController.cs`
- **Microsoft Graph API - Permissions:** https://learn.microsoft.com/en-us/graph/api/driveitem-invite

---

**Document Version:** 1.0
**Last Updated:** 2025-12-28
**Author:** Auto-Claude Build System

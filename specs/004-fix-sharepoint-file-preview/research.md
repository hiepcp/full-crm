# Phase 0: Research - Fix SharePoint File Preview via IdRef

**Feature**: 004-fix-sharepoint-file-preview
**Date**: 2025-12-24

## Problem Analysis

**Current Behavior**: The file preview system fails for SharePoint-hosted files because:
1. Frontend receives SharePoint relative paths (e.g., `DEV/CRM/Activities/lead/17/857c71eb...jpg`)
2. FilePreviewModal attempts to load these paths as direct URLs
3. Browsers cannot resolve SharePoint internal paths → "Failed to load image" errors
4. The `IdRef` field exists in `crm_activity_attachment` table but is not utilized

**Root Cause**:
- `ActivityAttachmentResponse.FilePath` contains SharePoint relative path (string)
- Frontend expects `file.url` to be a resolvable HTTP/HTTPS URL
- No API endpoint exists to convert IdRef → signed/temporary URL

## Technical Decisions

### 1. Backend API Endpoint Design

**Decision**: Create `GET /api/files/{idRef}` endpoint

**Rationale**:
- IdRef is universal identifier across entities (activities, deals, customers)
- Reusable for future file attachments beyond activities
- Follows REST principles: `/files` as resource collection
- Decoupled from entity-specific controllers

**Response Structure**:
```json
{
  "url": "https://graph.microsoft.com/v1.0/drives/{driveId}/items/{itemId}/content",
  "expiresAt": "2025-12-24T14:30:00Z",
  "contentType": "image/jpeg",
  "fileName": "857c71eb-dd51-4e9f-9b49-29c02df1f04f_20251224024128_cb03fc.jpg",
  "size": 2048576
}
```

**Implementation Location**:
- Controller: `crm-system/src/CRM.Api/Controllers/FilesController.cs` (NEW)
- Service: `crm-system/src/CRM.Application/Services/FileRetrievalService.cs` (NEW)
- Interface: `crm-system/src/CRM.Application/Interfaces/Services/IFileRetrievalService.cs` (NEW)
- DTO: `crm-system/src/CRM.Application/Dtos/Response/FileUrlResponse.cs` (NEW)

### 2. SharePoint Integration

**Existing Infrastructure**:
- `Shared.ExternalServices.Interfaces.ISharepointService.ReadFileWithMetaAsync(string fileId)`
- Method calls Microsoft Graph API and retrieves `@microsoft.graph.downloadUrl` (expires ~1 hour)

**Implementation Strategy**:
1. Call Graph API: `GET /sites/{siteId}/drives/{driveId}/items/{idRef}`
2. Extract `@microsoft.graph.downloadUrl` from response metadata
3. Return signed URL with expiration timestamp to frontend
4. No additional signing library needed - Graph API handles it

**Why Signed URLs over Base64**:
- Files up to 50MB (spec limit)
- Base64 increases payload 33%
- Signed URLs are browser-cacheable
- Scalable for video/large documents

### 3. Frontend Detection Logic

**SharePoint Path Detection**:
```javascript
const SHAREPOINT_PATH_REGEX = /^(DEV|PROD|UAT|SANDBOX)\/CRM\//i;

function isSharePointPath(path) {
  return path && SHAREPOINT_PATH_REGEX.test(path);
}

function getFileUrl(attachment) {
  // Priority 1: IdRef + SharePoint path
  if (attachment.idRef && isSharePointPath(attachment.filePath)) {
    return await filesApi.getFileUrl(attachment.idRef);
  }

  // Priority 2: Direct HTTP/HTTPS URL
  if (attachment.url && /^https?:\/\//i.test(attachment.url)) {
    return attachment.url;
  }

  // Fail: No valid URL
  throw new Error("No valid file URL available");
}
```

**Implementation Location**:
- Utility: `crm-system-client/src/utils/filePathUtils.js` (NEW)
- API Client: `crm-system-client/src/infrastructure/api/filesApi.js` (NEW)
- Component: Modify `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx`

### 4. CORS and Authentication

**CORS**: No issues - Microsoft Graph download URLs served from `https://graph.microsoft.com` with proper CORS headers

**Authentication Flow**:
1. Frontend → CRM API `/api/files/{idRef}` with JWT token (existing auth)
2. CRM API → Microsoft Graph with service principal token (existing in `ISharepointService`)
3. Frontend receives signed URL (no auth needed to fetch from signed URL)

**Security**:
- Validate IdRef format before Graph API call
- Verify user has permission to access parent activity
- Audit log: `[User: {email}] Requested file {idRef} - {Success|Failure}: {reason}`

### 5. Backward Compatibility

**Existing Data Scenarios**:
- Direct URLs (external links) - use as-is
- IdRef + SharePoint path - fetch signed URL
- Only FilePath with SharePoint path - show error if no IdRef
- Both IdRef and direct URL - prioritize IdRef for SharePoint paths

## Architecture Compliance (Clean Architecture)

**Layer Separation**:
```
FilesController (Api Layer)
  → IFileRetrievalService (Application Interface)
    → FileRetrievalService (Application Layer)
      → ISharepointService (Infrastructure Interface from Shared.ExternalServices)
```

All dependencies point inward. No violations.

## Files to Create/Modify

**Backend**:
- NEW: `CRM.Api/Controllers/FilesController.cs`
- NEW: `CRM.Application/Services/FileRetrievalService.cs`
- NEW: `CRM.Application/Interfaces/Services/IFileRetrievalService.cs`
- NEW: `CRM.Application/Dtos/Response/FileUrlResponse.cs`
- MODIFY: `CRM.Application/DependencyInjection.cs` (register service)

**Frontend**:
- NEW: `src/infrastructure/api/filesApi.js`
- NEW: `src/utils/filePathUtils.js`
- MODIFY: `src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx`
- MODIFY: `src/presentation/components/common/FilePreviewer/ImagePreview.jsx`
- MODIFY: `src/presentation/components/common/FilePreviewer/DocumentPreview.jsx`
- MODIFY: `src/presentation/components/common/ActivityFeed/ActivityAttachmentList.jsx`

## Performance & Error Handling

**Performance**:
- Lazy load: Fetch signed URL only when preview modal opens
- No caching in MVP (spec: out of scope)
- Concurrent users = independent API calls

**Error Scenarios**:

| Error | Backend Response | Frontend Behavior |
|-------|------------------|-------------------|
| IdRef not found | 404 "File not found" | Show error with retry button |
| Invalid IdRef format | 400 "Invalid IdRef" | Show "Invalid file reference" |
| SharePoint timeout | 504 "Service timeout" | Show timeout error with retry |
| No permission | 403 "Access denied" | Show "Access denied" message |
| Graph API rate limit | 429 "Too many requests" | Show "Service busy, retry later" |

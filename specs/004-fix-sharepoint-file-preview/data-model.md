# Data Model: Fix SharePoint File Preview via IdRef

**Feature**: 004-fix-sharepoint-file-preview
**Date**: 2025-12-24

## Entities

### ActivityAttachment (Existing Entity)

**Location**: [crm-system/src/CRM.Domain/Entities/ActivityAttachment.cs](../../../crm-system/src/CRM.Domain/Entities/ActivityAttachment.cs)

```csharp
public class ActivityAttachment : BaseEntity
{
    public long Id { get; set; }
    public long ActivityId { get; set; }
    public string IdRef { get; set; } = string.Empty;  // SharePoint file ID
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty; // SharePoint relative path
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
}
```

**Field Descriptions**:
- `IdRef` - Unique identifier for retrieving file from SharePoint (e.g., "01ABCDEF...")
- `FilePath` - SharePoint relative path (e.g., "DEV/CRM/Activities/lead/17/file.jpg")
- `FileName` - Display name of the file
- `FileSize` - Size in bytes
- `MimeType` - Content type (e.g., "image/jpeg", "application/pdf")

**No Changes Required** - All necessary fields already exist.

### FileUrlResponse (NEW DTO)

**Location**: [crm-system/src/CRM.Application/Dtos/Response/FileUrlResponse.cs](../../../crm-system/src/CRM.Application/Dtos/Response/FileUrlResponse.cs) (to be created)

```csharp
namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Response DTO containing temporary signed URL for file access
    /// </summary>
    public class FileUrlResponse
    {
        /// <summary>
        /// Signed/temporary URL from Microsoft Graph API (expires in ~1 hour)
        /// </summary>
        public string Url { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp when the URL expires (UTC)
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// MIME type for rendering (e.g., "image/jpeg", "application/pdf")
        /// </summary>
        public string ContentType { get; set; } = string.Empty;

        /// <summary>
        /// Original filename for display/download
        /// </summary>
        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// File size in bytes
        /// </summary>
        public long Size { get; set; }
    }
}
```

**Purpose**: This DTO wraps the signed URL and metadata returned from the Microsoft Graph API. Frontend uses this to load files in preview components.

## Database Schema

### crm_activity_attachment Table

**Location**: MySQL database (no schema changes needed)

```sql
CREATE TABLE IF NOT EXISTS crm_activity_attachment (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  IdRef VARCHAR(255) NULL,           -- SharePoint file identifier
  ActivityId BIGINT NOT NULL,
  FileName VARCHAR(255) NOT NULL,
  FilePath VARCHAR(500) NOT NULL,    -- SharePoint relative path or direct URL
  FileSize BIGINT NULL,
  MimeType VARCHAR(100) NULL,
  CreatedAt DATETIME NOT NULL,
  CreatedBy VARCHAR(255) NOT NULL,
  UpdatedAt DATETIME NULL,
  UpdatedBy VARCHAR(255) NULL,

  FOREIGN KEY (ActivityId) REFERENCES crm_activities(Id)
);
```

**Indexes** (existing):
- Primary key on `Id`
- Foreign key index on `ActivityId`

**No Migration Required** - `IdRef` field already exists in production database.

## Data Flow

### File Preview Retrieval Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. User clicks preview button in ActivityAttachmentList            │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Frontend detects SharePoint path via regex                      │
│    → isSharePointPath(attachment.filePath)                          │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Frontend calls GET /api/files/{idRef}                            │
│    → filesApi.getFileUrl(attachment.idRef)                          │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Backend FilesController validates request                        │
│    → JWT authentication check                                       │
│    → IdRef format validation                                        │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. FileRetrievalService calls Microsoft Graph API                  │
│    → ISharepointService.ReadFileWithMetaAsync(idRef)                │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. Graph API returns file metadata with download URL                │
│    → @microsoft.graph.downloadUrl (signed, expires ~1 hour)         │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. Backend extracts URL + expiration + metadata                    │
│    → Maps to FileUrlResponse DTO                                    │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. Backend returns ApiResponse<FileUrlResponse>                     │
│    → Logs file retrieval attempt (audit trail)                      │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 9. Frontend receives signed URL                                     │
│    → Extracts response.data.data.url                                │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 10. Frontend loads URL in <img> or <iframe>                         │
│     → ImagePreview or DocumentPreview component                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Backward Compatibility Flow (Direct URLs)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. User clicks preview button                                       │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Frontend checks attachment.url matches HTTP/HTTPS pattern        │
│    → /^https?:\/\//i.test(attachment.url)                           │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Frontend uses direct URL (no API call)                           │
│    → Passes attachment.url to preview component                     │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Frontend loads URL in <img> or <iframe>                          │
│    → Same preview rendering as SharePoint files                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Error States

### Missing IdRef Error

**Scenario**: SharePoint path detected but no IdRef in database

**Data State**:
```json
{
  "idRef": null,
  "filePath": "DEV/CRM/Activities/lead/17/file.jpg",
  "url": null
}
```

**Frontend Behavior**: Show error message "File reference not found. Please contact support."

### Invalid IdRef Error

**Scenario**: IdRef format is invalid (backend validation fails)

**Backend Response**: 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid IdRef format",
  "errors": ["IdRef must be a valid SharePoint item identifier"]
}
```

**Frontend Behavior**: Show error message "Invalid file reference"

### File Not Found Error

**Scenario**: IdRef is valid but file deleted from SharePoint

**Backend Response**: 404 Not Found
```json
{
  "success": false,
  "message": "File not found in SharePoint",
  "errors": ["No file found with IdRef: {idRef}"]
}
```

**Frontend Behavior**: Show error message "File not found" with retry button

## Data Mapping

### ActivityAttachment → FileUrlResponse (Backend)

**Source**: Microsoft Graph API response
```json
{
  "@microsoft.graph.downloadUrl": "https://graph.microsoft.com/v1.0/drives/...",
  "name": "857c71eb-dd51-4e9f-9b49-29c02df1f04f_20251224024128_cb03fc.jpg",
  "size": 2048576,
  "file": {
    "mimeType": "image/jpeg"
  }
}
```

**Target**: FileUrlResponse DTO
```csharp
new FileUrlResponse
{
    Url = graphResponse["@microsoft.graph.downloadUrl"],
    ExpiresAt = DateTime.UtcNow.AddHours(1), // Graph URLs expire ~1 hour
    ContentType = graphResponse.File.MimeType,
    FileName = graphResponse.Name,
    Size = graphResponse.Size
}
```

### Frontend API Response Unwrapping

**API Response Wrapper**:
```json
{
  "success": true,
  "data": {
    "url": "https://graph.microsoft.com/v1.0/...",
    "expiresAt": "2025-12-24T14:30:00Z",
    "contentType": "image/jpeg",
    "fileName": "file.jpg",
    "size": 2048576
  },
  "message": "File URL retrieved successfully"
}
```

**Frontend Extraction**:
```javascript
const response = await filesApi.getFileUrl(idRef);
const signedUrl = response.data.data.url; // Extract from ApiResponse wrapper
const expiresAt = response.data.data.expiresAt;
```

## Data Validation

### IdRef Format Validation (Backend)

**Pattern**: Alphanumeric characters, hyphens, underscores (max 255 chars)
```csharp
if (string.IsNullOrWhiteSpace(idRef) || idRef.Length > 255)
{
    return BadRequest("Invalid IdRef format");
}
```

**Security**: Prevents path traversal and injection attacks

### SharePoint Path Detection (Frontend)

**Pattern**: Starts with environment prefix + "/CRM/"
```javascript
const SHAREPOINT_PATH_REGEX = /^(DEV|PROD|UAT|SANDBOX)\/CRM\//i;

function isSharePointPath(path) {
  return path && typeof path === 'string' && SHAREPOINT_PATH_REGEX.test(path);
}
```

**Examples**:
- ✅ `DEV/CRM/Activities/lead/17/file.jpg` → SharePoint path
- ✅ `PROD/CRM/Activities/deal/42/document.pdf` → SharePoint path
- ❌ `https://example.com/file.jpg` → Direct URL
- ❌ `/local/path/file.jpg` → Invalid

## Performance Considerations

### No Caching (MVP)

**Rationale**:
- Signed URLs expire in ~1 hour
- Caching requires expiration management
- User typically previews file once per session
- Out of scope for MVP (spec requirement)

**Future Enhancement**: Cache signed URLs in localStorage with expiration check before use

### Lazy Loading

**Strategy**: Only fetch signed URL when preview modal opens
```javascript
useEffect(() => {
  if (!previewOpen || !currentFile) return;

  fetchSignedUrl(currentFile.idRef);
}, [previewOpen, currentFile]);
```

**Benefit**: Avoids unnecessary API calls for files user doesn't preview

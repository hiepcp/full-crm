# API Contract: File Content Endpoint

**Endpoint**: `GET /api/files/{idRef}/content`
**Feature**: Excel File Preview (and general file retrieval)
**Status**: Existing endpoint - No changes required for Excel preview MVP

---

## Endpoint Details

### Request

**Method**: `GET`

**URL**: `/api/files/{idRef}/content`

**Path Parameters**:
- `idRef` (required): SharePoint file identifier (string)
  - Example: `"01ABCDEFGH2Y2PVTWBRGHLQFZWAXSOPJQM"`
  - Format: SharePoint DriveItem ID or custom identifier

**Headers**:
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
XApiKey: your-api-key-here
```

**Query Parameters**: None

**Authentication**:
- Requires valid JWT Bearer token (user authentication)
- Requires API key header `XApiKey` (service authentication)
- File access permissions validated based on activity ownership

---

### Successful Response (200 OK)

**Headers**:
```http
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="Sales_Report_Q4.xlsx"
Content-Length: 5242880
Cache-Control: no-cache
X-Response-Time: 234
X-Cache-Hit: true
```

**Body**: Binary file content (Excel file as byte stream)

**Response Time**:
- Cache hit: ~50-500ms (NFR-007)
- Cache miss: ~1-3 seconds (depends on SharePoint API, file size)
- Large files (10-20MB): Up to 5 seconds (NFR-005)

---

### Error Responses

#### 400 Bad Request - File Too Large

**Condition**: File size exceeds 20MB limit (FR-009)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "File Too Large",
  "status": 400,
  "detail": "File size (24.5 MB) exceeds maximum allowed for preview (20 MB)",
  "errors": {
    "fileSizeMB": [24.5],
    "maxSizeMB": [20.0]
  },
  "traceId": "00-abc123-def456-01"
}
```

#### 401 Unauthorized - Missing or Invalid Token

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "JWT token is missing or invalid",
  "traceId": "00-xyz789-uvw012-02"
}
```

#### 403 Forbidden - Permission Denied

**Condition**: User does not have access to the activity containing this file

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Permission Denied",
  "status": 403,
  "detail": "User does not have access to this file",
  "errors": {
    "userId": [123],
    "idRef": ["01ABCDEFGH2Y2PVTWBRGHLQFZWAXSOPJQM"]
  },
  "traceId": "00-mno345-pqr678-03"
}
```

#### 404 Not Found - File Not Found

**Condition**: IdRef does not exist in SharePoint or database

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "File Not Found",
  "status": 404,
  "detail": "File with the specified IdRef was not found",
  "errors": {
    "idRef": ["01ABCDEFGH2Y2PVTWBRGHLQFZWAXSOPJQM"]
  },
  "traceId": "00-stu901-vwx234-04"
}
```

#### 500 Internal Server Error - SharePoint Retrieval Failed

**Condition**: SharePoint Graph API error, network failure, or parsing error

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
  "title": "SharePoint Error",
  "status": 500,
  "detail": "Failed to retrieve file from SharePoint",
  "errors": {
    "sharepointError": ["Graph API returned 404"],
    "idRef": ["01ABCDEFGH2Y2PVTWBRGHLQFZWAXSOPJQM"]
  },
  "traceId": "00-yza567-bcd890-05"
}
```

#### 503 Service Unavailable - Cache or Service Overload

**Condition**: Memory cache full, service under heavy load

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json
Retry-After: 30

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.6.4",
  "title": "Service Temporarily Unavailable",
  "status": 503,
  "detail": "File preview service is temporarily unavailable due to high load",
  "retryAfterSeconds": 30,
  "traceId": "00-efg123-hij456-06"
}
```

---

## Implementation Notes

### Backend (C# - FilesController.cs)

**Existing Implementation** (No changes required):

```csharp
[HttpGet("{idRef}/content")]
[ProducesResponseType(StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
[ProducesResponseType(StatusCodes.Status500InternalServerError)]
public async Task<IActionResult> GetFileContent(string idRef)
{
    try
    {
        // Get file content from SharePoint via FileRetrievalService
        var fileContent = await _fileRetrievalService.GetFileContentAsync(idRef);

        // Return binary content with proper headers
        return File(
            fileContent.Stream,
            fileContent.ContentType,
            fileContent.FileName,
            enableRangeProcessing: true // Support partial requests for large files
        );
    }
    catch (FileNotFoundException)
    {
        return NotFound(new { error = "File not found" });
    }
    catch (UnauthorizedAccessException)
    {
        return Forbid();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving file content for IdRef: {IdRef}", idRef);
        return StatusCode(500, new { error = "Failed to retrieve file" });
    }
}
```

**New Cache Middleware** (Wraps this endpoint):

```csharp
public class ExcelPreviewCacheMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        // Only cache Excel files
        var idRef = context.Request.RouteValues["idRef"]?.ToString();
        var isExcelPreview = await IsExcelFile(idRef);

        if (!isExcelPreview)
        {
            await _next(context); // Pass through for non-Excel files
            return;
        }

        // Check cache
        var cacheKey = $"excel_preview_{idRef}_{userId}";
        if (_cache.TryGetValue(cacheKey, out byte[] cachedContent))
        {
            context.Response.Headers.Add("X-Cache-Hit", "true");
            await ServeFromCache(context, cachedContent);
            return;
        }

        // Cache miss - call next middleware (FilesController)
        context.Response.Headers.Add("X-Cache-Hit", "false");
        await CaptureAndCacheResponse(context, cacheKey);
    }
}
```

### Frontend (JavaScript - filesApi.js)

**Existing Usage** (No changes required):

```javascript
import axiosInstance from './axiosInstance';

export const filesApi = {
  /**
   * Get file download URL from SharePoint
   * @param {string} idRef - SharePoint file identifier
   * @returns {Promise<{url: string, contentType: string, fileName: string}>}
   */
  getFileUrl: async (idRef) => {
    const encodedIdRef = encodeURIComponent(idRef);
    const response = await axiosInstance.get(`/files/${encodedIdRef}`);
    return response.data;
  },

  /**
   * Get file content as binary (for Excel preview)
   * @param {string} idRef - SharePoint file identifier
   * @returns {Promise<ArrayBuffer>} Binary file content
   */
  getFileContent: async (idRef) => {
    const encodedIdRef = encodeURIComponent(idRef);
    const response = await axiosInstance.get(`/files/${encodedIdRef}/content`, {
      responseType: 'arraybuffer'  // Important: Get binary data
    });
    return response.data; // ArrayBuffer
  }
};
```

**New Usage in ExcelPreview.jsx**:

```javascript
import { filesApi } from '@/infrastructure/api/filesApi';
import * as XLSX from 'xlsx';

async function loadExcelFile(idRef) {
  try {
    // Fetch binary content
    const arrayBuffer = await filesApi.getFileContent(idRef);

    // Validate size (should be checked on backend, but double-check)
    const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);
    if (fileSizeMB > 20) {
      throw new Error('FILE_TOO_LARGE');
    }

    // Parse with SheetJS
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    return workbook;
  } catch (error) {
    if (error.response?.status === 400) {
      // File too large
      throw new Error('FILE_TOO_LARGE');
    }
    if (error.response?.status === 403) {
      // Permission denied
      throw new Error('PERMISSION_DENIED');
    }
    throw error;
  }
}
```

---

## Caching Behavior

### Cache Key Format

```
excel_preview_{idRef}_{userId}
```

**Components**:
- `excel_preview_`: Prefix for namespace isolation
- `{idRef}`: SharePoint file identifier (uniqueness per file)
- `{userId}`: User ID (permission isolation per NFR-012)

**Examples**:
```
excel_preview_01ABCDEF_123
excel_preview_98XYZABC_456
```

### Cache Lifecycle

```
[Request 1] --> Cache MISS --> SharePoint --> Cache SET (15 min TTL) --> Response (2.5s)
                                                    |
[Request 2] ----------------------------------------> Cache HIT --> Response (50ms)
                                                    |
[Request 3 (14 min later)] --------------------------> Cache HIT --> Response (50ms)
                                                    |
[Request 4 (16 min later)] --> Cache MISS (expired) --> SharePoint --> Cache SET --> Response (2.3s)
```

### Cache Headers

Responses include cache status in headers:

**Cache Hit**:
```http
X-Cache-Hit: true
X-Response-Time: 47
```

**Cache Miss**:
```http
X-Cache-Hit: false
X-Response-Time: 2345
```

---

## Performance Benchmarks

| Scenario | Expected Response Time | Success Criteria |
|----------|------------------------|------------------|
| Small file (<1MB), cache hit | 50-200ms | NFR-007 (\u003c500ms) |
| Small file (<1MB), cache miss | 1-2 seconds | NFR-004 (\u003c3s total with parsing) |
| Medium file (5MB), cache hit | 100-500ms | NFR-007 (\u003c500ms) |
| Medium file (5MB), cache miss | 2-3 seconds | NFR-004 (\u003c3s total with parsing) |
| Large file (15MB), cache miss | 3-5 seconds | NFR-005 (\u003c5s for 10-20MB) |
| File >20MB | 400 Bad Request | FR-009 (refuse preview) |

**Note**: Total time to preview includes:
1. Network request to API (200-500ms)
2. SharePoint fetch if cache miss (1-2s)
3. Frontend parsing with SheetJS (200ms - 1s)
4. Rendering virtualized grid (100-300ms)

---

## Security Considerations

### Permission Validation

**Backend**:
```csharp
// In FileRetrievalService or middleware
private async Task<bool> CanUserAccessFile(string idRef, long userId)
{
    // Get activity ID from attachment
    var attachment = await _attachmentRepository.GetByIdRefAsync(idRef);
    if (attachment == null) return false;

    // Check if user has access to the activity
    var activity = await _activityRepository.GetByIdAsync(attachment.ActivityId);
    if (activity == null) return false;

    // Check ownership or team membership
    return activity.OwnerId == userId || await IsTeamMember(userId, activity.TeamId);
}
```

**Cache Isolation**:
- Cache key includes `userId` to prevent cross-user access
- Even if User A cached a file, User B gets a different cache entry (or cache miss if not authorized)

### Data Protection

**In-Memory Only**:
- File content never written to disk (except SharePoint)
- Cache stored in RAM, cleared on app restart or expiration
- No file content in logs (only metadata: filename, size, idRef)

**HTTPS Required**:
- All communication encrypted in transit
- Local development uses mkcert SSL certificates

---

## Future Enhancements (Out of Scope for MVP)

### Optional: Parsed Data Endpoint

**Proposed**: `POST /api/files/{idRef}/excel-preview`

**Purpose**: Offload Excel parsing to backend, return pre-parsed JSON

**Request**:
```http
POST /api/files/{idRef}/excel-preview
Content-Type: application/json

{
  "maxRows": 10000,
  "sheetIndex": 0,
  "includeFormatting": false
}
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "sheets": [
    {
      "name": "Sheet1",
      "data": [
        ["Header1", "Header2", "Header3"],
        ["Value1", "Value2", "Value3"]
      ],
      "rowCount": 1234,
      "colCount": 10,
      "isTruncated": false
    }
  ],
  "metadata": {
    "title": "Sales Report Q4",
    "author": "John Doe",
    "createdDate": "2024-01-01T00:00:00Z"
  },
  "warnings": [
    "Charts are not supported in preview."
  ]
}
```

**Benefits**:
- Reduces frontend bundle size (no SheetJS dependency)
- Centralizes parsing logic
- Easier to cache parsed data (smaller than binary)

**Drawbacks**:
- Increases server CPU usage
- Requires .NET Excel library (EPPlus, ClosedXML)
- More complex caching (JSON serialization)

**Decision**: Defer to post-MVP. Client-side parsing with SheetJS is proven and reduces server load.

---

## Related Documentation

- [data-model.md](../data-model.md) - Cache entry structure and validation rules
- [research.md](../research.md) - Technology decisions (SheetJS, MemoryCache)
- [spec.md](../spec.md) - Functional and non-functional requirements
- [CLAUDE.md](../../../../CLAUDE.md) - Project architecture and API patterns

---

**Last Updated**: 2025-12-25
**Status**: Stable - No API changes required for Excel preview MVP

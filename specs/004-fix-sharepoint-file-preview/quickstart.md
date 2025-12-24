# Implementation Quickstart: Fix SharePoint File Preview

**Feature**: 004-fix-sharepoint-file-preview
**Date**: 2025-12-24
**Estimated Effort**: 4-6 hours

## Overview

This quickstart guide provides step-by-step instructions for implementing the SharePoint file preview fix. The implementation involves creating a backend API endpoint to retrieve signed URLs from Microsoft Graph API, and updating frontend components to detect SharePoint paths and fetch signed URLs before rendering previews.

## Prerequisites

- [ ] Read [spec.md](spec.md) for requirements and acceptance criteria
- [ ] Review [research.md](research.md) for technical decisions
- [ ] Understand [data-model.md](data-model.md) for entities and data flow
- [ ] Review [contracts/file-retrieval-api.md](contracts/file-retrieval-api.md) for API contract

## Implementation Phases

### Phase 1: Backend Implementation (2-3 hours)

#### Step 1: Create FileUrlResponse DTO (15 min)

**File**: `E:\project\full crm\crm-system\src\CRM.Application\Dtos\Response\FileUrlResponse.cs` (NEW)

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

**Verification**: Build project - no errors

#### Step 2: Create IFileRetrievalService Interface (10 min)

**File**: `E:\project\full crm\crm-system\src\CRM.Application\Interfaces\Services\IFileRetrievalService.cs` (NEW)

```csharp
using CRMSys.Application.Dtos.Response;

namespace CRMSys.Application.Interfaces.Services
{
    /// <summary>
    /// Service for retrieving file URLs from SharePoint by IdRef
    /// </summary>
    public interface IFileRetrievalService
    {
        /// <summary>
        /// Get signed/temporary URL for file stored in SharePoint
        /// </summary>
        /// <param name="idRef">SharePoint file identifier</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>File URL response with signed URL and metadata</returns>
        /// <exception cref="FileNotFoundException">When file with IdRef not found</exception>
        /// <exception cref="UnauthorizedAccessException">When user lacks permission</exception>
        Task<FileUrlResponse> GetFileUrlAsync(string idRef, CancellationToken ct = default);
    }
}
```

**Verification**: Build project - no errors

#### Step 3: Implement FileRetrievalService (45 min)

**File**: `E:\project\full crm\crm-system\src\CRM.Application\Services\FileRetrievalService.cs` (NEW)

```csharp
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Shared.ExternalServices.Interfaces;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Service for retrieving file URLs from SharePoint
    /// </summary>
    public class FileRetrievalService : IFileRetrievalService
    {
        private readonly ISharepointService _sharepointService;
        private readonly ILogger<FileRetrievalService> _logger;

        public FileRetrievalService(
            ISharepointService sharepointService,
            ILogger<FileRetrievalService> logger)
        {
            _sharepointService = sharepointService;
            _logger = logger;
        }

        public async Task<FileUrlResponse> GetFileUrlAsync(string idRef, CancellationToken ct = default)
        {
            // Validate IdRef format
            if (string.IsNullOrWhiteSpace(idRef) || idRef.Length > 255)
            {
                _logger.LogWarning("Invalid IdRef format: {IdRef}", idRef);
                throw new ArgumentException("Invalid IdRef format", nameof(idRef));
            }

            try
            {
                _logger.LogInformation("Retrieving file URL for IdRef: {IdRef}", idRef);

                // Call existing SharePoint service to get file metadata
                var fileContent = await _sharepointService.ReadFileWithMetaAsync(idRef);

                // Extract download URL from Graph API response
                // Note: The actual implementation depends on ISharepointService response structure
                // Adjust based on actual return type from Shared.ExternalServices
                var response = new FileUrlResponse
                {
                    Url = fileContent.DownloadUrl ?? throw new InvalidOperationException("Download URL not found"),
                    ExpiresAt = DateTime.UtcNow.AddHours(1), // Graph URLs expire in ~1 hour
                    ContentType = fileContent.ContentType ?? "application/octet-stream",
                    FileName = fileContent.FileName ?? "unknown",
                    Size = fileContent.Content?.Length ?? 0
                };

                _logger.LogInformation("Successfully retrieved file URL for IdRef: {IdRef}", idRef);
                return response;
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogError(ex, "File not found for IdRef: {IdRef}", idRef);
                throw;
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Access denied for IdRef: {IdRef}", idRef);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving file URL for IdRef: {IdRef}", idRef);
                throw new InvalidOperationException($"Failed to retrieve file URL: {ex.Message}", ex);
            }
        }
    }
}
```

**Note**: Adjust `fileContent` property access based on actual `ISharepointService.ReadFileWithMetaAsync()` return type. You may need to inspect the Shared.ExternalServices library to determine exact property names.

**Verification**: Build project - resolve any type mismatches with ISharepointService response

#### Step 4: Create FilesController (30 min)

**File**: `E:\project\full crm\crm-system\src\CRM.Api\Controllers\FilesController.cs` (NEW)

```csharp
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for file operations (retrieve signed URLs for SharePoint files)
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/files")]
    public class FilesController : ControllerBase
    {
        private readonly IFileRetrievalService _fileService;

        public FilesController(IFileRetrievalService fileService)
        {
            _fileService = fileService;
        }

        /// <summary>
        /// Get signed/temporary URL for a file by its IdRef
        /// </summary>
        /// <param name="idRef">SharePoint file identifier</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Signed URL with expiration and metadata</returns>
        [HttpGet("{idRef}")]
        [ProducesResponseType(typeof(ApiResponse<FileUrlResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status504GatewayTimeout)]
        public async Task<IActionResult> GetFileUrl(string idRef, CancellationToken ct)
        {
            try
            {
                // Get user email from JWT claims for audit logging
                var userEmail = User.Identity?.Name ?? "Unknown";
                Log.Information("[User: {UserEmail}] Requested file {IdRef}", userEmail, idRef);

                var result = await _fileService.GetFileUrlAsync(idRef, ct);

                Log.Information("[User: {UserEmail}] Requested file {IdRef} - Success", userEmail, idRef);
                return Ok(ApiResponse<FileUrlResponse>.Ok(result, "File URL retrieved successfully"));
            }
            catch (ArgumentException ex)
            {
                Log.Warning(ex, "[User: {UserEmail}] Requested file {IdRef} - Failure: Invalid format",
                    User.Identity?.Name ?? "Unknown", idRef);
                return BadRequest(ApiResponse<string>.Fail("Invalid IdRef format"));
            }
            catch (FileNotFoundException ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file {IdRef} - Failure: File not found",
                    User.Identity?.Name ?? "Unknown", idRef);
                return NotFound(ApiResponse<string>.Fail("File not found in SharePoint"));
            }
            catch (UnauthorizedAccessException ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file {IdRef} - Failure: Access denied",
                    User.Identity?.Name ?? "Unknown", idRef);
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<string>.Fail("Access denied"));
            }
            catch (TaskCanceledException ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file {IdRef} - Failure: Timeout",
                    User.Identity?.Name ?? "Unknown", idRef);
                return StatusCode(StatusCodes.Status504GatewayTimeout,
                    ApiResponse<string>.Fail("Service timeout"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file {IdRef} - Failure: Unexpected error",
                    User.Identity?.Name ?? "Unknown", idRef);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<string>.Fail($"Error retrieving file URL: {ex.Message}"));
            }
        }
    }
}
```

**Note**: Ensure `ApiResponse<T>` class exists in your codebase (check existing controllers for pattern).

**Verification**: Build project - no errors

#### Step 5: Register Service in DI Container (10 min)

**File**: `E:\project\full crm\crm-system\src\CRM.Application\DependencyInjection.cs` (MODIFY)

Add the following line in the service registration section:

```csharp
// Add this line where other services are registered
services.AddScoped<IFileRetrievalService, FileRetrievalService>();
```

**Verification**: Build project - no errors

#### Step 6: Test Backend Endpoint (15 min)

1. Run the CRM API: `cd crm-system/src/CRM.Api && dotnet run`
2. Use Postman/curl to test:

```bash
curl -X GET "https://api-crm.local.com/api/files/{valid-idref}" \
  -H "Authorization: Bearer {your-jwt-token}" \
  -H "XApiKey: {your-api-key}"
```

Expected: 200 OK with signed URL (or 404 if IdRef doesn't exist - that's also valid)

**Checkpoint**: Backend implementation complete ✅

---

### Phase 2: Frontend Implementation (2-3 hours)

#### Step 1: Create filesApi Client (10 min)

**File**: `E:\project\full crm\crm-system-client\src\infrastructure\api\filesApi.js` (NEW)

```javascript
import axiosInstance from "./axiosInstance";

/**
 * API client for file operations
 */
const filesApi = {
  /**
   * Get signed URL for file by IdRef
   * @param {string} idRef - SharePoint file identifier
   * @returns {Promise} Response with signed URL and metadata
   */
  getFileUrl: (idRef) => axiosInstance.get(`/files/${idRef}`),
};

export default filesApi;
```

**Verification**: No build errors

#### Step 2: Create filePathUtils Utility (15 min)

**File**: `E:\project\full crm\crm-system-client\src\utils\filePathUtils.js` (NEW)

```javascript
/**
 * Regex pattern to detect SharePoint paths
 * Matches paths starting with environment prefix + /CRM/
 */
const SHAREPOINT_PATH_REGEX = /^(DEV|PROD|UAT|SANDBOX)\/CRM\//i;

/**
 * Check if a file path is a SharePoint relative path
 * @param {string} path - File path to check
 * @returns {boolean} True if path is SharePoint relative path
 */
export function isSharePointPath(path) {
  return path && typeof path === 'string' && SHAREPOINT_PATH_REGEX.test(path);
}

/**
 * Resolve file URL from attachment object
 * Priority: IdRef (if SharePoint) > Direct URL > Error
 * @param {object} attachment - Attachment object with idRef, filePath, url fields
 * @param {object} filesApi - Files API client
 * @returns {Promise<string>} Resolved file URL
 * @throws {Error} If no valid URL available
 */
export async function resolveFileUrl(attachment, filesApi) {
  // Priority 1: IdRef + SharePoint path
  if (attachment.idRef && isSharePointPath(attachment.filePath)) {
    try {
      const response = await filesApi.getFileUrl(attachment.idRef);
      return response.data.data.url; // Extract URL from ApiResponse wrapper
    } catch (error) {
      console.error('Failed to fetch SharePoint file URL:', error);
      throw new Error(
        error.response?.status === 404
          ? 'File not found in SharePoint'
          : 'Failed to load file from SharePoint'
      );
    }
  }

  // Priority 2: Direct HTTP/HTTPS URL
  if (attachment.url && /^https?:\/\//i.test(attachment.url)) {
    return attachment.url;
  }

  // Priority 3: Legacy fileUrl field (for backward compatibility)
  if (attachment.fileUrl && /^https?:\/\//i.test(attachment.fileUrl)) {
    return attachment.fileUrl;
  }

  // No valid URL available
  throw new Error('No valid file URL available');
}
```

**Verification**: No build errors

#### Step 3: Modify FilePreviewModal Component (45 min)

**File**: `E:\project\full crm\crm-system-client\src\presentation\components\common\FilePreviewer\FilePreviewModal.jsx` (MODIFY)

**Changes**:
1. Import `filesApi` and `resolveFileUrl`
2. Add state for resolved URL and loading/error states
3. Add `useEffect` to fetch signed URL when file changes
4. Pass resolved URL to preview components

```javascript
import React, { useState, useEffect, useCallback } from 'react';
// ... other imports

// NEW IMPORTS
import filesApi from '../../../../infrastructure/api/filesApi';
import { resolveFileUrl } from '../../../../utils/filePathUtils';

const FilePreviewModal = ({ open, onClose, files = [], currentFile }) => {
  // Existing state...
  const [currentDisplayFile, setCurrentDisplayFile] = useState(currentFile);

  // NEW STATE for URL resolution
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);

  // NEW EFFECT: Fetch signed URL when file changes
  useEffect(() => {
    if (!currentDisplayFile || !open) {
      setResolvedUrl(null);
      setUrlError(null);
      return;
    }

    const fetchUrl = async () => {
      setUrlLoading(true);
      setUrlError(null);
      try {
        const url = await resolveFileUrl(currentDisplayFile, filesApi);
        setResolvedUrl(url);
      } catch (error) {
        console.error('Failed to resolve file URL:', error);
        setUrlError(error.message);
      } finally {
        setUrlLoading(false);
      }
    };

    fetchUrl();
  }, [currentDisplayFile, open]);

  // Existing handlers...

  // MODIFY: Show loading state while fetching URL
  if (urlLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading file...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // MODIFY: Show error state if URL resolution failed
  if (urlError) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {urlError}
          </Alert>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  // MODIFY: Pass resolvedUrl to preview components
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      {/* ... existing dialog structure */}
      <DialogContent>
        {isImageFile(currentDisplayFile) ? (
          <ImagePreview file={currentDisplayFile} resolvedUrl={resolvedUrl} />
        ) : (
          <DocumentPreview file={currentDisplayFile} resolvedUrl={resolvedUrl} />
        )}
      </DialogContent>
      {/* ... existing dialog actions */}
    </Dialog>
  );
};
```

**Verification**: No build errors, component renders

#### Step 4: Modify ImagePreview Component (20 min)

**File**: `E:\project\full crm\crm-system-client\src\presentation\components\common\FilePreviewer\ImagePreview.jsx` (MODIFY)

**Changes**: Accept `resolvedUrl` prop and use it for `src`

```javascript
const ImagePreview = ({ file, resolvedUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Use resolvedUrl if available, otherwise fallback to file.url or file.fileUrl
  const imageUrl = resolvedUrl || file.url || file.fileUrl;

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      {loading && <CircularProgress />}
      {error && (
        <Alert severity="error">
          Failed to load image. The file may be corrupted or no longer available.
        </Alert>
      )}
      <img
        src={imageUrl}
        alt={file.name || 'Preview'}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          maxWidth: '100%',
          maxHeight: '70vh',
          display: loading || error ? 'none' : 'block',
        }}
      />
    </Box>
  );
};
```

**Verification**: No build errors

#### Step 5: Modify DocumentPreview Component (20 min)

**File**: `E:\project\full crm\crm-system-client\src\presentation\components\common\FilePreviewer\DocumentPreview.jsx` (MODIFY)

**Changes**: Accept `resolvedUrl` prop and use it for `src`

```javascript
const DocumentPreview = ({ file, resolvedUrl }) => {
  // Use resolvedUrl if available, otherwise fallback to file.url or file.fileUrl
  const documentUrl = resolvedUrl || file.url || file.fileUrl;

  return (
    <Box sx={{ width: '100%', height: '70vh' }}>
      <iframe
        src={documentUrl}
        title={file.name || 'Document Preview'}
        style={{ width: '100%', height: '100%', border: 'none' }}
        onError={(e) => {
          console.error('Failed to load document:', e);
        }}
      />
    </Box>
  );
};
```

**Verification**: No build errors

#### Step 6: Test Frontend Integration (30 min)

1. Run frontend dev server: `cd crm-system-client && npm run dev`
2. Navigate to an activity with attachments
3. Click preview button on a SharePoint file
4. Verify:
   - Loading state shows while fetching URL
   - Image/document loads successfully
   - No console errors
   - Error message shows if file not found

**Checkpoint**: Frontend implementation complete ✅

---

## Testing Checklist

### Manual Testing

- [ ] **SharePoint Image Preview**: Attach image to activity → Preview → Image loads
- [ ] **SharePoint PDF Preview**: Attach PDF to activity → Preview → PDF renders in iframe
- [ ] **Direct URL Preview**: Create attachment with external URL → Preview → Loads without API call
- [ ] **Error Handling - File Not Found**: Use invalid IdRef → Shows "File not found" error
- [ ] **Error Handling - Timeout**: (Simulate timeout) → Shows timeout error with retry
- [ ] **Navigation**: Preview file → Navigate to next file → New signed URL fetched
- [ ] **Loading States**: Preview opens → Shows loading spinner → File loads
- [ ] **Backward Compatibility**: Existing direct URL attachments still work

### Integration Points to Verify

- [ ] JWT authentication works on `/api/files/{idRef}` endpoint
- [ ] Serilog logs file retrieval attempts (check `logs/info/` directory)
- [ ] CORS headers allow Graph API download URLs to load
- [ ] Error responses match API contract specification
- [ ] Audit logs include user email, IdRef, success/failure status

### Performance Testing

- [ ] File preview loads within 3 seconds for files under 10MB
- [ ] Multiple attachments in single activity don't cause lag
- [ ] Concurrent previews by different users work independently

## Common Pitfalls & Solutions

### Issue 1: "Cannot read property 'url' of undefined"

**Cause**: `response.data.data.url` path doesn't match your ApiResponse structure

**Solution**: Inspect actual API response in browser DevTools Network tab, adjust path accordingly

### Issue 2: CORS error when loading signed URL

**Cause**: Microsoft Graph download URLs should already have CORS headers, but if error persists

**Solution**: Check that frontend is not adding custom headers to the signed URL request (it should be a simple GET from `<img>` or `<iframe>`)

### Issue 3: Signed URL expires immediately

**Cause**: `ExpiresAt` calculation incorrect

**Solution**: Verify Graph API response contains expiration timestamp, use that instead of hardcoded `AddHours(1)`

### Issue 4: Preview fails for valid files

**Cause**: `ISharepointService.ReadFileWithMetaAsync()` return type mismatch

**Solution**: Inspect `Shared.ExternalServices` library source code, adjust property access in `FileRetrievalService.cs`

### Issue 5: "IdRef is null" errors

**Cause**: Database `crm_activity_attachment` table has NULL IdRef values for some files

**Solution**: Check if attachment has `idRef` before calling API:
```javascript
if (!attachment.idRef) {
  throw new Error('File reference not available');
}
```

## Next Steps After Implementation

1. **Code Review**: Have another developer review the changes for security and best practices
2. **Merge to Master**: Create pull request with description of changes
3. **Deploy to DEV**: Test with real SharePoint files in DEV environment
4. **Monitor Logs**: Check Serilog logs for any errors in first week of usage
5. **Gather Feedback**: Ask users if preview is working correctly
6. **Future Enhancements**:
   - Implement URL caching in localStorage (50-minute TTL)
   - Add batch endpoint for fetching multiple file URLs
   - Add permission check (verify user can access parent activity)
   - Implement thumbnail generation for faster previews

## Support

**Issues**: If you encounter problems during implementation, check:
1. [research.md](research.md) - Technical decisions and architecture
2. [contracts/file-retrieval-api.md](contracts/file-retrieval-api.md) - API contract details
3. Backend logs: `crm-system/logs/error/` and `crm-system/logs/info/`
4. Browser console: Check for JavaScript errors or failed API calls

**Questions**: Refer to the feature specification [spec.md](spec.md) for requirements and acceptance criteria.

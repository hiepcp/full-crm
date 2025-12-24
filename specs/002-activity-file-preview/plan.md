# Implementation Plan: Activity File Preview with Base64 Proxy

**Branch**: `002-activity-file-preview` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-activity-file-preview/spec.md` + User requirement: "Backend convert to base64 to avoid authentication issues"

## Summary

Implement inline file preview functionality for activity attachments (images, PDFs, documents) by creating a backend proxy that fetches files from SharePoint and returns them as Base64-encoded data URIs. This eliminates CORS and authentication issues that occur when trying to embed SharePoint signed URLs in iframes or img elements.

**Current Issue**: SharePoint's X-Frame-Options and CORS policies block direct iframe/img embedding of signed URLs, causing preview failures despite successful API calls.

**Solution Approach**: Backend proxy endpoint (`GET /api/files/{idRef}/content`) fetches file content from SharePoint using Graph API, converts to Base64, and returns as data URI to frontend.

## Technical Context

**Language/Version**:
- Backend: C# .NET 8
- Frontend: React 18.3 with Vite

**Primary Dependencies**:
- Backend: Microsoft Graph SDK, Dapper (SimpleCRUD), AutoMapper
- Frontend: Material-UI v5, Axios, react-zoom-pan-pinch

**Storage**:
- Database: MySQL (activity metadata, file references)
- Files: SharePoint Online (via Microsoft Graph API)

**Testing**:
- Backend: xUnit with coverlet.collector
- Frontend: Not yet configured (manual testing)

**Target Platform**:
- Web application (Chrome, Firefox, Safari, Edge)
- Responsive design (desktop + mobile)

**Performance Goals**:
- File preview opens within 2 seconds for files < 10MB
- Thumbnail generation within 3 seconds
- Support files up to 50MB (with warning for larger files)

**Constraints**:
- SharePoint signed URLs expire in ~1 hour
- SharePoint sets X-Frame-Options blocking iframe embedding
- CORS policies prevent cross-origin image/iframe loading
- Browser data URI size limits (typically 2-10MB depending on browser)

**Scale/Scope**:
- Support common file formats: PNG, JPG, GIF, SVG, WebP, BMP, PDF, TXT, CSV
- Average 5-10 attachments per activity
- Concurrent preview requests from multiple users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Clean Architecture (Section I)
- **Compliance**:
  - Backend follows layered structure (Domain → Application → Infrastructure → Api)
  - Frontend follows layered structure (domain → application → infrastructure → presentation)
  - New file proxy endpoint will be added to `CRM.Api/Controllers/FilesController.cs`
  - File retrieval logic already exists in `CRM.Application/Services/FileRetrievalService.cs`
  - New Base64 encoding use case will be added to Application layer
- **Gate**: PASS

### ✅ Security-First Development (Section II)
- **Compliance**:
  - File access MUST validate user permissions before serving content
  - MUST use API Key + JWT authentication for file proxy endpoint
  - MUST sanitize IdRef input to prevent injection attacks
  - MUST validate file size limits to prevent DoS via large file requests
  - Base64 encoding does not expose authentication tokens to frontend
- **Gate**: PASS

### ✅ API-Driven Design (Section III)
- **Compliance**:
  - New endpoint follows REST conventions: `GET /api/files/{idRef}/content`
  - Returns DTO with Base64 content + metadata (contentType, fileName, size)
  - Error handling via existing middleware (ValidationExceptionMiddleware)
  - Frontend uses existing `filesApi.js` client module
- **Gate**: PASS

### ⚠️ File Management & Preview (Section VI)
- **Compliance**:
  - ActivityAttachment entity HAS `IdRef` field ✅
  - Backend DTO NOW includes `IdRef` (fixed in previous session) ✅
  - File retrieval by IdRef already implemented in FileRetrievalService ✅
  - **NEW REQUIREMENT**: Add Base64 content endpoint to replace signed URL approach
  - Preview components already exist (FilePreviewModal, ImagePreview, DocumentPreview) ✅
  - **MODIFICATION NEEDED**: Update preview components to use data URIs instead of SharePoint signed URLs
- **Gate**: PASS (with planned modifications)

### ✅ Observability & Audit Trail (Section V)
- **Compliance**:
  - MUST log file access requests (user, file IdRef, timestamp)
  - MUST log file retrieval failures (SharePoint errors, file not found)
  - MUST log performance metrics (file size, download time, encoding time)
- **Gate**: PASS

**Overall Constitution Compliance**: ✅ PASS - All gates satisfied with planned modifications

## Project Structure

### Documentation (this feature)

```text
specs/002-activity-file-preview/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (Base64 vs streaming analysis)
├── data-model.md        # Phase 1 output (FileContentResponse DTO)
├── quickstart.md        # Phase 1 output (Testing guide)
├── contracts/           # Phase 1 output (API contract for file proxy)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Backend (CRM API)
crm-system/
├── src/
│   ├── CRM.Api/
│   │   └── Controllers/
│   │       └── FilesController.cs              # Add new endpoint: GetFileContent
│   ├── CRM.Application/
│   │   ├── Services/
│   │   │   ├── FileRetrievalService.cs         # Add Base64 encoding logic
│   │   │   └── IFileRetrievalService.cs        # Add interface method
│   │   └── Dtos/
│   │       └── Response/
│   │           └── FileContentResponse.cs       # NEW: Base64 content DTO
│   ├── CRM.Domain/
│   │   └── Entities/
│   │       └── ActivityAttachment.cs            # Existing entity
│   └── CRM.Infrastructure/
│       └── Services/
│           └── SharepointService.cs             # Uses existing ReadFileInfoAsync

# Frontend (React)
crm-system-client/
├── src/
│   ├── infrastructure/
│   │   └── api/
│   │       └── filesApi.js                      # Add getFileContent method
│   ├── presentation/
│   │   └── components/
│   │       └── common/
│   │           └── FilePreviewer/
│   │               ├── FilePreviewModal.jsx     # Update to use data URIs
│   │               ├── ImagePreview.jsx         # Update src to use data URIs
│   │               └── DocumentPreview.jsx      # Update iframe src to use data URIs
│   └── utils/
│       └── filePathUtils.js                     # Update resolveFileUrl logic

tests/
├── CRMApi.UnitTests/
│   └── Services/
│       └── FileRetrievalServiceTests.cs         # NEW: Test Base64 encoding
```

**Structure Decision**: Existing web application structure (backend + frontend). New file proxy endpoint extends existing FilesController. Frontend preview components already exist and need modification to use data URIs instead of signed URLs.

## Complexity Tracking

> **No constitution violations to justify. All changes align with existing principles.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Phase 0: Research & Analysis

**Objective**: Analyze Base64 vs streaming approaches, determine optimal solution for file size limits, browser compatibility, and performance.

### Research Tasks

1. **Base64 Encoding Performance Analysis**
   - Measure encoding time for files of different sizes (1KB, 100KB, 1MB, 10MB, 50MB)
   - Memory overhead: Base64 increases size by ~33%
   - Determine acceptable file size limit for Base64 approach

2. **Browser Data URI Limits**
   - Research data URI size limits across browsers
   - Chrome: No hard limit (tested up to 100MB)
   - Firefox: No hard limit
   - Safari: 2MB limit per data URI (CRITICAL CONSTRAINT)
   - Edge: Same as Chrome (Chromium-based)

3. **Alternative: Streaming Proxy Without Base64**
   - Option: Backend streams file content directly without Base64
   - Frontend uses blob URLs: `URL.createObjectURL(blob)`
   - Pros: No size increase, no browser limits, better performance
   - Cons: More complex implementation (streaming logic)

4. **Caching Strategy**
   - Should backend cache file content to reduce SharePoint API calls?
   - Should frontend cache data URIs in memory?
   - Cache invalidation strategy

5. **Security Considerations**
   - File access permission validation
   - Rate limiting to prevent abuse
   - Input sanitization for IdRef parameter

**Output**: `research.md` with decision matrix and recommended approach

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete with chosen approach (Base64 or streaming)

### Design Artifacts

1. **Data Model** (`data-model.md`)
   - **FileContentResponse DTO**:
     - `Content`: Base64-encoded string OR byte array
     - `ContentType`: MIME type (e.g., "image/jpeg", "application/pdf")
     - `FileName`: Original file name
     - `FileSize`: Size in bytes
     - `ExpiresAt`: Optional cache expiration

2. **API Contract** (`contracts/file-proxy.openapi.yaml`)
   ```yaml
   GET /api/files/{idRef}/content

   Parameters:
     - idRef (path, required): SharePoint DriveItem ID

   Responses:
     200 OK:
       {
         "content": "base64-encoded-string",
         "contentType": "image/jpeg",
         "fileName": "example.jpg",
         "fileSize": 123456
       }
     404 Not Found: File not found in SharePoint
     403 Forbidden: User lacks permission to access file
     500 Internal Server Error: SharePoint API error
   ```

3. **Frontend Changes** (`quickstart.md`)
   - Update `filesApi.getFileContent(idRef)` to call new endpoint
   - Modify `resolveFileUrl()` to:
     1. Call `/api/files/{idRef}/content`
     2. Construct data URI: `data:{contentType};base64,{content}`
     3. Return data URI to preview components
   - Components use data URI as `src` attribute (no changes needed)

4. **Agent Context Update**
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
   - Add: "Base64 file proxy for SharePoint attachments"

**Output**: data-model.md, /contracts/*, quickstart.md, updated agent context

## Phase 2: Task Breakdown

**NOT executed by /speckit.plan - requires separate /speckit.tasks command**

Task breakdown will include:
- Backend: Add FileContentResponse DTO
- Backend: Implement GetFileContent endpoint in FilesController
- Backend: Add Base64 encoding logic to FileRetrievalService
- Backend: Add permission validation and error handling
- Frontend: Update filesApi.js with getFileContent method
- Frontend: Modify resolveFileUrl to use new endpoint
- Frontend: Test image preview with data URIs
- Frontend: Test PDF preview with data URIs
- Frontend: Remove debug console.log statements
- Testing: Verify file sizes up to 50MB
- Testing: Verify error handling for missing files

## Next Steps

1. ✅ Constitution check complete - all gates PASS
2. ✅ Phase 0 complete: Research findings documented in [research.md](./research.md)
3. ⏳ Execute Phase 1: Design (create DTOs and contracts)
4. ⏳ Exit plan mode and await user approval
5. ⏳ Execute /speckit.tasks to generate task breakdown
6. ⏳ Execute /speckit.implement to perform implementation

## Research Questions (Resolved in Phase 0)

- **Q1**: Should we use Base64 data URIs or streaming proxy with blob URLs?
  - **✅ RESOLVED**: Hybrid approach - Base64 for <1.5MB, Blob URL for ≥1.5MB

- **Q2**: What is acceptable file size limit for preview?
  - **✅ RESOLVED**: 1.5MB threshold for Base64, up to 50MB for Blob URL, >50MB direct download

- **Q3**: Should backend implement caching for file content?
  - **✅ RESOLVED**: No initial caching - implement only if performance metrics show need

- **Q4**: Should frontend cache data URIs in session storage?
  - **✅ RESOLVED**: Session-level memory cache only (React state), no localStorage persistence

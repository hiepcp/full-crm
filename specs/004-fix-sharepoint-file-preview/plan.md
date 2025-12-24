# Implementation Plan: Fix SharePoint File Preview via IdRef

**Branch**: `004-fix-sharepoint-file-preview` | **Date**: 2025-12-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-fix-sharepoint-file-preview/spec.md`

## Summary

Fix SharePoint file preview functionality by implementing a backend API endpoint (`GET /api/files/{idRef}`) that converts SharePoint IdRef identifiers to temporary signed URLs from Microsoft Graph API, and updating frontend preview components to detect SharePoint paths and fetch signed URLs before rendering. The solution maintains backward compatibility with direct URL attachments while enabling proper file retrieval through the IdRef reference stored in the `crm_activity_attachment` table.

**Technical Approach**: Create new FilesController in CRM.Api layer with FileRetrievalService in Application layer that leverages existing ISharepointService from Shared.ExternalServices to fetch signed URLs. Frontend components use new filesApi client and filePathUtils to detect SharePoint paths and resolve URLs before preview rendering.

## Technical Context

**Language/Version**:
- Backend: C# .NET 8
- Frontend: JavaScript ES6+, React 18

**Primary Dependencies**:
- Backend: Shared.ExternalServices (SharePoint/Graph API integration), Dapper (data access), FluentValidation, Serilog
- Frontend: Material-UI 5, Axios, React hooks

**Storage**: MySQL database (`crm_activity_attachment` table with `IdRef` field already exists - no schema changes needed)

**Testing**: Manual testing (no automated tests in MVP scope)

**Target Platform**:
- Backend: Linux/Windows server with .NET 8 runtime, HTTPS enabled
- Frontend: Modern browsers (Chrome, Firefox, Edge, Safari)

**Project Type**: Web application (React SPA + .NET Web API microservices)

**Performance Goals**:
- File URL retrieval: <3 seconds for files under 10MB (includes API call + Graph API response)
- Preview load time: <3 seconds total (URL fetch + image/document rendering)
- Signed URL generation: <1 second (Graph API call)

**Constraints**:
- Signed URLs expire in ~1 hour (Microsoft Graph API limitation)
- Maximum file size for preview: 50MB (existing FilePreviewModal constraint from feature 002)
- No caching of signed URLs in MVP (scope limitation)
- Must maintain backward compatibility with direct URL attachments

**Scale/Scope**:
- Expected usage: ~100 concurrent users, ~1000 file previews per day
- Code changes: ~8 new files (5 backend, 2 frontend, 1 contract doc), ~4 modified files (all frontend)
- Estimated effort: 4-6 hours implementation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Clean Architecture (Mandatory) - ✅ PASS

**Backend Compliance**:
- Domain layer: No changes (ActivityAttachment entity with IdRef already exists)
- Application layer: New service (FileRetrievalService) implementing IFileRetrievalService interface, new DTO (FileUrlResponse)
- Infrastructure layer: Leverages existing ISharepointService interface (no new infrastructure code needed)
- API layer: New controller (FilesController) with proper separation of concerns
- **Dependency Rule**: All dependencies point inward (Api → Application → Infrastructure ← Shared.ExternalServices)

**Frontend Compliance**:
- Infrastructure layer: New API client (filesApi.js) following existing axiosInstance pattern
- Utils layer: New utility (filePathUtils.js) for SharePoint path detection
- Presentation layer: Modifications to FilePreviewModal, ImagePreview, DocumentPreview components
- **Separation of Concerns**: Business logic (URL resolution) in utils, API calls in infrastructure, UI rendering in presentation

**No Violations**: All layers properly separated, no cross-layer dependencies

### Security-First Development - ✅ PASS

**Authentication & Authorization**:
- JWT Bearer token required for `/api/files/{idRef}` endpoint (using `[Authorize]` attribute)
- API Key validation via existing middleware (`XApiKey` header)
- User authorization check planned (future enhancement: verify activity access permissions)
- Refresh token flow works as-is (no changes needed)

**Data Protection**:
- IdRef format validation to prevent injection attacks (alphanumeric + hyphens, max 255 chars)
- Signed URLs expire in 1 hour (time-limited exposure)
- No sensitive data logged (only IdRef, user email, success/failure status)

**Input Validation**:
- IdRef validated before Graph API call
- Error handling for all failure scenarios (404, 403, 504, 400, 500)

**Audit Logging**:
- All file retrieval attempts logged with Serilog
- Log format: `[User: {email}] Requested file {idRef} - {Success|Failure}: {reason}`
- Logs enriched with UserEmail, RequestPath, RequestMethod (existing Serilog configuration)

**No Violations**: All security requirements met

### API-Driven Design - ✅ PASS

**Endpoint Conventions**:
- RESTful naming: `GET /api/files/{idRef}`
- Standard HTTP verbs (GET for retrieval)
- Consistent response format using `ApiResponse<T>` wrapper
- Proper HTTP status codes (200, 400, 403, 404, 504, 500)

**Request/Response DTOs**:
- FileUrlResponse DTO separate from domain entities
- Clear separation between API contract and internal implementation
- Response includes metadata (url, expiresAt, contentType, fileName, size)

**Error Handling**:
- Consistent error responses with `ApiResponse<string>.Fail()` pattern
- Middleware for global exception handling (existing ValidationExceptionMiddleware)
- Errors logged with stack traces (Serilog)

**Frontend Integration**:
- Uses existing axiosInstance with auto token refresh
- API client organized in `infrastructure/api/` (filesApi.js)
- Error handling with try/catch and user-friendly messages

**No Violations**: API design follows all conventions

### Testing Discipline - ⚠️ OPTIONAL (No Tests in MVP)

**Status**: Manual testing only

**Rationale**:
- MVP scope prioritizes functionality delivery
- Critical business logic (file URL resolution) is straightforward (no complex state transitions)
- Integration points well-documented in [quickstart.md](quickstart.md)

**Future Enhancement**:
- Unit tests for FileRetrievalService (mock ISharepointService)
- Integration tests for FilesController (test error responses)
- Frontend tests for filePathUtils (regex detection logic)

**No Violations**: Testing is optional per constitution

### Observability & Audit Trail - ✅ PASS

**Structured Logging (Serilog)**:
- All file retrieval attempts logged at INFO level
- Errors logged at ERROR level with full stack traces
- Warnings logged for invalid IdRef formats
- Existing Serilog infrastructure (logs/info/, logs/warning/, logs/error/)

**Audit Trail**:
- Log format: `[User: {email}] Requested file {idRef} - {Success|Failure}: {reason}`
- Includes timestamp (UTC), user email (from JWT), IdRef, success/failure status
- Queryable logs for compliance and debugging

**Error Tracking**:
- Exceptions logged with full stack traces
- Frontend errors logged to browser console (client-side error service out of scope)

**No Violations**: All observability requirements met

### File Management & Preview (Constitution Principle VI) - ✅ PASS

**This feature IMPLEMENTS Constitution Principle VI**

**Activity Attachments**:
- Uses `IdRef` for file retrieval (Constitution requirement)
- Returns file metadata (fileName, contentType, size) in FileUrlResponse
- Integrates with existing crm_activity_attachment table

**File Preview Component**:
- Leverages existing FilePreviewer components from feature 002
- Supports common formats (PDF iframe rendering, image inline display)
- Handles errors gracefully with user-friendly messages (e.g., "File not found")
- Shows loading states during URL fetch

**File Retrieval**:
- Implements file retrieval by IdRef through dedicated endpoint and service
- Returns signed URL (not base64) with expiration timestamp
- Validates user access via JWT authentication
- Handles large files appropriately (50MB limit checked in preview component)

**Integration Points**:
- ActivityAttachmentList component integrates preview functionality (already has preview button)
- Supports both inline preview (modal) and external link opening (existing "Open file" button)
- Preview component reusable across entity types (activities, deals, customers via same endpoint)

**Performance Considerations**:
- No caching in MVP (out of scope per spec)
- Lazy-loads signed URL only when preview modal opens
- Download option available (existing "Open file" button)

**No Violations**: Fully implements File Management & Preview principle

### Summary of Constitution Compliance

**All Constitution Principles: ✅ PASS**

- Clean Architecture: Proper layer separation, dependencies point inward
- Security-First: JWT auth, IdRef validation, audit logging, signed URLs with expiration
- API-Driven Design: RESTful endpoint, DTOs, consistent error responses
- Testing Discipline: Manual testing (optional per constitution)
- Observability: Serilog structured logging, audit trail for all file requests
- File Management & Preview: Implements Constitution Principle VI with IdRef-based retrieval

**No Constitution Violations** - No entries in Complexity Tracking section

## Project Structure

### Documentation (this feature)

```text
specs/004-fix-sharepoint-file-preview/
├── spec.md                       # Feature specification (requirements, user stories, edge cases)
├── plan.md                       # This file (implementation plan)
├── research.md                   # Phase 0 research (technical decisions, SharePoint integration)
├── data-model.md                 # Phase 1 data model (entities, data flow, validation)
├── quickstart.md                 # Phase 1 quickstart (step-by-step implementation guide)
├── contracts/
│   └── file-retrieval-api.md    # API contract (GET /api/files/{idRef} endpoint spec)
└── checklists/
    └── requirements.md           # Quality checklist (all validation passed)
```

### Source Code (Backend - crm-system/)

```text
crm-system/src/
├── CRM.Api/
│   └── Controllers/
│       └── FilesController.cs                      # NEW - GET /api/files/{idRef} endpoint
│           - GetFileUrl(string idRef) action
│           - JWT authentication via [Authorize]
│           - Error handling (400, 403, 404, 504, 500)
│           - Audit logging with user email + IdRef
│
├── CRM.Application/
│   ├── Services/
│   │   └── FileRetrievalService.cs                 # NEW - Business logic for URL retrieval
│   │       - Calls ISharepointService.ReadFileWithMetaAsync()
│   │       - Extracts @microsoft.graph.downloadUrl from response
│   │       - Maps to FileUrlResponse DTO
│   │       - Validates IdRef format, handles exceptions
│   │
│   ├── Interfaces/Services/
│   │   └── IFileRetrievalService.cs                # NEW - Service contract
│   │       - GetFileUrlAsync(string idRef, CancellationToken ct)
│   │
│   ├── Dtos/Response/
│   │   └── FileUrlResponse.cs                      # NEW - Response DTO
│   │       - Url (signed URL from Graph API)
│   │       - ExpiresAt (timestamp when URL expires)
│   │       - ContentType (MIME type)
│   │       - FileName (original filename)
│   │       - Size (file size in bytes)
│   │
│   └── DependencyInjection.cs                      # MODIFY - Register IFileRetrievalService
│       - Add: services.AddScoped<IFileRetrievalService, FileRetrievalService>();
│
├── CRM.Domain/
│   └── Entities/
│       └── ActivityAttachment.cs                   # NO CHANGE (IdRef field exists)
│
└── CRM.Infrastructure/
    └── (No changes - leverages existing ISharepointService from Shared.ExternalServices)
```

### Source Code (Frontend - crm-system-client/)

```text
crm-system-client/src/
├── infrastructure/api/
│   └── filesApi.js                                 # NEW - API client for file retrieval
│       - getFileUrl(idRef) → GET /api/files/{idRef}
│       - Uses axiosInstance with JWT auth
│
├── utils/
│   └── filePathUtils.js                            # NEW - SharePoint path detection
│       - isSharePointPath(path) → regex check for DEV/PROD/UAT/SANDBOX/CRM/
│       - resolveFileUrl(attachment, filesApi) → IdRef API call vs direct URL
│       - Priority: IdRef (if SharePoint) > Direct URL > Error
│
└── presentation/components/common/
    ├── FilePreviewer/
    │   ├── FilePreviewModal.jsx                    # MODIFY - Fetch signed URLs before preview
    │   │   - Import filesApi, resolveFileUrl
    │   │   - Add state: resolvedUrl, urlLoading, urlError
    │   │   - useEffect: fetch signed URL when currentFile changes
    │   │   - Show loading state while fetching
    │   │   - Show error state if URL resolution fails
    │   │   - Pass resolvedUrl to ImagePreview/DocumentPreview
    │   │
    │   ├── ImagePreview.jsx                        # MODIFY - Accept resolvedUrl prop
    │   │   - Use resolvedUrl if available, fallback to file.url/file.fileUrl
    │   │   - <img src={resolvedUrl || file.url || file.fileUrl} />
    │   │
    │   └── DocumentPreview.jsx                     # MODIFY - Accept resolvedUrl prop
    │       - Use resolvedUrl if available, fallback to file.url/file.fileUrl
    │       - <iframe src={resolvedUrl || file.url || file.fileUrl} />
    │
    └── ActivityFeed/
        └── ActivityAttachmentList.jsx              # MODIFY - Pass IdRef to preview modal
            - Already has preview button (no changes to UI)
            - FilePreviewModal receives file with idRef field
```

**Structure Decision**: Web application structure (Option 2 from template). Frontend (React SPA) and backend (.NET API) are separate microservices following Clean Architecture within each tier. Backend uses layered structure (Api/Application/Domain/Infrastructure), frontend uses layered structure (presentation/application/domain/infrastructure/utils). This feature creates new files in Application and Api layers (backend) and infrastructure/utils/presentation layers (frontend), with no changes to Domain layer as ActivityAttachment entity already has IdRef field.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**This section is empty** - All Constitution principles are followed without exceptions or violations. No complexity justifications needed.

---

## Critical Implementation Files

### Backend (3 new files, 1 modification)

**1. FilesController.cs** (NEW - 120 lines) - [crm-system/src/CRM.Api/Controllers/FilesController.cs](../../crm-system/src/CRM.Api/Controllers/FilesController.cs)
- Primary endpoint exposing `GET /api/files/{idRef}`
- Handles JWT authentication via `[Authorize]` attribute
- Exception handling for ArgumentException (400), FileNotFoundException (404), UnauthorizedAccessException (403), TaskCanceledException (504), generic Exception (500)
- Audit logging: `[User: {email}] Requested file {idRef} - {Success|Failure}: {reason}`
- Returns `ApiResponse<FileUrlResponse>` wrapper

**2. FileRetrievalService.cs** (NEW - 80 lines) - [crm-system/src/CRM.Application/Services/FileRetrievalService.cs](../../crm-system/src/CRM.Application/Services/FileRetrievalService.cs)
- Core business logic for URL retrieval
- Calls `ISharepointService.ReadFileWithMetaAsync(idRef)` from Shared.ExternalServices
- Extracts `@microsoft.graph.downloadUrl` from Graph API response metadata
- Maps to FileUrlResponse DTO with url, expiresAt, contentType, fileName, size
- Validates IdRef format (not null, not empty, max 255 chars)
- Handles exceptions: FileNotFoundException, UnauthorizedAccessException, generic exceptions

**3. FileUrlResponse.cs** (NEW - 30 lines) - [crm-system/src/CRM.Application/Dtos/Response/FileUrlResponse.cs](../../crm-system/src/CRM.Application/Dtos/Response/FileUrlResponse.cs)
- Response DTO defining contract between backend and frontend
- Fields: Url (signed URL from Graph), ExpiresAt (UTC timestamp), ContentType (MIME type), FileName (original name), Size (bytes)
- Used by FilesController to return file metadata and signed URL

**4. DependencyInjection.cs** (MODIFY - add 1 line) - [crm-system/src/CRM.Application/DependencyInjection.cs](../../crm-system/src/CRM.Application/DependencyInjection.cs)
- Register service: `services.AddScoped<IFileRetrievalService, FileRetrievalService>();`

### Frontend (2 new files, 3 modifications)

**1. filesApi.js** (NEW - 15 lines) - [crm-system-client/src/infrastructure/api/filesApi.js](../../crm-system-client/src/infrastructure/api/filesApi.js)
- API client for file operations
- Method: `getFileUrl(idRef)` → `axiosInstance.get(\`/files/\${idRef}\`)`
- Uses existing axiosInstance with JWT token refresh

**2. filePathUtils.js** (NEW - 50 lines) - [crm-system-client/src/utils/filePathUtils.js](../../crm-system-client/src/utils/filePathUtils.js)
- SharePoint path detection: `SHAREPOINT_PATH_REGEX = /^(DEV|PROD|UAT|SANDBOX)\/CRM\//i`
- Function: `isSharePointPath(path)` → returns boolean
- Function: `resolveFileUrl(attachment, filesApi)` → returns Promise<string>
  - Priority 1: IdRef + SharePoint path → API call
  - Priority 2: Direct HTTP/HTTPS URL → return as-is
  - Priority 3: Legacy fileUrl field → return as-is
  - Throws Error if no valid URL available

**3. FilePreviewModal.jsx** (MODIFY - add ~50 lines) - [crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx](../../crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx)
- Import filesApi and resolveFileUrl
- Add state: `resolvedUrl`, `urlLoading`, `urlError`
- Add useEffect to fetch signed URL when `currentDisplayFile` changes
- Show loading state while `urlLoading === true`
- Show error alert if `urlError` is not null
- Pass `resolvedUrl` to ImagePreview and DocumentPreview components

**4. ImagePreview.jsx** (MODIFY - update 1 line) - [crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx](../../crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx)
- Accept `resolvedUrl` prop
- Change: `const imageUrl = resolvedUrl || file.url || file.fileUrl;`

**5. DocumentPreview.jsx** (MODIFY - update 1 line) - [crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx](../../crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx)
- Accept `resolvedUrl` prop
- Change: `const documentUrl = resolvedUrl || file.url || file.fileUrl;`

## Next Steps

**After Planning Phase Complete**:
1. Run `/speckit.tasks` to generate task breakdown (tasks.md)
2. Implement Phase 1 (Backend) following [quickstart.md](quickstart.md) Step 1-6
3. Implement Phase 2 (Frontend) following [quickstart.md](quickstart.md) Step 7-12
4. Manual testing per [Testing Checklist](quickstart.md#testing-checklist)
5. Code review and merge to master branch
6. Deploy to DEV environment for integration testing with real SharePoint files

**Documentation References**:
- [spec.md](spec.md) - Requirements, user stories, success criteria
- [research.md](research.md) - Technical decisions, SharePoint integration details
- [data-model.md](data-model.md) - Entities, data flow, validation rules
- [contracts/file-retrieval-api.md](contracts/file-retrieval-api.md) - API endpoint specification
- [quickstart.md](quickstart.md) - Step-by-step implementation guide

# Implementation Plan: Activity Excel File Preview

**Branch**: `001-activity-excel-preview` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-activity-excel-preview/spec.md`

## Summary

Add Excel file preview capability (.xlsx and .xls formats) to the existing activity attachment system. Users will be able to preview Excel files in a modal/dialog overlay without downloading, with support for multi-sheet workbooks, large files (up to 20MB), responsive design across all devices, and server-side caching for performance. This extends the existing FilePreviewer system which already supports images, PDFs, and text files.

**Technical Approach**:
- Frontend: Add SheetJS (xlsx) library for client-side Excel parsing
- Frontend: Create ExcelPreview.jsx component integrated with existing FilePreviewModal
- Frontend: Extend FileCategory enum and file detection logic
- Backend: No changes needed - existing `/api/files/{idRef}/content` endpoint already streams Excel files from SharePoint
- Caching: Implement server-side cache middleware for parsed Excel data (15-minute expiration)

## Technical Context

**Language/Version**:
- Frontend: React 18.2.0, JavaScript/JSX
- Backend: .NET 8.0, C#

**Primary Dependencies**:
- Frontend:
  - Material-UI v7.3.2 (@mui/material, @mui/icons-material)
  - Vite v7.1.2 (build tool)
  - Axios v1.11.0 (HTTP client)
  - Redux Toolkit v2.9.0 (state management)
  - **SheetJS (xlsx)** - NEW: Client-side Excel parsing library
- Backend:
  - Dapper with SimpleCRUD (ORM)
  - Serilog (structured logging)
  - Res.Shared.AuthN v1.0.3 (JWT authentication)
  - Shared.ExternalServices.dll (SharePoint integration)
  - **System.Runtime.Caching or MemoryCache** - NEW: Server-side cache for parsed Excel data

**Storage**:
- MySQL database (activity_attachments table)
- SharePoint Online (actual file storage via Graph API)
- Server-side memory cache (Redis or in-memory cache for parsed Excel preview data)

**Testing**:
- Frontend: Not yet configured (mock data in development)
- Backend: xUnit with coverlet.collector
- Integration tests recommended for: Excel parsing, file size limits, cache expiration, SharePoint retrieval

**Target Platform**:
- Frontend: Modern browsers (Chrome, Firefox, Edge, Safari) on desktop, tablet, and mobile devices
- Backend: Linux server / Windows Server with HTTPS

**Project Type**: Web application (React SPA + .NET Web API microservices)

**Performance Goals**:
- Preview render: \u003c3 seconds for files \u003c5MB
- Partial preview: \u003c5 seconds for files 10MB-20MB
- Cached preview: \u003c500ms
- Sheet navigation: \u003c1 second per sheet switch
- Mobile/tablet: Same performance as desktop

**Constraints**:
- Max file size: 20MB hard limit (refuse preview beyond this)
- Partial preview: First 10,000 rows for large files
- Formats: .xlsx (Office Open XML) and .xls (Excel 97-2003) only
- Read-only preview (no editing)
- Server-side cache: 15-minute expiration
- Must respect existing activity-level permissions

**Scale/Scope**:
- Expected usage: Sales teams reviewing quotations, managers reviewing reports
- Typical file sizes: 100KB - 5MB (standard business Excel files)
- Cache storage estimate: ~100MB for 50 concurrent previews
- Concurrent users: Designed for 10-100 concurrent Excel previews

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Clean Architecture (Mandatory)

**Compliance**: PASS

- Frontend layers will be maintained:
  - `presentation/components/common/FilePreviewer/ExcelPreview.jsx` - UI component
  - `utils/fileUtils.js` - File detection utilities (updated)
  - `infrastructure/api/filesApi.js` - No changes (already compliant)

- Backend layers will be maintained:
  - `CRM.Api/Controllers/FilesController.cs` - No changes to presentation layer
  - `CRM.Application/Services/FileRetrievalService.cs` - No changes to application layer
  - New cache middleware in `CRM.Api/Middleware/` (infrastructure concern)

- **No violations**: Feature extends existing architecture without breaking layering

### ✅ II. Security-First Development

**Compliance**: PASS

- **Authentication & Authorization**:
  - Existing JWT + API Key authentication will be maintained
  - File access permissions already enforced at activity level (FR-013)
  - No new authentication mechanisms introduced

- **Data Protection**:
  - Cached preview data must respect permissions (NFR-012)
  - No sensitive file contents logged (NFR-011)
  - HTTPS enforced via existing configuration

- **Input Validation**:
  - File size validation (20MB limit) - FR-009
  - File format validation (.xlsx, .xls only) - FR-008, FR-015
  - IdRef validation in existing FilesController

- **CORS Policy**:
  - No changes needed - existing CORS configuration supports modal preview

- **Audit Logging**:
  - Preview attempts logged with metadata (NFR-001)
  - Error logging with file details (NFR-002, FR-016)
  - Performance metrics tracked (NFR-003)

- **New Security Requirements**:
  - Cache isolation per file with permission checks (NFR-012)
  - Prevent cache poisoning via proper key generation
  - Secure disposal of cached binary data

### ✅ III. API-Driven Design

**Compliance**: PASS

- **Existing Endpoints Used**:
  - `GET /api/files/{idRef}/content` - Already proxies SharePoint files, supports Excel
  - No new endpoints required for MVP

- **Optional Enhancement** (post-MVP):
  - `POST /api/files/{idRef}/preview` - Could offload Excel parsing to backend
  - Response: `{ sheets: [], metadata: {} }` - Pre-parsed data for frontend

- **Frontend Integration**:
  - Uses existing `axiosInstance` with token refresh
  - Uses existing `filesApi.getFileUrl()` pattern
  - No changes to API client architecture

### ✅ IV. Testing Discipline

**Compliance**: OPTIONAL (Encouraged)

- **Recommended Tests**:
  - **Unit Tests** (Frontend):
    - Excel file detection logic
    - File size validation
    - Sheet data parsing with SheetJS
  - **Integration Tests** (Backend):
    - Cache expiration behavior
    - Permission-based cache isolation
    - Large file handling (10MB-20MB)
  - **Manual Tests**:
    - Multi-sheet navigation
    - Mobile responsive layout
    - Touch gestures on tablets

- **No mandatory test requirements**: Tests are encouraged but not blocking

### ✅ V. Observability & Audit Trail

**Compliance**: PASS

- **Structured Logging** (Serilog):
  - All preview attempts logged (NFR-001)
  - Error details with stack traces (NFR-002)
  - Performance metrics: processing time, render time (NFR-003)
  - Enriched with UserEmail, RequestPath, IdRef, FileName

- **New Logging Requirements**:
  - Cache hits/misses
  - Excel parsing failures (corrupted files, unsupported features)
  - File size limit rejections
  - Sheet switch operations (for performance monitoring)

- **No audit table changes**: Logging to Serilog files is sufficient

### ✅ VI. File Management & Preview

**Compliance**: PASS - This feature directly implements this principle

- **Activity Attachments**:
  - Uses existing `activity_attachments` table with `IdRef`
  - Metadata already available: FileName, FilePath, FileSize, MimeType
  - Computed properties: FileExtension, IsImage, IsDocument, DisplaySize

- **File Preview Component**:
  - Extends existing `FilePreviewer` component ecosystem
  - Adds EXCEL to FileCategory enum (IMAGE, PDF, TEXT, EXCEL)
  - Reuses FilePreviewModal architecture
  - Loading/error states already implemented

- **File Retrieval**:
  - Existing `/api/files/{idRef}/content` endpoint returns binary Excel files
  - Permission validation already in place
  - Supports streaming for large files

- **Integration Points**:
  - ActivityAttachmentList already integrated with FilePreviewModal
  - Preview icon/button pattern already established
  - Modal overlay pattern already implemented

- **Performance Considerations**:
  - ✅ Cache for repeated previews (FR-017, NFR-007) - NEW REQUIREMENT
  - ✅ Lazy load ExcelPreview component (code splitting)
  - ✅ Download fallback for large files (FR-006)

- **This feature completes the file preview principle for Office documents**

### Summary

**Gate Status**: ✅ PASS - All constitution principles satisfied

**No violations requiring justification**. Feature follows established patterns, extends existing architecture, and adds missing Excel preview capability to complete the file management principle.

## Project Structure

### Documentation (this feature)

```text
specs/001-activity-excel-preview/
├── spec.md                  # Feature specification (/speckit.specify output)
├── plan.md                  # This file (/speckit.plan output)
├── research.md              # Technology decisions and library evaluation
├── data-model.md            # Cache data structures and Excel preview model
├── quickstart.md            # Developer setup and testing guide
├── contracts/               # API contracts (if new endpoints added)
│   └── (none for MVP - uses existing endpoints)
└── tasks.md                 # Phase 2 output (/speckit.tasks command - NOT created yet)
```

### Source Code (repository root)

```text
# Frontend (crm-system-client/)
crm-system-client/
├── src/
│   ├── presentation/
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── FilePreviewer/
│   │   │           ├── FilePreviewModal.jsx          # MODIFY: Add Excel routing
│   │   │           ├── DocumentPreview.jsx           # MODIFY: Route Excel to ExcelPreview
│   │   │           ├── ExcelPreview.jsx              # CREATE: New Excel preview component
│   │   │           ├── ImagePreview.jsx              # NO CHANGE
│   │   │           └── ThumbnailGenerator.jsx        # NO CHANGE
│   │   └── pages/
│   │       └── activity/
│   │           ├── ActivityDetail.jsx                # NO CHANGE (already uses FilePreviewer)
│   │           └── components/
│   │               └── ActivityAttachmentList.jsx    # NO CHANGE (already integrated)
│   ├── utils/
│   │   ├── fileUtils.js                              # MODIFY: Add EXCEL category and extensions
│   │   └── filePathUtils.js                          # NO CHANGE
│   ├── infrastructure/
│   │   └── api/
│   │       ├── filesApi.js                           # NO CHANGE (uses existing endpoints)
│   │       └── axiosInstance.js                      # NO CHANGE
│   └── config.js                                     # NO CHANGE
├── package.json                                       # MODIFY: Add xlsx library
└── README.md                                          # UPDATE: Document Excel preview

# Backend (crm-system/)
crm-system/
├── src/
│   ├── CRM.Api/
│   │   ├── Controllers/
│   │   │   ├── FilesController.cs                    # MODIFY: Add cache middleware
│   │   │   └── ActivityController.cs                 # NO CHANGE
│   │   ├── Middleware/
│   │   │   └── ExcelPreviewCacheMiddleware.cs        # CREATE: Server-side cache
│   │   └── Program.cs                                # MODIFY: Register cache middleware
│   ├── CRM.Application/
│   │   ├── Services/
│   │   │   ├── FileRetrievalService.cs               # MODIFY: Add logging for Excel
│   │   │   └── Interfaces/
│   │   │       └── IFileRetrievalService.cs          # NO CHANGE
│   │   └── DependencyInjection.cs                    # MODIFY: Register cache service
│   ├── CRM.Infrastructure/
│   │   └── (No changes)
│   └── CRM.Domain/
│       └── (No changes)
└── tests/
    └── CRMApi.UnitTests/
        └── Middleware/
            └── ExcelPreviewCacheMiddlewareTests.cs   # CREATE: Cache tests
```

**Structure Decision**:

This is a **web application** (Option 2) with clear frontend/backend separation. The feature primarily extends the frontend preview system with minimal backend changes (cache middleware only). All work follows the existing Clean Architecture layering in both React SPA (frontend) and .NET microservices (backend).

**Key architectural decisions**:
1. **Client-side Excel parsing** (SheetJS) - Reduces server load, enables offline-like preview after download
2. **Server-side caching** - Improves performance for frequently accessed files, benefits all users
3. **No new API endpoints** - Uses existing `/content` proxy endpoint
4. **Component reuse** - Extends FilePreviewModal pattern established for PDF/Image preview

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution principles are satisfied without exceptions or workarounds.

---

**Next Steps**: Proceed to Phase 0 (Research) to evaluate Excel parsing libraries and cache implementation options.

---

## Post-Design Constitution Re-evaluation

*Re-checked after Phase 1 design completion (research.md, data-model.md, contracts/, quickstart.md)*

### ✅ All Constitution Principles Re-Confirmed

**Summary**: No violations introduced during design phase. All architectural decisions align with project constitution.

**Key Confirmations**:

1. **Clean Architecture**: ✅ PASS
   - Frontend: ExcelPreview.jsx in presentation layer, fileUtils.js in utils layer
   - Backend: Cache middleware in infrastructure (CRM.Api/Middleware)
   - No cross-layer violations introduced

2. **Security-First Development**: ✅ PASS
   - Cache includes userId for permission isolation (NFR-012)
   - File size validation on both frontend and backend (defense in depth)
   - No sensitive data in logs (only metadata)
   - HTTPS enforced throughout

3. **API-Driven Design**: ✅ PASS
   - Uses existing `/api/files/{idRef}/content` endpoint (no new endpoints)
   - Frontend uses standard axiosInstance pattern
   - Error handling follows established DTO patterns

4. **Testing Discipline**: ✅ PASS (Optional)
   - quickstart.md includes comprehensive test checklist
   - Manual testing procedures defined
   - Automated test examples provided

5. **Observability & Audit Trail**: ✅ PASS
   - Serilog logging for cache hits/misses (NFR-001)
   - Performance metrics tracked (NFR-003)
   - Error logging with full context (NFR-002)

6. **File Management & Preview**: ✅ PASS
   - **Completes this constitutional principle**
   - Excel preview fills the gap in Office document support
   - Follows established FilePreviewer component pattern

**Design Quality**: High. Technology decisions (SheetJS, MemoryCache, react-window) are industry-standard, battle-tested solutions that minimize risk and complexity.

**Implementation Risk**: Low. Feature extends proven patterns without introducing new architectural concepts.

---

## Phase 0 & 1 Artifacts Summary

**Phase 0 - Research Complete** ✅
- [research.md](./research.md) - All technology decisions finalized
  - Excel parsing: SheetJS (xlsx)
  - Caching: .NET MemoryCache with 15-minute TTL
  - Rendering: react-window for virtualization
  - Mobile: Material-UI responsive Dialog

**Phase 1 - Design Complete** ✅
- [data-model.md](./data-model.md) - Cache structures, validation rules, data flow
- [contracts/file-content-api.md](./contracts/file-content-api.md) - Existing API documented
- [quickstart.md](./quickstart.md) - Developer setup, testing guide, troubleshooting

**Agent Context Updated** ✅
- CLAUDE.md updated with feature-specific guidance

**Ready for Next Phase**: ✅ YES - `/speckit.tasks` can now generate implementation tasks

---

**Planning Phase Complete**: 2025-12-25
**Total Planning Time**: ~2 hours (spec → clarify → plan → research → design)
**Implementation Estimate**: 8-16 hours (frontend: 6-10h, backend cache: 2-4h, testing: 2h)

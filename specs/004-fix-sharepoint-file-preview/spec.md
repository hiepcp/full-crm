# Feature Specification: Fix SharePoint File Preview via IdRef

**Feature Branch**: `004-fix-sharepoint-file-preview`
**Created**: 2025-12-24
**Status**: Draft
**Input**: User description: "sao file hông lấy từ sharepoint thông qua crm_activity_attachment.IdRef mà lấy từ Preview failed Failed to load image: DEV/CRM/Activities/lead/17/857c71eb-dd51-4e9f-9b49-29c02df1f04f_20251224024128_cb03fc.jpg sửa lại phân tích giúp tôi"

## Clarifications

### Session 2025-12-24

- Q: Should the backend API return base64-encoded file content, a signed URL, or conditionally choose based on file size/type? → A: Return a signed/temporary URL that expires after a set time (scalable, cacheable)

## Problem Statement

The current file preview implementation attempts to load files directly using SharePoint relative paths (e.g., `DEV/CRM/Activities/lead/17/857c71eb-dd51-4e9f-9b49-29c02df1f04f_20251224024128_cb03fc.jpg`) instead of retrieving files through the proper `IdRef` reference stored in the `crm_activity_attachment` table. This causes preview failures because the browser cannot resolve SharePoint internal paths.

**Current Behavior**: Preview modal receives SharePoint path strings and tries to load them as URLs → fails with "Preview failed: Failed to load image"

**Expected Behavior**: Preview modal should fetch file content through backend API using the `IdRef` identifier, which returns a signed/temporary URL with expiration

## User Scenarios & Testing

### User Story 1 - Preview SharePoint-Hosted Files (Priority: P1)

Users can preview image and document files that are stored in SharePoint by clicking the preview button in activity attachments, and the system correctly retrieves the file content using the IdRef reference.

**Why this priority**: This is the core bug fix - without it, the entire file preview feature is non-functional for SharePoint-hosted files, which is the primary file storage mechanism in the CRM system.

**Independent Test**: Attach a file to an activity (which stores it in SharePoint), then click the preview icon. The file should load successfully in the preview modal without "Failed to load" errors.

**Acceptance Scenarios**:

1. **Given** an activity has an attached image file stored in SharePoint, **When** user clicks the preview icon, **Then** the image loads successfully in the preview modal
2. **Given** an activity has an attached PDF file stored in SharePoint, **When** user clicks the preview icon, **Then** the PDF renders in the iframe viewer
3. **Given** an activity has multiple attached files, **When** user navigates between files using arrow keys, **Then** each file loads correctly using its IdRef
4. **Given** a file's IdRef is invalid or file is deleted from SharePoint, **When** user tries to preview, **Then** system shows "File not found" error with retry option

---

### User Story 2 - Backward Compatibility with Direct URLs (Priority: P2)

The system maintains backward compatibility with attachments that use direct URLs instead of IdRef (legacy data or external links), allowing both retrieval methods to coexist.

**Why this priority**: Some existing attachments may use direct URLs or external links that don't require IdRef lookup. The system should handle both cases gracefully.

**Independent Test**: Create an attachment with a direct external URL (e.g., a public image URL), then preview it. The system should detect it's not a SharePoint path and load it directly.

**Acceptance Scenarios**:

1. **Given** an attachment has a direct HTTP/HTTPS URL, **When** user previews it, **Then** system loads the URL directly without IdRef lookup
2. **Given** an attachment has an IdRef pointing to SharePoint, **When** user previews it, **Then** system uses IdRef to fetch the file
3. **Given** an attachment has both IdRef and URL fields populated, **When** user previews it, **Then** system prioritizes IdRef for SharePoint files

---

### Edge Cases

- What happens when IdRef exists but the file was deleted from SharePoint? → Show "File not found" error with option to download via fallback URL if available
- What happens when the file retrieval API is slow or times out? → Show loading state for up to 10 seconds, then show timeout error with retry button
- What happens when the backend returns a file that doesn't match the expected MIME type? → Show warning message but attempt to display anyway
- What happens when user previews a very large file (>50MB) retrieved via IdRef? → Apply the same 50MB size limit check after fetching file metadata
- What happens when multiple users preview the same file simultaneously? → Each user gets independent API calls (no caching requirement for MVP)
- What happens when the signed URL expires while user is viewing the file? → User can continue viewing (URL already loaded in browser), but navigating to another file and back will require a new API call

## Requirements

### Functional Requirements

- **FR-001**: System MUST detect when an attachment uses a SharePoint path pattern (e.g., starts with `DEV/`, `PROD/`, or matches SharePoint path regex)
- **FR-002**: System MUST retrieve file content via backend API endpoint using the `IdRef` field when attachment is stored in SharePoint
- **FR-003**: Backend API MUST return file metadata (filename, size, MIME type) and a signed/temporary URL with expiration time when queried by IdRef
- **FR-004**: System MUST handle both IdRef-based retrieval (SharePoint files) and direct URL loading (external links) in the same preview component
- **FR-005**: System MUST show appropriate error messages when IdRef lookup fails ("File not found", "Access denied", "Server error")
- **FR-006**: System MUST maintain existing preview functionality for direct URLs without breaking backward compatibility
- **FR-007**: System MUST validate IdRef format before making API calls to avoid unnecessary requests
- **FR-008**: Backend API MUST authenticate user permissions before serving file content (files are only accessible to users with activity access rights)
- **FR-009**: System MUST log file retrieval attempts (IdRef used, success/failure, user ID) for audit purposes
- **FR-010**: System MUST handle CORS appropriately when serving files from SharePoint storage
- **FR-011**: Signed URLs MUST have an expiration time (recommended: 1 hour) to balance security and user experience

### Key Entities

- **ActivityAttachment**: Entity representing file attachments with fields:
  - `IdRef` (string): Unique identifier for retrieving file from SharePoint
  - `FilePath` (string): SharePoint relative path (currently incorrectly used as URL)
  - `FileName` (string): Display name of the file
  - `FileSize` (number): Size in bytes
  - `MimeType` (string): Content type
  - `Url` (string): Optional direct URL for external files

- **FileRetrievalResponse** (API response): Backend response containing:
  - `url`: Signed/temporary URL with expiration for downloading the file
  - `expiresAt`: ISO 8601 timestamp when the URL expires
  - `contentType`: MIME type for rendering
  - `fileName`: Original filename
  - `size`: File size in bytes

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can successfully preview 100% of SharePoint-hosted image files attached to activities (no "Failed to load" errors for valid files)
- **SC-002**: File preview loads within 3 seconds for files under 10MB retrieved via IdRef
- **SC-003**: System correctly identifies and routes 100% of SharePoint paths to IdRef retrieval vs direct URL loading
- **SC-004**: Zero preview failures for files with valid IdRef references (excluding intentionally deleted files)
- **SC-005**: Backward compatibility maintained - 100% of existing direct URL attachments continue to preview without regression

## Assumptions

- Backend API endpoint for file retrieval by IdRef already exists or will be implemented (endpoint like `GET /api/files/{IdRef}`)
- IdRef values in the database are unique and correctly reference SharePoint files
- SharePoint integration library (`Shared.ExternalServices`) is already configured and functional
- Authentication tokens used for CRM API calls are sufficient for file retrieval authorization
- File metadata (size, MIME type) can be retrieved without downloading the entire file for size validation

## Dependencies

- Backend: File retrieval API endpoint implementation (if not exists)
- SharePoint: Shared.ExternalServices library for SharePoint file access
- Database: crm_activity_attachment table with IdRef field populated
- Frontend: Existing FilePreviewModal, ImagePreview, DocumentPreview components

## Out of Scope

- Caching file content (files are fetched fresh on each preview - performance optimization deferred to future)
- Thumbnail pre-generation from IdRef (thumbnails will load on-demand)
- Batch file retrieval optimization (each file previewed individually)
- File upload/modification functionality (this is purely a retrieval/preview fix)
- Migration of legacy attachments to use IdRef (existing data structure assumed correct)

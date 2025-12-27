# Tasks: Fix SharePoint File Preview via IdRef

**Input**: Design documents from `/specs/004-fix-sharepoint-file-preview/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/file-retrieval-api.md

**Tests**: Not included (manual testing only per specification - no automated tests in MVP scope)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `crm-system/src/CRM.Api/`, `crm-system/src/CRM.Application/`
- **Frontend**: `crm-system-client/src/`
- Paths are absolute from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project structure and prepare for implementation

- [X] T001 Verify backend project structure exists per plan.md (CRM.Api, CRM.Application, CRM.Domain, CRM.Infrastructure layers)
- [X] T002 Verify frontend project structure exists per plan.md (infrastructure/api/, utils/, presentation/components/ directories)
- [X] T003 [P] Verify Shared.ExternalServices library is accessible in crm-system project (ISharepointService interface available)
- [X] T004 [P] Verify existing FilePreviewModal components exist in crm-system-client/src/presentation/components/common/FilePreviewer/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend and frontend infrastructure that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [X] T005 Create FileUrlResponse DTO in crm-system/src/CRM.Application/Dtos/Response/FileUrlResponse.cs
- [X] T006 Create IFileRetrievalService interface in crm-system/src/CRM.Application/Interfaces/Services/IFileRetrievalService.cs
- [X] T007 Implement FileRetrievalService in crm-system/src/CRM.Application/Services/FileRetrievalService.cs
- [X] T008 Create FilesController in crm-system/src/CRM.Api/Controllers/FilesController.cs
- [X] T009 Register IFileRetrievalService in crm-system/src/CRM.Application/DependencyInjection.cs
- [X] T010 Build backend project to verify no compilation errors (dotnet build from crm-system directory)

### Frontend Foundation

- [X] T011 [P] Create filesApi client in crm-system-client/src/infrastructure/api/filesApi.js
- [X] T012 [P] Create filePathUtils utility in crm-system-client/src/utils/filePathUtils.js (SharePoint path detection and URL resolution)
- [ ] T013 Build frontend project to verify no compilation errors (npm run build from crm-system-client directory)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Preview SharePoint-Hosted Files (Priority: P1) 🎯 MVP

**Goal**: Users can preview image and document files stored in SharePoint by clicking preview button, with system correctly retrieving file content using IdRef reference

**Independent Test**: Attach a file to an activity (which stores it in SharePoint), then click the preview icon. The file should load successfully in the preview modal without "Failed to load" errors.

**Acceptance Scenarios**:
1. Image file preview loads successfully
2. PDF file preview renders in iframe
3. Navigation between multiple files works correctly
4. Invalid IdRef shows "File not found" error

### Backend Implementation for User Story 1

- [ ] T014 [US1] Add IdRef format validation in FileRetrievalService.GetFileUrlAsync() method
- [ ] T015 [US1] Implement ISharepointService.ReadFileWithMetaAsync() call in FileRetrievalService
- [ ] T016 [US1] Extract @microsoft.graph.downloadUrl from SharePoint response and map to FileUrlResponse
- [ ] T017 [US1] Add exception handling for FileNotFoundException in FileRetrievalService
- [ ] T018 [US1] Add exception handling for UnauthorizedAccessException in FileRetrievalService
- [ ] T019 [US1] Add exception handling for timeout/generic errors in FileRetrievalService
- [ ] T020 [US1] Implement GET /api/files/{idRef} endpoint in FilesController.GetFileUrl() action
- [ ] T021 [US1] Add [Authorize] attribute to FilesController
- [ ] T022 [US1] Add error response handling in FilesController (400, 404, 403, 504, 500 status codes)
- [ ] T023 [US1] Add Serilog audit logging in FilesController.GetFileUrl() with user email and IdRef
- [ ] T024 [US1] Test backend endpoint with Postman/curl (GET /api/files/{valid-idref} returns 200 OK with signed URL)

### Frontend Implementation for User Story 1

- [ ] T025 [P] [US1] Implement isSharePointPath() function in filePathUtils.js (regex: /^(DEV|PROD|UAT|SANDBOX)\/CRM\//i)
- [ ] T026 [P] [US1] Implement resolveFileUrl() function in filePathUtils.js (Priority: IdRef → Direct URL → Error)
- [ ] T027 [US1] Import filesApi and resolveFileUrl in FilePreviewModal.jsx
- [ ] T028 [US1] Add state for resolvedUrl, urlLoading, urlError in FilePreviewModal.jsx
- [ ] T029 [US1] Add useEffect hook to fetch signed URL when currentDisplayFile changes in FilePreviewModal.jsx
- [ ] T030 [US1] Add loading state UI in FilePreviewModal.jsx (CircularProgress with "Loading file..." message)
- [ ] T031 [US1] Add error state UI in FilePreviewModal.jsx (Alert with error message and Close button)
- [ ] T032 [US1] Pass resolvedUrl prop to ImagePreview component in FilePreviewModal.jsx
- [ ] T033 [US1] Pass resolvedUrl prop to DocumentPreview component in FilePreviewModal.jsx
- [X] T034 [US1] Modify ImagePreview.jsx to accept resolvedUrl prop and use it for image src (const imageUrl = resolvedUrl || file.url || file.fileUrl)
- [X] T035 [US1] Modify DocumentPreview.jsx to accept resolvedUrl prop and use it for iframe src (const documentUrl = resolvedUrl || file.url || file.fileUrl)

### Integration & Testing for User Story 1

- [ ] T036 [US1] Run frontend dev server (npm run dev) and verify no console errors
- [ ] T037 [US1] Manual test: Preview SharePoint image file - verify loads successfully
- [ ] T038 [US1] Manual test: Preview SharePoint PDF file - verify renders in iframe
- [ ] T039 [US1] Manual test: Navigate between multiple attached files - verify each loads correctly
- [ ] T040 [US1] Manual test: Use invalid IdRef - verify "File not found" error shows
- [ ] T041 [US1] Verify Serilog logs contain file retrieval attempts in crm-system/logs/info/ directory
- [ ] T042 [US1] Verify signed URLs actually load files (check Network tab in DevTools)

**Checkpoint**: User Story 1 (SharePoint file preview) should be fully functional

---

## Phase 4: User Story 2 - Backward Compatibility with Direct URLs (Priority: P2)

**Goal**: System maintains backward compatibility with attachments that use direct URLs instead of IdRef, allowing both retrieval methods to coexist

**Independent Test**: Create an attachment with a direct external URL (e.g., a public image URL), then preview it. The system should detect it's not a SharePoint path and load it directly.

**Acceptance Scenarios**:
1. Direct HTTP/HTTPS URLs load without IdRef lookup
2. IdRef attachments use API to fetch file
3. Attachments with both IdRef and URL prioritize IdRef for SharePoint files

### Implementation for User Story 2

- [ ] T043 [US2] Add direct URL detection in resolveFileUrl() - check for /^https?:\/\//i pattern
- [ ] T044 [US2] Add fallback to file.fileUrl field in resolveFileUrl() (for legacy data compatibility)
- [ ] T045 [US2] Add priority logic: IdRef + SharePoint path → API call, Direct URL → return as-is
- [ ] T046 [US2] Manual test: Preview attachment with direct HTTP URL - verify loads without API call (check Network tab)
- [ ] T047 [US2] Manual test: Preview attachment with both IdRef and direct URL - verify IdRef is prioritized
- [ ] T048 [US2] Manual test: Verify existing direct URL attachments still work (backward compatibility check)

**Checkpoint**: Both SharePoint (US1) and direct URL (US2) attachments should work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Error handling improvements, performance validation, and documentation

### Error Handling Enhancements

- [ ] T049 [P] Add specific error message for missing IdRef field in resolveFileUrl() ("File reference not available")
- [ ] T050 [P] Add retry button to error state UI in FilePreviewModal.jsx
- [ ] T051 Add timeout handling for file retrieval (show timeout error after 10 seconds per edge case spec)

### Performance & Security Validation

- [ ] T052 [P] Verify file preview loads within 3 seconds for files under 10MB (test with real SharePoint files)
- [ ] T053 [P] Verify signed URLs expire in ~1 hour (check expiresAt timestamp in API response)
- [ ] T054 Verify IdRef format validation prevents injection attacks (test with malformed IdRef values)
- [ ] T055 Verify JWT authentication works on /api/files/{idRef} endpoint (test with expired token → 401)

### Edge Case Testing

- [ ] T056 Manual test: File deleted from SharePoint - verify "File not found" error shows
- [ ] T057 Manual test: Slow API response - verify loading state shows for up to 10 seconds
- [ ] T058 Manual test: Large file (close to 50MB) - verify size limit check applies after metadata fetch
- [ ] T059 Manual test: Multiple users preview same file - verify independent API calls (no caching)
- [ ] T060 Manual test: Navigate away from file and back after 1 hour - verify new API call fetches fresh URL

### Code Quality & Documentation

- [ ] T061 [P] Run backend linting (dotnet format) and fix any issues
- [ ] T062 [P] Run frontend linting (npm run lint) and fix any issues
- [ ] T063 Review and verify all audit logging includes user email, IdRef, success/failure status
- [ ] T064 Verify CORS headers allow Graph API download URLs to load (check browser console)
- [ ] T065 Code review: Verify all file paths in tasks match actual implementation
- [ ] T066 Run quickstart.md validation checklist (manual testing section)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Phase 2 - No dependencies on other stories
  - User Story 2 (P2): Can start after Phase 2 - Should work independently of US1
- **Polish (Phase 5)**: Depends on US1 and US2 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ MVP
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independently testable (no dependency on US1 completion)

### Within Each User Story

**User Story 1 Dependencies**:
- Backend tasks (T014-T024) can start in parallel with Frontend foundation (T011-T012)
- Frontend tasks (T025-T035) depend on T012 (filePathUtils.js) completion
- Integration tasks (T036-T042) depend on all implementation tasks

**User Story 2 Dependencies**:
- All US2 tasks (T043-T048) depend on US1 frontend implementation (T025-T035) being complete

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks marked [P] can run in parallel (T003, T004)

**Phase 2 (Foundational)**:
- Backend tasks (T005-T010) run sequentially (depend on each other)
- Frontend tasks (T011-T012) marked [P] can run in parallel
- Backend and Frontend foundations can run in parallel

**Phase 3 (User Story 1)**:
- T025 and T026 marked [P] can run in parallel (different functions in same file - only if using separate branches)
- T032 and T033 can run in parallel (different components)
- T034 and T035 can run in parallel (different components)
- Backend testing (T024) and Frontend implementation (T025-T035) can run in parallel

**Phase 5 (Polish)**:
- T049, T050 marked [P] can run in parallel (different concerns)
- T052, T053, T054 marked [P] can run in parallel (different validation checks)
- T061, T062 marked [P] can run in parallel (backend vs frontend linting)

---

## Parallel Example: User Story 1 Backend

```bash
# Launch backend implementation tasks in sequence:
# T014 → T015 → T016 → T017 → T018 → T019 (FileRetrievalService implementation)
# T020 → T021 → T022 → T023 (FilesController implementation)
# T024 (Backend testing)

# Note: These must run sequentially as they modify the same files
```

## Parallel Example: User Story 1 Frontend

```bash
# Launch filePathUtils functions together (if using feature branches):
Task T025: "Implement isSharePointPath() in filePathUtils.js"
Task T026: "Implement resolveFileUrl() in filePathUtils.js"

# Launch component modifications in parallel:
Task T034: "Modify ImagePreview.jsx to accept resolvedUrl prop"
Task T035: "Modify DocumentPreview.jsx to accept resolvedUrl prop"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T013) - **CRITICAL GATE**
3. Complete Phase 3: User Story 1 (T014-T042)
4. **STOP and VALIDATE**: Test SharePoint file preview independently
5. Deploy/demo if ready

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 42 tasks

### Incremental Delivery

1. Complete Setup + Foundational (T001-T013) → Foundation ready
2. Add User Story 1 (T014-T042) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (T043-T048) → Test backward compatibility → Deploy/Demo
4. Polish (T049-T066) → Final validation and cleanup → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup (Phase 1) together
2. Team completes Foundational (Phase 2) together:
   - Developer A: Backend foundation (T005-T010)
   - Developer B: Frontend foundation (T011-T013)
3. Once Foundational is done:
   - Developer A: User Story 1 Backend (T014-T024)
   - Developer B: User Story 1 Frontend (T025-T035)
   - Both: Integration testing (T036-T042)
4. Add User Story 2 (either developer can implement - only 6 tasks)
5. Polish phase (split tasks by [P] markers)

---

## Task Summary

**Total Tasks**: 66

**By Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 9 tasks (6 backend, 3 frontend)
- Phase 3 (User Story 1): 29 tasks (11 backend, 11 frontend, 7 integration)
- Phase 4 (User Story 2): 6 tasks (3 implementation, 3 testing)
- Phase 5 (Polish): 18 tasks (5 error handling, 4 validation, 6 edge cases, 3 code quality)

**By User Story**:
- User Story 1 (SharePoint file preview): 29 tasks
- User Story 2 (Backward compatibility): 6 tasks
- Cross-cutting (Setup + Foundational + Polish): 31 tasks

**Parallel Opportunities**:
- 8 tasks marked [P] can run in parallel within their phases
- Backend and Frontend foundations can run in parallel (Phase 2)
- Backend and Frontend user story work can run in parallel (Phase 3)

**MVP Scope**: 42 tasks (Phase 1-3: User Story 1 only)

**Independent Test Criteria**:
- User Story 1: "Attach file to activity → Preview → File loads without errors"
- User Story 2: "Create direct URL attachment → Preview → Loads without API call"

---

## Notes

- [P] tasks = different files or independent concerns, no dependencies
- [US1]/[US2] labels map task to specific user story for traceability
- Each user story should be independently completable and testable
- No automated tests in this feature (manual testing only per spec)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths are exact and match plan.md structure
- Backend changes: 5 new files, 1 modification
- Frontend changes: 2 new files, 3 modifications

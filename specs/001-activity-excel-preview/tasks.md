# Tasks: Activity Excel File Preview

**Input**: Design documents from `/specs/001-activity-excel-preview/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are NOT requested in this specification. Focus is on implementation and manual testing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `crm-system-client/src/`
- **Backend**: `crm-system/src/CRM.Api/`
- Paths follow established project structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and prepare development environment

- [X] T001 [P] Install SheetJS library in crm-system-client/package.json (`npm install xlsx`)
- [X] T002 [P] Install react-window library in crm-system-client/package.json (`npm install react-window`)
- [X] T003 [P] Verify .NET MemoryCache is available (built-in to .NET 8, no package needed)
- [X] T004 Create test Excel files directory at crm-system-client/test-files/excel/ with sample files per quickstart.md

**Checkpoint**: Dependencies installed, ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and file detection logic that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Update FileCategory enum in crm-system-client/src/utils/fileUtils.js to add EXCEL category
- [X] T006 [P] Add Excel file extensions (.xlsx, .xls, .xlsm, .xlsb) to FILE_EXTENSIONS map in crm-system-client/src/utils/fileUtils.js
- [X] T007 [P] Add Excel MIME types to MIME_TYPES map in crm-system-client/src/utils/fileUtils.js
- [X] T008 Update shouldSkipPreview() function in crm-system-client/src/utils/fileUtils.js to enforce 20MB limit for Excel files (FR-009)
- [X] T009 Update getFileCategory() function in crm-system-client/src/utils/fileUtils.js to properly detect Excel files from extension and MIME type
- [X] T010 Add validateExcelPreview() function in crm-system-client/src/utils/fileUtils.js for client-side file size and format validation

**Checkpoint**: Foundation ready - File detection works for Excel files, user story implementation can now begin

---

## Phase 3: User Story 1 - View Excel File Content Inline (Priority: P1) 🎯 MVP

**Goal**: Users can preview Excel files (.xlsx and .xls) in a modal/dialog overlay with visible cells, rows, columns, headers, and multi-sheet navigation

**Independent Test**: Attach an Excel file (.xlsx or .xls) to any activity record, open the activity detail page, click preview button, verify Excel content renders in modal with sheet tabs and scrollable grid

### Implementation for User Story 1

#### Core ExcelPreview Component

- [ ] T011 [P] [US1] Create ExcelPreview.jsx component skeleton in crm-system-client/src/presentation/components/common/FilePreviewer/ExcelPreview.jsx with props interface (file, onDownload, onError)
- [ ] T012 [P] [US1] Create excelPreviewStyles.js in crm-system-client/src/presentation/components/common/FilePreviewer/ for component-specific styles
- [ ] T013 [US1] Implement loadExcelFile() function in ExcelPreview.jsx to fetch binary content via filesApi.getFileContent(idRef)
- [ ] T014 [US1] Add SheetJS parsing logic in ExcelPreview.jsx using XLSX.read(arrayBuffer, {type: 'array'})
- [ ] T015 [US1] Implement file validation in ExcelPreview.jsx (20MB size check, magic bytes verification per data-model.md)
- [ ] T016 [US1] Add error boundary in ExcelPreview.jsx with user-friendly error messages (corrupted file, password-protected, invalid format)
- [ ] T017 [US1] Add loading state with CircularProgress spinner in ExcelPreview.jsx while file fetches and parses

#### Sheet Data Parsing and State Management

- [ ] T018 [US1] Implement parsedSheets state using useMemo in ExcelPreview.jsx to cache sheet data and prevent re-parsing
- [ ] T019 [US1] Add sheet data truncation logic in ExcelPreview.jsx (FR-010: limit to first 10,000 rows for large files)
- [ ] T020 [US1] Create getCurrentSheetData() function in ExcelPreview.jsx to get data for currently selected sheet
- [ ] T021 [US1] Add truncation warning Alert in ExcelPreview.jsx when displaying partial preview ("Showing first 10,000 rows...")

#### Multi-Sheet Navigation

- [ ] T022 [US1] Implement Material-UI Tabs component in ExcelPreview.jsx for sheet navigation
- [ ] T023 [US1] Add currentSheetIndex state and onChange handler in ExcelPreview.jsx to track selected sheet
- [ ] T024 [US1] Map workbook.SheetNames to Tab components in ExcelPreview.jsx with proper key props

#### Virtualized Grid Rendering

- [ ] T025 [US1] Implement react-window FixedSizeList in ExcelPreview.jsx for row virtualization
- [ ] T026 [US1] Create Row renderer component in ExcelPreview.jsx to display cell data with proper formatting
- [ ] T027 [US1] Add cell styling in ExcelPreview.jsx (Box components with borders, padding, text overflow handling)
- [ ] T028 [US1] Configure FixedSizeList dimensions in ExcelPreview.jsx (height: 500px, itemSize: 40px per research.md)
- [ ] T029 [US1] Add horizontal overflow handling in ExcelPreview.jsx for wide spreadsheets (scrollable container)

#### Integration with FilePreviewModal

- [ ] T030 [US1] Update FilePreviewModal.jsx to import ExcelPreview component with React.lazy() for code splitting
- [ ] T031 [US1] Add FileCategory.EXCEL case to renderPreview() switch statement in FilePreviewModal.jsx
- [ ] T032 [US1] Wrap ExcelPreview in Suspense with fallback in FilePreviewModal.jsx
- [ ] T033 [US1] Update DocumentPreview.jsx to route Excel files to ExcelPreview instead of showing unsupported message

#### Responsive Design and Mobile Support

- [ ] T034 [US1] Add useMediaQuery hook in ExcelPreview.jsx to detect mobile devices (theme.breakpoints.down('sm'))
- [ ] T035 [US1] Implement responsive row height adjustment in ExcelPreview.jsx for mobile (smaller itemSize on touch devices)
- [ ] T036 [US1] Add touch-friendly tap targets for sheet tabs in ExcelPreview.jsx (minHeight: 48px per Material-UI guidelines)
- [ ] T037 [US1] Update Modal Dialog in FilePreviewModal.jsx to use fullScreen prop on mobile for Excel previews

#### Error Handling and Edge Cases

- [ ] T038 [US1] Add error state and error message display in ExcelPreview.jsx with appropriate icons and actions
- [ ] T039 [US1] Implement retry logic in ExcelPreview.jsx for failed file fetches
- [ ] T040 [US1] Add empty file check in ExcelPreview.jsx (handle 0-row Excel files gracefully)
- [ ] T041 [US1] Handle SheetJS parsing errors in ExcelPreview.jsx try-catch blocks with specific error messages

**Checkpoint**: At this point, User Story 1 should be fully functional - Excel files preview in modal with sheets, scrolling, and mobile support

---

## Phase 4: User Story 2 - Download Excel Files (Priority: P2)

**Goal**: Users can download the original Excel file from the preview modal to perform advanced analysis or offline work

**Independent Test**: Open any Excel file preview, click download button, verify file downloads with original filename and opens successfully in Microsoft Excel

### Implementation for User Story 2

- [X] T042 [P] [US2] Add Download button to ExcelPreview.jsx using Material-UI IconButton with DownloadIcon
- [X] T043 [P] [US2] Position download button in ExcelPreview.jsx header/toolbar area (top-right corner of preview)
- [X] T044 [US2] Implement handleDownload() function in ExcelPreview.jsx that calls onDownload prop callback
- [X] T045 [US2] Update FilePreviewModal.jsx to pass handleDownload callback to ExcelPreview component
- [X] T046 [US2] Add download tooltip in ExcelPreview.jsx ("Download original Excel file")
- [X] T047 [US2] Verify download preserves original filename in ExcelPreview.jsx/FilePreviewModal.jsx integration
- [X] T048 [US2] Test download functionality works from error state in ExcelPreview.jsx (fallback option when preview fails)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - Preview + Download functionality complete

---

## Phase 5: User Story 3 - Handle Unsupported Excel Features Gracefully (Priority: P3)

**Goal**: Users see clear warnings when Excel files contain advanced features (charts, macros, formulas) that don't render in preview

**Independent Test**: Upload Excel files with charts, macros, and pivot tables, verify preview shows warnings and suggests downloading for full features

### Implementation for User Story 3

- [X] T049 [P] [US3] Create detectUnsupportedFeatures() function in ExcelPreview.jsx to analyze workbook for charts, macros, pivot tables
- [X] T050 [P] [US3] Add warnings state array in ExcelPreview.jsx to track detected unsupported features
- [X] T051 [US3] Implement macro detection in ExcelPreview.jsx (check workbook.vbaProject existence)
- [X] T052 [US3] Implement chart detection in ExcelPreview.jsx (check worksheet['!charts'] property per research.md)
- [X] T053 [US3] Implement pivot table detection in ExcelPreview.jsx (check worksheet['!pivots'] property)
- [X] T054 [US3] Implement external link detection in ExcelPreview.jsx (check workbook.Workbook.ExternalReferences)
- [X] T055 [US3] Add Material-UI Alert component in ExcelPreview.jsx to display warnings with WarningIcon
- [X] T056 [US3] Create warning messages in ExcelPreview.jsx for each unsupported feature type:
  - "Charts are not supported in preview. Download the file to view all content."
  - "This file contains macros that will not execute in preview mode."
  - "Pivot tables are not fully supported in preview."
  - "External links may not display correctly."
- [X] T057 [US3] Add download button link in warning messages in ExcelPreview.jsx for easy access to full file
- [X] T058 [US3] Style warning Alert in ExcelPreview.jsx with severity="warning" and proper spacing

**Checkpoint**: All user stories should now be independently functional - Preview, Download, and Warnings all work

---

## Phase 6: Backend - Server-Side Caching (Performance Enhancement)

**Goal**: Improve performance for repeated Excel file access with server-side caching (15-minute expiration per FR-017)

**Independent Test**: Preview same Excel file twice, verify second preview is significantly faster (cache hit), check X-Cache-Hit header

### Implementation for Backend Caching

- [X] T059 [P] Create ExcelPreviewCacheMiddleware.cs in crm-system/src/CRM.Api/Middleware/ with RequestDelegate and IMemoryCache dependencies
- [X] T060 [P] Create ExcelPreviewCacheOptions.cs in crm-system/src/CRM.Api/Configuration/ with MaxCacheSizeBytes, SlidingExpiration, CompactionPercentage properties
- [X] T061 Add InvokeAsync() method in ExcelPreviewCacheMiddleware.cs to intercept /api/files/{idRef}/content requests
- [X] T062 Implement cache key generation in ExcelPreviewCacheMiddleware.cs using format "excel_preview_{idRef}_{userId}" per data-model.md
- [X] T063 Add cache hit logic in ExcelPreviewCacheMiddleware.cs with TryGetValue() and X-Cache-Hit: true header
- [X] T064 Add cache miss logic in ExcelPreviewCacheMiddleware.cs to call next middleware and capture response
- [X] T065 Implement cache Set() in ExcelPreviewCacheMiddleware.cs with MemoryCacheEntryOptions (15-minute sliding expiration, size tracking)
- [X] T066 Add PostEvictionCallback in ExcelPreviewCacheMiddleware.cs for logging cache evictions
- [X] T067 Register MemoryCache in Program.cs with options (SizeLimit: 100MB, CompactionPercentage: 0.25)
- [X] T068 Register ExcelPreviewCacheMiddleware in Program.cs before app.UseAuthentication()
- [X] T069 Add Serilog logging in ExcelPreviewCacheMiddleware.cs for cache hits/misses (NFR-001)
- [X] T070 Add Serilog logging in ExcelPreviewCacheMiddleware.cs for cache evictions and performance metrics (NFR-003)

**Checkpoint**: Server-side caching complete - Repeat previews significantly faster (500ms vs 2-3 seconds)

---

## Phase 7: Backend - Enhanced Logging and Monitoring

**Goal**: Comprehensive logging for Excel preview attempts, errors, and performance metrics (NFR-001, NFR-002, NFR-003)

**Independent Test**: Preview Excel files (success and failures), check Serilog logs contain preview attempts, errors with metadata, and performance timings

### Implementation for Logging

- [X] T071 [P] Add preview attempt logging in FileRetrievalService.cs when Excel files are retrieved (log idRef, fileName, fileSize, userId, timestamp)
- [X] T072 [P] Add error logging in FileRetrievalService.cs for SharePoint retrieval failures (log idRef, error type, stack trace per data-model.md)
- [X] T073 Add file size validation logging in FilesController.cs when files exceed 20MB (log rejection with FR-009 reference)
- [X] T074 Add performance metrics logging in ExcelPreviewCacheMiddleware.cs (log processing time, render time, cache status)
- [X] T075 Update Serilog configuration in Program.cs to include Excel preview context properties (IdRef, FileName, FileSize)
- [X] T076 Add structured logging for cache statistics in ExcelPreviewCacheMiddleware.cs (cache hit rate, eviction count)

**Checkpoint**: Comprehensive logging in place - Operations team can monitor Excel preview usage and troubleshoot issues

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and validation

- [X] T077 [P] Run npm run lint in crm-system-client and fix any linting errors in ExcelPreview.jsx and fileUtils.js
- [X] T078 [P] Run npm run prettier in crm-system-client to format all modified files
- [X] T079 [P] Run dotnet build in crm-system to verify backend compiles without errors
- [X] T080 [P] Add JSDoc comments to exported functions in ExcelPreview.jsx and fileUtils.js
- [X] T081 [P] Add XML documentation comments to public methods in ExcelPreviewCacheMiddleware.cs
- [X] T082 Update crm-system-client/README.md with Excel preview feature description and usage instructions
- [X] T083 Update crm-system/README.md with cache middleware configuration documentation
- [~] T084 Verify all acceptance scenarios from spec.md pass manually using quickstart.md test checklist
- [~] T085 Test Excel preview on mobile device (tablet and phone) per quickstart.md mobile testing section
- [~] T086 Test Excel preview with sample files from crm-system-client/test-files/excel/ directory
- [~] T087 Verify performance targets met per spec.md Success Criteria (SC-001 through SC-010)
- [~] T088 Test error handling with corrupted, password-protected, and oversized Excel files
- [~] T089 Verify cache expiration works correctly (15-minute sliding window)
- [~] T090 Test concurrent user access to same Excel file (verify independent cache entries per data-model.md)
- [X] T091 [P] Code cleanup: Remove any console.log statements from ExcelPreview.jsx
- [X] T092 [P] Code cleanup: Remove any TODO comments from implementation files
- [~] T093 Final build verification: npm run build in crm-system-client succeeds without warnings
- [~] T094 Final build verification: dotnet build -c Release in crm-system succeeds

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) completion (builds on preview functionality)
- **User Story 3 (Phase 5)**: Depends on User Story 1 (Phase 3) completion (enhances preview with warnings)
- **Backend Caching (Phase 6)**: Can start in parallel with User Story 2/3, depends only on Phase 2
- **Backend Logging (Phase 7)**: Depends on Backend Caching (Phase 6) completion
- **Polish (Phase 8)**: Depends on all feature phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core preview functionality, no dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 - Download button integrates with preview modal
- **User Story 3 (P3)**: Depends on User Story 1 - Warnings are shown within preview component
- **Backend Caching**: Independent of user stories, can be implemented in parallel with US2/US3

### Within Each User Story

**User Story 1 (Excel Preview)**:
1. Component skeleton and styles (T011, T012) - parallel
2. File loading and parsing (T013-T017) - sequential
3. Sheet parsing and state (T018-T021) - sequential after parsing
4. Sheet navigation UI (T022-T024) - parallel with virtualization
5. Grid rendering (T025-T029) - sequential
6. Modal integration (T030-T033) - sequential
7. Mobile responsive (T034-T037) - parallel
8. Error handling (T038-T041) - parallel

**User Story 2 (Download)**:
- All tasks can run in parallel (different UI areas)

**User Story 3 (Warnings)**:
- Detection logic (T049-T054) - parallel
- Warning UI (T055-T058) - sequential after detection

**Backend Caching**:
- Middleware skeleton (T059-T060) - parallel
- Cache logic (T061-T068) - sequential
- Logging (T069-T070) - parallel

### Parallel Opportunities

Within phases, tasks marked [P] can run concurrently:

**Setup (Phase 1)**: All 4 tasks can run in parallel
**Foundational (Phase 2)**: T005, T006, T007 can run in parallel
**User Story 1**: T011+T012 parallel, T022+T023+T024 parallel, T034+T035+T036+T037 parallel, T038+T039+T040+T041 parallel
**User Story 2**: All 7 tasks can run in parallel (different concerns)
**User Story 3**: T049+T050+T051+T052+T053+T054 parallel
**Backend Caching**: T059+T060 parallel, T069+T070 parallel
**Backend Logging**: All 6 tasks can run in parallel
**Polish**: Most tasks can run in parallel (different files/concerns)

---

## Parallel Example: User Story 1 Core Implementation

```bash
# Launch component skeleton and parsing logic together:
Task T011: "Create ExcelPreview.jsx component skeleton"
Task T012: "Create excelPreviewStyles.js"

# After parsing is done, launch UI tasks together:
Task T022: "Implement Material-UI Tabs for sheet navigation"
Task T025: "Implement react-window FixedSizeList for virtualization"
Task T034: "Add useMediaQuery hook for mobile detection"

# Launch all error handling tasks together:
Task T038: "Add error state and error message display"
Task T039: "Implement retry logic for failed fetches"
Task T040: "Add empty file check"
Task T041: "Handle SheetJS parsing errors"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1: Setup** (T001-T004) - ~30 minutes
2. Complete **Phase 2: Foundational** (T005-T010) - ~1 hour
3. Complete **Phase 3: User Story 1** (T011-T041) - ~6-8 hours
4. **STOP and VALIDATE**: Test US1 independently using quickstart.md checklist
5. Deploy/demo Excel preview functionality (core value delivered!)

**Estimated MVP Time**: 8-10 hours

### Incremental Delivery

1. **Foundation** (Phases 1-2) → File detection ready - ~1.5 hours
2. **Add User Story 1** (Phase 3) → Core Excel preview works - ~6-8 hours → **Deploy MVP!**
3. **Add User Story 2** (Phase 4) → Download button added - ~1 hour → Deploy update
4. **Add User Story 3** (Phase 5) → Warnings for advanced features - ~2 hours → Deploy update
5. **Add Backend Caching** (Phase 6) → Performance boost - ~3 hours → Deploy update
6. **Add Logging** (Phase 7) → Monitoring enabled - ~1 hour
7. **Polish** (Phase 8) → Production-ready - ~2 hours → **Final deploy**

**Total Estimated Time**: 16-20 hours for complete feature

### Parallel Team Strategy

With 2 developers working concurrently:

**Week 1 - Foundation + Core Preview**:
- Both: Complete Setup + Foundational together (Day 1)
- Dev A: User Story 1 - Core preview (Days 2-3)
- Dev B: Backend Caching setup (Day 2), then assist with US1 testing (Day 3)

**Week 2 - Enhancements + Polish**:
- Dev A: User Story 2 + User Story 3 (Days 1-2)
- Dev B: Backend Logging + Cache testing (Days 1-2)
- Both: Polish together (Day 3)

**Parallel Completion Time**: ~10-12 hours with 2 developers

---

## Task Summary

**Total Tasks**: 94
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 6 tasks
- Phase 3 (User Story 1): 31 tasks
- Phase 4 (User Story 2): 7 tasks
- Phase 5 (User Story 3): 10 tasks
- Phase 6 (Backend Caching): 12 tasks
- Phase 7 (Backend Logging): 6 tasks
- Phase 8 (Polish): 18 tasks

**Parallel Opportunities**: 45 tasks marked [P] can run concurrently

**MVP Scope**: Phases 1-3 (41 tasks) delivers core Excel preview functionality

**Independent Test Criteria**:
- **US1**: Preview Excel files in modal with sheets and scrolling
- **US2**: Download button works from preview
- **US3**: Warnings display for files with charts/macros
- **Caching**: Second preview of same file is 80%+ faster
- **Logging**: All preview attempts logged with metadata

---

## Notes

- All file paths are absolute and follow established project structure
- [P] tasks work on different files and can run in parallel
- [US1], [US2], [US3] labels map tasks to user stories for traceability
- Each user story delivers independent, testable value
- Backend work (Phases 6-7) can proceed in parallel with frontend User Stories 2-3
- Stop at any checkpoint to validate independently before continuing
- Commit frequently after completing logical groups of tasks
- Use quickstart.md testing checklist to validate each user story
- Prioritize MVP (User Story 1) for fastest time-to-value

---

**Ready for Implementation**: ✅ All tasks defined with clear dependencies and parallel execution strategy

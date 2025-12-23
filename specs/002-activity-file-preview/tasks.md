---
description: "Task list for Activity File Preview implementation"
---

# Tasks: Activity File Preview

**Input**: Design documents from `/specs/002-activity-file-preview/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No test tasks included (frontend testing framework not yet configured per constitution)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Web application (frontend only)
- **Base path**: `crm-system-client/src/`
- **Component path**: `presentation/components/common/FilePreviewer/`
- **Utility path**: `utils/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create utility functions and shared infrastructure needed by all user stories

- [X] T001 [P] Create file type detection utilities in `crm-system-client/src/utils/fileUtils.js` (getFileCategory, isPreviewable, FileCategory enum)
- [X] T002 [P] Create file size formatting utility in `crm-system-client/src/utils/fileUtils.js` (formatFileSize function)
- [X] T003 [P] Create file size checking utility in `crm-system-client/src/utils/fileUtils.js` (shouldSkipPreview function for 50MB limit)
- [X] T004 [P] Create file extension extraction utility in `crm-system-client/src/utils/fileUtils.js` (getFileExtension function)
- [X] T005 Create FilePreviewer directory structure in `crm-system-client/src/presentation/components/common/FilePreviewer/`

**Checkpoint**: Utility functions ready for use by all preview components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core modal container that MUST be complete before ANY user story preview components can be implemented

**⚠️ CRITICAL**: No user story preview components can function until this phase is complete

- [X] T006 Create FilePreviewModal container component shell in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (MUI Dialog with basic structure)
- [X] T007 Implement modal state management in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (currentIndex, loading, error, zoomLevel, position)
- [X] T008 Implement file type routing logic in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (switch between preview components based on FileCategory)
- [X] T009 Implement modal navigation controls in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (next/previous arrows, disabled states)
- [X] T010 Implement keyboard shortcuts handler in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (ESC to close, arrow keys for navigation)
- [X] T011 Implement modal header in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (file name, metadata, close button)
- [X] T012 Implement modal footer in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (download button, file counter, zoom controls placeholder)
- [X] T013 Implement error states in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (no files, null file, missing URL, unsupported type, too large)
- [X] T014 Implement loading states in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (CircularProgress, LinearProgress for file changes)
- [X] T015 Implement responsive behavior in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (fullScreen on mobile, breakpoint detection)
- [X] T016 Implement accessibility features in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (ARIA attributes, focus management, screen reader announcements)

**Checkpoint**: FilePreviewModal container ready - user story preview components can now be integrated

---

## Phase 3: User Story 1 - Preview Image Files Inline (Priority: P1) 🎯 MVP

**Goal**: Users can preview image attachments directly within the activity feed with zoom, pan, and navigation controls

**Independent Test**: Attach PNG/JPG/GIF/SVG/WebP image files to an activity, click attachment, verify modal opens with full-size image, test zoom in/out/reset, test panning when zoomed, navigate between multiple images with arrows, press ESC to close

### Implementation for User Story 1

- [X] T017 [P] [US1] Create ImagePreview component shell in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (basic structure with MUI Box container)
- [X] T018 [P] [US1] Implement image loading handlers in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (onLoad, onError, imageLoaded state, naturalSize state)
- [X] T019 [US1] Implement image zoom controls in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (zoom in/out/reset buttons, zoom state from parent)
- [X] T020 [US1] Implement image zoom rendering in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (CSS transform: scale, transition effects)
- [X] T021 [US1] Implement image pan state management in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (dragging state, dragStart position)
- [X] T022 [US1] Implement mouse drag handlers in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (mouseDown, mouseMove, mouseUp for panning)
- [X] T023 [US1] Implement pan rendering in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (CSS transform: translate, cursor states grab/grabbing)
- [X] T024 [US1] Implement double-click zoom toggle in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (toggle between 1x and 2x zoom)
- [X] T025 [US1] Implement zoom keyboard shortcuts in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (+/- keys for zoom, 0 key for reset)
- [X] T026 [US1] Implement image error state in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (BrokenImageIcon, error message, retry button)
- [X] T027 [US1] Implement image loading state in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (CircularProgress spinner with loading message)
- [X] T028 [US1] Implement zoom controls toolbar in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (zoom out button, percentage chip, zoom in button)
- [X] T029 [US1] Add ImagePreview accessibility in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (ARIA labels, role="img", screen reader instructions)
- [X] T030 [US1] Integrate ImagePreview into FilePreviewModal in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (render ImagePreview when FileCategory.IMAGE)
- [X] T031 [US1] Add preview trigger to ActivityAttachmentList in `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityAttachmentList.jsx` (preview icon button, handlePreviewClick)
- [X] T032 [US1] Add FilePreviewModal to ActivityAttachmentList in `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityAttachmentList.jsx` (state management, modal integration)
- [X] T033 [US1] Add file size warning snackbar in `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityAttachmentList.jsx` (Alert for files >50MB)

**Checkpoint**: At this point, User Story 1 (Image Preview) should be fully functional - users can preview images with zoom/pan in activity feed

---

## Phase 4: User Story 2 - Preview Document Files (Priority: P2)

**Goal**: Users can preview PDF, TXT, and CSV files directly within the application without downloading

**Independent Test**: Attach PDF/TXT/CSV files to activities, click attachment, verify PDF renders in iframe with browser controls, verify text files display with correct formatting, test scrolling through documents, verify large file warning, test download fallback

### Implementation for User Story 2

- [X] T034 [P] [US2] Create DocumentPreview component shell in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (basic structure with conditional rendering)
- [X] T035 [P] [US2] Implement PDF viewer in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (iframe with sandbox attribute, PDF-specific props)
- [X] T036 [P] [US2] Implement PDF loading handlers in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (iframe load/error events, 10-second timeout)
- [X] T037 [US2] Implement PDF error state in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (PictureAsPdfIcon, error message, download button)
- [X] T038 [US2] Implement PDF loading state in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (CircularProgress with "Loading PDF" message)
- [X] T039 [P] [US2] Implement text file fetcher in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (fetch API, text content state, error handling)
- [X] T040 [US2] Implement text file renderer in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (pre element with monospace font, wrapText prop, fontSize prop)
- [X] T041 [US2] Implement text file error state in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (Alert with error message, retry button)
- [X] T042 [US2] Implement text file loading state in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (CircularProgress with "Fetching file content" message)
- [X] T043 [US2] Add CSV rendering support in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (display as formatted text, table rendering deferred to future)
- [X] T044 [US2] Add DocumentPreview accessibility in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx` (ARIA labels for iframe and text, tabIndex for keyboard focus)
- [X] T045 [US2] Integrate DocumentPreview into FilePreviewModal in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (render DocumentPreview when FileCategory.PDF or FileCategory.TEXT)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can preview images AND documents

---

## Phase 5: User Story 3 - Quick Thumbnail Previews (Priority: P3)

**Goal**: Users see small thumbnail previews of image attachments directly in activity feed cards for faster identification

**Independent Test**: View activity feed with image attachments, verify 64x64px thumbnails display in expanded cards, verify loading spinner shows while thumbnail loads, click thumbnail to verify full preview opens, test with various image formats

### Implementation for User Story 3

- [X] T046 [P] [US3] Create ThumbnailGenerator component shell in `crm-system-client/src/presentation/components/common/FilePreviewer/ThumbnailGenerator.jsx` (basic structure with MUI Box)
- [X] T047 [P] [US3] Implement thumbnail image rendering in `crm-system-client/src/presentation/components/common/FilePreviewer/ThumbnailGenerator.jsx` (img element with object-fit: cover, lazy loading)
- [X] T048 [US3] Implement thumbnail click handler in `crm-system-client/src/presentation/components/common/FilePreviewer/ThumbnailGenerator.jsx` (onClick prop callback with file parameter)
- [X] T049 [US3] Implement thumbnail loading state in `crm-system-client/src/presentation/components/common/FilePreviewer/ThumbnailGenerator.jsx` (loading spinner placeholder before image loads)
- [X] T050 [US3] Implement thumbnail fallback icon in `crm-system-client/src/presentation/components/common/FilePreviewer/ThumbnailGenerator.jsx` (InsertDriveFileIcon when image fails to load)
- [X] T051 [US3] Implement thumbnail variants in `crm-system-client/src/presentation/components/common/FilePreviewer/ThumbnailGenerator.jsx` (square, rounded, circular border styles)
- [X] T052 [US3] Implement optional file name display in `crm-system-client/src/presentation/components/common/FilePreviewer/ThumbnailGenerator.jsx` (showFileName prop with Typography below thumbnail)
- [X] T053 [US3] Add ThumbnailGenerator accessibility in `crm-system-client/src/presentation/components/common/FilePreviewer/ThumbnailGenerator.jsx` (alt text, ARIA label, keyboard navigation)
- [X] T054 [US3] Integrate ThumbnailGenerator into ActivityAttachmentList in `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityAttachmentList.jsx` (replace file icon with thumbnail for image files)
- [X] T055 [US3] Update ActivityAttachmentList styling in `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityAttachmentList.jsx` (layout adjustments for thumbnails)

**Checkpoint**: All user stories should now be independently functional - users can preview images with zoom/pan, preview documents, and see thumbnails in feed

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall code quality

- [ ] T056 [P] Add PropTypes validation to FilePreviewModal in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx`
- [ ] T057 [P] Add PropTypes validation to ImagePreview in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx`
- [ ] T058 [P] Add PropTypes validation to DocumentPreview in `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx`
- [ ] T059 [P] Add PropTypes validation to ThumbnailGenerator in `crm-system-client/src/presentation/components/common/FilePreviewer/ThumbnailGenerator.jsx`
- [ ] T060 [P] Add JSDoc comments to fileUtils.js in `crm-system-client/src/utils/fileUtils.js` (document all utility functions)
- [ ] T061 [P] Optimize ImagePreview performance in `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx` (React.memo, useMemo for computed values)
- [ ] T062 [P] Optimize FilePreviewModal performance in `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx` (lazy load preview components, code splitting)
- [ ] T063 Code cleanup and formatting in `crm-system-client/src/presentation/components/common/FilePreviewer/` (run prettier, fix linting issues)
- [ ] T064 Run manual testing checklist from `specs/002-activity-file-preview/quickstart.md` (verify all test scenarios pass)
- [ ] T065 [P] Update CLAUDE.md documentation in `CLAUDE.md` (add file preview component usage examples)
- [ ] T066 Verify responsive behavior on mobile devices (test fullscreen modals, touch events, orientation changes)
- [ ] T067 [P] Verify cross-browser compatibility (test in Chrome, Firefox, Safari, Edge per success criteria)
- [ ] T068 Performance validation (verify 2-second preview load, 3-second thumbnail load per success criteria)
- [ ] T069 Accessibility validation (verify keyboard navigation, screen readers, ARIA attributes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (Image Preview) can start after Foundational phase
  - User Story 2 (Document Preview) can start after Foundational phase - **Independent of US1**
  - User Story 3 (Thumbnails) can start after Foundational phase - **Integrates with US1 but independently testable**
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Image Preview)**: Can start after Foundational (Phase 2) - **No dependencies on other stories**
- **User Story 2 (P2 - Document Preview)**: Can start after Foundational (Phase 2) - **No dependencies on other stories** (completely independent modal rendering)
- **User Story 3 (P3 - Thumbnails)**: Can start after Foundational (Phase 2) - **Works with US1 components but independently testable** (thumbnails can exist without full preview, clicking just needs file category detection)

### Within Each User Story

**User Story 1** (Image Preview):
- T017-T018 (component shell, loading handlers) can run in parallel
- T019-T020 (zoom controls and rendering) depends on T017
- T021-T023 (pan state and handlers) depends on T017
- T024-T025 (double-click, keyboard) depends on T019
- T026-T027 (error/loading states) can run in parallel with each other
- T028 (zoom toolbar) depends on T019
- T029 (accessibility) depends on T017-T028
- T030 (modal integration) depends on T029 complete
- T031-T033 (activity feed integration) depends on T030 complete

**User Story 2** (Document Preview):
- T034-T036 (PDF shell, viewer, handlers) can run in parallel
- T037-T038 (PDF error/loading) can run in parallel with each other
- T039-T040 (text fetcher, renderer) can run in parallel
- T041-T042 (text error/loading) can run in parallel with each other
- T043 (CSV support) depends on T040
- T044 (accessibility) depends on T034-T043
- T045 (modal integration) depends on T044 complete

**User Story 3** (Thumbnails):
- T046-T047 (component shell, rendering) can run in parallel
- T048-T050 (click handler, loading, fallback) can run in parallel with each other
- T051-T052 (variants, file name) can run in parallel with each other
- T053 (accessibility) depends on T046-T052
- T054-T055 (activity feed integration) depends on T053 complete

### Parallel Opportunities

- **Setup (Phase 1)**: All tasks T001-T004 can run in parallel (different utility functions)
- **Foundational (Phase 2)**: Some tasks within modal can be parallelized but many are sequential due to component structure
- **After Foundational completes**: All three user stories can start in parallel (if team capacity allows)
  - Developer A: User Story 1 (T017-T033)
  - Developer B: User Story 2 (T034-T045)
  - Developer C: User Story 3 (T046-T055)
- **Polish (Phase 6)**: Most tasks T056-T060, T061-T062, T065, T067 can run in parallel

---

## Parallel Example: User Story 1 (Image Preview)

```bash
# After completing FilePreviewModal container, launch these in parallel:

# Component shell and loading
Task: "Create ImagePreview component shell in crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx"
Task: "Implement image loading handlers in crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx"

# After shell is ready, these can go in parallel:
Task: "Implement image error state in crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx"
Task: "Implement image loading state in crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx"
```

## Parallel Example: User Story 2 (Document Preview)

```bash
# After completing FilePreviewModal container, launch these in parallel:

# PDF components
Task: "Create DocumentPreview component shell in crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx"
Task: "Implement PDF viewer in crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx"
Task: "Implement PDF loading handlers in crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx"

# After PDF basics ready, these can go in parallel:
Task: "Implement PDF error state in crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx"
Task: "Implement PDF loading state in crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx"

# Text components (can start in parallel with PDF work)
Task: "Implement text file fetcher in crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx"
Task: "Implement text file renderer in crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - Recommended Approach

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T016) - **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (T017-T033)
4. **STOP and VALIDATE**: Test image preview independently per spec acceptance scenarios
5. Demo to stakeholders - **deliverable MVP** with core value
6. Decision point: Ship MVP or continue to P2/P3

**Estimated completion**: ~40 tasks for fully functional image preview feature

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T016)
2. Add User Story 1 → Test independently → Deploy/Demo (T017-T033) - **MVP: Image Preview** 🎯
3. Add User Story 2 → Test independently → Deploy/Demo (T034-T045) - **V2: + Document Preview**
4. Add User Story 3 → Test independently → Deploy/Demo (T046-T055) - **V3: + Thumbnails**
5. Polish (T056-T069) - **V4: Production-ready**
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

1. Team completes Setup + Foundational together (T001-T016)
2. Once Foundational is done:
   - **Developer A**: User Story 1 - Image Preview (T017-T033)
   - **Developer B**: User Story 2 - Document Preview (T034-T045)
   - **Developer C**: User Story 3 - Thumbnails (T046-T055)
3. Stories complete and integrate independently
4. Team converges on Polish (T056-T069)

---

## Task Count Summary

- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 11 tasks
- **Phase 3 (User Story 1 - Image Preview)**: 17 tasks 🎯
- **Phase 4 (User Story 2 - Document Preview)**: 12 tasks
- **Phase 5 (User Story 3 - Thumbnails)**: 10 tasks
- **Phase 6 (Polish)**: 14 tasks

**Total**: 69 tasks

**MVP Scope** (P1 only): 33 tasks (Setup + Foundational + US1)
**P1+P2 Scope**: 45 tasks (+ Document Preview)
**Full Feature**: 69 tasks (All stories + Polish)

---

## Notes

- [P] tasks = different files/functions, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No test tasks included (frontend testing framework not configured per constitution)
- Manual testing required per quickstart.md checklist
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Zero additional npm dependencies** - all features use native browser APIs + existing MUI
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

# Tasks: Add Contract Activity Type

**Input**: Design documents from `/specs/005-contract-activity/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested - Manual testing will be performed per quickstart.md checklist

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with:
- **Backend**: `crm-system/src/`
- **Frontend**: `crm-system-client/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Development environment preparation

- [X] T001 Verify development branch 005-contract-activity is checked out
- [X] T002 [P] Verify backend builds successfully: `cd crm-system && dotnet restore && dotnet build`
- [X] T003 [P] Verify frontend builds successfully: `cd crm-system-client && npm install && npm run build`

**Estimated Time**: 5 minutes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema update that MUST be complete before backend/frontend changes

**⚠️ CRITICAL**: This phase blocks all user story work - database ENUM must be updated first

- [X] T004 Update ActivityType ENUM in database schema file `crm-system/src/CRM.Infrastructure/Sqls/reset_database.sql` line 449 to include 'contract' value

**Checkpoint**: Database schema updated - backend and frontend implementation can now proceed in parallel

**Estimated Time**: 2 minutes

---

## Phase 3: User Story 1 - Create Contract Activities (Priority: P1) 🎯 MVP

**Goal**: Enable users to create and view contract activities with proper icon and color styling in the CRM system

**Independent Test**: Create a new activity with type "Contract", save it, and verify it appears in activity lists with the document icon (📄) and purple color scheme

### Backend Implementation for User Story 1

- [X] T005 [P] [US1] Add IsContract computed property to Activity domain entity in `crm-system/src/CRM.Domain/Entities/Activity.cs` after line 51
- [X] T006 [P] [US1] Add IsContract computed property to ActivityResponse DTO in `crm-system/src/CRM.Application/Dtos/Response/ActivityResponse.cs` after line 45
- [X] T007 [P] [US1] Update Activity.cs comment on line 24 to include 'contract' in ENUM list

### Frontend Implementation for User Story 1

- [X] T008 [P] [US1] Add contract option to ACTIVITY_TYPES constant in `crm-system-client/src/utils/constants.js` line 90-97 with value 'contract' and label '📄 Contract'
- [X] T009 [P] [US1] Add CONTRACT to ACTIVITY_CATEGORIES constant in `crm-system-client/src/utils/constants.js` line 103-110 with value 'contract'
- [X] T010 [US1] Add contract categorization logic to ActivityFeed component in `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityFeed.jsx` around line 198-207
- [X] T011 [US1] Add contract icon configuration to ActivityFeed iconConfig switch in `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityFeed.jsx` around line 209-220
- [X] T012 [US1] Import DescriptionIcon from Material-UI in `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityFeed.jsx` at top of file

### Build and Verification for User Story 1

- [X] T013 [US1] Build backend: `cd crm-system && dotnet build` and verify zero errors
- [X] T014 [US1] Build frontend: `cd crm-system-client && npm run lint && npm run build` and verify zero errors

**Checkpoint**: User Story 1 complete - contract activities can now be created, saved, and displayed with correct styling

**Estimated Time**: 15 minutes

**Manual Test Checklist** (from quickstart.md):
1. Navigate to customer/lead/deal detail page
2. Click "Add Activity"
3. Verify "📄 Contract" appears in activity type dropdown
4. Select "📄 Contract", fill subject "Contract Signing", fill body "Annual contract signed"
5. Save and verify activity appears with document icon and purple color
6. Verify activity persists after page refresh

---

## Phase 4: User Story 2 - Filter and View Contract Activities (Priority: P2)

**Goal**: Enable users to filter activity lists to show only contract activities and verify visual styling consistency

**Independent Test**: Create multiple contract activities and use filter to show only contract type, verify all are displayed with consistent icon and color

**Note**: User Story 2 implementation is ALREADY COMPLETE through User Story 1 tasks. The ACTIVITY_CATEGORIES constant and ActivityFeed categorization logic added in US1 automatically enable filtering functionality.

### Verification for User Story 2

- [ ] T015 [US2] Verify contract filtering works: Create 3 contract activities and 2 activities of other types, apply contract filter (if filter UI exists), verify only contract activities display

**Checkpoint**: User Story 2 complete - contract activity filtering works automatically via constants added in US1

**Estimated Time**: 5 minutes (verification only)

**Manual Test Checklist** (from quickstart.md):
1. Create 2-3 contract activities with different subjects
2. Create 1-2 activities of other types (email, call)
3. If filter UI exists: Apply "Contract" category filter
4. Verify only contract activities are displayed
5. Verify consistent visual styling (icon, color) across all contract activities

---

## Phase 5: User Story 3 - Search and Report on Contract Activities (Priority: P3)

**Goal**: Enable users to search for contract activities by keyword and verify they appear in reports and timelines

**Independent Test**: Search for "renewal" keyword in activities, verify contract activities with that term appear in results

**Note**: User Story 3 implementation is ALREADY COMPLETE. Existing search and reporting infrastructure automatically supports contract activities once the type is added to the database and constants.

### Verification for User Story 3

- [ ] T016 [US3] Verify contract activity search works: Create contract activity with subject "Contract Renewal", perform activity search for "renewal", verify it appears in results
- [ ] T017 [US3] Verify contract activities appear in customer/deal timeline: Navigate to customer detail page, verify contract activities display chronologically with other activities
- [ ] T018 [US3] Verify contract activities appear in exported reports (if export functionality exists): Export activity report, verify contract type is clearly indicated

**Checkpoint**: User Story 3 complete - contract activities are fully searchable and reportable

**Estimated Time**: 5 minutes (verification only)

**Manual Test Checklist** (from quickstart.md):
1. Create contract activity with subject "Contract Renewal Discussion"
2. Use activity search feature to search for "renewal"
3. Verify contract activity appears in search results
4. Navigate to deal/customer detail page
5. Verify contract activities appear in timeline chronologically
6. If export exists: Export activity report and verify contract type is indicated

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and regression testing

- [ ] T019 [P] Run full backend test suite (if exists): `cd crm-system/tests/CRMApi.UnitTests && dotnet test`
- [ ] T020 [P] Run frontend linter: `cd crm-system-client && npm run lint` and verify zero errors
- [ ] T021 Regression test: Create activities of all existing types (email, call, meeting, task, note) and verify they still work correctly
- [ ] T022 Regression test: Verify existing activity filtering/search for other types is unaffected
- [ ] T023 Performance check: Create 10 contract activities and verify activity list loads in under 2 seconds
- [ ] T024 Review all code changes for consistency with Clean Architecture principles (Domain → Application → Infrastructure → UI)
- [ ] T025 Validate all tasks from quickstart.md manual test checklist (6 test cases total)

**Estimated Time**: 10 minutes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - Core MVP
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - Can start after or in parallel with US1 backend tasks (only verification needed)
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) - Can start after or in parallel with US1 (only verification needed)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: ✅ Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: ✅ No additional implementation needed - Automatically works via US1 constants (verification only)
- **User Story 3 (P3)**: ✅ No additional implementation needed - Existing search/report infrastructure supports contract type (verification only)

**Key Insight**: User Stories 2 and 3 require NO additional code changes. The contract type support added in US1 automatically enables filtering, searching, and reporting functionality through existing infrastructure.

### Within User Story 1

**Backend tasks (T005-T007)** can run in parallel - all modify different files or different sections:
- T005: Activity.cs (Domain layer)
- T006: ActivityResponse.cs (Application layer)
- T007: Activity.cs comment update

**Frontend tasks (T008-T009)** can run in parallel - modify different sections of constants.js:
- T008: ACTIVITY_TYPES array
- T009: ACTIVITY_CATEGORIES object

**Sequential dependencies**:
- T010-T012 must be sequential (component logic + icon import in same file)
- T013-T014 must wait for all implementation tasks (T005-T012)

### Parallel Opportunities

- **Phase 1**: All 3 setup tasks [T001-T003] can run in parallel
- **User Story 1 Backend**: Tasks T005, T006, T007 can all run in parallel
- **User Story 1 Frontend**: Tasks T008, T009 can run in parallel
- **After Foundational (Phase 2)**: All user story verification tasks can proceed in parallel if team capacity allows
- **Polish Phase**: Tasks T019, T020 can run in parallel

---

## Parallel Example: User Story 1 Backend

```bash
# Launch all backend tasks together (different files/sections):
Task: "Add IsContract computed property to Activity.cs"
Task: "Add IsContract computed property to ActivityResponse.cs"
Task: "Update Activity.cs comment to include 'contract'"

# These three tasks modify different files and have no dependencies
```

## Parallel Example: User Story 1 Frontend Constants

```bash
# Launch both constant updates together (different sections of same file):
Task: "Add contract to ACTIVITY_TYPES constant"
Task: "Add CONTRACT to ACTIVITY_CATEGORIES constant"

# These two tasks modify different arrays/objects in constants.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only - Recommended)

1. Complete Phase 1: Setup (5 min)
2. Complete Phase 2: Foundational - Database ENUM update (2 min)
3. Complete Phase 3: User Story 1 - Full contract activity creation and display (15 min)
4. **STOP and VALIDATE**: Test US1 independently using manual checklist
5. **DECISION POINT**: MVP is functional - can deploy or continue with US2/US3

**Total MVP Time**: ~22 minutes

### Full Feature Delivery

1. Complete Setup + Foundational → Foundation ready (7 min)
2. Complete User Story 1 → Test independently (15 min) → **MVP Ready**
3. Complete User Story 2 → Verify filtering works (5 min)
4. Complete User Story 3 → Verify search/reporting works (5 min)
5. Complete Polish → Final validation (10 min)

**Total Full Feature Time**: ~42 minutes

### Parallel Team Strategy

With 2 developers:

1. Both developers complete Setup + Foundational together (7 min)
2. Once Foundational is done:
   - **Developer A**: User Story 1 Backend (Tasks T005-T007, T013) (8 min)
   - **Developer B**: User Story 1 Frontend (Tasks T008-T012, T014) (10 min)
3. Both verify User Story 1 together (2 min)
4. **Developer A**: User Story 2 verification (5 min)
5. **Developer B**: User Story 3 verification (5 min)
6. Both complete Polish together (10 min)

**Total Parallel Time**: ~25 minutes (vs. 42 min sequential)

---

## Task Summary

### Total Task Count: 25 tasks

**By Phase**:
- Setup: 3 tasks
- Foundational: 1 task (CRITICAL - blocks all stories)
- User Story 1: 10 tasks (8 implementation + 2 build)
- User Story 2: 1 task (verification only)
- User Story 3: 3 tasks (verification only)
- Polish: 7 tasks

**By User Story**:
- US1 (P1): 10 tasks - Core implementation
- US2 (P2): 1 task - Verification only (filtering auto-works)
- US3 (P3): 3 tasks - Verification only (search/report auto-works)

**Parallel Opportunities**: 8 tasks marked [P] can run in parallel within their phases

### Independent Test Criteria

✅ **User Story 1**: Create contract activity → Verify saves → Verify displays with icon/color → **PASS = MVP ready**

✅ **User Story 2**: Apply contract filter → Verify only contract activities shown → **PASS = Filtering works**

✅ **User Story 3**: Search "renewal" → Verify contract activities in results → Check timeline → **PASS = Search/report works**

### Suggested MVP Scope

**Minimum Viable Product**: User Story 1 only (10 tasks, ~22 minutes)

**Rationale**:
- Delivers core value: Create and view contract activities
- Independently testable and deployable
- US2 and US3 automatically work via existing infrastructure (just need verification)
- Low risk, high impact

---

## Notes

- [P] tasks = different files/sections, no dependencies
- [Story] label maps task to specific user story for traceability
- Database ENUM update (T004) is the CRITICAL blocker - must complete before backend/frontend
- US2 and US3 require zero implementation - existing infrastructure auto-supports contract type
- All file paths are absolute from repository root
- Commit after completing each user story phase
- Follow quickstart.md manual test checklist for each user story
- Backend changes follow Clean Architecture: Infrastructure → Domain → Application
- Frontend changes follow pattern: Utils (constants) → Presentation (components)

---

## Format Validation

✅ **All tasks follow required checklist format**: `- [ ] [TaskID] [P?] [Story?] Description with file path`

✅ **Sequential Task IDs**: T001 through T025 in execution order

✅ **Story labels present**: All user story tasks labeled with [US1], [US2], or [US3]

✅ **File paths included**: All implementation tasks include exact file paths

✅ **Parallel markers**: 8 tasks marked [P] for parallel execution

✅ **Independent testability**: Each user story has clear test criteria and checkpoint

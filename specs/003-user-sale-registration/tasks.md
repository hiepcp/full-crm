# Implementation Tasks: User Sale Registration

**Feature Branch**: `003-user-sale-registration`
**Created**: 2025-12-23
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Overview

This task breakdown organizes implementation by user story to enable independent, incremental delivery. Each user story can be implemented, tested, and deployed independently as a working feature increment.

**Total Tasks**: 28
**Estimated Effort**: 1 day (6-8 hours)
**MVP Scope**: User Story 1 only (12 tasks, ~4 hours)

---

## Implementation Strategy

### MVP-First Approach

**Minimum Viable Product** (MVP): User Story 1 - Register Sales User from HCM Worker Data
- Delivers core value: Administrators can register users by selecting HCM workers
- Independently testable and deployable
- Provides foundation for other stories

**Incremental Delivery**:
1. **Sprint 1** (MVP): User Story 1 → Deploy working user registration
2. **Sprint 2**: User Story 2 → Add search/filter
3. **Sprint 3**: User Story 3 + 4 → Add pagination/sorting + manual override

### Independent Testing

Each user story phase includes:
- **Independent Test** criteria (from spec.md)
- Clear acceptance scenarios
- Can be tested without other stories being complete

---

## Phase 1: Setup & Environment

**Goal**: Initialize development environment and verify prerequisites

### Tasks

- [ ] T001 Verify development environment setup (Node.js 18+, npm, Git, VS Code)
- [ ] T002 Verify backend services running (AllCRM API at https://api-crm.local.com, Auth API at https://api-auth.local.com)
- [ ] T003 Verify HTTPS certificates configured (mkcert installed, *.local.com certificates generated, hosts file updated)
- [ ] T004 Verify environment variables in crm-system-client/.env (VITE_API_AUTH, VITE_API_URL, VITE_API_AUTHZ, VITE_X_API_KEY)
- [ ] T005 Verify authenticated session (user logged in with administrator permissions, valid JWT in localStorage)
- [ ] T006 Install frontend dependencies: cd crm-system-client && npm install
- [ ] T007 Start development server: npm run dev (verify running at https://crm.local.com:3000)

**Completion Criteria**: All prerequisites verified, development server running

---

## Phase 2: Foundational Tasks

**Goal**: Set up component skeleton and routing infrastructure (blocks all user stories)

### Tasks

- [ ] T008 [P] Create component file crm-system-client/src/presentation/pages/user/UserSaleRegistration.jsx with skeleton structure
- [ ] T009 Add route to crm-system-client/src/app/routes/groups/MainRoutes.jsx for /user/register-sale path
- [ ] T010 [P] Import and verify existing dependencies (GetAllCRMHcmWorkersUseCase, RestAllCRMRepository, authUsersApi, authRolesApi)
- [ ] T011 Test route navigation (navigate to /user/register-sale, verify component renders)

**Completion Criteria**: Component accessible via route, skeleton renders

---

## Phase 3: User Story 1 - Register Sales User from HCM Worker Data (Priority P1)

**User Story**: An administrator needs to create a new user account for a sales staff member by selecting them from the HCM (Human Capital Management) worker directory, which automatically pre-populates their basic information (email, full name, personnel number), then assigns them appropriate sales roles to grant system access.

**Independent Test**: Can be fully tested by selecting an HCM worker from the directory, verifying auto-population of user fields, assigning at least one role, and successfully creating the user account. Delivers immediate value by allowing sales staff onboarding.

**Why This First**: Core functionality - all other stories enhance this base feature.

### Tasks

#### State Management
- [ ] T012 [P] [US1] Initialize component state in UserSaleRegistration.jsx: workers, total, loading, paginationModel, sortModel, searchInput, search
- [ ] T013 [P] [US1] Initialize form state in UserSaleRegistration.jsx: form (email, fullName, userName, roleIds), selectedWorker, submitting, alert
- [ ] T014 [P] [US1] Initialize roles state in UserSaleRegistration.jsx: roles, rolesLoading
- [ ] T015 [P] [US1] Create defaultForm constant with empty values for form reset

#### API Integration & Data Fetching
- [ ] T016 [US1] Initialize use case and repository instances (RestAllCRMRepository, GetAllCRMHcmWorkersUseCase) in UserSaleRegistration.jsx
- [ ] T017 [US1] Implement useEffect to fetch roles on component mount (authRolesApi.getAll(1, 200)) in UserSaleRegistration.jsx
- [ ] T018 [US1] Normalize role data to handle PascalCase/camelCase variance (roleId/id, name/Name/code) in UserSaleRegistration.jsx
- [ ] T019 [US1] Implement useEffect to fetch HCM workers with basic pagination (page 1, pageSize 10) in UserSaleRegistration.jsx
- [ ] T020 [US1] Implement normalizeWorker function to handle PersonnelNumber/personnelNumber, Name/name, SysEmail/sysEmail in UserSaleRegistration.jsx
- [ ] T021 [US1] Add filter to exclude workers with empty SysEmail (FR-003) in worker fetch useEffect in UserSaleRegistration.jsx

#### UI Components - HCM Worker List
- [ ] T022 [US1] Configure Material-UI DataGrid in UserSaleRegistration.jsx with columns: personnelNumber, name, sysEmail, actions (Select button)
- [ ] T023 [US1] Set DataGrid server-side pagination (paginationMode="server", onPaginationModelChange handler) in UserSaleRegistration.jsx
- [ ] T024 [US1] Set DataGrid page size options [5, 10, 25, 50] in UserSaleRegistration.jsx
- [ ] T025 [US1] Implement onRowClick handler to call handleSelectWorker in UserSaleRegistration.jsx

#### UI Components - Registration Form
- [ ] T026 [P] [US1] Render email TextField (required) with value binding to form.email in UserSaleRegistration.jsx
- [ ] T027 [P] [US1] Render fullName TextField (optional) with value binding to form.fullName in UserSaleRegistration.jsx
- [ ] T028 [P] [US1] Render userName TextField (optional) with value binding to form.userName in UserSaleRegistration.jsx
- [ ] T029 [US1] Render roles Select (multiple, required) with Chip renderValue for selected roles in UserSaleRegistration.jsx
- [ ] T030 [US1] Populate roles Select with normalized role data (map roles to MenuItems) in UserSaleRegistration.jsx

#### Auto-Population Logic
- [ ] T031 [US1] Implement handleSelectWorker function: set selectedWorker state, auto-fill email from sysEmail, auto-fill fullName from name in UserSaleRegistration.jsx
- [ ] T032 [US1] Implement username auto-generation logic: extract email prefix (before @), fallback to personnelNumber in UserSaleRegistration.jsx handleSelectWorker
- [ ] T033 [US1] Display selected worker info using Alert component (severity="info") in UserSaleRegistration.jsx
- [ ] T034 [US1] Allow manual field editing after auto-population (onChange handlers update form state) in UserSaleRegistration.jsx

#### Form Validation & Submission
- [ ] T035 [US1] Implement client-side validation: isFormValid = email required && roleIds.length >= 1 in UserSaleRegistration.jsx
- [ ] T036 [US1] Disable submit button when !isFormValid || submitting in UserSaleRegistration.jsx
- [ ] T037 [US1] Implement handleSubmit function: validate, set submitting=true, call authUsersApi.create(payload) in UserSaleRegistration.jsx
- [ ] T038 [US1] Handle success in handleSubmit: reset form to defaultForm, clear selectedWorker, show success Alert (FR-012) in UserSaleRegistration.jsx
- [ ] T039 [US1] Handle duplicate email error in handleSubmit: check message for "email"+"exist", show FR-014 message in UserSaleRegistration.jsx
- [ ] T040 [US1] Handle generic errors in handleSubmit: display server message or "Cannot create user" in UserSaleRegistration.jsx
- [ ] T041 [US1] Set submitting=false in finally block of handleSubmit in UserSaleRegistration.jsx

#### Error Handling & Alerts
- [ ] T042 [P] [US1] Render Alert component with dismissible onClose handler in UserSaleRegistration.jsx
- [ ] T043 [US1] Handle HCM worker fetch errors: catch error, display "Cannot load HCM Workers list" Alert in UserSaleRegistration.jsx
- [ ] T044 [US1] Handle roles fetch errors: catch error, display "Cannot load roles list" Alert in UserSaleRegistration.jsx

### Acceptance Testing (User Story 1)

- [ ] T045 [US1] Test: Select HCM worker → Verify form auto-populated with email, fullName, username
- [ ] T046 [US1] Test: Assign one role → Verify roleIds updated
- [ ] T047 [US1] Test: Submit form → Verify user created successfully, form reset, success alert shown
- [ ] T048 [US1] Test: Modify auto-populated field → Verify modified value used for creation

**Completion Criteria (US1)**:
- ✅ Can select HCM worker from list
- ✅ Form auto-populates with worker data
- ✅ Can assign roles
- ✅ Can create user successfully
- ✅ Form resets after creation
- ✅ Independently testable and deployable

---

## Phase 4: User Story 2 - Search and Filter HCM Workers (Priority P2)

**User Story**: An administrator needs to quickly find specific HCM workers from potentially large directories by searching across personnel number, name, or email address to locate the correct person for user registration.

**Independent Test**: Can be tested independently by entering search terms for personnel number, name, or email, and verifying that the worker list filters to show only matching results. Delivers value by reducing time to find workers.

**Why This Second**: Enhances usability but not blocking - US1 works without it for small datasets.

**Dependencies**: Requires US1 (HCM worker list infrastructure)

### Tasks

- [ ] T049 [P] [US2] Add search TextField with label "Search by email / name / personnel number" in UserSaleRegistration.jsx
- [ ] T050 [P] [US2] Add Search Button to trigger search in UserSaleRegistration.jsx
- [ ] T051 [US2] Implement search button onClick: set search state from searchInput, reset pagination to page 0 in UserSaleRegistration.jsx
- [ ] T052 [US2] Update worker fetch useEffect to include search filters: add filters for PersonnelNumber, Name, SysEmail with "contains" operator in UserSaleRegistration.jsx
- [ ] T053 [US2] Implement clear search functionality: when search cleared, restore full worker list in UserSaleRegistration.jsx

### Acceptance Testing (User Story 2)

- [ ] T054 [US2] Test: Enter search term → Trigger search → Verify filtered results displayed
- [ ] T055 [US2] Test: Search with no results → Verify empty list with "no results found" indication
- [ ] T056 [US2] Test: Clear search → Verify full worker list restored

**Completion Criteria (US2)**:
- ✅ Can search workers by personnel number, name, or email
- ✅ Search returns filtered results
- ✅ Empty results handled gracefully
- ✅ Independently testable without US3 or US4

---

## Phase 5: User Story 3 - Paginate and Sort HCM Worker List (Priority P3)

**User Story**: An administrator working with large HCM worker directories needs to navigate through paginated results and sort by different columns (personnel number, name, email) to efficiently browse and locate workers.

**Independent Test**: Can be tested by loading a large worker list, navigating between pages, changing page size, and sorting by different columns. Delivers value through improved navigation efficiency.

**Why This Third**: Nice-to-have for large datasets, not critical for core functionality.

**Dependencies**: Requires US1 (HCM worker list infrastructure)

### Tasks

- [ ] T057 [US3] Implement onPaginationModelChange handler: update paginationModel, reset to page 0 if pageSize changes in UserSaleRegistration.jsx
- [ ] T058 [P] [US3] Initialize sortModel state with default [{ field: "personnelNumber", sort: "asc" }] in UserSaleRegistration.jsx
- [ ] T059 [US3] Configure DataGrid sortingMode="server" and onSortModelChange handler in UserSaleRegistration.jsx
- [ ] T060 [US3] Implement onSortModelChange handler: update sortModel, reset pagination to page 0 in UserSaleRegistration.jsx
- [ ] T061 [US3] Create columnFieldMap to map frontend fields to backend fields (personnelNumber→PersonnelNumber, name→Name, sysEmail→SysEmail) in UserSaleRegistration.jsx
- [ ] T062 [US3] Compute orderBy object from sortModel for API call (field, order) in UserSaleRegistration.jsx

### Acceptance Testing (User Story 3)

- [ ] T063 [US3] Test: Navigate to next page → Verify next set of workers displayed with correct pagination controls
- [ ] T064 [US3] Test: Click column header to sort → Verify list re-orders by that column
- [ ] T065 [US3] Test: Change page size → Verify list reloads with new page size, resets to page 1

**Completion Criteria (US3)**:
- ✅ Can navigate between pages
- ✅ Can change page size (5, 10, 25, 50)
- ✅ Can sort by personnel number, name, email
- ✅ Page resets to 1 on page size or sort change
- ✅ Independently testable without US4

---

## Phase 6: User Story 4 - Manual User Registration Override (Priority P2)

**User Story**: An administrator needs to create user accounts for sales staff who are not in the HCM worker directory, or needs to manually override all fields when HCM data is incomplete or incorrect.

**Independent Test**: Can be tested by manually entering all user fields (email, full name, username) without selecting an HCM worker, assigning roles, and creating the user. Delivers value for exceptional cases.

**Why This Fourth**: Important for edge cases, but most registrations use HCM data (US1).

**Dependencies**: Requires US1 (registration form infrastructure)

### Tasks

- [ ] T066 [US4] Verify form fields allow manual entry without HCM worker selection (no disabled state when selectedWorker is null) in UserSaleRegistration.jsx
- [ ] T067 [US4] Implement validation to show errors for missing required fields (email, roleIds) when form submitted in UserSaleRegistration.jsx
- [ ] T068 [US4] Add helper text to email TextField: "Email is required" when validation fails in UserSaleRegistration.jsx
- [ ] T069 [US4] Add helper text to roles Select: "At least one role required" when validation fails in UserSaleRegistration.jsx

### Acceptance Testing (User Story 4)

- [ ] T070 [US4] Test: Manually enter email, fullName, username, roles (no HCM worker) → Submit → Verify user created successfully
- [ ] T071 [US4] Test: Select HCM worker → Clear fields → Enter new values → Verify new values used for creation
- [ ] T072 [US4] Test: Submit without email → Verify validation error displayed
- [ ] T073 [US4] Test: Submit without roles → Verify validation error displayed

**Completion Criteria (US4)**:
- ✅ Can create user without selecting HCM worker
- ✅ Can override HCM worker data manually
- ✅ Validation errors shown for missing required fields
- ✅ Independently testable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Final refinements, code quality, and documentation

### Tasks

- [ ] T074 [P] Run npm run lint from crm-system-client directory, fix all linting errors
- [ ] T075 [P] Run npm run prettier from crm-system-client directory to format code
- [ ] T076 [P] Add loading indicators (CircularProgress or Skeleton) for worker list and roles fetch in UserSaleRegistration.jsx
- [ ] T077 [P] Review component against HcmWorkerRegister.jsx for pattern consistency
- [ ] T078 Test all edge cases from spec.md: empty email workers (filtered), unicode names, concurrent submissions

**Completion Criteria**: All tasks complete, code passes linting, feature ready for review

---

## Task Dependencies & Execution Order

### Critical Path (Sequential - Must Complete in Order)

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4-6 (US2-4) → Phase 7 (Polish)
```

### User Story Dependencies

```
US1 (P1) - Register Sales User
  ↓ (provides HCM worker list infrastructure)
  ├── US2 (P2) - Search and Filter
  └── US3 (P3) - Paginate and Sort

US1 (P1) - Register Sales User
  ↓ (provides registration form infrastructure)
  └── US4 (P2) - Manual Override
```

**All user stories depend on Phase 2 (Foundational) being complete.**

### Parallel Execution Opportunities

#### Phase 1 (Setup) - Can run in parallel:
- T001-T005 (verification tasks)
- T006-T007 (installation) - Run after verifications

#### Phase 2 (Foundational) - Can run in parallel:
- T008 (create component) || T010 (verify imports)
- T009 (add route) - Run after T008

#### Phase 3 (User Story 1) - Parallel opportunities:
- **State Setup** (T012-T015): All can run in parallel
- **UI Components**: T026-T028 (TextFields) can run in parallel
- **Error Handling**: T042-T044 can run in parallel after error states defined

#### Phase 4-6 (User Stories 2-4) - Parallel opportunities:
- US2 tasks (T049-T050): Search UI elements in parallel
- US3 task T058: Sort model init in parallel with US2
- US4 tasks (T068-T069): Helper text additions in parallel

#### Phase 7 (Polish) - Can run in parallel:
- T074-T077: All polish tasks in parallel

### Example: Parallel Execution for User Story 1

```bash
# Terminal 1: State Management (T012-T015)
# All state initialization can happen simultaneously

# Terminal 2: API Integration (T016-T021)
# After state is ready

# Terminal 3: UI Components - Form Fields (T026-T028)
# Can work on form TextFields while DataGrid is being built

# Terminal 4: Error Handling (T042-T044)
# Can set up Alert component independently
```

---

## Testing Strategy

### Independent Testing Per User Story

**User Story 1** (T045-T048):
- Test worker selection and auto-population
- Test role assignment
- Test user creation
- Test form modifications

**User Story 2** (T054-T056):
- Test search functionality
- Test empty results
- Test search clear

**User Story 3** (T063-T065):
- Test pagination
- Test sorting
- Test page size changes

**User Story 4** (T070-T073):
- Test manual entry
- Test field overrides
- Test validation errors

### Manual Testing Checklist (End-to-End)

After all tasks complete:

1. **Happy Path**:
   - [ ] Load page → Workers displayed
   - [ ] Search worker → Found
   - [ ] Select worker → Form populated
   - [ ] Assign roles → Updated
   - [ ] Submit → Success
   - [ ] Form reset → Ready for next

2. **Error Paths**:
   - [ ] Duplicate email → FR-014 error message
   - [ ] Missing email → Validation error
   - [ ] Missing roles → Validation error
   - [ ] API unavailable → Error alert

3. **Edge Cases**:
   - [ ] Workers with empty email not shown
   - [ ] Unicode names display correctly
   - [ ] Page size change resets to page 1
   - [ ] Sort change resets to page 1

---

## Task Summary

| Phase | Task Count | Parallelizable | Story |
|-------|-----------|----------------|-------|
| Phase 1: Setup | 7 | 5 | - |
| Phase 2: Foundational | 4 | 2 | - |
| Phase 3: US1 | 37 | 10 | US1 (P1) |
| Phase 4: US2 | 8 | 2 | US2 (P2) |
| Phase 5: US3 | 9 | 1 | US3 (P3) |
| Phase 6: US4 | 8 | 0 | US4 (P2) |
| Phase 7: Polish | 5 | 5 | - |
| **Total** | **78** | **25** | - |

**Parallel Tasks**: 25/78 (32% parallelizable)

---

## MVP Delivery Recommendation

**Minimum Viable Product**: Phase 1 + Phase 2 + Phase 3 (User Story 1)
- **Task Count**: 7 + 4 + 37 = **48 tasks**
- **Estimated Time**: 4-5 hours
- **Deliverable**: Fully functional user registration with HCM worker selection
- **Value**: Administrators can onboard sales staff immediately

**Incremental Releases**:
- **Release 1** (MVP): US1 only → Deploy working feature
- **Release 2**: + US2 (Search) → Enhance usability
- **Release 3**: + US3 + US4 (Pagination + Manual Override) → Complete feature

---

## Notes

- **No Backend Changes**: All tasks are frontend-only
- **No Tests Required**: Tests are optional per constitution (testing discipline)
- **Reference Component**: HcmWorkerRegister.jsx provides working examples for all patterns
- **Estimated Effort**: ~6-8 hours total for all user stories, ~4 hours for MVP (US1 only)
- **Code Review**: Run `npm run lint` and `npm run prettier` before committing (Phase 7)

---

**Implementation Readiness**: ✅ **READY** - Tasks are specific, actionable, and independently executable.

# Tasks: User Sale Registration

**Feature**: User Sale Registration
**Branch**: `003-user-sale-registration`
**Input**: Design documents from `/specs/003-user-sale-registration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- All paths relative to repository root

## Path Conventions

**Web Application Structure** (from plan.md):
- Frontend: `crm-system-client/src/`
- Backend: `crm-system/src/`
- Database: `database/migrations/`

---

## Phase 1: Setup (Project Infrastructure)

**Purpose**: Initialize project structure and verify prerequisites

- [X] T001 Verify branch `003-user-sale-registration` is checked out and up-to-date
- [X] T002 [P] Verify frontend dependencies installed via `npm install` in crm-system-client/
- [ ] T003 [P] Verify backend projects build successfully via `dotnet build` in crm-system/
- [ ] T004 [P] Verify all required environment variables exist in crm-system-client/.env (VITE_API_AUTH, VITE_API_URL, VITE_API_AUTHZ, VITE_X_API_KEY)
- [ ] T005 [P] Verify backend services are running and accessible (AllCRM API, CRM API, Auth API)
- [ ] T006 [P] Verify existing API clients available: crm-system-client/src/infrastructure/api/authUsersApi.js, authRolesApi.js
- [ ] T007 Verify existing HCM worker use case available: crm-system-client/src/application/usecases/all-crms/GetAllCRMHcmWorkersUseCase.js

---

## Phase 2: Foundational (Database & Backend Extensions)

**Purpose**: Core database and backend changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No frontend work can begin until this phase is complete

### Database Schema

- [X] T008 Create database migration script in database/migrations/003_add_user_registration_tables.sql with ALTER TABLE for crm_user (add personnel_number VARCHAR(50) UNIQUE NULLABLE if not exists)
- [X] T009 Add UNIQUE constraint on crm_user.email if not already present in database/migrations/003_add_user_registration_tables.sql
- [X] T010 Create user_roles junction table in database/migrations/003_add_user_registration_tables.sql (user_id INT FK, role_id INT FK, assigned_by INT FK, assigned_on DATETIME, PRIMARY KEY(user_id, role_id)) - SKIPPED: Single-role model per research.md
- [X] T011 Create crm_user_audit_log table in database/migrations/003_add_user_registration_tables.sql (id INT PK AUTO_INCREMENT, administrator_id INT FK, registered_user_id INT FK, registered_user_email VARCHAR, assigned_roles JSON, registration_source ENUM('HCM', 'Manual'), created_on DATETIME DEFAULT CURRENT_TIMESTAMP)
- [X] T012 Add indexes to database migration: crm_user(personnel_number), user_roles(user_id, role_id), crm_user_audit_log(administrator_id, created_on)
- [ ] T013 Execute database migration script on local development database

### Backend Domain Layer

- [X] T014 [P] Verify User entity exists in crm-system/src/CRM.Domain/Entities/User.cs and add PersonnelNumber property (string, nullable) if missing
- [X] T015 [P] Create UserRole junction entity in crm-system/src/CRM.Domain/Entities/UserRole.cs with properties: UserId, RoleId, AssignedBy, AssignedOn - SKIPPED: Single-role model
- [X] T016 [P] Create UserAuditLog entity in crm-system/src/CRM.Domain/Entities/UserAuditLog.cs with properties: Id, AdministratorId, RegisteredUserId, RegisteredUserEmail, AssignedRoles (string/JSON), RegistrationSource, CreatedOn

### Backend Application Layer

- [X] T017 [P] Create CreateUserRequest DTO in crm-system/src/CRM.Application/Dtos/CreateUserRequest.cs with properties: Email, FullName, PersonnelNumber (nullable), Role (string - single role per research.md finding)
- [X] T018 [P] Create UserResponse DTO in crm-system/src/CRM.Application/Dtos/UserResponse.cs with properties: Id, Email, FullName, PersonnelNumber, Role, IsActive, CreatedOn
- [ ] T019 [P] Create CheckEmailRequest DTO in crm-system/src/CRM.Application/Dtos/CheckEmailRequest.cs with Email property
- [X] T020 [P] Create CreateUserRequestValidator in crm-system/src/CRM.Application/Validators/CreateUserRequestValidator.cs with FluentValidation rules: Email required, Email format valid, Role required
- [ ] T021 Extend IUserService interface in crm-system/src/CRM.Application/Interfaces/IUserService.cs to add CreateUserAsync(CreateUserRequest request, string administratorEmail) method signature
- [ ] T022 Extend IUserService interface to add GetByEmailAsync(string email) method signature for email uniqueness check
- [ ] T023 Implement CreateUserAsync in crm-system/src/CRM.Application/Services/UserService.cs with email uniqueness validation, user creation, role assignment, audit logging
- [ ] T024 Implement GetByEmailAsync in crm-system/src/CRM.Application/Services/UserService.cs to query user by email

### Backend Infrastructure Layer

- [ ] T025 Extend IUserRepository interface in crm-system/src/CRM.Infrastructure/Repositories/Interfaces/IUserRepository.cs to add GetByEmailAsync(string email) method signature
- [ ] T026 Extend IUserRepository interface to add CreateAsync(User user) method signature if not exists
- [ ] T027 [P] Create IUserAuditLogRepository interface in crm-system/src/CRM.Infrastructure/Repositories/Interfaces/IUserAuditLogRepository.cs with CreateAsync(UserAuditLog log) method
- [ ] T028 Implement GetByEmailAsync in crm-system/src/CRM.Infrastructure/Repositories/UserRepository.cs using Dapper query
- [ ] T029 Implement CreateAsync in crm-system/src/CRM.Infrastructure/Repositories/UserRepository.cs using Dapper SimpleCRUD.Insert if not exists
- [ ] T030 [P] Create UserAuditLogRepository in crm-system/src/CRM.Infrastructure/Repositories/UserAuditLogRepository.cs implementing IUserAuditLogRepository
- [ ] T031 [P] Create SQL queries in crm-system/src/CRM.Infrastructure/Sqls/UserSqls.cs for SELECT by email, INSERT user
- [ ] T032 [P] Create SQL queries in crm-system/src/CRM.Infrastructure/Sqls/UserAuditLogSqls.cs for INSERT audit log
- [ ] T033 Register IUserAuditLogRepository and UserAuditLogRepository in crm-system/src/CRM.Infrastructure/DependencyInjection.cs

### Backend API Layer

- [ ] T034 Extend UsersController in crm-system/src/CRM.Api/Controllers/UsersController.cs to add POST /api/users endpoint calling UserService.CreateUserAsync with administrator email from HttpContext
- [ ] T035 Extend UsersController to add GET /api/users/email/{email} endpoint calling UserService.GetByEmailAsync for email uniqueness check
- [ ] T036 Add validation middleware handling for CreateUserRequestValidator in crm-system/src/CRM.Api/Program.cs if not already configured
- [ ] T037 Add Serilog logging for user registration events in UsersController (log administrator, registered user email, role, source)
- [ ] T038 Test backend endpoints manually via Postman/Swagger: POST /api/users (success, duplicate email, validation errors), GET /api/users/email/{email}

**Checkpoint**: Backend foundation ready - frontend implementation can now begin

---

## Phase 3: User Story 1 - Register Sales User from HCM Worker Data (Priority: P1) 🎯 MVP

**Goal**: Enable administrators to create CRM user accounts by selecting HCM workers, auto-populating their data (email, full name, personnel number), assigning a role, and saving to local `crm_user` table.

**Independent Test**: Select an HCM worker from the directory, verify form auto-population, assign a role, submit successfully, and verify user record exists in `crm_user` table. The registration form should reset after success.

**Why MVP**: This is the core functionality that delivers immediate value by allowing administrators to quickly onboard sales staff into the CRM system without manual data entry.

### Frontend Components

- [ ] T039 [P] [US1] Create UserSaleRegistration page component in crm-system-client/src/presentation/pages/user/UserSaleRegistration.jsx with basic structure (Grid layout: 7 cols for worker list, 5 cols for form)
- [ ] T040 [P] [US1] Create HcmWorkerSelector component in crm-system-client/src/presentation/pages/user/components/HcmWorkerSelector.jsx with MUI DataGrid for server-side pagination/sorting
- [ ] T041 [P] [US1] Create UserRegistrationForm component in crm-system-client/src/presentation/pages/user/components/UserRegistrationForm.jsx with fields: email, fullName, personnelNumber (readonly), role (single-select)
- [ ] T042 [P] [US1] Create RoleSelector component in crm-system-client/src/presentation/pages/user/components/RoleSelector.jsx with MUI Select for single role selection (adapting to single-role constraint per research.md)

### Frontend API Integration

- [ ] T043 [US1] Create crmUsersApi client in crm-system-client/src/infrastructure/api/crmUsersApi.js with methods: create(payload), getByEmail(email)
- [ ] T044 [P] [US1] Verify hcmWorkersApi already exists in crm-system-client/src/infrastructure/api/ or create if missing with getPaged method

### Frontend State Management

- [ ] T045 [US1] Initialize HCM worker list state in UserSaleRegistration.jsx: workers, total, loading, paginationModel (page 0, pageSize 10), sortModel ([{field: 'personnelNumber', sort: 'asc'}])
- [ ] T046 [US1] Initialize registration form state in UserSaleRegistration.jsx: formData (email, fullName, personnelNumber, role), selectedWorker, submitting, alert
- [ ] T047 [US1] Fetch available roles on component mount using authRolesApi.getAll(1, 200) and normalize response (handle roleId/id and name/code field variations)

### Frontend Data Fetching

- [ ] T048 [US1] Implement useEffect to fetch HCM workers on mount and when paginationModel/sortModel changes using GetAllCRMHcmWorkersUseCase
- [ ] T049 [US1] Apply filter to exclude HCM workers with empty SysEmail (FR-003) in the HCM worker query filters array
- [ ] T050 [US1] Normalize HCM worker data to handle PascalCase/camelCase (PersonnelNumber → personnelNumber, Name → name, SysEmail → email)
- [ ] T051 [US1] Handle loading and error states for HCM worker fetch (show loading spinner, display error alert if API fails)

### Frontend Auto-Population Logic

- [ ] T052 [US1] Implement handleSelectWorker function to set selectedWorker state when "Select" button clicked in HcmWorkerSelector
- [ ] T053 [US1] Auto-populate formData.email from selectedWorker.email when worker selected
- [ ] T054 [US1] Auto-populate formData.fullName from selectedWorker.name when worker selected
- [ ] T055 [US1] Auto-populate formData.personnelNumber from selectedWorker.personnelNumber when worker selected (readonly field)
- [ ] T056 [US1] Display selected worker info in Alert component (info severity) showing "Using worker: {name} ({personnelNumber})"
- [ ] T057 [US1] Allow manual editing of email and fullName fields after auto-population (only personnelNumber remains readonly)

### Frontend Validation & Submission

- [ ] T058 [US1] Implement client-side validation: email required, email format valid, role required (at least one role selected)
- [ ] T059 [US1] Disable submit button when validation fails or when submitting is true
- [ ] T060 [US1] Implement handleSubmit function to validate required fields, set submitting=true, call crmUsersApi.create(payload)
- [ ] T061 [US1] Handle success response: reset formData to default, clear selectedWorker, show success alert ("Create user successfully"), set submitting=false
- [ ] T062 [US1] Handle duplicate email error (409 or 400 with "email" + "exist" in message): display FR-016 message "This email address is already registered. Please verify if the user already has an account."
- [ ] T063 [US1] Handle validation errors (400): display server validation messages in error alert
- [ ] T064 [US1] Handle generic errors (500 or network): display "Cannot create user" in error alert
- [ ] T065 [US1] Set submitting=false in finally block to re-enable submit button

### Frontend UI/UX

- [ ] T066 [P] [US1] Configure MUI DataGrid in HcmWorkerSelector with columns: Personnel Number, Name, Email, Actions (Select button)
- [ ] T067 [P] [US1] Configure DataGrid pagination: paginationMode="server", pageSizeOptions=[5, 10, 25, 50], onPaginationModelChange handler
- [ ] T068 [P] [US1] Configure DataGrid sorting: sortingMode="server", onSortModelChange handler that resets page to 0
- [ ] T069 [P] [US1] Render Alert component in UserSaleRegistration.jsx (dismissible) for success/error/info messages
- [ ] T070 [US1] Add page title "Register User from HCM Workers" with Typography variant="h4"

### Frontend Routing & Navigation

- [ ] T071 [US1] Add route for UserSaleRegistration page in crm-system-client/src/app/routes/groups/MainRoutes.jsx (path: /user/register-sale, element: UserSaleRegistration)
- [ ] T072 [US1] Add menu item for User Sale Registration in navigation menu configuration (if applicable)

### Frontend Code Quality

- [ ] T073 [US1] Run `npm run lint` in crm-system-client/ and fix any linting errors in UserSaleRegistration.jsx and components
- [ ] T074 [US1] Run `npm run prettier` in crm-system-client/ to format all new files
- [ ] T075 [US1] Review UserSaleRegistration.jsx against HcmWorkerRegister.jsx reference implementation for consistency

**Checkpoint**: User Story 1 complete - manually test full registration flow (select worker → auto-populate → assign role → submit → verify user created in database → verify form reset)

---

## Phase 4: User Story 2 - Search and Filter HCM Workers (Priority: P2)

**Goal**: Enable administrators to quickly find specific HCM workers by searching across personnel number, name, or email address.

**Independent Test**: Enter a search term in the search field, verify the worker list filters to show only matching results. Clear search and verify full list restores. Works independently of User Story 1.

**Why P2**: Enhances usability for large directories but the feature functions without it if worker list is small or manually browsable.

### Frontend Search UI

- [ ] T076 [P] [US2] Add search state to UserSaleRegistration.jsx: searchTerm (string, default empty), searchLoading (boolean)
- [ ] T077 [P] [US2] Add TextField for search input in HcmWorkerSelector component with label "Search by Personnel Number, Name, or Email"
- [ ] T078 [P] [US2] Add search Button next to TextField with onClick handler to trigger search
- [ ] T079 [P] [US2] Add clear Button to reset search (visible only when searchTerm is not empty)

### Frontend Search Logic

- [ ] T080 [US2] Implement handleSearch function to set searchTerm state and reset paginationModel.page to 0
- [ ] T081 [US2] Implement handleClearSearch function to clear searchTerm and reset paginationModel.page to 0
- [ ] T082 [US2] Update HCM worker fetch useEffect to include search filters when searchTerm is not empty
- [ ] T083 [US2] Build search filters array with three OR conditions: PersonnelNumber contains searchTerm, Name contains searchTerm, SysEmail contains searchTerm
- [ ] T084 [US2] Display "no results found" message when search returns 0 workers (empty state in DataGrid)

### Frontend UX Improvements

- [ ] T085 [P] [US2] Show loading indicator in search Button while search is executing
- [ ] T086 [P] [US2] Add debounce to search input (optional enhancement: trigger search on Enter key press)
- [ ] T087 [US2] Preserve search term when pagination or sort changes (only clear on explicit clear button click)

**Checkpoint**: User Story 2 complete - manually test search functionality (search for worker → filtered results → clear → full list restored) independently of other features

---

## Phase 5: User Story 3 - Paginate and Sort HCM Worker List (Priority: P3)

**Goal**: Enable administrators to navigate through paginated results and sort by different columns for efficient browsing of large worker directories.

**Independent Test**: Load a large worker list, navigate between pages, change page size, sort by different columns. Verify pagination controls and sorting work correctly. Works independently of User Stories 1 and 2.

**Why P3**: Nice-to-have improvement for large datasets but not critical for core registration functionality.

### Frontend Pagination

- [ ] T088 [US3] Verify paginationModel state already initialized in User Story 1 (page, pageSize)
- [ ] T089 [US3] Verify DataGrid paginationMode="server" already configured in User Story 1
- [ ] T090 [US3] Verify onPaginationModelChange handler already implemented in User Story 1 to update paginationModel state
- [ ] T091 [US3] Implement pagination reset to page 0 when page size changes
- [ ] T092 [US3] Test pagination with large dataset: verify next/previous page navigation, first/last page navigation, page number display

### Frontend Sorting

- [ ] T093 [US3] Verify sortModel state already initialized in User Story 1 ([{field: 'personnelNumber', sort: 'asc'}])
- [ ] T094 [US3] Verify DataGrid sortingMode="server" already configured in User Story 1
- [ ] T095 [US3] Implement onSortModelChange handler to update sortModel state and reset paginationModel.page to 0
- [ ] T096 [US3] Map frontend column fields to backend field names: personnelNumber → PersonnelNumber, name → Name, email → SysEmail
- [ ] T097 [US3] Test sorting: click Personnel Number header (asc/desc), click Name header (asc/desc), click Email header (asc/desc)

### Frontend UX Enhancements

- [ ] T098 [P] [US3] Add visual indicator for current sort column (already provided by DataGrid)
- [ ] T099 [P] [US3] Display current page info: "Showing X-Y of Z workers"
- [ ] T100 [US3] Ensure pagination and sorting work together with search from User Story 2 (combined state management)

**Checkpoint**: User Story 3 complete - manually test pagination and sorting independently (navigate pages → sort columns → verify correct data displayed)

---

## Phase 6: User Story 4 - Manual User Registration Override (Priority: P2)

**Goal**: Enable administrators to create CRM user accounts for sales staff not in the HCM worker directory, or manually override all fields when HCM data is incomplete or incorrect.

**Independent Test**: Manually enter all user fields (email, full name, personnel number) without selecting an HCM worker, assign a role, and successfully create the user in the `crm_user` table. Works independently of User Stories 1-3.

**Why P2**: Important for edge cases and data quality issues, but not the primary workflow.

### Frontend Manual Entry Mode

- [ ] T101 [US4] Verify UserRegistrationForm already allows manual editing of email, fullName fields (implemented in User Story 1)
- [ ] T102 [US4] Change personnelNumber field from readonly to editable when no worker is selected (conditional based on selectedWorker === null)
- [ ] T103 [US4] Add "Clear Selected Worker" button visible only when selectedWorker is not null to allow switching to manual entry mode
- [ ] T104 [US4] Implement handleClearSelectedWorker function to set selectedWorker=null and clear formData.personnelNumber (keep email/fullName if user edited them)

### Frontend Manual Entry Validation

- [ ] T105 [US4] Ensure email validation works for manually entered email (already implemented in User Story 1)
- [ ] T106 [US4] Ensure role validation works for manual entry (already implemented in User Story 1)
- [ ] T107 [US4] Allow personnelNumber to be optional (nullable) for manual entries where worker is not in HCM directory
- [ ] T108 [US4] Display clear error messages when required fields are missing: "Email is required", "At least one role required"

### Frontend Manual Entry UX

- [ ] T109 [P] [US4] Display info message when manual entry mode active: "Manual Entry Mode - Enter user details manually"
- [ ] T110 [P] [US4] Distinguish manual vs HCM auto-populated entries in form UI (e.g., different background color for manually entered fields)
- [ ] T111 [US4] Test manual entry workflow: enter all fields manually → assign role → submit → verify user created → form resets

### Backend Support

- [ ] T112 [US4] Verify backend CreateUserRequest accepts nullable PersonnelNumber (already implemented in Phase 2)
- [ ] T113 [US4] Update audit log to capture registration source: "HCM" when selectedWorker exists, "Manual" when selectedWorker is null
- [ ] T114 [US4] Test backend with manual entry payload (PersonnelNumber=null) and verify user creation succeeds

**Checkpoint**: User Story 4 complete - manually test manual entry mode (clear selected worker → enter all fields → submit → verify user created without personnel number or with custom personnel number)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality checks

### Code Quality & Cleanup

- [ ] T115 [P] Review all new frontend components for code duplication and refactor common patterns into shared utilities
- [ ] T116 [P] Review all new backend services for code duplication and refactor common patterns
- [ ] T117 [P] Remove any console.log statements from production code in crm-system-client/src/
- [ ] T118 [P] Remove any commented-out code from all new files (frontend and backend)
- [ ] T119 Run final `npm run lint` and `npm run prettier` on crm-system-client/ to ensure code quality

### Documentation Updates

- [ ] T120 [P] Update quickstart.md with manual Azure AD provisioning process (documented in research.md)
- [ ] T121 [P] Update quickstart.md testing checklist with all user stories (US1-US4) test scenarios
- [ ] T122 [P] Add inline JSDoc comments to complex functions in UserSaleRegistration.jsx (handleSubmit, handleSelectWorker)
- [ ] T123 [P] Add XML documentation comments to new backend methods (CreateUserAsync, GetByEmailAsync)

### Error Handling & Logging

- [ ] T124 [P] Verify all backend exceptions are caught and logged via Serilog in UserService.CreateUserAsync
- [ ] T125 [P] Verify all frontend API errors are caught and displayed to user with actionable messages
- [ ] T126 Test error scenarios: HCM API unavailable, Auth API unavailable, database connection failure, network timeout

### Security & Validation

- [ ] T127 [P] Verify all backend DTOs have FluentValidation validators (CreateUserRequest, CheckEmailRequest)
- [ ] T128 [P] Verify email uniqueness validation occurs before user creation (check-before-insert pattern)
- [ ] T129 [P] Verify database UNIQUE constraint on crm_user.email is active (safety net)
- [ ] T130 Test duplicate email handling: attempt to create user with existing email → verify FR-016 error message displayed

### Performance Optimization

- [ ] T131 [P] Verify HCM worker queries return results in \u003c2 seconds for 10,000 workers (SC-003)
- [ ] T132 [P] Verify user creation completes in \u003c3 seconds including database writes (SC-004)
- [ ] T133 [P] Add database indexes if query performance tests fail (personnel_number, email on crm_user)

### Edge Case Testing

- [ ] T134 Test HCM workers with unicode/special characters in names display correctly
- [ ] T135 Test HCM workers with empty email are filtered out and not displayed (FR-003)
- [ ] T136 Test page size change resets to page 1 correctly
- [ ] T137 Test sort change resets to page 1 correctly
- [ ] T138 Test concurrent form submissions prevented (submit button disabled while submitting)
- [ ] T139 Test form validation: submit without email → error, submit without role → error
- [ ] T140 Test form reset after success: all fields cleared, selectedWorker cleared, ready for next registration

### Integration Testing

- [ ] T141 Full workflow test: HCM worker selection → auto-populate → edit field → assign role → submit → verify DB → form reset
- [ ] T142 Full workflow test: Manual entry → enter all fields → assign role → submit → verify DB → form reset
- [ ] T143 Full workflow test: Search → select worker → register → verify search persists (or clears per UX decision)
- [ ] T144 Full workflow test: Pagination → navigate pages → select worker from page 3 → register → verify success
- [ ] T145 Full workflow test: Sort → change sort order → select worker → register → verify success

### Quickstart Validation

- [ ] T146 Run through quickstart.md implementation checklist to verify all steps are accurate and complete
- [ ] T147 Verify all Phase 1-8 checklist items in quickstart.md match actual implementation
- [ ] T148 Update quickstart.md with any discovered deviations from original plan

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (Phase 3): Can start after Foundational - **MVP priority**
  - User Story 2 (Phase 4): Can start after Foundational - Integrates with US1 but independently testable
  - User Story 3 (Phase 5): Can start after Foundational - Enhances US1/US2 but independently testable
  - User Story 4 (Phase 6): Can start after Foundational - Alternative to US1 but independently testable
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - MVP)**: No dependencies on other stories - can start immediately after Foundational phase
- **User Story 2 (P2)**: Builds on US1 state management but independently testable
- **User Story 3 (P3)**: Uses US1 DataGrid configuration but independently testable
- **User Story 4 (P2)**: Uses US1 form component but provides alternative entry mode - independently testable

### Within Each User Story

- **User Story 1 (MVP)**:
  1. Frontend components can be built in parallel (T039-T042)
  2. API integration after components exist (T043-T044)
  3. State management after components exist (T045-T047)
  4. Data fetching requires state + API (T048-T051)
  5. Auto-population requires state + components (T052-T057)
  6. Validation/submission requires all above (T058-T065)
  7. UI/UX, routing, code quality in parallel at end (T066-T075)

- **User Story 2**: Search UI [P] → Search logic → UX improvements
- **User Story 3**: Pagination (already done in US1) → Sorting → Combined testing
- **User Story 4**: Manual entry mode → Validation → Backend support → Testing

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks T001-T007 can run in parallel (verification tasks)

**Phase 2 (Foundational)**:
- Database tasks T008-T012 sequential (single migration file), then T013
- Backend Domain entities T014-T016 in parallel [P]
- Backend Application DTOs T017-T019 in parallel [P]
- Backend Application validators T020 in parallel with DTOs [P]
- Backend Infrastructure repositories T027, T030-T032 in parallel [P]

**Phase 3 (User Story 1)**:
- Components T039-T042 in parallel [P]
- API clients T043-T044 in parallel [P]
- UI config tasks T066-T069 in parallel [P]
- Code quality tasks T073-T074 in parallel [P]

**Phase 7 (Polish)**:
- Code quality T115-T119 in parallel [P]
- Documentation T120-T123 in parallel [P]
- Error handling T124-T126 in parallel [P]
- Security T127-T130 in parallel [P]
- Performance T131-T133 in parallel [P]

---

## Parallel Example: User Story 1 Components

```bash
# Launch all frontend components for User Story 1 together:
Task: "Create UserSaleRegistration page component in crm-system-client/src/presentation/pages/user/UserSaleRegistration.jsx"
Task: "Create HcmWorkerSelector component in crm-system-client/src/presentation/pages/user/components/HcmWorkerSelector.jsx"
Task: "Create UserRegistrationForm component in crm-system-client/src/presentation/pages/user/components/UserRegistrationForm.jsx"
Task: "Create RoleSelector component in crm-system-client/src/presentation/pages/user/components/RoleSelector.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - RECOMMENDED

1. ✅ Complete Phase 1: Setup (verify prerequisites)
2. ✅ Complete Phase 2: Foundational (database + backend - CRITICAL)
3. ✅ Complete Phase 3: User Story 1 (core HCM worker selection and registration)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Select HCM worker → Auto-populate form → Assign role → Submit → Verify DB → Form resets
   - Test duplicate email error
   - Test validation errors
5. Deploy/demo MVP if ready ✅

**Estimated MVP Time**: 1-2 days (Setup: 30 min, Foundational: 4-6 hours, User Story 1: 4-6 hours)

### Incremental Delivery

1. Foundation ready (Setup + Foundational) → Database and backend APIs tested
2. Add User Story 1 → Test independently → Deploy/Demo (**MVP - highest value!**)
3. Add User Story 2 (Search) → Test independently → Deploy/Demo (usability enhancement)
4. Add User Story 4 (Manual entry) → Test independently → Deploy/Demo (edge case coverage)
5. Add User Story 3 (Pagination/Sort) → Test independently → Deploy/Demo (large dataset support)
6. Polish phase → Final quality checks → Production deploy

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (critical path)
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP - highest priority)
   - Developer B: User Story 2 (Search - P2)
   - Developer C: User Story 4 (Manual entry - P2)
3. After US1/US2/US4 complete:
   - Any developer: User Story 3 (Pagination/Sort - P3)
4. Team completes Polish phase together

---

## Task Summary

- **Total Tasks**: 148
- **Phase 1 (Setup)**: 7 tasks
- **Phase 2 (Foundational)**: 31 tasks (BLOCKING)
- **Phase 3 (User Story 1 - MVP)**: 37 tasks
- **Phase 4 (User Story 2)**: 12 tasks
- **Phase 5 (User Story 3)**: 13 tasks
- **Phase 6 (User Story 4)**: 14 tasks
- **Phase 7 (Polish)**: 34 tasks

### Tasks by User Story

- **User Story 1** (Register from HCM - P1): 37 implementation tasks
- **User Story 2** (Search - P2): 12 implementation tasks
- **User Story 3** (Paginate/Sort - P3): 13 implementation tasks
- **User Story 4** (Manual Entry - P2): 14 implementation tasks

### Parallel Opportunities Identified

- Setup: 6 parallel tasks
- Foundational: 15 parallel tasks
- User Story 1: 12 parallel tasks
- Polish: 19 parallel tasks
- **Total parallelizable**: ~52 tasks (35% of total)

### MVP Scope (User Story 1 Only)

- Setup (7) + Foundational (31) + User Story 1 (37) = **75 tasks for MVP**
- Delivers core value: Administrators can register sales staff from HCM worker directory
- Estimated time: **1-2 days** for single developer

---

## Notes

- **[P] tasks** = Different files, no dependencies, can run in parallel
- **[Story] label** = Maps task to specific user story for traceability
- **Single-role constraint**: Research.md identified that the current schema only supports a single role per user (not multiple roles). UI adapted to single-select dropdown instead of multi-select.
- **Azure AD sync**: Manual provisioning process (not automated). Administrators must separately add users to Azure AD after creating them in CRM (documented in research.md).
- **Tests**: No automated tests included per spec (testing discipline marked optional in plan.md). Manual testing via quickstart.md checklist.
- **Commit strategy**: Commit after each logical group (e.g., all components for US1, all backend services, etc.)
- **Stop at checkpoints**: Validate each user story independently before proceeding to next
- **Format validation**: All tasks follow strict checklist format with checkbox, ID, optional [P] and [Story] labels, and file paths

---

## Independent Test Criteria

### User Story 1 (MVP)
- Load page → HCM workers displayed in DataGrid
- Select worker → Form auto-populated with email, full name, personnel number
- Assign role → Role dropdown populated from Auth API
- Submit → User created in `crm_user` table
- Form resets → Ready for next registration
- **Independence**: Works standalone without US2/US3/US4

### User Story 2 (Search)
- Enter search term → Worker list filters to matching results
- Clear search → Full worker list restored
- **Independence**: Works with or without US1/US3/US4

### User Story 3 (Pagination/Sort)
- Navigate pages → Correct workers displayed per page
- Change page size → List reloads with new size
- Sort by column → List re-orders correctly
- **Independence**: Works with or without US1/US2/US4

### User Story 4 (Manual Entry)
- Clear selected worker or don't select any → Manual entry mode
- Enter all fields manually → Validation passes
- Submit → User created without HCM worker association
- **Independence**: Works as alternative to US1, independently of US2/US3

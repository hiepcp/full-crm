# Tasks: Sales Team Management

**Input**: Design documents from `/specs/002-sales-team-management/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/

**Tests**: Tests are OPTIONAL. No test tasks included as feature specification does not explicitly request TDD approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `crm-system/src/[Layer]/`
- **Frontend**: `crm-system-client/src/`
- **Tests**: `crm-system/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and verification

- [X] T001 Verify branch 002-sales-team-management is checked out
- [X] T002 Verify MySQL database connection in crm-system appsettings.json
- [X] T003 [P] Verify frontend dependencies (React, Material-UI, Axios) are installed
- [X] T004 [P] Verify backend dependencies (.NET 8, Dapper, FluentValidation) are installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Migrations

- [X] T005 Execute SQL migration to create crm_sales_teams table in crm-system database
- [X] T006 Execute SQL migration to create crm_team_members table in crm-system database
- [X] T007 Execute SQL migration to add sales_team_id column to crm_deal table in crm-system database
- [X] T008 Execute SQL migration to add sales_team_id column to crm_customer table in crm-system database

### Backend: Domain Layer

- [X] T009 [P] Create SalesTeam entity in crm-system/src/CRM.Domain/Entities/SalesTeam.cs
- [X] T010 [P] Create TeamMember entity in crm-system/src/CRM.Domain/Entities/TeamMember.cs
- [X] T011 [P] Create TeamRole enum in crm-system/src/CRM.Domain/Enums/TeamRole.cs

### Backend: Application Layer - Interfaces

- [X] T012 [P] Create ISalesTeamService interface in crm-system/src/CRM.Application/Interfaces/ISalesTeamService.cs
- [X] T013 [P] Create ISalesTeamRepository interface in crm-system/src/CRM.Infrastructure/Repositories/ISalesTeamRepository.cs

### Backend: Application Layer - DTOs (Base Structures)

- [X] T014 [P] Create CreateTeamRequest DTO in crm-system/src/CRM.Application/Dtos/Teams/CreateTeamRequest.cs
- [X] T015 [P] Create UpdateTeamRequest DTO in crm-system/src/CRM.Application/Dtos/Teams/UpdateTeamRequest.cs
- [X] T016 [P] Create TeamResponse DTO in crm-system/src/CRM.Application/Dtos/Teams/TeamResponse.cs
- [X] T017 [P] Create QueryTeamsRequest DTO in crm-system/src/CRM.Application/Dtos/Teams/QueryTeamsRequest.cs
- [X] T018 [P] Create TeamMemberRequest DTO in crm-system/src/CRM.Application/Dtos/Teams/TeamMemberRequest.cs
- [X] T019 [P] Create TeamMemberResponse DTO in crm-system/src/CRM.Application/Dtos/Teams/TeamMemberResponse.cs
- [X] T020 [P] Create UpdateTeamMemberRequest DTO in crm-system/src/CRM.Application/Dtos/Teams/UpdateTeamMemberRequest.cs

### Backend: Infrastructure Layer - Registration

- [X] T021 Register ISalesTeamService in crm-system/src/CRM.Application/DependencyInjection.cs
- [X] T022 Register ISalesTeamRepository in crm-system/src/CRM.Infrastructure/DependencyInjection.cs

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Manage Sales Teams (Priority: P1) 🎯 MVP

**Goal**: Enable users to create, edit, and delete sales teams through UI

**Independent Test**: Create a team through UI, edit team name, delete empty team. Verify team appears in list and operations succeed.

### Backend: Application Layer - Validators

- [X] T023 [P] [US1] Create CreateTeamRequestValidator in crm-system/src/CRM.Application/Validators/CreateTeamRequestValidator.cs
- [X] T024 [P] [US1] Create UpdateTeamRequestValidator in crm-system/src/CRM.Application/Validators/UpdateTeamRequestValidator.cs

### Backend: Infrastructure Layer - Repository Implementation

- [X] T025 [P] [US1] Implement SalesTeamRepository methods in crm-system/src/CRM.Infrastructure/Repositories/SalesTeamRepository.cs (Create, Update, Delete, GetById, QueryAsync, IsNameUniqueAsync, GetMemberCountAsync)

### Backend: Infrastructure Layer - SQL Queries

- [X] T026 [P] [US1] Create CreateTeam.sql in crm-system/src/CRM.Infrastructure/Sqls/Teams/CreateTeam.sql
- [X] T027 [P] [US1] Create UpdateTeam.sql in crm-system/src/CRM.Infrastructure/Sqls/Teams/UpdateTeam.sql
- [X] T028 [P] [US1] Create DeleteTeam.sql in crm-system/src/CRM.Infrastructure/Sqls/Teams/DeleteTeam.sql
- [X] T029 [P] [US1] Create QueryTeams.sql in crm-system/src/CRM.Infrastructure/Sqls/Teams/QueryTeams.sql
- [X] T030 [P] [US1] Create GetMemberCount.sql in crm-system/src/CRM.Infrastructure/Sqls/Teams/GetMemberCount.sql

### Backend: Application Layer - Service Implementation

- [X] T031 [US1] Implement CreateAsync method in crm-system/src/CRM.Application/Services/SalesTeamService.cs
- [X] T032 [US1] Implement UpdateAsync method in crm-system/src/CRM.Application/Services/SalesTeamService.cs
- [X] T033 [US1] Implement DeleteAsync method in crm-system/src/CRM.Application/Services/SalesTeamService.cs (with member count validation FR-005)
- [X] T034 [US1] Implement GetByIdAsync method in crm-system/src/CRM.Application/Services/SalesTeamService.cs
- [X] T035 [US1] Implement QueryAsync method in crm-system/src/CRM.Application/Services/SalesTeamService.cs

### Backend: API Layer - Controller Implementation

- [X] T036 [US1] Create SalesTeamsController in crm-system/src/CRM.Api/Controllers/SalesTeamsController.cs
- [X] T037 [US1] Implement GET /api/teams endpoint in SalesTeamsController (with pagination, filtering, sorting)
- [X] T038 [US1] Implement GET /api/teams/{id} endpoint in SalesTeamsController
- [X] T039 [US1] Implement POST /api/teams endpoint in SalesTeamsController
- [X] T040 [US1] Implement PUT /api/teams/{id} endpoint in SalesTeamsController
- [X] T041 [US1] Implement DELETE /api/teams/{id} endpoint in SalesTeamsController (with member count validation FR-005)

### Frontend: Infrastructure Layer - API Client

- [X] T042 [P] [US1] Create teamsApi.js in crm-system-client/src/infrastructure/api/teamsApi.js
- [X] T043 [P] [US1] Implement getTeams method in teamsApi.js
- [X] T044 [P] [US1] Implement getTeam method in teamsApi.js
- [X] T045 [P] [US1] Implement createTeam method in teamsApi.js
- [X] T046 [P] [US1] Implement updateTeam method in teamsApi.js
- [X] T047 [P] [US1] Implement deleteTeam method in teamsApi.js

### Frontend: Application Layer - Context

- [X] T048 [P] [US1] Create TeamContext.jsx in crm-system-client/src/app/contexts/TeamContext.jsx
- [X] T049 [P] [US1] Implement useTeams hook in TeamContext.jsx
- [X] T050 [P] [US1] Implement TeamProvider component in TeamContext.jsx

### Frontend: Application Layer - Routing

- [X] T051 [P] [US1] Add team routes to crm-system-client/src/app/routes/MainRoutes.jsx (/teams, /teams/new, /teams/:id/edit)

### Frontend: Presentation Layer - Pages

- [X] T052 [P] [US1] Create TeamList.jsx in crm-system-client/src/presentation/pages/teams/TeamList.jsx
- [X] T053 [P] [US1] Implement team list DataGrid in TeamList.jsx with pagination, search, sort
- [X] T054 [P] [US1] Implement create team button and navigation in TeamList.jsx
- [X] T055 [US1] Implement edit and delete actions in TeamList.jsx
- [X] T056 [P] [US1] Create TeamForm.jsx in crm-system-client/src/presentation/pages/teams/TeamForm.jsx
- [X] T057 [P] [US1] Implement team form fields (name, description) with validation in TeamForm.jsx
- [X] T058 [P] [US1] Implement save and cancel actions in TeamForm.jsx (create/edit mode handling)

### Frontend: Presentation Layer - Components

- [X] T059 [P] [US1] Create TeamSelector.jsx in crm-system-client/src/presentation/components/teams/TeamSelector.jsx
- [X] T060 [P] [US1] Implement team dropdown with Material-UI Autocomplete in TeamSelector.jsx
- [X] T061 [P] [US1] Implement search and selection handlers in TeamSelector.jsx

### Frontend: Utilities

- [X] T062 [P] [US1] Add TEAM_ROLES constant to crm-system-client/src/utils/constants.js

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Assign and Manage Team Members (Priority: P2)

**Goal**: Enable users to add, update roles, and remove team members

**Independent Test**: Add user to team, update member role, remove member from team. Verify member list updates correctly and duplicate member prevention works.

### Backend: Application Layer - Validators

- [X] T063 [P] [US2] Create TeamMemberRequestValidator in crm-system/src/CRM.Application/Validators/TeamMemberRequestValidator.cs

### Backend: Infrastructure Layer - Repository Methods

- [X] T064 [P] [US2] Implement GetTeamMembersAsync method in SalesTeamRepository.cs
- [X] T065 [P] [US2] Implement AddMemberAsync method in SalesTeamRepository.cs
- [X] T066 [P] [US2] Implement UpdateMemberRoleAsync method in SalesTeamRepository.cs
- [X] T067 [P] [US2] Implement RemoveMemberAsync method in SalesTeamRepository.cs
- [X] T068 [P] [US2] Implement GetTeamMemberAsync method in SalesTeamRepository.cs

### Backend: Infrastructure Layer - SQL Queries

- [X] T069 [P] [US2] Create QueryTeamMembers.sql in crm-system/src/CRM.Infrastructure/Sqls/Teams/QueryTeamMembers.sql
- [X] T070 [P] [US2] Create AddTeamMember.sql in crm-system/src/CRM.Infrastructure/Sqls/Teams/AddTeamMember.sql
- [X] T071 [P] [US2] Create UpdateTeamMemberRole.sql in crm-system/src/CRM.Infrastructure/Sqls/Teams/UpdateTeamMemberRole.sql
- [X] T072 [P] [US2] Create RemoveTeamMember.sql in crm-system/src/CRM.Infrastructure/Sqls/Teams/RemoveTeamMember.sql

### Backend: Application Layer - Service Methods

- [X] T073 [US2] Implement GetTeamMembersAsync method in SalesTeamService.cs
- [X] T074 [US2] Implement AddMemberAsync method in SalesTeamService.cs (with duplicate check FR-008)
- [X] T075 [US2] Implement UpdateMemberRoleAsync method in SalesTeamService.cs
- [X] T076 [US2] Implement RemoveMemberAsync method in SalesTeamService.cs

### Backend: API Layer - Controller Endpoints

- [X] T077 [US2] Implement GET /api/teams/{id}/members endpoint in SalesTeamsController
- [X] T078 [US2] Implement POST /api/teams/{id}/members endpoint in SalesTeamsController
- [X] T079 [US2] Implement PUT /api/teams/{teamId}/members/{userId} endpoint in SalesTeamsController
- [X] T080 [US2] Implement DELETE /api/teams/{teamId}/members/{userId} endpoint in SalesTeamsController

### Frontend: Infrastructure Layer - API Client Methods

- [X] T081 [P] [US2] Implement getTeamMembers method in teamsApi.js
- [X] T082 [P] [US2] Implement addTeamMember method in teamsApi.js
- [X] T083 [P] [US2] Implement updateTeamMemberRole method in teamsApi.js
- [X] T084 [P] [US2] Implement removeTeamMember method in teamsApi.js
- [X] T085 [P] [US2] Create TeamMembers.jsx in crm-system-client/src/presentation/pages/teams/TeamMembers.jsx
- [X] T086 [P] [US2] Implement member list DataGrid in TeamMembers.jsx with pagination, role filter
- [X] T087 [P] [US2] Implement add member button in TeamMembers.jsx
- [X] T088 [P] [US2] Implement role dropdown for each member in TeamMembers.jsx
- [X] T089 [P] [US2] Implement remove member action in TeamMembers.jsx

### Frontend: Presentation Layer - Components

- [X] T090 [P] [US2] Create TeamMemberAutocomplete.jsx in crm-system-client/src/presentation/components/teams/TeamMemberAutocomplete.jsx
- [X] T091 [P] [US2] Implement user autocomplete with Material-UI in TeamMemberAutocomplete.jsx
- [X] T092 [P] [US2] Implement user selection handler in TeamMemberAutocomplete.jsx (using existing /api/users endpoint)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Link Teams to Deals and Customers (Priority: P3)

**Goal**: Enable users to assign teams to deals and customers through existing forms

**Independent Test**: Create/edit deal with team selected, create/edit customer with team selected. Verify team displays on detail pages and team assignment persists.

### Backend: Application Layer - Service Updates

- [X] T093 [US3] Update GetByIdAsync method in SalesTeamService.cs to include memberCount, dealCount, customerCount

### Frontend: Presentation Layer - Deal Integration

- [X] T094 [P] [US3] Add TeamSelector to DealForm.jsx in crm-system-client/src/presentation/pages/deals/DealForm.jsx
- [X] T095 [P] [US3] Add team selection state to DealForm.jsx
- [X] T096 [P] [US3] Add team display to DealDetail.jsx in crm-system-client/src/presentation/pages/deals/DealDetail.jsx
- [X] T097 [P] [US3] Add team members display to DealDetail.jsx
- [X] T098 [P] [US3] Add TeamSelector to CustomerForm.jsx in crm-system-client/src/presentation/pages/customers/CustomerForm.jsx
- [X] T099 [P] [US3] Add team selection state to CustomerForm.jsx
- [X] T100 [P] [US3] Add team display to CustomerDetail.jsx in crm-system-client/src/presentation/pages/customers/CustomerDetail.jsx
- [X] T101 [P] [US3] Add team members display to CustomerDetail.jsx

**Checkpoint**: At this point, all user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Code Quality

- [ ] T102 Run `npm run lint` on crm-system-client and fix any errors
- [ ] T103 Run `dotnet build` on crm-system and fix any errors

### Audit Logging

- [X] T104 Add audit logging to SalesTeamService.cs for all operations (FR-017)
- [X] T105 Ensure audit logs include UserEmail, RequestPath, RequestMethod, UserAgent

### Documentation

- [ ] T106 Update quickstart.md verification checklist based on implementation (optional)

### Performance

- [ ] T107 Verify database indexes are properly created (crm_sales_teams, crm_team_members, crm_deal, crm_customer)
- [ ] T108 Test team list API response time is <200ms (SC-005)
- [ ] T109 Test team selector load time is <1 second (SC-003)

### Testing

- [ ] T110 [P] Manual test all acceptance scenarios from spec.md for US1
- [ ] T111 [P] Manual test all acceptance scenarios from spec.md for US2
- [ ] T112 [P] Manual test all acceptance scenarios from spec.md for US3

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1/US2 but should be independently testable

### Within Each User Story

- Models before services
- Services before endpoints
- Repository before services
- DTOs before controllers
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All DTOs marked [P] can run in parallel
- All SQL queries marked [P] can run in parallel
- All API client methods marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all DTOs for User Story 1 together:
Task: "Create CreateTeamRequest DTO in crm-system/src/CRM.Application/Dtos/Teams/CreateTeamRequest.cs"
Task: "Create UpdateTeamRequest DTO in crm-system/src/CRM.Application/Dtos/Teams/UpdateTeamRequest.cs"
Task: "Create TeamResponse DTO in crm-system/src/CRM.Application/Dtos/Teams/TeamResponse.cs"
```

```bash
# Launch all validators for User Story 1 together:
Task: "Create CreateTeamRequestValidator in crm-system/src/CRM.Application/Validators/CreateTeamRequestValidator.cs"
Task: "Create UpdateTeamRequestValidator in crm-system/src/CRM.Application/Validators/UpdateTeamRequestValidator.cs"
```

```bash
# Launch all API client methods for User Story 1 together:
Task: "Implement getTeams method in teamsApi.js"
Task: "Implement getTeam method in teamsApi.js"
Task: "Implement createTeam method in teamsApi.js"
Task: "Implement updateTeam method in teamsApi.js"
Task: "Implement deleteTeam method in teamsApi.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are OPTIONAL as feature specification did not explicitly request TDD approach
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Database migrations should be executed in order (T005-T008)
- Team selector component should be reused across deal and customer forms (T094, T098)
- TeamMemberAutocomplete uses existing /api/users endpoint (no new backend changes)

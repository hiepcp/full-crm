# Tasks: Add Contract Activity Type with Date and Value

**Input**: Design documents from `/specs/005-contract-activity/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not requested - Manual testing per quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Web application:
- **Backend**: `crm-system/src/`
- **Frontend**: `crm-system-client/src/`
- **Database**: MySQL migrations

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Development environment preparation

- [ ] T001 Verify development branch 005-contract-activity is checked out
- [ ] T002 [P] Verify backend builds: `cd crm-system && dotnet restore && dotnet build`
- [ ] T003 [P] Verify frontend builds: `cd crm-system-client && npm install && npm run build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema changes that MUST complete before all user stories

**⚠️ CRITICAL**: Blocks all user story work

- [ ] T004 Create database migration script at `crm-system/database/migrations/005_add_contract_activity_fields.sql` with ALTER TABLE statements to add contract_date DATE NULL, contract_value DECIMAL(12,2) NULL columns and modify ActivityType ENUM to include 'contract'
- [ ] T005 Execute migration script on local MySQL database

**Checkpoint**: Database ready - user story implementation can proceed

---

## Phase 3: User Story 1 - Record Contract Details with Date and Value (Priority: P1) 🎯 MVP

**Goal**: Enable sales reps to create contract activities with contract date and contract value fields

**Independent Test**: Create contract activity with date "2025-01-15" and value "$50,000", save, verify both fields persist and display correctly

### Backend - Domain Layer (User Story 1)

- [ ] T006 [P] [US1] Add ContractDate (DateTime?) property to Activity entity in `crm-system/src/CRM.Domain/Entities/Activity.cs`
- [ ] T007 [P] [US1] Add ContractValue (decimal?) property to Activity entity in `crm-system/src/CRM.Domain/Entities/Activity.cs`
- [ ] T008 [P] [US1] Add IsContract computed property `[NotMapped] public bool IsContract => ActivityType == "contract";` to Activity entity in `crm-system/src/CRM.Domain/Entities/Activity.cs`

### Backend - Application Layer (User Story 1)

- [ ] T009 [P] [US1] Add ContractDate (DateTime?) property to ActivityRequest DTO in `crm-system/src/CRM.Application/Dtos/Request/ActivityRequest.cs`
- [ ] T010 [P] [US1] Add ContractValue (decimal?) property to ActivityRequest DTO in `crm-system/src/CRM.Application/Dtos/Request/ActivityRequest.cs`
- [ ] T011 [P] [US1] Add ContractDate (DateTime?) property to ActivityResponse DTO in `crm-system/src/CRM.Application/Dtos/Response/ActivityResponse.cs`
- [ ] T012 [P] [US1] Add ContractValue (decimal?) property to ActivityResponse DTO in `crm-system/src/CRM.Application/Dtos/Response/ActivityResponse.cs`
- [ ] T013 [P] [US1] Add IsContract computed property to ActivityResponse DTO in `crm-system/src/CRM.Application/Dtos/Response/ActivityResponse.cs`
- [ ] T014 [US1] Add FluentValidation conditional rules to ActivityRequestValidator in `crm-system/src/CRM.Application/Validators/ActivityRequestValidator.cs` - When ActivityType == "contract", validate ContractValue > 0 with message "Contract value must be greater than zero"

### Backend - Infrastructure Layer (User Story 1)

- [ ] T015 [US1] Update Activity repository SELECT queries in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs` to include contract_date and contract_value columns
- [ ] T016 [US1] Update Activity repository INSERT queries in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs` to include contract_date and contract_value columns
- [ ] T017 [US1] Update Activity repository UPDATE queries in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs` to include contract_date and contract_value columns

### Frontend - Utilities (User Story 1)

- [ ] T018 [P] [US1] Create currencyHelper.js utility file at `crm-system-client/src/utils/currencyHelper.js` with formatCurrency function using Intl.NumberFormat
- [ ] T019 [P] [US1] Add 'contract' to ACTIVITY_TYPES constant in `crm-system-client/src/utils/constants.js` with label '📄 Contract'
- [ ] T020 [P] [US1] Add CONTRACT to ACTIVITY_CATEGORIES constant in `crm-system-client/src/utils/constants.js` with value 'contract'

### Frontend - Components (User Story 1)

- [ ] T021 [P] [US1] Create ContractFields.jsx component at `crm-system-client/src/presentation/components/activity/ContractFields.jsx` with DatePicker for contract date and TextField with $ InputAdornment for contract value
- [ ] T022 [US1] Update ActivityForm component in `crm-system-client/src/presentation/pages/activity/ActivityForm.jsx` to conditionally render ContractFields when activityType === 'contract'
- [ ] T023 [US1] Update ActivityFeed component in `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityFeed.jsx` to display contract date and formatted contract value using formatCurrency for contract activities
- [ ] T024 [US1] Add contract icon configuration (DescriptionIcon, purple/secondary color) to ActivityFeed iconConfig switch in `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityFeed.jsx`

### Build and Verify (User Story 1)

- [ ] T025 [US1] Build backend: `cd crm-system && dotnet build` - verify zero errors
- [ ] T026 [US1] Build frontend: `cd crm-system-client && npm run lint:fix && npm run build` - verify zero errors
- [ ] T027 [US1] Manual test: Create contract activity with date and value, verify persistence and display

**Checkpoint**: US1 complete - contract date and value can be recorded

---

## Phase 4: User Story 2 - Analyze Contract Values and Dates (Priority: P2)

**Goal**: Enable filtering, sorting, and aggregate calculations by contract date and value

**Independent Test**: Create 3 contracts with different values ($10K, $50K, $100K) and dates, sort by value descending, filter by date range, verify total calculation

### Backend - Infrastructure Layer (User Story 2)

- [ ] T028 [P] [US2] Add GetTotalContractValueByCustomer method to ActivityRepository in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs` using SQL SUM query
- [ ] T029 [P] [US2] Add GetTotalContractValueByDeal method to ActivityRepository in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs` using SQL SUM query
- [ ] T030 [US2] Add repository interface methods to IActivityRepository in `crm-system/src/CRM.Application/Interfaces/IActivityRepository.cs`

### Backend - Application Layer (User Story 2)

- [ ] T031 [US2] Add GetTotalContractValueForCustomer method to ActivityService in `crm-system/src/CRM.Application/Services/ActivityService.cs` calling repository method and returning 0m if null
- [ ] T032 [US2] Add GetTotalContractValueForDeal method to ActivityService in `crm-system/src/CRM.Application/Services/ActivityService.cs`

### Frontend - Components (User Story 2)

- [ ] T033 [US2] Add contract value column to ActivityList component in `crm-system-client/src/presentation/pages/activity/ActivityList.jsx` with formatCurrency display
- [ ] T034 [US2] Add date range filter UI to ActivityList component for contract_date field
- [ ] T035 [US2] Add value-based sorting (ascending/descending) to ActivityList component for contract activities
- [ ] T036 [US2] Add total contract value display to Customer detail page showing sum of all contract values for that customer
- [ ] T037 [US2] Add total contract value display to Deal detail page showing sum of all contract values for that deal

### Build and Verify (User Story 2)

- [ ] T038 [US2] Build and test backend aggregate queries
- [ ] T039 [US2] Build and test frontend filtering and sorting
- [ ] T040 [US2] Manual test: Verify sorting by value, filtering by date range, total calculations accuracy

**Checkpoint**: US2 complete - contract analysis features functional

---

## Phase 5: User Story 3 - Export and Report Contract Data for Goal Setting (Priority: P3)

**Goal**: Enable export of contract data including date and value columns

**Independent Test**: Export activity report, verify contract_date and contract_value columns present with correct data

### Backend - Application Layer (User Story 3)

- [ ] T041 [US3] Update activity export service/method to include contract_date and contract_value columns in CSV/Excel export

### Frontend - Components (User Story 3)

- [ ] T042 [US3] Update export functionality in ActivityList or reporting components to include contract date and value columns
- [ ] T043 [US3] Add date grouping/aggregation UI for contract timeline view (group by month/quarter)
- [ ] T044 [US3] Add value threshold filter UI (e.g., "contracts > $50,000")

### Build and Verify (User Story 3)

- [ ] T045 [US3] Test export functionality with contract activities
- [ ] T046 [US3] Verify exported file contains contract_date and contract_value columns
- [ ] T047 [US3] Test date grouping and value threshold filters

**Checkpoint**: US3 complete - all export and reporting features functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [ ] T048 [P] Run full backend test suite: `cd crm-system/tests/CRMApi.UnitTests && dotnet test`
- [ ] T049 [P] Run frontend linter: `cd crm-system-client && npm run lint`
- [ ] T050 Update CLAUDE.md documentation with contract activity type and new fields if needed
- [ ] T051 Run complete end-to-end manual test following quickstart.md checklist
- [ ] T052 Verify all Success Criteria from spec.md (SC-001 through SC-008)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP scope
- **User Story 2 (Phase 4)**: Depends on Foundational - can run parallel with US1 if staffed
- **User Story 3 (Phase 5)**: Depends on Foundational and US1 (needs base implementation)
- **Polish (Phase 6)**: Depends on all desired user stories

### Within Each User Story

- Backend layers: Domain → Application → Infrastructure (sequential)
- Frontend: Utilities → Components (sequential within story)
- Backend and Frontend can proceed in parallel for same story

### Parallel Opportunities

- **Phase 1**: T002 and T003 parallel
- **Phase 3 (US1)**:
  - T006, T007, T008 parallel (Domain layer)
  - T009, T010, T011, T012, T013 parallel (Application layer)
  - T018, T019, T020, T021 parallel (Frontend utilities and components)
- **Phase 4 (US2)**: T028, T029 parallel
- **Phase 6**: T048, T049 parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test contract date/value recording
5. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Database ready
2. Add User Story 1 → Test → Deploy/Demo (MVP!)
3. Add User Story 2 → Test → Deploy/Demo (Analysis features)
4. Add User Story 3 → Test → Deploy/Demo (Export/reporting)

### Parallel Team Strategy

With multiple developers after Foundational complete:
- Developer A: User Story 1 (backend + frontend)
- Developer B: User Story 2 (analysis features)
- Developer C: User Story 3 (export features) OR polish tasks

---

## Notes

- Database migration (Phase 2) is CRITICAL and blocks all other work
- Contract date is OPTIONAL field (nullable)
- Contract value must be validated > 0 when entered
- Currency formatting uses Intl.NumberFormat (no external dependencies)
- DECIMAL(12,2) supports up to $999,999,999.99
- All contract activities support standard activity fields (subject, body, status, priority, etc.)
- Backward compatibility maintained for existing activity types

---

## Task Summary

**Total Tasks**: 52
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 2 tasks
- Phase 3 (User Story 1): 22 tasks
- Phase 4 (User Story 2): 13 tasks
- Phase 5 (User Story 3): 7 tasks
- Phase 6 (Polish): 5 tasks

**Parallel Opportunities**: 15 tasks can run in parallel (marked with [P])
**MVP Scope**: Phases 1-3 (27 tasks) delivers core value
**Estimated Total Time**: 4-6 hours for MVP, 8-12 hours for complete feature

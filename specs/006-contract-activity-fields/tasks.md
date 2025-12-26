# Tasks: Contract Activity Fields Enhancement

**Feature**: 006-contract-activity-fields
**Branch**: `006-contract-activity-fields`
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Overview

This tasks breakdown implements the addition of contract date and contract value fields to contract-type activities. Tasks are organized by user story to enable independent implementation and testing.

**Tech Stack**:
- **Frontend**: React 18.x, Material-UI, Axios, date-fns/dayjs
- **Backend**: .NET 8, Dapper + SimpleCRUD, FluentValidation, MySQL
- **Architecture**: Clean Architecture (Frontend + Backend microservices)

**Total Estimated Tasks**: 24 tasks across 6 phases

---

## Implementation Strategy

**MVP Scope**: User Story 1 (Record Contract Date) - Delivers basic contract date tracking capability

**Incremental Delivery**:
1. **MVP**: Phase 3 (US1) - Contract date field only
2. **Second Increment**: Phase 4 (US2) - Add contract value field
3. **Enhanced Features**: Phases 5-6 (US3-US4) - Views, filtering, goal integration

**Parallel Execution**: Tasks marked with `[P]` can be executed in parallel within the same phase.

---

## Phase 1: Setup & Prerequisites

**Goal**: Prepare development environment and database for contract field implementation.

### Tasks

- [X] T001 Create database migration script at `database/migrations/006_add_contract_fields_to_activities.sql`
- [X] T002 Run database migration to add `contract_date` and `contract_value` columns to activities table
- [X] T003 Verify migration by checking table schema (DESCRIBE activities) includes new columns
- [X] T004 [P] Review existing Activity entity structure in `crm-system/src/CRM.Domain/Entities/Activity.cs`
- [X] T005 [P] Review existing activity API contracts in `crm-system/src/CRM.Application/Dtos/`

**Completion Criteria**: Database schema updated, migration verified, existing code structure understood.

---

## Phase 2: Foundational Layer (Backend Domain & DTOs)

**Goal**: Update core domain entities and DTOs to support contract fields across all user stories.

**Note**: These changes are foundational and must complete before any user story implementation.

### Tasks

- [X] T006 Add ContractDate (DateTime?) and ContractValue (decimal?) properties to Activity entity in `crm-system/src/CRM.Domain/Entities/Activity.cs`
- [X] T007 Add ContractDate and ContractValue properties to ActivityRequest DTO in `crm-system/src/CRM.Application/Dtos/ActivityRequest.cs`
- [X] T008 Add ContractDate and ContractValue properties to ActivityResponse DTO in `crm-system/src/CRM.Application/Dtos/ActivityResponse.cs`
- [X] T009 Add ContractDateFrom, ContractDateTo, ContractValueMin, ContractValueMax properties to ActivityFilterRequest in `crm-system/src/CRM.Application/Dtos/ActivityFilterRequest.cs`

**Completion Criteria**: All domain entities and DTOs updated with contract fields, solution builds successfully.

---

## Phase 3: User Story 1 - Record Contract Date (P1)

**Story Goal**: Enable users to capture contract date when creating/editing contract activities.

**Independent Test**: Create a contract activity with a contract date and verify it is saved and displayed correctly. Delivers immediate value by enabling basic contract timeline tracking.

**Acceptance Criteria** (from spec.md):
1. User can select contract date from date picker when creating contract activity
2. Contract date displays in readable format when viewing activity
3. Contract date can be updated when editing activity
4. Activity saves successfully when contract date is not provided (optional field)

### Backend Tasks

- [X] T010 [US1] Add validation rules for ContractDate in `crm-system/src/CRM.Application/Validators/ActivityValidator.cs` (valid date format if provided)
- [X] T011 [US1] Update ActivityRepository.GetByIdAsync SQL to include contract_date in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs`
- [X] T012 [US1] Update ActivityRepository.CreateAsync SQL to include contract_date in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs`
- [X] T013 [US1] Update ActivityRepository.UpdateAsync SQL to include contract_date in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs`
- [X] T014 [US1] Build and test backend - run `dotnet build` from crm-system directory

### Frontend Tasks

- [X] T015 [P] [US1] Update activitiesApi.createActivity to include contractDate field in `crm-system-client/src/infrastructure/api/activitiesApi.js`
- [X] T016 [P] [US1] Update activitiesApi.updateActivity to include contractDate field in `crm-system-client/src/infrastructure/api/activitiesApi.js`
- [X] T017 [US1] Add DatePicker component for contract date in activity form (conditional on type="contract") in `crm-system-client/src/presentation/components/common/ActivityForms/components/ActivityCategoryFields.jsx`
- [X] T018 [US1] Add contract date display in activity details view with date formatting in `crm-system-client/src/presentation/pages/activity/ActivityDetail.jsx`
- [X] T019 [US1] Run frontend lint check - execute `npm run lint` from crm-system-client directory

**US1 Completion Test**: Create a contract activity with contract date "2025-02-01", verify it saves to database, displays formatted in UI, and can be edited.

---

## Phase 4: User Story 2 - Record Contract Value (P1)

**Story Goal**: Enable users to capture contract value when creating/editing contract activities.

**Independent Test**: Create a contract activity with a contract value and verify it is saved, displayed with currency formatting, and validated correctly.

**Acceptance Criteria** (from spec.md):
1. User can enter contract value when creating contract activity
2. Contract value displays in appropriate currency format when viewing activity
3. Contract value can be updated when editing activity
4. System displays validation error for negative or non-numeric values
5. Activity saves successfully when contract value is not provided (optional field)

### Backend Tasks

- [ ] T020 [US2] Add validation rules for ContractValue in `crm-system/src/CRM.Application/Validators/ActivityValidator.cs` (non-negative, max value, 2 decimal places)
- [ ] T021 [US2] Update ActivityRepository.GetByIdAsync SQL to include contract_value in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs`
- [ ] T022 [US2] Update ActivityRepository.CreateAsync SQL to include contract_value in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs`
- [ ] T023 [US2] Update ActivityRepository.UpdateAsync SQL to include contract_value in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs`
- [ ] T024 [US2] Build and test backend - run `dotnet build` from crm-system directory

### Frontend Tasks

- [ ] T025 [P] [US2] Update activitiesApi.createActivity to include contractValue field in `crm-system-client/src/infrastructure/api/activitiesApi.js`
- [ ] T026 [P] [US2] Update activitiesApi.updateActivity to include contractValue field in `crm-system-client/src/infrastructure/api/activitiesApi.js`
- [ ] T027 [US2] Add NumberInput component for contract value in activity form (conditional on type="contract") in `crm-system-client/src/presentation/pages/activity/ActivityForm.jsx`
- [ ] T028 [US2] Add contract value display with currency formatting (Intl.NumberFormat) in `crm-system-client/src/presentation/components/activity/ActivityDetails.jsx`
- [ ] T029 [US2] Add client-side validation for contract value (non-negative, numeric) in activity form
- [ ] T030 [US2] Run frontend lint check - execute `npm run lint` from crm-system-client directory

**US2 Completion Test**: Create a contract activity with contract value "50000.00", verify it saves, displays as "₫50,000" (or appropriate currency), rejects negative values with error message.

---

## Phase 5: User Story 3 - View Contract Activity History (P2)

**Story Goal**: Enable users to view contract date and value together in list and detail views.

**Independent Test**: View a list of contract activities and verify both contract date and value are visible; filter by date range and value range.

**Acceptance Criteria** (from spec.md):
1. Both contract date and value visible in activity list view
2. Contract date and value prominently displayed together in detail view
3. User can filter activities by date range and/or value range

### Backend Tasks

- [ ] T031 [US3] Add filtering logic for ContractDateFrom/To in ActivityRepository.QueryAsync in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs`
- [ ] T032 [US3] Add filtering logic for ContractValueMin/Max in ActivityRepository.QueryAsync in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs`
- [ ] T033 [US3] Build and test backend filtering - run `dotnet build` from crm-system directory

### Frontend Tasks

- [ ] T034 [P] [US3] Add contract date and value columns to activity list table in `crm-system-client/src/presentation/pages/activity/ActivityList.jsx`
- [ ] T035 [P] [US3] Implement activitiesApi.filterActivities with date/value range parameters in `crm-system-client/src/infrastructure/api/activitiesApi.js`
- [ ] T036 [US3] Add date range filter UI component (from/to date pickers) in activity list view
- [ ] T037 [US3] Add value range filter UI component (min/max number inputs) in activity list view
- [ ] T038 [US3] Ensure contract details section shows both fields together in `crm-system-client/src/presentation/components/activity/ActivityDetails.jsx`
- [ ] T039 [US3] Run frontend lint check - execute `npm run lint` from crm-system-client directory

**US3 Completion Test**: View contract activity list showing date and value columns, filter for contracts between "2025-01-01" and "2025-12-31" with values 10,000-100,000, verify results match criteria.

---

## Phase 6: User Story 4 - Goal Setting Integration (P3)

**Story Goal**: Make contract data accessible for future goal-setting features and reporting.

**Independent Test**: Verify contract date and value data are accessible via API for goal-related calculations and trend analysis.

**Acceptance Criteria** (from spec.md):
1. Contract data aggregated for specified period is accessible
2. Contract dates and values available for trend analysis in reports

### Tasks

- [ ] T040 [US4] Verify ActivityRepository.QueryAsync returns contract fields in aggregated queries in `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs`
- [ ] T041 [US4] Test API endpoint `/api/activities/query` with contract date/value filters returns correct aggregated data
- [ ] T042 [US4] Document contract data access patterns in quickstart.md for future goal-setting feature developers
- [ ] T043 [US4] Add example queries for common reporting scenarios (contract value by month, average contract value) to API documentation

**US4 Completion Test**: Query all contract activities from Q1 2025, calculate total contract value, verify data is accurate and accessible programmatically.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Final quality checks, documentation, and deployment preparation.

### Tasks

- [ ] T044 [P] Run full backend test suite - execute `dotnet test` from crm-system/tests/CRMApi.UnitTests directory
- [ ] T045 [P] Run frontend build for all environments - execute `npm run build` from crm-system-client directory
- [ ] T046 Review and update CLAUDE.md if any new patterns or conventions were established
- [ ] T047 [P] Perform end-to-end manual testing following quickstart.md test scenarios
- [ ] T048 [P] Test backward compatibility: verify existing activities without contract fields display correctly
- [ ] T049 Prepare pull request description with links to spec.md, plan.md, and tasks.md

**Completion Criteria**: All tests pass, builds succeed for all environments, backward compatibility verified, PR ready for review.

---

## Dependencies & Execution Order

### User Story Dependencies

```text
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← MUST complete before user stories
    ↓
Phase 3 (US1: Contract Date) ← Independent, can start after Phase 2
    ↓ (recommended order, not strict dependency)
Phase 4 (US2: Contract Value) ← Independent, can start after Phase 2
    ↓
Phase 5 (US3: View History) ← Depends on US1 & US2 completing
    ↓
Phase 6 (US4: Goal Integration) ← Depends on US1 & US2 completing
    ↓
Phase 7 (Polish)
```

**Key Insights**:
- US1 and US2 are **independent** after Phase 2 completes
- US3 and US4 require US1 and US2 to be complete
- MVP = Phase 1 + Phase 2 + Phase 3 (just contract date)

### Parallel Execution Opportunities

**Within Phase 2** (Foundational):
- T006, T007, T008, T009 can be done in parallel (different files, no dependencies)

**Within Phase 3** (US1):
- T015 and T016 (frontend API updates) can be done in parallel
- Frontend tasks (T017, T018) can proceed while backend builds (T014)

**Within Phase 4** (US2):
- T025 and T026 (frontend API updates) can be done in parallel
- Frontend tasks (T027, T028, T029) can proceed while backend builds (T024)

**Within Phase 5** (US3):
- T034 and T035 can be done in parallel (list view + API client)
- T036 and T037 can be done in parallel (date filter + value filter UI)

**Within Phase 7** (Polish):
- T044, T045, T047, T048 can all be done in parallel (independent testing activities)

---

## Task Summary

| Phase | User Story | Task Count | Parallelizable | MVP |
|-------|------------|-----------|----------------|-----|
| 1: Setup | N/A | 5 | 2 | ✓ |
| 2: Foundational | N/A | 4 | 4 | ✓ |
| 3: US1 (Contract Date) | P1 | 10 | 2 | ✓ |
| 4: US2 (Contract Value) | P1 | 11 | 2 | - |
| 5: US3 (View History) | P2 | 9 | 3 | - |
| 6: US4 (Goal Integration) | P3 | 4 | 0 | - |
| 7: Polish | N/A | 6 | 4 | - |
| **Total** | **4 stories** | **49** | **17** | - |

**MVP Scope** (Minimum Viable Product):
- Phase 1: Setup (5 tasks)
- Phase 2: Foundational (4 tasks)
- Phase 3: US1 only (10 tasks)
- **Total MVP**: 19 tasks

**Estimated Effort**:
- MVP: ~2-3 days (contract date only)
- Full Feature: ~5-7 days (all 4 user stories)

---

## Validation Checklist

✓ All tasks follow format: `- [ ] [ID] [P?] [Story?] Description with file path`
✓ Each user story has independent test criteria
✓ Tasks organized by user story (not by layer)
✓ Dependency graph shows story completion order
✓ Parallel execution opportunities identified
✓ MVP scope clearly defined (Phase 1 + 2 + 3)
✓ File paths are absolute or clearly specified
✓ Each phase has completion criteria

---

## Next Steps

1. **Start MVP Implementation**: Begin with Phase 1 (Setup)
2. **Follow Sequential Order**: Complete Phase 2 (Foundational) before user stories
3. **Implement US1 First**: Deliver contract date capability as MVP
4. **Iterate Incrementally**: Add US2, US3, US4 in subsequent iterations
5. **Test Continuously**: Use independent test criteria after each user story
6. **Track Progress**: Check off tasks as completed in this file

**Ready to implement!** Follow [quickstart.md](quickstart.md) for detailed setup instructions.

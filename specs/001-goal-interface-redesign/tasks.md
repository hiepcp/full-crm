# Tasks: Goal Interface Redesign

**Input**: Design documents from `/specs/001-goal-interface-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL per constitution. This task list does NOT include test tasks as testing is optional for this project.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `crm-system/src/CRM.{Layer}/`
- **Frontend**: `crm-system-client/src/`
- Paths are absolute from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema initialization and dependency setup

- [X] T001 Run database migration to extend crm_goal table with new columns (parent_goal_id, calculation_source, last_calculated_at, calculation_failed, manual_override_reason) per data-model.md
- [X] T002 Run database migration to create crm_goal_progress_history table per data-model.md
- [X] T003 [P] Run database migration to create crm_goal_template table per data-model.md
- [X] T004 [P] Run database migration to create crm_goal_hierarchy_link table per data-model.md
- [X] T005 [P] Run database migration to create crm_goal_notification table per data-model.md
- [X] T006 [P] Run database migration to create crm_goal_comment table per data-model.md
- [X] T007 [P] Run database migration to create crm_goal_audit_log table per data-model.md
- [X] T008 [P] Run database migration to create crm_background_job_lock table for distributed job locking per research.md
- [X] T009 Insert system goal templates (Monthly Revenue, Quarterly Deals, Weekly Activity) into crm_goal_template table per data-model.md
- [X] T010 [P] Install react-sparklines package in frontend (npm install react-sparklines) per research.md
- [X] T011 [P] Add database indexes for goal hierarchy queries (idx_parent_goal_id, idx_calculation_source, idx_calculation_failed) per data-model.md

**Checkpoint**: Database schema ready, all new tables created and indexed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain entities and shared infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T012 Extend Goal domain entity in crm-system/src/CRM.Domain/Entities/Goal.cs with new properties (ParentGoalId, CalculationSource, LastCalculatedAt, CalculationFailed, ManualOverrideReason)
- [X] T013 [P] Create GoalProgressHistory domain entity in crm-system/src/CRM.Domain/Entities/GoalProgressHistory.cs per data-model.md
- [X] T014 [P] Create GoalTemplate domain entity in crm-system/src/CRM.Domain/Entities/GoalTemplate.cs per data-model.md
- [X] T015 [P] Create GoalHierarchyLink domain entity in crm-system/src/CRM.Domain/Entities/GoalHierarchyLink.cs per data-model.md
- [X] T016 [P] Create GoalNotification domain entity in crm-system/src/CRM.Domain/Entities/GoalNotification.cs per data-model.md
- [X] T017 [P] Create GoalComment domain entity in crm-system/src/CRM.Domain/Entities/GoalComment.cs per data-model.md
- [X] T018 [P] Create GoalAuditLog domain entity in crm-system/src/CRM.Domain/Entities/GoalAuditLog.cs per data-model.md
- [X] T019 Extend GoalRepository in crm-system/src/CRM.Infrastructure/Repositories/GoalRepository.cs to support new Goal entity properties
- [X] T020 [P] Create GoalProgressHistoryRepository in crm-system/src/CRM.Infrastructure/Repositories/GoalProgressHistoryRepository.cs with CRUD and query methods
- [X] T021 [P] Create IGoalProgressHistoryRepository interface in crm-system/src/CRM.Application/Interfaces/IGoalProgressHistoryRepository.cs
- [X] T022 [P] Create GoalAuditLogRepository in crm-system/src/CRM.Infrastructure/Repositories/GoalAuditLogRepository.cs with create and query methods
- [X] T023 [P] Create IGoalAuditLogRepository interface in crm-system/src/CRM.Application/Interfaces/IGoalAuditLogRepository.cs
- [X] T024 Create helper method CreateAuditLogEntry in GoalService to log all goal changes per clarification #4
- [X] T025 Update CRM.Infrastructure DependencyInjection.cs to register new repositories (GoalProgressHistoryRepository, GoalAuditLogRepository)
- [X] T026 [P] Extend frontend Goal entity in crm-system-client/src/domain/entities/Goal.js with new fields (parentGoalId, calculationSource, lastCalculatedAt, calculationFailed, forecast, hierarchy)
- [X] T027 [P] Extend goalsApi.js in crm-system-client/src/infrastructure/api/goalsApi.js to export as object with existing methods preserved

**Checkpoint**: Foundation ready - all shared entities, repositories, and base infrastructure complete. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Goal Progress Tracking Accuracy (Priority: P1) 🎯 MVP

**Goal**: Automatically calculate goal progress from CRM data (deals, activities, revenue) eliminating manual entry and reducing administrative overhead by 90%

**Independent Test**: Create a revenue goal, close a deal worth $25,000, verify goal progress automatically updates to show 25% completion

### Backend Implementation for User Story 1

- [X] T028 [P] [US1] Create GoalProgressCalculationService in crm-system/src/CRM.Application/Services/GoalProgressCalculationService.cs with CalculateProgressAsync method per research.md decision #1
- [X] T029 [P] [US1] Create IGoalProgressCalculationService interface in crm-system/src/CRM.Application/Interfaces/IGoalProgressCalculationService.cs
- [X] T030 [US1] Implement CalculateRevenueProgress method in GoalProgressCalculationService to query deals with status='Close/Won' within goal date range per quickstart.md
- [X] T031 [P] [US1] Implement CalculateDealsProgress method in GoalProgressCalculationService to count deals with status='Close/Won' within goal date range
- [X] T032 [P] [US1] Implement CalculateActivitiesProgress method in GoalProgressCalculationService to count completed activities within goal date range
- [X] T033 [P] [US1] Implement CalculateTasksProgress method in GoalProgressCalculationService to count completed tasks within goal date range
- [X] T034 [US1] Implement CreateSnapshotIfSignificantChange method in GoalProgressCalculationService to create progress history snapshot when progress changes ≥1% per clarification #3
- [X] T035 [US1] Implement RecalculateGoalsForEntity method in GoalProgressCalculationService to find and recalculate goals affected by entity change (deal/activity/task) per research.md
- [X] T036 [US1] Add event trigger in DealService.UpdateAsync to call RecalculateGoalsForEntity when deal status changes to 'Close/Won' per quickstart.md
- [X] T037 [P] [US1] Add event trigger in ActivityService.CompleteAsync to call RecalculateGoalsForEntity when activity is completed per quickstart.md
- [X] T038 [P] [US1] Create GoalSnapshotJob background service in crm-system/src/CRM.Infrastructure/BackgroundServices/GoalSnapshotJob.cs for daily midnight snapshots per research.md decision #4
- [X] T039 [P] [US1] Create GoalProgressCalculationJob background service in crm-system/src/CRM.Infrastructure/BackgroundServices/GoalProgressCalculationJob.cs for 15-minute fallback recalculation per research.md decision #1
- [X] T040 [US1] Implement distributed lock acquisition/release in background jobs using crm_background_job_lock table per research.md decision #4
- [X] T041 [US1] Update CRM.Application DependencyInjection.cs to register IGoalProgressCalculationService
- [X] T042 [US1] Update CRM.Infrastructure DependencyInjection.cs to register background services (GoalSnapshotJob, GoalProgressCalculationJob)
- [X] T043 [P] [US1] Create GoalForecastResponse DTO in crm-system/src/CRM.Application/Dtos/Response/GoalForecastResponse.cs per contracts/goal-endpoints.openapi.yaml
- [X] T044 [P] [US1] Extend GoalResponse DTO in crm-system/src/CRM.Application/Dtos/Response/GoalResponse.cs to include calculationSource, lastCalculatedAt, calculationFailed fields
- [X] T045 [US1] Implement GET /api/goals/{id}/forecast endpoint in GoalController to calculate velocity-based forecast per contracts/goal-endpoints.openapi.yaml
- [X] T046 [P] [US1] Implement POST /api/goals/{id}/recalculate endpoint in GoalController to trigger manual recalculation per contracts/goal-endpoints.openapi.yaml
- [X] T047 [P] [US1] Create ManualProgressAdjustmentRequest DTO in crm-system/src/CRM.Application/Dtos/Request/ManualProgressAdjustmentRequest.cs with newProgress and justification fields
- [X] T048 [P] [US1] Create ManualProgressAdjustmentRequestValidator in crm-system/src/CRM.Application/Validators/ManualProgressAdjustmentRequestValidator.cs to require justification (min 10 chars) per FR-018
- [X] T049 [US1] Implement POST /api/goals/{id}/manual-adjustment endpoint in GoalController to handle manual overrides with justification per contracts/goal-endpoints.openapi.yaml and clarification #2
- [X] T050 [US1] Update UpdateGoalRequest to handle calculation failure scenarios (display last value with warning) per clarification #2
- [X] T051 [US1] Implement GET /api/goals/{id}/progress-history endpoint in GoalController to retrieve progress snapshots per contracts/goal-endpoints.openapi.yaml
- [X] T052 [US1] Add Serilog logging for calculation events (success/failure) in GoalProgressCalculationService per constitution Principle V

### Frontend Implementation for User Story 1

- [X] T053 [P] [US1] Add getProgressHistory method to goalsApi.js in crm-system-client/src/infrastructure/api/goalsApi.js per contracts/goal-endpoints.openapi.yaml
- [X] T054 [P] [US1] Add getForecast method to goalsApi.js per contracts/goal-endpoints.openapi.yaml
- [X] T055 [P] [US1] Add recalculate method to goalsApi.js per contracts/goal-endpoints.openapi.yaml
- [X] T056 [P] [US1] Add manualAdjustment method to goalsApi.js per contracts/goal-endpoints.openapi.yaml
- [X] T057 [P] [US1] Create goalProgressCalculator.js service in crm-system-client/src/application/services/goalProgressCalculator.js for client-side calculation logic per plan.md
- [X] T058 [P] [US1] Create goalForecastService.js in crm-system-client/src/application/services/goalForecastService.js for velocity and forecast calculations per plan.md
- [X] T059 [US1] Extend GoalCard component in crm-system-client/src/presentation/components/goals/GoalCard.jsx to display sparklines using react-sparklines per quickstart.md
- [X] T060 [P] [US1] Create GoalForecast component in crm-system-client/src/presentation/components/goals/GoalForecast.jsx to display forecast with status badge (on-track/at-risk/ahead/behind) per plan.md
- [X] T061 [US1] Extend GoalProgressBar component in crm-system-client/src/presentation/components/goals/GoalProgressBar.jsx to add trend indicators and show calculation failure warning per clarification #2
- [X] T062 [US1] Update index.jsx in crm-system-client/src/presentation/pages/goals/ to fetch and display progress history sparklines on goal cards
- [X] T063 [US1] Add manual adjustment dialog to goals page with justification text field (min 10 chars validation) per FR-018
- [X] T064 [US1] Add calculation failure warning indicator (yellow/orange badge) on goal cards when calculationFailed=true per clarification #2
- [X] T065 [US1] Add "Recalculate" button on goal detail view to trigger manual recalculation per contracts

**Checkpoint**: At this point, User Story 1 (auto-calculation) should be fully functional - goals automatically update from CRM data, display progress trends, handle failures gracefully, and allow manual overrides with justification

---

## Phase 4: User Story 2 - Visual Progress Dashboard (Priority: P1)

**Goal**: Display goals in priority/urgency-based dashboard with visual indicators, enabling quick assessment within 5 seconds

**Independent Test**: Create 5 goals with various due dates and progress levels, verify dashboard displays them sorted by urgency (overdue first with red alert, due within 7 days with yellow warning)

### Backend Implementation for User Story 2

- [X] T066 [P] [US2] Extend GoalQueryRequest DTO in crm-system/src/CRM.Application/Dtos/Request/GoalQueryRequest.cs to support sorting by urgency/priority
- [X] T067 [US2] Extend GoalRepository QueryAsync method to calculate and sort by urgency (overdue, due within 7 days, remaining) per acceptance scenario US2.1
- [X] T068 [P] [US2] Add calculated fields to GoalResponse: daysRemaining, isOverdue, isAtRisk (< 50% progress with < 50% time) per FR-003
- [X] T069 [US2] Extend GET /api/goals/metrics endpoint to include atRiskCount and overdueCount per contracts/goal-endpoints.openapi.yaml
- [X] T070 [US2] Add "Needs Attention" indicator logic in GoalService for goals not updated in 14 days per acceptance scenario US2.3

### Frontend Implementation for User Story 2

- [X] T071 [P] [US2] Create GoalDashboard component in crm-system-client/src/presentation/pages/goals/GoalDashboard.jsx with urgency-based sorting per plan.md
- [X] T072 [US2] Implement dashboard sorting logic: overdue goals first (red alert), due within 7 days (yellow warning), then by end date per acceptance scenario US2.1
- [X] T073 [P] [US2] Add status badge display logic to GoalCard: "Almost There" (90% complete, 2 days remaining), "At Risk" (<50% progress, <50% time), "Needs Attention" (14 days no update) per acceptance scenarios US2.2 and US2.3
- [X] T074 [US2] Add color coding for urgency levels: red for overdue, yellow/orange for due soon, green for on-track per FR-003
- [X] T075 [US2] Update goals page to use GoalDashboard component as default view per plan.md
- [X] T076 [P] [US2] Add metrics summary cards at top of dashboard showing total goals, at-risk count, overdue count per acceptance scenario US2.4
- [X] T077 [US2] Implement team goal breakdown display showing individual contributor contributions per acceptance scenario US2.4
- [X] T078 [US2] Add MUI theme integration for status colors (use theme.palette for consistency) per research.md decision #3
- [X] T079 [US2] Optimize dashboard load time to < 2 seconds for 50 goals with metrics per SC-006 (use single SQL query, database indexes)

**Checkpoint**: At this point, User Story 2 (visual dashboard) should be fully functional - goals displayed by urgency, status badges visible, at-risk goals highlighted, < 2 second load time

---

## Phase 5: User Story 3 - Goal Templates and Quick Creation (Priority: P2)

**Goal**: Enable goal creation from templates in under 30 seconds, reducing setup time from 2-5 minutes

**Independent Test**: Select "Monthly Revenue" template, customize target value to $100,000, create goal - verify entire flow completes in under 30 seconds with all fields pre-populated

### Backend Implementation for User Story 3

- [X] T080 [P] [US3] Create GoalTemplateRepository in crm-system/src/CRM.Infrastructure/Repositories/GoalTemplateRepository.cs with CRUD and query methods per data-model.md
- [X] T081 [P] [US3] Create IGoalTemplateRepository interface in crm-system/src/CRM.Application/Interfaces/IGoalTemplateRepository.cs
- [X] T082 [P] [US3] Create GoalTemplateService in crm-system/src/CRM.Application/Services/GoalTemplateService.cs with CRUD operations per plan.md
- [X] T083 [P] [US3] Create IGoalTemplateService interface in crm-system/src/CRM.Application/Interfaces/IGoalTemplateService.cs
- [X] T084 [P] [US3] Create CreateGoalTemplateRequest DTO in crm-system/src/CRM.Application/Dtos/Request/CreateGoalTemplateRequest.cs per contracts/goal-templates-endpoints.openapi.yaml
- [X] T085 [P] [US3] Create UpdateGoalTemplateRequest DTO in crm-system/src/CRM.Application/Dtos/Request/UpdateGoalTemplateRequest.cs per contracts
- [X] T086 [P] [US3] Create GoalTemplateResponse DTO in crm-system/src/CRM.Application/Dtos/Response/GoalTemplateResponse.cs per contracts
- [X] T087 [P] [US3] Create CreateGoalTemplateRequestValidator in crm-system/src/CRM.Application/Validators/CreateGoalTemplateRequestValidator.cs to validate required fields
- [X] T088 [US3] Implement GET /api/goals/templates endpoint in GoalController to list system and custom templates per contracts/goal-templates-endpoints.openapi.yaml
- [X] T089 [P] [US3] Implement POST /api/goals/templates endpoint to create custom templates per contracts
- [X] T090 [P] [US3] Implement PUT /api/goals/templates/{id} endpoint to update custom templates (system templates readonly) per contracts
- [X] T091 [P] [US3] Implement DELETE /api/goals/templates/{id} endpoint to soft-delete custom templates per contracts
- [X] T092 [US3] Extend CreateGoalRequest to accept templateId and pre-populate fields from template per contracts/goal-endpoints.openapi.yaml
- [X] T093 [US3] Update CRM.Application DependencyInjection.cs to register IGoalTemplateService
- [X] T094 [US3] Update CRM.Infrastructure DependencyInjection.cs to register GoalTemplateRepository
- [X] T095 [US3] Implement auto-date population logic in GoalService for timeframe templates (this_month → current month start/end, this_quarter → current quarter, etc.) per acceptance scenario US3.1

### Frontend Implementation for User Story 3

- [X] T096 [P] [US3] Add getTemplates, createTemplate, updateTemplate, deleteTemplate methods to goalsApi.js per contracts/goal-templates-endpoints.openapi.yaml
- [X] T097 [P] [US3] Extend createGoal method in goalsApi.js to accept templateId parameter per contracts
- [X] T098 [P] [US3] Create GoalTemplateSelector component in crm-system-client/src/presentation/pages/goals/GoalTemplateSelector.jsx with template cards (system + custom) per plan.md
- [X] T099 [US3] Implement template selection UI showing template name, description, default type, timeframe, and suggested target per data-model.md
- [ ] T100 [US3] Extend GoalCreationDialog component in crm-system-client/src/presentation/pages/goals/GoalCreationDialog.jsx to support template-based creation per plan.md
- [ ] T101 [US3] Implement two-step creation flow: Step 1 = template selection, Step 2 = customize target value and dates per existing pattern in index.jsx
- [ ] T102 [US3] Add field pre-population logic when template selected (type, timeframe, status=active, auto-calculate dates) per acceptance scenario US3.1
- [ ] T103 [US3] Implement notification sending to team members when team goal created from template per acceptance scenario US3.2 (requires US4 notification service)
- [X] T104 [US3] Add custom template creation UI (available to managers/admins) with form for name, description, type, timeframe, owner type, suggested target
- [X] T105 [US3] Measure and optimize template selection → goal creation flow to complete in < 30 seconds per SC-001

**Checkpoint**: At this point, User Story 3 (templates) should be fully functional - users can create goals from templates in < 30 seconds, templates pre-populate all required fields, custom templates can be created

---

## Phase 6: User Story 4 - Goal Hierarchy and Alignment (Priority: P2)

**Goal**: Enable cascading company → team → individual goal structures with automatic progress roll-up for OKR-style alignment

**Independent Test**: Create company goal ($1M revenue), create 4 team goals totaling $1M linked to company goal, verify each team goal displays as child and progress rolls up to company goal

### Backend Implementation for User Story 4

- [ ] T106 [P] [US4] Create GoalHierarchyRepository in crm-system/src/CRM.Infrastructure/Repositories/GoalHierarchyRepository.cs with link CRUD and tree traversal methods per data-model.md
- [ ] T107 [P] [US4] Create IGoalHierarchyRepository interface in crm-system/src/CRM.Application/Interfaces/IGoalHierarchyRepository.cs
- [ ] T108 [P] [US4] Create GoalHierarchyService in crm-system/src/CRM.Application/Services/GoalHierarchyService.cs with hierarchy management and roll-up logic per plan.md
- [ ] T109 [P] [US4] Create IGoalHierarchyService interface in crm-system/src/CRM.Application/Interfaces/IGoalHierarchyService.cs
- [X] T110 [US4] Implement RecalculateParentProgressAsync method in GoalHierarchyService to sum child progress and update parent recursively per quickstart.md
- [X] T111 [P] [US4] Implement ValidateHierarchyLink method to prevent circular dependencies (traverse parent chain, reject if child already in chain) per data-model.md and research.md decision #2
- [X] T112 [P] [US4] Implement ValidateMaxDepth method to enforce 3-level max hierarchy (company → team → individual) per data-model.md
- [X] T113 [P] [US4] Implement ValidateCompatibleOwnerTypes method (company can have team/individual children, team can have individual children) per data-model.md
- [X] T114 [P] [US4] Create LinkGoalToParentRequest DTO in crm-system/src/CRM.Application/Dtos/Request/LinkGoalToParentRequest.cs with parentGoalId and contributionWeight
- [X] T115 [P] [US4] Create GoalHierarchyResponse DTO in crm-system/src/CRM.Application/Dtos/Response/GoalHierarchyResponse.cs with goal, ancestors, descendants per contracts/goal-hierarchy-endpoints.openapi.yaml
- [X] T116 [US4] Implement GET /api/goals/{id}/hierarchy endpoint to retrieve full hierarchy tree per contracts/goal-hierarchy-endpoints.openapi.yaml
- [X] T117 [P] [US4] Implement POST /api/goals/{id}/link-parent endpoint to create hierarchy link per contracts
- [X] T118 [P] [US4] Implement POST /api/goals/{id}/unlink-parent endpoint to orphan goal per contracts
- [X] T119 [P] [US4] Implement GET /api/goals/{id}/children endpoint to get direct children per contracts
- [X] T120 [US4] Update GoalService.UpdateProgressAsync to trigger RecalculateParentProgressAsync after progress update per quickstart.md
- [X] T121 [US4] Add recursive CTE query to GoalRepository for efficient hierarchy retrieval per research.md decision #2
- [X] T122 [US4] Update CRM.Application DependencyInjection.cs to register IGoalHierarchyService
- [X] T123 [US4] Update CRM.Infrastructure DependencyInjection.cs to register GoalHierarchyRepository
- [X] T124 [US4] Extend GoalResponse to include parentGoalId and childrenSummary (count, total target, total progress) per data-model.md

### Frontend Implementation for User Story 4

- [X] T125 [P] [US4] Add getHierarchy, linkToParent, unlinkParent, getChildren methods to goalsApi.js per contracts/goal-hierarchy-endpoints.openapi.yaml
- [X] T126 [P] [US4] Create goalHierarchyService.js in crm-system-client/src/application/services/goalHierarchyService.js for hierarchy tree manipulation and roll-up logic per plan.md
- [X] T127 [P] [US4] Create GoalHierarchyTree component in crm-system-client/src/presentation/components/goals/GoalHierarchyTree.jsx for tree visualization per plan.md
- [X] T128 [P] [US4] Create GoalHierarchyView page in crm-system-client/src/presentation/pages/goals/GoalHierarchyView.jsx per plan.md
- [X] T129 [US4] Implement tree visualization using MUI TreeView or custom component showing company → team → individual levels per acceptance scenario US4.1
- [X] T130 [US4] Add parent goal selector dropdown in goal creation/edit dialog (filtered by compatible owner types) per acceptance scenario US4.1
- [X] T131 [US4] Implement goal link functionality in UI (drag-drop or button-based) to create parent-child relationships per acceptance scenario US4.2
- [X] T132 [US4] Display parent goal context in goal detail view showing "This goal supports: [Parent Goal Name]" per acceptance scenario US4.4
- [X] T133 [US4] Add child goal breakdown display in parent goal detail showing contribution by each child with progress bars per acceptance scenario US4.3
- [X] T134 [US4] Implement real-time parent progress recalculation display (when child updates, parent updates automatically) per acceptance scenario US4.3
- [X] T135 [US4] Add route for hierarchy view in MainRoutes.jsx per plan.md

**Checkpoint**: At this point, User Story 4 (hierarchy) should be fully functional - goals can be linked in 3-level hierarchy, progress rolls up from children to parents, hierarchy visualization displays correctly

---

## Phase 7: User Story 5 - Performance Analytics and Insights (Priority: P3)

**Goal**: Provide actionable insights from historical data including completion trends, velocity, and forecasts for data-driven goal setting

**Independent Test**: View analytics page with 12 months of goal history, verify monthly completion rate trends display, average progress velocity calculates correctly, team comparisons show

### Backend Implementation for User Story 5

- [X] T136 [US5] Extend GET /api/goals/metrics endpoint to support historical trend queries (monthly completion rates, velocity patterns) per acceptance scenario US5.1
- [X] T137 [P] [US5] Add CompletionRateTrend calculation to GoalService aggregating completed vs total goals by month per acceptance scenario US5.1
- [X] T138 [P] [US5] Add AverageVelocity calculation to GoalService using progress history snapshots (progress per day/week) per acceptance scenario US5.2
- [X] T139 [US5] Extend GoalMetricsResponse to include trend arrays (monthly data points) and velocity metrics per acceptance scenario US5.1
- [X] T140 [P] [US5] Add filtering by goal type to metrics endpoint to show completion rates by type per acceptance scenario US5.3
- [X] T141 [US5] Add comparison metrics (user vs team average, user vs company average) to metrics response per acceptance scenario US5.1
- [X] T142 [US5] Implement insufficient data handling (< 30 days) returning informative message per acceptance scenario US5.4

### Frontend Implementation for User Story 5

- [X] T143 [P] [US5] Create GoalAnalytics page in crm-system-client/src/presentation/pages/goals/GoalAnalytics.jsx per plan.md
- [X] T144 [US5] Add Chart.js library for rich analytics visualizations (lazy-loaded only when analytics page accessed) per research.md decision #3
- [X] T145 [P] [US5] Implement monthly completion rate trend chart using Chart.js line chart per acceptance scenario US5.1
- [X] T146 [P] [US5] Implement velocity comparison chart (user vs team vs company averages) using Chart.js bar chart per acceptance scenario US5.1
- [X] T147 [P] [US5] Implement goal type breakdown chart showing completion rates by type using Chart.js pie/donut chart per acceptance scenario US5.3
- [X] T148 [US5] Add analytics filters (date range, goal type, owner type) to allow customized views
- [X] T149 [US5] Display insufficient data message when < 30 days of history per acceptance scenario US5.4
- [X] T150 [US5] Add "On Track" status display in goal detail based on velocity forecast (60% complete, 40% time remaining → "On Track") per acceptance scenario US5.2
- [X] T151 [US5] Add analytics route in MainRoutes.jsx linking to GoalAnalytics page per plan.md
- [X] T152 [US5] Add "Analytics" tab or navigation item to goals page header

**Checkpoint**: At this point, User Story 5 (analytics) should be fully functional - historical trends display, velocity calculations work, comparisons show, analytics provide actionable insights

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Features that affect multiple user stories and final quality improvements

- [X] T153 [P] Create GoalNotificationService in crm-system/src/CRM.Application/Services/GoalNotificationService.cs to handle notification creation per research.md decision #6
- [X] T154 [P] Create IGoalNotificationService interface in crm-system/src/CRM.Application/Interfaces/IGoalNotificationService.cs
- [X] T155 [P] Create GoalNotificationRepository in crm-system/src/CRM.Infrastructure/Repositories/GoalNotificationRepository.cs per data-model.md
- [X] T156 [P] Create IGoalNotificationRepository interface in crm-system/src/CRM.Application/Interfaces/IGoalNotificationRepository.cs
- [X] T157 Create GoalNotificationJob background service in crm-system/src/CRM.Infrastructure/BackgroundServices/GoalNotificationJob.cs to check hourly for at-risk/overdue goals per research.md decision #6
- [X] T158 Implement notification triggers in GoalService for goal events (created, completed, at-risk, overdue) per FR-010
- [X] T159 Register GoalNotificationService and GoalNotificationJob in DependencyInjection.cs files
- [X] T160 [P] Create GoalBulkOperationsService in crm-system/src/CRM.Application/Services/GoalBulkOperationsService.cs for bulk delete and status change per plan.md
- [X] T161 [P] Create IGoalBulkOperationsService interface in crm-system/src/CRM.Application/Interfaces/IGoalBulkOperationsService.cs
- [X] T162 [P] Create BulkDeleteGoalsRequest DTO in crm-system/src/CRM.Application/Dtos/Request/BulkDeleteGoalsRequest.cs with goalIds array (max 50) and confirmation boolean per contracts/bulk-operations-endpoints.openapi.yaml
- [X] T163 [P] Create BulkStatusChangeRequest DTO with goalIds and newStatus (active/cancelled only) per contracts
- [X] T164 [P] Create BulkOperationResultResponse DTO with totalRequested, succeeded array, failed array per contracts
- [X] T165 [P] Create BulkDeleteGoalsRequestValidator to enforce max 50 goals limit per clarification #5
- [X] T166 [P] Create BulkStatusChangeRequestValidator to validate status values per contracts
- [X] T167 Implement POST /api/goals/bulk-delete endpoint with permission checks and detailed result per contracts/bulk-operations-endpoints.openapi.yaml
- [X] T168 [P] Implement POST /api/goals/bulk-status-change endpoint per contracts
- [X] T169 Register GoalBulkOperationsService in DependencyInjection.cs
- [X] T170 [P] Create GoalCommentRepository in crm-system/src/CRM.Infrastructure/Repositories/GoalCommentRepository.cs per data-model.md
- [X] T171 [P] Create IGoalCommentRepository interface in crm-system/src/CRM.Application/Interfaces/IGoalCommentRepository.cs
- [X] T172 [P] Create AddGoalCommentRequest DTO with commentText field per contracts/bulk-operations-endpoints.openapi.yaml
- [X] T173 [P] Create GoalCommentResponse DTO per contracts
- [X] T174 Implement GET /api/goals/{id}/comments endpoint per contracts/bulk-operations-endpoints.openapi.yaml
- [X] T175 [P] Implement POST /api/goals/{id}/comments endpoint per contracts
- [X] T176 Register GoalCommentRepository in DependencyInjection.cs
- [X] T177 [P] Add bulkDelete and bulkStatusChange methods to goalsApi.js per contracts/bulk-operations-endpoints.openapi.yaml
- [X] T178 [P] Add getComments and addComment methods to goalsApi.js per contracts
- [X] T179 [P] Create BulkOperationsToolbar component in crm-system-client/src/presentation/components/goals/BulkOperationsToolbar.jsx with select-all, delete, status change buttons per plan.md
- [X] T180 [P] Create GoalComments component in crm-system-client/src/presentation/components/goals/GoalComments.jsx to display and add comments per plan.md
- [X] T181 [P] Create GoalDetailPage in crm-system-client/src/presentation/pages/goals/GoalDetailPage.jsx showing goal details, comments, progress history per plan.md
- [X] T18& Add bulk select checkboxes to goal cards on dashboard per FR-021
- [X] T18& Implement bulk delete with confirmation dialog ("Are you sure you want to delete [N] goals?") per clarification #5
- [X] T18& Implement bulk status change dropdown (active/cancelled only) with confirmation per clarification #5
- [X] T18& Display bulk operation results (succeeded count, failed list with reasons) per BulkOperationResultResponse schema
- [X] T186 Add goal detail route in MainRoutes.jsx for GoalDetailPage
- [X] T187 Add comments thread display on GoalDetailPage using GoalComments component
- [ ] T188 [P] Implement recurring goal auto-creation logic in GoalService (when timeframe ends, create next instance, archive completed) per FR-007
- [ ] T189 [P] Add recurring goal handling to GoalSnapshotJob (check for completed recurring goals, create next instance) per FR-007
- [ ] T190 [P] Implement export functionality (CSV, Excel, PDF) for goal data per FR-016 (requires library selection, add to research.md)
- [ ] T191 Add export button on dashboard with format selector (CSV/Excel/PDF) per FR-016
- [ ] T192 [P] Add timezone display on goal detail page showing user's timezone for date calculations per FR-020 and clarification
- [ ] T193 Optimize database queries for dashboard load (single query for goals + latest snapshot using JOIN) per quickstart.md common issues
- [ ] T194 Add error boundary components to catch and display React errors gracefully
- [ ] T195 [P] Add loading skeletons for dashboard and analytics pages per MUI best practices
- [ ] T196 Verify all audit log entries created correctly (check crm_goal_audit_log table populated) per clarification #4
- [ ] T197 Run quickstart.md validation checklist (all backend and frontend tests)
- [ ] T198 Performance testing: verify dashboard loads in < 2 seconds with 50 goals per SC-006
- [ ] T199 Performance testing: verify auto-calculation updates within 5 minutes of deal close per SC-002
- [ ] T200 Performance testing: verify goal creation from template completes in < 30 seconds per SC-001
- [ ] T201 Update CLAUDE.md documentation with new goal interface features and usage per constitution
- [ ] T202 Create feature documentation in crm-system-client/rule/ folder describing goal redesign and business rules (similar to DEAL_README.md)
- [ ] T203 Final code review focusing on Clean Architecture compliance (dependency direction, layer separation) per constitution Principle I

**Checkpoint**: All cross-cutting features complete - notifications, bulk operations, comments, exports, recurring goals, documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately (database migrations, npm installs)
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (domain entities, base repositories)
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - **User Story 1 (P1)**: Auto-calculation - independent, can start after Foundational
  - **User Story 2 (P1)**: Visual dashboard - independent, can start after Foundational
  - **User Story 3 (P2)**: Templates - independent, can start after Foundational
  - **User Story 4 (P2)**: Hierarchy - depends on US1 (needs progress recalculation service for roll-up)
  - **User Story 5 (P3)**: Analytics - depends on US1 (needs progress history from auto-calculation)
- **Polish (Phase 8)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - FOUNDATIONAL for US4 and US5
- **User Story 2 (P1)**: No dependencies - can run parallel with US1
- **User Story 3 (P2)**: No dependencies - can run parallel with US1/US2
- **User Story 4 (P2)**: **Depends on US1** (requires GoalProgressCalculationService for roll-up)
- **User Story 5 (P3)**: **Depends on US1** (requires progress history data from auto-calculation)

### Within Each User Story

- Backend domain entities before services
- Services before controllers/endpoints
- Repository registration before service usage
- Frontend API client methods before components
- Components before pages
- Pages before route registration

### Parallel Opportunities

- **Phase 1 (Setup)**: T002-T008 (all table creation scripts) can run in parallel
- **Phase 2 (Foundational)**: T013-T018 (all new domain entities) can run in parallel, T020-T023 (repositories) can run in parallel
- **User Stories**: US1 and US2 can be developed in parallel (different teams), US3 can overlap
- **Within US1**: T028-T033 (calculation methods), T038-T039 (background jobs), T043-T048 (DTOs) all parallelizable
- **Within US2**: T066-T070 (backend changes) can partially overlap with T071-T078 (frontend)
- **Within US3**: T080-T087 (DTOs and validators), T088-T091 (endpoints) can overlap with T096-T104 (frontend)
- **Within US4**: T106-T113 (service methods), T114-T119 (DTOs and endpoints) can overlap with T125-T135 (frontend)
- **Within US5**: T136-T142 (backend metrics) can run while T143-T152 (frontend charts) are built
- **Phase 8 (Polish)**: T153-T159 (notifications), T160-T169 (bulk ops), T170-T176 (comments) all parallelizable

---

## Parallel Example: User Story 1

```bash
# Launch all domain entities together (Phase 2):
Task T013: "Create GoalProgressHistory entity"
Task T014: "Create GoalTemplate entity"
Task T015: "Create GoalHierarchyLink entity"

# Launch all calculation methods for US1 together:
Task T030: "Implement CalculateRevenueProgress"
Task T031: "Implement CalculateDealsProgress"
Task T032: "Implement CalculateActivitiesProgress"
Task T033: "Implement CalculateTasksProgress"

# Launch DTOs in parallel:
Task T043: "Create GoalForecastResponse DTO"
Task T044: "Extend GoalResponse DTO"
Task T047: "Create ManualProgressAdjustmentRequest DTO"
Task T048: "Create ManualProgressAdjustmentRequestValidator"

# Launch frontend API methods together:
Task T053: "Add getProgressHistory to goalsApi.js"
Task T054: "Add getForecast to goalsApi.js"
Task T055: "Add recalculate to goalsApi.js"
Task T056: "Add manualAdjustment to goalsApi.js"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (T001-T011) - Database ready
2. Complete Phase 2: Foundational (T012-T027) - CRITICAL foundation
3. Complete Phase 3: User Story 1 (T028-T065) - Auto-calculation working
4. **STOP and VALIDATE**: Test auto-calculation independently (close deal → goal updates)
5. Complete Phase 4: User Story 2 (T066-T079) - Dashboard with urgency sorting
6. **STOP and VALIDATE**: Test dashboard independently (create 5 goals → sorted by urgency)
7. Deploy/demo if ready (MVP with auto-tracking + visual dashboard)

### Incremental Delivery

1. **Foundation** (Phase 1-2) → Database + entities ready
2. **MVP** (Phase 3-4) → Auto-calculation + Dashboard → Deploy/Demo (addresses critical pain points)
3. **Enhancement 1** (Phase 5) → Templates → Deploy/Demo (reduces creation time)
4. **Enhancement 2** (Phase 6) → Hierarchy → Deploy/Demo (enables OKR alignment)
5. **Enhancement 3** (Phase 7) → Analytics → Deploy/Demo (provides insights)
6. **Polish** (Phase 8) → Notifications, bulk ops, comments → Final release

### Parallel Team Strategy

With 3 developers after Foundation (Phase 2) complete:

1. **Team completes Phase 1-2 together** (Setup + Foundational)
2. **Once Foundational done, parallel development:**
   - **Developer A**: User Story 1 (Auto-calculation) - T028-T065
   - **Developer B**: User Story 2 (Visual Dashboard) - T066-T079
   - **Developer C**: User Story 3 (Templates) - T080-T105
3. **Sequential for dependencies:**
   - **Developer A** then does User Story 4 (Hierarchy, depends on US1) - T106-T135
   - **Developer B** then does User Story 5 (Analytics, depends on US1) - T136-T152
4. **All developers**: Phase 8 (Polish) - T153-T203

---

## Summary Statistics

**Total Tasks**: 203 tasks

**Tasks per User Story**:
- Phase 1 (Setup): 11 tasks
- Phase 2 (Foundational): 16 tasks (BLOCKING)
- Phase 3 (User Story 1 - Auto-calculation): 38 tasks
- Phase 4 (User Story 2 - Visual Dashboard): 14 tasks
- Phase 5 (User Story 3 - Templates): 26 tasks
- Phase 6 (User Story 4 - Hierarchy): 30 tasks
- Phase 7 (User Story 5 - Analytics): 17 tasks
- Phase 8 (Polish): 51 tasks

**Parallel Opportunities**: 89 tasks marked [P] can run in parallel

**Independent Test Criteria**:
- ✅ **US1**: Create revenue goal, close $25K deal → verify 25% progress auto-updates
- ✅ **US2**: Create 5 goals with various dates → verify urgency sorting (overdue first, red alert)
- ✅ **US3**: Select template, set target → verify creation completes in < 30 seconds
- ✅ **US4**: Create company goal $1M, 4 team goals → verify hierarchy displays, progress rolls up
- ✅ **US5**: View analytics with 12mo history → verify trends, velocity, comparisons display

**Suggested MVP Scope**: User Stories 1 & 2 (52 tasks after Foundation)
- Delivers auto-calculation (eliminates 90% of manual work per SC-005)
- Provides visual dashboard (enables 5-second goal identification per SC-007)
- Addresses most critical user pain points
- Independently testable and deployable

**Format Validation**: ✅ All 203 tasks follow checklist format:
- Checkbox: `- [ ]`
- Task ID: T001-T203 sequential
- [P] marker: 89 parallelizable tasks
- [Story] label: 125 tasks with US1-US5 labels
- File paths: All implementation tasks include exact paths

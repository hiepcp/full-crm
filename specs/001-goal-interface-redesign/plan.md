# Implementation Plan: Goal Interface Redesign

**Branch**: `001-goal-interface-redesign` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-goal-interface-redesign/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Redesign the Goal interface to provide automatic progress tracking based on CRM data (deals, activities, revenue), visual priority-based dashboards, goal templates for quick creation, hierarchical goal alignment (OKR-style), and performance analytics. This addresses critical issues in the current implementation: manual progress entry disconnected from CRM data, lack of urgency-based prioritization, time-consuming goal creation process, and no goal hierarchy support. The redesign will integrate deeply with existing CRM entities (Deals, Activities, Customers) to automatically calculate progress, reducing administrative overhead by 90% and increasing goal completion rates by 25% within 3 months.

## Technical Context

**Language/Version**:
- Frontend: JavaScript (ES6+) with React 18.x and Vite
- Backend: C# with .NET 8

**Primary Dependencies**:
- Frontend: React, Material-UI (MUI), Redux/Context API, Axios, React Router, Chart.js (for trend sparklines), @azure/msal-react
- Backend: ASP.NET Core 8, Dapper with SimpleCRUD, FluentValidation, Serilog, Res.Shared.AuthN (v1.0.3), Res.Shared.AuthZ (v1.0.3)

**Storage**: MySQL database (existing CRM database; new tables for goals, progress history, templates, notifications, comments, hierarchy links, audit logs)

**Testing**:
- Frontend: Not yet configured (framework TBD)
- Backend: xUnit with coverlet.collector

**Target Platform**:
- Frontend: Web browsers (Chrome, Firefox, Edge, Safari) - HTTPS at https://crm.local.com:3000 (dev), deployed to crm-dev/sandbox/uat.response.com.vn
- Backend: Linux server (hosted) - HTTPS at https://api-crm.local.com (dev)

**Project Type**: Web application (React frontend + .NET backend API)

**Performance Goals**:
- Dashboard load time: < 2 seconds for 50 active goals with metrics
- Auto-calculation: Progress updates within 5 minutes of CRM data changes
- API response time: < 200ms p95 for goal queries
- Support: 10,000 concurrent users without degradation

**Constraints**:
- Must maintain backward compatibility with existing Goal API structure (extend, don't break)
- Must respect existing Clean Architecture layers (Domain, Application, Infrastructure, Api)
- Must use existing authentication (JWT + API Key via Res.Shared.AuthN)
- Must follow existing audit trail patterns (pipeline_logs reference)
- All goals visible to all users (clarification #1)
- Bulk operations limited to 50 goals per batch (clarification #5)

**Scale/Scope**:
- Expected: 1,000+ active goals across 200+ users
- Historical data: 3+ years of goal history for analytics
- Real-time updates: Progress recalculation triggered by deal/activity state changes
- 7 new database tables, 21 new API endpoints (extend existing GoalController), 5 major UI components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Clean Architecture ✅ PASS

**Frontend Structure**:
- `app/` - Route configuration for /goals dashboard, contexts for goal state management
- `presentation/` - Goal dashboard components, creation dialogs, progress visualizations, template selector
- `application/` - Goal business logic (progress calculation, hierarchy roll-up, forecast algorithms)
- `domain/` - Goal entities, validation rules, state transitions
- `infrastructure/api/` - goalsApi.js (extend existing with new endpoints)

**Backend Structure**:
- `CRM.Api/Controllers/` - GoalController (extend existing with new endpoints: templates, hierarchy, bulk operations)
- `CRM.Application/` - GoalService, GoalTemplateService, GoalHierarchyService, GoalProgressCalculationService, DTOs, Validators
- `CRM.Domain/Entities/` - Goal (extend), GoalProgressHistory, GoalTemplate, GoalNotification, GoalComment, GoalHierarchyLink, GoalAuditLog
- `CRM.Infrastructure/Repositories/` - GoalRepository (extend), GoalProgressHistoryRepository, GoalTemplateRepository, GoalHierarchyRepository

**Dependency Rule**: Satisfied - Domain has no dependencies, Application depends only on Domain, Infrastructure/Api depend on Application+Domain.

**Rationale**: This feature extends the existing Goal module following the established Clean Architecture pattern. No violations.

### Principle II: Security-First Development ✅ PASS

**Authentication & Authorization**:
- Uses existing dual authentication: XApiKey header + JWT Bearer token
- Respects existing role-based access (individuals/managers/admins) via Res.Shared.AuthZ
- All goals visible to all users (per clarification #1) - simpler security model, no additional ACL needed
- Bulk operations use same permission model as individual operations (FR-021)

**Data Protection**:
- No new sensitive data beyond existing CRM data
- Audit logs capture user actions (FR-013) with timestamps and user IDs
- HTTPS enforced via existing infrastructure

**Input Validation**:
- All new request DTOs validated with FluentValidation (CreateGoalTemplateRequest, BulkDeleteGoalsRequest, etc.)
- Uses existing ValidationExceptionMiddleware

**Audit Logging**:
- Comprehensive audit trail per FR-013: CRUD operations, progress updates (before/after values), status changes, ownership changes, calculation events
- Follows existing Serilog configuration with UserEmail, RequestPath, RequestMethod enrichment
- New audit log entity for goal-specific tracking

**Rationale**: Extends existing security infrastructure without introducing new attack surfaces. Comprehensive audit trail meets compliance requirements.

### Principle III: API-Driven Design ✅ PASS

**Endpoint Conventions**:
- Extends existing `/api/goals` endpoints following REST conventions
- New endpoints: GET `/api/goals/templates`, POST `/api/goals/bulk-delete`, POST `/api/goals/bulk-status-change`, GET `/api/goals/{id}/hierarchy`, GET `/api/goals/{id}/progress-history`, POST `/api/goals/{id}/comments`, etc.
- Uses POST for complex queries (existing pattern: POST `/api/goals/query`)

**Request/Response DTOs**:
- New DTOs: GoalTemplateResponse, BulkDeleteGoalsRequest, BulkStatusChangeRequest, GoalHierarchyResponse, GoalProgressHistoryResponse, GoalCommentRequest/Response, GoalForecastResponse
- Extends existing: GoalResponse (add forecast fields, hierarchy links, calculation source)
- Separate from domain entities, mapped in Application layer

**Error Handling**:
- Uses existing ValidationExceptionMiddleware and global exception handler
- Bulk operations return detailed results (succeeded/failed goal IDs with reasons)

**Frontend Integration**:
- Extends existing `goalsApi.js` with new methods
- Uses existing axiosInstance with token refresh interceptor
- Maintains existing error handling patterns

**Rationale**: Builds on established API patterns. No new architectural decisions required.

### Principle IV: Testing Discipline ✅ PASS (Optional)

**Backend Testing**:
- When implemented, tests will be in `tests/CRMApi.UnitTests` (existing project)
- Critical areas to test:
  - Progress calculation logic (FR-001, FR-002)
  - Hierarchy roll-up calculations (FR-006)
  - Forecast velocity calculations (FR-009)
  - Bulk operation transaction handling (FR-021)
  - Snapshot frequency logic (FR-008, clarification #3)

**Frontend Testing**:
- Framework TBD (no current tests)
- When implemented, should cover:
  - Template selection and goal creation flow (< 30 seconds, SC-001)
  - Dashboard urgency sorting logic (FR-003)
  - Progress visualization and trend sparklines (FR-019)

**Rationale**: Testing optional per constitution. If implemented, critical calculation logic (progress, forecasts, hierarchy) should be prioritized.

### Principle V: Observability & Audit Trail ✅ PASS

**Structured Logging**:
- Uses existing Serilog configuration
- Logs to `logs/info/`, `logs/warning/`, `logs/error/` with daily rolling
- Progress calculation events logged at Info level
- Calculation failures logged at Warning level (per clarification #2)
- Enriched with UserEmail, RequestPath, RequestMethod

**Business Audit Trails**:
- New `goal_audit_log` table captures all changes (FR-013, clarification #4)
- Fields: goal_id, event_type (create/update/delete/progress_update/status_change/calc_event), before_value, after_value, user_id, timestamp, change_details (JSON)
- Follows existing pattern from `pipeline_logs` table

**Performance Monitoring**:
- Log slow progress calculations (> 1 second)
- Log bulk operation performance (time per goal, total batch time)
- Monitor CRM data query performance for auto-calculation

**Error Tracking**:
- Calculation failures logged with full context (FR-001, clarification #2)
- Display warning indicator to user, allow manual override
- Bulk operation failures detailed per goal

**Rationale**: Comprehensive audit trail meets compliance and debugging requirements. Follows existing Serilog patterns.

### Constitution Compliance Summary

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Clean Architecture | ✅ PASS | Extends existing structure, follows dependency rule |
| II. Security-First | ✅ PASS | Uses existing auth, comprehensive audit trail |
| III. API-Driven Design | ✅ PASS | REST endpoints, DTOs, existing patterns |
| IV. Testing Discipline | ✅ PASS | Optional; critical calculation logic recommended |
| V. Observability | ✅ PASS | Serilog + audit table, follows existing patterns |

**GATE RESULT**: ✅ **PASS** - No violations. Ready for Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/001-goal-interface-redesign/
├── spec.md                    # Feature specification
├── plan.md                    # This file (/speckit.plan command output)
├── research.md                # Phase 0 output (/speckit.plan command)
├── data-model.md              # Phase 1 output (/speckit.plan command)
├── quickstart.md              # Phase 1 output (/speckit.plan command)
├── contracts/                 # Phase 1 output (/speckit.plan command)
│   ├── goal-endpoints.openapi.yaml
│   ├── goal-templates-endpoints.openapi.yaml
│   ├── goal-hierarchy-endpoints.openapi.yaml
│   └── bulk-operations-endpoints.openapi.yaml
├── checklists/
│   └── requirements.md        # Requirements quality checklist
└── tasks.md                   # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Frontend: crm-system-client/
crm-system-client/
├── src/
│   ├── app/
│   │   ├── routes/groups/
│   │   │   └── MainRoutes.jsx             # Add /goals routes (existing, extend)
│   │   ├── contexts/
│   │   │   └── GoalContext.jsx            # NEW: Goal state management
│   │   └── store/
│   │       └── slices/goalSlice.js        # NEW: Redux slice (if using Redux)
│   ├── presentation/
│   │   ├── pages/
│   │   │   └── goals/
│   │   │       ├── index.jsx              # EXTEND: Main goals dashboard
│   │   │       ├── GoalDashboard.jsx      # NEW: Priority-based dashboard view
│   │   │       ├── GoalTemplateSelector.jsx  # NEW: Template selection UI
│   │   │       ├── GoalCreationDialog.jsx # EXTEND: Quick creation flow
│   │   │       ├── GoalHierarchyView.jsx  # NEW: Hierarchy visualization
│   │   │       ├── GoalAnalytics.jsx      # NEW: Performance analytics page
│   │   │       └── GoalDetailPage.jsx     # NEW: Goal detail with comments, history
│   │   ├── components/
│   │   │   └── goals/
│   │   │       ├── GoalCard.jsx           # EXTEND: Add sparklines, status badges
│   │   │       ├── GoalProgressBar.jsx    # EXTEND: Add trend indicators
│   │   │       ├── GoalForecast.jsx       # NEW: Forecast display component
│   │   │       ├── GoalComments.jsx       # NEW: Comments thread component
│   │   │       ├── BulkOperationsToolbar.jsx  # NEW: Bulk delete/status change
│   │   │       └── GoalHierarchyTree.jsx  # NEW: Tree visualization component
│   │   └── layouts/
│   │       └── MainLayout.jsx             # Existing (no changes)
│   ├── application/
│   │   └── services/
│   │       ├── goalProgressCalculator.js  # NEW: Client-side calculation logic
│   │       ├── goalForecastService.js     # NEW: Velocity and forecast calculations
│   │       └── goalHierarchyService.js    # NEW: Hierarchy roll-up logic
│   ├── domain/
│   │   └── entities/
│   │       └── Goal.js                    # EXTEND: Add hierarchy, forecast fields
│   ├── infrastructure/
│   │   └── api/
│   │       └── goalsApi.js                # EXTEND: Add new endpoint methods
│   └── utils/
│       └── constants.js                   # EXTEND: Add GOAL_STATUSES, GOAL_TYPES
└── tests/                                 # TBD when testing framework configured

# Backend: crm-system/
crm-system/
├── src/
│   ├── CRM.Api/
│   │   └── Controllers/
│   │       └── GoalController.cs          # EXTEND: Add templates, hierarchy, bulk ops endpoints
│   ├── CRM.Application/
│   │   ├── Services/
│   │   │   ├── GoalService.cs             # EXTEND: Add calculation, forecast logic
│   │   │   ├── GoalTemplateService.cs     # NEW: Template CRUD
│   │   │   ├── GoalHierarchyService.cs    # NEW: Hierarchy management, roll-up
│   │   │   ├── GoalProgressCalculationService.cs  # NEW: Auto-calculation from CRM data
│   │   │   ├── GoalNotificationService.cs # NEW: Send notifications (FR-010)
│   │   │   └── GoalBulkOperationsService.cs  # NEW: Bulk delete/status change
│   │   ├── Interfaces/
│   │   │   ├── IGoalTemplateService.cs    # NEW
│   │   │   ├── IGoalHierarchyService.cs   # NEW
│   │   │   ├── IGoalProgressCalculationService.cs  # NEW
│   │   │   ├── IGoalNotificationService.cs # NEW
│   │   │   └── IGoalBulkOperationsService.cs  # NEW
│   │   ├── Dtos/
│   │   │   ├── Request/
│   │   │   │   ├── CreateGoalTemplateRequest.cs  # NEW
│   │   │   │   ├── UpdateGoalTemplateRequest.cs  # NEW
│   │   │   │   ├── LinkGoalToParentRequest.cs    # NEW
│   │   │   │   ├── BulkDeleteGoalsRequest.cs     # NEW
│   │   │   │   ├── BulkStatusChangeRequest.cs    # NEW
│   │   │   │   ├── AddGoalCommentRequest.cs      # NEW
│   │   │   │   └── ManualProgressAdjustmentRequest.cs  # NEW (FR-018)
│   │   │   └── Response/
│   │   │       ├── GoalTemplateResponse.cs       # NEW
│   │   │       ├── GoalHierarchyResponse.cs      # NEW
│   │   │       ├── GoalProgressHistoryResponse.cs # NEW
│   │   │       ├── GoalForecastResponse.cs       # NEW
│   │   │       ├── GoalCommentResponse.cs        # NEW
│   │   │       ├── BulkOperationResultResponse.cs # NEW
│   │   │       └── GoalAuditLogResponse.cs       # NEW
│   │   ├── Validators/
│   │   │   ├── CreateGoalTemplateRequestValidator.cs  # NEW
│   │   │   ├── BulkDeleteGoalsRequestValidator.cs     # NEW
│   │   │   ├── BulkStatusChangeRequestValidator.cs    # NEW
│   │   │   └── ManualProgressAdjustmentRequestValidator.cs  # NEW
│   │   └── DependencyInjection.cs         # EXTEND: Register new services
│   ├── CRM.Domain/
│   │   └── Entities/
│   │       ├── Goal.cs                    # EXTEND: Add hierarchy fields, calculation source
│   │       ├── GoalProgressHistory.cs     # NEW
│   │       ├── GoalTemplate.cs            # NEW
│   │       ├── GoalNotification.cs        # NEW
│   │       ├── GoalComment.cs             # NEW
│   │       ├── GoalHierarchyLink.cs       # NEW
│   │       └── GoalAuditLog.cs            # NEW
│   └── CRM.Infrastructure/
│       ├── Repositories/
│       │   ├── GoalRepository.cs          # EXTEND: Add hierarchy queries, progress history
│       │   ├── GoalProgressHistoryRepository.cs  # NEW
│       │   ├── GoalTemplateRepository.cs  # NEW
│       │   ├── GoalHierarchyRepository.cs # NEW
│       │   ├── GoalNotificationRepository.cs # NEW
│       │   ├── GoalCommentRepository.cs   # NEW
│       │   └── GoalAuditLogRepository.cs  # NEW
│       ├── Sqls/
│       │   ├── reset_database.sql         # EXTEND: Add new tables (DDL)
│       │   └── SampleData/
│       │       ├── GoalSampleData.sql     # EXTEND: Add template samples
│       │       └── GoalHierarchySampleData.sql  # NEW
│       ├── BackgroundServices/
│       │   ├── GoalProgressCalculationJob.cs  # NEW: Scheduled auto-calculation
│       │   ├── GoalNotificationJob.cs     # NEW: Scheduled notifications (at-risk, overdue)
│       │   └── GoalSnapshotJob.cs         # NEW: Daily midnight snapshot (clarification #3)
│       └── DependencyInjection.cs         # EXTEND: Register new repositories, background services
└── tests/
    └── CRMApi.UnitTests/
        ├── GoalProgressCalculationServiceTests.cs  # NEW
        ├── GoalHierarchyServiceTests.cs    # NEW
        ├── GoalForecastServiceTests.cs     # NEW
        └── GoalBulkOperationsServiceTests.cs  # NEW
```

**Structure Decision**: This is a **web application** with React frontend and .NET backend API. The structure follows the existing Clean Architecture pattern established in the Full CRM System. Frontend uses the layered approach (app/presentation/application/domain/infrastructure), and backend follows the four-layer .NET structure (Api/Application/Domain/Infrastructure). This feature **extends** the existing Goal module rather than creating a new isolated module, leveraging existing infrastructure (authentication, database, logging, API patterns).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected. All constitution principles are satisfied.*


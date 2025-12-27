# Implementation Plan: Contract Activity Fields Enhancement

**Branch**: `006-contract-activity-fields` | **Date**: 2025-12-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-contract-activity-fields/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add two new optional fields to contract-type activities: contract date (date when contract was signed/effective) and contract value (financial worth). These fields enable future goal tracking, revenue forecasting, and contract performance analysis. The implementation follows Clean Architecture principles across both frontend (React) and backend (.NET 8 API), with proper validation, formatting, and filtering capabilities.

## Technical Context

**Frontend**:
- **Language/Version**: JavaScript (ES6+), React 18.x
- **Primary Dependencies**: Material-UI (MUI), Redux Toolkit, Axios, date-fns/dayjs for date formatting
- **Storage**: REST API calls to CRM backend (no local storage for activity data)
- **Testing**: Framework not yet configured (mock data in `src/data/` during development)
- **Target Platform**: Modern web browsers (Chrome, Firefox, Edge, Safari)
- **Project Type**: Single Page Application (SPA) with Clean Architecture

**Backend**:
- **Language/Version**: C# .NET 8
- **Primary Dependencies**: Dapper with SimpleCRUD, FluentValidation, Serilog, MySQL connector
- **Storage**: MySQL database (existing `activities` table needs schema extension)
- **Testing**: xUnit with coverlet.collector (optional but encouraged)
- **Target Platform**: Windows/Linux server with .NET 8 runtime
- **Project Type**: REST API with Clean Architecture (Domain/Application/Infrastructure/Api layers)

**Performance Goals**:
- API response time < 200ms for activity CRUD operations
- Date range filtering must return results in < 2 seconds
- Frontend form submission < 30 seconds end-to-end

**Constraints**:
- Must maintain backward compatibility with existing activities
- Contract date and value fields must be optional (nullable)
- Must not break existing activity UI/UX flows
- Currency formatting must respect system locale/settings

**Scale/Scope**:
- Affects ~10-20 files (frontend components, backend services, DTOs, repository)
- Database migration adds 2 columns to existing `activities` table
- No new tables required

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Clean Architecture (Mandatory) ✓ PASS

- **Frontend**: Will follow established structure in `crm-system-client/`:
  - Domain/Application: Business logic for contract field validation
  - Infrastructure: API client updates in `infrastructure/api/activitiesApi.js`
  - Presentation: Form components in `presentation/pages/activity/` and `presentation/components/`

- **Backend**: Will follow established structure in `crm-system/`:
  - Domain: Update `Activity` entity with new fields
  - Application: Update DTOs, validators, services, and interfaces
  - Infrastructure: Update repository and SQL queries
  - Api: Update controllers and register new validators

- **Dependency Rule**: ✓ Maintained - no outward dependencies

**Status**: PASS - Follows existing Clean Architecture structure

### II. Security-First Development ✓ PASS

- **Authentication & Authorization**: Uses existing JWT + API Key middleware (no changes needed)
- **Input Validation**:
  - Contract value must be validated (non-negative numeric) using FluentValidation
  - Contract date must be validated (valid date format)
- **Data Protection**: No sensitive data in these fields (dates and monetary values are business data, not PII)
- **CORS Policy**: No changes needed
- **Audit Logging**: Will use existing Serilog infrastructure for activity modifications

**Status**: PASS - Leverages existing security infrastructure, adds appropriate validation

### III. API-Driven Design ✓ PASS

- **Endpoint Conventions**: Will extend existing `/activities` endpoints (GET, POST, PUT)
- **Request/Response DTOs**: Will update `ActivityRequest` and `ActivityResponse` DTOs
- **Error Handling**: Uses existing middleware (ValidationExceptionMiddleware)
- **Frontend Integration**: Will update existing `activitiesApi.js` axios instance

**Status**: PASS - Extends existing API contracts without breaking changes

### IV. Testing Discipline ✓ PASS (Optional)

- **Backend**: Can add validation tests for contract value (non-negative check)
- **Frontend**: Mock data can be extended with contract fields
- **Integration**: Contract field persistence can be tested through existing activity tests

**Status**: PASS - Optional testing, standards are clear if implemented

### V. Observability & Audit Trail ✓ PASS

- **Structured Logging**: Will use existing Serilog configuration
- **Business Audit Trails**: Activity modifications already tracked via `created_by`/`updated_by` fields
- **Error Tracking**: Will use existing exception middleware

**Status**: PASS - Leverages existing observability infrastructure

### VI. File Management & Preview ⚠️ NOT APPLICABLE

- This feature does not involve file attachments or preview functionality

**Status**: NOT APPLICABLE

### Overall Constitution Compliance

**Result**: ✓ **ALL GATES PASS**

No violations detected. This feature is a straightforward extension of existing activity functionality following established architectural patterns.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Frontend (crm-system-client/)
crm-system-client/
├── src/
│   ├── presentation/
│   │   ├── pages/
│   │   │   └── activity/               # Activity pages (to be modified)
│   │   └── components/
│   │       └── activity/               # Activity components (to be modified)
│   ├── infrastructure/
│   │   └── api/
│   │       └── activitiesApi.js        # Activity API client (to be modified)
│   ├── domain/                         # Domain entities (Activity interface)
│   ├── application/                    # Business logic for validation
│   └── utils/
│       └── constants.js                # May add contract-related constants

# Backend (crm-system/)
crm-system/
└── src/
    ├── CRM.Domain/
    │   └── Entities/
    │       └── Activity.cs             # Add contract_date, contract_value props
    ├── CRM.Application/
    │   ├── Dtos/
    │   │   ├── ActivityRequest.cs      # Add new fields to request DTO
    │   │   └── ActivityResponse.cs     # Add new fields to response DTO
    │   ├── Validators/
    │   │   └── ActivityValidator.cs    # Add validation for contract fields
    │   ├── Services/
    │   │   └── ActivityService.cs      # Handle contract field logic (if needed)
    │   └── Interfaces/
    │       └── IActivityRepository.cs  # Update interface for filtering
    └── CRM.Infrastructure/
        ├── Repositories/
        │   └── ActivityRepository.cs   # Add SQL for new fields & filtering
        └── Sqls/
            └── ActivitySqls.cs         # SQL queries with contract fields

# Database Migration
database/
└── migrations/
    └── add_contract_fields_to_activities.sql  # ALTER TABLE activities ADD ...
```

**Structure Decision**: Web application (frontend + backend microservices architecture). This feature extends existing activity functionality across both React frontend and .NET backend while maintaining Clean Architecture separation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected** - All constitution gates pass. This feature follows established patterns without introducing new complexity.


---

## Phase 0: Research (Completed)

**Output**: [research.md](research.md)

**Key Decisions**:
1. **Database Schema**: DATE NULL, DECIMAL(18,2) NULL for semantic correctness
2. **Date Formatting**: ISO 8601 storage, locale-based display
3. **Currency Formatting**: `Intl.NumberFormat` with locale
4. **Value Validation**: Non-negative, max 999,999,999,999.99
5. **Date Filtering**: Query parameters (`contract_date_from/to`)
6. **Backward Compatibility**: NULL-safe handling, graceful degradation
7. **UI/UX Pattern**: Conditional contract section

---

## Phase 1: Design & Contracts (Completed)

**Outputs**:
- [data-model.md](data-model.md) - Entity changes and database schema
- [contracts/api-contracts.md](contracts/api-contracts.md) - API request/response contracts
- [quickstart.md](quickstart.md) - Developer setup guide

**Design Summary**:
- **Entity Changes**: 2 nullable properties added to Activity entity
- **Database Migration**: ALTER TABLE adds 2 columns + optional indexes
- **API Contracts**: 2 new DTO fields, 4 new filter parameters, backward compatible
- **Validation**: FluentValidation rules for non-negative values and date format

---

## Constitution Check (Post-Design Re-evaluation)

**Status**: ✓ **ALL GATES STILL PASS**

**Re-evaluation Notes**:
- Clean Architecture maintained across all layers
- No security concerns introduced (validation enforced, no sensitive data)
- API contracts remain backward compatible
- Observability leverages existing Serilog infrastructure
- No new complexity or architectural deviations

**Final Assessment**: Feature design fully compliant with constitution. Ready for implementation phase (`/speckit.tasks`).

---

## Next Steps

With planning complete, proceed to:

1. **`/speckit.tasks`** - Generate actionable, dependency-ordered tasks.md for implementation
2. **Implementation** - Follow tasks.md to implement the feature
3. **Testing** - Use quickstart.md for manual and automated testing
4. **Code Review** - Submit PR with reference to spec and plan documents

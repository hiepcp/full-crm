# Implementation Plan: Add Contract Activity Type with Date and Value

**Branch**: `005-contract-activity` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-contract-activity/spec.md`

## Summary

Enhance the CRM activity tracking system by adding a "Contract" activity type with two new fields: contract date and contract value. This enables sales representatives to record contract-related events (signing, renewals, amendments) with specific contract information, providing the data foundation for future goal-setting and revenue forecasting features. The implementation extends the existing Activity entity across all three architectural layers (database, backend API, frontend) while maintaining Clean Architecture principles and backward compatibility.

## Technical Context

**Language/Version**:
- Frontend: JavaScript (ES6+) with React 18.x and Vite
- Backend: C# with .NET 8
- Database: MySQL 8.x

**Primary Dependencies**:
- Frontend: React, Material-UI (MUI), Axios, Redux (state management)
- Backend: ASP.NET Core 8, Dapper (data access), SimpleCRUD, FluentValidation, Serilog
- Shared: Res.Shared.AuthN (v1.0.3), Res.Shared.AuthZ (v1.0.3)

**Storage**:
- MySQL database with `crm_activity` table (existing)
- New columns: `contract_date` (DATE, nullable), `contract_value` (DECIMAL(12,2), nullable)
- Enum extension: ActivityType ENUM to include "contract" value

**Testing**:
- Backend: xUnit with .NET 9 (CRMApi.UnitTests project)
- Frontend: Not yet configured (mock data in development)

**Target Platform**:
- Web application: HTTPS-enabled local development (https://crm.local.com:3000)
- Deployment: Sandbox, UAT, Production environments

**Project Type**: Web application (three-tier microservices architecture)

**Performance Goals**:
- Contract activity creation: < 45 seconds (user-facing)
- Filter/sort operations: < 2 seconds response time
- Currency formatting: Instant (< 100ms rendering)
- Validation feedback: < 500ms

**Constraints**:
- Database precision: DECIMAL(12,2) for contract value (prevents rounding errors)
- Single currency: Use CRM default currency setting (no multi-currency support in v1)
- Backward compatibility: Must not break existing activity types
- Coordinated deployment: Database, backend, and frontend must deploy together

**Scale/Scope**:
- Incremental feature addition to existing Activity module
- Two new database columns, 5+ new DTO properties
- 3-4 frontend form fields, multiple display components
- Impact: All activity-related UI components (ActivityFeed, activity forms, filters, reports)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Clean Architecture (Mandatory)
- ✅ **Frontend Layers**: Changes will follow app/ → presentation/ → infrastructure/ structure
  - `utils/constants.js`: Add CONTRACT activity type constant
  - `infrastructure/api/`: No changes (existing activity API supports new fields)
  - `presentation/components/`: Update ActivityFeed, activity form components
  - `presentation/pages/`: Activity-related pages will inherit new functionality
- ✅ **Backend Layers**: Changes will follow *.Domain/ → *.Application/ → *.Infrastructure/ → *.Api/ structure
  - `CRM.Domain/Entities/Activity`: Add ContractDate, ContractValue properties
  - `CRM.Application/Dtos/ActivityResponse`: Add contract field DTOs
  - `CRM.Application/Validators/`: Add ContractValue validation (positive number)
  - `CRM.Infrastructure/Repositories/`: Update activity repository for new columns
  - `CRM.Api/Controllers/ActivityController`: No changes (generic activity CRUD)
- ✅ **Dependency Rule**: All dependencies point inward (no violations)
- ✅ **Service Registration**: New validators registered in `DependencyInjection.cs`

### II. Security-First Development
- ✅ **Input Validation**: Contract value validated via FluentValidation (positive number, max precision)
- ✅ **Data Protection**: No sensitive data in contract fields (dates and values are business data)
- ✅ **Audit Logging**: Contract activities logged via existing activity audit trail (created_by, updated_by, timestamps)
- ✅ **XSS Prevention**: Contract value sanitized (numeric only), contract date uses date picker (no free text)
- ⚠️ **Note**: Contract value stored as DECIMAL to prevent precision loss (financial data integrity)

### III. API-Driven Design
- ✅ **Endpoint Conventions**: Reuse existing `/activities` REST endpoints (POST, PUT, GET, DELETE)
- ✅ **DTOs**: ActivityRequest/ActivityResponse DTOs extended with ContractDate, ContractValue
- ✅ **Error Handling**: Validation errors handled by ValidationExceptionMiddleware
- ✅ **Frontend Integration**: Axios instance already configured for activity API

### IV. Testing Discipline (Optional but encouraged)
- ⚠️ **Backend Tests**: Should add unit tests for contract value validation logic
- ⚠️ **Integration Tests**: Should test contract activity CRUD with new fields
- ⚠️ **Frontend Tests**: Framework not yet configured (manual testing during development)

### V. Observability & Audit Trail
- ✅ **Structured Logging**: Activity operations already logged via Serilog
- ✅ **Business Audit**: created_by, updated_by, created_at, updated_at fields track changes
- ✅ **Validation Logging**: FluentValidation errors logged via middleware

### VI. File Management & Preview
- ✅ **N/A**: This feature does not involve file attachments or preview functionality

**Gate Status**: ✅ **PASSED** - All constitution principles satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/005-contract-activity/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (completed)
├── research.md          # Phase 0 output (currency formatting, validation patterns)
├── data-model.md        # Phase 1 output (Activity entity schema)
├── quickstart.md        # Phase 1 output (development setup steps)
├── contracts/           # Phase 1 output (Activity API contract extensions)
│   └── activity-api.yaml
└── checklists/
    └── requirements.md  # Specification quality checklist (completed)
```

### Source Code (repository root)

This is a web application with separate frontend and backend projects:

```text
# Backend (crm-system)
crm-system/
├── src/
│   ├── CRM.Api/
│   │   └── Controllers/
│   │       └── ActivityController.cs        # (Existing - no changes)
│   ├── CRM.Application/
│   │   ├── Dtos/
│   │   │   ├── ActivityRequest.cs          # (Update: add ContractDate, ContractValue)
│   │   │   └── ActivityResponse.cs         # (Update: add ContractDate, ContractValue, IsContract)
│   │   ├── Validators/
│   │   │   └── ActivityRequestValidator.cs # (Update: add contract value validation)
│   │   ├── Services/
│   │   │   └── ActivityService.cs          # (Update: handle contract-specific logic)
│   │   └── DependencyInjection.cs          # (Update if new validators added)
│   ├── CRM.Domain/
│   │   ├── Entities/
│   │   │   └── Activity.cs                 # (Update: add ContractDate, ContractValue properties)
│   │   └── Enums/
│   │       └── ActivityType.cs             # (Update: add Contract enum value)
│   └── CRM.Infrastructure/
│       ├── Repositories/
│       │   └── ActivityRepository.cs       # (Update: SQL queries for new columns)
│       └── Sqls/
│           └── ActivitySqls.cs             # (Update: SELECT/INSERT/UPDATE queries)
└── tests/
    └── CRMApi.UnitTests/
        └── Validators/
            └── ActivityRequestValidatorTests.cs # (New: test contract value validation)

# Frontend (crm-system-client)
crm-system-client/
├── src/
│   ├── utils/
│   │   ├── constants.js                    # (Update: add CONTRACT to ACTIVITY_TYPES)
│   │   └── currencyHelper.js               # (New: currency formatting utility)
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── ActivityFeed/
│   │   │   │       └── ActivityFeed.jsx    # (Update: display contract date/value)
│   │   │   └── activity/
│   │   │       ├── ActivityForm.jsx        # (Update: add contract date/value inputs)
│   │   │       └── ContractFields.jsx      # (New: contract-specific form fields)
│   │   └── pages/
│   │       └── activity/
│   │           └── ActivityList.jsx        # (Update: add contract value column, date filter)
│   └── infrastructure/
│       └── api/
│           └── activityApi.js              # (Existing - no changes, API handles new fields)
└── database/
    └── migrations/
        └── 005_add_contract_activity_fields.sql # (New: ALTER TABLE migration)

# Database Migration
database/migrations/
└── 005_add_contract_activity_fields.sql
    # ALTER TABLE crm_activity ADD contract_date DATE NULL;
    # ALTER TABLE crm_activity ADD contract_value DECIMAL(12,2) NULL;
    # ALTER TABLE crm_activity MODIFY activity_type ENUM(..., 'contract');
```

**Structure Decision**: Web application architecture (Option 2) with three separate projects:
1. **crm-system** (Backend .NET 8 API): Handles business logic, data access, validation
2. **crm-system-client** (Frontend React SPA): Handles UI, user interactions, API integration
3. **res-auth-api** (Auth API): Not impacted by this feature

Changes span all three Clean Architecture layers in both frontend and backend, following the existing patterns for activity management.

## Complexity Tracking

*No constitution violations - this section is empty.*

## Phase 0: Research & Technology Decisions

### Research Topics

1. **Currency Formatting**: Best practices for displaying contract values with currency symbols and decimal precision in React
2. **Date Validation**: FluentValidation patterns for optional date fields with range warnings
3. **Decimal Precision**: MySQL DECIMAL type sizing for financial data
4. **Conditional Form Fields**: React patterns for showing/hiding contract fields based on activity type selection
5. **Aggregate Calculations**: Backend patterns for calculating total contract value by entity

### Research Output

See [research.md](./research.md) for detailed findings on:
- Currency formatting library selection (Intl.NumberFormat vs custom helper)
- FluentValidation conditional rules for contract value
- MySQL DECIMAL precision best practices
- React conditional rendering patterns for form fields
- Dapper aggregate query patterns

## Phase 1: Design Artifacts

### Data Model

See [data-model.md](./data-model.md) for:
- Activity entity schema with ContractDate and ContractValue
- Validation rules (contract value > 0, date format)
- Relationships (Activity → Customer, Lead, Deal)
- State transitions (none - contract activities follow standard lifecycle)

### API Contracts

See [contracts/activity-api.yaml](./contracts/activity-api.yaml) for:
- Updated ActivityRequest schema with contractDate and contractValue
- Updated ActivityResponse schema with contract fields
- Validation error responses for contract value
- Filter endpoints for contract date range

### Quickstart Guide

See [quickstart.md](./quickstart.md) for:
- Database migration steps
- Backend build and test commands
- Frontend development server setup
- How to test contract activity creation locally

## Next Steps

After completing this planning phase:

1. Run `/speckit.tasks` to generate the task breakdown (tasks.md)
2. Execute tasks in dependency order (database → backend → frontend)
3. Test each layer independently before integration
4. Validate against Success Criteria (SC-001 through SC-008 in spec.md)

**Ready for task generation**: All design artifacts completed in Phase 1.

# Implementation Plan: Sales Team Management

**Branch**: `002-sales-team-management` | **Date**: 2025-12-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-sales-team-management/spec.md`

**Note**: This template is filled in by `/speckit.plan` command. See `.specify/templates/commands/plan.md` for execution workflow.

## Summary

Sales team management feature for CRM system allowing creation and management of sales teams, assignment of team members with roles, and optional team-based assignment of deals and customers. Technical approach follows Clean Architecture with React frontend and .NET 8 backend API, using MySQL database with Dapper ORM.

## Technical Context

**Language/Version**:
- Frontend: React 18+ with Material-UI
- Backend: .NET 8 with C# 12

**Primary Dependencies**:
- Frontend: React, Material-UI (MUI), Axios, React Router
- Backend: ASP.NET Core Web API, Dapper, SimpleCRUD, FluentValidation, Serilog
- Auth: Separate Auth API (JWT tokens, API keys)

**Storage**: MySQL database with Dapper ORM

**Testing**:
- Frontend: Framework TBD (using mock data during development)
- Backend: xUnit with coverlet.collector

**Target Platform**:
- Frontend: Web browser (Chrome, Edge, Firefox)
- Backend: Linux/Windows server

**Project Type**: web (frontend + backend microservices)

**Performance Goals**:
- API response time: <200ms p95 for team CRUD operations
- UI responsiveness: <100ms for team selector interactions
- Database queries: Optimized with proper indexing on foreign keys
- Concurrent operations: Support 100+ concurrent team management operations

**Constraints**:
- MUST follow Clean Architecture (non-negotiable per constitution)
- MUST use existing Auth API for authentication/authorization
- MUST be HTTPS-only (mkcert for local dev)
- MUST maintain backward compatibility (team assignment is optional)
- MUST use existing infrastructure (Dapper, MySQL, JWT tokens)

**Scale/Scope**:
- Expected teams: 10-100 initially
- Team members: 5-50 per team
- UI screens: 1-2 (team management page, team selectors in existing forms)
- API endpoints: ~10 endpoints (CRUD for teams and team members)
- Database tables: 2 new tables (crm_sales_teams, crm_team_members)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Clean Architecture (MANDATORY)
- **Status**: PASS
- **Verification**: Will implement across all layers (app, presentation, application, domain, infrastructure for frontend; Api, Application, Domain, Infrastructure for backend)
- **Approach**: Follow existing project structure, register services in `DependencyInjection.cs`, maintain dependency rule (dependencies point inward)

### ✅ Security-First Development (MANDATORY)
- **Status**: PASS
- **Verification**:
  - Auth: Use existing Auth API (JWT + API Key)
  - Authorization: All authenticated users can create/manage teams (per spec FR-018)
  - Input Validation: Use FluentValidation for all DTOs
  - CORS: Include frontend origins in CORS policy
  - HTTPS: Use mkcert certificates for local development
- **Approach**: Leverage existing authentication infrastructure, no new permissions needed per spec

### ✅ API-Driven Design (MANDATORY)
- **Status**: PASS
- **Verification**:
  - RESTful endpoints: `/teams`, `/teams/{id}/members`
  - DTOs separated from entities: `CreateTeamRequest`, `TeamResponse`, etc.
  - Error handling: Use ValidationExceptionMiddleware
  - Frontend integration: Create new `teamsApi.js` in `infrastructure/api/`
- **Approach**: Follow existing API patterns from CRM modules

### ⚠️ Testing Discipline (OPTIONAL)
- **Status**: PASS (tests encouraged but not mandatory)
- **Verification**:
  - Backend: Use xUnit framework if tests written
  - Frontend: Mock data in `src/data/` during development
  - Integration: Test team CRUD and member assignment
- **Approach**: Tests can be added incrementally

### ✅ Observability & Audit Trail (MANDATORY)
- **Status**: PASS
- **Verification**:
  - Logging: Use Serilog (separate files by level)
  - Enrichment: Add UserEmail, RequestPath, RequestMethod, UserAgent
  - Audit: Track who creates/updates/deletes teams and team members (FR-017)
- **Approach**: Follow existing logging patterns in CRM API

### ⚠️ File Management & Preview (NOT APPLICABLE)
- **Status**: PASS
- **Verification**: Feature does not involve file attachments or previews
- **Approach**: N/A

### ✅ Code Quality Standards (MANDATORY)
- **Status**: PASS
- **Verification**:
  - Frontend: Run `npm run lint` before commits
  - Backend: Run `dotnet build` and `dotnet test` (if tests exist)
  - Naming: Follow `PascalCase` for C# files, `PascalCase.jsx` for React components
- **Approach**: Follow existing code style and CI checks

### GATE RESULT: PASS
All mandatory constitution principles are satisfied. Feature may proceed to Phase 0 research.

### POST-PHASE 1 RE-EVALUATION

After completing Phase 1 design (data model and API contracts), the Constitution Check was re-verified:

- ✅ **Clean Architecture**: Design follows layered structure with proper separation
- ✅ **Security-First**: All DTOs will use FluentValidation, audit logging included
- ✅ **API-Driven**: RESTful endpoints follow existing CRM patterns
- ✅ **Observability**: Audit logging for all team operations
- ✅ **Code Quality**: All naming conventions followed

**Result**: No violations detected. All constitution principles maintained through Phase 1 design.

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
# Frontend (crm-system-client)
crm-system-client/
├── src/
│   ├── app/
│   │   ├── routes/
│   │   │   └── MainRoutes.jsx          # Add team management route
│   │   └── store/
│   ├── presentation/
│   │   ├── pages/
│   │   │   └── teams/                  # Team management pages
│   │   │       ├── TeamList.jsx        # Team list page
│   │   │       ├── TeamForm.jsx        # Create/edit team
│   │   │       └── TeamMembers.jsx    # Member management
│   │   └── components/
│   │       └── teams/                  # Reusable team components
│   │           ├── TeamSelector.jsx    # Team dropdown for forms
│   │           └── TeamMemberAutocomplete.jsx  # Member selector
│   ├── infrastructure/
│   │   └── api/
│   │       └── teamsApi.js             # Team API client
│   └── utils/
│       └── constants.js                # Add TEAM_ROLES constant
└── package.json

# Backend (crm-system)
crm-system/
├── src/
│   ├── CRM.Domain/
│   │   ├── Entities/
│   │   │   ├── SalesTeam.cs            # Domain entity
│   │   │   └── TeamMember.cs           # Domain entity
│   │   └── Enums/
│   │       └── TeamRole.cs             # Team member roles
│   ├── CRM.Application/
│   │   ├── Dtos/
│   │   │   ├── Teams/
│   │   │   │   ├── CreateTeamRequest.cs         # Request DTO
│   │   │   │   ├── UpdateTeamRequest.cs         # Request DTO
│   │   │   │   ├── TeamResponse.cs              # Response DTO
│   │   │   │   ├── TeamMemberRequest.cs         # Request DTO
│   │   │   │   └── TeamMemberResponse.cs        # Response DTO
│   │   │   └── QueryTeamsRequest.cs             # Query DTO
│   │   ├── Interfaces/
│   │   │   └── ISalesTeamService.cs             # Service interface
│   │   ├── Services/
│   │   │   └── SalesTeamService.cs               # Service implementation
│   │   ├── Validators/
│   │   │   ├── CreateTeamRequestValidator.cs     # Validator
│   │   │   └── TeamMemberRequestValidator.cs    # Validator
│   │   ├── Mappings/
│   │   │   └── SalesTeamMappingProfile.cs        # Entity/DTO mapping
│   │   └── DependencyInjection.cs                # Register team services
│   ├── CRM.Infrastructure/
│   │   ├── Repositories/
│   │   │   └── SalesTeamRepository.cs            # Repository implementation
│   │   ├── Sqls/
│   │   │   └── Teams/
│   │   │       ├── CreateTeam.sql                # SQL query
│   │   │       ├── UpdateTeam.sql                # SQL query
│   │   │       ├── DeleteTeam.sql                # SQL query
│   │   │       ├── AddTeamMember.sql             # SQL query
│   │   │       ├── RemoveTeamMember.sql          # SQL query
│   │   │       └── QueryTeams.sql                # SQL query
│   │   └── DependencyInjection.cs                # Register repositories
│   └── CRM.Api/
│       ├── Controllers/
│       │   └── SalesTeamsController.cs            # API controller
│       └── Middleware/
│           └── (existing)
└── tests/
    └── CRMApi.UnitTests/
        └── Services/
            └── SalesTeamServiceTests.cs          # Optional tests

# Database (MySQL)
# New tables:
crm_sales_teams
crm_team_members

# Existing tables to add foreign keys:
crm_deal      (add SalesTeamId)
crm_customer  (add SalesTeamId)
```

**Structure Decision**: Web application structure with React frontend and .NET 8 backend APIs. Follows existing Clean Architecture pattern across three microservices:
- Frontend: `crm-system-client` for UI and user interactions
- Backend: `crm-system` for business logic and data access
- Auth: Existing Auth API used for authentication (no changes needed)

This aligns with the constitution's Clean Architecture principle and maintains separation of concerns across the three-tier microservices system.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

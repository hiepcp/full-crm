# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Sales team management feature for CRM system allowing creation and management of sales teams, assignment of team members, and optional team-based assignment of deals, customers, and leads. Technical approach follows Clean Architecture with React frontend and .NET 8 backend API.

## Technical Context

**Language/Version**:
- Frontend: React 18+ with Material-UI
- Backend: .NET 8 with C# 12

**Primary Dependencies**:
- Frontend: React, Material-UI, Axios, React Router
- Backend: ASP.NET Core, Dapper, SimpleCRUD, FluentValidation, Serilog

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
- Database queries: Optimized with proper indexing

**Constraints**:
- MUST follow Clean Architecture (non-negotiable per constitution)
- MUST use existing Auth API for authentication/authorization
- MUST be HTTPS-only (mkcert for local dev)
- MUST use existing infrastructure (Dapper, MySQL, JWT tokens)

**Scale/Scope**:
- Expected teams: 10-100 initially
- Team members: 5-50 per team
- UI screens: 1-2 (team management page, team selectors in existing forms)
- API endpoints: ~8-10 endpoints (CRUD for teams and team members)

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
  - Authorization: Implement Admin-Only with permission `teams:manage`
  - Input Validation: Use FluentValidation for all DTOs
  - CORS: Include frontend origins in CORS policy
  - HTTPS: Use mkcert certificates for local development
- **Approach**: Leverage existing authentication infrastructure, add new permission to Auth API

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
  - Audit: Track who creates/modifies teams (created_by, updated_by fields)
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

**NOTE**: Phase 1 design must re-verify Constitution Check after data model and API contracts are finalized.

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
│   │   ├── contexts/
│   │   │   └── TeamContext.jsx         # NEW: Team state management
│   │   └── store/
│   ├── presentation/
│   │   ├── pages/
│   │   │   └── teams/                  # NEW: Team management pages
│   │   │       ├── TeamList.jsx        # NEW: Team list page
│   │   │       ├── TeamForm.jsx        # NEW: Create/edit team
│   │   │       └── TeamMembers.jsx    # NEW: Member management
│   │   └── components/
│   │       └── teams/                  # NEW: Reusable team components
│   │           ├── TeamSelector.jsx    # NEW: Team dropdown for forms
│   │           └── TeamMemberAutocomplete.jsx  # NEW: Member selector
│   ├── infrastructure/
│   │   └── api/
│   │       └── teamsApi.js             # NEW: Team API client
│   └── utils/
│       └── constants.js                # Update: Add TEAM_ROLES constant
└── package.json

# Backend (crm-system)
crm-system/
├── src/
│   ├── CRM.Domain/
│   │   ├── Entities/
│   │   │   ├── SalesTeam.cs            # NEW: Domain entity
│   │   │   └── TeamMember.cs           # NEW: Domain entity
│   │   └── Enums/
│   │       └── TeamRole.cs             # NEW: Team member roles
│   ├── CRM.Application/
│   │   ├── Dtos/
│   │   │   ├── Teams/
│   │   │   │   ├── CreateTeamRequest.cs         # NEW
│   │   │   │   ├── UpdateTeamRequest.cs         # NEW
│   │   │   │   ├── TeamResponse.cs              # NEW
│   │   │   │   ├── TeamMemberRequest.cs         # NEW
│   │   │   │   └── TeamMemberResponse.cs        # NEW
│   │   │   └── QueryTeamsRequest.cs             # NEW
│   │   ├── Interfaces/
│   │   │   └── ISalesTeamService.cs             # NEW
│   │   ├── Services/
│   │   │   └── SalesTeamService.cs               # NEW
│   │   ├── Validators/
│   │   │   ├── CreateTeamRequestValidator.cs     # NEW
│   │   │   └── TeamMemberRequestValidator.cs    # NEW
│   │   ├── Mappings/
│   │   │   └── SalesTeamMappingProfile.cs        # NEW
│   │   └── DependencyInjection.cs                # UPDATE: Register team services
│   ├── CRM.Infrastructure/
│   │   ├── Repositories/
│   │   │   └── SalesTeamRepository.cs            # NEW
│   │   ├── Sqls/
│   │   │   └── Teams/
│   │   │       ├── CreateTeam.sql                # NEW
│   │   │       ├── UpdateTeam.sql                # NEW
│   │   │       ├── DeleteTeam.sql                # NEW
│   │   │       ├── AddTeamMember.sql             # NEW
│   │   │       ├── RemoveTeamMember.sql          # NEW
│   │   │       └── QueryTeams.sql                # NEW
│   │   └── DependencyInjection.cs                # UPDATE: Register repositories
│   └── CRM.Api/
│       ├── Controllers/
│       │   └── SalesTeamsController.cs            # NEW
│       └── Middleware/
│           └── (existing)
└── tests/
    └── CRMApi.UnitTests/
        └── Services/
            └── SalesTeamServiceTests.cs          # OPTIONAL

# Auth API (res-auth-api) - Updates only
res-auth-api/
├── src/
│   ├── ResAuthZ.Domain/
│   │   └── Enums/
│   │       └── Permission.cs                     # UPDATE: Add TeamsManage permission
│   └── ResAuthZ.Infrastructure/
│       └── Sqls/
│           └── Init.sql                           # UPDATE: Insert new permission
```

**Structure Decision**: Web application structure with React frontend and .NET 8 backend APIs. Follows existing Clean Architecture pattern across three microservices:
- Frontend: `crm-system-client` for UI and user interactions
- Backend: `crm-system` for business logic and data access
- Auth: `res-auth-api` for authorization (updates only - add new permission)

This aligns with the constitution's Clean Architecture principle and maintains separation of concerns across the three-tier microservices system.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

# Implementation Plan: [FEATURE]

**Branch**: `003-user-sale-registration` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-user-sale-registration/spec.md`

**Note**: This plan implements user registration functionality that saves to the local `crm_user` table instead of the external authentication API, simplifying architecture while maintaining Azure AD SSO authentication.

## Summary

This feature enables administrators to quickly register sales staff by selecting employees from the HCM (Human Capital Management) worker directory, which auto-populates registration forms with email, full name, and personnel number. Administrators assign roles and create user records in the local `crm_user` database table. The feature supports search, pagination, sorting of HCM workers, and manual entry for edge cases. All registration events are logged for audit purposes.

**Technical Approach**: Extend the existing CRM system's user management infrastructure (UserController, UserService, UserRepository) to add registration-specific endpoints. Frontend adds a new UserSaleRegistration page component that integrates with the AllCRM API for HCM worker data and the CRM API for user creation. Uses Material-UI DataGrid for HCM worker list display with server-side pagination/sorting, and React Hook Form for form management with validation.

## Technical Context

**Frontend Stack**:
- **Framework**: React 18.2.0
- **UI Library**: Material-UI (MUI) 7.3.2
- **Data Grid**: @mui/x-data-grid 7.23.1 (for HCM worker list)
- **State Management**: Redux Toolkit 2.9.0 (global state), React Hook Form (form state)
- **HTTP Client**: axios 1.11.0 with interceptor pattern (axiosInstance.js)
- **Authentication**: @azure/msal-react 2.2.0 (Azure AD SSO)
- **Validation**: React Hook Form + Yup or Zod for client-side validation

**Backend Stack**:
- **Framework**: .NET 8 Web API
- **Architecture**: Clean Architecture (Api/Application/Domain/Infrastructure layers)
- **ORM**: Dapper with SimpleCRUD for MySQL
- **Database**: MySQL with `snake_case` naming convention
- **Validation**: FluentValidation for request DTOs
- **Logging**: Serilog with structured logging
- **Authentication**: JWT Bearer tokens + API Key (XApiKey header)

**Storage**:
- **Primary Database**: MySQL (local CRM database)
- **Key Tables**:
  - `crm_user` - User profiles (email, full_name, personnel_number, is_active, audit fields)
  - `user_roles` - Junction table linking users to roles
  - `roles` - Available roles for assignment
  - `crm_user_audit_log` - Audit trail for registration events

**Testing**:
- **Frontend**: Not yet configured (mock data in `src/data/` for development)
- **Backend**: xUnit with coverlet.collector (run via `dotnet test`)
- **Integration**: Manual testing via Postman/Swagger

**Target Platform**:
- **Frontend**: Modern web browsers (Chrome, Edge, Firefox) with JavaScript enabled
- **Backend**: Windows/Linux server with HTTPS (development: https://crm.local.com:3000, https://api-crm.local.com)

**Performance Goals**:
- User registration completion: < 1 minute per user (SC-001)
- HCM worker search results: < 2 seconds for 10,000 workers (SC-003)
- User creation operation: < 3 seconds including database writes (SC-004)
- Form validation: Instant client-side feedback

**Constraints**:
- Must maintain Clean Architecture layer separation
- Must use existing UserRepository/UserService infrastructure
- Must implement dual authentication (API Key + JWT)
- Must log all registration events to audit table
- Email uniqueness enforced at database level (UNIQUE constraint)
- At least one role required per user
- Azure AD synchronization handled separately (not part of this feature)

**Scale/Scope**:
- Expected HCM worker dataset: Up to 10,000 workers
- Expected users: 200+ CRM users
- Expected registration volume: 10-50 new users per month
- Concurrent administrators: 5-10 at peak
- Roles per user: 1-5 typical, up to 10 max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Clean Architecture (Principle I) ✅
- **Frontend** follows required layered structure:
  - `presentation/pages/user/UserSaleRegistration.jsx` - UI layer
  - `infrastructure/api/crmUsersApi.js` - API client for user endpoints
  - `infrastructure/api/hcmWorkersApi.js` - API client for HCM worker data
  - `domain/entities/User.js` - User entity model (if needed)
  - `utils/validation/userValidation.js` - Validation schemas

- **Backend** follows required layered structure:
  - `CRM.Api/Controllers/UsersController.cs` - Presentation layer (extends existing)
  - `CRM.Application/Services/UserService.cs` - Application layer (extends existing)
  - `CRM.Application/Dtos/CreateUserRequest.cs` - Request DTO
  - `CRM.Application/Validators/CreateUserRequestValidator.cs` - FluentValidation
  - `CRM.Domain/Entities/User.cs` - Domain entity (existing)
  - `CRM.Infrastructure/Repositories/UserRepository.cs` - Data access (extends existing)

- **Dependency Rule**: ✅ All dependencies point inward. Api → Application → Domain, Infrastructure → Application

### Security-First Development (Principle II) ✅
- **Authentication**: ✅ Uses existing dual authentication (API Key + JWT Bearer)
- **Input Validation**: ✅ FluentValidation for all request DTOs, client-side validation with React Hook Form
- **CORS**: ✅ Uses existing CORS policy with explicit origins
- **Audit Logging**: ✅ All registration events logged to `crm_user_audit_log` table with administrator ID, user details, roles, timestamp
- **Data Protection**: ✅ No password handling (Azure AD SSO only), email validation, sanitization of inputs
- **HTTPS**: ✅ Uses existing mkcert certificates for local development, HTTPS in all environments

### API-Driven Design (Principle III) ✅
- **Endpoint Conventions**: ✅ RESTful naming
  - `POST /api/users` - Create new CRM user
  - `GET /api/users?email={email}` - Check email uniqueness
  - `GET /api/roles` - Retrieve available roles (existing endpoint in res-auth-api)
  - `GET /api/hcm-workers` - Query HCM workers with pagination/sorting/search (AllCRM API)

- **DTOs**: ✅ Separate request/response DTOs from domain entities
  - `CreateUserRequest` - User registration request
  - `UserResponse` - User creation response
  - `HcmWorkerDto` - HCM worker data transfer

- **Error Handling**: ✅ Uses existing ValidationExceptionMiddleware and error response patterns
- **Frontend Integration**: ✅ Uses existing axiosInstance with auto token refresh

### Testing Discipline (Principle IV) ⚠️
- **Status**: Optional - tests encouraged but not required for initial implementation
- **When implemented**:
  - Backend: xUnit tests for UserService.CreateUser, email uniqueness validation
  - Frontend: Component tests for UserSaleRegistration form, HCM worker selection
  - Integration: End-to-end test for full registration flow

### Observability & Audit Trail (Principle V) ✅
- **Structured Logging**: ✅ Uses existing Serilog configuration with daily rolling files
- **Audit Trail**: ✅ `crm_user_audit_log` table records:
  - Administrator ID (created_by)
  - Registered user details (email, personnel_number, full_name)
  - Assigned role IDs
  - Registration source (HCM worker vs manual entry)
  - Timestamp
- **Error Tracking**: ✅ Validation failures, database errors, HCM API failures logged
- **Performance Monitoring**: ✅ Log slow queries, HCM API response times

### File Management & Preview (Principle VI) N/A
- Not applicable - this feature does not involve file attachments or document preview

### Constitution Compliance Summary
✅ **PASS** - All applicable constitution principles are satisfied. No violations require justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-user-sale-registration/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (next)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contract definitions)
│   ├── create-user-contract.yaml
│   ├── check-email-contract.yaml
│   ├── get-roles-contract.yaml
│   └── query-hcm-workers-contract.yaml
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

**Structure Decision**: This feature follows the existing **Web Application** structure (frontend + backend separation) with Clean Architecture patterns in both layers.

```text
# Frontend: crm-system-client/
crm-system-client/
├── src/
│   ├── presentation/
│   │   ├── pages/
│   │   │   └── user/
│   │   │       ├── UserSaleRegistration.jsx       # Main registration page (NEW)
│   │   │       ├── components/
│   │   │       │   ├── HcmWorkerSelector.jsx      # HCM worker selection component (NEW)
│   │   │       │   ├── UserRegistrationForm.jsx   # User registration form (NEW)
│   │   │       │   └── RoleSelector.jsx           # Multi-role selection component (NEW)
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── SuccessNotification.jsx        # Reusable success notification
│   ├── infrastructure/
│   │   └── api/
│   │       ├── crmUsersApi.js                     # CRM user API client (NEW)
│   │       ├── hcmWorkersApi.js                   # HCM worker API client (NEW)
│   │       └── rolesApi.js                        # Roles API client (existing, may extend)
│   ├── domain/
│   │   └── models/
│   │       ├── User.js                            # User domain model (existing)
│   │       └── HcmWorker.js                       # HCM worker model (NEW)
│   ├── utils/
│   │   ├── validation/
│   │   │   └── userValidationSchemas.js           # Yup/Zod validation schemas (NEW)
│   │   └── constants.js                           # Extend with user-related constants
│   └── app/
│       └── routes/
│           └── groups/
│               └── MainRoutes.jsx                 # Add UserSaleRegistration route (MODIFY)

# Backend: crm-system/
crm-system/
├── src/
│   ├── CRM.Api/
│   │   └── Controllers/
│   │       └── UsersController.cs                 # User management controller (EXTEND)
│   ├── CRM.Application/
│   │   ├── Services/
│   │   │   ├── UserService.cs                     # User business logic (EXTEND)
│   │   │   └── Interfaces/
│   │   │       └── IUserService.cs                # Service contract (EXTEND)
│   │   ├── Dtos/
│   │   │   ├── CreateUserRequest.cs               # User creation request DTO (NEW)
│   │   │   ├── UserResponse.cs                    # User response DTO (EXTEND)
│   │   │   ├── CheckEmailRequest.cs               # Email uniqueness check request (NEW)
│   │   │   └── UserAuditLogDto.cs                 # Audit log DTO (NEW)
│   │   ├── Validators/
│   │   │   └── CreateUserRequestValidator.cs      # FluentValidation for CreateUserRequest (NEW)
│   │   └── Mappings/
│   │       └── UserMappingProfile.cs              # AutoMapper profile for User (EXTEND)
│   ├── CRM.Domain/
│   │   └── Entities/
│   │       ├── User.cs                            # User entity (EXISTING - may extend)
│   │       ├── UserRole.cs                        # User-Role junction entity (NEW)
│   │       └── UserAuditLog.cs                    # Audit log entity (NEW)
│   └── CRM.Infrastructure/
│       ├── Repositories/
│       │   ├── UserRepository.cs                  # User data access (EXTEND)
│       │   ├── Interfaces/
│       │   │   └── IUserRepository.cs             # Repository contract (EXTEND)
│       │   └── UserAuditLogRepository.cs          # Audit log repository (NEW)
│       └── Sqls/
│           ├── UserSqls.cs                        # SQL queries for User operations (EXTEND)
│           └── UserAuditLogSqls.cs                # SQL for audit log (NEW)

# Database Schema Updates
database/migrations/
└── 003_add_user_registration_tables.sql           # Migration script (NEW)
    # Creates/updates:
    # - crm_user table (if not exists, add missing fields)
    # - user_roles junction table
    # - crm_user_audit_log table
    # - Indexes and constraints
```

## Complexity Tracking

> **No violations identified** - All constitution principles are satisfied. This section is empty as no complexity justifications are required.

---

## Phase 0: Research & Technology Decisions (Next Steps)

The following research areas will be investigated in `research.md`:

1. **HCM Worker API Integration**: Document the AllCRM API endpoint structure, authentication, pagination/sorting/search parameters, and response format for `RSVNHcmWorkers` queries.

2. **Email Uniqueness Validation Pattern**: Research best practices for preventing duplicate email registrations - database-level UNIQUE constraint (already in place) vs application-level check-before-insert vs optimistic concurrency handling.

3. **Multi-Role Assignment Strategy**: Determine the database schema for `user_roles` junction table (if not already exists) and the most efficient way to insert multiple role assignments atomically within the user creation transaction.

4. **Audit Log Design**: Define the schema for `crm_user_audit_log` table including what events to log (create, update, delete, role changes), what data to capture (before/after values, IP address, user agent), and retention policies.

5. **Form State Management**: Decide between React Hook Form vs Formik for user registration form - evaluate based on validation integration, performance with large forms, and MUI compatibility.

6. **HCM Worker Data Grid Configuration**: Document MUI DataGrid server-side pagination/sorting setup, optimal page size configurations, and how to integrate search filtering with backend queries.

7. **Azure AD Synchronization Strategy**: Clarify the separation of concerns - this feature creates `crm_user` records only; document assumptions about the separate synchronization process that links CRM users to Azure AD identities for SSO authentication.

---

## Phase 1: Design Artifacts (After Research)

Will generate:
- **data-model.md**: Complete schema for `crm_user`, `user_roles`, `crm_user_audit_log` with field definitions, constraints, indexes, and relationships
- **contracts/**: OpenAPI specifications for all API endpoints (create user, check email, get roles, query HCM workers)
- **quickstart.md**: Developer setup guide for running the feature locally (database setup, API configuration, frontend development server)

---

## Phase 2: Task Breakdown (Separate Command)

Task generation will be handled by `/speckit.tasks` command after Phase 1 design is complete.

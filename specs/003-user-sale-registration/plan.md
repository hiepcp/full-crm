# Implementation Plan: User Sale Registration

**Branch**: `003-user-sale-registration` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-user-sale-registration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature enables administrators to register sales users by selecting workers from the HCM (Human Capital Management) directory, which auto-populates registration forms with their information (email, full name, personnel number). Administrators can then assign roles and create user accounts in the authentication system. The feature includes search/filtering, pagination/sorting of HCM workers, manual data entry override, form validation, duplicate detection, and comprehensive audit logging. All users authenticate via Azure AD SSO without password management.

**Technical Approach**: Frontend-only implementation in the React CRM client using existing infrastructure APIs (AllCRM HCM Workers API, Authentication API). The feature leverages Material-UI DataGrid for the worker list, React form state management for the registration form, and axios interceptors for API communication with proper error handling.

## Technical Context

**Language/Version**: JavaScript (ES6+) with React 18 (Frontend) | .NET 8 (Backend APIs already exist)
**Primary Dependencies**:
- Frontend: React 18, Material-UI (MUI) 5.x, @mui/x-data-grid, axios, @azure/msal-react
- Backend: Existing AllCRM API (.NET 8 + Dapper + MySQL), res-auth-api (.NET 8)

**Storage**: N/A - Frontend feature, uses existing backend APIs with MySQL storage
**Testing**: Not yet configured (frontend tests optional per constitution)
**Target Platform**: Modern web browsers (Chrome, Firefox, Edge, Safari) with JavaScript enabled
**Project Type**: Web application - React SPA frontend feature
**Performance Goals**:
- Search/filter HCM workers: <2 seconds for 10,000 workers
- User creation: <3 seconds total
- Form auto-population: <500ms after worker selection
**Constraints**:
- Must use existing APIs (no backend changes required)
- Must follow Clean Architecture structure
- HTTPS required (local development uses mkcert certificates)
**Scale/Scope**:
- Single page component (~350-400 lines existing reference: HcmWorkerRegister.jsx)
- 2-3 new utility functions
- API integration with 2 existing endpoints (HCM Workers, Auth Users/Roles)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Clean Architecture (Mandatory) ✅ PASS

**Frontend Layer Compliance**:
- ✅ `presentation/pages/user/` - UI component for registration page
- ✅ `application/usecases/all-crms/` - Existing GetAllCRMHcmWorkersUseCase
- ✅ `infrastructure/repositories/` - Existing RestAllCRMRepository
- ✅ `infrastructure/api/` - Existing authUsersApi, authRolesApi clients
- ✅ `utils/constants.js` - Existing constants file for shared values
- ✅ Dependency Rule: UI depends on use cases, use cases depend on repositories, repositories call APIs

**Assessment**: Fully compliant. Feature follows existing frontend Clean Architecture pattern.

### II. Security-First Development ✅ PASS

**Authentication & Authorization**:
- ✅ Azure AD SSO only (clarified - no password management)
- ✅ Uses existing axios interceptors with API Key + JWT Bearer token
- ✅ Administrators must be authenticated to access page
- ✅ Refresh token auto-rotation handled by existing axiosInstance

**Data Protection**:
- ✅ No sensitive data stored client-side
- ✅ Form data cleared after successful submission
- ✅ HTTPS enforced (local: https://crm.local.com:3000)

**Input Validation**:
- ✅ Client-side validation (email required, at least one role required)
- ✅ Server-side validation handled by existing Auth API with FluentValidation
- ✅ Duplicate email detection with clear error messaging

**Audit Logging**:
- ✅ FR-016: Registration events logged (administrator ID, user details, roles, timestamp)
- ✅ Backend API handles audit trail persistence

**Assessment**: Fully compliant. Security handled by existing infrastructure + new requirements.

### III. API-Driven Design ✅ PASS

**Endpoint Usage**:
- ✅ GET/POST to existing AllCRM HCM Workers API (filtering, sorting, pagination)
- ✅ GET to existing Auth Roles API (`authRolesApi.getAll`)
- ✅ POST to existing Auth Users API (`authUsersApi.create`)

**Request/Response DTOs**:
- ✅ Uses existing DTOs from backend APIs
- ✅ Frontend normalizes HCM worker data (existing pattern)

**Error Handling**:
- ✅ FR-014: Clear error messages for validation, duplicate email, API errors
- ✅ Existing axios interceptors handle 401/403 redirects
- ✅ Component-level error state management

**Frontend Integration**:
- ✅ Uses existing axiosInstance with interceptors
- ✅ API clients organized by module (`authUsersApi.js`, `authRolesApi.js`)
- ✅ Automatic token refresh on 401

**Assessment**: Fully compliant. Uses existing API infrastructure correctly.

### IV. Testing Discipline ⚠️ OPTIONAL (No Action Required)

**Frontend Testing**: Not yet configured, tests optional per constitution.

**Assessment**: N/A - Tests encouraged but not mandatory for this feature.

### V. Observability & Audit Trail ✅ PASS

**Business Audit Trails**:
- ✅ FR-016: User registration events logged with full details
- ✅ Backend API persists audit logs (administrator ID, user email/username, roles, timestamp, source)

**Error Tracking**:
- ✅ Frontend displays error messages to user
- ✅ Backend logs errors via Serilog

**Assessment**: Fully compliant. Audit requirements defined and delegated to backend.

### VI. File Management & Preview ✅ N/A

**Assessment**: Not applicable to user registration feature.

### Development Workflow ✅ PASS

**Code Quality**:
- ✅ Must pass `npm run lint`
- ✅ Follow React component naming: `PascalCase.jsx`
- ✅ Use existing patterns from `HcmWorkerRegister.jsx`

**Assessment**: Fully compliant with existing workflow.

### Summary: Constitution Gates

| Gate | Status | Notes |
|------|--------|-------|
| Clean Architecture | ✅ PASS | Follows frontend layer structure |
| Security-First | ✅ PASS | Azure AD SSO, validation, audit logging |
| API-Driven Design | ✅ PASS | Uses existing APIs correctly |
| Testing Discipline | ⚠️ OPTIONAL | Tests not required |
| Observability | ✅ PASS | Audit logging defined |
| File Preview | ✅ N/A | Not applicable |

**Overall Assessment**: ✅ **ALL GATES PASSED** - Feature complies with constitution. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-user-sale-registration/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-contracts.md # Frontend-Backend API contracts
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
crm-system-client/                                    # React Frontend
├── src/
│   ├── app/                                          # Application core
│   │   ├── contexts/                                 # React contexts
│   │   ├── routes/                                   # Route configuration
│   │   │   └── groups/
│   │   │       └── MainRoutes.jsx                    # [UPDATE] Add user registration route
│   │   └── store/                                    # Redux store
│   │
│   ├── presentation/                                 # UI layer
│   │   ├── components/                               # Reusable components
│   │   │   └── common/
│   │   │       └── (existing Alert, Button, etc.)
│   │   ├── pages/                                    # Page components
│   │   │   └── user/
│   │   │       ├── HcmWorkerRegister.jsx            # [REFERENCE] Existing similar component
│   │   │       └── UserSaleRegistration.jsx         # [NEW] Main registration page
│   │   ├── layouts/                                  # Layout components
│   │   └── themes/                                   # MUI theme
│   │
│   ├── application/                                  # Use cases
│   │   └── usecases/
│   │       └── all-crms/
│   │           ├── GetAllCRMHcmWorkersUseCase.js    # [EXISTING] HCM worker retrieval
│   │           └── index.js
│   │
│   ├── domain/                                       # Domain entities (minimal for frontend)
│   │
│   ├── infrastructure/                               # External concerns
│   │   ├── api/                                      # API clients
│   │   │   ├── axiosInstance.js                     # [EXISTING] Main HTTP client
│   │   │   ├── authUsersApi.js                      # [EXISTING] User creation API
│   │   │   └── authRolesApi.js                      # [EXISTING] Roles API
│   │   └── repositories/
│   │       ├── RestAllCRMRepository.js              # [EXISTING] AllCRM repository
│   │       └── index.js
│   │
│   └── utils/                                        # Utilities
│       ├── constants.js                              # [EXISTING] Shared constants
│       ├── tokenHelper.js                            # [EXISTING] Token management
│       └── dateHelper.js                             # [EXISTING] Date formatting
│
└── tests/                                            # [OPTIONAL] Frontend tests
```

**Structure Decision**: Frontend-only feature using existing Clean Architecture structure in `crm-system-client/`. Primary artifact is the `UserSaleRegistration.jsx` component in `presentation/pages/user/`. Leverages existing use cases, repositories, and API clients. No backend changes required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution gates passed.

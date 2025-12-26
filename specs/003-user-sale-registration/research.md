# Research & Technology Decisions: User Sale Registration

**Feature**: 003-user-sale-registration
**Date**: 2025-12-25
**Purpose**: Document technical decisions for implementing user registration to local `crm_user` table

---

## Overview

This document records the research findings and technology decisions for the User Sale Registration feature. All decisions are based on existing codebase patterns, constitution requirements, and best practices for the CRM system architecture.

**Critical Context**: User registration data will be saved to the local `crm_user` table in the CRM database, NOT to the external authentication API. Azure AD is used only for authentication (SSO), not user management.

---

## Research Findings

### 1. HCM Worker API Integration ✅

**Decision**: Use existing `/dynamics/hcm-workers` endpoint with server-side pagination/sorting/search

**Implementation**:
- API Client: `hcmWorkersApi.getPaged(page, pageSize, search, sortField, sortOrder)`
- Response Format: OData (`{"@odata.count": 1523, "value": []}`)
- Authentication: JWT + API key (via axiosInstance)
- Field Mapping: Frontend `personnelNumber` → Backend `PersonnelNumber` (PascalCase)

**Rationale**: Existing infrastructure, proven performance with 10K workers

---

### 2. Email Uniqueness Validation ✅

**Decision**: Pre-validation via `GET /api/users/email/{email}` + DB UNIQUE constraint

**Implementation**:
- Frontend: Call `usersApi.getByEmail(email)` before submit
- 404 response = unique, 200 response = duplicate
- Error message: "This email address is already registered. Please verify if the user already has an account."
- Database safety net: UNIQUE constraint on `crm_user.Email`

**Rationale**: Instant user feedback, database integrity protection

---

### 3. Multi-Role Assignment Strategy ⚠️

**Decision**: 🚨 ADAPT TO SINGLE-ROLE MODEL (current schema limitation)

**Critical Finding**:
- Current `User` entity has single `Role` field (string), NOT a junction table
- **NO `user_roles` table exists** in current CRM schema
- Allowed values: `"admin" | "manager" | "sales" | "support" | "user"`

**Impact on Spec**:
- FR-010 (multiple role assignment) → **DEFER TO FUTURE ENHANCEMENT**
- FR-013 (user-role relationship table) → **USE SINGLE Role FIELD**

**Implementation**: Single-select dropdown for role selection

**Recommendation**: Update spec to reflect single-role constraint for MVP OR plan schema migration

---

### 4. Audit Log Design ✅

**Decision**: Use BaseEntity pattern (CreatedBy/CreatedOn) + Serilog logging

**Implementation**:
- BaseEntity fields automatically populated: `CreatedOn`, `CreatedBy`, `UpdatedOn`, `UpdatedBy`
- Service captures administrator email from HttpContext
- Serilog logs: registration events with user details, roles, source (HCM vs manual)

**Rationale**: Existing pattern, constitution compliant, sufficient for MVP

**Future Enhancement**: Dedicated `crm_user_audit_log` table (if detailed before/after tracking needed)

---

### 5. Form State Management ✅

**Decision**: Plain React `useState` (no library)

**Implementation**:
```javascript
const [formData, setFormData] = useState({email: '', fullName: '', personnelNumber: '', role: ''});
const [submitting, setSubmitting] = useState(false);
const [alert, setAlert] = useState(null);
```

**Rationale**:
- Simple 4-field form doesn't justify Formik/React Hook Form
- Existing pattern in `HcmWorkerRegister.jsx`
- MUI components work seamlessly with onChange handlers

---

### 6. MUI DataGrid Configuration ✅

**Decision**: Server-side pagination/sorting following `CustomerDataGrid.jsx` pattern

**Implementation**:
- `paginationMode="server"`
- `sortingMode="server"`
- `pageSizeOptions={[5, 10, 25, 50]}`
- Reset to page 0 when sort/search changes

**Rationale**: Proven pattern, required for 10K workers (SC-003: < 2 seconds)

---

### 7. Azure AD Synchronization Strategy 🚨

**Decision**: MANUAL PROVISIONING - NO automatic sync exists

**Critical Finding**:
- No Microsoft Graph API integration in codebase
- Azure AD used ONLY for authentication, NOT user management
- **Manual Process**:
  1. Admin creates CRM user via this feature → saved to `crm_user` table
  2. Admin separately adds user to Azure AD tenant (outside CRM)
  3. Email must match between CRM and Azure AD
  4. User can then authenticate via SSO

**Impact**:
- This feature creates CRM users only
- Azure AD provisioning is a separate manual step
- Quickstart.md MUST document the manual process

**Future Enhancement**: Microsoft Graph API integration for automatic provisioning

---

## Implementation Readiness

### ✅ Existing Infrastructure (No Changes Needed)
1. Backend: `UserController.cs`, `UserService.cs`, `UserRepository.cs`
2. Endpoints: `POST /api/users`, `GET /api/users/email/{email}`
3. Validation: `CreateUserRequestValidator.cs` (FluentValidation)
4. Frontend: `usersApi.js` API client
5. HCM API: `hcmWorkersApi.js` with pagination/sorting/search

### 🆕 New Components Required
1. Frontend: `UserSaleRegistration.jsx` page (adapt from `HcmWorkerRegister.jsx`)
2. Components: `HcmWorkerSelector.jsx`, `UserRegistrationForm.jsx`, `RoleSelector.jsx`
3. Helpers: `extractFirstName()`, `extractLastName()` (parse fullName field)

### ⚠️ Spec Conflicts Requiring Clarification
1. **Multi-Role Requirement**: Spec requires multiple roles, schema supports single role only
2. **Personnel Number Field**: `User` entity doesn't have this field - use for auto-populate only or add to schema?

---

## Key Architectural Changes from Original Design

| Aspect | Original (2025-12-23) | Updated (2025-12-25) |
|--------|---------------------|---------------------|
| Data Storage | Auth API | CRM API (`crm_user` table) |
| Role Model | Multi-role (roleIds array) | Single role (role string) |
| Sync Process | Assumed automatic | Manual provisioning |
| API Endpoint | `authUsersApi.create()` | `usersApi.create()` |

---

## Next Steps

1. ✅ Research complete
2. **Phase 1**: Generate `data-model.md`, API contracts, `quickstart.md`
3. **Clarification Needed**:
   - Confirm single-role model is acceptable for MVP
   - Decide whether to store `personnelNumber` in User entity
4. **Documentation**: Update quickstart with Azure AD manual provisioning process

---

**Research Status**: Complete
**Date**: 2025-12-25
**Approved For**: Phase 1 Design

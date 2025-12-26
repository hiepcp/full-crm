# Research: User Sale Registration

**Feature**: User Sale Registration
**Date**: 2025-12-23
**Status**: Complete

## Purpose

This document consolidates research findings for implementing the User Sale Registration feature. Since this is a frontend-only feature using existing backend APIs, research focused on identifying existing patterns, API contracts, and best practices already implemented in the codebase.

## Research Areas

### 1. Existing HCM Worker Registration Pattern

**Decision**: Use `HcmWorkerRegister.jsx` as the primary reference implementation

**Rationale**:
- Existing component at `crm-system-client/src/presentation/pages/user/HcmWorkerRegister.jsx` implements nearly identical functionality
- Already integrates with AllCRM HCM Workers API using Clean Architecture pattern
- Demonstrates correct use of GetAllCRMHcmWorkersUseCase and RestAllCRMRepository
- Shows proper Material-UI DataGrid configuration for server-side pagination/sorting/searching
- Implements form state management and validation patterns
- Provides working example of auth API integration (`authRolesApi`, `authUsersApi`)

**Key Patterns Identified**:
1. **HCM Worker Normalization**: Handles both `PascalCase` and `camelCase` API responses
   ```javascript
   function normalizeWorker(worker) {
     return {
       id: worker?.PersonnelNumber || worker?.personnelNumber || crypto.randomUUID(),
       personnelNumber: worker?.PersonnelNumber || worker?.personnelNumber || "",
       name: worker?.Name || worker?.name || "",
       sysEmail: worker?.SysEmail || worker?.sysEmail || "",
     };
   }
   ```

2. **Server-Side DataGrid Configuration**:
   - `paginationMode="server"`
   - `sortingMode="server"`
   - Column field mapping to backend fields (`PersonnelNumber`, `Name`, `SysEmail`)
   - Page size options: `[5, 10, 25, 50]`

3. **Search Implementation**: POST-based filtering with AllCRM API structure
   ```javascript
   filters.push({
     Logic: "and",
     Column: "PersonnelNumber",
     Operator: "contains",
     Value: search.trim()
   });
   ```

4. **Form Reset Pattern**: Clear form state after successful submission
   ```javascript
   setForm(defaultForm);
   setSelectedWorker(null);
   setAlert({ severity: "success", message: "Create user successfully" });
   ```

**Alternatives Considered**:
- Building from scratch: Rejected - unnecessary duplication, higher risk
- Using different UI library: Rejected - Material-UI already standardized

### 2. Auth API Integration

**Decision**: Use existing `authUsersApi.create()` and `authRolesApi.getAll()` methods

**Rationale**:
- APIs already exist and are tested
- `authUsersApi.create(payload)` accepts: `{ email, fullName, userName, roleIds }`
- `authRolesApi.getAll(page, pageSize)` returns paginated role list
- Error handling already implemented in API clients
- Token refresh interceptor handles 401 errors automatically

**API Contract (Existing)**:

**Create User Request**:
```javascript
{
  email: string,        // Required
  fullName: string,     // Optional
  userName: string,     // Optional (auto-generated if not provided)
  roleIds: number[]     // Required (at least one)
}
```

**Create User Response (Success)**:
```javascript
{
  // User created successfully
  // Backend returns appropriate response
}
```

**Create User Response (Error - Duplicate Email)**:
```javascript
{
  response: {
    data: {
      message: "Email already exists" // Or similar server message
    }
  }
}
```

**Get Roles Response**:
```javascript
{
  data: {
    data: {
      items: [  // Or Items or value (normalized in component)
        {
          roleId: number,  // Or id, RoleId, Id
          name: string,    // Or Name, code, Code
        }
      ]
    }
  }
}
```

**Alternatives Considered**:
- Creating new API endpoints: Rejected - existing APIs sufficient
- GraphQL: Rejected - REST already standardized in project

### 3. Form Validation Strategy

**Decision**: Client-side validation with Material-UI helper text + backend validation

**Rationale**:
- Immediate user feedback via client-side validation (email required, roles required)
- Backend provides authoritative validation via FluentValidation
- Material-UI TextField `error` and `helperText` props for inline validation
- Form submit disabled until required fields populated (UX best practice)

**Validation Rules**:
1. **Email**: Required, basic format check (browser native or custom regex)
2. **Roles**: Required, at least one role selected
3. **Username**: Optional (auto-generated if empty)
4. **Full Name**: Optional

**Implementation Pattern**:
```javascript
const isFormValid = form.email && form.roleIds.length > 0;

<Button
  variant="contained"
  onClick={handleSubmit}
  disabled={!isFormValid || submitting}
>
  {submitting ? "Creating..." : "Create User"}
</Button>
```

**Alternatives Considered**:
- Formik/React Hook Form: Rejected - too heavy for simple form, existing pattern uses React state
- Schema validation (Yup/Zod): Rejected - backend already validates, client needs simple checks only

### 4. Error Handling Best Practices

**Decision**: Component-level error state with Material-UI Alert component

**Rationale**:
- Consistent with existing HcmWorkerRegister pattern
- Clear visual feedback to users
- Distinguishes between error types (validation, duplicate, API failure)
- Dismissible alerts with `onClose` handler

**Error Categories**:
1. **Validation Errors**: Client-side, shown inline on fields
2. **Duplicate Email**: Server response, shown as Alert with suggestion
3. **API Errors**: Network/server failures, shown as Alert with generic message
4. **Authorization Errors**: Handled by axios interceptor (401 → login, 403 → unauthorized page)

**Alert Pattern**:
```javascript
{alert && (
  <Alert severity={alert.severity} onClose={() => setAlert(null)}>
    {alert.message}
  </Alert>
)}
```

**Duplicate Email Message** (per FR-014):
```
"This email address is already registered. Please verify if the user already has an account."
```

**Alternatives Considered**:
- Toast notifications: Rejected - Alert component more prominent for critical errors
- Modal dialogs: Rejected - too intrusive for simple error messages

### 5. Username Auto-Generation Logic

**Decision**: Derive username from email prefix (part before @), fallback to personnel number

**Rationale**:
- Matches existing assumption in spec (Assumption #7)
- Simple, predictable logic
- Users can override if needed
- Email prefix typically correlates with corporate username convention

**Implementation**:
```javascript
const generateUsername = (email, personnelNumber) => {
  if (!email) return personnelNumber || "";
  const emailPrefix = email.split("@")[0];
  return emailPrefix || personnelNumber || "";
};

// On HCM worker selection:
setForm(prev => ({
  ...prev,
  email: worker.sysEmail,
  fullName: worker.name,
  userName: generateUsername(worker.sysEmail, worker.personnelNumber),
}));
```

**Alternatives Considered**:
- UUID/random generation: Rejected - not user-friendly
- Server-side generation: Rejected - adds complexity, frontend can handle

### 6. Performance Optimization

**Decision**: Use existing patterns - no additional optimization needed for MVP

**Rationale**:
- HCM worker list: Server-side pagination handles large datasets efficiently
- Success Criteria SC-003: <2 seconds for 10,000 workers (already met by backend)
- Form auto-population: <500ms (synchronous local state update, instant)
- DataGrid already virtualized by MUI

**Considered Optimizations** (Defer to future):
- React.memo for form fields: Not needed for simple form
- useCallback for event handlers: Premature optimization
- Debounce search input: Good practice but not critical (existing implementation doesn't use it)

**Alternatives Considered**:
- Client-side caching of HCM workers: Rejected - adds complexity, server pagination sufficient
- WebWorkers for data processing: Rejected - overkill for this use case

### 7. Accessibility Considerations

**Decision**: Leverage Material-UI accessibility features, follow existing patterns

**Rationale**:
- Material-UI components have built-in ARIA attributes
- DataGrid supports keyboard navigation
- Form fields have proper labels and error associations
- Alert component includes role="alert" for screen readers

**Accessibility Features**:
- All form fields have `<InputLabel>` with `htmlFor` association
- Error messages linked via `aria-describedby`
- Buttons have descriptive text (no icon-only buttons)
- Loading states announced via `disabled` and text changes ("Creating...")

**Alternatives Considered**:
- Custom ARIA implementation: Rejected - Material-UI handles this
- Focus management on validation errors: Future enhancement, not critical for MVP

## Summary of Decisions

| Decision Point | Chosen Approach | Key Rationale |
|----------------|----------------|---------------|
| Component Pattern | Extend HcmWorkerRegister.jsx pattern | Proven, tested, matches requirements |
| API Integration | Existing authUsersApi, authRolesApi | No backend changes needed |
| Form Validation | Client-side (required fields) + backend | Immediate feedback + authoritative validation |
| Error Handling | Alert component with categorized messages | Clear, consistent, user-friendly |
| Username Generation | Email prefix, fallback to personnel number | Simple, predictable, overridable |
| Performance | Leverage existing MUI DataGrid optimizations | Meets performance goals without added complexity |
| Accessibility | Material-UI built-in features | Standards-compliant, minimal effort |

## Open Questions (Resolved)

All edge cases were addressed during clarification phase:
- ✅ Password handling: Azure AD SSO only (no passwords)
- ✅ Form reset behavior: Clear form after successful creation
- ✅ Audit logging: Backend handles audit trail
- ✅ Duplicate email handling: Clear error message with suggestion
- ✅ Role requirements: At least one role must be assigned

## Implementation Readiness

✅ **All research complete**. Ready to proceed to Phase 1 (Design).

**Key Artifacts**:
- Existing component: `HcmWorkerRegister.jsx` (reference implementation)
- API clients: `authUsersApi.js`, `authRolesApi.js` (functional, tested)
- Use case: `GetAllCRMHcmWorkersUseCase.js` (functional, tested)
- Repository: `RestAllCRMRepository.js` (functional, tested)

**Next Steps**: Generate data-model.md and API contracts.

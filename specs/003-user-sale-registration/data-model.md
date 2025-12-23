# Data Model: User Sale Registration

**Feature**: User Sale Registration
**Date**: 2025-12-23
**Type**: Frontend Feature (UI State Model + Backend Entity References)

## Overview

This feature is frontend-only and does not introduce new backend entities. The data model describes:
1. **Frontend State Models**: React component state shapes for UI management
2. **Backend Entity References**: Existing entities accessed via APIs (read-only from frontend perspective)

## Frontend State Models

### 1. HCM Worker (Frontend Normalized)

**Purpose**: Represents an HCM worker record retrieved from AllCRM API, normalized for consistent UI rendering.

**State Shape**:
```javascript
{
  id: string,                    // Unique identifier (PersonnelNumber or generated UUID)
  personnelNumber: string,       // Worker's personnel/employee number
  name: string,                  // Full name
  sysEmail: string,              // Corporate email address
}
```

**Validation Rules**:
- `sysEmail` must not be empty (filtered out by FR-003 before display)
- `personnelNumber` typically unique but not enforced client-side
- `name` may contain unicode characters, special characters

**Source**: AllCRM HCM Workers API (`RSVNHcmWorkers` table)

**Relationships**:
- None (read-only display entity)

**State Transitions**: N/A (read-only)

---

### 2. Registration Form State

**Purpose**: Manages user registration form data and validation state.

**State Shape**:
```javascript
{
  email: string,                 // User's email (required, unique)
  fullName: string,              // User's full name (optional)
  userName: string,              // Username for login (optional, auto-generated)
  roleIds: number[],             // Array of assigned role IDs (required, min 1)
}
```

**Default/Empty State**:
```javascript
{
  email: "",
  fullName: "",
  userName: "",
  roleIds: [],
}
```

**Validation Rules**:
- **email**: Required, must be valid email format
- **fullName**: Optional
- **userName**: Optional (auto-generated from email prefix if empty)
- **roleIds**: Required, array must contain at least one role ID

**State Transitions**:
1. **Empty → Pre-populated**: When HCM worker selected → auto-fill email, fullName, userName
2. **Pre-populated → Modified**: User manually edits fields
3. **Modified → Submitted**: User clicks "Create User" → API call
4. **Submitted → Success**: API returns 200 → reset to Empty state
5. **Submitted → Error**: API returns error → retain form state, show error

**Lifecycle**:
```
[Empty Form]
    ↓ (Select HCM Worker)
[Pre-populated Form]
    ↓ (Manual Edit)
[Modified Form]
    ↓ (Submit)
[Submitting] → (Success) → [Empty Form]
            → (Error) → [Modified Form + Error Alert]
```

---

### 3. Selected Worker State

**Purpose**: Tracks which HCM worker (if any) was selected to pre-populate the form.

**State Shape**:
```javascript
{
  id: string,
  personnelNumber: string,
  name: string,
  sysEmail: string,
}
// OR
null  // No worker selected (manual entry mode)
```

**Validation Rules**: N/A (informational only)

**State Transitions**:
- `null` → `HcmWorker` object (user selects worker from list)
- `HcmWorker` object → `null` (user manually clears selection or form resets after success)

---

### 4. Alert/Error State

**Purpose**: Manages user-facing alerts and error messages.

**State Shape**:
```javascript
{
  severity: "success" | "error" | "warning" | "info",
  message: string,
}
// OR
null  // No alert displayed
```

**Message Examples**:
- **Success**: `"Create user successfully"`
- **Error (Validation)**: `"Email is required"`
- **Error (Duplicate)**: `"This email address is already registered. Please verify if the user already has an account."`
- **Error (Generic)**: `"Cannot create user"` or server error message
- **Info**: `"Using worker: {name} ({personnelNumber})"`

**State Transitions**:
- `null` → Alert object (error occurs or success)
- Alert object → `null` (user dismisses or new action)

---

### 5. Role Entity (Frontend Normalized)

**Purpose**: Represents a role retrieved from Auth Roles API.

**State Shape**:
```javascript
{
  id: number,                    // Role ID (unique)
  name: string,                  // Role name/code (e.g., "Sales Manager", "Admin")
}
```

**Validation Rules**: N/A (read-only from frontend)

**Source**: Auth Roles API (`roles` table)

**Relationships**:
- Referenced by `RegistrationFormState.roleIds` (many-to-many via array)

**State Transitions**: N/A (read-only)

---

### 6. Pagination Model

**Purpose**: Manages DataGrid pagination state for HCM worker list.

**State Shape**:
```javascript
{
  page: number,                  // Current page (0-indexed)
  pageSize: number,              // Number of rows per page (5, 10, 25, 50)
}
```

**Default State**:
```javascript
{ page: 0, pageSize: 10 }
```

**Validation Rules**:
- `pageSize` must be one of: `[5, 10, 25, 50]`
- `page` must be >= 0

**State Transitions**:
- Page size change → reset to `page: 0`
- Sort change → reset to `page: 0`
- Search → reset to `page: 0`
- Navigate next/prev → increment/decrement `page`

---

### 7. Sort Model

**Purpose**: Manages DataGrid sorting state for HCM worker list.

**State Shape**:
```javascript
[
  {
    field: "personnelNumber" | "name" | "sysEmail",
    sort: "asc" | "desc",
  }
]
// OR
[]  // No sorting applied (default: personnelNumber asc)
```

**Default State**:
```javascript
[{ field: "personnelNumber", sort: "asc" }]
```

**Validation Rules**:
- Only one sort field at a time (single-column sorting)
- `field` must be one of: `"personnelNumber"`, `"name"`, `"sysEmail"`

**Mapping to Backend**:
```javascript
const columnFieldMap = {
  personnelNumber: "PersonnelNumber",
  name: "Name",
  sysEmail: "SysEmail",
};
```

---

## Backend Entity References (Read-Only)

These entities exist in backend databases and are accessed via APIs. Frontend does not modify them directly.

### 8. HCM Worker (Backend Entity - RSVNHcmWorkers)

**Database**: AllCRM MySQL Database
**Table**: `RSVNHcmWorkers` (or similar)

**Attributes** (Accessed Fields):
- `PersonnelNumber` (string): Employee ID
- `Name` (string): Full name
- `SysEmail` (string): Corporate email

**Access Pattern**: GET/POST via AllCRM API with filtering, sorting, pagination

**Filtering**:
```javascript
{
  Logic: "and",
  Column: "SysEmail",
  Operator: "ne",  // Not equal
  Value: ""        // Filter out empty emails
}
```

---

### 9. User Account (Backend Entity - Created)

**Database**: Auth API MySQL Database
**Table**: `users` (inferred from spec)

**Attributes** (Created):
- `email` (string, unique, required): User's email
- `fullName` (string, optional): Full name
- `userName` (string, unique, optional): Username for login
- `roleIds` (array of integers, required): Assigned roles

**Access Pattern**: POST to `authUsersApi.create(payload)`

**Backend Validation** (FluentValidation):
- Email uniqueness enforcement
- Email format validation
- At least one role required
- Username uniqueness (if provided)

**Created By**: Frontend via Auth API

---

### 10. Role (Backend Entity)

**Database**: Auth API MySQL Database
**Table**: `roles`

**Attributes** (Accessed Fields):
- `roleId` (or `id`, integer): Unique role identifier
- `name` (or `code`, string): Role name

**Access Pattern**: GET via `authRolesApi.getAll(page, pageSize)`

**Relationships**:
- Many-to-many with User Account via `user_roles` join table (backend-managed)

---

### 11. Registration Audit Log (Backend Entity - Created)

**Database**: Auth API MySQL Database (inferred)
**Table**: Audit logs table (implementation-dependent)

**Attributes** (Logged by Backend):
- `administratorId`: ID of admin who created the user
- `registeredUserEmail`: Email of created user
- `registeredUserUsername`: Username of created user
- `assignedRoleIds`: Array/JSON of role IDs assigned
- `timestamp`: Creation timestamp
- `registrationSource`: "HCM" or "Manual"

**Access Pattern**: Write-only from frontend perspective (logged by backend on user creation)

**Created By**: Backend API automatically on successful user creation

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Sale Registration                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  HCM Worker List │ (DataGrid)
│  [Server-Side]   │
└────────┬─────────┘
         │
         ├─ GET HCM Workers (paginated, sorted, filtered)
         │  ↓ AllCRM API
         │  [RSVNHcmWorkers Table]
         │
         ├─ User selects worker
         │  ↓
         │  [Selected Worker State] → Auto-populate form
         │
┌────────▼─────────┐
│ Registration     │
│ Form State       │
│ ┌──────────────┐ │
│ │ email        │ │ ← Auto-filled from selected worker
│ │ fullName     │ │ ← Auto-filled from selected worker
│ │ userName     │ │ ← Auto-generated from email prefix
│ │ roleIds      │ │ ← User selects from role dropdown
│ └──────────────┘ │
└────────┬─────────┘
         │
         ├─ GET Roles (for dropdown)
         │  ↓ Auth Roles API
         │  [roles Table]
         │
         ├─ User submits form
         │  ↓ Validation (client-side)
         │  ├─ Email required? ✓
         │  └─ At least one role? ✓
         │
         ├─ POST Create User
         │  ↓ Auth Users API
         │  [users Table] → CREATE
         │  │
         │  ├─ Success (200)
         │  │  ├─ Reset form to empty state
         │  │  ├─ Show success alert
         │  │  └─ Backend logs to [Registration Audit Log]
         │  │
         │  └─ Error
         │     ├─ Duplicate Email (409/400)
         │     │  └─ Show: "Email already registered. Verify if user exists."
         │     ├─ Validation Error (400)
         │     │  └─ Show validation message
         │     └─ Server Error (500)
         │        └─ Show: "Cannot create user"
         │
┌────────▼─────────┐
│  Alert State     │
│  success/error   │
└──────────────────┘
```

## Validation Summary

| Entity/State | Validation Type | Rules |
|--------------|----------------|-------|
| HCM Worker (Frontend) | Display Filter | `sysEmail` must not be empty (FR-003) |
| Registration Form | Client-Side | Email required, roleIds.length >= 1 |
| Registration Form | Server-Side | Email format, email uniqueness, username uniqueness |
| Pagination Model | Client-Side | page >= 0, pageSize in [5,10,25,50] |
| Sort Model | Client-Side | field in [personnelNumber, name, sysEmail] |

## State Lifecycle

```
Component Mount
  ↓
Fetch HCM Workers (page 1)
Fetch Roles (for dropdown)
  ↓
User Interaction Loop:
  ├─ Search/Filter/Sort → Refetch HCM Workers
  ├─ Select Worker → Update selectedWorker, populate form
  ├─ Edit Form → Update formState
  └─ Submit → POST Create User
      ├─ Success → Reset formState, clear selectedWorker, show success
      └─ Error → Retain formState, show error
  ↓
Component Unmount
```

## Notes

- **No Database Migrations**: This is a frontend feature; all backend tables already exist
- **No New Backend Entities**: Reuses existing User, Role, HCM Worker, Audit Log entities
- **State Management**: Plain React `useState` (no Redux needed for isolated component)
- **Data Normalization**: Frontend normalizes API responses to handle PascalCase/camelCase variance
- **Optimistic Updates**: Not used - wait for server confirmation before resetting form

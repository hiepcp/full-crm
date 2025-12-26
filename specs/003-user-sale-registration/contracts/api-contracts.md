# API Contracts: User Sale Registration

**Feature**: User Sale Registration
**Date**: 2025-12-23
**Contract Type**: Frontend-Backend Integration

## Overview

This document defines the API contracts between the React frontend and existing backend APIs. All APIs already exist and are tested; this feature only consumes them.

---

## 1. HCM Workers API (AllCRM)

**Endpoint**: AllCRM API - HCM Workers Query
**Base URL**: `https://api-crm.local.com` (local) / `VITE_API_URL` (configured)
**Authentication**: API Key (`X-Api-Key` header) + JWT Bearer token
**Managed By**: `RestAllCRMRepository` → `GetAllCRMHcmWorkersUseCase`

### GET/POST HCM Workers (with filtering, sorting, pagination)

**Method**: POST (complex filtering requires POST body)
**Frontend Call**:
```javascript
await getHcmWorkersUseCase.execute(
  page,       // 1-indexed
  pageSize,   // 5, 10, 25, or 50
  orderBy,    // "PersonnelNumber", "Name", or "SysEmail"
  order,      // "asc" or "desc"
  filters     // Array of filter objects
);
```

**Request Body Structure**:
```json
{
  "page": 1,
  "pageSize": 10,
  "orderBy": "PersonnelNumber",
  "order": "asc",
  "filters": [
    {
      "Logic": "and",
      "Column": "PersonnelNumber",
      "Operator": "contains",
      "Value": "search term"
    },
    {
      "Logic": "and",
      "Column": "SysEmail",
      "Operator": "ne",
      "Value": ""
    }
  ]
}
```

**Filter Operators**:
- `contains`: Partial text match
- `ne`: Not equal
- `eq`: Equal
- (Other operators available but not used in this feature)

**Response Structure** (Success 200):
```json
{
  "items": [
    {
      "PersonnelNumber": "EMP001",
      "Name": "John Doe",
      "SysEmail": "john.doe@company.com"
    }
  ],
  "totalCount": 150,
  "@odata.count": 150  // Alternative count field
}
```

**Response Normalization** (Frontend):
```javascript
const normalized = items.map(normalizeWorker);
const count = data.totalCount ?? data.TotalCount ?? data["@odata.count"] ?? normalized.length;
```

**Error Responses**:
- `401 Unauthorized`: Token expired → Auto-refresh via axios interceptor
- `403 Forbidden`: Insufficient permissions → Redirect to unauthorized page
- `500 Internal Server Error`: Backend error → Display error alert

**Performance SLA**: <2 seconds for up to 10,000 workers (SC-003)

---

## 2. Auth Roles API

**Endpoint**: Auth API - Get All Roles
**Base URL**: `https://api-auth.local.com` (local) / `VITE_API_AUTHZ` (configured)
**Authentication**: API Key + JWT Bearer token
**Managed By**: `authRolesApi.getAll(page, pageSize)`

### GET All Roles

**Method**: GET
**Endpoint**: `/api/roles` (or similar, implementation-specific)

**Frontend Call**:
```javascript
const resp = await authRolesApi.getAll(1, 200);  // Fetch up to 200 roles
```

**Query Parameters**:
```
?page=1&pageSize=200
```

**Response Structure** (Success 200):
```json
{
  "data": {
    "data": {
      "items": [  // Or "Items" or "value"
        {
          "roleId": 1,  // Or "id", "RoleId", "Id"
          "name": "Sales Manager"  // Or "Name", "code", "Code"
        },
        {
          "roleId": 2,
          "name": "Admin"
        }
      ]
    }
  }
}
```

**Response Normalization** (Frontend):
```javascript
const items = resp?.data?.data?.items || resp?.data?.data?.Items || resp?.data?.data?.value || [];
const normalized = items.map((r) => ({
  id: r.roleId ?? r.id ?? r.RoleId ?? r.Id,
  name: r.name ?? r.Name ?? r.code ?? r.Code ?? "",
})).filter((r) => r.id);
```

**Error Responses**:
- `401 Unauthorized`: Token expired → Auto-refresh
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Backend error → Display error alert

**Validation**: No client-side validation needed; display all returned roles

---

## 3. Auth Users API - Create User

**Endpoint**: Auth API - Create User
**Base URL**: `https://api-auth.local.com` (local) / `VITE_API_AUTH` (configured)
**Authentication**: API Key + JWT Bearer token
**Managed By**: `authUsersApi.create(payload)`

### POST Create User

**Method**: POST
**Endpoint**: `/api/users` (or similar)

**Frontend Call**:
```javascript
const payload = {
  email: form.email,
  fullName: form.fullName,
  userName: form.userName,
  roleIds: form.roleIds,
};
await authUsersApi.create(payload);
```

**Request Body**:
```json
{
  "email": "john.doe@company.com",
  "fullName": "John Doe",
  "userName": "john.doe",
  "roleIds": [1, 3, 5]
}
```

**Field Requirements**:
- `email` (string): **Required**, must be unique, valid email format
- `fullName` (string): Optional
- `userName` (string): Optional (backend may auto-generate if missing)
- `roleIds` (array of integers): **Required**, must contain at least one role ID

**Response Structure** (Success 200/201):
```json
{
  "message": "User created successfully",
  "userId": 123
}
```
(Exact response structure may vary; frontend only checks for success status code)

**Error Responses**:

**400 Bad Request** (Validation Error):
```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["Email is required"],
    "roleIds": ["At least one role must be assigned"]
  }
}
```

**409 Conflict** or **400 Bad Request** (Duplicate Email):
```json
{
  "message": "Email already exists"
}
```
OR
```json
{
  "message": "User with this email already exists"
}
```

**Frontend Handling**:
```javascript
try {
  await authUsersApi.create(payload);
  setAlert({ severity: "success", message: "Create user successfully" });
  setForm(defaultForm);  // Reset form
} catch (error) {
  const message = error?.response?.data?.message || error?.message || "Cannot create user";

  // Check for duplicate email (FR-014)
  if (message.toLowerCase().includes("email") && message.toLowerCase().includes("exist")) {
    setAlert({
      severity: "error",
      message: "This email address is already registered. Please verify if the user already has an account."
    });
  } else {
    setAlert({ severity: "error", message });
  }
}
```

**500 Internal Server Error**:
```json
{
  "message": "Internal server error"
}
```

**Audit Logging** (Backend Automatic):
Backend API automatically logs to audit table:
- Administrator ID (from JWT token)
- Registered user email, username
- Assigned role IDs
- Timestamp
- Registration source: "Manual" or "HCM"

**Performance SLA**: <3 seconds total for user creation (SC-001)

---

## 4. Token Refresh (Automatic)

**Endpoint**: Auth API - Token Refresh
**Base URL**: `https://api-auth.local.com`
**Managed By**: `axiosInstance.js` interceptor

### POST Refresh Token

**Trigger**: Automatic on 401 Unauthorized response

**Frontend Flow**:
1. Request fails with 401
2. Axios interceptor checks if token is expired
3. Calls `/refresh` endpoint with credentials
4. Receives new access token
5. Retries original request with new token
6. If refresh fails → Redirect to login

**Request** (handled by interceptor):
```javascript
// Request includes httpOnly refresh token cookie automatically
POST /refresh
Credentials: include
```

**Response** (Success 200):
```json
{
  "accessToken": "new-jwt-token",
  "refreshToken": "new-refresh-token"  // Set as httpOnly cookie
}
```

**Frontend Action**:
```javascript
localStorage.setItem('accessToken', newAccessToken);
// Retry original request
```

**Error Response** (401 - Refresh token expired):
```json
{
  "message": "Refresh token expired"
}
```

**Frontend Action**:
```javascript
localStorage.removeItem('accessToken');
window.location.href = '/login';
```

---

## API Integration Summary

| API | Purpose | Method | Request Validation | Response Handling |
|-----|---------|--------|-------------------|-------------------|
| **HCM Workers** | Fetch worker list | POST | Page >= 1, pageSize in [5,10,25,50] | Normalize PersonnelNumber/Name/SysEmail |
| **Auth Roles** | Fetch role list | GET | Page >= 1, pageSize <= 200 | Normalize roleId/id and name/code |
| **Create User** | Register new user | POST | Email required, roleIds.length >= 1 | Check for duplicate email, show specific error |
| **Refresh Token** | Renew access token | POST | Automatic (interceptor) | Update localStorage, retry request |

---

## Error Handling Matrix

| Error Code | Cause | Frontend Action |
|-----------|-------|-----------------|
| **400** | Validation error | Display server message in Alert |
| **401** | Token expired | Auto-refresh token via interceptor, retry |
| **403** | Insufficient permissions | Redirect to /unauthorized (handled by interceptor) |
| **409** | Duplicate email | Display FR-014 message: "Email already registered. Verify if user exists." |
| **500** | Server error | Display generic error: "Cannot create user" |
| **Network Error** | API unavailable | Display: "Cannot connect to server. Please try again." |

---

## Security Considerations

1. **HTTPS Only**: All API calls use HTTPS (local: mkcert certificates)
2. **API Key**: All requests include `X-Api-Key` header
3. **JWT Bearer Token**: All requests include `Authorization: Bearer <token>`
4. **CORS**: Backend APIs configured with frontend origin whitelist
5. **Credentials**: Refresh token sent as httpOnly cookie (not accessible to JavaScript)
6. **No Password Handling**: Frontend never handles passwords (Azure AD SSO only)

---

## Rate Limiting & Performance

| API | Expected Load | Performance Target | Backend Optimization |
|-----|--------------|-------------------|---------------------|
| HCM Workers | 1-10 requests/session | <2s for 10k workers | Server-side pagination, indexed searches |
| Auth Roles | 1 request/session | <1s | Small dataset (~10-50 roles), cacheable |
| Create User | 1-5 requests/session | <3s | Database insert + audit log |

---

## Testing Scenarios

### Happy Path
1. Load HCM Workers → 200 OK with workers list
2. Load Roles → 200 OK with roles list
3. Select worker → Form auto-populated
4. Assign role(s) → roleIds array updated
5. Submit → 200 OK → Form reset, success alert

### Error Paths
1. **Duplicate Email**: Submit existing email → 409 Conflict → FR-014 error message
2. **Validation Error**: Submit without role → 400 Bad Request → Validation error message
3. **API Unavailable**: HCM Workers API down → 500 Error → Error alert
4. **Token Expired**: Token expires mid-session → 401 → Auto-refresh → Retry → Success
5. **Network Timeout**: Slow network → Request timeout → Error alert

### Edge Cases
1. **Empty HCM Worker Email**: Worker with `SysEmail=""` → Filtered out (not displayed)
2. **Unicode Names**: Worker with special characters in name → Display correctly
3. **Page Size Change**: Change from 10 to 50 → Reset to page 1
4. **Sort Change**: Change sort from Personnel # to Name → Reset to page 1

---

## Frontend API Client Code References

**File**: `crm-system-client/src/infrastructure/api/authUsersApi.js`
```javascript
const authUsersApi = {
  create: (payload) => axiosInstance.post('/users', payload),
  // Other methods...
};
export default authUsersApi;
```

**File**: `crm-system-client/src/infrastructure/api/authRolesApi.js`
```javascript
const authRolesApi = {
  getAll: (page, pageSize) => axiosInstance.get('/roles', { params: { page, pageSize } }),
  // Other methods...
};
export default authRolesApi;
```

**File**: `crm-system-client/src/application/usecases/all-crms/GetAllCRMHcmWorkersUseCase.js`
```javascript
export class GetAllCRMHcmWorkersUseCase {
  execute(page, pageSize, orderBy, order, filters) {
    return this.repository.getHcmWorkers(page, pageSize, orderBy, order, filters);
  }
}
```

---

## Contract Versioning

**Current Version**: 1.0 (Existing APIs)
**Breaking Change Policy**: APIs are existing and stable; no breaking changes expected for this feature
**Backward Compatibility**: Frontend handles both PascalCase and camelCase API responses for maximum compatibility

---

## Notes

- All APIs are **existing and functional** - no new endpoints required
- Frontend is **read-only** for HCM Workers and Roles (no mutations)
- Frontend **creates** User Accounts via Auth API (write operation)
- Audit logging is **backend-managed** (frontend triggers, backend logs)
- Error messages are **user-friendly** per FR-014 (duplicate email scenario)

# API Contracts: Sales Team Management

**Feature**: Sales Team Management
**Branch**: 002-sales-team-management
**Date**: 2025-12-30

## Overview

This document defines the REST API contracts for the sales team management feature. All endpoints follow RESTful conventions and align with existing CRM API patterns.

## Base Path

```
/api/teams
```

## Authentication & Authorization

- **Authentication**: All endpoints require valid JWT token (via existing Auth API)
- **Authorization**: All authenticated users can access team management endpoints (per FR-018)
- **API Key**: All endpoints require XApiKey header (existing middleware)

---

## Endpoints

### 1. List Teams

Get paginated list of sales teams with optional filtering and sorting.

**Endpoint**: `GET /api/teams`

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number (1-based) |
| pageSize | integer | No | 50 | Items per page (max 100) |
| keyword | string | No | null | Search teams by name (case-insensitive) |
| orderBy | string | No | createdAt | Sort field (createdAt, updatedAt, name) |
| orderDirection | string | No | desc | Sort direction (asc, desc) |

**Request Example**:
```
GET /api/teams?page=1&pageSize=20&keyword=Enterprise&orderBy=name&orderDirection=asc
```

**Response**:
```json
{
  "success": true,
  "message": "Teams retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Enterprise Sales",
        "description": "Handles enterprise client deals",
        "createdAt": "2025-01-15T09:00:00Z",
        "createdBy": {
          "id": 10,
          "email": "john.doe@example.com",
          "displayName": "John Doe"
        },
        "updatedAt": "2025-01-15T09:00:00Z",
        "updatedBy": null,
        "memberCount": 5
      },
      {
        "id": 2,
        "name": "SMB Sales",
        "description": "Focus on small and medium businesses",
        "createdAt": "2025-01-20T14:30:00Z",
        "createdBy": {
          "id": 15,
          "email": "jane.smith@example.com",
          "displayName": "Jane Smith"
        },
        "updatedAt": "2025-01-25T11:15:00Z",
        "updatedBy": {
          "id": 20,
          "email": "bob.johnson@example.com",
          "displayName": "Bob Johnson"
        },
        "memberCount": 3
      }
    ],
    "totalCount": 2,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

**Response Codes**:
- `200 OK`: Teams retrieved successfully
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Missing or invalid API key
- `500 Internal Server Error`: Server error processing request

---

### 2. Get Team by ID

Get details of a specific team by ID.

**Endpoint**: `GET /api/teams/{id}`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | long | Yes | Team ID |

**Request Example**:
```
GET /api/teams/1
```

**Response**:
```json
{
  "success": true,
  "message": "Team retrieved successfully",
  "data": {
    "id": 1,
    "name": "Enterprise Sales",
    "description": "Handles enterprise client deals",
    "createdAt": "2025-01-15T09:00:00Z",
    "createdBy": {
      "id": 10,
      "email": "john.doe@example.com",
      "displayName": "John Doe"
    },
    "updatedAt": "2025-01-15T09:00:00Z",
    "updatedBy": null,
    "members": [
      {
        "id": 1,
        "userId": 100,
        "user": {
          "id": 100,
          "email": "alice.walker@example.com",
          "displayName": "Alice Walker",
          "avatar": "https://example.com/avatars/alice.jpg"
        },
        "role": "TeamLead",
        "joinedAt": "2025-01-15T09:05:00Z"
      },
      {
        "id": 2,
        "userId": 101,
        "user": {
          "id": 101,
          "email": "bob.harris@example.com",
          "displayName": "Bob Harris",
          "avatar": null
        },
        "role": "Member",
        "joinedAt": "2025-01-16T10:20:00Z"
      }
    ],
    "memberCount": 2,
    "dealCount": 15,
    "customerCount": 8
  }
}
```

**Response Codes**:
- `200 OK`: Team retrieved successfully
- `400 Bad Request`: Invalid team ID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Missing or invalid API key
- `404 Not Found`: Team with specified ID not found
- `500 Internal Server Error`: Server error processing request

---

### 3. Create Team

Create a new sales team.

**Endpoint**: `POST /api/teams`

**Request Body**:
```json
{
  "name": "Enterprise Sales",
  "description": "Handles enterprise client deals"
}
```

**Validation Rules**:

| Field | Validation |
|-------|-------------|
| name | Required, not empty, 1-255 characters, unique (case-insensitive) |
| description | Optional, 0-2000 characters |

**Request Headers**:
```
Content-Type: application/json
XApiKey: <your-api-key>
Authorization: Bearer <your-jwt-token>
```

**Response**:
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": 3
}
```

**Response Codes**:
- `201 Created`: Team created successfully (returns team ID in data field)
- `400 Bad Request`: Validation errors or duplicate team name
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Missing or invalid API key
- `500 Internal Server Error`: Server error creating team

---

### 4. Update Team

Update an existing team's name and/or description.

**Endpoint**: `PUT /api/teams/{id}`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | long | Yes | Team ID to update |

**Request Body**:
```json
{
  "name": "Enterprise Sales Team",
  "description": "Handles enterprise client deals and partnerships"
}
```

**Validation Rules**:

| Field | Validation |
|-------|-------------|
| name | Required if provided, not empty, 1-255 characters, unique (excluding current team) |
| description | Optional, 0-2000 characters |

**Note**: At least one field (name or description) must be provided.

**Request Headers**:
```
Content-Type: application/json
XApiKey: <your-api-key>
Authorization: Bearer <your-jwt-token>
```

**Response**:
```json
{
  "success": true,
  "message": "Team updated successfully",
  "data": null
}
```

**Response Codes**:
- `200 OK`: Team updated successfully
- `400 Bad Request**: Validation errors or duplicate team name
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Missing or invalid API key
- `404 Not Found`: Team with specified ID not found
- `500 Internal Server Error**: Server error updating team

---

### 5. Delete Team

Delete a team (only allowed if team has no members).

**Endpoint**: `DELETE /api/teams/{id}`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | long | Yes | Team ID to delete |

**Request Headers**:
```
XApiKey: <your-api-key>
Authorization: Bearer <your-jwt-token>
```

**Response**:
```json
{
  "success": true,
  "message": "Team deleted successfully",
  "data": null
}
```

**Response Codes**:
- `200 OK`: Team deleted successfully
- `400 Bad Request`: Cannot delete team with members (FR-005)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Missing or invalid API key
- `404 Not Found`: Team with specified ID not found
- `500 Internal Server Error`: Server error deleting team

---

### 6. List Team Members

Get paginated list of members for a specific team.

**Endpoint**: `GET /api/teams/{id}/members`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | long | Yes | Team ID |

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number (1-based) |
| pageSize | integer | No | 50 | Items per page (max 100) |
| role | string | No | null | Filter by role (TeamLead, Member, Observer) |

**Request Example**:
```
GET /api/teams/1/members?page=1&pageSize=20&role=Member
```

**Response**:
```json
{
  "success": true,
  "message": "Team members retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "userId": 100,
        "user": {
          "id": 100,
          "email": "alice.walker@example.com",
          "displayName": "Alice Walker",
          "avatar": "https://example.com/avatars/alice.jpg"
        },
        "role": "TeamLead",
        "joinedAt": "2025-01-15T09:05:00Z"
      },
      {
        "id": 2,
        "userId": 101,
        "user": {
          "id": 101,
          "email": "bob.harris@example.com",
          "displayName": "Bob Harris",
          "avatar": null
        },
        "role": "Member",
        "joinedAt": "2025-01-16T10:20:00Z"
      }
    ],
    "totalCount": 2,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

**Response Codes**:
- `200 OK`: Team members retrieved successfully
- `400 Bad Request`: Invalid query parameters or team ID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Missing or invalid API key
- `404 Not Found`: Team with specified ID not found
- `500 Internal Server Error`: Server error processing request

---

### 7. Add Team Member

Add a user as a member of a team.

**Endpoint**: `POST /api/teams/{id}/members`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | long | Yes | Team ID |

**Request Body**:
```json
{
  "userEmail": "alice.walker@example.com",
  "role": "TeamLead"
}
```

**Validation Rules**:

| Field | Validation |
|-------|-------------|
| userId | Required, valid user ID (references crm_user.id) |
| role | Required, valid role (TeamLead, Member, Observer) |

**Request Headers**:
```
Content-Type: application/json
XApiKey: <your-api-key>
Authorization: Bearer <your-jwt-token>
```

**Response**:
```json
{
  "success": true,
  "message": "Team member added successfully",
  "data": {
    "id": 1,
    "userId": 100,
    "user": {
      "id": 100,
      "email": "alice.walker@example.com",
      "displayName": "Alice Walker",
      "avatar": "https://example.com/avatars/alice.jpg"
    },
    "role": "TeamLead",
    "joinedAt": "2025-01-15T09:05:00Z"
  }
}
```

**Response Codes**:
- `201 Created`: Team member added successfully
- `400 Bad Request`: Validation errors or user already in team (FR-008)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Missing or invalid API key
- `404 Not Found`: Team or user not found
- `500 Internal Server Error`: Server error adding team member

---

### 8. Update Team Member Role

Update a team member's role within a team.

**Endpoint**: `PUT /api/teams/{teamId}/members/{userEmail}`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| teamId | long | Yes | Team ID |
| userEmail | string | Yes | User email to update |

**Request Body**:
```json
{
  "role": "Member"
}
```

**Validation Rules**:

| Field | Validation |
|-------|-------------|
| role | Required, valid role (TeamLead, Member, Observer) |

**Request Headers**:
```
Content-Type: application/json
XApiKey: <your-api-key>
Authorization: Bearer <your-jwt-token>
```

**Response**:
```json
{
  "success": true,
  "message": "Team member role updated successfully",
  "data": null
}
```

**Response Codes**:
- `200 OK`: Team member role updated successfully
- `400 Bad Request**: Validation errors
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Missing or invalid API key
- `404 Not Found**: Team or member not found
- `500 Internal Server Error`: Server error updating team member

---

### 9. Remove Team Member

Remove a user from a team.

**Endpoint**: `DELETE /api/teams/{teamId}/members/{userEmail}`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| teamId | long | Yes | Team ID |
| userEmail | string | Yes | User email to remove |

**Request Headers**:
```
XApiKey: <your-api-key>
Authorization: Bearer <your-jwt-token>
```

**Response**:
```json
{
  "success": true,
  "message": "Team member removed successfully",
  "data": null
}
```

**Response Codes**:
- `200 OK`: Team member removed successfully
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Missing or invalid API key
- `404 Not Found`: Team or member not found
- `500 Internal Server Error`: Server error removing team member

---

## Data Transfer Objects (DTOs)

### Request DTOs

#### CreateTeamRequest

```json
{
  "name": "string (1-255 chars, required)",
  "description": "string (0-2000 chars, optional)"
}
```

#### UpdateTeamRequest

```json
{
  "name": "string (1-255 chars, optional)",
  "description": "string (0-2000 chars, optional)"
}
```

**Note**: At least one field must be provided.

#### TeamMemberRequest

```json
{
  "userEmail": "string (required, valid user email)",
  "role": "string (required: TeamLead | Member | Observer)"
}
```

#### UpdateTeamMemberRequest

```json
{
  "role": "string (required: TeamLead | Member | Observer)"
}
```

### Response DTOs

#### TeamResponse

```json
{
  "id": "long",
  "name": "string",
  "description": "string or null",
  "createdAt": "datetime (ISO 8601)",
  "createdBy": {
    "id": "long",
    "email": "string",
    "displayName": "string"
  },
  "updatedAt": "datetime (ISO 8601) or null",
  "updatedBy": {
    "id": "long",
    "email": "string",
    "displayName": "string"
  } or null,
  "memberCount": "integer",
  "dealCount": "integer (only in detailed response)",
  "customerCount": "integer (only in detailed response)"
}
```

#### TeamMemberResponse

```json
{
  "id": "long",
  "userId": "long",
  "user": {
    "id": "long",
    "email": "string",
    "displayName": "string",
    "avatar": "string or null"
  },
  "role": "string (TeamLead | Member | Observer)",
  "joinedAt": "datetime (ISO 8601)"
}
```

#### UserReference (embedded object)

```json
{
  "id": "long",
  "email": "string",
  "displayName": "string",
  "avatar": "string or null"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific validation error"
    }
  ]
}
```

### Common Error Codes

| Code | Description | Example Messages |
|------|-------------|------------------|
| 400 | Validation error | "Team name is required", "User is already a member of this team" |
| 401 | Unauthorized | "Missing or invalid JWT token" |
| 403 | Forbidden | "Missing or invalid API key" |
| 404 | Not found | "Team with ID 999 not found", "User with ID 999 not found" |
| 500 | Server error | "An error occurred while processing your request" |

---

## Pagination

All list endpoints support pagination.

**Response Structure**:
```json
{
  "success": true,
  "message": "...",
  "data": {
    "items": [...],
    "totalCount": 150,
    "page": 1,
    "pageSize": 50,
    "totalPages": 3
  }
}
```

**Query Parameters**:
- `page`: Page number (1-based, default: 1)
- `pageSize`: Items per page (default: 50, max: 100)

---

## Sorting

**Query Parameters**:
- `orderBy`: Field to sort by (e.g., createdAt, updatedAt, name)
- `orderDirection`: Sort direction (asc, desc, default: desc)

**Supported Fields**:
- For teams: `createdAt`, `updatedAt`, `name`
- For team members: `joinedAt`, `role` (via endpoint-specific query parameter)

---

## Filtering

**Supported Filters**:

| Endpoint | Filter | Description |
|----------|---------|-------------|
| GET /teams | keyword | Search teams by name (case-insensitive) |
| GET /teams/{id}/members | role | Filter by member role (TeamLead, Member, Observer) |

---

## Audit Logging

All team and team member operations are logged with:

- **User email**: From JWT token
- **Request path**: API endpoint path
- **Request method**: GET, POST, PUT, DELETE
- **Timestamp**: When the operation occurred
- **Operation details**: Created/updated/deleted entity IDs

Logged events:
- Team creation, update, deletion
- Team member addition, role update, removal

---

## Rate Limiting

No rate limiting is configured for team management endpoints.

---

## OpenAPI Specification

A Swagger/OpenAPI specification will be automatically generated from these endpoints and can be accessed at:
```
https://api-crm.local.com/swagger
```

---

## Testing Examples

### cURL Examples

**Create Team**:
```bash
curl -X POST https://api-crm.local.com/api/teams \
  -H "Content-Type: application/json" \
  -H "XApiKey: your-api-key" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "name": "Enterprise Sales",
    "description": "Handles enterprise client deals"
  }'
```

**Add Team Member**:
```bash
curl -X POST https://api-crm.local.com/api/teams/1/members \
  -H "Content-Type: application/json" \
  -H "XApiKey: your-api-key" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "userId": 100,
    "role": "TeamLead"
  }'
```

**List Teams**:
```bash
curl -X GET "https://api-crm.local.com/api/teams?page=1&pageSize=20" \
  -H "XApiKey: your-api-key" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Next Steps

1. **Implement Backend Controllers**: Create `SalesTeamsController` with all endpoints
2. **Create Frontend API Client**: Implement `teamsApi.js` for frontend integration
3. **Create Quickstart Guide**: Provide setup and usage instructions for developers

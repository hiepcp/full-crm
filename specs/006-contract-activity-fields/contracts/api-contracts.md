# API Contracts: Contract Activity Fields

**Feature**: 006-contract-activity-fields
**Date**: 2025-12-25
**API Version**: Extends existing `/activities` endpoints

## Overview

This document specifies the API contract changes for adding contract date and contract value fields to activities. All endpoints extend existing activity API without breaking changes.

---

## Data Transfer Objects (DTOs)

### ActivityRequest (Updated)

**Purpose**: Request body for creating or updating activities

**C# Definition**:
```csharp
public class ActivityRequest
{
    // Existing fields
    public string Name { get; set; }
    public string Type { get; set; }
    public string Description { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; }
    public int? CustomerId { get; set; }
    public int? LeadId { get; set; }
    public int? DealId { get; set; }

    // NEW FIELDS
    /// <summary>
    /// Date when the contract was signed or becomes effective.
    /// Optional. Only relevant for Type = "contract".
    /// </summary>
    public DateTime? ContractDate { get; set; }

    /// <summary>
    /// Financial value of the contract.
    /// Optional. Only relevant for Type = "contract".
    /// </summary>
    public decimal? ContractValue { get; set; }
}
```

**JSON Example** (Create Contract Activity):
```json
{
  "name": "Software License Agreement with Acme Corp",
  "type": "contract",
  "description": "Annual software licensing contract",
  "dueDate": "2025-12-31T23:59:59Z",
  "status": "active",
  "customerId": 123,
  "contractDate": "2025-01-15",
  "contractValue": 50000.00
}
```

**JSON Example** (Non-Contract Activity - fields omitted):
```json
{
  "name": "Follow-up call with client",
  "type": "call",
  "description": "Discuss project progress",
  "dueDate": "2025-01-20T10:00:00Z",
  "status": "pending"
}
```

---

### ActivityResponse (Updated)

**Purpose**: Response body for activity retrieval

**C# Definition**:
```csharp
public class ActivityResponse
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Type { get; set; }
    public string Description { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; }
    public int? CustomerId { get; set; }
    public int? LeadId { get; set; }
    public int? DealId { get; set; }
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public string UpdatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // NEW FIELDS
    /// <summary>
    /// Date when the contract was signed or becomes effective.
    /// Null if not provided or not applicable.
    /// </summary>
    public DateTime? ContractDate { get; set; }

    /// <summary>
    /// Financial value of the contract.
    /// Null if not provided or not applicable.
    /// </summary>
    public decimal? ContractValue { get; set; }
}
```

**JSON Example** (Contract Activity):
```json
{
  "id": 456,
  "name": "Software License Agreement with Acme Corp",
  "type": "contract",
  "description": "Annual software licensing contract",
  "dueDate": "2025-12-31T23:59:59Z",
  "status": "active",
  "customerId": 123,
  "contractDate": "2025-01-15",
  "contractValue": 50000.00,
  "createdBy": "john.doe@example.com",
  "createdAt": "2025-01-10T08:30:00Z",
  "updatedBy": "john.doe@example.com",
  "updatedAt": "2025-01-10T08:30:00Z"
}
```

**JSON Example** (Existing Non-Contract Activity):
```json
{
  "id": 789,
  "name": "Follow-up call with client",
  "type": "call",
  "description": "Discuss project progress",
  "dueDate": "2025-01-20T10:00:00Z",
  "status": "pending",
  "contractDate": null,
  "contractValue": null,
  "createdBy": "jane.smith@example.com",
  "createdAt": "2025-01-05T14:20:00Z",
  "updatedBy": null,
  "updatedAt": null
}
```

---

### ActivityFilterRequest (Updated)

**Purpose**: Request body for filtering/querying activities

**C# Definition**:
```csharp
public class ActivityFilterRequest
{
    // Existing filters
    public string Type { get; set; }
    public string Status { get; set; }
    public int? CustomerId { get; set; }
    public int? LeadId { get; set; }
    public int? DealId { get; set; }
    public DateTime? DueDateFrom { get; set; }
    public DateTime? DueDateTo { get; set; }

    // NEW FILTERS
    /// <summary>
    /// Filter activities with contract date >= this value
    /// </summary>
    public DateTime? ContractDateFrom { get; set; }

    /// <summary>
    /// Filter activities with contract date <= this value
    /// </summary>
    public DateTime? ContractDateTo { get; set; }

    /// <summary>
    /// Filter activities with contract value >= this value
    /// </summary>
    public decimal? ContractValueMin { get; set; }

    /// <summary>
    /// Filter activities with contract value <= this value
    /// </summary>
    public decimal? ContractValueMax { get; set; }
}
```

**JSON Example** (Filter Contract Activities by Date Range):
```json
{
  "type": "contract",
  "status": "active",
  "contractDateFrom": "2025-01-01",
  "contractDateTo": "2025-12-31"
}
```

**JSON Example** (Filter by Value Range):
```json
{
  "type": "contract",
  "contractValueMin": 10000.00,
  "contractValueMax": 100000.00
}
```

---

## API Endpoints

### 1. Create Activity

**Endpoint**: `POST /api/activities`

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

**Request Body**: `ActivityRequest` (see above)

**Response**:
- **Success (201 Created)**:
  ```json
  {
    "id": 456,
    "name": "Software License Agreement with Acme Corp",
    "type": "contract",
    ...
    "contractDate": "2025-01-15",
    "contractValue": 50000.00
  }
  ```

- **Validation Error (400 Bad Request)**:
  ```json
  {
    "status": 400,
    "title": "Validation Error",
    "errors": {
      "ContractValue": ["Contract value cannot be negative"]
    }
  }
  ```

---

### 2. Update Activity

**Endpoint**: `PUT /api/activities/{id}`

**Request**: Same as Create (ActivityRequest)

**Response**:
- **Success (200 OK)**: Updated ActivityResponse
- **Not Found (404)**: Activity not found
- **Validation Error (400)**: Same as Create

**Notes**:
- Updating `contractDate` or `contractValue` to NULL is allowed (removes the value)
- Partial updates: If fields are omitted, they retain existing values

---

### 3. Get Activity by ID

**Endpoint**: `GET /api/activities/{id}`

**Response**:
- **Success (200 OK)**: ActivityResponse with contract fields (null if not set)

---

### 4. Query/Filter Activities

**Endpoint**: `POST /api/activities/query`

**Request Body**: `ActivityFilterRequest` (see above)

**Response**:
- **Success (200 OK)**:
  ```json
  {
    "items": [
      { "id": 456, "name": "...", "contractDate": "2025-01-15", "contractValue": 50000.00 },
      { "id": 457, "name": "...", "contractDate": "2025-02-01", "contractValue": 75000.00 }
    ],
    "totalCount": 2,
    "page": 1,
    "pageSize": 20
  }
  ```

**Filter Behavior**:
- `contractDateFrom` / `contractDateTo`: Inclusive range
- `contractValueMin` / `contractValueMax`: Inclusive range
- NULL values: Activities with NULL contract_date/value are **excluded** when using these filters
- To include NULL values, omit the filter parameters

---

## Validation Rules

### Backend Validation (FluentValidation)

**ContractDate**:
```csharp
RuleFor(x => x.ContractDate)
    .Must(BeAValidDate).When(x => x.ContractDate.HasValue)
    .WithMessage("Invalid date format for contract date");
```

**ContractValue**:
```csharp
RuleFor(x => x.ContractValue)
    .GreaterThanOrEqualTo(0).When(x => x.ContractValue.HasValue)
    .WithMessage("Contract value cannot be negative")
    .LessThan(1000000000000m).When(x => x.ContractValue.HasValue)
    .WithMessage("Contract value exceeds maximum allowed (1 trillion)")
    .Scale Equal(2).When(x => x.ContractValue.HasValue)
    .WithMessage("Contract value cannot have more than 2 decimal places");
```

---

## Backward Compatibility

### Existing Clients

- **GET /api/activities/{id}**: Returns new fields as `null` for existing activities
- **POST /api/activities**: New fields are optional; existing clients can ignore them
- **PUT /api/activities/{id}**: Existing clients not sending new fields will not modify them

### Breaking Change Assessment

**✓ NO BREAKING CHANGES**

- Adding optional fields to DTOs is non-breaking
- Existing API consumers continue to work without modifications
- New fields appear in responses but can be safely ignored by older clients

---

## Frontend Integration

### API Client Updates (`activitiesApi.js`)

**Example**:
```javascript
// Create contract activity
export const createActivity = async (activityData) => {
  const response = await axiosInstance.post('/api/activities', {
    name: activityData.name,
    type: activityData.type,
    description: activityData.description,
    dueDate: activityData.dueDate,
    status: activityData.status,
    customerId: activityData.customerId,
    // New fields
    contractDate: activityData.contractDate || null,
    contractValue: activityData.contractValue || null
  });
  return response.data;
};

// Filter activities by contract date range
export const filterActivitiesByContractDate = async (dateFrom, dateTo) => {
  const response = await axiosInstance.post('/api/activities/query', {
    type: 'contract',
    contractDateFrom: dateFrom,
    contractDateTo: dateTo
  });
  return response.data;
};
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "status": 400,
  "title": "Validation Error",
  "errors": {
    "ContractValue": [
      "Contract value cannot be negative"
    ],
    "ContractDate": [
      "Invalid date format for contract date"
    ]
  },
  "traceId": "00-abc123-def456-01"
}
```

### Common Error Scenarios

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| Negative contract value | 400 | "Contract value cannot be negative" |
| Invalid date format | 400 | "Invalid date format for contract date" |
| Value exceeds maximum | 400 | "Contract value exceeds maximum allowed" |
| Unauthorized | 401 | "Unauthorized" |
| Activity not found | 404 | "Activity not found" |

---

## Summary

**Changes**:
- ✓ 2 new optional fields in `ActivityRequest` and `ActivityResponse`
- ✓ 4 new filter parameters in `ActivityFilterRequest`
- ✓ No new endpoints required
- ✓ Backward compatible with existing API clients
- ✓ Validation rules enforced via FluentValidation

**Next Steps**:
- Implement validators in `CRM.Application/Validators/ActivityValidator.cs`
- Update repository methods for filtering
- Update frontend forms and API clients

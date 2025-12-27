# Data Model: Add Contract Activity Type

**Feature**: 005-contract-activity
**Date**: 2025-12-24

## Overview

This document describes the data model changes required to add "contract" as a new activity type. This is a minimal change affecting only the ActivityType ENUM in the existing `crm_activity` table.

## Entity Changes

### Activity Entity (Modified)

**Table**: `crm_activity`
**Change Type**: ENUM extension (non-breaking)
**Layer**: Infrastructure (Database Schema)

#### Current Schema (Before)

```sql
CREATE TABLE IF NOT EXISTS crm_activity (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ExternalId VARCHAR(255) NULL,
  ConversationId VARCHAR(255) NULL,
  SourceFrom VARCHAR(100) NULL,
  Subject VARCHAR(500) NULL,
  Body LONGTEXT NULL,
  ActivityType ENUM('email','call','meeting','task','note') NOT NULL DEFAULT 'note',  -- CURRENT
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,
  DueAt DATETIME NULL,
  CompletedAt DATETIME NULL,
  StartAt DATETIME NULL,
  EndAt DATETIME NULL,
  Status ENUM('open','in_progress','completed','cancelled','overdue') NOT NULL DEFAULT 'open',
  Priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  AssignedTo VARCHAR(255) NULL,
  RelationType VARCHAR(50) NULL,
  RelationId BIGINT NULL,
  CallDuration INT NULL,
  CallOutcome VARCHAR(100) NULL,

  INDEX idx_crm_activity_externalId (ExternalId),
  INDEX idx_crm_activity_conversationId (ConversationId),
  INDEX idx_crm_activityType (ActivityType),
  INDEX idx_crm_activity_status (Status),
  INDEX idx_crm_activity_relation (RelationType, RelationId),
  INDEX idx_crm_activity_assignedTo (AssignedTo),
  INDEX idx_crm_activity_dueAt (DueAt),
  INDEX idx_crm_activity_createdOn (CreatedOn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Updated Schema (After)

```sql
CREATE TABLE IF NOT EXISTS crm_activity (
  Id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ExternalId VARCHAR(255) NULL,
  ConversationId VARCHAR(255) NULL,
  SourceFrom VARCHAR(100) NULL,
  Subject VARCHAR(500) NULL,
  Body LONGTEXT NULL,
  ActivityType ENUM('email','call','meeting','task','note','contract') NOT NULL DEFAULT 'note',  -- UPDATED
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NULL,
  UpdatedOn DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255) NULL,
  DueAt DATETIME NULL,
  CompletedAt DATETIME NULL,
  StartAt DATETIME NULL,
  EndAt DATETIME NULL,
  Status ENUM('open','in_progress','completed','cancelled','overdue') NOT NULL DEFAULT 'open',
  Priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  AssignedTo VARCHAR(255) NULL,
  RelationType VARCHAR(50) NULL,
  RelationId BIGINT NULL,
  CallDuration INT NULL,
  CallOutcome VARCHAR(100) NULL,

  INDEX idx_crm_activity_externalId (ExternalId),
  INDEX idx_crm_activity_conversationId (ConversationId),
  INDEX idx_crm_activityType (ActivityType),
  INDEX idx_crm_activity_status (Status),
  INDEX idx_crm_activity_relation (RelationType, RelationId),
  INDEX idx_crm_activity_assignedTo (AssignedTo),
  INDEX idx_crm_activity_dueAt (DueAt),
  INDEX idx_crm_activity_createdOn (CreatedOn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Change Summary**: Added `'contract'` to the ActivityType ENUM values.

#### Migration Script (For Existing Databases)

If the `crm_activity` table already exists in production, use this ALTER TABLE statement:

```sql
-- Migration script for existing databases
ALTER TABLE crm_activity
MODIFY COLUMN ActivityType ENUM('email','call','meeting','task','note','contract') NOT NULL DEFAULT 'note';
```

**Execution Notes**:
- This operation requires a table-level lock
- Estimated duration: <1 second for typical table sizes
- Recommended execution: During maintenance window
- No data migration needed (no existing 'contract' activities to convert)

---

### Activity Entity - Domain Layer (C#)

**File**: `crm-system/src/CRM.Domain/Entities/Activity.cs`
**Change**: Add computed property `IsContract`

#### Current Implementation (Excerpt)

```csharp
public class Activity : BaseEntity
{
    public string ActivityType { get; set; } = "note"; // ENUM: email, call, meeting, task, note

    // === Computed Properties ===
    [NotMapped]
    public bool IsEmail => ActivityType == "email";
    [NotMapped]
    public bool IsCall => ActivityType == "call";
    [NotMapped]
    public bool IsMeeting => ActivityType == "meeting";
    [NotMapped]
    public bool IsTask => ActivityType == "task";
    [NotMapped]
    public bool IsNote => ActivityType == "note";
    // ... other properties
}
```

#### Updated Implementation

```csharp
public class Activity : BaseEntity
{
    public string ActivityType { get; set; } = "note"; // ENUM: email, call, meeting, task, note, contract

    // === Computed Properties ===
    [NotMapped]
    public bool IsEmail => ActivityType == "email";
    [NotMapped]
    public bool IsCall => ActivityType == "call";
    [NotMapped]
    public bool IsMeeting => ActivityType == "meeting";
    [NotMapped]
    public bool IsTask => ActivityType == "task";
    [NotMapped]
    public bool IsNote => ActivityType == "note";
    [NotMapped]
    public bool IsContract => ActivityType == "contract";  // NEW
    // ... other properties
}
```

**Change Summary**: Added `IsContract` computed property and updated comment.

---

### ActivityResponse DTO - Application Layer (C#)

**File**: `crm-system/src/CRM.Application/Dtos/Response/ActivityResponse.cs`
**Change**: Add computed property `IsContract`

#### Current Implementation (Excerpt)

```csharp
public class ActivityResponse
{
    public string? ActivityType { get; set; }

    // === Computed Properties ===
    public bool IsEmail => ActivityType == "email";
    public bool IsCall => ActivityType == "call";
    public bool IsMeeting => ActivityType == "meeting";
    public bool IsTask => ActivityType == "task";
    public bool IsNote => ActivityType == "note";
    // ... other properties
}
```

#### Updated Implementation

```csharp
public class ActivityResponse
{
    public string? ActivityType { get; set; }

    // === Computed Properties ===
    public bool IsEmail => ActivityType == "email";
    public bool IsCall => ActivityType == "call";
    public bool IsMeeting => ActivityType == "meeting";
    public bool IsTask => ActivityType == "task";
    public bool IsNote => ActivityType == "note";
    public bool IsContract => ActivityType == "contract";  // NEW
    // ... other properties
}
```

**Change Summary**: Added `IsContract` computed property.

---

## No New Entities

This feature does NOT introduce any new entities or tables. It extends an existing entity with a new ENUM value.

---

## Relationships

**No relationship changes required.** The Activity entity's existing relationships remain unchanged:

- **Activity → Customer** (via RelationType='customer', RelationId)
- **Activity → Lead** (via RelationType='lead', RelationId)
- **Activity → Deal** (via RelationType='deal', RelationId)
- **Activity → Contact** (via RelationType='contact', RelationId)
- **Activity → ActivityAttachment** (1-to-many via IdRef or foreign key)

Contract activities can be related to any of these entities using the existing RelationType/RelationId pattern.

---

## Validation Rules

### Database-Level Validation

✅ **ActivityType ENUM**: Enforced by MySQL ENUM constraint
- Valid values: `'email'`, `'call'`, `'meeting'`, `'task'`, `'note'`, `'contract'`
- Invalid values rejected with error: "Data truncated for column 'ActivityType'"

### Application-Level Validation

**File**: `crm-system/src/CRM.Application/Validators/ActivityRequestValidator.cs` (if exists)

No changes required - existing validation logic should already:
- Accept any valid ENUM value from database
- Validate ActivityType is not null/empty
- Auto-accept 'contract' once database ENUM is updated

**Frontend Validation**:
- Dropdown constrained to valid values via `ACTIVITY_TYPES` constant
- No additional validation needed

---

## State Transitions

**No state transition changes.** Contract activities follow the same Status ENUM as all other activity types:

- `open` → `in_progress` → `completed`
- `open` → `cancelled`
- `open` → `overdue` (auto-transition based on DueAt)

Contract activities do NOT require special state machine logic or workflow rules.

---

## Indexes

**No index changes required.** The existing index on ActivityType column (`idx_crm_activityType`) automatically includes the new 'contract' value:

```sql
INDEX idx_crm_activityType (ActivityType)
```

This index will optimize queries like:
```sql
SELECT * FROM crm_activity WHERE ActivityType = 'contract';
SELECT COUNT(*) FROM crm_activity GROUP BY ActivityType;
```

---

## Data Migration

**Migration Required**: NO

**Reason**: This is a new activity type. No existing activities need to be converted to 'contract' type.

**Data Impact**: None

**Rollback Strategy**: If rollback is needed, the ENUM can be reverted using:
```sql
ALTER TABLE crm_activity
MODIFY COLUMN ActivityType ENUM('email','call','meeting','task','note') NOT NULL DEFAULT 'note';
```

⚠️ **Warning**: Rollback will FAIL if any 'contract' activities exist in the database. These would need to be deleted or converted to another type first.

---

## Performance Considerations

### Query Performance

✅ **No performance impact expected.**
- ENUM storage is highly efficient (1-2 bytes)
- Adding one more value does not change query performance
- Existing indexes remain optimal

### Table Lock During Migration

⚠️ **Brief lock during ALTER TABLE**:
- Duration: Typically <1 second
- Impact: Activity creation/updates blocked during lock
- Mitigation: Execute during low-traffic maintenance window

---

## Backward Compatibility

### Database Schema

✅ **Backward compatible for reads**: Existing queries selecting activities will continue to work
✅ **Backward compatible for writes**: Existing activity types (email, call, meeting, task, note) unaffected
⚠️ **Not backward compatible for old backend**: Backend deployed before schema change will reject 'contract' activities if created

**Compatibility Matrix**:

| Old Database | New Database |
|-------------|--------------|
| Old Backend: ✅ Works | Old Backend: ❌ Cannot read 'contract' activities |
| New Backend: ❌ Cannot create 'contract' | New Backend: ✅ Works |

**Conclusion**: Database and backend must be deployed together.

### Frontend

✅ **Frontend backward compatible**: Old frontend (without 'contract' constant) will still work with new backend
- Contract activities will display but may use fallback styling
- Contract option will not appear in dropdowns until frontend is updated

---

## API Contract Impact

**API Endpoints**: No changes to endpoint URLs or HTTP methods

**Request DTOs**: No changes required
- `CreateActivityRequest`: Accepts ActivityType as string, 'contract' automatically valid once DB updated
- `UpdateActivityRequest`: Same as above

**Response DTOs**: Minor addition
- `ActivityResponse`: Adds `IsContract` boolean property
- Existing API consumers can ignore this new property (non-breaking change)

**Example API Response (After)**:
```json
{
  "id": 12345,
  "activityType": "contract",
  "subject": "Contract Signing with ABC Corp",
  "body": "Customer signed annual service contract",
  "status": "completed",
  "priority": "high",
  "isEmail": false,
  "isCall": false,
  "isMeeting": false,
  "isTask": false,
  "isNote": false,
  "isContract": true,  // NEW
  "relationType": "customer",
  "relationId": 456,
  "createdOn": "2025-12-24T10:30:00Z",
  "createdBy": "john.doe@example.com"
}
```

---

## Testing Data Requirements

### Test Scenarios

1. **Create contract activity**
   ```sql
   INSERT INTO crm_activity (Subject, Body, ActivityType, Status, Priority, RelationType, RelationId, CreatedBy)
   VALUES ('Contract Renewal', 'Renewed annual contract', 'contract', 'completed', 'high', 'customer', 123, 'test@example.com');
   ```

2. **Query contract activities**
   ```sql
   SELECT * FROM crm_activity WHERE ActivityType = 'contract';
   ```

3. **Filter by multiple types including contract**
   ```sql
   SELECT * FROM crm_activity WHERE ActivityType IN ('contract', 'email', 'call');
   ```

4. **Group by activity type**
   ```sql
   SELECT ActivityType, COUNT(*) as count FROM crm_activity GROUP BY ActivityType;
   ```

### Test Data Set

```sql
-- Sample contract activities for testing
INSERT INTO crm_activity (Subject, Body, ActivityType, Status, Priority, RelationType, RelationId, CreatedBy) VALUES
('Contract Signed', 'Initial contract signed with customer', 'contract', 'completed', 'high', 'customer', 1, 'sales@example.com'),
('Contract Renewal', 'Annual contract renewal discussion', 'contract', 'in_progress', 'normal', 'customer', 1, 'sales@example.com'),
('Contract Amendment', 'Requested changes to contract terms', 'contract', 'open', 'urgent', 'deal', 5, 'legal@example.com'),
('Contract Cancellation', 'Customer requested contract termination', 'contract', 'cancelled', 'high', 'customer', 2, 'support@example.com');
```

---

## Summary

### Files Modified

1. `crm-system/src/CRM.Infrastructure/Sqls/reset_database.sql` - Add 'contract' to ENUM
2. `crm-system/src/CRM.Domain/Entities/Activity.cs` - Add `IsContract` property
3. `crm-system/src/CRM.Application/Dtos/Response/ActivityResponse.cs` - Add `IsContract` property

### SQL Changes

- **1 line change**: Extend ActivityType ENUM from 5 to 6 values
- **Migration**: Single ALTER TABLE statement (if db exists)

### Code Changes

- **2 properties added**: `IsContract` in domain entity and response DTO
- **2 comments updated**: ActivityType field comments to include 'contract'

### Database Impact

- **Performance**: None (negligible)
- **Storage**: None (ENUM already allocated)
- **Indexes**: None (existing indexes apply)
- **Backward Compatibility**: ✅ Schema is additive only

### Risks

- ✅ **LOW RISK**: Simple additive change
- ✅ **Well-tested pattern**: Follows existing activity type structure
- ✅ **Minimal surface area**: Only 3 files affected in backend

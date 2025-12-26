# Data Model: Contract Activity Fields

**Feature**: 006-contract-activity-fields
**Date**: 2025-12-25
**Phase**: 1 - Design & Contracts

## Entity Changes

### Activity Entity

**Existing Entity** (from `CRM.Domain/Entities/Activity.cs`):
```csharp
public class Activity
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Type { get; set; }  // e.g., "call", "meeting", "email", "contract"
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
    // ... other fields
}
```

**Updated Entity** (add new properties):
```csharp
public class Activity
{
    // ... existing properties ...

    /// <summary>
    /// Date when the contract was signed or becomes effective.
    /// Only applicable when Type = "contract". Nullable for backward compatibility.
    /// </summary>
    public DateTime? ContractDate { get; set; }

    /// <summary>
    /// Financial value of the contract.
    /// Only applicable when Type = "contract". Nullable for backward compatibility.
    /// </summary>
    public decimal? ContractValue { get; set; }
}
```

**Database Mapping**:
- **C# Property**: `ContractDate` (nullable DateTime)
- **DB Column**: `contract_date` (DATE NULL)
- **C# Property**: `ContractValue` (nullable decimal)
- **DB Column**: `contract_value` (DECIMAL(18, 2) NULL)

---

## Database Schema Changes

### Migration Script

```sql
-- Migration: Add contract fields to activities table
-- Feature: 006-contract-activity-fields
-- Date: 2025-12-25

USE crm_database;  -- Replace with actual database name

-- Add contract_date column
ALTER TABLE activities
ADD COLUMN contract_date DATE NULL
COMMENT 'Date when contract was signed or becomes effective (contract-type activities only)';

-- Add contract_value column
ALTER TABLE activities
ADD COLUMN contract_value DECIMAL(18, 2) NULL
COMMENT 'Financial value of the contract (contract-type activities only)';

-- Add index for date range filtering (if filtering performance becomes important)
CREATE INDEX idx_activities_contract_date
ON activities(contract_date)
WHERE contract_date IS NOT NULL;

-- Add index for value range filtering (optional, add if needed)
CREATE INDEX idx_activities_contract_value
ON activities(contract_value)
WHERE contract_value IS NOT NULL;
```

**Rollback Script**:
```sql
-- Rollback: Remove contract fields from activities table

USE crm_database;

DROP INDEX IF EXISTS idx_activities_contract_value ON activities;
DROP INDEX IF EXISTS idx_activities_contract_date ON activities;

ALTER TABLE activities
DROP COLUMN contract_value;

ALTER TABLE activities
DROP COLUMN contract_date;
```

---

## Validation Rules

### Contract Date Validation

| Rule | Validation | Error Message |
|------|------------|---------------|
| Format | Must be valid date if provided | "Invalid date format for contract date" |
| Optional | Can be NULL | N/A |
| Range | Can be past, present, or future | N/A (all dates valid) |

### Contract Value Validation

| Rule | Validation | Error Message |
|------|------------|---------------|
| Type | Must be numeric (decimal) if provided | "Contract value must be a number" |
| Optional | Can be NULL | N/A |
| Non-negative | Must be >= 0 if provided | "Contract value cannot be negative" |
| Maximum | Must be < 1,000,000,000,000 | "Contract value exceeds maximum allowed" |
| Precision | Max 2 decimal places | "Contract value cannot have more than 2 decimal places" |

---

## Field Dependencies

### Type-Specific Fields

- **Contract Date** and **Contract Value** are semantically meaningful **only** when `Activity.Type == "contract"`
- However, database and entity allow these fields for all activity types (for flexibility)
- **Business Logic**: Frontend should only display/edit these fields for contract-type activities
- **Validation**: Backend does not enforce type-specific validation (allows flexibility for future use cases)

---

## State Transitions

**No state machine** - These are simple data fields with no complex state transitions.

**Related State**:
- When activity type changes from "contract" to another type, contract_date and contract_value **remain in database** but are not displayed/editable in UI
- When activity type changes to "contract", previously saved contract_date and contract_value (if any) are restored

**Rationale**: Preserves data in case of accidental type changes or future type conversions.

---

## Relationships

### Existing Relationships (unchanged)

- `Activity` → `Customer` (many-to-one via `CustomerId`)
- `Activity` → `Lead` (many-to-one via `LeadId`)
- `Activity` → `Deal` (many-to-one via `DealId`)

### New Relationships

**None** - Contract date and value are simple scalar fields, not foreign keys.

### Future Considerations

- If goal-setting features are implemented, they may reference `contract_date` and `contract_value` for analytics
- No new foreign keys or tables anticipated at this time

---

## Data Integrity

### Constraints

```sql
-- Constraint: contract_value must be non-negative if not null
ALTER TABLE activities
ADD CONSTRAINT chk_contract_value_non_negative
CHECK (contract_value IS NULL OR contract_value >= 0);

-- Note: Date validity is enforced by DATE type
-- Note: Maximum value constraint can be added if needed:
-- CHECK (contract_value IS NULL OR contract_value < 1000000000000)
```

### NULL Handling

- **Both fields default to NULL** for all existing and new activities
- **NULL semantics**: "Not provided" or "Not applicable"
- **Queries**: Must handle NULL appropriately:
  - Filter "activities with contract dates" → `WHERE contract_date IS NOT NULL`
  - Filter "activities without contract values" → `WHERE contract_value IS NULL`

---

## Indexing Strategy

### Recommended Indexes

1. **contract_date** (if date range filtering is frequent):
   ```sql
   CREATE INDEX idx_activities_contract_date
   ON activities(contract_date)
   WHERE contract_date IS NOT NULL;
   ```

2. **contract_value** (if value range filtering is frequent):
   ```sql
   CREATE INDEX idx_activities_contract_value
   ON activities(contract_value)
   WHERE contract_value IS NOT NULL;
   ```

### Index Rationale

- **Partial indexes** (with `WHERE ... IS NOT NULL`) save space since most non-contract activities have NULL values
- **Query patterns**: Enable efficient filtering by date range and value range
- **Trade-off**: Slight write overhead vs. significant read performance gain for filtered queries

### When NOT to Add Indexes

- If contract activities are \< 5% of total activities and filtering is infrequent
- Monitor query performance first, add indexes only if slow queries are observed

---

## Summary

**Changes**:
- **Domain Entity**: 2 new nullable properties (`ContractDate`, `ContractValue`)
- **Database**: 2 new nullable columns (`contract_date DATE NULL`, `contract_value DECIMAL(18,2) NULL`)
- **Constraints**: Non-negative check for contract_value
- **Indexes**: Optional indexes for filtering performance

**Backward Compatibility**:
- ✓ Existing activities unaffected (NULL values)
- ✓ Existing queries unaffected (new columns ignored if not referenced)
- ✓ No breaking changes to API contracts (fields added to DTOs as nullable)

**Next Steps**:
- Define API contracts (request/response DTOs) in `/contracts/`
- Create developer quickstart guide

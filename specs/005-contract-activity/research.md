# Research & Design Decisions: Add Contract Activity Type with Date and Value

**Feature**: 005-contract-activity
**Date**: 2025-12-24
**Updated**: 2025-12-25
**Status**: Complete

## Overview

This document captures the research findings and design decisions for adding "contract" as a new activity type with two additional fields: contract date and contract value. This enhancement extends the existing activity tracking system to support contract-specific data for goal setting and revenue forecasting.

## Technical Decisions

### Decision 1: Database Schema Approach for Contract Date and Value Fields

**Decision**: Add two new nullable columns to existing `crm_activity` table: `contract_date` (DATE) and `contract_value` (DECIMAL(12,2))

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Add columns to crm_activity | Add contract_date and contract_value to existing table | ✅ Consistent with existing pattern<br>✅ All activity data in one table<br>✅ Simple queries | ⚠️ Nullable columns (only for contract type) | ✅ **SELECTED** |
| B. Separate contract_details table | Create contract_activities join table | ❌ Over-engineering<br>❌ Complex queries<br>❌ Violates existing pattern | None | ❌ Rejected |
| C. JSON/BLOB metadata field | Store contract data in JSON column | ❌ Loses query ability<br>❌ No type safety<br>❌ Can't filter/sort by value | None | ❌ Rejected |

**Rationale**: Option A maintains the existing pattern where all activity data resides in the `crm_activity` table. The contract date and value fields are only relevant for contract-type activities, so nullable columns are appropriate. This approach enables straightforward filtering, sorting, and aggregation using standard SQL without complex joins.

**Implementation Details**:
```sql
-- Add new columns for contract-specific data
ALTER TABLE crm_activity
ADD COLUMN contract_date DATE NULL COMMENT 'Date when contract was signed/executed',
ADD COLUMN contract_value DECIMAL(12,2) NULL COMMENT 'Monetary value of contract in default currency';

-- Also modify ENUM to include 'contract' type
ALTER TABLE crm_activity
MODIFY activity_type ENUM('email','call','meeting','task','note','contract') NOT NULL DEFAULT 'note';
```

**DECIMAL(12,2) Precision Rationale**:
- Total digits: 12 (supports up to $999,999,999.99 as per spec FR-019)
- Decimal places: 2 (standard for currency - cents precision)
- DECIMAL provides exact precision (no floating-point rounding errors)
- Storage: 6 bytes - efficient for this precision level

**References**:
- Existing schema: `crm-system/src/CRM.Infrastructure/Sqls/reset_database.sql`
- MySQL DECIMAL documentation: https://dev.mysql.com/doc/refman/8.0/en/fixed-point-types.html
- Financial data best practices: https://stackoverflow.com/questions/224462/storing-money-in-a-decimal-column-what-precision-and-scale

---

### Decision 3: Currency Formatting in Frontend

**Decision**: Use JavaScript's built-in `Intl.NumberFormat` API for currency formatting

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Intl.NumberFormat | Native browser API | ✅ No dependencies<br>✅ Locale-aware<br>✅ High performance<br>✅ Automatic formatting | None | ✅ **SELECTED** |
| B. Custom string manipulation | Manual formatting function | ✅ Full control | ❌ Error-prone<br>❌ Doesn't handle edge cases | ❌ Rejected |
| C. Third-party library (accounting.js) | External dependency | ✅ Feature-rich | ❌ Unnecessary dependency<br>❌ Bundle size increase | ❌ Rejected |

**Rationale**: `Intl.NumberFormat` provides browser-native currency formatting with automatic symbol placement, thousands separators, and decimal precision. It's locale-aware and highly performant without requiring any external dependencies.

**Implementation**:
```javascript
// Create utility function in src/utils/currencyHelper.js
export const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Usage examples
formatCurrency(123456.78)  // "$123,456.78"
formatCurrency(0)          // "$0.00"
formatCurrency(null)       // "-"
```

**References**:
- MDN Intl.NumberFormat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat

---

### Decision 4: FluentValidation for Contract Value

**Decision**: Use conditional FluentValidation rules with `When()` clause for contract-specific validation

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Conditional FluentValidation | Use `When(type == contract)` rules | ✅ Centralized validation<br>✅ Follows existing pattern<br>✅ Testable | None | ✅ **SELECTED** |
| B. Data Annotations | Use [Range] attribute | ❌ Less flexible<br>❌ Can't do conditional validation | None | ❌ Rejected |
| C. Manual service layer validation | Validate in ActivityService | ❌ Violates separation of concerns<br>❌ Not testable in isolation | None | ❌ Rejected |

**Rationale**: FluentValidation supports conditional validation via `When()`, allowing contract value validation to only apply when activity type is "contract". This centralizes validation logic and maintains testability.

**Implementation**:
```csharp
// In CRM.Application/Validators/ActivityRequestValidator.cs
public class ActivityRequestValidator : AbstractValidator<ActivityRequest>
{
    public ActivityRequestValidator()
    {
        // Contract value validation (only for contract activities)
        When(x => x.ActivityType == "contract", () =>
        {
            RuleFor(x => x.ContractValue)
                .GreaterThan(0)
                .WithMessage("Contract value must be greater than zero")
                .PrecisionScale(12, 2, true)
                .WithMessage("Contract value cannot exceed 999,999,999.99");
        });

        // Contract date validation (optional field)
        When(x => x.ActivityType == "contract" && x.ContractDate.HasValue, () =>
        {
            RuleFor(x => x.ContractDate)
                .LessThanOrEqualTo(DateTime.Now.AddYears(10))
                .WithMessage("Contract date cannot be more than 10 years in the future");
        });
    }
}
```

**References**:
- FluentValidation Conditional Validation: https://docs.fluentvalidation.net/en/latest/conditions.html

---

### Decision 5: Conditional Form Fields Pattern

**Decision**: Create separate `ContractFields` component with conditional rendering

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Separate ContractFields component | Isolated contract fields component | ✅ Clean separation<br>✅ Reusable<br>✅ Performant (unmounts when hidden) | None | ✅ **SELECTED** |
| B. Inline conditional rendering | Render fields directly in ActivityForm | ❌ Clutters main form<br>❌ Less reusable | None | ❌ Rejected |
| C. CSS display:none | Hide with CSS | ❌ Fields still mount<br>❌ Validation issues | None | ❌ Rejected |

**Rationale**: Separating contract-specific fields into a dedicated component improves code organization and reusability. The component only mounts when activity type is "contract", improving performance.

**Implementation**:
```jsx
// src/presentation/components/activity/ContractFields.jsx (NEW)
const ContractFields = ({ contractDate, contractValue, onChange }) => {
  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
      <Typography variant="h6">Contract Details</Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Contract Date"
          value={contractDate}
          onChange={(date) => onChange({ contractDate: date })}
          renderInput={(params) => <TextField {...params} />}
        />
      </LocalizationProvider>
      <TextField
        label="Contract Value"
        type="number"
        value={contractValue || ''}
        onChange={(e) => onChange({ contractValue: parseFloat(e.target.value) })}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        helperText="Enter contract value (must be greater than 0)"
      />
    </Box>
  );
};

// Usage in ActivityForm.jsx
{activityType === 'contract' && (
  <ContractFields
    contractDate={formData.contractDate}
    contractValue={formData.contractValue}
    onChange={handleContractFieldsChange}
  />
)}
```

**References**:
- React Conditional Rendering: https://react.dev/learn/conditional-rendering
- Material-UI DatePicker: https://mui.com/x/react-date-pickers/date-picker/

---

### Decision 6: Aggregate Query Pattern for Total Contract Value

**Decision**: Use Dapper with SQL SUM queries for calculating total contract value

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. SQL SUM with Dapper | Database-level aggregation | ✅ Performant<br>✅ Type-safe<br>✅ Handles NULL correctly | None | ✅ **SELECTED** |
| B. Load all and sum in memory | Retrieve all activities, sum in C# | ❌ Inefficient for large datasets<br>❌ Network overhead | None | ❌ Rejected |
| C. Pre-calculated totals | Store total in separate table | ❌ Over-engineering<br>❌ Risk of stale data<br>❌ Additional maintenance | None | ❌ Rejected |

**Rationale**: Performing aggregation at the database level using SQL SUM is the most efficient approach. Dapper provides type-safe mapping and handles NULL values correctly.

**Implementation**:
```csharp
// In CRM.Infrastructure/Repositories/ActivityRepository.cs
public async Task<decimal?> GetTotalContractValueByCustomer(int customerId)
{
    var sql = @"
        SELECT SUM(contract_value)
        FROM crm_activity
        WHERE activity_type = 'contract'
          AND customer_id = @CustomerId
          AND contract_value IS NOT NULL";

    return await _connection.QueryFirstOrDefaultAsync<decimal?>(sql,
        new { CustomerId = customerId });
}

// In CRM.Application/Services/ActivityService.cs
public async Task<decimal> GetTotalContractValueForCustomer(int customerId)
{
    var total = await _activityRepository.GetTotalContractValueByCustomer(customerId);
    return total ?? 0m; // Return 0 if no contracts found
}
```

**References**:
- Dapper Aggregate Queries: https://github.com/DapperLib/Dapper
- MySQL SUM Function: https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html#function_sum

---

### Decision 7: Icon and Color Scheme

**Decision**: Use 📄 (document icon) with Material-UI secondary/purple color scheme

**Options Considered**:

| Option | Icon | Color | Pros | Cons | Verdict |
|--------|------|-------|------|------|---------|
| A. Document icon | 📄 | Purple/Secondary | ✅ Semantically correct<br>✅ Not used by other types<br>✅ Aligns with MUI theme | None | ✅ **SELECTED** |
| B. Handshake icon | 🤝 | Blue | ✅ Represents contracts | ❌ Similar to "Referral" icon<br>❌ Blue already used (Meeting) | ❌ Rejected |
| C. Pen icon | ✍️ | Green | ✅ Signing contracts | ❌ Less clear meaning<br>❌ Green used (Email) | ❌ Rejected |

**Rationale**: The document icon (📄) clearly represents contracts and legal documents. Purple/secondary color is available in the Material-UI theme and not currently used by other activity types. This ensures visual distinction without conflicts.

**Current Activity Type Colors** (for reference):
- Email: Green (`theme.palette.success.main`)
- Call: Orange (`theme.palette.warning.main`)
- Meeting: Blue (`theme.palette.info.main`)
- Task: Primary Blue (`theme.palette.primary.main`)
- Note: Default/Grey

**Implementation**:
```javascript
// In ActivityFeed.jsx iconConfig switch
case ACTIVITY_CATEGORIES.CONTRACT:
  return {
    icon: <DescriptionIcon fontSize="small" />, // MUI document icon
    bg: theme.palette.secondary.lighter,
    color: theme.palette.secondary.main
  };
```

**References**:
- Existing icon logic: `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityFeed.jsx:209-219`
- MUI Icons: https://mui.com/material-ui/material-icons/

---

### Decision 8: Frontend Constant Structure

**Decision**: Add to both `ACTIVITY_TYPES` (for forms) and `ACTIVITY_CATEGORIES` (for filtering)

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Two constants | Add to both ACTIVITY_TYPES and ACTIVITY_CATEGORIES | ✅ Follows existing pattern<br>✅ Supports both form creation and filtering | None | ✅ **SELECTED** |
| B. Single constant | Use one constant for both purposes | ❌ Breaks existing pattern<br>❌ Requires refactoring all usages | None | ❌ Rejected |

**Rationale**: The codebase currently uses two separate constants:
- `ACTIVITY_TYPES`: Array of objects with `value` and `label` for dropdown forms (includes emojis like "📄 Contract")
- `ACTIVITY_CATEGORIES`: Object with keys for filtering logic (simple string values like "contract")

This separation allows frontend components to display user-friendly labels in forms while using clean string values for filtering/categorization logic.

**Implementation**:
```javascript
// In constants.js
export const ACTIVITY_TYPES = [
  { value: 'email', label: '📧 Email' },
  { value: 'meeting-online', label: '📹 Online Appointment' },
  { value: 'meeting-offline', label: '📅 Offline Appointment' },
  { value: 'call', label: '📞 Call' },
  { value: 'note', label: '📝 Note' },
  { value: 'contract', label: '📄 Contract' }  // NEW
];

export const ACTIVITY_CATEGORIES = {
  EMAIL: 'email',
  CALL: 'call',
  MEETING: 'meeting',
  NOTE: 'note',
  CONTRACT: 'contract'  // NEW
};
```

**References**:
- Existing constants: `crm-system-client/src/utils/constants.js:90-110`

---

### Decision 9: Backend DTO Computed Properties

**Decision**: Add `IsContract` computed property and extend DTOs with `ContractDate` and `ContractValue`

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Both entity and DTO | Add to Activity.cs and ActivityResponse.cs | ✅ Consistent with existing pattern<br>✅ Enables filtering at both layers | ⚠️ Minor duplication | ✅ **SELECTED** |
| B. DTO only | Add only to ActivityResponse.cs | ✅ Less duplication | ❌ Breaks pattern (all other types have both)<br>❌ Can't filter in repository layer | ❌ Rejected |

**Rationale**: The existing codebase has computed properties like `IsEmail`, `IsCall`, `IsMeeting`, `IsTask`, `IsNote` in both the domain entity (Activity.cs) and the response DTO (ActivityResponse.cs). For contract activities, we extend this pattern by also adding the new `ContractDate` and `ContractValue` properties. This enables:
- Domain-level business logic using type checks (if needed in future)
- API response consumers to easily identify activity types without string comparison
- Consistency across all activity types
- Direct access to contract-specific data fields

**Implementation**:
```csharp
// In Activity.cs (Domain)
public DateTime? ContractDate { get; set; }
public decimal? ContractValue { get; set; }

[NotMapped]
public bool IsContract => ActivityType == "contract";

// In ActivityRequest.cs (Application DTO - for create/update)
public DateTime? ContractDate { get; set; }
public decimal? ContractValue { get; set; }

// In ActivityResponse.cs (Application DTO - for API responses)
public DateTime? ContractDate { get; set; }
public decimal? ContractValue { get; set; }
public bool IsContract => ActivityType == "contract";
```

**References**:
- Domain entity: `crm-system/src/CRM.Domain/Entities/Activity.cs:42-51`
- Response DTO: `crm-system/src/CRM.Application/Dtos/Response/ActivityResponse.cs:41-45`

---

### Decision 10: Deployment Strategy

**Decision**: Coordinated single deployment across database, backend, and frontend

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Coordinated deployment | Deploy all layers together | ✅ Ensures consistency<br>✅ No interim broken state | ⚠️ Requires deployment coordination | ✅ **SELECTED** |
| B. Phased deployment | Deploy DB first, then backend, then frontend | ❌ Interim broken states<br>❌ DB ENUM change not backward compatible | None | ❌ Rejected |

**Rationale**: MySQL ENUM alteration is not backward compatible - once the database accepts 'contract' values, the backend must be able to handle them. The deployment must be coordinated:

1. **Backend + Database**: Deploy together (backend deploys new SQL schema script)
2. **Frontend**: Deploy immediately after (can be seconds later, existing activity types still work)

**Deployment Checklist**:
- [ ] Run database migration script (ALTER TABLE to add 'contract' to ENUM)
- [ ] Deploy backend API with updated Activity entity and ActivityResponse DTO
- [ ] Deploy frontend with updated constants and ActivityFeed component
- [ ] Verify contract activity creation in UI
- [ ] Verify contract activity filtering works
- [ ] Verify existing activity types still work correctly

**References**:
- Constraint C-002 in spec.md: "Database schema change requires coordinated deployment"

---

## Best Practices Reviewed

### MySQL ENUM Best Practices

**Key Findings**:
- ✅ ENUMs are performant and type-safe for known, stable value sets
- ✅ Adding values to end of ENUM is safe and backward compatible
- ⚠️ ENUM alteration requires table-level lock (brief downtime acceptable)
- ✅ Our use case (activity types) is ideal for ENUM - stable set of values

**Source**: MySQL Documentation - https://dev.mysql.com/doc/refman/8.0/en/enum.html

**Application**: Our implementation adds 'contract' to the end of the ENUM, which is the safest approach.

---

### React Component State Management

**Key Findings**:
- ✅ Constants-based approach is best practice for dropdown options
- ✅ Centralized constants enable consistency across components
- ✅ No Redux/state management needed for static constants

**Application**: Our use of `constants.js` follows React best practices for managing static dropdown values.

---

### Clean Architecture Computed Properties

**Key Findings**:
- ✅ Computed properties prevent duplication of type-checking logic
- ✅ `[NotMapped]` attribute ensures they're not persisted
- ✅ Pattern established in domain-driven design literature

**Source**: Clean Architecture (Robert C. Martin) - Domain entity guidelines

**Application**: Our `IsContract` computed property follows this established pattern.

---

## Risks and Mitigations

### Risk 1: Database Downtime During ENUM Alteration

**Risk Level**: LOW
**Impact**: Brief table lock during ALTER TABLE operation
**Mitigation**:
- Execute during maintenance window
- Test on staging environment first
- Monitor lock duration (typically <1 second for crm_activity table size)

---

### Risk 2: Frontend Caching Issues

**Risk Level**: LOW
**Impact**: Users might see old constants.js without 'contract' option
**Mitigation**:
- Cache-busting via Vite build process (automatic)
- Increment version in package.json to force refresh
- No manual intervention needed (Vite handles this)

---

### Risk 3: Existing Activity Components Not Recognizing Contract Type

**Risk Level**: VERY LOW
**Impact**: Some components might not display contract activities correctly
**Mitigation**:
- Most components reference `ACTIVITY_TYPES` constant (auto-updated)
- ActivityFeed.jsx explicitly handles each type (requires manual update - documented in tasks)
- Manual testing checklist to verify all activity views

---

## Open Questions

**None.** All design decisions are final and documented above.

---

## Summary

This feature extends the existing activity tracking system with contract-specific fields while following well-established patterns in the codebase:

1. **Database**: Add 'contract' to ActivityType ENUM + add 2 new nullable columns (`contract_date` DATE, `contract_value` DECIMAL(12,2))
2. **Backend**: Add `ContractDate` and `ContractValue` properties to Activity entity, ActivityRequest DTO, and ActivityResponse DTO + add `IsContract` computed property + add FluentValidation rules
3. **Frontend**: Add 'contract' to 2 constants, create `ContractFields` component, create `currencyHelper.js` utility, update ActivityFeed and ActivityForm components

**Total Implementation Effort**:
- Database: 1 migration file (3 ALTER TABLE statements)
- Backend: 7 files (entity, 2 DTOs, validator, repository, SQL queries, unit tests)
- Frontend: 5-6 files (constants, utility, 2 components, activity form, activity feed)

**Complexity**: Low-Medium - follows existing patterns with addition of currency formatting, validation, and aggregate queries. No new architectural patterns or external dependencies required.

**Key Technology Decisions**:
- Currency Formatting: `Intl.NumberFormat` (native API, no dependencies)
- Validation: FluentValidation conditional rules (existing pattern)
- Database Precision: DECIMAL(12,2) for exact currency calculations
- Form Pattern: Separate `ContractFields` component for clean separation
- Aggregation: SQL SUM queries via Dapper for performance

**Next Phase**: Proceed to Phase 1 (Data Model, Contracts, Quickstart)

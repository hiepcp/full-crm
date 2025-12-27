# Research: Contract Activity Fields Enhancement

**Feature**: 006-contract-activity-fields
**Date**: 2025-12-25
**Phase**: 0 - Outline & Research

## Research Summary

This document captures research findings and decisions for adding contract date and contract value fields to contract-type activities in the CRM system.

## Research Topics

### 1. Database Schema Design for Optional Fields

**Question**: How should we handle optional (nullable) contract_date and contract_value fields in MySQL?

**Decision**: Use nullable columns with appropriate data types

**Rationale**:
- **contract_date**: Use `DATE` or `DATETIME` NULL - allows storing dates without time components if only date is needed, or full datetime if time is relevant
- **contract_value**: Use `DECIMAL(18, 2)` NULL - provides precision for monetary values (up to 16 digits before decimal, 2 after)
- MySQL handles NULL values efficiently in indexes and queries
- Existing activities table likely already has nullable fields for extensibility

**Alternatives Considered**:
- **Using default values** (e.g., '1900-01-01' for dates, 0 for values): Rejected - NULL is more semantically correct for "not provided"
- **Using VARCHAR for values**: Rejected - DECIMAL provides proper numeric operations and validation at database level
- **Separate table for contract data**: Rejected - overkill for just 2 fields, increases query complexity

**Implementation Notes**:
```sql
ALTER TABLE activities
ADD COLUMN contract_date DATE NULL,
ADD COLUMN contract_value DECIMAL(18, 2) NULL;
```

---

### 2. Date Formatting and Localization (Frontend)

**Question**: How should we format contract dates for display and handle different locales?

**Decision**: Use existing date formatting utilities with locale support

**Rationale**:
- Project likely already uses a date library (date-fns or dayjs) for consistency
- Use `toLocaleDateString()` or library-specific formatting for user's locale
- Store ISO 8601 format in database and API (`YYYY-MM-DD`)
- Display format should follow user's locale preferences

**Alternatives Considered**:
- **Hardcoded date format**: Rejected - not internationalization-friendly
- **Moment.js**: Rejected if not already in use - it's deprecated and bundle-heavy
- **Custom date formatting**: Rejected - reinventing the wheel, error-prone

**Implementation Notes**:
- Frontend: Use Material-UI DatePicker component (already in dependencies)
- Format for API: `YYYY-MM-DD` (ISO 8601 date string)
- Display: Use existing project's date formatting helper (likely in `utils/dateHelper.js`)

---

### 3. Currency Formatting and Locale Support

**Question**: How should contract values be formatted and displayed across different locales?

**Decision**: Use `Intl.NumberFormat` for currency formatting with locale detection

**Rationale**:
- `Intl.NumberFormat` is native JavaScript, no extra dependencies
- Automatically handles thousands separators, decimal points, and currency symbols
- Respects user's browser locale settings
- Backend stores raw decimal value; frontend handles display formatting

**Alternatives Considered**:
- **Fixed currency format**: Rejected - assumes single currency/locale
- **Third-party library (accounting.js)**: Rejected - unnecessary dependency for this use case
- **Server-side formatting**: Rejected - formatting is a presentation concern

**Implementation Notes**:
```javascript
const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND', // or from system configuration
  minimumFractionDigits: 0, // for VND
  maximumFractionDigits: 2  // for USD/EUR
});
formatter.format(contractValue); // e.g., "₫1,000,000"
```

Currency code should come from:
1. User preferences (if available)
2. System-wide default configuration
3. Fallback to VND (Vietnamese Dong) based on `.vn` domain

---

### 4. Validation Rules for Contract Value

**Question**: What validation rules should apply to contract value beyond "non-negative"?

**Decision**: Validate non-negative, numeric, and reasonable upper limit

**Rationale**:
- **Non-negative**: Business rule from spec (FR-004)
- **Numeric with 2 decimal places**: Standard for monetary values
- **Maximum value**: Set reasonable upper limit (e.g., 999,999,999,999.99) to prevent overflow/display issues
- **Minimum positive value**: If value is provided and > 0, it should be >= 0.01 (smallest currency unit)

**Alternatives Considered**:
- **No maximum limit**: Rejected - could cause display/storage issues
- **Integer-only values**: Rejected - contracts may have fractional amounts
- **Required field**: Rejected - spec specifies optional

**Implementation Notes**:
FluentValidation (C#):
```csharp
RuleFor(x => x.ContractValue)
    .GreaterThanOrEqualTo(0).When(x => x.ContractValue.HasValue)
    .WithMessage("Contract value must be non-negative")
    .LessThan(1000000000000m).When(x => x.ContractValue.HasValue)
    .WithMessage("Contract value exceeds maximum allowed");
```

Frontend validation:
- Type: number input
- Min: 0
- Max: 999999999999.99
- Step: 0.01

---

### 5. Date Range Filtering Implementation

**Question**: How should date range filtering be implemented for contract activities?

**Decision**: Add optional query parameters for date range filtering

**Rationale**:
- REST convention: Use query parameters for filtering (e.g., `?contract_date_from=2024-01-01&contract_date_to=2024-12-31`)
- SQL supports efficient date range queries with indexes
- Maintains backward compatibility (parameters are optional)
- Consistent with existing filtering patterns in the project

**Alternatives Considered**:
- **POST with filter object**: Considered if filter becomes complex, but overkill for simple date range
- **Separate endpoint**: Rejected - violates REST principles, creates endpoint proliferation

**Implementation Notes**:
API Query Parameters:
- `contract_date_from`: ISO 8601 date string (inclusive)
- `contract_date_to`: ISO 8601 date string (inclusive)
- `contract_value_min`: decimal
- `contract_value_max`: decimal

SQL WHERE clause:
```sql
WHERE activity_type = 'contract'
  AND (@contractDateFrom IS NULL OR contract_date >= @contractDateFrom)
  AND (@contractDateTo IS NULL OR contract_date <= @contractDateTo)
  AND (@contractValueMin IS NULL OR contract_value >= @contractValueMin)
  AND (@contractValueMax IS NULL OR contract_value <= @contractValueMax)
```

---

### 6. Backward Compatibility Strategy

**Question**: How to ensure existing activities work seamlessly with new nullable fields?

**Decision**: NULL-safe handling at all layers with graceful degradation

**Rationale**:
- Existing activities will have NULL for both new fields after migration
- NULL is semantically correct for "not provided"
- UI should hide/show fields based on NULL state (not display "null" or empty strings)
- Filtering should work with NULL values (e.g., "show all activities" includes those with NULL contract dates)

**Alternatives Considered**:
- **Default values**: Rejected - NULL is clearer than magic numbers/dates
- **Separate activity type**: Rejected - overcomplicates data model

**Implementation Notes**:
- **Database**: Column defaults to NULL
- **Backend DTOs**: Use nullable types (`DateTime?`, `decimal?`)
- **Frontend**: Conditional rendering - only show contract fields section if activity type is "contract"
- **API responses**: Include fields even if NULL (don't omit) for consistent schema

---

### 7. UI/UX Patterns for Contract Fields

**Question**: How should contract fields be presented in the activity form?

**Decision**: Add contract-specific section that appears only for "contract" activity type

**Rationale**:
- Conditional display reduces UI clutter for non-contract activities
- Grouped section provides clear context (e.g., "Contract Details" card/section)
- Consistent with existing activity form patterns (type-specific fields)

**Alternatives Considered**:
- **Always show fields**: Rejected - confusing for non-contract activity types
- **Separate form**: Rejected - breaks existing UX flow
- **Modal dialog**: Rejected - adds unnecessary interaction steps

**Implementation Notes**:
```jsx
{activityType === 'contract' && (
  <ContractDetailsSection>
    <DatePicker label="Contract Date" value={contractDate} onChange={...} />
    <NumberInput label="Contract Value" value={contractValue} onChange={...} />
  </ContractDetailsSection>
)}
```

Placement: Below main activity fields, above attachments/notes section

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Database Schema | `contract_date DATE NULL`, `contract_value DECIMAL(18,2) NULL` | Semantic correctness, efficient storage |
| Date Formatting | ISO 8601 storage, locale-based display | Internationalization, consistency |
| Currency Formatting | `Intl.NumberFormat` with locale | Native JS, zero dependencies, i18n support |
| Value Validation | Non-negative, max 999,999,999,999.99 | Business rules + practical limits |
| Date Filtering | Query parameters (`contract_date_from/to`) | REST conventions, backward compatible |
| Backward Compatibility | NULL-safe handling, graceful degradation | Existing data unaffected |
| UI/UX Pattern | Conditional contract section | Type-appropriate, reduces clutter |

## Next Steps (Phase 1)

With research complete, proceed to:
1. **data-model.md**: Define Activity entity changes and database schema
2. **contracts/**: Specify API request/response contracts
3. **quickstart.md**: Developer setup and testing guide

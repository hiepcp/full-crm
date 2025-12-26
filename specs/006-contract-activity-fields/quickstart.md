# Developer Quickstart: Contract Activity Fields

**Feature**: 006-contract-activity-fields
**Branch**: `006-contract-activity-fields`
**Date**: 2025-12-25

## Overview

This guide helps developers set up, implement, and test the contract activity fields feature. Follow the steps in order.

---

## Prerequisites

- Node.js 18+ and npm (for frontend)
- .NET 8 SDK (for backend)
- MySQL database running locally or accessible remotely
- Git repository cloned and on branch `006-contract-activity-fields`

**Check Prerequisites**:
```bash
node --version  # Should be 18.x or higher
npm --version
dotnet --version  # Should be 8.0.x
git branch  # Should show * 006-contract-activity-fields
```

---

## Setup Steps

### 1. Database Migration

**Location**: Create migration file in `database/migrations/`

**Step 1**: Create migration SQL file
```bash
# From repository root
mkdir -p database/migrations
```

**Step 2**: Copy migration script (from `data-model.md`):
```sql
-- File: database/migrations/006_add_contract_fields_to_activities.sql

USE crm_database;  -- Replace with your actual database name

ALTER TABLE activities
ADD COLUMN contract_date DATE NULL
COMMENT 'Date when contract was signed or becomes effective';

ALTER TABLE activities
ADD COLUMN contract_value DECIMAL(18, 2) NULL
COMMENT 'Financial value of the contract';

-- Optional: Add indexes for filtering performance
CREATE INDEX idx_activities_contract_date
ON activities(contract_date)
WHERE contract_date IS NOT NULL;

CREATE INDEX idx_activities_contract_value
ON activities(contract_value)
WHERE contract_value IS NOT NULL;
```

**Step 3**: Run migration
```bash
# Connect to your MySQL database
mysql -u your_username -p crm_database < database/migrations/006_add_contract_fields_to_activities.sql
```

**Step 4**: Verify migration
```sql
-- Run in MySQL client
DESCRIBE activities;
-- Should show contract_date and contract_value columns

SHOW INDEX FROM activities;
-- Should show idx_activities_contract_date and idx_activities_contract_value
```

---

### 2. Backend Setup

#### 2.1 Update Domain Entity

**File**: `crm-system/src/CRM.Domain/Entities/Activity.cs`

Add properties:
```csharp
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
```

#### 2.2 Update Application DTOs

**File**: `crm-system/src/CRM.Application/Dtos/ActivityRequest.cs`
```csharp
public DateTime? ContractDate { get; set; }
public decimal? ContractValue { get; set; }
```

**File**: `crm-system/src/CRM.Application/Dtos/ActivityResponse.cs`
```csharp
public DateTime? ContractDate { get; set; }
public decimal? ContractValue { get; set; }
```

**File**: `crm-system/src/CRM.Application/Dtos/ActivityFilterRequest.cs`
```csharp
public DateTime? ContractDateFrom { get; set; }
public DateTime? ContractDateTo { get; set; }
public decimal? ContractValueMin { get; set; }
public decimal? ContractValueMax { get; set; }
```

#### 2.3 Update Validator

**File**: `crm-system/src/CRM.Application/Validators/ActivityValidator.cs`

Add validation rules:
```csharp
RuleFor(x => x.ContractValue)
    .GreaterThanOrEqualTo(0).When(x => x.ContractValue.HasValue)
    .WithMessage("Contract value cannot be negative")
    .LessThan(1000000000000m).When(x => x.ContractValue.HasValue)
    .WithMessage("Contract value exceeds maximum allowed");

RuleFor(x => x.ContractDate)
    .Must(BeAValidDate).When(x => x.ContractDate.HasValue)
    .WithMessage("Invalid date format for contract date");
```

#### 2.4 Update Repository

**File**: `crm-system/src/CRM.Infrastructure/Repositories/ActivityRepository.cs`

Update SQL queries to include new fields:
```csharp
// In GetByIdAsync:
SELECT id, name, type, description, due_date, status,
       customer_id, lead_id, deal_id,
       contract_date, contract_value,  -- NEW
       created_by, created_at, updated_by, updated_at
FROM activities
WHERE id = @Id

// In CreateAsync:
INSERT INTO activities (name, type, description, due_date, status,
                        customer_id, lead_id, deal_id,
                        contract_date, contract_value,  -- NEW
                        created_by, created_at)
VALUES (@Name, @Type, @Description, @DueDate, @Status,
        @CustomerId, @LeadId, @DealId,
        @ContractDate, @ContractValue,  -- NEW
        @CreatedBy, @CreatedAt)

// In UpdateAsync:
UPDATE activities
SET name = @Name,
    type = @Type,
    contract_date = @ContractDate,  -- NEW
    contract_value = @ContractValue,  -- NEW
    updated_by = @UpdatedBy,
    updated_at = @UpdatedAt
WHERE id = @Id

// In QueryAsync (add filtering):
WHERE (@ContractDateFrom IS NULL OR contract_date >= @ContractDateFrom)
  AND (@ContractDateTo IS NULL OR contract_date <= @ContractDateTo)
  AND (@ContractValueMin IS NULL OR contract_value >= @ContractValueMin)
  AND (@ContractValueMax IS NULL OR contract_value <= @ContractValueMax)
```

#### 2.5 Build and Test Backend

```bash
cd crm-system

# Restore dependencies
dotnet restore

# Build solution
dotnet build

# Run API (optional)
cd src/CRM.Api
dotnet run

# Test API is running
curl https://api-crm.local.com/health  # or appropriate endpoint
```

---

### 3. Frontend Setup

#### 3.1 Update API Client

**File**: `crm-system-client/src/infrastructure/api/activitiesApi.js`

Update API client methods:
```javascript
export const createActivity = async (activityData) => {
  const response = await axiosInstance.post('/api/activities', {
    name: activityData.name,
    type: activityData.type,
    description: activityData.description,
    dueDate: activityData.dueDate,
    status: activityData.status,
    customerId: activityData.customerId,
    leadId: activityData.leadId,
    dealId: activityData.dealId,
    // NEW FIELDS
    contractDate: activityData.contractDate || null,
    contractValue: activityData.contractValue || null
  });
  return response.data;
};

export const updateActivity = async (id, activityData) => {
  // Similar to createActivity
};

export const filterActivities = async (filters) => {
  const response = await axiosInstance.post('/api/activities/query', {
    ...filters,
    // NEW FILTERS
    contractDateFrom: filters.contractDateFrom || null,
    contractDateTo: filters.contractDateTo || null,
    contractValueMin: filters.contractValueMin || null,
    contractValueMax: filters.contractValueMax || null
  });
  return response.data;
};
```

#### 3.2 Update Activity Form Component

**File**: `crm-system-client/src/presentation/pages/activity/ActivityForm.jsx` (or similar)

Add form fields (pseudo-code, adjust to your actual component structure):
```jsx
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField } from '@mui/material';

function ActivityForm({ activity, onSave }) {
  const [formData, setFormData] = useState({
    ...activity,
    contractDate: activity.contractDate || null,
    contractValue: activity.contractValue || null
  });

  return (
    <form>
      {/* Existing fields: name, type, description, etc. */}

      {/* NEW: Contract-specific section */}
      {formData.type === 'contract' && (
        <Box mt={2}>
          <Typography variant="h6">Contract Details</Typography>

          <DatePicker
            label="Contract Date"
            value={formData.contractDate}
            onChange={(newValue) => setFormData({ ...formData, contractDate: newValue })}
            slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
          />

          <TextField
            label="Contract Value"
            type="number"
            value={formData.contractValue || ''}
            onChange={(e) => setFormData({ ...formData, contractValue: parseFloat(e.target.value) || null })}
            inputProps={{ min: 0, step: 0.01 }}
            fullWidth
            margin="normal"
          />
        </Box>
      )}

      <Button onClick={() => onSave(formData)}>Save</Button>
    </form>
  );
}
```

#### 3.3 Update Activity Display Component

**File**: `crm-system-client/src/presentation/components/activity/ActivityDetails.jsx` (or similar)

Add display logic:
```jsx
function ActivityDetails({ activity }) {
  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <Box>
      {/* Existing activity details */}

      {activity.type === 'contract' && (
        <Box mt={2}>
          <Typography variant="h6">Contract Information</Typography>
          <Typography>Contract Date: {formatDate(activity.contractDate)}</Typography>
          <Typography>Contract Value: {formatCurrency(activity.contractValue)}</Typography>
        </Box>
      )}
    </Box>
  );
}
```

#### 3.4 Install Dependencies and Build

```bash
cd crm-system-client

# Install dependencies (if any new packages needed, e.g., date-fns)
npm install

# Run linting
npm run lint

# Build for development
npm run dev

# Or build for production
npm run build
```

---

## Testing

### Manual Testing Checklist

#### Backend API Testing (Postman/curl)

1. **Create contract activity with contract fields**:
   ```bash
   curl -X POST https://api-crm.local.com/api/activities \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{
       "name": "Test Contract",
       "type": "contract",
       "description": "Testing contract fields",
       "status": "active",
       "contractDate": "2025-02-01",
       "contractValue": 100000.50
     }'
   ```

2. **Verify fields in response** (should include `contractDate` and `contractValue`)

3. **Get activity by ID**:
   ```bash
   curl -X GET https://api-crm.local.com/api/activities/123 \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-API-Key: YOUR_API_KEY"
   ```

4. **Update contract fields**:
   ```bash
   curl -X PUT https://api-crm.local.com/api/activities/123 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{
       "contractDate": "2025-03-01",
       "contractValue": 150000.00
     }'
   ```

5. **Filter by contract date range**:
   ```bash
   curl -X POST https://api-crm.local.com/api/activities/query \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{
       "type": "contract",
       "contractDateFrom": "2025-01-01",
       "contractDateTo": "2025-12-31"
     }'
   ```

6. **Validation tests**:
   - Try negative contract value (should fail with 400)
   - Try invalid date format (should fail with 400)

#### Frontend Testing

1. **Open activity creation form**
2. **Select type = "contract"** → Contract Details section should appear
3. **Fill in contract date and value**
4. **Save activity** → Verify API call includes new fields
5. **View activity details** → Verify contract date and value display correctly
6. **Edit activity** → Change contract fields → Verify update works
7. **Change type to non-contract** → Contract fields should be hidden (but preserved in database)
8. **Filter activities** → Test date range and value range filters

### Automated Testing (Optional)

#### Backend Unit Tests

**File**: `crm-system/tests/CRMApi.UnitTests/Validators/ActivityValidatorTests.cs`

```csharp
[Fact]
public void ContractValue_WhenNegative_ShouldHaveValidationError()
{
    var request = new ActivityRequest { ContractValue = -100 };
    var validator = new ActivityValidator();
    var result = validator.Validate(request);
    Assert.False(result.IsValid);
    Assert.Contains(result.Errors, e => e.PropertyName == "ContractValue");
}

[Fact]
public void ContractValue_WhenNonNegative_ShouldBeValid()
{
    var request = new ActivityRequest { ContractValue = 1000.50m };
    var validator = new ActivityValidator();
    var result = validator.Validate(request);
    Assert.True(result.IsValid);
}
```

Run tests:
```bash
cd crm-system/tests/CRMApi.UnitTests
dotnet test
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Migration fails: "Table 'activities' doesn't exist" | Check database name and ensure activities table exists |
| API returns 400: "Unknown column 'contract_date'" | Migration not run or database connection pointing to wrong DB |
| Frontend shows "Cannot read property 'contractDate'" | API response might not include fields; check backend DTOs |
| Currency not formatting correctly | Check `Intl.NumberFormat` locale and currency code |
| Date picker not working | Ensure `@mui/x-date-pickers` is installed and configured |

### Rollback

If you need to rollback the database changes:
```sql
DROP INDEX IF EXISTS idx_activities_contract_value ON activities;
DROP INDEX IF EXISTS idx_activities_contract_date ON activities;

ALTER TABLE activities DROP COLUMN contract_value;
ALTER TABLE activities DROP COLUMN contract_date;
```

---

## Next Steps

After successful setup and testing:

1. **Code Review**: Submit PR for review
2. **Integration Testing**: Test with full CRM workflow
3. **User Acceptance Testing**: Have users test the feature
4. **Documentation**: Update user documentation with contract field usage
5. **Deployment**: Deploy to staging → UAT → production

---

## Resources

- **Specification**: `specs/006-contract-activity-fields/spec.md`
- **Research**: `specs/006-contract-activity-fields/research.md`
- **Data Model**: `specs/006-contract-activity-fields/data-model.md`
- **API Contracts**: `specs/006-contract-activity-fields/contracts/api-contracts.md`
- **CLAUDE.md**: Project-wide development guide

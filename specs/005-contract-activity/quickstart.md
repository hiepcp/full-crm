# Developer Quickstart: Add Contract Activity Type

**Feature**: 005-contract-activity
**Estimated Time**: 30 minutes
**Complexity**: Low

## Prerequisites

- [ ] Access to CRM development environment
- [ ] MySQL client (for database changes)
- [ ] .NET 8 SDK installed
- [ ] Node.js 18+ and npm installed
- [ ] Git branch `005-contract-activity` checked out

## Quick Overview

This feature adds "contract" as a new activity type across the full stack:

**What's changing**:
- Database: 1 ENUM value addition
- Backend: 2 computed properties added
- Frontend: 3 constant/component updates

**What's NOT changing**:
- No new tables or endpoints
- No new API routes
- No breaking changes to existing functionality

---

## Step-by-Step Implementation

### Step 1: Database Schema Update (5 minutes)

#### 1.1 Update reset_database.sql

**File**: `crm-system/src/CRM.Infrastructure/Sqls/reset_database.sql`

**Find this line** (around line 449):
```sql
ActivityType ENUM('email','call','meeting','task','note') NOT NULL DEFAULT 'note',
```

**Replace with**:
```sql
ActivityType ENUM('email','call','meeting','task','note','contract') NOT NULL DEFAULT 'note',
```

#### 1.2 Apply Migration (If Database Exists)

If you have an existing `crm_activity` table, run this migration:

```sql
USE your_crm_database;

ALTER TABLE crm_activity
MODIFY COLUMN ActivityType ENUM('email','call','meeting','task','note','contract') NOT NULL DEFAULT 'note';
```

**Verify**:
```sql
SHOW COLUMNS FROM crm_activity LIKE 'ActivityType';
-- Should show: enum('email','call','meeting','task','note','contract')
```

---

### Step 2: Backend Domain Layer (5 minutes)

#### 2.1 Update Activity Entity

**File**: `crm-system/src/CRM.Domain/Entities/Activity.cs`

**Find** the computed properties section (around line 42-51):
```csharp
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
```

**Add after `IsNote`**:
```csharp
[NotMapped]
public bool IsContract => ActivityType == "contract";
```

**Also update the comment** on line 24:
```csharp
// OLD: public string ActivityType { get; set; } = "note"; // ENUM: email, call, meeting, task, note, reminder, other
// NEW: public string ActivityType { get; set; } = "note"; // ENUM: email, call, meeting, task, note, contract
```

---

### Step 3: Backend Application Layer (5 minutes)

#### 3.1 Update ActivityResponse DTO

**File**: `crm-system/src/CRM.Application/Dtos/Response/ActivityResponse.cs`

**Find** the computed properties section (around line 41-45):
```csharp
public bool IsEmail => ActivityType == "email";
public bool IsCall => ActivityType == "call";
public bool IsMeeting => ActivityType == "meeting";
public bool IsTask => ActivityType == "task";
public bool IsNote => ActivityType == "note";
```

**Add after `IsNote`**:
```csharp
public bool IsContract => ActivityType == "contract";
```

---

### Step 4: Frontend Constants (5 minutes)

#### 4.1 Update Activity Types Constant

**File**: `crm-system-client/src/utils/constants.js`

**Find** the `ACTIVITY_TYPES` array (around line 90-97):
```javascript
export const ACTIVITY_TYPES = [
  { value: 'email', label: '📧 Email' },
  { value: 'meeting-online', label: '📹 Online Appointment' },
  { value: 'meeting-offline', label: '📅 Offline Appointment' },
  { value: 'call', label: '📞 Call' },
  { value: 'note', label: '📝 Note' }
];
```

**Add** the contract type:
```javascript
export const ACTIVITY_TYPES = [
  { value: 'email', label: '📧 Email' },
  { value: 'meeting-online', label: '📹 Online Appointment' },
  { value: 'meeting-offline', label: '📅 Offline Appointment' },
  { value: 'call', label: '📞 Call' },
  { value: 'note', label: '📝 Note' },
  { value: 'contract', label: '📄 Contract' }  // NEW
];
```

#### 4.2 Update Activity Categories Constant

**Find** the `ACTIVITY_CATEGORIES` object (around line 103-110):
```javascript
export const ACTIVITY_CATEGORIES = {
  EMAIL: 'email',
  CALL: 'call',
  MEETING: 'meeting',
  NOTE: 'note'
};
```

**Add** the contract category:
```javascript
export const ACTIVITY_CATEGORIES = {
  EMAIL: 'email',
  CALL: 'call',
  MEETING: 'meeting',
  NOTE: 'note',
  CONTRACT: 'contract'  // NEW
};
```

---

### Step 5: Frontend Component Logic (10 minutes)

#### 5.1 Update ActivityFeed Categorization

**File**: `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityFeed.jsx`

**Find** the `categoryType` logic (around line 198-207):
```javascript
const categoryType = (() => {
  const src = (activity?.sourceFrom || '').toLowerCase();
  const typ = (activity?.type || '').toLowerCase();
  if (src.includes('email') || typ === 'email') return ACTIVITY_CATEGORIES.EMAIL;
  if (src.includes('phone-call') || typ === 'call') return ACTIVITY_CATEGORIES.CALL;
  if (src.includes('meeting') || typ === 'meeting' || typ === 'meeting-online' || typ === 'meeting-offline') return ACTIVITY_CATEGORIES.MEETING;
  if (src.includes('task') || typ === 'task') return ACTIVITY_CATEGORIES.TASK;
  if (src.includes('note') || typ === 'note') return ACTIVITY_CATEGORIES.NOTE;
  return ACTIVITY_CATEGORIES.EMAIL;
})();
```

**Add** the contract case before the final return:
```javascript
const categoryType = (() => {
  const src = (activity?.sourceFrom || '').toLowerCase();
  const typ = (activity?.type || '').toLowerCase();
  if (src.includes('email') || typ === 'email') return ACTIVITY_CATEGORIES.EMAIL;
  if (src.includes('phone-call') || typ === 'call') return ACTIVITY_CATEGORIES.CALL;
  if (src.includes('meeting') || typ === 'meeting' || typ === 'meeting-online' || typ === 'meeting-offline') return ACTIVITY_CATEGORIES.MEETING;
  if (src.includes('task') || typ === 'task') return ACTIVITY_CATEGORIES.TASK;
  if (src.includes('note') || typ === 'note') return ACTIVITY_CATEGORIES.NOTE;
  if (src.includes('contract') || typ === 'contract') return ACTIVITY_CATEGORIES.CONTRACT;  // NEW
  return ACTIVITY_CATEGORIES.EMAIL;
})();
```

#### 5.2 Add Contract Icon Configuration

**Find** the `iconConfig` switch statement (around line 209-220):
```javascript
const iconConfig = (() => {
  switch (categoryType) {
    case ACTIVITY_CATEGORIES.EMAIL:
      return { icon: <EmailIcon fontSize="small" />, bg: theme.palette.success.lighter, color: theme.palette.success.main };
    case ACTIVITY_CATEGORIES.CALL:
      return { icon: <PhoneIcon fontSize="small" />, bg: theme.palette.warning.lighter, color: theme.palette.warning.main };
    case ACTIVITY_CATEGORIES.MEETING:
      return { icon: <EventIcon fontSize="small" />, bg: theme.palette.info.lighter, color: theme.palette.info.main };
    case ACTIVITY_CATEGORIES.TASK:
      return { icon: <AssignmentIcon fontSize="small" />, bg: theme.palette.primary.lighter, color: theme.palette.primary.main };
    case ACTIVITY_CATEGORIES.NOTE:
      return { icon: <NoteIcon fontSize="small" />, bg: theme.palette.grey[200], color: theme.palette.grey[700] };
    default:
      return { icon: <EmailIcon fontSize="small" />, bg: theme.palette.success.lighter, color: theme.palette.success.main };
  }
})();
```

**Add** the contract case before default:
```javascript
const iconConfig = (() => {
  switch (categoryType) {
    case ACTIVITY_CATEGORIES.EMAIL:
      return { icon: <EmailIcon fontSize="small" />, bg: theme.palette.success.lighter, color: theme.palette.success.main };
    case ACTIVITY_CATEGORIES.CALL:
      return { icon: <PhoneIcon fontSize="small" />, bg: theme.palette.warning.lighter, color: theme.palette.warning.main };
    case ACTIVITY_CATEGORIES.MEETING:
      return { icon: <EventIcon fontSize="small" />, bg: theme.palette.info.lighter, color: theme.palette.info.main };
    case ACTIVITY_CATEGORIES.TASK:
      return { icon: <AssignmentIcon fontSize="small" />, bg: theme.palette.primary.lighter, color: theme.palette.primary.main };
    case ACTIVITY_CATEGORIES.NOTE:
      return { icon: <NoteIcon fontSize="small" />, bg: theme.palette.grey[200], color: theme.palette.grey[700] };
    case ACTIVITY_CATEGORIES.CONTRACT:  // NEW
      return { icon: <DescriptionIcon fontSize="small" />, bg: theme.palette.secondary.lighter, color: theme.palette.secondary.main };
    default:
      return { icon: <EmailIcon fontSize="small" />, bg: theme.palette.success.lighter, color: theme.palette.success.main };
  }
})();
```

#### 5.3 Add Icon Import

**At the top of ActivityFeed.jsx**, find the Material-UI icon imports and add:
```javascript
import DescriptionIcon from '@mui/icons-material/Description';  // NEW - for contract icon
```

---

## Build and Test

### Backend Build (2 minutes)

```bash
cd crm-system

# Restore dependencies
dotnet restore

# Build solution
dotnet build

# Expected output: Build succeeded. 0 Warning(s). 0 Error(s).
```

### Frontend Build (2 minutes)

```bash
cd crm-system-client

# Install dependencies (if needed)
npm install

# Run linter
npm run lint

# Build for development
npm run build

# Expected output: vite build successful
```

### Run Development Servers

**Terminal 1 - Backend**:
```bash
cd crm-system/src/CRM.Api
dotnet run
# Backend should run on https://api-crm.local.com
```

**Terminal 2 - Frontend**:
```bash
cd crm-system-client
npm run dev
# Frontend should run on https://crm.local.com:3000
```

---

## Manual Testing Checklist

### Test Case 1: Create Contract Activity

- [ ] Navigate to any customer/lead/deal detail page
- [ ] Click "Add Activity" button
- [ ] Select activity type dropdown
- [ ] **Verify**: "📄 Contract" appears in the list
- [ ] Select "📄 Contract"
- [ ] Fill in subject: "Contract Signing"
- [ ] Fill in body: "Annual contract signed"
- [ ] Click Save
- [ ] **Verify**: Activity is created successfully
- [ ] **Verify**: Activity appears in activity feed with document icon (📄) and purple/secondary color

### Test Case 2: Filter Contract Activities

- [ ] Navigate to a page with activity list/feed
- [ ] Create 2-3 contract activities
- [ ] Create 1-2 activities of other types (email, call)
- [ ] Apply "Contract" filter (if filtering UI exists)
- [ ] **Verify**: Only contract activities are displayed
- [ ] Clear filter
- [ ] **Verify**: All activities reappear

### Test Case 3: View Contract Activity Details

- [ ] Click on a contract activity in the feed
- [ ] **Verify**: Activity details display correctly
- [ ] **Verify**: Activity type shows as "📄 Contract"
- [ ] **Verify**: All fields (subject, body, dates, status, priority) are editable

### Test Case 4: Edit Contract Activity

- [ ] Open an existing contract activity
- [ ] Change subject or body
- [ ] Click Save
- [ ] **Verify**: Changes are persisted
- [ ] Refresh page
- [ ] **Verify**: Changes still appear

### Test Case 5: Backend API Response

- [ ] Open browser DevTools → Network tab
- [ ] Load activity feed
- [ ] Find the API request to `/activities` endpoint
- [ ] **Verify**: Response includes `"activityType": "contract"`
- [ ] **Verify**: Response includes `"isContract": true`
- [ ] **Verify**: Other `is*` properties are false (isEmail, isCall, etc.)

### Test Case 6: Existing Activity Types Still Work

- [ ] Create an email activity
- [ ] **Verify**: Displays with green email icon (📧)
- [ ] Create a call activity
- [ ] **Verify**: Displays with orange phone icon (📞)
- [ ] Create a meeting activity
- [ ] **Verify**: Displays with blue calendar icon (📅)
- [ ] **Verify**: No regression in existing functionality

---

## Troubleshooting

### Issue: "Data truncated for column 'ActivityType'"

**Cause**: Database ENUM not updated
**Fix**: Run the ALTER TABLE migration from Step 1.2

### Issue: Contract option not appearing in dropdown

**Cause**: Frontend constants not updated or cached
**Fix**:
1. Verify `ACTIVITY_TYPES` constant updated in constants.js
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache

### Issue: Contract activities show with wrong icon

**Cause**: ActivityFeed.jsx not updated or DescriptionIcon not imported
**Fix**:
1. Verify `iconConfig` switch statement includes CONTRACT case
2. Verify `import DescriptionIcon from '@mui/icons-material/Description';` at top of file
3. Rebuild frontend: `npm run build`

### Issue: Backend build error - "ActivityType does not contain a definition for 'contract'"

**Cause**: C# code referencing ActivityType as typed enum (shouldn't happen as it's a string property)
**Fix**: This shouldn't occur. If it does, check for code explicitly validating enum values and ensure 'contract' is included.

---

## Rollback Procedure

If you need to rollback this feature:

1. **Database**:
   ```sql
   -- WARNING: Only run if NO contract activities exist
   ALTER TABLE crm_activity
   MODIFY COLUMN ActivityType ENUM('email','call','meeting','task','note') NOT NULL DEFAULT 'note';
   ```

2. **Backend**: Revert commits in `crm-system/` repository
   ```bash
   git checkout HEAD~1 -- src/CRM.Domain/Entities/Activity.cs
   git checkout HEAD~1 -- src/CRM.Application/Dtos/Response/ActivityResponse.cs
   git checkout HEAD~1 -- src/CRM.Infrastructure/Sqls/reset_database.sql
   ```

3. **Frontend**: Revert commits in `crm-system-client/` repository
   ```bash
   git checkout HEAD~1 -- src/utils/constants.js
   git checkout HEAD~1 -- src/presentation/components/common/ActivityFeed/ActivityFeed.jsx
   ```

---

## Performance Validation

After deployment, monitor these metrics:

- [ ] Activity creation time: Should remain <2 seconds
- [ ] Activity list load time: Should remain <2 seconds
- [ ] Database query performance: Check slow query log for activity queries
- [ ] Frontend bundle size: Should not increase significantly (icon is already in bundle)

**Expected Performance Impact**: Negligible (no measurable change)

---

## Deployment Checklist

### Pre-Deployment

- [ ] All code changes committed to `005-contract-activity` branch
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Manual testing completed (all 6 test cases pass)
- [ ] Pull request created and reviewed

### Deployment Order

1. [ ] **Database Migration**: Run ALTER TABLE during maintenance window
2. [ ] **Backend Deployment**: Deploy updated CRM API
3. [ ] **Frontend Deployment**: Deploy updated React SPA
4. [ ] **Post-Deployment Verification**: Create test contract activity in production

### Post-Deployment

- [ ] Verify contract activities can be created
- [ ] Verify contract activities display correctly
- [ ] Verify existing activity types still work
- [ ] Monitor error logs for 24 hours
- [ ] User acceptance testing

---

## Next Steps

After implementing this feature:

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Create pull request with changes
3. Schedule deployment during maintenance window
4. Update user documentation (if applicable)
5. Notify users of new contract activity tracking capability

---

## Support

**Questions?** Check these resources:
- [Feature Specification](spec.md)
- [Implementation Plan](plan.md)
- [Data Model Documentation](data-model.md)
- [Research & Design Decisions](research.md)

**Need Help?** Contact the development team or check the CRM development guide in `CLAUDE.md`.

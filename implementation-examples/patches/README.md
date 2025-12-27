# Contract Activity Fields - Frontend Implementation Patches

**Feature**: 006-contract-activity-fields
**Date**: 2025-12-26
**Phase**: Frontend Implementation (Phase 3 - User Story 1)

## Overview

This directory contains patch files for implementing contract date and contract value fields in the frontend React application. These patches add the UI components needed to:

1. Input contract date and value when creating/editing contract activities
2. Display contract information in activity detail views

## Prerequisites

- Backend changes complete (T001-T013) ✓
- Database migration applied ✓
- Working in the correct branch: `006-contract-activity-fields`

## Patch Files

### 001-add-contract-fields-to-ActivityCategoryFields.patch

**File**: `crm-system-client/src/presentation/components/common/ActivityForms/components/ActivityCategoryFields.jsx`

**Changes**:
- Adds contract-specific form fields section
- Includes Contract Date field (date picker)
- Includes Contract Value field (number input with validation)
- Fields appear when activity category is 'contract'

**Lines affected**: After line 238 (before Email fields section)

### 002-add-contract-display-to-ActivityDetail.patch

**File**: `crm-system-client/src/presentation/pages/activity/ActivityDetail.jsx`

**Changes**:
- Adds contract-specific display section
- Shows Contract Date with formatted date
- Shows Contract Value with currency formatting (VND)
- Section appears when activity category is CONTRACT

**Lines affected**: After line 591 (before Default/Note/Task section)

## How to Apply Patches

### Method 1: Using Git Apply (Recommended)

Navigate to the repository root (where .git directory is located):

```bash
cd "E:/project/full crm"

# Apply the patches
git apply "E:/project/005-contract-activity/implementation-examples/patches/001-add-contract-fields-to-ActivityCategoryFields.patch"
git apply "E:/project/005-contract-activity/implementation-examples/patches/002-add-contract-display-to-ActivityDetail.patch"

# Verify the changes
git diff
```

### Method 2: Manual Application

If git apply doesn't work, manually edit the files:

#### For ActivityCategoryFields.jsx:

1. Open: `E:/project/full crm/crm-system-client/src/presentation/components/common/ActivityForms/components/ActivityCategoryFields.jsx`
2. Find line 239 (just after the meeting section closes with `}`)
3. Add the contract fields section (see patch file for exact code)
4. Save the file

#### For ActivityDetail.jsx:

1. Open: `E:/project/full crm/crm-system-client/src/presentation/pages/activity/ActivityDetail.jsx`
2. Find line 592 (just after the meeting section closes with `}`)
3. Add the contract display section (see patch file for exact code)
4. Save the file

### Method 3: Using PowerShell

```powershell
# Navigate to repository root
cd "E:/project/full crm"

# Apply patches using git
git apply --check "E:/project/005-contract-activity/implementation-examples/patches/001-add-contract-fields-to-ActivityCategoryFields.patch"
git apply "E:/project/005-contract-activity/implementation-examples/patches/001-add-contract-fields-to-ActivityCategoryFields.patch"

git apply --check "E:/project/005-contract-activity/implementation-examples/patches/002-add-contract-display-to-ActivityDetail.patch"
git apply "E:/project/005-contract-activity/implementation-examples/patches/002-add-contract-display-to-ActivityDetail.patch"
```

## Verification After Applying Patches

### 1. Check for Syntax Errors

```bash
cd "E:/project/full crm/crm-system-client"

# Run linter
npm run lint

# Fix any auto-fixable issues
npm run lint:fix
```

### 2. Build the Application

```bash
# Development build
npm run dev

# Or production build
npm run build
```

### 3. Visual Inspection

- Open the ActivityCategoryFields.jsx file
- Verify the contract section is properly indented
- Check that all JSX tags are properly closed
- Ensure the code follows the same pattern as meeting/email sections

## Testing the Changes

### Manual Testing Steps

1. **Start the application**:
   ```bash
   cd "E:/project/full crm/crm-system-client"
   npm run dev
   ```

2. **Create a Contract Activity**:
   - Navigate to Activities
   - Click "Add Activity"
   - Select Type: "📄 Contract"
   - Verify Contract Information section appears
   - Fill in Contract Date (e.g., 2025-02-01)
   - Fill in Contract Value (e.g., 50000.00)
   - Verify validation works (try negative value - should reject)
   - Save the activity

3. **View the Activity**:
   - Open the created contract activity
   - Verify Contract Date displays correctly
   - Verify Contract Value displays with currency formatting
   - Example: ₫50,000 or similar

4. **Edit the Activity**:
   - Click Edit
   - Modify contract date and value
   - Save
   - Verify changes persist

### Expected Results

✅ Contract fields only appear when activity type is "Contract"
✅ Contract Date accepts valid dates
✅ Contract Value only accepts non-negative numbers
✅ Contract Value validates min (0) and max (999,999,999,999.99)
✅ Saved values display correctly with proper formatting
✅ Fields are optional (can be left empty)

## Troubleshooting

### Patch Fails to Apply

**Error**: "patch does not apply"

**Solution**: The file may have been modified. Apply manually using Method 2.

### Linting Errors

**Error**: "Unexpected token" or syntax errors

**Solution**:
- Check that all JSX tags are properly closed
- Verify proper indentation (2 spaces)
- Ensure you didn't accidentally delete closing braces

### Fields Not Showing

**Issue**: Contract fields don't appear when selecting Contract type

**Check**:
1. Verify `formData.activityCategory === 'contract'` (lowercase)
2. Check that ACTIVITY_TYPES includes contract
3. Inspect browser console for errors

### Currency Not Formatting

**Issue**: Contract value shows as plain number

**Check**:
1. Verify Intl.NumberFormat is supported in browser
2. Check that `activity.contractValue` is a number, not a string
3. Try different locale if VND doesn't work ('en-US', 'USD')

## Next Steps After Applying Patches

1. **Mark tasks complete** in `specs/006-contract-activity-fields/tasks.md`:
   - [X] T015: Update activitiesApi.createActivity
   - [X] T016: Update activitiesApi.updateActivity
   - [X] T017: Add DatePicker component for contract date
   - [X] T018: Add contract date display in details
   - [X] T019: Run frontend lint check

2. **Continue with Phase 4** (User Story 2 - Contract Value):
   - Backend validation for contract value
   - Additional frontend enhancements

3. **Test end-to-end** integration with backend

## Files Modified

- `crm-system-client/src/presentation/components/common/ActivityForms/components/ActivityCategoryFields.jsx`
- `crm-system-client/src/presentation/pages/activity/ActivityDetail.jsx`

## Related Documentation

- **Specification**: `specs/006-contract-activity-fields/spec.md`
- **Implementation Plan**: `specs/006-contract-activity-fields/plan.md`
- **API Contracts**: `specs/006-contract-activity-fields/contracts/api-contracts.md`
- **Quickstart Guide**: `specs/006-contract-activity-fields/quickstart.md`
- **Tasks Breakdown**: `specs/006-contract-activity-fields/tasks.md`

## Support

If you encounter issues applying these patches:

1. Check git status: `git status`
2. Review file differences: `git diff`
3. Verify you're on the correct branch: `git branch`
4. Check for file conflicts or modifications

## Notes

- These patches are based on the codebase state as of 2025-12-26
- If files have been modified since, manual application may be required
- The activitiesApi.js file doesn't need changes - it already passes data through
- Contract fields are automatically included when the activity data object is sent to the API

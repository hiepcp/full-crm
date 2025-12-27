# Contract Activity Fields - Implementation Guide

**Feature**: 006-contract-activity-fields
**Phase**: Frontend Implementation (Phase 3 - User Story 1)
**Date**: 2025-12-26

## Quick Start

This guide provides step-by-step instructions to add contract date and contract value fields to the CRM frontend.

## Files to Modify

1. `ActivityCategoryFields.jsx` - Add input fields for contract date and value
2. `ActivityDetail.jsx` - Add display sections for contract information

## Implementation Steps

### Step 1: Update ActivityCategoryFields.jsx

**File Location**: `E:/project/full crm/crm-system-client/src/presentation/components/common/ActivityForms/components/ActivityCategoryFields.jsx`

**What to do**:
1. Open the file in your text editor
2. Find line 239 (it should be a closing brace `}` after the meeting section)
3. Add a blank line
4. Insert the code from `contract-fields-snippet.jsx` (contents below)
5. Save the file

**Insert this code after line 239**:

```jsx
  // Contract fields
  if (formData.activityCategory === 'contract') {
    return (
      <Box>
        {/* Contract Details Section */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
            <EventIcon sx={{ mr: 0.5, fontSize: 18, color: theme.palette.primary.main }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Contract Information
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="date"
                label="Contract Date"
                value={formData.contractDate || ''}
                disabled={disabled}
                onChange={(e) => updateFormData({ contractDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                variant="outlined"
                helperText="Date when contract was signed or becomes effective"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="number"
                label="Contract Value"
                value={formData.contractValue || ''}
                disabled={disabled}
                onChange={(e) => {
                  const value = e.target.value;
                  // Validate non-negative
                  if (value === '' || parseFloat(value) >= 0) {
                    updateFormData({ contractValue: value });
                  }
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: 0,
                  step: 0.01,
                  max: 999999999999.99
                }}
                fullWidth
                size="small"
                variant="outlined"
                helperText="Financial value of the contract (optional)"
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  }

```

**Before** (line 239-242):
```jsx
  }

  // Email fields
  if (formData.activityCategory === 'email') {
```

**After** (should look like):
```jsx
  }

  // Contract fields
  if (formData.activityCategory === 'contract') {
    return (
      <Box>
        ... (contract fields code)
      </Box>
    );
  }

  // Email fields
  if (formData.activityCategory === 'email') {
```

---

### Step 2: Update ActivityDetail.jsx

**File Location**: `E:/project/full crm/crm-system-client/src/presentation/pages/activity/ActivityDetail.jsx`

**What to do**:
1. Open the file in your text editor
2. Find line 592 (should be closing brace `}` after the meeting-specific section)
3. Add a blank line
4. Insert the code from `contract-display-snippet.jsx` (contents below)
5. Save the file

**Insert this code after line 592**:

```jsx
                  // Contract specific fields
                  if (category === ACTIVITY_CATEGORIES.CONTRACT) {
                    return (
                      <>
                        {activity.contractDate && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">CONTRACT DATE</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {formatDate(activity.contractDate)}
                            </Typography>
                          </Grid>
                        )}
                        {activity.contractValue && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">CONTRACT VALUE</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                              }).format(activity.contractValue)}
                            </Typography>
                          </Grid>
                        )}
                      </>
                    );
                  }

```

**Before** (line 592-595):
```jsx
                  }

                  // Default/Note/Task specific fields
                  return (
```

**After** (should look like):
```jsx
                  }

                  // Contract specific fields
                  if (category === ACTIVITY_CATEGORIES.CONTRACT) {
                    return (
                      <>
                        ... (contract display code)
                      </>
                    );
                  }

                  // Default/Note/Task specific fields
                  return (
```

---

## Step 3: Verify and Test

### Check for Errors

```bash
cd "E:/project/full crm/crm-system-client"

# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Build the Application

```bash
# Development mode
npm run dev

# Or production build to check for errors
npm run build
```

### Manual Testing

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Activities** in the CRM application

3. **Create a Contract Activity**:
   - Click "Add Activity" or "New Activity"
   - Select Activity Type: "📄 Contract"
   - ✅ Verify "Contract Information" section appears below the main fields
   - Fill in Contract Date (e.g., 2025-02-15)
   - Fill in Contract Value (e.g., 100000)
   - Click Save

4. **View the Activity**:
   - Find the contract activity you just created
   - Click to open details
   - ✅ Verify CONTRACT DATE section displays the date
   - ✅ Verify CONTRACT VALUE section shows the amount formatted as currency
   - Example: "₫100,000" or "100,000 VND"

5. **Edit the Activity**:
   - Click Edit button
   - Modify the contract date and value
   - Save changes
   - ✅ Verify changes are saved and displayed correctly

6. **Test Validation**:
   - Try entering a negative contract value
   - ✅ Verify it's rejected (field should not accept negative numbers)
   - Leave contract fields empty
   - ✅ Verify activity still saves (fields are optional)

---

## Troubleshooting

### Issue: Contract fields don't appear when selecting Contract type

**Check**:
1. Verify you added the code in the correct location (after line 239)
2. Check that the condition matches: `formData.activityCategory === 'contract'` (lowercase)
3. Clear browser cache and reload
4. Check browser console for JavaScript errors

**Fix**:
```bash
# Check for console errors in browser DevTools
# Press F12 → Console tab
```

### Issue: Syntax errors after adding code

**Common mistakes**:
- Missing closing braces `}`
- Incorrect indentation
- Copy-paste included line numbers

**Fix**:
```bash
# Run linter to identify exact error
npm run lint

# Auto-fix if possible
npm run lint:fix
```

### Issue: Currency not formatting correctly

**Possible causes**:
- Browser doesn't support Intl.NumberFormat with VND
- Contract value is a string instead of number

**Fix**:
Try changing the currency format in ActivityDetail.jsx:
```javascript
// From VND
currency: 'VND'

// To USD (if VND doesn't work)
currency: 'USD'

// Or use en-US locale
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
```

### Issue: Fields are not saving to database

**Check**:
1. Backend must be updated (tasks T001-T013 should be complete)
2. Database migration must be applied
3. Check browser network tab for API errors
4. Verify API response includes contractDate and contractValue

**Debug**:
```bash
# Check browser Network tab (F12 → Network)
# Look for POST/PUT requests to /activities
# Verify request payload includes contractDate and contractValue
```

---

## Verification Checklist

After implementing the changes, verify:

- [ ] Code added to ActivityCategoryFields.jsx (line ~240)
- [ ] Code added to ActivityDetail.jsx (line ~593)
- [ ] No linting errors (`npm run lint` passes)
- [ ] Application builds successfully (`npm run build`)
- [ ] Contract fields appear when type is "Contract"
- [ ] Contract date picker works
- [ ] Contract value input validates (rejects negative)
- [ ] Contract fields are optional (can be empty)
- [ ] Saved values display correctly in detail view
- [ ] Currency formatting works
- [ ] Edit functionality works

---

## Next Steps

After completing these changes:

1. **Update tasks.md**:
   - Mark T015-T019 as complete [X]

2. **Commit your changes**:
   ```bash
   cd "E:/project/full crm"
   git add crm-system-client/src/presentation/components/common/ActivityForms/components/ActivityCategoryFields.jsx
   git add crm-system-client/src/presentation/pages/activity/ActivityDetail.jsx
   git commit -m "feat: add contract date and value fields to activities

- Add contract fields to activity form (ActivityCategoryFields)
- Add contract display to activity detail view
- Implement date picker for contract date
- Implement number input for contract value with validation
- Add currency formatting for contract value display

Tasks: T015-T019 (Phase 3 - User Story 1)"
   ```

3. **Continue with Phase 4**: User Story 2 (if needed) or test the implementation end-to-end

4. **Run full test suite** once all phases are complete

---

## Reference Files

All implementation files are in:
`E:/project/005-contract-activity/implementation-examples/patches/`

- `contract-fields-snippet.jsx` - Form fields code
- `contract-display-snippet.jsx` - Display section code
- `README.md` - This guide
- `IMPLEMENTATION_GUIDE.md` - Detailed instructions (this file)

## Documentation

- **Feature Spec**: `specs/006-contract-activity-fields/spec.md`
- **Implementation Plan**: `specs/006-contract-activity-fields/plan.md`
- **Data Model**: `specs/006-contract-activity-fields/data-model.md`
- **API Contracts**: `specs/006-contract-activity-fields/contracts/api-contracts.md`
- **Quickstart**: `specs/006-contract-activity-fields/quickstart.md`
- **Tasks**: `specs/006-contract-activity-fields/tasks.md`

---

## Support

If you encounter any issues:

1. Check the browser console for errors (F12 → Console)
2. Check the network tab for API errors (F12 → Network)
3. Verify backend is running and accessible
4. Review the specification documents listed above
5. Check that database migration was applied successfully

## Summary

You've successfully added:
- ✅ Contract date input field (date picker)
- ✅ Contract value input field (number with validation)
- ✅ Contract information display section
- ✅ Currency formatting for contract value
- ✅ Validation for non-negative values
- ✅ Optional fields (can be left empty)

The contract activity fields feature is now functional in the frontend! 🎉

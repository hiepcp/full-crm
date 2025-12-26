# 🧪 Phase 3 Testing Guide - Contract Activity Fields

**Feature**: 006-contract-activity-fields - Phase 3
**Server Status**: ✅ Running
**Test Date**: 2025-12-26

---

## 🌐 Server Information

**Application URL**: https://crm.local.com:3000/
**Server Status**: ✅ Ready (started in 581ms)

**Server Output**:
- Local: https://vite.local.com:3000/
- Network: https://crm.local.com:3000/

---

## 📋 Testing Checklist

### Test 1: Create Contract Activity with All Fields ✓

**Steps**:
1. ✅ Open browser to: https://crm.local.com:3000/
2. ✅ Navigate to Activities section
3. ✅ Click "Add Activity" or "Create Activity"
4. ✅ Select Activity Type: **"📄 Contract"**
5. ✅ **Verify**: "Contract Information" section appears below main fields
6. ✅ Fill in required fields:
   - Title: "Test Contract Activity 1"
   - Description: "Testing contract date and value fields"
7. ✅ Fill in Contract fields:
   - **Contract Date**: 2025-02-15
   - **Contract Value**: 100000
8. ✅ Click Save
9. ✅ **Verify**: Activity saves without errors

**Expected Results**:
- ✅ "Contract Information" section visible when type is "Contract"
- ✅ Date picker accepts valid dates
- ✅ Number input accepts positive values
- ✅ Activity saves successfully
- ✅ No console errors

---

### Test 2: View Contract Activity Details ✓

**Steps**:
1. ✅ Find the contract activity created in Test 1
2. ✅ Click to open activity details
3. ✅ **Verify**: CONTRACT DATE section displays
4. ✅ **Verify**: CONTRACT VALUE section displays
5. ✅ Check date format (should be readable, e.g., "Feb 15, 2025")
6. ✅ Check currency format (should show VND symbol, e.g., "₫100,000")

**Expected Results**:
- ✅ Contract Date displays: "Feb 15, 2025" or "15/02/2025"
- ✅ Contract Value displays: "₫100,000" or similar currency format
- ✅ Both fields shown in dedicated sections
- ✅ Clean, professional layout

---

### Test 3: Edit Contract Activity ✓

**Steps**:
1. ✅ Open a contract activity (from Test 1)
2. ✅ Click "Edit" button
3. ✅ **Verify**: Contract fields show current values
4. ✅ Change Contract Date to: 2025-03-20
5. ✅ Change Contract Value to: 250000
6. ✅ Click Save
7. ✅ **Verify**: Changes persist after save
8. ✅ Refresh the page
9. ✅ **Verify**: Updated values still display

**Expected Results**:
- ✅ Edit form shows existing contract values
- ✅ Can modify both date and value
- ✅ Changes save successfully
- ✅ Updated values persist after page refresh

---

### Test 4: Validation - Negative Values ✓

**Steps**:
1. ✅ Create or edit a contract activity
2. ✅ Try to enter **Contract Value**: -5000 (negative)
3. ✅ **Verify**: Field rejects negative value OR prevents save
4. ✅ Try to type "-" character
5. ✅ **Verify**: Input validation prevents negative numbers

**Expected Results**:
- ✅ Cannot enter negative values
- ✅ Field may show validation error
- ✅ Save button may be disabled for invalid input
- ✅ User feedback is clear

---

### Test 5: Optional Fields ✓

**Steps**:
1. ✅ Create a new contract activity
2. ✅ Fill in required fields (Title, etc.)
3. ✅ Leave Contract Date **empty**
4. ✅ Leave Contract Value **empty**
5. ✅ Click Save
6. ✅ **Verify**: Activity saves successfully
7. ✅ Open the activity details
8. ✅ **Verify**: No contract sections display (or show "Not provided")

**Expected Results**:
- ✅ Activity saves without contract fields
- ✅ No errors when fields are empty
- ✅ Detail view handles missing data gracefully
- ✅ No "undefined" or "null" displayed

---

### Test 6: Large Values ✓

**Steps**:
1. ✅ Create a new contract activity
2. ✅ Enter Contract Value: 999999999999.99 (max value)
3. ✅ Click Save
4. ✅ **Verify**: Value saves correctly
5. ✅ View details
6. ✅ **Verify**: Large number displays with proper formatting

**Expected Results**:
- ✅ Maximum value accepts up to 999,999,999,999.99
- ✅ Currency formatting handles large numbers
- ✅ No overflow or display issues
- ✅ Example: "₫999,999,999,999.99"

---

### Test 7: Decimal Values ✓

**Steps**:
1. ✅ Create a new contract activity
2. ✅ Enter Contract Value: 12345.67 (with decimals)
3. ✅ Click Save
4. ✅ View details
5. ✅ **Verify**: Decimal places preserved
6. ✅ **Verify**: Displays as "₫12,345.67" or similar

**Expected Results**:
- ✅ Accepts decimal values
- ✅ Preserves up to 2 decimal places
- ✅ Displays with proper formatting
- ✅ No rounding errors

---

### Test 8: Non-Contract Activities ✓

**Steps**:
1. ✅ Create an activity with different type (Email, Meeting, Call, etc.)
2. ✅ **Verify**: Contract Information section does NOT appear
3. ✅ Save and view the activity
4. ✅ **Verify**: No contract fields in detail view
5. ✅ Test with multiple activity types

**Expected Results**:
- ✅ Contract fields only visible for "Contract" type
- ✅ Other activity types unaffected
- ✅ No broken layouts or errors
- ✅ Backward compatibility maintained

---

### Test 9: Browser Console Check ✓

**Steps**:
1. ✅ Open browser Developer Tools (F12)
2. ✅ Go to Console tab
3. ✅ Perform Tests 1-8
4. ✅ **Verify**: No JavaScript errors
5. ✅ **Verify**: No React warnings related to contract fields
6. ✅ Check Network tab for API calls
7. ✅ **Verify**: Contract data sent/received correctly

**Expected Results**:
- ✅ No console errors
- ✅ No React warnings
- ✅ API requests include contractDate and contractValue
- ✅ API responses include contract data

---

### Test 10: Backward Compatibility ✓

**Steps**:
1. ✅ View existing activities (created before this feature)
2. ✅ **Verify**: They display correctly
3. ✅ Open detail views
4. ✅ **Verify**: No errors or broken layouts
5. ✅ Edit and save an old activity
6. ✅ **Verify**: Saves successfully without contract fields

**Expected Results**:
- ✅ Existing activities unaffected
- ✅ No migration errors
- ✅ Contract fields optional for old records
- ✅ System remains stable

---

## 🐛 Known Issues to Watch For

### Potential Issues:

1. **Currency Symbol**:
   - Vietnamese Dong (₫) may not display correctly on all systems
   - Fallback should be "VND" or number-only format

2. **Date Format**:
   - Date picker format may vary by browser/locale
   - Ensure consistent display format

3. **Validation**:
   - Some browsers may allow negative numbers in type="number"
   - JavaScript validation should catch this

4. **API Integration**:
   - Backend must be running for full test
   - Check that contract fields are actually saved to database

---

## ✅ Success Criteria

All tests pass when:

- [ ] Contract fields appear only for contract activities
- [ ] Date picker allows valid date selection
- [ ] Number input accepts positive values with 2 decimal places
- [ ] Validation rejects negative values
- [ ] Optional fields can be left empty
- [ ] Saved values display with correct formatting
- [ ] Currency formatting works (VND or fallback)
- [ ] No console errors or warnings
- [ ] Backward compatible with existing activities
- [ ] Edit functionality preserves values

---

## 🎯 Testing Commands

### Manual Testing:
```
1. Open: https://crm.local.com:3000/
2. Login with credentials
3. Navigate to Activities
4. Follow test steps above
```

### Monitor Dev Server:
```bash
# Check server output
cat "C:\Users\hiepcp\AppData\Local\Temp\claude\E--project-005-contract-activity\tasks\b5a7fab.output"
```

### Stop Dev Server (when done):
```bash
# Find process and kill
tasklist | findstr node
taskkill /F /PID [process_id]
```

---

## 📊 Test Results Template

**Test Date**: ___________
**Tester**: ___________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Create with all fields | ⬜ Pass / ⬜ Fail | |
| 2 | View details | ⬜ Pass / ⬜ Fail | |
| 3 | Edit activity | ⬜ Pass / ⬜ Fail | |
| 4 | Negative validation | ⬜ Pass / ⬜ Fail | |
| 5 | Optional fields | ⬜ Pass / ⬜ Fail | |
| 6 | Large values | ⬜ Pass / ⬜ Fail | |
| 7 | Decimal values | ⬜ Pass / ⬜ Fail | |
| 8 | Non-contract types | ⬜ Pass / ⬜ Fail | |
| 9 | Console check | ⬜ Pass / ⬜ Fail | |
| 10 | Backward compat | ⬜ Pass / ⬜ Fail | |

**Overall Result**: ⬜ PASS / ⬜ FAIL

---

## 🚀 After Testing

### If All Tests Pass:
1. Mark Phase 3 as fully complete
2. Commit the changes
3. Continue to Phase 4 or create PR

### If Tests Fail:
1. Document the failures
2. Check browser console for errors
3. Review the implementation
4. Fix issues and re-test

---

## 📞 Need Help?

**Error Logs**: Check browser console (F12)
**Server Logs**: `C:\Users\hiepcp\AppData\Local\Temp\claude\E--project-005-contract-activity\tasks\b5a7fab.output`
**Documentation**: `implementation-examples/patches/IMPLEMENTATION_GUIDE.md`

---

*Server Started: 2025-12-26 09:13*
*Ready for Testing! 🎉*

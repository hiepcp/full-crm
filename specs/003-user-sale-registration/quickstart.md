# Quickstart: User Sale Registration

**Feature**: User Sale Registration
**Branch**: `003-user-sale-registration`
**Last Updated**: 2025-12-23

## Prerequisites

Before implementing this feature, ensure you have:

✅ **Development Environment**:
- Node.js 18+ and npm installed
- Git configured
- VS Code or preferred IDE

✅ **Backend Services Running**:
- AllCRM API (for HCM Workers): `https://api-crm.local.com`
- Auth API (for Users/Roles): `https://api-auth.local.com`
- MySQL database accessible

✅ **HTTPS Certificates** (Local Development):
- mkcert installed and configured
- Certificates generated for `*.local.com`
- Hosts file updated:
  ```
  127.0.0.1 crm.local.com
  127.0.0.1 api-auth.local.com
  127.0.0.1 api-crm.local.com
  ```

✅ **Environment Variables** (Frontend `.env`):
```env
VITE_API_AUTH=https://api-auth.local.com
VITE_API_URL=https://api-crm.local.com
VITE_API_AUTHZ=https://api-auth.local.com
VITE_X_API_KEY=<your-api-key>
VITE_TENANT_ID=<azure-tenant-id>
VITE_CLIENT_ID=<azure-client-id>
```

✅ **Authenticated Session**:
- User logged in with administrator permissions
- Valid JWT access token in localStorage

---

## Quick Setup (5 Minutes)

### 1. Clone and Checkout Feature Branch
```bash
cd "e:\project\full crm"
git checkout 003-user-sale-registration
```

### 2. Install Frontend Dependencies
```bash
cd crm-system-client
npm install
```

### 3. Start Frontend Development Server
```bash
npm run dev
```
Server runs at: `https://crm.local.com:3000`

### 4. Access Feature
1. Navigate to: `https://crm.local.com:3000/user/register-sale` (route TBD during implementation)
2. Login with administrator account if prompted
3. You should see the User Sale Registration page

---

## Implementation Checklist

Use this checklist while implementing the feature:

### Phase 1: Component Setup
- [ ] Create `crm-system-client/src/presentation/pages/user/UserSaleRegistration.jsx`
- [ ] Add route to `crm-system-client/src/app/routes/groups/MainRoutes.jsx`
- [ ] Add menu item to navigation (if applicable)
- [ ] Verify existing imports work:
  - [ ] `GetAllCRMHcmWorkersUseCase` from `@application/usecases/all-crms`
  - [ ] `RestAllCRMRepository` from `@infrastructure/repositories`
  - [ ] `authUsersApi` from `@infrastructure/api/authUsersApi`
  - [ ] `authRolesApi` from `@infrastructure/api/authRolesApi`

### Phase 2: HCM Worker List (DataGrid)
- [ ] Initialize use case and repository instances
- [ ] Set up state: `workers`, `total`, `loading`, `paginationModel`, `sortModel`, `search`
- [ ] Implement `useEffect` to fetch HCM workers on mount and state changes
- [ ] Configure Material-UI DataGrid:
  - [ ] Server-side pagination (`paginationMode="server"`)
  - [ ] Server-side sorting (`sortingMode="server"`)
  - [ ] Page size options: `[5, 10, 25, 50]`
  - [ ] Columns: Personnel Number, Name, Email, Actions (Select button)
- [ ] Implement search functionality:
  - [ ] Search input field
  - [ ] Search button triggers filter
  - [ ] Filter HCM workers by personnel number, name, or email
  - [ ] Filter out workers with empty `SysEmail` (FR-003)
- [ ] Normalize worker data (handle PascalCase/camelCase)
- [ ] Handle loading and error states

### Phase 3: Registration Form
- [ ] Set up form state: `email`, `fullName`, `userName`, `roleIds`
- [ ] Create default form object for resets
- [ ] Fetch roles on component mount (`authRolesApi.getAll(1, 200)`)
- [ ] Normalize role data (handle different field names)
- [ ] Render form fields:
  - [ ] Email (TextField, required)
  - [ ] Full Name (TextField, optional)
  - [ ] Username (TextField, optional)
  - [ ] Roles (Select, multiple, required)
- [ ] Implement role dropdown with chips for selected values
- [ ] Add form validation:
  - [ ] Email required
  - [ ] At least one role required
  - [ ] Disable submit button if invalid

### Phase 4: Auto-Population Logic
- [ ] Track selected worker state (`selectedWorker`)
- [ ] Implement `handleSelectWorker` function:
  - [ ] Set `selectedWorker`
  - [ ] Auto-fill `email` from `worker.sysEmail`
  - [ ] Auto-fill `fullName` from `worker.name`
  - [ ] Auto-generate `userName` from email prefix or personnel number
- [ ] Display selected worker info (Alert component)
- [ ] Allow manual field editing after auto-population

### Phase 5: User Creation
- [ ] Implement `handleSubmit` function:
  - [ ] Validate required fields (email, roleIds)
  - [ ] Set `submitting` state to true
  - [ ] Call `authUsersApi.create(payload)`
  - [ ] Handle success:
    - [ ] Reset form to default state
    - [ ] Clear selected worker
    - [ ] Show success alert (FR-012)
  - [ ] Handle errors:
    - [ ] Duplicate email: Show FR-014 message
    - [ ] Validation errors: Show server message
    - [ ] Generic errors: Show "Cannot create user"
  - [ ] Set `submitting` state to false

### Phase 6: Error Handling
- [ ] Create alert state (`alert` with `severity` and `message`)
- [ ] Render Alert component (dismissible)
- [ ] Implement duplicate email detection (FR-014):
  - [ ] Check error message for "email" + "exist" keywords
  - [ ] Show: "This email address is already registered. Please verify if the user already has an account."
- [ ] Handle API unavailability (show error alert)
- [ ] Handle network timeouts (show error alert)

### Phase 7: Edge Cases
- [ ] Verify empty email filter works (FR-003)
- [ ] Test unicode/special characters in worker names
- [ ] Test page size change resets to page 1
- [ ] Test sort change resets to page 1
- [ ] Test concurrent form submissions (disable button while submitting)

### Phase 8: Testing
- [ ] Manual testing:
  - [ ] Register user with HCM worker selection
  - [ ] Register user with manual data entry
  - [ ] Test search functionality
  - [ ] Test pagination
  - [ ] Test sorting
  - [ ] Test duplicate email error
  - [ ] Test validation errors
  - [ ] Test form reset after success
- [ ] Code quality:
  - [ ] Run `npm run lint` - must pass
  - [ ] Run `npm run prettier` - format code
  - [ ] Review against HcmWorkerRegister.jsx for consistency

---

## Development Workflow

### 1. Feature Branch
```bash
# Already on 003-user-sale-registration branch
git status
```

### 2. Start Development Server
```bash
cd crm-system-client
npm run dev
```
Hot reload enabled - changes reflect immediately.

### 3. Code Changes
1. Edit `UserSaleRegistration.jsx` in `src/presentation/pages/user/`
2. Update `MainRoutes.jsx` to add route
3. Save files → Browser auto-reloads

### 4. Linting
```bash
npm run lint           # Check for errors
npm run lint:fix       # Auto-fix errors
npm run prettier       # Format code
```

### 5. Testing Locally
1. Open `https://crm.local.com:3000`
2. Login with admin account
3. Navigate to User Sale Registration page
4. Test all user stories from spec.md

### 6. Commit Changes
```bash
git add src/presentation/pages/user/UserSaleRegistration.jsx
git add src/app/routes/groups/MainRoutes.jsx
git commit -m "feat: implement user sale registration page

- Add UserSaleRegistration component with HCM worker selection
- Integrate with authUsersApi for user creation
- Implement server-side pagination/sorting for worker list
- Add form validation and error handling
- Auto-populate form from selected HCM worker
- Log registration events for audit trail

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Key Files to Work With

### Primary Implementation File
```
📄 crm-system-client/src/presentation/pages/user/UserSaleRegistration.jsx
```
**Lines of Code**: ~350-400 (reference: HcmWorkerRegister.jsx is 370 lines)

### Reference Implementation
```
📄 crm-system-client/src/presentation/pages/user/HcmWorkerRegister.jsx
```
**Purpose**: Copy patterns for DataGrid, form handling, API integration

### Routes Configuration
```
📄 crm-system-client/src/app/routes/groups/MainRoutes.jsx
```
**Change**: Add new route for `/user/register-sale`

### API Clients (No Changes)
```
📄 crm-system-client/src/infrastructure/api/authUsersApi.js
📄 crm-system-client/src/infrastructure/api/authRolesApi.js
```
**Purpose**: Use existing `create()` and `getAll()` methods

### Use Cases (No Changes)
```
📄 crm-system-client/src/application/usecases/all-crms/GetAllCRMHcmWorkersUseCase.js
📄 crm-system-client/src/infrastructure/repositories/RestAllCRMRepository.js
```
**Purpose**: Use existing HCM worker retrieval logic

---

## Component Structure Preview

```jsx
export default function UserSaleRegistration() {
  // 1. State Management
  const [workers, setWorkers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = useState([{ field: "personnelNumber", sort: "asc" }]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // 2. API Integration
  const [allCRMRepository] = useState(() => new RestAllCRMRepository());
  const [getHcmWorkersUseCase] = useState(() => new GetAllCRMHcmWorkersUseCase(allCRMRepository));

  // 3. Data Fetching
  useEffect(() => { /* Fetch HCM workers */ }, [paginationModel, search, sortModel]);
  useEffect(() => { /* Fetch roles */ }, []);

  // 4. Event Handlers
  const handleSelectWorker = (worker) => { /* Auto-populate form */ };
  const handleSubmit = async () => { /* Create user */ };

  // 5. Render
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4">Register User from HCM Workers</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          {/* HCM Worker List (DataGrid) */}
        </Grid>
        <Grid item xs={12} md={5}>
          {/* Registration Form */}
        </Grid>
      </Grid>
    </Box>
  );
}
```

---

## Testing Checklist

### Manual Test Cases

**Test 1: Happy Path - HCM Worker Selection**
1. ✅ Load page → HCM workers displayed
2. ✅ Search for worker → Filtered results shown
3. ✅ Select worker → Form auto-populated
4. ✅ Select role(s) → Roles added to form
5. ✅ Submit → User created successfully
6. ✅ Form reset → Ready for next registration

**Test 2: Manual Data Entry**
1. ✅ Load page
2. ✅ Manually enter email, full name, username
3. ✅ Select role(s)
4. ✅ Submit → User created successfully

**Test 3: Duplicate Email**
1. ✅ Enter existing email
2. ✅ Submit → Error: "Email already registered. Verify if user exists."

**Test 4: Validation Errors**
1. ✅ Submit without email → Error: "Email is required"
2. ✅ Submit without roles → Error: "At least one role required"

**Test 5: Edge Cases**
1. ✅ Workers with empty email not shown
2. ✅ Unicode names displayed correctly
3. ✅ Page size change resets to page 1
4. ✅ Sort change resets to page 1

---

## Troubleshooting

### Common Issues

**Issue**: `Cannot read property 'create' of undefined`
**Solution**: Check `authUsersApi` import path is correct

**Issue**: HCM workers not loading
**Solution**:
1. Verify AllCRM API is running
2. Check API URL in `.env`: `VITE_API_URL`
3. Check browser console for CORS errors
4. Verify API key in `.env`: `VITE_X_API_KEY`

**Issue**: Roles not loading
**Solution**:
1. Verify Auth API is running
2. Check API URL in `.env`: `VITE_API_AUTHZ`
3. Check JWT token in localStorage

**Issue**: User creation fails with 401
**Solution**: Token expired → Reload page to trigger refresh

**Issue**: HTTPS certificate error
**Solution**: Reinstall mkcert certificates, trust root CA

---

## Next Steps After Implementation

1. ✅ Create pull request to merge feature branch
2. ✅ Code review by team
3. ✅ QA testing in sandbox environment
4. ✅ UAT with actual administrators
5. ✅ Deploy to production

---

## Resources

**Documentation**:
- Feature Spec: [spec.md](./spec.md)
- Implementation Plan: [plan.md](./plan.md)
- Data Model: [data-model.md](./data-model.md)
- API Contracts: [contracts/api-contracts.md](./contracts/api-contracts.md)

**Reference Code**:
- HcmWorkerRegister: `crm-system-client/src/presentation/pages/user/HcmWorkerRegister.jsx`
- Material-UI DataGrid: https://mui.com/x/react-data-grid/
- Material-UI Select: https://mui.com/material-ui/react-select/

**Backend APIs**:
- Auth API Swagger: `https://api-auth.local.com/swagger` (if available)
- AllCRM API Docs: Check `CLAUDE.md` for endpoints

---

## Estimated Time

- **Setup**: 5 minutes
- **Implementation**: 4-6 hours (reference component: 370 lines)
- **Testing**: 1-2 hours
- **Total**: ~1 day

---

**Happy coding! 🚀**

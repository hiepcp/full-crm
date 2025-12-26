# Feature Specification: User Sale Registration

**Feature Branch**: `003-user-sale-registration`
**Created**: 2025-12-23
**Updated**: 2025-12-25
**Status**: Draft
**Input**: User description: "sửa lại register sale lưu xuống table crm_user trong local"

## Clarifications

### Session 2025-12-23

- Q: How are passwords handled during user registration? → A: No password - authentication via Azure AD SSO only
- Q: What happens to the registration form after successful user creation? → A: Form resets to empty state, allowing quick registration of next user
- Q: Should the system maintain an audit trail of user registration activities? → A: Log registration events (who registered whom, when, with which roles) for audit purposes
- Q: How should the system handle duplicate email registration attempts? → A: Display clear error message indicating email already exists, suggest administrator verify if user already has an account
- Q: Can a user be created with zero roles assigned? → A: At least one role must be assigned during registration

### Session 2025-12-25 - Data Storage Update

**Major Change**: User registration data will now be saved to the local `crm_user` table in the CRM database instead of the authentication system API. This change simplifies the architecture by consolidating user management within the CRM system while still leveraging Azure AD for authentication.

**Rationale**:
- Centralized user data management within the CRM system
- Reduced dependency on external authentication API for user CRUD operations
- Simplified synchronization between CRM users and authentication users
- Better support for CRM-specific user attributes (sales territory, manager, etc.)

**Authentication Flow Unchanged**: Users will still authenticate via Azure AD SSO. The `crm_user` table stores user profile and organizational data, while Azure AD handles authentication tokens and session management.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register Sales User from HCM Worker Data (Priority: P1)

An administrator needs to create a new CRM user account for a sales staff member by selecting them from the HCM (Human Capital Management) worker directory, which automatically pre-populates their basic information (email, full name, personnel number), then assigns them appropriate sales roles and saves the record to the local `crm_user` database table.

**Why this priority**: This is the core functionality that enables administrators to quickly onboard sales staff into the CRM system without manual data entry, reducing registration errors and saving time. Without this, the entire feature provides no value.

**Independent Test**: Can be fully tested by selecting an HCM worker from the directory, verifying auto-population of user fields, assigning at least one role, and successfully creating the user record in the `crm_user` table. Delivers immediate value by allowing sales staff to be registered in the CRM system.

**Acceptance Scenarios**:

1. **Given** administrator is on the user registration page, **When** they search for and select an HCM worker from the directory, **Then** the registration form is automatically populated with the worker's email, full name, and personnel number
2. **Given** the registration form is populated with HCM worker data, **When** administrator assigns one or more sales roles and submits the form, **Then** a new user record is created in the `crm_user` table with the assigned roles
3. **Given** administrator has selected an HCM worker, **When** they modify any pre-populated field before submission, **Then** the modified values are saved to the `crm_user` table instead of the original HCM data
4. **Given** administrator successfully creates a user, **When** the success confirmation is displayed, **Then** the registration form automatically resets to empty state ready for the next registration

---

### User Story 2 - Search and Filter HCM Workers (Priority: P2)

An administrator needs to quickly find specific HCM workers from potentially large directories by searching across personnel number, name, or email address to locate the correct person for user registration.

**Why this priority**: Enhances usability when dealing with many workers, but the feature can function without it if the worker list is small or manually browsable. Improves efficiency but is not blocking for core functionality.

**Independent Test**: Can be tested independently by entering search terms for personnel number, name, or email, and verifying that the worker list filters to show only matching results. Delivers value by reducing time to find workers.

**Acceptance Scenarios**:

1. **Given** administrator enters a search term in the search field, **When** they trigger the search, **Then** the HCM worker list displays only workers whose personnel number, name, or email contains the search term
2. **Given** administrator performs a search with no matching results, **When** the search completes, **Then** an empty list is displayed with a clear "no results found" indication
3. **Given** administrator has performed a search, **When** they clear the search field and search again, **Then** the full HCM worker list is restored

---

### User Story 3 - Paginate and Sort HCM Worker List (Priority: P3)

An administrator working with large HCM worker directories needs to navigate through paginated results and sort by different columns (personnel number, name, email) to efficiently browse and locate workers.

**Why this priority**: Nice-to-have feature that improves user experience with large datasets but is not critical for core registration functionality. The feature works without it if datasets are small.

**Independent Test**: Can be tested by loading a large worker list, navigating between pages, changing page size, and sorting by different columns. Delivers value through improved navigation efficiency.

**Acceptance Scenarios**:

1. **Given** HCM worker list has more records than the page size, **When** administrator navigates to the next page, **Then** the next set of workers is displayed with correct pagination controls
2. **Given** administrator views the worker list, **When** they click a column header to sort, **Then** the list re-orders based on that column in ascending or descending order
3. **Given** administrator changes the page size, **When** the change is applied, **Then** the list reloads with the new page size and resets to the first page

---

### User Story 4 - Manual User Registration Override (Priority: P2)

An administrator needs to create CRM user accounts for sales staff who are not in the HCM worker directory, or needs to manually override all fields when HCM data is incomplete or incorrect.

**Why this priority**: Important for edge cases and data quality issues, but not the primary workflow. Most registrations should use HCM data, making this a secondary capability.

**Independent Test**: Can be tested by manually entering all user fields (email, full name, personnel number) without selecting an HCM worker, assigning roles, and creating the user in the `crm_user` table. Delivers value for exceptional cases.

**Acceptance Scenarios**:

1. **Given** administrator does not select an HCM worker, **When** they manually enter email, full name, personnel number, and at least one role, **Then** they can successfully create a user record in the `crm_user` table with the manually entered data
2. **Given** administrator has selected an HCM worker, **When** they clear the pre-populated fields and enter new values, **Then** the system accepts the manual input and creates the user with the new data
3. **Given** administrator submits the registration form with missing required fields (email or roles), **When** validation occurs, **Then** clear error messages indicate which required fields are missing

---

### Edge Cases

- What happens when an HCM worker has no email address in the system? (Filtered out per FR-003, not displayed in selectable worker list)
- How does the system handle duplicate user registration attempts (same email already exists in `crm_user` table)? (Display clear error message indicating email already exists and suggest administrator verify if user already has an account)
- What happens when the HCM worker API is unavailable or returns an error?
- How does the system handle special characters or unicode in HCM worker names?
- What happens when an administrator tries to assign roles that don't exist in the local database?
- How does the system handle network timeout during user creation submission?
- What happens when an HCM worker's email format is invalid (not a proper email address)?
- How does the system synchronize CRM users with Azure AD for authentication?
- What happens if a user exists in `crm_user` but not in Azure AD, or vice versa?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST retrieve HCM worker data (personnel number, name, email) from the HCM worker directory with server-side pagination, sorting, and search capabilities
- **FR-002**: System MUST allow administrators to search HCM workers by personnel number, name, or email with partial text matching (contains logic)
- **FR-003**: System MUST filter out HCM workers with empty or null email addresses from the selectable worker list
- **FR-004**: System MUST auto-populate the registration form with worker's email, full name, and personnel number when an HCM worker is selected
- **FR-005**: System MUST allow administrators to manually edit any auto-populated field before submission
- **FR-006**: System MUST allow administrators to manually enter all user fields without selecting an HCM worker
- **FR-007**: System MUST validate that email is provided and in valid format before allowing user creation (required field)
- **FR-008**: System MUST validate that at least one role is assigned before allowing user creation (required field)
- **FR-009**: System MUST retrieve available roles from the local database for role assignment dropdown
- **FR-010**: System MUST support multiple role assignment to a single user during registration
- **FR-011**: System MUST create a new user record in the `crm_user` table with provided email, full name, personnel number, assigned role IDs, and audit fields (created_by, created_on)
- **FR-012**: System MUST validate email uniqueness against existing records in the `crm_user` table before creation
- **FR-013**: System MUST store role assignments in the appropriate user-role relationship table
- **FR-014**: System MUST display success confirmation when user is created successfully in the `crm_user` table
- **FR-015**: System MUST reset the registration form to empty state after successful user creation to allow quick registration of the next user
- **FR-016**: System MUST display clear error messages when user creation fails, including specific messaging for duplicate email errors that suggests verifying if the user already has an account, validation errors, and database errors
- **FR-017**: System MUST indicate which HCM worker was selected to pre-populate the current registration form
- **FR-018**: System MUST log all user registration events including administrator identity, registered user details (email, personnel number), assigned roles, and timestamp in the `crm_user_audit_log` or similar audit table
- **FR-019**: System MUST support server-side pagination of HCM worker list with configurable page sizes (5, 10, 25, 50)
- **FR-020**: System MUST support server-side sorting of HCM worker list by personnel number, name, or email
- **FR-021**: System MUST set default values for new user records including is_active=true, created_on=current timestamp, and created_by=current administrator's user ID

### Key Entities *(include if feature involves data)*

- **HCM Worker**: Represents an employee from the Human Capital Management system with attributes: personnel number (unique identifier), name (full name), system email (corporate email address). Used as the data source for pre-populating user registration.

- **CRM User (`crm_user` table)**: Represents a CRM system user stored locally in the database with attributes:
  - `id` (INT, PRIMARY KEY, AUTO_INCREMENT): Unique identifier
  - `email` (VARCHAR, UNIQUE, NOT NULL): Corporate email address for authentication and communication
  - `full_name` (VARCHAR, NOT NULL): User's full name
  - `personnel_number` (VARCHAR, UNIQUE, NULLABLE): HCM personnel number (if sourced from HCM)
  - `is_active` (BOOLEAN, DEFAULT TRUE): Active status flag
  - `created_by` (INT, FK to crm_user): Administrator who created the record
  - `created_on` (DATETIME, DEFAULT CURRENT_TIMESTAMP): Creation timestamp
  - `updated_by` (INT, FK to crm_user): Last user who updated the record
  - `updated_on` (DATETIME, ON UPDATE CURRENT_TIMESTAMP): Last update timestamp
  - Additional CRM-specific fields may exist (sales territory, manager_id, department, etc.)

- **Role**: Represents an authorization role that can be assigned to users, with attributes: role ID (unique identifier), role name/code. Multiple roles can be assigned to a single user via user-role relationship table.

- **User Role Assignment**: Junction table linking users to roles, with attributes: user_id (FK to crm_user), role_id (FK to roles table), assigned_by (administrator who made the assignment), assigned_on (timestamp).

- **Registration Audit Log**: Records user registration events with attributes: administrator ID (who performed the registration), registered user ID, registered user email, assigned role IDs, timestamp, registration source (HCM worker or manual entry). Used for compliance, security auditing, and troubleshooting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can complete user registration for sales staff in under 1 minute per user when using HCM worker auto-population
- **SC-002**: 95% of user registrations successfully pre-populate data from HCM workers on first attempt
- **SC-003**: Search results for HCM workers return within 2 seconds for datasets up to 10,000 workers
- **SC-004**: User creation operations complete within 3 seconds including database writes and role assignments
- **SC-005**: User creation error rate due to validation issues is less than 5% of all registration attempts
- **SC-006**: 90% of administrators successfully create their first user account without requiring help documentation or support
- **SC-007**: Registration form clearly indicates validation errors, with 100% of users able to identify and correct errors without assistance
- **SC-008**: System successfully handles and displays appropriate error messages for 100% of API failures (HCM worker fetch, role fetch, user creation)
- **SC-009**: 100% of user registration events are logged with complete audit information (administrator, user details, roles, timestamp)
- **SC-010**: Duplicate email detection accuracy is 100% with zero false negatives (no duplicate emails created)

## Assumptions

1. **HCM Worker API Access**: The system has an established API connection to the HCM worker directory (RSVNHcmWorkers) that provides personnel number, name, and email data
2. **Local CRM Database**: The `crm_user` table exists in the local CRM database (MySQL) with the necessary schema including email, full_name, personnel_number, is_active, and audit fields
3. **User-Role Relationship Table**: A junction table exists for mapping users to roles (e.g., `user_roles` with user_id and role_id columns)
4. **Roles Table**: Roles are pre-configured in the local database; this feature does not create new roles
5. **Azure AD SSO Authentication**: All users authenticate via Azure AD Single Sign-On; the `crm_user` table stores profile data only, not credentials
6. **Azure AD Synchronization**: A separate process (not part of this feature) handles synchronizing `crm_user` records with Azure AD for authentication purposes
7. **Administrator Permissions**: Users accessing this feature have administrator-level permissions; no additional permission checks are required beyond page access
8. **Email Uniqueness**: The `crm_user` table has a UNIQUE constraint on the email column to prevent duplicates at the database level
9. **Personnel Number Uniqueness**: If populated, personnel numbers should be unique; duplicate personnel numbers from HCM indicate data quality issues and should be logged
10. **Single Organization**: All HCM workers and CRM users belong to a single organization context; no multi-tenancy considerations
11. **Network Reliability**: The feature assumes stable network connectivity; offline mode is not required
12. **Sales Role Context**: While optimized for sales staff registration, the feature can register users for any available role in the local roles table
13. **Browser Environment**: The feature runs in a modern web browser with JavaScript enabled
14. **Audit Log Table**: A table exists for logging user registration events (e.g., `crm_user_audit_log` or generic audit table)
15. **Database Transaction Support**: The database supports transactions to ensure atomic creation of user + role assignments

## Dependencies

- **HCM Worker API**: Requires the AllCRM API endpoint for querying RSVNHcmWorkers with filtering, sorting, and pagination support
- **Local CRM Database**: Requires MySQL database with `crm_user`, user-role junction table, roles table, and audit log table properly configured
- **Database Access Layer**: Requires Dapper repository for `crm_user` CRUD operations following existing patterns (SimpleCRUD, underscore naming conventions)
- **Azure AD Integration**: Azure AD must be configured for SSO authentication; a separate synchronization process links `crm_user` records to Azure AD identities
- **Existing Authentication**: Administrators must be authenticated and authorized to access the registration page before using this feature
- **Material-UI Components**: Requires Material-UI (MUI) DataGrid component for HCM worker list display
- **Frontend API Client**: Requires API client module (e.g., `crmUsersApi.js`) for communicating with the CRM backend user endpoints
- **Backend API Endpoints**: Requires CRM API endpoints for:
  - POST `/api/users` - Create new CRM user
  - GET `/api/users?email={email}` - Check email uniqueness
  - GET `/api/roles` - Retrieve available roles
  - POST `/api/user-roles` - Assign roles to user

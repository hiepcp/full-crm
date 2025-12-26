# Feature Specification: Add Contract Activity Type

**Feature Branch**: `005-contract-activity`
**Created**: 2025-12-24
**Updated**: 2025-12-25
**Status**: Draft
**Input**: User description: "activity type contract thêm (ngày hợp đồng, giá trị hợp đồng) để phục vụ việc thiết lập goal sau này" (Add contract activity type with contract date and contract value fields to support future goal-setting)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Contract Activities with Contract-Specific Fields (Priority: P1)

Sales representatives need to track contract-related activities (signing, renewals, amendments, cancellations) with specific contract details including contract date and contract value. These fields will later support goal-setting and revenue tracking.

**Why this priority**: This is the core functionality that enables contract tracking with essential business data. Without contract date and value fields, users cannot track key contract metrics needed for revenue goals and performance analysis.

**Independent Test**: Can be fully tested by creating a new activity and selecting "Contract" as the activity type, entering contract date and contract value, verifying it saves correctly and displays in activity lists. Delivers immediate value by allowing contract event tracking with financial metrics.

**Acceptance Scenarios**:

1. **Given** a user is on the activity creation form, **When** they select activity type dropdown, **Then** they see "📄 Contract" as an available option
2. **Given** a user selects "Contract" as activity type, **When** the form displays, **Then** they see two additional required fields: "Contract Date" (date picker) and "Contract Value" (currency input)
3. **Given** a user fills in subject, body, contract date, contract value, and related entity (customer, lead, deal), **When** they submit the form, **Then** the contract activity is created and saved with type "contract" and the contract-specific fields
4. **Given** a contract activity exists, **When** user views the activity list/feed, **Then** the contract activity displays with contract icon (📄), contract-specific color scheme, contract date, and contract value
5. **Given** a user tries to create a contract activity without contract date or contract value, **When** they submit the form, **Then** validation errors prevent submission with clear messages indicating required fields

---

### User Story 2 - Filter and View Contract Activities with Financial Details (Priority: P2)

Users need to filter activity lists to show only contract-related activities and view contract dates and values, enabling focused review of contract history, timelines, and revenue tracking.

**Why this priority**: Once contract activities can be created with date and value fields, users need to efficiently find and review them with full financial context. This builds on P1 functionality and enhances usability for goal tracking.

**Independent Test**: Can be tested by creating multiple contract activities with different dates and values, using the activity filter to show only contract activities, and verifying contract date and value display correctly. Delivers value by improving activity discoverability and revenue visibility.

**Acceptance Scenarios**:

1. **Given** multiple activities of different types exist, **When** user applies "Contract" category filter, **Then** only contract activities are displayed with their contract dates and values
2. **Given** user is viewing a customer/lead/deal detail page, **When** they view the activity feed, **Then** contract activities show contract date and contract value alongside standard activity information
3. **Given** user views activity feed, **When** a contract activity is displayed, **Then** it shows distinct visual styling (icon, color) and prominently displays contract date and contract value
4. **Given** user views activity detail/popup, **When** opening a contract activity, **Then** contract date and contract value are clearly labeled and formatted (date as locale-appropriate format, value as currency)

---

### User Story 3 - Search and Report on Contract Activities (Priority: P3)

Users need to search for specific contract activities and generate reports showing contract activity history across customers and deals.

**Why this priority**: This enhances the feature by enabling analytics and reporting, but the core tracking functionality (P1, P2) delivers value without it.

**Independent Test**: Can be tested by searching for contract activities by keyword, date range, or related entity and verifying results are accurate. Delivers value for compliance and auditing needs.

**Acceptance Scenarios**:

1. **Given** user performs activity search with keyword "renewal", **When** contract activities contain this term, **Then** relevant contract activities appear in search results
2. **Given** user views deal/customer timeline, **When** contract activities exist, **Then** they appear chronologically with other activities
3. **Given** user exports activity reports, **When** report includes contract activities, **Then** contract type is clearly indicated in exported data

---

### Edge Cases

- What happens when a contract activity has no related entity (customer, lead, or deal)? System should allow creation as standalone activity with warning/prompt to link to entity.
- How does system handle contract activities created before the feature existed? Not applicable - this is a new feature.
- What happens when user deletes a deal/customer that has associated contract activities? Contract activities should remain in system with orphaned relation (follow existing deletion behavior for activities).
- How does system display contract activities when filtering/grouping by activity source (email sync, manual entry)? Contract activities are manually created, so they should be categorized as system/manual source type.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add "contract" as a valid activity type to the database schema (ActivityType ENUM)
- **FR-002**: System MUST support creating activities with type "contract" through the activity creation interface
- **FR-003**: System MUST display contract activities with a distinct icon (📄 document icon) and color scheme in activity feeds and lists
- **FR-004**: System MUST include "contract" in the ACTIVITY_TYPES constant with label "📄 Contract"
- **FR-005**: System MUST add "contract" to the ACTIVITY_CATEGORIES constant for filtering and categorization
- **FR-006**: Backend DTO (ActivityResponse) MUST include a computed property `IsContract` that returns true when ActivityType equals "contract"
- **FR-007**: Frontend activity categorization logic (ActivityFeed component) MUST recognize and correctly categorize activities with type "contract"
- **FR-008**: System MUST allow filtering activities by "contract" category in activity lists and detail pages
- **FR-009**: Contract activities MUST support all standard activity fields: subject, body, due date, status, priority, assigned user, related entity (customer/lead/deal)
- **FR-010**: System MUST persist contract activity type consistently across all layers (database, backend API, frontend UI)

### Key Entities *(include if feature involves data)*

- **Activity**: Existing entity being extended with new "contract" type. Represents all user interactions and events tracked in the CRM system. Key attributes include activity type (email, call, meeting, task, note, **contract**), subject, body, timestamps, status, priority, and relationships to customers/leads/deals.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create contract activities in under 30 seconds with the same ease as other activity types
- **SC-002**: Contract activities display with consistent visual styling (icon and color) across all activity views (feed, timeline, list, detail pages)
- **SC-003**: Users can filter to show only contract activities, returning results in under 2 seconds
- **SC-004**: 100% of contract activities created are correctly categorized and searchable by "contract" type
- **SC-005**: Zero data inconsistencies between database storage, API responses, and UI display of contract activity type

## Assumptions

- **A-001**: Contract activities follow the same creation, editing, and deletion workflows as existing activity types (no special business rules or validation)
- **A-002**: Contract activities do not require additional contract-specific fields beyond standard activity attributes (future enhancement if needed)
- **A-003**: The visual styling for contract activities will use document icon (📄) with purple/secondary color scheme to differentiate from other types
- **A-004**: The feature will be implemented across all three layers (database, backend API, frontend) in a single deployment
- **A-005**: Existing activity filtering, search, and reporting functionality will automatically support contract activities once the type is added
- **A-006**: No data migration is needed since this is a new activity type (no existing activities to convert)

## Constraints

- **C-001**: Implementation must maintain backward compatibility with existing activity types and not break current activity functionality
- **C-002**: Database schema change (adding "contract" to ENUM) requires coordinated deployment with backend and frontend updates
- **C-003**: Must follow existing Clean Architecture patterns: database → domain entity → DTO → API → frontend constants → UI components
- **C-004**: Icon and color choices must align with existing Material-UI theme and not conflict with other activity type styling

## Dependencies

- **D-001**: Database migration capability to alter ActivityType ENUM in `crm_activity` table
- **D-002**: Backend API deployment to include updated ActivityResponse DTO with IsContract property
- **D-003**: Frontend deployment with updated constants.js and ActivityFeed.jsx component
- **D-004**: No external API or third-party dependencies required

# Feature Specification: Add Contract Activity Type

**Feature Branch**: `005-contract-activity`
**Created**: 2025-12-24
**Updated**: 2025-12-25
**Status**: Draft
**Input**: User description: "activity type contract thêm (ngày hợp đồng, giá trị hợp đồng) để phục vụ việc thiết lập goal sau này" (Add contract date and contract value fields to contract activity type to support future goal setting)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record Contract Details with Date and Value (Priority: P1)

Sales representatives need to record contract-related activities with specific contract information including the contract date and contract value. This enables tracking of contract milestones and provides data foundation for future goal setting and revenue forecasting.

**Why this priority**: This is the core functionality that captures essential contract data. Contract date and value are fundamental for sales tracking, goal setting, and pipeline reporting. Without these fields, users cannot properly track contract worth or timeline.

**Independent Test**: Can be fully tested by creating a new contract activity, entering a contract date and contract value, verifying both fields save correctly and display in activity details. Delivers immediate value by enabling quantifiable contract tracking.

**Acceptance Scenarios**:

1. **Given** a user creates a contract activity, **When** they fill in the contract date field, **Then** the date is saved and displayed in the activity record
2. **Given** a user creates a contract activity, **When** they enter a contract value amount, **Then** the value is saved with proper currency formatting and displayed in the activity record
3. **Given** a user views a contract activity, **When** the activity details are displayed, **Then** both contract date and contract value are clearly visible alongside standard activity fields
4. **Given** a user edits a contract activity, **When** they update the contract date or value, **Then** the changes are saved and reflected immediately in all views

---

### User Story 2 - Analyze Contract Values and Dates (Priority: P2)

Users need to view, filter, and sort contract activities by contract date and value to analyze contract patterns, identify high-value contracts, and track contract timelines for goal setting purposes.

**Why this priority**: Once contract data is captured (P1), users need to analyze it for business insights. This enables revenue tracking, trend analysis, and provides the foundation for goal setting features.

**Independent Test**: Can be tested by creating multiple contract activities with different dates and values, then sorting/filtering the activity list by these fields. Delivers value by enabling contract portfolio analysis.

**Acceptance Scenarios**:

1. **Given** multiple contract activities exist with different values, **When** user sorts activities by contract value, **Then** activities are ordered correctly from highest to lowest (or vice versa)
2. **Given** user views activity list, **When** they filter by contract date range, **Then** only contract activities within the specified date range are displayed
3. **Given** user views a deal or customer detail page, **When** they review contract activities, **Then** total contract value for that entity is clearly visible
4. **Given** user views activity feed, **When** contract activities are displayed, **Then** contract date and value are prominently shown in the activity summary

---

### User Story 3 - Export and Report Contract Data for Goal Setting (Priority: P3)

Users need to export contract activity data including dates and values to analyze trends, set revenue goals, and integrate with external reporting systems.

**Why this priority**: This enhances the feature by enabling advanced analytics and goal-setting workflows, but the core tracking and analysis functionality (P1, P2) delivers value without it.

**Independent Test**: Can be tested by exporting contract activities to CSV/Excel format and verifying contract date and value columns are included with correct data. Delivers value for strategic planning and external analysis.

**Acceptance Scenarios**:

1. **Given** user exports activity reports, **When** report includes contract activities, **Then** contract date and contract value are included as separate columns in the export
2. **Given** user views aggregate contract reports, **When** they filter by time period, **Then** total contract value for the period is calculated and displayed accurately
3. **Given** user searches for high-value contracts, **When** they apply value threshold filter (e.g., contracts > $50,000), **Then** matching contract activities are returned
4. **Given** user views contract timeline, **When** contract activities span multiple months/quarters, **Then** they can group by contract date to see distribution over time

---

### Edge Cases

- What happens when a user creates a contract activity without entering a contract date? System should allow creation but mark contract date as optional with warning prompt if left blank.
- What happens when a user enters a contract value of zero or negative amount? System should validate that contract value must be a positive number and show validation error.
- How does system handle very large contract values (e.g., multi-million dollar contracts)? System should support currency values up to 999,999,999.99 with appropriate number formatting and storage precision.
- What happens when a user enters a contract date in the past? System should allow past dates (for recording historical contracts) but may show a warning if date is more than 1 year old.
- How does system display contract values in different currencies? System should use the default CRM currency setting and format values with appropriate currency symbol and decimal precision.
- What happens when sorting/filtering activities and some contract activities have missing contract dates or values? Activities with missing values should appear at the end of sorted lists or be excluded from value-based filters.
- How does system handle contract activities linked to deleted deals/customers? Contract activities should retain their contract date and value data even if the related entity is deleted (orphaned records).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add "contract" as a valid activity type to the database schema (ActivityType ENUM)
- **FR-002**: System MUST add two new fields to contract activities: `ContractDate` (date field) and `ContractValue` (decimal/currency field)
- **FR-003**: System MUST support creating activities with type "contract" and capturing contract date and contract value through the activity creation interface
- **FR-004**: System MUST validate that contract value is a positive number (greater than zero) when entered
- **FR-005**: System MUST display contract activities with a distinct icon (📄 document icon) and color scheme in activity feeds and lists
- **FR-006**: System MUST include "contract" in the ACTIVITY_TYPES constant with label "📄 Contract"
- **FR-007**: System MUST add "contract" to the ACTIVITY_CATEGORIES constant for filtering and categorization
- **FR-008**: Backend DTO (ActivityResponse) MUST include properties for `ContractDate` and `ContractValue` that are populated when ActivityType equals "contract"
- **FR-009**: Frontend activity forms MUST display contract date and contract value input fields when "Contract" activity type is selected
- **FR-010**: System MUST format contract value with appropriate currency symbol and decimal precision (e.g., $1,234.56) in all display views
- **FR-011**: System MUST allow filtering activities by contract date range (from date to date)
- **FR-012**: System MUST allow sorting activities by contract value (ascending/descending)
- **FR-013**: System MUST display contract date and contract value in activity list/feed summary views for contract activities
- **FR-014**: System MUST calculate and display total contract value when viewing contract activities grouped by customer, lead, or deal
- **FR-015**: System MUST include contract date and contract value as exportable columns in activity reports
- **FR-016**: Contract activities MUST support all standard activity fields: subject, body, due date, status, priority, assigned user, related entity (customer/lead/deal) in addition to contract-specific fields
- **FR-017**: System MUST persist contract date and contract value consistently across all layers (database, backend API, frontend UI)
- **FR-018**: System MUST allow contract date field to accept past, present, and future dates without restriction
- **FR-019**: System MUST store contract value with sufficient precision to support large amounts (up to 999,999,999.99)
- **FR-020**: System MUST show validation error immediately when user enters zero, negative, or non-numeric contract value

### Key Entities *(include if feature involves data)*

- **Activity**: Existing entity being extended with new "contract" type and additional contract-specific fields. Represents all user interactions and events tracked in the CRM system. Key attributes include activity type (email, call, meeting, task, note, **contract**), subject, body, timestamps, status, priority, relationships to customers/leads/deals, and for contract activities specifically: **contract date** (date when contract was signed/executed) and **contract value** (monetary value of the contract in default CRM currency).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create contract activities with contract date and value in under 45 seconds
- **SC-002**: Contract value displays with correct currency formatting (symbol, decimals, thousands separators) in 100% of views
- **SC-003**: Users can filter contract activities by date range, returning results in under 2 seconds
- **SC-004**: Users can sort contract activities by value, with correct ordering in under 2 seconds
- **SC-005**: Total contract value calculations for customers/deals are accurate to the cent (100% accuracy)
- **SC-006**: Contract date and value fields validate immediately (within 500ms) when user enters invalid data
- **SC-007**: Exported contract activity reports include contract date and value columns with 100% data completeness for activities that have these fields populated
- **SC-008**: Contract activities display date and value prominently in activity feed, visible without requiring additional clicks or expansions

## Assumptions

- **A-001**: Contract activities follow the same creation, editing, and deletion workflows as existing activity types
- **A-002**: Contract date and contract value fields are optional (can be left blank) but recommended for complete tracking
- **A-003**: Contract value uses the default CRM currency setting (no multi-currency support in initial version)
- **A-004**: Contract date represents the date the contract was signed/executed, not the contract start date or end date (those can be added in future enhancements)
- **A-005**: The visual styling for contract activities will use document icon (📄) with purple/secondary color scheme to differentiate from other types
- **A-006**: The feature will be implemented across all three layers (database, backend API, frontend) in a single deployment
- **A-007**: Existing activity filtering, search, and reporting functionality will automatically support contract date and value fields once implemented
- **A-008**: No data migration is needed since this is a new activity type (no existing activities to convert)
- **A-009**: Contract value calculations (totals, aggregates) will be performed on-demand in the backend, not pre-calculated
- **A-010**: The contract date and value fields will be stored in the same `crm_activity` table, not a separate contract-specific table

## Constraints

- **C-001**: Implementation must maintain backward compatibility with existing activity types and not break current activity functionality
- **C-002**: Database schema changes (adding "contract" to ENUM and new date/value columns) require coordinated deployment with backend and frontend updates
- **C-003**: Must follow existing Clean Architecture patterns: database → domain entity → DTO → API → frontend constants → UI components
- **C-004**: Icon and color choices must align with existing Material-UI theme and not conflict with other activity type styling
- **C-005**: Contract value field must use DECIMAL data type with sufficient precision (e.g., DECIMAL(12,2)) to prevent rounding errors
- **C-006**: Contract date and value fields should only be visible/editable when activity type is "Contract" to avoid user confusion
- **C-007**: Currency formatting must be consistent across all views and match the CRM's global currency settings

## Dependencies

- **D-001**: Database migration capability to alter ActivityType ENUM and add new columns (`contract_date` DATE, `contract_value` DECIMAL(12,2)) in `crm_activity` table
- **D-002**: Backend API deployment to include updated Activity entity, ActivityResponse DTO with ContractDate and ContractValue properties, and validation logic
- **D-003**: Frontend deployment with updated constants.js, activity form components to include contract date/value inputs, and ActivityFeed.jsx component to display contract data
- **D-004**: Currency formatting utility function in frontend to consistently format contract values across all views
- **D-005**: No external API or third-party dependencies required
- **D-006**: Date picker component (likely already available in Material-UI) for contract date input

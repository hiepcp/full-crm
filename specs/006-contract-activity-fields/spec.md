# Feature Specification: Contract Activity Fields Enhancement

**Feature Branch**: `006-contract-activity-fields`
**Created**: 2025-12-25
**Status**: Draft
**Input**: User description: "activity type contract thêm (ngày hợp đồng, giá trị hợp đồng) để phục vụ việc thiết lập goal sau này"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record Contract Date (Priority: P1)

When a user creates or updates a contract activity, they need to capture the contract date to track when the contract was signed or becomes effective. This is essential for establishing timelines, tracking contract anniversaries, and setting future goals based on contract milestones.

**Why this priority**: Contract date is fundamental data that affects all downstream goal tracking and reporting. Without it, the system cannot establish meaningful timelines for goal setting.

**Independent Test**: Can be fully tested by creating a contract activity with a contract date and verifying the date is saved and displayed correctly. Delivers immediate value by enabling basic contract timeline tracking.

**Acceptance Scenarios**:

1. **Given** a user is creating a new contract activity, **When** they select a contract date from the date picker, **Then** the contract date is saved with the activity
2. **Given** a user is viewing an existing contract activity, **When** they access the activity details, **Then** the contract date is displayed in a readable format
3. **Given** a user is editing an existing contract activity, **When** they update the contract date, **Then** the new date is saved and reflected in the activity details
4. **Given** a user has not entered a contract date, **When** they save the contract activity, **Then** the activity is saved without a contract date (field is optional)

---

### User Story 2 - Record Contract Value (Priority: P1)

When a user creates or updates a contract activity, they need to capture the contract value to track the financial worth of the contract. This is critical for revenue forecasting, goal setting based on revenue targets, and analyzing contract performance.

**Why this priority**: Contract value is the primary financial metric needed for goal establishment and is equally critical as contract date for meaningful goal tracking.

**Independent Test**: Can be fully tested by creating a contract activity with a contract value and verifying the value is saved, displayed, and formatted correctly. Delivers immediate value by enabling financial tracking and reporting.

**Acceptance Scenarios**:

1. **Given** a user is creating a new contract activity, **When** they enter a contract value, **Then** the value is saved with the activity
2. **Given** a user is viewing an existing contract activity, **When** they access the activity details, **Then** the contract value is displayed in the appropriate currency format
3. **Given** a user is editing an existing contract activity, **When** they update the contract value, **Then** the new value is saved and reflected in the activity details
4. **Given** a user enters a negative or non-numeric contract value, **When** they attempt to save, **Then** the system displays a validation error
5. **Given** a user has not entered a contract value, **When** they save the contract activity, **Then** the activity is saved without a contract value (field is optional)

---

### User Story 3 - View Contract Activity History with Financial Timeline (Priority: P2)

When a user reviews contract activities, they need to see both the contract date and value together to understand the financial timeline of their contracts. This helps in analyzing patterns, tracking progress toward goals, and making informed decisions.

**Why this priority**: While individual fields are P1, the combined view enhances usability but is not strictly required for basic functionality.

**Independent Test**: Can be fully tested by viewing a list of contract activities and verifying that both contract date and value are visible in the list/detail views. Delivers value by providing comprehensive contract overview.

**Acceptance Scenarios**:

1. **Given** a user is viewing a list of contract activities, **When** they scan the list, **Then** both contract date and contract value are visible for each activity
2. **Given** a user is viewing contract activity details, **When** they review the activity, **Then** contract date and value are prominently displayed together
3. **Given** a user is filtering or sorting contract activities, **When** they apply filters, **Then** they can filter by date range and/or value range

---

### User Story 4 - Use Contract Data for Goal Setting (Priority: P3)

When a user sets up goals in the future, they will use historical contract dates and values to establish realistic targets, track performance against contracts, and measure achievement over time.

**Why this priority**: This is the ultimate purpose stated in the requirement, but it depends on having the data captured first (P1 stories) and may involve future goal-setting functionality.

**Independent Test**: Can be tested by verifying that contract date and value data are accessible via the system for goal-related calculations and reporting. Delivers value by enabling data-driven goal setting.

**Acceptance Scenarios**:

1. **Given** contract activities have dates and values recorded, **When** a user accesses goal-setting features, **Then** they can view aggregated contract data for a specified period
2. **Given** a user is analyzing contract performance, **When** they generate reports, **Then** contract dates and values are available for trend analysis

---

### Edge Cases

- What happens when a contract date is in the past (historical contract entry)?
- What happens when a contract date is far in the future?
- How does the system handle very large contract values (millions, billions)?
- How does the system handle contracts with value of zero (framework agreements, pro bono work)?
- What happens when a user edits a contract activity that already has associated goals?
- How are contract values displayed for different currency formats (decimal separators, currency symbols)?
- What happens when contract activities are filtered by date range and some activities have no contract date?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to enter a contract date when creating or editing a contract activity
- **FR-002**: System MUST allow users to enter a contract value when creating or editing a contract activity
- **FR-003**: System MUST allow contract date and contract value fields to be optional (not mandatory)
- **FR-004**: System MUST validate that contract value, when provided, is a non-negative numeric value
- **FR-005**: System MUST display contract date in a consistent, user-friendly date format
- **FR-006**: System MUST display contract value with appropriate currency formatting (thousands separators, decimal places)
- **FR-007**: System MUST persist contract date and contract value with the contract activity record
- **FR-008**: System MUST allow users to update contract date and contract value after initial creation
- **FR-009**: System MUST display contract date and contract value in activity detail views
- **FR-010**: System MUST include contract date and contract value in activity list views where contract activities are shown
- **FR-011**: System MUST allow users to filter contract activities by date range
- **FR-012**: System MUST allow users to filter contract activities by value range
- **FR-013**: System MUST make contract date and contract value data accessible for future goal-setting features

### Key Entities

- **Contract Activity**: Represents a contract-type activity within the CRM system. Key attributes include:
  - Activity type (contract)
  - Contract date (new field) - the date when the contract was signed or becomes effective
  - Contract value (new field) - the financial value of the contract
  - Standard activity attributes (name, description, status, owner, etc.)
  - Relationships to customers, deals, or other CRM entities

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add contract date and contract value to a contract activity in under 30 seconds
- **SC-002**: 100% of contract date and value entries are persisted and retrievable without data loss
- **SC-003**: Contract values are displayed with correct formatting (currency symbols, thousands separators) in all views
- **SC-004**: Users can successfully filter contract activities by date range with results appearing in under 2 seconds
- **SC-005**: Contract date and value data is accessible for reporting and goal-setting workflows
- **SC-006**: System prevents saving of invalid contract values (negative numbers, non-numeric input) with clear validation messages
- **SC-007**: Existing contract activities can be updated with contract date and value without affecting other activity data

## Assumptions

- The system already has an activity module with different activity types, including "contract" type
- Users have appropriate permissions to create and edit contract activities
- The system uses a standard currency (or the currency is determined by existing business logic)
- Date format preferences are handled by existing system settings or user locale
- The feature integrates with existing activity data model and can accommodate additional fields
- Future goal-setting functionality will be built as a separate feature and will consume this contract data
- Contract date represents a single date (not a date range with start/end dates)
- Contract value represents total contract value (not recurring values or payment schedules)

## Dependencies

- Existing activity management functionality must support adding custom fields to activity types
- Database schema must support adding two new fields (contract_date and contract_value) to the activities table
- Frontend activity forms must be extensible to accommodate new fields
- Existing validation framework should support the validation rules for contract value

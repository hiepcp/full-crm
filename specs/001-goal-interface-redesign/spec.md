# Feature Specification: Goal Interface Redesign

**Feature Branch**: `001-goal-interface-redesign`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "phân tích và thiết kế lại giao diện goal"

## Clarifications

### Session 2025-12-23

- Q: Can users view other users' individual goals, or are individual goals private? → A: All goals are fully visible to all users regardless of ownership level
- Q: How should the system behave when automatic progress calculation fails? → A: Show last successful calculated value with a warning indicator; allow manual override with justification
- Q: How frequently should the system capture progress snapshots for historical tracking? → A: Snapshot on every significant change (progress update ≥1%, status change, manual edit) plus once daily at midnight
- Q: What specific events and data should be captured in the audit log? → A: Log all CRUD operations, progress updates (with before/after values), status changes, ownership changes, and data source calculation events with timestamp, user ID, and change details
- Q: Should the system support bulk operations on goals? → A: Support bulk delete and bulk status change (active/cancelled) with confirmation dialog; limit to 50 goals per operation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Goal Progress Tracking Accuracy (Priority: P1)

Sales managers and individual contributors need to see accurate goal progress that automatically updates based on actual CRM activities (deals closed, activities completed, revenue generated) rather than manual entry, ensuring trust in the goal tracking system and reducing administrative overhead.

**Why this priority**: This is the foundation of the goal system - without accurate progress tracking, users cannot rely on goals for performance management. Currently, progress is manually entered and doesn't reflect actual CRM data, creating a critical disconnect.

**Independent Test**: Can be fully tested by creating a revenue goal, closing a deal, and verifying the goal progress automatically updates to reflect the new revenue amount. Delivers immediate value by eliminating manual progress updates.

**Acceptance Scenarios**:

1. **Given** a user has a revenue goal of $100,000, **When** they close a deal worth $25,000, **Then** the goal progress automatically updates to show 25% completion and displays the current value of $25,000
2. **Given** a sales team has a "deals closed" goal of 50 deals, **When** any team member marks a deal as "Close/Won", **Then** the team goal increments by 1 and shows updated progress percentage
3. **Given** a user has an activities goal of 100 calls this month, **When** they log 20 call activities, **Then** the goal shows 20% progress with 20/100 activities completed
4. **Given** multiple goals track the same metric (e.g., revenue), **When** a deal is closed, **Then** all applicable goals update simultaneously and display consistent values

---

### User Story 2 - Visual Progress Dashboard (Priority: P1)

Users need a clear, at-a-glance visual dashboard showing their goals organized by priority and urgency, with intuitive progress indicators, status badges, and trend analytics, enabling quick assessment of performance without navigating through multiple screens.

**Why this priority**: The current UI groups goals by owner type (individual/team/company) but doesn't prioritize by urgency or importance. Users need to quickly identify at-risk goals and focus areas. This directly impacts daily usage and decision-making.

**Independent Test**: Can be fully tested by creating goals with various due dates and progress levels, then verifying the dashboard displays them in order of urgency with appropriate visual warnings. Delivers value through improved visibility and actionable insights.

**Acceptance Scenarios**:

1. **Given** a user has 5 active goals, **When** they view the goals dashboard, **Then** goals are sorted with overdue goals first (red alert), followed by goals due within 7 days (yellow warning), then remaining goals by end date
2. **Given** a goal is 90% complete with 2 days remaining, **When** user views the dashboard, **Then** the goal displays a "Almost There" badge and shows a projected completion date based on recent progress trend
3. **Given** a goal has not been updated in 14 days, **When** user views the dashboard, **Then** the goal displays a "Needs Attention" indicator prompting the user to review
4. **Given** a team goal, **When** a team member views the dashboard, **Then** they see individual contributor breakdowns showing each member's contribution to the team goal

---

### User Story 3 - Goal Templates and Quick Creation (Priority: P2)

Users need predefined goal templates for common scenarios (monthly revenue, quarterly deals, annual performance) with smart defaults and quick creation flows, reducing setup time from 5+ minutes to under 30 seconds while ensuring consistency across the organization.

**Why this priority**: While not as critical as accurate tracking, simplified goal creation directly impacts adoption. The current two-step dialog with manual configuration is time-consuming and error-prone.

**Independent Test**: Can be fully tested by selecting a template, customizing target value and timeframe, and creating a goal in under 30 seconds with all required fields pre-populated correctly.

**Acceptance Scenarios**:

1. **Given** a user clicks "Create Goal", **When** they select the "Monthly Revenue" template, **Then** the form pre-populates with type=revenue, timeframe=this_month, status=active, start/end dates for current month, and prompts only for target value
2. **Given** a manager creates a team goal from template, **When** they save the goal, **Then** team members receive notifications and the goal appears on their dashboards automatically
3. **Given** a user creates a recurring goal (e.g., weekly tasks), **When** the timeframe ends, **Then** the system automatically creates the next period's goal with the same parameters and archives the completed one
4. **Given** organizational goal templates exist, **When** a new user views templates, **Then** they see both system templates and custom templates created by their manager

---

### User Story 4 - Goal Hierarchy and Alignment (Priority: P2)

Managers need to cascade company goals down to team and individual levels, creating a clear hierarchy that shows how individual contributions ladder up to organizational objectives, ensuring alignment and transparency across the organization.

**Why this priority**: Strategic alignment is essential for larger teams but can be implemented after basic tracking and visualization. This enables OKR-style goal management.

**Independent Test**: Can be fully tested by creating a company-level revenue goal, cascading it to team goals, then to individual goals, and verifying the hierarchy displays correctly with progress rolling up from individuals to company level.

**Acceptance Scenarios**:

1. **Given** a company goal of $1M revenue, **When** a manager creates 4 team goals totaling $1M, **Then** each team goal displays as a "child" of the company goal and contributes to its progress
2. **Given** a team goal of 50 deals, **When** individual team members have goals totaling 50 deals, **Then** the team goal progress reflects the sum of individual progress
3. **Given** a nested goal hierarchy, **When** any level updates, **Then** parent goals recalculate progress automatically and display a breakdown showing contribution by child goal
4. **Given** a user views their individual goal, **When** it's linked to a parent goal, **Then** they see context showing how their goal supports the team/company objective

---

### User Story 5 - Performance Analytics and Insights (Priority: P3)

Users need actionable insights from historical goal data, including completion rate trends, average time-to-completion, velocity patterns, and predictive forecasts, enabling data-driven decisions about goal setting and resource allocation.

**Why this priority**: Advanced analytics add significant value but require substantial historical data and sophisticated calculations. Can be implemented after core tracking and visualization are stable.

**Independent Test**: Can be fully tested with 3+ months of goal history by viewing the analytics dashboard and verifying trends, completion rates, and forecasts display with accurate calculations.

**Acceptance Scenarios**:

1. **Given** a user has 12 months of goal history, **When** they view the analytics page, **Then** they see monthly completion rate trends, average progress velocity, and comparison to team/company averages
2. **Given** a user is 60% complete on a goal with 40% of time remaining, **When** they view the goal details, **Then** the system displays a "On Track" status with projected completion 5 days before deadline based on current velocity
3. **Given** a manager views team analytics, **When** filtering by goal type, **Then** they see which goal types have highest completion rates and which consistently miss targets
4. **Given** insufficient historical data (< 30 days), **When** viewing analytics, **Then** the system displays an informative message explaining that insights will improve with more data

---

### Edge Cases

- What happens when automatic progress calculation fails (e.g., CRM database timeout, service unavailable)? System displays last successful calculated value with a warning indicator and allows manual override with required justification note.
- What happens when a goal's linked data source is deleted (e.g., a deal counted toward progress is deleted)? System should recalculate progress and log the change in an audit trail.
- How does the system handle timezone differences when calculating "this month" or "this week" goals? Use the user's profile timezone for all date calculations and clearly display the timezone in goal details.
- What happens when a user with individual goals changes teams? Goals should remain assigned to the individual but optionally allow reassignment or archiving based on organizational policy.
- How does the system handle goals with target value = 0 (e.g., minimize support tickets)? Support inverse goals where progress decreases the metric and 0 represents 100% completion.
- What happens when multiple users simultaneously update the same team goal progress? Use optimistic locking with last-write-wins, display conflict warnings, and maintain audit log of all changes.
- How does the system handle goals spanning multiple timeframes (e.g., 6-month goal crossing quarters)? Support custom date ranges and aggregate progress across natural timeframe boundaries for reporting.
- What happens when a recurring goal's period overlaps with holidays or company shutdowns? Allow users to skip periods or adjust target values for specific instances of recurring goals.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically calculate goal progress based on underlying CRM data (deals closed, revenue generated, activities completed, tasks finished); when calculation fails, display last successful calculated value with a warning indicator and allow manual override with justification
- **FR-002**: System MUST support goal types that map to CRM entities: revenue (sum of deal amounts in Close/Won status), deals (count of deals in Close/Won status), activities (count of completed activities), tasks (count of completed tasks), and performance (custom calculated metrics)
- **FR-003**: System MUST display goals in a prioritized dashboard view with visual indicators for status (on-track/at-risk/overdue), urgency (days remaining), and progress percentage
- **FR-004**: System MUST provide goal templates for common scenarios with pre-configured settings that users can customize with target values and timeframes
- **FR-005**: System MUST support three ownership levels (individual, team, company) with appropriate access controls where individuals can create/edit their own goals, managers can create/edit team goals, and admins can create/edit company goals; all goals are visible to all users regardless of ownership level
- **FR-006**: System MUST allow cascading goals where company goals can have child team goals, and team goals can have child individual goals, with progress rolling up from children to parents
- **FR-007**: System MUST support recurring goals that automatically create new instances based on timeframe (weekly, monthly, quarterly, annually) and archive completed instances
- **FR-008**: System MUST track goal progress history with timestamps, enabling trend analysis and velocity calculations (e.g., progress per day/week); snapshots captured on every significant change (progress update ≥1%, status change, manual edit) plus once daily at midnight
- **FR-009**: System MUST display goal completion forecasts based on current progress velocity and remaining time, with visual indicators for on-track/ahead/behind status
- **FR-010**: System MUST notify relevant users when goals are created, assigned, completed, at-risk (< 50% progress with < 50% time remaining), or overdue
- **FR-011**: System MUST provide filtering and search capabilities by owner type, status, type, timeframe, date ranges, and progress ranges with combined filter support
- **FR-012**: System MUST display team goal breakdowns showing individual contributor contributions to the team goal total
- **FR-013**: System MUST maintain an audit log of all goal changes including CRUD operations, progress updates (with before/after values), status changes, ownership changes, and data source calculation events; each log entry captures timestamp, user ID, and change details
- **FR-014**: System MUST support both percentage-based progress (0-100%) and value-based progress (current value / target value) with automatic conversion and display
- **FR-015**: System MUST calculate and display aggregate metrics including total goals, completion rate, average progress, total target value, and total achieved value grouped by owner type, timeframe, or goal type
- **FR-016**: Users MUST be able to export goal data and reports in common formats (CSV, Excel, PDF) with selected filters and date ranges
- **FR-017**: System MUST allow users to add contextual notes and comments to goals for collaboration and context preservation
- **FR-018**: System MUST support manual progress adjustments with required justification notes for scenarios where automatic calculation doesn't apply
- **FR-019**: System MUST display goals with visual progress bars, trend sparklines (showing progress over time), and status badges (active/completed/cancelled/at-risk/overdue)
- **FR-020**: System MUST respect user timezone preferences for all date/time calculations and displays in goal timeframes and reporting
- **FR-021**: System MUST support bulk operations for delete and status change (active/cancelled) with confirmation dialog; operations limited to 50 goals maximum per batch

### Key Entities

- **Goal**: Represents a measurable objective with target value, current progress, ownership, timeframe, and status; links to parent goals for hierarchies and tracks calculation source (manual vs. auto-calculated from CRM data)
- **Goal Progress History**: Captures timestamped snapshots of goal progress enabling trend analysis, velocity calculations, and audit trails; includes source of change (user manual entry, automatic calculation, system adjustment); snapshots created on significant changes (≥1% progress update, status change, manual edit) and daily at midnight
- **Goal Template**: Pre-configured goal settings for common scenarios including default type, timeframe pattern, suggested target values, and description templates; can be organizational or user-specific
- **Goal Notification**: Alerts and updates sent to users about goal events (creation, assignment, milestone achievement, at-risk status, completion); includes notification preferences and delivery channels
- **Goal Comment**: User-generated notes and discussions attached to specific goals for collaboration, context sharing, and progress explanations
- **Goal Hierarchy Link**: Relationships between parent and child goals enabling cascading objectives and roll-up progress calculations from individuals to teams to company
- **Goal Data Source**: Configuration defining how goal progress is calculated from CRM entities (e.g., revenue goals sum deal amounts where status='Close/Won' and close_date within goal timeframe)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new goal from template in under 30 seconds (currently 2-5 minutes with manual configuration)
- **SC-002**: 90% of revenue and deal goals display accurate progress without manual intervention, updating within 5 minutes of underlying data changes
- **SC-003**: Users report 80% satisfaction with goal visibility and dashboard clarity in post-implementation surveys (baseline to be established)
- **SC-004**: Goal completion rate increases by 25% within 3 months of implementation due to improved visibility and automated tracking
- **SC-005**: Time spent on manual goal progress updates decreases by 90% as automatic calculation eliminates this administrative task
- **SC-006**: Dashboard page loads and displays all active goals with complete metrics in under 2 seconds for users with up to 50 active goals
- **SC-007**: 95% of users can correctly identify their most urgent goal within 5 seconds of viewing the dashboard (based on visual priority indicators)
- **SC-008**: Team goal alignment increases with 70% of team members having individual goals linked to at least one team or company goal within 2 months
- **SC-009**: Goal-related support tickets decrease by 60% due to improved UI clarity and automated calculations
- **SC-010**: Users create 50% more goals per person on average due to reduced creation friction and increased confidence in tracking accuracy

## Assumptions

- Users are familiar with basic CRM concepts (deals, activities, customers, revenue tracking)
- The existing CRM database contains deals, activities, and related entities that can be queried for goal progress calculations
- Users have reliable internet connectivity for real-time goal updates and dashboard loading
- Managers and admins have clear organizational hierarchies defined (team membership, reporting structures)
- The system has access to user timezone preferences from user profile settings
- Historical goal data exists or will accumulate over time for meaningful analytics (minimum 30 days for trend analysis)
- Users prefer visual dashboards over tabular data listings for goal tracking
- The organization values OKR-style goal alignment and cascading objectives
- Email and in-app notifications are acceptable delivery mechanisms for goal alerts
- Standard business timeframes (week starts Monday, quarters follow calendar year) are acceptable defaults with customization options

## Out of Scope

- Integration with external goal-setting frameworks beyond OKRs (e.g., Balanced Scorecard, SMART goals framework)
- Gamification features (badges, leaderboards beyond basic metrics, point systems)
- Mobile-specific UI optimizations (responsive design is in scope, but native mobile apps are not)
- AI-powered goal recommendations or predictive target setting
- Real-time collaboration features (multiple users editing same goal simultaneously with live updates)
- Integration with external BI tools (Tableau, Power BI, etc.) beyond standard export formats
- Custom calculation engines allowing users to define complex formulas for progress (predefined calculations only)
- Goal approval workflows requiring manager sign-off before activation
- Compensation or incentive management tied to goal achievement
- Multi-language support (English only in initial release)

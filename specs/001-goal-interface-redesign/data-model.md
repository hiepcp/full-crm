# Data Model: Goal Interface Redesign

**Feature**: Goal Interface Redesign
**Branch**: `001-goal-interface-redesign`
**Date**: 2025-12-23

## Overview

This document defines the data model for the redesigned Goal interface, including new entities and modifications to existing entities. All entities follow the existing CRM database conventions: `snake_case` table names, MySQL dialect, Dapper with SimpleCRUD.

## Database Tables

### 1. `crm_goal` (Extended - Existing Table)

**Purpose**: Represents a measurable objective with target value, current progress, ownership, timeframe, and status.

**Schema Changes**:

| Column | Type | Constraints | Description | Change |
|--------|------|-------------|-------------|--------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier | EXISTING |
| name | VARCHAR(255) | NOT NULL | Goal name | EXISTING |
| description | TEXT | NULL | Goal description | EXISTING |
| target_value | DECIMAL(18,2) | NOT NULL | Target value to achieve | EXISTING |
| progress | DECIMAL(18,2) | DEFAULT 0 | Current progress value (NOT percentage) | EXISTING |
| start_date | DATE | NULL | Goal start date | EXISTING |
| end_date | DATE | NULL | Goal end date | EXISTING |
| owner_type | ENUM('individual', 'team', 'company') | NOT NULL | Ownership level | EXISTING |
| owner_id | INT | NULL | FK to crm_user (only for individual goals) | EXISTING |
| type | ENUM('revenue', 'deals', 'activities', 'tasks', 'performance') | NOT NULL | Goal type | EXISTING |
| timeframe | ENUM('this_week', 'this_month', 'this_quarter', 'this_year', 'custom') | NOT NULL | Time period | EXISTING |
| recurring | BOOLEAN | DEFAULT FALSE | Auto-create next instance | EXISTING |
| status | ENUM('draft', 'active', 'completed', 'cancelled') | NOT NULL | Current status | EXISTING |
| **parent_goal_id** | **INT** | **NULL, FK to crm_goal** | **Parent goal for hierarchy** | **NEW** |
| **calculation_source** | **ENUM('manual', 'auto_calculated')** | **DEFAULT 'manual'** | **How progress is updated** | **NEW** |
| **last_calculated_at** | **DATETIME** | **NULL** | **Last auto-calculation timestamp** | **NEW** |
| **calculation_failed** | **BOOLEAN** | **DEFAULT FALSE** | **Indicates calculation failure** | **NEW** |
| **manual_override_reason** | **TEXT** | **NULL** | **Justification for manual override (FR-018)** | **NEW** |
| created_by | INT | FK to crm_user | User who created | EXISTING |
| created_on | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp | EXISTING |
| updated_by | INT | FK to crm_user | Last user who updated | EXISTING |
| updated_on | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp | EXISTING |

**Indexes** (NEW/MODIFIED):
- `idx_parent_goal_id` on `parent_goal_id` (NEW - for hierarchy queries)
- `idx_calculation_source` on `calculation_source` (NEW - for filtering auto-calculated goals)
- `idx_calculation_failed` on `calculation_failed` (NEW - for finding failed calculations)
- Existing indexes remain: name, owner, type, timeframe, status, dates, progress

**Constraints**:
- `fk_parent_goal` FOREIGN KEY (parent_goal_id) REFERENCES crm_goal(id) ON DELETE SET NULL
- Check constraint: `calculation_source='auto_calculated'` → `last_calculated_at` NOT NULL (enforced at application layer)
- Check constraint: `calculation_failed=TRUE` → `manual_override_reason` NOT NULL when manual override (enforced at application layer)

---

### 2. `crm_goal_progress_history` (NEW)

**Purpose**: Captures timestamped snapshots of goal progress for trend analysis, velocity calculations, and audit trails.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| goal_id | INT | NOT NULL, FK to crm_goal | Associated goal |
| progress_value | DECIMAL(18,2) | NOT NULL | Progress at snapshot time |
| target_value | DECIMAL(18,2) | NOT NULL | Target at snapshot time (may change) |
| progress_percentage | DECIMAL(5,2) | NOT NULL | Calculated percentage (progress/target * 100) |
| snapshot_source | ENUM('significant_change', 'daily_snapshot', 'manual_adjustment', 'status_change') | NOT NULL | What triggered snapshot |
| snapshot_timestamp | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When snapshot was taken |
| created_by | INT | NULL, FK to crm_user | User if manual adjustment, NULL if auto |
| notes | TEXT | NULL | Optional notes (e.g., why manual adjustment) |

**Indexes**:
- `idx_goal_timestamp` on `(goal_id, snapshot_timestamp DESC)` (for time-series queries)
- `idx_snapshot_source` on `snapshot_source` (for filtering by source type)

**Constraints**:
- `fk_goal_progress_history` FOREIGN KEY (goal_id) REFERENCES crm_goal(id) ON DELETE CASCADE
- Check constraint: `progress_percentage >= 0` AND `progress_percentage <= 200` (allow over-achievement)

**Notes**:
- Snapshot frequency per clarification #3: ≥1% progress change, status change, manual edit, plus daily at midnight
- Retention policy: Keep all snapshots (no auto-deletion) - archive old data manually if needed

---

### 3. `crm_goal_template` (NEW)

**Purpose**: Pre-configured goal settings for common scenarios (monthly revenue, quarterly deals, etc.) enabling quick goal creation.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Template display name (e.g., "Monthly Revenue Goal") |
| description | TEXT | NULL | Template description |
| goal_type | ENUM('revenue', 'deals', 'activities', 'tasks', 'performance') | NOT NULL | Default goal type |
| timeframe | ENUM('this_week', 'this_month', 'this_quarter', 'this_year', 'custom') | NOT NULL | Default timeframe |
| owner_type | ENUM('individual', 'team', 'company') | NOT NULL | Default ownership level |
| suggested_target_value | DECIMAL(18,2) | NULL | Suggested target (user can override) |
| recurring | BOOLEAN | DEFAULT FALSE | Default recurring setting |
| is_system_template | BOOLEAN | DEFAULT FALSE | TRUE for built-in templates, FALSE for custom |
| created_by | INT | NULL, FK to crm_user | User who created (NULL for system templates) |
| created_on | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_by | INT | NULL, FK to crm_user | Last user who updated |
| updated_on | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |
| is_active | BOOLEAN | DEFAULT TRUE | Soft delete flag |

**Indexes**:
- `idx_template_type` on `goal_type` (for filtering templates by type)
- `idx_is_system` on `is_system_template` (separate system vs custom templates)
- `idx_is_active` on `is_active` (filter active templates)

**Constraints**:
- UNIQUE constraint on `(name, created_by)` for custom templates (prevent duplicate names per user)
- System templates: `is_system_template=TRUE` → `created_by` IS NULL

**Sample System Templates**:
1. "Monthly Revenue Goal" (type=revenue, timeframe=this_month, owner_type=individual)
2. "Quarterly Deals Goal" (type=deals, timeframe=this_quarter, owner_type=team)
3. "Weekly Activity Goal" (type=activities, timeframe=this_week, owner_type=individual)

---

### 4. `crm_goal_hierarchy_link` (NEW)

**Purpose**: Explicitly tracks parent-child relationships between goals for hierarchical structures and roll-up calculations.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| parent_goal_id | INT | NOT NULL, FK to crm_goal | Parent goal |
| child_goal_id | INT | NOT NULL, FK to crm_goal | Child goal |
| contribution_weight | DECIMAL(5,2) | DEFAULT 1.0 | Weight for weighted average roll-up (future use) |
| created_on | DATETIME | DEFAULT CURRENT_TIMESTAMP | Link creation timestamp |
| created_by | INT | FK to crm_user | User who created link |

**Indexes**:
- `idx_parent` on `parent_goal_id` (query children of parent)
- `idx_child` on `child_goal_id` (query parent of child)
- UNIQUE constraint on `(parent_goal_id, child_goal_id)` (prevent duplicate links)

**Constraints**:
- `fk_hierarchy_parent` FOREIGN KEY (parent_goal_id) REFERENCES crm_goal(id) ON DELETE CASCADE
- `fk_hierarchy_child` FOREIGN KEY (child_goal_id) REFERENCES crm_goal(id) ON DELETE CASCADE
- Check constraint: `parent_goal_id != child_goal_id` (prevent self-reference)
- Application-layer validation: Prevent circular dependencies (A→B→C→A)

**Notes**:
- Alternative design considered: Just use `parent_goal_id` in `crm_goal` table
- Decision: Use separate link table for flexibility (e.g., future support for multiple parents, contribution weights)
- Current implementation: One parent per goal (enforced via unique constraint on child_goal_id)

---

### 5. `crm_goal_notification` (NEW)

**Purpose**: Stores notifications for goal events (creation, assignment, at-risk status, overdue) to be sent to users.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| goal_id | INT | NOT NULL, FK to crm_goal | Associated goal |
| recipient_user_id | INT | NOT NULL, FK to crm_user | User to notify |
| notification_type | ENUM('created', 'assigned', 'completed', 'at_risk', 'overdue', 'milestone') | NOT NULL | Event type |
| message | TEXT | NOT NULL | Notification message |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| sent_at | DATETIME | NULL | When notification was sent (NULL = pending) |
| created_on | DATETIME | DEFAULT CURRENT_TIMESTAMP | Notification creation timestamp |

**Indexes**:
- `idx_recipient_read` on `(recipient_user_id, is_read)` (query unread notifications)
- `idx_goal_type` on `(goal_id, notification_type)` (prevent duplicate notifications)
- `idx_sent_at` on `sent_at` (query pending notifications)

**Constraints**:
- `fk_notification_goal` FOREIGN KEY (goal_id) REFERENCES crm_goal(id) ON DELETE CASCADE
- `fk_notification_recipient` FOREIGN KEY (recipient_user_id) REFERENCES crm_user(id) ON DELETE CASCADE

**Notification Triggers** (FR-010):
- `created`: When goal is created
- `assigned`: When user is assigned as owner or linked to parent goal
- `completed`: When goal reaches 100% progress or status = completed
- `at_risk`: When progress < 50% and time remaining < 50% (checked by scheduled job)
- `overdue`: When end_date < NOW() and status != completed
- `milestone`: When goal reaches 25%, 50%, 75% progress

---

### 6. `crm_goal_comment` (NEW)

**Purpose**: User-generated notes and discussions attached to specific goals for collaboration and context sharing.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| goal_id | INT | NOT NULL, FK to crm_goal | Associated goal |
| comment_text | TEXT | NOT NULL | Comment content |
| created_by | INT | NOT NULL, FK to crm_user | User who created comment |
| created_on | DATETIME | DEFAULT CURRENT_TIMESTAMP | Comment timestamp |
| updated_on | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last edit timestamp |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete flag |

**Indexes**:
- `idx_goal_created` on `(goal_id, created_on DESC)` (query comments by goal, newest first)
- `idx_is_deleted` on `is_deleted` (filter active comments)

**Constraints**:
- `fk_comment_goal` FOREIGN KEY (goal_id) REFERENCES crm_goal(id) ON DELETE CASCADE
- `fk_comment_user` FOREIGN KEY (created_by) REFERENCES crm_user(id) ON DELETE SET NULL (preserve comment if user deleted)

**Notes**:
- No nested comments/replies in v1 (flat list)
- Future enhancement: Add parent_comment_id for threading

---

### 7. `crm_goal_audit_log` (NEW)

**Purpose**: Comprehensive audit trail of all goal changes for compliance, debugging, and troubleshooting.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| goal_id | INT | NULL, FK to crm_goal | Associated goal (NULL if goal deleted) |
| event_type | ENUM('create', 'update', 'delete', 'progress_update', 'status_change', 'ownership_change', 'calc_event', 'manual_override') | NOT NULL | Event classification |
| before_value | TEXT | NULL | JSON of state before change |
| after_value | TEXT | NULL | JSON of state after change |
| change_details | TEXT | NULL | JSON with additional context (e.g., which fields changed, reason) |
| user_id | INT | NULL, FK to crm_user | User who made change (NULL for system events) |
| event_timestamp | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When event occurred |
| ip_address | VARCHAR(45) | NULL | User IP address (if available) |
| user_agent | VARCHAR(500) | NULL | User agent string (if available) |

**Indexes**:
- `idx_goal_timestamp` on `(goal_id, event_timestamp DESC)` (query audit trail for goal)
- `idx_event_type` on `event_type` (filter by event type)
- `idx_user_timestamp` on `(user_id, event_timestamp DESC)` (query user actions)
- `idx_event_timestamp` on `event_timestamp` (time-based queries)

**Constraints**:
- `fk_audit_goal` FOREIGN KEY (goal_id) REFERENCES crm_goal(id) ON DELETE SET NULL (preserve audit if goal deleted)
- `fk_audit_user` FOREIGN KEY (user_id) REFERENCES crm_user(id) ON DELETE SET NULL

**Event Types** (per clarification #4):
- `create`: Goal created
- `update`: Any field updated
- `delete`: Goal deleted
- `progress_update`: Progress value changed (before/after values captured)
- `status_change`: Status field changed
- `ownership_change`: owner_type or owner_id changed
- `calc_event`: Auto-calculation executed (success or failure)
- `manual_override`: Manual progress adjustment with justification

**JSON Structure Examples**:

```json
// progress_update
{
  "before_value": "{\"progress\": 25000, \"percentage\": 25}",
  "after_value": "{\"progress\": 50000, \"percentage\": 50}",
  "change_details": "{\"source\": \"auto_calculated\", \"trigger\": \"deal_closed\", \"deal_id\": 12345}"
}

// calc_event (failure)
{
  "change_details": "{\"status\": \"failed\", \"error\": \"Database timeout\", \"query_duration_ms\": 5000}"
}

// manual_override
{
  "before_value": "{\"progress\": 50000}",
  "after_value": "{\"progress\": 55000}",
  "change_details": "{\"reason\": \"Included offline sales not in CRM\", \"justification_required\": true}"
}
```

---

## Entity Relationships

```text
crm_goal (1) ──< (N) crm_goal_progress_history
crm_goal (1) ──< (N) crm_goal_notification
crm_goal (1) ──< (N) crm_goal_comment
crm_goal (1) ──< (N) crm_goal_audit_log
crm_goal (1) ──< (N) crm_goal_hierarchy_link (as parent)
crm_goal (1) ──< (N) crm_goal_hierarchy_link (as child)
crm_goal (0..1) ──< (N) crm_goal (parent_goal_id - self-referencing)

crm_goal_template (1) ──< (N) crm_goal (not enforced by FK, logical relationship)

crm_user (1) ──< (N) crm_goal (owner_id, created_by, updated_by)
crm_user (1) ──< (N) crm_goal_notification (recipient_user_id)
crm_user (1) ──< (N) crm_goal_comment (created_by)
crm_user (1) ──< (N) crm_goal_audit_log (user_id)

// External relationships (not enforced by FK, handled in application logic)
crm_deal (1) ──< (N) goal_progress_calculation (revenue, deals types)
crm_activity (1) ──< (N) goal_progress_calculation (activities type)
crm_task (1) ──< (N) goal_progress_calculation (tasks type)
```

## Data Integrity Rules

1. **Hierarchy Constraints**:
   - A goal cannot be its own parent
   - Circular dependencies are prevented (A→B→C→A)
   - Deleting a parent goal sets `parent_goal_id = NULL` on children (orphans)
   - Application validates max hierarchy depth (e.g., 3 levels: company → team → individual)

2. **Progress Calculation Constraints**:
   - If `calculation_source = 'auto_calculated'`, `last_calculated_at` must not be NULL
   - If `calculation_failed = TRUE` and user performs manual override, `manual_override_reason` required
   - Progress snapshots created only when progress changes by ≥1% (except daily midnight snapshot)

3. **Soft Deletes**:
   - `crm_goal_template`: Use `is_active = FALSE` (soft delete)
   - `crm_goal_comment`: Use `is_deleted = TRUE` (soft delete)
   - `crm_goal`: Hard delete (cascade to history, notifications, comments, audit log)

4. **Audit Trail Requirements**:
   - Every change to `crm_goal` must create entry in `crm_goal_audit_log`
   - Bulk operations log each individual goal change (not one log for batch)
   - System events (auto-calculation, scheduled jobs) log with `user_id = NULL`

## Migration Strategy

### Phase 1: Schema Updates (Low Risk)
1. **Extend crm_goal table**:
   - Add new columns: `parent_goal_id`, `calculation_source`, `last_calculated_at`, `calculation_failed`, `manual_override_reason`
   - Add new indexes: `idx_parent_goal_id`, `idx_calculation_source`, `idx_calculation_failed`
   - Add foreign key constraint: `fk_parent_goal`
   - Default values: `calculation_source='manual'`, `calculation_failed=FALSE`, others NULL

2. **Create new tables**:
   - `crm_goal_progress_history` (empty, no existing data to migrate)
   - `crm_goal_template` (pre-populate with 3-5 system templates)
   - `crm_goal_hierarchy_link` (empty initially)
   - `crm_goal_notification` (empty initially)
   - `crm_goal_comment` (empty initially)
   - `crm_goal_audit_log` (empty initially)

### Phase 2: Data Backfill (Optional)
1. **Historical snapshots**: Create initial snapshot for all existing active goals in `crm_goal_progress_history`
2. **Audit log**: Optionally create initial "migration" entries for existing goals

### Phase 3: Deployment
1. Deploy schema changes during maintenance window (< 5 minutes expected downtime)
2. Run migration scripts to add system templates
3. Deploy new API code (backward compatible - new fields optional)
4. Enable background jobs after verification

## Performance Considerations

1. **Index Strategy**:
   - Composite indexes on frequently queried combinations: `(goal_id, snapshot_timestamp DESC)`
   - Covering indexes where possible (include commonly selected columns)
   - Monitor slow query log for missing indexes

2. **Query Optimization**:
   - Hierarchy queries: Use recursive CTEs or application-level iteration (avoid N+1)
   - Progress history: Limit query range (e.g., last 90 days for analytics)
   - Audit log: Archive old entries (> 1 year) to separate table

3. **Data Volume Estimates** (3 years, 1000 goals, 200 users):
   - `crm_goal`: 3,000 rows (1000 active + 2000 archived)
   - `crm_goal_progress_history`: ~3,000,000 rows (1000 goals × 2 snapshots/day × 1095 days)
   - `crm_goal_audit_log`: ~500,000 rows (estimating 150 events per goal lifecycle)
   - `crm_goal_notification`: ~100,000 rows (archivable after read)
   - `crm_goal_comment`: ~30,000 rows (average 10 comments per goal)

4. **Archival Strategy** (Future Enhancement):
   - Move progress history older than 2 years to archive table
   - Move read notifications older than 6 months to archive table
   - Move audit logs older than 3 years to archive table

## Validation Rules (Application Layer)

1. **Goal Entity**:
   - `target_value > 0` (cannot have zero or negative target)
   - `end_date >= start_date` (when both provided)
   - `status = 'active'` → `start_date`, `end_date`, `target_value` required
   - `owner_type = 'individual'` → `owner_id` required and > 0
   - `owner_type != 'individual'` → `owner_id` must be NULL
   - `calculation_source = 'auto_calculated'` AND `type = 'performance'` → Not allowed (performance type requires manual)

2. **Progress History**:
   - `progress_percentage = (progress_value / target_value) * 100` (calculated field)
   - Snapshot created only if progress changed by ≥1% OR source != 'significant_change'

3. **Hierarchy**:
   - Max depth: 3 levels (company → team → individual)
   - Circular dependency check before creating link
   - Parent and child must have compatible owner types (e.g., company parent can have team/individual children)

4. **Templates**:
   - System templates (`is_system_template = TRUE`) cannot be edited or deleted
   - Custom templates can only be edited by creator

5. **Bulk Operations** (FR-021):
   - Max 50 goals per bulk delete/status change operation
   - All goals in bulk must be owned or manageable by current user

## Testing Data Seeds

Sample data for development/testing:

1. **System Templates** (3):
   - Monthly Revenue Goal (individual, revenue, this_month)
   - Quarterly Deals Goal (team, deals, this_quarter)
   - Weekly Activity Goal (individual, activities, this_week)

2. **Sample Goals** (10):
   - 3 company goals (revenue, deals, performance)
   - 4 team goals (linked to 2 different company goals)
   - 3 individual goals (linked to team goals)
   - Mix of active, completed, at-risk statuses

3. **Sample Progress History** (50 entries):
   - 5 snapshots per sample goal
   - Mix of significant_change, daily_snapshot, manual_adjustment sources

4. **Sample Hierarchy** (3 trees):
   - Company Goal 1 → Team Goal 1 → Individual Goal 1, Individual Goal 2
   - Company Goal 1 → Team Goal 2 → Individual Goal 3
   - Company Goal 2 → Team Goal 3 (no individual goals)

## References

- FR-001 to FR-021: Functional requirements from spec.md
- Clarification #3: Snapshot frequency (≥1% change + daily midnight)
- Clarification #4: Audit log scope (all CRUD, progress updates, status changes, calc events)
- Constitution Principle V: Observability & Audit Trail
- Existing pattern: `pipeline_logs` table for deal stage changes


# Research & Design Decisions: Goal Interface Redesign

**Feature**: Goal Interface Redesign
**Branch**: `001-goal-interface-redesign`
**Date**: 2025-12-23

## Overview

This document captures research findings and design decisions made during the planning phase for redesigning the Goal interface. All decisions align with the existing CRM architecture and constitution principles.

---

## 1. Auto-Calculation Pattern for Goal Progress

### Research Question
How should the system automatically calculate goal progress from underlying CRM data (deals, activities, revenue) while handling performance, reliability, and failure scenarios?

### Options Considered

1. **Real-time event-driven**: Listen to CRM entity changes (deals closed, activities completed) and immediately recalculate affected goals
2. **Scheduled batch processing**: Run periodic jobs (every 5-15 minutes) to query CRM data and recalculate all auto-calculated goals
3. **Hybrid approach**: Event triggers for immediate updates + scheduled job as fallback/reconciliation
4. **On-demand calculation**: Calculate progress only when goal is viewed (lazy loading)

### Decision: **Hybrid Approach (Event-Driven + Scheduled Fallback)**

**Rationale**:
- **Event-driven primary path**: When a deal status changes to "Close/Won" or an activity is marked completed, trigger immediate recalculation of affected goals. This provides the "within 5 minutes" update requirement (FR-001, SC-002) with near-real-time responsiveness.
- **Scheduled fallback**: Run a background job every 15 minutes to catch any missed events, handle data inconsistencies, and recalculate goals with `calculation_failed=TRUE`. This ensures reliability even if events are missed.
- **Daily reconciliation**: Midnight job verifies all auto-calculated goals match CRM data, fixing any drift.

**Implementation Approach**:
1. **Application Layer**: `GoalProgressCalculationService` with methods:
   - `RecalculateGoalAsync(goalId)` - Calculate single goal from CRM data
   - `RecalculateGoalsForEntity(entityType, entityId)` - Find goals affected by entity change
   - `RecalculateAllAutoCalculatedGoals()` - Batch recalculation (scheduled job)

2. **Trigger Points**:
   - Deal status change to "Close/Won" → Recalculate revenue + deals goals
   - Activity marked completed → Recalculate activities goals
   - Task marked done → Recalculate tasks goals

3. **Performance Optimization**:
   - Cache goal-to-entity mappings (which goals track which CRM entities)
   - Use database indexes on deal.close_date, activity.completed_date within goal date ranges
   - Batch database queries: Single query per goal type instead of per goal
   - Limit recalculation to goals with timeframes covering the change date

4. **Failure Handling** (per clarification #2):
   - If CRM query times out or fails: Set `calculation_failed=TRUE`, preserve last successful value
   - Display warning indicator in UI
   - Allow manual override with required justification (FR-018)
   - Retry on next scheduled job

**Alternatives Rejected**:
- Pure event-driven: Risk of missed events, no reconciliation mechanism
- Pure scheduled: 15-minute latency unacceptable for user experience
- On-demand: Inconsistent UX, performance spike when viewing dashboard with 50 goals

---

## 2. Goal Hierarchy & Roll-Up Pattern

### Research Question
How should hierarchical goal structures (company → team → individual) be implemented with progress roll-up calculations?

### Options Considered

1. **Adjacency List**: Store `parent_goal_id` directly in `crm_goal` table
2. **Closure Table**: Separate `goal_hierarchy_link` table with explicit ancestor-descendant pairs
3. **Nested Sets**: Store left/right boundaries for tree traversal
4. **Materialized Path**: Store path from root as string (e.g., "1.2.3")

### Decision: **Adjacency List + Separate Link Table**

**Rationale**:
- **Adjacency List**: Simple, intuitive, aligns with existing CRM patterns (deals have parent opportunities)
- **Separate Link Table**: `crm_goal_hierarchy_link` provides flexibility for future enhancements (multiple parents, contribution weights, metadata)
- **Current Constraint**: One parent per goal (enforced by unique constraint on `child_goal_id`)
- **Query Strategy**: Application-level recursion for hierarchy traversal (acceptable for max depth of 3 levels)

**Roll-Up Calculation**:
- **Strategy**: Sum-based roll-up (child progress contributions add up to parent progress)
- **Formula**: `Parent Progress = SUM(Child Progress)` where children are direct descendants
- **Validation**: Application validates that sum of child target values ≤ parent target value (warning if exceeded, not error)
- **Recalculation Trigger**: When child progress updates, recalculate parent recursively up the tree

**Hierarchy Constraints**:
1. Max depth: 3 levels (company → team → individual)
2. No circular dependencies (A→B→C→A prevented by traversal check before insert)
3. Compatible owner types: company can have team/individual children, team can have individual children

**Query Optimization**:
- **Get descendants**: Recursive CTE in MySQL for hierarchy retrieval
- **Get ancestors**: Iterative query following parent_goal_id chain (max 3 iterations)
- **Index**: `idx_parent_goal_id` for efficient child lookups

**Alternatives Rejected**:
- Closure table: Over-engineering for 3-level max depth, adds complexity
- Nested sets: Poor write performance when hierarchy changes frequently
- Materialized path: String manipulation complexity, harder to maintain referential integrity

---

## 3. Trend Visualization Library for Sparklines

### Research Question
Which React library should be used for rendering compact trend sparklines on goal dashboard cards?

### Options Considered

| Library | Bundle Size | Performance | MUI Integration | Accessibility |
|---------|-------------|-------------|-----------------|---------------|
| Chart.js | 60-70 KB | Good (canvas-based) | Manual theming | Basic |
| Recharts | 90-100 KB | Moderate (SVG) | Easy (styled-components) | Good |
| Victory | 120+ KB | Moderate (SVG) | Manual theming | Excellent |
| react-sparklines | 15 KB | Excellent (SVG) | Manual theming | Basic |
| react-trend | 8 KB | Excellent (SVG) | Manual theming | Minimal |

### Decision: **react-sparklines** (with Chart.js as fallback for complex analytics)

**Rationale**:
- **Lightweight**: 15 KB bundle size acceptable for 50+ sparklines per dashboard
- **Performance**: SVG-based, efficient rendering for small datasets (< 100 data points per sparkline)
- **Simplicity**: Minimal API, perfect for dashboard card sparklines (progress history over 30 days)
- **MUI Integration**: Use MUI theme colors programmatically (`theme.palette.primary.main`)

**Usage Pattern**:
- **Dashboard cards**: react-sparklines for compact progress trend (last 30 days, 1 data point per day = 30 points)
- **Analytics page**: Chart.js for richer visualizations (velocity charts, completion rate trends, comparisons)
- **Lazy load**: Chart.js loaded only when analytics page accessed

**Implementation**:
```jsx
import { Sparklines, SparklinesLine } from 'react-sparklines';

<Sparklines data={progressHistory} width={100} height={20}>
  <SparklinesLine color={theme.palette.primary.main} />
</Sparklines>
```

**Alternatives Rejected**:
- Chart.js for sparklines: Too heavy for 50+ instances on one page
- Recharts: Bundle size too large, over-featured for simple sparklines
- Victory: Excellent accessibility but bundle size prohibitive
- react-trend: Too minimal, lacks flexibility for future enhancements

---

## 4. Background Jobs Pattern for .NET 8

### Research Question
How should scheduled background jobs be implemented for daily snapshots, periodic recalculation, and notifications?

### Options Considered

1. **IHostedService / BackgroundService**: Built-in .NET 8, timer-based scheduling
2. **Hangfire**: Persistent job queue, web dashboard, distributed locking
3. **Quartz.NET**: Cron-based scheduling, job persistence, clustering support
4. **Azure Functions / AWS Lambda**: Serverless scheduled triggers

### Decision: **BackgroundService with Timer + Application-Level Distributed Lock**

**Rationale**:
- **Simplicity**: Built-in .NET 8, no external dependencies, aligns with constitution (avoid over-engineering)
- **Use Case Fit**: Three simple scheduled jobs, no complex workflows or job chaining
- **Distributed Lock**: Use database flag (`crm_background_job_lock` table) to prevent concurrent execution across multiple API instances
- **Configuration**: Job intervals in `appsettings.json` (e.g., `GoalSnapshotJob:IntervalMinutes: 1440` for daily)

**Implementation Pattern**:

```csharp
public class GoalSnapshotJob : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (await AcquireLockAsync("goal-snapshot-job"))
                {
                    await CreateDailySnapshots();
                    await ReleaseLockAsync("goal-snapshot-job");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Goal snapshot job failed");
            }

            await Task.Delay(TimeSpan.FromMinutes(1440), stoppingToken); // 24 hours
        }
    }
}
```

**Jobs**:
1. **GoalSnapshotJob**: Runs daily at midnight (00:00), creates progress history snapshots for all active goals
2. **GoalProgressCalculationJob**: Runs every 15 minutes, recalculates auto-calculated goals (fallback for missed events)
3. **GoalNotificationJob**: Runs every hour, checks for at-risk/overdue goals and sends notifications

**Distributed Lock**:
- Table: `crm_background_job_lock` (job_name, locked_by, locked_at, expires_at)
- Lock acquisition: `UPDATE crm_background_job_lock SET locked_by='{instance_id}', locked_at=NOW() WHERE job_name='{name}' AND (locked_by IS NULL OR expires_at < NOW())`
- Lock expiration: 5 minutes (prevents deadlock if instance crashes)

**Observability**:
- Log job start/end with duration
- Log job result counts (e.g., "Created 1,023 snapshots in 3.2 seconds")
- Log failures with full context
- Serilog enrichment: JobName, Duration, Result

**Alternatives Rejected**:
- Hangfire: Over-engineering for 3 simple jobs, adds dependency and complexity
- Quartz.NET: Cron expressions nice but not essential, same over-engineering concern
- Azure Functions: Adds deployment complexity, separates job logic from API codebase

---

## 5. Snapshot Frequency Implementation

### Research Question
How should the system capture progress snapshots (per clarification #3: ≥1% change + daily midnight)?

### Decision: **Dual Trigger System**

**Triggers**:
1. **Significant Change** (application layer):
   - When progress updates, check if `|new_percentage - last_snapshot_percentage| >= 1.0`
   - Create snapshot with `snapshot_source='significant_change'`
   - Store in `GoalService.UpdateProgressAsync()` method

2. **Daily Midnight** (background job):
   - `GoalSnapshotJob` creates snapshot for all active goals
   - `snapshot_source='daily_snapshot'`
   - Skips if last snapshot was created today (avoid duplicate)

3. **Manual Adjustment** (application layer):
   - When user manually overrides progress (FR-018), always create snapshot
   - `snapshot_source='manual_adjustment'`
   - Store justification in `notes` field

4. **Status Change** (application layer):
   - When goal status changes (draft→active, active→completed, etc.), create snapshot
   - `snapshot_source='status_change'`

**Edge Case**: If progress changes by 0.5% twice in one day (total 1%), only the second change triggers snapshot (threshold check uses cumulative change since last snapshot).

**Storage Optimization**:
- No deduplication (allow multiple snapshots per day if criteria met)
- Retention: Keep all snapshots indefinitely, archive strategy deferred to future

---

## 6. Notification Strategy

### Research Question
How should goal notifications be sent to users (FR-010)?

### Decision: **Database Queue + Background Job Processor**

**Flow**:
1. **Event occurs** (goal created, becomes at-risk, etc.) → Insert row into `crm_goal_notification` table with `sent_at=NULL`
2. **Background job** (`GoalNotificationJob`, runs hourly) → Query pending notifications, send via email/in-app, update `sent_at` timestamp
3. **In-app display**: Frontend queries `/api/notifications/unread` to show badge count

**Notification Types** (FR-010):
- `created`: When goal is created (notify owner)
- `assigned`: When user is linked to parent goal (notify child goal owners)
- `completed`: When goal reaches 100% or status=completed (notify owner + manager)
- `at_risk`: When progress < 50% and time remaining < 50% (checked hourly, notify owner)
- `overdue`: When end_date < NOW() and status != completed (checked hourly, notify owner)
- `milestone`: When goal reaches 25%, 50%, 75% (optional, nice-to-have)

**Delivery Channels**:
- **Phase 1**: Email only (using existing email service from CRM)
- **Phase 2** (future): In-app notifications (store in table, query in frontend)
- **Phase 3** (future): Push notifications (browser/mobile)

**Deduplication**: Check for existing pending notification of same type for same goal before inserting

---

## Technology Stack Summary

| Component | Technology | Version | Justification |
|-----------|------------|---------|---------------|
| **Frontend Framework** | React | 18.x | Existing |
| **UI Library** | Material-UI | Latest | Existing |
| **Sparkline Library** | react-sparklines | 1.7.0 | Lightweight, 15 KB |
| **Analytics Charts** | Chart.js | 4.x | Lazy-loaded, rich features |
| **State Management** | Context API + hooks | Built-in | Sufficient for goal state |
| **Backend Framework** | .NET | 8 | Existing |
| **ORM** | Dapper + SimpleCRUD | Latest | Existing |
| **Database** | MySQL | Latest | Existing |
| **Background Jobs** | BackgroundService | .NET 8 built-in | Simplicity, no extra deps |
| **Logging** | Serilog | Latest | Existing |
| **Validation** | FluentValidation | Latest | Existing |

**No New Major Dependencies**: All decisions leverage existing stack or add minimal lightweight libraries (react-sparklines 15 KB).

---

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Dashboard load (50 goals) | < 2 seconds | Index optimization, single SQL query for goals + progress history |
| Auto-calculation latency | < 5 minutes | Event-driven triggers + 15-min fallback job |
| API response time (p95) | < 200ms | Dapper (no ORM overhead), database indexes |
| Sparkline render (50 instances) | < 500ms | Lightweight library, virtualization if needed |
| Hierarchy query (3 levels) | < 100ms | Recursive CTE with max depth limit |
| Bulk operation (50 goals) | < 5 seconds | Transaction batching, parallel processing |

---

## Security Decisions

1. **All goals visible to all users** (clarification #1): Simplifies ACL, promotes transparency
2. **Bulk operations**: Same permission model as individual ops (user can only delete/change goals they have permission for)
3. **Manual override**: Requires justification (FR-018), logged in audit trail
4. **API authentication**: Existing dual auth (API key + JWT) sufficient
5. **Audit trail**: Comprehensive logging (clarification #4) for compliance

---

## Open Questions / Future Enhancements

1. **Weighted roll-up**: Currently sum-based; future enhancement could support weighted average for contributions
2. **Multiple parents**: Link table supports it, but current constraint enforces one parent
3. **Custom calculation formulas**: Out of scope (FR-002 defines fixed types); future enhancement could allow user-defined formulas
4. **Real-time updates**: Out of scope; current design uses polling/refresh; SignalR integration possible in future
5. **Mobile optimization**: Out of scope (constitution: responsive only, not native apps)

---

## References

- FR-001 to FR-021: Functional requirements
- Clarifications #1-5: Decisions from `/speckit.clarify`
- Constitution Principles I-V: Architecture and quality standards
- Existing codebase: `crm-system/src/CRM.*/`, `crm-system-client/src/`


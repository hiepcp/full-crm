# Quick Start Guide: Goal Interface Redesign

**Feature**: Goal Interface Redesign
**Branch**: `001-goal-interface-redesign`
**Date**: 2025-12-23

## Overview

This guide provides a quick reference for developers implementing the Goal Interface Redesign. For detailed specifications, see [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), and [research.md](./research.md).

---

## Development Workflow

### 1. Prerequisites

**Environment Setup**:
- Node.js 18+ and npm for frontend
- .NET 8 SDK for backend
- MySQL database running
- HTTPS certificates installed (mkcert)
- Hosts file configured (crm.local.com, api-crm.local.com)

**Dependencies**:
- Frontend: All existing dependencies + `react-sparklines` (install: `npm install react-sparklines`)
- Backend: Existing dependencies (no new packages needed)

### 2. Database Schema Updates

**Run migrations** (located in `crm-system/src/CRM.Infrastructure/Sqls/`):

```sql
-- 1. Extend crm_goal table
ALTER TABLE crm_goal
  ADD COLUMN parent_goal_id INT NULL,
  ADD COLUMN calculation_source ENUM('manual', 'auto_calculated') DEFAULT 'manual',
  ADD COLUMN last_calculated_at DATETIME NULL,
  ADD COLUMN calculation_failed BOOLEAN DEFAULT FALSE,
  ADD COLUMN manual_override_reason TEXT NULL,
  ADD INDEX idx_parent_goal_id (parent_goal_id),
  ADD INDEX idx_calculation_source (calculation_source),
  ADD INDEX idx_calculation_failed (calculation_failed),
  ADD CONSTRAINT fk_parent_goal FOREIGN KEY (parent_goal_id) REFERENCES crm_goal(id) ON DELETE SET NULL;

-- 2-7. Create new tables (see data-model.md for full DDL)
CREATE TABLE crm_goal_progress_history (...);
CREATE TABLE crm_goal_template (...);
CREATE TABLE crm_goal_hierarchy_link (...);
CREATE TABLE crm_goal_notification (...);
CREATE TABLE crm_goal_comment (...);
CREATE TABLE crm_goal_audit_log (...);
CREATE TABLE crm_background_job_lock (...); -- For distributed job locking

-- 8. Insert system templates
INSERT INTO crm_goal_template (name, description, goal_type, timeframe, owner_type, is_system_template, is_active)
VALUES
  ('Monthly Revenue Goal', 'Track monthly revenue targets', 'revenue', 'this_month', 'individual', TRUE, TRUE),
  ('Quarterly Deals Goal', 'Track deals closed per quarter', 'deals', 'this_quarter', 'team', TRUE, TRUE),
  ('Weekly Activity Goal', 'Track weekly activity completion', 'activities', 'this_week', 'individual', TRUE, TRUE);
```

### 3. Backend Implementation Order

**Phase 1: Domain Layer** (`CRM.Domain/Entities/`)
1. Extend `Goal.cs`: Add new properties (parent_goal_id, calculation_source, etc.)
2. Create new entities: `GoalProgressHistory.cs`, `GoalTemplate.cs`, `GoalHierarchyLink.cs`, `GoalNotification.cs`, `GoalComment.cs`, `GoalAuditLog.cs`

**Phase 2: Application Layer** (`CRM.Application/`)
1. Create DTOs (Request/Response in `Dtos/` folder)
2. Create service interfaces (`Interfaces/`)
3. Implement services (`Services/`):
   - Extend `GoalService.cs`
   - New: `GoalTemplateService.cs`, `GoalHierarchyService.cs`, `GoalProgressCalculationService.cs`, `GoalNotificationService.cs`, `GoalBulkOperationsService.cs`
4. Create validators (`Validators/`) for all new request DTOs
5. Update `DependencyInjection.cs` to register new services

**Phase 3: Infrastructure Layer** (`CRM.Infrastructure/`)
1. Extend `GoalRepository.cs`: Add hierarchy queries, progress history methods
2. Create new repositories: `GoalProgressHistoryRepository.cs`, `GoalTemplateRepository.cs`, etc.
3. Create background services (`BackgroundServices/`):
   - `GoalSnapshotJob.cs` (daily midnight)
   - `GoalProgressCalculationJob.cs` (every 15 min)
   - `GoalNotificationJob.cs` (hourly)
4. Update `DependencyInjection.cs` to register repositories and background services

**Phase 4: API Layer** (`CRM.Api/`)
1. Extend `GoalController.cs`: Add new endpoints (templates, hierarchy, bulk operations, comments, etc.)
2. Update `Program.cs` if needed (background services auto-registered via DI)

**Testing** (optional but recommended):
- Create tests in `tests/CRMApi.UnitTests/`
- Focus on: `GoalProgressCalculationService`, `GoalHierarchyService`, bulk operations

### 4. Frontend Implementation Order

**Phase 1: Infrastructure** (`infrastructure/api/`)
1. Extend `goalsApi.js`: Add methods for new endpoints
   ```javascript
   export const goalsApi = {
     // Existing methods
     getGoals: (params) => axiosInstance.get('/api/goals', { params }),

     // New methods
     getTemplates: () => axiosInstance.get('/api/goals/templates'),
     createFromTemplate: (templateId, data) => axiosInstance.post('/api/goals', { ...data, templateId }),
     getHierarchy: (id) => axiosInstance.get(`/api/goals/${id}/hierarchy`),
     getProgressHistory: (id, params) => axiosInstance.get(`/api/goals/${id}/progress-history`, { params }),
     getForecast: (id) => axiosInstance.get(`/api/goals/${id}/forecast`),
     bulkDelete: (goalIds) => axiosInstance.post('/api/goals/bulk-delete', { goalIds, confirmation: true }),
     bulkStatusChange: (goalIds, newStatus) => axiosInstance.post('/api/goals/bulk-status-change', { goalIds, newStatus }),
     getComments: (id) => axiosInstance.get(`/api/goals/${id}/comments`),
     addComment: (id, commentText) => axiosInstance.post(`/api/goals/${id}/comments`, { commentText }),
   };
   ```

**Phase 2: Application Services** (`application/services/`)
1. `goalProgressCalculator.js`: Client-side calculation logic (for display/validation)
2. `goalForecastService.js`: Velocity and forecast calculations
3. `goalHierarchyService.js`: Hierarchy tree manipulation, roll-up logic

**Phase 3: Domain** (`domain/entities/`)
1. Extend `Goal.js`: Add hierarchy, forecast fields

**Phase 4: Components** (`presentation/components/goals/`)
1. Extend existing: `GoalCard.jsx`, `GoalProgressBar.jsx`
2. Create new:
   - `GoalForecast.jsx` - Display forecast with status badge
   - `GoalComments.jsx` - Comments thread
   - `BulkOperationsToolbar.jsx` - Bulk select/delete/status change
   - `GoalHierarchyTree.jsx` - Tree visualization

**Phase 5: Pages** (`presentation/pages/goals/`)
1. Extend `index.jsx`: Add bulk operations, improve dashboard layout
2. Create new:
   - `GoalDashboard.jsx` - Priority/urgency-based dashboard
   - `GoalTemplateSelector.jsx` - Template selection dialog
   - `GoalHierarchyView.jsx` - Hierarchy visualization page
   - `GoalAnalytics.jsx` - Performance analytics page
   - `GoalDetailPage.jsx` - Detail view with comments, history

**Phase 6: Context/State** (`app/contexts/` or `app/store/`)
1. `GoalContext.jsx` or `goalSlice.js`: Goal state management

---

## Key Implementation Notes

### 1. Auto-Calculation Implementation

**Trigger points** (in existing services):
```csharp
// In DealService.UpdateAsync (when deal status changes to Close/Won)
if (deal.Status == "Close/Won")
{
    await _goalProgressCalculationService.RecalculateGoalsForEntity(
        "deal",
        deal.Id
    );
}

// In ActivityService.CompleteAsync (when activity is completed)
await _goalProgressCalculationService.RecalculateGoalsForEntity(
    "activity",
    activity.Id
);
```

**Calculation logic** (`GoalProgressCalculationService.cs`):
```csharp
public async Task<decimal> CalculateProgressAsync(int goalId)
{
    var goal = await _goalRepository.GetByIdAsync(goalId);

    decimal calculatedProgress = goal.Type switch
    {
        "revenue" => await CalculateRevenueProgress(goal),
        "deals" => await CalculateDealsProgress(goal),
        "activities" => await CalculateActivitiesProgress(goal),
        "tasks" => await CalculateTasksProgress(goal),
        _ => throw new InvalidOperationException($"Unsupported goal type: {goal.Type}")
    };

    // Update goal
    goal.Progress = calculatedProgress;
    goal.LastCalculatedAt = DateTime.UtcNow;
    goal.CalculationFailed = false;

    await _goalRepository.UpdateAsync(goal);

    // Create snapshot if progress changed >= 1%
    await CreateSnapshotIfSignificantChange(goal);

    return calculatedProgress;
}

private async Task<decimal> CalculateRevenueProgress(Goal goal)
{
    // Query deals: status='Close/Won', close_date between goal.StartDate and goal.EndDate
    var sql = @"
        SELECT COALESCE(SUM(amount), 0)
        FROM crm_deal
        WHERE status = 'Close/Won'
          AND close_date >= @StartDate
          AND close_date <= @EndDate
          AND (owner_id = @OwnerId OR @OwnerId IS NULL)";

    return await _connection.ExecuteScalarAsync<decimal>(sql, new {
        goal.StartDate,
        goal.EndDate,
        OwnerId = goal.OwnerType == "individual" ? goal.OwnerId : (int?)null
    });
}
```

### 2. Snapshot Frequency Logic

**In GoalService.UpdateProgressAsync**:
```csharp
private async Task CreateSnapshotIfSignificantChange(Goal goal)
{
    // Get last snapshot
    var lastSnapshot = await _progressHistoryRepository.GetLatestForGoalAsync(goal.Id);

    if (lastSnapshot == null)
    {
        // First snapshot
        await CreateSnapshot(goal, "significant_change");
        return;
    }

    var currentPercentage = (goal.Progress / goal.TargetValue) * 100;
    var lastPercentage = (lastSnapshot.ProgressValue / lastSnapshot.TargetValue) * 100;

    if (Math.Abs(currentPercentage - lastPercentage) >= 1.0m)
    {
        await CreateSnapshot(goal, "significant_change");
    }
}
```

### 3. Hierarchy Roll-Up

**In GoalHierarchyService.cs**:
```csharp
public async Task RecalculateParentProgressAsync(int childGoalId)
{
    var child = await _goalRepository.GetByIdAsync(childGoalId);
    if (child.ParentGoalId == null) return;

    // Get all siblings (children of same parent)
    var siblings = await _goalRepository.GetChildrenAsync(child.ParentGoalId.Value);

    // Sum child progress
    var totalProgress = siblings.Sum(s => s.Progress);

    // Update parent
    var parent = await _goalRepository.GetByIdAsync(child.ParentGoalId.Value);
    parent.Progress = totalProgress;
    await _goalRepository.UpdateAsync(parent);

    // Recursively update grandparent
    await RecalculateParentProgressAsync(parent.Id);
}
```

### 4. Bulk Operations

**In GoalBulkOperationsService.cs**:
```csharp
public async Task<BulkOperationResult> BulkDeleteAsync(int[] goalIds, int currentUserId)
{
    if (goalIds.Length > 50)
        throw new ValidationException("Cannot delete more than 50 goals at once");

    var result = new BulkOperationResult { TotalRequested = goalIds.Length };

    foreach (var goalId in goalIds)
    {
        try
        {
            var goal = await _goalRepository.GetByIdAsync(goalId);

            // Check permissions
            if (!await CanUserModifyGoal(currentUserId, goal))
            {
                result.Failed.Add(new FailedOperation { GoalId = goalId, Error = "Forbidden" });
                continue;
            }

            await _goalRepository.DeleteAsync(goalId);
            result.Succeeded.Add(goalId);
        }
        catch (Exception ex)
        {
            result.Failed.Add(new FailedOperation { GoalId = goalId, Error = ex.Message });
        }
    }

    return result;
}
```

### 5. Frontend Sparklines

**In GoalCard.jsx**:
```jsx
import { Sparklines, SparklinesLine } from 'react-sparklines';
import { useTheme } from '@mui/material/styles';

function GoalCard({ goal }) {
  const theme = useTheme();
  const [progressHistory, setProgressHistory] = useState([]);

  useEffect(() => {
    // Fetch last 30 days of progress history
    goalsApi.getProgressHistory(goal.id, { limit: 30 })
      .then(data => setProgressHistory(data.map(h => h.progressPercentage)));
  }, [goal.id]);

  return (
    <Card>
      <CardContent>
        <Typography>{goal.name}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LinearProgress variant="determinate" value={goal.progressPercentage} />
          <Sparklines data={progressHistory} width={80} height={20}>
            <SparklinesLine color={theme.palette.primary.main} />
          </Sparklines>
        </Box>
      </CardContent>
    </Card>
  );
}
```

---

## Testing Checklist

### Backend API Testing
- [ ] Create goal from template (SC-001: < 30 seconds)
- [ ] Auto-calculation updates within 5 minutes of deal close (SC-002)
- [ ] Bulk delete 50 goals successfully
- [ ] Bulk status change with partial failures
- [ ] Hierarchy roll-up calculates correctly
- [ ] Forecast calculation with insufficient data returns 422
- [ ] Manual override requires justification
- [ ] Snapshot created on ≥1% progress change
- [ ] Daily snapshot job runs at midnight

### Frontend UI Testing
- [ ] Dashboard loads < 2 seconds with 50 goals (SC-006)
- [ ] Goals sorted by urgency (overdue first, then due within 7 days) (FR-003)
- [ ] Sparklines render correctly for 50+ goals
- [ ] Template selection creates goal in < 30 seconds (SC-001)
- [ ] Hierarchy tree visualizes 3 levels correctly
- [ ] Bulk select and delete with confirmation dialog
- [ ] Forecast displays "On Track" / "At Risk" status correctly
- [ ] Comments thread displays and updates

---

## Common Issues & Solutions

**Issue**: Auto-calculation not triggering after deal close
**Solution**: Ensure event trigger is in DealService.UpdateAsync, check goalProgressCalculationService DI registration

**Issue**: Sparklines not rendering
**Solution**: Check data format (array of numbers), verify react-sparklines installed (`npm install react-sparklines`)

**Issue**: Hierarchy circular dependency error
**Solution**: Service should check for cycles before creating link, traverse parent chain and reject if child already in chain

**Issue**: Bulk operation times out
**Solution**: Limit enforced at 50 goals, consider batching in transactions of 10

**Issue**: Snapshot created multiple times per day
**Solution**: Check threshold logic (should only trigger on ≥1% change OR daily job OR manual/status change)

**Issue**: Dashboard loads slowly
**Solution**: Optimize query - fetch goals + latest snapshot in single query using JOIN, add database indexes

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run database migration scripts
- [ ] Insert system templates
- [ ] Test background jobs locally
- [ ] Verify API endpoints with Postman/Swagger
- [ ] Run frontend build (`npm run build`)
- [ ] Run backend tests (`dotnet test`)

### Deployment
- [ ] Deploy database schema changes (low-risk, backward compatible)
- [ ] Deploy backend API (includes new endpoints, backward compatible)
- [ ] Deploy frontend (new UI, existing endpoints still work)
- [ ] Enable background jobs (GoalSnapshotJob, GoalProgressCalculationJob, GoalNotificationJob)
- [ ] Monitor logs for errors (Serilog: `logs/error/`)

### Post-Deployment Verification
- [ ] Create test goal from template
- [ ] Close test deal, verify goal progress updates
- [ ] Check daily snapshot job ran successfully (next day)
- [ ] Verify bulk operations work
- [ ] Load dashboard with 20+ goals, check performance

---

## Performance Monitoring

**Key Metrics to Track**:
- Dashboard load time (target: < 2 seconds)
- Auto-calculation latency (target: < 5 minutes from event)
- API p95 response time (target: < 200ms)
- Background job duration (snapshot job should complete in < 10 seconds for 1000 goals)
- Database query performance (slow query log)

**Serilog Queries** (if using structured logging):
```
// Find slow auto-calculations
@Level = 'Warning' AND @MessageTemplate LIKE '%GoalProgressCalculation%' AND Duration > 1000

// Find failed background jobs
@Level = 'Error' AND JobName IS NOT NULL

// Find slow dashboard loads
@Level = 'Info' AND RequestPath = '/api/goals' AND Duration > 2000
```

---

## Next Steps

After implementation:
1. Run `/speckit.tasks` to generate detailed task breakdown
2. Implement tasks in priority order (P1 → P2 → P3 from spec.md)
3. Create pull request following constitution guidelines
4. Code review focusing on Clean Architecture compliance

**Estimated Implementation Time** (per constitution: no timelines, but for planning):
- Backend: Significant effort (new services, background jobs, extensive business logic)
- Frontend: Significant effort (new components, pages, state management)
- Testing: Moderate effort (focus on critical calculation logic)

**Resources**:
- [spec.md](./spec.md) - Full feature specification with requirements
- [data-model.md](./data-model.md) - Complete database schema
- [research.md](./research.md) - Design decisions and rationale
- [contracts/](./contracts/) - OpenAPI specifications for all endpoints
- CLAUDE.md - Project-wide development guidance


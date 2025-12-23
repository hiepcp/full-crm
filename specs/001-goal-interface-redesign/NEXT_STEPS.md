# Goal Interface Redesign - Next Steps Guide

**Current Status**: Frontend Implementation Complete (7/7 Phases)
**Date**: December 23, 2025

---

## Immediate Next Steps (This Week)

### 1. Route Configuration (2-3 hours) - **PRIORITY 1**

**Files to Modify**:
- `crm-system-client/src/app/routes/groups/MainRoutes.jsx`
- `crm-system-client/src/presentation/pages/goals/index.jsx`

**Tasks**:

#### A. Add Routes in MainRoutes.jsx
```javascript
import GoalHierarchyView from '@presentation/pages/goals/GoalHierarchyView';
import GoalAnalytics from '@presentation/pages/goals/GoalAnalytics';

// In routes array:
{
  path: '/goals/hierarchy',
  element: <GoalHierarchyView />
},
{
  path: '/goals/analytics',
  element: <GoalAnalytics />
}
```

#### B. Add Navigation Buttons in index.jsx
Add to the header section (around line 500):
```javascript
<Stack direction="row" spacing={1}>
  {/* Existing View Mode Toggle */}
  <Stack direction="row" spacing={0}>...</Stack>

  {/* NEW: Hierarchy Button */}
  <Button
    variant="outlined"
    color="primary"
    startIcon={<AccountTreeIcon />}
    onClick={() => navigate('/goals/hierarchy')}
    sx={{ textTransform: 'none' }}
  >
    Hierarchy
  </Button>

  {/* NEW: Analytics Button */}
  <Button
    variant="outlined"
    color="primary"
    startIcon={<AssessmentIcon />}
    onClick={() => navigate('/goals/analytics')}
    sx={{ textTransform: 'none' }}
  >
    Analytics
  </Button>

  {/* Existing Leaderboard and Add Goal buttons */}
  <Button variant="outlined">Leaderboard</Button>
  <Button variant="contained">Add goal</Button>
</Stack>
```

**Testing**:
- [ ] Click "Hierarchy" button → Navigate to /goals/hierarchy
- [ ] Hierarchy page renders correctly
- [ ] Click "Analytics" button → Navigate to /goals/analytics
- [ ] Analytics page renders correctly
- [ ] Breadcrumb "Goals" link returns to main page
- [ ] Back button works on both pages

---

## Backend Implementation Roadmap (40-80 hours)

### Phase 3 Backend - Auto-Calculation (16-24 hours)

**Priority**: HIGH (Required for core functionality)

**Database Changes**:
1. Extend `crm_goal` table:
   - Add `calculation_source` ENUM('manual', 'auto_calculated')
   - Add `last_calculated_at` DATETIME
   - Add `calculation_failed` BOOLEAN
   - Add `manual_override_reason` TEXT

2. Create `crm_goal_progress_history` table:
   - id, goal_id, progress_value, target_value, progress_percentage
   - snapshot_source, snapshot_timestamp, created_by, notes

**API Endpoints**:
```csharp
// POST /api/goals/{id}/recalculate
public async Task<IActionResult> RecalculateProgress(int id)
{
    // 1. Get goal from database
    // 2. Based on goal.type, query CRM data:
    //    - revenue: SUM(deal.amount) WHERE status='Close/Won' AND close_date BETWEEN goal.startDate AND goal.endDate
    //    - deals: COUNT(deals) WHERE status='Close/Won' AND close_date BETWEEN dates
    //    - activities: COUNT(activities) WHERE status='completed' AND date BETWEEN dates
    //    - tasks: COUNT(tasks) WHERE status='completed' AND date BETWEEN dates
    // 3. Update goal.progress = calculated value
    // 4. Update goal.last_calculated_at = NOW()
    // 5. Create snapshot in progress_history
    // 6. Return updated goal
}

// POST /api/goals/{id}/manual-adjustment
public async Task<IActionResult> ManualAdjustment(int id, ManualProgressAdjustmentRequest request)
{
    // 1. Validate justification (minimum 10 chars)
    // 2. Update goal.progress = request.newProgress
    // 3. Update goal.manual_override_reason = request.justification
    // 4. Create snapshot in progress_history (source='manual_adjustment')
    // 5. Log in audit_log
    // 6. Return updated goal
}

// GET /api/goals/{id}/forecast
public async Task<IActionResult> GetForecast(int id)
{
    // 1. Get progress history for goal (last 30 days)
    // 2. Calculate velocity (progress per day)
    // 3. Calculate remaining progress needed
    // 4. Calculate days remaining
    // 5. Determine status (ahead/on-track/behind/at-risk/insufficient-data)
    // 6. Return forecast object
}

// GET /api/goals/{id}/progress-history
public async Task<IActionResult> GetProgressHistory(int id)
{
    // 1. Query progress_history table WHERE goal_id = id
    // 2. Order by snapshot_timestamp DESC
    // 3. Return array of history entries
}
```

**Background Job** (GoalProgressCalculationJob):
```csharp
// Runs every 5 minutes
public async Task Execute()
{
    // 1. Get all goals WHERE calculation_source = 'auto_calculated' AND status = 'active'
    // 2. For each goal, call RecalculateProgress
    // 3. Handle failures gracefully (set calculation_failed = true)
    // 4. Log results
}
```

---

### Phase 6 Backend - Hierarchy (12-20 hours)

**Priority**: MEDIUM (Nice to have for MVP)

**Database Changes**:
1. Extend `crm_goal` table:
   - Add `parent_goal_id` INT (FK to crm_goal.id)

2. Create `crm_goal_hierarchy_link` table (optional - currently using parent_goal_id):
   - id, parent_goal_id, child_goal_id, contribution_weight, created_on, created_by

**API Endpoints**:
```csharp
// POST /api/goals/{id}/link-parent
public async Task<IActionResult> LinkToParent(int id, LinkGoalToParentRequest request)
{
    // 1. Validate hierarchy rules:
    //    - Not self-reference
    //    - Owner type compatible
    //    - No circular dependency
    //    - Max depth = 3
    // 2. Update goal.parent_goal_id = request.parentGoalId
    // 3. Return updated goal
}

// POST /api/goals/{id}/unlink-parent
public async Task<IActionResult> UnlinkParent(int id)
{
    // 1. Update goal.parent_goal_id = NULL
    // 2. Return updated goal
}

// GET /api/goals/{id}/hierarchy
public async Task<IActionResult> GetHierarchy(int id)
{
    // 1. Get goal
    // 2. Traverse up to get ancestors (parent, grandparent, etc.)
    // 3. Traverse down to get descendants (children, grandchildren, etc.)
    // 4. Return hierarchy tree
}

// GET /api/goals/{id}/children
public async Task<IActionResult> GetChildren(int id)
{
    // 1. Query goals WHERE parent_goal_id = id
    // 2. Return array of child goals
}
```

**RecalculateParentProgressAsync** (called after any progress update):
```csharp
public async Task RecalculateParentProgressAsync(int goalId)
{
    var goal = await _repository.GetByIdAsync(goalId);
    if (goal.ParentGoalId == null) return;

    // 1. Get all siblings (same parent)
    var siblings = await _repository.GetChildrenAsync(goal.ParentGoalId.Value);

    // 2. Calculate aggregate progress
    var totalTarget = siblings.Sum(s => s.TargetValue);
    var totalProgress = siblings.Sum(s => s.Progress);
    var aggregatePercentage = (totalProgress / totalTarget) * 100;

    // 3. Update parent goal progress
    var parent = await _repository.GetByIdAsync(goal.ParentGoalId.Value);
    parent.Progress = totalProgress;
    parent.ProgressPercentage = aggregatePercentage;
    await _repository.UpdateAsync(parent);

    // 4. Recursively update grandparent
    if (parent.ParentGoalId != null)
    {
        await RecalculateParentProgressAsync(parent.Id);
    }
}
```

---

### Phase 7 Backend - Analytics (12-16 hours)

**Priority**: LOW (Can defer to v2)

**API Endpoint Extension**:
```csharp
// Extend GET /api/goals/metrics
public async Task<IActionResult> GetMetrics(GoalMetricsRequest request)
{
    // Existing metrics...

    // NEW: Historical trend data
    if (request.IncludeHistoricalTrends)
    {
        // 1. Group goals by end month
        // 2. Calculate completion rate per month (completed / total)
        // 3. Return last 12 months of data
        response.CompletionRateTrend = await CalculateCompletionRateTrend(request);

        // 4. Calculate average velocity from progress_history
        response.AverageVelocity = await CalculateAverageVelocity(request);

        // 5. Calculate type breakdown
        response.TypeBreakdown = await CalculateTypeBreakdown(request);

        // 6. Compare to team/company averages
        if (request.IncludeComparisons)
        {
            response.TeamAverage = await CalculateTeamAverage(request);
            response.CompanyAverage = await CalculateCompanyAverage(request);
        }
    }

    return Ok(response);
}
```

---

## Testing Strategy

### Unit Testing (Backend)
```csharp
// GoalProgressCalculationServiceTests.cs
[Fact]
public async Task RecalculateProgress_RevenueGoal_ShouldSumDeals()
{
    // Arrange
    var goal = new Goal { Id = 1, Type = GoalType.Revenue, StartDate = ..., EndDate = ... };
    var deals = new[] { new Deal { Amount = 1000, Status = "Close/Won" }, ... };
    // Mock repository to return deals

    // Act
    var result = await _service.RecalculateProgressAsync(goal.Id);

    // Assert
    Assert.Equal(expectedSum, result.Progress);
}

// GoalHierarchyServiceTests.cs
[Fact]
public async Task ValidateHierarchyLink_CircularDependency_ShouldReturnError()
{
    // Arrange: A → B → C, trying to link C → A

    // Act
    var result = await _service.ValidateHierarchyLinkAsync(childId: C, parentId: A);

    // Assert
    Assert.False(result.IsValid);
    Assert.Contains("circular dependency", result.Errors);
}
```

### Integration Testing (E2E)
```javascript
// goals.spec.js (Cypress/Playwright)
describe('Goal Auto-Calculation', () => {
  it('should auto-calculate revenue goal when deal closed', async () => {
    // 1. Create revenue goal with target $100,000
    // 2. Create deal with amount $25,000
    // 3. Mark deal as "Close/Won"
    // 4. Wait for auto-calculation (5 minutes or trigger manually)
    // 5. Verify goal progress = $25,000 (25%)
  });
});

describe('Goal Hierarchy', () => {
  it('should roll up progress from children to parent', async () => {
    // 1. Create company goal (target $1M)
    // 2. Create team goal 1 (target $400K) linked to company
    // 3. Create team goal 2 (target $600K) linked to company
    // 4. Update team goal 1 progress to $200K (50%)
    // 5. Update team goal 2 progress to $300K (50%)
    // 6. Verify company goal progress = $500K (50%)
  });
});
```

---

## Deployment Plan

### Week 1: Route Configuration + Testing
- Day 1-2: Add routes and navigation buttons
- Day 3-4: Manual testing of all frontend features
- Day 5: Bug fixes and refinements

### Week 2-4: Phase 3 Backend (Auto-Calculation)
- Week 2: Database schema, repositories, services
- Week 3: API endpoints, background job
- Week 4: Testing and integration

### Week 5-6: Phase 6 Backend (Hierarchy)
- Week 5: Schema, validation, endpoints
- Week 6: Testing and roll-up logic

### Week 7: Phase 7 Backend (Analytics) - Optional
- Week 7: Extended metrics endpoint, historical calculations

### Week 8: Production Deployment
- Final integration testing
- Performance testing
- User acceptance testing
- Production deployment
- Monitoring and feedback

---

## Success Metrics to Track Post-Launch

### Adoption Metrics
- % of users creating goals (target: 80% within 1 month)
- Average goals per user (target: 5+)
- % using templates (target: 70%+)
- % using auto-calculation (target: 90%+)

### Performance Metrics
- Average goal creation time (target: <30s, expecting 10-15s)
- Dashboard load time (target: <2s)
- Auto-calculation accuracy (target: 90%+)
- % of users viewing analytics (target: 50%+)

### Engagement Metrics
- Daily active users on goals page
- Goals completed per week
- Hierarchy usage (% of goals linked to parents)
- Analytics page views per week

### Support Metrics
- Goal-related support tickets (target: 60% reduction)
- User satisfaction score (target: 80%+)
- Feature requests vs bug reports ratio

---

## Contact & Support

**For Questions**:
- Frontend Implementation: Review phase summary docs (PHASE3-7_SUMMARY.md)
- Backend Implementation: Review data-model.md and contracts/ folder
- Architecture Questions: Review plan.md and spec.md

**Resources**:
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Specification](./spec.md)
- [Tasks Breakdown](./tasks.md)
- [Data Model](./data-model.md)
- [Plan](./plan.md)

---

**Status**: Ready for Backend Development
**Next Milestone**: Route Configuration → Backend Phase 3 → Backend Phase 6 → Production
**Timeline**: 8-12 weeks to full production (with backend team)

---

*Last Updated*: December 23, 2025
*Version*: 1.0

# Goal Auto-Calculation Components

This directory contains React components for the Goal Interface Redesign feature, specifically **User Story 1: Auto-Calculation**.

## 📦 Components Overview

### Core Components

#### 1. **ProgressHistoryChart**
Displays a sparkline chart showing historical progress trends.

```jsx
import { ProgressHistoryChart } from '../../components/goals';

<ProgressHistoryChart
  goalId={123}
  height={50}
  color="#1976d2"
  showSpots={true}
/>
```

**Props:**
- `goalId` (number, required): Goal ID to fetch history for
- `height` (number, default: 50): Chart height in pixels
- `color` (string, default: '#1976d2'): Line color
- `showSpots` (boolean, default: true): Show data points on the line

**Features:**
- Auto-fetches progress history via API
- Handles loading states and errors gracefully
- Shows helpful messages for edge cases (no data, single data point)

---

#### 2. **GoalForecastBadge**
Displays forecast status as a colored chip with tooltip details.

```jsx
import { GoalForecastBadge } from '../../components/goals';

<GoalForecastBadge
  goalId={123}
  showTooltip={true}
  size="small"
/>
```

**Props:**
- `goalId` (number, required): Goal ID to fetch forecast for
- `showTooltip` (boolean, default: true): Show detailed tooltip
- `size` ('small' | 'medium', default: 'small'): Chip size

**Status Types:**
- 🟢 **ahead**: Exceeding required velocity (green)
- ✅ **on_track**: Meeting targets (green)
- ⚠️ **behind**: Falling behind schedule (yellow/warning)
- 🔴 **at_risk**: Negative velocity or no progress (red/error)
- ℹ️ **insufficient_data**: Need more data points (gray)

---

#### 3. **ManualProgressAdjustmentDialog**
Full-featured dialog for manually overriding goal progress with required justification.

```jsx
import { ManualProgressAdjustmentDialog } from '../../components/goals';

const [open, setOpen] = useState(false);

<ManualProgressAdjustmentDialog
  open={open}
  onClose={() => setOpen(false)}
  goal={goalObject}
  onSuccess={(updatedGoal) => {
    console.log('Updated:', updatedGoal);
    // Refresh your goal list/detail
  }}
/>
```

**Props:**
- `open` (boolean, required): Dialog open state
- `onClose` (function, required): Close handler
- `goal` (object, required): Goal object to adjust
- `onSuccess` (function, optional): Callback receives updated goal

**Features:**
- Real-time progress percentage calculation
- 10-character minimum justification validation
- Warning for auto-calculated goals
- Current vs. new progress comparison
- Comprehensive error handling
- Creates audit log entry and progress snapshot

---

#### 4. **GoalCalculationSourceBadge**
Badge indicating whether a goal is auto-calculated or manually entered.

```jsx
import { GoalCalculationSourceBadge } from '../../components/goals';

<GoalCalculationSourceBadge
  goal={goalObject}
  size="small"
  showIcon={true}
/>
```

**Props:**
- `goal` (object, required): Goal object with `calculationSource` property
- `size` ('small' | 'medium', default: 'small'): Chip size
- `showIcon` (boolean, default: true): Show icon

**Badge Types:**
- 🤖 **Auto**: Blue badge for auto-calculated goals
- ✏️ **Manual**: Gray badge for manually-entered goals

---

#### 5. **RecalculateButton**
Button/icon to trigger manual recalculation for auto-calculated goals.

```jsx
import { RecalculateButton } from '../../components/goals';

<RecalculateButton
  goal={goalObject}
  onSuccess={(updatedGoal) => {
    console.log('Recalculated:', updatedGoal);
  }}
  variant="icon"
  size="small"
/>
```

**Props:**
- `goal` (object, required): Goal object to recalculate
- `onSuccess` (function, optional): Callback receives updated goal
- `variant` ('button' | 'icon', default: 'icon'): Display style
- `size` ('small' | 'medium' | 'large', default: 'small'): Button size

**Features:**
- Only shows for auto-calculated goals
- Built-in loading states
- Snackbar notifications for success/error
- Automatic validation (prevents manual goal recalculation)

---

## 🔌 API Integration

All components use `goalsApi` from `infrastructure/api/goalsApi.js`:

```javascript
import goalsApi from '../../../infrastructure/api/goalsApi';

// Auto-calculation endpoints
goalsApi.manualAdjustProgress(id, { newProgress, justification });
goalsApi.recalculateProgress(id);
goalsApi.getForecast(id);
goalsApi.getProgressHistory(id);
```

---

## 📋 Integration Examples

### Goals List Page

See `GoalListIntegrationExample.jsx` for a complete example showing:
- Adding new table columns for trend, forecast, source
- Integrating action buttons
- Handling state updates after operations

**Key additions to your table:**

```jsx
<TableCell>
  <GoalCalculationSourceBadge goal={goal} />
</TableCell>
<TableCell>
  <ProgressHistoryChart goalId={goal.id} height={40} />
</TableCell>
<TableCell>
  <GoalForecastBadge goalId={goal.id} />
</TableCell>
<TableCell>
  <RecalculateButton
    goal={goal}
    onSuccess={handleRecalculateSuccess}
  />
</TableCell>
```

---

### Goal Detail Page

See `GoalDetailIntegrationExample.jsx` for a complete example showing:
- Displaying calculation metadata
- Full-size progress chart
- Detailed forecast information
- Action buttons and dialogs

**Key sections to add:**

```jsx
{/* Calculation Metadata */}
{goal.calculationSource === 'auto_calculated' && (
  <Typography>
    Last Calculated: {new Date(goal.lastCalculatedAt).toLocaleString()}
  </Typography>
)}

{/* Manual Override Reason */}
{goal.manualOverrideReason && (
  <Alert severity="info">
    Manual Override: {goal.manualOverrideReason}
  </Alert>
)}

{/* Calculation Failure Warning */}
{goal.calculationFailed && (
  <Alert severity="error">
    Calculation failed. Try recalculating or adjust manually.
  </Alert>
)}
```

---

## 🎨 Styling & Theming

All components use Material-UI (MUI) and respect your theme:
- Colors use MUI palette (primary, success, warning, error)
- Typography uses MUI variants (h5, h6, body1, body2, caption)
- Spacing uses MUI sx prop
- Fully responsive with Grid/Box layouts

---

## 🧪 Component Behavior

### Error Handling
- All components gracefully handle API errors
- Failed API calls won't crash the UI
- Error states display user-friendly messages
- Network errors show in snackbars/alerts

### Loading States
- CircularProgress indicators during API calls
- Disabled buttons prevent double-submission
- Skeleton/loading placeholders for charts

### Validation
- 10-character minimum for justification (enforced client + server)
- Progress value must be non-negative
- Auto-calculated goals can't use manual adjustment without override
- Manual goals can't be recalculated

### Real-time Updates
- `onSuccess` callbacks provide updated goal data
- Parent components should update state to reflect changes
- Dialogs close automatically on success
- Snackbar notifications confirm operations

---

## 🔐 Authorization

Components respect backend authorization:
- Individual goals: Only owner or managers/admins
- Team/company goals: Only managers/admins
- Unauthorized actions return 403 errors
- Error messages display to user via alerts

---

## 📊 Data Flow

```
User Action → Component → API Call → Backend Service
                                          ↓
                                    Database Update
                                          ↓
                                    Audit Log Entry
                                          ↓
                                  Progress Snapshot
                                          ↓
Backend Response → onSuccess Callback → UI Update
```

---

## 🚀 Quick Start

1. **Import components:**
   ```jsx
   import {
     ProgressHistoryChart,
     GoalForecastBadge,
     ManualProgressAdjustmentDialog,
     GoalCalculationSourceBadge,
     RecalculateButton
   } from '../../components/goals';
   ```

2. **Add to your JSX:**
   ```jsx
   <GoalForecastBadge goalId={goal.id} />
   <ProgressHistoryChart goalId={goal.id} height={50} />
   ```

3. **Handle state updates:**
   ```jsx
   const handleSuccess = (updatedGoal) => {
     setGoals(prevGoals =>
       prevGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
     );
   };
   ```

---

## 📝 Notes

- **React 18+** required
- **Material-UI v5+** required
- **react-sparklines** package installed
- All components are functional components with hooks
- TypeScript-ready with JSDoc comments
- No external state management (Redux/MobX) required

---

## 🐛 Troubleshooting

**Chart not displaying:**
- Verify `react-sparklines` is installed: `npm install react-sparklines`
- Check goalId is valid and goal has history data
- Minimum 2 data points required for sparkline

**Forecast shows "insufficient data":**
- Need at least 2 progress snapshots
- Wait for daily snapshot job or trigger manual adjustment
- Snapshots created on ≥1% progress change

**Recalculate button not showing:**
- Only visible for auto-calculated goals (`calculationSource === 'auto_calculated'`)
- Check goal object has correct property

**Manual adjustment validation fails:**
- Justification must be ≥10 characters
- Progress must be non-negative
- Goal must exist and user must have permission

---

## 📚 Related Documentation

- Backend API: `crm-system/src/CRM.Api/Controllers/GoalController.cs`
- Services: `crm-system/src/CRM.Application/Services/GoalService.cs`
- Calculation Logic: `crm-system/src/CRM.Application/Services/GoalProgressCalculationService.cs`
- Database Schema: `crm-system/src/CRM.Infrastructure/Sqls/Migrations/001_goal_interface_redesign.sql`
- Feature Spec: `specs/001-goal-interface-redesign/spec.md`

---

**Built with ❤️ for the Goal Interface Redesign project**

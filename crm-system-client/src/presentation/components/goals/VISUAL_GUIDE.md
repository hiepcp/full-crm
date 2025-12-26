# Goal Auto-Calculation UI Changes - Visual Guide

## Overview
This document shows the visual changes made to the Goals page after integrating auto-calculation components.

---

## BEFORE Integration

### Goal Card (Original)
```
┌─────────────────────────────────────────────────────────────┐
│  Win more revenue                           [Edit] [Delete]  │
│  Track your revenue won by time period                       │
│                                                               │
│  [revenue] [this_month] [active] Target: 100000              │
│                                                               │
│  Progress: 45%                                               │
│  ████████████░░░░░░░░░░░░░░░░ 45%                           │
└─────────────────────────────────────────────────────────────┘
```

**Issues with Original**:
- ❌ No indication if auto-calculated or manual
- ❌ No forecast/prediction information
- ❌ No historical trend visualization
- ❌ No way to recalculate
- ❌ No way to manually adjust progress
- ❌ No visibility into calculation metadata

---

## AFTER Integration

### Goal Card (Enhanced - Auto-Calculated Goal)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Win more revenue                      [Edit] [Recalc] [Adjust] [Delete]   │
│  Track your revenue won by time period                                      │
│                                                                              │
│  [revenue] [this_month] [active] [🤖 Auto] [✅ On Track] Target: 100000    │
│                                                                              │
│  Last calculated: 12/23/2025, 10:30:45 AM                                   │
│                                                                              │
│  Progress: 45%                                                               │
│  ████████████░░░░░░░░░░░░░░░░ 45%                                          │
│                                                                              │
│  Progress Trend                                                              │
│  ╱╲╱╲╱▔▔╲_╱▔▔▔╲╱╲╱                                                         │
│  (Sparkline showing historical progress)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Goal Card (Enhanced - Auto-Calculated with Override)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Win more revenue                      [Edit] [Recalc] [Adjust] [Delete]   │
│  Track your revenue won by time period                                      │
│                                                                              │
│  [revenue] [this_month] [active] [🤖 Auto] [⚠️ Behind] Target: 100000     │
│                                                                              │
│  Last calculated: 12/23/2025, 10:30:45 AM                                   │
│                                                                              │
│  ℹ️ Override: Adjusted due to manual data entry error correction            │
│                                                                              │
│  Progress: 52%                                                               │
│  █████████████░░░░░░░░░░░░░░ 52%                                           │
│                                                                              │
│  Progress Trend                                                              │
│  ╱╲╱╲╱▔▔╲_╱▔▔▔╲╱╲╱╲▔                                                       │
│  (Sparkline showing historical progress)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Goal Card (Enhanced - Auto-Calculated with Failure)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Win more revenue                      [Edit] [Recalc] [Adjust] [Delete]   │
│  Track your revenue won by time period                                      │
│                                                                              │
│  [revenue] [this_month] [active] [🤖 Auto] [🔴 At Risk] Target: 100000    │
│                                                                              │
│  Last calculated: 12/23/2025, 10:30:45 AM                                   │
│                                                                              │
│  ⚠️ Auto-calculation failed. Please recalculate or adjust manually.         │
│                                                                              │
│  Progress: 30%                                                               │
│  ████████░░░░░░░░░░░░░░░░░░░ 30%                                           │
│                                                                              │
│  Progress Trend                                                              │
│  ╱▔▔╲_╱▔▔▔╲_╱▔▔                                                            │
│  (Sparkline showing historical progress)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Goal Card (Enhanced - Manual Goal)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Complete training                            [Edit] [Adjust] [Delete]     │
│  Track training completion                                                  │
│                                                                              │
│  [tasks] [this_month] [active] [✏️ Manual] [ℹ️ Insufficient Data]         │
│  Target: 50                                                                  │
│                                                                              │
│  Progress: 60%                                                               │
│  ████████████████░░░░░░░░░░ 60%                                            │
│                                                                              │
│  Progress Trend                                                              │
│  ▁▁▁▂▂▃▃▄▄▅▅▆▆▇▇                                                           │
│  (Sparkline showing historical progress)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Calculation Source Badge
**Visual**: `[🤖 Auto]` or `[✏️ Manual]`

**Auto-Calculated**:
- Color: Blue (info)
- Icon: AutoMode robot icon
- Tooltip: "Automatically calculated from CRM data"

**Manual**:
- Color: Gray (default)
- Icon: Edit pencil icon
- Tooltip: "Progress is manually entered"

### 2. Forecast Badge
**Visual**: `[✅ On Track]`, `[⚠️ Behind]`, etc.

**Five Status Types**:

1. **Ahead** 🟢
   - Color: Green (success)
   - Icon: TrendingUp
   - Tooltip: Shows daily velocity exceeding requirements

2. **On Track** ✅
   - Color: Green (success)
   - Icon: CheckCircle
   - Tooltip: "Currently on track to meet deadline"

3. **Behind** ⚠️
   - Color: Yellow (warning)
   - Icon: TrendingDown
   - Tooltip: Shows velocity gap and required catch-up

4. **At Risk** 🔴
   - Color: Red (error)
   - Icon: Warning
   - Tooltip: "Negative velocity or no progress"

5. **Insufficient Data** ℹ️
   - Color: Gray (default)
   - Icon: Info
   - Tooltip: "Need at least 2 progress snapshots for forecasting"

### 3. Progress History Chart
**Visual**: Sparkline showing trend over time

```
Trending Up:     ▁▂▃▄▅▆▇
Steady:          ▃▃▄▄▄▅▅▅
Declining:       ▇▆▅▄▃▂▁
Volatile:        ▁▃▁▄▂▅▁▆
```

**Features**:
- Height: 50px (configurable)
- Color: Blue (#1976d2)
- Shows data points (spots)
- Handles edge cases (no data, single point)

### 4. Action Buttons

**Original**: `[Edit] [Delete]`

**Enhanced**: `[Edit] [Recalculate] [Adjust] [Delete]`

**Recalculate Button** (Auto goals only):
- Icon: Refresh circular arrow
- Tooltip: "Recalculate progress from CRM data"
- Shows loading spinner during operation
- Only visible for auto-calculated goals

**Manual Adjustment Button**:
- Icon: Edit pencil (primary color)
- Tooltip: "Manual Adjustment"
- Opens dialog for progress override
- Available for all goals

### 5. Metadata Display

**Last Calculated Timestamp**:
```
Last calculated: 12/23/2025, 10:30:45 AM
```
- Only shown for auto-calculated goals
- Uses browser's locale formatting
- Gray text (caption variant)

**Manual Override Reason**:
```
ℹ️ Override: Adjusted due to manual data entry error correction
```
- Info alert (blue)
- Shows justification from manual adjustment
- Compact padding (py: 0.5)

**Calculation Failure Warning**:
```
⚠️ Auto-calculation failed. Please recalculate or adjust manually.
```
- Error alert (red)
- Only shown when calculationFailed = true
- Actionable guidance

---

## Dialogs

### Manual Progress Adjustment Dialog

```
┌─────────────────────────────────────────────────────────────┐
│  Manual Progress Adjustment                      [X]         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Goal: Win more revenue                                      │
│  Current Progress: 50,000 / 100,000 (50%)                    │
│                                                               │
│  ⚠️ This is an auto-calculated goal. Manual adjustment       │
│     will override the automatic calculation.                 │
│                                                               │
│  New Progress Value                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 55000                                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│  New Percentage: 55%                                         │
│                                                               │
│  Justification (required, minimum 10 characters)             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Corrected data entry error from last week             │  │
│  │                                                         │  │
│  │                                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│  Characters: 42 / 10 minimum ✓                               │
│                                                               │
│  Summary                                                      │
│  • Current: 50,000 (50%)                                     │
│  • New: 55,000 (55%)                                         │
│  • Change: +5,000 (+5%)                                      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                 [Cancel]  [Save Adjustment]  │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- Real-time percentage calculation
- Character count for justification
- Validation feedback
- Current vs. new comparison
- Warning for auto-calculated goals
- Disabled state during submission
- Error display if operation fails

---

## Tooltip Details

### Forecast Badge Tooltip (Expanded)

**On Track Example**:
```
┌───────────────────────────────────────┐
│  Currently on track to meet deadline  │
│                                        │
│  Daily Velocity: 1,234 units/day      │
│  Weekly Velocity: 8,638 units/week    │
│  Required Daily: 1,200 units/day      │
│                                        │
│  Estimated Completion: 12/31/2025     │
│  Days Remaining: 8 days                │
│  Confidence: High                      │
└───────────────────────────────────────┘
```

**Behind Example**:
```
┌───────────────────────────────────────┐
│  Falling behind schedule              │
│                                        │
│  Daily Velocity: 800 units/day        │
│  Weekly Velocity: 5,600 units/week    │
│  Required Daily: 1,200 units/day      │
│  Gap: -400 units/day                   │
│                                        │
│  Estimated Completion: 01/15/2026     │
│  (15 days late)                        │
│  Confidence: Medium                    │
└───────────────────────────────────────┘
```

---

## Snackbar Notifications

### Success Notifications
```
┌─────────────────────────────────────────┐
│  ✓ Goal recalculated successfully       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ✓ Goal progress adjusted successfully  │
└─────────────────────────────────────────┘
```

### Error Notifications
```
┌─────────────────────────────────────────┐
│  ✗ Failed to recalculate goal           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ✗ Justification must be at least      │
│    10 characters                         │
└─────────────────────────────────────────┘
```

### Warning Notifications
```
┌─────────────────────────────────────────┐
│  ⚠ Only auto-calculated goals can be   │
│    recalculated                          │
└─────────────────────────────────────────┘
```

---

## Responsive Design

### Desktop (≥1200px)
- All badges visible in single row
- Full sparkline width
- Side-by-side action buttons
- Expanded tooltips

### Tablet (768px - 1199px)
- Badges may wrap to second row
- Compressed sparkline
- Action buttons remain horizontal
- Compact tooltips

### Mobile (<768px)
- Badges stack vertically
- Reduced sparkline height
- Vertical action buttons
- Touch-friendly button sizes

---

## Color Palette

### Forecast Status Colors
- **Ahead**: `#4caf50` (green)
- **On Track**: `#4caf50` (green)
- **Behind**: `#ff9800` (orange/warning)
- **At Risk**: `#f44336` (red/error)
- **Insufficient Data**: `#9e9e9e` (gray)

### Badge Colors
- **Auto**: `#1976d2` (blue/info)
- **Manual**: `#757575` (gray/default)

### Chart Colors
- **Primary Line**: `#1976d2` (blue)
- **Data Points**: `#1976d2` (blue)
- **Grid Lines**: `#e0e0e0` (light gray)

### Alert Colors
- **Info**: `#e3f2fd` background, `#1976d2` text
- **Error**: `#ffebee` background, `#d32f2f` text
- **Success**: `#e8f5e9` background, `#388e3c` text

---

## Accessibility

### Screen Reader Support
- All badges have descriptive labels
- Tooltips have aria-labels
- Buttons have descriptive titles
- Dialogs have proper ARIA attributes

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons
- Escape to close dialogs
- Focus indicators on all controls

### Color Contrast
- All text meets WCAG AA standards
- Icons paired with text labels
- Color not used as only indicator

---

## Animation & Transitions

### Loading States
- Circular progress spinner (20px)
- Fade-in for loaded content
- Skeleton placeholder for charts

### Button States
- Hover: slight elevation
- Active: press effect
- Disabled: reduced opacity (0.5)

### Dialog Transitions
- Fade-in backdrop
- Slide-up content
- 300ms ease-out

---

**Last Updated**: December 23, 2025
**Version**: 1.0 (Phase 3 Complete)

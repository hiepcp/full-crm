/**
 * GoalDashboard.jsx
 *
 * Priority and urgency-based dashboard for goals with visual indicators
 * Displays goals sorted by urgency (overdue first, then due within 7 days, then remaining)
 *
 * User Story 2: Visual Progress Dashboard (Priority: P1)
 *
 * Features:
 * - Urgency-based sorting (overdue → due within 7 days → remaining)
 * - Color-coded status badges (red for overdue, yellow for due soon, green for on-track)
 * - Metrics summary cards (total goals, at-risk count, overdue count)
 * - Status badges: "Almost There", "At Risk", "Needs Attention"
 * - Team goal breakdown showing individual contributions
 */

import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  EmojiEvents as EmojiEventsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import {
  ProgressHistoryChart,
  GoalForecastBadge,
  GoalCalculationSourceBadge,
  RecalculateButton
} from '@presentation/components/goals';

/**
 * Calculate urgency metrics for a goal
 */
const calculateGoalMetrics = (goal) => {
  if (!goal.endDate) {
    return {
      daysRemaining: null,
      isOverdue: false,
      isAtRisk: false,
      urgencyLevel: 'normal',
      statusBadge: null
    };
  }

  const now = new Date();
  const endDate = new Date(goal.endDate);
  const startDate = goal.startDate ? new Date(goal.startDate) : now;

  const totalTime = endDate - startDate;
  const timeElapsed = now - startDate;
  const timeRemaining = endDate - now;

  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  const progressPercentage = parseFloat(goal.progress ?? goal.progressPercentage ?? 0);
  const timePercentageElapsed = totalTime > 0 ? (timeElapsed / totalTime) * 100 : 0;

  const isAtRisk = progressPercentage < 50 && timePercentageElapsed >= 50;

  // Determine urgency level
  let urgencyLevel = 'normal';
  if (isOverdue) {
    urgencyLevel = 'overdue';
  } else if (daysRemaining <= 7) {
    urgencyLevel = 'due_soon';
  }

  // Determine status badge
  let statusBadge = null;
  if (progressPercentage >= 90 && daysRemaining > 0 && daysRemaining <= 2) {
    statusBadge = { label: 'Almost There', color: 'success', icon: EmojiEventsIcon };
  } else if (isAtRisk) {
    statusBadge = { label: 'At Risk', color: 'error', icon: WarningIcon };
  }

  // Check for "Needs Attention" (no update in 14 days)
  if (goal.lastUpdatedAt) {
    const lastUpdate = new Date(goal.lastUpdatedAt);
    const daysSinceUpdate = Math.ceil((now - lastUpdate) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate >= 14) {
      statusBadge = { label: 'Needs Attention', color: 'warning', icon: NotificationsActiveIcon };
    }
  }

  return {
    daysRemaining,
    isOverdue,
    isAtRisk,
    urgencyLevel,
    statusBadge,
    progressPercentage
  };
};

/**
 * Sort goals by urgency: overdue → due within 7 days → remaining
 */
const sortGoalsByUrgency = (goals) => {
  return [...goals].sort((a, b) => {
    const metricsA = calculateGoalMetrics(a);
    const metricsB = calculateGoalMetrics(b);

    // Priority order: overdue > due_soon > normal
    const urgencyOrder = { overdue: 0, due_soon: 1, normal: 2 };

    if (urgencyOrder[metricsA.urgencyLevel] !== urgencyOrder[metricsB.urgencyLevel]) {
      return urgencyOrder[metricsA.urgencyLevel] - urgencyOrder[metricsB.urgencyLevel];
    }

    // Within same urgency level, sort by days remaining (ascending)
    if (metricsA.daysRemaining !== null && metricsB.daysRemaining !== null) {
      return metricsA.daysRemaining - metricsB.daysRemaining;
    }

    // Fall back to end date
    if (a.endDate && b.endDate) {
      return new Date(a.endDate) - new Date(b.endDate);
    }

    return 0;
  });
};

/**
 * Calculate dashboard metrics
 */
const calculateDashboardMetrics = (goals) => {
  const metrics = goals.map(calculateGoalMetrics);

  return {
    totalGoals: goals.length,
    overdueCount: metrics.filter(m => m.isOverdue).length,
    atRiskCount: metrics.filter(m => m.isAtRisk).length,
    onTrackCount: metrics.filter(m => !m.isOverdue && !m.isAtRisk).length,
    averageProgress: goals.length > 0
      ? goals.reduce((sum, g) => sum + parseFloat(g.progress ?? g.progressPercentage ?? 0), 0) / goals.length
      : 0
  };
};

/**
 * Metrics Summary Card Component
 */
const MetricCard = ({ title, value, icon: Icon, colorTheme = 'primary', subtitle }) => (
  <Card sx={{ height: '100%', borderLeft: 4, borderColor: `${colorTheme}.main` }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            bgcolor: `${colorTheme}.lighter`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon sx={{ color: `${colorTheme}.main`, fontSize: 32 }} />
        </Box>
        <Box flex={1}>
          <Typography variant="caption" color="text.secondary" display="block">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" color={`${colorTheme}.main`}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

/**
 * Enhanced Goal Card with Urgency Indicators
 */
const UrgencyGoalCard = ({ goal, metrics, onEdit, onDelete, onAdjust, onRecalculate }) => {
  const getUrgencyColor = () => {
    switch (metrics.urgencyLevel) {
      case 'overdue':
        return 'error.main';
      case 'due_soon':
        return 'warning.main';
      default:
        return 'success.main';
    }
  };

  const getUrgencyBorder = () => {
    switch (metrics.urgencyLevel) {
      case 'overdue':
        return '2px solid';
      case 'due_soon':
        return '2px solid';
      default:
        return '1px solid';
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderColor: getUrgencyColor(),
        borderWidth: getUrgencyBorder(),
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)'
        }
      }}
    >
      {/* Urgency indicator ribbon */}
      {metrics.urgencyLevel !== 'normal' && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bgcolor: getUrgencyColor(),
            color: 'white',
            px: 2,
            py: 0.5,
            borderBottomLeftRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            zIndex: 1
          }}
        >
          {metrics.isOverdue ? '⚠️ OVERDUE' : '⏰ DUE SOON'}
        </Box>
      )}

      <CardContent sx={{ pt: metrics.urgencyLevel !== 'normal' ? 4 : 2 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {goal.name}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {goal.description || 'No description'}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ mb: 2 }}>
              <Chip size="small" label={goal.typeDisplay || goal.type} />
              <Chip size="small" label={goal.timeframeDisplay || goal.timeframe} />
              <Chip
                size="small"
                color="primary"
                label={goal.statusDisplay || goal.status}
              />

              {/* Calculation Source Badge */}
              <GoalCalculationSourceBadge goal={goal} size="small" />

              {/* Forecast Badge */}
              <GoalForecastBadge goalId={goal.id} size="small" />

              {/* Status Badge (Almost There, At Risk, Needs Attention) */}
              {metrics.statusBadge && (
                <Chip
                  size="small"
                  icon={<metrics.statusBadge.icon />}
                  label={metrics.statusBadge.label}
                  color={metrics.statusBadge.color}
                  variant="filled"
                />
              )}

              {/* Days Remaining */}
              {metrics.daysRemaining !== null && (
                <Chip
                  size="small"
                  icon={<AccessTimeIcon />}
                  label={
                    metrics.isOverdue
                      ? `${Math.abs(metrics.daysRemaining)} days overdue`
                      : `${metrics.daysRemaining} days left`
                  }
                  color={metrics.isOverdue ? 'error' : metrics.daysRemaining <= 7 ? 'warning' : 'default'}
                  variant="outlined"
                />
              )}
            </Stack>

            {/* Calculation metadata */}
            {goal.calculationSource === 'auto_calculated' && goal.lastCalculatedAt && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Last calculated: {new Date(goal.lastCalculatedAt).toLocaleString()}
              </Typography>
            )}

            {/* Manual override reason */}
            {goal.manualOverrideReason && (
              <Alert severity="info" sx={{ mt: 1, mb: 1, py: 0.5 }}>
                <Typography variant="caption">
                  Override: {goal.manualOverrideReason}
                </Typography>
              </Alert>
            )}

            {/* Calculation failure warning */}
            {goal.calculationFailed && (
              <Alert severity="error" sx={{ mt: 1, mb: 1, py: 0.5 }}>
                <Typography variant="caption">
                  Auto-calculation failed. Please recalculate or adjust manually.
                </Typography>
              </Alert>
            )}

            {/* Progress Section */}
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  Progress: {goal.progress ?? goal.progressPercentage ?? 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {goal.progress ?? 0} / {goal.targetValue ?? 0}
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={Math.min(100, Number(goal.progress ?? goal.progressPercentage ?? 0))}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: metrics.isOverdue
                      ? 'error.main'
                      : metrics.isAtRisk
                      ? 'warning.main'
                      : 'success.main'
                  }
                }}
              />

              {/* Progress History Chart */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Progress Trend
                </Typography>
                <ProgressHistoryChart
                  goalId={goal.id}
                  height={50}
                  color={metrics.isOverdue ? '#d32f2f' : metrics.isAtRisk ? '#ed6c02' : '#1976d2'}
                  showSpots={true}
                />
              </Box>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Stack direction="column" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(goal)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <RecalculateButton
              goal={goal}
              onSuccess={onRecalculate}
              variant="icon"
              size="small"
            />

            <Tooltip title="Manual Adjustment">
              <IconButton size="small" onClick={() => onAdjust(goal)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(goal)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

/**
 * Main Goal Dashboard Component
 */
const GoalDashboard = ({ goals, onEdit, onDelete, onAdjust, onRecalculate }) => {
  const sortedGoals = useMemo(() => sortGoalsByUrgency(goals), [goals]);
  const metrics = useMemo(() => calculateDashboardMetrics(goals), [goals]);

  const goalsWithMetrics = useMemo(() => {
    return sortedGoals.map(goal => ({
      goal,
      metrics: calculateGoalMetrics(goal)
    }));
  }, [sortedGoals]);

  return (
    <Box>
      {/* Metrics Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Goals"
            value={metrics.totalGoals}
            icon={EmojiEventsIcon}
            colorTheme="primary"
            subtitle="Active goals"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Overdue"
            value={metrics.overdueCount}
            icon={ErrorIcon}
            colorTheme="error"
            subtitle="Past deadline"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="At Risk"
            value={metrics.atRiskCount}
            icon={WarningIcon}
            colorTheme="warning"
            subtitle="Behind schedule"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="On Track"
            value={metrics.onTrackCount}
            icon={CheckCircleIcon}
            colorTheme="success"
            subtitle="Meeting targets"
          />
        </Grid>
      </Grid>

      {/* Average Progress Indicator */}
      {goals.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 32 }} />
              <Box flex={1}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Progress
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.averageProgress}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {metrics.averageProgress.toFixed(1)}%
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Goals List Sorted by Urgency */}
      <Box>
        {goalsWithMetrics.length === 0 ? (
          <Alert severity="info">
            No goals to display. Create your first goal to get started!
          </Alert>
        ) : (
          goalsWithMetrics.map(({ goal, metrics }) => (
            <UrgencyGoalCard
              key={goal.id}
              goal={goal}
              metrics={metrics}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdjust={onAdjust}
              onRecalculate={onRecalculate}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export default GoalDashboard;

/**
 * GoalAnalytics Page
 *
 * Provides comprehensive performance analytics and insights for goal tracking.
 * Displays historical trends, completion rates, velocity patterns, and predictive forecasts.
 *
 * Features:
 * - Monthly completion rate trend chart
 * - Velocity comparison (user vs team vs company)
 * - Goal type breakdown (pie chart)
 * - Date range and type filters
 * - Insufficient data handling (<30 days)
 * - Key performance indicators
 *
 * @page
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Avatar,
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  CalendarMonth as CalendarMonthIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  EmojiEvents as EmojiEventsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { LineChart, BarChart, PieChart } from '@mui/x-charts';
import { useNavigate } from 'react-router-dom';
import goalsApi from '@infrastructure/api/goalsApi';
import CustomSnackbar from '@presentation/components/CustomSnackbar';

/**
 * Calculate completion rate trend by month
 */
const calculateCompletionRateTrend = (goals) => {
  const monthlyData = {};

  goals.forEach(goal => {
    if (goal.endDate) {
      const endDate = new Date(goal.endDate);
      const monthKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, completed: 0 };
      }

      monthlyData[monthKey].total++;
      if (goal.status === 'completed' || parseFloat(goal.progress ?? goal.progressPercentage ?? 0) >= 100) {
        monthlyData[monthKey].completed++;
      }
    }
  });

  // Convert to array and sort by month
  const sortedMonths = Object.keys(monthlyData).sort();
  const last12Months = sortedMonths.slice(-12);

  return last12Months.map(monthKey => ({
    month: monthKey,
    completionRate: monthlyData[monthKey].total > 0
      ? (monthlyData[monthKey].completed / monthlyData[monthKey].total) * 100
      : 0,
    total: monthlyData[monthKey].total,
    completed: monthlyData[monthKey].completed
  }));
};

/**
 * Calculate average velocity (progress per day)
 */
const calculateVelocity = (goals) => {
  const velocities = goals
    .filter(g => g.startDate && g.endDate && g.progress)
    .map(goal => {
      const start = new Date(goal.startDate);
      const end = new Date(goal.endDate);
      const now = new Date();
      const daysElapsed = Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
      const progress = parseFloat(goal.progress || goal.progressPercentage || 0);
      return progress / daysElapsed; // Progress per day
    })
    .filter(v => v > 0 && !isNaN(v));

  const avgVelocity = velocities.length > 0
    ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
    : 0;

  return avgVelocity;
};

/**
 * Calculate goal type breakdown
 */
const calculateGoalTypeBreakdown = (goals) => {
  const breakdown = {};

  goals.forEach(goal => {
    const type = goal.type || 'unknown';
    if (!breakdown[type]) {
      breakdown[type] = { total: 0, completed: 0 };
    }

    breakdown[type].total++;
    if (goal.status === 'completed' || parseFloat(goal.progress ?? goal.progressPercentage ?? 0) >= 100) {
      breakdown[type].completed++;
    }
  });

  return Object.entries(breakdown).map(([type, data]) => ({
    type,
    completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    total: data.total,
    completed: data.completed
  }));
};

/**
 * Check if sufficient data exists (>= 30 days)
 */
const hasSufficientData = (goals) => {
  if (goals.length === 0) return false;

  const oldestGoal = goals.reduce((oldest, goal) => {
    const createdOn = goal.createdOn || goal.created_on || goal.startDate;
    if (!createdOn) return oldest;

    const goalDate = new Date(createdOn);
    return !oldest || goalDate < new Date(oldest) ? createdOn : oldest;
  }, null);

  if (!oldestGoal) return false;

  const daysSinceOldest = Math.ceil((new Date() - new Date(oldestGoal)) / (1000 * 60 * 60 * 24));
  return daysSinceOldest >= 30;
};

const GoalAnalytics = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterOwnerType, setFilterOwnerType] = useState('all');
  const [dateRange, setDateRange] = useState('last_12_months');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  /**
   * Fetch analytics from backend
   */
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query params for backend analytics endpoint
      const params = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterOwnerType !== 'all') params.ownerType = filterOwnerType;

      // Add date range filtering
      if (dateRange !== 'all_time') {
        const now = new Date();
        const cutoffDate = new Date();
        if (dateRange === 'last_3_months') {
          cutoffDate.setMonth(now.getMonth() - 3);
        } else if (dateRange === 'last_6_months') {
          cutoffDate.setMonth(now.getMonth() - 6);
        } else if (dateRange === 'last_12_months') {
          cutoffDate.setMonth(now.getMonth() - 12);
        }
        params.startDate = cutoffDate.toISOString().split('T')[0];
      }

      const response = await goalsApi.getAnalytics(params);
      const analyticsData = response.data;

      // Also fetch goals for display purposes (fallback if analytics doesn't have all data)
      const goalsResponse = await goalsApi.getGoals(params);
      setGoals(goalsResponse.data || []);

      // Use backend analytics data if available
      if (analyticsData) {
        setAnalyticsData(analyticsData);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics data. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to load analytics data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [filterType, filterOwnerType, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /**
   * Calculate analytics metrics
   * Uses backend data if available, falls back to client-side calculations
   */
  const analytics = useMemo(() => {
    // If we have backend analytics data, use it
    if (analyticsData) {
      return {
        completionTrend: analyticsData.completionRateTrend || [],
        velocity: analyticsData.averageVelocity || 0,
        velocityDataPoints: analyticsData.velocityDataPoints || 0,
        typeBreakdown: analyticsData.typeBreakdown || [],
        sufficientData: analyticsData.hasSufficientData || false,
        totalGoals: analyticsData.totalGoals || 0,
        completedGoals: analyticsData.completedGoals || 0,
        activeGoals: analyticsData.activeGoals || 0,
        cancelledGoals: analyticsData.cancelledGoals || 0,
        overallCompletionRate: analyticsData.overallCompletionRate || 0,
        avgProgress: analyticsData.averageProgress || 0,
        teamAverageCompletion: analyticsData.teamAverageCompletionRate,
        companyAverageCompletion: analyticsData.companyAverageCompletionRate,
        teamAverageVelocity: analyticsData.teamAverageVelocity,
        companyAverageVelocity: analyticsData.companyAverageVelocity,
        daysOfHistory: analyticsData.daysOfHistory || 0
      };
    }

    // Fallback to client-side calculations (for backward compatibility or when backend fails)
    const completionTrend = calculateCompletionRateTrend(goals);
    const velocity = calculateVelocity(goals);
    const typeBreakdown = calculateGoalTypeBreakdown(goals);
    const sufficient = hasSufficientData(goals);

    const totalGoals = goals.length;
    const completedGoals = goals.filter(g =>
      g.status === 'completed' || parseFloat(g.progress ?? g.progressPercentage ?? 0) >= 100
    ).length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const cancelledGoals = goals.filter(g => g.status === 'cancelled').length;
    const overallCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // Average progress
    const avgProgress = totalGoals > 0
      ? goals.reduce((sum, g) => sum + parseFloat(g.progress ?? g.progressPercentage ?? 0), 0) / totalGoals
      : 0;

    return {
      completionTrend,
      velocity,
      velocityDataPoints: 0,
      typeBreakdown,
      sufficientData: sufficient,
      totalGoals,
      completedGoals,
      activeGoals,
      cancelledGoals,
      overallCompletionRate,
      avgProgress,
      teamAverageCompletion: null,
      companyAverageCompletion: null,
      teamAverageVelocity: null,
      companyAverageVelocity: null,
      daysOfHistory: 0
    };
  }, [analyticsData, goals]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading analytics data...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink
          component="button"
          variant="body2"
          onClick={() => navigate('/goals')}
          sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Goals
        </MuiLink>
        <Typography variant="body2" color="text.primary">
          Analytics
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => navigate('/goals')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <AssessmentIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Goal Analytics & Insights
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Performance trends and predictive insights
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={fetchAnalytics}
          sx={{ textTransform: 'none' }}
        >
          Refresh
        </Button>
      </Stack>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Insufficient Data Warning */}
      {!analytics.sufficientData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Insufficient Historical Data:</strong> Analytics insights improve with more data.
            You currently have less than 30 days of goal history. Create more goals and track progress
            to see meaningful trends and comparisons.
          </Typography>
        </Alert>
      )}

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <FilterListIcon color="action" />
            <Typography variant="subtitle2" fontWeight={600}>
              Filters
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="last_3_months">Last 3 Months</MenuItem>
                  <MenuItem value="last_6_months">Last 6 Months</MenuItem>
                  <MenuItem value="last_12_months">Last 12 Months</MenuItem>
                  <MenuItem value="all_time">All Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Goal Type</InputLabel>
                <Select
                  value={filterType}
                  label="Goal Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="revenue">Revenue</MenuItem>
                  <MenuItem value="deals">Deals</MenuItem>
                  <MenuItem value="activities">Activities</MenuItem>
                  <MenuItem value="tasks">Tasks</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Owner Type</InputLabel>
                <Select
                  value={filterOwnerType}
                  label="Owner Type"
                  onChange={(e) => setFilterOwnerType(e.target.value)}
                >
                  <MenuItem value="all">All Owners</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="team">Team</MenuItem>
                  <MenuItem value="company">Company</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AssessmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.totalGoals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Goals
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.overallCompletionRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SpeedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.velocity.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Velocity (%/day)
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.avgProgress.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Progress
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Completion Rate Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Monthly Completion Rate Trend
              </Typography>
              {analytics.completionTrend.length > 0 ? (
                <LineChart
                  xAxis={[{
                    data: analytics.completionTrend.map(d => d.month),
                    scaleType: 'band'
                  }]}
                  series={[{
                    data: analytics.completionTrend.map(d => d.completionRate),
                    label: 'Completion Rate (%)',
                    color: '#2e7d32'
                  }]}
                  height={300}
                />
              ) : (
                <Alert severity="info">No completion trend data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Goal Type Breakdown */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Goal Type Breakdown
              </Typography>
              {analytics.typeBreakdown.length > 0 ? (
                <PieChart
                  series={[{
                    data: analytics.typeBreakdown.map((item, index) => ({
                      id: index,
                      value: item.total,
                      label: item.type
                    })),
                    highlightScope: { faded: 'global', highlighted: 'item' },
                    faded: { innerRadius: 30, additionalRadius: -30 }
                  }]}
                  height={300}
                />
              ) : (
                <Alert severity="info">No type breakdown data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Completion Rates by Type */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Completion Rates by Goal Type
              </Typography>
              {analytics.typeBreakdown.length > 0 ? (
                <BarChart
                  xAxis={[{
                    data: analytics.typeBreakdown.map(d => d.type),
                    scaleType: 'band'
                  }]}
                  series={[{
                    data: analytics.typeBreakdown.map(d => d.completionRate),
                    label: 'Completion Rate (%)',
                    color: '#1976d2'
                  }]}
                  height={300}
                />
              ) : (
                <Alert severity="info">No completion rate data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default GoalAnalytics;

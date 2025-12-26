import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  LinearProgress,
  Divider,
  IconButton,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import goalsApi from '@infrastructure/api/goalsApi';
import GoalComments from '@presentation/components/goals/GoalComments';
import {
  ProgressHistoryChart,
  GoalForecastBadge,
  GoalCalculationSourceBadge,
  RecalculateButton
} from '@presentation/components/goals';
import { goalProgressCalculator } from '@application/services/goalProgressCalculator';

/**
 * GoalDetailPage
 * Displays comprehensive goal details including:
 * - Goal information and metadata
 * - Progress tracking and history
 * - Forecast and calculation status
 * - Comments thread
 * - Action buttons (Edit, Delete, Recalculate)
 */
const GoalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGoalDetails();
  }, [id]);

  const loadGoalDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await goalsApi.getById(id);
      setGoal(response.data.data);
    } catch (err) {
      console.error('Failed to load goal:', err);
      setError(err.response?.data?.message || 'Failed to load goal details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Navigate to edit mode or open edit dialog
    navigate(`/goals/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      await goalsApi.delete(id);
      navigate('/goals');
    } catch (err) {
      console.error('Failed to delete goal:', err);
      alert(err.response?.data?.message || 'Failed to delete goal');
    }
  };

  const handleRecalculated = async () => {
    await loadGoalDetails();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/goals')} sx={{ mt: 2 }}>
          Back to Goals
        </Button>
      </Container>
    );
  }

  if (!goal) return null;

  const statusBadge = goalProgressCalculator.getGoalStatusBadge(goal);
  const daysRemaining = goalProgressCalculator.calculateDaysRemaining(goal.endDate);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => navigate('/goals')} sx={{ cursor: 'pointer' }}>
          Goals
        </Link>
        <Typography color="text.primary">{goal.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {goal.name}
          </Typography>
          {goal.description && (
            <Typography variant="body1" color="text.secondary">
              {goal.description}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handleEdit} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={handleDelete} color="error">
            <DeleteIcon />
          </IconButton>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/goals')}>
            Back
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Goal Details */}
        <Grid item xs={12} md={8}>
          {/* Progress Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progress
              </Typography>

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    {goalProgressCalculator.formatProgressDisplay(
                      goal.progress,
                      goal.targetValue,
                      goal.type
                    )}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {goal.progressPercentage?.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(goal.progressPercentage || 0, 100)}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>

              {/* Progress History Chart */}
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Progress History
                </Typography>
                <ProgressHistoryChart goalId={goal.id} height={100} />
              </Box>
            </CardContent>
          </Card>

          {/* Forecast Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Forecast
              </Typography>
              <GoalForecastBadge goalId={goal.id} goal={goal} showDetails />
            </CardContent>
          </Card>

          {/* Comments Card */}
          <Card>
            <CardContent>
              <GoalComments goalId={goal.id} currentUserEmail="user@example.com" />
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Metadata */}
        <Grid item xs={12} md={4}>
          {/* Status and Badges */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status
              </Typography>
              <Stack spacing={1}>
                <Chip label={goal.status} color={goal.status === 'active' ? 'success' : 'default'} />
                <Chip label={statusBadge.label} color={statusBadge.color} icon={statusBadge.icon} />
                <GoalCalculationSourceBadge goal={goal} />
              </Stack>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Timeline
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body2">
                    {goal.startDate
                      ? new Date(goal.startDate).toLocaleDateString()
                      : 'Not set'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography variant="body2">
                    {goal.endDate ? new Date(goal.endDate).toLocaleDateString() : 'Not set'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Days Remaining
                  </Typography>
                  <Typography
                    variant="body2"
                    color={daysRemaining < 0 ? 'error' : daysRemaining < 7 ? 'warning.main' : 'text.primary'}
                  >
                    {daysRemaining} days
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body2">{goal.type || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Timeframe
                  </Typography>
                  <Typography variant="body2">{goal.timeframe || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Owner Type
                  </Typography>
                  <Typography variant="body2">{goal.ownerType || 'N/A'}</Typography>
                </Box>
                {goal.lastCalculatedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Calculated
                    </Typography>
                    <Typography variant="body2">
                      {new Date(goal.lastCalculatedAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Actions */}
          {goal.calculationSource === 'auto_calculated' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <RecalculateButton goalId={goal.id} onRecalculated={handleRecalculated} fullWidth />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default GoalDetailPage;

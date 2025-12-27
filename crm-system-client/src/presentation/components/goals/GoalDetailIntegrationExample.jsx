/**
 * GoalDetailIntegrationExample.jsx
 *
 * This file demonstrates how to integrate auto-calculation components into the goal detail page.
 * Copy the relevant sections into your actual goal detail implementation.
 *
 * Key Integration Points:
 * 1. Display calculation metadata (source, last calculated, failed status)
 * 2. Show full-size progress history chart
 * 3. Display detailed forecast information
 * 4. Add action buttons for manual adjustment and recalculation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import goalsApi from '../../../infrastructure/api/goalsApi';

// Import auto-calculation components
import {
  ProgressHistoryChart,
  GoalForecastBadge,
  ManualProgressAdjustmentDialog,
  GoalCalculationSourceBadge,
  RecalculateButton,
} from '../../components/goals';

const GoalDetailIntegrationExample = () => {
  const { id } = useParams();
  const [goal, setGoal] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGoalDetails();
      fetchForecast();
    }
  }, [id]);

  const fetchGoalDetails = async () => {
    try {
      setLoading(true);
      const response = await goalsApi.getById(id);
      setGoal(response.data?.data);
    } catch (error) {
      console.error('Failed to fetch goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async () => {
    try {
      const response = await goalsApi.getForecast(id);
      setForecast(response.data?.data);
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
    }
  };

  const handleAdjustmentSuccess = (updatedGoal) => {
    setGoal(updatedGoal);
    fetchForecast(); // Refresh forecast after adjustment
  };

  const handleRecalculateSuccess = (updatedGoal) => {
    setGoal(updatedGoal);
    fetchForecast(); // Refresh forecast after recalculation
  };

  if (loading || !goal) {
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Goal Overview Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {goal.name}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={goal.status} color="primary" size="small" />
                {/* NEW: Calculation source badge */}
                <GoalCalculationSourceBadge goal={goal} size="small" />
                {/* NEW: Forecast badge */}
                <GoalForecastBadge goalId={goal.id} size="small" />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Progress Information */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="h6">
                    {goal.progress} / {goal.targetValue} ({goal.progressPercentage?.toFixed(1)}%)
                  </Typography>
                </Grid>

                {/* NEW: Display calculation metadata */}
                {goal.calculationSource === 'auto_calculated' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Calculated
                      </Typography>
                      <Typography variant="body1">
                        {goal.lastCalculatedAt
                          ? new Date(goal.lastCalculatedAt).toLocaleString()
                          : 'Never'}
                      </Typography>
                    </Grid>

                    {/* NEW: Show calculation failure warning */}
                    {goal.calculationFailed && (
                      <Grid item xs={12}>
                        <Alert severity="error">
                          Automatic calculation failed. Please try recalculating or adjust manually.
                        </Alert>
                      </Grid>
                    )}
                  </>
                )}

                {/* NEW: Display manual override reason */}
                {goal.manualOverrideReason && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <Typography variant="body2" fontWeight="bold">
                        Manual Override Reason:
                      </Typography>
                      <Typography variant="body2">{goal.manualOverrideReason}</Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* NEW: Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => setAdjustDialogOpen(true)}
                >
                  Manual Adjustment
                </Button>

                {goal.calculationSource === 'auto_calculated' && (
                  <RecalculateButton
                    goal={goal}
                    onSuccess={handleRecalculateSuccess}
                    variant="button"
                    size="medium"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* NEW: Progress History & Forecast Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progress Trend
              </Typography>

              {/* NEW: Full-size progress history chart */}
              <Box sx={{ mb: 3 }}>
                <ProgressHistoryChart
                  goalId={goal.id}
                  height={100}
                  showSpots={true}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* NEW: Detailed forecast information */}
              {forecast && forecast.forecastStatus !== 'insufficient_data' && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Forecast Details
                  </Typography>

                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body2">
                        {forecast.forecastStatus.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Confidence
                      </Typography>
                      <Typography variant="body2">
                        {forecast.confidenceLevel.toUpperCase()}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Daily Velocity
                      </Typography>
                      <Typography variant="body2">
                        {forecast.dailyVelocity?.toFixed(2)}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Weekly Velocity
                      </Typography>
                      <Typography variant="body2">
                        {forecast.weeklyVelocity?.toFixed(2)}
                      </Typography>
                    </Grid>

                    {forecast.estimatedCompletionDate && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Estimated Completion
                        </Typography>
                        <Typography variant="body2">
                          {new Date(forecast.estimatedCompletionDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Days Remaining
                      </Typography>
                      <Typography variant="body2">
                        {forecast.daysRemaining} days
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Required Daily Velocity
                      </Typography>
                      <Typography variant="body2">
                        {forecast.requiredDailyVelocity?.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Show message if insufficient data */}
              {forecast && forecast.forecastStatus === 'insufficient_data' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {forecast.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* NEW: Manual Adjustment Dialog */}
      <ManualProgressAdjustmentDialog
        open={adjustDialogOpen}
        onClose={() => setAdjustDialogOpen(false)}
        goal={goal}
        onSuccess={handleAdjustmentSuccess}
      />
    </Box>
  );
};

export default GoalDetailIntegrationExample;

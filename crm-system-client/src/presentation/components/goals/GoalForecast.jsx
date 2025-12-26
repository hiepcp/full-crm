import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Chip, Typography, Tooltip, CircularProgress, Alert } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat, Warning, Info } from '@mui/icons-material';
import goalsApi from '@infrastructure/api/goalsApi';
import goalForecastService from '@application/services/goalForecastService';

/**
 * GoalForecast Component
 * Displays goal forecast with status badge and velocity-based predictions
 * Shows: forecast status, estimated completion, velocity, confidence level
 */
const GoalForecast = ({ goalId, goal, showDetails = false, compact = false }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (goalId) {
      loadForecast();
    }
  }, [goalId]);

  const loadForecast = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await goalsApi.getForecast(goalId);
      setForecast(response.data.data);
    } catch (err) {
      console.error('Failed to load forecast:', err);
      setError(err.response?.data?.message || 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  };

  const getForecastIcon = (status) => {
    const iconMap = {
      ahead: <TrendingUp fontSize="small" />,
      'on-track': <TrendingFlat fontSize="small" />,
      behind: <TrendingDown fontSize="small" />,
      'at-risk': <Warning fontSize="small" />,
      'insufficient-data': <Info fontSize="small" />
    };
    return iconMap[status] || null;
  };

  const getForecastColor = (status) => {
    return goalForecastService.getForecastStatusColor(status);
  };

  const getForecastLabel = (status) => {
    return goalForecastService.getForecastStatusLabel(status);
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Loading forecast...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ py: 0.5 }}>
        {error}
      </Alert>
    );
  }

  if (!forecast) {
    return null;
  }

  const { forecastStatus, dailyVelocity, weeklyVelocity, estimatedCompletionDate, confidenceLevel, message } =
    forecast;

  const statusColor = getForecastColor(forecastStatus);
  const statusLabel = getForecastLabel(forecastStatus);
  const statusIcon = getForecastIcon(forecastStatus);

  // Compact mode - just show the chip
  if (compact) {
    return (
      <Tooltip title={message || statusLabel} arrow>
        <Chip
          icon={statusIcon}
          label={statusLabel}
          color={statusColor}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      </Tooltip>
    );
  }

  // Full mode with details
  return (
    <Box>
      {/* Status Badge */}
      <Box display="flex" alignItems="center" gap={1} mb={showDetails ? 1 : 0}>
        <Chip
          icon={statusIcon}
          label={statusLabel}
          color={statusColor}
          size="small"
          sx={{ fontWeight: 500 }}
        />
        {confidenceLevel && (
          <Chip
            label={`${confidenceLevel.toUpperCase()} confidence`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: '20px' }}
          />
        )}
      </Box>

      {/* Forecast Message */}
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: showDetails ? 1 : 0 }}>
          {message}
        </Typography>
      )}

      {/* Detailed Forecast Info */}
      {showDetails && forecastStatus !== 'insufficient-data' && (
        <Box sx={{ mt: 1, pl: 2, borderLeft: '3px solid', borderColor: `${statusColor}.main` }}>
          <Typography variant="caption" display="block" color="text.secondary">
            <strong>Daily Velocity:</strong> {dailyVelocity?.toFixed(2) || 0}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            <strong>Weekly Velocity:</strong> {weeklyVelocity?.toFixed(2) || 0}
          </Typography>
          {estimatedCompletionDate && (
            <Typography variant="caption" display="block" color="text.secondary">
              <strong>Est. Completion:</strong>{' '}
              {new Date(estimatedCompletionDate).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

GoalForecast.propTypes = {
  goalId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  goal: PropTypes.object,
  showDetails: PropTypes.bool,
  compact: PropTypes.bool
};

export default GoalForecast;

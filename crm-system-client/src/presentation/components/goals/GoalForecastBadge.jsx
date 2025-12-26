import React, { useEffect, useState } from 'react';
import { Chip, Tooltip, CircularProgress } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import goalsApi from '../../../infrastructure/api/goalsApi';

/**
 * GoalForecastBadge - Displays forecast status as a colored badge with icon
 * @param {Object} props
 * @param {number} props.goalId - Goal ID to fetch forecast for
 * @param {boolean} props.showTooltip - Show detailed tooltip (default: true)
 * @param {string} props.size - Chip size: 'small' | 'medium' (default: 'small')
 */
const GoalForecastBadge = ({ goalId, showTooltip = true, size = 'small' }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await goalsApi.getForecast(goalId);
        setForecast(response.data?.data || null);
      } catch (err) {
        console.error('Failed to fetch forecast:', err);
        setError(err.response?.data?.message || 'Failed to load forecast');
      } finally {
        setLoading(false);
      }
    };

    if (goalId) {
      fetchForecast();
    }
  }, [goalId]);

  if (loading) {
    return <CircularProgress size={16} />;
  }

  if (error || !forecast) {
    return null; // Silently fail to avoid cluttering the UI
  }

  const { forecastStatus, dailyVelocity, estimatedCompletionDate, confidenceLevel, message } = forecast;

  // Determine badge color and icon based on status
  const getStatusConfig = () => {
    switch (forecastStatus) {
      case 'ahead':
        return {
          color: 'success',
          icon: <TrendingUpIcon fontSize="small" />,
          label: 'Ahead',
        };
      case 'on_track':
        return {
          color: 'success',
          icon: <CheckCircleIcon fontSize="small" />,
          label: 'On Track',
        };
      case 'behind':
        return {
          color: 'warning',
          icon: <TrendingDownIcon fontSize="small" />,
          label: 'Behind',
        };
      case 'at_risk':
        return {
          color: 'error',
          icon: <WarningIcon fontSize="small" />,
          label: 'At Risk',
        };
      case 'insufficient_data':
        return {
          color: 'default',
          icon: <InfoIcon fontSize="small" />,
          label: 'Insufficient Data',
        };
      default:
        return {
          color: 'default',
          icon: <InfoIcon fontSize="small" />,
          label: 'Unknown',
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Build tooltip content
  const buildTooltipContent = () => {
    if (message) {
      return message;
    }

    const parts = [];
    if (dailyVelocity !== undefined) {
      parts.push(`Daily velocity: ${dailyVelocity.toFixed(2)}`);
    }
    if (estimatedCompletionDate) {
      const estimatedDate = new Date(estimatedCompletionDate).toLocaleDateString();
      parts.push(`Est. completion: ${estimatedDate}`);
    }
    if (confidenceLevel) {
      parts.push(`Confidence: ${confidenceLevel}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'Forecast available';
  };

  const chipElement = (
    <Chip
      icon={statusConfig.icon}
      label={statusConfig.label}
      color={statusConfig.color}
      size={size}
      variant="outlined"
    />
  );

  if (showTooltip) {
    return <Tooltip title={buildTooltipContent()}>{chipElement}</Tooltip>;
  }

  return chipElement;
};

export default GoalForecastBadge;

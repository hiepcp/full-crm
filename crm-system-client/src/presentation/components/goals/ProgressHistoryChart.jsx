import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, useTheme } from '@mui/material';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import goalsApi from '../../../infrastructure/api/goalsApi';

/**
 * ProgressHistoryChart - Displays a sparkline chart of goal progress history
 * @param {Object} props
 * @param {number} props.goalId - Goal ID to fetch history for
 * @param {number} props.height - Chart height (default: 50)
 * @param {string} props.color - Line color (optional, defaults to theme primary color)
 * @param {boolean} props.showSpots - Show data points (default: true)
 */
const ProgressHistoryChart = ({ goalId, height = 50, color, showSpots = true }) => {
  const theme = useTheme();
  const lineColor = color || theme.palette.primary.main;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await goalsApi.getProgressHistory(goalId);
        const historyData = response.data?.data || [];

        // Sort by timestamp and extract progress percentages
        const sortedHistory = historyData
          .sort((a, b) => new Date(a.snapshotTimestamp) - new Date(b.snapshotTimestamp))
          .map(item => item.progressPercentage);

        setHistory(sortedHistory);
      } catch (err) {
        console.error('Failed to fetch progress history:', err);
        setError(err.response?.data?.message || 'Failed to load progress history');
      } finally {
        setLoading(false);
      }
    };

    if (goalId) {
      fetchHistory();
    }
  }, [goalId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ py: 0.5 }}>
        <Typography variant="caption">{error}</Typography>
      </Alert>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Box display="flex" alignItems="center" height={height}>
        <Typography variant="caption" color="text.secondary">
          No history data available
        </Typography>
      </Box>
    );
  }

  if (history.length === 1) {
    return (
      <Box display="flex" alignItems="center" height={height}>
        <Typography variant="caption" color="text.secondary">
          {history[0].toFixed(1)}% (1 data point)
        </Typography>
      </Box>
    );
  }

  return (
    <Box width="100%" height={height}>
      <Sparklines data={history} width={100} height={height} margin={5}>
        <SparklinesLine color={lineColor} style={{ strokeWidth: 2, fill: 'none' }} />
        {showSpots && <SparklinesSpots size={3} style={{ fill: lineColor }} />}
      </Sparklines>
    </Box>
  );
};

export default ProgressHistoryChart;

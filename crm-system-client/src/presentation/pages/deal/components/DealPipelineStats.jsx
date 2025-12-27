import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

/**
 * DealPipelineStats component - displays pipeline statistics for a specific deal
 * @param {Object} props
 * @param {Array} props.pipelineLogs - Array of pipeline log objects for the deal
 */
const DealPipelineStats = ({
  pipelineLogs = []
}) => {
  const theme = useTheme();
  // Calculate pipeline statistics
  const calculateStats = (logs) => {
    if (!logs || logs.length === 0) {
      return {
        totalChanges: 0,
        averageTimeInStage: 0,
        currentStage: 'N/A',
        stageProgression: [],
        conversionRate: 0
      };
    }

    const totalChanges = logs.length;
    const currentStage = logs[0]?.newStage || 'N/A';

    // Calculate average time in each stage
    const stageDurations = {};
    logs.forEach((log, index) => {
      if (index < logs.length - 1) {
        const nextLog = logs[index + 1];
        const duration = new Date(nextLog.changedAt) - new Date(log.changedAt);
        const daysInStage = Math.ceil(duration / (1000 * 60 * 60 * 24));

        if (!stageDurations[log.newStage]) {
          stageDurations[log.newStage] = [];
        }
        stageDurations[log.newStage].push(daysInStage);
      }
    });

    const averageTimeInStage = Object.values(stageDurations).length > 0
      ? Math.round(Object.values(stageDurations).flat().reduce((a, b) => a + b, 0) / Object.values(stageDurations).flat().length)
      : 0;

    // Stage progression analysis
    const stageProgression = logs.map(log => ({
      stage: log.newStage,
      date: log.changedAt,
      notes: log.notes
    }));

    // Simple conversion rate (if ended in Closed Won)
    const conversionRate = currentStage === 'Closed Won' ? 100 :
      currentStage === 'Closed Lost' ? 0 : 50;

    return {
      totalChanges,
      averageTimeInStage,
      currentStage,
      stageProgression,
      conversionRate
    };
  };

  const stats = calculateStats(pipelineLogs);

  // Get stage color
  const getStageColor = (stage) => {
    const stageColors = {
      'Prospecting': theme.palette.grey[500],
      'Quotation': theme.palette.secondary.main,
      'Negotiation': theme.palette.warning.main,
      'Closed Won': theme.palette.success.main,
      'Closed Lost': theme.palette.error.main
    };
    return stageColors[stage] || theme.palette.grey[500];
  };

  // Get stage icon
  const getStageIcon = (stage) => {
    if (stage === 'Closed Won') return <TrendingUpIcon />;
    if (stage === 'Closed Lost') return <TrendingDownIcon />;
    return <ScheduleIcon />;
  };

  if (!pipelineLogs || pipelineLogs.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Pipeline Statistics
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TimelineIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
              No pipeline data available yet.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Pipeline Statistics
        </Typography>

        <Grid container spacing={3}>
          {/* Current Stage */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                {getStageIcon(stats.currentStage)}
                <Typography variant="subtitle2" color="text.secondary">
                  CURRENT STAGE
                </Typography>
              </Box>
              <Chip
                label={stats.currentStage}
                sx={{
                  bgcolor: getStageColor(stats.currentStage),
                  color: theme.palette.common.white,
                  fontSize: '1rem',
                  height: '32px',
                  fontWeight: 600
                }}
              />
            </Box>
          </Grid>

          {/* Total Changes */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <TimelineIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  TOTAL CHANGES
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {stats.totalChanges}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Average Time in Stage */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  AVG. TIME IN STAGE
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {stats.averageTimeInStage} days
              </Typography>
            </Box>
          </Grid>

          {/* Conversion Rate */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <SpeedIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  CONVERSION RATE
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {stats.conversionRate}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats.conversionRate}
                  sx={{
                    width: 60,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: stats.conversionRate >= 70 ? 'success.main' :
                        stats.conversionRate >= 40 ? 'warning.main' : 'error.main'
                    }
                  }}
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Stage Progression Summary */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
              STAGE PROGRESSION
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {stats.stageProgression.slice(0, 5).map((stage, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={stage.stage}
                    size="small"
                    sx={{
                      bgcolor: getStageColor(stage.stage),
                      color: theme.palette.common.white,
                      fontSize: '0.75rem'
                    }}
                  />
                  {index < stats.stageProgression.length - 1 && (
                    <Typography variant="caption" color="text.secondary">→</Typography>
                  )}
                </Box>
              ))}
              {stats.stageProgression.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  ... +{stats.stageProgression.length - 5} more
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DealPipelineStats;

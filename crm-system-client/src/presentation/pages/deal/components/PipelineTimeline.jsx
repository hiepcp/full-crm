import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { formatDate } from '../../../../utils/formatDate';

/**
 * PipelineTimeline component - displays pipeline stage changes in a timeline format
 * @param {Object} props
 * @param {Array} props.pipelineLogs - Array of pipeline log objects
 * @param {string} props.title - Title for the timeline (default: "Pipeline Timeline")
 */
const PipelineTimeline = ({
  pipelineLogs = [],
  title = "Pipeline Timeline"
}) => {
  const theme = useTheme();
  // Get stage color based on stage type
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

  // Get stage icon based on stage transition
  const getStageIcon = (oldStage, newStage) => {
    if (newStage === 'Closed Won') {
      return <TrendingUpIcon />;
    } else if (newStage === 'Closed Lost') {
      return <TrendingDownIcon />;
    } else {
      return <ScheduleIcon />;
    }
  };

  // Get stage transition type
  const getTransitionType = (oldStage, newStage) => {
    if (newStage === 'Closed Won') return 'success';
    if (newStage === 'Closed Lost') return 'error';
    if (newStage === 'Negotiation') return 'warning';
    return 'info';
  };

  if (!pipelineLogs || pipelineLogs.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {title}
          </Typography>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <ScheduleIcon sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.grey[700], mb: 1 }}>
              No Pipeline History
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
              Pipeline stage changes will appear here as the deal progresses.
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
          {title} ({pipelineLogs.length})
        </Typography>

        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
          <List>
            {pipelineLogs.map((log, index) => (
              <React.Fragment key={log.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: getStageColor(log.newStage),
                        width: 40,
                        height: 40
                      }}
                    >
                      {getStageIcon(log.oldStage, log.newStage)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {log.oldStage} → {log.newStage}
                        </Typography>
                        <Chip
                          label={log.newStage}
                          size="small"
                          sx={{
                            bgcolor: getStageColor(log.newStage),
                            color: 'white',
                            fontSize: '0.75rem',
                            height: '20px'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {log.notes}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Changed by {log.changedBy}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(log.changedAt)} at {new Date(log.changedAt).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < pipelineLogs.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PipelineTimeline;

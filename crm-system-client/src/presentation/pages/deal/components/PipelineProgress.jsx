import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

/**
 * PipelineProgress component - displays pipeline stage progress as horizontal step progress bar
 * @param {Object} props
 * @param {Array} props.pipelineLogs - Array of pipeline log objects for the deal
 * @param {string} props.currentStage - Current stage of the deal
 */
const PipelineProgress = ({
  pipelineLogs = [],
  currentStage = 'Prospecting'
}) => {
  const theme = useTheme();
  // Define pipeline stages in order với tên hiển thị phù hợp
  const stages = [
    { key: 'Prospecting', label: 'Prospecting', color: theme.palette.grey[500] },
    { key: 'Quotation', label: 'Quotation', color: theme.palette.secondary.main },
    { key: 'Negotiation', label: 'Negotiation', color: theme.palette.warning.main },
    { key: 'Closed Won', label: 'Closed Won', color: theme.palette.success.main },
    { key: 'Closed Lost', label: 'Closed Lost', color: theme.palette.error.main }
  ];

  // Find current stage index
  const currentStageIndex = stages.findIndex(stage => stage.key === currentStage);

  // Create step progress bar với thiết kế chevron
  const StepProgressBar = () => {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: '100%',
        overflowX: { xs: 'auto', md: 'visible' },
        pb: { xs: 1, md: 0 }
      }}>
        {stages.map((stage, index) => {
          const isCompleted = index <= currentStageIndex;
          const isCurrent = index === currentStageIndex;

          return (
            <React.Fragment key={stage.key}>
              {/* Step chevron */}
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: { xs: 32, sm: 36, md: 40 },
                  flex: 1,
                  minWidth: { xs: 96, sm: 112, md: 128 },
                  px: { xs: 1.25, sm: 1.5, md: 2 },
                  py: 1,
                  bgcolor: isCurrent
                    ? stage.color
                    : isCompleted
                      ? theme.palette.primary.lighter // subtle completed background
                      : theme.palette.grey[50],
                  color: isCurrent
                    ? 'white'
                    : isCompleted
                      ? theme.palette.grey[700]
                      : theme.palette.grey[400],
                  fontSize: { xs: '0.68rem', sm: '0.75rem', md: '0.875rem' },
                  fontWeight: isCurrent ? 600 : 500,
                  textAlign: 'center',
                  borderRadius: { xs: 1, md: 0 },
                  transition: 'all 0.2s ease-in-out',
                  whiteSpace: 'nowrap',
                  overflow: 'visible', // allow arrow head to protrude
                  flexShrink: { xs: 0, md: 1 },
                  zIndex: 1,
                  // Chevron heads (desktop/tablet). On mobile, fall back to rounded pills.
                  '&:after': {
                    content: '""',
                    display: { xs: 'none', sm: 'block' },
                    position: 'absolute',
                    top: 0,
                    right: -12,
                    width: 0,
                    height: 0,
                    borderTop: { sm: '18px solid transparent', md: '20px solid transparent' },
                    borderBottom: { sm: '18px solid transparent', md: '20px solid transparent' },
                    borderLeft: {
                      sm: `12px solid ${isCurrent ? stage.color : (isCompleted ? theme.palette.primary.lighter : theme.palette.grey[50])}`,
                      md: `12px solid ${isCurrent ? stage.color : (isCompleted ? theme.palette.primary.lighter : theme.palette.grey[50])}`
                    },
                    zIndex: 2
                  },
                  '&:before': {
                    display: 'none'
                  },
                  // add gaps between stages
                  ml: index === 0 ? 0 : { xs: 0, sm: '10px', md: '12px' },
                  // elevate current
                  boxShadow: isCurrent ? theme.shadows[2] : 'none'
                }}
              >
                {/* Check Icon - ẩn trên mobile rất nhỏ */}
                {isCompleted && (
                  <CheckCircleIcon
                    sx={{
                      fontSize: { xs: 12, sm: 14, md: 16 },
                      mr: { xs: 0.25, sm: 0.5 },
                      color: isCurrent ? 'white' : theme.palette.success.main,
                      display: { xs: 'none', sm: 'block' }
                    }}
                  />
                )}

                {/* Stage Label */}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                    fontWeight: isCurrent ? 600 : 400,
                    color: 'inherit',
                    lineHeight: 1.2
                  }}
                >
                  {stage.label}
                </Typography>
              </Box>
            </React.Fragment>
          );
        })}
      </Box>
    );
  };

  return (
    <Paper
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 1,
        bgcolor: 'white',
        border: `1px solid ${theme.palette.grey[200]}`,
        borderRadius: 2
      }}
    >
      {/* Step Progress Bar */}
      <StepProgressBar />
    </Paper>
  );
};

export default PipelineProgress;


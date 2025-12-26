import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

/**
 * LeadStatusProgress component - displays lead status progress as horizontal step progress bar
 * @param {Object} props
 * @param {string} props.currentStatus - Current status of the lead
 */
const LeadStatusProgress = ({
  currentStatus = 'working'
}) => {
  const theme = useTheme();

  const statuses = [
    { key: 'working', label: 'Working', color: theme.palette.warning.main },
    { key: 'qualified', label: 'Qualified', color: theme.palette.success.main },
    { key: 'cancelled', label: 'Cancelled', color: theme.palette.error.main }
  ];

  const currentStatusIndex = statuses.findIndex(status => status.key === currentStatus);

  const StepProgressBar = () => {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        overflowX: { xs: 'auto', md: 'visible' },
        pb: { xs: 1, md: 0 }
      }}>
        {statuses.map((status, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;

          return (
            <React.Fragment key={status.key}>
              {/* Step Box */}
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: { xs: 32, sm: 36, md: 40 },
                  flex: 1,
                  minWidth: { xs: 80, sm: 90, md: 100 },
                  px: { xs: 1, sm: 1.5, md: 2 },
                  py: 1,
                  bgcolor: isCompleted
                    ? (isCurrent ? status.color : '#f3f4f6')
                    : '#f9fafb',
                  color: isCompleted
                    ? (isCurrent ? 'white' : '#6b7280')
                    : '#9ca3af',
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                  fontWeight: isCurrent ? 600 : 400,
                  textAlign: 'center',
                  clipPath: {
                    xs: 'none',
                    md: isCompleted
                      ? index === statuses.length - 1
                        ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                        : 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%)'
                      : index === 0
                        ? 'polygon(0% 0%, 100% 0%, 100% 100%, 10px 100%)'
                        : 'polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%)'
                  },
                  borderRadius: { xs: 1, md: 0 },
                  boxShadow: isCurrent
                    ? `0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 2px ${status.color}30`
                    : 'none',
                  transition: 'all 0.2s ease-in-out',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexShrink: { xs: 0, md: 1 }
                }}
              >
                {isCompleted && (
                  <CheckCircleIcon
                    sx={{
                      fontSize: { xs: 12, sm: 14, md: 16 },
                      mr: { xs: 0.25, sm: 0.5 },
                      color: isCurrent ? 'white' : '#10b981',
                      display: { xs: 'none', sm: 'block' }
                    }}
                  />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                    fontWeight: isCurrent ? 600 : 400,
                    color: 'inherit',
                    lineHeight: 1.2
                  }}
                >
                  {status.label}
                </Typography>
              </Box>
              {index < statuses.length - 1 && (
                <Box
                  sx={{
                    height: 2,
                    flex: { xs: '0 0 8px', sm: '0 0 12px', md: '0 0 20px' },
                    bgcolor: index < currentStatusIndex ? status.color : '#e5e7eb',
                    mx: { xs: 0.25, sm: 0.5 },
                    flexShrink: 0
                  }}
                />
              )}
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
        border: '1px solid #e5e7eb',
        borderRadius: 2
      }}
    >
      <StepProgressBar />
    </Paper>
  );
};

export default LeadStatusProgress;

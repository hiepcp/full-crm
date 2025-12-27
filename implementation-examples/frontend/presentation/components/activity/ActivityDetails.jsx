import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import { format } from 'date-fns';

/**
 * ActivityDetails Component
 * Feature 006-contract-activity-fields: Added contract date and value display
 * T018 [US1]: Display contract date with formatting
 * T028 [US2]: Display contract value with currency formatting
 * T038 [US3]: Ensure contract details section shows both fields together
 */
const ActivityDetails = ({ activity }) => {
  if (!activity) {
    return <Typography>Loading...</Typography>;
  }

  // T018 [US1]: Format contract date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'PPP'); // e.g., "January 15, 2025"
    } catch (error) {
      return 'Invalid date';
    }
  };

  // T028 [US2]: Format contract value with currency formatting (Intl.NumberFormat)
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';

    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      return `${value}`;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {activity.name}
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Activity Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <Chip label={activity.type} color="primary" size="small" />
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <Chip
                    label={activity.status}
                    color={
                      activity.status === 'completed'
                        ? 'success'
                        : activity.status === 'cancelled'
                        ? 'error'
                        : 'default'
                    }
                    size="small"
                  />
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {activity.description || 'N/A'}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body1">
                  {activity.dueDate ? formatDate(activity.dueDate) : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* NEW: Contract Information Section (Feature 006-contract-activity-fields) */}
        {/* T038 [US3]: Contract details section shows both fields together */}
        {activity.type === 'contract' && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contract Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {/* T018 [US1]: Contract date display with formatting */}
                  <Typography variant="body2" color="text.secondary">
                    Contract Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                    {formatDate(activity.contractDate)}
                  </Typography>

                  {/* T028 [US2]: Contract value display with currency formatting */}
                  <Typography variant="body2" color="text.secondary">
                    Contract Value
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}
                  >
                    {formatCurrency(activity.contractValue)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Metadata */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Metadata
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body1">{activity.createdBy}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {activity.createdAt ? formatDate(activity.createdAt) : 'N/A'}
                  </Typography>
                </Grid>
                {activity.updatedBy && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Updated By
                      </Typography>
                      <Typography variant="body1">{activity.updatedBy}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Updated At
                      </Typography>
                      <Typography variant="body1">
                        {activity.updatedAt ? formatDate(activity.updatedAt) : 'N/A'}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ActivityDetails;

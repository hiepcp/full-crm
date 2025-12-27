import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';

const StatCard = ({ title, value, bgcolor, color, textColor }) => (
  <Grid item xs={12} sm={6} lg={3}>
    <Card sx={{ bgcolor, p: 2 }}>
      <CardContent sx={{ p: 0 }}>
        <Typography variant="body2" sx={{ color, fontWeight: 'medium' }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ color: textColor, fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

const ActivityStats = ({ activities }) => {
  const stats = {
    total: activities.length,
    open: activities.filter(a => a.status === 'open').length,
    inProgress: activities.filter(a => a.status === 'in_progress').length,
    completed: activities.filter(a => a.status === 'completed').length,
    highPriority: activities.filter(a => a.priority === 'high').length,
  };

  return (
    <Grid container spacing={2} sx={{ mt: 3 }}>
      <StatCard
        title="Total Activities"
        value={stats.total}
        bgcolor="primary.50"
        color="primary.main"
        textColor="primary.900"
      />
      <StatCard
        title="Open"
        value={stats.open}
        bgcolor="info.50"
        color="info.main"
        textColor="info.900"
      />
      <StatCard
        title="In Progress"
        value={stats.inProgress}
        bgcolor="warning.50"
        color="warning.main"
        textColor="warning.900"
      />
      <StatCard
        title="Completed"
        value={stats.completed}
        bgcolor="success.50"
        color="success.main"
        textColor="success.900"
      />
      <StatCard
        title="High Priority"
        value={stats.highPriority}
        bgcolor="error.50"
        color="error.main"
        textColor="error.900"
      />
    </Grid>
  );
};

export default ActivityStats;


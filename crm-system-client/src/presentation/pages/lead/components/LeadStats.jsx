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

const LeadStats = ({ leads }) => {
  const stats = {
    total: leads.length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    working: leads.filter(l => l.status === 'working').length,
    converted: leads.filter(l => l.isConverted).length,
  };

  return (
    <Grid container spacing={2} sx={{ mt: 3 }}>
      <StatCard
        title="Total Leads"
        value={stats.total}
        bgcolor="primary.50"
        color="primary.main"
        textColor="primary.900"
      />
      <StatCard
        title="Qualified"
        value={stats.qualified}
        bgcolor="success.50"
        color="success.main"
        textColor="success.900"
      />
      <StatCard
        title="Working"
        value={stats.working}
        bgcolor="warning.50"
        color="warning.main"
        textColor="warning.900"
      />
      <StatCard
        title="Converted"
        value={stats.converted}
        bgcolor="secondary.50"
        color="secondary.main"
        textColor="secondary.900"
      />
    </Grid>
  );
};

export default LeadStats;


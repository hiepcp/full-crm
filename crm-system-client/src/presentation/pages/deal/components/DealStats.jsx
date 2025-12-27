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

const DealStats = ({ deals }) => {
  const totalExpectedRevenue = deals.reduce((sum, deal) => sum + (deal.expectedRevenue || 0), 0);
  const totalActualRevenue = deals.reduce((sum, deal) => sum + (deal.actualRevenue || 0), 0);

  const stats = {
    total: deals.length,
    prospecting: deals.filter(d => d.stage === 'Prospecting').length,
    negotiation: deals.filter(d => d.stage === 'Negotiation').length,
    closedWon: deals.filter(d => d.stage === 'Closed Won').length,
    totalExpectedRevenue: `$${(totalExpectedRevenue / 1000).toFixed(0)}K`,
    totalActualRevenue: `$${(totalActualRevenue / 1000).toFixed(0)}K`,
  };

  return (
    <Grid container spacing={2} sx={{ mt: 3 }}>
      <StatCard
        title="Total Deals"
        value={stats.total}
        bgcolor="primary.50"
        color="primary.main"
        textColor="primary.900"
      />
      <StatCard
        title="Prospecting"
        value={stats.prospecting}
        bgcolor="info.50"
        color="info.main"
        textColor="info.900"
      />
      <StatCard
        title="Negotiation"
        value={stats.negotiation}
        bgcolor="warning.50"
        color="warning.main"
        textColor="warning.900"
      />
      <StatCard
        title="Closed Won"
        value={stats.closedWon}
        bgcolor="success.50"
        color="success.main"
        textColor="success.900"
      />
      <StatCard
        title="Expected Revenue"
        value={stats.totalExpectedRevenue}
        bgcolor="secondary.50"
        color="secondary.main"
        textColor="secondary.900"
      />
      <StatCard
        title="Actual Revenue"
        value={stats.totalActualRevenue}
        bgcolor="teal.50"
        color="teal.main"
        textColor="teal.900"
      />
    </Grid>
  );
};

export default DealStats;


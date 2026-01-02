import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  useTheme,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Tooltip,
  TablePagination
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Note as NoteIcon,
  Handshake as HandshakeIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = ({ 
  customer, 
  deals = [], 
  leads = [], 
  activities = [], 
  contacts = [] 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [trendPeriod, setTrendPeriod] = useState(6); // 3, 6, or 12 months

  // Calculate revenue metrics with more details
  const revenueMetrics = useMemo(() => {
    const totalRevenue = deals.reduce((sum, deal) => sum + (parseFloat(deal.expectedRevenue) || 0), 0);
    const wonDeals = deals.filter(d => d.stage === 'Won' || d.stage === 'Closed Won');
    const wonRevenue = wonDeals.reduce((sum, deal) => sum + (parseFloat(deal.expectedRevenue) || 0), 0);
    const openDeals = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Closed Won' && d.stage !== 'Lost' && d.stage !== 'Closed Lost');
    const pipelineRevenue = openDeals.reduce((sum, deal) => sum + (parseFloat(deal.expectedRevenue) || 0), 0);
    const lostDeals = deals.filter(d => d.stage === 'Lost' || d.stage === 'Closed Lost');
    
    // Calculate highest and lowest deal values
    const dealValues = deals.map(d => parseFloat(d.expectedRevenue) || 0).filter(v => v > 0);
    const highestDeal = dealValues.length > 0 ? Math.max(...dealValues) : 0;
    const lowestDeal = dealValues.length > 0 ? Math.min(...dealValues) : 0;
    const averageDeal = dealValues.length > 0 ? dealValues.reduce((a, b) => a + b, 0) / dealValues.length : 0;
    
    return {
      totalRevenue,
      wonRevenue,
      pipelineRevenue,
      totalDeals: deals.length,
      wonDeals: wonDeals.length,
      openDeals: openDeals.length,
      lostDeals: lostDeals.length,
      winRate: deals.length > 0 ? ((wonDeals.length / deals.length) * 100).toFixed(1) : 0,
      highestDeal,
      lowestDeal,
      averageDeal
    };
  }, [deals]);

  // Calculate lead conversion status (simple yes/no)
  const leadConversion = useMemo(() => {
    const hasLeads = leads.length > 0;
    const convertedLeads = leads.filter(l => l.status === 'Qualified' || l.status === 'Converted');
    const hasConvertedLeads = convertedLeads.length > 0;
    
    return {
      hasLeads,
      hasConvertedLeads,
      convertedCount: convertedLeads.length,
      totalCount: leads.length
    };
  }, [leads]);

  // Calculate activity metrics
  const activityMetrics = useMemo(() => {
    const now = dayjs();
    const last30Days = activities.filter(a => dayjs(a.createdOn).isAfter(now.subtract(30, 'day')));
    const last7Days = activities.filter(a => dayjs(a.createdOn).isAfter(now.subtract(7, 'day')));
    
    const emailCount = activities.filter(a => a.activityType  === 'email').length;
    const callCount = activities.filter(a => a.activityType === 'call').length;
    const meetingCount = activities.filter(a => a.activityType === 'meeting').length;
    const noteCount = activities.filter(a => a.activityType === 'note').length;
    
    return {
      total: activities.length,
      last30Days: last30Days.length,
      last7Days: last7Days.length,
      emailCount,
      callCount,
      meetingCount,
      noteCount,
      lastActivityDate: activities.length > 0 ? dayjs(activities[0].createdOn).format('MMM DD, YYYY') : 'N/A'
    };
  }, [activities]);

  // Deal stages distribution
  const dealStages = useMemo(() => {
    const stages = {};
    deals.forEach(deal => {
      const stage = deal.stage || 'Unknown';
      if (!stages[stage]) {
        stages[stage] = { count: 0, revenue: 0 };
      }
      stages[stage].count += 1;
      stages[stage].revenue += parseFloat(deal.expectedRevenue) || 0;
    });
    return stages;
  }, [deals]);

  // Sorted deals for table
  const sortedDeals = useMemo(() => {
    const sorted = [...deals].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'revenue':
          aValue = parseFloat(a.expectedRevenue) || 0;
          bValue = parseFloat(b.expectedRevenue) || 0;
          break;
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'stage':
          aValue = (a.stage || '').toLowerCase();
          bValue = (b.stage || '').toLowerCase();
          break;
        case 'closeDate':
          aValue = a.closeDate ? new Date(a.closeDate).getTime() : 0;
          bValue = b.closeDate ? new Date(b.closeDate).getTime() : 0;
          break;
        default:
          aValue = parseFloat(a.expectedRevenue) || 0;
          bValue = parseFloat(b.expectedRevenue) || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return sorted;
  }, [deals, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getStageColor = (stage) => {
    const stageColors = {
      'Won': 'success',
      'Closed Won': 'success',
      'Lost': 'error',
      'Closed Lost': 'error',
      'Proposal': 'info',
      'Negotiation': 'warning',
      'Qualification': 'default'
    };
    return stageColors[stage] || 'default';
  };

  // Recent trends (configurable period)
  const monthlyTrends = useMemo(() => {
    const months = [];
    for (let i = trendPeriod - 1; i >= 0; i--) {
      const month = dayjs().subtract(i, 'month');
      const monthActivities = activities.filter(a => 
        dayjs(a.createdOn).isSame(month, 'month')
      );
      const monthDeals = deals.filter(d => 
        dayjs(d.createdOn).isSame(month, 'month')
      );
      
      months.push({
        month: month.format('MMM'),
        activities: monthActivities.length,
        deals: monthDeals.length,
        revenue: monthDeals.reduce((sum, deal) => sum + (parseFloat(deal.expectedRevenue) || 0), 0)
      });
    }
    return months;
  }, [activities, deals, trendPeriod]);

  const MetricCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend.direction === 'up' ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                )}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: trend.direction === 'up' ? 'success.main' : 'error.main',
                    fontWeight: 600
                  }}
                >
                  {trend.value}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: theme.palette[color].lighter,
              color: theme.palette[color].main,
              width: 56,
              height: 56
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Key Metrics Row 1 - Revenue & Deals */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item size={{xs: 12, sm: 6, md: 3}}>
          <MetricCard
            title="Total Revenue"
            value={`${customer?.currency || 'USD'} ${revenueMetrics.totalRevenue.toLocaleString()}`}
            subtitle={`From ${revenueMetrics.totalDeals} deals`}
            icon={<MoneyIcon />}
            color="success"
          />
        </Grid>
        <Grid item size={{xs: 12, sm: 6, md: 3}}>
          <MetricCard
            title="Won Revenue"
            value={`${customer?.currency || 'USD'} ${revenueMetrics.wonRevenue.toLocaleString()}`}
            subtitle={`${revenueMetrics.wonDeals} won deals`}
            icon={<HandshakeIcon />}
            color="success"
          />
        </Grid>
        <Grid item size={{xs: 12, sm: 6, md: 3}}>
          <MetricCard
            title="Pipeline Value"
            value={`${customer?.currency || 'USD'} ${revenueMetrics.pipelineRevenue.toLocaleString()}`}
            subtitle={`${revenueMetrics.openDeals} open deals`}
            icon={<TrendingUpIcon />}
            color="primary"
          />
        </Grid>
        <Grid item size={{xs: 12, sm: 6, md: 3}}>
          <MetricCard
            title="Win Rate"
            value={`${revenueMetrics.winRate}%`}
            subtitle={`${revenueMetrics.wonDeals}/${revenueMetrics.totalDeals} deals won`}
            icon={<TrendingUpIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Key Metrics Row 2 - Deal Values */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item size={{xs: 12, sm: 6, md: 3}}>
          <Card sx={{ bgcolor: 'success.lighter', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ArrowUpwardIcon sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Highest Deal Value
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.dark' }}>
                {customer?.currency || 'USD'} {revenueMetrics.highestDeal.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{xs: 12, sm: 6, md: 3}}>
          <Card sx={{ bgcolor: 'warning.lighter', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ArrowDownwardIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Lowest Deal Value
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                {customer?.currency || 'USD'} {revenueMetrics.lowestDeal.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{xs: 12, sm: 6, md: 3}}>
          <Card sx={{ bgcolor: 'info.lighter', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MoneyIcon sx={{ color: 'info.main', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Average Deal Value
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.dark' }}>
                {customer?.currency || 'USD'} {revenueMetrics.averageDeal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{xs: 12, sm: 6, md: 3}}>
          <Card sx={{ bgcolor: leadConversion.hasConvertedLeads ? 'success.lighter' : 'grey.100', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {leadConversion.hasConvertedLeads ? (
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                ) : (
                  <CancelIcon sx={{ color: 'grey.500', fontSize: 20 }} />
                )}
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Lead Conversion
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: leadConversion.hasConvertedLeads ? 'success.dark' : 'grey.600' }}>
                {leadConversion.hasConvertedLeads ? 'Yes' : 'No'}
              </Typography>
              {leadConversion.hasLeads && (
                <Typography variant="caption" color="text.secondary">
                  {leadConversion.convertedCount} of {leadConversion.totalCount} leads converted
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Deal Pipeline by Stage - Moved Up */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Deal Pipeline by Stage
          </Typography>
          {Object.keys(dealStages).length > 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'stretch',
              gap: 0.5,
              overflowX: 'auto',
              pb: 0.5
            }}>
              {Object.entries(dealStages)
                .sort((a, b) => {
                  const stageOrder = {
                    'Prospecting': 1,
                    'Quotation': 2,
                    'Negotiation': 3,
                    'Closed Won': 4,
                    'Won': 4,
                    'Closed Lost': 5,
                    'Lost': 5
                  };
                  return (stageOrder[a[0]] || 99) - (stageOrder[b[0]] || 99);
                })
                .map(([stage, data], index, array) => {
                  const percentage = ((data.revenue / revenueMetrics.totalRevenue) * 100).toFixed(1);
                  const isWon = stage === 'Won' || stage === 'Closed Won';
                  const isLost = stage === 'Lost' || stage === 'Closed Lost';
                  
                  return (
                    <Box
                      key={stage}
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minWidth: { xs: 110, sm: 120, md: 130 },
                        flex: 1,
                        px: 1.5,
                        py: 1.5,
                        bgcolor: isWon 
                          ? 'success.lighter'
                          : isLost
                            ? 'error.lighter'
                            : 'primary.lighter',
                        borderRadius: { xs: 1.5, md: 0 },
                        border: `1.5px solid`,
                        borderColor: isWon 
                          ? 'success.main'
                          : isLost
                            ? 'error.main'
                            : 'primary.main',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 2
                        },
                        // Chevron arrow for desktop
                        '&:after': index < array.length - 1 ? {
                          content: '""',
                          display: { xs: 'none', md: 'block' },
                          position: 'absolute',
                          top: '50%',
                          right: -10,
                          transform: 'translateY(-50%)',
                          width: 0,
                          height: 0,
                          borderTop: '18px solid transparent',
                          borderBottom: '18px solid transparent',
                          borderLeftWidth: '10px',
                          borderLeftStyle: 'solid',
                          borderLeftColor: isWon 
                            ? 'success.main'
                            : isLost
                              ? 'error.main'
                              : 'primary.main',
                          zIndex: 2
                        } : {},
                        ml: index === 0 ? 0 : { xs: 0, md: '-1.5px' },
                        zIndex: array.length - index
                      }}
                    >
                      {/* Stage Name */}
                      <Box sx={{ mb: 1 }}>
                        <Chip 
                          label={stage} 
                          size="small" 
                          color={getStageColor(stage)}
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: '20px'
                          }}
                        />
                      </Box>

                      {/* Deal Count */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, fontSize: '0.7rem' }}>
                          Deals
                        </Typography>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 700,
                          color: isWon 
                            ? 'success.dark'
                            : isLost
                              ? 'error.dark'
                              : 'primary.dark'
                        }}>
                          {data.count}
                        </Typography>
                      </Box>

                      {/* Revenue */}
                      <Box sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, fontSize: '0.7rem' }}>
                          Revenue
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'text.primary'
                        }}>
                          {customer?.currency || 'USD'} {data.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </Typography>
                      </Box>

                      {/* Percentage */}
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {percentage}% of total
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No deals available
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 6-Month Trends, Activity Overview & Contact List */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Monthly Trends */}
        <Grid item size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {trendPeriod}-Month Trend
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip 
                    label="3M"
                    size="small"
                    onClick={() => setTrendPeriod(3)}
                    color={trendPeriod === 3 ? 'primary' : 'default'}
                    sx={{ 
                      cursor: 'pointer',
                      fontWeight: trendPeriod === 3 ? 600 : 400,
                      height: 24,
                      fontSize: '0.7rem'
                    }}
                  />
                  <Chip 
                    label="6M"
                    size="small"
                    onClick={() => setTrendPeriod(6)}
                    color={trendPeriod === 6 ? 'primary' : 'default'}
                    sx={{ 
                      cursor: 'pointer',
                      fontWeight: trendPeriod === 6 ? 600 : 400,
                      height: 24,
                      fontSize: '0.7rem'
                    }}
                  />
                  <Chip 
                    label="12M"
                    size="small"
                    onClick={() => setTrendPeriod(12)}
                    color={trendPeriod === 12 ? 'primary' : 'default'}
                    sx={{ 
                      cursor: 'pointer',
                      fontWeight: trendPeriod === 12 ? 600 : 400,
                      height: 24,
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {monthlyTrends.map((month, index) => (
                  <Paper 
                    key={index}
                    sx={{ 
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      bgcolor: 'grey.50',
                      '&:hover': {
                        bgcolor: 'primary.lighter',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {month.month}
                      </Typography>
                      <Chip 
                        label={`${month.activities} activities`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {month.deals} deals
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {customer?.currency || 'USD'} {month.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Overview */}
        <Grid item size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Activity Overview
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', color: 'white', mx: 'auto', mb: 1 }}>
                      <EmailIcon />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {activityMetrics.emailCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Emails
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', color: 'white', mx: 'auto', mb: 1 }}>
                      <PhoneIcon />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {activityMetrics.callCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Calls
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', color: 'white', mx: 'auto', mb: 1 }}>
                      <EventIcon />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {activityMetrics.meetingCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Meetings
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.lighter', borderRadius: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', color: 'white', mx: 'auto', mb: 1 }}>
                      <NoteIcon />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {activityMetrics.noteCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Notes
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Last 7 Days</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{activityMetrics.last7Days}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Last 30 Days</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{activityMetrics.last30Days}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Last Activity</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{activityMetrics.lastActivityDate}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact List */}
        <Grid item size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Contacts
                </Typography>
                <Chip 
                  label={contacts.length}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              {contacts.length > 0 ? (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Contact Info</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contacts.slice(0, 10).map((contact) => (
                        <TableRow 
                          key={contact.id}
                          hover
                          sx={{ 
                            '&:hover': { bgcolor: 'action.hover' },
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'N/A'}
                              </Typography>
                              {contact.jobTitle && (
                                <Typography variant="caption" color="text.secondary">
                                  {contact.jobTitle}
                                </Typography>
                              )}
                              {contact.isPrimary && (
                                <Chip 
                                  label="Primary" 
                                  size="small" 
                                  color="primary" 
                                  sx={{ height: 16, fontSize: '0.65rem', ml: 0.5 }} 
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {contact.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <EmailIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {contact.email}
                                  </Typography>
                                </Box>
                              )}
                              {contact.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PhoneIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {contact.phone}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PersonIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No contacts available
                  </Typography>
                </Box>
              )}
              {contacts.length > 10 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  Showing 10 of {contacts.length} contacts
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Deals Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              All Deals ({deals.length})
            </Typography>
            <Chip 
              label={`Total: ${customer?.currency || 'USD'} ${revenueMetrics.totalRevenue.toLocaleString()}`}
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          
          {deals.length > 0 ? (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'name'}
                          direction={sortBy === 'name' ? sortOrder : 'asc'}
                          onClick={() => handleSort('name')}
                        >
                          Deal Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'stage'}
                          direction={sortBy === 'stage' ? sortOrder : 'asc'}
                          onClick={() => handleSort('stage')}
                        >
                          Stage
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortBy === 'revenue'}
                          direction={sortBy === 'revenue' ? sortOrder : 'asc'}
                          onClick={() => handleSort('revenue')}
                        >
                          Expected Revenue
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'closeDate'}
                          direction={sortBy === 'closeDate' ? sortOrder : 'asc'}
                          onClick={() => handleSort('closeDate')}
                        >
                          Close Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedDeals
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((deal) => (
                        <TableRow 
                          key={deal.id}
                          hover
                          sx={{ 
                            '&:hover': { bgcolor: 'action.hover' },
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate(`/deals/${deal.id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {deal.name}
                            </Typography>
                            {deal.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {deal.description.substring(0, 50)}{deal.description.length > 50 ? '...' : ''}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={deal.stage} 
                              size="small" 
                              color={getStageColor(deal.stage)}
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {customer?.currency || 'USD'} {(parseFloat(deal.expectedRevenue) || 0).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {deal.closeDate ? dayjs(deal.closeDate).format('MMM DD, YYYY') : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Deal">
                              <IconButton 
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/deals/${deal.id}`);
                                }}
                              >
                                <OpenInNewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={deals.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No deals available
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerDashboard;

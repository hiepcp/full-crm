import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Avatar,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Stack,
  Link,
  LinearProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  ShowChart as ShowChartIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Info as InfoIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { getDashboardStats, getDeals, getActivities, getEmails, getUsers } from '../../../data';
import { formatDateTime } from '../../../utils/formatDateTime';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const stats = getDashboardStats();
  const [agendaTab, setAgendaTab] = useState(1); // 0: Past Due, 1: Today, 2: This Week
  const [allDeals, setAllDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [dealsData, activitiesData, emailsData] = await Promise.all([
          getDeals(),
          getActivities(),
          getEmails()
        ]);
        setAllDeals(dealsData || []);
        setActivities(activitiesData || []);
        setEmails(emailsData || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setAllDeals([]);
        setActivities([]);
        setEmails([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get deals data
  const activeDeals = allDeals.filter(deal => deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost');

  // Calculate pipeline metrics
  const pipelineData = useMemo(() => {
    const stages = [
      { key: 'Prospecting', label: 'Qualified' },
      { key: 'Quotation', label: 'Presentation' },
      { key: 'Negotiation', label: 'Negotiation' },
    ];

    const stageData = stages.map(stage => {
      const deals = activeDeals.filter(deal => deal.stage === stage.key);
      const value = deals.reduce((sum, deal) => sum + (deal.expectedRevenue || 0), 0);
      return {
        ...stage,
        count: deals.length,
        value: value
      };
    });

    const totalValue = activeDeals.reduce((sum, deal) => sum + (deal.expectedRevenue || 0), 0);
    const wonDeals = allDeals.filter(deal => deal.stage === 'Closed Won');
    const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.actualRevenue || 0), 0);

    return {
      stages: stageData,
      totalValue,
      totalDeals: activeDeals.length,
      wonValue,
      wonDeals: wonDeals.length,
      lostDeals: allDeals.filter(deal => deal.stage === 'Closed Lost').length
    };
  }, [activeDeals, allDeals]);

  // Get activities for agenda
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const agendaActivities = useMemo(() => {
    const pastDue = activities.filter(act => {
      if (!act.dueAt || act.status === 'completed') return false;
      return new Date(act.dueAt) < today;
    });

    const todayActivities = activities.filter(act => {
      if (!act.dueAt) return false;
      const dueDate = new Date(act.dueAt);
      return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    const thisWeekActivities = activities.filter(act => {
      if (!act.dueAt) return false;
      const dueDate = new Date(act.dueAt);
      return dueDate >= today && dueDate < weekFromNow;
    });

    return {
      pastDue,
      today: todayActivities,
      thisWeek: thisWeekActivities
    };
  }, [activities, today, weekFromNow]);

  // Get recent emails
  const recentEmails = useMemo(() =>
    [...emails]
      .sort((a, b) => new Date(b.receivedDateTime) - new Date(a.receivedDateTime))
      .slice(0, 3),
    [emails]
  );

  // Deals slipping away (deals with old expected close dates)
  const slippingDeals = useMemo(() =>
    [...activeDeals]
      .filter(deal => new Date(deal.closeDate) < now)
      .sort((a, b) => new Date(a.closeDate) - new Date(b.closeDate))
      .slice(0, 5),
    [activeDeals, now]
  );

  const formatCurrency = (value) => {
    return `USD ${value?.toLocaleString() || 0}`;
  };

  const getCurrentAgendaActivities = () => {
    switch (agendaTab) {
      case 0:
        return agendaActivities.pastDue;
      case 1:
        return agendaActivities.today;
      case 2:
        return agendaActivities.thisWeek;
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 2 }}>
      {/* Pipeline Section */}
      <Card sx={{
        mb: 4,
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                bgcolor: 'primary.main',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShowChartIcon sx={{ color: 'primary.contrastText', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Sales Pipeline
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active deals • This month
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" sx={{ p: 1 }}>
              <MoreVertIcon />
            </IconButton>
          </Box>

          {/* Pipeline Summary */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 3,
            mb: 4,
            p: 3,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: 1,
            borderColor: 'grey.200'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                Total Expected Revenue
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  fontSize: '3rem',
                  lineHeight: 1,
                  letterSpacing: '-0.02em'
                }}
              >
                {formatCurrency(pipelineData.totalValue)}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                ACTIVE DEALS
              </Typography>
              <Typography
                sx={{
                  fontSize: '3rem',
                  fontWeight: 700,
                  color: 'success.main',
                  lineHeight: 1
                }}
              >
                {pipelineData.totalDeals}
              </Typography>
            </Box>
          </Box>

          {/* Pipeline Stages */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 2,
            mb: 4
          }}>
            {[...pipelineData.stages,
            { key: 'Won', label: 'Won', value: pipelineData.wonValue, count: pipelineData.wonDeals },
            { key: 'Lost', label: 'Lost', value: 0, count: pipelineData.lostDeals }
            ].map((stage, index) => {
              // Sử dụng theme colors
              const stageColors = [
                { bg: 'primary.lighter', border: 'primary.main', text: 'primary.main' },
                { bg: 'info.lighter', border: 'info.main', text: 'info.main' },
                { bg: 'warning.lighter', border: 'warning.main', text: 'warning.main' },
                { bg: 'secondary.lighter', border: 'secondary.main', text: 'secondary.main' },
                { bg: 'success.lighter', border: 'success.main', text: 'success.main' },
                { bg: 'error.lighter', border: 'error.main', text: 'error.main' }
              ];
              const color = stageColors[index % stageColors.length];

              return (
                <Tooltip key={index} title={`${stage.count} deal${stage.count !== 1 ? 's' : ''} in ${stage.label}`}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderLeft: 4,
                      borderColor: color.border,
                      bgcolor: color.bg,
                      boxShadow: 'none',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4]
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          mb: 1.5,
                          display: 'block'
                        }}
                      >
                        {stage.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: color.text,
                          fontSize: '1.5rem',
                          mb: 0.5,
                          lineHeight: 1
                        }}
                      >
                        {formatCurrency(stage.value)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CircleIcon sx={{ fontSize: 8, color: color.border }} />
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontWeight: 500 }}
                        >
                          {stage.count} deal{stage.count !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Tooltip>
              );
            })}
          </Box>

          {/* Pipeline Metrics */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 3,
            pt: 3,
            borderTop: 2,
            borderColor: 'grey.200'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
                gap: 0.5
              }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                >
                  Amount Won
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  color: 'success.main'
                }}
              >
                {formatCurrency(pipelineData.wonValue)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
                gap: 0.5
              }}>
                <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                >
                  Deals Won
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  color: 'primary.main'
                }}
              >
                {pipelineData.wonDeals}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
                gap: 0.5
              }}>
                <AccessTimeIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                >
                  Cycle Time
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  color: 'warning.main'
                }}
              >
                0 <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>days</Typography>
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
                gap: 0.5
              }}>
                <StarIcon sx={{ color: 'error.main', fontSize: 20 }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                >
                  Win Ratio
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  color: 'error.main'
                }}
              >
                0%
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
                gap: 0.5
              }}>
                <TrendingUpIcon sx={{ color: 'info.main', fontSize: 20 }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                >
                  Avg. Deal Size
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  color: 'info.main'
                }}
              >
                {formatCurrency(0)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Grid container spacing={3}>
    

      </Grid>
    </Box>
  );
};

export default Dashboard;

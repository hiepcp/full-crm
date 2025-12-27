import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import StarIcon from '@mui/icons-material/Star';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AccountTreeIcon from '@mui/icons-material/AccountTree'; // NEW: Hierarchy icon
import AssessmentIcon from '@mui/icons-material/Assessment'; // NEW: Analytics icon
import goalsApi from '@infrastructure/api/goalsApi';
import usersApi from '@infrastructure/api/usersApi';
import CustomSnackbar from '@presentation/components/CustomSnackbar';
import {
  ProgressHistoryChart,
  GoalForecastBadge,
  ManualProgressAdjustmentDialog,
  GoalCalculationSourceBadge,
  RecalculateButton
} from '@presentation/components/goals';
import GoalDashboard from './GoalDashboard';
import { calculateTimeframeDates, getTimeframeDescription } from '../../../utils/dateCalculationHelper';

const goalTemplates = [
  {
    id: 'revenue',
    title: 'Win more revenue',
    description: 'Track your revenue won by time period.',
    icon: MonetizationOnIcon,
    defaultType: 'revenue',
    defaultTimeframe: 'this_month',
    suggestedTarget: 100000,
    targetLabel: 'Revenue Target ($)',
    calculationSource: 'auto_calculated', // Auto-calculated from deals
    helpText: 'Automatically tracks revenue from deals marked as "Close/Won"'
  },
  {
    id: 'deals',
    title: 'Win more deals',
    description: 'Track the number of deals won by time period.',
    icon: BusinessCenterIcon,
    defaultType: 'deals',
    defaultTimeframe: 'this_month',
    suggestedTarget: 50,
    targetLabel: 'Number of Deals',
    calculationSource: 'auto_calculated', // Auto-calculated from deals count
    helpText: 'Automatically counts deals marked as "Close/Won"'
  }
];

const timeframeOptions = [
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'this_year', label: 'This year' },
  { value: 'custom', label: 'Custom' }
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const ownerTypeOptions = [
  { value: '', label: 'All owners' },
  { value: 'individual', label: 'Individual' },
  { value: 'team', label: 'Team' },
  { value: 'company', label: 'Company' }
];

const goalTypeOptions = [
  { value: '', label: 'All types' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'deals', label: 'Deals' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'activities', label: 'Activities' },
  { value: 'performance', label: 'Performance' }
];

const initialFormState = {
  title: '',
  description: '',
  ownerType: 'individual',
  ownerId: '',
  amount: '',
  timeframe: 'this_month',
  recurring: false,
  status: 'active',
  type: 'revenue',
  startDate: '',
  endDate: '',
  progress: 0,
  parentGoalId: null // NEW: Phase 6 - Hierarchy support
};

const GoalsPage = () => {
  const navigate = useNavigate(); // NEW: Navigation hook for hierarchy and analytics
  const [goals, setGoals] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [owners, setOwners] = useState([]);
  const [filters, setFilters] = useState({ timeframe: '', status: '', type: '', ownerType: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState('choose');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formValues, setFormValues] = useState(initialFormState);
  const [editingGoal, setEditingGoal] = useState(null);
  const [insightsTab, setInsightsTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedGoalForAdjustment, setSelectedGoalForAdjustment] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'grouped'

  const resetDialog = () => {
    setSelectedTemplate(null);
    setStep('choose');
    setFormValues(initialFormState);
    setEditingGoal(null);
  };

  const openCreateDialog = () => {
    resetDialog();
    setDialogOpen(true);
  };

  const fetchOwners = useCallback(async () => {
    try {
      const res = await usersApi.getActive();
      const data = res?.data?.data ?? res?.data ?? [];
      const normalized = data.items.map((u) => ({
        value: u.id,
        label: `${u.fullName || ''} (${u.email || ''})`.trim() || `User ${u.id}`
      }));
      setOwners(normalized);
    } catch (err) {
      console.error('Failed to load owners', err);
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: 1,
        pageSize: 100,
        timeframe: filters.timeframe || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
        ownerType: filters.ownerType || undefined
      };
      const res = await goalsApi.getAll(params);
      const items = res?.data?.data?.items ?? res?.data?.items ?? [];
      setGoals(items);
    } catch (err) {
      console.error('Failed to load goals', err);
      setError('Failed to load goals.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await goalsApi.getMetrics({
        timeframe: filters.timeframe || undefined,
        ownerType: filters.ownerType || undefined,
        sortBy: 'averageProgress',
        sortOrder: 'desc',
        top: 5
      });
      setMetrics(res?.data?.data ?? res?.data ?? []);
    } catch (err) {
      console.error('Failed to load metrics', err);
    }
  }, [filters]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  useEffect(() => {
    fetchGoals();
    fetchMetrics();
  }, [fetchGoals, fetchMetrics]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);

    // Calculate start and end dates based on template's default timeframe
    const { startDate, endDate } = calculateTimeframeDates(template.defaultTimeframe || 'this_month');

    setFormValues((prev) => ({
      ...prev,
      title: template.title,
      description: template.description,
      type: template.defaultType || template.id,
      timeframe: template.defaultTimeframe || 'this_month',
      amount: template.suggestedTarget || '',
      startDate: startDate || '',
      endDate: endDate || '',
      status: 'active', // Auto-set to active
      calculationSource: template.calculationSource || 'manual', // Set calculation source
      recurring: false // Default to non-recurring
    }));

    setStep('details');
  };

  const handleFormChange = (field) => (event) => {
    const value = field === 'recurring' ? event.target.checked : event.target.value;

    // If timeframe changes, auto-recalculate dates
    if (field === 'timeframe' && value !== 'custom') {
      const { startDate, endDate } = calculateTimeframeDates(value);
      setFormValues((prev) => ({
        ...prev,
        [field]: value,
        startDate: startDate || prev.startDate,
        endDate: endDate || prev.endDate
      }));
    } else {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetDialog();
  };

  const handleSubmit = async () => {
    const payload = {
      name: formValues.title,
      description: formValues.description,
      targetValue: formValues.amount ? Number(formValues.amount) : null,
      startDate: formValues.startDate || null,
      endDate: formValues.endDate || null,
      ownerType: formValues.ownerType,
      ownerId: formValues.ownerType === 'individual' && formValues.ownerId ? Number(formValues.ownerId) : null,
      type: formValues.type,
      timeframe: formValues.timeframe,
      recurring: formValues.recurring,
      status: formValues.status,
      progress: Number(formValues.progress ?? 0)
    };

    try {
      if (editingGoal) {
        await goalsApi.update(editingGoal.id, payload);
      } else {
        await goalsApi.create(payload);
      }
      setSnackbar({
        open: true,
        message: editingGoal ? 'Goal updated successfully' : 'Goal created successfully',
        severity: 'success'
      });
      closeDialog();
      fetchGoals();
      fetchMetrics();
    } catch (err) {
      console.error('Save goal failed', err);

      // Handle validation errors from API
      if (err.response?.data?.message) {
        const errorMessage = err.response.data.message;
        // Extract validation errors from the message
        const validationErrors = errorMessage.split('\r\n')
          .filter(line => line.trim() && line.includes('Severity: Error'))
          .map(line => line.replace(/--\s*/, '').replace(/\s*Severity:\s*Error/, ''))
          .join('\n');

        setSnackbar({
          open: true,
          message: validationErrors || errorMessage,
          severity: 'error'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to save goal. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setSelectedTemplate(goalTemplates.find((t) => t.id === goal.type) || null);
    setFormValues({
      title: goal.name,
      description: goal.description || '',
      ownerType: goal.ownerType || 'individual',
      ownerId: goal.ownerId || '',
      amount: goal.targetValue ?? '',
      timeframe: goal.timeframe || 'this_month',
      recurring: goal.recurring ?? false,
      status: goal.status || 'active',
      type: goal.type || 'revenue',
      startDate: goal.startDate ? goal.startDate.substring(0, 10) : '',
      endDate: goal.endDate ? goal.endDate.substring(0, 10) : '',
      progress: goal.progress ?? 0
    });
    setStep('details');
    setDialogOpen(true);
  };

  const handleDeleteGoal = async (goal) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa goal "${goal.name}"?`);
    if (!confirmed) return;
    try {
      await goalsApi.delete(goal.id);
      setSnackbar({
        open: true,
        message: 'Goal deleted successfully',
        severity: 'success'
      });
      fetchGoals();
      fetchMetrics();
    } catch (err) {
      console.error('Delete goal failed', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete goal. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleOpenAdjustDialog = (goal) => {
    setSelectedGoalForAdjustment(goal);
    setAdjustDialogOpen(true);
  };

  const handleCloseAdjustDialog = () => {
    setAdjustDialogOpen(false);
    setSelectedGoalForAdjustment(null);
  };

  const handleAdjustmentSuccess = (updatedGoal) => {
    // Update the goal in the list
    setGoals((prevGoals) =>
      prevGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
    setSnackbar({
      open: true,
      message: 'Goal progress adjusted successfully',
      severity: 'success'
    });
  };

  const handleRecalculateSuccess = (updatedGoal) => {
    // Update the goal in the list
    setGoals((prevGoals) =>
      prevGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
    setSnackbar({
      open: true,
      message: 'Goal recalculated successfully',
      severity: 'success'
    });
  };

  const goalSummary = useMemo(() => {
    if (!selectedTemplate && !editingGoal) return '';
    const template = selectedTemplate || goalTemplates.find((t) => t.id === formValues.type);
    const ownerLabel = owners.find((o) => o.value === Number(formValues.ownerId))?.label || 'Someone';
    const timeframeLabel = timeframeOptions.find((t) => t.value === formValues.timeframe)?.label || 'a period';
    const amountLabel = formValues.amount || (template?.id === 'revenue' ? '$0' : '0');
    const what = template?.id === 'revenue' ? 'revenue' : 'items';
    return `${ownerLabel} to achieve ${amountLabel} ${what} ${timeframeLabel.toLowerCase()}`;
  }, [selectedTemplate, editingGoal, formValues, owners]);

  const groupedGoals = useMemo(() => {
    return {
      individual: goals.filter((g) => g.ownerType === 'individual'),
      team: goals.filter((g) => g.ownerType === 'team'),
      company: goals.filter((g) => g.ownerType === 'company')
    };
  }, [goals]);

  const GoalSection = ({ title, children, action, defaultExpanded = true }) => (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        mb: 2,
        bgcolor: 'white',
        '&:before': { display: 'none' },
        overflow: 'hidden'
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 3,
          py: 1.5,
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          '&:hover': { bgcolor: '#f1f5f9' }
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" width="100%">
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1, color: '#1e293b' }}>
            {title}
          </Typography>
          {action}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );

  const renderGoalCard = (goal) => (
    <Card
      key={goal.id}
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          transform: 'translateY(-2px)',
          borderColor: '#cbd5e1'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5, color: '#1e293b' }}>
              {goal.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
              {goal.description || 'No description'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ mb: 2 }}>
              <Chip
                size="small"
                label={goal.typeDisplay || goal.type || 'Type'}
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#475569',
                  fontWeight: 500,
                  borderRadius: 1.5
                }}
              />
              <Chip
                size="small"
                label={goal.timeframeDisplay || goal.timeframe || 'Timeframe'}
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#475569',
                  fontWeight: 500,
                  borderRadius: 1.5
                }}
              />
              <Chip
                size="small"
                color="primary"
                label={goal.statusDisplay || goal.status || 'Status'}
                sx={{
                  fontWeight: 500,
                  borderRadius: 1.5
                }}
              />
              <GoalCalculationSourceBadge goal={goal} size="small" />
              <GoalForecastBadge goalId={goal.id} size="small" />
              <Chip
                size="small"
                label={`Target: ${goal.targetValue ?? '-'}`}
                variant="outlined"
                sx={{
                  borderRadius: 1.5,
                  borderColor: '#cbd5e1'
                }}
              />
            </Stack>

            {goal.calculationSource === 'auto_calculated' && goal.lastCalculatedAt && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Last calculated: {new Date(goal.lastCalculatedAt).toLocaleString()}
              </Typography>
            )}

            {goal.manualOverrideReason && (
              <Alert severity="info" sx={{ mb: 1, py: 0.5, borderRadius: 1.5 }}>
                <Typography variant="caption">
                  Override: {goal.manualOverrideReason}
                </Typography>
              </Alert>
            )}

            {goal.calculationFailed && (
              <Alert severity="error" sx={{ mb: 1, py: 0.5, borderRadius: 1.5 }}>
                <Typography variant="caption">
                  Auto-calculation failed. Please recalculate or adjust manually.
                </Typography>
              </Alert>
            )}
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => handleEditGoal(goal)}
                sx={{
                  bgcolor: '#f8fafc',
                  '&:hover': { bgcolor: '#e2e8f0' }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <RecalculateButton
              goal={goal}
              onSuccess={handleRecalculateSuccess}
              variant="icon"
              size="small"
            />
            <Tooltip title="Manual Adjustment">
              <IconButton
                size="small"
                onClick={() => handleOpenAdjustDialog(goal)}
                sx={{
                  bgcolor: '#eff6ff',
                  '&:hover': { bgcolor: '#dbeafe' }
                }}
              >
                <EditIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteGoal(goal)}
                sx={{
                  bgcolor: '#fef2f2',
                  '&:hover': { bgcolor: '#fee2e2' }
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight={500} color="text.secondary">
              Progress
            </Typography>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              {goal.progress ?? 0}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Number(goal.progress ?? 0))}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)'
              }
            }}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Progress Trend
            </Typography>
            <ProgressHistoryChart goalId={goal.id} height={50} color="#3b82f6" showSpots={true} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 3 }}>
      <Box sx={{ maxWidth: 1440, mx: 'auto', px: 3 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: '#1e293b' }}>
            Goals
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage your team's goals and performance
          </Typography>
        </Box>

        {/* Filters and Actions Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            bgcolor: 'white'
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Owner</InputLabel>
                <Select value={filters.ownerType} label="Owner" onChange={handleFilterChange('ownerType')}>
                  {ownerTypeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Timeframe</InputLabel>
                <Select value={filters.timeframe} label="Timeframe" onChange={handleFilterChange('timeframe')}>
                  <MenuItem value="">All</MenuItem>
                  {timeframeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select value={filters.status} label="Status" onChange={handleFilterChange('status')}>
                  <MenuItem value="">All</MenuItem>
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Type</InputLabel>
                <Select value={filters.type} label="Type" onChange={handleFilterChange('type')}>
                  {goalTypeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {/* View Mode Toggle */}
              <Stack direction="row" spacing={0} sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                overflow: 'hidden'
              }}>
                <Tooltip title="Dashboard View">
                  <IconButton
                    size="small"
                    onClick={() => setViewMode('dashboard')}
                    sx={{
                      borderRadius: 0,
                      bgcolor: viewMode === 'dashboard' ? 'primary.main' : 'transparent',
                      color: viewMode === 'dashboard' ? 'white' : 'text.secondary',
                      '&:hover': {
                        bgcolor: viewMode === 'dashboard' ? 'primary.dark' : 'action.hover'
                      }
                    }}
                  >
                    <DashboardIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Grouped View">
                  <IconButton
                    size="small"
                    onClick={() => setViewMode('grouped')}
                    sx={{
                      borderRadius: 0,
                      bgcolor: viewMode === 'grouped' ? 'primary.main' : 'transparent',
                      color: viewMode === 'grouped' ? 'white' : 'text.secondary',
                      '&:hover': {
                        bgcolor: viewMode === 'grouped' ? 'primary.dark' : 'action.hover'
                      }
                    }}
                  >
                    <ViewModuleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Button
                variant="outlined"
                size="small"
                startIcon={<AccountTreeIcon />}
                onClick={() => navigate('/goals/hierarchy')}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1.5,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50'
                  }
                }}
              >
                Hierarchy
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/goals/analytics')}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1.5,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50'
                  }
                }}
              >
                Analytics
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<LeaderboardIcon />}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1.5,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50'
                  }
                }}
              >
                Leaderboard
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={openCreateDialog}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1.5,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                  }
                }}
              >
                Add goal
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              border: '1px solid #fee2e2',
              bgcolor: '#fef2f2'
            }}
          >
            {error}
          </Alert>
        )}

        {loading && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              bgcolor: 'white',
              textAlign: 'center'
            }}
          >
            <CircularProgress size={24} sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">Loading data...</Typography>
          </Paper>
        )}

      {/* Conditional rendering based on view mode */}
      {viewMode === 'dashboard' ? (
        /* Dashboard View with Urgency-Based Sorting */
        <GoalDashboard
          goals={goals}
          onEdit={handleEditGoal}
          onDelete={handleDeleteGoal}
          onAdjust={handleOpenAdjustDialog}
          onRecalculate={handleRecalculateSuccess}
        />
      ) : (
        /* Original Grouped View */
        <>
          <GoalSection
        title="Leaderboard & Insights"
        action={
          <Typography variant="caption" color="text.secondary">
            Performance analytics & top performers
          </Typography>
        }
      >
        {metrics.length === 0 ? (
          <Card variant="outlined" sx={{ borderStyle: 'dashed', borderColor: '#e5e7ed', backgroundColor: '#f8fafc' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <LeaderboardIcon sx={{ fontSize: 48, color: '#e5e7ed', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Create Goals to see Leaderboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Performance insights will appear once you have active goals.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box>
            {/* Insights Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={insightsTab} onChange={(e, v) => setInsightsTab(v)} variant="scrollable" scrollButtons="auto">
                <Tab icon={<LeaderboardIcon />} label="Leaderboard" />
                <Tab icon={<TrendingUpIcon />} label="Performance" />
              </Tabs>
            </Box>

            {/* Leaderboard Tab */}
            {insightsTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsIcon color="primary" />
                  Top Performers
                </Typography>
                <Stack spacing={2}>
                  {metrics
                    .sort((a, b) => (b.averageProgress ?? 0) - (a.averageProgress ?? 0))
                    .slice(0, 10)
                    .map((m, idx) => (
                      <Card key={`${m.ownerType}-${m.ownerId}-${idx}`} elevation={idx < 3 ? 4 : 2} sx={{
                        border: idx < 3 ? '2px solid' : '1px solid',
                        borderColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#e5e7ed',
                        position: 'relative',
                        overflow: 'visible',
                        background: idx === 0 ? 'linear-gradient(135deg, #fff8e1 0%, #ffffff 100%)' :
                                   idx === 1 ? 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)' :
                                   idx === 2 ? 'linear-gradient(135deg, #fef7ed 0%, #ffffff 100%)' : 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: idx < 3 ? '0 8px 25px rgba(0,0,0,0.15)' : '0 4px 15px rgba(0,0,0,0.1)'
                        }
                      }}>
                        {idx < 3 && (
                          <Box sx={{
                            position: 'absolute',
                            top: -8,
                            left: 16,
                            bgcolor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32',
                            color: 'black',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            zIndex: 1
                          }}>
                            #{idx + 1}
                          </Box>
                        )}
                        <CardContent sx={{ pt: 3 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{
                              bgcolor: m.ownerType === 'individual' ? 'primary.main' :
                                     m.ownerType === 'team' ? 'secondary.main' : 'success.main',
                              width: 48,
                              height: 48
                            }}>
                              {m.ownerType === 'individual' ? <PersonIcon /> :
                               m.ownerType === 'team' ? <GroupIcon /> : <BusinessIcon />}
                            </Avatar>
                            <Box flex={1}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {m.ownerType === 'individual' ? 'Individual' :
                                   m.ownerType === 'team' ? 'Team' : 'Company'} Goals
                                </Typography>
                                <Chip
                                  label={m.timeframe?.replace('_', ' ').toUpperCase() || 'N/A'}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {m.totalGoals} goals • {m.type || 'Various types'}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                  <Typography variant="body2" fontWeight={500}>
                                    Progress: {Number(m.averageProgress ?? 0).toFixed(1)}%
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Target: ${Number(m.totalTargetValue ?? 0).toLocaleString()}
                                  </Typography>
                                </Stack>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(m.averageProgress ?? 0, 100)}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: m.averageProgress >= 80 ? 'success.main' :
                                              m.averageProgress >= 50 ? 'warning.main' : 'error.main'
                                    }
                                  }}
                                />
                              </Box>
                            </Box>
                            <Box textAlign="center">
                              <Typography variant="h4" fontWeight="bold" color={
                                m.averageProgress >= 80 ? 'success.main' :
                                m.averageProgress >= 50 ? 'warning.main' : 'error.main'
                              }>
                                {Number(m.completionRate ?? 0).toFixed(0)}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Completion
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                </Stack>
              </Box>
            )}

            {/* Performance Tab */}
            {insightsTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="primary" />
                  Performance Insights
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card sx={{
                      bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      border: '1px solid #90caf9',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)'
                      }
                    }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{
                            bgcolor: 'primary.main',
                            boxShadow: '0 4px 14px rgba(25, 118, 210, 0.4)',
                            animation: 'pulse 2s infinite'
                          }}>
                            <StarIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h4" color="primary.main" fontWeight="bold">
                              {Number(metrics.reduce((sum, m) => sum + (m.averageProgress ?? 0), 0) / Math.max(metrics.length, 1)).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="primary.dark" fontWeight={500}>
                              Average Progress
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{
                      bgcolor: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                      border: '1px solid #ce93d8',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(156, 39, 176, 0.3)'
                      }
                    }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Badge
                            badgeContent={metrics.filter(m => (m.averageProgress ?? 0) >= 80).length}
                            color="error"
                            sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: 20, minWidth: 20 } }}
                          >
                            <Avatar sx={{
                              bgcolor: 'secondary.main',
                              boxShadow: '0 4px 14px rgba(156, 39, 176, 0.4)',
                              animation: 'bounce 2s infinite'
                            }}>
                              <EmojiEventsIcon />
                            </Avatar>
                          </Badge>
                          <Box>
                            <Typography variant="h4" color="secondary.main" fontWeight="bold">
                              {metrics.filter(m => (m.averageProgress ?? 0) >= 80).length}
                            </Typography>
                            <Typography variant="body2" color="secondary.dark" fontWeight={500}>
                              High Performers (80%+)
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{
                      bgcolor: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                      border: '1px solid #81c784',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
                      }
                    }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{
                            bgcolor: 'success.main',
                            boxShadow: '0 4px 14px rgba(76, 175, 80, 0.4)',
                            animation: 'pulse 2s infinite'
                          }}>
                            <TimelineIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h4" color="success.main" fontWeight="bold">
                              ${Number(metrics.reduce((sum, m) => sum + (m.totalTargetValue ?? 0), 0)).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="success.dark" fontWeight={500}>
                              Total Target Value
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Performance Breakdown</Typography>
                        <Stack spacing={2}>
                          {metrics.map((m, idx) => (
                            <Box key={idx}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="body2" fontWeight={500}>
                                  {m.ownerType?.toUpperCase() || 'Unknown'} • {m.timeframe || 'N/A'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {Number(m.averageProgress ?? 0).toFixed(1)}%
                                </Typography>
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(m.averageProgress ?? 0, 100)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: m.averageProgress >= 80 ? 'success.main' :
                                            m.averageProgress >= 50 ? 'warning.main' : 'error.main'
                                  }
                                }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </GoalSection>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <GoalSection
            title="Individual Goals"
            action={<Button size="small" variant="text" onClick={openCreateDialog} sx={{ textTransform: 'none' }}>Add goal</Button>}
          >
            {groupedGoals.individual.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                There are no individual goals yet.
              </Typography>
            ) : (
              groupedGoals.individual.map(renderGoalCard)
            )}
          </GoalSection>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GoalSection
            title="Team Goals"
            action={<Button size="small" variant="text" onClick={openCreateDialog} sx={{ textTransform: 'none' }}>Add goal</Button>}
          >
            {groupedGoals.team.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                There are no goals for teams.
              </Typography>
            ) : (
              groupedGoals.team.map(renderGoalCard)
            )}
          </GoalSection>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GoalSection
            title="Company Goals"
            action={<Button size="small" variant="text" onClick={openCreateDialog} sx={{ textTransform: 'none' }}>Add goal</Button>}
          >
            {groupedGoals.company.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                There are no company goals yet.
              </Typography>
            ) : (
              groupedGoals.company.map(renderGoalCard)
            )}
          </GoalSection>
        </Grid>
      </Grid>
        </>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
        }
      }}>
        {step === 'choose' && !editingGoal && (
          <>
            <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
              <Typography variant="h5" fontWeight={700} color="#1e293b">
                Create a goal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Choose a template to get started
              </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {goalTemplates.map((template) => {
                  const Icon = template.icon;
                  const timeframeDesc = getTimeframeDescription(template.defaultTimeframe);

                  return (
                    <Grid item xs={12} sm={6} key={template.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          height: '100%',
                          cursor: 'pointer',
                          border: '2px solid #e2e8f0',
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                            transform: 'translateY(-2px)',
                            bgcolor: '#f8fafc'
                          }
                        }}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box
                              sx={{
                                bgcolor: '#eff6ff',
                                borderRadius: 2,
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Icon color="primary" sx={{ fontSize: 28 }} />
                            </Box>
                            {template.calculationSource === 'auto_calculated' && (
                              <Chip
                                label="Auto"
                                size="small"
                                sx={{
                                  bgcolor: '#dbeafe',
                                  color: '#1e40af',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  borderRadius: 1
                                }}
                              />
                            )}
                          </Box>

                          <Typography variant="subtitle1" fontWeight={600} color="#1e293b">
                            {template.title}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, lineHeight: 1.5 }}>
                            {template.description}
                          </Typography>

                          <Divider sx={{ borderColor: '#e2e8f0' }} />

                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Timeframe:</strong> {template.defaultTimeframe?.replace('_', ' ')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Period:</strong> {timeframeDesc}
                            </Typography>
                            {template.suggestedTarget && (
                              <Typography variant="caption" color="primary.main" fontWeight={600}>
                                <strong>Suggested:</strong> {template.defaultType === 'revenue' ? `$${template.suggestedTarget.toLocaleString()}` : template.suggestedTarget}
                              </Typography>
                            )}
                          </Stack>

                          {template.helpText && (
                            <Alert severity="info" sx={{ py: 0.5, borderRadius: 1.5 }}>
                              <Typography variant="caption">
                                {template.helpText}
                              </Typography>
                            </Alert>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
              <Button onClick={closeDialog} sx={{ textTransform: 'none', color: '#64748b' }}>
                Cancel
              </Button>
            </DialogActions>
          </>
        )}

        {step === 'details' && (selectedTemplate || editingGoal) && (
          <>
            <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
              <Typography variant="h5" fontWeight={700} color="#1e293b">
                {editingGoal ? 'Edit goal' : selectedTemplate?.title || 'Goal details'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {editingGoal ? 'Update your goal information' : 'Set up your goal details'}
              </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Stack spacing={2}>
                <TextField
                  label="Goal title"
                  required
                  fullWidth
                  value={formValues.title}
                  onChange={handleFormChange('title')}
                />
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={2}
                  value={formValues.description}
                  onChange={handleFormChange('description')}
                />
                <FormControl fullWidth required>
                  <InputLabel>Owner type</InputLabel>
                  <Select
                    value={formValues.ownerType}
                    label="Owner type"
                    onChange={handleFormChange('ownerType')}
                  >
                    {ownerTypeOptions
                      .filter((o) => o.value !== '')
                      .map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                {formValues.ownerType === 'individual' && (
                  <FormControl fullWidth required>
                    <InputLabel>Owner</InputLabel>
                    <Select
                      value={formValues.ownerId}
                      label="Owner"
                      onChange={handleFormChange('ownerId')}
                    >
                      {owners.map((owner) => (
                        <MenuItem key={owner.value} value={owner.value}>
                          {owner.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* NEW: Parent Goal Selector (Phase 6 - Hierarchy) */}
                <Autocomplete
                  options={goals.filter((g) => {
                    // Filter eligible parent goals based on owner type
                    const currentOwnerType = formValues.ownerType;
                    const goalOwnerType = g.ownerType || g.owner_type;

                    // Individual can link to team/company, team can link to company, company cannot have parent
                    if (currentOwnerType === 'individual') return ['team', 'company'].includes(goalOwnerType);
                    if (currentOwnerType === 'team') return goalOwnerType === 'company';
                    return false; // Company goals cannot have parents
                  })}
                  getOptionLabel={(option) => `${option.name} (${option.ownerType || option.owner_type})`}
                  value={goals.find(g => g.id === formValues.parentGoalId) || null}
                  onChange={(event, newValue) => {
                    setFormValues(prev => ({ ...prev, parentGoalId: newValue?.id || null }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Parent Goal (Optional)"
                      placeholder="Link to a parent goal for hierarchy"
                      helperText={
                        formValues.ownerType === 'company'
                          ? 'Company goals cannot have a parent'
                          : formValues.ownerType === 'individual'
                          ? 'Can link to team or company goals'
                          : formValues.ownerType === 'team'
                          ? 'Can link to company goals'
                          : 'Select owner type first'
                      }
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Stack spacing={0.5} sx={{ width: '100%' }}>
                        <Typography variant="body2">{option.name}</Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            size="small"
                            label={option.ownerType || option.owner_type}
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip
                            size="small"
                            label={option.type}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Stack>
                      </Stack>
                    </li>
                  )}
                  disabled={formValues.ownerType === 'company' || !formValues.ownerType}
                  sx={{ mb: 1 }}
                />

                <FormControl fullWidth required>
                  <InputLabel>Goal type</InputLabel>
                  <Select
                    value={formValues.type}
                    label="Goal type"
                    onChange={handleFormChange('type')}
                  >
                    {goalTypeOptions
                      .filter((g) => g.value !== '')
                      .map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Target"
                  type="number"
                  required
                  fullWidth
                  value={formValues.amount}
                  onChange={handleFormChange('amount')}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl fullWidth required>
                    <InputLabel>Timeframe</InputLabel>
                    <Select
                      value={formValues.timeframe}
                      label="Timeframe"
                      onChange={handleFormChange('timeframe')}
                    >
                      {timeframeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formValues.status}
                      label="Status"
                      onChange={handleFormChange('status')}
                    >
                      {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Start date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formValues.startDate}
                    onChange={handleFormChange('startDate')}
                  />
                  <TextField
                    label="End date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formValues.endDate}
                    onChange={handleFormChange('endDate')}
                  />
                </Stack>
                <TextField
                  label="Progress (%)"
                  type="number"
                  fullWidth
                  value={formValues.progress}
                  inputProps={{ min: 0, max: 100 }}
                  onChange={handleFormChange('progress')}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formValues.recurring}
                      onChange={handleFormChange('recurring')}
                    />
                  }
                  label="Recurring"
                />
                <Box sx={{
                  p: 2.5,
                  border: '2px dashed #cbd5e1',
                  borderRadius: 2,
                  bgcolor: '#f8fafc'
                }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom color="#1e293b">
                    Goal summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {goalSummary || 'Fill all the details to see the goal summary.'}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', p: 3, bgcolor: '#f8fafc' }}>
              {!editingGoal && (
                <Button
                  onClick={() => setStep('choose')}
                  sx={{ textTransform: 'none', color: '#64748b' }}
                >
                  Back
                </Button>
              )}
              <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                <Button onClick={closeDialog} sx={{ textTransform: 'none', color: '#64748b' }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!formValues.title || !formValues.type || !formValues.timeframe || (formValues.ownerType === 'individual' && !formValues.ownerId)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1.5,
                    px: 3,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                    }
                  }}
                >
                  {editingGoal ? 'Save' : 'Add'}
                </Button>
              </Stack>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* NEW: Manual Progress Adjustment Dialog */}
      <ManualProgressAdjustmentDialog
        open={adjustDialogOpen}
        onClose={handleCloseAdjustDialog}
        goal={selectedGoalForAdjustment}
        onSuccess={handleAdjustmentSuccess}
      />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
      </Box>
    </Box>
  );
};

export default GoalsPage;

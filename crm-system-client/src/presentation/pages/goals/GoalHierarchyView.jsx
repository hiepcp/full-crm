/**
 * GoalHierarchyView Page
 *
 * Displays goal hierarchy in tree structure with management capabilities.
 * Allows linking/unlinking goals, viewing relationships, and managing the goal structure.
 *
 * Features:
 * - Full hierarchy tree visualization
 * - Link/unlink goal functionality
 * - Parent goal selection
 * - Validation (circular dependencies, max depth, owner type compatibility)
 * - Goal filtering by owner type
 * - Hierarchy statistics
 *
 * @page
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  AccountTree as AccountTreeIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import GoalHierarchyTree from '@presentation/components/goals/GoalHierarchyTree';
import goalsApi from '@infrastructure/api/goalsApi';
import CustomSnackbar from '@presentation/components/CustomSnackbar';

/**
 * Validate if parent-child link is valid
 */
const validateHierarchyLink = (child, parent, allGoals) => {
  const errors = [];

  // Check 1: Self-reference
  if (child.id === parent.id) {
    errors.push('A goal cannot be its own parent');
    return { valid: false, errors };
  }

  // Check 2: Owner type compatibility
  const ownerTypeHierarchy = {
    company: ['team', 'individual'],
    team: ['individual'],
    individual: []
  };

  const parentType = parent.ownerType || parent.owner_type;
  const childType = child.ownerType || child.owner_type;

  const allowedChildTypes = ownerTypeHierarchy[parentType] || [];
  if (!allowedChildTypes.includes(childType)) {
    errors.push(`${parentType} goals can only have ${allowedChildTypes.join(' or ')} child goals`);
  }

  // Check 3: Circular dependency
  const hasCircularDependency = (currentGoal, targetId, visited = new Set()) => {
    if (visited.has(currentGoal.id)) return true;
    if (currentGoal.id === targetId) return true;

    visited.add(currentGoal.id);

    if (currentGoal.parentGoalId) {
      const parentGoal = allGoals.find(g => g.id === currentGoal.parentGoalId);
      if (parentGoal) {
        return hasCircularDependency(parentGoal, targetId, visited);
      }
    }

    return false;
  };

  if (hasCircularDependency(parent, child.id)) {
    errors.push('This would create a circular dependency');
  }

  // Check 4: Max depth (3 levels: company → team → individual)
  const calculateDepth = (goal) => {
    let depth = 0;
    let current = goal;
    const visited = new Set();

    while (current.parentGoalId && depth < 10) {
      if (visited.has(current.id)) break;
      visited.add(current.id);

      const parentGoal = allGoals.find(g => g.id === current.parentGoalId);
      if (!parentGoal) break;

      depth++;
      current = parentGoal;
    }

    return depth;
  };

  const parentDepth = calculateDepth(parent);
  if (parentDepth >= 2) {
    errors.push('Maximum hierarchy depth is 3 levels (company → team → individual)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const GoalHierarchyView = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [filterOwnerType, setFilterOwnerType] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [validationErrors, setValidationErrors] = useState([]);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [goalToUnlink, setGoalToUnlink] = useState(null);

  /**
   * Fetch all goals
   */
  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await goalsApi.getGoals();
      setGoals(response.data || []);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
      setError('Failed to load goals. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to load goals',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  /**
   * Filter goals by owner type
   */
  const filteredGoals = useMemo(() => {
    if (filterOwnerType === 'all') return goals;
    return goals.filter(g => (g.ownerType || g.owner_type) === filterOwnerType);
  }, [goals, filterOwnerType]);

  /**
   * Get eligible parent goals for a child
   */
  const getEligibleParents = useCallback((childGoal) => {
    if (!childGoal) return [];

    const childType = childGoal.ownerType || childGoal.owner_type;

    // Owner type rules: individual can link to team/company, team can link to company
    const eligibleParentTypes = {
      individual: ['team', 'company'],
      team: ['company'],
      company: [] // Company goals cannot have parents
    };

    const allowedTypes = eligibleParentTypes[childType] || [];

    return goals.filter(g => {
      // Cannot link to self
      if (g.id === childGoal.id) return false;

      // Must be eligible owner type
      const parentType = g.ownerType || g.owner_type;
      if (!allowedTypes.includes(parentType)) return false;

      // Check if link would be valid
      const validation = validateHierarchyLink(childGoal, g, goals);
      return validation.valid;
    });
  }, [goals]);

  /**
   * Open link dialog for a goal
   */
  const handleOpenLinkDialog = (goal) => {
    setSelectedChild(goal);
    setSelectedParent(null);
    setValidationErrors([]);
    setLinkDialogOpen(true);
  };

  /**
   * Handle parent selection
   */
  const handleParentChange = (event, newValue) => {
    setSelectedParent(newValue);

    if (newValue && selectedChild) {
      const validation = validateHierarchyLink(selectedChild, newValue, goals);
      setValidationErrors(validation.errors);
    } else {
      setValidationErrors([]);
    }
  };

  /**
   * Link child to parent
   */
  const handleLinkGoal = async () => {
    if (!selectedChild || !selectedParent) return;

    const validation = validateHierarchyLink(selectedChild, selectedParent, goals);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      await goalsApi.linkToParent(selectedChild.id, {
        parentGoalId: selectedParent.id
      });

      setSnackbar({
        open: true,
        message: `Successfully linked "${selectedChild.name}" to "${selectedParent.name}"`,
        severity: 'success'
      });

      setLinkDialogOpen(false);
      fetchGoals(); // Refresh to show new links
    } catch (err) {
      console.error('Failed to link goal:', err);
      setSnackbar({
        open: true,
        message: 'Failed to link goal. Please try again.',
        severity: 'error'
      });
    }
  };

  /**
   * Unlink goal from parent
   */
  const handleUnlinkGoal = async (goal) => {
    try {
      await goalsApi.unlinkParent(goal.id);

      setSnackbar({
        open: true,
        message: `Successfully unlinked "${goal.name}" from parent`,
        severity: 'success'
      });

      setUnlinkConfirmOpen(false);
      setGoalToUnlink(null);
      fetchGoals(); // Refresh to show changes
    } catch (err) {
      console.error('Failed to unlink goal:', err);
      setSnackbar({
        open: true,
        message: 'Failed to unlink goal. Please try again.',
        severity: 'error'
      });
    }
  };

  /**
   * Handle goal selection from tree
   */
  const handleGoalSelect = (goal) => {
    console.log('Selected goal:', goal);
    // Could navigate to goal detail page or open edit dialog
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading goal hierarchy...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink
          component="button"
          variant="body2"
          onClick={() => navigate('/goals')}
          sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Goals
        </MuiLink>
        <Typography variant="body2" color="text.primary">
          Hierarchy View
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => navigate('/goals')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <AccountTreeIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Goal Hierarchy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visualize and manage goal relationships
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          {/* Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="filter-owner-type-label">
              <FilterListIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Filter
            </InputLabel>
            <Select
              labelId="filter-owner-type-label"
              value={filterOwnerType}
              onChange={(e) => setFilterOwnerType(e.target.value)}
              label="Filter"
            >
              <MenuItem value="all">All Goals</MenuItem>
              <MenuItem value="company">Company Goals</MenuItem>
              <MenuItem value="team">Team Goals</MenuItem>
              <MenuItem value="individual">Individual Goals</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchGoals}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/goals')}
            sx={{ textTransform: 'none' }}
          >
            Add Goal
          </Button>
        </Stack>
      </Stack>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Goal Hierarchy Rules:</strong> Company goals can have team or individual children.
          Team goals can have individual children. Maximum depth is 3 levels.
        </Typography>
      </Alert>

      {/* Hierarchy Tree */}
      <GoalHierarchyTree
        goals={filteredGoals}
        onGoalSelect={handleGoalSelect}
        emptyMessage={
          filterOwnerType !== 'all'
            ? `No ${filterOwnerType} goals found. Try changing the filter.`
            : 'No goals found. Create a goal to get started.'
        }
      />

      {/* Link Goal Dialog */}
      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <LinkIcon color="primary" />
            <Typography variant="h6">Link Goal to Parent</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedChild && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Linking <strong>{selectedChild.name}</strong> to a parent goal will make it a child goal.
                  Progress will roll up to the parent.
                </Typography>
              </Alert>

              <Autocomplete
                options={getEligibleParents(selectedChild)}
                getOptionLabel={(option) => `${option.name} (${option.ownerType || option.owner_type})`}
                value={selectedParent}
                onChange={handleParentChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Parent Goal"
                    placeholder="Choose a parent goal"
                    helperText={`${getEligibleParents(selectedChild).length} eligible parent goals`}
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
              />

              {validationErrors.length > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                    Cannot link goal:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {validationErrors.map((error, index) => (
                      <li key={index}>
                        <Typography variant="caption">{error}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleLinkGoal}
            variant="contained"
            color="primary"
            disabled={!selectedParent || validationErrors.length > 0}
            startIcon={<LinkIcon />}
            sx={{ textTransform: 'none' }}
          >
            Link Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <Dialog
        open={unlinkConfirmOpen}
        onClose={() => setUnlinkConfirmOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>Unlink Goal from Parent?</DialogTitle>
        <DialogContent>
          {goalToUnlink && (
            <Alert severity="warning">
              <Typography variant="body2">
                Are you sure you want to unlink <strong>{goalToUnlink.name}</strong> from its parent goal?
                This will make it a standalone goal.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlinkConfirmOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleUnlinkGoal(goalToUnlink)}
            variant="contained"
            color="error"
            startIcon={<LinkOffIcon />}
            sx={{ textTransform: 'none' }}
          >
            Unlink
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default GoalHierarchyView;

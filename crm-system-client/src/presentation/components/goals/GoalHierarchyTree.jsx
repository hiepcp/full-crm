/**
 * GoalHierarchyTree Component
 *
 * Visualizes goal hierarchy in a tree structure showing company → team → individual relationships.
 * Displays progress roll-up and contribution breakdown for each level.
 *
 * Features:
 * - Three-level hierarchy visualization (company → team → individual)
 * - Progress bars showing aggregate progress at each level
 * - Expandable/collapsible tree nodes
 * - Child goal contribution breakdown
 * - Parent goal context display
 * - Color-coded by owner type
 *
 * @component
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Stack,
  Collapse,
  Alert,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  AccountTree as AccountTreeIcon,
  TrendingUp as TrendingUpIcon,
  Link as LinkIcon
} from '@mui/icons-material';

/**
 * Calculate aggregate metrics for a parent goal based on its children
 * @param {Array} children - Array of child goals
 * @returns {Object} Aggregate metrics
 */
const calculateParentMetrics = (children) => {
  if (!children || children.length === 0) {
    return {
      totalTarget: 0,
      totalProgress: 0,
      aggregatePercentage: 0,
      childCount: 0
    };
  }

  const totalTarget = children.reduce((sum, child) => sum + (parseFloat(child.targetValue) || 0), 0);
  const totalProgress = children.reduce((sum, child) => sum + (parseFloat(child.progress) || 0), 0);
  const aggregatePercentage = totalTarget > 0 ? (totalProgress / totalTarget) * 100 : 0;

  return {
    totalTarget,
    totalProgress,
    aggregatePercentage: Math.min(100, aggregatePercentage),
    childCount: children.length
  };
};

/**
 * Get icon and color based on owner type
 */
const getOwnerTypeProps = (ownerType) => {
  switch (ownerType) {
    case 'company':
      return { icon: BusinessIcon, color: '#1976d2', label: 'Company' };
    case 'team':
      return { icon: GroupIcon, color: '#2e7d32', label: 'Team' };
    case 'individual':
      return { icon: PersonIcon, color: '#ed6c02', label: 'Individual' };
    default:
      return { icon: AccountTreeIcon, color: '#757575', label: 'Unknown' };
  }
};

/**
 * TreeNode Component - Represents a single goal in the hierarchy
 */
const TreeNode = ({ goal, children, depth = 0, onExpand, onSelect }) => {
  const [expanded, setExpanded] = useState(depth === 0); // Auto-expand root nodes

  const handleToggle = () => {
    setExpanded(!expanded);
    if (onExpand) onExpand(goal.id, !expanded);
  };

  const hasChildren = children && children.length > 0;
  const ownerProps = getOwnerTypeProps(goal.ownerType || goal.owner_type);
  const OwnerIcon = ownerProps.icon;

  // Calculate metrics if this goal has children
  const childMetrics = hasChildren ? calculateParentMetrics(children) : null;
  const progressPercentage = parseFloat(goal.progress ?? goal.progressPercentage ?? 0);

  // Indentation based on depth
  const indentLevel = depth * 32;

  return (
    <Box sx={{ ml: `${indentLevel}px` }}>
      <Card
        variant="outlined"
        sx={{
          mb: 1.5,
          borderLeft: `4px solid ${ownerProps.color}`,
          cursor: onSelect ? 'pointer' : 'default',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 2,
            borderLeftWidth: 6
          }
        }}
        onClick={() => onSelect && onSelect(goal)}
      >
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            {/* Expand/Collapse Icon */}
            {hasChildren && (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
                {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
              </IconButton>
            )}
            {!hasChildren && <Box sx={{ width: 40 }} />}

            {/* Goal Content */}
            <Box flex={1}>
              {/* Header */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <OwnerIcon sx={{ color: ownerProps.color, fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {goal.name || goal.title}
                </Typography>
                <Chip
                  size="small"
                  label={ownerProps.label}
                  sx={{
                    bgcolor: `${ownerProps.color}15`,
                    color: ownerProps.color,
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />
                {goal.parentGoalId && (
                  <Tooltip title="Linked to parent goal">
                    <LinkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Tooltip>
                )}
              </Stack>

              {/* Description */}
              {goal.description && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {goal.description}
                </Typography>
              )}

              {/* Progress Bar */}
              <Stack spacing={0.5} sx={{ mb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Progress: {progressPercentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {goal.progress ?? 0} / {goal.targetValue ?? 0}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, progressPercentage)}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: ownerProps.color
                    }
                  }}
                />
              </Stack>

              {/* Child Goal Summary (if has children) */}
              {hasChildren && childMetrics && (
                <Alert
                  severity="info"
                  icon={<TrendingUpIcon fontSize="small" />}
                  sx={{ py: 0.5, mt: 1 }}
                >
                  <Typography variant="caption">
                    <strong>{childMetrics.childCount} child {childMetrics.childCount === 1 ? 'goal' : 'goals'}</strong>
                    {' '}- Aggregate: {childMetrics.totalProgress.toFixed(0)} / {childMetrics.totalTarget.toFixed(0)}
                    {' '}({childMetrics.aggregatePercentage.toFixed(1)}%)
                  </Typography>
                </Alert>
              )}

              {/* Parent Context (if has parent) */}
              {goal.parentGoalName && (
                <Alert severity="success" icon={<AccountTreeIcon fontSize="small" />} sx={{ py: 0.5, mt: 1 }}>
                  <Typography variant="caption">
                    This goal supports: <strong>{goal.parentGoalName}</strong>
                  </Typography>
                </Alert>
              )}

              {/* Goal Metadata */}
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                <Chip size="small" label={goal.typeDisplay || goal.type} variant="outlined" />
                <Chip size="small" label={goal.timeframeDisplay || goal.timeframe} variant="outlined" />
                <Chip size="small" label={goal.statusDisplay || goal.status} color="primary" variant="outlined" />
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Render Children (collapsed/expanded) */}
      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 1 }}>
            {children.map((child) => (
              <TreeNode
                key={child.id}
                goal={child}
                children={child.children}
                depth={depth + 1}
                onExpand={onExpand}
                onSelect={onSelect}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

TreeNode.propTypes = {
  goal: PropTypes.object.isRequired,
  children: PropTypes.array,
  depth: PropTypes.number,
  onExpand: PropTypes.func,
  onSelect: PropTypes.func
};

/**
 * Main GoalHierarchyTree Component
 */
const GoalHierarchyTree = ({ goals, onGoalSelect, emptyMessage }) => {
  /**
   * Build hierarchical tree structure from flat goal list
   * Assumes goals have: id, parentGoalId, and other goal properties
   */
  const hierarchyTree = useMemo(() => {
    if (!goals || !Array.isArray(goals) || goals.length === 0) return [];

    // Create a map for quick lookup
    const goalMap = new Map();
    goals.forEach((goal) => {
      goalMap.set(goal.id, { ...goal, children: [] });
    });

    // Build tree structure
    const roots = [];
    goalMap.forEach((goal) => {
      if (goal.parentGoalId) {
        // This is a child goal
        const parent = goalMap.get(goal.parentGoalId);
        if (parent) {
          parent.children.push(goal);
        } else {
          // Parent not in list, treat as root (orphaned goal)
          roots.push(goal);
        }
      } else {
        // This is a root goal (no parent)
        roots.push(goal);
      }
    });

    // Sort roots by owner type (company → team → individual)
    const ownerTypeOrder = { company: 0, team: 1, individual: 2 };
    roots.sort((a, b) => {
      const orderA = ownerTypeOrder[a.ownerType || a.owner_type] ?? 999;
      const orderB = ownerTypeOrder[b.ownerType || b.owner_type] ?? 999;
      return orderA - orderB;
    });

    // Sort children within each parent
    const sortChildren = (goal) => {
      if (goal.children && goal.children.length > 0) {
        goal.children.sort((a, b) => {
          const orderA = ownerTypeOrder[a.ownerType || a.owner_type] ?? 999;
          const orderB = ownerTypeOrder[b.ownerType || b.owner_type] ?? 999;
          return orderA - orderB;
        });
        goal.children.forEach(sortChildren);
      }
    };
    roots.forEach(sortChildren);

    return roots;
  }, [goals]);

  const handleExpand = (goalId, isExpanded) => {
    // Optional: Track expanded state for persistence
    console.log(`Goal ${goalId} ${isExpanded ? 'expanded' : 'collapsed'}`);
  };

  if (!goals || goals.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {emptyMessage || 'No goals to display. Create a goal to get started.'}
      </Alert>
    );
  }

  // Calculate overall statistics
  const stats = useMemo(() => {
    if (!goals || !Array.isArray(goals)) {
      return {
        total: 0,
        company: 0,
        team: 0,
        individual: 0,
        linked: 0,
        trees: 0
      };
    }

    const companyGoals = goals.filter((g) => (g.ownerType || g.owner_type) === 'company');
    const teamGoals = goals.filter((g) => (g.ownerType || g.owner_type) === 'team');
    const individualGoals = goals.filter((g) => (g.ownerType || g.owner_type) === 'individual');
    const linkedGoals = goals.filter((g) => g.parentGoalId);

    return {
      total: goals.length,
      company: companyGoals.length,
      team: teamGoals.length,
      individual: individualGoals.length,
      linked: linkedGoals.length,
      trees: hierarchyTree.length
    };
  }, [goals, hierarchyTree]);

  return (
    <Box>
      {/* Statistics Header */}
      <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <AccountTreeIcon color="primary" sx={{ fontSize: 32 }} />
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={600}>
                Goal Hierarchy Overview
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.total} total goals • {stats.trees} top-level trees • {stats.linked} linked goals
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<BusinessIcon />}
                label={`${stats.company} Company`}
                size="small"
                sx={{ bgcolor: '#1976d215', color: '#1976d2' }}
              />
              <Chip
                icon={<GroupIcon />}
                label={`${stats.team} Team`}
                size="small"
                sx={{ bgcolor: '#2e7d3215', color: '#2e7d32' }}
              />
              <Chip
                icon={<PersonIcon />}
                label={`${stats.individual} Individual`}
                size="small"
                sx={{ bgcolor: '#ed6c0215', color: '#ed6c02' }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Tree Structure */}
      <Box>
        {hierarchyTree.map((rootGoal) => (
          <TreeNode
            key={rootGoal.id}
            goal={rootGoal}
            children={rootGoal.children}
            depth={0}
            onExpand={handleExpand}
            onSelect={onGoalSelect}
          />
        ))}
      </Box>

      {/* Legend */}
      <Card variant="outlined" sx={{ mt: 3, bgcolor: 'grey.50' }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            LEGEND
          </Typography>
          <List dense disablePadding>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <BusinessIcon sx={{ fontSize: 16, color: '#1976d2', mr: 1 }} />
              <ListItemText
                primary={<Typography variant="caption"><strong>Company Goals</strong> - Organization-wide objectives</Typography>}
              />
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <GroupIcon sx={{ fontSize: 16, color: '#2e7d32', mr: 1 }} />
              <ListItemText
                primary={<Typography variant="caption"><strong>Team Goals</strong> - Department or team-level targets</Typography>}
              />
            </ListItem>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <PersonIcon sx={{ fontSize: 16, color: '#ed6c02', mr: 1 }} />
              <ListItemText
                primary={<Typography variant="caption"><strong>Individual Goals</strong> - Personal performance targets</Typography>}
              />
            </ListItem>
            <ListItem disablePadding>
              <TrendingUpIcon sx={{ fontSize: 16, color: 'info.main', mr: 1 }} />
              <ListItemText
                primary={<Typography variant="caption"><strong>Aggregate Progress</strong> - Sum of all child goal contributions</Typography>}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

GoalHierarchyTree.propTypes = {
  goals: PropTypes.arrayOf(PropTypes.object).isRequired,
  onGoalSelect: PropTypes.func,
  emptyMessage: PropTypes.string
};

export default GoalHierarchyTree;

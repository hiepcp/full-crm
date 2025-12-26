/**
 * GoalListIntegrationExample.jsx
 *
 * This file demonstrates how to integrate auto-calculation components into the goals list page.
 * Copy the relevant sections into your actual goals list implementation.
 *
 * Key Integration Points:
 * 1. Import the new components
 * 2. Add new columns to the data table
 * 3. Add action buttons/dialogs
 * 4. Handle state updates after operations
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import goalsApi from '../../../infrastructure/api/goalsApi';

// Import auto-calculation components
import {
  ProgressHistoryChart,
  GoalForecastBadge,
  ManualProgressAdjustmentDialog,
  GoalCalculationSourceBadge,
  RecalculateButton,
} from '../../components/goals';

const GoalListIntegrationExample = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsApi.getAll({});
      setGoals(response.data?.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual adjustment dialog
  const handleOpenAdjustDialog = (goal) => {
    setSelectedGoal(goal);
    setAdjustDialogOpen(true);
  };

  const handleCloseAdjustDialog = () => {
    setAdjustDialogOpen(false);
    setSelectedGoal(null);
  };

  const handleAdjustmentSuccess = (updatedGoal) => {
    // Update the goal in the list
    setGoals((prevGoals) =>
      prevGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
  };

  // Handle recalculate success
  const handleRecalculateSuccess = (updatedGoal) => {
    // Update the goal in the list
    setGoals((prevGoals) =>
      prevGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Progress</TableCell>

              {/* NEW: Calculation Source Column */}
              <TableCell>Source</TableCell>

              {/* NEW: Trend Chart Column */}
              <TableCell>Trend</TableCell>

              {/* NEW: Forecast Column */}
              <TableCell>Forecast</TableCell>

              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {goals.map((goal) => (
              <TableRow key={goal.id}>
                <TableCell>{goal.name}</TableCell>
                <TableCell>{goal.type}</TableCell>
                <TableCell>
                  {goal.progress} / {goal.targetValue} ({goal.progressPercentage?.toFixed(1)}%)
                </TableCell>

                {/* NEW: Display calculation source badge */}
                <TableCell>
                  <GoalCalculationSourceBadge goal={goal} size="small" />
                </TableCell>

                {/* NEW: Display progress history sparkline */}
                <TableCell>
                  <ProgressHistoryChart
                    goalId={goal.id}
                    height={40}
                  />
                </TableCell>

                {/* NEW: Display forecast badge */}
                <TableCell>
                  <GoalForecastBadge
                    goalId={goal.id}
                    size="small"
                    showTooltip={true}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={goal.status}
                    color={goal.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {/* Existing edit button */}
                    <Tooltip title="Edit">
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* NEW: Recalculate button (only for auto-calculated goals) */}
                    <RecalculateButton
                      goal={goal}
                      onSuccess={handleRecalculateSuccess}
                      variant="icon"
                      size="small"
                    />

                    {/* NEW: Manual adjustment button */}
                    <Tooltip title="Manual Adjustment">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenAdjustDialog(goal)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Existing delete button */}
                    <Tooltip title="Delete">
                      <IconButton size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* NEW: Manual Adjustment Dialog */}
      <ManualProgressAdjustmentDialog
        open={adjustDialogOpen}
        onClose={handleCloseAdjustDialog}
        goal={selectedGoal}
        onSuccess={handleAdjustmentSuccess}
      />
    </Box>
  );
};

export default GoalListIntegrationExample;

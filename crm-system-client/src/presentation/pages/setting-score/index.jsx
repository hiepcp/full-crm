import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import leadScoreApi from '@infrastructure/api/leadScoreApi';
import RuleDialog from './component/RuleDialog';
import CustomSnackbar from '@presentation/components/CustomSnackbar';
import { clearLeadScoreRulesCache } from '@presentation/components/common/forms/LeadFormConfig';

const LeadScoreManagement = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maxScore, setMaxScore] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog state
  const [ruleDialog, setRuleDialog] = useState({ open: false, mode: 'create', data: null });

  // Bulk selection state
  const [selectedRules, setSelectedRules] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadRules(); // loadRules now also calculates max score
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await leadScoreApi.getAllRules();
      setRules(response.data.data || []);
      setMaxScore(calculateMaxScore(response.data.data || []));
      setError(null);
    } catch (err) {
      setError('Failed to load rules: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateMaxScore = (rules) => {
    // Calculate max score from rules (sum of all scores)
    return rules.reduce((sum, rule) => sum + (rule.score || 0), 0);
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await leadScoreApi.deleteRule(ruleId);
      clearLeadScoreRulesCache(); // Clear cache after deleting rule
      await loadRules(); // This will also recalculate max score
    } catch (err) {
      setError('Failed to delete rule: ' + err.message);
    }
  };

  const openRuleDialog = (mode, rule = null) => {
    setRuleDialog({ open: true, mode, data: rule });
  };

  // Bulk selection handlers
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRules(rules.map(rule => rule.id));
    } else {
      setSelectedRules([]);
    }
  };

  const handleSelectRule = (ruleId) => {
    setSelectedRules(prev => {
      if (prev.includes(ruleId)) {
        return prev.filter(id => id !== ruleId);
      } else {
        return [...prev, ruleId];
      }
    });
  };

  const handleBulkActivate = async () => {
    if (selectedRules.length === 0) return;

    try {
      setBulkActionLoading(true);
      
      // Update each selected rule
      const updatePromises = selectedRules.map(ruleId => {
        const rule = rules.find(r => r.id === ruleId);
        return leadScoreApi.updateRule(ruleId, { ...rule, isActive: true });
      });

      await Promise.all(updatePromises);
      
      setSnackbar({ 
        open: true, 
        message: `Successfully activated ${selectedRules.length} rule(s)`, 
        severity: 'success' 
      });
      
      setSelectedRules([]);
      await loadRules();
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to activate rules: ' + err.message, 
        severity: 'error' 
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedRules.length === 0) return;

    try {
      setBulkActionLoading(true);
      
      // Update each selected rule
      const updatePromises = selectedRules.map(ruleId => {
        const rule = rules.find(r => r.id === ruleId);
        return leadScoreApi.updateRule(ruleId, { ...rule, isActive: false });
      });

      await Promise.all(updatePromises);
      
      setSnackbar({ 
        open: true, 
        message: `Successfully deactivated ${selectedRules.length} rule(s)`, 
        severity: 'success' 
      });
      
      setSelectedRules([]);
      await loadRules();
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to deactivate rules: ' + err.message, 
        severity: 'error' 
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const isAllSelected = rules.length > 0 && selectedRules.length === rules.length;
  const isSomeSelected = selectedRules.length > 0 && selectedRules.length < rules.length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Lead Score Rules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Simple field-existence scoring: Each rule awards points if the field has a value
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip 
            label={`Max Score: ${maxScore}`} 
            color="primary" 
            variant="outlined"
            size="medium"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openRuleDialog('create')}
          >
            Add Rule
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Bulk Actions Bar */}
      {selectedRules.length > 0 && (
        <Paper sx={{ mb: 2, p: 2, bgcolor: 'primary.lighter' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" fontWeight="medium">
              {selectedRules.length} rule(s) selected
            </Typography>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleBulkActivate}
              disabled={bulkActionLoading}
            >
              Activate Selected
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleBulkDeactivate}
              disabled={bulkActionLoading}
            >
              Deactivate Selected
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedRules([])}
              disabled={bulkActionLoading}
            >
              Clear Selection
            </Button>
            {bulkActionLoading && <CircularProgress size={20} />}
          </Stack>
        </Paper>
      )}

      {/* Rules Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={isSomeSelected}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  disabled={rules.length === 0}
                />
              </TableCell>
              <TableCell>Rule Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Field Name</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No rules found. Click "Add Rule" to create your first rule.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow 
                  key={rule.id} 
                  hover
                  selected={selectedRules.includes(rule.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRules.includes(rule.id)}
                      onChange={() => handleSelectRule(rule.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {rule.ruleName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {rule.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={rule.fieldName} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={`+${rule.score}`} size="small" color="primary" />
                  </TableCell>
                  <TableCell align="center">
                    {rule.isActive ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="disabled" fontSize="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={() => openRuleDialog('edit', rule)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRule(rule.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Rule Dialog */}
      <RuleDialog
        open={ruleDialog.open}
        mode={ruleDialog.mode}
        data={ruleDialog.data}
        allRules={rules}
        onClose={() => setRuleDialog({ open: false, mode: 'create', data: null })}
        onSuccess={() => {
          setRuleDialog({ open: false, mode: 'create', data: null });
          loadRules(); // loadRules now also recalculates max score
        }}
        snackbar={snackbar}
        setSnackbar={setSnackbar}
      />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
};

export default LeadScoreManagement;

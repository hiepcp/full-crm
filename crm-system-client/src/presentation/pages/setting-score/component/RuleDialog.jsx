import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import BaseForm from '@presentation/components/common/forms/BaseForm';
import {
  LeadScoreRuleFormConfigWrapper,
  transformLeadScoreRuleData
} from '../../../components/common/forms/LeadScoreRuleFormConfig';
import leadScoreApi from '@infrastructure/api/leadScoreApi';
import { clearLeadScoreRulesCache } from '@presentation/components/common/forms/LeadFormConfig';

const RuleDialog = ({ open, mode, data, onClose, onSuccess, snackbar, setSnackbar, allRules = [] }) => {
  const [saving, setSaving] = useState(false);
  const baseFormRef = useRef(null);

  const isEdit = mode === 'edit';

  // Get dynamic form config
  const formConfig = LeadScoreRuleFormConfigWrapper(data);

  // Prepare initial form data
  const getInitialData = () => {
    if (data) {
      return {
        ruleName: data.ruleName || '',
        description: data.description || '',
        fieldName: data.fieldName || '',
        score: data.score || 0,
        isActive: data.isActive ?? true,
      };
    }
    return formConfig.initialData;
  };

  const handleManualSubmit = () => {
    if (baseFormRef.current) {
      baseFormRef.current.submit();
    }
  };

  const handleSubmit = async (formData) => {
    setSaving(true);

    try {
      // Transform form data to rule object
      const { rule } = transformLeadScoreRuleData(formData);

      // Calculate new max score
      let newMaxScore = 0;
      if (isEdit) {
        // Replace current rule's score with new score
        newMaxScore = allRules
          .filter(r => r.id !== data.id)
          .reduce((sum, r) => sum + (r.score || 0), 0) + (rule.score || 0);
      } else {
        // Add new rule's score to existing total
        newMaxScore = allRules.reduce((sum, r) => sum + (r.score || 0), 0) + (rule.score || 0);
      }

      // Validate max score
      if (newMaxScore > 100) {
        setSnackbar({ 
          open: true, 
          message: `Cannot save: Total max score would be ${newMaxScore}, which exceeds 100. Please adjust the score.`, 
          severity: 'error' 
        });
        setSaving(false);
        return;
      }

      if (isEdit) {
        await leadScoreApi.updateRule(data.id, rule);
      } else {
        await leadScoreApi.createRule(rule);
      }
      clearLeadScoreRulesCache(); // Clear cache after creating/updating rule
      setSnackbar({ open: true, message: `Rule ${isEdit ? 'updated' : 'created'} successfully`, severity: 'success' });
      onSuccess();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save rule: ' + err.response.data.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Rule' : 'Create Rule'}
      </DialogTitle>
      <DialogContent>

        <BaseForm
          ref={baseFormRef}
          config={formConfig}
          initialData={getInitialData()}
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={saving}
          error={null}
          showActions={false}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleManualSubmit} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RuleDialog;


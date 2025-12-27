import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Box, Typography, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, IconButton, Tabs, Tab } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, FormatListBulleted as ListIcon, Drafts as DraftsIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { createLead } from '../../data';
import { AddActivityForm } from '@presentation/components/common/ActivityForms';
import LeadsDataGrid from './components/LeadsDataGrid';
import DraftLeadsDataGrid from './components/DraftLeadsDataGrid';
import DraftLeadDetailDialog from './components/DraftLeadDetailDialog';
import LeadStats from './components/LeadStats';
import CreateLead from './components/CreateLead';
import useLeadsData from './hooks/useLeadsData';
import CustomSnackbar from '@presentation/components/CustomSnackbar';
import { useLeadScoreRules } from '@presentation/components/common/forms';
import leadsApi from '@infrastructure/api/leadsApi';
import { getLeadById } from '../../../data/index';

  // Load and cache lead score rules on mount

// TabPanel component for tab content
const TabPanel = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

const Leads = () => {

  const { rules: scoreRules, loading: rulesLoading, error: rulesError } = useLeadScoreRules();

  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [createError, setCreateError] = useState(null);
  const [createFieldErrors, setCreateFieldErrors] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Draft lead dialog state
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [selectedDraftLead, setSelectedDraftLead] = useState(null);
  const [draftActionLoading, setDraftActionLoading] = useState(false);
  const [selectedDraftIds, setSelectedDraftIds] = useState([]);

  // Server-side DataGrid state and loader for Active Leads (type=1)
  const {
    data: leads,
    total,
    loading,
    error,
    paginationModel,
    setPaginationModel,
    filterModel,
    setFilterModel,
    sortModel,
    setSortModel,
    fetchData,
  } = useLeadsData({ initialFilterColumn: 'company', type: 1 });

  // Server-side DataGrid state and loader for Draft Leads (type=0)
  const {
    data: draftLeads,
    total: draftTotal,
    loading: draftLoading,
    error: draftError,
    paginationModel: draftPaginationModel,
    setPaginationModel: setDraftPaginationModel,
    filterModel: draftFilterModel,
    setFilterModel: setDraftFilterModel,
    sortModel: draftSortModel,
    setSortModel: setDraftSortModel,
    fetchData: fetchDraftData,
  } = useLeadsData({ initialFilterColumn: 'company', type: 0 });

  // React to grid state changes (page, size, sort, filter) for Active Leads
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, sortModel, filterModel]);

  // React to grid state changes (page, size, sort, filter) for Draft Leads
  useEffect(() => {
    fetchDraftData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftPaginationModel, draftSortModel, draftFilterModel]);

  const handleCreateLead = async (data) => {
    const { lead, contact, customer, activity, selectedContactId, selectedCustomerId } = data;
    try {
      const result = await createLead({
        lead,
        contact,
        customer,
        activity,
        selectedContactId,
        selectedCustomerId,
      });

      // Refresh list from API to ensure latest data
      await fetchData({ __force: true });

      // Switch back to Active Leads tab after successful creation
      setActiveTab(0);
      setCreateError(null);
      setCreateFieldErrors(null);
    } catch (error) {
      console.error('Failed to create lead via API:', error);
      // Try to parse server validation errors
      let fieldErrors = {};
      let generalError = 'Failed to create lead';
      const serverData = error?.response?.data;
      if (serverData?.message) {
        generalError = serverData.message;
        // Try to parse key-specific validation messages e.g. "-- Email: <detail>" or "-- Website: <detail>"
        try {
          const emailMatch = serverData.message.match(/--\s*Email:\s*(.+?)(?:\.|\r|\n|$)/i);
          if (emailMatch && emailMatch[1]) {
            fieldErrors.email = emailMatch[1].trim();
          }
          const websiteMatch = serverData.message.match(/--\s*Website:\s*(.+?)(?:\.|\r|\n|$)/i);
          if (websiteMatch && websiteMatch[1]) {
            fieldErrors.website = websiteMatch[1].trim();
          }
          if (!fieldErrors.email && !fieldErrors.website) {
            const lower = serverData.message.toLowerCase();
            if (lower.includes('email') && lower.includes('already')) {
              fieldErrors.email = 'Email already exists for another lead.';
            } else if (lower.includes('website') && lower.includes('already')) {
              fieldErrors.website = 'Website already exists for another lead.';
            }
          }
        } catch (_) { /* ignore regex errors */ }
      }
      // If API provides structured errors
      if (serverData?.errors && typeof serverData.errors === 'object') {
        Object.keys(serverData.errors).forEach((key) => {
          const val = serverData.errors[key];
          fieldErrors[key] = Array.isArray(val) ? val[0] : (val || '').toString();
        });
      }
      setCreateError(generalError);
      setCreateFieldErrors(Object.keys(fieldErrors).length ? fieldErrors : null);
    }
  };

  // Optional: whenever switching tabs, refresh data (skip initial mount)
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (activeTab === 0) {
      fetchData();
    } else if (activeTab === 1) {
      fetchDraftData();
    }
  }, [activeTab]);

  const handleCreateActivity = (lead) => {
    setSelectedLead(lead);
    setIsCreateActivityModalOpen(true);
  };

  const handleActivitySubmit = async (savedActivity) => {
    try {
      console.log('Activity created successfully:', savedActivity);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Activity created successfully',
        severity: 'success'
      });

      setIsCreateActivityModalOpen(false);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error handling activity submission:', error);

      // Show error message
      setSnackbar({
        open: true,
        message: 'Failed to create activity',
        severity: 'error'
      });
    }
  };

  // Draft lead handlers
  const handleDraftLeadClick = async (params) => {

    const temp = await getLeadById(params.row.id);
    setSelectedDraftLead(temp);
    setIsDraftDialogOpen(true);
  };

  const handleCloseDraftDialog = () => {
    setIsDraftDialogOpen(false);
    setSelectedDraftLead(null);
  };

  const handleActivateDraftLead = async (leadId) => {
    setDraftActionLoading(true);
    try {
      await leadsApi.activateDraft(leadId);
      
      setSnackbar({
        open: true,
        message: 'Draft lead successfully activated!',
        severity: 'success'
      });
      
      // Refresh both draft and active leads
      await fetchDraftData({ __force: true });
      await fetchData({ __force: true });
      
      handleCloseDraftDialog();
    } catch (error) {
      console.error('Failed to activate draft lead:', error);
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Failed to activate draft lead',
        severity: 'error'
      });
    } finally {
      setDraftActionLoading(false);
    }
  };

  const handleDeleteDraftLead = async (leadId) => {
    setDraftActionLoading(true);
    try {
      await leadsApi.deleteDraft(leadId);
      
      setSnackbar({
        open: true,
        message: 'Draft lead successfully deleted',
        severity: 'success'
      });
      
      // Refresh draft leads
      await fetchDraftData({ __force: true });
      
      handleCloseDraftDialog();
    } catch (error) {
      console.error('Failed to delete draft lead:', error);
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Failed to delete draft lead',
        severity: 'error'
      });
    } finally {
      setDraftActionLoading(false);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedDraftIds.length === 0) return;
    
    setDraftActionLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedDraftIds.map(id => leadsApi.activateDraft(id))
      );
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      
      if (successCount > 0) {
        setSnackbar({
          open: true,
          message: `Successfully activated ${successCount} draft lead(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
          severity: failCount > 0 ? 'warning' : 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to activate any draft leads',
          severity: 'error'
        });
      }
      
      // Refresh both grids and clear selection
      await fetchDraftData({ __force: true });
      await fetchData({ __force: true });
      setSelectedDraftIds([]);
    } catch (error) {
      console.error('Failed to bulk activate:', error);
      setSnackbar({
        open: true,
        message: 'Failed to activate draft leads',
        severity: 'error'
      });
    } finally {
      setDraftActionLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Leads Management
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue)}>
            <Tab
              icon={<ListIcon />}
              label="Active Leads"
              sx={{ fontWeight: 'bold' }}
            />
            <Tab
              icon={<DraftsIcon />}
              label="Draft Leads"
              sx={{ fontWeight: 'bold' }}
            />
            <Tab
              icon={<AddIcon />}
              label="New Lead"
              sx={{ fontWeight: 'bold' }}
            />
          </Tabs>
        </Box>

        {/* Active Leads Tab */}
        <TabPanel value={activeTab} index={0}>
            {/* Active Leads DataGrid (server-side pagination/filters) */}
            <LeadsDataGrid
              rows={leads}
              rowCount={total}
              loading={loading}
              paginationModel={paginationModel}
              onPaginationModelChange={(model) =>
                setPaginationModel((prev) => {
                  const pageSizeChanged = prev.pageSize !== model.pageSize;
                  // Reset to first page if page size changes
                  return pageSizeChanged ? { ...model, page: 0 } : model;
                })
              }
              sortModel={sortModel}
              onSortModelChange={(model) => {
                setSortModel(model);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              filterModel={filterModel}
              onFilterModelChange={(model) => {
                const oldItems = filterModel.items || [];
                const newItems = model.items || [];
                const isSame =
                  oldItems.length === newItems.length &&
                  oldItems.every((item, idx) => {
                    const n = newItems[idx];
                    return (
                      (item.field || item.columnField) === (n.field || n.columnField) &&
                      (item.operator || item.operatorValue) === (n.operator || n.operatorValue) &&
                      item.value === n.value
                    );
                  });
                if (!isSame) {
                  setFilterModel(model);
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }
              }}
              onCreateActivity={handleCreateActivity}
            />

        </TabPanel>

        {/* Draft Leads Tab */}
        <TabPanel value={activeTab} index={1}>
            {/* Bulk Actions */}
            {selectedDraftIds.length > 0 && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedDraftIds.length} lead(s) selected
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleBulkActivate}
                  disabled={draftActionLoading}
                >
                  Activate Selected ({selectedDraftIds.length})
                </Button>
              </Box>
            )}
            
            {/* Draft Leads DataGrid with custom columns */}
            <DraftLeadsDataGrid
              rows={draftLeads}
              rowCount={draftTotal}
              loading={draftLoading}
              paginationModel={draftPaginationModel}
              onPaginationModelChange={(model) =>
                setDraftPaginationModel((prev) => {
                  const pageSizeChanged = prev.pageSize !== model.pageSize;
                  // Reset to first page if page size changes
                  return pageSizeChanged ? { ...model, page: 0 } : model;
                })
              }
              sortModel={draftSortModel}
              onSortModelChange={(model) => {
                setDraftSortModel(model);
                setDraftPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              filterModel={draftFilterModel}
              onFilterModelChange={(model) => {
                const oldItems = draftFilterModel.items || [];
                const newItems = model.items || [];
                const isSame =
                  oldItems.length === newItems.length &&
                  oldItems.every((item, idx) => {
                    const n = newItems[idx];
                    return (
                      (item.field || item.columnField) === (n.field || n.columnField) &&
                      (item.operator || item.operatorValue) === (n.operator || n.operatorValue) &&
                      item.value === n.value
                    );
                  });
                if (!isSame) {
                  setDraftFilterModel(model);
                  setDraftPaginationModel((prev) => ({ ...prev, page: 0 }));
                }
              }}
              onRowClick={handleDraftLeadClick}
              rowSelectionModel={selectedDraftIds}
              onRowSelectionModelChange={setSelectedDraftIds}
            />
        </TabPanel>

        {/* New Lead Tab */}
        <TabPanel value={activeTab} index={2}>
          <CreateLead
            onSubmit={handleCreateLead}
            isEdit={false}
            serverError={createError}
            serverFieldErrors={createFieldErrors}
          />
        </TabPanel>

        {/* Create Activity Dialog */}
        <Dialog
          open={isCreateActivityModalOpen}
          onClose={() => {
            setIsCreateActivityModalOpen(false);
            setSelectedLead(null);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              maxHeight: '90vh',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1
          }}>
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
              Create Activity
            </Typography>
            <IconButton
              onClick={() => {
                setIsCreateActivityModalOpen(false);
                setSelectedLead(null);
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <AddActivityForm
              relationType="lead"
              relationId={selectedLead?.id}
              leadName={selectedLead?.name}
              defaultAssignee="sales@crm.com"
              onCancel={() => {
                setIsCreateActivityModalOpen(false);
                setSelectedLead(null);
              }}
              onSubmit={handleActivitySubmit}
            />
          </DialogContent>
        </Dialog>

        {/* Draft Lead Detail Dialog */}
        <DraftLeadDetailDialog
          open={isDraftDialogOpen}
          lead={selectedDraftLead}
          onClose={handleCloseDraftDialog}
          onDelete={handleDeleteDraftLead}
          onActivate={handleActivateDraftLead}
          loading={draftActionLoading}
        />
      </CardContent>

      {/* Snackbar Notification */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </Card>
  );
};

export default Leads;

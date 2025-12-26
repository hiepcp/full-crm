import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Box, Typography, Button, Card, CardContent, Tabs, Tab } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, FormatListBulleted as ListIcon } from '@mui/icons-material';
import CreateDeal from './components/CreateDeal';
import TabPanel from '@src/presentation/components/TabPanel';
import useDealsData from './hooks/useDealsData';
import DealsDataGrid from './components/DealDataGrid';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { AddActivityForm } from '@presentation/components/common/ActivityForms';
import CustomSnackbar from '@presentation/components/CustomSnackbar';
import dealsApi from '@infrastructure/api/dealsApi';
import { createActivity } from '@presentation/data';

const Deals = () => {
  const [stageFilter, setStageFilter] = useState('all');
  //const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const createDealRef = useRef(null);

  // Server-side DataGrid state and loader
  const {
    data: deals,
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
  } = useDealsData({ initialFilterColumn: 'company' });

  // Initial + subsequent loads when filters/grid state change
  useEffect(() => {
    fetchData({ stage: stageFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, sortModel, filterModel, stageFilter]);

  // removed duplicate effect that also called fetchData

  // React to grid state changes (page, size, sort, filter)
  useEffect(() => {
    fetchData({ stage: stageFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, sortModel, filterModel]);

  // Optional: whenever switching to List tab, refresh data (skip initial mount)
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (activeTab === 0) {
      fetchData({ stage: stageFilter });
    }
  }, [activeTab]);

  const handleCreateActivity = (deal) => {
    setSelectedDeal(deal);
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
      setSelectedDeal(null);
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

  // Get deals data with enriched customer information
  const allDeals = useMemo(() => {
    return deals.map(deal => ({
      ...deal,
      customer: null // We'll load customers on demand or keep them null for now
    }));
  }, [deals]);

  // Filter deals based on selected filters
  const filteredDeals = useMemo(() => {
    let deals = allDeals;

    if (stageFilter !== 'all') {
      deals = deals.filter(deal => deal.stage === stageFilter);
    }

    return deals;
  }, [stageFilter, allDeals]);

  const handleCreateDeal = async (dealData) => {
    try {
      const { deal, contact, customer, activity, selectedContactId, selectedCustomerId } = dealData;

      // Step 1: Create the deal
      const dealResponse = await dealsApi.create(deal);
      const createdDeal = dealResponse.data.data || dealResponse.data;

      console.log('Deal created successfully:', createdDeal);

      // Step 2: Create activity if provided
      let createdActivity = null;
      if (activity) {
        try {
          // Set the relation to the newly created deal
          const activityWithRelation = {
            ...activity,
            relationType: 'deal',
            relationId: createdDeal.id || createdDeal.Id
          };

          createdActivity = await createActivity(activityWithRelation);
          console.log('Activity created successfully:', createdActivity);
        } catch (activityError) {
          console.error('Failed to create activity, but deal was created:', activityError);
          // Don't fail the whole operation if activity creation fails
          // Show a warning but continue
          setSnackbar({
            open: true,
            message: 'Deal created successfully, but failed to create initial activity',
            severity: 'warning'
          });
        }
      }

      // Step 3: Show success message
      setSnackbar({
        open: true,
        message: activity ? 'Deal and initial activity created successfully' : 'Deal created successfully',
        severity: 'success'
      });

      // Step 4: Refresh the deals list (force reload + go to first page)
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
      fetchData({ stage: stageFilter, __force: true });

      // Step 5: Switch to list tab
      setActiveTab(0);

    } catch (error) {
      console.error('Failed to create deal:', error);

      // Show error message
      setSnackbar({
        open: true,
        message: 'Failed to create deal. Please try again.',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <Typography>Loading deals...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Deals Management
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue)}>
            <Tab
              icon={<ListIcon />}
              label="List"
              sx={{ fontWeight: 'bold' }}
            />
            <Tab
              icon={<AddIcon />}
              label="New Deal"
              sx={{ fontWeight: 'bold' }}
            />
          </Tabs>
        </Box>

        {/* List Tab */}
        <TabPanel value={activeTab} index={0}>

          {/* Deals Table */}
          <DealsDataGrid
            rows={deals}
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
            handleCreateActivity={handleCreateActivity}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Create Deal Form */}
          <CreateDeal
            ref={createDealRef}
            onSubmit={handleCreateDeal}
            onClose={() => setActiveTab(0)} // Quay về tab List khi cancel
          />
        </TabPanel>

        {/* Create Activity Dialog */}
        <Dialog
          open={isCreateActivityModalOpen}
          onClose={() => {
            setIsCreateActivityModalOpen(false);
            setSelectedDeal(null);
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
                setSelectedDeal(null);
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <AddActivityForm
              relationType="deal"
              relationId={selectedDeal?.id}
              dealName={selectedDeal?.name}
              defaultAssignee="sales@crm.com"
              onCancel={() => {
                setIsCreateActivityModalOpen(false);
                setSelectedDeal(null);
              }}
              onSubmit={handleActivitySubmit}
            />
          </DialogContent>
        </Dialog>
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

export default Deals;


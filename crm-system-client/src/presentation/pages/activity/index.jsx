import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Tabs, Tab } from '@mui/material';
import useActivitiesData from './hooks/useActivitiesData';
import ActivityDataGrid from './components/ActivityDataGrid';
import TabPanel from '@src/presentation/components/TabPanel';
import { FormatListBulleted as ListIcon, Add as AddIcon } from '@mui/icons-material';

const Activities = () => {
  const {
    data,
    total,
    loading,
    error,
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
    filterModel,
    setFilterModel,
    fetchData,
  } = useActivitiesData({ initialFilterColumn: 'subject' });

  const [activeTab, setActiveTab] = useState(0);

  // Fetch data when pagination, sort, or filter changes
  useEffect(() => {
    fetchData();
  }, [fetchData, paginationModel, sortModel, filterModel]);

  return (
    <Card>
      <CardContent>
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Activities Management
          </Typography>
        </Box>

        {/* Error State */}
        {error && (
          <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue)}>
            <Tab
              icon={<ListIcon />}
              label="List"
              sx={{ fontWeight: 'bold' }}
            />
          </Tabs>
        </Box>

        {/* List Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ pt: 2 }}>
            {/* Activities DataGrid with server-side pagination, sorting, filtering */}
            <ActivityDataGrid
              data={data}
              total={total}
              loading={loading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              filterModel={filterModel}
              onFilterModelChange={setFilterModel}
            /></Box>
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default Activities;


import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent, Tabs, Tab } from '@mui/material';
import { FormatListBulleted as ListIcon, Add as AddIcon } from '@mui/icons-material';
import ContactDataGrid from './components/ContactDataGrid';
import useContactsData from './hooks/useContactsData';
import CreateContact from './components/CreateContact';
import contactsApi from '@infrastructure/api/contactsApi';
import CustomSnackbar from '@presentation/components/CustomSnackbar';

// TabPanel component for tab content
const TabPanel = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

const Contacts = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [createError, setCreateError] = useState(null);
  const [createFieldErrors, setCreateFieldErrors] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const {
    data,
    total,
    loading,
    paginationModel,
    setPaginationModel,
    filterModel,
    setFilterModel,
    sortModel,
    setSortModel,
    fetchData,
  } = useContactsData({ initialFilterColumn: 'firstName' });

  useEffect(() => {
    fetchData();
  }, [paginationModel, sortModel, filterModel]);

  // Optional: whenever switching to List tab, refresh data (skip initial mount)
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (activeTab === 0) {
      fetchData();
    }
  }, [activeTab]);

  const handleCreateContact = async (data) => {
    try {
      // Extract the contact object from the transformed data
      const { contact } = data;

      // Call API to create contact
      const response = await contactsApi.create(contact);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Contact created successfully',
        severity: 'success'
      });

      // Refresh list from API to ensure latest data
      await fetchData({ __force: true });

      // Switch back to List tab after successful creation
      setActiveTab(0);
      setCreateError(null);
      setCreateFieldErrors(null);
    } catch (error) {
      console.error('Failed to create contact via API:', error);

      // Parse server validation errors
      let fieldErrors = {};
      let generalError = 'Failed to create contact';
      const serverData = error?.response?.data;

      if (serverData?.message) {
        generalError = serverData.message;
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

      // Show error message
      setSnackbar({
        open: true,
        message: generalError,
        severity: 'error'
      });
    }
  };
  useEffect(() => {
    fetchData();
  }, [paginationModel, sortModel, filterModel]);

  return (
    <Card>
      <CardContent>
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Contacts Management
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
              label="New Contact"
              sx={{ fontWeight: 'bold' }}
            />
          </Tabs>
        </Box>

        {/* List Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ pt: 2 }}>
            <ContactDataGrid
              data={data}
              total={total}
              loading={loading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              filterModel={filterModel}
              onFilterModelChange={setFilterModel} />
          </Box>
        </TabPanel>

        {/* New Contact Tab */}
        <TabPanel value={activeTab} index={1}>
          <CreateContact
            onSubmit={handleCreateContact}
            isEdit={false}
            serverError={createError}
            serverFieldErrors={createFieldErrors}
          />
        </TabPanel>
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


export default Contacts;

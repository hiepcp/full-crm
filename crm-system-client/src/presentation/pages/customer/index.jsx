import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Card, CardContent, Tabs, Tab, Alert } from '@mui/material';
import { FormatListBulleted as ListIcon, Timeline as TimelineIcon } from '@mui/icons-material';
import CustomerDataGrid from './components/CustomerDataGrid';
import CustomerActivityPage from './CustomerActivityPage';
import { RestAllCRMRepository } from "@infrastructure/repositories/RestAllCRMRepository";
import { GetAllCRMCustTableEntitiesUseCase } from '@application/usecases/all-crms';

// TabPanel component for tab content
const TabPanel = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

// Column field mapping between frontend and backend
const columnFieldMap = {
  accountNum: "AccountNum",
  name: "Name",
  custGroup: "CustGroup",
  custClassificationId: "CustClassificationId",
  vatNum: "VATNum",
  partyCountry: "PartyCountry",
  currency: "Currency",
  paymTermId: "PaymTermId",
  salesResponsible: "RSVNSalesResponsible",
  blocked: "Blocked",
};

// Normalize customer data from Dynamics 365 API
function normalizeCustomer(customer) {
  return {
    id: customer?.accountNum || crypto.randomUUID(),
    accountNum: customer?.accountNum || "",
    name: customer?.name || "",
    nameAlias: customer?.nameAlias || "",
    custGroup: customer?.custGroup || "",
    custClassificationId: customer?.custClassificationId || "",
    vatNum: customer?.vatNum || "",
    partyCountry: customer?.partyCountry || "",
    currency: customer?.currency || "USD",
    paymTermId: customer?.paymTermId || "",
    salesResponsible: customer?.rsvnSalesResponsible || "",
    blocked: customer?.blocked || "No",
    dataAreaId: customer?.dataAreaId || "",
    // Additional fields for detail view
    partyNumber: customer?.partyNumber || "",
    creditMax: customer?.creditMax || 0,
    creditRating: customer?.creditRating || "",
    dlvTerm: customer?.dlvTerm || "",
    paymMode: customer?.paymMode || "",
  };
}

const CustomerPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [customersData, setCustomersData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState([{ field: "accountNum", sort: "asc" }]);
  const [filterModel, setFilterModel] = useState({ items: [] });

  const [allCRMRepository] = useState(() => new RestAllCRMRepository());
  const [getCustTableUseCase] = useState(
    () => new GetAllCRMCustTableEntitiesUseCase(allCRMRepository)
  );

  // Compute order by from sort model
  const orderBy = useMemo(() => {
    if (!sortModel?.length) return { field: "AccountNum", order: "asc" };
    const { field, sort } = sortModel[0];
    return {
      field: columnFieldMap[field] || "AccountNum",
      order: sort || "asc",
    };
  }, [sortModel]);

  // Fetch customers from Dynamics 365
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setAlert(null);
      try {
        const filters = [];

        // Process filter model if exists
        if (filterModel?.items?.length > 0) {
          filterModel.items.forEach(item => {
            if (item.value) {
              const backendField = columnFieldMap[item.field] || item.field;
              filters.push({
                Logic: "and",
                Column: backendField,
                Operator: item.operator || "contains",
                Value: item.value,
              });
            }
          });
        }

        const resp = await getCustTableUseCase.execute(
          paginationModel.page + 1,
          paginationModel.pageSize,
          orderBy.field,
          orderBy.order,
          filters
        );

        const data = resp || {};
        const items = data.items || [];
        const normalized = items.map(normalizeCustomer);

        console.log("Fetched customers from Dynamics 365:", data);
        
        setCustomersData(normalized);
        setTotal(data.totalCount ?? data.TotalCount ?? normalized.length);
      } catch (error) {
        console.error("Failed to load customers from Dynamics 365:", error);
        setAlert({ 
          severity: "error", 
          message: `Cannot load customers: ${error.message || 'Unknown error'}` 
        });
        setCustomersData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [paginationModel, sortModel, filterModel, orderBy, getCustTableUseCase]);

  return (
    <Card>
      <CardContent>
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Customers Management (Dynamics 365)
          </Typography>
        </Box>

        {/* Alert for errors */}
        {alert && (
          <Alert 
            severity={alert.severity} 
            onClose={() => setAlert(null)}
            sx={{ mb: 2 }}
          >
            {alert.message}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue)}>
            <Tab
              icon={<ListIcon />}
              label={`List (${total})`}
              sx={{ fontWeight: 'bold' }}
            />
            <Tab
              icon={<TimelineIcon />}
              label="Activities"
              sx={{ fontWeight: 'bold' }}
            />
          </Tabs>
        </Box>

        {/* List Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ pt: 2 }}>
            {/* Customers DataGrid */}
            <CustomerDataGrid
              data={customersData}
              total={total}
              loading={loading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              filterModel={filterModel}
              onFilterModelChange={setFilterModel}
            />
          </Box>
        </TabPanel>

        {/* Activities Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ pt: 2 }}>
            <CustomerActivityPage />
          </Box>
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default CustomerPage;

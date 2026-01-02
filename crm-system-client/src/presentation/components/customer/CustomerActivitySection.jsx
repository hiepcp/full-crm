import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import CustomerActivityList from './CustomerActivityList';
import CustomerActivityDataGrid from './CustomerActivityDataGrid';
import ActivityDetailPopup from '../activity/ActivityDetailPopup';
import customersApi from '@infrastructure/api/customersApi';
import { RestAllCRMRepository } from '@infrastructure/repositories/RestAllCRMRepository';
import { GetAllCRMCustTableEntitiesUseCase } from '@application/usecases/all-crms';

const CustomerActivitySection = ({ customerId, customerName, expanded, onExpandChange }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Leads and Deals data
  const [leadsData, setLeadsData] = useState([]);
  const [dealsData, setDealsData] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);

  // Filters
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedDeals, setSelectedDeals] = useState([]);

  // Popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Customer data for dropdown (single customer, auto-selected)
  const [customersData, setCustomersData] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Initialize repositories
  const allCRMRepository = useMemo(() => new RestAllCRMRepository(), []);
  const getCustTableUseCase = useMemo(
    () => new GetAllCRMCustTableEntitiesUseCase(allCRMRepository),
    [allCRMRepository]
  );

  // Load single customer data from Dynamics 365
  useEffect(() => {
    if (!customerId || !expanded) return;

    const fetchCustomer = async () => {
      setCustomersLoading(true);
      try {
        const resp = await getCustTableUseCase.execute(1, 1000, 'Name', 'asc', []);
        const items = resp?.items || [];
        const customer = items.find(c => c.accountNum === customerId);
        if (customer) {
          const normalized = {
            accountNum: customer.accountNum,
            name: customer.name,
            label: `${customer.accountNum} - ${customer.name}`
          };
          setCustomersData([normalized]);
        }
      } catch (error) {
        console.error('Failed to load customer:', error);
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId, expanded, getCustTableUseCase]);

  // Load leads and deals for this customer
  useEffect(() => {
    if (!customerId || !expanded) return;

    const loadLeadsAndDeals = async () => {
      setLeadsLoading(true);
      setDealsLoading(true);

      try {
        const leadsResponse = await customersApi.getLeadsByCustomer(customerId);
        setLeadsData(leadsResponse?.data?.data || []);
      } catch (error) {
        console.error('Failed to load leads:', error);
        setLeadsData([]);
      } finally {
        setLeadsLoading(false);
      }

      try {
        const dealsResponse = await customersApi.getDealsByCustomer(customerId);
        setDealsData(dealsResponse?.data?.data || []);
      } catch (error) {
        console.error('Failed to load deals:', error);
        setDealsData([]);
      } finally {
        setDealsLoading(false);
      }
    };

    loadLeadsAndDeals();
  }, [customerId, expanded]);

  // Load activities
  useEffect(() => {
    if (!customerId || !expanded) return;

    const loadActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await customersApi.getActivitiesByCustomer(customerId);
        let allActivities = response?.data?.data || [];

        // Filter by selected leads/deals
        if (selectedLeads.length > 0 || selectedDeals.length > 0) {
          const leadIds = selectedLeads.map(l => l.id);
          const dealIds = selectedDeals.map(d => d.id);

          allActivities = allActivities.filter(activity => {
            const relType = (activity.relationType || '').toLowerCase();
            const relId = activity.relationId;

            // If both leads and deals are selected
            if (leadIds.length > 0 && dealIds.length > 0) {
              return (
                (relType === 'lead' && leadIds.includes(relId)) ||
                (relType === 'deal' && dealIds.includes(relId))
              );
            }
            // Only leads selected
            if (leadIds.length > 0) {
              return relType === 'lead' && leadIds.includes(relId);
            }
            // Only deals selected
            if (dealIds.length > 0) {
              return relType === 'deal' && dealIds.includes(relId);
            }

            return true;
          });
        }

        setActivities(allActivities);
      } catch (error) {
        console.error('Failed to load activities:', error);
        setError('Failed to load activities. Please try again.');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [customerId, expanded, selectedLeads, selectedDeals]);

  // Transform activity to event format for popup
  const transformActivityToEvent = (activity) => {
    return {
      id: `activity-${activity.activityId || activity.id}`,
      title: activity.subject || 'No Subject',
      start: activity.startAt || activity.createdOn || activity.createdOnActivity,
      end: activity.endAt,
      extendedProps: {
        entityType: 'activity',
        entityId: activity.activityId || activity.id,
        type: activity.activityType || activity.sourceFrom?.toLowerCase(),
        priority: activity.priority,
        status: activity.status,
        assignedTo: activity.assignedTo || activity.ownerId,
        description: activity.body,
        relationType: activity.relationType,
        relationId: activity.relationId
      }
    };
  };

  // Handle activity click
  const handleActivityClick = (activity) => {
    const event = transformActivityToEvent(activity);
    setSelectedEvent(event);
    setPopupOpen(true);
  };

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          {/* Header - Following ActivityFeed style */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: expanded ? 2 : 0 }}>
            <Box
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                cursor: 'pointer', 
                flex: 1, 
                '&:hover': { opacity: 0.7 } 
              }}
              onClick={() => onExpandChange(!expanded)}
            >
              <IconButton size="small" sx={{ p: 0.5, pointerEvents: 'none' }}>
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Activities ({activities.length})
              </Typography>
            </Box>
          </Box>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Use CustomerActivityList with auto-selected customer */}
            <CustomerActivityList
              activities={activities}
              loading={loading}
              getUserById={() => null}
              onActivityClick={handleActivityClick}
              customersData={customersData}
              customersLoading={customersLoading}
              selectedCustomers={customersData} // Auto-select the customer
              onCustomersChange={() => {}} // Disabled - can't change customer
              leadsData={leadsData}
              leadsLoading={leadsLoading}
              selectedLeads={selectedLeads}
              onLeadsChange={setSelectedLeads} // Share state with parent
              dealsData={dealsData}
              dealsLoading={dealsLoading}
              selectedDeals={selectedDeals}
              onDealsChange={setSelectedDeals} // Share state with parent
              renderAsDataGrid={true}
              DataGridComponent={CustomerActivityDataGrid}
              disableCustomerFilter={true} // New prop to disable customer editing
              hideAdvancedFiltersToggle={true} // Hide the advanced filters accordion
            />
          </Collapse>
        </CardContent>
      </Card>

      {/* Activity Detail Popup */}
      <ActivityDetailPopup
        open={popupOpen}
        onClose={() => {
          setPopupOpen(false);
          setSelectedEvent(null);
        }}
        selectedEvent={selectedEvent}
      />
    </>
  );
};

export default CustomerActivitySection;

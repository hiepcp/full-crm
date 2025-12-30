import React, { useState, useEffect, useMemo } from 'react';
import { Alert } from '@mui/material';
import CustomerActivityList from '../../components/customer/CustomerActivityList';
import CustomerActivityDataGrid from '../../components/customer/CustomerActivityDataGrid';
import ActivityDetailPopup from '../../components/activity/ActivityDetailPopup';
import activitiesApi from '@infrastructure/api/activitiesApi';
import customersApi from '@infrastructure/api/customersApi';
import { RestAllCRMRepository } from '@infrastructure/repositories/RestAllCRMRepository';
import { GetAllCRMCustTableEntitiesUseCase } from '@application/usecases/all-crms';

const CustomerActivityPage = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    
    // Popup state
    const [popupOpen, setPopupOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Filters
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [selectedDeals, setSelectedDeals] = useState([]);

    // Customers data from Dynamics 365
    const [customersData, setCustomersData] = useState([]);
    const [customersLoading, setCustomersLoading] = useState(false);

    // Leads and Deals data (loaded based on selected customers)
    const [leadsData, setLeadsData] = useState([]);
    const [dealsData, setDealsData] = useState([]);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [dealsLoading, setDealsLoading] = useState(false);

    // Initialize repositories
    const allCRMRepository = useMemo(() => new RestAllCRMRepository(), []);
    const getCustTableUseCase = useMemo(
        () => new GetAllCRMCustTableEntitiesUseCase(allCRMRepository),
        [allCRMRepository]
    );

    // Load all customers from Dynamics 365
    useEffect(() => {
        const fetchCustomers = async () => {
            setCustomersLoading(true);
            try {
                const resp = await getCustTableUseCase.execute(1, 1000, 'Name', 'asc', []);
                const items = resp?.items || [];
                const normalized = items.map(customer => ({
                    accountNum: customer.accountNum,
                    name: customer.name,
                    label: `${customer.accountNum} - ${customer.name}`
                }));
                setCustomersData(normalized);
            } catch (error) {
                console.error('Failed to load customers:', error);
            } finally {
                setCustomersLoading(false);
            }
        };

        fetchCustomers();
    }, [getCustTableUseCase]);

    // Load leads and deals when customers are selected
    useEffect(() => {
        if (selectedCustomers.length === 0) {
            setLeadsData([]);
            setDealsData([]);
            return;
        }

        const loadLeadsAndDeals = async () => {
            setLeadsLoading(true);
            setDealsLoading(true);

            try {
                // Load leads for selected customers
                const leadsPromises = selectedCustomers.map(customer =>
                    customersApi.getLeadsByCustomer(customer.accountNum).catch(() => ({ data: { data: [] } }))
                );
                const leadsResponses = await Promise.all(leadsPromises);
                const allLeads = leadsResponses.flatMap(r => r?.data?.data || []);
                const uniqueLeads = Array.from(
                    new Map(allLeads.map(lead => [lead.id, lead])).values()
                );
                setLeadsData(uniqueLeads);
            } catch (error) {
                console.error('Failed to load leads:', error);
                setLeadsData([]);
            } finally {
                setLeadsLoading(false);
            }

            try {
                // Load deals for selected customers
                const dealsPromises = selectedCustomers.map(customer =>
                    customersApi.getDealsByCustomer(customer.accountNum).catch(() => ({ data: { data: [] } }))
                );
                const dealsResponses = await Promise.all(dealsPromises);
                const allDeals = dealsResponses.flatMap(r => r?.data?.data || []);
                const uniqueDeals = Array.from(
                    new Map(allDeals.map(deal => [deal.id, deal])).values()
                );
                setDealsData(uniqueDeals);
            } catch (error) {
                console.error('Failed to load deals:', error);
                setDealsData([]);
            } finally {
                setDealsLoading(false);
            }
        };

        loadLeadsAndDeals();
    }, [selectedCustomers]);

    // Load activities based on filters
    useEffect(() => {
        // Don't load activities if no customer is selected (UX optimization)
        if (selectedCustomers.length === 0) {
            setActivities([]);
            setLoading(false);
            return;
        }

        const loadActivities = async () => {
            setLoading(true);
            setError(null);

            try {
                let allActivities = [];

                // Get activities by customer(s)
                const activitiesPromises = selectedCustomers.map(customer =>
                        customersApi.getActivitiesByCustomer(customer.accountNum)
                            .then(res => res?.data?.data || [])
                            .catch(err => {
                                console.error(`Failed to load activities for customer ${customer.accountNum}:`, err);
                                return [];
                            })
                    );

                const activitiesResponses = await Promise.all(activitiesPromises);
                allActivities = activitiesResponses.flat();

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

                // Remove duplicates based on activityId
                const uniqueActivities = Array.from(
                    new Map(allActivities.map(a => [a.activityId || a.id, a])).values()
                );

                setActivities(uniqueActivities);
            } catch (error) {
                console.error('Failed to load activities:', error);
                setError('Failed to load activities. Please try again.');
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };

        loadActivities();
    }, [selectedCustomers, selectedLeads, selectedDeals]);

    // Helper function to get user by ID (mock for now)
    const getUserById = (userId) => {
        return users.find(user => user.id === parseInt(userId)) || null;
    };

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
            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Activity List with integrated filters */}
            <CustomerActivityList
                activities={activities}
                loading={loading}
                getUserById={getUserById}
                onActivityClick={handleActivityClick}
                customersData={customersData}
                customersLoading={customersLoading}
                selectedCustomers={selectedCustomers}
                onCustomersChange={(newValue) => {
                    setSelectedCustomers(newValue);
                    // Clear leads/deals when customers change
                    setSelectedLeads([]);
                    setSelectedDeals([]);
                }}
                leadsData={leadsData}
                leadsLoading={leadsLoading}
                selectedLeads={selectedLeads}
                onLeadsChange={setSelectedLeads}
                dealsData={dealsData}
                dealsLoading={dealsLoading}
                selectedDeals={selectedDeals}
                onDealsChange={setSelectedDeals}
                // Pass DataGrid component
                renderAsDataGrid={true}
                DataGridComponent={CustomerActivityDataGrid}
            />

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

export default CustomerActivityPage;

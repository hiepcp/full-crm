import { useState, useEffect } from 'react';
import customersApi from '../../infrastructure/api/customersApi';

/**
 * Custom hook to fetch and manage customer data
 * @returns {Object} - { customers: Array, loading: boolean, error: string | null, refetch: function }
 */
export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customers from database via API
      const response = await customersApi.getAll();
      const customerData = response.data.data?.items || [];
      setCustomers(customerData);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const refetch = () => {
    fetchCustomers();
  };

  return {
    customers,
    loading,
    error,
    refetch
  };
};

/**
 * Get customer options for select dropdown
 * @param {Array} customers - Array of customer objects
 * @returns {Array} - Array of option objects for select
 */
export const getCustomerOptions = (customers) => {
  return customers.map(customer => ({
    value: customer.id.toString(),
    label: `${customer.name} (${customer.domain})`
  }));
};

/**
 * Get customer by ID
 * @param {Array} customers - Array of customer objects
 * @param {string|number} customerId - Customer ID to find
 * @returns {Object|null} - Customer object or null if not found
 */
export const getCustomerById = (customers, customerId) => {
  return customers.find(customer => customer.id.toString() === customerId.toString()) || null;
};

export default useCustomers;

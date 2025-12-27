import { useState, useEffect } from 'react';
import contactsApi from '../../infrastructure/api/contactsApi';

/**
 * Custom hook to fetch and manage contact data
 * @returns {Object} - { contacts: Array, loading: boolean, error: string | null, refetch: function }
 */
export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch contacts from database via API
      const response = await contactsApi.getAll();
      const contactData = response.data.data?.items || [];
      setContacts(contactData);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const refetch = () => {
    fetchContacts();
  };

  return {
    contacts,
    loading,
    error,
    refetch
  };
};

/**
 * Get contact options for select dropdown
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} - Array of option objects for select
 */
export const getContactOptions = (contacts) => {
  return contacts.map(contact => ({
    value: contact.id.toString(),
    label: `${contact.firstName} ${contact.lastName} (${contact.email})`
  }));
};

/**
 * Get contact by ID
 * @param {Array} contacts - Array of contact objects
 * @param {string|number} contactId - Contact ID to find
 * @returns {Object|null} - Contact object or null if not found
 */
export const getContactById = (contacts, contactId) => {
  return contacts.find(contact => contact.id.toString() === contactId.toString()) || null;
};

/**
 * Get contacts by customer ID
 * @param {Array} contacts - Array of contact objects
 * @param {string|number} customerId - Customer ID to filter by
 * @returns {Array} - Array of contact objects for the customer
 */
export const getContactsByCustomerId = (contacts, customerId) => {
  return contacts.filter(contact => contact.customerId.toString() === customerId.toString());
};

export default useContacts;

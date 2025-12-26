import { useState, useEffect } from 'react';
import usersApi from '../../infrastructure/api/usersApi';

/**
 * Custom hook to fetch and manage user data
 * @returns {Object} - { users: Array, loading: boolean, error: string | null, refetch: function }
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users from database via API
      const response = await usersApi.getAll();
      const userData = response.data.data?.items || [];
      setUsers(userData);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const refetch = () => {
    fetchUsers();
  };

  return {
    users,
    loading,
    error,
    refetch
  };
};

/**
 * Get user options for select dropdown
 * @param {Array} users - Array of user objects
 * @returns {Array} - Array of option objects for select
 */
export const getUserOptions = (users) => {
  return users.map(user => ({
    value: user.id.toString(),
    label: `${user.firstName} ${user.lastName} (${user.role})`
  }));
};

/**
 * Get user by ID
 * @param {Array} users - Array of user objects
 * @param {string|number} userId - User ID to find
 * @returns {Object|null} - User object or null if not found
 */
export const getUserById = (users, userId) => {
  return users.find(user => user.id.toString() === userId.toString()) || null;
};

export default useUsers;

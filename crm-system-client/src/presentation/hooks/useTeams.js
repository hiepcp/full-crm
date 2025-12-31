import { useState, useEffect } from 'react';
import teamsApi from '../../infrastructure/api/teamsApi';

/**
 * Custom hook to fetch and manage team data
 * @returns {Object} - { teams: Array, loading: boolean, error: string | null, refetch: function }
 */
export const useTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch teams from database via API
      const response = await teamsApi.getTeams({ page: 1, pageSize: 1000 });
      const teamData = response.data.data?.items || [];
      setTeams(teamData);
    } catch (err) {
      setError('Failed to load teams');
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const refetch = () => {
    fetchTeams();
  };

  return {
    teams,
    loading,
    error,
    refetch
  };
};

/**
 * Get team options for select dropdown
 * @param {Array} teams - Array of team objects
 * @returns {Array} - Array of option objects for select
 */
export const getTeamOptions = (teams) => {
  return teams.map(team => ({
    value: team.id.toString(),
    label: team.name
  }));
};

import React, { createContext, useContext, useState, useCallback } from 'react';
import { teamsApi } from '../../infrastructure/api/teamsApi';
import axiosInstance from '../../infrastructure/api/axiosInstance';

const TeamContext = createContext();

export const useTeams = () => {
  const context = useContext(TeamContext);
  if (!context) throw new Error('useTeams must be used within TeamProvider');
  return context;
};

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTeams = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await teamsApi.getTeams(params);
      setTeams(response.data.data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeam = useCallback(async (teamId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await teamsApi.getTeam(teamId);
      return response.data.data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTeam = useCallback(async (teamData) => {
    try {
      setLoading(true);
      setError(null);
      await teamsApi.createTeam(teamData);
      await fetchTeams();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTeams]);

  const updateTeam = useCallback(async (teamId, teamData) => {
    try {
      setLoading(true);
      setError(null);
      await teamsApi.updateTeam(teamId, teamData);
      await fetchTeams();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTeams]);

  const deleteTeam = useCallback(async (teamId) => {
    try {
      setLoading(true);
      setError(null);
      await teamsApi.deleteTeam(teamId);
      await fetchTeams();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTeams]);

  const fetchTeamMembers = useCallback(async (teamId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await teamsApi.getTeamMembers(teamId, params);
      return response.data.data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTeamMember = useCallback(async (teamId, memberData) => {
    try {
      setLoading(true);
      setError(null);
      await teamsApi.addTeamMember(teamId, memberData);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTeamMemberRole = useCallback(async (teamId, userEmail, roleData) => {
    try {
      setLoading(true);
      setError(null);
      await teamsApi.updateTeamMemberRole(teamId, userEmail, roleData);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeTeamMember = useCallback(async (teamId, userEmail) => {
    try {
      setLoading(true);
      setError(null);
      await teamsApi.removeTeamMember(teamId, userEmail);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    teams,
    loading,
    error,
    fetchTeams,
    fetchTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    fetchTeamMembers,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
};

export default TeamContext;
import axiosInstance from './axiosInstance';

export const teamsApi = {
  getTeams: (params) => axiosInstance.get('/teams', { params }),
  getTeam: (id) => axiosInstance.get(`/teams/${id}`),
  createTeam: (data) => axiosInstance.post('/teams', data),
  updateTeam: (id, data) => axiosInstance.put(`/teams/${id}`, data),
  deleteTeam: (id) => axiosInstance.delete(`/teams/${id}`),
  getTeamMembers: (teamId, params) => axiosInstance.get(`/teams/${teamId}/members`, { params }),
  addTeamMember: (teamId, data) => axiosInstance.post(`/teams/${teamId}/members`, data),
  updateTeamMemberRole: (teamId, userEmail, data) => axiosInstance.put(`/teams/${teamId}/members/${userEmail}`, data),
  removeTeamMember: (teamId, userEmail) => axiosInstance.delete(`/teams/${teamId}/members/${userEmail}`),
};

export default teamsApi;
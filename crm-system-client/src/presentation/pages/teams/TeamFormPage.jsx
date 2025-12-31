import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTeams } from '../../../app/contexts/TeamContext';
import TeamForm from './TeamForm';

const TeamFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { fetchTeam, createTeam, updateTeam } = useTeams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      if (!id) return;
      setLoading(true);
      const result = await fetchTeam(id);
      setTeam(result || null);
      setLoading(false);
    };

    loadTeam();
  }, [id, fetchTeam]);

  const handleSave = async (teamData) => {
    const success = id
      ? await updateTeam(id, teamData)
      : await createTeam(teamData);

    if (success) {
      navigate('/teams');
    }
  };

  const handleClose = () => {
    navigate('/teams');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
        <CircularProgress size={24} />
        <Typography>Loading team...</Typography>
      </Box>
    );
  }

  return (
    <TeamForm
      open
      onClose={handleClose}
      onSave={handleSave}
      team={team}
    />
  );
};

export default TeamFormPage;

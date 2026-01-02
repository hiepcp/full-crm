import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as TeamIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import teamsApi from '../../../infrastructure/api/teamsApi';
import CustomSnackbar from '../CustomSnackbar';

const TeamSection = ({ deal, team, loading, onRefresh }) => {
  const [teamExpanded, setTeamExpanded] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  const loadTeamMembers = async () => {
    if (!team) return;

    try {
      setMembersLoading(true);
      const response = await teamsApi.getTeamMembers(team.id, { page: 1, pageSize: 50 });
      setTeamMembers(response.data.data?.items || []);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load team members', severity: 'error' });
      console.error('Error loading team members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTeamMembers();
    if (onRefresh) onRefresh();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'TeamLead':
        return '#1976d2';
      case 'Member':
        return '#0288d1';
      case 'Observer':
        return '#757575';
      default:
        return '#757575';
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: teamExpanded ? 3 : 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TeamIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
              Team
            </Typography>
          </Box>
          <IconButton
            onClick={() => setTeamExpanded(!teamExpanded)}
            size="small"
          >
            {teamExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={teamExpanded}>
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Loading team information...
            </Typography>
          ) : !team ? (
            <Typography variant="body2" color="text.secondary">
              No team assigned to this deal
            </Typography>
          ) : (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip
                    icon={<PeopleIcon sx={{ fontSize: 16 }} />}
                    label={team.name}
                    size="medium"
                    sx={{
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      fontWeight: 500
                    }}
                  />
                  {onRefresh && (
                    <Button
                      size="small"
                      onClick={handleRefresh}
                      variant="outlined"
                      sx={{ ml: 'auto' }}
                    >
                      Refresh
                    </Button>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Team Members ({team.memberCount || 0})
                </Typography>
                {membersLoading ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading members...
                  </Typography>
                ) : teamMembers.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {teamMembers.map(member => (
                      <Box
                        key={member.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.5,
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Avatar
                          src={member.user?.avatar}
                          alt={member.user?.displayName || member.userEmail}
                          sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}
                        >
                          {member.userEmail
                            ? member.userEmail.charAt(0).toUpperCase()
                            : member.userEmail.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {member.user?.displayName || member.userEmail}
                          </Typography>
                        </Box>
                        <Chip
                          label={member.role}
                          size="small"
                          sx={{
                            bgcolor: getRoleColor(member.role),
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No team members assigned
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  {team.dealCount || 0} deals • {team.customerCount || 0} customers
                </Typography>
              </Box>
            </Box>
          )}
        </Collapse>

        <CustomSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </CardContent>
    </Card>
  );
};

export default TeamSection;

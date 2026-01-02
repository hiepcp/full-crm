import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useTeams } from '../../../app/contexts/TeamContext';

const TeamDetailsDrawer = ({ open, onClose, teamId, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { fetchTeam, fetchTeamMembers, loading } = useTeams();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (open && teamId) {
      loadTeamDetails();
      loadTeamMembers();
    }
  }, [open, teamId]);

  const loadTeamDetails = async () => {
    const data = await fetchTeam(teamId);
    if (data) {
      setTeam(data);
    }
  };

  const loadTeamMembers = async () => {
    setLoadingMembers(true);
    const data = await fetchTeamMembers(teamId, { page: 1, pageSize: 10 });
    if (data?.items) {
      setMembers(data.items);
    }
    setLoadingMembers(false);
  };

  const handleEdit = () => {
    onEdit(team);
    onClose();
  };

  const handleDelete = () => {
    onDelete(team);
    onClose();
  };

  const handleViewAllMembers = () => {
    navigate(`/teams/${teamId}/members`);
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 450 },
          p: 0
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'primary.main',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            {loading || !team ? (
              <Skeleton variant="text" width="70%" height={32} sx={{ bgcolor: 'primary.light' }} />
            ) : (
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {team.name}
              </Typography>
            )}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <PeopleIcon sx={{ fontSize: 18 }} />
              {loading || !team ? (
                <Skeleton variant="text" width={100} sx={{ bgcolor: 'primary.light' }} />
              ) : (
                <Typography variant="body2">
                  {team.memberCount || 0} members
                </Typography>
              )}
            </Stack>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {loading || !team ? (
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="rectangular" height={200} />
          </Stack>
        ) : (
          <Stack spacing={3}>
            {/* Action Buttons */}
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit Team
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </Stack>

            <Divider />

            {/* Team Info */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <DescriptionIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {team.description || 'No description provided'}
              </Typography>
            </Box>

            <Divider />

            {/* Created Date */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Created On
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {formatDate(team.createdOn)}
              </Typography>
            </Box>

            <Divider />

            {/* Team Members */}
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <PeopleIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Team Members
                  </Typography>
                  <Chip
                    label={team.memberCount || 0}
                    size="small"
                    color="primary"
                    sx={{ height: 20 }}
                  />
                </Stack>
                <Button size="small" startIcon={<PeopleIcon />} onClick={handleViewAllMembers}>
                  View All
                </Button>
              </Stack>

              {loadingMembers ? (
                <Stack spacing={1}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={56} />
                  ))}
                </Stack>
              ) : members.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {members.map((member, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        px: 2,
                        py: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {member.user.email?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.user.email || ''}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 600
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption'
                        }}
                      />
                      {member.roleInTeam && (
                        <Chip
                          label={member.roleInTeam}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info" sx={{ py: 1 }}>
                  No members in this team yet
                </Alert>
              )}

              {team.memberCount > 10 && (
                <Button
                  fullWidth
                  sx={{ mt: 2 }}
                  variant="outlined"
                  size="small"
                  onClick={handleViewAllMembers}
                >
                  View All {team.memberCount} Members
                </Button>
              )}
            </Box>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
};

TeamDetailsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  teamId: PropTypes.number,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

TeamDetailsDrawer.defaultProps = {
  teamId: null
};

export default TeamDetailsDrawer;

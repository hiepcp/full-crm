import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Fade,
  Divider,
  Card,
  CardContent,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem
} from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTeams } from '../../../app/contexts/TeamContext';
import TeamForm from './TeamForm';
import TeamMemberForm from './TeamMemberForm';
import TeamListToolbar from './TeamListToolbar';
import TeamMembersToolbar from './TeamMembersToolbar';
import TeamDetailsDrawer from './TeamDetailsDrawer';
import MemberDetailsDrawer from './MemberDetailsDrawer';

const TeamsManagement = () => {
  const {
    teams,
    loading: teamsLoading,
    error: teamsError,
    deleteTeam,
    fetchTeams,
    createTeam,
    updateTeam,
    fetchTeam,
    fetchTeamMembers,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember
  } = useTeams();

  // Teams state
  const [teamsPaginationModel, setTeamsPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [teamsRowCount, setTeamsRowCount] = useState(0);
  const [teamsKeyword, setTeamsKeyword] = useState('');
  const [teamsFilters, setTeamsFilters] = useState({});
  const [selectedTeamRows, setSelectedTeamRows] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Members state
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);
  const [membersPaginationModel, setMembersPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [membersRowCount, setMembersRowCount] = useState(0);
  const [membersKeyword, setMembersKeyword] = useState('');
  const [membersFilters, setMembersFilters] = useState({});
  const [selectedMemberRows, setSelectedMemberRows] = useState([]);

  // Team dialogs
  const [teamDeleteDialogOpen, setTeamDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamDetailsDrawerOpen, setTeamDetailsDrawerOpen] = useState(false);
  const [teamBulkDeleteDialogOpen, setTeamBulkDeleteDialogOpen] = useState(false);

  // Member dialogs
  const [memberDeleteDialogOpen, setMemberDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberDetailsDrawerOpen, setMemberDetailsDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberBulkDeleteDialogOpen, setMemberBulkDeleteDialogOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load teams on mount and when filters change
  useEffect(() => {
    loadTeams();
  }, [teamsPaginationModel.page, teamsPaginationModel.pageSize, teamsKeyword, teamsFilters]);

  // Load members when a team is selected
  useEffect(() => {
    if (selectedTeam) {
      loadMembers();
    } else {
      setMembers([]);
      setMembersRowCount(0);
    }
  }, [selectedTeam, membersPaginationModel.page, membersPaginationModel.pageSize, membersKeyword, membersFilters]);

  const loadTeams = async () => {
    const response = await fetchTeams({
      page: teamsPaginationModel.page + 1,
      pageSize: teamsPaginationModel.pageSize,
      keyword: teamsKeyword,
      ...teamsFilters
    });
    if (response?.data?.totalCount !== undefined) {
      setTeamsRowCount(response.data.totalCount);
    }
  };

  const loadMembers = async () => {
    if (!selectedTeam?.id) {
      setMembers([]);
      return;
    }
    try {
      setMembersLoading(true);
      setMembersError(null);
      const result = await fetchTeamMembers(selectedTeam.id, {
        page: membersPaginationModel.page + 1,
        pageSize: membersPaginationModel.pageSize,
        keyword: membersKeyword,
        ...membersFilters
      });
      setMembers(result?.items || []);
      setMembersRowCount(result?.totalCount || 0);
    } catch (err) {
      setMembersError(err.message || 'Failed to load team members');
    } finally {
      setMembersLoading(false);
    }
  };

  // Teams handlers
  const handleTeamsSearch = (searchTerm) => {
    setTeamsPaginationModel({ ...teamsPaginationModel, page: 0 });
    setTeamsKeyword(searchTerm);
  };

  const handleTeamsFilterChange = (newFilters) => {
    setTeamsPaginationModel({ ...teamsPaginationModel, page: 0 });
    setTeamsFilters(newFilters);
  };

  const handleTeamRowClick = (params) => {
    setSelectedTeam(params.row);
    setMembersPaginationModel({ page: 0, pageSize: 25 });
  };

  const handleViewTeam = (team) => {
    setSelectedTeam(team);
    setTeamDetailsDrawerOpen(true);
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setTeamFormOpen(true);
  };

  const handleDeleteTeam = (team) => {
    setTeamToDelete(team);
    setTeamDeleteDialogOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (teamToDelete) {
      const success = await deleteTeam(teamToDelete.id);
      if (success) {
        setTeamDeleteDialogOpen(false);
        setTeamToDelete(null);
        setSnackbar({
          open: true,
          message: `Team "${teamToDelete.name}" deleted successfully`,
          severity: 'success'
        });
        if (selectedTeam?.id === teamToDelete.id) {
          setSelectedTeam(null);
        }
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to delete team',
          severity: 'error'
        });
      }
    }
  };

  const handleBulkDeleteTeams = () => {
    if (selectedTeamRows.length > 0) {
      setTeamBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDeleteTeams = async () => {
    let successCount = 0;
    for (const teamId of selectedTeamRows) {
      const success = await deleteTeam(teamId);
      if (success) successCount++;
    }

    setTeamBulkDeleteDialogOpen(false);
    setSelectedTeamRows([]);

    if (successCount > 0) {
      setSnackbar({
        open: true,
        message: `${successCount} team(s) deleted successfully`,
        severity: 'success'
      });
      if (selectedTeam && selectedTeamRows.includes(selectedTeam.id)) {
        setSelectedTeam(null);
      }
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to delete teams',
        severity: 'error'
      });
    }
  };

  const handleCreateTeam = () => {
    setEditingTeam(null);
    setTeamFormOpen(true);
  };

  const handleTeamFormClose = () => {
    setTeamFormOpen(false);
    setEditingTeam(null);
  };

  const handleTeamFormSave = async (teamData) => {
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, teamData);
        setSnackbar({
          open: true,
          message: 'Team updated successfully',
          severity: 'success'
        });
      } else {
        await createTeam(teamData);
        setSnackbar({
          open: true,
          message: 'Team created successfully',
          severity: 'success'
        });
      }
      setTeamFormOpen(false);
      setEditingTeam(null);
      await loadTeams();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'An error occurred',
        severity: 'error'
      });
    }
  };

  // Members handlers
  const handleMembersSearch = (searchTerm) => {
    setMembersPaginationModel({ ...membersPaginationModel, page: 0 });
    setMembersKeyword(searchTerm);
  };

  const handleMembersFilterChange = (newFilters) => {
    setMembersPaginationModel({ ...membersPaginationModel, page: 0 });
    setMembersFilters(newFilters);
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setMemberDetailsDrawerOpen(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setMemberFormOpen(true);
  };

  const handleDeleteMember = (member) => {
    setMemberToDelete(member);
    setMemberDeleteDialogOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (memberToDelete && selectedTeam) {
      const userEmail = memberToDelete.user?.email || memberToDelete.userEmail;
      const success = await removeTeamMember(selectedTeam.id, userEmail);
      if (success) {
        setMemberDeleteDialogOpen(false);
        setMemberToDelete(null);
        setSnackbar({
          open: true,
          message: `Member "${memberToDelete.user?.displayName || userEmail}" removed successfully`,
          severity: 'success'
        });
        loadMembers();
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to remove member',
          severity: 'error'
        });
      }
    }
  };

  const handleBulkRemoveMembers = () => {
    if (selectedMemberRows.length > 0) {
      setMemberBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkRemoveMembers = async () => {
    if (!selectedTeam) return;

    let successCount = 0;
    for (const memberEmail of selectedMemberRows) {
      const success = await removeTeamMember(selectedTeam.id, memberEmail);
      if (success) successCount++;
    }

    setMemberBulkDeleteDialogOpen(false);
    setSelectedMemberRows([]);

    if (successCount > 0) {
      setSnackbar({
        open: true,
        message: `${successCount} member(s) removed successfully`,
        severity: 'success'
      });
      loadMembers();
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to remove members',
        severity: 'error'
      });
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setMemberFormOpen(true);
  };

  const handleMemberFormClose = () => {
    setMemberFormOpen(false);
    setEditingMember(null);
  };

  const handleMemberFormSave = async (memberData) => {
    if (!selectedTeam) return;

    try {
      if (editingMember) {
        const userEmail = editingMember.user?.email || editingMember.userEmail;
        const success = await updateTeamMemberRole(selectedTeam.id, userEmail, memberData);
        if (success) {
          setSnackbar({
            open: true,
            message: 'Member role updated successfully',
            severity: 'success'
          });
          setMemberFormOpen(false);
          setEditingMember(null);
          loadMembers();
        }
      } else {
        const success = await addTeamMember(selectedTeam.id, memberData);
        if (success) {
          setSnackbar({
            open: true,
            message: 'Member added successfully',
            severity: 'success'
          });
          setMemberFormOpen(false);
          loadMembers();
        }
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'An error occurred',
        severity: 'error'
      });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'TeamLead':
        return 'error';
      case 'Member':
        return 'primary';
      case 'Observer':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Team columns
  const teamColumns = [
    {
      field: 'name',
      headerName: 'Team Name',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon sx={{ color: 'primary.main', fontSize: 18 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'groupMail',
      headerName: 'Group Email',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'memberCount',
      headerName: 'Members',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value || 0}
          size="small"
          color={params.value > 0 ? 'primary' : 'default'}
          sx={{ fontWeight: 600 }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      align: 'center',
      type: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={(e) => {
            e.stopPropagation();
            handleEditTeam(params.row);
          }}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTeam(params.row);
          }}
          showInMenu={false}
        />
      ]
    }
  ];

  // Member columns
  const memberColumns = [
    {
      field: 'user',
      headerName: 'Member',
      flex: 1,
      minWidth: 180,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        const userName = params.row.user?.displayName || params.row.userName || params.row.userEmail;
        const userEmail = params.row.user?.email || params.row.userEmail;
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: 'primary.main',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.813rem' }}>
                {userEmail}
              </Typography>
            </Box>
          </Stack>
        );
      }
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.row.role}
          color={getRoleColor(params.row.role)}
          size="small"
          sx={{ fontWeight: 600, fontSize: '0.688rem' }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      align: 'center',
      type: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={(e) => {
            e.stopPropagation();
            handleEditMember(params.row);
          }}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteMember(params.row);
          }}
          showInMenu={false}
        />
      ]
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Sales Teams Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage team structure, members, and roles
        </Typography>
      </Box>

      {/* Two Column Layout */}
      <Grid container spacing={2}>
        {/* Left Column - Teams */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              height: 'calc(100vh - 220px)'
            }}
          >
            {/* Teams Toolbar */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                Teams
              </Typography>
              <TeamListToolbar
                onSearch={handleTeamsSearch}
                onFilterChange={handleTeamsFilterChange}
                onCreateTeam={handleCreateTeam}
                selectedCount={selectedTeamRows.length}
                onBulkDelete={handleBulkDeleteTeams}
              />

              {teamsError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {teamsError}
                </Alert>
              )}
            </Box>

            {/* Teams Data Grid */}
            <DataGrid
              rows={teams}
              columns={teamColumns}
              loading={teamsLoading}
              paginationModel={teamsPaginationModel}
              onPaginationModelChange={setTeamsPaginationModel}
              pageSizeOptions={[25, 50, 100]}
              rowCount={teamsRowCount}
              paginationMode="server"
              checkboxSelection
              disableRowSelectionOnClick
              onRowSelectionModelChange={(newSelection) => {
                setSelectedTeamRows(newSelection);
              }}
              rowSelectionModel={selectedTeamRows}
              onRowClick={handleTeamRowClick}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: 'grey.50',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  fontWeight: 700,
                  fontSize: '0.813rem'
                },
                '& .MuiDataGrid-cell': {
                  fontSize: '0.813rem',
                  py: 1,
                  display: 'flex',
                  alignItems: 'center'
                },
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.50',
                    '&:hover': {
                      bgcolor: 'primary.100'
                    }
                  }
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                  outline: 'none'
                },
                '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                  outline: 'none'
                }
              }}
            />
          </Paper>
        </Grid>

        {/* Right Column - Members */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              height: 'calc(100vh - 220px)'
            }}
          >
            {selectedTeam ? (
              <>
                {/* Members Toolbar */}
                <Box
                  sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Members of {selectedTeam.name}
                    </Typography>
                    <Tooltip title="Team Info">
                      <IconButton size="small" onClick={() => handleViewTeam(selectedTeam)}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <TeamMembersToolbar
                    onSearch={handleMembersSearch}
                    onFilterChange={handleMembersFilterChange}
                    onAddMember={handleAddMember}
                    selectedCount={selectedMemberRows.length}
                    onBulkRemove={handleBulkRemoveMembers}
                  />

                  {membersError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {membersError}
                    </Alert>
                  )}
                </Box>

                {/* Members Data Grid */}
                <DataGrid
                  rows={members}
                  columns={memberColumns}
                  loading={membersLoading}
                  paginationModel={membersPaginationModel}
                  onPaginationModelChange={setMembersPaginationModel}
                  pageSizeOptions={[25, 50, 100]}
                  rowCount={membersRowCount}
                  paginationMode="server"
                  checkboxSelection
                  disableRowSelectionOnClick
                  onRowSelectionModelChange={(newSelection) => {
                    setSelectedMemberRows(newSelection);
                  }}
                  rowSelectionModel={selectedMemberRows}
                  onRowClick={(params) => handleViewMember(params.row)}
                  getRowId={(row) => row.user?.email || row.userEmail}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                      bgcolor: 'grey.50',
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      fontWeight: 700,
                      fontSize: '0.813rem'
                    },
                    '& .MuiDataGrid-cell': {
                      fontSize: '0.813rem',
                      py: 1,
                      display: 'flex',
                      alignItems: 'center'
                    },
                    '& .MuiDataGrid-row': {
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    },
                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                      outline: 'none'
                    },
                    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                      outline: 'none'
                    }
                  }}
                />
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary',
                  p: 3
                }}
              >
                <PeopleIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No Team Selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a team from the left to view its members
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Team Dialogs */}
      {/* Delete Team Dialog */}
      {teamDeleteDialogOpen && teamToDelete && (
        <Dialog
          open={teamDeleteDialogOpen}
          onClose={() => setTeamDeleteDialogOpen(false)}
          TransitionComponent={Fade}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>Delete Team</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the team <strong>"{teamToDelete.name}"</strong>?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setTeamDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteTeam}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Bulk Delete Teams Dialog */}
      {teamBulkDeleteDialogOpen && (
        <Dialog
          open={teamBulkDeleteDialogOpen}
          onClose={() => setTeamBulkDeleteDialogOpen(false)}
          TransitionComponent={Fade}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>Delete Multiple Teams</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>{selectedTeamRows.length}</strong> selected team(s)?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setTeamBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmBulkDeleteTeams}
              color="error"
              variant="contained"
            >
              Delete All
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Team Form Dialog */}
      {teamFormOpen && (
        <TeamForm
          open={teamFormOpen}
          onClose={handleTeamFormClose}
          onSave={handleTeamFormSave}
          team={editingTeam}
        />
      )}

      {/* Team Details Drawer */}
      <TeamDetailsDrawer
        open={teamDetailsDrawerOpen}
        onClose={() => setTeamDetailsDrawerOpen(false)}
        teamId={selectedTeam?.id}
        onEdit={handleEditTeam}
        onDelete={handleDeleteTeam}
      />

      {/* Member Dialogs */}
      {/* Delete Member Dialog */}
      {memberDeleteDialogOpen && memberToDelete && (
        <Dialog
          open={memberDeleteDialogOpen}
          onClose={() => setMemberDeleteDialogOpen(false)}
          TransitionComponent={Fade}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>Remove Team Member</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove{' '}
              <strong>
                {memberToDelete.user?.displayName || memberToDelete.user?.email || memberToDelete.userEmail}
              </strong>{' '}
              from this team? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setMemberDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDeleteMember} color="error" variant="contained">
              Remove
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Bulk Remove Members Dialog */}
      {memberBulkDeleteDialogOpen && (
        <Dialog
          open={memberBulkDeleteDialogOpen}
          onClose={() => setMemberBulkDeleteDialogOpen(false)}
          TransitionComponent={Fade}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>Remove Multiple Members</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove <strong>{selectedMemberRows.length}</strong> selected member(s)? This
              action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setMemberBulkDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmBulkRemoveMembers} color="error" variant="contained">
              Remove All
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Member Form Dialog */}
      {memberFormOpen && (
        <TeamMemberForm open={memberFormOpen} onClose={handleMemberFormClose} onSave={handleMemberFormSave} member={editingMember} />
      )}

      {/* Member Details Drawer */}
      <MemberDetailsDrawer
        open={memberDetailsDrawerOpen}
        onClose={() => setMemberDetailsDrawerOpen(false)}
        member={selectedMember}
        onEdit={handleEditMember}
        onRemove={handleDeleteMember}
        loading={false}
      />

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamsManagement;

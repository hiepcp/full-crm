import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTeams } from '../../../app/contexts/TeamContext';
import { TEAM_ROLES } from '../../../utils/constants';
import TeamMemberForm from './TeamMemberForm';

const TeamMembers = () => {
  const { id } = useParams();
  const teamId = Number(id);
  const {
    fetchTeamMembers,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember
  } = useTeams();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    if (!Number.isFinite(teamId)) {
      return;
    }
    loadMembers();
  }, [teamId, pagination.page, pagination.pageSize, roleFilter]);

  const loadMembers = async () => {
    if (!Number.isFinite(teamId)) {
      setMembers([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await fetchTeamMembers(teamId, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...(roleFilter && { role: roleFilter })
      });
      setMembers(result?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = () => {
    setPagination({ ...pagination, page: 1 });
  };

  const handleRoleFilterChange = (event, newValue) => {
    setRoleFilter(newValue || event.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormOpen(true);
  };

  const handleDelete = (member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (memberToDelete) {
      const userEmail = memberToDelete.user?.email || memberToDelete.userEmail;
      const success = await removeTeamMember(teamId, userEmail);
      if (success) {
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
        loadMembers();
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingMember(null);
  };

  const handleFormSave = async (memberData) => {
    if (editingMember) {
      const userEmail = editingMember.user?.email || editingMember.userEmail;
      const success = await updateTeamMemberRole(teamId, userEmail, memberData);
      if (success) {
        setFormOpen(false);
        setEditingMember(null);
        loadMembers();
      }
    } else {
      const success = await addTeamMember(teamId, memberData);
      if (success) {
        setFormOpen(false);
        loadMembers();
      }
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setFormOpen(true);
  };

  const columns = [
    { 
      field: 'user', 
      headerName: 'User', 
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontWeight: 500 }}>
            {params.row.user?.displayName || params.row.userEmail}
          </Box>
        </Box>
      )
    },
    { 
      field: 'role', 
      headerName: 'Role', 
      flex: 0.8,
      renderCell: (params) => (
        <Box sx={{ fontWeight: 500 }}>
          {params.row.role}
        </Box>
      )
    },
    { 
      field: 'joinedAt', 
      headerName: 'Joined At', 
      flex: 1,
      renderCell: (params) => new Date(params.row.joinedAt).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.7,
      align: 'center',
      renderCell: (params) => {
        const member = params.row;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              aria-label="edit"
              onClick={() => handleEdit(member)}
              color="primary"
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="delete"
              onClick={() => handleDelete(member)}
              color="error"
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Team Members
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddMember}
          sx={{ mt: 2 }}
        >
          Add Member
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search by email..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearchUser();
            }
          }}
          size="small"
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Role</InputLabel>
          <Autocomplete
            options={['', ...TEAM_ROLES.map(r => r.value)]}
            getOptionLabel={(option) => option || 'All'}
            value={roleFilter}
            onChange={handleRoleFilterChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label=""
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <IconButton
                      onClick={() => setRoleFilter('')}
                      edge="end"
                    >
                      <CloseIcon />
                    </IconButton>
                  )
                }}
              />
            )}
          />
        </FormControl>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Box sx={{ height: 'calc(100vh - 250px)' }}>
        <DataGrid
          rows={members}
          columns={columns}
          loading={loading}
          pageSize={pagination.pageSize}
          rowsPerPageOptions={[25, 50, 100]}
          page={pagination.page}
          onPageChange={(newPage) => setPagination({ ...pagination, page: newPage })}
          onPageSizeChange={(newPageSize) => setPagination({ ...pagination, pageSize: newPageSize })}
          pagination
          autoHeight
          disableColumnSelector
          getRowId={(row) => row.user?.email || row.userEmail}
          sx={{
            '& .MuiDataGrid-cell': {
              fontSize: '0.9rem'
            },
            '& .MuiDataGrid-columnHeader': {
              fontSize: '0.9rem',
              fontWeight: 600
            }
          }}
        />
      </Box>

      {deleteDialogOpen && memberToDelete && (
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Remove Team Member</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove <strong>{memberToDelete.user?.displayName || memberToDelete.user?.email || memberToDelete.userEmail}</strong> from this team?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              color="error"
              variant="contained"
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {formOpen && (
        <TeamMemberForm
          open={formOpen}
          onClose={handleFormClose}
          onSave={handleFormSave}
          member={editingMember}
        />
      )}
    </Box>
  );
};

export default TeamMembers;

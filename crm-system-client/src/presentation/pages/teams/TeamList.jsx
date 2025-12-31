import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarContainer,
  GridToolbar,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useTeams } from '../../../app/contexts/TeamContext';
import TeamForm from './TeamForm';

const TeamList = () => {
  const navigate = useNavigate();
  const { teams, loading, error, deleteTeam, fetchTeams } = useTeams();
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  useEffect(() => {
    fetchTeams({ page: pagination.page, pageSize: pagination.pageSize, keyword });
  }, [pagination.page, pagination.pageSize, keyword]);

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    setKeyword(search);
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormOpen(true);
  };

  const handleDelete = (team) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (teamToDelete) {
      const success = await deleteTeam(teamToDelete.id);
      if (success) {
        setDeleteDialogOpen(false);
        setTeamToDelete(null);
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTeam(null);
  };

  const handleFormSave = () => {
    setFormOpen(false);
    setEditingTeam(null);
    fetchTeams({ page: pagination.page, pageSize: pagination.pageSize, keyword });
  };

  const handleCreateTeam = () => {
    setEditingTeam(null);
    setFormOpen(true);
  };

  const columns = [
    { field: 'name', headerName: 'Team Name', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 2 },
    { field: 'memberCount', headerName: 'Members', flex: 0.5, align: 'center' },
    { field: 'createdAt', headerName: 'Created At', flex: 0.5, align: 'center' },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      align: 'center',
      renderCell: (params) => {
        const team = params.row;
        return (
          <GridActionsCellItem>
            <IconButton
              aria-label="edit"
              onClick={() => handleEdit(team)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              aria-label="delete"
              onClick={() => handleDelete(team)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </GridActionsCellItem>
        );
      }
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Sales Teams
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTeam}
          sx={{ mt: 2 }}
        >
          Create Team
        </Button>
      </Box>

      <GridToolbarContainer>
        <GridToolbar>
          <TextField
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            sx={{ width: 300 }}
            size="small"
          />
          <Button
            variant="outlined"
            onClick={handleSearch}
            disabled={!search}
          >
            Search
          </Button>
        </GridToolbar>
      </GridToolbarContainer>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <DataGrid
        rows={teams}
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
        sx={{
          '& .MuiDataGrid-cell': {
            fontSize: '0.9rem'
          }
        }}
      />

      {deleteDialogOpen && teamToDelete && (
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Team</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the team "<strong>{teamToDelete.name}</strong>"?
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
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {formOpen && (
        <TeamForm
          open={formOpen}
          onClose={handleFormClose}
          onSave={handleFormSave}
          team={editingTeam}
        />
      )}
    </Box>
  );
};

export default TeamList;
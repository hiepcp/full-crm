import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useTeams } from '../../../app/contexts/TeamContext';
import TeamForm from './TeamForm';

const TeamList = () => {
  const navigate = useNavigate();
  const { teams, loading, error, deleteTeam, fetchTeams, createTeam, updateTeam } = useTeams();
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [rowCount, setRowCount] = useState(0);
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  useEffect(() => {
    const loadTeams = async () => {
      const response = await fetchTeams({ 
        page: paginationModel.page + 1, 
        pageSize: paginationModel.pageSize, 
        keyword 
      });
      if (response?.data?.totalCount !== undefined) {
        setRowCount(response.data.totalCount);
      }
    };
    loadTeams();
  }, [paginationModel.page, paginationModel.pageSize, keyword]);

  const handleSearch = () => {
    setPaginationModel({ ...paginationModel, page: 0 });
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

  const handleFormSave = async (teamData) => {
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, teamData);
      } else {
        await createTeam(teamData);
      }
      setFormOpen(false);
      setEditingTeam(null);
      await fetchTeams({ 
        page: paginationModel.page + 1, 
        pageSize: paginationModel.pageSize, 
        keyword 
      });
    } catch (err) {
      console.error('Error saving team:', err);
    }
  };

  const handleCreateTeam = () => {
    setEditingTeam(null);
    setFormOpen(true);
  };

  const columns = [
    { field: 'name', headerName: 'Team Name', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 2 },
    { 
      field: 'memberCount', 
      headerName: 'Members', 
      flex: 0.5, 
      align: 'center',
      headerAlign: 'center'
    },
    { 
      field: 'createdOn', 
      headerName: 'Created At', 
      flex: 1, 
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (params) => {
        if (!params) return '';
        const date = new Date(params);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      align: 'center',
      type: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEdit(params.row)}
          color="primary"
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDelete(params.row)}
          color="error"
        />
      ]
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

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
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
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <DataGrid
        rows={teams}
        columns={columns}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[25, 50, 100]}
        rowCount={rowCount}
        paginationMode="server"
        pagination
        autoHeight
        disableColumnSelector
        disableRowSelectionOnClick
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

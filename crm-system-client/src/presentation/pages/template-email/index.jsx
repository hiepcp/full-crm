import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Typography,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import EmailTemplateCard from './components/EmailTemplateCard';
import EmailTemplateForm from './components/EmailTemplateForm';
import EmailTemplatePreview from './components/EmailTemplatePreview';
import { EmailTemplateCategory, EmailTemplateCategoryLabels } from '../../../utils/constants_template_mail';
import emailTemplateApi from '../../../infrastructure/api/emailTemplateApi';
import { tokenHelper } from '../../../utils/tokenHelper';

const EmailTemplatePage = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: My Templates, 2: Shared
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  
  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // Get current user email from token
    const email = tokenHelper.getEmailFromToken();
    if (email) {
      setCurrentUserEmail(email);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [tabValue]); // Reload when tab changes

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, categoryFilter]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let data;
      if (tabValue === 0) {
        // All templates (owned + shared)
        data = await emailTemplateApi.getAll();
      } else if (tabValue === 1) {
        // My Templates
        data = await emailTemplateApi.getMyTemplates();
      } else {
        // Shared Templates
        data = await emailTemplateApi.getSharedTemplates();
      }
      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      showSnackbar('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    setFilteredTemplates(filtered);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setFormOpen(true);
  };

  const handleEdit = async (template) => {
    try {
      // Load full template details including attachments
      const fullTemplate = await emailTemplateApi.getById(template.id);
      setSelectedTemplate(fullTemplate);
      setFormOpen(true);
    } catch (error) {
      console.error('Failed to load template details:', error);
      showSnackbar('Failed to load template details', 'error');
    }
  };

  const handleDelete = (template) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await emailTemplateApi.delete(selectedTemplate.id);
      showSnackbar('Template deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
      loadTemplates(); // Reload templates
    } catch (error) {
      console.error('Failed to delete template:', error);
      showSnackbar('Failed to delete template', 'error');
    }
  };

  const handleDuplicate = async (template) => {
    try {
      // Load full template details including attachments
      const fullTemplate = await emailTemplateApi.getById(template.id);
      const duplicated = {
        ...fullTemplate,
        id: null, // Remove ID for creation
        name: `${fullTemplate.name} (Copy)`
      };
      setSelectedTemplate(duplicated);
      setFormOpen(true);
    } catch (error) {
      console.error('Failed to load template details:', error);
      showSnackbar('Failed to load template details', 'error');
    }
  };

  const handlePreview = async (template) => {
    try {
      // Load full template details including attachments
      const fullTemplate = await emailTemplateApi.getById(template.id);
      setSelectedTemplate(fullTemplate);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Failed to load template details:', error);
      showSnackbar('Failed to load template details', 'error');
    }
  };

  const handleSave = async (templateData) => {
    try {
      if (templateData.id) {
        // Update existing template
        await emailTemplateApi.update(templateData.id, templateData);
        showSnackbar('Template updated successfully', 'success');
      } else {
        // Create new template
        await emailTemplateApi.create(templateData);
        showSnackbar('Template created successfully', 'success');
      }

      setFormOpen(false);
      setSelectedTemplate(null);
      loadTemplates(); // Reload templates
    } catch (error) {
      console.error('Failed to save template:', error);
      showSnackbar(error.response?.data?.message || 'Failed to save template', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Email Templates
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateNew}>
          Create Template
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {Object.entries(EmailTemplateCategory).map(([key, value]) => (
                  <MenuItem key={value} value={value}>
                    {EmailTemplateCategoryLabels[value]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label={`All Templates (${templates.length})`} />
        <Tab label={`My Templates (${templates.filter((t) => t.creatorEmail === currentUserEmail).length})`} />
        <Tab
          label={`Shared Templates (${templates.filter((t) => t.isShared && t.creatorEmail !== currentUserEmail).length})`}
        />
      </Tabs>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredTemplates.length === 0 ? (
        <Alert severity="info">
          No templates found. {tabValue === 0 && 'Create your first template to get started!'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredTemplates.map((template) => (
            <Grid item size={{xs: 12, sm: 6, md: 4, xl: 3}} key={template.id}>
              <EmailTemplateCard
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onPreview={handlePreview}
                currentUserEmail={currentUserEmail}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialogs */}
      <EmailTemplateForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onSave={handleSave}
      />

      <EmailTemplatePreview
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedTemplate(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the template <strong>"{selectedTemplate?.name}"</strong>?
            <br />
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedTemplate(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={confirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmailTemplatePage;

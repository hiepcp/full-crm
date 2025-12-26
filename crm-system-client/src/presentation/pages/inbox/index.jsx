import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Stack,
  Checkbox,
  FormControl,
  Select,
  MenuItem,
  Divider,
  Tooltip,
  Badge,
  Grid,
  Alert
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarColumnsButton
} from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkEmailReadIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  PriorityHigh as PriorityHighIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon
} from '@mui/icons-material';
import { formatDateTime } from '../../../utils/formatDateTime';

// Import email connection context
import { useEmailConnection } from '@app/contexts/EmailConnectionContext';

// Import repositories
import { LocalAuthRepository } from '@infrastructure/repositories/LocalAuthRepository';
import { EmailAuthRepository } from '@infrastructure/repositories/EmailAuthRepository';

const Inbox = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterImportance, setFilterImportance] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [emails, setEmails] = useState([]);

  // Use email connection context
  const {
    connectionInfo,
    isConnected,
    isLoading: isLoadingConnection,
    refreshConnection,
    connectionStatus
  } = useEmailConnection();

  // Load emails based on connection status
  useEffect(() => {
    if (isConnected) {
      loadRealEmails();
    }
  }, [isConnected]);

  const loadRealEmails = async () => {
    try {
      const localRepo = new LocalAuthRepository();
      const emailAuthRepo = new EmailAuthRepository(localRepo);

      const realEmails = await emailAuthRepo.getEmails(50, 1);
      // Transform real emails to match mock email format
      const emailData = realEmails.emails || realEmails;
      const transformedEmails = emailData.map(email => ({
        id: email.id,
        conversationId: email.conversationId,
        subject: email.subject,
        bodyPreview: email.bodyPreview || email.body?.content?.substring(0, 200) || '',
        body: email.body,
        importance: email.importance || 'normal',
        hasAttachments: email.hasAttachments || false,
        isRead: email.isRead || false,
        isDraft: false,
        from: email.from,
        sender: email.sender,
        toRecipients: email.toRecipients,
        ccRecipients: email.ccRecipients,
        bccRecipients: email.bccRecipients,
        replyTo: email.replyTo,
        receivedDateTime: email.receivedDateTime,
        sentDateTime: email.sentDateTime,
        createdDateTime: email.createdDateTime,
        lastModifiedDateTime: email.lastModifiedDateTime,
        internetMessageId: email.internetMessageId,
        categories: email.categories || [],
        flag: email.flag,
        attachments: email.attachments || [],
        syncedToActivity: false, // Default to false, would need backend integration
        potentialRelationType: 'contact', // Default, would need AI/ML to determine
        potentialRelationId: null,
        matchedContactId: null
      }));

      setEmails(transformedEmails);
    } catch (error) {
      console.error('Error loading real emails:', error);
    }
  };


  // Filter emails based on current tab, search, and filters
  const filteredEmails = useMemo(() => {
    let filtered = emails;

    // Filter by tab
    switch (selectedTab) {
      case 0: // All
        break;
      case 1: // Unread
        filtered = filtered.filter(email => !email.isRead);
        break;
      case 2: // Flagged
        filtered = filtered.filter(email => email.flag?.flagStatus === 'flagged');
        break;
      case 3: // With Attachments
        filtered = filtered.filter(email => email.hasAttachments);
        break;
      case 4: // Important
        filtered = filtered.filter(email => email.importance === 'high');
        break;
      default:
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.from.emailAddress.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.from.emailAddress.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by importance
    if (filterImportance !== 'all') {
      filtered = filtered.filter(email => email.importance === filterImportance);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'read') {
        filtered = filtered.filter(email => email.isRead);
      } else if (filterStatus === 'unread') {
        filtered = filtered.filter(email => !email.isRead);
      }
    }

    return filtered;
  }, [emails, selectedTab, searchTerm, filterImportance, filterStatus]);

  const handleSelectEmail = (emailId) => {
    setSelectedEmails(prev =>
      prev.includes(emailId)
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(email => email.id));
    }
  };

  const handleMarkAsRead = () => {
    // In a real app, this would update the email status
    console.log('Mark as read:', selectedEmails);
    setSelectedEmails([]);
  };

  const handleMarkAsUnread = () => {
    // In a real app, this would update the email status
    console.log('Mark as unread:', selectedEmails);
    setSelectedEmails([]);
  };

  const handleArchive = () => {
    // In a real app, this would archive the selected emails
    console.log('Archive:', selectedEmails);
    setSelectedEmails([]);
  };

  const handleDelete = () => {
    // In a real app, this would delete the selected emails
    console.log('Delete:', selectedEmails);
    setSelectedEmails([]);
  };

  const getEmailIcon = (email) => {
    if (email.matchedContactId) {
      return <PersonIcon />;
    }
    if (email.potentialRelationType === 'deal') {
      return <BusinessIcon />;
    }
    return <EmailIcon />;
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'high':
        return 'error';
      case 'low':
        return 'default';
      default:
        return 'primary';
    }
  };

  const getStatusChip = (email) => {
    if (email.syncedToActivity) {
      return (
        <Chip
          label="SYNCED"
          size="small"
          sx={{
            height: 18,
            fontSize: '0.65rem',
            bgcolor: '#e8f5e8',
            color: '#2e7d32'
          }}
        />
      );
    }
    if (!email.isRead) {
      return (
        <Chip
          label="UNREAD"
          size="small"
          sx={{
            height: 18,
            fontSize: '0.65rem',
            bgcolor: '#e3f2fd',
            color: 'primary.main'
          }}
        />
      );
    }
    return null;
  };

  const tabs = [
    { label: `All (${emails.length})`, icon: <EmailIcon fontSize="small" /> },
    { label: `Unread (${emails.filter(e => !e.isRead).length})`, icon: <MarkEmailUnreadIcon fontSize="small" /> },
    { label: `Flagged (${emails.filter(e => e.flag?.flagStatus === 'flagged').length})`, icon: <StarIcon fontSize="small" /> },
    { label: `Attachments (${emails.filter(e => e.hasAttachments).length})`, icon: <ArchiveIcon fontSize="small" /> },
    { label: `Important (${emails.filter(e => e.importance === 'high').length})`, icon: <PriorityHighIcon fontSize="small" /> }
  ];

  // Custom toolbar for DataGrid
  const CustomToolbar = () => {
    return (
      <GridToolbarContainer>
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarColumnsButton />
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  };

  // Define columns for DataGrid
  const columns = [
    {
      field: 'checkbox',
      headerName: '',
      width: 50,
      renderHeader: () => (
        <Checkbox
          checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
          indeterminate={selectedEmails.length > 0 && selectedEmails.length < filteredEmails.length}
          onChange={handleSelectAll}
          size="small"
        />
      ),
      renderCell: (params) => (
        <Checkbox
          checked={selectedEmails.includes(params.id)}
          size="small"
          onChange={() => handleSelectEmail(params.id)}
        />
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 80,
      renderCell: (params) => {
        const email = params.row;
        return (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: email.matchedContactId ? '#e3f2fd' : '#f3e5f5',
              color: email.matchedContactId ? 'primary.main' : '#7b1fa2',
              fontSize: 16
            }}
          >
            {getEmailIcon(email)}
          </Avatar>
        );
      },
      sortable: false,
    },
    {
      field: 'from',
      headerName: 'From',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: params.row.isRead ? 400 : 600,
              color: params.row.isRead ? 'text.secondary' : 'text.primary'
            }}
          >
            {params.row.from.emailAddress.name || params.row.from.emailAddress.address}
          </Typography>
          {params.row.flag?.flagStatus === 'flagged' && (
            <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
          )}
          {params.row.importance === 'high' && (
            <PriorityHighIcon sx={{ fontSize: 16, color: 'error.main' }} />
          )}
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.row.from.emailAddress.address}
        </Typography>
      ),
    },
    {
      field: 'subject',
      headerName: 'Subject',
      width: 300,
      renderCell: (params) => (
        <Box>
          <Typography
            variant="body2"
            color="primary"
            sx={{
              fontWeight: 500,
              mb: 0.5,
              fontSize: '0.875rem'
            }}
          >
            {params.row.subject}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatDateTime(params.row.receivedDateTime, 'MMM D, HH:mm')}
            </Typography>
            {params.row.hasAttachments && (
              <Chip
                label="ATTACHMENT"
                size="small"
                variant="outlined"
                sx={{
                  height: 16,
                  fontSize: '0.625rem',
                  color: 'text.secondary'
                }}
              />
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => getStatusChip(params.row),
      sortable: false,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Add as Contact">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Add as Contact:', params.row.from.emailAddress.address);
                // Here you would typically open a dialog or navigate to contact creation form
              }}
              sx={{
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                }
              }}
            >
              <PersonAddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Reply to:', params.id);
            }}
          >
            <ReplyIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Forward:', params.id);
            }}
          >
            <ForwardIcon fontSize="small" />
          </IconButton>
          <IconButton size="small">
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            Inbox
          </Typography>
          {isConnected && connectionInfo && (
            <Chip
              label={`Connected: ${connectionInfo.email}`}
              color="success"
              variant="outlined"
              size="small"
              icon={<CloudDoneIcon />}
            />
          )}
          {!isConnected && connectionStatus !== 'unknown' && !isLoadingConnection && (
            <Chip
              label="Not Connected"
              color="warning"
              variant="outlined"
              size="small"
              icon={<CloudOffIcon />}
              onClick={() => window.location.href = '/connect/email'}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            size="small"
          >
            Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            size="small"
            onClick={refreshConnection}
            disabled={isLoadingConnection}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Connection Status Banner */}
      {isConnected && connectionInfo && (
        <Card sx={{
          mb: 3,
          bgcolor: '#e8f5e8',
          border: '1px solid #4caf50',
          boxShadow: 'none'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 20 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                  Your email sync is complete
                </Typography>
                <Typography variant="body2" sx={{ color: '#388e3c' }}>
                  Your current inbox and past 60-day history for existing contacts has been successfully synced with your Pipeline account.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {!isConnected && connectionStatus !== 'unknown' && !isLoadingConnection && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => window.location.href = '/connect/email'}
            >
              Connect Now
            </Button>
          }
        >
          <Typography variant="body2">
            Connect your Microsoft email account to enable email automation and sync your inbox with CRM contacts.
            Email automation is not available for email servers hosted on-premises.
          </Typography>
        </Alert>
      )}

      {isLoadingConnection && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Checking email connection status...
          </Typography>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search emails..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={filterImportance}
                onChange={(e) => setFilterImportance(e.target.value)}
                displayEmpty
              >
                <MenuItem value="all">All Priority</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                displayEmpty
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="read">Read</MenuItem>
                <MenuItem value="unread">Unread</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              size="small"
            >
              More Filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none'
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{ gap: 1 }}
            />
          ))}
        </Tabs>
      </Card>

      {/* Email Actions Bar */}
      {selectedEmails.length > 0 && (
        <Card sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {selectedEmails.length} selected
              </Typography>
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Mark as Read">
                <IconButton size="small" onClick={handleMarkAsRead}>
                  <MarkEmailReadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mark as Unread">
                <IconButton size="small" onClick={handleMarkAsUnread}>
                  <MarkEmailUnreadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Archive">
                <IconButton size="small" onClick={handleArchive}>
                  <ArchiveIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={handleDelete} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Email DataGrid */}
      <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 0 }}>
          {filteredEmails.length === 0 ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              px: 2
            }}>
              <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No emails found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || filterImportance !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Your inbox is empty'
                }
              </Typography>
            </Box>
          ) : (
            <DataGrid
              rows={filteredEmails}
              columns={columns}
              checkboxSelection={false}
              disableRowSelectionOnClick
              slots={{
                toolbar: CustomToolbar,
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f8f9fa',
                },
                '& .MuiDataGrid-row.Mui-selected': {
                  backgroundColor: '#e3f2fd',
                },
                '& .MuiDataGrid-row.Mui-selected:hover': {
                  backgroundColor: '#e3f2fd',
                },
              }}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 },
                },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              autoHeight
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Inbox;

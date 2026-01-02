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
  Button,
  Alert,
  Skeleton,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { formatDateTime } from './utils/dateUtils';
import { getRoleColor, getRoleDetails, getRoleDescription } from './utils/roleUtils';
import { getUserName, getUserEmail, getUserInitials } from './utils/userUtils';

const MemberDetailsDrawer = ({ open, onClose, member, onEdit, onRemove, loading }) => {
  const handleEdit = () => {
    onEdit(member);
    onClose();
  };

  const handleRemove = () => {
    onRemove(member);
    onClose();
  };

  const userName = getUserName(member);
  const userEmail = getUserEmail(member);
  const userInitials = getUserInitials(userName);
  const userRole = member?.role || 'Member';
  const roleDetails = getRoleDetails(userRole);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
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
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.light',
                  fontSize: '1.5rem',
                  fontWeight: 700
                }}
              >
                {loading ? '...' : userInitials}
              </Avatar>
              <Box>
                {loading ? (
                  <Skeleton variant="text" width={150} height={28} sx={{ bgcolor: 'primary.light' }} />
                ) : (
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {userName}
                  </Typography>
                )}
                {loading ? (
                  <Skeleton variant="text" width={100} sx={{ bgcolor: 'primary.light' }} />
                ) : (
                  <Chip
                    label={roleDetails.label}
                    size="small"
                    color={getRoleColor(userRole)}
                    sx={{
                      height: 24,
                      fontWeight: 600,
                      bgcolor: 'white',
                      color: `${getRoleColor(userRole)}.main`
                    }}
                  />
                )}
              </Box>
            </Stack>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="rectangular" height={80} />
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
                Edit Role
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRemove}
              >
                Remove
              </Button>
            </Stack>

            <Divider />

            {/* Contact Information */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}
              >
                Contact Information
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'grey.50'
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {userEmail}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>
            </Box>

            <Divider />

            {/* Role & Permissions */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}
              >
                Role & Permissions
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'grey.50'
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SecurityIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Current Role
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {roleDetails.label}
                        </Typography>
                        <Chip
                          label={userRole}
                          size="small"
                          color={getRoleColor(userRole)}
                          sx={{ height: 20 }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>

              {/* Role Description */}
              <Alert severity="info" sx={{ mt: 2, borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Role Permissions:
                </Typography>
                <Typography variant="caption">
                  {getRoleDescription(userRole)}
                </Typography>
              </Alert>
            </Box>

            <Divider />

            {/* Membership Info */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}
              >
                Membership Information
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'grey.50'
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Joined At
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDateTime(member?.joinedAt)}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
};

MemberDetailsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  member: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

MemberDetailsDrawer.defaultProps = {
  loading: false,
  member: null
};

export default MemberDetailsDrawer;

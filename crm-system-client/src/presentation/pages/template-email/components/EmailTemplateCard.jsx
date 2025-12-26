import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  Lock as LockIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { EmailTemplateCategoryLabels } from '../../../../utils/constants_template_mail';

const EmailTemplateCard = ({ template, onEdit, onDelete, onDuplicate, onPreview, currentUserEmail }) => {
  const isOwner = template.creatorEmail === currentUserEmail;
  const canEdit = template.isShared || isOwner;
  const canDelete = isOwner;

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Typography variant="h6" component="div" gutterBottom>
            {template.name}
          </Typography>
          {template.isShared ? (
            <Chip icon={<ShareIcon />} label="Shared" size="small" color="success" variant="outlined" />
          ) : (
            <Chip icon={<LockIcon />} label="Private" size="small" color="default" variant="outlined" />
          )}
        </Box>

        {template.category && (
          <Chip label={EmailTemplateCategoryLabels[template.category] || template.category} size="small" color="primary" sx={{ mb: 1 }} />
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          <strong>Subject:</strong> {template.subject}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <Avatar
            sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}
            alt={template.creatorEmail}
          >
            {template.creatorEmail?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {template.creatorEmail}
          </Typography>
        </Box>

        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`Used ${template.usageCount} times`} size="small" variant="outlined" />
          {template.attachments?.length > 0 && (
            <Chip
              icon={<AttachFileIcon />}
              label={`${template.attachments.length} files`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Last used: {template.lastUsedAt ? formatDate(template.lastUsedAt) : 'Never'}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          <Tooltip title="Preview">
            <IconButton size="small" onClick={() => onPreview(template)} color="primary">
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate">
            <IconButton size="small" onClick={() => onDuplicate(template)} color="info">
              <CopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          {canEdit && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(template)} color="primary">
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(template)} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default EmailTemplateCard;

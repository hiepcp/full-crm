import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import { Close as CloseIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { EmailTemplateCategory, EmailTemplateCategoryLabels } from '../../../../utils/constants_template_mail';

const EmailTemplatePreview = ({ open, onClose, template }) => {
  if (!template) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Template Preview</Typography>
          <Chip
            label={template.isShared ? 'Shared' : 'Private'}
            color={template.isShared ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Template Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {template.name}
          </Typography>
          {template.category && <Chip label={EmailTemplateCategoryLabels[template.category]} size="small" color="primary" sx={{ mb: 1 }} />}
          {template.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {template.description}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Email Preview */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Subject:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {template.subject}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Email Body */}
          <Box
            sx={{
              '& p': { mb: 1 },
              '& ul, & ol': { pl: 3, mb: 1 },
              '& li': { mb: 0.5 },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                display: 'block'
              },
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: '100%'
            }}
            dangerouslySetInnerHTML={{ __html: template.body }}
          />

          {/* Signature */}
          {template.includeSignature && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Signature:
                </Typography>
                {template.customSignature ? (
                  <Box dangerouslySetInnerHTML={{ __html: template.customSignature }} />
                ) : (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    (User's default signature will be used)
                  </Typography>
                )}
              </Box>
            </>
          )}

          {/* Attachments */}
          {template.attachments && template.attachments.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Attachments:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {template.attachments.map((att) => (
                    <Chip
                      key={att.id}
                      icon={<AttachFileIcon />}
                      label={att.fileName}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </>
          )}
        </Paper>

        {/* Metadata */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`Created by: ${template.creatorEmail}`} size="small" variant="outlined" />
          <Chip label={`Used ${template.usageCount} times`} size="small" variant="outlined" />
          {template.lastUsedAt && (
            <Chip label={`Last used: ${new Date(template.lastUsedAt).toLocaleDateString()}`} size="small" variant="outlined" />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailTemplatePreview;

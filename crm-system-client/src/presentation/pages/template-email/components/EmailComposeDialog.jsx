import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import TemplateEditor from './TemplateEditor';
import { mockEmailTemplates } from '../../../data/mockEmailTemplates';

const EmailComposeDialog = ({ open, onClose, templateId, entityType, entityId, entityData, onSend }) => {
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState(null);
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    attachments: []
  });

  useEffect(() => {
    if (open && templateId) {
      loadAndRenderTemplate();
    }
  }, [open, templateId, entityType, entityId]);

  const loadAndRenderTemplate = async () => {
    setLoading(true);
    try {
      // TODO: Replace with API call to render template
      // const rendered = await emailTemplateApi.render(templateId, entityType, entityId);
      
      // Mock: Find template and render variables
      const tmpl = mockEmailTemplates.find((t) => t.id === templateId);
      if (tmpl) {
        setTemplate(tmpl);
        
        // Mock rendering: Replace some variables with entity data
        const renderedSubject = renderMockVariables(tmpl.subject, entityData);
        const renderedBody = renderMockVariables(tmpl.body, entityData);
        
        setEmailData({
          to: entityData?.email || '',
          cc: '',
          bcc: '',
          subject: renderedSubject,
          body: renderedBody,
          attachments: tmpl.attachments || []
        });
      }
    } catch (error) {
      console.error('Failed to render template:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock variable rendering (in real app, this is done by backend)
  const renderMockVariables = (text, data) => {
    if (!text || !data) return text;
    
    let rendered = text;
    
    // Replace common variables
    const replacements = {
      '{{lead_name}}': data.fullName || data.name,
      '{{lead_email}}': data.email,
      '{{lead_company}}': data.companyName || data.company,
      '{{contact_name}}': data.fullName || data.name,
      '{{contact_email}}': data.email,
      '{{deal_name}}': data.name || data.dealName,
      '{{deal_value}}': data.value?.toLocaleString() + ' VND' || 'N/A',
      '{{customer_name}}': data.name || data.customerName,
      '{{user_name}}': 'Current User', // Mock current user
      '{{user_position}}': 'Sales Manager',
      '{{company_name}}': 'My CRM Company',
      '{{current_date}}': new Date().toLocaleDateString('vi-VN')
    };
    
    Object.entries(replacements).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(key, 'g'), value || '');
    });
    
    return rendered;
  };

  const handleChange = (field) => (event) => {
    setEmailData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleBodyChange = (content) => {
    setEmailData((prev) => ({
      ...prev,
      body: content
    }));
  };

  const handleSend = async () => {
    try {
      // TODO: Replace with API call
      // await emailTemplateApi.send({
      //   templateId,
      //   entityType,
      //   entityId,
      //   to: emailData.to,
      //   cc: emailData.cc,
      //   bcc: emailData.bcc,
      //   subject: emailData.subject,
      //   body: emailData.body
      // });
      
      console.log('Sending email:', emailData);
      onSend?.({
        ...emailData,
        templateId,
        entityType,
        entityId
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Compose Email from Template</Typography>
          {template && <Chip label={template.name} color="primary" size="small" />}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Review and modify the email content before sending. Variables have been replaced with actual data.
            </Alert>

            {/* To */}
            <TextField
              fullWidth
              label="To"
              value={emailData.to}
              onChange={handleChange('to')}
              required
              sx={{ mb: 2 }}
              placeholder="recipient@example.com"
            />

            {/* CC */}
            <TextField
              fullWidth
              label="CC (optional)"
              value={emailData.cc}
              onChange={handleChange('cc')}
              sx={{ mb: 2 }}
              placeholder="cc@example.com"
            />

            {/* BCC */}
            <TextField
              fullWidth
              label="BCC (optional)"
              value={emailData.bcc}
              onChange={handleChange('bcc')}
              sx={{ mb: 2 }}
              placeholder="bcc@example.com"
            />

            {/* Subject */}
            <TextField
              fullWidth
              label="Subject"
              value={emailData.subject}
              onChange={handleChange('subject')}
              required
              sx={{ mb: 2 }}
            />

            {/* Body */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Email Body
              </Typography>
              <TemplateEditor value={emailData.body} onChange={handleBodyChange} />
            </Box>

            {/* Attachments */}
            {emailData.attachments.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Attachments:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {emailData.attachments.map((att) => (
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
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          startIcon={<SendIcon />}
          disabled={!emailData.to || !emailData.subject || loading}
        >
          Send Email
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailComposeDialog;

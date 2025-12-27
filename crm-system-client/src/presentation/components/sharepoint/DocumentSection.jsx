import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Description as DescriptionIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import DocumentUploadDialog from './DocumentUploadDialog';
import VersionHistoryDialog from './VersionHistoryDialog';
import { RestSharePointRepository } from '@infrastructure/repositories/RestSharePointRepository';
import { GetEntityDocumentsUseCase } from '@application/usecases/sharepoint';

const DocumentSection = ({
  entityType,
  entityId,
  title = 'Documents',
  onDocumentUploaded,
  onDocumentDeleted
}) => {
  const theme = useTheme();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const sharepointRepository = useMemo(() => new RestSharePointRepository(), []);
  const getDocumentsUseCase = useMemo(
    () => new GetEntityDocumentsUseCase(sharepointRepository),
    [sharepointRepository]
  );

  useEffect(() => {
    loadDocuments();
  }, [entityType, entityId]);

  const loadDocuments = async () => {
    if (!entityType || !entityId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getDocumentsUseCase.execute(entityType, entityId);
      setDocuments(result || []);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (uploadedDocument) => {
    loadDocuments();
    if (onDocumentUploaded) {
      onDocumentUploaded(uploadedDocument);
    }
  };

  const handleOpenVersionHistory = (document) => {
    setSelectedDocument(document);
    setVersionDialogOpen(true);
  };

  const handleDelete = async (documentId) => {
    if (onDocumentDeleted) {
      onDocumentDeleted(documentId);
    }
    loadDocuments();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <>
      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: expanded ? 2 : 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                flex: 1,
                '&:hover': { opacity: 0.7 }
              }}
              onClick={() => setExpanded(!expanded)}
            >
              <IconButton size="small" sx={{ p: 0.5, pointerEvents: 'none' }}>
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {title}
              </Typography>
              <Chip
                label={documents.length}
                size="small"
                sx={{
                  height: '20px',
                  fontSize: '0.7rem',
                  bgcolor: theme.palette.grey[100],
                  color: 'text.secondary'
                }}
              />
            </Box>

            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              size="small"
              sx={{ borderRadius: '4px' }}
            >
              Upload
            </Button>
          </Box>

          {expanded && (
            <Box>
              {loading && <LinearProgress sx={{ mb: 2 }} />}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {!loading && documents.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No documents yet. Upload your first document to get started.
                  </Typography>
                </Box>
              )}

              {!loading && documents.length > 0 && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Modified</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow
                          key={doc.id || doc.itemId}
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DescriptionIcon fontSize="small" color="action" />
                              <Typography variant="body2">{doc.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatFileSize(doc.size)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(doc.lastModifiedDateTime)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`v${doc.versionNumber || 1}`}
                              size="small"
                              variant="outlined"
                              sx={{ height: '20px', fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                              <Tooltip title="View in SharePoint">
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(doc.webUrl, '_blank')}
                                  disabled={!doc.webUrl}
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Version History">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenVersionHistory(doc)}
                                  disabled={!doc.itemId}
                                >
                                  <HistoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(doc.id || doc.itemId)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        entityType={entityType}
        entityId={entityId}
        onUploadSuccess={handleUploadSuccess}
      />

      <VersionHistoryDialog
        open={versionDialogOpen}
        onClose={() => setVersionDialogOpen(false)}
        document={selectedDocument}
      />
    </>
  );
};

export default DocumentSection;

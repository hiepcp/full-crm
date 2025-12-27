import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  TextField,
  Grid,
  Alert,
  Paper,
  Typography,
  InputAdornment,
  Chip,
  Stack,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { getQuotationsByCustomer, getDealQuotationsByDeal } from '@presentation/data';
import Modal from '@presentation/components/Modal';
import { formatCurrency } from '../../../../utils/formatCurrency';

const LinkQuotationModal = ({ open, onClose, dealId, customerId, onSubmit }) => {
  const theme = useTheme();
  const [selectedQuotations, setSelectedQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [allQuotations, setAllQuotations] = useState([]);
  const [linkedQuotations, setLinkedQuotations] = useState([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [quotationsError, setQuotationsError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizeDynamicsQuotation = (quotation) => {
    const quotationNumber = quotation.quotationNumber
      || quotation.SalesQuotationNumber
      || quotation.salesQuotationNumber
      || quotation.quotation_number;

    return {
      ...quotation,
      id: quotationNumber,
      quotationNumber,
      name: quotation.name || quotation.SalesQuotationName || quotation.salesQuotationName || quotationNumber,
      description: quotation.description || quotation.QuotationDocumentIntroductionName || '',
      validUntil: quotation.validUntil || quotation.SalesQuotationExpiryDate || quotation.salesQuotationExpiryDate,
      createdOn: quotation.createdOn || quotation.RSVNCreatedDateTime || quotation.rsvnCreatedDateTime,
      status: quotation.status || quotation.SalesQuotationStatus || quotation.salesQuotationStatus || 'unknown',
      totalAmount: quotation.totalAmount ?? quotation.QuotationTotalAmount ?? quotation.quotationTotalAmount ?? 0
    };
  };

  // Memoized derived data
  const linkedQuotationNumbers = useMemo(
    () => linkedQuotations.map(q => q.quotationNumber),
    [linkedQuotations]
  );

  const availableQuotations = useMemo(
    () => allQuotations
      .filter(quotation => !linkedQuotationNumbers.includes(quotation.quotationNumber))
      .filter(quotation =>
        searchTerm === '' ||
        quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quotation.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allQuotations, linkedQuotationNumbers, searchTerm]
  );

  const selectedQuotationDetails = useMemo(
    () => selectedQuotations.map(number =>
      allQuotations.find(q => q.quotationNumber === number)
    ).filter(Boolean),
    [selectedQuotations, allQuotations]
  );

  const totalSelectedValue = useMemo(
    () => selectedQuotationDetails.reduce((sum, q) => sum + q.totalAmount, 0),
    [selectedQuotationDetails]
  );

  // Load quotations data when modal opens
  useEffect(() => {
    const loadQuotations = async () => {
      if (!open) return;

      setQuotationsLoading(true);
      setQuotationsError('');
      setSelectedQuotations([]);
      setSearchTerm('');
      
      try {
        const [allQuotationsData, linkedQuotationsData] = await Promise.all([
          getQuotationsByCustomer(customerId),
          dealId ? getDealQuotationsByDeal(dealId) : []
        ]);
        const normalizedAll = (allQuotationsData || []).map(normalizeDynamicsQuotation).filter(q => q.quotationNumber);
        setAllQuotations(normalizedAll);
        setLinkedQuotations(linkedQuotationsData);
      } catch (error) {
        console.error('Error loading quotations:', error);
        setQuotationsError('Failed to load quotations. Please try again.');
        setAllQuotations([]);
        setLinkedQuotations([]);
      } finally {
        setQuotationsLoading(false);
      }
    };

    loadQuotations();
  }, [open, dealId, customerId]);

  const handleQuotationToggle = (quotationNumber) => {
    setSelectedQuotations(prev => {
      const isSelected = prev.includes(quotationNumber);
      if (isSelected) {
        return prev.filter(id => id !== quotationNumber);
      } else {
        return [...prev, quotationNumber];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedQuotations.length === availableQuotations.length) {
      setSelectedQuotations([]);
    } else {
      setSelectedQuotations(availableQuotations.map(q => q.quotationNumber));
    }
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (selectedQuotations.length === 0) {
      setSubmitError('Please select at least one quotation to link.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call the onSubmit handler which will make the API call
      if (onSubmit) {
        await onSubmit(selectedQuotations);
        setSubmitSuccess(`Successfully linked ${selectedQuotations.length} quotation(s) to this deal.`);
        
        // Reset form after successful submission
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setSubmitError('Submit handler not provided.');
      }
    } catch (error) {
      console.error('Error linking quotations:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to link quotations. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedQuotations([]);
    setSearchTerm('');
    setSubmitError('');
    setSubmitSuccess('');
    setQuotationsError('');
    onClose();
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    const colors = {
      'draft': theme.palette.grey[600],
      'sent': theme.palette.info.main,
      'accepted': theme.palette.success.main,
      'rejected': theme.palette.error.main,
      'expired': theme.palette.warning.main,
      'confirmed': theme.palette.success.main,
      'pending': theme.palette.warning.main
    };
    return colors[statusLower] || theme.palette.grey[600];
  };

  return (
    <Modal
      open={open}
      onClose={!quotationsLoading && !isSubmitting ? handleClose : undefined}
      title="Link Quotations to Deal"
      size="large"
      actions={
        <>
          <Button
            onClick={handleClose}
            variant="outlined"
            size="large"
            disabled={quotationsLoading || isSubmitting}
            sx={{
              textTransform: 'none',
              px: 3,
              borderRadius: 2,
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="large"
            disabled={selectedQuotations.length === 0 || isSubmitting || quotationsLoading}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              textTransform: 'none',
              px: 4,
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            {isSubmitting ? 'Saving...' : `Link ${selectedQuotations.length > 0 ? `(${selectedQuotations.length})` : ''} Quotation${selectedQuotations.length !== 1 ? 's' : ''}`}
          </Button>
        </>
      }
    >
      <Box sx={{ position: 'relative', minHeight: '400px' }}>
        {/* Alerts */}
        {(submitError || submitSuccess || quotationsError) && (
          <Fade in={true}>
            <Alert
              severity={submitError || quotationsError ? "error" : "success"}
              sx={{
                mb: 3,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              {submitError || quotationsError || submitSuccess}
            </Alert>
          </Fade>
        )}

        {/* Loading Spinner */}
        {quotationsLoading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              gap: 2
            }}
          >
            <CircularProgress size={48} thickness={4} />
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Loading quotations...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Selection Summary */}
            {selectedQuotations.length > 0 && (
              <Fade in={true}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 3,
                    border: '2px solid',
                    borderColor: 'success.main',
                    borderRadius: 3,
                    bgcolor: 'success.lighter'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.dark' }}>
                          {selectedQuotations.length} Quotation{selectedQuotations.length !== 1 ? 's' : ''} Selected
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'success.dark', opacity: 0.8 }}>
                          Total Value: {formatCurrency(totalSelectedValue)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Fade>
            )}

            {/* Search Section */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by quotation number, name, or description..."
                disabled={quotationsLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }
                }}
              />
            </Box>

            {/* Select All Checkbox */}
            {availableQuotations.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedQuotations.length === availableQuotations.length && availableQuotations.length > 0}
                      indeterminate={selectedQuotations.length > 0 && selectedQuotations.length < availableQuotations.length}
                      onChange={handleSelectAll}
                      disabled={quotationsLoading}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Select All ({availableQuotations.length} available)
                    </Typography>
                  }
                />
              </Box>
            )}

            {/* Quotations List */}
            <Box
              sx={{
                maxHeight: '450px',
                overflow: 'auto',
                pr: 0.5,
                '&::-webkit-scrollbar': {
                  width: '8px'
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'grey.100',
                  borderRadius: 2
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'grey.400',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'grey.500'
                  }
                }
              }}
            >
              {availableQuotations.length > 0 ? (
                <Stack spacing={2}>
                  {availableQuotations.map((quotation) => {
                    const quotationKey = quotation.quotationNumber || quotation.id;
                    const validUntil = quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A';
                    const createdOn = quotation.createdOn ? new Date(quotation.createdOn).toLocaleDateString() : 'N/A';
                    const status = quotation.status || 'unknown';
                    const totalAmount = quotation.totalAmount ?? 0;
                    const isSelected = selectedQuotations.includes(quotation.quotationNumber);

                    return (
                      <Card
                        key={quotationKey}
                        elevation={isSelected ? 4 : 0}
                        sx={{
                          border: isSelected
                            ? `2px solid ${theme.palette.primary.main}`
                            : `1px solid ${theme.palette.divider}`,
                          borderRadius: 3,
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[4]
                          }
                        }}
                        onClick={() => handleQuotationToggle(quotation.quotationNumber)}
                      >
                        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleQuotationToggle(quotation.quotationNumber);
                              }}
                              sx={{
                                mt: -1,
                                '& .MuiSvgIcon-root': { fontSize: 28 }
                              }}
                            />

                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 700,
                                    color: isSelected ? 'primary.main' : 'text.primary'
                                  }}
                                >
                                  {quotation.quotationNumber}
                                </Typography>
                                <Chip
                                  label={status}
                                  size="small"
                                  sx={{
                                    bgcolor: getStatusColor(status),
                                    color: 'white',
                                    fontWeight: 700,
                                    textTransform: 'capitalize',
                                    fontSize: '0.75rem',
                                    height: 24
                                  }}
                                />
                              </Box>

                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  mb: 1,
                                  color: 'text.primary'
                                }}
                              >
                                {quotation.name}
                              </Typography>

                              {quotation.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    mb: 2,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {quotation.description}
                                </Typography>
                              )}

                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  pt: 2,
                                  borderTop: '1px solid',
                                  borderColor: 'divider'
                                }}
                              >
                                <Box sx={{ display: 'flex', gap: 3 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                                      Valid Until
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {validUntil}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                                      Created
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {createdOn}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Typography
                                  variant="h5"
                                  sx={{
                                    fontWeight: 700,
                                    color: 'success.main',
                                    letterSpacing: '-0.5px'
                                  }}
                                >
                                  {formatCurrency(totalAmount)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              ) : (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 3
                  }}
                >
                  <AttachFileIcon
                    sx={{
                      fontSize: 80,
                      color: 'grey.300',
                      mb: 2,
                      opacity: 0.5
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      mb: 1
                    }}
                  >
                    {searchTerm ? 'No Quotations Found' : 'No Available Quotations'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      mb: 3,
                      maxWidth: 400,
                      mx: 'auto'
                    }}
                  >
                    {searchTerm
                      ? 'No quotations match your search criteria. Try adjusting your search terms.'
                      : 'All quotations for this customer are already linked to this deal.'}
                  </Typography>
                  {searchTerm && (
                    <Button
                      variant="outlined"
                      onClick={() => setSearchTerm('')}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontWeight: 600
                      }}
                    >
                      Clear Search
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default LinkQuotationModal;

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    Box,
    Button,
    Grid,
    Chip,
    Paper,
    Stack
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle as ActivateIcon,
    Delete as DeleteIcon,
    Business as BusinessIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Language as LanguageIcon,
    LocationOn as LocationIcon,
    LocalShipping as ShippingIcon,
    Description as DescriptionIcon,
    Receipt as ReceiptIcon
} from '@mui/icons-material';

/**
 * DeleteConfirmDialog - Confirmation dialog for deleting draft lead
 */
const DeleteConfirmDialog = ({ open, onClose, onConfirm, loading }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete this draft lead? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

/**
 * DraftLeadDetailDialog - Dialog to display draft lead details
 * Shows all information from public form submission
 * Provides actions: Close, Delete, Activate (Convert to Active Lead)
 */
const DraftLeadDetailDialog = ({ open, lead, onClose, onDelete, onActivate, loading }) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    if (!lead) return null;

    const addresses = lead?.addresses || [];

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        onDelete(lead.id);
        setDeleteDialogOpen(false);
    };

    const handleActivate = () => {
        onActivate(lead.id);
    };

    const InfoRow = ({ label, value, icon: Icon, required = false }) => {
        // Show required fields even if empty
        if (!value && !required) return null;

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                {Icon && (
                    <Icon sx={{ fontSize: 18, color: value ? 'primary.main' : 'text.disabled', flexShrink: 0 }} />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        {label}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            wordBreak: 'break-word',
                            fontWeight: value ? 500 : 400,
                            color: value ? 'text.primary' : 'text.disabled',
                            fontStyle: value ? 'normal' : 'italic'
                        }}
                    >
                        {value || 'Not provided'}
                    </Typography>
                </Box>
            </Box>
        );
    };

    // Format address type for display
    const formatAddressType = (type) => {
        const typeMap = {
            'legal': 'Legal Address',
            'delivery': 'Delivery Address',
            'forwarder': 'Forwarder Details',
            'forwarder_agent_asia': "Forwarder's Agent in Asia"
        };
        return typeMap[type] || type;
    };

    // Get icon for address type
    const getAddressIcon = (type) => {
        const iconMap = {
            'legal': LocationIcon,
            'delivery': ShippingIcon,
            'forwarder': ShippingIcon,
            'forwarder_agent_asia': ShippingIcon
        };
        return iconMap[type] || LocationIcon;
    };

    const SectionCard = ({ title, icon: Icon, children }) => {
        return (
            <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {Icon && <Icon sx={{ color: 'primary.main', fontSize: 22 }} />}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {title}
                    </Typography>
                </Box>
                {children}
            </Paper>
        );
    };

    const AddressSection = ({ addressType, data }) => {
        if (!data) return null;

        const title = formatAddressType(addressType);
        const Icon = getAddressIcon(addressType);

        return (
            <SectionCard title={title} icon={Icon}>
                <Grid container spacing={0.5}>
                    <Grid item size={{ xs: 12, sm: 3 }}>
                        <InfoRow label="Company Name" value={data.companyName} icon={BusinessIcon} required />
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 3 }}>
                        <InfoRow label="Address" value={data.address} required />
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 3 }}>
                        <InfoRow label="Postcode" value={data.postcode} required/>
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 3 }}>
                        <InfoRow label="City" value={data.city} required/>
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 3 }}>
                        <InfoRow label="Country" value={data.country} required/>
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 3 }}>
                        <InfoRow label="Contact Person" value={data.contactPerson} required/>
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 3 }}>
                        <InfoRow label="Telephone" value={data.telephoneNo} icon={PhoneIcon} required/>
                    </Grid>
                    {data.portOfDestination && (
                        <Grid item size={{ xs: 12, sm: 3 }}>
                            <InfoRow label="Port of Destination" value={data.portOfDestination} icon={ShippingIcon} />
                        </Grid>
                    )}
                </Grid>
            </SectionCard>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 2,
                borderBottom: 1,
                borderColor: 'divider'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                        Draft Lead Details
                    </Typography>
                    <Chip label="Draft" size="small" color="warning" />
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Stack spacing={0.5}>
                    {/* Main Company Information */}
                    <SectionCard title="Company Information" icon={BusinessIcon}>
                        <Grid container spacing={1.5}>
                            <Grid item size={{ xs: 12, sm: 6 }} >
                                <InfoRow label="Company Name" value={lead.company} icon={BusinessIcon} required />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }} >
                                <InfoRow label="Email" value={lead.email} icon={EmailIcon} required />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }} >
                                <InfoRow label="Telephone" value={lead.telephoneNo} icon={PhoneIcon} required />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }} >
                                <InfoRow label="Country" value={lead.country} icon={LocationIcon} required />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }} >
                                <InfoRow label="Website" value={lead.website} icon={LanguageIcon} required/>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }} >
                                <InfoRow label="VAT Number" value={lead.vatNo} icon={ReceiptIcon} required/>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }} >
                                <InfoRow label="Contact Person" value={lead.contactPerson} required/>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }} >
                                <InfoRow label="Invoice Email" value={lead.invoiceEmail} icon={EmailIcon} required/>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }} >
                                <InfoRow label="Payment Terms" value={lead.paymentTerms} required/>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6 }} >
                                <InfoRow label="Documents Needed" value={lead.documentsNeeded} icon={DescriptionIcon} />
                            </Grid>
                        </Grid>
                    </SectionCard>

                    {/* Delivery Address */}
                    {addresses &&
                        addresses.map(address =>

                            <AddressSection
                                title={address.addressType}
                                data={address}
                            // icon={addresses}
                            />
                        )
                    }

                    {/* Submission Info */}
                    <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                            Submitted: {new Date(lead.createdOn).toLocaleString()}
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    disabled={loading}
                    size="large"
                >
                    Close
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button
                    onClick={handleDeleteClick}
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    disabled={loading}
                    size="large"
                >
                    Delete
                </Button>
                <Button
                    onClick={handleActivate}
                    color="success"
                    variant="contained"
                    startIcon={<ActivateIcon />}
                    disabled={loading}
                    size="large"
                >
                    Activate Lead
                </Button>
            </DialogActions>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                loading={loading}
            />
        </Dialog>
    );
};

export default DraftLeadDetailDialog;
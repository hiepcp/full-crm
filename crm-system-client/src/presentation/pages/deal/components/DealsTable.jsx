import React, { useState } from 'react';
import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { getStageColor, formatCurrency, formatDate } from '../utils/dealUtils';
import { createActivity } from '@presentation/data';
import { AddActivityForm } from '@presentation/components/common/ActivityForms';

const DealsTable = ({ deals }) => {
  const navigate = useNavigate();
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const handleCreateActivity = (deal) => {
    setSelectedDeal(deal);
    setIsCreateActivityModalOpen(true);
  };

  const handleActivitySubmit = async (newActivity) => {
    // Save activity to API
    try {
      const savedActivity = await createActivity(newActivity);
      console.log('New activity created:', savedActivity);

      // Show success message or update UI as needed
      setIsCreateActivityModalOpen(false);
      setSelectedDeal(null);
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  return (
    <Fragment>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
                Deal Name
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
                Customer
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
                Stage
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
                Expected Revenue
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
                Actual Revenue
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
                Close Date
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
                Summary
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
                Created
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No deals found matching the selected filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow
                  key={deal.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/deals/${deal.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {deal.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {deal.customer ? (
                      <Typography
                        variant="body2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${deal.customerId}`);
                        }}
                        sx={{
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {deal.customer.name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={deal.stage}
                      color={getStageColor(deal.stage)}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                      {formatCurrency(deal.expectedRevenue)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.dark' }}>
                      {formatCurrency(deal.actualRevenue || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(deal.closeDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {deal.description || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(deal.createdOn)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Create Activity">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateActivity(deal);
                        }}
                        sx={{
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          fontSize: '0.75rem',
                          textTransform: 'none'
                        }}
                      >
                        Activity
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Activity Dialog */}
      <Dialog
        open={isCreateActivityModalOpen}
        onClose={() => {
          setIsCreateActivityModalOpen(false);
          setSelectedDeal(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
            Create Activity
          </Typography>
          <IconButton
            onClick={() => {
              setIsCreateActivityModalOpen(false);
              setSelectedDeal(null);
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <AddActivityForm
            relationType="deal"
            relationId={selectedDeal?.id}
            dealName={selectedDeal?.name}
            defaultAssignee="sales@crm.com"
            onCancel={() => {
              setIsCreateActivityModalOpen(false);
              setSelectedDeal(null);
            }}
            onSubmit={handleActivitySubmit}
          />
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};

export default DealsTable;

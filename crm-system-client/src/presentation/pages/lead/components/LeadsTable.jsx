import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Typography,
  Box,
  Button,
  Tooltip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { getStatusColor, getSourceColor, getScoreColor, formatDate } from '../utils/leadUtils';

const LeadsTable = ({ leads, onCreateActivity }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Id
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Company
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Email
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Telephone No
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Source
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Score
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
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  No leads found matching the selected filters.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow
                key={lead.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/leads/${lead.id}`)}
              >
                <TableCell>
                  <Typography variant="body2" sx={{
                    fontWeight: 'medium',
                    color: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'secondary.main',
                      textDecoration: 'underline'
                    }
                  }}>
                    {`Lead_${lead.id}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  {lead.customerId ? (
                    <>
                      <Typography
                        variant="body2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${lead.customerId}`);
                        }}
                        sx={{
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': {
                            color: 'secondary.main',
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {lead.company}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{lead.website}</Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">{lead.company}</Typography>
                      <Typography variant="caption" color="text.secondary">{lead.website}</Typography>
                    </>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{lead.email}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{lead.telephoneNo}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={lead.source}
                    color={getSourceColor(lead.source)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={lead.status}
                    color={getStatusColor(lead.status)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'medium',
                        color: theme.palette[getScoreColor(lead.score)].main
                      }}
                    >
                      {lead.score}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={lead.score}
                      sx={{
                        width: 64,
                        height: 8,
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette[getScoreColor(lead.score)].main,
                        },
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(lead.createdOn)}
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
                        onCreateActivity(lead);
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
  );
};

export default LeadsTable;

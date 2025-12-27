import React from 'react';
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
  Typography
} from '@mui/material';
import { getTypeColor, formatDate } from '../utils/customerUtils';

const CustomersTable = ({ customers }) => {
  const navigate = useNavigate();

  const handleRowClick = (customerId) => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Name
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Type
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Email
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Phone
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Website
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Created
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  No customers found matching the selected filters.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow 
                key={customer.id} 
                hover 
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(customer.id)}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {customer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{customer.domain}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={customer.type}
                    color={getTypeColor(customer.type)}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{customer.email}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{customer.phone}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#0176d3' }}>
                    {customer.website}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(customer.createdOn)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomersTable;



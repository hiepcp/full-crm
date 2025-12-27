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
  Typography,
  Box
} from '@mui/material';
import { getStatusColor, getPriorityColor, getActivityTypeIcon, formatDate } from '../utils/activityUtils';

const ActivitiesTable = ({ activities }) => {
  const navigate = useNavigate();

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Type
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Subject
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Related To
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Priority
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Due Date
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.75rem' }}>
              Created
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  No activities found matching the selected filters.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            activities.map((activity) => (
              <TableRow
                key={activity.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/activities/${activity.id}`)}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '1.25rem' }}>{getActivityTypeIcon(activity.sourceFrom)}</span>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {activity.subject}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activity.body?.substring(0, 50)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {activity.relationType} #{activity.relationId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={activity.status}
                    color={getStatusColor(activity.status)}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={activity.priority}
                    color={getPriorityColor(activity.priority)}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {activity.dueAt ? formatDate(activity.dueAt) : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(activity.createdOn)}
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

export default ActivitiesTable;


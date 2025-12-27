import { Button, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function DocumentTypeActionCell({ row, onEdit, onDelete, canEdit, canDelete }) {
  return (
    <>
      {canEdit && (
        <IconButton color="primary" size="small" onClick={() => onEdit(row)}>
          <EditIcon fontSize="small" />
        </IconButton>
      )}
      {canDelete && (
        <IconButton color="error" size="small" onClick={() => onDelete(row)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </>
  );
}

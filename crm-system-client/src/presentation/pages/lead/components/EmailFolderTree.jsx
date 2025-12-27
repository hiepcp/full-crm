import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { SimpleTreeView  } from '@mui/x-tree-view';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  Folder as FolderIcon,
  Inbox as InboxIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Drafts as DraftsIcon,
  Archive as ArchiveIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

const getFolderIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('inbox')) return <InboxIcon fontSize="small" />;
  if (n.includes('sent')) return <SendIcon fontSize="small" />;
  if (n.includes('draft')) return <DraftsIcon fontSize="small" />;
  if (n.includes('delete') || n.includes('trash')) return <DeleteIcon fontSize="small" />;
  if (n.includes('archive')) return <ArchiveIcon fontSize="small" />;
  return <FolderIcon fontSize="small" />;
};

const EmailFolderTree = ({
  folders = [],
  selectedFolderId,
  onSelect
}) => {
  const renderNode = (folder) => {
    const hasChildren = (folder.childFolders || []).length > 0;
    const label = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getFolderIcon(folder.displayName)}
        <Typography variant="body2" sx={{ flex: 1 }}>
          {folder.displayName}
        </Typography>
        {!!folder.unreadItemCount && (
          <Chip label={folder.unreadItemCount} size="small" color="primary" variant="filled" sx={{ height: 18, fontSize: '0.7rem' }} />
        )}
      </Box>
    );

    return (
      <TreeItem key={folder.id} itemId={folder.id} label={label} onClick={() => onSelect && onSelect(folder)}>
        {hasChildren && folder.childFolders.map(child => renderNode(child))}
      </TreeItem>
    );
  };

  return (
    <SimpleTreeView
      slots={{
        collapseIcon: ExpandMoreIcon,
        expandIcon: ChevronRightIcon,
      }}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        p: 1
      }}
    >
      {folders.map(f => renderNode(f))}
    </SimpleTreeView >
  );
};

export default EmailFolderTree;

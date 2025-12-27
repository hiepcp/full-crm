import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  Description as DescriptionIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

const InstantDocsSection = ({
  title = 'Instant Docs',
  description = 'Effortlessly create personalized invoices, proposals, and contracts from your CRM data with just one click!',
  learnMoreText = 'Learn more',
  onAddClick,
  onLearnMoreClick,
  initialExpanded = true,
  icon: IconComponent = DescriptionIcon,
  sx = {}
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{ mb: 2, ...sx }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: expanded ? 3 : 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              flex: 1,
              '&:hover': { opacity: 0.7 }
            }}
            onClick={handleToggleExpand}
          >
            <IconButton
              size="small"
              sx={{ p: 0.5, pointerEvents: 'none' }}
            >
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {title}
            </Typography>
          </Box>
          <IconButton
            size="small"
            sx={{ border: `1px solid #e0e0e0`, borderRadius: '4px' }}
            onClick={onAddClick}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <IconComponent sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, px: 2 }}>
              {description}
            </Typography>
            <Button
              size="small"
              sx={{ color: 'primary.main', textTransform: 'none' }}
              onClick={onLearnMoreClick}
            >
              {learnMoreText}
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default InstantDocsSection;
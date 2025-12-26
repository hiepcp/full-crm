import React from 'react';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';

// project import
import MainCard from '@presentation/components/MainCard';

export default function Breadcrumbs({ navigation, ...others }) {

  const { id } = useParams();
  const location = useLocation();
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
    
  // Recursively search for the matching menu item and build the breadcrumb trail
  const findBreadcrumbTrail = (items, currentPath, trail = []) => {
    for (const item of items || []) {
      // Collapse or group: search children
      if ((item.type === 'collapse' || item.type === 'group') && item.children) {
        // If this collapse has a url and matches, return trail + this
        if (item.url && item.url === currentPath) {
          return [...trail, { title: item.title, type: item.type, url: item.url }];
        }
        // Otherwise, search children
        const childTrail = findBreadcrumbTrail(item.children, currentPath, [...trail, { title: item.title, type: item.type, url: item.url }]);
        if (childTrail) return childTrail;
      }
      // Item: check url match
      if (item.type === 'item' && item.url === currentPath) {
        return [...trail, { title: item.title, type: item.type, url: item.url }];
      }
      // Detail page: check for pattern match (e.g. /xxx/:id)
      if (item.type === 'item' && item.url && item.url.includes('/:id')) {
        // Convert to regex
        const pattern = new RegExp('^' + item.url.replace('/:id', '/[^/]+') + '$');
        if (pattern.test(currentPath)) {
          return [...trail, { title: item.title, type: item.type, url: currentPath }];
        }
      }
    }
    return null;
  };

  // Build breadcrumb path for current location
  const buildBreadcrumbTrail = () => {
    const currentPath = location.pathname;
    if (currentPath === '/') return;

    // Try to find a breadcrumb trail recursively
    let trail = null;
    for (const group of navigation?.items || []) {
      trail = findBreadcrumbTrail([group], currentPath);
      if (trail) break;
    }

    // If not found, try to match detail page (e.g. /xxx/123)
    if (!trail) {
      // Try to find a parent path that matches a collapse/item
      const pathParts = currentPath.split('/');
      if (pathParts.length > 2) {
        const parentUrl = '/' + pathParts[1];
        for (const group of navigation?.items || []) {
          const parentTrail = findBreadcrumbTrail([group], parentUrl);
          if (parentTrail) {
            // Add id as last breadcrumb
            trail = [
              ...parentTrail,
              { title: pathParts[2], type: 'id', url: '' }
            ];
            break;
          }
        }
      }
    }

    if (trail && trail.length > 0) {
      setBreadcrumbItems(trail);
    }
  };

  useEffect(() => {
    buildBreadcrumbTrail();
  }, [location.pathname, navigation, id]);

  if (location.pathname === '/') {
    return null;
  }

  // Generate breadcrumb content
  let breadcrumbContent = <Typography />;

  if (breadcrumbItems.length > 0) {
    breadcrumbContent = (
      <MainCard border={false} sx={{ mb: 1, bgcolor: 'transparent' }} {...others} content={false}>
        <Grid container direction="column" justifyContent="flex-start" alignItems="flex-start" spacing={1}>
          <Grid item>
            <MuiBreadcrumbs aria-label="breadcrumb">
              <Typography component={Link} to="/" color="textSecondary" variant="h6" sx={{ textDecoration: 'none' }}>
                Home
              </Typography>
              
              {breadcrumbItems.map((crumb, index) => {
                // Skip rendering items without titles
                if (!crumb.title) return null;
                
                // For the last item or items without URLs
                if (index === breadcrumbItems.length - 1 || !crumb.url) {
                  return (
                    <Typography key={index} color="textPrimary" variant="subtitle1">
                      {crumb.title} {crumb.level}
                    </Typography>
                  );
                }
                
                // For navigable breadcrumb items
                return (
                  <Typography 
                    key={index} 
                    component={Link} 
                    to={crumb.url} 
                    color="textSecondary" 
                    variant="h6" 
                    sx={{ textDecoration: 'none' }}
                  >
                    {crumb.title}
                  </Typography>
                );
              })}
            </MuiBreadcrumbs>
          </Grid>
          {/* {title && item && (
            <Grid item sx={{ mt: 2 }}>
              <Typography variant="h5">{item.title}</Typography>
            </Grid>
          )} */}
        </Grid>
      </MainCard>
    );
  }

  return breadcrumbContent;
}

Breadcrumbs.propTypes = {
  navigation: PropTypes.object,
  card: PropTypes.bool,
  custom: PropTypes.bool,
  divider: PropTypes.bool,
  heading: PropTypes.string,
  icon: PropTypes.bool,
  icons: PropTypes.bool,
  links: PropTypes.array,
  maxItems: PropTypes.number,
  rightAlign: PropTypes.bool,
  separator: PropTypes.any,
  title: PropTypes.bool,
  titleBottom: PropTypes.bool,
  sx: PropTypes.any,
  others: PropTypes.any
};

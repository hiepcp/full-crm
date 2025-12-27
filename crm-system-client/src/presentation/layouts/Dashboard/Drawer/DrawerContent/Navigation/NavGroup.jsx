import React from 'react';
import PropTypes from 'prop-types';
// material-ui
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import NavItem from './NavItem';
import NavCollapse from './NavCollapse';
//import { useRoleProfile } from '@app/contexts/RoleProfileContext';
//import { useGetMenuMaster } from 'api/menu';
// Clean Arch imports
import LocalMenuRepository from "@infrastructure/repositories/LocalMenuRepository";
import GetMenuMasterUseCase from "@application/usecases/menu/GetMenuMasterUseCase";

export default function NavGroup({ item }) {
  const repo = new LocalMenuRepository();
  const getMenuMaster = new GetMenuMasterUseCase(repo);

  const { menuMaster } = getMenuMaster.execute();
  //const { canAccessMenu } = useRoleProfile();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  console.log('NavGroup: rendering group:', item.id, 'children count:', item.children?.length);

  // Do not gate entire group by its id; render if it has any permitted children

  const navCollapse = item.children?.map((menuItem, index) => {
    // Skip items that should be hidden in menu or user doesn't have permission
    // if (menuItem.hideInMenu || !canAccessMenu(menuItem.id)) {
    //   console.log('NavGroup: skipping menuItem:', menuItem.id, 'hideInMenu:', menuItem.hideInMenu, 'canAccess:', canAccessMenu(menuItem.id));
    //   return null;
    // }    
    // console.log('NavGroup: rendering menuItem:', menuItem.id, 'type:', menuItem.type);
    
    switch (menuItem.type) {
      case 'collapse':
        return <NavCollapse key={menuItem.id || `collapse-${index}`} item={menuItem} level={0} />;
      case 'item':
        return <NavItem key={menuItem.id || `item-${index}`} item={menuItem} level={0} />;
      default:
        return (
          <Typography key={menuItem.id || `error-${index}`} variant="h6" color="error" align="center">
            Fix - Group Collapse or Items
          </Typography>
        );
    }
  }).filter(Boolean); // Filter out null items

  // If all children are filtered out, don't render the group
  if (!navCollapse || navCollapse.length === 0) {
    console.log('NavGroup: no children to render for group:', item.id);
    return null;
  }

  console.log('NavGroup: rendering group with', navCollapse.length, 'children');

  return (
    <List
      key={item.id || 'nav-group'}
      subheader={
        item.title &&
        drawerOpen && (
          <Box sx={{ pl: 3, mb: 1.5 }}>
            {/* <Typography variant="subtitle2" color="grey.500">
              {item.title}
            </Typography> */}
          </Box>
        )
      }
      sx={{ mb: drawerOpen ? 1.5 : 0, py: 0, zIndex: 0 }}
    >
      {navCollapse}
    </List>
  );
}

NavGroup.propTypes = {
  item: PropTypes.object.isRequired
};

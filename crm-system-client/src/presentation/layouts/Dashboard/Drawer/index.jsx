import React from 'react';
import PropTypes from 'prop-types';
import { useMemo, useState, useEffect } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';
import Drawer from '@mui/material/Drawer';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Box from '@mui/material/Box';

// project import
import DrawerHeader from './DrawerHeader';
import DrawerContent from './DrawerContent';
import MiniDrawerStyled from './MiniDrawerStyled';

import { drawerWidth } from '@src/config';
// Clean Arch imports
import LocalMenuRepository from "@infrastructure/repositories/LocalMenuRepository";
import GetMenuMasterUseCase from "@application/usecases/menu/GetMenuMasterUseCase";
import UpdateDrawerStateUseCase from "@application/usecases/menu/UpdateDrawerStateUseCase";

// ==============================|| MAIN LAYOUT - DRAWER ||============================== //

export default function MainDrawer({ window }) {
  const repo = new LocalMenuRepository();
  const getMenuMaster = new GetMenuMasterUseCase(repo);
  const updateDrawer = new UpdateDrawerStateUseCase(repo);

  const { menuMaster } = getMenuMaster.execute();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const [matchDownMD, setMatchDownMD] = useState(false);

  const mediaQuery = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  // Update state when media query result changes
  useEffect(() => {
    setMatchDownMD(mediaQuery);
  }, [mediaQuery]);

  // Detect iOS for SwipeableDrawer optimization
  const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const container = window !== undefined ? () => window().document.body : undefined;

  const drawerContent = useMemo(() => <DrawerContent />, []);
  const drawerHeader = useMemo(() => <DrawerHeader open={!!drawerOpen} />, [drawerOpen]);

  // Handlers for SwipeableDrawer
  const handleDrawerClose = () => updateDrawer.execute(false);
  const handleDrawerOpen = () => updateDrawer.execute(true);

  return (
    <Box component="nav" sx={{ flexShrink: { md: 0 }, zIndex: 1200 }} aria-label="mailbox folders">
      {!matchDownMD ? (
        <MiniDrawerStyled variant="permanent" open={drawerOpen}>
          {drawerHeader}
          {drawerContent}
        </MiniDrawerStyled>
      ) : (
        <SwipeableDrawer
          container={container}
          open={drawerOpen}
          onClose={handleDrawerClose}
          onOpen={handleDrawerOpen}
          disableBackdropTransition={!iOS}
          disableDiscovery={iOS}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderRightColor: 'divider',
              backgroundImage: 'none',
              boxShadow: 'inherit',
              backgroundColor: '#586a68'
            },
          }}
        >
          {drawerHeader}
          {drawerContent}
        </SwipeableDrawer>
      )}
    </Box>
  );
}

MainDrawer.propTypes = { window: PropTypes.func };

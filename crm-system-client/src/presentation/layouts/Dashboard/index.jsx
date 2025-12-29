import React from 'react';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useRoleProfile } from '@app/contexts/RoleProfileContext';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

// project import
import Drawer from './Drawer';
import Header from './Header';
import Loader from '@presentation/components/Loader';
import Breadcrumbs from '@presentation/components/@extended/Breadcrumbs';
import BottomNav from '@presentation/components/mobile/BottomNav';
import QuickActionFAB from '@presentation/components/mobile/QuickActionFAB';
import { drawerWidth } from '@src/config';

//import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
// Clean Arch imports
import LocalMenuRepository from "@infrastructure/repositories/LocalMenuRepository";
import GetMenuMasterUseCase from "@application/usecases/menu/GetMenuMasterUseCase";
import UpdateDrawerStateUseCase from "@application/usecases/menu/UpdateDrawerStateUseCase";

// ==============================|| MAIN LAYOUT ||============================== //

export default function DashboardLayout() {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const repo = new LocalMenuRepository();
  const getMenuMaster = new GetMenuMasterUseCase(repo);
  const updateDrawer = new UpdateDrawerStateUseCase(repo);

  const { menuMasterLoading, menuMaster } = getMenuMaster.execute();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened;
  const downXL = useMediaQuery(theme.breakpoints.down('xl'));
  const { loading: roleProfileLoading } = useRoleProfile();

  useEffect(() => {
    updateDrawer.execute(!downXL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downXL]);

  // Quick action handlers
  const handleLogCall = () => {
    // TODO: Implement log call functionality
  };

  const handleCreateActivity = () => {
    // TODO: Implement create activity functionality
  };

  if (menuMasterLoading || roleProfileLoading) return <Loader />;

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Header />
      <Drawer />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 1, sm: 2 },
          width: 'auto',
          minWidth: 0,
          maxWidth: '100%',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
          }),
          marginLeft: {
            xs: 0,
            lg: drawerOpen ? 0 : 0
          },
          overflow: 'auto',
          // Add padding bottom on mobile to account for bottom nav
          pb: { xs: '80px', lg: 2 }
        }}
      >
        <Toolbar />
        {/* TODO: Add breadcrumbs */}
        {/* <Breadcrumbs navigation={navigation} title /> */}
        <Outlet />
      </Box>
      <BottomNav />
      <QuickActionFAB
        onLogCall={handleLogCall}
        onCreateActivity={handleCreateActivity}
      />
    </Box>
  );
}

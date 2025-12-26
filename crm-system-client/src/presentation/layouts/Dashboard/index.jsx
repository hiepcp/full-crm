import React from 'react';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useRoleProfile } from '@app/contexts/RoleProfileContext';

// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

// project import
import Drawer from './Drawer';
import Header from './Header';
import Loader from '@presentation/components/Loader';
import Breadcrumbs from '@presentation/components/@extended/Breadcrumbs';

//import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
// Clean Arch imports
import LocalMenuRepository from "@infrastructure/repositories/LocalMenuRepository";
import GetMenuMasterUseCase from "@application/usecases/menu/GetMenuMasterUseCase";
import UpdateDrawerStateUseCase from "@application/usecases/menu/UpdateDrawerStateUseCase";

// ==============================|| MAIN LAYOUT ||============================== //

export default function DashboardLayout() {
   const repo = new LocalMenuRepository();
   const getMenuMaster = new GetMenuMasterUseCase(repo);
   const updateDrawer = new UpdateDrawerStateUseCase(repo);

  const { menuMasterLoading } = getMenuMaster.execute();
  const downXL = useMediaQuery((theme) => theme.breakpoints.down('xl'));
  const { loading: roleProfileLoading } = useRoleProfile();

  useEffect(() => {
    updateDrawer.execute(!downXL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downXL]);

  if (menuMasterLoading || roleProfileLoading) return <Loader />;

  return (
    <Box sx={{ display: 'flex', width: '100%', height: 'calc(100vh - 70px)' }}>
      <Header />
      <Drawer />
      <Box component="main" sx={{ width: 'calc(100% - 260px)', flexGrow: 1, p: 1, height: '100%' }}>
        <Toolbar />
        {/* TODO: Add breadcrumbs */}
        {/* <Breadcrumbs navigation={navigation} title /> */}
        <Outlet />
      </Box>
    </Box>
  );
}

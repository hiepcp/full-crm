import React from 'react';
import { useMemo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';

// project import
import AppBarStyled from './AppBarStyled';
import HeaderContent from './HeaderContent';

//import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
// Clean Arch imports
import LocalMenuRepository from "@infrastructure/repositories/LocalMenuRepository";
import GetMenuMasterUseCase from "@application/usecases/menu/GetMenuMasterUseCase";
import UpdateDrawerStateUseCase from "@application/usecases/menu/UpdateDrawerStateUseCase";

// assets
import { Menu, MenuOutlined } from '@mui/icons-material';


// ==============================|| MAIN LAYOUT - HEADER ||============================== //

export default function Header() {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const repo = new LocalMenuRepository();
    const getMenuMaster = new GetMenuMasterUseCase(repo);
    const updateDrawerOpen = new UpdateDrawerStateUseCase(repo);

  const { menuMaster } = getMenuMaster.execute();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  // header content
  const headerContent = useMemo(() => <HeaderContent />, []);

  const iconBackColor = 'grey.100';
  const iconBackColorOpen = 'grey.200';

  // common header
  const mainHeader = (
    <Toolbar>
      <IconButton
        disableRipple
        aria-label="open drawer"
        onClick={() => updateDrawerOpen.execute(!drawerOpen)}
        edge="start"
        color="secondary"
        variant="light"
        sx={{
          color: 'text.primary',
          bgcolor: drawerOpen ? iconBackColorOpen : iconBackColor,
          ml: { xs: 0, lg: -2 },
          // Ensure minimum touch target size of 44x44px on mobile
          minWidth: { xs: 44, sm: 44 },
          minHeight: { xs: 44, sm: 44 },
          width: { xs: 44, sm: 40 },
          height: { xs: 44, sm: 40 }
        }}
      >
        {!drawerOpen ? <Menu /> : <MenuOutlined />}
      </IconButton>
      {headerContent}
    </Toolbar>
  );

  // app-bar params
  const appBar = {
    position: 'fixed',
    color: 'inherit',
    elevation: 0,
    sx: {
      borderBottom: `1px solid ${theme.palette.divider}`
      // boxShadow: theme.customShadows.z1
    }
  };

  return (
    <>
      {!downLG ? (
        <AppBarStyled open={!!drawerOpen} {...appBar}>
          {mainHeader}
        </AppBarStyled>
      ) : (
        <AppBar {...appBar}>{mainHeader}</AppBar>
      )}
    </>
  );
}

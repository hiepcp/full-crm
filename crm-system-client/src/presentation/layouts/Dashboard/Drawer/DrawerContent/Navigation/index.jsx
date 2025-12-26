import React, { useEffect, useMemo, useState } from "react";
// material-ui
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
 
import Loader from "@presentation/components/Loader";
// project import
import NavCollapse from './NavCollapse';
 
// role context
import { useRoleProfile } from "@app/contexts/RoleProfileContext";

// menu (clean arch)
import RestMenuRepository from "@infrastructure/repositories/RestMenuRepository";
import GetMenuOfUserUseCase from "@application/usecases/menu/GetMenuOfUserUseCase";

import config from '@src/config';
import { tokenHelper } from '@utils/tokenHelper';
// ==============================|| DRAWER CONTENT - NAVIGATION ||============================== //
 

 

export default function Navigation() {
  const { canAccessMenu, roleProfile, loading } = useRoleProfile();
  const [items, setItems] = useState([]);
  const menuRepo = useMemo(() => new RestMenuRepository(), []);
  const getMenuOfUser = useMemo(() => new GetMenuOfUserUseCase(menuRepo), [menuRepo]);


  useEffect(() => {
    if (loading || !roleProfile) return;
    const email = tokenHelper.getEmailFromToken();
    if (!email) return;
    Promise.all([getMenuOfUser.execute(config.API_APP_CODE, email)]).then(([menu]) => {
      setItems(menu.data);
      // Lưu menu xuống localStorage để các page khác dùng
      try {
        localStorage.setItem('userMenu', JSON.stringify(menu.data));
      } catch {
        // ignore
      }
    });
  }, [roleProfile, getMenuOfUser, loading]);

  const dynamicMenu = useMemo(() => {
    const buildMenuTree = (allItems, parentId = null) => {
      return allItems
        .filter((mi) => mi.parentId === parentId)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((mi) => {
          const children = buildMenuTree(allItems, mi.id);
          const node = {
            id: mi.code,
            title: mi.name,
            type: children.length > 0 ? "collapse" : "item",
            url: mi.url,
            icon: mi.icon,
            hideInMenu: mi.hideInMenu,
            breadcrumbs: true,
            children: children.length > 0 ? children : undefined,
          };
          return canAccessMenu(node.id) && !node.hideInMenu ? node : null;
        })
        .filter(Boolean);
    };
    return buildMenuTree(items);
  }, [items, canAccessMenu]);

  if (loading || !roleProfile) {
    return <Loader />;
  }

  const navGroups = dynamicMenu.map((item) => {
    if (item.type === "collapse") {
      return <NavCollapse key={item.id} item={item} level={0} />;
    }
    return (
      <Typography key={item.id} variant="h6" color="error" align="center">
        Fix - Navigation
      </Typography>
    );
  });

  return <Box sx={{ pt: 2 }}>{navGroups}</Box>;
}
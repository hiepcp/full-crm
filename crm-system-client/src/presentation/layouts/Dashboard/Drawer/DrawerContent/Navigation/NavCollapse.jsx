import React from "react";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// material-ui
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

// project import
import NavItem from "./NavItem";
//import { useGetMenuMaster } from 'api/menu';
import LocalMenuRepository from "@infrastructure/repositories/LocalMenuRepository";
import GetMenuMasterUseCase from "@application/usecases/menu/GetMenuMasterUseCase";
//import { useRoleProfile } from '@app/contexts/RoleProfileContext';

export default function NavCollapse({ item, level }) {
  const repo = new LocalMenuRepository();
  const getMenuMaster = new GetMenuMasterUseCase(repo);

  const { menuMaster } = getMenuMaster.execute();
  //const { canAccessMenu } = useRoleProfile();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const [open, setOpen] = useState(true);
  const location = useLocation();

  // Do not gate collapse by its own id; children will be filtered by permissions

  let itemIcon = false;
  if (item.icon) {
    if (typeof item.icon === "string") {
      itemIcon = (
        <i
          className="material-icons"
          style={{ fontSize: drawerOpen ? "1rem" : "1.25rem", lineHeight: 1 }}
        >
          {item.icon}
        </i>
      );
    } else {
      const Icon = item.icon;
      itemIcon = <Icon style={{ fontSize: drawerOpen ? "1rem" : "1.25rem" }} />;
    }
  }

  // Check if this menu has an active child
  const checkActiveChild = (item) => {
    if (!item.children) return false;

    return (
      item.children.some((child) => {
        if (child.type === "item") {
          return !!child.url && location.pathname.includes(child.url);
        }
        if (child.type === "collapse") {
          return checkActiveChild(child);
        }
        return false;
      }) ||
      (item.url && location.pathname.includes(item.url))
    );
  };

  const isActive = checkActiveChild(item);

  // Initially open the collapse if it has an active child
  useEffect(() => {
    if (isActive) {
      setOpen(true);
    }
  }, [isActive]);

  const handleClick = () => {
    setOpen(!open);
  };

  const textColor = "grey.A100";
  const iconSelectedColor = "grey.A100";

  const items = item.children
    ?.map((menu, index) => {
      // Skip items that should be hidden in menu or user doesn't have permission
      // if (menu.hideInMenu && !canAccessMenu(menu.id)) {
      //   console.log('NavCollapse: skipping menu:', menu.id, 'hideInMenu:', menu.hideInMenu, 'canAccess:', canAccessMenu(menu.id));
      //   return null;
      // }
      
      switch (menu.type) {        
        case "collapse":
          return (
            <NavCollapse
              key={menu.id || `collapse-${index}`}
              item={menu}
              level={level + 1}
            />
          );
        case "item":
          return (
            <NavItem
              key={menu.id || `item-${index}`}
              item={menu}
              level={level + 1}
            />
          );
        default:
          return (
            <Typography
              key={menu.id || `error-${index}`}
              variant="h6"
              color="error"
              align="center"
            >
              Menu Item Error
            </Typography>
          );
      }
    })
    .filter(Boolean); // Filter out null items

  // If all children are filtered out, don't render the collapse
  if (!items || items.length === 0) {
    return null;
  }

  // Create button component based on whether we have a URL
  const CollapseButtonComponent = item.url ? Link : "div";
  const buttonProps = item.url ? { to: item.url, component: Link } : {};

  return (
    <>
      <ListItemButton
        {...buttonProps}
        sx={{
          mb: 0.5,
          // Custom: Level 1 (menu con) luôn là 30px, các level khác tăng dần
          pl: drawerOpen
            ? `${level === 1 ? 30 : 16 + level * 24}px`
            : 1.5,
          py: !drawerOpen && level === 1 ? 1.25 : 1,
          ...(drawerOpen && {
            "&:hover": { bgcolor: "#6c7a79" },
            "&.Mui-selected": {
              bgcolor: "#4e605e",
              color: iconSelectedColor,
              "&:hover": { color: iconSelectedColor, bgcolor: "#6c7a79" },
            },
          }),
          ...(!drawerOpen && {
            "&:hover": { bgcolor: "transparent" },
            "&.Mui-selected": {
              bgcolor: "transparent",
              "&:hover": { bgcolor: "transparent" },
            },
          }),
        }}
        selected={isActive}
        onClick={handleClick}
      >
        {itemIcon && (
          <ListItemIcon
            sx={{
              minWidth: 28,
              color: isActive ? iconSelectedColor : textColor,
              ...(level === 0 && { fontSize: "1.25rem" }), // 🔥 root icon to hơn
              ...(!drawerOpen && {
                borderRadius: 1.5,
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                "&:hover": { bgcolor: "grey.lighter" },
              }),
              ...(!drawerOpen &&
                isActive && {
                  bgcolor: "primary.lighter",
                  "&:hover": { bgcolor: "primary.lighter" },
                }),
            }}
          >
            {itemIcon}
          </ListItemIcon>
        )}
        {(drawerOpen || (!drawerOpen && level === 0)) && (
          <ListItemText
            primary={
              <Typography
                variant={level === 0 ? "subtitle1" : "body1"} // 🔥 root chữ đậm hơn
                sx={{
                  fontWeight: level === 0 ? 600 : 400,
                  color: isActive ? iconSelectedColor : textColor,
                }}
              >
                {item.title}
              </Typography>
            }
          />
        )}
        {open ? (
          <ExpandLess sx={{ color: "white" }} />
        ) : (
          <ExpandMore sx={{ color: "white" }} />
        )}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {items}
        </List>
      </Collapse>
    </>
  );
}

NavCollapse.propTypes = {
  item: PropTypes.object.isRequired,
  level: PropTypes.number.isRequired,
};

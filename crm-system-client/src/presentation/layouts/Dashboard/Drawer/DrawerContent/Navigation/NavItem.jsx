import React from "react";
import PropTypes from "prop-types";
import { forwardRef, useEffect } from "react";
import { Link, useLocation, matchPath } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

// project import
import { useRoleProfile } from "@app/contexts/RoleProfileContext";
//import { handlerActiveItem, useGetMenuMaster } from 'api/menu';
// Clean Arch imports
import LocalMenuRepository from "@infrastructure/repositories/LocalMenuRepository";
import GetMenuMasterUseCase from "@application/usecases/menu/GetMenuMasterUseCase";
import SetActiveMenuItemUseCase from "@application/usecases/menu/SetActiveMenuItemUseCase";

export default function NavItem({ item, level }) {
  const theme = useTheme();

  const repo = new LocalMenuRepository();
  const getMenuMaster = new GetMenuMasterUseCase(repo);
  const setActiveMenuItem = new SetActiveMenuItemUseCase(repo);

  const { canAccessMenu } = useRoleProfile();

  // If user doesn't have permission to access this menu item, don't render it
  if (item.hideInMenu && !canAccessMenu(item.id)) {
    return null;
  }

  const { menuMaster } = getMenuMaster.execute();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const openItem = menuMaster.openedItem;

  let itemTarget = "_self";
  if (item.target) {
    itemTarget = "_blank";
  }
  let listItemProps = {};
  if (item?.external && item?.url) {
    listItemProps = { component: "a", href: item.url, target: itemTarget };
  } else if (item?.url) {
    listItemProps = {
      component: forwardRef((props, ref) => (
        <Link ref={ref} {...props} to={item.url} target={itemTarget} />
      )),
    };
  } else {
    listItemProps = { component: "div" };
  }

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

  const { pathname } = useLocation();
  const isSelected =
    (!!item.url && !!matchPath({ path: item.url, end: false }, pathname)) ||
    openItem === item.id;

  // active menu item on page load
  useEffect(() => {
    if (pathname === item.url) setActiveMenuItem.execute(item.id);
    // eslint-disable-next-line
  }, [pathname]);

  const textColor = "grey.A100";
  const iconSelectedColor = "grey.A100";

  return item.hideInMenu ? null : (
    <ListItemButton
      {...listItemProps}
      disabled={item.disabled}
      onClick={() => setActiveMenuItem.execute(item.id)}
      selected={isSelected}
      sx={{
        zIndex: 1201,
        // Custom: Level 1 (menu con) luôn là 30px, các level khác tăng dần
        pl: drawerOpen
          ? `${level === 1 ? 30 : (16 + level * 24) - 10}px` 
          : 1.5,
        py: !drawerOpen && level === 1 ? 1.25 : 1,
        ...(drawerOpen && {
          "&:hover": {
            bgcolor: "#6c7a79",
          },
          "&.Mui-selected": {
            bgcolor: "#4e605e",
            borderRight: `2px solid ${theme.palette.primary.main}`,
            color: iconSelectedColor,
            "&:hover": {
              color: iconSelectedColor,
              bgcolor: "#6c7a79",
            },
          },
        }),
        ...(!drawerOpen && {
          "&:hover": {
            bgcolor: "transparent",
          },
          "&.Mui-selected": {
            "&:hover": {
              bgcolor: "transparent",
            },
            bgcolor: "transparent",
          },
        }),
      }}
    >
      {itemIcon && (
        <ListItemIcon
          sx={{
            minWidth: 28,
            color: isSelected ? iconSelectedColor : textColor,
            ...(!drawerOpen && {
              borderRadius: 1.5,
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              "&:hover": {
                bgcolor: "grey.lighter",
              },
            }),
            ...(!drawerOpen &&
              isSelected && {
                bgcolor: "primary.lighter",
                "&:hover": {
                  bgcolor: "primary.lighter",
                },
              }),
          }}
        >
          {itemIcon}
        </ListItemIcon>
      )}
      {(drawerOpen || (!drawerOpen && level !== 1)) && (
        <ListItemText
          primary={
            <Typography
              variant="h6"
              sx={{ color: isSelected ? iconSelectedColor : textColor }}
            >
              {item.title}
            </Typography>
          }
        />
      )}
      {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
        <Chip
          color={item.chip.color}
          variant={item.chip.variant}
          size={item.chip.size}
          label={item.chip.label}
          avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
        />
      )}
    </ListItemButton>
  );
}

NavItem.propTypes = { item: PropTypes.object, level: PropTypes.number };

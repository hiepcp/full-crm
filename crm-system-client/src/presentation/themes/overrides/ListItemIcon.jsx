import React from 'react';
// ==============================|| OVERRIDES - LIST ITEM ICON ||============================== //

export default function ListItemIcon() {
  return {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 24
        }
      }
    }
  };
}

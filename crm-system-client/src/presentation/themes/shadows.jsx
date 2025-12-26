import React from 'react';
// material-ui
import { alpha } from '@mui/material/styles';

// ==============================|| DEFAULT THEME - CUSTOM SHADOWS ||============================== //

export default function CustomShadows(theme) {
  // Return default shadow values if theme is null or undefined
  if (!theme || !theme.palette) {
    return {
      button: `0 2px #0000000b`,
      text: `0 -1px 0 rgb(0 0 0 / 12%)`,
      z1: `0px 2px 8px rgba(0, 0, 0, 0.15)`
    };
  }

  return {
    button: `0 2px #0000000b`,
    text: `0 -1px 0 rgb(0 0 0 / 12%)`,
    z1: `0px 2px 8px ${alpha(theme.palette.grey[900], 0.15)}`
    // only available in paid version
  };
}

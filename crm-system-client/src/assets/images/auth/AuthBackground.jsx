import React from 'react';
// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

// ==============================|| AUTH BLUR BACK SVG ||============================== //

export default function AuthBackground() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,                 // top:0 right:0 bottom:0 left:0
        zIndex: -1,
        backgroundImage: "url('/logo512.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain', // hoặc 'cover'
        width: '100%',
        height: '100%',
        marginLeft: '-50%',
        filter: 'blur(18px)',
        opacity: theme.palette.mode === 'dark' ? 0.8 : 0.8,
      }}
    />
  );
}

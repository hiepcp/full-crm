import React from 'react';
// material-ui
import { useTheme } from '@mui/material/styles';
import CoreOne from '@assets/images/CoreOne.png'; //'src/assets/images/CoreOne.png';

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoDark from 'assets/images/logo-dark.svg';
 * import logo from 'assets/images/logo.svg';
 *
 */

// ==============================|| LOGO SVG ||============================== //

const Logo = () => {
  const theme = useTheme();

  return (
    /**
     * if you want to use image instead of svg uncomment following, and comment out <svg> element.
     *
     * <img src={logo} alt="Mantis" width="100" />
     *
     */
    <>
      <img src={CoreOne} alt="Core One" width="180" />
      {/* <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="234" height="35">
        <path d="M0,0 L12,0 L12,1 L14,1 L14,2 L15,2 L15,3 L17,3 L17,4 L18,4 L18,5 L19,5 L19,7 L20,7 L20,9 L21,9 L21,11 L22,11 L22,24 L21,24 L21,27 L20,27 L20,28 L19,28 L19,30 L18,30 L18,31 L17,31 L17,32 L16,32 L16,33 L14,33 L14,34 L12,34 L12,35 L0,35 L0,34 L-2,34 L-2,33 L-3,33 L-3,32 L-5,32 L-5,31 L-6,31 L-6,29 L-7,29 L-7,28 L-8,28 L-8,26 L-9,26 L-9,23 L-10,23 L-10,12 L-9,12 L-9,9 L-8,9 L-8,7 L-7,7 L-7,6 L-6,6 L-6,5 L-5,5 L-5,4 L-4,4 L-4,3 L-3,3 L-3,2 L-2,2 L-2,1 L0,1 Z M2,5 L2,6 L0,6 L0,7 L-1,7 L-1,8 L-2,8 L-2,9 L-3,9 L-3,11 L-4,11 L-4,14 L-5,14 L-5,22 L-4,22 L-4,25 L-3,25 L-3,26 L-2,26 L-2,28 L0,28 L0,29 L1,29 L1,30 L11,30 L11,29 L13,29 L13,28 L14,28 L14,27 L15,27 L15,25 L16,25 L16,23 L17,23 L17,12 L16,12 L16,10 L15,10 L15,8 L14,8 L14,7 L12,7 L12,6 L11,6 L11,5 Z " fill="#FEFEFE" transform="translate(147,0)" />
        <path d="M0,0 L1,0 L1,33 L-4,33 L-4,31 L-5,31 L-5,30 L-6,30 L-6,28 L-7,28 L-7,27 L-8,27 L-8,25 L-9,25 L-9,24 L-10,24 L-10,22 L-11,22 L-11,21 L-12,21 L-12,19 L-13,19 L-13,18 L-14,18 L-14,16 L-15,16 L-15,14 L-16,14 L-16,13 L-17,13 L-17,33 L-22,33 L-22,2 L-18,2 L-18,3 L-17,3 L-17,4 L-16,4 L-16,6 L-15,6 L-15,7 L-14,7 L-14,9 L-13,9 L-13,10 L-12,10 L-12,12 L-11,12 L-11,14 L-10,14 L-10,15 L-9,15 L-9,17 L-8,17 L-8,18 L-7,18 L-7,20 L-6,20 L-6,21 L-5,21 L-5,23 L-4,23 L-4,2 L-1,2 L-1,1 L0,1 Z M-18,11 L-18,13 L-17,13 L-17,11 Z " fill="#FEFEFE" transform="translate(202,2)" />
        <path d="M0,0 L2,0 L2,1 L6,1 L6,2 L8,2 L8,3 L10,3 L10,4 L11,4 L11,5 L12,5 L12,6 L13,6 L13,8 L14,8 L14,10 L15,10 L15,23 L14,23 L14,25 L13,25 L13,27 L12,27 L12,28 L11,28 L11,29 L10,29 L10,30 L9,30 L9,31 L7,31 L7,32 L-5,32 L-5,31 L-7,31 L-7,30 L-8,30 L-8,29 L-9,29 L-9,28 L-10,28 L-10,27 L-11,27 L-11,25 L-12,25 L-12,23 L-13,23 L-13,10 L-12,10 L-12,8 L-11,8 L-11,6 L-10,6 L-10,5 L-9,5 L-9,4 L-8,4 L-8,3 L-6,3 L-6,2 L-4,2 L-4,1 L0,1 Z M-3,6 L-3,7 L-5,7 L-5,8 L-6,8 L-6,10 L-7,10 L-7,12 L-8,12 L-8,22 L-7,22 L-7,24 L-6,24 L-6,25 L-5,25 L-5,26 L-3,26 L-3,27 L5,27 L5,26 L7,26 L7,25 L8,25 L8,24 L9,24 L9,22 L10,22 L10,12 L9,12 L9,10 L8,10 L8,8 L7,8 L7,7 L5,7 L5,6 Z " fill="#FEFEFE" transform="translate(49,3)" />
        <path d="M0,0 L13,0 L13,1 L16,1 L16,2 L17,2 L17,3 L18,3 L18,4 L19,4 L19,6 L20,6 L20,13 L19,13 L19,15 L18,15 L18,16 L17,16 L17,17 L15,17 L15,18 L16,18 L16,19 L17,19 L17,21 L18,21 L18,23 L19,23 L19,24 L20,24 L20,26 L21,26 L21,27 L22,27 L22,29 L23,29 L23,31 L18,31 L18,29 L17,29 L17,28 L16,28 L16,26 L15,26 L15,25 L14,25 L14,23 L13,23 L13,22 L12,22 L12,20 L11,20 L11,19 L10,19 L10,18 L5,18 L5,31 L0,31 Z M5,5 L5,13 L14,13 L14,12 L15,12 L15,7 L14,7 L14,6 L12,6 L12,5 Z " fill="#FEFEFE" transform="translate(74,4)" />
        <path d="M0,0 L20,0 L20,5 L5,5 L5,13 L18,13 L18,18 L5,18 L5,26 L20,26 L20,31 L0,31 Z " fill="#FEFEFE" transform="translate(108,4)" />
        <path d="M0,0 L19,0 L19,5 L5,5 L5,13 L18,13 L18,18 L5,18 L5,26 L19,26 L19,31 L0,31 Z " fill="#FEFEFE" transform="translate(215,4)" />
        <path d="M0,0 L14,0 L14,1 L15,1 L15,3 L13,3 L13,4 L12,4 L12,5 L2,5 L2,6 L0,6 L0,7 L-2,7 L-2,8 L-3,8 L-3,9 L-4,9 L-4,11 L-5,11 L-5,14 L-6,14 L-6,21 L-5,21 L-5,24 L-4,24 L-4,26 L-3,26 L-3,27 L-2,27 L-2,28 L-1,28 L-1,29 L1,29 L1,30 L13,30 L13,29 L15,29 L15,28 L16,28 L16,34 L14,34 L14,35 L0,35 L0,34 L-2,34 L-2,33 L-4,33 L-4,32 L-5,32 L-5,31 L-6,31 L-6,30 L-7,30 L-7,29 L-8,29 L-8,28 L-9,28 L-9,26 L-10,26 L-10,24 L-11,24 L-11,11 L-10,11 L-10,9 L-9,9 L-9,7 L-8,7 L-8,6 L-7,6 L-7,5 L-6,5 L-6,4 L-5,4 L-5,3 L-4,3 L-4,2 L-2,2 L-2,1 L0,1 Z " fill="#FEFEFE" transform="translate(11,0)" />
      </svg> */}
    </>
  );
};

export default Logo;

// src/presentation/hooks/useResponsive.jsx
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * Custom hook for responsive breakpoint detection
 *
 * Provides boolean flags for different device types based on MUI theme breakpoints:
 * - xs: 0px
 * - sm: 768px
 * - md: 1024px
 * - lg: 1266px
 * - xl: 1440px
 *
 * @returns {Object} Object containing responsive flags
 * @returns {boolean} isMobile - true for screens < 1024px (phones)
 * @returns {boolean} isTablet - true for screens between 1024px and 1266px
 * @returns {boolean} isDesktop - true for screens >= 1266px
 * @returns {boolean} isMobileOrTablet - true for screens < 1266px (includes both phones and tablets)
 * @returns {boolean} isSmallMobile - true for screens < 768px (small phones)
 *
 * @example
 * function MyComponent() {
 *   const { isMobile, isTablet, isDesktop } = useResponsive();
 *
 *   return (
 *     <>
 *       {isMobile && <MobileView />}
 *       {isTablet && <TabletView />}
 *       {isDesktop && <DesktopView />}
 *     </>
 *   );
 * }
 */
export function useResponsive() {
  const theme = useTheme();

  // Mobile: screens < 1024px (phones)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Small mobile: screens < 768px (small phones)
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Tablet: screens between 1024px and 1266px
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // Desktop: screens >= 1266px
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Mobile or Tablet: screens < 1266px (useful for drawer/navigation decisions)
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('lg'));

  return {
    isMobile,
    isSmallMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet
  };
}

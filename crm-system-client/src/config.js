// ==============================|| THEME CONFIG  ||============================== //

const config = {
  // defaultPath: '/dashboard/default',
  defaultPath: "/",
  fontFamily: `'Calibri', sans-serif`,
  i18n: "en",
  miniDrawer: false,
  container: true,
  mode: "dark",
  presetColor: "default",
  themeDirection: "ltr",

  x_api_key: import.meta.env.VITE_X_API_KEY,

  tenantId: import.meta.env.VITE_TENANT_ID,
  clientId: import.meta.env.VITE_CLIENT_ID,

  API_AUTH: import.meta.env.VITE_API_AUTH || 'https://api-auth.local.com',
  API_APP_CODE: import.meta.env.VITE_API_APP || 'crm', // Để xác định app nào (crm, hr, etc.)
  API_URL: import.meta.env.VITE_API_URL || 'https://api-crm.local.com',

  API_AUTHZ: import.meta.env.VITE_API_AUTHZ || 'https://api-auth.local.com',
  redirectUri: import.meta.env.VITE_REDIRECT_URI || 'https://crm.local.com:3000/auth/callback',
};

export default config;
export const drawerWidth = 260;

export const twitterColor = "#1DA1F2";
export const facebookColor = "#3b5998";
export const linkedInColor = "#0e76a8";

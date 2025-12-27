// import { loginRequest } from '../pages/authentication/authConfig';
// import { PublicClientApplication } from '@azure/msal-browser';
// //import { msalConfig } from '../pages/authentication/authConfig';

// // Initialize MSAL instance
// const msalInstance = new PublicClientApplication(msalConfig);

// // Make sure to initialize MSAL before using it
// let msalInitialized = false;
// const initializeMsal = async () => {
//   if (!msalInitialized) {
//     await msalInstance.initialize();
//     msalInitialized = true;
//   }
//   return msalInstance;
// };

/**
 * Refreshes the Azure AD token (tokenAZ) and stores it in localStorage
 * @returns {Promise<string|null>} - The new access token or null if refresh failed
 */
export const refreshTokenAZ = async () => {
  // try {
  //   // Make sure MSAL is initialized
  //   const msalClient = await initializeMsal();
    
  //   // Get all accounts
  //   const accounts = msalClient.getAllAccounts();
    
  //   // If no accounts found, cannot refresh token
  //   if (accounts.length === 0) {
  //     localStorage.removeItem('token');
  //     localStorage.removeItem('tokenAZ');
  //     localStorage.removeItem('refresh_token');
  //     localStorage.removeItem('name');
  //     localStorage.removeItem('username');
  //     localStorage.removeItem('jobTitle');
  //     localStorage.removeItem('email');
  //     localStorage.removeItem('profilePhoto');

  //     window.location.href = '/login';

  //     return null;
  //   }

  //   // Use the first account (most applications only have one signed-in account)
  //   const account = accounts[0];
    
  //   // Try to acquire token silently
  //   const silentRequest = {
  //     ...loginRequest,
  //     account: account
  //   };

  //   const response = await msalClient.acquireTokenSilent(silentRequest);
    
  //   if (response && response.accessToken) {
  //     // Store the new token in localStorage
  //     localStorage.setItem('tokenAZ', response.accessToken);
  //     console.log('Azure AD token refreshed successfully');
  //     return response.accessToken;
  //   } else {
  //     console.error('Failed to get access token from silent request');
  //     return null;
  //   }
  // } catch (error) {
  //   console.error('Error refreshing Azure AD token:', error);
    
  //   // If silent token acquisition fails, we need to prompt the user
  //   if (error.name === 'InteractionRequiredAuthError') {
  //     try {
  //       // Make sure MSAL is initialized again just to be safe
  //       const msalClient = await initializeMsal();
        
  //       console.log('Silent token refresh failed, prompting for interaction');
  //       const response = await msalClient.acquireTokenPopup(loginRequest);
        
  //       if (response && response.accessToken) {
  //         localStorage.setItem('tokenAZ', response.accessToken);
  //         console.log('Azure AD token refreshed successfully via popup');
  //         return response.accessToken;
  //       }
  //     } catch (interactionError) {
  //       console.error('Interactive token acquisition failed:', interactionError);
  //     }
  //   }
    
  //   return null;
  // }
};

/**
 * Checks if the Azure AD token is expired or about to expire
 * @returns {boolean} - True if token is expired or about to expire within 5 minutes
 */
export const isAzureTokenExpired = () => {
  const token = localStorage.getItem('tokenAZ');
  if (!token) return true;
  
  try {
    // Parse the JWT token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    const expirationTime = payload.exp;
    const currentTime = Date.now() / 1000;
    
    // Consider token expired if it's actually expired or about to expire within 5 minutes
    return expirationTime < currentTime + 300;
  } catch (error) {
    console.error('Error parsing Azure AD token:', error);
    return true;
  }
};

/**
 * Gets a valid token, refreshing it if expired or about to expire
 * @returns {Promise<string|null>} - Valid token or null if unable to get one
 */
export const getValidToken = async () => {
  // Check if token exists and is not expired
  const token = localStorage.getItem('tokenAZ');
  
  if (!token || isAzureTokenExpired()) {
    // Token is missing or expired, try to refresh it
    return await refreshTokenAZ();
  }
  
  // Token is still valid
  return token;
};

export default {
  refreshTokenAZ,
  isAzureTokenExpired,
  getValidToken
}; 
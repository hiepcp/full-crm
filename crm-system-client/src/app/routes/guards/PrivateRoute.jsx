import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { refreshTokenAZ, isAzureTokenExpired } from '@utils/authHelpers';
import { tokenHelper } from '@utils/tokenHelper';


const PrivateRoute = () => {
  const jwt_token = tokenHelper.get();

  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [tokenExpired, setTokenExpired] = useState(false);

  const isTokenExpired = (token) => {
    if (!isValidJwt(token)) return true;

    if (!token) return true;

    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    return decodedToken.exp < currentTime;
  };

  const isValidJwt = (token) => {
    if (!token) return false;

    try {
      const decoded = jwtDecode(token); // Giải mã phần payload
      return true; // Token hợp lệ
    } catch (error) {
      console.error('Invalid JWT:', error.message);
      return false; // Token không hợp lệ
    }
  };

  useEffect(() => {
    if (jwt_token && !isTokenExpired(jwt_token)) {
      // Check if Azure AD token is expired or about to expire, and refresh if needed
      if (isAzureTokenExpired()) {
        refreshTokenAZ();
      }
    } else {
      // localStorage.removeItem('token');
      // localStorage.removeItem('tokenAZ');
      // localStorage.removeItem('name');
      // localStorage.removeItem('username');
      // localStorage.removeItem('jobTitle');
      // localStorage.removeItem('email');

      // localStorage.removeItem('profilePhoto');
      tokenHelper.clear();
      if (isAuthenticated) {
        instance.logoutRedirect();
      }
      //   navigate(`/login`);
      setTokenExpired(true);
    }
  }, [jwt_token, tokenExpired]);

  return !tokenExpired ? <Outlet /> : <Navigate exact to={`/login`} />;
};

export default PrivateRoute;

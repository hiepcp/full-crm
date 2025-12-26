import React, { lazy } from 'react';

// project import
import Loadable from '@presentation/components/Loadable';
import MinimalLayout from '@presentation/layouts/MinimalLayout';

// render - login
const AuthLogin = Loadable(lazy(() => import('@presentation/pages/auth/Login')));
const Unauthorized = Loadable(lazy(() => import('@presentation/pages/Unauthorized')));

// ==============================|| AUTH ROUTING ||============================== //

const LoginRoutes = {
  path: '/',
  element: <MinimalLayout />,
  children: [
    {
      path: '/login',
      element: <AuthLogin />
    },
    {
      path: '/unauthorized',
      element: <Unauthorized />
    }
  ]
};

export default LoginRoutes;

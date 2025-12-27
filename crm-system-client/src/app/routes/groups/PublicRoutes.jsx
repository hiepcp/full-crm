import React, { lazy } from 'react';

// project import
import Loadable from '@presentation/components/Loadable';
import MinimalLayout from '@presentation/layouts/MinimalLayout';

// render - public pages
const PublicLeadForm = Loadable(lazy(() => import('@presentation/pages/PublicLeadForm')));

// ==============================|| PUBLIC ROUTING ||============================== //

const PublicRoutes = {
  path: '/public',
  element: <MinimalLayout />,
  children: [
    {
      path: 'lead-form',
      element: <PublicLeadForm />
    }
  ]
};

export default PublicRoutes;

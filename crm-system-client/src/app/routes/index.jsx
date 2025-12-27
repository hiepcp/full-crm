import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

// project import
import MainRoutes from '@app/routes/groups/MainRoutes';
import LoginRoutes from '@app/routes/groups/LoginRoutes';
import PublicRoutes from '@app/routes/groups/PublicRoutes';

// ==============================|| ROUTING RENDER ||============================== //

// PublicRoutes must come first to match before MainRoutes catches all '/' paths
const router = createBrowserRouter([MainRoutes, LoginRoutes, PublicRoutes], {
  basename: import.meta.env.VITE_APP_BASE_NAME,
  future: {
    v7_startTransition: true,
  },
});

export default router;

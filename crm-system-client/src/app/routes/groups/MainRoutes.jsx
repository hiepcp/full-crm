import React, { lazy } from 'react';
import { Navigate } from 'react-router';

// project import
import Loadable from '@presentation/components/Loadable';
import Dashboard from '@presentation/layouts/Dashboard';
import RouteResolver from '@app/routes/RouteResolver';
import RouteGuard from '@app/routes/guards/RouteGuard';

const PrivateRoute = Loadable(lazy(() => import('@app/routes/guards/PrivateRoute')));

// Detail Pages - lazy loaded
const CustomerDetailPage = Loadable(lazy(() => import('@presentation/pages/customer/CustomerDetail')));
const LeadDetailPage = Loadable(lazy(() => import('@presentation/pages/lead/LeadDetail')));
const DealDetailPage = Loadable(lazy(() => import('@presentation/pages/deal/DealDetail')));
const ActivityDetailPage = Loadable(lazy(() => import('@presentation/pages/activity/ActivityDetail')));
const ContactDetailPage = Loadable(lazy(() => import('@presentation/pages/contact/ContactDetail')));
const DashboardPage = Loadable(lazy(() => import('@presentation/pages/dashboard')));
const InboxPage = Loadable(lazy(() => import('@presentation/pages/inbox')));
const EmailConnectPage = Loadable(lazy(() => import('@presentation/pages/email/EmailConnect')));
const EmailOAuthCallbackPage = Loadable(lazy(() => import('@presentation/pages/auth/EmailOAuthCallback')));
const HcmWorkerRegisterPage = Loadable(lazy(() => import('@presentation/pages/user/HcmWorkerRegister')));
const NotificationListPage = Loadable(lazy(() => import('@presentation/pages/notifications/NotificationList')));
const UserSaleRegistrationPage = Loadable(lazy(() => import('@presentation/pages/user/UserSaleRegistration')));

// Goal Pages - lazy loaded (NEW - Phase 6, 7, 8)
const GoalHierarchyView = Loadable(lazy(() => import('@presentation/pages/goals/GoalHierarchyView')));
const GoalAnalytics = Loadable(lazy(() => import('@presentation/pages/goals/GoalAnalytics')));
const GoalDetailPage = Loadable(lazy(() => import('@presentation/pages/goals/GoalDetailPage')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <Dashboard />,
  children: [
    // OAuth callback should be accessible without authentication
    {
      path: 'auth/callback',
      element: <EmailOAuthCallbackPage />
    },
    {
      path: '/',
      element: <PrivateRoute />,
      children: [
        // Detail routes with explicit params
        {
          path: '/',
          element: <DashboardPage />
        },
        {
          path: 'customers/:id',
          element: <RouteGuard element={<CustomerDetailPage />} menuId="customers" />
        },
        {
          path: 'leads/:id',
          element: <RouteGuard element={<LeadDetailPage />} menuId="leads" />
        },
        {
          path: 'deals/:id',
          element: <RouteGuard element={<DealDetailPage />} menuId="deals" />
        },
        {
          path: 'activities/:id',
          element: <RouteGuard element={<ActivityDetailPage />} menuId="activities" />
        },
        {
          path: 'contacts/:id',
          element: <RouteGuard element={<ContactDetailPage />} menuId="contacts" />
        },
        {
          path: 'connect/inbox',
          element: <RouteGuard element={<InboxPage />} menuId="inbox" />
        },
        {
          path: 'connect/email',
          element: <RouteGuard element={<EmailConnectPage />} menuId="connect_email" />
        },
        {
          path: 'users/register-hcm',
          element: <RouteGuard element={<HcmWorkerRegisterPage />} menuId="user-register-hcm" />
        },
        {
          path: 'notifications',
          element: <NotificationListPage />
        },
        {
          path: 'users/register-sale',
          element: <RouteGuard element={<UserSaleRegistrationPage />} menuId="user-register-sale" />
                },
        {
          // NEW: Goal Hierarchy View (Phase 6)
          path: 'goals/hierarchy',
          element: <RouteGuard element={<GoalHierarchyView />} menuId="goals" />
        },
        {
          // NEW: Goal Analytics (Phase 7)
          path: 'goals/analytics',
          element: <RouteGuard element={<GoalAnalytics />} menuId="goals" />
        },
        {
          // NEW: Goal Detail Page (Phase 8)
          path: 'goals/:id',
          element: <RouteGuard element={<GoalDetailPage />} menuId="goals" />
        },
        {
          // RouteResolver sẽ tự động kiểm tra quyền và render đúng component theo menu
          path: '*',
          element: <RouteResolver />
        }
      ]
    }
  ]
};

export default MainRoutes;

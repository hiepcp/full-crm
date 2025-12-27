import React from 'react';
import { Navigate } from 'react-router-dom';
import Loader from '@presentation/components/Loader';
import { useRoleProfile } from "@app/contexts/RoleProfileContext";

// A component that checks if the user has permission to access a route
// If not, redirect to the dashboard
const RouteGuard = ({ element, menuId }) => {
  const { canAccessMenu, loading, roleProfile } = useRoleProfile();

  // Khi context chưa sẵn sàng, chỉ render Loader, không render element
  if (loading || !roleProfile) {
    return <Loader />;
  }

  // Nếu user có quyền truy cập menu, render element
  if (!menuId || canAccessMenu(menuId)) {
    return element;
  }

  // Nếu không có quyền, redirect về dashboard
  return <Navigate to="/" />;
};

export default RouteGuard;
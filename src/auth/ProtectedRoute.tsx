import React, { ReactNode, useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '@/auth';

interface ProtectedRouteProps {
  requiredPermissions: string[];
  children?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredPermissions, children }) => {
  const authContext = useAuthContext();
  const { auth, permissions } = authContext;

  if (!auth) {
    return <Navigate to="/auth" />;
  }

  const hasPermission = requiredPermissions.every((perm) => permissions.includes(perm));

  if (!auth) {
    return <Navigate to="/error/403" />;
  }

  return <>{children || <Outlet />}</>;
};

export default ProtectedRoute;

import React, { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '@/auth';
import { userHasAnyPermission } from '@/utils/permissionUtils';

interface ProtectedRouteProps {
  /** Si hay varios permisos, basta con tener uno (OR), igual que en el menú lateral. */
  requiredPermissions: string[];
  children?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredPermissions, children }) => {
  const { auth, permissions, roles } = useAuthContext();
  const safePermissions = permissions ?? [];

  if (!auth) {
    return <Navigate to="/auth" replace />;
  }

  /**
   * Misma idea que `getActiveDashboard` en AppRoutingSetup: si el usuario tiene rol
   * INSTRUCTOR SENA, el dashboard ya lo trata como instructor aunque el JWT no traiga
   * explícitamente el permiso AULA_VIRTUAL_INSTRUCTOR (suele pasar por cómo se sincronizan roles).
   */
  const instructorSenaBypass =
    Array.isArray(roles) &&
    roles.includes('INSTRUCTOR SENA') &&
    requiredPermissions.includes('AULA_VIRTUAL_INSTRUCTOR');

  const allowed =
    userHasAnyPermission(requiredPermissions, safePermissions) || instructorSenaBypass;

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children || <Outlet />}</>;
};

export default ProtectedRoute;

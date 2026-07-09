
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ScreenLoader } from '@/components/loaders';

import { useAuthContext } from './useAuthContext';
import { isActivationGateActive } from '@/utils/aulaVirtualEstudianteUp';

const RequireAuth = () => {
  const { auth, isLoading, activacion, roles } = useAuthContext();

  const location = useLocation();

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (auth && isActivationGateActive(roles, activacion?.state_id) && location.pathname !== '/perfil') {
    return <Navigate to="/perfil" replace />;
  }

  return auth ? <Outlet /> : <Navigate to="/auth" state={{ from: location }} replace />;
};

export { RequireAuth };

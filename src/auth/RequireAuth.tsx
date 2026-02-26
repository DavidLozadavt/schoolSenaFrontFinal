
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ScreenLoader } from '@/components/loaders';

import { useAuthContext } from './useAuthContext';

const RequireAuth = () => {
  const { auth, isLoading, activacion } = useAuthContext();

  const location = useLocation();

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (auth && activacion?.state_id === 18 && location.pathname !== '/perfil') {
    return <Navigate to="/perfil" replace />;
  }

  return auth ? <Outlet /> : <Navigate to="/auth" state={{ from: location }} replace />;
};

export { RequireAuth };

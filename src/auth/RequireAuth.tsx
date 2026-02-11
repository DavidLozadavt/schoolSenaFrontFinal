
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ScreenLoader } from '@/components/loaders';

import { useAuthContext } from './useAuthContext';

const RequireAuth = () => {
  const { auth,activacion, isLoading } = useAuthContext();

  const location = useLocation();

  if (isLoading) {
    return <ScreenLoader />;
  }
  if(auth && activacion && activacion.idEstado == 18) {
    return <Navigate to="/perfil" state={{ from: location }} replace />;
  }

  return auth ? <Outlet/> : <Navigate to="/auth" state={{ from: location }} replace />;
};

export { RequireAuth };

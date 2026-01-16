
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ScreenLoader } from '@/components/loaders';

import { useAuthContext } from './useAuthContext';

const RequireAuth = () => {
  const { auth, isLoading } = useAuthContext(); // Cambia aquí

  const location = useLocation();

  if (isLoading) {
    return <ScreenLoader />;
  }

  return auth ? <Outlet/> : <Navigate to="/auth" state={{ from: location }} replace />;
};

export { RequireAuth };

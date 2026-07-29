import { Outlet } from 'react-router-dom';
import { AuthLayoutProvider } from './AuthLayoutProvider';
import useBodyClasses from '@/hooks/useBodyClasses';
import { Fragment } from 'react';

const Layout = () => {
  // Applying body classes to set the background color in dark mode
  useBodyClasses('dark:bg-coal-500');

  return (
    <Fragment>
      <div className="flex items-center justify-center grow bg-white dark:bg-coal-500">
        <Outlet />
      </div>
    </Fragment>
  );
};

const AuthLayout = () => (
  <AuthLayoutProvider>
    <Layout />
  </AuthLayoutProvider>
);

export { AuthLayout };

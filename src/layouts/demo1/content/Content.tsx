import { Outlet } from 'react-router';

const Content = () => {
  return (
    <div className="grow content pt-5" role="content">
      {/* Breadcrumbs solo en Header — evita fila duplicada */}
      <Outlet />
    </div>
  );
};

export { Content };

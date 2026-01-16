import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

import { KeenIcon } from '@/components';

const Breadcrumbs = () => {
  const { pathname } = useLocation();

  const generateBreadcrumbs = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean); 
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`; 
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1), 
        path,
        active: index === segments.length - 1 
      };
    });
  };

  const items = generateBreadcrumbs(pathname);

  const renderItems = () => {
    return items.map((item, index) => {
      const last = index === items.length - 1;

      return (
        <Fragment key={`breadcrumb-${index}`}>
          {index === 0 ? ( 
            <span
              className={clsx(
                'text-gray-700 font-medium',
                'cursor-default' 
              )}
            >
              {item.title}
            </span>
          ) : (
            <Link
              to={item.path}
              className={clsx(
                'hover:underline',
                item.active ? 'text-gray-700 font-medium' : 'text-gray-600'
              )}
            >
              {item.title}
            </Link>
          )}
          {!last && (
            <KeenIcon icon="right" className="text-gray-500 text-xs" key={`separator-${index}`} />
          )}
        </Fragment>
      );
    });
  };

  return (
    <div className="flex items-center gap-1 text-xs lg:text-sm font-normal mb-2.5 lg:mb-0">
      {renderItems()}
    </div>
  );
};

export { Breadcrumbs };

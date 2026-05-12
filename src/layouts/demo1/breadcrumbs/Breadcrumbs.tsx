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
      
      // Si el segmento anterior es "clase" y el actual es numérico (ID), mostrar "Detalle" en lugar del ID
      let title = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (index > 0 && segments[index - 1] === 'clase' && /^\d+$/.test(segment)) {
        title = 'Detalle'; // Ocultar el ID, mostrar "Detalle"
      }
      
      return {
        title,
        path,
        active: index === segments.length - 1 
      };
    });
  };

  const items = generateBreadcrumbs(pathname);

  const renderItems = () => {
    /** Instructor vs aprendiz comparten prefijo /ambiente-virtual/. */
    const ambienteVirtualCrumbHome =
      pathname.startsWith('/ambiente-virtual/historial-raps') ||
      /^\/ambiente-virtual\/clase\//.test(pathname)
        ? '/ambiente-virtual/historial-raps'
        : '/ambiente-virtual/mis-clases';

    return items.map((item, index) => {
      const last = index === items.length - 1;
      const isClase = item.title === 'Clase';
      const isAmbienteVirtual = item.title === 'Ambiente-virtual' || item.title === 'Ambiente-Virtual';

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
          ) : isAmbienteVirtual ? (
            <Link
              to={ambienteVirtualCrumbHome}
              className={clsx(
                'hover:underline',
                item.active ? 'text-gray-700 font-medium' : 'text-gray-600'
              )}
            >
              {item.title}
            </Link>
          ) : isClase ? (
            // Clase no debe ser clickeable, solo mostrar el texto
            <span
              className={clsx(
                'text-gray-700 font-medium',
                'cursor-default'
              )}
            >
              {item.title}
            </span>
          ) : (
            // Detalle u otros elementos: no clickeable si es el último
            last ? (
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
            )
          )}
          {!last && (
            <KeenIcon icon="right" className="text-gray-500 text-xs" key={`separator-${index}`} />
          )}
        </Fragment>
      );
    });
  };

  return (
    <div className="flex items-center gap-1 text-xs lg:text-sm font-normal mb-2.5 lg:mb-0 pl-4 lg:pl-6">
      {renderItems()}
    </div>
  );
};

export { Breadcrumbs };

import { useEffect, useRef, useState } from 'react';
import { getHeight } from '@/utils';
import { useViewport } from '@/hooks';
import {
  DropdownNotificationsItem10,
  DropdownNotificationsItem11,
  DropdownNotificationsItem12,
  DropdownNotificationsItem13,
  DropdownNotificationsItem3,
  DropdownNotificationsItem5
} from './items';
import { Link } from 'react-router-dom';

const DropdownNotificationNoRead = ({
  items,
  onMarcarLeida
}: {
  items: any[];
  onMarcarLeida: (id: number) => void;
}) => {
  const footerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState<number>(0);
  const [viewportHeight] = useViewport();
  const offset = 300;

  useEffect(() => {
    if (footerRef.current) {
      const footerHeight = getHeight(footerRef.current);
      const availableHeight = viewportHeight - footerHeight - offset;
      setListHeight(availableHeight);
    }
  }, [viewportHeight]);

  const buildList = () => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-gray-500 text-center py-6">No hay notificaciones</p>;
    }

    return items.map((item: any, index: number) => {
      const {
        fecha,
        hora,
        mensaje,
        asunto,
        route,
        usuario_remitente, // snake_case
        empresa,
        tipo_notificacion // snake_case
      } = item;

      const formatearFecha = (fechaIso: string) => {
        const fecha = new Date(fechaIso);

        const fechaFormateada = new Intl.DateTimeFormat('es-CO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).format(fecha); // → 13/03/2026

        const horaFormateada = new Intl.DateTimeFormat('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(fecha); // → 10:50 a. m.

        return { fechaFormateada, horaFormateada };
      };

      const { fechaFormateada } = formatearFecha(fecha);

      const persona = usuario_remitente?.persona;
      const nombre1 = persona?.nombre1 ?? 'Sistema';
      const apellido1 = persona?.apellido1 ?? '';
      const apellido2 = persona?.apellido2 ?? '';
      const rutaFotoUrl = persona?.rutaFotoUrl ?? '/default-avatar.png';
      const razonSocial = empresa?.razonSocial ?? '';

      return (
        <div key={item.id} className='p-2'>
          <div className="flex grow gap-2.5 px-5 relative">
            {/* Botón marcar leída — esquina superior derecha */}
            {item.estado_id === 1 && (
              <button
                onClick={() => onMarcarLeida(item.id)}
                className="absolute top-0 right-0 flex items-center justify-center w-6 h-6 rounded-full hover:bg-green-50 text-blue-300 hover:text-green-500 transition-all animate-pulse"
                title="Marcar como leída"
              >
                <i className="ki-outline ki-check-circle text-base" />
              </button>
            )}
            <div className="relative shrink-0 mt-0.5">
              <img
                src={rutaFotoUrl}
                className="rounded-full size-8"
                alt={`${nombre1} ${apellido1} avatar`}
              />
              <span className="size-1.5 badge badge-circle absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-2sm font-medium mb-px">
                <Link
                  to={route ?? '#'}
                  className="hover:text-primary-active text-gray-900 font-semibold"
                  onClick={() => {
                    if (item.estado_id === 1 && onMarcarLeida) {
                      onMarcarLeida(item.id);
                    }
                  }}
                >
                  {nombre1} {apellido1} {apellido2}
                </Link>
                <span className="text-gray-700"> {asunto} </span>
              </div>
              <p className="text-2sm text-gray-600 line-clamp-2">{mensaje}</p>
              <span className="flex items-center justify-between text-2xs font-medium text-gray-500">
                <span className="flex items-center">
                  {fechaFormateada} - {hora}
                  {razonSocial && (
                    <>
                      <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
                      {razonSocial}
                    </>
                  )}
                </span>
              </span>
            </div>
          </div>

          {index < items.length - 1 && <div className="border-b border-b-gray-200 my-2"></div>}
        </div>
      );
    });
  };

  const buildFooter = () => {
    return (
      <>
        <div className="border-b border-b-gray-200"></div>
        {/* <div className="grid grid-cols-2 p-5 gap-2.5">
          <button className="btn btn-sm btn-light justify-center">Archive all</button>
          <button className="btn btn-sm btn-light justify-center">Mark all as read</button>
        </div> */}
      </>
    );
  };

  return (
    <div className="grow">
      <div className="scrollable-y-auto" style={{ maxHeight: `${listHeight}px` }}>
        {buildList()}
      </div>
      <div ref={footerRef}>{buildFooter()}</div>
    </div>
  );
};

export { DropdownNotificationNoRead };

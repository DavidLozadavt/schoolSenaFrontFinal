import { useEffect, useRef, useState } from 'react';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import {
  COLOR_NOTIFICACION,
  ICONO_NOTIFICACION,
  NotificacionPlan,
  notificacionesPlanesService
} from '@/services/notificacionesPlanesService';

const formatearFecha = (valor: string) =>
  new Date(valor).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Campana de notificaciones in-app del módulo de Planes de Mensajes.
 * Solo lectura sobre datos propios del usuario; no usa correo.
 */
const NotificacionesPlanesCampana = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionPlan[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await notificacionesPlanesService.listar();
      setNotificaciones(data.notificaciones);
      setNoLeidas(data.noLeidas);
    } catch {
      // Silencioso: la campana no debe interrumpir la pantalla.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // Cierra el panel al hacer clic fuera.
  useEffect(() => {
    const alHacerClic = (evento: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', alHacerClic);
    return () => document.removeEventListener('mousedown', alHacerClic);
  }, []);

  const abrirPanel = () => {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (siguiente) cargar();
  };

  const marcarLeida = async (notificacion: NotificacionPlan) => {
    if (notificacion.leidaEn) return;
    try {
      await notificacionesPlanesService.marcarLeida(notificacion.id);
      await cargar();
    } catch {
      enqueueSnackbar('No se pudo marcar la notificación.', { variant: 'error' });
    }
  };

  const marcarTodas = async () => {
    try {
      await notificacionesPlanesService.marcarTodasLeidas();
      await cargar();
    } catch {
      enqueueSnackbar('No se pudieron marcar las notificaciones.', { variant: 'error' });
    }
  };

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={abrirPanel}
        className="btn btn-sm btn-icon btn-light relative"
        title="Notificaciones de planes"
      >
        <KeenIcon icon="notification-status" />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -end-1 badge badge-xs badge-danger rounded-full px-1.5">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute end-0 mt-2 w-[360px] max-h-[420px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
            {noLeidas > 0 && (
              <button className="btn btn-xs btn-light" onClick={marcarTodas}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
              <span className="spinner-border spinner-border-sm" />
              Cargando...
            </div>
          ) : notificaciones.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No tienes notificaciones.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notificaciones.map((notificacion) => (
                <li
                  key={notificacion.id}
                  onClick={() => marcarLeida(notificacion)}
                  className={`flex gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 ${
                    notificacion.leidaEn ? '' : 'bg-primary/5'
                  }`}
                >
                  <KeenIcon
                    icon={ICONO_NOTIFICACION[notificacion.tipo] ?? 'information-2'}
                    className={`text-lg mt-0.5 ${COLOR_NOTIFICACION[notificacion.nivel] ?? 'text-info'}`}
                  />
                  <div className="flex flex-col grow">
                    <span className="text-sm font-semibold text-gray-900">
                      {notificacion.titulo}
                    </span>
                    <span className="text-xs text-gray-600">{notificacion.mensaje}</span>
                    <span className="text-2xs text-gray-400 mt-0.5">
                      {formatearFecha(notificacion.created_at)}
                    </span>
                  </div>
                  {!notificacion.leidaEn && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export { NotificacionesPlanesCampana };

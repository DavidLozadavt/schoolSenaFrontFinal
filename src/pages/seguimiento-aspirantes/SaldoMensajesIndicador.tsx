import { KeenIcon } from '@/components';
import { SaldoMensajes } from '@/services/planesMensajesService';
import { NotificacionesPlanesCampana } from './NotificacionesPlanesCampana';

/** Formatea un número tolerando null/undefined (datos incompletos del backend). */
const formatearNumero = (valor?: number | string | null) =>
  Number(valor ?? 0).toLocaleString('es-CO');

interface SaldoMensajesIndicadorProps {
  saldo: SaldoMensajes | null;
  loading: boolean;
  /** Mensajes que se enviarían con la selección actual (para avisar de faltante). */
  seleccionados?: number;
  onComprarPlan: () => void;
}

/**
 * Indicadores de saldo mostrados encima del botón "Enviar WhatsApp".
 * Componente de solo lectura: no interviene en el envío.
 */
const SaldoMensajesIndicador = ({
  saldo,
  loading,
  seleccionados = 0,
  onComprarPlan
}: SaldoMensajesIndicadorProps) => {
  if (loading && !saldo) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <span className="spinner-border spinner-border-sm" />
        Consultando saldo de mensajes...
      </div>
    );
  }

  if (!saldo) {
    return null;
  }

  const insuficiente = seleccionados > 0 && seleccionados > saldo.mensajesDisponibles;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 mb-3">
      <div className="flex items-center gap-1.5 text-sm">
        <KeenIcon icon="sms" className="text-primary" />
        <span className="text-gray-600">Disponibles:</span>
        <strong className={insuficiente ? 'text-danger' : 'text-gray-900'}>
          {formatearNumero(saldo.mensajesDisponibles)}
        </strong>
      </div>

      <span className="text-gray-300">|</span>

      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-gray-600">Consumidos:</span>
        <strong className="text-gray-900">{formatearNumero(saldo.mensajesConsumidos)}</strong>
      </div>

      <span className="text-gray-300">|</span>

      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-gray-600">Gratuitos:</span>
        <strong className="text-gray-900">{formatearNumero(saldo.mensajesGratuitos)}</strong>
      </div>

      <span className="text-gray-300">|</span>

      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-gray-600">Plan activo:</span>
        {saldo.planActivo ? (
          <span className="badge badge-sm badge-success">{saldo.planActivo.nombre}</span>
        ) : (
          <span className="badge badge-sm badge-light">Sin plan</span>
        )}
      </div>

      {saldo.tieneSolicitudPendiente && (
        <span className="badge badge-sm badge-warning">Solicitud en revisión</span>
      )}

      {insuficiente && (
        <span className="text-2xs text-danger font-medium">
          Faltan {formatearNumero(seleccionados - saldo.mensajesDisponibles)} mensajes para
          esta campaña.
        </span>
      )}

      <div className="flex items-center gap-2 ms-auto">
        <button
          type="button"
          onClick={onComprarPlan}
          className="btn btn-xs btn-light btn-primary flex items-center gap-1"
        >
          <KeenIcon icon="dollar" />
          Comprar plan
        </button>

        {/* Notificaciones in-app del módulo de planes */}
        <NotificacionesPlanesCampana />
      </div>
    </div>
  );
};

export { SaldoMensajesIndicador };

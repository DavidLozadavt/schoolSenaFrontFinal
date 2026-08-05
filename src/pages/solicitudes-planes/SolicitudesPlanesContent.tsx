import { Fragment, useEffect, useState } from 'react';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { useConfirm } from '@/hooks';
import {
  EstadoSolicitudPlan,
  planesMensajesService,
  SolicitudPlan
} from '@/services/planesMensajesService';
import {
  BADGE_ESTADO_WOMPI,
  ETIQUETA_ESTADO_WOMPI,
  ETIQUETA_METODO_WOMPI,
  EstadoWompi,
  WompiTransaccion,
  wompiPagosService
} from '@/services/wompiPagosService';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';

const BADGE_ESTADO: Record<EstadoSolicitudPlan, string> = {
  PENDIENTE: 'badge-warning',
  PAGO_REALIZADO: 'badge-info',
  APROBADA: 'badge-success',
  RECHAZADA: 'badge-danger'
};

const ETIQUETA_ESTADO: Record<EstadoSolicitudPlan, string> = {
  PENDIENTE: 'PENDIENTE',
  PAGO_REALIZADO: 'PAGO REALIZADO — PENDIENTE APROBACIÓN',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA'
};

/** Estados de solicitud que el administrador todavía puede resolver. */
const REVISABLES: EstadoSolicitudPlan[] = ['PENDIENTE', 'PAGO_REALIZADO'];

const formatearPrecio = (valor: string | number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(valor ?? 0));

const formatearFecha = (valor?: string | null) =>
  valor ? new Date(valor).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/**
 * Módulo del Administrador VT: revisión de las solicitudes de compra de planes
 * de mensajes (ver comprobante, aprobar, rechazar).
 */
const SolicitudesPlanesContent = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { confirmAction } = useConfirm();

  const [solicitudes, setSolicitudes] = useState<SolicitudPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState('');
  const [buscar, setBuscar] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [procesando, setProcesando] = useState<number | null>(null);

  // Detalle completo de la transacción de Wompi.
  const [detalleTx, setDetalleTx] = useState<WompiTransaccion | null>(null);
  const [cargandoTx, setCargandoTx] = useState(false);

  const handleVerTransaccion = async (solicitud: SolicitudPlan) => {
    if (!solicitud.wompiTransaccionId) return;

    setCargandoTx(true);
    try {
      setDetalleTx(await wompiPagosService.getDetalle(solicitud.wompiTransaccionId));
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'No se pudo cargar la transacción.', {
        variant: 'error'
      });
    } finally {
      setCargandoTx(false);
    }
  };

  const fetchSolicitudes = async (pagina = page) => {
    setLoading(true);
    try {
      const data = await planesMensajesService.getSolicitudes({
        estado: estado || undefined,
        buscar: buscar || undefined,
        page: pagina,
        per_page: 15
      });
      setSolicitudes(data.data);
      setTotalPages(data.last_page);
      setTotal(data.total);
      setPage(data.current_page);
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al cargar las solicitudes.', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const handleVerComprobante = async (solicitud: SolicitudPlan) => {
    try {
      const blob = await planesMensajesService.getComprobante(solicitud.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      // El navegador conserva la pestaña abierta; se libera el objeto luego.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      enqueueSnackbar('No se pudo abrir el comprobante.', { variant: 'error' });
    }
  };

  const handleAprobar = (solicitud: SolicitudPlan) => {
    confirmAction(
      `¿Aprobar la solicitud del plan "${solicitud.planNombre}"? Se acreditarán ${solicitud.cantidadMensajes} mensajes al usuario.`,
      async () => {
        setProcesando(solicitud.id);
        try {
          const respuesta = await planesMensajesService.aprobarSolicitud(solicitud.id);
          enqueueSnackbar(respuesta.message, { variant: 'success' });
          await fetchSolicitudes();
        } catch (error: any) {
          enqueueSnackbar(error?.response?.data?.error || 'Error al aprobar la solicitud.', {
            variant: 'error'
          });
        } finally {
          setProcesando(null);
        }
      }
    );
  };

  const handleRechazar = async (solicitud: SolicitudPlan) => {
    const motivo = window.prompt('Motivo del rechazo (se notificará al usuario):', '');
    if (motivo === null) return;
    if (motivo.trim() === '') {
      enqueueSnackbar('El motivo del rechazo es obligatorio.', { variant: 'warning' });
      return;
    }

    setProcesando(solicitud.id);
    try {
      const respuesta = await planesMensajesService.rechazarSolicitud(solicitud.id, motivo.trim());
      enqueueSnackbar(respuesta.message, { variant: 'success' });
      await fetchSolicitudes();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al rechazar la solicitud.', {
        variant: 'error'
      });
    } finally {
      setProcesando(null);
    }
  };

  return (
    <Fragment>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            className="input input-sm w-64"
            placeholder="Buscar por usuario, empresa o plan..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSolicitudes(1)}
          />
          <button className="btn btn-sm btn-icon btn-light" onClick={() => fetchSolicitudes(1)}>
            <KeenIcon icon="magnifier" />
          </button>
        </div>

        <select
          className="select select-sm w-48"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes (manual)</option>
          <option value="PAGO_REALIZADO">Pago realizado (Wompi)</option>
          <option value="APROBADA">Aprobadas</option>
          <option value="RECHAZADA">Rechazadas</option>
        </select>

        <span className="text-2xs text-gray-500 ms-auto">{total} solicitud(es)</span>
      </div>

      <div className="card">
        <div className="card-body p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
              <span className="spinner-border spinner-border-sm" />
              Cargando solicitudes...
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-12 text-center">
              <KeenIcon icon="dollar" className="text-3xl text-gray-300" />
              <p className="text-sm text-gray-500">No hay solicitudes registradas.</p>
            </div>
          ) : (
            <table className="table table-sm align-middle text-sm">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Empresa</th>
                  <th>Plan</th>
                  <th>Mensajes</th>
                  <th>Valor</th>
                  <th>Método de pago</th>
                  <th>Estado del pago</th>
                  <th>Referencia / Transaction ID</th>
                  <th>Valor pagado</th>
                  <th>Fecha del pago</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {solicitud.usuarioNombre || '—'}
                        </span>
                        <span className="text-2xs text-gray-500">{solicitud.usuarioEmail}</span>
                      </div>
                    </td>
                    <td>{solicitud.empresaNombre || '—'}</td>
                    <td>{solicitud.planNombre}</td>
                    <td>{solicitud.cantidadMensajes.toLocaleString('es-CO')}</td>
                    <td>{formatearPrecio(solicitud.valor)}</td>
                    <td>
                      {solicitud.pagoMetodo
                        ? (ETIQUETA_METODO_WOMPI[solicitud.pagoMetodo] ?? solicitud.pagoMetodo)
                        : solicitud.metodoPago}
                    </td>
                    <td>
                      {solicitud.pagoEstado ? (
                        <span
                          className={`badge badge-sm ${
                            BADGE_ESTADO_WOMPI[solicitud.pagoEstado as EstadoWompi] ?? 'badge-light'
                          }`}
                        >
                          {ETIQUETA_ESTADO_WOMPI[solicitud.pagoEstado as EstadoWompi] ??
                            solicitud.pagoEstado}
                        </span>
                      ) : (
                        <span className="badge badge-sm badge-light">Manual</span>
                      )}
                    </td>
                    <td className="text-2xs text-gray-500">
                      {solicitud.pagoReferencia ? (
                        <div className="flex flex-col">
                          <span>{solicitud.pagoReferencia}</span>
                          <span className="text-gray-400">{solicitud.pagoTransactionId ?? '—'}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {solicitud.pagoValor != null
                        ? formatearPrecio(solicitud.pagoValor)
                        : '—'}
                    </td>
                    <td className="text-xs text-gray-500">{formatearFecha(solicitud.pagoFecha)}</td>
                    <td className="text-xs text-gray-500">{formatearFecha(solicitud.created_at)}</td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className={`badge badge-sm ${BADGE_ESTADO[solicitud.estado]}`}>
                          {ETIQUETA_ESTADO[solicitud.estado] ?? solicitud.estado}
                        </span>
                        {solicitud.motivoRechazo && (
                          <span className="text-2xs text-danger">{solicitud.motivoRechazo}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn btn-xs btn-light flex items-center gap-1"
                          onClick={() => handleVerTransaccion(solicitud)}
                          disabled={!solicitud.wompiTransaccionId || cargandoTx}
                          title="Ver detalle completo de la transacción"
                        >
                          <KeenIcon icon="credit-cart" />
                          Transacción
                        </button>
                        <button
                          className="btn btn-xs btn-light flex items-center gap-1"
                          onClick={() => handleVerComprobante(solicitud)}
                          disabled={!solicitud.comprobanteRuta}
                          title="Ver comprobante"
                        >
                          <KeenIcon icon="eye" />
                          Comprobante
                        </button>
                        <button
                          className="btn btn-xs btn-success"
                          onClick={() => handleAprobar(solicitud)}
                          disabled={
                            !REVISABLES.includes(solicitud.estado) || procesando === solicitud.id
                          }
                          title="Aprobar"
                        >
                          <KeenIcon icon="check" />
                        </button>
                        <button
                          className="btn btn-xs btn-danger"
                          onClick={() => handleRechazar(solicitud)}
                          disabled={
                            !REVISABLES.includes(solicitud.estado) || procesando === solicitud.id
                          }
                          title="Rechazar"
                        >
                          <KeenIcon icon="cross" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            className="btn btn-sm btn-light"
            disabled={page <= 1}
            onClick={() => fetchSolicitudes(page - 1)}
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            className="btn btn-sm btn-light"
            disabled={page >= totalPages}
            onClick={() => fetchSolicitudes(page + 1)}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Detalle completo de la transacción de Wompi */}
      <Modal open={detalleTx !== null} onClose={() => setDetalleTx(null)}>
        <ModalContent className="max-w-[680px] top-[6%] p-4 max-h-[90vh] flex flex-col">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <KeenIcon icon="credit-cart" className="text-primary text-2xl" />
              Detalle de la transacción
            </ModalTitle>
            <button
              className="btn btn-sm btn-icon btn-light btn-clear"
              onClick={() => setDetalleTx(null)}
            >
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>

          <ModalBody className="overflow-y-auto grow flex flex-col gap-3">
            {detalleTx && (
              <>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Estado:</span>{' '}
                    <span className={`badge badge-sm ${BADGE_ESTADO_WOMPI[detalleTx.status]}`}>
                      {ETIQUETA_ESTADO_WOMPI[detalleTx.status]} · {detalleTx.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Transaction ID:</span>{' '}
                    <strong className="text-gray-900">{detalleTx.transactionId ?? '—'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Referencia:</span> {detalleTx.reference}
                  </div>
                  <div>
                    <span className="text-gray-500">Método:</span>{' '}
                    {detalleTx.paymentMethodType
                      ? (ETIQUETA_METODO_WOMPI[detalleTx.paymentMethodType] ??
                        detalleTx.paymentMethodType)
                      : '—'}
                  </div>
                  <div>
                    <span className="text-gray-500">Valor:</span>{' '}
                    {formatearPrecio(detalleTx.amount)} {detalleTx.currency}
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha del pago:</span>{' '}
                    {formatearFecha(detalleTx.fechaPago)}
                  </div>
                  <div>
                    <span className="text-gray-500">Correo:</span> {detalleTx.customerEmail ?? '—'}
                  </div>
                  <div>
                    <span className="text-gray-500">Última actualización:</span>{' '}
                    {detalleTx.origenActualizacion ?? '—'}
                  </div>
                </div>

                {detalleTx.statusMessage && (
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-2 text-sm">
                    {detalleTx.statusMessage}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase text-gray-700">
                    Respuesta completa de Wompi (auditoría)
                  </span>
                  <pre className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-gray-900 p-2 text-2xs text-gray-100">
                    {JSON.stringify(detalleTx.respuestaWompi ?? {}, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Fragment>
  );
};

export { SolicitudesPlanesContent };

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import clsx from 'clsx';
import { MensajesPlan, planesMensajesService } from '@/services/planesMensajesService';
import { ModalPagoWompi } from './ModalPagoWompi';

interface ModalComprarPlanProps {
  open: boolean;
  onClose: () => void;
  /** Mensajes que el usuario intentó enviar (0 si abrió el modal voluntariamente). */
  mensajesRequeridos?: number;
  /** Saldo disponible en el momento de abrir el modal. */
  mensajesDisponibles?: number;
  onSolicitudEnviada?: () => void;
}

const METODOS_PAGO = [
  'Transferencia bancaria',
  'Consignación',
  'Nequi',
  'Daviplata',
  'PSE',
  'Efectivo'
];

const formatearPrecio = (valor: string | number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    Number(valor ?? 0)
  );

/**
 * Modal de compra de un plan de mensajes.
 *
 * Se abre automáticamente cuando el usuario no tiene saldo suficiente para una
 * campaña, y también manualmente desde el indicador de saldo.
 */
const ModalComprarPlan = ({
  open,
  onClose,
  mensajesRequeridos = 0,
  mensajesDisponibles = 0,
  onSolicitudEnviada
}: ModalComprarPlanProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [planes, setPlanes] = useState<MensajesPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [planId, setPlanId] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);

  // Flujo principal de compra: pasarela Wompi.
  const [planPago, setPlanPago] = useState<number | null>(null);

  const planSeleccionado = useMemo(
    () => planes.find((p) => p.id === planId) ?? null,
    [planes, planId]
  );

  const faltantes = Math.max(0, mensajesRequeridos - mensajesDisponibles);

  const fetchPlanes = async () => {
    setLoading(true);
    try {
      const data = await planesMensajesService.getPlanes();
      setPlanes(data);
      // Preselecciona el plan más pequeño que cubra lo que falta.
      const sugerido = data.find((p) => p.cantidadMensajes >= faltantes) ?? data[0];
      setPlanId(sugerido?.id ?? null);
    } catch {
      enqueueSnackbar('Error al cargar los planes disponibles.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setMetodoPago('');
      setComprobante(null);
      fetchPlanes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleEnviar = async () => {
    if (!planSeleccionado) {
      enqueueSnackbar('Seleccione un plan.', { variant: 'warning' });
      return;
    }
    if (!metodoPago) {
      enqueueSnackbar('Seleccione el método de pago.', { variant: 'warning' });
      return;
    }
    if (!comprobante) {
      enqueueSnackbar('Adjunte el comprobante de pago.', { variant: 'warning' });
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await planesMensajesService.crearSolicitud(
        planSeleccionado.id,
        metodoPago,
        comprobante
      );
      enqueueSnackbar(respuesta.message || 'Solicitud enviada.', { variant: 'success' });
      onSolicitudEnviada?.();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al enviar la solicitud.', {
        variant: 'error'
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Fragment>
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[640px] top-[5%] p-4 max-h-[90vh] flex flex-col">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <KeenIcon icon="dollar" className="text-primary text-2xl" />
            Adquirir plan de mensajes
          </ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear"
            onClick={onClose}
            disabled={enviando}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="overflow-y-auto grow flex flex-col gap-5">
          {mensajesRequeridos > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
              <KeenIcon icon="information-2" className="text-danger text-lg mt-0.5" />
              <div className="text-gray-700">
                <span className="block font-semibold text-danger mb-0.5">
                  Saldo insuficiente para esta campaña
                </span>
                Necesita <strong>{mensajesRequeridos}</strong> mensajes y solo dispone de{' '}
                <strong>{mensajesDisponibles}</strong>. Le faltan <strong>{faltantes}</strong>{' '}
                mensajes. El envío no se ejecutó y no se descontó ningún mensaje.
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="form-label font-medium">Planes disponibles</label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="spinner-border spinner-border-sm" />
                Cargando planes...
              </div>
            ) : planes.length === 0 ? (
              <p className="text-sm text-gray-400">No hay planes activos por el momento.</p>
            ) : (
              <div className="grid gap-2">
                {planes.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setPlanId(plan.id)}
                    className={clsx(
                      'flex items-center justify-between gap-3 rounded-md border p-3 text-left transition cursor-pointer',
                      planId === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        {plan.nombre}
                        {plan.recomendado && (
                          <span className="badge badge-sm badge-primary">Recomendado</span>
                        )}
                        {plan.etiqueta && (
                          <span className={`badge badge-sm badge-${plan.color || 'light'}`}>
                            {plan.etiqueta}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {plan.cantidadMensajes.toLocaleString('es-CO')} mensajes
                        {plan.descripcion ? ` — ${plan.descripcion}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary whitespace-nowrap">
                        {formatearPrecio(plan.precio)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary flex items-center gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanId(plan.id);
                          setPlanPago(plan.id);
                        }}
                      >
                        <KeenIcon icon="credit-cart" />
                        Comprar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {planSeleccionado && (
            <div className="rounded-md bg-gray-100 border border-gray-200 p-3 text-sm text-gray-700">
              <span className="font-semibold block mb-1">Resumen de la compra</span>
              <div className="flex justify-between">
                <span>Plan seleccionado</span>
                <strong className="text-gray-900">{planSeleccionado.nombre}</strong>
              </div>
              <div className="flex justify-between">
                <span>Cantidad de mensajes</span>
                <strong className="text-gray-900">
                  {planSeleccionado.cantidadMensajes.toLocaleString('es-CO')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Precio</span>
                <strong className="text-gray-900">{formatearPrecio(planSeleccionado.precio)}</strong>
              </div>
            </div>
          )}

          {/*
            Registro manual del pago. Ya NO es el flujo principal (ese es Wompi,
            botón "Comprar" de cada plan); se conserva como alternativa para
            pagos realizados por fuera de la pasarela.
          */}
          <details className="rounded-md border border-gray-200 p-3">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              ¿Pagaste por fuera de la pasarela? Registrar comprobante manualmente
            </summary>

            <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1.5">
            <label className="form-label font-medium">Método de pago</label>
            <select
              className="select select-sm"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
            >
              <option value="">Seleccione un método de pago</option>
              {METODOS_PAGO.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label font-medium">Comprobante de pago</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="input input-sm"
              onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
            />
            <span className="text-2xs text-gray-500">
              Formatos permitidos: JPG, PNG o PDF (máximo 5 MB).
            </span>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button
              className="btn btn-sm btn-primary flex items-center gap-1.5"
              onClick={handleEnviar}
              disabled={enviando || loading}
            >
              {enviando ? (
                <>
                  <span className="spinner-border spinner-border-sm" />
                  Enviando...
                </>
              ) : (
                <>
                  <KeenIcon icon="send" />
                  Enviar solicitud
                </>
              )}
            </button>
          </div>
            </div>
          </details>
        </ModalBody>
      </ModalContent>
    </Modal>

      {/* Flujo principal: métodos de pago y checkout de Wompi */}
      <ModalPagoWompi
        open={planPago !== null}
        planId={planPago}
        onClose={() => setPlanPago(null)}
      />
    </Fragment>
  );
};

export { ModalComprarPlan };

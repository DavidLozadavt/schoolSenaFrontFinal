import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import {
  construirUrlCheckout,
  ETIQUETA_METODO_WOMPI,
  ResumenCompra,
  wompiPagosService
} from '@/services/wompiPagosService';

/** Formatea un número tolerando null/undefined (datos incompletos del backend). */
const formatearNumero = (valor?: number | string | null) =>
  Number(valor ?? 0).toLocaleString('es-CO');

interface ModalPagoWompiProps {
  open: boolean;
  planId: number | null;
  onClose: () => void;
}

const formatearPrecio = (valor: string | number, moneda = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0
  }).format(Number(valor ?? 0));

/**
 * Modal de métodos de pago. Muestra el resumen de la compra y envía al Checkout
 * Web oficial de Wompi, que resuelve todos los métodos habilitados en el
 * comercio (tarjetas, PSE, Nequi, Bancolombia, etc.).
 */
const ModalPagoWompi = ({ open, planId, onClose }: ModalPagoWompiProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [resumen, setResumen] = useState<ResumenCompra | null>(null);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const fetchResumen = async (id: number) => {
    setLoading(true);
    try {
      setResumen(await wompiPagosService.getResumen(id));
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al cargar el resumen de la compra.', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && planId) {
      setResumen(null);
      fetchResumen(planId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planId]);

  const handlePagar = async () => {
    if (!planId) return;

    setProcesando(true);
    try {
      const respuesta = await wompiPagosService.crearCheckout(planId);
      // Redirección al Checkout oficial de Wompi.
      window.location.href = construirUrlCheckout(respuesta.checkout);
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al iniciar el pago con Wompi.', {
        variant: 'error'
      });
      setProcesando(false);
    }
  };

  const metodos = resumen?.metodosPago?.length
    ? resumen.metodosPago
    : ['CARD', 'PSE', 'NEQUI', 'BANCOLOMBIA_TRANSFER'];

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[620px] top-[6%] p-4 max-h-[90vh] flex flex-col">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <KeenIcon icon="credit-cart" className="text-primary text-2xl" />
            Métodos de pago
          </ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear"
            onClick={onClose}
            disabled={procesando}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="overflow-y-auto grow flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
              <span className="spinner-border spinner-border-sm" />
              Cargando resumen de la compra...
            </div>
          ) : !resumen || !resumen.plan ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              No se pudo cargar el resumen de la compra.
            </p>
          ) : (
            <>
              {/* Información del pago */}
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <span className="font-semibold block mb-2 text-gray-900">Detalle de la compra</span>
                <div className="flex justify-between py-0.5">
                  <span>Plan seleccionado</span>
                  <strong className="text-gray-900">{resumen.plan.nombre}</strong>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Cantidad de mensajes</span>
                  <strong className="text-gray-900">
                    {formatearNumero(resumen.plan.cantidadMensajes)}
                  </strong>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Precio</span>
                  <strong className="text-gray-900">
                    {formatearPrecio(resumen.plan.precio, resumen.moneda)}
                  </strong>
                </div>
                {resumen.importes && resumen.importes.ivaPorcentaje > 0 && (
                  <>
                    <div className="flex justify-between py-0.5">
                      <span>Subtotal</span>
                      <span className="text-gray-900">
                        {formatearPrecio(resumen.importes.subtotal, resumen.moneda)}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>IVA ({resumen.importes.ivaPorcentaje}%)</span>
                      <span className="text-gray-900">
                        {formatearPrecio(resumen.importes.iva, resumen.moneda)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-0.5 border-t border-gray-200 mt-1 pt-1">
                  <span className="font-semibold">Total a pagar</span>
                  <strong className="text-primary">
                    {formatearPrecio(resumen.importes?.total ?? resumen.plan.precio, resumen.moneda)}
                  </strong>
                </div>
                {resumen.plan.descripcion && (
                  <div className="flex justify-between gap-4 py-0.5">
                    <span>Descripción</span>
                    <span className="text-end text-gray-900">{resumen.plan.descripcion}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <div className="flex justify-between py-0.5">
                    <span>Usuario comprador</span>
                    <strong className="text-gray-900">{resumen.usuario.nombre}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Correo</span>
                    <span className="text-gray-900">{resumen.usuario.email}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Empresa</span>
                    <strong className="text-gray-900">{resumen.empresa.nombre || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Métodos soportados por Wompi */}
              <div className="flex flex-col gap-1.5">
                <label className="form-label font-medium">Métodos disponibles en Wompi</label>
                <div className="flex flex-wrap gap-2">
                  {metodos.map((metodo) => (
                    <span key={metodo} className="badge badge-sm badge-light">
                      {ETIQUETA_METODO_WOMPI[metodo] ?? metodo}
                    </span>
                  ))}
                </div>
                <span className="text-2xs text-gray-500">
                  El método se elige dentro del checkout seguro de Wompi.
                </span>
              </div>

              {!resumen.wompiConfigurado && (
                <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
                  La pasarela Wompi no está configurada en el backend. Configure las llaves antes de
                  realizar pagos.
                </div>
              )}

              <div className="rounded-md border border-gray-200 bg-white p-3 text-2xs text-gray-500">
                Al confirmar será redirigido al checkout seguro de Wompi. Cuando el pago sea
                aprobado se creará automáticamente una solicitud con estado{' '}
                <strong>Pago realizado — Pendiente de aprobación</strong>; el Administrador VT es
                quien activa el plan.
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
                <button className="btn btn-sm btn-secondary" onClick={onClose} disabled={procesando}>
                  Cancelar
                </button>
                <button
                  className="btn btn-sm btn-primary flex items-center gap-1.5"
                  onClick={handlePagar}
                  disabled={procesando || !resumen.wompiConfigurado}
                >
                  {procesando ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Redirigiendo a Wompi...
                    </>
                  ) : (
                    <>
                      <KeenIcon icon="credit-cart" />
                      Pagar con Wompi
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalPagoWompi };

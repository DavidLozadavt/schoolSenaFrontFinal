import { Fragment, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components';
import {
  BADGE_ESTADO_WOMPI,
  ETIQUETA_ESTADO_WOMPI,
  ETIQUETA_METODO_WOMPI,
  WompiTransaccion,
  wompiPagosService
} from '@/services/wompiPagosService';

const formatearPrecio = (valor: string | number, moneda = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0
  }).format(Number(valor ?? 0));

const formatearFecha = (valor?: string | null) =>
  valor ? new Date(valor).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/**
 * Pantalla de retorno del Checkout de Wompi. Consulta el estado real de la
 * transacción y lo muestra al usuario. La activación del plan sigue dependiendo
 * de la aprobación del Administrador VT.
 */
const PagoResultadoPage = () => {
  const [searchParams] = useSearchParams();
  const [transaccion, setTransaccion] = useState<WompiTransaccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wompi devuelve `id` (transaction id); se admite también `reference`.
  const transactionId = searchParams.get('id') ?? undefined;
  const reference = searchParams.get('reference') ?? undefined;

  const consultar = async () => {
    setLoading(true);
    setError('');
    try {
      const respuesta = await wompiPagosService.confirmar({ id: transactionId, reference });
      setTransaccion(respuesta.transaccion);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo consultar el estado del pago.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!transactionId && !reference) {
      setError('La URL no incluye la transacción a consultar.');
      setLoading(false);
      return;
    }
    consultar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, reference]);

  return (
    <Fragment>
      <Container>
        <div className="card max-w-[640px] mx-auto mt-6">
          <div className="card-body flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Resultado del pago</h2>

            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-400">
                <span className="spinner-border spinner-border-sm" />
                Consultando el estado en Wompi...
              </div>
            ) : error ? (
              <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
                {error}
              </div>
            ) : transaccion ? (
              <>
                <div className="flex items-center gap-2">
                  <span className={`badge ${BADGE_ESTADO_WOMPI[transaccion.status]}`}>
                    {ETIQUETA_ESTADO_WOMPI[transaccion.status]} · {transaccion.status}
                  </span>
                  {transaccion.status === 'PENDING' && (
                    <button className="btn btn-xs btn-light" onClick={consultar}>
                      <KeenIcon icon="arrows-circle" />
                      Actualizar estado
                    </button>
                  )}
                </div>

                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  <div className="flex justify-between py-0.5">
                    <span>Referencia</span>
                    <strong className="text-gray-900">{transaccion.reference}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Transaction ID</span>
                    <strong className="text-gray-900">{transaccion.transactionId ?? '—'}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Método de pago</span>
                    <strong className="text-gray-900">
                      {transaccion.paymentMethodType
                        ? (ETIQUETA_METODO_WOMPI[transaccion.paymentMethodType] ??
                          transaccion.paymentMethodType)
                        : '—'}
                    </strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Valor</span>
                    <strong className="text-gray-900">
                      {formatearPrecio(transaccion.amount, transaccion.currency)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Fecha del pago</span>
                    <strong className="text-gray-900">{formatearFecha(transaccion.fechaPago)}</strong>
                  </div>
                  {transaccion.statusMessage && (
                    <div className="flex justify-between gap-4 py-0.5">
                      <span>Detalle</span>
                      <span className="text-end text-gray-900">{transaccion.statusMessage}</span>
                    </div>
                  )}
                </div>

                {transaccion.status === 'APPROVED' ? (
                  <div className="rounded-md border border-success/30 bg-success/5 p-3 text-sm text-gray-700">
                    <span className="block font-semibold text-success mb-0.5">
                      Pago aprobado — Pendiente de aprobación
                    </span>
                    Tu solicitud fue creada y quedó en revisión del Administrador VT. El plan se
                    activará y los mensajes se acreditarán cuando la apruebe.
                  </div>
                ) : transaccion.status === 'PENDING' ? (
                  <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-gray-700">
                    El pago aún está en proceso. Wompi notificará el resultado automáticamente; puedes
                    actualizar el estado en unos minutos.
                  </div>
                ) : (
                  <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-gray-700">
                    El pago no se completó. No se creó ninguna solicitud ni se acreditaron mensajes.
                    Puedes intentar la compra nuevamente.
                  </div>
                )}
              </>
            ) : null}

            <div className="flex justify-end">
              <Link to="/seguimiento-aspirantes" className="btn btn-sm btn-primary">
                Volver al sistema
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { PagoResultadoPage };

import React, { useState } from 'react';
import axios from 'axios';
import { FacturaSolicitudMock, EstadoFactura, FacturaDetalleMock, formatearPeso } from '../validacionSolicitudTypes';
import { SolicitudInscripcion } from '../solicitudInscripcionTypes';

interface PagoWompiInfo {
  metodo: string;
  referencia: string;
  transactionId?: string | null;
  fechaTransaccion?: string;
  estado: string;
  monto?: number;
  currency?: string;
}

interface Props {
  solicitud: SolicitudInscripcion;
  factura: FacturaSolicitudMock | null;
  documentosPago?: any[];
  pagoWompi?: PagoWompiInfo | null;
  onAprobado?: () => void;
  onRechazado?: () => void;
}

const estilosEstadoFactura: Record<EstadoFactura, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  PAGADA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  ANULADA: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  EN_PROCESO: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
};

/** Construye la URL pública del archivo subido desde el backend */
const buildFileUrl = (ruta: string): string => {
  // La ruta viene como "storage/comprobantes/archivo.pdf"
  // El backend corre en 127.0.0.1:8000
  const base = (axios.defaults.baseURL ?? 'http://127.0.0.1:8000/api')
    .replace(/\/api\/?$/, ''); // quitar el /api del final
  const rutaLimpia = ruta.startsWith('/') ? ruta.slice(1) : ruta;
  return `${base}/${rutaLimpia}`;
};

const Paso2RevisionPago = ({ solicitud, factura, documentosPago = [], pagoWompi = null, onAprobado, onRechazado }: Props) => {
  const [aprobando, setAprobando] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [observacionRechazo, setObservacionRechazo] = useState('');
  const [mostrarRechazoForm, setMostrarRechazoForm] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const comprobantes = documentosPago;

  const estadoFactura = (factura?.estadoFactura ?? '').toUpperCase();
  const facturaPagada = estadoFactura === 'PAGADA' || estadoFactura === 'PAGADO';
  const pagoConciliadoWompi = Boolean(pagoWompi?.estado === 'APROBADO' || (facturaPagada && pagoWompi));

  // Los botones solo si hay comprobante pendiente de revisión manual (no conciliado por WOMPI)
  const mostrarBotones =
    comprobantes.length > 0 &&
    !facturaPagada &&
    !pagoConciliadoWompi;

  const handleAprobarPago = async () => {
    if (!factura) return;
    setAprobando(true);
    setMensaje(null);
    try {
      const valorAbono = factura.saldoPendiente ?? factura.total;
      await axios.post(`facturas_academicas/${factura.idFactura}/registrar_pago`, {
        idMedioPago: 1,
        idTipoPago: 1,
        // Si el valor es 0, no enviarlo para evitar el error 422 del min:0.01 en Laravel
        valorAbono: valorAbono > 0 ? valorAbono : null,
        contexto: 'APROBACION_VALIDACION_ADMINISTRATIVA'
      });
      setMensaje({ tipo: 'success', texto: '✅ Pago aprobado correctamente. Avanzando al siguiente paso…' });
      setTimeout(() => {
        onAprobado?.();
      }, 1200);
    } catch (err: any) {
      let errorMsg = 'Error al aprobar el pago. Verifique e intente de nuevo.';
      if (err.response?.data?.errors) {
        // Concatenar todos los errores de validación devueltos por Laravel
        const errorsObj = err.response.data.errors;
        errorMsg = Object.values(errorsObj).flat().join(' | ');
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setMensaje({ tipo: 'error', texto: errorMsg });
    } finally {
      setAprobando(false);
    }
  };

  const handleRechazarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factura || !observacionRechazo.trim()) return;
    setRechazando(true);
    setMensaje(null);
    try {
      // Rechazar: registrar observación sin aprobar la factura
      await axios.post(`solicitudes_inscripcion/${factura.idFactura}/aprobar_validacion`, {
        observaciones: `RECHAZO_PAGO: ${observacionRechazo}`,
        rechazar: true
      });
      setMensaje({ tipo: 'success', texto: '⚠ Comprobante rechazado. El aspirante puede cargar uno nuevo. Avanzando…' });
      setMostrarRechazoForm(false);
      setTimeout(() => {
        onRechazado?.();
      }, 1200);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error ?? 'Error al rechazar el pago.';
      setMensaje({ tipo: 'error', texto: errorMsg });
    } finally {
      setRechazando(false);
    }
  };

  if (!factura) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">Revisión de pago</h3>
        <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-coal-400/50">
          <p className="text-sm text-gray-700 dark:text-gray-300">No hay factura asociada a esta solicitud.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">Revisión de pago</h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase">Paso 2 de 5</span>
      </div>

      {/* PAGO EN LÍNEA WOMPI (conciliado automáticamente) */}
      {pagoConciliadoWompi && pagoWompi && (
        <div className="p-5 border border-emerald-200 rounded-xl bg-emerald-50/60 space-y-3">
          <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider">Pago en línea confirmado (WOMPI)</h4>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Este pago fue conciliado automáticamente por el webhook de Wompi. No requiere aprobación manual.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-600">Método de pago</p>
              <p className="font-bold text-emerald-900">{pagoWompi.metodo}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-600">Referencia WOMPI</p>
              <p className="font-bold text-emerald-900 break-all">{pagoWompi.referencia}</p>
            </div>
            {pagoWompi.transactionId && (
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-600">ID transacción</p>
                <p className="font-bold text-emerald-900 break-all">{pagoWompi.transactionId}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-600">Fecha transacción</p>
              <p className="font-bold text-emerald-900">{pagoWompi.fechaTransaccion ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-600">Estado</p>
              <p className="font-bold text-emerald-900">{pagoWompi.estado}</p>
            </div>
          </div>
        </div>
      )}

      {/* ESTADO DEL COMPROBANTE */}
      <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
        <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Estado del comprobante de pago</h4>

        {comprobantes.length === 0 ? (
          <div className="p-4 border border-amber-200 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold leading-relaxed">
            {pagoConciliadoWompi
              ? 'No hay comprobante manual: el pago fue realizado y confirmado en línea vía WOMPI.'
              : '⚠ No se ha recibido comprobante de pago. El aspirante aún no ha subido ningún archivo.'}
          </div>
        ) : (
          <div className="space-y-3">
            {comprobantes.map((doc: any) => {
              const fileUrl = buildFileUrl(doc.ruta ?? '');
              const fileName = (doc.ruta ?? '').split('/').pop() ?? 'comprobante';
              const estadoDoc = doc.estado?.estado ?? doc.estado?.nombre ?? 'PENDIENTE';

              return (
                <div
                  key={doc.id}
                  className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 break-all">Archivo: {fileName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Fecha carga: {doc.fechaCarga ?? '—'} &nbsp;|&nbsp; Estado:{' '}
                      <span
                        className={
                          estadoDoc === 'APROBADO'
                            ? 'text-emerald-600'
                            : estadoDoc === 'RECHAZADO'
                              ? 'text-red-600'
                              : 'text-amber-600'
                        }
                      >
                        {estadoDoc}
                      </span>
                    </p>
                  </div>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    Ver archivo / Descargar
                  </a>
                </div>
              );
            })}

            {/* BOTONES APROBAR / RECHAZAR */}
            {mostrarBotones && (
              <div className="border-t border-slate-200/60 pt-4 flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAprobarPago}
                    disabled={aprobando || rechazando}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shrink-0"
                  >
                    {aprobando ? 'Procesando…' : '[ Aprobar pago ]'}
                  </button>
                  <button
                    onClick={() => setMostrarRechazoForm(!mostrarRechazoForm)}
                    disabled={aprobando || rechazando}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shrink-0"
                  >
                    [ Rechazar pago ]
                  </button>
                </div>

                {mostrarRechazoForm && (
                  <form
                    onSubmit={handleRechazarPago}
                    className="p-4 border border-red-100 rounded-xl bg-red-50/30 space-y-3 mt-1"
                  >
                    <p className="text-[10px] font-black text-red-800 uppercase">Especificar motivo del rechazo</p>
                    <textarea
                      required
                      rows={2}
                      value={observacionRechazo}
                      onChange={(e) => setObservacionRechazo(e.target.value)}
                      placeholder="Ej. El archivo no es legible o el monto no coincide."
                      className="w-full bg-white border border-red-200 rounded-xl p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={rechazando || !observacionRechazo.trim()}
                      className="bg-red-600 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider"
                    >
                      {rechazando ? 'Rechazando…' : 'Confirmar Rechazo'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {mensaje && (
          <div
            className={`p-4 rounded-xl text-xs font-bold leading-relaxed ${
              mensaje.tipo === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                : 'bg-red-50 text-red-800 border border-red-100'
            }`}
          >
            {mensaje.texto}
          </div>
        )}
      </div>

      {/* RESUMEN DE FACTURA */}
      <div className="space-y-4">
        {renderResumenFactura(factura)}
        {renderTablaDetalle(factura)}
      </div>
    </div>
  );
};

function renderResumenFactura(factura: FacturaSolicitudMock) {
  return (
    <div className="p-5 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase text-gray-500">Factura</span>
          <p className="text-lg font-black text-gray-900 dark:text-white">{factura.numeroFactura}</p>
        </div>
        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${estilosEstadoFactura[factura.estadoFactura]}`}>
          {factura.estadoFactura}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <span className="text-[10px] font-bold uppercase text-gray-500">Emisión</span>
          <p className="font-medium">{factura.fechaEmision}</p>
        </div>
        {factura.fechaVencimiento && (
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500">Vencimiento</span>
            <p className="font-medium">{factura.fechaVencimiento}</p>
          </div>
        )}
        {factura.idTransaccion != null && (
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500">Transacción</span>
            <p className="font-medium">#{factura.idTransaccion}</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-white/10 sm:grid-cols-4">
        <div>
          <span className="text-[10px] text-gray-500">Subtotal</span>
          <p className="font-semibold">{formatearPeso(factura.subtotal)}</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-500">Descuento</span>
          <p className="font-semibold">{formatearPeso(factura.descuento)}</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-500">Impuestos</span>
          <p className="font-semibold">{formatearPeso(factura.impuestos)}</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-500">Total</span>
          <p className="font-black text-primary">{formatearPeso(factura.total)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm">
        Saldo pendiente:{' '}
        <span className="font-black text-amber-700 dark:text-amber-300">{formatearPeso(factura.saldoPendiente)}</span>
      </p>
    </div>
  );
}

function renderTablaDetalle(factura: FacturaSolicitudMock) {
  if (!factura.detalles?.length) return null;
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl dark:border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] font-bold uppercase text-gray-500 bg-gray-100 dark:bg-coal-500">
            <th className="px-4 py-3">Concepto</th>
            <th className="px-4 py-3">Cant.</th>
            <th className="px-4 py-3">Valor unit.</th>
            <th className="px-4 py-3">Subtotal</th>
            <th className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
          {factura.detalles.map((d: FacturaDetalleMock) => (
            <tr key={d.idFacturaDetalle} className="bg-white dark:bg-coal-500">
              <td className="px-4 py-3">
                <span className="font-bold text-gray-900 dark:text-white">{d.concepto}</span>
                {d.descripcion && <span className="block text-xs text-gray-500">{d.descripcion}</span>}
              </td>
              <td className="px-4 py-3">{d.cantidad}</td>
              <td className="px-4 py-3">{formatearPeso(d.valorUnitario)}</td>
              <td className="px-4 py-3 font-semibold">{formatearPeso(d.subtotal)}</td>
              <td className="px-4 py-3">
                <span className="text-[10px] font-bold uppercase">{d.estado ?? '—'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Paso2RevisionPago;

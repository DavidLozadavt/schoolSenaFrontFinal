import { ChangeEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  claseEstadoPortal,
  formatearPesoPortal,
  PortalSeguimientoInscripcion
} from './seguimientoInscripcionTypes';
import {
  subirComprobanteSeguimiento,
  urlFacturaPdfSeguimiento
} from './seguimientoInscripcionApi';

interface Props {
  data: PortalSeguimientoInscripcion;
  token?: string | null;
  onActualizar?: (portal: PortalSeguimientoInscripcion) => void;
}

const PortalSeguimientoView = ({ data, token, onActualizar }: Props) => {
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const acciones = data.acciones ?? {};
  const tieneFactura = Boolean(data.numeroFactura) || data.totalPagar > 0;
  const puedeDescargar = acciones.puedeDescargarFactura ?? (tieneFactura && Boolean(token));
  const puedeSubir =
    acciones.puedeSubirComprobante ??
    (!data.facturaPagada &&
      !data.comprobantePendiente &&
      data.estadoInscripcion !== 'RECHAZADA' &&
      tieneFactura);
  const puedePagarEnLinea = acciones.puedePagarEnLinea ?? false;

  const handleArchivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo || !token) return;

    setSubiendo(true);
    setMensaje('');
    setError('');
    try {
      const res = await subirComprobanteSeguimiento(token, archivo);
      setMensaje(res.message);
      onActualizar?.(res.portal);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se pudo cargar el comprobante.';
      setError(msg);
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wide text-slate-900">
            Seguimiento de inscripción
          </h1>
          <p className="mt-1 text-sm text-slate-600">{data.nombreCompleto}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${claseEstadoPortal(data.estadoInscripcion)}`}
        >
          {data.estadoInscripcionEtiqueta ?? data.estadoInscripcion}
        </span>
      </div>

      {(data.mensajeEstado || data.observacionAdministrativa) && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            data.estadoInscripcion === 'RECHAZADA'
              ? 'border-red-200 bg-red-50 text-red-900'
              : data.estadoInscripcion === 'CORRECCION_SOLICITADA'
                ? 'border-orange-200 bg-orange-50 text-orange-900'
                : 'border-sky-200 bg-sky-50 text-sky-900'
          }`}
        >
          {data.mensajeEstado}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500">Programa</span>
          <p className="mt-1 text-sm font-bold text-slate-900">{data.nombrePrograma}</p>
          {data.jornada && <p className="text-xs text-slate-500">Jornada: {data.jornada}</p>}
          {data.periodoAcademico && (
            <p className="text-xs text-slate-500">Periodo: {data.periodoAcademico}</p>
          )}
          {data.fechaInscripcion && (
            <p className="text-xs text-slate-500">
              Inscripción:{' '}
              {new Date(data.fechaInscripcion).toLocaleDateString('es-CO', {
                dateStyle: 'medium'
              })}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500">Documento</span>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {data.tipoDocumento ?? 'CC'} {data.documento}
          </p>
          {data.email && <p className="text-xs text-slate-500">{data.email}</p>}
          {data.telefono && <p className="text-xs text-slate-500">{data.telefono}</p>}
        </div>
      </div>

      {data.tutor && (data.tutor.nombreCompleto || data.tutor.telefono) && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <h2 className="text-[10px] font-black uppercase text-sky-800">Acudiente</h2>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.tutor.nombreCompleto && (
              <p className="text-sm font-semibold text-slate-900">{data.tutor.nombreCompleto}</p>
            )}
            {data.tutor.parentesco && (
              <p className="text-xs text-slate-600">Parentesco: {data.tutor.parentesco}</p>
            )}
            {data.tutor.telefono && (
              <p className="text-xs text-slate-600">Teléfono: {data.tutor.telefono}</p>
            )}
          </div>
        </div>
      )}

      {(data.documentos ?? []).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-black uppercase text-slate-900">Documentos cargados</h2>
          <ul className="mt-3 space-y-2">
            {data.documentos!.map((doc, i) => (
              <li key={i}>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold uppercase text-primary hover:underline"
                >
                  {doc.titulo ?? 'Documento'}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tieneFactura && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-black uppercase text-slate-900">Información de pago</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Factura</span>
              <p className="text-sm font-bold">{data.numeroFactura ?? '—'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Total</span>
              <p className="text-sm font-bold">{formatearPesoPortal(data.totalPagar)}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Pagado</span>
              <p className="text-sm font-bold">{formatearPesoPortal(data.valorPagado ?? 0)}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Saldo pendiente</span>
              <p className="text-sm font-bold text-primary">
                {formatearPesoPortal(data.saldoPendiente)}
              </p>
            </div>
          </div>

          {data.fechaLimitePago && (
            <p className="mt-3 text-xs text-amber-700">
              Fecha límite de pago:{' '}
              {new Date(data.fechaLimitePago + 'T12:00:00').toLocaleDateString('es-CO')}
            </p>
          )}

          {(data.conceptos ?? []).length > 0 && (
            <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
              {data.conceptos!.map((c, i) => (
                <li key={i} className="flex justify-between px-3 py-2 text-sm">
                  <span>{c.concepto ?? 'Concepto'}</span>
                  <span className="font-semibold">{formatearPesoPortal(c.valor)}</span>
                </li>
              ))}
            </ul>
          )}

          {puedeDescargar && token && (
            <a
              href={urlFacturaPdfSeguimiento(token)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase text-primary"
            >
              Descargar factura PDF
            </a>
          )}
        </div>
      )}

      {!data.facturaPagada && tieneFactura && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-black uppercase text-slate-900">Pago en efectivo / transferencia</h2>
            <p className="mt-2 text-xs text-slate-600">
              Realice su pago y cargue el comprobante (PDF, JPG o PNG). El área administrativa lo revisará.
            </p>

            {data.comprobantePendiente && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Su comprobante está en revisión. Le notificaremos cuando sea aprobado.
              </div>
            )}

            {data.ultimoComprobante?.estado === 'RECHAZADO' && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                Comprobante rechazado
                {data.ultimoComprobante.observacion_revision
                  ? `: ${data.ultimoComprobante.observacion_revision}`
                  : '.'}{' '}
                Puede cargar uno nuevo.
              </div>
            )}

            {mensaje && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {mensaje}
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            {puedeSubir && token && (
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase text-white disabled:opacity-50">
                {subiendo ? 'Subiendo…' : 'Cargar comprobante'}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={subiendo}
                  onChange={handleArchivo}
                />
              </label>
            )}

            {puedeSubir && !token && (
              <p className="mt-3 text-xs text-amber-700">
                Para cargar comprobantes use el enlace enviado a su correo electrónico.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
            <h2 className="text-sm font-black uppercase text-slate-900">Pagar en línea</h2>
            <p className="mt-2 text-xs text-slate-500">
              Próximamente podrá pagar con los siguientes métodos:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(data.pagosEnLinea ?? []).map((metodo) => (
                <button
                  key={metodo.codigo}
                  type="button"
                  disabled={!metodo.disponible || !puedePagarEnLinea}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold uppercase text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Disponible próximamente"
                >
                  {metodo.nombre}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {data.facturaPagada && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
          {data.mensajeEstado ??
            'Su pago fue registrado correctamente. El proceso de inscripción continuará con el área académica.'}
        </div>
      )}

      <p className="text-center text-xs text-slate-500">
        <Link to="/seguimiento-inscripcion" className="font-bold uppercase text-primary">
          Nueva consulta
        </Link>
      </p>
    </div>
  );
};

export default PortalSeguimientoView;

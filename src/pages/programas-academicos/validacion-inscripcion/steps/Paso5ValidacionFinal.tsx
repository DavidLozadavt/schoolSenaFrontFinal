import { ValidacionSolicitudPayload } from '../validacionSolicitudTypes';
import { formatearPeso } from '../validacionSolicitudTypes';

interface Props {
  payload: ValidacionSolicitudPayload;
  observaciones: string;
  onObservacionesChange: (value: string) => void;
}

const Paso5ValidacionFinal = ({ payload, observaciones, onObservacionesChange }: Props) => (
  <div className="space-y-4">
    <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">Validación final</h3>
    <p className="text-xs text-gray-600 dark:text-gray-400">
      Revise el resumen del proceso. Al finalizar se imprimirá el payload en consola (maqueta, sin
      guardar en servidor).
    </p>

    <div className="p-5 space-y-3 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <span className="text-gray-500">Solicitud</span>
        <span className="font-bold">#{payload.idSolicitud}</span>
        <span className="text-gray-500">Estudiante</span>
        <span className="font-bold">
          {payload.estudiante?.nombreCompleto ?? `#${payload.idEstudiante}`}
        </span>
        {payload.estudiante && (
          <>
            <span className="text-gray-500">Documento</span>
            <span className="font-bold">
              {payload.estudiante.tipoDocumento} {payload.estudiante.documento}
            </span>
          </>
        )}
        <span className="text-gray-500">Factura</span>
        <span className="font-bold">{payload.numeroFactura ?? 'N/A'}</span>
        <span className="text-gray-500">Estado factura</span>
        <span className="font-bold">{payload.estadoFactura ?? '—'}</span>
        <span className="text-gray-500">Total factura</span>
        <span className="font-bold text-primary">{formatearPeso(payload.totalFactura)}</span>
        <span className="text-gray-500">Pago revisado</span>
        <span className="font-bold">{payload.pagoRevisado ? 'Sí' : 'No'}</span>
        <span className="text-gray-500">Pago registrado</span>
        <span className="font-bold">{payload.pagoRegistrado ? 'Sí' : 'No'}</span>
        <span className="text-gray-500">Medio pago</span>
        <span className="font-bold">{payload.medioPagoSeleccionado?.nombre ?? '—'}</span>
      </div>

      {payload.facturaDetalles.length > 0 && (
        <div className="pt-3 border-t border-gray-100 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-gray-500">Detalle factura</span>
          <ul className="mt-2 space-y-1 text-xs">
            {payload.facturaDetalles.map((d) => (
              <li key={d.idFacturaDetalle}>
                {d.concepto} — {formatearPeso(d.subtotal)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    <label className="block">
      <span className="text-[10px] font-bold uppercase text-gray-500">Observaciones finales</span>
      <textarea
        value={observaciones}
        onChange={(e) => onObservacionesChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 mt-1 text-sm border border-gray-200 rounded-lg dark:bg-coal-400 dark:border-white/10"
        placeholder="Opcional"
      />
    </label>
  </div>
);

export default Paso5ValidacionFinal;

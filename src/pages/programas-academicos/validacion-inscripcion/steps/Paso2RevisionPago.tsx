import { FacturaSolicitudMock, EstadoFactura } from '../mockFacturaSolicitud';
import { SolicitudInscripcionMock } from '../mockSolicitudesInscripcion';
import { formatearPeso } from '../validacionSolicitudTypes';

interface Props {
  solicitud: SolicitudInscripcionMock;
  factura: FacturaSolicitudMock | null;
}

const estilosEstadoFactura: Record<EstadoFactura, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  PAGADA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  ANULADA: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  EN_PROCESO: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
};

const Paso2RevisionPago = ({ solicitud, factura }: Props) => {
  const sinCobro = !solicitud.requierePago || !factura || !factura.requierePago;

  if (sinCobro) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">
          Revisión de pago
        </h3>
        <div className="p-5 border border-emerald-200 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 dark:border-emerald-500/30">
          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
            Esta solicitud no requiere pago.
          </p>
          <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-300">
            No hay factura asociada para cobro. Puede continuar al siguiente paso sin registrar pago.
          </p>
        </div>
      </div>
    );
  }

  if (factura.estadoFactura === 'PAGADA') {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">
          Revisión de pago
        </h3>
        <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10">
          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
            La factura ya se encuentra pagada.
          </p>
          <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
            Puede continuar sin registrar un nuevo pago en el paso de matrícula.
          </p>
        </div>
        {renderResumenFactura(factura)}
        {renderTablaDetalle(factura)}
      </div>
    );
  }

  if (factura.estadoFactura === 'EN_PROCESO') {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">Revisión de pago</h3>
        <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/80 dark:bg-blue-500/10">
          <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
            La factura tiene un pago en proceso.
          </p>
          <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
            Revise el estado antes de continuar. No se habilitará registro de pago hasta que quede pendiente.
          </p>
        </div>
        {renderResumenFactura(factura)}
        {renderTablaDetalle(factura)}
      </div>
    );
  }

  if (factura.estadoFactura === 'ANULADA') {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">Revisión de pago</h3>
        <div className="p-4 border border-red-200 rounded-xl bg-red-50/80 dark:bg-red-500/10">
          <p className="text-sm font-bold text-red-900 dark:text-red-200">La factura está anulada.</p>
          <p className="mt-1 text-xs text-red-800 dark:text-red-300">
            Puede continuar la validación sin registrar pago en el paso de matrícula.
          </p>
        </div>
        {renderResumenFactura(factura)}
        {renderTablaDetalle(factura)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">Revisión de pago</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Revise la factura generada para esta solicitud antes de continuar al registro de pago.
      </p>
      {renderResumenFactura(factura)}
      {renderTablaDetalle(factura)}
      <p className="text-xs text-amber-800 dark:text-amber-300">
        Saldo pendiente: <span className="font-bold">{formatearPeso(factura.saldoPendiente)}</span>.
        En el paso 4 podrá registrar el pago con medio y tipo de pago.
      </p>
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
        <span
          className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${estilosEstadoFactura[factura.estadoFactura]}`}
        >
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
        <span className="font-black text-amber-700 dark:text-amber-300">
          {formatearPeso(factura.saldoPendiente)}
        </span>
      </p>
    </div>
  );
}

function renderTablaDetalle(factura: FacturaSolicitudMock) {
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
          {factura.detalles.map((d) => (
            <tr key={d.idFacturaDetalle} className="bg-white dark:bg-coal-500">
              <td className="px-4 py-3">
                <span className="font-bold text-gray-900 dark:text-white">{d.concepto}</span>
                {d.descripcion && (
                  <span className="block text-xs text-gray-500">{d.descripcion}</span>
                )}
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

import { KeenIcon } from '@/components';

interface PaymentSelectorProps {
  tiposPago: any[];
  mediosPago: any[];
  tipoPagoSeleccionado: number | null;
  medioPagoSeleccionado: number | null;
  onTipoPagoChange: (id: number) => void;
  onMedioPagoChange: (id: number) => void;
  variant?: 'venta' | 'redencion';
}

const PaymentSelector = ({
  tiposPago,
  mediosPago,
  tipoPagoSeleccionado,
  medioPagoSeleccionado,
  onTipoPagoChange,
  onMedioPagoChange,
  variant = 'venta'
}: PaymentSelectorProps) => {
  const isRedencion = variant === 'redencion';
  const colorScheme = isRedencion ? 'green' : 'blue';

  return (
    <div className="rounded-xl shadow-sm p-4 space-y-4 border border-gray-100">
      <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
        <KeenIcon icon="credit-card" className="w-4 h-4" />
        {isRedencion ? 'Detalles de Pago' : '3️⃣ Detalles de Pago'}
      </h3>

      <p className="text-xs text-gray-500">
        Selecciona el método de pago para completar la {isRedencion ? 'redención' : 'venta'}.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo de Pago */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <KeenIcon icon="credit-card" className="w-3 h-3" />
            Tipo de Pago *
          </label>
          <select
            value={tipoPagoSeleccionado || ''}
            onChange={(e) => onTipoPagoChange(Number(e.target.value))}
            className={`input p-2 border rounded-md w-full focus:ring-2 transition-all ${
              isRedencion
                ? 'focus:ring-green-500 focus:border-green-500'
                : 'focus:ring-blue-500 focus:border-blue-500'
            } ${!tipoPagoSeleccionado ? 'border-gray-300' : `border-${colorScheme}-300`}`}
          >
            <option value="">Seleccione tipo de pago</option>
            {tiposPago.map((t) => (
              <option key={t.id} value={t.id}>
                {t.detalleTipoPago}
              </option>
            ))}
          </select>
          {!tipoPagoSeleccionado && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <KeenIcon icon="information-2" className="w-3 h-3" />
              Campo requerido
            </p>
          )}
        </div>

        {/* Medio de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 items-center gap-1">
            {/* <KeenIcon icon="wallet" className="w-3 h-3" /> */}
            Medio de Pago *
          </label>
          <select
            value={medioPagoSeleccionado || ''}
            onChange={(e) => onMedioPagoChange(Number(e.target.value))}
            className={`input p-2 border rounded-md w-full focus:ring-2 transition-all ${
              isRedencion
                ? 'focus:ring-green-500 focus:border-green-500'
                : 'focus:ring-blue-500 focus:border-blue-500'
            } ${!medioPagoSeleccionado ? 'border-gray-300' : `border-${colorScheme}-300`}`}
          >
            <option value="">Seleccione medio</option>
            {mediosPago.map((m) => (
              <option key={m.id} value={m.id}>
                {m.detalleMedioPago}
              </option>
            ))}
          </select>
          {!medioPagoSeleccionado && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <KeenIcon icon="information-2" className="w-3 h-3" />
              Campo requerido
            </p>
          )}
        </div>
      </div>

      {/* Indicador de completitud */}
      {tipoPagoSeleccionado && medioPagoSeleccionado && (
        <div
          className={`${
            isRedencion ? ' ' : ' '
          } border rounded-lg p-3 flex items-center gap-2`}
        >
          <KeenIcon icon="check-circle" className={`w-4 h-4 ${isRedencion ? 'text-green-600' : 'text-blue-600'}`} />
          <p className={`text-xs ${isRedencion ? 'text-green-700' : 'text-blue-700'} font-medium`}>
            ✓ Método de pago configurado correctamente
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentSelector;
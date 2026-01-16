import { useState, useEffect } from 'react';
import { KeenIcon } from '@/components';

interface Pago {
  valor: number;
  idMedioPago: number;
}

interface MixedPaymentSelectorProps {
  mediosPago: any[];
  tiposPago: any[];
  tipoPagoSeleccionado: number | null;
  valorTotal: number;
  onTipoPagoChange: (id: number) => void;
  onPagosChange: (pagos: Pago[] | null, medioPagoSimple?: number | null) => void;
  variant?: 'venta' | 'redencion';
}

const MixedPaymentSelector = ({
  mediosPago,
  tiposPago,
  tipoPagoSeleccionado,
  valorTotal,
  onTipoPagoChange,
  onPagosChange,
  variant = 'venta'
}: MixedPaymentSelectorProps) => {
  const [pagoMixto, setPagoMixto] = useState(false);
  const [pagos, setPagos] = useState<Pago[]>([{ valor: 0, idMedioPago: 0 }]);
  const [medioPagoSimple, setMedioPagoSimple] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  const isRedencion = variant === 'redencion';
  const colorScheme = isRedencion ? 'green' : 'blue';

  const totalPagado = pagos.reduce((sum, p) => sum + (Number(p.valor) || 0), 0);
  const diferencia = valorTotal - totalPagado;
  const pagoCompleto = Math.abs(diferencia) < 0.01; 
  useEffect(() => {
    if (!initialized && mediosPago.length > 0 && !medioPagoSimple) {
      const efectivo = mediosPago.find(
        (m) => m.detalleMedioPago?.toLowerCase() === 'efectivo'
      );
      if (efectivo) {
        setMedioPagoSimple(efectivo.id);
      }
      setInitialized(true);
    }
  }, [mediosPago, initialized, medioPagoSimple]);

  useEffect(() => {
    if (pagoMixto && pagos.length > 0) {
      const pagosValidos = pagos.filter(p => p.idMedioPago > 0 && p.valor > 0);
      if (pagosValidos.length === pagos.length && pagoCompleto) {
        onPagosChange(pagos, null);
      } else {
        onPagosChange(null, null);
      }
    } else if (!pagoMixto && medioPagoSimple) {
      onPagosChange(null, medioPagoSimple);
    } else {
      onPagosChange(null, null);
    }
  }, [pagoMixto, pagos, medioPagoSimple, pagoCompleto]);

  const agregarPago = () => {
    const valorRestante = valorTotal - totalPagado;
    setPagos([...pagos, { valor: valorRestante > 0 ? valorRestante : 0, idMedioPago: 0 }]);
  };

  const eliminarPago = (index: number) => {
    if (pagos.length > 1) {
      setPagos(pagos.filter((_, i) => i !== index));
    }
  };

  const actualizarPago = (index: number, campo: 'valor' | 'idMedioPago', valor: any) => {
    const nuevosPagos = [...pagos];
    
    if (campo === 'valor') {
      const nuevoValor = Number(valor) || 0;
      const totalOtrosPagos = pagos.reduce((sum, p, i) => {
        if (i !== index) {
          return sum + (Number(p.valor) || 0);
        }
        return sum;
      }, 0);
      
      const valorMaximo = valorTotal - totalOtrosPagos;
      const valorFinal = Math.min(nuevoValor, valorMaximo);
      
      nuevosPagos[index] = {
        ...nuevosPagos[index],
        valor: valorFinal
      };
    } else {
      nuevosPagos[index] = {
        ...nuevosPagos[index],
        [campo]: valor
      };
    }
    
    setPagos(nuevosPagos);
  };

  const togglePagoMixto = () => {
    const nuevoEstado = !pagoMixto;
    setPagoMixto(nuevoEstado);
    
    if (nuevoEstado) {
      // Al activar pago mixto, inicializar con un pago
      setPagos([{ valor: valorTotal, idMedioPago: medioPagoSimple || 0 }]);
      setMedioPagoSimple(null);
    } else {
      // Al desactivar, limpiar
      setPagos([{ valor: 0, idMedioPago: 0 }]);
      setMedioPagoSimple(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-CO').format(value);
  };

  const parseFormattedNumber = (value: string) => {
    return Number(value.replace(/\./g, '').replace(/,/g, '.'));
  };

  return (
    <div className="rounded-xl shadow-sm p-4 space-y-4 border border-gray-100">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
          <KeenIcon icon="credit-card" className="w-4 h-4" />
          {isRedencion ? 'Detalles de Pago' : '3️⃣ Detalles de Pago'}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Pago Mixto</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={pagoMixto}
              onChange={togglePagoMixto}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none  rounded-full  peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Valor Total */}
      <div className="rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900">Valor Total a Pagar:</span>
          <span className="text-lg font-bold text-blue-600">{formatCurrency(valorTotal)}</span>
        </div>
      </div>

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
      </div>

      {/* Pago Simple */}
      {!pagoMixto && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            Medio de Pago *
          </label>
          <select
            value={medioPagoSimple || ''}
            onChange={(e) => setMedioPagoSimple(Number(e.target.value))}
            className={`input p-2 border rounded-md w-full focus:ring-2 transition-all ${
              isRedencion
                ? 'focus:ring-green-500 focus:border-green-500'
                : 'focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            <option value="">Seleccione medio</option>
            {mediosPago.map((m) => (
              <option key={m.id} value={m.id}>
                {m.detalleMedioPago}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Pagos Mixtos */}
      {pagoMixto && (
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Medios de Pago *
            </label>
            <button
              type="button"
              onClick={agregarPago}
              className="btn btn-sm btn-light flex items-center gap-1"
              disabled={pagos.length >= 5}
            >
              {/* <KeenIcon icon="plus" className="w-3 h-3" /> */}
              Agregar Pago
            </button>
          </div>

          <div className="space-y-2">
            {pagos.map((pago, index) => (
              <div key={index} className=" p-3 rounded-lg border border-g-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Pago {index + 1}
                  </span>
                  {pagos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarPago(index)}
                      className="ml-auto btn btn-xs btn-icon btn-light text-red-600 "
                      title="Eliminar pago"
                    >
                      <KeenIcon icon="trash" className="w-4 h-3 mt-3" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Valor *</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={pago.valor > 0 ? formatNumber(pago.valor) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\./g, '');
                        actualizarPago(index, 'valor', rawValue);
                      }}
                      className="input input-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Medio *</label>
                    <select
                      value={pago.idMedioPago || ''}
                      onChange={(e) => actualizarPago(index, 'idMedioPago', Number(e.target.value))}
                      className="select select-sm w-full"
                    >
                      <option value="">Seleccionar</option>
                      {mediosPago.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.detalleMedioPago}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="bg-gray-100 rounded-lg p-3 space-y-2 border border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Pagado:</span>
              <span className={`text-base font-bold ${pagoCompleto ? 'text-green-600' : 'text-orange-600'}`}>
                {formatCurrency(totalPagado)}
              </span>
            </div>
            {!pagoCompleto && diferencia !== 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                <span className="text-sm font-medium text-gray-700">
                  {diferencia > 0 ? 'Falta por pagar:' : 'Exceso:'}
                </span>
                <span className={`text-base font-bold ${diferencia > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                  {formatCurrency(Math.abs(diferencia))}
                </span>
              </div>
            )}
            {pagoCompleto && (
              <div className="flex items-center justify-center gap-2 text-green-600 pt-2 border-t border-gray-300">
                <KeenIcon icon="check-circle" className="w-5 h-5" />
                <span className="text-sm font-semibold">✓ Pago completo</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Indicador de completitud */}
      {((pagoMixto && pagoCompleto) || (!pagoMixto && medioPagoSimple)) && tipoPagoSeleccionado && (
        <div className={`flex items-center gap-2 text-${colorScheme}-600  border border-${colorScheme}-200 rounded-md p-3`}>
          <KeenIcon icon="check-circle" className="w-4 h-4" />
          <span className="text-sm font-medium">
            Información de pago completa
          </span>
        </div>
      )}
    </div>
  );
};

export default MixedPaymentSelector;

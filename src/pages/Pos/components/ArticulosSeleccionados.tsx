import { useState } from 'react';
import { ItemSeleccionado } from '../models/ProductoModel';
import { Container, KeenIcon } from '@/components';
import PagoModal from './PagoModal';
import { Cliente } from '../models/ClienteModel';
import { ModalVentasPendientes } from './ModalVentasPendientes';
import { GastosModal } from './GastosModal';

interface Props {
  articulos: ItemSeleccionado[];
  eliminarArticulo: (id: number) => void;
  actualizarCantidad: (id: number, cantidad: number) => void;
  cliente: Cliente | null;
  idPunto?: number;
  idShoppingCart: number | null;
  ventasPendientes: number;
  onPagoExitoso: () => void;
  onVentaSeleccionada: (venta: any) => void;
  onNuevaCompra: () => void;
}

const ArticulosSeleccionados = ({
  articulos,
  eliminarArticulo,
  actualizarCantidad,
  cliente,
  idPunto,
  idShoppingCart,
  onPagoExitoso,
  ventasPendientes,
  onVentaSeleccionada,
  onNuevaCompra
}: Props) => {
  const [aplicarIVA, setAplicarIVA] = useState(false);
  const [showModalPago, setShowModalPago] = useState(false);
  const [showVentasPendientes, setShowVentasPendientes] = useState(false);
  const [showModalGastos, setShowModalGastos] = useState(false);

  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const handleSelectVenta = (venta: any) => {
    setVentaSeleccionada(venta);
    setShowVentasPendientes(false);
    onVentaSeleccionada(venta);
  };

  const handleModalPagoClose = () => {
    setShowModalPago(false);
  };
  const handleTipoPagoModalOpen = () => {
    setShowModalPago(true);
  };

  const handleVentasPendientesOpen = () => {
    setShowVentasPendientes(true);
  };
  const handleVentasPendientesClose = () => {
    setShowVentasPendientes(false);
  };
  const totalSinIVA = articulos.reduce((total, item) => {
    if (item.tipo === 'producto') {
      return total + item.producto.producto.valorVenta * item.cantidad;
    } else {
      return total + item.valorUnitario * item.cantidad;
    }
  }, 0);

  const IVA = aplicarIVA ? totalSinIVA * 0.19 : 0;
  const totalConIVA = totalSinIVA + IVA;

  return (
    <div className="card w-full p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Artículos Seleccionados</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <span>Aplicar IVA (19%)</span>
          <input
            type="checkbox"
            checked={aplicarIVA}
            onChange={() => setAplicarIVA(!aplicarIVA)}
            className="sr-only"
          />
          <div
            className={`w-7 h-4 flex items-center rounded-full p-0.5 duration-300 ease-in-out ${
              aplicarIVA ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`bg-white w-3.5 h-3 rounded-full shadow-md transform duration-300 ease-in-out ${
                aplicarIVA ? 'translate-x-2.5' : ''
              }`}
            />
          </div>
        </label>
      </div>

      {articulos.length === 0 ? (
        <div className="mb-4 mt-2 text-sm text-center text-gray-500">
          No se han agregado productos ni servicios.
        </div>
      ) : (
        <>
          <table className="w-full mb-4 text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Nombre</th>
                <th className="p-2 border">Valor Unitario</th>
                <th className="p-2 border">Cantidad</th>
                <th className="p-2 border">Subtotal</th>
                <th className="p-2 border">Acción</th>
              </tr>
            </thead>
            <tbody>
              {articulos.map((item) => {
                const id = item.tipo === 'producto' ? item.producto.id : item.id;
                const nombre =
                  item.tipo === 'producto' ? item.producto.producto.caracteristicas : item.nombre;
                const valorUnitario = Number(
                  item.tipo === 'producto' ? item.producto.producto.valorVenta : item.valorUnitario
                );

                const subtotal = valorUnitario * item.cantidad;


                const cantidadMaxima = item.tipo === 'producto' ? item.producto.cantidad : Infinity;
                const puedeIncrementar = item.cantidad < cantidadMaxima;

                return (
                  <tr key={`${item.tipo}-${id}`}>
                    <td className="p-2 border">{nombre}</td>
                    <td className="p-2 border">
                      {valorUnitario.toLocaleString('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </td>

                    <td className="p-2 border">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => actualizarCantidad(id, Math.max(1, item.cantidad - 1))}
                          className="px-2 py-1 text-white bg-gray-500 rounded hover:bg-gray-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="min-w-[3rem] text-center">
                          {item.cantidad}
                          {item.tipo === 'producto' && (
                            <span className="text-xs text-gray-500"> / {cantidadMaxima}</span>
                          )}
                        </span>
                        <button
                          onClick={() => {
                            if (puedeIncrementar) {
                              actualizarCantidad(id, item.cantidad + 1);
                            }
                          }}
                          disabled={!puedeIncrementar}
                          className={`px-2 py-1 text-white rounded transition-colors ${
                            puedeIncrementar
                              ? 'bg-gray-500 hover:bg-gray-600 cursor-pointer'
                              : 'bg-gray-300 cursor-not-allowed'
                          }`}
                          title={
                            !puedeIncrementar ? 'Stock máximo alcanzado' : 'Incrementar cantidad'
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="p-2 border">
                      {subtotal.toLocaleString('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </td>
                    <td className="p-2 text-center border">
                      <button
                        onClick={() => eliminarArticulo(id)}
                        className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                      >
                        <KeenIcon icon="trash" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mb-4 space-y-1 text-sm text-right">
            <div>
              <strong>Total sin IVA:</strong>{' '}
              {totalSinIVA.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
            <div>
              <strong>IVA (19%):</strong>{' '}
              {IVA.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
            <div>
              <strong>Total con IVA:</strong>{' '}
              {totalConIVA.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
        </>
      )}

      <div className="space-y-2 mt-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowModalGastos(true)}
            className="px-3 py-2 text-sm text-white rounded bg-cyan-600 hover:bg-cyan-700 transition-colors"
          >
            <KeenIcon icon="pencil" /> Registrar Gastos
          </button>

          <button
            disabled={ventasPendientes === 0}
            onClick={handleVentasPendientesOpen}
            className={`px-3 py-2 text-sm rounded text-white transition-colors
              ${
                ventasPendientes === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-600'
              }`}
          >
            <KeenIcon icon="time" /> Pendientes ({ventasPendientes})
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onNuevaCompra}
            className="flex-1 px-3 py-3 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
          >
            <KeenIcon icon="handcart" /> Nueva compra
          </button>

          <button
            onClick={handleTipoPagoModalOpen}
            disabled={articulos.length === 0}
            className={`flex-[2] px-3 py-3 text-base font-bold text-white rounded transition-colors flex items-center justify-center gap-2
              ${
                articulos.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 shadow-md'
              }`}
          >
            <KeenIcon icon="dollar" /> <span> Pagar</span>
            <span>
              {totalConIVA.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </span>
          </button>
        </div>
      </div>

      <Container>
        <PagoModal
          cliente={cliente}
          open={showModalPago}
          onClose={handleModalPagoClose}
          montoTotal={totalConIVA}
          idPunto={idPunto}
          idShoppingCart={idShoppingCart}
          onSuccess={onPagoExitoso}
        />

        <ModalVentasPendientes
          open={showVentasPendientes}
          onClose={handleVentasPendientesClose}
          onSelectVenta={handleSelectVenta}
        />

        <GastosModal
          open={showModalGastos}
          onClose={() => setShowModalGastos(false)}
          idPunto={idPunto}
          // onSelectVenta={handleSelectVenta}
        />
      </Container>
    </div>
  );
};

export { ArticulosSeleccionados };

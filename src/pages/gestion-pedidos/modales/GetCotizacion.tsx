import React from 'react';
import { X, Package, User, MapPin, Phone, Mail, AlertTriangle } from 'lucide-react';

// 🔥 Nuevo nombre para evitar conflicto con el Cotizacion global
interface CotizacionView {
  idCotizacion: string;
  cliente?: {
    nombre1?: string;
    nombre2?: string;
    apellido1?: string;
    apellido2?: string;
    direccion?: string;
    celular?: string;
    email?: string;
  };
  detalles?: any[] | any;
}

interface GetCotizacionProps {
  open: boolean;
  cotizacion: CotizacionView | null;
  onClose: () => void;
}

const GetCotizacion: React.FC<GetCotizacionProps> = ({ open, cotizacion, onClose }) => {
  if (!open || !cotizacion) return null;

  // Asegurar que detalles sea un array
  const detalles = Array.isArray(cotizacion.detalles)
    ? cotizacion.detalles
    : cotizacion.detalles
    ? [cotizacion.detalles]
    : [];

  const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-6 h-6 flex items-center justify-center text-neutral-700 dark:text-neutral-200">
      {children}
    </div>
  );

  // ---- Funciones de Totales ----
  const getTotalPeso = () =>
    detalles.reduce((total: number, item: any) => {
      const unidad = item.producto?.medida?.unidadMedida?.toLowerCase() || '';
      const esKg = ['kg', 'kilogramo', 'kilogramos'].includes(unidad);

      if (esKg) {
        const pesoUnit = Number(item.producto?.medida?.valor || 0);
        return total + pesoUnit * Number(item.cantidad);
      }
      return total;
    }, 0);

  const getTotalGanancia = () =>
    detalles.reduce((total: number, item: any) => {
      const compra = Number(item.producto?.ultimoHistorialPrecio?.valorCompra || 0);
      const venta = Number(item.producto?.ultimoHistorialPrecio?.ValorVenta || 0);
      return total + (venta - compra) * Number(item.cantidad);
    }, 0);

  const getTotalVenta = () =>
    detalles.reduce((total: number, item: any) => {
      const valor = Number(item.producto?.valorVenta || 0);
      return total + Number(item.cantidad) * valor;
    }, 0);

  const productosConStockInsuficiente = detalles.filter((item: any) => {
    const stock = Number(item.producto?.cantidad ?? 0);
    const requerida = Number(item.cantidad ?? 0);
    return stock < requerida;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 relative border border-neutral-300 dark:border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          className="absolute top-4 right-4 p-1 rounded-full text-neutral-700 dark:text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Título */}
        <h2 className="text-3xl font-bold mb-5 flex items-center gap-3">
          <IconWrapper>
            <Package className="w-6 h-6" />
          </IconWrapper>
          Cotización #{cotizacion.idCotizacion}
        </h2>

        {/* Datos del cliente */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <IconWrapper>
              <User />
            </IconWrapper>
            <strong>Cliente:</strong>{' '}
            {`${cotizacion.cliente?.nombre1 || ''} ${cotizacion.cliente?.nombre2 || ''} ${cotizacion.cliente?.apellido1 || ''} ${cotizacion.cliente?.apellido2 || ''}`.trim() || 'No disponible'}
          </div>

          <div className="flex items-center gap-2">
            <IconWrapper>
              <MapPin />
            </IconWrapper>
            <strong>Dirección:</strong> {cotizacion.cliente?.direccion || 'Sin dirección'}
          </div>

          <div className="flex items-center gap-2">
            <IconWrapper>
              <Phone />
            </IconWrapper>
            <strong>Teléfono:</strong> {cotizacion.cliente?.celular || 'N/A'}
          </div>

          <div className="flex items-center gap-2">
            <IconWrapper>
              <Mail />
            </IconWrapper>
            <strong>Correo:</strong> {cotizacion.cliente?.email || 'No disponible'}
          </div>
        </div>

        {/* TABLA DE DETALLES */}
        <div className="overflow-x-auto rounded-lg">
          <table className="table-auto w-full border border-neutral-300 dark:border-neutral-700">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr className="text-center">
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Marca</th>
                <th className="px-3 py-2">Medida</th>
                <th className="px-3 py-2">Cant.</th>
                <th className="px-3 py-2">Precio Unit.</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Dist. Producto</th>
              </tr>
            </thead>

            <tbody>
              {detalles.map((item: any, idx: number) => (
                <tr
                  key={idx}
                  className="text-center even:bg-neutral-50 dark:even:bg-neutral-900 odd:bg-white dark:odd:bg-neutral-800"
                >
                  <td>{item.producto?.caracteristicas}</td>
                  <td>{item.producto?.marca?.nombre}</td>
                  <td>
                    {item.producto?.medida?.valor} {item.producto?.medida?.unidadMedida}
                  </td>
                  <td>{item.cantidad}</td>
                  <td>
                    {Number(item.valorUnitario).toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    })}
                  </td>
                  <td>
                    {(Number(item.cantidad) * Number(item.valorUnitario)).toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    })}
                  </td>
                  <td>{item.producto?.cantidad ?? 0}</td>
                </tr>
              ))}
            </tbody>

            <tfoot className="bg-neutral-100 dark:bg-neutral-800 font-bold text-right">
              <tr>
                <td colSpan={6} className="px-2 py-2">Total Peso:</td>
                <td className="px-2 py-2">{getTotalPeso()} kg</td>
              </tr>

              <tr>
                <td colSpan={6} className="px-2 py-2">Ganancia Total:</td>
                <td className="px-2 py-2">
                  {getTotalGanancia().toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                  })}
                </td>
              </tr>

              <tr>
                <td colSpan={6} className="px-2 py-2">Total Venta:</td>
                <td className="px-2 py-2">
                  {getTotalVenta().toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ALERTAS DE STOCK */}
        {productosConStockInsuficiente.length > 0 && (
          <div className="mt-6 space-y-2">
            {productosConStockInsuficiente.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-400 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>
                  El producto <strong>{item.producto?.caracteristicas}</strong> requiere{' '}
                  <strong>{item.cantidad}</strong> unidades, pero solo hay{' '}
                  <strong>{item.producto?.cantidad || 0}</strong> en stock.
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GetCotizacion;

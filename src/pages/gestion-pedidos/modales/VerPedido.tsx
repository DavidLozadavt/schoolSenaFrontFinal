import React from 'react';
import { User, MapPin, Phone, Mail, Package, X } from 'lucide-react';

interface Tercero {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

interface Asignacion {
  cantidad: number;
  valorUnitario: number;
  producto?: {
    caracteristicas: string;
    marca?: { nombre: string };
    medida?: { valor: number; unidadMedida: string };
    cantidadDistribucionesAceptadas?: number;
  };
}

interface Pedido {
  id: number;
  tercero: Tercero;
  updated_at: string;
  origen: string;
  estado: string;
  asignaciones: Asignacion[];
}

interface VerPedidoProps {
  open: boolean;
  pedido: Pedido | null;
  onClose: () => void;
}

const VerPedido: React.FC<VerPedidoProps> = ({ open, pedido, onClose }) => {
  if (!open || !pedido) return null;

  const getTotalVenta = () =>
    pedido.asignaciones.reduce((total, item) => total + item.cantidad * item.valorUnitario, 0);

  const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-6 h-6 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-all duration-200">
      {children}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-neutral-900/80 flex justify-center items-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative border border-neutral-300 dark:border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          className="absolute top-4 right-4 p-1 rounded-full text-neutral-700 dark:text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Encabezado */}
        <h2 className="text-3xl font-bold mb-5 text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
          <IconWrapper>
            <Package className="w-6 h-6" />
          </IconWrapper>
          Pedido #{pedido.id}
        </h2>

        {/* Información del cliente */}
        <div className="space-y-3 mb-6 text-neutral-900 dark:text-neutral-100">
          <p className="flex items-center gap-2">
            <IconWrapper>
              <User className="w-5 h-5" />
            </IconWrapper>
            <strong>Cliente:</strong> {pedido.tercero.nombre}
          </p>
          <p className="flex items-center gap-2">
            <IconWrapper>
              <MapPin className="w-5 h-5" />
            </IconWrapper>
            <strong>Dirección:</strong> {pedido.tercero.direccion || 'No disponible'}
          </p>
          <p className="flex items-center gap-2">
            <IconWrapper>
              <Phone className="w-5 h-5" />
            </IconWrapper>
            <strong>Teléfono:</strong> {pedido.tercero.telefono || 'No disponible'}
          </p>
          <p className="flex items-center gap-2">
            <IconWrapper>
              <Mail className="w-5 h-5" />
            </IconWrapper>
            <strong>Correo:</strong> {pedido.tercero.email || 'No disponible'}
          </p>
        </div>

        {/* Tabla de productos */}
        <div className="overflow-x-auto rounded-lg">
          <table className="table-auto w-full border border-neutral-300 dark:border-neutral-700">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
              <tr className="text-center">
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Marca</th>
                <th className="px-3 py-2">Medida</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2">Precio Unitario</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {pedido.asignaciones.map((item, idx) => (
                <tr
                  key={idx}
                  className="text-center even:bg-neutral-50 dark:even:bg-neutral-900 odd:bg-white dark:odd:bg-neutral-800"
                >
                  <td className="px-2 py-1">{item.producto?.caracteristicas}</td>
                  <td className="px-2 py-1">{item.producto?.marca?.nombre}</td>
                  <td className="px-2 py-1">
                    {item.producto?.medida?.valor} {item.producto?.medida?.unidadMedida}
                  </td>
                  <td className="px-2 py-1">{item.cantidad}</td>
                  <td className="px-2 py-1">
                    {item.valorUnitario.toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    })}
                  </td>
                  <td className="px-2 py-1">
                    {(item.cantidad * item.valorUnitario).toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-bold text-right bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
              <tr>
                <td colSpan={5} className="text-right px-2 py-2">
                  Total Venta:
                </td>
                <td className="px-2 py-2">
                  {getTotalVenta().toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VerPedido;

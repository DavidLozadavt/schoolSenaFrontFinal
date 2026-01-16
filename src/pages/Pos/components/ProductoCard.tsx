import { ProductoItem } from '../models/ProductoModel';
import { ShoppingCart, AlertTriangle } from 'lucide-react';

interface Props {
  item: ProductoItem;
  onAgregar: (item: ProductoItem) => void;
  tieneStockBajo?: boolean;
}

const ProductoCard = ({ item, onAgregar, tieneStockBajo = false }: Props) => {
  const producto = item.producto;
  const precio = producto.ultimoHistorialPrecio?.ValorVenta ?? producto.valorVenta;
  const puedeAgregar = !!precio;

  return (
    <div className="flex flex-col justify-between p-3 text-center transition-shadow duration-200 border shadow-sm rounded-2xl hover:shadow-md h-70 relative">
      {/* Badge de stock bajo */}
      {tieneStockBajo && (
        <div className="absolute top-2 right-2 z-10">
          <span className="badge badge-warning badge-sm flex items-center gap-1 shadow-md">
            <AlertTriangle className="w-3 h-3" />
            Bajo Stock
          </span>
        </div>
      )}

      <div className="w-full aspect-square">
        <img
          src={producto.rutaProductoUrl}
          alt={producto.caracteristicas}
          className="object-cover w-full h-full rounded-xl"
        />
      </div>

      <h3 className="mt-2 text-base font-semibold text-gray-800 truncate">
        {producto.caracteristicas}
      </h3>

      <div className="text-sm text-gray-600 mt-1">
        <p>
          <span className="font-medium text-gray-700">Valor:</span>{' '}
          {precio
            ? Number(precio).toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })
            : 'No configurado'}
        </p>
        <p>
          <span className="font-medium text-gray-700">Cantidad:</span> {item.cantidad}
        </p>
      </div>

      <button
        disabled={!puedeAgregar}
        onClick={() => onAgregar(item)}
        className={`mt-2 w-full flex items-center justify-center gap-2 py-1.5 rounded-xl font-semibold text-sm transition-colors duration-300 ${
          puedeAgregar
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <ShoppingCart className="w-4 h-4" />
        Agregar
      </button>
    </div>
  );
};

export { ProductoCard };

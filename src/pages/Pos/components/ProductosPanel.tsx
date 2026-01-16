import { useEffect, useState } from 'react';
import axios from 'axios';
import { ProductoItem, ItemSeleccionado } from '../models/ProductoModel';
import { ProductoCard } from './ProductoCard';
import { Cliente } from '../models/ClienteModel';
import { useSnackbar } from 'notistack';

interface ProductosPanelProps {
  idPunto?: any;
  cliente: Cliente | null;
  agregarArticulo: (item: ItemSeleccionado) => void;
  articulos: ItemSeleccionado[];
  eliminarArticulo: (id: number) => void;
  actualizarCantidad: (id: number, cantidad: number) => void;
  idShoppingCart: number | null;
  setIdShoppingCart: (id: number | null) => void;
  ventasPendientes: number;
  setVentasPendientes: (count: number) => void;
  recargarProductos: boolean;
}

const ProductosPanel = ({
  idPunto,
  cliente,
  agregarArticulo,
  idShoppingCart,
  setIdShoppingCart,
  setVentasPendientes,
  recargarProductos
}: ProductosPanelProps) => {
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [filtro, setFiltro] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(true);
  const [productosStockBajo, setProductosStockBajo] = useState<number[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchVentasPendientes = async () => {
    try {
      const response = await axios.get('count_shoppingcart_productos_pos');
      setVentasPendientes(response.data);
    } catch (error) {
      console.log(error);
    } finally {
    }
  };

  const handleAgregarProducto = async (producto: ProductoItem) => {
    const payload = {
      idTercero: cliente?.id || null,
      idProducto: producto.producto.id,
      cantidad: 1,
      valor: producto.producto.valorVenta,
      ivaActivo: false,
      idShoppingCart: idShoppingCart
    };

    try {
      const { data } = await axios.post('store_shoppingcart_producto', payload);

      if (!idShoppingCart && data.shoppingCart?.id) {
        setIdShoppingCart(data.shoppingCart.id);
        // localStorage.setItem('idShoppingCart', data.shoppingCart.id);
      }

      enqueueSnackbar('Producto agregado correctamente', { variant: 'success' });
      fetchVentasPendientes();
      agregarArticulo({
        tipo: 'producto',
        producto,
        cantidad: 1,
        idAsignacion: data.asignacion?.id
      });
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.error) {
        enqueueSnackbar(error.response.data.error, { variant: 'error' });
      } else {
        enqueueSnackbar('Error al agregar producto al carrito', { variant: 'error' });
      }
      console.error('Error al guardar en el carrito:', error);
    }
  };

  const productosPorPagina = 6;

  useEffect(() => {
    if (!idPunto) return;
    setLoading(true);
    fetchVentasPendientes();

    // Fetch productos normales
    axios
      .get<ProductoItem[]>(`get_productos_punto_venta/${idPunto}`)
      .then((res) => setProductos(res.data))
      .catch((err) => console.error('Error al cargar productos', err))
      .finally(() => setLoading(false));

    // Fetch productos con stock bajo
    axios
      .get<any[]>(`get_stock_minimo_punto_venta/${idPunto}`)
      .then((res) => {
        // Extraer los IDs de productos con stock bajo
        const idsStockBajo = res.data.map((item) => item.idProducto || item.producto?.id);
        setProductosStockBajo(idsStockBajo);
      })
      .catch((err) => console.error('Error al cargar productos con stock bajo', err));
  }, [idPunto, recargarProductos]);

  const productosFiltrados = productos.filter((item) =>
    item.producto.caracteristicas.toLowerCase().includes(filtro.toLowerCase())
  );

  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
  const paginaSegura = Math.min(Math.max(1, paginaActual), totalPaginas);
  const indexUltimo = paginaSegura * productosPorPagina;
  const indexPrimero = indexUltimo - productosPorPagina;
  const productosPaginados = productosFiltrados.slice(indexPrimero, indexUltimo);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="md:col-span-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Productos</h2>
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full py-2 pl-10 pr-4 border rounded input input-sm"
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value);
                setPaginaActual(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-500">
            <svg className="w-6 h-6 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Cargando productos...
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="p-4 border rounded min-h-[150px] text-center text-gray-500">
            No se encontraron productos.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productosPaginados.map((item) => (
                <ProductoCard
                  key={item.id}
                  item={item}
                  onAgregar={handleAgregarProducto}
                  tieneStockBajo={productosStockBajo.includes(item.producto.id)}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                  className={`flex items-center gap-1 px-3 py-1 rounded border transition ${
                    paginaActual === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:bg-blue-100 text-green-600 border-grey-500'
                  }`}
                >
                  <span>⬅</span>
                  <span>Anterior</span>
                </button>

                {[...Array(totalPaginas)].map((_, index) => {
                  const numero = index + 1;
                  const esActual = numero === paginaActual;
                  return (
                    <button
                      key={numero}
                      onClick={() => setPaginaActual(numero)}
                      className={`px-3 py-1 border rounded ${
                        esActual
                          ? 'bg-green-500 text-white font-semibold'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {numero}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className={`flex items-center gap-1 px-3 py-1 rounded border transition ${
                    paginaActual === totalPaginas
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:bg-blue-100 text-green-500 border-grey-500'
                  }`}
                >
                  <span>Siguiente</span>
                  <span>➡</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export { ProductosPanel };

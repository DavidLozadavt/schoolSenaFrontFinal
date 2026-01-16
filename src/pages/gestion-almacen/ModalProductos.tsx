import React, { useEffect, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { KeenIcon } from '@/components';

interface Props {
  open: boolean;
  almacen: any;
  onClose: () => void;
}

interface Producto {
  id: number;
  cantidad: number;

  producto: {
    id: number;
    caracteristicas: string;
    valorVenta: number;
    rutaProductoUrl: string;
  };
}

const ModalProductos = ({ open, almacen, onClose }: Props) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [seleccionados, setSeleccionados] = useState<{ producto: Producto; cantidad: number }[]>(
    []
  );
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [almacenDestino, setAlmacenDestino] = useState('');
  const [numeroRegistros, setNumeroRegistros] = useState(10);

  useEffect(() => {
    if (almacen?.id && open) {
      cargarProductos();
      cargarAlmacenes();
    }
  }, [almacen, open]);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`get_productos_almacen/${almacen.id}`);
      const data = Array.isArray(resp.data) ? resp.data : resp.data?.data || [];
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarAlmacenes = async () => {
    try {
      const resp = await axios.get('almacenes');
      const data = Array.isArray(resp.data) ? resp.data : resp.data?.data || [];
      setAlmacenes(data);
    } catch (error) {
      console.error('Error cargando almacenes:', error);
    }
  };

  const agregar = (producto: Producto) => {
    if ((producto.cantidad ?? 0) <= 0) return;

    setProductos((prev) =>
      prev.map((p: any) =>
        p.id === producto.id ? { ...p, cantidad: Math.max((p.cantidad ?? 0) - 1, 0) } : p
      )
    );

    setSeleccionados((prev) => {
      const found = prev.find((p) => p.producto.id === producto.id);

      if (found) {
        return prev.map((p) =>
          p.producto.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }

      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const disminuir = (id: number) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad: (p.cantidad ?? 0) + 1 } : p))
    );

    setSeleccionados((prev) =>
      prev
        .map((p) => (p.producto.id === id ? { ...p, cantidad: p.cantidad - 1 } : p))
        .filter((p) => p.cantidad > 0)
    );
  };

  const eliminar = (id: number) => {
    const prod = seleccionados.find((p) => p.producto.id === id);

    if (prod) {
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, cantidad: (p.cantidad ?? 0) + prod.cantidad } : p))
      );
    }

    setSeleccionados((prev) => prev.filter((p) => p.producto.id !== id));
  };

  const totalProductos = seleccionados.reduce((a, b) => a + b.cantidad, 0);

  const enviarNumeroRegistros = (value: string) => {
    setNumeroRegistros(Number(value));
  };

  // ✅ FILTRO POR CARACTERISTICAS
  const productosFiltrados = productos
    .filter((producto) =>
      producto.producto?.caracteristicas?.toLowerCase().includes(busqueda.toLowerCase())
    )
    .slice(0, numeroRegistros);

  const enviarProductos = async () => {
    if (!almacenDestino || seleccionados.length === 0) {
      alert('Seleccione un almacén destino');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        idAlmacenOrigen: Number(almacen.id),
        idAlmacen: Number(almacenDestino),
        productos: seleccionados.map((s) => ({
          idProducto: Number(s.producto.producto.id),
          caracteristicas: s.producto.producto.caracteristicas,
          cantidad: Number(s.cantidad)
        }))
      };
      const resp = await axios.post('send_productos_almacen', payload);

      enqueueSnackbar('Producto enviado con exito.', { variant: 'success' });

      setSeleccionados([]);
      setAlmacenDestino('');
      setBusqueda('');

      cargarProductos();
      onClose();
    } catch (error: any) {
      console.error('ERROR AL ENVIAR =====>', error?.response?.data || error);
      alert(error?.response?.data?.message || '❌ Error al enviar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      // 🔄 Limpiar todo al cerrar el modal
      setSeleccionados([]);
      setBusqueda('');
      setAlmacenDestino('');
      setNumeroRegistros(10);
      setProductos([]);
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[1200px] top-[5%] p-4 relative">
        <ModalHeader>
          <ModalTitle className="text-lg font-bold">Gestión de Productos</ModalTitle>

          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-3 px-0 py-5">
          <div className="grid grid-cols-12 gap-6">
            {/* ================== PRODUCTOS ================== */}
            <div className="col-span-8">
              <div className="p-1 mb-2">
                <div className="flex flex-col">
 
                  <div className="relative flex items-center w-full">
                    <KeenIcon
                      icon="magnifier"
                      className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
                    />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      className="pl-8 input w-full"
                      value={busqueda}
                      onChange={(e) => {
                        setBusqueda(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <svg className="animate-spin h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24">
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="font-medium">Cargando productos...</p>
                </div>
              ) : productosFiltrados.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-bold mb-2">Este almacén no tiene productos</p>
                  <p className="text-sm">Intenta seleccionar otro almacén o revisa el inventario</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-5 mb-6">
                    {productosFiltrados.map((p) => (
                      <div
                        key={p.id}
                        className="group border rounded-xl p-5 flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Product Image */}
                        <div className="relative rounded-lg mb-4 overflow-hidden">
                          <img
                            src={
                              p.producto?.rutaProductoUrl ||
                              'https://via.placeholder.com/200x200.png?text=Producto'
                            }
                            alt={p.producto?.caracteristicas || 'Producto'}
                            className="h-40 w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>

                        {/* Product Info */}
                        <h4 className="font-bold text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                          {p.producto?.caracteristicas}
                        </h4>

                        <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                          {p.cantidad ?? 0} en stock
                        </p>

                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-base font-bold">
                            {p.producto?.valorVenta
                              ? new Intl.NumberFormat('es-CO', {
                                  style: 'currency',
                                  currency: 'COP',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(p.producto.valorVenta)
                              : 'N/A'}
                          </p>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={() => agregar(p)}
                          disabled={(p.cantidad ?? 0) <= 0}
                          className="mt-auto border py-2.5 rounded-lg text-sm font-semibold hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
                        >
                          <svg
                            className="w-5 h-5 transition-transform group-hover:rotate-90"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Agregar a la lista
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between rounded-xl p-4 border">
                    <div className="text-sm">
                      Mostrando <span className="font-bold">{productosFiltrados.length}</span> de{' '}
                      <span className="font-bold">
                        {
                          productos.filter((producto) =>
                            producto.producto?.caracteristicas
                              ?.toLowerCase()
                              .includes(busqueda.toLowerCase())
                          ).length
                        }
                      </span>{' '}
                      productos
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm mr-2">Productos por página:</span>
                      <div className="flex gap-1">
                        {[10, 15, 20, 25].map((num) => (
                          <button
                            key={num}
                            onClick={() => enviarNumeroRegistros(String(num))}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                              numeroRegistros === num ? 'font-bold shadow-md' : 'hover:shadow-sm'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ================== SELECCIONADOS ================== */}
            <div className="col-span-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="  p-4 border-b border-gray-200 ">
                  <h3 className="font-bold text-base">Productos Seleccionados</h3>
                </div>

                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 ">
                      <tr className="border-b border-gray-200 ">
                        <th className="p-3 text-left font-semibold">Producto</th>
                        <th className="p-3 text-center font-semibold w-24">Cantidad</th>
                        <th className="p-3 text-center font-semibold w-32">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {seleccionados.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-12 text-gray-400">
                            <div className="flex flex-col items-center gap-2">
                              <svg
                                className="w-12 h-12 opacity-50"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                              </svg>
                              <span className="text-sm">No hay productos seleccionados</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {seleccionados.map((s, idx) => (
                        <tr
                          key={s.producto.id}
                          className={`border-b border-gray-100  transition-colors ${
                            idx % 2 === 0 ? ' ' : ''
                          }`}
                        >
                          <td className="p-3">
                            <p className="font-medium text-sm line-clamp-2">
                              {s.producto.producto.caracteristicas}
                            </p>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full font-semibold border border-gray-200 ">
                              {s.cantidad}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => disminuir(s.producto.id)}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                                title="Disminuir cantidad"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 12H4"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => eliminar(s.producto.id)}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                                title="Eliminar producto"
                              >
                                <svg
                                  className="w-4 h-4 text-red-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-gray-200 space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg border border-gray-200 ">
                    <span className="font-sm">Total de Productos:</span>
                    <span className="text-sm font-bold">{totalProductos}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Almacén de Destino</label>
                    <select
                      className="select"
                      value={almacenDestino}
                      onChange={(e) => setAlmacenDestino(e.target.value)}
                    >
                      <option value="">Seleccione el destino</option>
                      {almacenes.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.almacen || a.nombreAlmacen || `Almacén ${a.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={enviarProductos}
                    disabled={!almacenDestino || seleccionados.length === 0 || loading}
                    className="w-full btn btn-primary disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed font-semibold py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Enviando...
                      </span>
                    ) : (
                      'Enviar Productos'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalProductos;

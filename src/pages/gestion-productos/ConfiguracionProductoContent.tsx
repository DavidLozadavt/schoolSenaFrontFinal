import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import { useConfirm } from '@/hooks';
import ModalEditarProducto from './EditarProductos';
import HistorialProducto from './HistorialProducto';
import ModalCrearProducto from './ModalCrearProducto';

interface ProductoInterface {
  id: number;
  rutaProductoUrl?: string;
  caracteristicas?: string;
  tipoProducto?: { nombreTipoProducto: string };
  medida?: { valor: number; unidadMedida: string };
  totalDistribuido?: number;
  estado?: 'PUBLICO' | 'PRIVADO';
  ultimoHistorialPrecio?: {
    valorCompra?: number;
    ValorVenta?: number;
    porcentajeUtilidad?: number;
  };
  nombreProducto?: string;
  valorCompra?: number;
  valorVenta?: number;
  porcentajeUtilidad?: number;
  imagen?: string | undefined;
  isNew?: boolean;
}

interface contentProps {
  reload: boolean;
}

const ConfiguracionProductoContent = ({ reload }: contentProps) => {
  const [productos, setProductos] = useState<ProductoInterface[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageActual, setPageActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [perPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const { confirmAction } = useConfirm();

  const paginasCargadas = useRef<number[]>([]);

  const [productoEditar, setProductoEditar] = useState<ProductoInterface | null>(null);
  const [productoHistorial, setProductoHistorial] = useState<ProductoInterface | null>(null);
  // Estado para mostrar mensaje temporal en lugar de abrir el modal de creación
  const [mensajeCrearVisible, setMensajeCrearVisible] = useState(false);
  const [modalCrearOpen, setModalCrearOpen] = useState(false);

  const [editando, setEditando] = useState<{ id: number; campo: string } | null>(null);
  const [valorTemporal, setValorTemporal] = useState<string | number>('');

  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);

  const formatoCOP = (valor: number | undefined) =>
    valor
      ? valor.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
        })
      : '$0';

  // 🔹 Cargar productos
  const fetchProductos = useCallback(
    async ({
      append = false,
      reset = false,
      page
    }: { append?: boolean; reset?: boolean; page?: number } = {}) => {
      setLoading(true);
      try {
        const pageToLoad = page ?? (reset ? 1 : pageActual);
        const response = await axios.get(
          `products_by_tipo_producto?search=${encodeURIComponent(searchTerm)}&per_page=${perPage}&page=${pageToLoad}`
        );

        const data = response.data.data || [];
        const meta = response.data;

        const productosNormalizados = data.map((p: ProductoInterface) => ({
          ...p,
          valorCompra: p.valorCompra ?? p.ultimoHistorialPrecio?.valorCompra ?? 0,
          valorVenta: p.valorVenta ?? p.ultimoHistorialPrecio?.ValorVenta ?? 0,
          porcentajeUtilidad:
            p.porcentajeUtilidad ?? p.ultimoHistorialPrecio?.porcentajeUtilidad ?? 0
        }));

        setTotalPaginas(meta.last_page || 1);
        setTotalRegistros(meta.total || data.length);

        setProductos((prev) => {
          if (reset) return productosNormalizados;
          if (append) {
            const nuevos = productosNormalizados.filter(
              (nuevo: ProductoInterface) => !prev.some((p) => p.id === nuevo.id)
            );
            return [...prev, ...nuevos];
          }
          return productosNormalizados;
        });

        if (!paginasCargadas.current.includes(pageToLoad)) {
          paginasCargadas.current.push(pageToLoad);
        }
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, pageActual, perPage]
  );

  const refrescarManteniendoPaginas = useCallback(async () => {
    if (paginasCargadas.current.length === 0) return;
    setLoading(true);
    try {
      const nuevosProductos: ProductoInterface[] = [];
      for (const p of paginasCargadas.current) {
        const response = await axios.get(
          `products_by_tipo_producto?search=${encodeURIComponent(searchTerm)}&per_page=${perPage}&page=${p}`
        );
        const data = response.data.data || [];
        const productosNormalizados = data.map((prod: ProductoInterface) => ({
          ...prod,
          valorCompra: prod.valorCompra ?? prod.ultimoHistorialPrecio?.valorCompra ?? 0,
          valorVenta: prod.valorVenta ?? prod.ultimoHistorialPrecio?.ValorVenta ?? 0,
          porcentajeUtilidad:
            prod.porcentajeUtilidad ?? prod.ultimoHistorialPrecio?.porcentajeUtilidad ?? 0
        }));
        nuevosProductos.push(...productosNormalizados);
      }
      setProductos(nuevosProductos);
    } catch (error) {
      console.error('Error recargando productos:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, perPage]);

  useEffect(() => {
    paginasCargadas.current = [];
    fetchProductos({ reset: true });
  }, []);

  useEffect(() => {
    setPageActual(1);
    paginasCargadas.current = [];
    fetchProductos({ reset: true });
  }, [searchTerm]);

  useEffect(() => {
    if (pageActual > 1 && !paginasCargadas.current.includes(pageActual)) {
      fetchProductos({ append: true });
    }
  }, [pageActual]);

  const handleCampoChange = async (id: number, campo: 'valorCompra' | 'valorVenta', valor: any) => {
    const productoActual = productos.find((p) => p.id === id);
    if (!productoActual) return;

    const valorFinal =
      valor === '' || valor === null ? (productoActual[campo] ?? 0) : Number(valor);

    try {
      await axios.put(`/producto/editar-campos/${id}`, {
        valorCompra: campo === 'valorCompra' ? valorFinal : (productoActual.valorCompra ?? 0),
        valorVenta: campo === 'valorVenta' ? valorFinal : (productoActual.valorVenta ?? 0)
      });

      setProductos((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                [campo]: valorFinal
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error actualizando campo:', error);
    }
  };

  // 🔹 Manejo de ordenamiento
  const handleSort = (campo: string) => {
    setSorting((prev) => {
      if (!prev || prev.id !== campo) {
        return { id: campo, desc: false };
      }
      if (!prev.desc) {
        return { id: campo, desc: true };
      }
      return null;
    });
  };

  const productosOrdenados = useMemo(() => {
    if (!sorting) return productos;
    const sorted = [...productos];
    sorted.sort((a, b) => {
      const campo = sorting.id as keyof ProductoInterface;
      const valA = Number(a[campo] ?? 0);
      const valB = Number(b[campo] ?? 0);
      return sorting.desc ? valB - valA : valA - valB;
    });
    return sorted;
  }, [productos, sorting]);

  // 🔹 Celda editable
  const EditableCell = ({
    value,
    rowId,
    campo,
    formatoMoneda = false
  }: {
    value: any;
    rowId: number;
    campo: string;
    formatoMoneda?: boolean;
  }) => {
    const isEditing = editando?.id === rowId && editando?.campo === campo;
    const mostrarValor = formatoMoneda ? formatoCOP(Number(value || 0)) : (value ?? 0);

    return (
      <div
        className={`relative group cursor-pointer ${
          isEditing ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
        } rounded-md transition`}
        onClick={() => {
          if (!isEditing) {
            setEditando({ id: rowId, campo });
            setValorTemporal(value ?? 0);
          }
        }}
      >
        {isEditing ? (
          <input
            type="number"
            autoFocus
            value={valorTemporal}
            onChange={(e) => setValorTemporal(e.target.value)}
            onBlur={() => {
              setEditando(null);
              handleCampoChange(rowId, campo as 'valorCompra' | 'valorVenta', valorTemporal);
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring focus:ring-blue-200 bg-gray-100"
          />
        ) : (
          <div className="flex items-center justify-between px-2 py-1">
            <span>{mostrarValor}</span>
            <KeenIcon
              icon="notepad-edit"
              className="text-gray-400 opacity-0 group-hover:opacity-100 transition duration-200 text-xs"
            />
          </div>
        )}
      </div>
    );
  };

  // 🔹 Columnas tabla
  const columns = useMemo<ColumnDef<ProductoInterface>[]>(
    () => [
      {
        id: 'cantidad',
        header: () => (
          <div
            className="flex items-center justify-center gap-1 cursor-pointer select-none"
            onClick={() => handleSort('totalDistribuido')}
          >
            <span>Cantidad</span>
            {sorting?.id === 'totalDistribuido' && (
              <KeenIcon
                icon={sorting.desc ? 'arrow-down' : 'arrow-up'}
                className="text-xs text-blue-500"
              />
            )}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center font-semibold text-blue-600">
            {row.original.totalDistribuido ?? 0}
          </div>
        ),
        meta: { className: 'w-[80px]' }
      },
      {
        id: 'imagen',
        header: () => 'Imagen',
        cell: (info) => (
          <div className="flex justify-center">
            <img
              src={info.row.original.rutaProductoUrl || info.row.original.imagen}
              alt="Producto"
              className="w-20 h-20 object-cover rounded"
            />
          </div>
        ),
        meta: { className: 'w-[100px]' }
      },
      {
        id: 'medida',
        header: () => 'Medida',
        cell: (info) => {
          const m = info.row.original.medida;
          return <span>{m ? `${m.valor} ${m.unidadMedida}` : '-'}</span>;
        }
      },
      {
        id: 'producto',
        header: () => 'Producto',
        accessorFn: (row) => row.caracteristicas || row.nombreProducto || '',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <span>{info.row.original.caracteristicas || info.row.original.nombreProducto}</span>
            {info.row.original.isNew && (
              <span className="text-xs px-2 py-0.5 rounded border border-green-200 bg-gradient-to-r from-green-100 to-green-50 shadow-sm text-green-800">
                Recién creado
              </span>
            )}
          </div>
        )
      },
      {
        id: 'tipoProducto',
        header: () => 'Tipo Producto',
        cell: (info) => <span>{info.row.original.tipoProducto?.nombreTipoProducto || '-'}</span>
      },
      {
        id: 'valorCompra',
        header: () => (
          <div
            className="flex items-center justify-center gap-1 cursor-pointer select-none"
            onClick={() => handleSort('valorCompra')}
          >
            <span>V. Compra / U.</span>
            {sorting?.id === 'valorCompra' && (
              <KeenIcon
                icon={sorting.desc ? 'arrow-down' : 'arrow-up'}
                className="text-xs text-blue-500"
              />
            )}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center font-medium">
            {formatoCOP(Number(row.original.valorCompra ?? 0))}
          </div>
        )
      },
      {
        id: 'valorVenta',
        header: () => (
          <div
            className="flex items-center justify-center gap-1 cursor-pointer select-none"
            onClick={() => handleSort('valorVenta')}
          >
            <span>V. Venta / U.</span>
            {sorting?.id === 'valorVenta' && (
              <KeenIcon
                icon={sorting.desc ? 'arrow-down' : 'arrow-up'}
                className="text-xs text-blue-500"
              />
            )}
          </div>
        ),
        cell: ({ row }) => (
          <EditableCell
            value={row.original.valorVenta}
            rowId={row.original.id}
            campo="valorVenta"
            formatoMoneda
          />
        )
      },
      {
        id: 'acciones',
        header: () => 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              title="Actualizar"
              className="btn btn-sm btn-icon btn-light btn-primary"
              onClick={() => setProductoEditar(row.original)}
            >
              <KeenIcon icon="notepad-edit" className="text-blue-500" />
            </button>

            <button
              title="Historial de precios"
              className="btn btn-sm btn-icon btn-light btn-success"
              onClick={() => setProductoHistorial(row.original)}
            >
              <KeenIcon icon="chart-line" className="text-green-500" />
            </button>
          </div>
        )
      }
    ],
    [editando, valorTemporal, sorting]
  );

  return (
    <>
      <div className="card card-grid min-w-full">
        <div className="card-header flex-wrap py-5">
          <h3 className="card-title">Configuración de Productos</h3>
          <div className="flex gap-6 flex-wrap items-center">
            <div className="relative">
              <KeenIcon
                icon="magnifier"
                className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
              />
              <input
                type="text"
                placeholder="Buscar producto..."
                className="input input-sm pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* <button
              className="btn btn-sm btn-primary flex items-center gap-2"
              onClick={() => setModalCrearOpen(true)}
            >
              <KeenIcon icon="plus" />
              Crear producto
            </button> */}
          </div>
        </div>

        <div className="card-body">
          {loading && pageActual === 1 ? (
            <div className="text-center py-10 text-gray-500">Cargando productos...</div>
          ) : (
            <>
              <DataGrid
                key={JSON.stringify(productosOrdenados)}
                columns={columns}
                data={productosOrdenados}
              />

              {/* {pageActual < totalPaginas && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setPageActual((prev) => prev + 1)}
                    disabled={loading}
                    className="btn btn-light btn-sm flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <KeenIcon icon="loader" className="animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <KeenIcon icon="arrow-down" />
                        Cargar más
                      </>
                    )}
                  </button>
                </div>
              )} */}

              {/* <div className="text-center mt-4 text-gray-500 text-sm">
                Mostrando {productos.length} de {totalRegistros} productos
              </div> */}
            </>
          )}
        </div>
      </div>

      {productoEditar && (
        <ModalEditarProducto
          open={true}
          producto={productoEditar}
          onClose={() => {
            setProductoEditar(null);
          
          }}
          onSave={() => refrescarManteniendoPaginas()}
        />
      )}

      {modalCrearOpen && (
        <ModalCrearProducto
          open={modalCrearOpen}
          onClose={() => setModalCrearOpen(false)}
          onProductoCreado={(nuevo) => {
            // Añadir el nuevo producto al inicio y refrescar conteo
            setProductos((prev) => [nuevo as ProductoInterface, ...prev]);
            setTotalRegistros((t) => t + 1);
            setModalCrearOpen(false);
          }}
        />
      )}

      {productoHistorial && (
        <HistorialProducto
          producto={productoHistorial}
          open={true}
          onClose={() => setProductoHistorial(null)}
        />
      )}

      {/* Modal de creación eliminado: se muestra mensaje temporal desde el botón */}
    </>
  );
};

export { ConfiguracionProductoContent };

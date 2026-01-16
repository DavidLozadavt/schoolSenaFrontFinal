import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { ArrowLeftCircle, ArrowRightCircle, Building2 } from 'lucide-react';
import { useConfirm } from '@/hooks';
import { ModalAlmacen } from './ModalAlmacen';
import ModalProductos from './ModalProductos'; // <-- agregado

interface ContentProps {
  reload: boolean;
}

const GestionAlmacenContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'almacen-filter';
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [almacen, setAlmacen] = useState<any | undefined>(undefined);
  const [isProductosOpen, setIsProductosOpen] = useState(false); // <-- agregado
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(storageFilterId) || '');
  const [currentPage, setCurrentPage] = useState(0);

  // 6 por página
  const itemsPerPage = 6;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchAlmacenes = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await axios.get('almacenes');

      // ✅ Asegurar que SIEMPRE sea un array
      const data = Array.isArray(resp.data)
        ? resp.data
        : Array.isArray(resp.data?.data)
          ? resp.data.data
          : [];

      setAlmacenes(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los almacenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlmacenes();
  }, [reload]);

  const deleteAlmacen = async (id: number) => {
    confirmAction('¿Eliminar este almacén permanentemente?', async () => {
      try {
        await axios.delete(`almacenes/${id}`);
        fetchAlmacenes();
      } catch (err) {
        console.error(err);
        setError('Error al eliminar el almacén');
      }
    });
  };

  const handleAfterSave = () => {
    fetchAlmacenes();
    setIsModalOpen(false);
    setAlmacen(undefined);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return almacenes;
    const q = searchTerm.toLowerCase();
    return almacenes.filter(
      (a) =>
        (a.nombreAlmacen || '').toString().toLowerCase().includes(q) ||
        (a.direccion || '').toString().toLowerCase().includes(q) ||
        (a.descripcion || '').toString().toLowerCase().includes(q)
    );
  }, [searchTerm, almacenes]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  if (loading) {
    return <div className="p-4 text-center text-neutral-500">Cargando almacenes...</div>;
  }

  return (
    <div className="relative w-full py-12 select-none">
      {/* Header igual a PuntosVenta */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 px-6 gap-4">
        <h2 className="text-xl font-extrabold text-left text-neutral-950 dark:text-slate-50">
          Gestión de Almacenes
        </h2>

        <div className="relative flex gap-4 items-center w-full sm:w-auto">
          <KeenIcon
            icon="magnifier"
            className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
          />
          <input
            type="text"
            placeholder="Buscar almacén"
            className="pl-8 input input-sm w-full sm:w-auto"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
          />
        </div>
      </div>

      {error && <div className="text-red-600 mb-4 px-6">{error}</div>}

      {/* Carrusel / Grid estilo PuntosVenta (sin iconos) */}
      {filteredData.length > 0 ? (
        <>
          <div className="relative max-w-7xl mx-auto">
            {/* Flecha izquierda */}
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center
                          w-11 h-11 rounded-full bg-white/90 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                        text-neutral-700 dark:text-neutral-100 shadow-md transition"
            >
              <ArrowLeftCircle className="w-6 h-6" />
            </button>

            <div className="relative max-w-7xl mx-auto">
              <div
                ref={scrollRef}
                className="scroll-hide flex flex-wrap justify-center gap-6 overflow-x-auto scroll-smooth px-10 pb-6 snap-x snap-mandatory touch-pan-x"
              >
                {paginatedData.map((a) => (
                  <div
                    key={a.id}
                    className="cursor-pointer w-[80%] sm:w-[50%] md:w-[36%] lg:w-[30%]
                              bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700
                              rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-transform duration-300
                              flex flex-col justify-between flex-shrink-0 snap-start mb-6 min-h-[360px]"
                  >
                    <div className="w-full h-56 overflow-hidden rounded-t-3xl">
                      <img
                        src={a.rutaImagenUrl || '/media/images/Almacen5.png'}
                        alt={a.nombreAlmacen}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>

                    <div className="px-6 py-6 flex flex-col justify-between flex-1">
                      <div className="text-center">
                        <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2 flex items-center justify-center gap-2">
                          <Building2 className="w-6 h-6 text-blue-600" />
                          <span>{a.nombreAlmacen}</span>
                        </h3>
                      </div>

                      <div className="mt-6 flex gap-4">
                        {/* Tres botones solo icono (como en Servicios) */}
                        <div className="w-full flex justify-between gap-3 sm:gap-4">
                          <button
                            className="flex-1 flex items-center justify-center gap-2
                                      py-2 rounded-2xl transition-all duration-300"
                            title="Gestionar"
                            onClick={() => {
                              setAlmacen(a); // guardas el almacén completo
                              setIsProductosOpen(true); // abres el modal
                            }}
                          >
                            <KeenIcon
                              icon="setting"
                              className="text-green-600 hover:text-green-400 text-lg"
                            />
                          </button>

                          <button
                            className="flex-1 flex items-center justify-center gap-2
                                      py-2 rounded-2xl transition-all duration-300"
                            title="Editar"
                            onClick={() => {
                              setAlmacen(a);
                              setIsModalOpen(true);
                            }}
                          >
                            <KeenIcon
                              icon="notepad-edit"
                              className="text-blue-600 hover:text-blue-500 text-lg"
                            />
                          </button>

                          <button
                            className="flex-1 flex items-center justify-center gap-2
                                      py-2 rounded-2xl transition-all duration-300"
                            title="Eliminar"
                            onClick={() => deleteAlmacen(a.id)}
                          >
                            <KeenIcon
                              icon="trash"
                              className="text-red-600 hover:text-red-400 text-lg"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flecha derecha */}
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center
                         w-11 h-11 rounded-full bg-white/90 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                         text-neutral-700 dark:text-neutral-100 shadow-md transition"
            >
              <ArrowRightCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Paginación visual */}
          <div className="flex justify-center mt-4 gap-2">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              «
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`px-3 py-1 rounded ${currentPage === idx ? ' bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              »
            </button>
          </div>
        </>
      ) : (
        <div className="p-10 text-center text-gray-500 dark:text-gray-400">
          {searchTerm
            ? `No hay almacenes que coincidan con "${searchTerm}".`
            : 'No hay almacenes registrados. Usa el botón “Agregar Almacén” para comenzar.'}
        </div>
      )}

      {/* Modal */}
      <ModalAlmacen
        open={isModalOpen}
        data={almacen}
        onClose={() => {
          setIsModalOpen(false);
          setAlmacen(undefined);
        }}
        onSave={handleAfterSave}
      />

      <ModalProductos
        open={isProductosOpen}
        almacen={almacen} // ✅ se lo pasas aquí
        onClose={() => {
          setIsProductosOpen(false);
          setAlmacen(undefined);
        }}
      />

      <style>{`
        .scroll-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scroll-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export { GestionAlmacenContent };

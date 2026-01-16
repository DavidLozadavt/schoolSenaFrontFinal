import { useEffect, useMemo, useState, useRef } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import { useConfirm } from '@/hooks';
import { ModalServicio } from './modal/ModalServicio';
import { ModalClaseServicio } from './modal/ModalClaseServicio'; 
import { Servicio } from './types';

interface ContentProps {
  reload: boolean;
}

const ServiciosContent = ({ reload }: ContentProps) => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [servicio, setServicio] = useState<Servicio | undefined>(undefined);
  const { confirmAction } = useConfirm();
  
  const [searchTerm, setSearchTerm] = useState('');

  const [isClaseModalOpen, setIsClaseModalOpen] = useState(false);
  const [clases, setClases] = useState<any[]>([]); 

  const [tipos, setTipos] = useState<any[]>([]);
  // const [isTipoModalOpen, setIsTipoModalOpen] = useState(false);
  // const [tipo, setTipo] = useState<any>(null); // tipo a editar

  const [currentPage, setCurrentPage] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchServicios = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/servicios');
      setServicios(response.data);
    } catch {
      setError('Error al cargar los servicios.');
    } finally {
      setLoading(false);
    }
  };

  const deleteServicio = async (id: number) => {
    confirmAction('¿Seguro que quieres eliminar este servicio?', async () => {
      try {
        await axios.delete(`/servicios/${id}`);
        fetchServicios();
      } catch {
        setError('Error al eliminar el servicio.');
      }
    });
  };

  const fetchClases = async () => {
    try {
      const res = await axios.get('/clase_servicios');
      setClases(res.data);
    } catch (error) {
      console.error('Error al cargar las clases de servicio', error);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const [itemsPerPage, setItemsPerPage] = useState(8); // por defecto 8

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setItemsPerPage(4); // en pantallas pequeñas: 2x2
      } else {
        setItemsPerPage(8); // en pantallas grandes: 2x4
      }
    };

    handleResize(); // ejecutar al cargar
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchServicios();
  }, [reload]);

  const filteredData = useMemo(() => {
    let data = servicios;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((s) => s.nombre.toLowerCase().includes(term));
    }
    return data;
  }, [searchTerm, servicios]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isCentered = !loading && filteredData.length <= 2;

  if (loading)
    return (
      <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
        Cargando servicios...
      </div>
    );

  return (
    <div className="relative w-full py-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 px-6 gap-4">
        <h2 className="text-4xl font-extrabold text-left text-neutral-950 dark:text-slate-50">
          Servicios
        </h2>
        <div className="relative flex gap-4 items-center w-full sm:w-auto">
          <KeenIcon
            icon="magnifier"
            className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
          />
          <input
            type="text"
            placeholder="Buscar Servicios"
            className="pl-8 input input-sm w-full sm:w-auto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="text-red-600 mb-4 px-6">{error}</div>}

      {/* Carrusel de servicios */}
      {filteredData.length > 0 && (
        <>
          <div className="relative max-w-7xl mx-auto">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center
                      w-11 h-11 rounded-full bg-white/90 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                    text-neutral-700 dark:text-neutral-100 shadow-md transition"
            >
              <ArrowLeftCircle className="w-6 h-6"/>
            </button>

            <div className="relative max-w-7xl mx-auto">

              <div
                ref={scrollRef}
                className="scroll-hide flex flex-wrap justify-center gap-6 overflow-x-auto 
                            scroll-smooth px-10 pb-6 snap-x snap-mandatory touch-pan-x"
                style={{ marginLeft: '1rem' }}
              >

                {/* tarjetas */}
                {paginatedItems.map((srv) => (
                  <div
                    key={srv.id}
                    className="cursor-pointer w-[70%] sm:w-[40%] md:w-[30%] lg:w-[22%]
                              bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700
                              rounded-2xl overflow-hidden dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]
                              hover:shadow-lg hover:-translate-y-1 transition-transform duration-300
                              flex flex-col justify-between flex-shrink-0 snap-start mb-6
                              min-h-[400px]"  // altura mínima
                  >

                    {/* Imagen */}
                    <div className="w-full h-48 overflow-hidden rounded-t-3xl">
                      <img
                        src={srv.rutaServicioUrl || '/media/images/servicio.png'}
                        alt={srv.nombre}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>

                    {/* Contenido */}
                    <div className="px-6 py-5 flex flex-col justify-between flex-1 text-center">
                      <div>
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                          {srv.nombre}
                        </h3>
                        {srv.descripcion && (
                          <p className="text-neutral-700 dark:text-neutral-400 text-sm leading-relaxed line-clamp-3">
                            {srv.descripcion}
                          </p>
                        )}
                      </div>

                      <div>
                        {srv.valor && (
                          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                            {Number(srv.valor).toLocaleString('es-CO')} COP
                          </p>
                        )}

                        {/* Botones */}
                        <div className="mt-4 flex justify-between gap-2 sm:gap-4 flex-wrap">
                          <button
                            className="flex-1 flex items-center justify-center gap-2
                                      py-2 rounded-2xl transition-all duration-300"
                            title="Actualizar"
                            onClick={() => {
                              setIsModalOpen(true);
                              setServicio(srv);
                            }}
                          >
                            <KeenIcon icon="notepad-edit" className="text-blue-600 hover:text-blue-500 text-lg" />
                          </button>

                          <button
                            className="flex-1 flex items-center justify-center gap-2 
                                      py-2 rounded-2xl"
                            title="Eliminar"
                            onClick={() => deleteServicio(srv.id)}
                          >
                            <KeenIcon icon="trash" className="text-red-600 hover:text-red-400 text-lg" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center
                      w-11 h-11 rounded-full bg-white/90 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                    text-neutral-700 dark:text-neutral-100 shadow-md transition"
            >
              <ArrowRightCircle className="w-6 h-6"/>
            </button>
          </div>

          <div className="flex justify-center mt-4 gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              «
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1 rounded ${currentPage === idx + 1 ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              »
            </button>
          </div>
        </>
      )}

      {filteredData.length === 0 && (
        <div className="p-8 text-center text-yellow-400 font-medium">No hay servicios registrados.</div>
      )}

      <ModalServicio
        open={isModalOpen}
        data={servicio}
        onClose={() => {
          setIsModalOpen(false);
          setServicio(undefined);
        }}
        onSave={fetchServicios}
      />

      {/* Modal para agregar nueva Clase de Servicio */}
      <ModalClaseServicio
        open={isClaseModalOpen}
        onClose={() => setIsClaseModalOpen(false)}
        onSave={async () => {
          setIsClaseModalOpen(false);
          await fetchClases(); // refresca la lista de clases para el select
        }}
      />

      <style>
        {`
          .scroll-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scroll-hide::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
};

export { ServiciosContent };
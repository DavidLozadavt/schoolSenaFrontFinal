import { useEffect, useMemo, useState, useRef } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import { useConfirm } from '@/hooks';
import { Escenario } from "./types";
import { ModalEscenario } from './modal/ModalEscenario';
import { ModalPreviewOpen } from './modal/ModalPreviewEscenario';

interface ContentProps {
  reload: boolean;
}

const GestionEscenariosContent = ({ reload }: ContentProps) => {
  const [escenarios, setEscenarios] = useState<Escenario[]>([]);
  const [escenario, setEscenario] = useState<Escenario | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchEscenarios = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/escenarios');
      setEscenarios(response.data);
    }catch {
      setError('Error al cargar los escenarios')
    }finally {
      setLoading(false)
    }
  };

  const deleteteEscenario = async (id: number) => {
    confirmAction('¿Seguro que quieres eliminar este escenario?', async () => {
      try {
        await axios.delete(`/escenarios/${id}`);
        fetchEscenarios();
      }catch {
        setError('Error al eliminar el escenario')
      }
    });
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
    fetchEscenarios();
  }, [reload]);

  const filteredData = useMemo(() => {
    let data = escenarios;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((e) => e.nombre.toLowerCase().includes(term));
    }
    return data;
  }, [searchTerm, escenarios]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isCentered = !loading && filteredData.length <= 2;

  if (loading)
    return (
      <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
        Cargando escenarios...
      </div>
    );

  return (
    <div className="relative w-full py-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 px-6 gap-4">
        <h2 className="text-4xl font-extrabold text-left text-neutral-950 dark:text-slate-50">
          Escenarios
        </h2>
        <div className="relative flex gap-4 items-center w-full sm:w-auto">
          <KeenIcon
            icon="magnifier"
            className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
          />
          <input
            type="text"
            placeholder="Buscar Escenarios..."
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
                {paginatedItems.map((esc) => (
                  <div
                    key={esc.id}
                    className="cursor-pointer w-[70%] sm:w-[40%] md:w-[30%] lg:w-[22%]
                              bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700
                              rounded-2xl overflow-hidden dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]
                              hover:shadow-lg hover:-translate-y-1 transition-transform duration-300
                              flex flex-col justify-between flex-shrink-0 snap-start mb-6
                              min-h-[400px]"  // 👈 le das una altura mínima
                  >

                    {/* Imagen */}
                    <div className="w-full h-48 overflow-hidden rounded-t-3xl">
                      <img
                        src={esc.imagenUrl || '/media/images/servicio.png'}
                        alt={esc.nombre}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>

                    {/* Contenido */}
                    <div className="px-6 py-5 flex flex-col justify-between flex-1 text-center">
                      <div>
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                          {esc.nombre}
                        </h3>
                        {esc.descripcion && (
                          <p className="text-neutral-700 dark:text-neutral-400 text-sm leading-relaxed line-clamp-3">
                            {esc.descripcion}
                          </p>
                        )}
                      </div>

                      <div>
                        {esc.capacidad && (
                          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                            Capacidad: {Number(esc.capacidad)}
                          </p>
                        )}

                        {/* Botones */}
                        <div className="mt-4 flex justify-between gap-2 sm:gap-4 flex-wrap">
                          <button
                            className="flex-1 flex items-center justify-center gap-2
                                      py-2 rounded-2xl transition-all duration-300"
                            title="Previsualizar"
                            onClick={() => {
                              setEscenario(esc);
                              setIsModalPreviewOpen(true);
                            }}
                          >
                            <KeenIcon icon="eye" className="text-orange-600 hover:text-orange-400 text-lg" />
                          </button>

                          <button
                            className="flex-1 flex items-center justify-center gap-2
                                      py-2 rounded-2xl transition-all duration-300"
                            title="Actualizar"
                            onClick={() => {
                              setIsModalOpen(true);
                              setEscenario(esc);
                            }}
                          >
                            <KeenIcon icon="notepad-edit" className="text-blue-600 hover:text-blue-500 text-lg" />
                          </button>

                          <button
                            className="flex-1 flex items-center justify-center gap-2 
                                      py-2 rounded-2xl"
                            title="Eliminar"
                            onClick={() => deleteteEscenario(esc.id)}
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

      <ModalEscenario
        open={isModalOpen}
        data={escenario}
        onClose={() => {
          setIsModalOpen(false);
          setEscenario(undefined);
        }}
        onSave={fetchEscenarios}
      />

      <ModalPreviewOpen
        open={isModalPreviewOpen}
        data={escenario}
        onClose={() => {
          setIsModalPreviewOpen(false);
          setEscenario(undefined);
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

export default GestionEscenariosContent;

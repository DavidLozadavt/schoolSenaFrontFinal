import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import { ArrowLeftCircle, ArrowRightCircle, Image as ImageIcon } from 'lucide-react';
import { ModalMultimedia } from './ModalMultimedia';

interface ContentProps {
  reload: boolean;
}

interface Multimedia {
  id: number;
  idGrupoMultimediaPos: number;
  urlMultimedia: string;
  cancion: string | null;
}

interface GrupoMultimedia {
  id: number;
  nombreGrupo: string;
  grupos_multimedia: Multimedia[];
}

const MultimediaContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'multimedia-filter';
  const [grupos, setGrupos] = useState<GrupoMultimedia[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoMultimedia | null>(null); // ✅ nuevo estado
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(storageFilterId) || '');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('multimedia_by_company');
      const gruposFormateados = response.data.map((grupo: any) => ({
        ...grupo,
        grupos_multimedia: grupo.grupos_multimedia.map((item: any) => ({
          ...item,
          cancion: item.cancion
            ? (() => {
                try {
                  const parsed = JSON.parse(item.cancion);
                  return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
                } catch {
                  return null;
                }
              })()
            : null
        }))
      }));

      setGrupos(gruposFormateados);
    } catch (err) {
      console.error('Error al obtener multimedia:', err);
      setError('Error al cargar multimedia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reload]);

  const deleteHistoria = async (id: number) => {
    confirmAction('¿Eliminar este grupo permanentemente?', async () => {
      try {
        await axios.delete(`delete_grupo_multimedia/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
        setError('Error al eliminar la historia');
      }
    });
  };

  const handleAfterSave = () => {
    fetchData(); // recarga los datos
    setIsModalOpen(false);
    setSelectedGrupo(null); // limpia el grupo en edición
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return grupos;
    const q = searchTerm.toLowerCase();
    return grupos.filter((g) => g.nombreGrupo.toLowerCase().includes(q));
  }, [searchTerm, grupos]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  if (loading) {
    return <div className="p-4 text-center text-neutral-500">Cargando multimedia...</div>;
  }

  return (
    <div className="relative w-full py-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 px-6 gap-4">
        <h2 className="text-4xl font-extrabold text-left text-neutral-950 dark:text-slate-50">
          Multimedia
        </h2>

        <div className="relative flex gap-4 items-center w-full sm:w-auto">
          <KeenIcon
            icon="magnifier"
            className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
          />
          <input
            type="text"
            placeholder="Buscar historias..."
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
                {paginatedData.map((grupo) => (
                  <div
                    key={grupo.id}
                    className="cursor-pointer w-[80%] sm:w-[50%] md:w-[36%] lg:w-[30%]
                              bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700
                              rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-transform duration-300
                              flex flex-col justify-between flex-shrink-0 snap-start mb-6 min-h-[360px]"
                  >
                    {/* Multimedia */}
                    <div className="w-full h-56 overflow-hidden rounded-t-3xl bg-black">
                      {(() => {
                        const file = grupo.grupos_multimedia?.[0];
                        if (!file?.urlMultimedia) {
                          return (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                              <ImageIcon className="w-10 h-10" />
                            </div>
                          );
                        }

                        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(file.urlMultimedia);

                        return isVideo ? (
                          <video
                            src={file.urlMultimedia}
                            controls
                            preload="metadata"
                            className="w-full h-full object-cover"
                            onPlay={(e) => {
                              document.querySelectorAll('video').forEach((v) => {
                                if (v !== e.currentTarget) v.pause();
                              });
                            }}
                          />
                        ) : (
                          <img
                            src={file.urlMultimedia}
                            alt={grupo.nombreGrupo}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        );
                      })()}
                    </div>

                    {/* Info */}
                    <div className="px-6 py-6 flex flex-col justify-between flex-1">
                      <div className="text-center">
                        <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2 flex items-center justify-center gap-2">
                          <ImageIcon className="w-6 h-6 text-blue-600" />
                          <span>{grupo.nombreGrupo}</span>
                        </h3>
                      </div>

                      <div className="mt-6 flex justify-center gap-4">
                        <div className="w-full flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedGrupo(grupo); // ✅ ahora solo guardamos el grupo a editar
                              setIsModalOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 text-white py-2 rounded-2xl transition-all duration-300"
                            title="Editar"
                          >
                            <KeenIcon icon="notepad-edit" className="text-blue-600 hover:text-blue-500 text-lg" />
                          </button>

                          <button
                            onClick={() => deleteHistoria(grupo.id)}
                            className="flex-1 flex items-center justify-center gap-2 text-white py-2 rounded-2xl transition-all duration-300"
                            title="Eliminar"
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

          {/* Paginación */}
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
                className={`px-3 py-1 rounded ${
                  currentPage === idx ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
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
            ? `No hay resultados que coincidan con "${searchTerm}".`
            : 'No hay multimedia disponible.'}
        </div>
      )}

      {/* Modal */}
      <ModalMultimedia
        open={isModalOpen}
        data={selectedGrupo ? [selectedGrupo] : []} // ✅ enviamos solo el grupo seleccionado
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGrupo(null);
        }}
        onSave={handleAfterSave}
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

export default MultimediaContent;
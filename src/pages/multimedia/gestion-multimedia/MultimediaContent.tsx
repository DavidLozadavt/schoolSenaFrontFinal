import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import { ArrowLeftCircle, ArrowRightCircle, Image as ImageIcon, Film, BookImage } from 'lucide-react';
import { ModalMultimedia } from './ModalMultimedia';
import MultimediaViewModal from './MultimediaViewModal';

interface ContentProps {
  reload: boolean;
  tipo: 'historia' | 'reel';
  onEdit?: (grupo: GrupoMultimedia, tipo: 'historia' | 'reel') => void;
}

interface Multimedia {
  id: number;
  idGrupoMultimedia: number;
  urlMultimedia: string;
  urlMultimediaFull?: string;
  cancion: string | null;
  tipo: string;
}

interface GrupoMultimedia {
  id: number;
  nombreGrupo: string;
  tipo: 'historia' | 'reel';
  descripcion?: string;
  grupos_multimedia: Multimedia[];
}

const MultimediaContent = ({ reload, tipo, onEdit }: ContentProps) => {
  const storageFilterId = `multimedia-filter-${tipo}`;
  const [grupos, setGrupos] = useState<GrupoMultimedia[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoMultimedia | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(storageFilterId) || '');
  const [isArchived, setIsArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchData = async (archived = isArchived) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`multimedia_by_company?tipo=${tipo}&archived=${archived}`);
      const gruposFormateados = response.data.map((grupo: any) => ({
        ...grupo,
        grupos_multimedia: (grupo.grupos_multimedia || []).map((item: any) => ({
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
    fetchData(isArchived);
    setCurrentPage(0);
  }, [reload, tipo, isArchived]);

  const toggleArchive = () => {
    setIsArchived(!isArchived);
    setCurrentPage(0);
  };

  const deleteHistoria = async (id: number) => {
    confirmAction('¿Eliminar este grupo permanentemente?', async () => {
      try {
        await axios.delete(`delete_grupo_multimedia/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
        setError('Error al eliminar');
      }
    });
  };

  const handleAfterSave = () => {
    fetchData();
    setIsModalOpen(false);
    setSelectedGrupo(null);
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

  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${backendUrl}${normalizedUrl}`;
  };

  const getMediaUrl = (item: Multimedia) => {
    return getImageUrl(item.urlMultimediaFull || item.urlMultimedia) || '';
  };

  const getEmbedPreview = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    if (url.includes('tiktok.com')) {
      const videoId = url.split('/video/')[1]?.split('?')[0];
      if (videoId) return `https://www.tiktok.com/player/v1/${videoId}`;
    }
    if (url.includes('instagram.com/reels/')) {
      const reelId = url.split('/reels/')[1]?.split('/')[0];
      if (reelId) return `https://www.instagram.com/reels/${reelId}/embed`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mr-3" />
        <span className="text-neutral-500">Cargando {tipo === 'reel' ? 'reels' : 'historias'}...</span>
      </div>
    );
  }

  const TipoIcon = tipo === 'reel' ? Film : BookImage;
  const tipoLabel = tipo === 'reel' ? 'Reels' : 'Historias';
  const tipoColor = tipo === 'reel' ? 'text-purple-600' : 'text-blue-600';

  return (
    <div className="relative w-full py-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 px-2 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className={`text-3xl font-extrabold flex items-center gap-2 text-neutral-900 dark:text-slate-50`}>
            <TipoIcon className={`w-7 h-7 ${isArchived ? 'text-neutral-400' : tipoColor}`} />
            {isArchived ? `${tipoLabel} Pasadas (+24h)` : tipoLabel}
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">
              ({filteredData.length} {tipo === 'reel' ? 'reels' : 'historias'})
            </span>
          </h2>
          {isArchived && tipo === 'historia' && (
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 italic">
              Historias que han expirado después de 24 horas
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
          {tipo === 'historia' && (
            <button
              onClick={toggleArchive}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg ${
                isArchived 
                  ? 'bg-blue-600 text-white shadow-blue-500/20' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-100 dark:border-white/5'
              }`}
            >
              <KeenIcon icon="archive" className="text-sm" />
              {isArchived ? 'Ver Recientes' : 'Ver Archivo'}
            </button>
          )}

          <div className="relative flex items-center flex-1 sm:flex-initial min-w-[240px]">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder={`Buscar ${tipoLabel.toLowerCase()}...`}
              className="pl-8 input input-sm w-full focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>
        </div>
      </div>

      {error && <div className="text-red-600 mb-4 px-2">{error}</div>}

      {filteredData.length > 0 ? (
        <>
          <div className="relative max-w-7xl mx-auto">
            {/* Flecha izquierda */}
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center
                          w-11 h-11 rounded-full bg-white/90 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                          text-neutral-700 dark:text-neutral-100 shadow-md transition disabled:opacity-30"
            >
              <ArrowLeftCircle className="w-6 h-6" />
            </button>

            <div
              ref={scrollRef}
              className="scroll-hide flex flex-wrap justify-center gap-6 overflow-x-auto scroll-smooth px-10 pb-6"
            >
              {paginatedData.map((grupo) => {
                const file = grupo.grupos_multimedia?.[0];
                const mediaUrl = file ? getMediaUrl(file) : '';
                const hasVideo = mediaUrl && isVideo(mediaUrl);

                return (
                  <div
                    key={grupo.id}
                    className="cursor-pointer w-[80%] sm:w-[48%] md:w-[30%] lg:w-[28%]
                              bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700
                              rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                              flex flex-col justify-between flex-shrink-0 min-h-[360px] group"
                  >
                    {/* Tipo badge */}
                    <div className="relative">
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
                          ${tipo === 'reel'
                            ? 'bg-purple-600/90 text-white'
                            : 'bg-blue-600/90 text-white'
                          }`}>
                          <TipoIcon className="w-3 h-3" />
                          {tipo === 'reel' ? 'Reel' : 'Historia'}
                        </span>
                      </div>

                      {/* Count badge */}
                      {grupo.grupos_multimedia.length > 1 && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {grupo.grupos_multimedia.length} archivos
                          </span>
                        </div>
                      )}

                      {/* Media preview */}
                      <div className="w-full h-52 overflow-hidden bg-gray-900">
                        {!mediaUrl ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-neutral-800 text-gray-400">
                            <ImageIcon className="w-10 h-10" />
                          </div>
                        ) : getEmbedPreview(mediaUrl) ? (
                          <iframe
                            key={`embed-${grupo.id}`}
                            src={getEmbedPreview(mediaUrl)!}
                            className="w-full h-full border-0 pointer-events-none"
                            title={grupo.nombreGrupo}
                          />
                        ) : hasVideo ? (
                          <video
                            key={`video-${grupo.id}`}
                            src={mediaUrl}
                            controls
                            preload="metadata"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            key={`img-${grupo.id}`}
                            src={mediaUrl}
                            alt={grupo.nombreGrupo}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="px-4 py-4 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-1 flex items-center gap-2">
                          <TipoIcon className={`w-5 h-5 ${tipoColor} shrink-0`} />
                          <span className="truncate">{grupo.nombreGrupo}</span>
                        </h3>
                        {grupo.descripcion && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{grupo.descripcion}</p>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setSelectedGrupo(grupo);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                                     bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400
                                     hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all text-xs font-bold"
                          title="Editar"
                        >
                          <KeenIcon icon="notepad-edit" className="text-sm" />
                          Editar
                        </button>

                        <button
                          onClick={() => deleteHistoria(grupo.id)}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                                     bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400
                                     hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-xs font-bold"
                          title="Eliminar"
                        >
                          <KeenIcon icon="trash" className="text-sm" />
                          Borrar
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          // Aquí iría la lógica para "Ver" la historia a pantalla completa o modal de vista
                          setSelectedGrupo(grupo);
                          setIsViewModalOpen(true);
                        }}
                        className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                                   text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]
                                   text-xs font-black uppercase tracking-widest
                                   ${tipo === 'reel' 
                                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-500/25' 
                                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/25'}`}
                      >
                        <KeenIcon icon="eye" className="text-sm" />
                        Ver {tipoLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Flecha derecha */}
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center
                         w-11 h-11 rounded-full bg-white/90 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                         text-neutral-700 dark:text-neutral-100 shadow-md transition disabled:opacity-30"
            >
              <ArrowRightCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Paginación */}
          {totalPages >= 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                className="btn btn-sm btn-light rounded-xl disabled:opacity-50"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`px-4 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                    currentPage === idx
                      ? tipo === 'reel' 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 border border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  Página {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                className="btn btn-sm btn-light rounded-xl disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <TipoIcon className={`w-16 h-16 mb-4 ${tipoColor} opacity-30`} />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {searchTerm
              ? `No hay resultados para "${searchTerm}".`
              : `No hay ${tipoLabel.toLowerCase()} disponibles.`}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Crea tu primer{tipo === 'reel' ? ' reel' : 'a historia'} con el botón de arriba.
          </p>
        </div>
      )}

      {/* Modal de edición */}
      <ModalMultimedia
        open={isModalOpen}
        tipo={selectedGrupo?.tipo || tipo}
        data={selectedGrupo ? [selectedGrupo] : []}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGrupo(null);
        }}
        onSave={handleAfterSave}
      />

      <MultimediaViewModal
        open={isViewModalOpen}
        grupo={selectedGrupo}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedGrupo(null);
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

export default MultimediaContent;
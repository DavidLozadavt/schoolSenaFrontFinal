import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Film, BookImage, Play, ChevronLeft, ChevronRight, X, Music, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { KeenIcon } from '@/components/keenicons';
import { useAuthContext } from '@/auth';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  return `${backendUrl}${normalizedUrl}`;
};

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const isYoutubeUrl = (url: string) => /youtube\.com|youtu\.be/.test(url);

interface MultimediaFile {
  id: number;
  urlMultimedia: string;
  urlMultimediaFull?: string;
  nombre?: string;
  cancion?: any;
}

interface MultimediaItem {
  id: number;
  nombreGrupo: string;
  descripcion?: string;
  tipo: 'historia' | 'reel';
  tipo_item: 'historia' | 'reel';
  grupos_multimedia: MultimediaFile[];
  fecha_creacion?: string;
  created_at?: string;
}

// === VIEWER COMPONENT (PREMIUM UPGRADE) ===
const MultimediaViewer = ({ 
  items, 
  initialGroupIndex, 
  onClose 
}: { 
  items: MultimediaItem[], 
  initialGroupIndex: number, 
  onClose: () => void 
}) => {
  const { roles } = useAuthContext();
  const [groupIndex, setGroupIndex] = React.useState(initialGroupIndex);
  const [fileIndex, setFileIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isAudioMuted, setIsAudioMuted] = React.useState(false);
  const duration = 5000;
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const currentGroup = items[groupIndex];
  const currentFile = currentGroup?.grupos_multimedia?.[fileIndex];

  const [activeTrack, setActiveTrack] = React.useState<any>(null);

  React.useEffect(() => {
    if (!currentFile?.cancion) {
      setActiveTrack(null);
      return;
    }
    
    let active = true;
    
    try {
      let parsed = typeof currentFile.cancion === 'string' ? JSON.parse(currentFile.cancion) : currentFile.cancion;
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      
      if (parsed) {
        setActiveTrack(parsed);
        if (parsed.id) {
          axios.get(`/deezer/search/${parsed.id}`)
            .then(resp => {
              if (active && resp.data && resp.data.preview_url) {
                setActiveTrack(resp.data);
              }
            })
            .catch(err => {
              console.error('Error refreshing track preview:', err);
            });
        }
      } else {
        setActiveTrack(null);
      }
    } catch (e) {
      console.error('Error parsing cancion:', e);
      setActiveTrack(null);
    }

    return () => {
      active = false;
    };
  }, [currentFile]);

  const cancionUrl = activeTrack?.preview_url || activeTrack?.preview || activeTrack?.url || '';
  const cancionTitle = activeTrack?.title || activeTrack?.name || '';

  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio && cancionUrl) {
      audio.load();
    }
  }, [cancionUrl]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !cancionUrl) return;
    if (isPlaying && !isAudioMuted) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, isAudioMuted, fileIndex, cancionUrl]);

  React.useEffect(() => {
    if (!isPlaying || !currentGroup) return;
    const interval = setInterval(() => {
      setProgress(p => p + (100 / (duration / 50)));
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, groupIndex, fileIndex, currentGroup]);

  React.useEffect(() => {
    if (progress >= 100) handleNext();
  }, [progress]);

  const handleNext = () => {
    if (fileIndex < currentGroup.grupos_multimedia.length - 1) {
      setFileIndex(fileIndex + 1);
      setProgress(0);
    } else if (groupIndex < items.length - 1) {
      setGroupIndex(groupIndex + 1);
      setFileIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (fileIndex > 0) {
      setFileIndex(fileIndex - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      const prevGroup = items[groupIndex - 1];
      setGroupIndex(groupIndex - 1);
      setFileIndex(prevGroup.grupos_multimedia.length - 1);
      setProgress(0);
    }
  };

  if (!currentGroup || !currentFile) return null;

  const rawUrl = currentFile.urlMultimediaFull || currentFile.urlMultimedia || '';
  const isYoutube = isYoutubeUrl(rawUrl);
  const mediaUrl = isYoutube ? rawUrl : getImageUrl(rawUrl);
  const isVideoFile = isYoutube || /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);

  return (
    <div className="fixed inset-0 bg-black/98 z-[9999] flex items-center justify-center animate-fade-in backdrop-blur-3xl" onClick={onClose}>
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[150px] rounded-full transition-all duration-1000 ${currentGroup.tipo_item === 'reel' ? 'bg-purple-600/20' : 'bg-primary/20'}`} />
      </div>

      <button 
        className="absolute top-8 right-8 text-white/50 hover:text-white p-3 z-[10000] bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-2xl border border-white/10 transition-all transform hover:rotate-90"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X className="w-7 h-7" />
      </button>

      <div className="absolute top-8 left-0 right-0 px-6 flex gap-2 z-[10001] max-w-[550px] mx-auto">
        {currentGroup.grupos_multimedia.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-md border border-white/5">
            <div
              className="h-full bg-white transition-all duration-75 shadow-[0_0_15px_rgba(255,255,255,0.6)]"
              style={{ width: i < fileIndex ? '100%' : i === fileIndex ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

        <div 
          className="w-full sm:w-[500px] h-full sm:h-[92vh] bg-black relative flex flex-col justify-center sm:rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] border border-white/10 group/viewer"
          onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
        >
          {/* Global Controls Overlay */}
          <div className="absolute top-8 right-8 z-[60] flex items-center gap-4 pointer-events-auto">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                const newMuted = !isAudioMuted;
                setIsAudioMuted(newMuted);
                
                // YouTube postMessage unMute/mute
                if (isYoutube) {
                  const iframe = document.querySelector('iframe');
                  if (iframe?.contentWindow) {
                    iframe.contentWindow.postMessage(JSON.stringify({
                      event: 'command',
                      func: newMuted ? 'mute' : 'unMute',
                      args: ''
                    }), '*');
                  }
                }
              }}
              className="p-4 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 text-white hover:bg-white/20 transition-all shadow-2xl active:scale-90"
              title={isAudioMuted ? "Activar sonido" : "Silenciar"}
            >
              {isAudioMuted ? <VolumeX className="w-6 h-6 text-rose-500" /> : <Volume2 className="w-6 h-6 text-emerald-500" />}
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-4 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 text-white hover:bg-white/20 transition-all shadow-2xl active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Hotspots */}
          <div className="absolute inset-y-0 left-0 w-1/4 z-30 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
          <div className="absolute inset-y-0 right-0 w-1/4 z-30 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNext(); }} />

          <audio ref={audioRef} src={cancionUrl || undefined} loop className="hidden" />

          <div key={`${currentGroup.id}-${fileIndex}`} className="w-full h-full animate-fade-in flex items-center justify-center bg-black">
             {isYoutube ? (
               <iframe
                 src={`https://www.youtube.com/embed/${getYoutubeId(mediaUrl)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${getYoutubeId(mediaUrl)}&enablejsapi=1&origin=${window.location.origin}`}
                 className="w-full h-full aspect-[9/16] pointer-events-none"
                 allow="autoplay; encrypted-media"
                 allowFullScreen
               />
             ) : isVideoFile ? (
               <video 
                 src={mediaUrl} 
                 className="w-full h-full object-contain" 
                 autoPlay 
                 muted={isAudioMuted} 
                 playsInline 
                 onEnded={handleNext} 
                 ref={(el) => {
                   if (el) {
                     if (isPlaying) el.play().catch(() => {});
                     else el.pause();
                   }
                 }}
               />
             ) : (
               <img src={mediaUrl} className="w-full h-full object-contain" alt={currentGroup.nombreGrupo} />
             )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />
          
          <div className="absolute bottom-0 left-0 right-0 p-12 z-30 pointer-events-none flex flex-col justify-end">
            <div className="flex flex-wrap items-center gap-3 mb-5 pointer-events-auto">
               <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black text-white backdrop-blur-3xl border border-white/20 shadow-xl ${currentGroup.tipo_item === 'reel' ? 'bg-purple-600/40' : 'bg-primary/40'}`}>
                  {currentGroup.tipo_item === 'reel' ? <Film className="w-4 h-4" /> : <BookImage className="w-4 h-4" />}
                  <span className="tracking-[0.2em] uppercase">{currentGroup.tipo_item}</span>
               </div>
               {cancionTitle && (
                 <div 
                   className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-3xl text-[10px] font-black text-white border border-white/10 hover:bg-white/10 transition-all cursor-pointer group shadow-xl"
                   onClick={(e) => { e.stopPropagation(); setIsAudioMuted(!isAudioMuted); }}
                 >
                   <Music className={`w-4 h-4 text-emerald-400 ${isPlaying ? 'animate-pulse' : ''}`} />
                   <span className="truncate max-w-[200px] uppercase tracking-wider">{cancionTitle}</span>
                   {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                 </div>
               )}
            </div>
            
            <div className="flex flex-col gap-1 mb-2">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1 italic">Publicado por {currentGroup.nombreGrupo}</p>
               <h3 className="text-white font-black text-3xl uppercase tracking-tighter leading-none italic drop-shadow-2xl">
                 {currentGroup.nombreGrupo}
               </h3>
            </div>
            <p className="text-white/70 text-sm font-bold line-clamp-3 leading-relaxed max-w-[95%] italic">
              {currentGroup.descripcion || 'Una experiencia única compartida por nuestra comunidad SENA.'}
            </p>
          </div>

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 bg-black/20 backdrop-blur-[2px]">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center text-white border border-white/20 animate-fade-in shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                <Play className="w-10 h-10 ml-1 fill-white" />
              </div>
            </div>
          )}
        </div>

      {/* Desktop Navigation Arrows */}
      <div className="hidden lg:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-20 pointer-events-none">
        <button 
          className={`p-6 rounded-[2rem] bg-white/5 hover:bg-white/10 text-white backdrop-blur-3xl border border-white/10 transition-all pointer-events-auto shadow-2xl group ${groupIndex === 0 && fileIndex === 0 ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
        >
          <ChevronLeft className="w-12 h-12 group-hover:-translate-x-1 transition-transform" />
        </button>
        <button 
          className="p-6 rounded-[2rem] bg-white/5 hover:bg-white/10 text-white backdrop-blur-3xl border border-white/10 transition-all pointer-events-auto shadow-2xl group"
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
        >
          <ChevronRight className="w-12 h-12 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

// === MAIN COMPONENT ===
const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

const MultimediaCapsulas = () => {
  const [items, setItems] = React.useState<MultimediaItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);
  const clipRef = React.useRef<HTMLDivElement>(null);
  
  const [showLeftBtn, setShowLeftBtn] = React.useState(false);
  const [showRightBtn, setShowRightBtn] = React.useState(false);

  const checkScroll = () => {
    const el = clipRef.current;
    if (!el) return;
    // Tolerancia de 5px para variaciones de redondeo del navegador
    setShowLeftBtn(el.scrollLeft > 5);
    setShowRightBtn(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  React.useEffect(() => {
    const el = clipRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    
    // Ejecutar verificaciones con pequeños retardos para dar tiempo al navegador de renderizar los elementos
    checkScroll();
    const t1 = setTimeout(checkScroll, 100);
    const t2 = setTimeout(checkScroll, 500);

    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    
    return () => {
      el.removeEventListener('scroll', checkScroll);
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
    };
  }, [items]);

  const slidePrev = () => {
    const el = clipRef.current;
    if (!el) return;
    el.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const slideNext = () => {
    const el = clipRef.current;
    if (!el) return;
    el.scrollBy({ left: 320, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await axios.get('dashboard_multimedia');
        const historias = (res.data.historias || [])
          .map((h: any) => ({ ...h, grupos_multimedia: h.grupos_multimedia || [], tipo_item: 'historia' }))
          .filter((h: any) => (h.grupos_multimedia || []).length > 0);
        const reels = (res.data.reels || [])
          .map((r: any) => ({ ...r, grupos_multimedia: r.grupos_multimedia || [], tipo_item: 'reel' }))
          .filter((r: any) => (r.grupos_multimedia || []).length > 0);
        const combined = [...historias, ...reels].sort((a, b) =>
          new Date(b.fecha_creacion || b.created_at || 0).getTime() -
          new Date(a.fecha_creacion || a.created_at || 0).getTime()
        );
        setItems(combined);
      } catch (err) {
        console.error('Error fetching multimedia:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, []);

  const getThumbnail = (item: MultimediaItem) => {
    const first = item.grupos_multimedia?.[0];
    return first?.urlMultimediaFull || first?.urlMultimedia || '';
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-[66px] h-[66px] rounded-full bg-gray-200 dark:bg-coal-400 animate-pulse" />
            <div className="w-12 h-2 rounded-full bg-gray-200 dark:bg-coal-400 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-gray-400 dark:text-gray-600">
        <Film className="w-7 h-7" />
        <p className="text-xs font-semibold">Sin cápsulas aún</p>
      </div>
    );
  }

  // Ancho exacto e idéntico a Instagram para cada burbuja (80px totales)
  const ITEM_W = 80;

  return (
    <div className="w-full max-w-full min-w-0 relative select-none group/carousel flex items-center">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      
      {/* Botón ANTERIOR (Overlay a la izquierda) */}
      <button
        onClick={slidePrev}
        aria-label="Anterior"
        className={`absolute left-2 z-30 w-8 h-8 rounded-full flex items-center justify-center
          bg-white/95 dark:bg-coal-300/95
          shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-gray-100 dark:border-gray-800
          text-gray-800 dark:text-gray-100 hover:text-primary dark:hover:text-primary
          active:scale-90 transition-all duration-300
          ${showLeftBtn ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
      >
        <ChevronLeft className="w-4 h-4 stroke-[3]" />
      </button>

      {/* 
        Scroll Container: 100% responsivo. 
        flex-1 y min-w-0 son CRÍTICOS aquí: evitan que el flex-item se estire
        según el ancho de su contenido y forzar el recorte (overflow-x-auto).
      */}
      <div
        ref={clipRef}
        className="flex-1 min-w-0 w-full overflow-x-auto no-scrollbar flex items-end gap-4 scroll-smooth"
        style={{ 
          paddingBottom: '4px'
        }}
      >
        {items.map((item, idx) => {
          const thumb = getThumbnail(item);
          const isReel = item.tipo_item === 'reel';

          return (
            <div
              key={`${item.tipo_item}-${item.id}`}
              onClick={() => setViewerIndex(idx)}
              className="flex flex-col items-center gap-[5px] cursor-pointer group shrink-0"
              style={{ width: `${ITEM_W}px` }}
            >
              {/* Ring — gradiente Instagram */}
              <div
                className="p-[2.5px] rounded-full group-hover:scale-105 transition-transform duration-200"
                style={{
                  background: isReel
                    ? 'linear-gradient(45deg,#833ab4,#fd1d1d,#fcb045)'
                    : 'linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)',
                }}
              >
                {/* Separador */}
                <div className="p-[2px] rounded-full bg-white dark:bg-[#1c1c1e]">
                  {/* Avatar */}
                  <div className="w-[58px] h-[58px] rounded-full overflow-hidden bg-gray-100 dark:bg-coal-500 relative">
                    {thumb ? (
                      isYoutubeUrl(thumb) ? (
                        /* YouTube: solo imagen estática — sin iframe pesado */
                        <div className="w-full h-full relative">
                          <img
                            src={`https://img.youtube.com/vi/${getYoutubeId(thumb)}/mqdefault.jpg`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            draggable={false}
                            alt=""
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>
                      ) : isVideo(thumb) ? (
                        /* Video: SIN autoPlay — poster estático para optimizar rendimiento */
                        <video
                          src={getImageUrl(thumb)}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="none"
                        />
                      ) : (
                        <img
                          src={getImageUrl(thumb)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          draggable={false}
                          alt={item.nombreGrupo}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {isReel
                          ? <Film className="w-6 h-6 text-gray-400" />
                          : <BookImage className="w-6 h-6 text-gray-400" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Username truncado centrado al estilo Instagram */}
              <span className="text-[11px] font-normal leading-tight truncate text-center w-full
                text-gray-700 dark:text-gray-300
                group-hover:text-gray-900 dark:group-hover:text-white
                transition-colors">
                {item.nombreGrupo}
              </span>
            </div>
          );
        })}
      </div>

      {/* Botón SIGUIENTE (Overlay a la derecha) */}
      <button
        onClick={slideNext}
        aria-label="Siguiente"
        className={`absolute right-2 z-30 w-8 h-8 rounded-full flex items-center justify-center
          bg-white/95 dark:bg-coal-300/95
          shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-gray-100 dark:border-gray-800
          text-gray-800 dark:text-gray-100 hover:text-primary dark:hover:text-primary
          active:scale-90 transition-all duration-300
          ${showRightBtn ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
      >
        <ChevronRight className="w-4 h-4 stroke-[3]" />
      </button>

      {viewerIndex !== null && (
        <MultimediaViewer
          items={items}
          initialGroupIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
};

export default MultimediaCapsulas;

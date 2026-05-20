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

  let cancionUrl = '';
  let cancionTitle = '';
  if (currentFile?.cancion) {
    try {
      let parsed = typeof currentFile.cancion === 'string' ? JSON.parse(currentFile.cancion) : currentFile.cancion;
      // Desempaquetar si está anidado
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      cancionUrl = parsed?.preview_url || parsed?.preview || parsed?.url || '';
      cancionTitle = parsed?.title || parsed?.name || '';
    } catch (e) {
      console.error('Error parsing cancion:', e);
    }
  }

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

          {cancionUrl && (
            <audio key={cancionUrl} ref={audioRef} src={cancionUrl} loop className="hidden" />
          )}

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
const MultimediaCapsulas = () => {
  const [items, setItems] = React.useState<MultimediaItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  React.useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await axios.get('dashboard_multimedia');
        
        const historias = (res.data.historias || [])
          .map((h: any) => ({
            ...h,
            grupos_multimedia: h.grupos_multimedia || h.grupos_multimedia || [],
            tipo_item: 'historia'
          }))
          .filter((h: any) => (h.grupos_multimedia || []).length > 0);

        const reels = (res.data.reels || [])
          .map((r: any) => ({
            ...r,
            grupos_multimedia: r.grupos_multimedia || r.grupos_multimedia || [],
            tipo_item: 'reel'
          }))
          .filter((r: any) => (r.grupos_multimedia || []).length > 0);
        
        // ORDENAR POR FECHA DE CREACIÓN (Más reciente primero)
        const combined = [...historias, ...reels].sort((a, b) => {
          const dateA = new Date(a.fecha_creacion || a.created_at || 0).getTime();
          const dateB = new Date(b.fecha_creacion || b.created_at || 0).getTime();
          return dateB - dateA;
        });

        setItems(combined);
      } catch (err) {
        console.error('Error fetching multimedia:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getThumbnail = (item: MultimediaItem) => {
    const first = item.grupos_multimedia?.[0];
    if (!first) return '';
    return first.urlMultimediaFull || first.urlMultimedia || '';
  };

  if (loading) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 dark:bg-coal-300 animate-pulse border-2 border-white/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full relative group/carousel">
      {canScrollLeft && (
        <button 
          onClick={() => scroll('left')}
          className="absolute top-1/2 -translate-y-1/2 -left-4 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-coal-400/90 shadow-xl border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 hover:text-primary transition-all scale-0 group-hover/carousel:scale-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {canScrollRight && (
        <button 
          onClick={() => scroll('right')}
          className="absolute top-1/2 -translate-y-1/2 -right-4 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-coal-400/90 shadow-xl border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 hover:text-primary transition-all scale-0 group-hover/carousel:scale-100"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth px-2"
      >
        {items.map((item, idx) => {
          const thumb = getThumbnail(item);
          const isReel = item.tipo_item === 'reel';
          const Icon = isReel ? Film : BookImage;
          
          return (
            <div
              key={`${item.tipo_item}-${item.id}`}
              onClick={() => setViewerIndex(idx)}
              className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
            >
              <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-amber-400 via-fuchsia-500 to-indigo-600 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-fuchsia-500/20">
                <div className="p-[2.5px] bg-white dark:bg-coal-600 rounded-full">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden relative">
                    {thumb ? (
                      isYoutubeUrl(thumb) ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-current" />
                          <img src={`https://img.youtube.com/vi/${getYoutubeId(thumb)}/0.jpg`} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        </div>
                      ) : isVideo(thumb) ? (
                        <video 
                          src={getImageUrl(thumb)} 
                          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" 
                          autoPlay 
                          muted 
                          loop 
                          playsInline
                        />
                      ) : (
                        <img src={getImageUrl(thumb)} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" alt="" />
                      )
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-coal-500 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    {/* Badge Tipo */}
                    <div className="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                      {isReel ? <Play className="w-2.5 h-2.5 text-white fill-current" /> : <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[10px] md:text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors max-w-[80px] truncate text-center uppercase tracking-tighter">
                {item.nombreGrupo}
              </span>
            </div>
          );
        })}
      </div>
      
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

const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

export default MultimediaCapsulas;

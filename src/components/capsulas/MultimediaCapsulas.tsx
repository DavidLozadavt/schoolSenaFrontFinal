import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Film, BookImage, Play, ChevronLeft, ChevronRight, X, Music, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { KeenIcon } from '@/components/keenicons';
import { useAuthContext } from '@/auth';

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
  let cancionArtist = '';
  if (currentFile?.cancion) {
    try {
      let parsed = currentFile.cancion;
      for (let i = 0; i < 5; i++) {
        if (typeof parsed === 'string') {
          try {
            const next = JSON.parse(parsed);
            if (next === parsed) break;
            parsed = next;
          } catch { break; }
        } else break;
      }
      cancionUrl = parsed?.preview_url || parsed?.preview || parsed?.url || '';
      cancionTitle = parsed?.title || parsed?.name || '';
      cancionArtist = parsed?.artist || parsed?.artist_name || '';
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

  const mediaUrl = currentFile.urlMultimediaFull || currentFile.urlMultimedia || '';
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);

  return (
    <div className="fixed inset-0 bg-black/98 z-[9999] flex items-center justify-center animate-fade-in backdrop-blur-3xl" onClick={onClose}>
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full" />
      </div>

      <button 
        className="absolute top-8 right-8 text-white/50 hover:text-white p-3 z-[10000] bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-2xl border border-white/10 transition-all transform hover:rotate-90"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X className="w-7 h-7" />
      </button>

      {/* Progress Bars (Premium Style) */}
      <div className="absolute top-6 left-0 right-0 px-6 flex gap-2 z-[10001] max-w-[500px] mx-auto">
        {currentGroup.grupos_multimedia.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
            <div
              className={`h-full bg-gradient-to-r from-white to-white/60 transition-all duration-75 shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
              style={{ width: i < fileIndex ? '100%' : i === fileIndex ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      <div 
        className="w-full sm:w-[500px] h-full sm:h-[92vh] bg-black relative flex flex-col justify-center sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5"
        onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
      >
        {/* Navigation Hotspots */}
        <div className="absolute inset-y-0 left-0 w-1/4 z-20 cursor-w-resize" onClick={(e) => { e.stopPropagation(); handlePrev(); }}></div>
        <div className="absolute inset-y-0 right-0 w-1/4 z-20 cursor-e-resize" onClick={(e) => { e.stopPropagation(); handleNext(); }}></div>

        {cancionUrl && (
          <audio key={cancionUrl} ref={audioRef} src={cancionUrl} loop className="hidden" />
        )}

        <div key={`${currentGroup.id}-${fileIndex}`} className="w-full h-full animate-fade-in">
           {isVideo ? (
             <video src={mediaUrl} className="w-full h-full object-contain" autoPlay playsInline onEnded={handleNext} />
           ) : (
             <img src={mediaUrl} className="w-full h-full object-contain" alt={currentGroup.nombreGrupo} />
           )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none opacity-90" />
        
        <div className="absolute bottom-0 left-0 right-0 p-10 z-30 pointer-events-none flex flex-col justify-end">
          <div className="flex flex-wrap items-center gap-3 mb-4">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[10px] font-black text-white backdrop-blur-2xl border border-white/20 ${currentGroup.tipo_item === 'reel' ? 'bg-purple-600/50' : 'bg-blue-600/50'}`}>
                {currentGroup.tipo_item === 'reel' ? <Film className="w-3.5 h-3.5" /> : <BookImage className="w-3.5 h-3.5" />}
                <span className="tracking-[0.1em] uppercase">{currentGroup.tipo_item}</span>
             </div>
             {(cancionTitle && cancionUrl) && (
               <div 
                 className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 backdrop-blur-2xl text-[10px] font-bold text-white border border-white/10 hover:bg-white/10 transition-all pointer-events-auto cursor-pointer group"
                 onClick={(e) => { e.stopPropagation(); setIsAudioMuted(!isAudioMuted); }}
               >
                 <Music className={`w-3.5 h-3.5 text-emerald-400 ${isPlaying ? 'animate-bounce' : ''}`} />
                 <span className="truncate max-w-[180px]">{cancionTitle}</span>
                 {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
               </div>
             )}
          </div>
          
          <h3 className="text-white font-black text-2xl mb-2 uppercase tracking-tighter leading-none italic">
            {currentGroup.nombreGrupo}
          </h3>
          <p className="text-white/60 text-sm font-medium line-clamp-3 leading-relaxed max-w-[90%]">
            {currentGroup.descripcion || 'Descubre lo último de nuestra comunidad SENA.'}
          </p>
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center text-white border border-white/20 animate-pulse">
              <Play className="w-10 h-10 ml-1 fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Desktop Navigation Arrows */}
      <div className="hidden lg:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-16 pointer-events-none">
        <button 
          className={`p-5 rounded-3xl bg-white/5 hover:bg-white/10 text-white backdrop-blur-3xl border border-white/10 transition-all pointer-events-auto ${groupIndex === 0 && fileIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
        <button 
          className="p-5 rounded-3xl bg-white/5 hover:bg-white/10 text-white backdrop-blur-3xl border border-white/10 transition-all pointer-events-auto"
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      </div>
    </div>
  );
};

// === MAIN COMPONENT (ULTRA-PREMIUM) ===
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

  React.useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await axios.get('dashboard_multimedia');
        const historias = (res.data.historias || []).map((h: any) => ({ ...h, tipo_item: 'historia' }));
        const reels = (res.data.reels || []).map((r: any) => ({ ...r, tipo_item: 'reel' }));
        const merged: MultimediaItem[] = [];
        const maxLen = Math.max(historias.length, reels.length);
        for (let i = 0; i < maxLen; i++) {
          if (historias[i]) merged.push(historias[i]);
          if (reels[i]) merged.push(reels[i]);
        }
        setItems(merged);
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
    if (!first) return '';
    const url = first.urlMultimediaFull || first.urlMultimedia || '';
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    return url;
  };

  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

  if (loading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-6 scroll-hide">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="relative shrink-0 w-[140px] sm:w-[160px] aspect-[9/16] rounded-[2.5rem] bg-gray-200 dark:bg-coal-300 animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full relative group/carousel">
      {/* Navigation Arrows (Smart Visibility) */}
      {canScrollLeft && (
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 z-20 hidden sm:block animate-fade-in">
          <button 
            onClick={() => scroll('left')}
            className="p-3 rounded-2xl bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:bg-white/30 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
      )}

      {canScrollRight && (
        <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-20 hidden sm:block animate-fade-in">
          <button 
            onClick={() => scroll('right')}
            className="p-3 rounded-2xl bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:bg-white/30 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-5 overflow-x-auto pb-6 scroll-hide snap-x"
      >
        {items.map((item, idx) => {
          const thumb = getThumbnail(item);
          const isReel = item.tipo_item === 'reel';
          const Icon = isReel ? Film : BookImage;
          const accentColor = isReel ? 'bg-purple-600' : 'bg-blue-600';
          const accentGradient = isReel ? 'from-purple-600 to-indigo-900' : 'from-blue-600 to-cyan-900';

          return (
            <div
              key={`${item.tipo_item}-${item.id}`}
              onClick={() => {
                const primeAudio = new Audio();
                primeAudio.play().catch(() => {});
                setViewerIndex(idx);
              }}
              className="relative shrink-0 w-[150px] sm:w-[180px] md:w-[200px] aspect-[9/16] rounded-[2.5rem] overflow-hidden group cursor-pointer transition-all duration-700 snap-start shadow-2xl bg-black border border-white/5 hover:border-white/20"
            >
              {/* Dynamic Glow */}
              <div className={`absolute -inset-4 bg-gradient-to-br ${accentGradient} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-700`} />

              {thumb ? (
                <div className="absolute inset-0">
                   <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
                </div>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${accentGradient} opacity-40 flex items-center justify-center`}>
                   <Icon className="w-12 h-12 text-white/20" />
                </div>
              )}

              {/* Floating Icon */}
              <div className="absolute top-5 left-5 z-10">
                <div className={`${accentColor} p-2 rounded-2xl shadow-2xl backdrop-blur-2xl border border-white/20 group-hover:scale-110 group-hover:rotate-12 transition-all`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Center Play Button (Visible on Hover) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center text-white border border-white/20 shadow-2xl">
                  <Play className="w-6 h-6 ml-0.5 fill-white" />
                </div>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-2">
                      <div className={`w-1 h-3 bg-gradient-to-b ${accentGradient} rounded-full`} />
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">{item.tipo_item}</span>
                   </div>
                   <h4 className="text-white font-black text-sm sm:text-base leading-tight uppercase tracking-tighter line-clamp-2 italic">
                     {item.nombreGrupo}
                   </h4>
                   <div className="flex items-center gap-2 pt-2 transition-all duration-700">
                      <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                        {item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Ver contenido'}
                      </span>
                   </div>
                </div>
              </div>

              {/* Decorative Shimmers */}
              <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </div>
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
      
      <style>{`
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MultimediaCapsulas;

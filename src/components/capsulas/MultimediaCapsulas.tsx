import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Film, BookImage, Play, ChevronLeft, ChevronRight, X, Music, Volume2, VolumeX } from 'lucide-react';
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
}

// === VIEWER COMPONENT ===
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
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [fileIndex, setFileIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const duration = 5000;
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const playPromiseRef = React.useRef<Promise<void> | null>(null);

  const currentGroup = items[groupIndex];
  const currentFile = currentGroup?.grupos_multimedia?.[fileIndex];

  let cancionUrl = '';
  let cancionTitle = '';
  let cancionArtist = '';
  if (currentFile?.cancion) {
    try {
      let parsed = currentFile.cancion;
      // Handle deep/multiple stringification (up to 5 levels)
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
      
      if (cancionUrl === 'null' || cancionUrl === 'undefined') cancionUrl = '';
      if (cancionTitle === 'null' || cancionTitle === 'undefined') cancionTitle = '';
    } catch (e) {
      console.error('Error parsing cancion:', e);
    }
  }

  // Debug log moved to effect
  useEffect(() => {
    if (currentFile?.cancion) {
      console.log('Multimedia Debug:', {
        fileId: currentFile?.id,
        cancionUrl,
        cancionTitle,
        roles
      });
    }
  }, [currentFile?.id, cancionUrl, roles]);

  const playAudio = async () => {
    const audio = audioRef.current;
    if (!audio || !cancionUrl) return;

    if (isPlaying && !isAudioMuted) {
      try {
        playPromiseRef.current = audio.play();
        await playPromiseRef.current;
      } catch (err: any) {
        if (err.name !== 'AbortError' && err.name !== 'NotSupportedError') {
          console.warn('Audio play failed:', err);
        }
      }
    } else {
      audio.pause();
    }
  };

  useEffect(() => {
    playAudio();
  }, [isPlaying, isAudioMuted, fileIndex, cancionUrl]);

  // Global listener to "unlock" audio on first interaction within the viewer
  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current && isPlaying && !isAudioMuted) {
        audioRef.current.play().catch(() => {});
      }
    };
    
    window.addEventListener('click', unlockAudio);
    return () => window.removeEventListener('click', unlockAudio);
  }, [isPlaying, isAudioMuted]);

  useEffect(() => {
    if (!isPlaying || !currentGroup) return;

    const interval = setInterval(() => {
      setProgress(p => p + (100 / (duration / 50)));
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, groupIndex, fileIndex, currentGroup]);

  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
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

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    
    // Explicit play/pause in response to click for user activation
    const audio = audioRef.current;
    if (audio && cancionUrl) {
      if (nextState && !isAudioMuted) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }
  };

  if (!currentGroup || !currentFile) return null;

  const mediaUrl = currentFile.urlMultimediaFull || currentFile.urlMultimedia || '';
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);

  const getMediaContent = () => {
    if (!mediaUrl) return <div className="flex items-center justify-center h-full text-white/20">Sin contenido</div>;

    // Detectar YouTube
    const ytMatch = mediaUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=0&controls=1`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Detectar TikTok
    if (mediaUrl.includes('tiktok.com')) {
      const videoId = mediaUrl.split('/video/')[1]?.split('?')[0];
      if (videoId) {
        return (
          <iframe
            src={`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1`}
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        );
      }
    }

    // Detectar Instagram Reels
    if (mediaUrl.includes('instagram.com/reels/') || mediaUrl.includes('instagram.com/reel/')) {
      const reelId = mediaUrl.includes('/reels/') ? mediaUrl.split('/reels/')[1]?.split('/')[0] : mediaUrl.split('/reel/')[1]?.split('/')[0];
      if (reelId) {
        return (
          <iframe
            src={`https://www.instagram.com/reels/${reelId}/embed`}
            className="w-full h-full border-0"
            allowFullScreen
          />
        );
      }
    }

    if (isVideo) {
      return (
        <video 
          src={mediaUrl} 
          className="w-full h-full object-contain" 
          autoPlay 
          playsInline
          onEnded={handleNext}
        />
      );
    }

    return <img src={mediaUrl} className="w-full h-full object-contain" alt={currentGroup.nombreGrupo} />;
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center animate-fade-in" onClick={onClose}>
      <button 
        className="absolute top-6 right-6 text-white/50 hover:text-white p-2 z-[10000] bg-white/10 rounded-full backdrop-blur-md transition-all"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute top-4 left-0 right-0 px-4 flex gap-1.5 z-[10001] max-w-[450px] mx-auto">
        {currentGroup.grupos_multimedia.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-75"
              style={{ width: i < fileIndex ? '100%' : i === fileIndex ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      <div 
        className="w-full sm:w-[450px] h-full sm:h-[90vh] bg-black relative flex flex-col justify-center sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={togglePlay}
      >
        <div className="absolute inset-y-0 left-0 w-1/4 z-20 cursor-w-resize" onClick={(e) => { e.stopPropagation(); handlePrev(); }}></div>
        <div className="absolute inset-y-0 right-0 w-1/4 z-20 cursor-e-resize" onClick={(e) => { e.stopPropagation(); handleNext(); }}></div>

        {cancionUrl && (
          <audio key={cancionUrl} ref={audioRef} src={cancionUrl} loop className="hidden" />
        )}

        <div key={`${currentGroup.id}-${fileIndex}`} className="w-full h-full">
          {getMediaContent()}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 z-30 pointer-events-none flex flex-col justify-end">
          <div className="flex flex-wrap items-center gap-2 mb-2">
             <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${currentGroup.tipo_item === 'reel' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                <span>{currentGroup.tipo_item === 'reel' ? <Film className="w-3 h-3" /> : <BookImage className="w-3 h-3" />}</span>
                <span>{currentGroup.tipo_item.toUpperCase()}</span>
             </span>
             {(cancionTitle && cancionUrl) && (
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsAudioMuted(!isAudioMuted); }}
                 className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-medium text-white border border-white/20 hover:bg-black/60 transition-all pointer-events-auto"
               >
                 <Music className="w-3 h-3 text-white/80" />
                 <span className="truncate max-w-[150px]">{cancionTitle}{cancionArtist ? ` - ${cancionArtist}` : ''}</span>
                 {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 ml-1 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 ml-1 text-green-400" />}
               </button>
             )}
          </div>
          <h3 className="text-white font-black text-xl mb-1"><span>{currentGroup.nombreGrupo}</span></h3>
          {currentGroup.descripcion ? (
            <p className="text-white/80 text-sm font-medium line-clamp-3"><span>{currentGroup.descripcion}</span></p>
          ) : (
            <p className="text-white/60 text-sm font-medium"><span>Cápsulas formativas SENA</span></p>
          )}
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="w-20 h-20 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20">
              <Play className="w-8 h-8 ml-1" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-10 pointer-events-none">
        <button 
          className={`p-4 rounded-full bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all pointer-events-auto ${groupIndex === 0 && fileIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button 
          className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all pointer-events-auto"
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

// === MAIN COMPONENT ===
const MultimediaCapsulas = () => {
  const [items, setItems] = useState<MultimediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await axios.get('dashboard_multimedia');
        const historias = (res.data.historias || []).map((h: any) => ({
          ...h,
          tipo_item: 'historia'
        }));
        const reels = (res.data.reels || []).map((r: any) => ({
          ...r,
          tipo_item: 'reel'
        }));
        
        const merged: MultimediaItem[] = [];
        const maxLen = Math.max(historias.length, reels.length);
        for (let i = 0; i < maxLen; i++) {
          if (historias[i]) merged.push(historias[i]);
          if (reels[i]) merged.push(reels[i]);
        }
        setItems(merged);
      } catch (err) {
        console.error('Error fetching multimedia:', err);
        setItems([]);
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
    const isExternal = url.includes('tiktok.com') || url.includes('instagram.com') || url.includes('facebook.com');
    if (isExternal && !isVideo(url)) return '';
    return url;
  };

  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scroll-hide">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative shrink-0 w-[120px] sm:w-[140px] aspect-[9/16] rounded-2xl bg-gray-200 dark:bg-coal-300 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-coal-500/50 rounded-2xl p-8 border border-dashed border-gray-200 dark:border-gray-700 text-center">
        <KeenIcon icon="video" className="text-3xl text-gray-300 mb-2" />
        <p className="text-gray-400 text-sm font-medium">No hay cápsulas multimedia disponibles</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-2 scroll-hide snap-x">
        {items.map((item, idx) => {
          const thumb = getThumbnail(item);
          const isReel = item.tipo_item === 'reel';
          const Icon = isReel ? Film : BookImage;
          const accentColor = isReel ? 'bg-purple-600' : 'bg-blue-600';

          return (
            <div
              key={`${item.tipo_item}-${item.id}`}
              onClick={() => {
                // Prime the audio context on the first user interaction
                const primeAudio = new Audio();
                primeAudio.play().catch(() => {});
                setViewerIndex(idx);
              }}
              className="relative shrink-0 w-[115px] sm:w-[135px] md:w-[150px] aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer border border-transparent hover:border-white/20 transition-all snap-start shadow-lg"
            >
              {thumb ? (
                thumb.includes('img.youtube.com') || !isVideo(thumb) ? (
                  <img src={thumb} alt={item.nombreGrupo} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <video src={thumb} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" muted />
                )
              ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${isReel ? 'from-purple-900 to-indigo-900' : 'from-blue-900 to-cyan-900'} flex items-center justify-center`}>
                   <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-60 transition-opacity">
                      <Icon className="w-10 h-10 text-white" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest"><span>{isReel ? 'Reel' : 'Story'}</span></span>
                   </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 z-10">
                <div className={`${accentColor} p-1.5 rounded-xl shadow-lg backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40 scale-75 group-hover:scale-100 transition-transform">
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                <h4 className="text-white font-bold text-[11px] sm:text-xs leading-tight mb-1 line-clamp-2"><span>{item.nombreGrupo}</span></h4>
                <div className="flex items-center gap-1.5 text-white/60 text-[9px] font-bold uppercase tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-full ${accentColor}`} />
                  <span>{isReel ? 'Reel' : 'Historia'}</span>
                </div>
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

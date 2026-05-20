import React, { useState } from 'react';
import { Modal, ModalContent, ModalBody } from '@/components/modal';
import { KeenIcon } from '@/components';
import { ChevronLeft, ChevronRight, X, Music } from 'lucide-react';

interface Multimedia {
  id: number;
  urlMultimedia: string;
  urlMultimediaFull?: string;
  cancion: any;
  tipo: string;
}

interface GrupoMultimedia {
  id: number;
  nombreGrupo: string;
  tipo: 'historia' | 'reel';
  descripcion?: string;
  grupos_multimedia: Multimedia[];
}

interface ViewModalProps {
  open: boolean;
  grupo: GrupoMultimedia | null;
  onClose: () => void;
}

const MultimediaViewModal = ({ open, grupo, onClose }: ViewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!grupo || !grupo.grupos_multimedia || grupo.grupos_multimedia.length === 0) return null;

  const items = grupo.grupos_multimedia;
  const currentItem = items[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${backendUrl}${normalizedUrl}`;
  };

  const mediaUrl = getImageUrl(currentItem.urlMultimediaFull || currentItem.urlMultimedia);
  const isVid = isVideo(mediaUrl);

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    
    if (url.includes('tiktok.com')) {
      const videoId = url.split('/video/')[1]?.split('?')[0];
      if (videoId) return `https://www.tiktok.com/player/v1/${videoId}?autoplay=1`;
    }
    
    if (url.includes('instagram.com/reels/')) {
      const reelId = url.split('/reels/')[1]?.split('/')[0];
      if (reelId) return `https://www.instagram.com/reels/${reelId}/embed`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(mediaUrl);

  const getParsedSong = (cancion: any) => {
    if (!cancion) return null;
    try {
      const firstParse = typeof cancion === 'string' ? JSON.parse(cancion) : cancion;
      return typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse;
    } catch {
      return null;
    }
  };

  const song = getParsedSong(currentItem.cancion);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="w-full max-w-4xl p-0 bg-transparent border-0 shadow-none overflow-hidden h-[90vh] flex flex-col justify-center">
        <div className="relative group w-full h-full flex items-center justify-center bg-black/90 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl">
          
          {/* Header Info */}
          <div className="absolute top-0 left-0 right-0 p-6 z-50 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-white drop-shadow-md">
                {grupo.nombreGrupo}
              </h3>
              {grupo.descripcion && (
                <p className="text-sm text-gray-300 line-clamp-1 drop-shadow-md">
                  {grupo.descripcion}
                </p>
              )}
              <div className="flex gap-1 mt-2">
                {items.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Media Content */}
          <div className="w-full h-full flex items-center justify-center p-4 pt-20">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full rounded-2xl shadow-2xl"
                allow="autoplay; fullscreen"
                title={grupo.nombreGrupo}
              />
            ) : isVid ? (
              <video
                key={mediaUrl}
                src={mediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-2xl shadow-2xl"
              />
            ) : (
              <img
                src={mediaUrl}
                alt=""
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
            )}
          </div>

          {/* Music Info */}
          {song && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-2xl rounded-full border border-white/20 shadow-2xl animate-bounce-slow">
              <div className="bg-white/20 p-2 rounded-full">
                <Music className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {song.title}
                </span>
                <span className="text-[10px] text-white/70 font-medium italic">
                  {song.artist}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/10 hover:bg-white/25 rounded-full text-white backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 border border-white/10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/10 hover:bg-white/25 rounded-full text-white backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 border border-white/10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Bottom Counter */}
          <div className="absolute bottom-6 right-8 text-white/50 text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md">
            {currentIndex + 1} / {items.length}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default MultimediaViewModal;

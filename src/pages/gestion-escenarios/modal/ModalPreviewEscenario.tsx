import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { Escenario } from './types';

interface ModalProps {
  open: boolean;
  data?: Escenario;
  onClose: () => void;
}

const ModalPreviewOpen = ({ open, data, onClose }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const getFullUrl = (url?: string) =>
    url?.startsWith('http') ? url : url ? `http://localhost:8002${url}` : '';

  useEffect(() => {
    if (!data) return;

    const mainImage = data.imagenUrl ? [{ type: 'image' as const, url: data.imagenUrl }] : [];

    const images = data.imagenes?.map(img => ({
      type: 'image' as const,
      url: img.urlImage || img.url || ''
    })).filter(img => img.url) || [];

    const videos = data.videos?.map(vid => ({
      type: 'video' as const,
      url: vid.urlVideo || vid.url || ''
    })).filter(vid => vid.url) || [];

    setMediaItems([...mainImage, ...images, ...videos]);
    setCurrentIndex(0);
  }, [data]);

  // para controlar reproducción automática
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === currentIndex) {
        video.play().catch(() => {}); // autoplay
      } else {
        video.pause();
        video.currentTime = 0; // reiniciar cuando se cambia
      }
    });
  }, [currentIndex]);

  const prev = () => setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  const next = () => setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  const handleThumbnailClick = (index: number) => setCurrentIndex(index);

  if (!data) return null;

  return (
    <Modal open={open} >
      <ModalContent className="max-w-[600px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>
            Vista Previa
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="space-y-4 py-5">
          <section className='bg-gray-100 border-b-3 px-3 pb-1 space-y-2 rounded-md'>
            <h2 className="text-2xl font-bold py-1 text-gray-800">{data.nombre}</h2>

            <div className="flex items-center gap-5 text-sm font-medium">
              <span className="block mb-1 text-sm font-medium">{data.tipo}</span>
              <span className="block mb-1 text-sm font-medium">Capacidad: {data.capacidad}</span>
              <span className="block mb-1 text-sm font-medium">N° {data.numero}</span>
            </div>
          </section>

          <div>
            <h3 className="font-semibold text-lg mb-1">Descripción</h3>
            <p className="text-gray-700">{data.descripcion || 'Sin descripción'}</p>
          </div>

          {mediaItems.length > 0 && (
            <div className="space-y-2">
              <div className="relative">
                <ArrowLeftCircle
                  size={30}
                  className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600 z-10"
                  onClick={prev}
                />
                <ArrowRightCircle
                  size={30}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600 z-10"
                  onClick={next}
                />

                <div className="w-full h-64 rounded-md overflow-hidden shadow-md">
                  {mediaItems[currentIndex].type === 'image' ? (
                    <img
                      src={getFullUrl(mediaItems[currentIndex].url)}
                      alt={`media-${currentIndex}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      ref={(el) => (videoRefs.current[currentIndex] = el)}
                      src={getFullUrl(mediaItems[currentIndex].url)}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Miniaturas */}
              <div className="flex gap-2 overflow-x-auto mt-2">
                {mediaItems.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => handleThumbnailClick(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 cursor-pointer ${
                      i === currentIndex ? 'border-blue-500' : 'border-gray-300'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={getFullUrl(item.url)}
                        alt={`thumb-${i}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={getFullUrl(item.url)}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediaItems.length === 0 && data.imagenUrl && (
            <img
              src={getFullUrl(data.imagenUrl)}
              alt="Imagen principal"
              className="w-full h-64 object-cover rounded-md shadow-md"
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalPreviewOpen };
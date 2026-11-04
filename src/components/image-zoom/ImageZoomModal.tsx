import React from 'react';
import { Modal } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ImageZoomModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
  /** Nombre o título opcional debajo de la imagen */
  title?: string;
}

/**
 * Modal reutilizable para zoom en imágenes de perfil.
 * Overlay oscuro, imagen ampliada, botón cerrar.
 */
const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ open, onClose, src, alt = 'Imagen', title }) => {
  return (
    <Modal open={open} onClose={onClose} zIndex={1500}>
      <div
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/80"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div
          className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-10 right-0 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors z-10"
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" className="w-5 h-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
          />
          {title && (
            <p className="mt-2 text-sm font-medium text-white text-center max-w-md truncate" title={title}>
              {title}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export { ImageZoomModal };

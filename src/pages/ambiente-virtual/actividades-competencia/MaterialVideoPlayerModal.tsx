import React, { useMemo, useRef } from 'react';
import { KeenIcon } from '@/components';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import {
  resolveMaterialDocumentoAbsoluteUrl,
  youtubeEmbedUrl,
  youtubeWatchUrl,
} from '@/pages/ambiente-virtual/actividades/materialDocumentoSupport';
import type { MaterialCompetenciaRecursoItem } from './materialCompetencia.types';
import { esAudioFormato, nombreRecurso } from './materialCompetenciaRecurso';

interface MaterialVideoPlayerModalProps {
  open: boolean;
  titulo?: string | null;
  urlVideo?: string | null;
  urlVideoUrl?: string | null;
  recurso?: MaterialCompetenciaRecursoItem | null;
  onClose: () => void;
}

const MaterialVideoPlayerModal: React.FC<MaterialVideoPlayerModalProps> = ({
  open,
  titulo,
  urlVideo,
  urlVideoUrl,
  recurso,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const srcBruto = recurso?.url || recurso?.urlExterna || urlVideoUrl || urlVideo || '';
  const esAudio = recurso?.naturaleza === 'audio' || esAudioFormato(recurso?.formato);
  const tituloMostrado = (recurso ? nombreRecurso(recurso) : titulo) || 'Recurso';

  const esPdfExterno = recurso?.naturaleza === 'pdf_externo';

  const resuelto = useMemo(() => {
    if (!open) return null;
    const src = resolveMaterialDocumentoAbsoluteUrl(srcBruto) || srcBruto;
    if (!src) return null;
    const yt = youtubeEmbedUrl(src);
    if (yt) return { kind: 'youtube' as const, src: yt, watch: youtubeWatchUrl(src) };
    if (esPdfExterno) return { kind: 'pdf' as const, src };
    if (esAudio) return { kind: 'audio' as const, src };
    return { kind: 'video' as const, src };
  }, [open, srcBruto, esAudio, esPdfExterno]);

  return (
    <Modal open={open} onClose={onClose} zIndex={120}>
      <ModalContent className="max-w-4xl w-[calc(100%-2rem)] top-[4vh] max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-2xl shadow-xl mx-auto">
        <ModalHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <ModalTitle className="text-base font-semibold text-gray-900 dark:text-white truncate pr-2">
            {tituloMostrado}
          </ModalTitle>
          <button type="button" onClick={onClose} className="btn btn-sm btn-light shrink-0" aria-label="Cerrar">
            <KeenIcon icon="cross" className="text-base" />
          </button>
        </ModalHeader>
        <ModalBody className="p-4 overflow-auto flex-1 min-h-0 bg-gray-950/5 dark:bg-black/20 space-y-3">
          {resuelto?.kind === 'youtube' ? (
            <>
              <iframe
                title={tituloMostrado}
                src={resuelto.src}
                className="w-full rounded-lg bg-black aspect-video max-h-[72vh]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              {resuelto.watch ? (
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={resuelto.watch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-xs font-medium text-primary hover:underline"
                  >
                    Abrir en YouTube
                  </a>
                  <p className="text-[11px] text-gray-500 dark:text-gray-300">
                    Si el video no se reproduce aquí, ábralo en YouTube.
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
          {resuelto?.kind === 'video' ? (
            <video
              key={resuelto.src}
              ref={videoRef}
              src={resuelto.src}
              controls
              controlsList="nodownload"
              className="w-full rounded-lg bg-black max-h-[70vh]"
              style={{ width: '100%', maxHeight: '70vh' }}
            />
          ) : null}
          {resuelto?.kind === 'audio' ? (
            <audio key={resuelto.src} ref={audioRef} src={resuelto.src} controls className="w-full mt-4">
              Su navegador no admite audio HTML5.
            </audio>
          ) : null}
          {resuelto?.kind === 'pdf' ? (
            <>
              <iframe
                title={tituloMostrado}
                src={resuelto.src}
                className="w-full rounded-lg bg-white min-h-[60vh] h-[70vh]"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-wrap gap-3">
                <a
                  href={resuelto.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-xs font-medium text-primary hover:underline"
                >
                  Abrir en otra pestaña
                </a>
                <p className="text-[11px] text-gray-500 dark:text-gray-300">
                  Si el PDF no se muestra aquí, el sitio externo no permite la vista integrada.
                </p>
              </div>
            </>
          ) : null}
          {!resuelto ? (
            <p className="text-sm font-medium text-gray-700 dark:text-white">
              El recurso no está disponible o no se pudo cargar.
            </p>
          ) : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default MaterialVideoPlayerModal;

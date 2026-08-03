import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import type { Actividad } from './ModalCrearActividad';

interface Pregunta {
  id: number;
  descripcion: string;
  puntaje: number;
  tipoPregunta?: { tipoPregunta: string };
  respuestas?: { id: number; descripcionRespuesta: string; chkCorrecta: boolean }[];
  urlDocumento?: string;
}

interface ActividadConPreguntas extends Actividad {
  preguntas?: Pregunta[];
  documentoActividadUrl?: string | null;
}

interface ModalVerActividadProps {
  open: boolean;
  onClose: () => void;
  actividad: Actividad | null;
}

const getDocumentUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
      return base + path;
    } catch {
      const pathMatch = url.match(/\/storage\/.*$/);
      if (pathMatch) {
        const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
        return base + pathMatch[0];
      }
      return url;
    }
  }
  if (url.startsWith('/storage/')) {
    const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
    return base + url;
  }
  if (url.startsWith('storage/')) {
    const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
    return base + '/' + url;
  }
  const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
  return base + '/storage/' + url;
};

const nombreCompleto = (p: Actividad['persona']) => {
  if (!p) return 'Sin asignar';
  return `${p.nombre1 || ''} ${p.nombre2 || ''} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim() || 'Sin asignar';
};

const ModalVerActividad: React.FC<ModalVerActividadProps> = ({ open, onClose, actividad }) => {
  const [actividadCompleta, setActividadCompleta] = useState<ActividadConPreguntas | null>(actividad as ActividadConPreguntas | null);

  useEffect(() => {
    if (!open || !actividad) {
      setActividadCompleta(actividad as ActividadConPreguntas | null);
      return;
    }
    if (actividad.tipoActividad === 'cuestionario') {
      axios.get(`actividades/${actividad.id}`).then((r) => setActividadCompleta(r.data)).catch(() => setActividadCompleta(actividad as ActividadConPreguntas));
    } else {
      setActividadCompleta(actividad as ActividadConPreguntas);
    }
  }, [open, actividad]);

  const act = actividadCompleta || actividad;
  const documentoUrl = (act as any)?.documentoActividadUrl || act?.pathDocumentoActividad;
  const docUrl = getDocumentUrl(documentoUrl);
  const isPdf = documentoUrl?.toLowerCase().endsWith('.pdf');

  if (!act) return null;

  return (
    <Modal open={open} onClose={onClose} zIndex={110}>
      <ModalContent className="max-w-4xl top-[5%] max-h-[90vh] overflow-hidden flex flex-col p-4">
        <ModalHeader>
          <ModalTitle>Ver Actividad</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto px-0 py-5 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]">
          {/* Info de la actividad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{act.tituloActividad}</h3>
              {act.descripcionActividad && (
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{act.descripcionActividad}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <img
                  src={act.persona?.rutaFotoUrl || act.persona?.rutaFoto || '/media/avatars/blank.png'}
                  alt={nombreCompleto(act.persona)}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Autor</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{nombreCompleto(act.persona)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">RAP</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {act.materia?.codigo ? `${act.materia.codigo} - ` : ''}
                  {act.materia?.nombreMateria || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Entregables</p>
                <p className="text-sm text-gray-900 dark:text-white">{act.entregables || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
                <p className="text-sm text-gray-900 dark:text-white capitalize">{act.tipoActividad === 'cuestionario' ? 'Cuestionario' : (act.tipoActividad || '-')}</p>
              </div>
            </div>
          </div>

          {/* Preguntas del cuestionario */}
          {act.tipoActividad === 'cuestionario' && (actividadCompleta?.preguntas?.length ?? 0) > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Preguntas</h4>
              {(actividadCompleta?.preguntas ?? []).map((preg, idx) => (
                <div key={preg.id} className="border-b border-gray-100 dark:border-gray-600 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pregunta {idx + 1}</span>
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {preg.tipoPregunta?.tipoPregunta || 'Párrafo'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{preg.descripcion}</p>
                  {preg.urlDocumento && (
                    <div className="mb-2">
                      <img
                        src={getDocumentUrl(preg.urlDocumento) ?? '#'}
                        alt="Imagen pregunta"
                        className="max-w-[200px] max-h-[150px] object-contain rounded border border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                  {preg.respuestas && preg.respuestas.length > 0 && (
                    <ul className="space-y-1.5">
                      {preg.respuestas.map((r) => (
                        <li
                          key={r.id}
                          className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded ${
                            r.chkCorrecta ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{r.descripcionRespuesta}</span>
                          {r.chkCorrecta && (
                            <span className="text-xs font-medium shrink-0">
                              <KeenIcon icon="check" className="text-green-600 dark:text-green-400" /> Correcta
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Documento PDF */}
          {docUrl && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-coal-400">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Documento de la actividad</span>
                <a
                  href={docUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    if (docUrl) {
                      window.open(docUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <KeenIcon icon="download" className="text-sm" />
                  Abrir en nueva pestaña
                </a>
              </div>
              {isPdf && docUrl ? (
                <iframe
                  src={docUrl}
                  title="Documento de la actividad"
                  className="w-full h-[500px] border-0"
                />
              ) : (
                <div className="p-6 text-center bg-gray-50 dark:bg-coal-400">
                  <KeenIcon icon="document" className="text-4xl text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Vista previa no disponible para este tipo de archivo
                  </p>
                  {docUrl && (
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        if (docUrl) {
                          window.open(docUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >
                      <KeenIcon icon="download" className="text-sm" />
                      Descargar documento
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {!docUrl && (
            <div className="p-6 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <KeenIcon icon="document" className="text-4xl text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Esta actividad no tiene documento adjunto</p>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalVerActividad;

import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import type { AprendizCalificacion } from './ModalAprendices';

const getDocumentUrl = (path: string | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const getFileName = (path: string | undefined): string => {
  const raw = String(path ?? '').split('?')[0].split('#')[0];
  const base = raw.split('/').pop() || '';
  try {
    return decodeURIComponent(base) || 'archivo';
  } catch {
    return base || 'archivo';
  }
};

const pickFileNameFromContentDisposition = (headerValue: string | null | undefined): string | null => {
  const raw = String(headerValue ?? '').trim();
  if (!raw) return null;
  // filename*=UTF-8''...
  const matchStar = raw.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (matchStar?.[1]) {
    try {
      return decodeURIComponent(matchStar[1]);
    } catch {
      return matchStar[1];
    }
  }
  const match = raw.match(/filename\s*=\s*"([^"]+)"/i) || raw.match(/filename\s*=\s*([^;]+)/i);
  if (!match?.[1]) return null;
  return match[1].trim().replace(/^"|"$/g, '') || null;
};

const triggerBrowserDownload = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'archivo';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

interface ModalVerRespuestaYCalificarProps {
  open: boolean;
  onClose: () => void;
  aprendiz: AprendizCalificacion | null;
  onCalificado: () => void;
  onSuccess?: (message: string) => void;
  /** Si es 'con evidencia', solo se permite calificar si hay archivo o comentario del aprendiz */
  tipoActividad?: string | null;
}

const ModalVerRespuestaYCalificar: React.FC<ModalVerRespuestaYCalificarProps> = ({
  open,
  onClose,
  aprendiz,
  onCalificado,
  onSuccess,
  tipoActividad
}) => {
  const [calificacion, setCalificacion] = useState<string>('');
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open && aprendiz) {
      setCalificacion(aprendiz.calificacionNumerica != null ? String(aprendiz.calificacionNumerica) : '');
      setComentario(aprendiz.ComentarioDocente || '');
    }
  }, [open, aprendiz]);

  const handleAceptar = async () => {
    if (!aprendiz) return;
    const nota = parseFloat(calificacion);
    if (isNaN(nota) || nota < 0) {
      alert('Ingresa una calificación válida (0 o mayor).');
      return;
    }
    setGuardando(true);
    try {
      await axios.post('calificacion-actividad/calificar', {
        idCalificacionActividad: aprendiz.idCalificacionActividad,
        calificacionNumerica: nota,
        ComentarioDocente: comentario.trim() || null
      });
      onSuccess?.('Calificación registrada correctamente');
      onCalificado();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.error || e.response?.data?.errors?.calificacionNumerica?.[0] || 'Error al calificar');
    } finally {
      setGuardando(false);
    }
  };

  if (!aprendiz) return null;

  const docUrl = getDocumentUrl(aprendiz.archivo ?? undefined);
  const isPdf = (aprendiz.archivo || '').toLowerCase().endsWith('.pdf');
  const fileName = getFileName(aprendiz.archivo ?? undefined);
  const requiereEvidencia = tipoActividad === 'con evidencia';
  const tieneEvidencia = !!(String(aprendiz.archivo ?? '').trim() || String(aprendiz.ComentarioEstudiante ?? '').trim());
  const puedeCalificar = !requiereEvidencia || tieneEvidencia;

  const handleDownload = async () => {
    try {
      const resp = await axios.get(`calificacion-actividad/${aprendiz.idCalificacionActividad}/descargar-archivo`, {
        responseType: 'blob',
      });
      const headerName = resp.headers?.['content-disposition'] ?? resp.headers?.['Content-Disposition'];
      const resolvedName = pickFileNameFromContentDisposition(headerName) || fileName || 'entrega';
      const blob = resp.data instanceof Blob ? resp.data : new Blob([resp.data]);
      triggerBrowserDownload(blob, resolvedName);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'No fue posible descargar el archivo');
    }
  };

  return (
    <Modal open={open} onClose={onClose} zIndex={120}>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <ModalHeader>
          <ModalTitle>Respuesta instructor</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Respuesta aprendiz</label>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-coal-500/30 border border-gray-200 dark:border-gray-600 min-h-[60px] max-h-[120px] overflow-y-auto">
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {aprendiz.ComentarioEstudiante || 'Sin respuesta escrita'}
              </p>
            </div>
          </div>

          {docUrl && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Documento</label>
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-coal-500/30">
                {isPdf ? (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-600 px-4 py-2.5">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate" title={fileName}>
                        {fileName}
                      </p>
                      <div className="flex items-center gap-3">
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          <KeenIcon icon="eye" />
                          Abrir
                        </a>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          title="Descargar archivo"
                        >
                          <KeenIcon icon="download" />
                          Descargar
                        </button>
                      </div>
                    </div>
                    <iframe
                      src={docUrl}
                      title="Documento del aprendiz"
                      className="w-full h-[400px] min-h-[300px]"
                    />
                  </div>
                ) : (
                  <div className="p-4">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate" title={fileName}>
                      {fileName}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <KeenIcon icon="eye" />
                        Abrir documento adjunto
                      </a>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                          title="Descargar archivo"
                        >
                          <KeenIcon icon="download" />
                          Descargar archivo
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {requiereEvidencia && !tieneEvidencia && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Las actividades con evidencia requieren que el aprendiz adjunte un archivo o enlace antes de poder calificar.
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Calificación numérica (1 a 5, a criterio del instructor)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={calificacion}
              onChange={(e) => setCalificacion(e.target.value)}
              placeholder="Ej: 4.5"
              className="input w-full max-w-[120px] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comentario del docente (opcional)</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value.slice(0, 2000))}
              placeholder="Observaciones o retroalimentación..."
              className="input w-full text-sm min-h-[80px]"
              maxLength={2000}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
              onClick={onClose}
            >
              CANCELAR
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              onClick={handleAceptar}
              disabled={guardando || !puedeCalificar}
            >
              {guardando ? 'Guardando...' : '+ ACEPTAR'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalVerRespuestaYCalificar;

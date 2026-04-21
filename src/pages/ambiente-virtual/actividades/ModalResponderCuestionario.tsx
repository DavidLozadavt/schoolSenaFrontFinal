import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon, ImageZoomModal } from '@/components';
import axios from 'axios';

interface Pregunta {
  id: number;
  descripcion: string;
  tipoPregunta?: { tipoPregunta?: string };
  urlDocumento?: string | null;
  respuestas?: Array<{ id: number; descripcionRespuesta: string; chkCorrecta: boolean }>;
}

interface ActividadCuestionario {
  id: number;
  tituloActividad?: string;
  preguntas?: Pregunta[];
}

interface MaterialApoyoItem {
  id: number;
  titulo?: string | null;
  urlDocumento?: string | null;
  urlDocumentoUrl?: string | null;
  urlAdicional?: string | null;
}

interface ActividadAprendiz {
  idCalificacionActividad: number;
  idActividad: number;
  tituloActividad?: string;
  tipoActividad?: string | null;
  preguntas?: Pregunta[];
  pathDocumentoActividad?: string | null;
  documentoActividadUrl?: string | null;
  materialesApoyo?: MaterialApoyoItem[];
}

interface ModalResponderCuestionarioProps {
  actividad: ActividadAprendiz | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onSuccess?: (message: string) => void;
}

const getDocumentUrl = (path: string | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const getActividadDocumentoUrl = (a: ActividadAprendiz): string | null => {
  const raw = a.documentoActividadUrl || a.pathDocumentoActividad;
  return raw ? getDocumentUrl(raw) : null;
};

const getFileName = (path?: string | null): string => {
  if (!path) return 'Documento';
  const parts = path.split('/');
  return parts[parts.length - 1] || 'Documento';
};

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const ModalResponderCuestionario: React.FC<ModalResponderCuestionarioProps> = ({
  actividad,
  open,
  onClose,
  onSaved,
  onSuccess
}) => {
  const [actividadCompleta, setActividadCompleta] = useState<ActividadCuestionario | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, { idRespuesta?: number; respuesta?: string }>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [zoomImagen, setZoomImagen] = useState<{ src: string; alt: string } | null>(null);

  const opcionesShuffled = useMemo(() => {
    const preguntas = actividadCompleta?.preguntas ?? [];
    const map: Record<number, Array<{ id: number; descripcionRespuesta: string; chkCorrecta: boolean }>> = {};
    preguntas.forEach((p) => {
      if (p.tipoPregunta?.tipoPregunta === 'Varias opciones' && p.respuestas?.length) {
        map[p.id] = shuffleArray(p.respuestas);
      }
    });
    return map;
  }, [actividadCompleta?.preguntas]);

  useEffect(() => {
    if (!open || !actividad) {
      setActividadCompleta(null);
      setRespuestas({});
      setError(null);
      setCurrentQuestionIndex(0);
      return;
    }
    const actividadConPreguntas = actividad as ActividadAprendiz & { preguntas?: Pregunta[] };
    if (actividadConPreguntas.preguntas && actividadConPreguntas.preguntas.length > 0) {
      setActividadCompleta({
        id: actividad.idActividad,
        tituloActividad: actividad.tituloActividad,
        preguntas: actividadConPreguntas.preguntas
      });
      setRespuestas({});
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    axios
      .get(`actividades/${actividad.idActividad}`)
      .then((r) => {
        setActividadCompleta(r.data);
        setRespuestas({});
      })
      .catch(() => setError('No se pudo cargar el cuestionario'))
      .finally(() => setLoading(false));
  }, [open, actividad?.idActividad, actividad]);

  const handleRespuestaOpcion = useCallback((idPregunta: number, idRespuesta: number) => {
    setRespuestas((prev) => ({
      ...prev,
      [idPregunta]: { idRespuesta, respuesta: undefined }
    }));
  }, []);

  const handleRespuestaTexto = useCallback((idPregunta: number, texto: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [idPregunta]: { respuesta: texto.trim() || undefined }
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!actividad?.idCalificacionActividad || !actividadCompleta?.preguntas?.length) return;

      const payload = actividadCompleta.preguntas
        .map((p) => {
          const r = respuestas[p.id];
          if (!r) return null;
          if (r.idRespuesta) return { idPregunta: p.id, idRespuesta: r.idRespuesta };
          if (r.respuesta) return { idPregunta: p.id, respuesta: r.respuesta };
          return null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      setSaving(true);
      setError(null);
      try {
        await axios.post(
          `actividades-aprendiz/${actividad.idCalificacionActividad}/respuesta-cuestionario`,
          { respuestas: payload }
        );
        onSuccess?.('Cuestionario respondido correctamente');
        onSaved();
        onClose();
      } catch (err: any) {
        setError(err.response?.data?.error || 'No fue posible enviar las respuestas');
      } finally {
        setSaving(false);
      }
    },
    [actividad?.idCalificacionActividad, actividadCompleta?.preguntas, respuestas, onSaved, onClose]
  );

  if (!open) return null;

  const preguntas = actividadCompleta?.preguntas ?? [];
  const totalPreguntas = preguntas.length;
  const preg = preguntas[currentQuestionIndex];
  const isLast = currentQuestionIndex === totalPreguntas - 1;
  const isFirst = currentQuestionIndex === 0;
  const opciones = preg?.tipoPregunta?.tipoPregunta === 'Varias opciones' && preg.id
    ? (opcionesShuffled[preg.id] ?? preg.respuestas ?? [])
    : [];

  return (
    <>
    <Modal open={open} onClose={onClose} zIndex={115}>
      <ModalContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl rounded-2xl">
        <ModalHeader className="border-b border-gray-100 dark:border-gray-700/50 pb-4">
          <div className="flex items-start justify-between gap-4">
            <ModalTitle className="text-lg font-bold text-gray-900 dark:text-white">
              {actividadCompleta?.tituloActividad || 'Cuestionario'}
            </ModalTitle>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <KeenIcon icon="cross" className="w-5 h-5" />
            </button>
          </div>
          {preguntas.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Pregunta {currentQuestionIndex + 1} de {totalPreguntas}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                {preg?.tipoPregunta?.tipoPregunta || 'Párrafo'}
              </span>
              <div className="flex-1 min-w-[120px] flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / totalPreguntas) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {currentQuestionIndex + 1} / {totalPreguntas}
                </span>
              </div>
            </div>
          )}
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto py-6">
          {actividad && (
            <div className="px-6 pb-4 mb-4 space-y-4 border-b border-gray-100 dark:border-gray-700/50">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Material de apoyo
                </p>
                {actividad.materialesApoyo && actividad.materialesApoyo.length > 0 ? (
                  <ul className="space-y-2">
                    {actividad.materialesApoyo.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-coal-300"
                      >
                        <span className="text-gray-800 dark:text-gray-200 truncate min-w-0">
                          {m.titulo || 'Material'}
                        </span>
                        <span className="flex gap-2 shrink-0">
                          {(m.urlDocumentoUrl || m.urlDocumento) && (
                            <a
                              href={getDocumentUrl(m.urlDocumentoUrl || m.urlDocumento || '') ?? '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              Documento
                            </a>
                          )}
                          {m.urlAdicional && (
                            <a
                              href={m.urlAdicional.startsWith('http') ? m.urlAdicional : `https://${m.urlAdicional}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              Enlace
                            </a>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No hay material de apoyo</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Documento de la actividad
                </p>
                {getActividadDocumentoUrl(actividad) ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-coal-300">
                    <span className="text-sm text-gray-800 dark:text-gray-200 truncate min-w-0">
                      {getFileName(actividad.pathDocumentoActividad || actividad.documentoActividadUrl)}
                    </span>
                    <a
                      href={getActividadDocumentoUrl(actividad) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 shrink-0"
                    >
                      Abrir
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No hay documento de la actividad adjunto</p>
                )}
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : error && !actividadCompleta ? (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          ) : preg ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {preg.descripcion}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {preg.tipoPregunta?.tipoPregunta === 'Varias opciones'
                    ? 'Selecciona la opción correcta.'
                    : 'Escribe tu respuesta.'}
                </p>
                {preg.urlDocumento && (
                  <div className="mb-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const url = getDocumentUrl(preg.urlDocumento ?? undefined);
                        if (url) setZoomImagen({ src: url, alt: preg.descripcion || 'Imagen pregunta' });
                      }}
                      className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl overflow-hidden"
                    >
                      <img
                        src={getDocumentUrl(preg.urlDocumento) ?? '#'}
                        alt="Imagen pregunta"
                        className="max-w-full max-h-[200px] object-contain rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                      />
                    </button>
                  </div>
                )}
              </div>

              {preg.tipoPregunta?.tipoPregunta === 'Varias opciones' && opciones.length > 0 ? (
                <ul className="space-y-3">
                  {opciones.map((r) => {
                    const selected = respuestas[preg.id]?.idRespuesta === r.id;
                    return (
                      <li key={r.id}>
                        <label
                          className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                            selected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`preg-${preg.id}`}
                            checked={selected}
                            onChange={() => handleRespuestaOpcion(preg.id, r.id)}
                            className="w-5 h-5 rounded-full border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={`text-sm font-medium ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {r.descripcionRespuesta}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <textarea
                  value={respuestas[preg.id]?.respuesta ?? ''}
                  onChange={(e) => handleRespuestaTexto(preg.id, e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="input w-full text-sm min-h-[100px] rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 p-4"
                  rows={4}
                />
              )}

              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  {!isFirst && (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((i) => i - 1)}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Anterior
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isLast ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Enviando...' : 'Enviar respuesta'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          ) : actividadCompleta && !actividadCompleta.preguntas?.length ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No hay preguntas en este cuestionario.
            </p>
          ) : null}
        </ModalBody>
      </ModalContent>
    </Modal>
    {zoomImagen && (
      <ImageZoomModal
        open={!!zoomImagen}
        onClose={() => setZoomImagen(null)}
        src={zoomImagen.src}
        alt={zoomImagen.alt}
        title={zoomImagen.alt}
      />
    )}
  </>
  );
};

export default ModalResponderCuestionario;

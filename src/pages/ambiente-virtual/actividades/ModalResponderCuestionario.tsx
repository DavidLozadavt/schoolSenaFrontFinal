import React, { useState, useEffect, useCallback } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';

interface Pregunta {
  id: number;
  descripcion: string;
  tipoPregunta?: { tipoPregunta: string };
  urlDocumento?: string | null;
  respuestas?: Array<{ id: number; descripcionRespuesta: string; chkCorrecta: boolean }>;
}

interface ActividadCuestionario {
  id: number;
  tituloActividad?: string;
  preguntas?: Pregunta[];
}

interface ActividadAprendiz {
  idCalificacionActividad: number;
  idActividad: number;
  tituloActividad?: string;
  tipoActividad?: string;
  preguntas?: Pregunta[];
}

interface ModalResponderCuestionarioProps {
  actividad: ActividadAprendiz | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const getDocumentUrl = (path: string | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const ModalResponderCuestionario: React.FC<ModalResponderCuestionarioProps> = ({
  actividad,
  open,
  onClose,
  onSaved
}) => {
  const [actividadCompleta, setActividadCompleta] = useState<ActividadCuestionario | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, { idRespuesta?: number; respuesta?: string }>>({});

  useEffect(() => {
    if (!open || !actividad) {
      setActividadCompleta(null);
      setRespuestas({});
      setError(null);
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

      if (payload.length === 0) {
        setError('Debes responder al menos una pregunta');
        return;
      }

      setSaving(true);
      setError(null);
      try {
        await axios.post(
          `actividades-aprendiz/${actividad.idCalificacionActividad}/respuesta-cuestionario`,
          { respuestas: payload }
        );
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

  return (
    <Modal open={open} onClose={onClose} zIndex={115}>
      <ModalContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <ModalHeader>
          <ModalTitle>Responder cuestionario</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : error && !actividadCompleta ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2.5">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          ) : actividadCompleta?.preguntas?.length ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {actividadCompleta.tituloActividad || 'Cuestionario'}
              </p>
              {actividadCompleta.preguntas.map((preg, idx) => (
                <div
                  key={preg.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Pregunta {idx + 1}
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {preg.tipoPregunta?.tipoPregunta || 'Párrafo'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{preg.descripcion}</p>
                  {preg.urlDocumento && (
                    <div>
                      <img
                        src={getDocumentUrl(preg.urlDocumento) ?? '#'}
                        alt="Imagen pregunta"
                        className="max-w-[200px] max-h-[150px] object-contain rounded border border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                  {preg.tipoPregunta?.tipoPregunta === 'Varias opciones' && preg.respuestas?.length ? (
                    <ul className="space-y-2">
                      {preg.respuestas.map((r) => (
                        <li key={r.id}>
                          <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-coal-500/30">
                            <input
                              type="radio"
                              name={`preg-${preg.id}`}
                              checked={respuestas[preg.id]?.idRespuesta === r.id}
                              onChange={() => handleRespuestaOpcion(preg.id, r.id)}
                              className="rounded-full"
                            />
                            <span className="text-sm text-gray-800 dark:text-gray-200">
                              {r.descripcionRespuesta}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <textarea
                      value={respuestas[preg.id]?.respuesta ?? ''}
                      onChange={(e) => handleRespuestaTexto(preg.id, e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      className="input w-full text-sm min-h-[80px]"
                      rows={3}
                    />
                  )}
                </div>
              ))}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2.5">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {saving ? 'Enviando...' : 'Enviar respuestas'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No hay preguntas en este cuestionario.
            </p>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalResponderCuestionario;

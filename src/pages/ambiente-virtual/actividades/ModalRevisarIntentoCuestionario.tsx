import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon, ImageZoomModal } from '@/components';
import {
  CUESTIONARIO_IMG_CLASS,
  getCuestionarioDocumentUrl,
} from './ModalResponderCuestionario';

interface OpcionRevision {
  id: number;
  texto: string;
  seleccionada: boolean;
  esCorrecta: boolean | null;
}

interface PreguntaRevision {
  id: number;
  descripcion: string;
  tipoPregunta: string;
  urlDocumento?: string | null;
  urlDocumentoUrl?: string | null;
  explicacionRespuesta?: string | null;
  estado: 'correcta' | 'incorrecta' | 'pendiente' | 'calificada' | string;
  puntaje: number | null;
  retroalimentacion: string | null;
  respuestaAprendiz: {
    idRespuesta?: number | null;
    texto?: string | null;
  } | null;
  respuestaCorrecta: {
    id: number;
    texto: string;
  } | null;
  opciones: OpcionRevision[];
}

interface RevisionCuestionario {
  idCalificacionActividad: number;
  idActividad: number;
  tituloActividad: string;
  notaFinal: number | null;
  porcentaje: number | null;
  comentarioDocente: string | null;
  mostrarRespuestasCorrectas: boolean;
  /** true mientras fechaFinal de la asignación no se ha superado */
  asignacionActiva?: boolean;
  /** false = solo detalle de correctas; true = revisión completa */
  revisionCompleta?: boolean;
  fechaFinalAsignacion?: string | null;
  resumen: {
    totalPreguntas: number;
    correctas: number;
    incorrectas: number;
    pendientes: number;
  };
  preguntas: PreguntaRevision[];
}

interface ModalRevisarIntentoCuestionarioProps {
  open: boolean;
  idCalificacionActividad: number | null;
  tituloFallback?: string;
  onClose: () => void;
}

const badgeEstado = (estado: string) => {
  switch (estado) {
    case 'correcta':
      return {
        label: 'Correcta',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      };
    case 'incorrecta':
      return {
        label: 'Incorrecta',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      };
    case 'calificada':
      return {
        label: 'Calificada',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      };
    default:
      return {
        label: 'Pendiente',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      };
  }
};

const resolveImagenPregunta = (preg: PreguntaRevision): string | null => {
  if (preg.urlDocumentoUrl) {
    return getCuestionarioDocumentUrl(preg.urlDocumentoUrl) || preg.urlDocumentoUrl;
  }
  return getCuestionarioDocumentUrl(preg.urlDocumento);
};

const ModalRevisarIntentoCuestionario: React.FC<ModalRevisarIntentoCuestionarioProps> = ({
  open,
  idCalificacionActividad,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RevisionCuestionario | null>(null);
  const [zoomImagen, setZoomImagen] = useState<{ src: string; alt: string } | null>(null);

  const cargar = useCallback(async () => {
    if (!idCalificacionActividad) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `actividades-aprendiz/${idCalificacionActividad}/revision-cuestionario`
      );
      setData(res.data);
    } catch (e: any) {
      setData(null);
      setError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          'No se pudo cargar la revisión del intento'
      );
    } finally {
      setLoading(false);
    }
  }, [idCalificacionActividad]);

  useEffect(() => {
    if (open && idCalificacionActividad) {
      void cargar();
    } else if (!open) {
      setData(null);
      setError(null);
      setZoomImagen(null);
    }
  }, [open, idCalificacionActividad, cargar]);

  const esOpcionMultiple = (tipo: string) =>
    tipo.trim().toLowerCase() === 'varias opciones';

  return (
    <>
      <Modal open={open} onClose={onClose} zIndex={120}>
        <ModalContent className="w-[min(96vw,52rem)] max-w-3xl max-h-[92vh] flex flex-col shadow-2xl rounded-2xl">
          <ModalHeader className="border-b border-gray-100 dark:border-gray-700/50 py-3 px-4 sm:px-5 shrink-0">
            <div className="flex items-center justify-between gap-3 w-full">
              <ModalTitle className="sr-only">Resultados del cuestionario</ModalTitle>
              {!loading && data ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0 flex-1 text-sm">
                  <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                    {data.notaFinal !== null ? data.notaFinal.toFixed(1) : '—'}
                    <span className="text-gray-400 dark:text-white font-medium text-xs"> /5</span>
                  </span>
                  <span className="text-gray-500 dark:text-white tabular-nums">
                    {data.porcentaje !== null ? `${data.porcentaje}%` : '—'}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                    ✓ {data.resumen.correctas}
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-medium tabular-nums">
                    ✗ {data.resumen.incorrectas}
                  </span>
                  {data.resumen.pendientes > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium tabular-nums">
                      Pend. {data.resumen.pendientes}
                    </span>
                  )}
                  <span className="text-gray-400 dark:text-white text-xs tabular-nums">
                    {data.resumen.totalPreguntas} preg.
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500 dark:text-white">Cargando resultados…</span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <KeenIcon icon="cross" className="w-5 h-5" />
              </button>
            </div>
          </ModalHeader>

          <ModalBody className="overflow-y-auto p-4 sm:p-5 space-y-4">
            {loading && (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            {!loading && data && (
              <>
                {data.revisionCompleta === false && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
                    Mientras la actividad siga activa solo puedes revisar el detalle de las preguntas
                    que respondiste correctamente. Las incorrectas y sus soluciones se mostrarán
                    cuando finalice la fecha límite.
                  </div>
                )}
                {data.preguntas.length === 0 && data.revisionCompleta === false && (
                  <p className="text-sm text-gray-500 dark:text-white py-6 text-center">
                    Aún no hay preguntas correctas para revisar en detalle.
                  </p>
                )}
                {data.comentarioDocente && (
                  <div className="rounded-xl border border-blue-100 dark:border-blue-800/50 bg-blue-50/60 dark:bg-blue-900/15 px-3.5 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-0.5">
                      Observación del instructor
                    </p>
                    <p className="text-sm text-gray-700 dark:text-white leading-snug">
                      {data.comentarioDocente}
                    </p>
                  </div>
                )}

                <div className="space-y-3.5">
                  {data.preguntas.map((preg, index) => {
                    const badge = badgeEstado(preg.estado);
                    const multiple = esOpcionMultiple(preg.tipoPregunta);
                    const imagenUrl = resolveImagenPregunta(preg);

                    return (
                      <div
                        key={preg.id}
                        className={clsx(
                          'rounded-xl border px-4 py-3.5 sm:px-5 sm:py-4 space-y-3',
                          preg.estado === 'correcta' &&
                            'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-900/10',
                          preg.estado === 'incorrecta' &&
                            'border-red-200 dark:border-red-800/60 bg-red-50/30 dark:bg-red-900/10',
                          preg.estado === 'pendiente' &&
                            'border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-900/10',
                          preg.estado === 'calificada' &&
                            'border-blue-200 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-900/10',
                          !['correcta', 'incorrecta', 'pendiente', 'calificada'].includes(preg.estado) &&
                            'border-gray-200 dark:border-gray-600'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-white mb-1">
                              Pregunta {index + 1}
                              <span className="mx-1.5 text-gray-300 dark:text-white">·</span>
                              {preg.tipoPregunta}
                            </p>
                            <p className="text-sm sm:text-[15px] font-medium text-gray-900 dark:text-white leading-snug">
                              {preg.descripcion}
                            </p>
                          </div>
                          <span
                            className={clsx(
                              'shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {imagenUrl && (
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                setZoomImagen({
                                  src: imagenUrl,
                                  alt: preg.descripcion || 'Imagen pregunta',
                                })
                              }
                              className="w-full max-w-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl group"
                            >
                              <img
                                src={imagenUrl}
                                alt="Imagen de la pregunta"
                                className={`${CUESTIONARIO_IMG_CLASS} cursor-zoom-in group-hover:opacity-95 transition-opacity`}
                              />
                            </button>
                          </div>
                        )}

                        {multiple ? (
                          <ul className="space-y-2">
                            {preg.opciones.map((op) => {
                              const esSeleccionada = op.seleccionada;
                              const esCorrecta = op.esCorrecta === true;
                              const esIncorrectaSeleccionada =
                                esSeleccionada && op.esCorrecta === false;

                              return (
                                <li
                                  key={op.id}
                                  className={clsx(
                                    'rounded-xl border px-3.5 py-2.5 text-sm flex items-start gap-2.5',
                                    esCorrecta &&
                                      'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/25',
                                    esIncorrectaSeleccionada &&
                                      'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/25',
                                    !esCorrecta &&
                                      !esIncorrectaSeleccionada &&
                                      'border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-coal-500/30'
                                  )}
                                >
                                  <span className="mt-0.5 shrink-0 text-sm leading-none w-4 text-center">
                                    {esCorrecta ? (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                                    ) : esIncorrectaSeleccionada ? (
                                      <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
                                    ) : (
                                      <span className="inline-block w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-500 align-middle" />
                                    )}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-gray-800 dark:text-white leading-snug">{op.texto}</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {esSeleccionada && esCorrecta && (
                                        <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                                          ✓ Tu respuesta · correcta
                                        </span>
                                      )}
                                      {esSeleccionada && !esCorrecta && (
                                        <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                                          ✗ Tu respuesta
                                        </span>
                                      )}
                                      {!esSeleccionada && esCorrecta && (
                                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                                          ✓ Respuesta correcta
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="space-y-2">
                            <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-coal-500/30 px-3.5 py-2.5">
                              <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-white mb-1">
                                Tu respuesta
                              </p>
                              <p className="text-sm text-gray-800 dark:text-white whitespace-pre-wrap leading-snug">
                                {preg.respuestaAprendiz?.texto || (
                                  <span className="italic text-gray-400 dark:text-white">Sin respuesta</span>
                                )}
                              </p>
                            </div>

                            {preg.estado === 'pendiente' ? (
                              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                Pendiente de calificación
                              </p>
                            ) : (
                              <div className="rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50/70 dark:bg-blue-900/20 px-3.5 py-2.5 space-y-1">
                                {preg.puntaje !== null && (
                                  <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <span className="font-semibold">Nota:</span> {preg.puntaje.toFixed(1)}
                                  </p>
                                )}
                                {preg.retroalimentacion && (
                                  <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <span className="font-semibold">Retroalimentación:</span>{' '}
                                    {preg.retroalimentacion}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {preg.explicacionRespuesta && preg.explicacionRespuesta.trim() !== '' && (
                          <div className="rounded-xl border border-indigo-200 dark:border-indigo-700/60 bg-indigo-50/70 dark:bg-indigo-900/20 px-3.5 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-white mb-1">
                              ¿Por qué esta es la respuesta correcta?
                            </p>
                            <p className="text-sm text-indigo-900 dark:text-white whitespace-pre-wrap leading-snug">
                              {preg.explicacionRespuesta}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </ModalBody>

          <div className="border-t border-gray-100 dark:border-gray-700/50 px-4 py-3 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
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

export default ModalRevisarIntentoCuestionario;

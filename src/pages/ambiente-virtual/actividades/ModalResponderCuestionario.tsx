import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon, ImageZoomModal } from '@/components';
import axios from 'axios';
import {
  formatearCuentaRegresivaCuestionario,
  MSG_TIEMPO_GUARDADO,
  type IntentoCuestionarioPayload
} from './tiempoCuestionario';

interface Pregunta {
  id: number;
  descripcion: string;
  idTipoPregunta?: number | null;
  /** Relación camelCase (payload normalizado). */
  tipoPregunta?: { id?: number; tipoPregunta?: string } | null;
  /** Relación snake_case (serialización Eloquent cruda). */
  tipo_pregunta?: { id?: number; tipoPregunta?: string } | null;
  urlDocumento?: string | null;
  respuestas?: Array<{ id: number; descripcionRespuesta: string; chkCorrecta?: boolean }>;
}

/** Nombre del tipo desde idTipoPregunta / relación (sin fallback que oculte pérdida de datos). */
const nombreTipoPregunta = (preg: Pregunta | null | undefined): string => {
  if (!preg) return 'Párrafo';
  const desdeRel =
    preg.tipoPregunta?.tipoPregunta?.trim() ||
    preg.tipo_pregunta?.tipoPregunta?.trim() ||
    '';
  if (desdeRel) return desdeRel;
  return 'Párrafo';
};

const esVariasOpciones = (preg: Pregunta | null | undefined): boolean =>
  nombreTipoPregunta(preg).toLowerCase() === 'varias opciones';

/** Aplica el orden de presentación del intento; nunca reordena por id. */
const resolverPreguntasIntento = (data: {
  preguntas?: Pregunta[] | Record<string, Pregunta>;
  ordenPreguntasIds?: number[];
}): Pregunta[] => {
  const rawUnknown = data?.preguntas;
  const raw: Pregunta[] = Array.isArray(rawUnknown)
    ? rawUnknown
    : rawUnknown && typeof rawUnknown === 'object'
      ? (Object.values(rawUnknown) as Pregunta[])
      : [];

  const ordenIds = Array.isArray(data?.ordenPreguntasIds)
    ? data.ordenPreguntasIds.map((id) => Number(id)).filter((id) => id > 0)
    : [];

  if (ordenIds.length > 0) {
    const byId = new Map(raw.map((p) => [Number(p.id), p]));
    const ordered: Pregunta[] = [];
    const used = new Set<number>();
    for (const id of ordenIds) {
      const p = byId.get(id);
      if (p) {
        ordered.push(p);
        used.add(id);
      }
    }
    // Conservar cualquier pregunta extra en el orden recibido (sin sort por id).
    for (const p of raw) {
      const id = Number(p.id);
      if (!used.has(id)) ordered.push(p);
    }
    return ordered;
  }

  return raw.slice();
};

interface ActividadCuestionario {
  id: number;
  tituloActividad?: string;
  preguntas?: Pregunta[];
  ordenPreguntasIds?: number[];
}

interface ActividadAprendiz {
  idCalificacionActividad: number;
  idActividad: number;
  tituloActividad?: string;
  tipoActividad?: string | null;
  preguntas?: Pregunta[];
  intervaloReintento?: number | null;
  ultimoIntentoEn?: string | null;
  proximoIntentoDisponibleEn?: string | null;
  preguntasMinimasAprobar?: number | null;
  cumpleMinimoCuestionario?: boolean | null;
  puedeResponder?: boolean;
  tiempoCuestionario?: number | null;
}

interface ModalResponderCuestionarioProps {
  actividad: ActividadAprendiz | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onSuccess?: (message: string) => void;
  onCompleted?: (actividad: ActividadAprendiz) => void;
}

/** Tamaño equilibrado compartido con la vista de revisión. */
export const CUESTIONARIO_IMG_CLASS =
  'w-full max-h-[min(42vh,360px)] object-contain rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-coal-500 shadow-md';

export const getCuestionarioDocumentUrl = (path: string | undefined | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const preguntaRespondida = (
  preg: Pregunta,
  respuestas: Record<number, { idRespuesta?: number; respuesta?: string }>
): boolean => {
  const r = respuestas[preg.id];
  if (!r) return false;
  if (esVariasOpciones(preg)) {
    return typeof r.idRespuesta === 'number' && r.idRespuesta > 0;
  }
  return Boolean(r.respuesta && r.respuesta.trim().length > 0);
};

const ModalResponderCuestionario: React.FC<ModalResponderCuestionarioProps> = ({
  actividad,
  open,
  onClose,
  onSaved,
  onSuccess,
  onCompleted
}) => {
  const [actividadCompleta, setActividadCompleta] = useState<ActividadCuestionario | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, { idRespuesta?: number; respuesta?: string }>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [zoomImagen, setZoomImagen] = useState<{ src: string; alt: string } | null>(null);
  const [confirmFinalizar, setConfirmFinalizar] = useState<{ pendientes: number } | null>(null);
  const [intento, setIntento] = useState<IntentoCuestionarioPayload | null>(null);
  const [textoTiempo, setTextoTiempo] = useState<string | null>(null);
  const [avisoTiempo, setAvisoTiempo] = useState(false);
  const [bloqueadoPorTiempo, setBloqueadoPorTiempo] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const autoCierreRef = useRef(false);
  const enviandoLockRef = useRef(false);
  const respuestasRef = useRef(respuestas);
  respuestasRef.current = respuestas;
  const actividadCompletaRef = useRef(actividadCompleta);
  actividadCompletaRef.current = actividadCompleta;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

    useEffect(() => {
    if (!open || !actividad) {
      setActividadCompleta(null);
      setRespuestas({});
      setError(null);
      setCurrentQuestionIndex(0);
      setConfirmFinalizar(null);
      setIntento(null);
      setTextoTiempo(null);
      setAvisoTiempo(false);
      setBloqueadoPorTiempo(false);
      autoCierreRef.current = false;
      return;
    }
    // Siempre recargar desde el backend con idCalificacionActividad:
    // ahí se asegura el subconjunto del intento (estable en el mismo intento; nuevo en reintento).
    setLoading(true);
    setError(null);
    setRespuestas({});
    setCurrentQuestionIndex(0);
    setConfirmFinalizar(null);
    setIntento(null);
    setTextoTiempo(null);
    setAvisoTiempo(false);
    setBloqueadoPorTiempo(false);
    autoCierreRef.current = false;
    axios
      .get(`actividades/${actividad.idActividad}`, {
        params: actividad.idCalificacionActividad
          ? { idCalificacionActividad: actividad.idCalificacionActividad }
          : undefined
      })
      .then((r) => {
        const data = r.data ?? {};
        const intentoPayload = (data.intentoCuestionario ?? null) as IntentoCuestionarioPayload | null;
        if (intentoPayload?.finalizado && intentoPayload.cierrePorTiempo) {
          onSuccessRef.current?.(MSG_TIEMPO_GUARDADO);
          onSavedRef.current();
          onCloseRef.current();
          return;
        }
        const preguntas = resolverPreguntasIntento(data);
        setIntento(intentoPayload);
        setActividadCompleta({
          id: data.id,
          tituloActividad: data.tituloActividad,
          preguntas,
          ordenPreguntasIds: Array.isArray(data.ordenPreguntasIds)
            ? data.ordenPreguntasIds.map((id: number) => Number(id))
            : preguntas.map((p) => p.id)
        });
      })
      .catch(() => setError('No se pudo cargar el cuestionario'))
      .finally(() => setLoading(false));
  }, [open, actividad?.idActividad, actividad?.idCalificacionActividad, actividad]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestionIndex]);

  const handleRespuestaOpcion = useCallback((idPregunta: number, idRespuesta: number) => {
    if (bloqueadoPorTiempo) return;
    setRespuestas((prev) => ({
      ...prev,
      [idPregunta]: { idRespuesta, respuesta: undefined }
    }));
  }, [bloqueadoPorTiempo]);

  const handleRespuestaTexto = useCallback((idPregunta: number, texto: string) => {
    if (bloqueadoPorTiempo) return;
    setRespuestas((prev) => ({
      ...prev,
      [idPregunta]: { respuesta: texto }
    }));
  }, [bloqueadoPorTiempo]);

  const enviarRespuestas = useCallback(async (opts?: { porTiempo?: boolean }) => {
    if (!actividad?.idCalificacionActividad || !actividadCompletaRef.current?.preguntas?.length) return;
    if (enviandoLockRef.current) return;
    enviandoLockRef.current = true;

    const preguntasActuales = actividadCompletaRef.current.preguntas;
    const respuestasActuales = respuestasRef.current;
    const payload = preguntasActuales
      .map((p) => {
        const r = respuestasActuales[p.id];
        if (!r) return null;
        if (r.idRespuesta) return { idPregunta: p.id, idRespuesta: r.idRespuesta };
        const texto = (r.respuesta ?? '').trim();
        if (texto) return { idPregunta: p.id, respuesta: texto };
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    setSaving(true);
    setError(null);
    setConfirmFinalizar(null);
    if (opts?.porTiempo) {
      setBloqueadoPorTiempo(true);
    }
    try {
      const res = await axios.post(
        `actividades-aprendiz/${actividad.idCalificacionActividad}/respuesta-cuestionario`,
        { respuestas: payload }
      );
      const porTiempo = Boolean(opts?.porTiempo || res.data?.cierrePorTiempo);
      onSuccessRef.current?.(
        porTiempo ? MSG_TIEMPO_GUARDADO : (res.data?.message || 'Cuestionario respondido correctamente')
      );
      onSavedRef.current();
      onCompletedRef.current?.(actividad);
      onCloseRef.current();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; message?: string } } };
      setError(ax.response?.data?.message || ax.response?.data?.error || 'No fue posible enviar las respuestas');
      setBloqueadoPorTiempo(false);
      autoCierreRef.current = false;
    } finally {
      enviandoLockRef.current = false;
      setSaving(false);
    }
  }, [actividad]);

  const enviarRespuestasRef = useRef(enviarRespuestas);
  enviarRespuestasRef.current = enviarRespuestas;

  const solicitarFinalizar = useCallback(() => {
    const preguntas = actividadCompleta?.preguntas ?? [];
    if (!preguntas.length) return;
    const pendientes = preguntas.filter((p) => !preguntaRespondida(p, respuestas)).length;
    if (pendientes > 0) {
      setConfirmFinalizar({ pendientes });
      return;
    }
    void enviarRespuestas();
  }, [actividadCompleta?.preguntas, respuestas, enviarRespuestas]);

  useEffect(() => {
    if (!open || intento?.finalizado || intento?.segundosRestantes == null) {
      setTextoTiempo(null);
      return;
    }
    const inicial = Math.max(0, Math.floor(intento.segundosRestantes));
    const loadedAt = Date.now();
    autoCierreRef.current = false;

    const tick = (): boolean => {
      const restMs = inicial * 1000 - (Date.now() - loadedAt);
      const rest = Math.max(0, restMs);
      setTextoTiempo(formatearCuentaRegresivaCuestionario(rest));
      if (inicial > 0 && rest <= 60_000) {
        setAvisoTiempo(true);
      }
      if (rest <= 0) {
        setBloqueadoPorTiempo(true);
        if (!autoCierreRef.current) {
          autoCierreRef.current = true;
          void enviarRespuestasRef.current({ porTiempo: true });
        }
        return false;
      }
      return true;
    };

    if (!tick()) return;
    const id = window.setInterval(() => {
      if (!tick()) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, intento?.segundosRestantes, intento?.finalizado]);

  const irSiguiente = useCallback(() => {
    setConfirmFinalizar(null);
    setCurrentQuestionIndex((i) => i + 1);
  }, []);

  const irAnterior = useCallback(() => {
    setConfirmFinalizar(null);
    setCurrentQuestionIndex((i) => Math.max(0, i - 1));
  }, []);

  if (!open) return null;

  const preguntas = actividadCompleta?.preguntas ?? [];
  const totalPreguntas = preguntas.length;
  const preg = preguntas[currentQuestionIndex];
  const isLast = totalPreguntas > 0 && currentQuestionIndex === totalPreguntas - 1;
  const isFirst = currentQuestionIndex === 0;
  const opciones = esVariasOpciones(preg) && preg.id ? preg.respuestas ?? [] : [];
  // Una entrada por pregunta: solo cuentan las respuestas guardadas por el usuario.
  const respondidasCount = Object.values(respuestas).filter(
    ({ idRespuesta, respuesta }) =>
      (typeof idRespuesta === 'number' && idRespuesta > 0) || Boolean(respuesta?.trim())
  ).length;
  const progresoPct =
    totalPreguntas > 0 ? Math.round((respondidasCount / totalPreguntas) * 100) : 0;
  const imagenUrl = preg?.urlDocumento ? getCuestionarioDocumentUrl(preg.urlDocumento) : null;
  const tipoVisible = nombreTipoPregunta(preg);

  return (
    <>
      <Modal open={open} onClose={onClose} zIndex={115}>
        <ModalContent className="w-[min(96vw,52rem)] max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl rounded-2xl">
          <ModalHeader className="block border-b border-gray-100 dark:border-gray-700/50 py-3 px-4 sm:px-5 shrink-0">
            <div
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 w-full ${
                textoTiempo ? 'sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : ''
              }`}
            >
              <ModalTitle className="sr-only">Cuestionario</ModalTitle>
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                {preguntas.length > 0 && (
                  <>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white">
                      {`${currentQuestionIndex + 1} / ${totalPreguntas}`}
                    </span>
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-white">
                      {tipoVisible}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-white tabular-nums">
                      {`${respondidasCount} ${respondidasCount === 1 ? 'respondida' : 'respondidas'}`}
                    </span>
                  </>
                )}
              </div>
              {textoTiempo && (
                <div
                  className={`col-span-2 row-start-2 justify-self-center flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-center sm:col-span-1 sm:col-start-2 sm:row-start-1 ${
                    avisoTiempo
                      ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-white">
                    Tiempo restante
                  </span>
                  <span
                    className={`font-mono tabular-nums text-sm font-bold ${
                      avisoTiempo ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {textoTiempo}
                  </span>
                </div>
              )}
              <button
                type="button"
                className="col-start-[-2] row-start-1 justify-self-end p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors shrink-0"
                onClick={onClose}
                disabled={bloqueadoPorTiempo}
                aria-label="Cerrar"
              >
                <KeenIcon icon="cross" className="w-5 h-5" />
              </button>
            </div>
            {preguntas.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progresoPct}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-500 dark:text-white tabular-nums w-9 text-right">
                  {`${progresoPct}%`}
                </span>
              </div>
            )}
            {avisoTiempo && textoTiempo && textoTiempo !== '00:00:00' && (
              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                El tiempo del cuestionario está por terminar.
              </p>
            )}
            {actividad?.intervaloReintento != null && (
              <p className="mt-2 text-xs text-gray-600 dark:text-white">
                {actividad.ultimoIntentoEn
                  ? `Último intento: ${actividad.ultimoIntentoEn}`
                  : 'Aún no has finalizado un intento'}
                {actividad.proximoIntentoDisponibleEn && !actividad.puedeResponder
                  ? ` · Podrás intentarlo nuevamente: ${actividad.proximoIntentoDisponibleEn}`
                  : actividad.ultimoIntentoEn
                    ? ' · Puedes realizar un nuevo intento'
                    : ''}
                {actividad.preguntasMinimasAprobar != null
                  ? ` · Mín. correctas para aprobar: ${actividad.preguntasMinimasAprobar}`
                  : ''}
              </p>
            )}
          </ModalHeader>

          <ModalBody className="flex-1 overflow-hidden py-0 min-h-0 flex flex-col">
            <div ref={bodyRef} className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex justify-center py-14">
                  <div className="animate-spin rounded-full h-9 w-9 border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : error && !actividadCompleta ? (
                <div className="mx-5 my-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              ) : preg ? (
                <div
                  className="px-4 sm:px-6 py-5 sm:py-6"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-white mb-1.5">
                        Pregunta {currentQuestionIndex + 1}
                      </p>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-snug">
                        {preg.descripcion}
                      </h3>
                    </div>

                    {imagenUrl && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setZoomImagen({ src: imagenUrl, alt: preg.descripcion || 'Imagen pregunta' })
                          }
                          className="w-full max-w-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl group"
                        >
                          <img
                            src={imagenUrl}
                            alt="Imagen de la pregunta"
                            className={`${CUESTIONARIO_IMG_CLASS} cursor-zoom-in group-hover:opacity-95 transition-opacity`}
                          />
                          <span className="mt-1.5 block text-center text-[10px] text-gray-400 dark:text-white">
                            Clic para ampliar
                          </span>
                        </button>
                      </div>
                    )}

                    {esVariasOpciones(preg) && opciones.length > 0 ? (
                      <ul className="space-y-2.5">
                        {opciones.map((r) => {
                          const selected = respuestas[preg.id]?.idRespuesta === r.id;
                          return (
                            <li key={r.id}>
                              <label
                                className={`flex items-center gap-3.5 cursor-pointer px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl border-2 transition-all duration-150 ${
                                  selected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/25 dark:border-blue-500 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:border-blue-500/40 dark:hover:bg-blue-900/10 bg-white dark:bg-coal-500/20'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`preg-${preg.id}`}
                                  checked={selected}
                                  disabled={bloqueadoPorTiempo || saving}
                                  onChange={() => handleRespuestaOpcion(preg.id, r.id)}
                                  className="w-5 h-5 shrink-0 rounded-full border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span
                                  className={`text-sm sm:text-[15px] leading-relaxed ${
                                    selected
                                      ? 'text-gray-900 dark:text-white font-medium'
                                      : 'text-gray-700 dark:text-white'
                                  }`}
                                >
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
                        placeholder="Escribe tu respuesta aquí..."
                        disabled={bloqueadoPorTiempo || saving}
                        className="input w-full text-sm sm:text-[15px] min-h-[140px] rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 p-4 leading-relaxed dark:text-white dark:placeholder:text-white"
                        rows={5}
                      />
                    )}

                    {error && (
                      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : actividadCompleta && !actividadCompleta.preguntas?.length ? (
                <p className="text-sm text-gray-500 dark:text-white py-12 text-center">
                  No hay preguntas en este cuestionario.
                </p>
              ) : null}
            </div>
          </ModalBody>

          {preg && (
            <div className="shrink-0 border-t border-gray-100 dark:border-gray-700/50 px-4 sm:px-5 py-3 bg-gray-50/90 dark:bg-coal-500/40">
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={bloqueadoPorTiempo || saving}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  {!isFirst && (
                    <button
                      type="button"
                      onClick={irAnterior}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      Anterior
                    </button>
                  )}
                </div>
                <div className="flex gap-2 sm:justify-end">
                  {!isLast ? (
                    <button
                      type="button"
                      onClick={irSiguiente}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={solicitarFinalizar}
                      disabled={saving || bloqueadoPorTiempo}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-colors"
                    >
                      {saving || bloqueadoPorTiempo ? 'Enviando...' : 'Finalizar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>

      {confirmFinalizar && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-coal-500 border border-gray-200 dark:border-gray-600 shadow-2xl p-5 space-y-3">
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Preguntas sin responder
            </h4>
            <p className="text-sm text-gray-600 dark:text-white leading-relaxed">
              Tienes <span className="font-bold text-gray-900 dark:text-white">{confirmFinalizar.pendientes}</span>{' '}
              {confirmFinalizar.pendientes === 1 ? 'pregunta' : 'preguntas'} sin responder.
              ¿Deseas finalizar de todas formas?
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmFinalizar(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Volver al cuestionario
              </button>
              <button
                type="button"
                onClick={() => void enviarRespuestas()}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
              >
                {saving ? 'Enviando...' : 'Finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}

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

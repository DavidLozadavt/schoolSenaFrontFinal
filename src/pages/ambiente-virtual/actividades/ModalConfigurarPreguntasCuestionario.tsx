import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import type { Actividad } from './ModalCrearActividad';
import {
  ConfigCuestionariosMap,
  ModoPreguntasCuestionario,
  PreguntaCuestionarioResumen,
  seleccionarPreguntasAleatorias
} from './cuestionarioAsignacion';

interface EstadoCuestionario {
  preguntas: PreguntaCuestionarioResumen[];
  modo: ModoPreguntasCuestionario | null;
  idsSeleccionados: number[];
  cantidadAleatoria: number;
  idsAleatoriosPreview: number[];
}

interface ModalConfigurarPreguntasCuestionarioProps {
  open: boolean;
  onClose: () => void;
  onContinuar: (config: ConfigCuestionariosMap) => void;
  cuestionarios: Actividad[];
}

const ModalConfigurarPreguntasCuestionario: React.FC<ModalConfigurarPreguntasCuestionarioProps> = ({
  open,
  onClose,
  onContinuar,
  cuestionarios
}) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [porCuestionario, setPorCuestionario] = useState<Record<number, EstadoCuestionario>>({});

  useEffect(() => {
    if (!open || cuestionarios.length === 0) {
      setPorCuestionario({});
      setError('');
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError('');

    Promise.all(
      cuestionarios.map(async (c) => {
        if (!c.id) return null;
        const res = await axios.get(`actividades/${c.id}`);
        const preguntas: PreguntaCuestionarioResumen[] = (res.data?.preguntas ?? []).map(
          (p: {
            id: number;
            descripcion?: string;
            urlDocumento?: string | null;
            tipoPregunta?: { tipoPregunta?: string };
          }) => ({
            id: p.id,
            descripcion: p.descripcion ?? '',
            urlDocumento: p.urlDocumento ?? null,
            tipoPregunta: p.tipoPregunta?.tipoPregunta ?? null
          })
        );
        return { id: c.id, preguntas };
      })
    )
      .then((resultados) => {
        if (cancelado) return;
        const map: Record<number, EstadoCuestionario> = {};
        resultados.forEach((item) => {
          if (!item?.id) return;
          map[item.id] = {
            preguntas: item.preguntas,
            modo: null,
            idsSeleccionados: item.preguntas.map((p) => p.id),
            cantidadAleatoria: item.preguntas.length || 1,
            idsAleatoriosPreview: []
          };
        });
        setPorCuestionario(map);
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar las preguntas del cuestionario.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, cuestionarios.map((c) => c.id).join(',')]);

  const actualizar = useCallback((idActividad: number, cambios: Partial<EstadoCuestionario>) => {
    setPorCuestionario((prev) => ({
      ...prev,
      [idActividad]: { ...prev[idActividad], ...cambios }
    }));
  }, []);

  const activarModoManual = (idActividad: number) => {
    const st = porCuestionario[idActividad];
    if (!st) return;
    actualizar(idActividad, {
      modo: 'manual',
      idsSeleccionados: st.idsSeleccionados.length ? st.idsSeleccionados : st.preguntas.map((p) => p.id),
      idsAleatoriosPreview: []
    });
  };

  const activarModoAleatorio = (idActividad: number) => {
    const st = porCuestionario[idActividad];
    if (!st) return;
    const total = st.preguntas.length;
    const cantidad = Math.min(Math.max(st.cantidadAleatoria || total || 1, 1), total || 1);
    const ids = seleccionarPreguntasAleatorias(
      st.preguntas.map((p) => p.id),
      cantidad
    );
    actualizar(idActividad, {
      modo: 'aleatorio',
      cantidadAleatoria: cantidad,
      idsAleatoriosPreview: ids
    });
  };

  const regenerarAleatorias = (idActividad: number) => {
    activarModoAleatorio(idActividad);
  };

  const togglePregunta = (idActividad: number, idPregunta: number) => {
    const st = porCuestionario[idActividad];
    if (!st) return;
    const set = new Set(st.idsSeleccionados);
    if (set.has(idPregunta)) set.delete(idPregunta);
    else set.add(idPregunta);
    actualizar(idActividad, { idsSeleccionados: Array.from(set) });
  };

  const validar = (): string | null => {
    for (const c of cuestionarios) {
      if (!c.id) continue;
      const st = porCuestionario[c.id];
      const titulo = c.tituloActividad || 'Cuestionario';
      if (!st || st.preguntas.length === 0) {
        return `"${titulo}" no tiene preguntas disponibles.`;
      }
      if (st.modo === null) {
        return `Elige selección manual o preguntas aleatorias para "${titulo}".`;
      }
      if (st.modo === 'manual') {
        if (st.idsSeleccionados.length === 0) {
          return `Selecciona al menos una pregunta para "${titulo}".`;
        }
      } else {
        const total = st.preguntas.length;
        const cant = st.cantidadAleatoria;
        if (!Number.isFinite(cant) || cant < 1 || cant > total) {
          return `Cantidad inválida para "${titulo}". Debe estar entre 1 y ${total}.`;
        }
        if (st.idsAleatoriosPreview.length === 0) {
          return `Genera la selección aleatoria para "${titulo}".`;
        }
      }
    }
    return null;
  };

  const handleContinuar = () => {
    setError('');
    const err = validar();
    if (err) {
      setError(err);
      return;
    }
    const config: ConfigCuestionariosMap = {};
    cuestionarios.forEach((c) => {
      if (!c.id) return;
      const st = porCuestionario[c.id];
      if (!st) return;
      config[c.id] = {
        modo: st.modo!,
        idsPreguntas: st.modo === 'manual' ? st.idsSeleccionados : st.idsAleatoriosPreview
      };
    });
    onContinuar(config);
  };

  const tituloUnico = cuestionarios.length === 1 ? cuestionarios[0]?.tituloActividad : null;

  const resumenGlobal = useMemo(() => {
    let totalPreguntas = 0;
    cuestionarios.forEach((c) => {
      if (c.id && porCuestionario[c.id]) {
        totalPreguntas += porCuestionario[c.id].preguntas.length;
      }
    });
    return totalPreguntas;
  }, [cuestionarios, porCuestionario]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} zIndex={121}>
      <div className="flex min-h-[100dvh] w-full items-center justify-center p-3 sm:py-10 sm:px-5 box-border pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl sm:max-w-3xl md:max-w-4xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ModalContent className="!flex w-full !max-w-none !flex-col !overflow-hidden !rounded-2xl border border-gray-200/90 bg-white !p-0 shadow-2xl dark:border-gray-600/60 dark:bg-coal-400 max-h-[min(94dvh,960px)]">
            <ModalHeader className="shrink-0 border-b border-gray-100 px-5 py-3.5 dark:border-gray-600/80 sm:px-6">
              <ModalTitle className="dark:text-white">Configurar preguntas del cuestionario</ModalTitle>
              <button type="button" className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>

            <ModalBody className="!flex !min-h-0 !flex-1 !flex-col !gap-0 !overflow-hidden !p-0">
              <div className="shrink-0 space-y-1 border-b border-gray-100 px-5 py-4 dark:border-gray-600/50 sm:px-6">
                {tituloUnico ? (
                  <>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{tituloUnico}</p>
                    <p className="text-xs text-gray-500 dark:text-white">
                      {porCuestionario[cuestionarios[0]?.id ?? 0]?.preguntas.length ?? '—'} preguntas disponibles
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-white">
                    {cuestionarios.length} cuestionario(s) · {resumenGlobal} preguntas en total
                  </p>
                )}
                <p className="text-xs leading-relaxed text-gray-500 dark:text-white">
                  El banco original del cuestionario no se modifica; solo defines el subconjunto para esta asignación.
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] px-5 py-4 sm:px-6">
                {cargando && (
                  <div className="flex items-center gap-2 py-8 text-sm text-gray-500 dark:text-white">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-primary" />
                    Cargando preguntas...
                  </div>
                )}

                {!cargando &&
                  cuestionarios.map((c) => {
                    if (!c.id) return null;
                    const st = porCuestionario[c.id];
                    if (!st) return null;
                    const total = st.preguntas.length;
                    const seleccionadas =
                      st.modo === 'manual'
                        ? st.idsSeleccionados.length
                        : st.idsAleatoriosPreview.length;

                    return (
                      <div
                        key={c.id}
                        className="mb-5 space-y-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4 last:mb-0 dark:border-gray-600/60 dark:bg-coal-500/20"
                      >
                        {cuestionarios.length > 1 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {c.tituloActividad || 'Cuestionario'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-white">{total} preguntas disponibles</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => activarModoManual(c.id!)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              st.modo === 'manual'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-coal-500 dark:text-white dark:hover:bg-coal-300'
                            }`}
                          >
                            Seleccionar preguntas
                          </button>
                          <button
                            type="button"
                            onClick={() => activarModoAleatorio(c.id!)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              st.modo === 'aleatorio'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-coal-500 dark:text-white dark:hover:bg-coal-300'
                            }`}
                          >
                            Preguntas aleatorias
                          </button>
                        </div>

                        {st.modo === 'manual' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-gray-700 dark:text-white">
                                Selecciona las preguntas
                              </span>
                              <span className="text-xs font-semibold text-primary">
                                {seleccionadas} de {total} preguntas seleccionadas
                              </span>
                            </div>
                            <div className="max-h-[min(40dvh,16rem)] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600/60">
                              <ul className="m-0 list-none divide-y divide-gray-100 dark:divide-gray-600/40">
                                {st.preguntas.map((p, idx) => (
                                  <li key={p.id}>
                                    <label className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-gray-50/80 dark:hover:bg-white/5">
                                      <input
                                        type="checkbox"
                                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary dark:border-gray-500"
                                        checked={st.idsSeleccionados.includes(p.id)}
                                        onChange={() => togglePregunta(c.id!, p.id)}
                                      />
                                      <span className="min-w-0 flex-1 break-words text-sm leading-snug text-gray-800 dark:text-white">
                                        <span className="font-medium text-gray-500 dark:text-white">{idx + 1}. </span>
                                        {(p.descripcion || '').trim() || `Pregunta ${idx + 1}`}
                                        {p.tipoPregunta ? (
                                          <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-white">
                                            ({p.tipoPregunta})
                                          </span>
                                        ) : null}
                                        {p.urlDocumento ? (
                                          <span className="ml-1 text-xs text-gray-400 dark:text-white">(con imagen)</span>
                                        ) : null}
                                      </span>
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {st.modo === 'aleatorio' && (
                          <div className="space-y-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-white">
                                Cantidad a asignar
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={total}
                                value={st.cantidadAleatoria}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  actualizar(c.id!, {
                                    cantidadAleatoria: Number.isFinite(val) ? val : 1
                                  });
                                }}
                                onBlur={() => activarModoAleatorio(c.id!)}
                                className="input w-full max-w-[8rem] p-2 text-sm dark:text-white dark:placeholder:text-white"
                              />
                              <p className="mt-1 text-xs text-gray-500 dark:text-white">
                                Entre 1 y {total} preguntas distintas.
                              </p>
                            </div>

                            {st.idsAleatoriosPreview.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-gray-700 dark:text-white">
                                    {st.idsAleatoriosPreview.length} preguntas seleccionadas aleatoriamente
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => regenerarAleatorias(c.id!)}
                                    className="text-xs font-medium text-primary hover:underline"
                                  >
                                    Generar nuevamente
                                  </button>
                                </div>
                                <ul className="max-h-[min(28dvh,12rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600/60 dark:bg-coal-400/30">
                                  {st.idsAleatoriosPreview.map((idPreg) => {
                                    const p = st.preguntas.find((x) => x.id === idPreg);
                                    const idx = st.preguntas.findIndex((x) => x.id === idPreg);
                                    return (
                                      <li
                                        key={idPreg}
                                        className="flex gap-2 py-1 text-sm leading-snug text-gray-800 dark:text-white"
                                      >
                                        <KeenIcon icon="check" className="mt-0.5 shrink-0 text-xs text-green-600" />
                                        <span className="min-w-0 break-words">
                                          <span className="font-medium text-gray-500 dark:text-white">{idx + 1}. </span>
                                          {(p?.descripcion || '').trim() || `Pregunta ${idx + 1}`}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {error && (
                <div className="shrink-0 border-t border-red-100 bg-red-50 px-5 py-2.5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 sm:px-6">
                  {error}
                </div>
              )}

              <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-gray-200/90 bg-light px-5 py-4 sm:flex-row sm:justify-end sm:gap-3.5 sm:px-6 dark:border-gray-600/50 dark:bg-coal-300/40">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-w-[7.5rem] rounded-lg border border-transparent bg-gray-200/90 px-5 py-2.5 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-white sm:w-auto hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleContinuar}
                  disabled={cargando}
                  className="w-full min-w-[7.5rem] rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:w-auto hover:bg-green-700"
                >
                  Continuar
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </div>
      </div>
    </Modal>
  );
};

export default ModalConfigurarPreguntasCuestionario;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import type { Actividad } from './ModalCrearActividad';
import { ConfigCuestionariosMap } from './cuestionarioAsignacion';
import {
  aMinutosReintento,
  desdeMinutosReintento,
  UNIDADES_REINTENTO,
  type UnidadReintento
} from './intervaloReintentoCuestionario';

interface EstadoCuestionario {
  totalBanco: number;
  cantidadPreguntas: string;
  preguntasMinimasAprobar: string;
  intervaloCantidad: string;
  intervaloUnidad: UnidadReintento;
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
        const totalBanco = Array.isArray(res.data?.preguntas) ? res.data.preguntas.length : 0;
        const iv = desdeMinutosReintento(res.data?.intervaloReintento);
        // Mínimo legacy inválido (> banco) no se precarga; el campo es opcional.
        const minPrev =
          res.data?.preguntasMinimasAprobar != null ? Number(res.data.preguntasMinimasAprobar) : null;
        const minOk =
          minPrev != null && Number.isInteger(minPrev) && minPrev >= 1 && minPrev <= totalBanco
            ? String(minPrev)
            : '';
        return {
          id: c.id,
          totalBanco,
          // Por defecto: todo el banco (orden/combinación varían por aprendiz).
          cantidadPreguntas: totalBanco > 0 ? String(totalBanco) : '',
          preguntasMinimasAprobar: minOk,
          intervaloCantidad: iv.cantidad,
          intervaloUnidad: iv.unidad
        };
      })
    )
      .then((resultados) => {
        if (cancelado) return;
        const map: Record<number, EstadoCuestionario> = {};
        resultados.forEach((item) => {
          if (!item?.id) return;
          map[item.id] = {
            totalBanco: item.totalBanco,
            cantidadPreguntas: item.cantidadPreguntas,
            preguntasMinimasAprobar: item.preguntasMinimasAprobar,
            intervaloCantidad: item.intervaloCantidad,
            intervaloUnidad: item.intervaloUnidad
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

  const validar = (): string | null => {
    for (const c of cuestionarios) {
      if (!c.id) continue;
      const st = porCuestionario[c.id];
      const titulo = c.tituloActividad || 'Cuestionario';
      if (!st || st.totalBanco <= 0) {
        return `"${titulo}" no tiene preguntas disponibles en el banco.`;
      }
      const cantRaw = st.cantidadPreguntas.trim();
      const cant = Number(cantRaw);
      if (cantRaw === '' || !Number.isInteger(cant) || cant < 1 || cant > st.totalBanco) {
        return `"${titulo}": la cantidad de preguntas por intento debe ser un entero entre 1 y ${st.totalBanco}.`;
      }

      const minRaw = st.preguntasMinimasAprobar.trim();
      if (minRaw !== '') {
        const minVal = Number(minRaw);
        if (!Number.isInteger(minVal) || minVal < 1 || minVal > cant) {
          return `"${titulo}": preguntas mínimas para aprobar debe ser un entero entre 1 y ${cant} (preguntas de cada intento).`;
        }
      }
      const intervaloRaw = st.intervaloCantidad.trim();
      if (intervaloRaw !== '') {
        const intervaloVal = Number(intervaloRaw);
        if (!Number.isInteger(intervaloVal) || intervaloVal < 1) {
          return `"${titulo}": el intervalo de reintento debe ser un entero mayor o igual a 1.`;
        }
      }
    }
    return null;
  };

  const handleContinuar = async () => {
    setError('');
    const err = validar();
    if (err) {
      setError(err);
      return;
    }
    try {
      setCargando(true);
      await Promise.all(
        cuestionarios.map(async (c) => {
          if (!c.id) return;
          const st = porCuestionario[c.id];
          if (!st) return;
          const minRaw = st.preguntasMinimasAprobar.trim();
          const intervaloRaw = st.intervaloCantidad.trim();
          const intervaloMinutos =
            intervaloRaw === '' ? null : aMinutosReintento(Number(intervaloRaw), st.intervaloUnidad);
          await axios.put(`cuestionarios/${c.id}/reglas-evaluacion`, {
            preguntasMinimasAprobar: minRaw === '' ? null : Number(minRaw),
            intervaloReintento: intervaloMinutos,
            // Contexto para validar mínimo ≤ N (no contra el banco M).
            cantidadPreguntasPorIntento: Number(st.cantidadPreguntas.trim())
          });
        })
      );

      const config: ConfigCuestionariosMap = {};
      cuestionarios.forEach((c) => {
        if (!c.id) return;
        const st = porCuestionario[c.id];
        if (!st) return;
        config[c.id] = {
          cantidadPreguntas: Number(st.cantidadPreguntas.trim())
        };
      });
      onContinuar(config);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string; errors?: Record<string, string[]> } } };
      const msg =
        ax.response?.data?.error ||
        (ax.response?.data?.errors
          ? Object.values(ax.response.data.errors).flat().join(' ')
          : null) ||
        'No se pudieron guardar las reglas de evaluación del cuestionario.';
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  const tituloUnico = cuestionarios.length === 1 ? cuestionarios[0]?.tituloActividad : null;

  const resumenGlobal = useMemo(() => {
    let totalPreguntas = 0;
    cuestionarios.forEach((c) => {
      if (c.id && porCuestionario[c.id]) {
        totalPreguntas += porCuestionario[c.id].totalBanco;
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
              <ModalTitle className="dark:text-white">Configurar cuestionario</ModalTitle>
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
                      Banco disponible:{' '}
                      {porCuestionario[cuestionarios[0]?.id ?? 0]?.totalBanco ?? '—'} preguntas
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-white">
                    {cuestionarios.length} cuestionario(s) · {resumenGlobal} preguntas en el banco
                  </p>
                )}
                <p className="text-xs leading-relaxed text-gray-500 dark:text-white">
                  Indica cuántas preguntas tendrá cada intento. Cada aprendiz recibirá esa cantidad
                  seleccionada automáticamente desde todo el banco. Las preguntas y opciones se
                  presentarán en diferente orden; en un reintento puede generarse otra combinación.
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] px-5 py-4 sm:px-6">
                {cargando && (
                  <div className="flex items-center gap-2 py-8 text-sm text-gray-500 dark:text-white">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-primary" />
                    Cargando cuestionario...
                  </div>
                )}

                {!cargando &&
                  cuestionarios.map((c) => {
                    if (!c.id) return null;
                    const st = porCuestionario[c.id];
                    if (!st) return null;
                    const total = st.totalBanco;
                    const cant = Number(st.cantidadPreguntas.trim());
                    const cantValida = Number.isInteger(cant) && cant >= 1 && cant <= total ? cant : null;
                    const minRawUi = st.preguntasMinimasAprobar.trim();
                    const minNum = minRawUi === '' ? null : Number(minRawUi);
                    const minValido =
                      minNum != null &&
                      Number.isInteger(minNum) &&
                      cantValida != null &&
                      minNum >= 1 &&
                      minNum <= cantValida;
                    const intervaloRawUi = st.intervaloCantidad.trim();

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
                            <p className="text-xs text-gray-500 dark:text-white">
                              Banco disponible: {total} preguntas
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-white">
                            Cantidad de preguntas por intento
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(total, 1)}
                            value={st.cantidadPreguntas}
                            onChange={(e) => {
                              const nextCant = e.target.value;
                              const nextN = Number(nextCant.trim());
                              const minActual = st.preguntasMinimasAprobar.trim();
                              const cambios: Partial<EstadoCuestionario> = {
                                cantidadPreguntas: nextCant
                              };
                              // Si el mínimo queda por encima de la nueva cantidad, vaciarlo (es opcional).
                              if (
                                minActual !== '' &&
                                Number.isInteger(nextN) &&
                                nextN >= 1 &&
                                Number(minActual) > nextN
                              ) {
                                cambios.preguntasMinimasAprobar = '';
                              }
                              actualizar(c.id!, cambios);
                            }}
                            className="input w-full max-w-xs p-2 text-sm dark:text-white"
                            placeholder={`1 – ${total}`}
                          />
                          {cantValida != null && (
                            <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-white">
                              Cada aprendiz recibirá {cantValida} preguntas seleccionadas automáticamente
                              del banco completo de {total}. Las preguntas y opciones se presentarán en
                              diferente orden.
                            </p>
                          )}
                        </div>

                        <div className="space-y-3 rounded-lg border border-gray-200 bg-white/70 p-3 dark:border-gray-600/50 dark:bg-coal-400/20">
                          <p className="text-xs font-semibold text-gray-800 dark:text-white">
                            Reglas de evaluación
                          </p>
                          <p className="text-xs text-gray-500 dark:text-white">
                            Preguntas de cada intento: {cantValida ?? '—'}
                          </p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-white">
                                Preguntas mínimas para aprobar (opcional)
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={Math.max(cantValida || 1, 1)}
                                value={st.preguntasMinimasAprobar}
                                onChange={(e) =>
                                  actualizar(c.id!, { preguntasMinimasAprobar: e.target.value })
                                }
                                className="input w-full p-2 text-sm dark:text-white"
                                placeholder="Opcional"
                              />
                              <p className="mt-1 text-[11px] text-gray-500 dark:text-white">
                                {minRawUi === ''
                                  ? 'Sin regla personalizada de mínimo.'
                                  : minValido
                                    ? `Cantidad de respuestas correctas necesarias para aplicar una regla personalizada de aprobación (${minNum} de ${cantValida}).`
                                    : cantValida != null
                                      ? `El mínimo debe ser un entero entre 1 y ${cantValida}.`
                                      : 'Cantidad de respuestas correctas necesarias para aplicar una regla personalizada de aprobación.'}
                              </p>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-white">
                                Intervalo entre intentos (opcional)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={st.intervaloCantidad}
                                  onChange={(e) =>
                                    actualizar(c.id!, { intervaloCantidad: e.target.value })
                                  }
                                  className="input w-full p-2 text-sm dark:text-white"
                                  placeholder="Opcional"
                                />
                                <select
                                  className="input w-full max-w-[8.5rem] p-2 text-sm dark:text-white"
                                  value={st.intervaloUnidad}
                                  onChange={(e) =>
                                    actualizar(c.id!, {
                                      intervaloUnidad: e.target.value as UnidadReintento
                                    })
                                  }
                                >
                                  {UNIDADES_REINTENTO.map((u) => (
                                    <option key={u.value} value={u.value}>
                                      {u.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <p className="mt-1 text-[11px] text-gray-500 dark:text-white">
                                {intervaloRawUi === ''
                                  ? 'Sin configuración personalizada de intervalo; se conserva el comportamiento actual.'
                                  : 'Tiempo mínimo de espera entre intentos.'}
                              </p>
                            </div>
                          </div>
                        </div>
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

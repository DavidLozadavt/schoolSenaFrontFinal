import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import clsx from 'clsx';
import ModalCalificarSesion from './calificaciones/modal/ModalCalificarSesion';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Sesion {
  fecha: string;
  numeroSesion: number;
  horaInicial: string;
  horaFinal: string;
  idDia: number;
  idHorarioMateria: number;
  estado: 'COMPLETADA' | 'EN_CURSO' | 'PROXIMO' | 'PENDIENTE';
  idSesionMateria?: number;
  yaCalificada?: boolean;
  calificacionInfo?: {
    id: number;
    estrellas: number;
    comentarios: string | null;
  } | null;
}

export interface Materia {
  idMateria: number;
  materia_nombre: string;
  ficha_codigo: string;
  profesor_nombre: string;
  profesor_email: string;
  aula_nombre: string;
  horario_texto: string;
  horarios: Array<{
    dia: string;
    horaInicial: string;
    horaFinal: string;
    idHorarioMateria: number;
  }>;
  total_sesiones: number;
  sesiones_completadas: number;
  sesiones_restantes: number;
  porcentaje_completado: number;
  sesiones: Sesion[];
  idHorariosMateria: number[];
  todasSesionesCompletadas?: boolean;
}

interface MisClasesProps {
  filtro?: 'todas' | 'completadas';
}

// ─── Normalización ────────────────────────────────────────────────────────────

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return v;
  const n = parseInt(String(v), 10);
  return isNaN(n) ? 0 : n;
};

const toFloat = (v: unknown): number => {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
};

const normalizarSesion = (s: Record<string, unknown>): Sesion => ({
  fecha: typeof s.fecha === 'string' ? s.fecha : '',
  // El backend envía "18:00:00" — normalizamos a "18:00"
  horaInicial: typeof s.horaInicial === 'string' ? s.horaInicial.substring(0, 5) : '',
  horaFinal: typeof s.horaFinal === 'string' ? s.horaFinal.substring(0, 5) : '',
  estado: (['COMPLETADA', 'EN_CURSO', 'PROXIMO', 'PENDIENTE'].includes(s.estado as string)
    ? s.estado
    : 'PENDIENTE') as Sesion['estado'],
  numeroSesion: toNum(s.numeroSesion),
  idDia: toNum(s.idDia),
  idHorarioMateria: toNum(s.idHorarioMateria ?? s.id_horario_materia),
  idSesionMateria: s.idSesionMateria ? toNum(s.idSesionMateria) : undefined,
  yaCalificada: !!s.yaCalificada,
  calificacionInfo: s.calificacionInfo as Sesion['calificacionInfo']
});

const normalizarMateria = (raw: Record<string, unknown>): Materia => ({
  idMateria: toNum(raw.idMateria),
  materia_nombre: typeof raw.materia_nombre === 'string' ? raw.materia_nombre : '',
  ficha_codigo: typeof raw.ficha_codigo === 'string' ? raw.ficha_codigo : '',
  profesor_nombre: typeof raw.profesor_nombre === 'string' ? raw.profesor_nombre : '',
  profesor_email: typeof raw.profesor_email === 'string' ? raw.profesor_email : '',
  aula_nombre: typeof raw.aula_nombre === 'string' ? raw.aula_nombre : '',
  horario_texto: typeof raw.horario_texto === 'string' ? raw.horario_texto : '',
  horarios: Array.isArray(raw.horarios)
    ? (raw.horarios as Record<string, unknown>[]).map((h) => ({
        dia: typeof h.dia === 'string' ? h.dia : '',
        horaInicial: typeof h.horaInicial === 'string' ? h.horaInicial : '',
        horaFinal: typeof h.horaFinal === 'string' ? h.horaFinal : '',
        idHorarioMateria: toNum(h.idHorarioMateria)
      }))
    : [],
  total_sesiones: toNum(raw.total_sesiones),
  sesiones_completadas: toNum(raw.sesiones_completadas),
  sesiones_restantes: toNum(raw.sesiones_restantes),
  porcentaje_completado: toFloat(raw.porcentaje_completado),
  sesiones: Array.isArray(raw.sesiones)
    ? (raw.sesiones as Record<string, unknown>[]).map(normalizarSesion)
    : [],
  idHorariosMateria: Array.isArray(raw.idHorariosMateria)
    ? (raw.idHorariosMateria as unknown[]).map(toNum)
    : []
});

/**
 * Consolida duplicados por idMateria.
 * El backend puede enviar la misma materia dos veces: una con sesiones: []
 * y otra con las sesiones pobladas. Nos quedamos con la que tenga más sesiones;
 * en empate, preferimos la que tenga sesiones_completadas > 0.
 */
export const normalizarClases = (data: unknown[]): Materia[] => {
  if (!Array.isArray(data)) return [];

  const mapa = new Map<number, Materia>();

  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue;
    const materia = normalizarMateria(raw as Record<string, unknown>);
    const existente = mapa.get(materia.idMateria);

    if (!existente) {
      mapa.set(materia.idMateria, materia);
      continue;
    }

    // Preferir la entrada con más sesiones detalladas
    if (materia.sesiones.length > existente.sesiones.length) {
      mapa.set(materia.idMateria, materia);
    } else if (
      materia.sesiones.length === existente.sesiones.length &&
      materia.sesiones_completadas > existente.sesiones_completadas
    ) {
      mapa.set(materia.idMateria, materia);
    }
  }

  return Array.from(mapa.values());
};

// ─── Helpers de estado ────────────────────────────────────────────────────────

const obtenerIconoEstado = (estado: Sesion['estado']): React.ReactElement | null => {
  switch (estado) {
    case 'COMPLETADA':
      return <KeenIcon icon="check" className="text-sm text-gray-600 dark:text-gray-400" />;
    case 'EN_CURSO':
      return <KeenIcon icon="circle" className="text-sm text-green-600 dark:text-green-400" />;
    case 'PROXIMO':
      return (
        <KeenIcon icon="arrow-right" className="text-sm text-orange-600 dark:text-orange-400" />
      );
    case 'PENDIENTE':
      return <KeenIcon icon="lock" className="text-sm text-gray-500 dark:text-gray-400" />;
    default:
      return null;
  }
};

const obtenerTextoEstado = (estado: Sesion['estado']): string => {
  switch (estado) {
    case 'COMPLETADA':
      return 'Completada';
    case 'EN_CURSO':
      return 'En Curso';
    case 'PROXIMO':
      return 'Próximo';
    case 'PENDIENTE':
    default:
      return 'En espera';
  }
};

const obtenerColorEstado = (estado: Sesion['estado']): string => {
  switch (estado) {
    case 'COMPLETADA':
      return 'bg-gray-100 dark:bg-coal-300 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    case 'EN_CURSO':
      return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
    case 'PROXIMO':
      return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700';
    case 'PENDIENTE':
    default:
      return 'bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  }
};

// ─── Helpers de fecha / hora ──────────────────────────────────────────────────

const formatearFecha = (fechaStr: string): string => {
  if (!fechaStr) return '';
  try {
    const normalized = fechaStr.length === 10 ? `${fechaStr}T12:00:00` : fechaStr;
    const fecha = new Date(normalized);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return fechaStr;
  }
};

const formatearHora = (horaStr: string): string => {
  if (!horaStr) return '';
  try {
    // Acepta "HH:MM" o "HH:MM:SS"
    const partes = horaStr.split(':').map(Number);
    const hora24 = partes[0];
    const minuto = partes[1] ?? 0;
    let hora12 = hora24 % 12 || 12;
    const periodo = hora24 < 12 ? 'AM' : 'PM';
    return `${hora12}:${minuto.toString().padStart(2, '0')} ${periodo}`;
  } catch {
    return horaStr;
  }
};

// ─── Componente principal ─────────────────────────────────────────────────────

const MisClases: React.FC<MisClasesProps> = ({ filtro = 'todas' }) => {
  const [loading, setLoading] = useState(true);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);

  // Estados para Calificación de Sesión
  const [selectedSesionForRating, setSelectedSesionForRating] = useState<any>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Actualiza el reloj cada minuto para re-evaluar estados EN_CURSO
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const fetchClases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<{ data: unknown[] }>('fichas/estudiante/clases');
      const materiasData = normalizarClases(response.data?.data ?? []);
      setMaterias(materiasData);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      const mensaje =
        axiosError?.response?.data?.error ??
        'No se pudieron cargar las clases. Por favor, intenta nuevamente.';
      setError(mensaje);
      setMaterias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClases();
  }, [fetchClases]);

  /**
   * Calcula el estado real de una sesión comparando fecha/hora con el reloj actual.
   * Si la sesión viene como COMPLETADA desde el backend, se respeta sin recalcular
   * (evita que sesiones pasadas que el backend ya marcó como completas cambien de estado).
   */
  const obtenerEstadoSesion = useCallback(
    (sesion: Sesion): Sesion['estado'] => {
      // Si el backend ya la marcó como COMPLETADA, respetamos ese estado
      if (sesion.estado === 'COMPLETADA') return 'COMPLETADA';

      try {
        const [year, month, day] = sesion.fecha.split('T')[0].split('-').map(Number);
        const [horaIni, minIni] = sesion.horaInicial.split(':').map(Number);
        const [horaFin, minFin] = sesion.horaFinal.split(':').map(Number);

        const inicio = new Date(year, month - 1, day, horaIni, minIni, 0, 0);
        const fin = new Date(year, month - 1, day, horaFin, minFin, 0, 0);
        const ahora = currentTime.getTime();

        if (ahora > fin.getTime()) return 'COMPLETADA';
        if (ahora >= inicio.getTime()) return 'EN_CURSO';
        return 'PENDIENTE';
      } catch {
        return sesion.estado;
      }
    },
    [currentTime]
  );

  /**
   * Para cada materia:
   * 1. Ordena sesiones cronológicamente.
   * 2. Re-evalúa cada estado con el reloj actual.
   * 3. Marca la primera sesión PENDIENTE como PROXIMO.
   * 4. Calcula todasSesionesCompletadas (solo si hay sesiones; usa porcentaje como fallback).
   */
  const materiasConEstadosActualizados = useMemo<Materia[]>(() => {
    return materias.map((materia) => {
      const sesionesOrdenadas = [...materia.sesiones].sort(
        (a, b) =>
          new Date(`${a.fecha.split('T')[0]}T${a.horaInicial}`).getTime() -
          new Date(`${b.fecha.split('T')[0]}T${b.horaInicial}`).getTime()
      );

      let proximaMarcada = false;
      const sesionesActualizadas = sesionesOrdenadas.map((sesion): Sesion => {
        const estadoCalculado = obtenerEstadoSesion(sesion);

        // Si está en curso o ya completada, no la marcamos como próxima
        if (estadoCalculado === 'EN_CURSO' || estadoCalculado === 'COMPLETADA') {
          return { ...sesion, estado: estadoCalculado };
        }

        // Primera PENDIENTE en el futuro → PROXIMO
        if (estadoCalculado === 'PENDIENTE' && !proximaMarcada) {
          proximaMarcada = true;
          return { ...sesion, estado: 'PROXIMO' };
        }

        return { ...sesion, estado: estadoCalculado };
      });

      // Si no hay sesiones detalladas, confiamos en porcentaje_completado del backend
      const todasSesionesCompletadas =
        sesionesActualizadas.length > 0
          ? sesionesActualizadas.every((s) => s.estado === 'COMPLETADA')
          : materia.porcentaje_completado >= 100;

      return { ...materia, sesiones: sesionesActualizadas, todasSesionesCompletadas };
    });
  }, [materias, obtenerEstadoSesion]);

  const materiasFiltradas = useMemo<Materia[]>(() => {
    if (filtro === 'completadas') {
      return materiasConEstadosActualizados.filter((m) => m.todasSesionesCompletadas);
    }
    return materiasConEstadosActualizados.filter((m) => !m.todasSesionesCompletadas);
  }, [materiasConEstadosActualizados, filtro]);

  /**
   * Agrupa por mes de la última sesión completada (solo en vista "completadas").
   */
  const materiasAgrupadasPorMes = useMemo<
    Array<{ mes: string | null; materias: Materia[] }>
  >(() => {
    if (filtro !== 'completadas') {
      return materiasFiltradas.map((m) => ({ mes: null, materias: [m] }));
    }

    const agrupadas: Record<string, Materia[]> = {};

    for (const materia of materiasFiltradas) {
      // Última sesión completada para determinar el mes
      const ultimaSesion = [...materia.sesiones]
        .filter((s) => s.estado === 'COMPLETADA')
        .sort(
          (a, b) =>
            new Date(`${b.fecha.split('T')[0]}T${b.horaInicial}`).getTime() -
            new Date(`${a.fecha.split('T')[0]}T${a.horaInicial}`).getTime()
        )[0];

      // Si no hay sesión detallada pero está completada al 100%, usamos fecha vacía
      const mesKey = ultimaSesion
        ? ultimaSesion.fecha.split('T')[0].substring(0, 7) // "YYYY-MM"
        : 'sin-fecha';

      if (!agrupadas[mesKey]) agrupadas[mesKey] = [];
      agrupadas[mesKey].push(materia);
    }

    return Object.entries(agrupadas)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => {
        if (key === 'sin-fecha') return { mes: 'SIN FECHA', materias: items };
        const [year, month] = key.split('-').map(Number);
        const mesNombre = new Date(year, month - 1, 1)
          .toLocaleString('es-ES', { month: 'long', year: 'numeric' })
          .toUpperCase();
        return { mes: mesNombre, materias: items };
      });
  }, [materiasFiltradas, filtro]);

  // ─── Estados de carga / error / vacío ──────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando clases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <KeenIcon
            icon="cross-circle"
            className="text-4xl text-red-400 dark:text-red-500 mx-auto mb-3"
          />
          <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
            Error al cargar las clases
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (materias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <KeenIcon
            icon="document"
            className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-3"
          />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            No tienes clases asignadas
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Contacta con tu instructor para más información
          </p>
        </div>
      </div>
    );
  }

  if (materiasFiltradas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <KeenIcon
            icon="check-circle"
            className="text-4xl text-green-500 dark:text-green-400 mx-auto mb-3"
          />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {filtro === 'completadas'
              ? 'No hay clases completadas en este periodo'
              : 'Todas tus clases de este periodo están completadas'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filtro === 'completadas'
              ? 'Cuando termines sesiones, aparecerán aquí agrupadas por mes.'
              : 'Usa el filtro «Solo completadas» para ver el historial o el reporte de asistencias.'}
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-4">
        {materiasAgrupadasPorMes.map((grupo, grupoIndex) => (
          <React.Fragment key={grupoIndex}>
            {grupo.mes && (
              <div className="mb-3 mt-4 first:mt-0">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  {grupo.mes}
                </h3>
                <div className="mt-1.5 border-t border-gray-300 dark:border-gray-600" />
              </div>
            )}

            {grupo.materias.map((materia) => {
              const uniqueKey = `${materia.idMateria}-${materia.profesor_nombre || 'sin-profesor'}`;

              return (
                <div
                  key={uniqueKey}
                  className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-4"
                >
                  {/* Encabezado */}
                  <div className="mb-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-600 dark:border-blue-500 rounded-lg flex items-center justify-center">
                        <KeenIcon
                          icon="book"
                          className="text-blue-600 dark:text-blue-400 text-base"
                        />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 uppercase">
                          {materia.materia_nombre}
                        </h2>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Instructor:</span>{' '}
                          {materia.profesor_nombre || 'Sin asignar'}
                          {materia.profesor_email ? ` - ${materia.profesor_email}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid de sesiones */}
                    {materia.sesiones.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {materia.sesiones.map((sesion, index) => {
                        const canRate = sesion.estado === 'COMPLETADA' && sesion.idSesionMateria && !sesion.yaCalificada;
                        const isAlreadyRated = sesion.estado === 'COMPLETADA' && sesion.yaCalificada;

                        return (
                          <div
                            key={`${sesion.fecha}-${sesion.horaInicial}-${index}`}
                            onClick={() => {
                              if (canRate) {
                                setSelectedSesionForRating({
                                  idSesionMateria: sesion.idSesionMateria,
                                  fecha: sesion.fecha,
                                  numeroSesion: sesion.numeroSesion,
                                  materia_nombre: materia.materia_nombre,
                                  profesor_nombre: materia.profesor_nombre || 'Sin asignar'
                                });
                                setIsRatingModalOpen(true);
                              }
                            }}
                            className={clsx(
                              'border-2 rounded-lg p-2 transition-all duration-150',
                              obtenerColorEstado(sesion.estado),
                              canRate && 'cursor-pointer hover:border-yellow-400 hover:shadow-sm active:scale-98',
                              isAlreadyRated && 'border-yellow-400 bg-yellow-50/20 dark:bg-yellow-950/10'
                            )}
                          >
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-1 w-full">
                                <div className="flex-shrink-0">
                                  {isAlreadyRated ? (
                                    <KeenIcon icon="star" className="text-xs text-yellow-400 font-bold fill-current" />
                                  ) : (
                                    obtenerIconoEstado(sesion.estado)
                                  )}
                                </div>
                                <div className="text-xs font-semibold flex-1 truncate">
                                  {isAlreadyRated ? 'Calificada' : obtenerTextoEstado(sesion.estado)}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 w-full">
                                {formatearFecha(sesion.fecha)}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 w-full">
                                {formatearHora(sesion.horaInicial)} -{' '}
                                {formatearHora(sesion.horaFinal)}
                              </div>
                              {isAlreadyRated && sesion.calificacionInfo && (
                                <div className="flex items-center gap-0.5 mt-1">
                                  {Array.from({ length: sesion.calificacionInfo.estrellas }).map((_, i) => (
                                    <KeenIcon key={i} icon="star" className="text-[10px] text-yellow-400 font-bold fill-current" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Materia sin sesiones detalladas (backend envió sesiones: [])
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {materia.porcentaje_completado >= 100
                        ? `${materia.total_sesiones} sesiones completadas`
                        : `${materia.sesiones_completadas} de ${materia.total_sesiones} sesiones completadas`}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {selectedSesionForRating && (
        <ModalCalificarSesion
          open={isRatingModalOpen}
          onClose={() => {
            setIsRatingModalOpen(false);
            setSelectedSesionForRating(null);
          }}
          sesion={selectedSesionForRating}
          onSuccess={fetchClases}
        />
      )}
    </div>
  );
};

export default MisClases;


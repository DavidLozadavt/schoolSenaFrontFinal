import React, { useState, useEffect, useMemo, Fragment, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { KeenIcon } from '@/components';
import clsx from 'clsx';

interface Sesion {
  fecha: string;
  numeroSesion: number;
  horaInicial: string;
  horaFinal: string;
  idDia: number;
  idHorarioMateria: number;
  estado: 'COMPLETADA' | 'EN_CURSO' | 'PROXIMO' | 'PENDIENTE';
}

interface Materia {
  idMateria: number;
  materia_nombre: string;
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

// ─── Normalización de datos del backend ──────────────────────────────────────
// El backend a veces envía ids como string en vez de number,
// y puede duplicar la misma materia con sesiones: [] en la segunda copia.

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

const normalizarSesion = (s: any): Sesion => ({
  fecha: s.fecha ?? '',
  horaInicial: s.horaInicial ?? '',
  horaFinal: s.horaFinal ?? '',
  estado: s.estado ?? 'PENDIENTE',
  numeroSesion: toNum(s.numeroSesion),
  idDia: toNum(s.idDia),
  idHorarioMateria: toNum(s.idHorarioMateria)
});

const normalizarClases = (data: any[]): Materia[] => {
  if (!Array.isArray(data)) return [];

  const mapa = new Map<number, Materia>();

  for (const raw of data) {
    const materia: Materia = {
      idMateria: toNum(raw.idMateria),
      materia_nombre: raw.materia_nombre ?? '',
      profesor_nombre: raw.profesor_nombre ?? '',
      profesor_email: raw.profesor_email ?? '',
      aula_nombre: raw.aula_nombre ?? '',
      horario_texto: raw.horario_texto ?? '',
      horarios: Array.isArray(raw.horarios)
        ? raw.horarios.map((h: any) => ({
            dia: h.dia ?? '',
            horaInicial: h.horaInicial ?? '',
            horaFinal: h.horaFinal ?? '',
            idHorarioMateria: toNum(h.idHorarioMateria)
          }))
        : [],
      total_sesiones: toNum(raw.total_sesiones),
      sesiones_completadas: toNum(raw.sesiones_completadas),
      sesiones_restantes: toNum(raw.sesiones_restantes),
      porcentaje_completado: toFloat(raw.porcentaje_completado),
      sesiones: Array.isArray(raw.sesiones) ? raw.sesiones.map(normalizarSesion) : [],
      idHorariosMateria: Array.isArray(raw.idHorariosMateria)
        ? raw.idHorariosMateria.map(toNum)
        : []
    };

    const existente = mapa.get(materia.idMateria);

    // Si ya existe esta materia, quedarse con la que tenga más sesiones
    if (!existente || materia.sesiones.length > existente.sesiones.length) {
      mapa.set(materia.idMateria, materia);
    }
  }

  return Array.from(mapa.values());
};

// ─── Helpers de estado ────────────────────────────────────────────────────────

const obtenerIconoEstado = (estado: Sesion['estado']) => {
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
      return 'En espera';
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

// ─── Componente principal ─────────────────────────────────────────────────────

const MisClases: React.FC<MisClasesProps> = ({ filtro = 'todas' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchClases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('fichas/estudiante/clases');
      const materiasData = normalizarClases(response.data?.data || []);
      setMaterias(materiasData);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        'No se pudieron cargar las clases. Por favor, intenta nuevamente.';
      setError(errorMessage);
      setMaterias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClases();
  }, [fetchClases]);

  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '';
    try {
      const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
      const fecha = new Date(year, month - 1, day);
      if (isNaN(fecha.getTime())) return fechaStr;
      const meses = [
        'ene',
        'feb',
        'mar',
        'abr',
        'may',
        'jun',
        'jul',
        'ago',
        'sep',
        'oct',
        'nov',
        'dic'
      ];
      const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
      return `${diasSemana[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
    } catch {
      return fechaStr;
    }
  };

  const formatearHora = (horaStr: string): string => {
    if (!horaStr) return '';
    try {
      const [hora24, minuto] = horaStr.split(':').map(Number);
      let hora12 = hora24;
      let periodo = 'AM';
      if (hora24 === 0) {
        hora12 = 12;
        periodo = 'AM';
      } else if (hora24 === 12) {
        hora12 = 12;
        periodo = 'PM';
      } else if (hora24 > 12) {
        hora12 = hora24 - 12;
        periodo = 'PM';
      }
      return `${hora12}:${minuto.toString().padStart(2, '0')} ${periodo}`;
    } catch {
      return horaStr;
    }
  };

  const obtenerEstadoSesion = (sesion: Sesion): Sesion['estado'] => {
    try {
      const [year, month, day] = sesion.fecha.split('T')[0].split('-').map(Number);
      const fechaSesion = new Date(year, month - 1, day);
      const [horaIni, minIni] = sesion.horaInicial.split(':').map(Number);
      const [horaFin, minFin] = sesion.horaFinal.split(':').map(Number);
      const inicio = new Date(fechaSesion);
      inicio.setHours(horaIni, minIni, 0, 0);
      const fin = new Date(fechaSesion);
      fin.setHours(horaFin, minFin, 0, 0);
      const ahora = currentTime.getTime();
      if (ahora > fin.getTime()) return 'COMPLETADA';
      if (ahora >= inicio.getTime() && ahora <= fin.getTime()) return 'EN_CURSO';
      if (ahora < inicio.getTime()) return 'PENDIENTE';
      return sesion.estado;
    } catch {
      return sesion.estado;
    }
  };

  const materiasConEstadosActualizados = useMemo(() => {
    return materias.map((materia) => {
      const sesionesOrdenadas = [...(materia.sesiones ?? [])].sort(
        (a, b) =>
          new Date(a.fecha + 'T' + a.horaInicial).getTime() -
          new Date(b.fecha + 'T' + b.horaInicial).getTime()
      );

      let proximaSesionEncontrada = false;
      const sesionesActualizadas = sesionesOrdenadas.map((sesion) => {
        const estadoActual = obtenerEstadoSesion(sesion);
        if (proximaSesionEncontrada) return { ...sesion, estado: estadoActual };
        if (estadoActual === 'PENDIENTE') {
          proximaSesionEncontrada = true;
          return { ...sesion, estado: 'PROXIMO' as const };
        }
        return { ...sesion, estado: estadoActual };
      });

      const todasCompletadas = sesionesActualizadas.every((s) => s.estado === 'COMPLETADA');

      return {
        ...materia,
        sesiones: sesionesActualizadas,
        todasSesionesCompletadas: todasCompletadas
      };
    });
  }, [materias, currentTime]);

  const materiasFiltradas = useMemo(() => {
    if (filtro === 'completadas') {
      return materiasConEstadosActualizados.filter((m) => m.todasSesionesCompletadas);
    }
    return materiasConEstadosActualizados.filter((m) => !m.todasSesionesCompletadas);
  }, [materiasConEstadosActualizados, filtro]);

  const materiasAgrupadasPorMes = useMemo(() => {
    if (filtro !== 'completadas') {
      return materiasFiltradas.map((materia) => ({ mes: null, materias: [materia] }));
    }

    const agrupadas: { [key: string]: Materia[] } = {};

    materiasFiltradas.forEach((materia) => {
      const ultimaSesion = [...materia.sesiones]
        .filter((s) => s.estado === 'COMPLETADA')
        .sort(
          (a, b) =>
            new Date(b.fecha + 'T' + b.horaInicial).getTime() -
            new Date(a.fecha + 'T' + a.horaInicial).getTime()
        )[0];

      if (ultimaSesion) {
        const [year, month] = ultimaSesion.fecha.split('T')[0].split('-').map(Number);
        const mesKey = `${year}-${month}`;
        if (!agrupadas[mesKey]) agrupadas[mesKey] = [];
        agrupadas[mesKey].push(materia);
      }
    });

    return Object.entries(agrupadas)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, materias]) => {
        const [year, month] = key.split('-').map(Number);
        const fecha = new Date(year, month - 1, 1);
        const mesNombre = fecha
          .toLocaleString('es-ES', { month: 'long', year: 'numeric' })
          .toUpperCase();
        return { mes: mesNombre, materias };
      });
  }, [materiasFiltradas, filtro]);

  const handleVerDetalle = (idHorarioMateria: number) => {
    navigate(`/ambiente-virtual/clase/${idHorarioMateria}`);
  };

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
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {materia.sesiones.map((sesion, index) => (
                      <div
                        key={`${sesion.fecha}-${sesion.horaInicial}-${index}`}
                        className={clsx(
                          'border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md',
                          obtenerColorEstado(sesion.estado)
                        )}
                        onClick={() => handleVerDetalle(sesion.idHorarioMateria)}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1 w-full">
                            <div className="flex-shrink-0">{obtenerIconoEstado(sesion.estado)}</div>
                            <div className="text-xs font-medium flex-1">
                              {obtenerTextoEstado(sesion.estado)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 w-full">
                            {formatearFecha(sesion.fecha)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 w-full">
                            {formatearHora(sesion.horaInicial)}-{formatearHora(sesion.horaFinal)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default MisClases;

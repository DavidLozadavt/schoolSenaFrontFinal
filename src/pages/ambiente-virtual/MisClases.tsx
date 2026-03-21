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

// Funciones helper para obtener icono y texto de estado
const obtenerIconoEstado = (estado: Sesion['estado']) => {
  switch (estado) {
    case 'COMPLETADA':
      return <KeenIcon icon="check" className="text-sm text-gray-600 dark:text-gray-400" />;
    case 'EN_CURSO':
      return <KeenIcon icon="circle" className="text-sm text-green-600 dark:text-green-400" />;
    case 'PROXIMO':
      return <KeenIcon icon="arrow-right" className="text-sm text-orange-600 dark:text-orange-400" />;
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
      // Pendiente pero aún no es la próxima sesión visible → se muestra como "En espera"
      return 'En espera';
    default:
      return 'En espera';
  }
};

const MisClases: React.FC<MisClasesProps> = ({ filtro = 'todas' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  // Actualizar tiempo cada minuto para recalcular estados en tiempo real
  // (optimizado: no es necesario actualizar cada segundo)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto en lugar de cada segundo

    return () => clearInterval(interval);
  }, []);

  // Obtener clases del estudiante
  const fetchClases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('fichas/estudiante/clases');
      const materiasData = response.data?.data || [];
      setMaterias(materiasData);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'No se pudieron cargar las clases. Por favor, intenta nuevamente.';
      setError(errorMessage);
      setMaterias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClases();
  }, [fetchClases]);

  // Función para formatear fecha (formato: "mar, 8 de abr")
  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '';
    
    try {
      const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
      const fecha = new Date(year, month - 1, day);
      
      if (isNaN(fecha.getTime())) {
        return fechaStr;
      }
      
      const meses = [
        'ene', 'feb', 'mar', 'abr', 'may', 'jun',
        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
      ];
      
      const diasSemana = [
        'dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'
      ];
      
      return `${diasSemana[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
    } catch (error) {
      return fechaStr;
    }
  };

  // Función para formatear hora (12h con AM/PM: "1:00 PM")
  const formatearHora = (horaStr: string): string => {
    if (!horaStr) return '';
    
    try {
      const [hora24, minuto] = horaStr.split(':').map(Number);
      
      // Convertir de 24h a 12h
      let hora12 = hora24;
      let periodo = 'AM';
      
      if (hora24 === 0) {
        hora12 = 12; // Medianoche
        periodo = 'AM';
      } else if (hora24 === 12) {
        hora12 = 12; // Mediodía
        periodo = 'PM';
      } else if (hora24 > 12) {
        hora12 = hora24 - 12;
        periodo = 'PM';
      }
      
      return `${hora12}:${minuto.toString().padStart(2, '0')} ${periodo}`;
    } catch (error) {
      return horaStr;
    }
  };

  // Función para obtener el estado actualizado de una sesión
  const obtenerEstadoSesion = (sesion: Sesion): Sesion['estado'] => {
    const ahora = currentTime;
    
    try {
      const [year, month, day] = sesion.fecha.split('T')[0].split('-').map(Number);
      const fechaSesion = new Date(year, month - 1, day);
      
      const [horaIni, minIni] = sesion.horaInicial.split(':').map(Number);
      const [horaFin, minFin] = sesion.horaFinal.split(':').map(Number);
      
      const fechaHoraInicio = new Date(fechaSesion);
      fechaHoraInicio.setHours(horaIni, minIni, 0, 0);
      
      const fechaHoraFin = new Date(fechaSesion);
      fechaHoraFin.setHours(horaFin, minFin, 0, 0);
      
      // Si ya pasó la hora final, está completada
      if (ahora.getTime() > fechaHoraFin.getTime()) {
        return 'COMPLETADA';
      }
      
      // Si está dentro del rango de horas, está en curso
      if (ahora.getTime() >= fechaHoraInicio.getTime() && ahora.getTime() <= fechaHoraFin.getTime()) {
        return 'EN_CURSO';
      }
      
      // Si es la próxima sesión pendiente, es próximo
      // (esto se calcula comparando con otras sesiones)
      if (ahora.getTime() < fechaHoraInicio.getTime()) {
        // Verificar si es la próxima sesión pendiente
        return 'PENDIENTE';
      }
      
      return sesion.estado;
    } catch (error) {
      return sesion.estado;
    }
  };

  // Recalcular estados de sesiones en tiempo real y marcar solo una como "PROXIMO"
  const materiasConEstadosActualizados = useMemo(() => {
    return materias.map(materia => {
      const sesionesRaw = Array.isArray(materia.sesiones) ? materia.sesiones : [];
      // Ordenar sesiones por fecha y hora
      const sesionesOrdenadas = [...sesionesRaw].sort((a, b) => {
        const fechaA = new Date(a.fecha + 'T' + a.horaInicial).getTime();
        const fechaB = new Date(b.fecha + 'T' + b.horaInicial).getTime();
        return fechaA - fechaB;
      });
      
      // Encontrar la primera sesión pendiente (próxima)
      let proximaSesionEncontrada = false;
      const sesionesActualizadas = sesionesOrdenadas.map(sesion => {
        const estadoActual = obtenerEstadoSesion(sesion);
        
        // Si ya encontramos la próxima sesión, no marcar más como PROXIMO
        if (proximaSesionEncontrada) {
          return { ...sesion, estado: estadoActual };
        }
        
        // Si es pendiente y aún no encontramos la próxima, marcarla como PROXIMO
        if (estadoActual === 'PENDIENTE') {
          proximaSesionEncontrada = true;
          return { ...sesion, estado: 'PROXIMO' as const };
        }
        
        return { ...sesion, estado: estadoActual };
      });
      
      // Verificar si todas las sesiones están completadas
      const todasCompletadas = sesionesActualizadas.every(sesion => sesion.estado === 'COMPLETADA');
      
      return {
        ...materia,
        sesiones: sesionesActualizadas,
        todasSesionesCompletadas: todasCompletadas
      };
    });
  }, [materias, currentTime]);

  // Filtrar materias según el filtro seleccionado
  const materiasFiltradas = useMemo(() => {
    if (filtro === 'completadas') {
      // Solo mostrar las que están completamente completadas
      return materiasConEstadosActualizados.filter(materia => materia.todasSesionesCompletadas);
    } else {
      // En "todas las clases" solo mostrar las que aún tienen sesiones pendientes
      return materiasConEstadosActualizados.filter(materia => !materia.todasSesionesCompletadas);
    }
  }, [materiasConEstadosActualizados, filtro]);

  // Agrupar materias completadas por mes
  const materiasAgrupadasPorMes = useMemo(() => {
    if (filtro !== 'completadas') {
      return materiasFiltradas.map(materia => ({ mes: null, materias: [materia] }));
    }

    const agrupadas: { [key: string]: Materia[] } = {};
    
    materiasFiltradas.forEach(materia => {
      // Obtener la fecha de la última sesión completada
      const ultimaSesion = [...materia.sesiones]
        .filter(s => s.estado === 'COMPLETADA')
        .sort((a, b) => {
          const fechaA = new Date(a.fecha + 'T' + a.horaInicial).getTime();
          const fechaB = new Date(b.fecha + 'T' + b.horaInicial).getTime();
          return fechaB - fechaA; // Ordenar descendente para obtener la última
        })[0];

      if (ultimaSesion) {
        const [year, month] = ultimaSesion.fecha.split('T')[0].split('-').map(Number);
        const fecha = new Date(year, month - 1, 1);
        const mesKey = `${year}-${month}`;
        const mesNombre = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
        
        if (!agrupadas[mesKey]) {
          agrupadas[mesKey] = [];
        }
        agrupadas[mesKey].push(materia);
      }
    });

    // Convertir a array y ordenar por mes (más reciente primero)
    return Object.entries(agrupadas)
      .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
      .map(([key, materias]) => {
        const [year, month] = key.split('-').map(Number);
        const fecha = new Date(year, month - 1, 1);
        const mesNombre = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
        return { mes: mesNombre, materias };
      });
  }, [materiasFiltradas, filtro]);

  // Determinar la próxima sesión
  const obtenerProximaSesion = (sesiones: Sesion[]): Sesion | null => {
    const ahora = currentTime;
    const sesionesPendientes = sesiones.filter(s => {
      const [year, month, day] = s.fecha.split('T')[0].split('-').map(Number);
      const fechaSesion = new Date(year, month - 1, day);
      const [horaIni, minIni] = s.horaInicial.split(':').map(Number);
      const fechaHoraInicio = new Date(fechaSesion);
      fechaHoraInicio.setHours(horaIni, minIni, 0, 0);
      return ahora.getTime() < fechaHoraInicio.getTime();
    });
    
    if (sesionesPendientes.length === 0) return null;
    
    // Ordenar por fecha y hora
    sesionesPendientes.sort((a, b) => {
      const fechaA = new Date(a.fecha + 'T' + a.horaInicial);
      const fechaB = new Date(b.fecha + 'T' + b.horaInicial);
      return fechaA.getTime() - fechaB.getTime();
    });
    
    return sesionesPendientes[0];
  };

  // Función para obtener el color del estado (según imagen)
  const obtenerColorEstado = (estado: Sesion['estado']): string => {
    switch (estado) {
      case 'COMPLETADA':
        // Completadas totalmente en gris
        return 'bg-gray-100 dark:bg-coal-300 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      case 'EN_CURSO':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'PROXIMO':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'PENDIENTE':
      // Pendientes/en espera: fondo blanco, solo borde gris
      return 'bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      default:
      return 'bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  // Función para navegar al detalle de la clase
  const handleVerDetalle = (idHorarioMateria: number) => {
    navigate(`/ambiente-virtual/clase/${idHorarioMateria}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando clases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <KeenIcon icon="cross-circle" className="text-4xl text-red-400 dark:text-red-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
            Error al cargar las clases
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (materias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <KeenIcon icon="document" className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-3" />
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

  // "Todas" oculta materias ya 100% completadas; si todas lo están, el filtro deja lista vacía → pantalla en blanco
  if (materiasFiltradas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <KeenIcon icon="check-circle" className="text-4xl text-green-500 dark:text-green-400 mx-auto mb-3" />
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
                <div className="mt-1.5 border-t border-gray-300 dark:border-gray-600"></div>
              </div>
            )}
            {grupo.materias.map((materia) => {
              // Clave única usando idMateria y profesor_nombre (el backend ya agrupa correctamente)
              const uniqueKey = `${materia.idMateria}-${materia.profesor_nombre || 'sin-profesor'}`;
              
              return (
                <div
                  key={uniqueKey}
                  className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-4"
                >
              {/* Encabezado de la materia */}
              <div className="mb-4">
                <div className="flex items-start gap-3 mb-4">
                  {/* Icono de libro con fondo azul claro y borde azul oscuro - más pequeño */}
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-600 dark:border-blue-500 rounded-lg flex items-center justify-center">
                    <KeenIcon icon="book" className="text-blue-600 dark:text-blue-400 text-base" />
                  </div>
                  
                  <div className="flex-1">
                    {/* Nombre del tema - más pequeño */}
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 uppercase">
                      {materia.materia_nombre}
                    </h2>

                    {/* Información del instructor - más pequeño */}
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Instructor:</span> {materia.profesor_nombre || 'Sin asignar'}{materia.profesor_email ? ` - ${materia.profesor_email}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid de sesiones */}
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {materia.sesiones.map((sesion, index) => {
                    const estadoFinal = sesion.estado;
                    
                    return (
                      <div
                        key={`${sesion.fecha}-${sesion.horaInicial}-${index}`}
                        className={clsx(
                          'border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md',
                          obtenerColorEstado(estadoFinal)
                        )}
                        onClick={() => handleVerDetalle(sesion.idHorarioMateria)}
                      >
                        <div className="flex flex-col items-start gap-1">
                          {/* Icono y estado */}
                          <div className="flex items-center gap-1 w-full">
                            <div className="flex-shrink-0">
                              {obtenerIconoEstado(estadoFinal)}
                            </div>
                            <div className="text-xs font-medium flex-1">
                              {obtenerTextoEstado(estadoFinal)}
                            </div>
                          </div>
                          
                          {/* Fecha */}
                          <div className="text-xs text-gray-600 dark:text-gray-400 w-full">
                            {formatearFecha(sesion.fecha)}
                          </div>
                          
                          {/* Hora */}
                          <div className="text-xs text-gray-600 dark:text-gray-400 w-full">
                            {formatearHora(sesion.horaInicial)}-{formatearHora(sesion.horaFinal)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

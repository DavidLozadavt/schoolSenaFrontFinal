import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { KeenIcon } from '@/components';

interface Props {
  searchTerm: string;
  evento: boolean;
  setEvento: (value: boolean) => void;
}

interface Ficha {
  id: number;
  codigo: string;
  jornada?: {
    id: number;
    nombreJornada: string;
    horaInicial?: string;
    horaFinal?: string;
  };
  asignacion?: {
    id: number;
    fechaInicialClases?: string;
    fechaFinalClases?: string;
    programa?: {
      id: number;
      nombrePrograma: string;
    };
  };
  instructorLider?: {
    id: number;
    persona?: {
      nombre1: string;
      nombre2?: string;
      apellido1: string;
      apellido2?: string;
    };
  };
  horarios?: any[];
}

const ListaHistorialRAPs: React.FC<Props> = ({ searchTerm, evento, setEvento }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('Todos los estados');

  useEffect(() => {
    const fetchFichas = async () => {
      try {
        setLoading(true);
        const response = await axios.get('fichas');
        setFichas(response.data || []);
        setEvento(false);
      } catch (error) {
        console.error('Error al cargar fichas:', error);
        setFichas([]);
      } finally {
        setLoading(false);
      }
    };

    if (evento) {
      fetchFichas();
    }
  }, [evento, setEvento]);

  const getStatus = (ficha: Ficha): 'EN CURSO' | 'PENDIENTE' | 'COMPLETADO' => {
    if (!ficha.asignacion?.fechaInicialClases || !ficha.asignacion?.fechaFinalClases) {
      return 'PENDIENTE';
    }

    const fechaInicio = new Date(ficha.asignacion.fechaInicialClases);
    const fechaFin = new Date(ficha.asignacion.fechaFinalClases);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(0, 0, 0, 0);

    if (hoy >= fechaInicio && hoy <= fechaFin) {
      return 'EN CURSO';
    } else if (hoy < fechaInicio) {
      return 'PENDIENTE';
    } else {
      return 'COMPLETADO';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre'
    ];
    return `${days[date.getDay()]} (${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]})`;
  };

  const isToday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getJornadaType = (nombreJornada: string): 'Mañana' | 'Tarde' | 'Noche' => {
    const lower = nombreJornada?.toLowerCase() || '';
    if (lower.includes('mañana') || lower.includes('manana')) return 'Mañana';
    if (lower.includes('tarde')) return 'Tarde';
    if (lower.includes('noche')) return 'Noche';
    return 'Mañana';
  };

  const getHorario = (ficha: Ficha) => {
    if (ficha.jornada?.horaInicial && ficha.jornada?.horaFinal) {
      return `${ficha.jornada.horaInicial} - ${ficha.jornada.horaFinal}`;
    }
    return '';
  };

  const getNumSesiones = (ficha: Ficha): number => {
    // Si hay horarios, contar sesiones
    if (ficha.horarios && ficha.horarios.length > 0) {
      return ficha.horarios.length;
    }
    // Si no, calcular basado en fechas (estimado)
    if (ficha.asignacion?.fechaInicialClases && ficha.asignacion?.fechaFinalClases) {
      const inicio = new Date(ficha.asignacion.fechaInicialClases);
      const fin = new Date(ficha.asignacion.fechaFinalClases);
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Estimación: 3-4 sesiones por semana
      return Math.ceil((diffDays / 7) * 3.5);
    }
    return 0;
  };

  const filteredFichas = useMemo(() => {
    let filtered = [...fichas];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ficha) =>
          ficha.codigo?.toLowerCase().includes(term) ||
          ficha.asignacion?.programa?.nombrePrograma?.toLowerCase().includes(term) ||
          ficha.jornada?.nombreJornada?.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado
    if (selectedStatus !== 'Todos los estados') {
      filtered = filtered.filter((ficha) => getStatus(ficha) === selectedStatus.toUpperCase());
    }

    // Ordenar: En Curso primero, luego Pendiente por fecha ascendente, luego Completado por fecha descendente
    filtered.sort((a, b) => {
      const statusA = getStatus(a);
      const statusB = getStatus(b);
      const statusOrder = { 'EN CURSO': 1, 'PENDIENTE': 2, 'COMPLETADO': 3 };

      if (statusOrder[statusA] !== statusOrder[statusB]) {
        return statusOrder[statusA] - statusOrder[statusB];
      }

      const fechaA = a.asignacion?.fechaInicialClases
        ? new Date(a.asignacion.fechaInicialClases).getTime()
        : 0;
      const fechaB = b.asignacion?.fechaInicialClases
        ? new Date(b.asignacion.fechaInicialClases).getTime()
        : 0;

      if (statusA === 'PENDIENTE') {
        return fechaA - fechaB;
      }
      if (statusA === 'COMPLETADO') {
        return fechaB - fechaA;
      }
      return 0;
    });

    return filtered;
  }, [fichas, searchTerm, selectedStatus]);

  const classesToday = useMemo(() => {
    return filteredFichas.filter((ficha) => {
      if (!ficha.asignacion?.fechaInicialClases) return false;
      return isToday(ficha.asignacion.fechaInicialClases);
    });
  }, [filteredFichas]);

  // Separar fichas por estado para agrupar
  const fichasEnCurso = useMemo(() => {
    return filteredFichas.filter((f) => getStatus(f) === 'EN CURSO');
  }, [filteredFichas]);

  const fichasPendientes = useMemo(() => {
    return filteredFichas.filter((f) => getStatus(f) === 'PENDIENTE');
  }, [filteredFichas]);

  const fichasCompletadas = useMemo(() => {
    return filteredFichas.filter((f) => getStatus(f) === 'COMPLETADO');
  }, [filteredFichas]);

  // Agrupar pendientes por fecha
  const groupedPendientes = useMemo(() => {
    const groups: { [key: string]: Ficha[] } = {};
    fichasPendientes.forEach((ficha) => {
      if (!ficha.asignacion?.fechaInicialClases) return;
      const jornadaType = getJornadaType(ficha.jornada?.nombreJornada || '');
      const dateKey = `${jornadaType} (${formatDate(ficha.asignacion.fechaInicialClases)})`;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(ficha);
    });
    return groups;
  }, [fichasPendientes]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN CURSO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
            En Curso
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
            Pendiente
          </span>
        );
      case 'COMPLETADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            <i className="ki-outline ki-check text-xs dark:text-gray-300"></i>
            Completado
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando clases...</p>
        </div>
      </div>
    );
  }

  if (fichas.length === 0) {
    return (
      <div className="text-center py-12">
        <KeenIcon icon="document" className="text-6xl text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
          No hay clases disponibles
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Aún no tienes clases asignadas como instructor líder
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Clases de Hoy y Filtro */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Clases de Hoy</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {classesToday.length} {classesToday.length === 1 ? 'clase' : 'clases'}
          </span>
        </div>
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="select w-auto rounded-full px-3 py-1.5 pr-7 text-xs font-medium"
          >
            <option>Todos los estados</option>
            <option>En Curso</option>
            <option>Pendiente</option>
            <option>Completado</option>
          </select>
        </div>
      </div>

      {/* Clases de Hoy */}
      {classesToday.length > 0 && (
        <div className="mb-6 space-y-3">
          {classesToday.map((ficha) => {
            const jornadaType = getJornadaType(ficha.jornada?.nombreJornada || '');
            const horario = getHorario(ficha);
            const numSesiones = getNumSesiones(ficha);
            return (
              <div
                key={ficha.id}
                className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-3 transition-all cursor-pointer"
                onClick={() => navigate(`/ambiente-virtual/clase/${ficha.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-600 flex items-center justify-center">
                    <i className="ki-outline ki-book text-lg text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {ficha.asignacion?.programa?.nombrePrograma || 'Sin programa'}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        En Curso
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-document text-sm"></i>
                        <span>Ficha {ficha.codigo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-sun text-sm"></i>
                        <span>{jornadaType}</span>
                      </div>
                      {horario && (
                        <div className="flex items-center gap-1">
                          <i className="ki-outline ki-time text-sm"></i>
                          <span>{horario}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-calendar text-sm"></i>
                        <span>{numSesiones} sesiones</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="ki-outline ki-right text-base text-gray-400 group-hover:text-blue-600 transition-colors"></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clases En Curso */}
      {fichasEnCurso.length > 0 && (
        <div className="space-y-3">
          {fichasEnCurso.map((ficha) => {
            const status = getStatus(ficha);
            const jornadaType = getJornadaType(ficha.jornada?.nombreJornada || '');
            const horario = getHorario(ficha);
            const numSesiones = getNumSesiones(ficha);
            return (
              <div
                key={ficha.id}
                className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-3 transition-all cursor-pointer"
                onClick={() => navigate(`/ambiente-virtual/clase/${ficha.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-600 flex items-center justify-center">
                    <i className="ki-outline ki-book text-lg text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {ficha.asignacion?.programa?.nombrePrograma || 'Sin programa'}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        En Curso
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-document text-sm"></i>
                        <span>Ficha {ficha.codigo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-sun text-sm"></i>
                        <span>{jornadaType}</span>
                      </div>
                      {horario && (
                        <div className="flex items-center gap-1">
                          <i className="ki-outline ki-time text-sm"></i>
                          <span>{horario}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-calendar text-sm"></i>
                        <span>{numSesiones} sesiones</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="ki-outline ki-right text-base text-gray-400 group-hover:text-blue-600 transition-colors"></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clases Pendientes - Agrupadas por fecha */}
      {Object.entries(groupedPendientes).map(([dateKey, fichas]) => (
        <div key={dateKey} className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{dateKey}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {fichas.length} {fichas.length === 1 ? 'clase' : 'clases'}
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>
          {fichas.map((ficha) => {
            const status = getStatus(ficha);
            const jornadaType = getJornadaType(ficha.jornada?.nombreJornada || '');
            const horario = getHorario(ficha);
            const numSesiones = getNumSesiones(ficha);
            return (
              <div
                key={ficha.id}
                className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-3 transition-all cursor-pointer"
                onClick={() => navigate(`/ambiente-virtual/clase/${ficha.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-600 flex items-center justify-center">
                    <i className="ki-outline ki-book text-lg text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {ficha.asignacion?.programa?.nombrePrograma || 'Sin programa'}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        Pendiente
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-document text-sm"></i>
                        <span>Ficha {ficha.codigo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-sun text-sm"></i>
                        <span>{jornadaType}</span>
                      </div>
                      {horario && (
                        <div className="flex items-center gap-1">
                          <i className="ki-outline ki-time text-sm"></i>
                          <span>{horario}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-calendar text-sm"></i>
                        <span>{numSesiones} sesiones</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="ki-outline ki-right text-base text-gray-400 group-hover:text-blue-600 transition-colors"></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Clases Completadas */}
      {fichasCompletadas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Clases Completadas
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {fichasCompletadas.length} {fichasCompletadas.length === 1 ? 'clase' : 'clases'}
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>
          {fichasCompletadas.map((ficha) => {
            const status = getStatus(ficha);
            const jornadaType = getJornadaType(ficha.jornada?.nombreJornada || '');
            const horario = getHorario(ficha);
            const numSesiones = getNumSesiones(ficha);
            return (
              <div
                key={ficha.id}
                className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-3 transition-all cursor-pointer"
                onClick={() => navigate(`/ambiente-virtual/clase/${ficha.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-600 flex items-center justify-center">
                    <i className="ki-outline ki-book text-lg text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {ficha.asignacion?.programa?.nombrePrograma || 'Sin programa'}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        Completado
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-document text-sm"></i>
                        <span>Ficha {ficha.codigo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-sun text-sm"></i>
                        <span>{jornadaType}</span>
                      </div>
                      {horario && (
                        <div className="flex items-center gap-1">
                          <i className="ki-outline ki-time text-sm"></i>
                          <span>{horario}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-calendar text-sm"></i>
                        <span>{numSesiones} sesiones</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="ki-outline ki-right text-base text-gray-400 group-hover:text-blue-600 transition-colors"></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListaHistorialRAPs;

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth/useAuthContext';

interface Props {
  searchTerm: string;
  evento: boolean;
  setEvento: (value: boolean) => void;
  idInstructor?: number; // ID del contrato del instructor (opcional)
}

interface Clase {
  ficha_id: number;
  ficha_codigo: string;
  programa_nombre: string;
  materia_nombre: string;
  jornada_nombre: string;
  jornada_tipo: string;
  dia_semana: string;
  horaInicial: string;
  horaFinal: string;
  fechaInicial: string;
  fechaFinal: string | null;
  estado: string;
  total_sesiones: number;
  contrato_id: number;
  instructor_nombre: string;
  idGradoPrograma: number | null;
  grado_nombre: string | null;
  idHorarioMateria: number;
}

const ListaHistorialRAPs: React.FC<Props> = ({ searchTerm, evento, setEvento, idInstructor }) => {
  const navigate = useNavigate();
  const authContext = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<Clase[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('Todos los estados');

  useEffect(() => {
    const fetchClases = async () => {
      try {
        setLoading(true);
        let response;
        
        if (idInstructor) {
          // Si se proporciona el ID del instructor, usar endpoint específico
          response = await axios.get(`fichas/instructor/${idInstructor}/clases-asignadas`);
        } else {
          // Si no, el backend obtendrá automáticamente el ID del usuario autenticado
          response = await axios.get('fichas/instructor/clases-asignadas');
        }
        
        const clasesData = response.data?.data || [];
        setClases(clasesData);
        setEvento(false);
      } catch (error) {
        console.error('Error al cargar clases:', error);
        setClases([]);
      } finally {
        setLoading(false);
      }
    };

    if (evento) {
      fetchClases();
    }
  }, [evento, setEvento, idInstructor]);

  const getStatus = (clase: Clase): 'EN CURSO' | 'PENDIENTE' | 'COMPLETADO' => {
    if (!clase.fechaInicial) {
      return 'PENDIENTE';
    }

    // Parsear fecha sin problemas de zona horaria (formato YYYY-MM-DD)
    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const fechaInicio = parseDate(clase.fechaInicial);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaInicio.setHours(0, 0, 0, 0);

    // SI ES HOY, SIEMPRE verificar la hora (ignorar estado del backend)
    const esHoy = fechaInicio.getTime() === hoy.getTime();
    
    if (esHoy) {
      // Si tiene horas definidas, usar la lógica de horas
      if (clase.horaInicial && clase.horaFinal) {
        const ahora = new Date();
        const horaActual = ahora.getHours();
        const minutoActual = ahora.getMinutes();
        const tiempoActual = horaActual * 60 + minutoActual; // Minutos desde medianoche
        
        // Parsear horas del backend (viene como "04:00:00" pero en realidad es 4:00 PM si jornada_tipo es TARDE)
        let horaIniStr = clase.horaInicial.substring(0, 5);
        let horaFinStr = clase.horaFinal.substring(0, 5);
        
        let [horaIni, minIni] = horaIniStr.split(':').map(Number);
        let [horaFin, minFin] = horaFinStr.split(':').map(Number);
        
        // El backend devuelve horas en formato 12h pero como si fueran 24h
        // Si jornada_tipo es TARDE o NOCHE, y la hora es menor a 12, sumar 12
        const jornadaTipo = clase.jornada_tipo?.toUpperCase() || '';
        const esTarde = jornadaTipo.includes('TARDE');
        const esNoche = jornadaTipo.includes('NOCHE') || jornadaTipo.includes('NOCTURNA');
        
        if ((esTarde || esNoche) && horaIni < 12) {
          horaIni += 12;
        }
        if ((esTarde || esNoche) && horaFin < 12) {
          horaFin += 12;
        }
        
        const tiempoInicio = horaIni * 60 + minIni;
        const tiempoFin = horaFin * 60 + minFin;
        
        // Si aún no ha comenzado, es pendiente
        if (tiempoActual < tiempoInicio) {
          return 'PENDIENTE';
        }
        
        // Si está en el rango, está en curso
        if (tiempoActual >= tiempoInicio && tiempoActual <= tiempoFin) {
          return 'EN CURSO';
        }
        
        // Si ya pasó la hora de fin, es completado
        if (tiempoActual > tiempoFin) {
          return 'COMPLETADO';
        }
      }
      
      // Si es hoy pero no tiene horas, retornar pendiente por defecto
      return 'PENDIENTE';
    }

    // Si NO es hoy, usar el estado del backend si existe
    if (clase.estado) {
      return clase.estado.toUpperCase() as 'EN CURSO' | 'PENDIENTE' | 'COMPLETADO';
    }

    // Fallback: calcular basado en fechas
    const fechaFin = clase.fechaFinal ? parseDate(clase.fechaFinal) : fechaInicio;
    fechaFin.setHours(0, 0, 0, 0);

    if (fechaInicio.getTime() < hoy.getTime()) {
      return 'COMPLETADO';
    }

    if (fechaInicio.getTime() > hoy.getTime()) {
      return 'PENDIENTE';
    }

    // Por defecto, pendiente
    return 'PENDIENTE';
  };

  const formatDateForGroup = (dateString: string, jornadaTipo: string): string => {
    // Parsear fecha sin problemas de zona horaria (formato YYYY-MM-DD)
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
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
    
    // Verificar si es hoy, mañana o más adelante
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(year, month - 1, day);
    fecha.setHours(0, 0, 0, 0);
    
    const diffTime = fecha.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const diaSemana = days[date.getDay()];
    const diaNumero = date.getDate();
    const mes = months[date.getMonth()];
    
    if (diffDays === 0) {
      // Es hoy - usar la jornada
      return `${jornadaTipo} (hoy)`;
    } else if (diffDays === 1) {
      // Es mañana - mostrar "Mañana" + fecha completa
      return `Mañana (${diaSemana}, ${diaNumero} de ${mes})`;
    } else {
      // Es más adelante - solo mostrar la fecha sin jornada
      return `(${diaSemana}, ${diaNumero} de ${mes})`;
    }
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
    // Parsear fecha sin problemas de zona horaria (formato YYYY-MM-DD)
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getJornadaType = (jornadaTipo: string): string => {
    if (!jornadaTipo) return 'Mañana';
    
    // Normalizar: convertir a minúsculas para comparar
    const lower = jornadaTipo.toLowerCase().trim();
    
    // Detectar el tipo basándose en palabras clave
    if (lower.includes('mañana') || lower.includes('manana')) {
      return 'Mañana';
    }
    if (lower.includes('tarde')) {
      return 'Tarde';
    }
    if (lower.includes('noche') || lower.includes('nocturna')) {
      return 'Noche';
    }
    
    // Si no coincide, devolver el valor original capitalizado
    // Capitalizar solo la primera letra
    return jornadaTipo.charAt(0).toUpperCase() + jornadaTipo.slice(1).toLowerCase();
  };

  // Función para convertir hora de 24h a formato 12h con AM/PM basado en la jornada
  const formatTime12h = (timeString: string, jornadaTipo?: string): string => {
    if (!timeString) return 'N/A';
    const time = timeString.substring(0, 5); // Obtener HH:MM
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    
    // Determinar AM/PM basado en la jornada
    const jornadaLower = jornadaTipo?.toLowerCase() || '';
    const esManana = jornadaLower.includes('mañana') || jornadaLower.includes('manana');
    const esTarde = jornadaLower.includes('tarde');
    const esNoche = jornadaLower.includes('noche');
    
    // Si es Mañana, todas las horas son AM
    // Si es Tarde o Noche, todas las horas son PM
    let esPM = false;
    if (esManana) {
      esPM = false; // AM
    } else if (esTarde || esNoche) {
      esPM = true; // PM
    } else {
      // Si no hay jornada definida, usar la lógica estándar basada en la hora
      esPM = hour24 >= 12;
    }
    
    // Convertir a formato 12h
    let hour12: number;
    if (hour24 === 0) {
      hour12 = 12;
    } else if (hour24 <= 12) {
      hour12 = hour24 === 12 ? 12 : hour24;
    } else {
      hour12 = hour24 - 12;
    }
    
    return `${hour12}:${minutes} ${esPM ? 'PM' : 'AM'}`;
  };

  const getHorario = (clase: Clase): string => {
    if (clase.horaInicial && clase.horaFinal) {
      // Formatear hora con AM/PM basado en la jornada
      const horaIni = formatTime12h(clase.horaInicial, clase.jornada_tipo);
      const horaFin = formatTime12h(clase.horaFinal, clase.jornada_tipo);
      return `${horaIni} - ${horaFin}`;
    }
    return '';
  };

  const getNumSesiones = (clase: Clase): number => {
    return clase.total_sesiones || 0;
  };

  const handleNavigateToClase = (clase: Clase) => {
    // Usar idHorarioMateria como identificador único de la clase
    if (clase.idHorarioMateria) {
      const id = Number(clase.idHorarioMateria);
      if (!isNaN(id) && id > 0) {
        navigate(`/ambiente-virtual/clase/${id}`);
      }
    }
  };

  const filteredClases = useMemo(() => {
    let filtered = [...clases];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (clase) =>
          clase.ficha_codigo?.toLowerCase().includes(term) ||
          clase.materia_nombre?.toLowerCase().includes(term) ||
          clase.programa_nombre?.toLowerCase().includes(term) ||
          clase.jornada_nombre?.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado
    if (selectedStatus !== 'Todos los estados') {
      filtered = filtered.filter((clase) => getStatus(clase) === selectedStatus.toUpperCase());
    }

    // Ordenar: En Curso primero, luego Pendiente por fecha ascendente, luego Completado por fecha descendente
    // Dentro de cada grupo, ordenar por hora inicial
    filtered.sort((a, b) => {
      const statusA = getStatus(a);
      const statusB = getStatus(b);
      const statusOrder = { 'EN CURSO': 1, 'PENDIENTE': 2, 'COMPLETADO': 3 };

      if (statusOrder[statusA] !== statusOrder[statusB]) {
        return statusOrder[statusA] - statusOrder[statusB];
      }

      const fechaA = a.fechaInicial
        ? new Date(a.fechaInicial).getTime()
        : 0;
      const fechaB = b.fechaInicial
        ? new Date(b.fechaInicial).getTime()
        : 0;

      // Si las fechas son diferentes, ordenar por fecha
      if (fechaA !== fechaB) {
        if (statusA === 'PENDIENTE') {
          return fechaA - fechaB;
        }
        if (statusA === 'COMPLETADO') {
          return fechaB - fechaA;
        }
        return fechaA - fechaB;
      }

      // Si las fechas son iguales, ordenar por hora inicial
      const horaA = a.horaInicial || '00:00:00';
      const horaB = b.horaInicial || '00:00:00';
      return horaA.localeCompare(horaB);
    });

    return filtered;
  }, [clases, searchTerm, selectedStatus]);

  const classesToday = useMemo(() => {
    const today = filteredClases.filter((clase) => {
      if (!clase.fechaInicial) return false;
      return isToday(clase.fechaInicial);
    });
    
    // Ordenar por hora inicial
    return today.sort((a, b) => {
      const horaA = a.horaInicial || '00:00:00';
      const horaB = b.horaInicial || '00:00:00';
      return horaA.localeCompare(horaB);
    });
  }, [filteredClases]);

  // Separar clases por estado para agrupar
  const clasesEnCurso = useMemo(() => {
    const enCurso = filteredClases.filter((c) => getStatus(c) === 'EN CURSO');
    // Ordenar por fecha y luego por hora inicial
    return enCurso.sort((a, b) => {
      const fechaA = a.fechaInicial ? new Date(a.fechaInicial).getTime() : 0;
      const fechaB = b.fechaInicial ? new Date(b.fechaInicial).getTime() : 0;
      if (fechaA !== fechaB) {
        return fechaA - fechaB;
      }
      const horaA = a.horaInicial || '00:00:00';
      const horaB = b.horaInicial || '00:00:00';
      return horaA.localeCompare(horaB);
    });
  }, [filteredClases]);

  const clasesPendientes = useMemo(() => {
    return filteredClases.filter((c) => getStatus(c) === 'PENDIENTE');
  }, [filteredClases]);

  const clasesCompletadas = useMemo(() => {
    const completadas = filteredClases.filter((c) => getStatus(c) === 'COMPLETADO');
    // Ordenar por fecha descendente (más reciente primero) y luego por hora final descendente
    return completadas.sort((a, b) => {
      const fechaA = a.fechaInicial ? new Date(a.fechaInicial).getTime() : 0;
      const fechaB = b.fechaInicial ? new Date(b.fechaInicial).getTime() : 0;
      if (fechaA !== fechaB) {
        return fechaB - fechaA; // Descendente (más reciente primero)
      }
      // Si es la misma fecha, ordenar por hora final (la que terminó más tarde primero)
      const horaA = a.horaFinal || '00:00:00';
      const horaB = b.horaFinal || '00:00:00';
      return horaB.localeCompare(horaA); // Descendente
    });
  }, [filteredClases]);

  // Agrupar pendientes por fecha
  const groupedPendientes = useMemo(() => {
    const groups: { [key: string]: Clase[] } = {};
    clasesPendientes.forEach((clase) => {
      if (!clase.fechaInicial) return;
      const jornadaType = getJornadaType(clase.jornada_tipo || '');
      const dateKey = formatDateForGroup(clase.fechaInicial, jornadaType);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(clase);
    });
    
    // Ordenar cada grupo por hora inicial
    Object.keys(groups).forEach((dateKey) => {
      groups[dateKey].sort((a, b) => {
        const horaA = a.horaInicial || '00:00:00';
        const horaB = b.horaInicial || '00:00:00';
        return horaA.localeCompare(horaB);
      });
    });
    
    return groups;
  }, [clasesPendientes]);

  // Función para verificar si hay una clase en curso el mismo día y si esta clase es la siguiente
  const esProximaClase = (clase: Clase): boolean => {
    if (!clase.fechaInicial || !isToday(clase.fechaInicial)) {
      return false;
    }

    const status = getStatus(clase);
    if (status !== 'PENDIENTE') {
      return false;
    }

    // Buscar si hay alguna clase en curso el mismo día
    const hayClaseEnCurso = filteredClases.some((c) => {
      if (!c.fechaInicial) return false;
      return isToday(c.fechaInicial) && getStatus(c) === 'EN CURSO';
    });

    if (!hayClaseEnCurso) {
      return false;
    }

    // Obtener todas las clases de hoy ordenadas por hora
    const clasesHoy = filteredClases.filter((c) => {
      if (!c.fechaInicial) return false;
      return isToday(c.fechaInicial);
    }).sort((a, b) => {
      const horaA = a.horaInicial || '00:00:00';
      const horaB = b.horaInicial || '00:00:00';
      return horaA.localeCompare(horaB);
    });

    // Encontrar la clase en curso
    const claseEnCurso = clasesHoy.find((c) => getStatus(c) === 'EN CURSO');
    if (!claseEnCurso) {
      return false;
    }

    // Verificar si esta clase viene después de la clase en curso
    const horaEnCurso = claseEnCurso.horaInicial || '00:00:00';
    const horaEstaClase = clase.horaInicial || '00:00:00';
    
    return horaEstaClase > horaEnCurso;
  };

  const getStatusBadge = (status: string, clase?: Clase) => {
    // Si es pendiente y es la próxima clase (hay una en curso y esta viene después), mostrar "Próxima"
    const esProxima = clase && esProximaClase(clase);
    
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
            {esProxima ? 'Próxima' : 'Pendiente'}
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

  if (clases.length === 0) {
    return (
      <div className="text-center py-12">
        <KeenIcon icon="document" className="text-6xl text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
          No hay clases disponibles
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Aún no tienes clases asignadas como instructor
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de Estados */}
      <div className="flex items-center justify-end mb-4">
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

      {/* Clases En Curso */}
      {clasesEnCurso.length > 0 && (
        <div className="space-y-3">
          {clasesEnCurso.map((clase) => {
            const status = getStatus(clase);
            const jornadaType = getJornadaType(clase.jornada_tipo || '');
            const horario = getHorario(clase);
            const numSesiones = getNumSesiones(clase);
            return (
              <div
                key={clase.idHorarioMateria}
                className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-3 transition-all cursor-pointer"
                onClick={() => handleNavigateToClase(clase)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-600 flex items-center justify-center">
                    <i className="ki-outline ki-book text-lg text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {clase.materia_nombre || clase.programa_nombre || 'Sin nombre'}
                      </h3>
                      {getStatusBadge(status, clase)}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-document text-sm"></i>
                        <span>Ficha {clase.ficha_codigo}</span>
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
      {Object.entries(groupedPendientes).map(([dateKey, clases]) => (
        <div key={dateKey} className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{dateKey}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {clases.length} {clases.length === 1 ? 'clase' : 'clases'}
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>
          {clases.map((clase) => {
            const status = getStatus(clase);
            const jornadaType = getJornadaType(clase.jornada_tipo || '');
            const horario = getHorario(clase);
            const numSesiones = getNumSesiones(clase);
            return (
              <div
                key={clase.idHorarioMateria}
                className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-3 transition-all cursor-pointer"
                onClick={() => handleNavigateToClase(clase)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-600 flex items-center justify-center">
                    <i className="ki-outline ki-book text-lg text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {clase.materia_nombre || clase.programa_nombre || 'Sin nombre'}
                      </h3>
                      {getStatusBadge(status, clase)}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-document text-sm"></i>
                        <span>Ficha {clase.ficha_codigo}</span>
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
      {clasesCompletadas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Clases Completadas
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {clasesCompletadas.length} {clasesCompletadas.length === 1 ? 'clase' : 'clases'}
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>
          {clasesCompletadas.map((clase) => {
            const status = getStatus(clase);
            const jornadaType = getJornadaType(clase.jornada_tipo || '');
            const horario = getHorario(clase);
            const numSesiones = getNumSesiones(clase);
            return (
              <div
                key={clase.idHorarioMateria}
                className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-3 transition-all cursor-pointer"
                onClick={() => handleNavigateToClase(clase)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-600 flex items-center justify-center">
                    <i className="ki-outline ki-book text-lg text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {clase.materia_nombre || clase.programa_nombre || 'Sin nombre'}
                      </h3>
                      {getStatusBadge(status, clase)}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <i className="ki-outline ki-document text-sm"></i>
                        <span>Ficha {clase.ficha_codigo}</span>
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

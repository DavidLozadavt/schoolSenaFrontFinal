import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth/useAuthContext';

interface Props {
  searchTerm: string;
  evento: boolean;
  setEvento: (value: boolean) => void;
  idInstructor?: number;
}

interface SesionCompletada {
  id: number;
  numeroSesion: number;
  fechaSesion: string;
  fechaFormateada: string;
  fechaCorta: string;
  estado: string;
  observacion?: string | null;
}

interface Clase {
  ficha_id: number;
  ficha_codigo: string;
  programa_nombre: string;
  materia_nombre: string;
  jornada_nombre: string;
  jornada_tipo: string;
  dia_semana: string;
  idDia: number; // ID del día desde la BD: 1=Lunes, 2=Martes, ..., 7=Domingo
  horaInicial: string;
  horaFinal: string;
  fechaInicial: string;
  fechaFinal: string | null;
  estado: string;
  total_sesiones: number;
  sesiones_dadas?: number;
  sesiones_restantes?: number;
  sesiones_completadas?: SesionCompletada[];
  contrato_id: number;
  instructor_nombre: string;
  idGradoPrograma: number | null;
  grado_nombre: string | null;
  idHorarioMateria: number;
  idGradoMateria: number;
  idMateria: number; 
  sesiones_restantes?: number;
}

// Helper común: convierte idDia de BD (1=Lunes ... 7=Domingo) a número JS (0=Domingo ... 6=Sábado)
const convertirIdDiaANumeroJS = (idDia: number): number => {
  return idDia === 7 ? 0 : idDia;
};

const ListaHistorialRAPs: React.FC<Props> = ({ searchTerm, evento, setEvento, idInstructor }) => {
  const navigate = useNavigate();
  const authContext = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<Clase[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('Todos los estados');
  // Estado para actualizar el tiempo en tiempo real y recalcular estados de clases
  const [currentTime, setCurrentTime] = useState(new Date());

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
      } catch (error: any) {
        // Manejar error de forma silenciosa para el usuario
        // En producción, esto podría enviarse a un servicio de logging
        setClases([]);
        if (error?.response?.status === 401) {
          // Si es error de autenticación, el interceptor de axios lo manejará
        }
      } finally {
        setLoading(false);
      }
    };

    if (evento) {
      fetchClases();
    }
  }, [evento, setEvento, idInstructor]);

  // Actualizar el tiempo cada segundo para recalcular estados en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Actualizar cada segundo

    return () => clearInterval(interval);
  }, []);

  /**
   * Obtiene el estado de la clase en tiempo real
   * Considera tanto el estado del backend como las sesiones completadas individuales
   * Se actualiza automáticamente cada segundo usando currentTime
   */
  const getStatus = (clase: Clase): 'EN CURSO' | 'PENDIENTE' | 'COMPLETADO' => {
    // Usar currentTime en lugar de new Date() para actualización en tiempo real
    const ahora = currentTime;
    const sesionesRestantes = typeof clase.sesiones_restantes === 'number' ? clase.sesiones_restantes : null;
    
    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    // PRIMERO: Verificar si ya pasó la fecha final del curso completo.
    // Solo se considera COMPLETADO si no quedan sesiones reales pendientes.
    if (clase.fechaInicial && clase.fechaFinal) {
      const hoy = new Date(ahora);
      hoy.setHours(0, 0, 0, 0);
      const fechaFin = parseDate(clase.fechaFinal);
      fechaFin.setHours(0, 0, 0, 0);
      
      if (fechaFin.getTime() < hoy.getTime()) {
        return sesionesRestantes === 0 ? 'COMPLETADO' : 'PENDIENTE';
      }
    }

    // NO usar el estado del backend directamente - calcular siempre en tiempo real
    // El estado del backend puede estar desactualizado, por eso calculamos en tiempo real

    // Si hay sesiones completadas, verificar el estado en tiempo real
    if (clase.sesiones_completadas && clase.sesiones_completadas.length > 0) {
      const hoy = new Date(ahora);
      hoy.setHours(0, 0, 0, 0);
      
      // Verificar si hay una sesión completada hoy o en el pasado
      const haySesionCompletada = clase.sesiones_completadas.some(sesion => {
        const fechaSesion = new Date(sesion.fechaSesion);
        fechaSesion.setHours(0, 0, 0, 0);
        return fechaSesion.getTime() <= hoy.getTime();
      });
      
      // Si hay sesiones completadas y todos los datos necesarios, verificar estado en tiempo real
      if (haySesionCompletada && clase.fechaInicial && clase.fechaFinal && clase.horaInicial && clase.horaFinal && clase.idDia) {
        const hoy = new Date(ahora);
        hoy.setHours(0, 0, 0, 0);
        const fechaInicio = parseDate(clase.fechaInicial);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = parseDate(clase.fechaFinal);
        fechaFin.setHours(0, 0, 0, 0);

        // Verificar si hoy es un día de clase
        const diaNumero = convertirIdDiaANumeroJS(clase.idDia);
        
        if (ahora.getDay() === diaNumero && fechaInicio.getTime() <= hoy.getTime() && hoy.getTime() <= fechaFin.getTime()) {
          // Verificar si estamos dentro del rango de horas
          const [hIni, mIni] = clase.horaInicial.substring(0, 5).split(':').map(Number);
          const [hFin, mFin] = clase.horaFinal.substring(0, 5).split(':').map(Number);
          
          const horaInicio = new Date(ahora);
          horaInicio.setHours(hIni, mIni, 0, 0);
          const horaFinal = new Date(ahora);
          horaFinal.setHours(hFin, mFin, 0, 0);

          if (horaFinal.getTime() < horaInicio.getTime()) {
            horaFinal.setDate(horaFinal.getDate() + 1);
          }

        // Si estamos dentro del horario de la clase
        if (ahora.getTime() >= horaInicio.getTime() && ahora.getTime() <= horaFinal.getTime()) {
          return 'EN CURSO';
        }
        
        // Si ya pasó la hora final de hoy, marcar como COMPLETADO inmediatamente
        // No esperar a que exista sesión en BD, se creará en la próxima sincronización
        if (ahora.getTime() > horaFinal.getTime()) {
          return sesionesRestantes === 0 ? 'COMPLETADO' : 'PENDIENTE';
        }
        }
      }
    }
    
    // Fallback: calcular básico en tiempo real
    if (!clase.fechaInicial) {
      return 'PENDIENTE';
    }

    const fechaInicio = parseDate(clase.fechaInicial);
    const fechaFin = clase.fechaFinal ? parseDate(clase.fechaFinal) : null;
    const hoy = new Date(ahora);
    hoy.setHours(0, 0, 0, 0);
    fechaInicio.setHours(0, 0, 0, 0);
    if (fechaFin) {
      fechaFin.setHours(0, 0, 0, 0);
    }

    // Si la clase aún no ha comenzado
    if (fechaInicio.getTime() > hoy.getTime()) {
      return 'PENDIENTE';
    }

    // Si estamos dentro del rango de fechas, verificar si es un día de clase y el horario
    if (clase.fechaInicial && fechaFin && clase.horaInicial && clase.horaFinal && clase.idDia) {
      const diaNumero = convertirIdDiaANumeroJS(clase.idDia);
      
      // Verificar si hoy es un día de clase (día de la semana coincide Y está en el rango de fechas)
      const esDiaDeClase = ahora.getDay() === diaNumero && fechaInicio.getTime() <= hoy.getTime() && hoy.getTime() <= fechaFin.getTime();
      
      if (esDiaDeClase) {
        // Verificar si estamos dentro del rango de horas
        const [hIni, mIni] = clase.horaInicial.substring(0, 5).split(':').map(Number);
        const [hFin, mFin] = clase.horaFinal.substring(0, 5).split(':').map(Number);
        
        const horaInicio = new Date(ahora);
        horaInicio.setHours(hIni, mIni, 0, 0);
        const horaFinal = new Date(ahora);
        horaFinal.setHours(hFin, mFin, 0, 0);

        // Si la hora final es menor que la inicial, significa que cruza medianoche
        if (horaFinal.getTime() < horaInicio.getTime()) {
          horaFinal.setDate(horaFinal.getDate() + 1);
        }

        // Si estamos dentro del horario de la clase
        if (ahora.getTime() >= horaInicio.getTime() && ahora.getTime() <= horaFinal.getTime()) {
          return 'EN CURSO';
        }
        
        // Si ya pasó la hora final de hoy, marcar como COMPLETADO inmediatamente
        // No esperar a que exista sesión en BD, se creará en la próxima sincronización
        if (ahora.getTime() > horaFinal.getTime()) {
          return sesionesRestantes === 0 ? 'COMPLETADO' : 'PENDIENTE';
        }
      }
    }

    return 'PENDIENTE';
  };

  /**
   * Formatea una fecha usando Intl.DateTimeFormat (API nativa de JavaScript)
   * No usa datos hardcodeados, usa la configuración del navegador
   * 
   * @param dateString Fecha en formato YYYY-MM-DD
   * @param jornadaTipo Tipo de jornada para mostrar si es hoy
   * @returns String formateado: "Jornada (hoy)" o "Mañana (día, fecha)" o "(día, fecha)"
   */
  const formatDateForGroup = (dateString: string, jornadaTipo: string): string => {
    // Parsear fecha sin problemas de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Verificar si es hoy, mañana o más adelante
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Usar Intl.DateTimeFormat para formatear fecha (sin datos hardcodeados)
    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    
    if (diffDays === 0) {
      // Es hoy - usar la jornada
      return `${jornadaTipo} (hoy)`;
    } else if (diffDays === 1) {
      // Es mañana - mostrar "Mañana" + fecha completa
      const fechaFormateada = formatter.format(date);
      return `Mañana (${fechaFormateada})`;
    } else {
      // Es más adelante - solo mostrar la fecha sin jornada
      const fechaFormateada = formatter.format(date);
      return `(${fechaFormateada})`;
    }
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

  /**
   * Convierte hora de formato 24h a formato 12h con AM/PM
   * La jornada NO tiene nada que ver, se usa solo la hora en formato 24h
   * 
   * @param timeString Hora en formato HH:MM o HH:MM:SS
   * @returns Hora formateada en 12h con AM/PM (ej: "10:00 AM", "2:30 PM")
   */
  const formatTime12h = (timeString: string): string => {
    if (!timeString) return 'N/A';
    const time = timeString.substring(0, 5); // Obtener HH:MM
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    
    // Determinar AM/PM basado SOLO en la hora (la jornada no tiene nada que ver)
    const esPM = hour24 >= 12;
    
    // Convertir a formato 12h
    let hour12: number;
    if (hour24 === 0) {
      hour12 = 12; // Medianoche = 12 AM
    } else if (hour24 === 12) {
      hour12 = 12; // Mediodía = 12 PM
    } else if (hour24 < 12) {
      hour12 = hour24; // 1-11 AM
    } else {
      hour12 = hour24 - 12; // 1-11 PM
    }
    
    return `${hour12}:${minutes} ${esPM ? 'PM' : 'AM'}`;
  };

  /**
   * Obtiene el horario formateado de una clase
   * 
   * @param clase Clase con horaInicial y horaFinal
   * @returns String con formato "H:MM AM - H:MM PM" o string vacío si no hay horario
   */
  const getHorario = (clase: Clase): string => {
    if (clase.horaInicial && clase.horaFinal) {
      const horaIni = formatTime12h(clase.horaInicial);
      const horaFin = formatTime12h(clase.horaFinal);
      return `${horaIni} - ${horaFin}`;
    }
    return '';
  };

  /**
   * Obtiene el formato de sesiones: "X/Y sesiones" donde X = sesiones dadas, Y = total
   */
  const getNumSesiones = (clase: Clase): string => {
    const total = clase.total_sesiones || 0;
    const dadas = clase.sesiones_dadas || 0;
    return `${dadas}/${total} sesiones`;
  };

  /**
   * Convierte idDia del backend al formato de JavaScript getDay()
   * Backend: idDia 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo
   * JavaScript: getDay() 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
   * 
   * @param idDia ID del día desde el backend (1-7)
   * @returns Número del día para JavaScript getDay()
   */
  const convertirIdDiaANumeroJS = (idDia: number): number => {
    // Convertir formato backend (1-7) a formato JavaScript (0-6)
    // Domingo es 7 en backend pero 0 en JavaScript
    return idDia === 7 ? 0 : idDia;
  };

  /**
   * Calcula la próxima fecha de clase pendiente (Date object)
   * Retorna null si no se puede calcular
   */
  const calcularProximaFechaClase = (clase: Clase): Date | null => {
    if (!clase.fechaInicial || !clase.dia_semana) {
      return null;
    }

    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const fechaInicio = parseDate(clase.fechaInicial);
    const fechaFin = clase.fechaFinal ? parseDate(clase.fechaFinal) : null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Usar idDia directamente del backend (viene de la BD, sin mapeo hardcodeado)
    if (!clase.idDia) {
      return null;
    }
    
    const diaNumero = convertirIdDiaANumeroJS(clase.idDia);

    // Buscar la próxima fecha del día de la semana
    let fechaBusqueda = new Date(hoy);
    
    // Si la fecha de inicio es futura, empezar desde ahí
    if (fechaInicio.getTime() > hoy.getTime()) {
      fechaBusqueda = new Date(fechaInicio);
      while (fechaBusqueda.getDay() !== diaNumero) {
        fechaBusqueda.setDate(fechaBusqueda.getDate() + 1);
      }
    } else {
      // Si la fecha de inicio ya pasó, buscar desde hoy
      while (fechaBusqueda.getDay() !== diaNumero) {
        fechaBusqueda.setDate(fechaBusqueda.getDate() + 1);
      }
      
      // Si la fecha encontrada es antes de la fecha de inicio, buscar desde la fecha de inicio
      if (fechaBusqueda.getTime() < fechaInicio.getTime()) {
        fechaBusqueda = new Date(fechaInicio);
        while (fechaBusqueda.getDay() !== diaNumero) {
          fechaBusqueda.setDate(fechaBusqueda.getDate() + 1);
        }
      }
    }

    // Verificar que esté en el rango válido
    if (fechaFin && fechaBusqueda.getTime() > fechaFin.getTime()) {
      return null;
    }

    return fechaBusqueda;
  };

  /**
   * Calcula TODAS las fechas pendientes de una clase (a partir de hoy)
   * teniendo en cuenta:
   * - Rango de fechas (fechaInicial, fechaFinal)
   * - Día de la semana (idDia)
   * - Sesiones completadas (sesiones_completadas)
   * - Límite de sesiones_restantes (para no generar más de las que realmente faltan)
   */
  const getTodasFechasPendientes = (clase: Clase): Date[] => {
    if (!clase.fechaInicial || !clase.idDia) return [];

    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const fechaInicio = parseDate(clase.fechaInicial);
    const fechaFin = clase.fechaFinal ? parseDate(clase.fechaFinal) : null;

    const hoy = new Date(currentTime);
    hoy.setHours(0, 0, 0, 0);

    const diaNumero = convertirIdDiaANumeroJS(clase.idDia);

    // Punto de partida: el máximo entre hoy y fechaInicio
    let cursor = new Date(Math.max(fechaInicio.getTime(), hoy.getTime()));
    cursor.setHours(0, 0, 0, 0);

    // Ajustar cursor al próximo día de clase
    while (cursor.getDay() !== diaNumero) {
      cursor.setDate(cursor.getDate() + 1);
    }

    const completadasSet = new Set<string>();
    if (clase.sesiones_completadas && clase.sesiones_completadas.length > 0) {
      clase.sesiones_completadas.forEach((sesion) => {
        const key = sesion.fechaSesion.split('T')[0];
        completadasSet.add(key);
      });
    }

    const maxPendientes =
      typeof clase.sesiones_restantes === 'number' && clase.sesiones_restantes > 0
        ? clase.sesiones_restantes
        : Number.MAX_SAFE_INTEGER;

    const pendientes: Date[] = [];

    while (true) {
      if (fechaFin && cursor.getTime() > fechaFin.getTime()) break;

      const key = cursor.toISOString().split('T')[0];
      if (!completadasSet.has(key)) {
        pendientes.push(new Date(cursor));
        if (pendientes.length >= maxPendientes) break;
      }

      // Avanzar una semana
      cursor.setDate(cursor.getDate() + 7);
    }

    return pendientes;
  };

  /**
   * Devuelve SOLO la próxima fecha pendiente formateada para mostrar en la tarjeta
   * (se usa en ClaseCard). Internamente reutiliza getTodasFechasPendientes.
   */
  const getProximaClasePendiente = (clase: Clase): string | null => {
    const pendientes = getTodasFechasPendientes(clase);
    if (!pendientes.length) return null;

    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    return formatter.format(pendientes[0]);
  };

  /**
   * Navega a la página de detalle de una clase
   * 
   * @param clase Clase a visualizar
   */
  const handleNavigateToClase = (clase: Clase): void => {
    if (!clase.idHorarioMateria) {
      return;
    }

    const id = Number(clase.idHorarioMateria);
    if (isNaN(id) || id <= 0) {
      return;
    }

    navigate(`/ambiente-virtual/clase/${id}`, {
      state: {
        idMateria: clase.idMateria,
        idGradoMateria: clase.idGradoMateria,
        ficha_id: clase.ficha_id,
        materia_nombre: clase.materia_nombre,
        programa_nombre: clase.programa_nombre
      }
    });
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
  }, [clases, searchTerm, selectedStatus, currentTime]); // Agregar currentTime para actualización en tiempo real

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
  // IMPORTANTE: Incluir currentTime como dependencia para recalcular en tiempo real
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
  }, [filteredClases, currentTime]); // Agregar currentTime para actualización en tiempo real

  const clasesPendientes = useMemo(() => {
    return filteredClases.filter((c) => getStatus(c) === 'PENDIENTE');
  }, [filteredClases, currentTime]); // Agregar currentTime para actualización en tiempo real

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
  }, [filteredClases, currentTime]); // Agregar currentTime para actualización en tiempo real

  /**
   * Agrupa todas las sesiones completadas de todas las clases por fecha
   * y las ordena de más reciente a más antigua.
   * Cada sesión se mostrará en su propia tarjeta independiente.
   * 
   * IMPORTANTE: Incluye sesiones de TODAS las clases que tengan sesiones completadas,
   * no solo de las clases marcadas como COMPLETADO, para mostrar todas las sesiones
   * que están guardadas en sesionMateria.
   * 
   * @returns Objeto con todas las sesiones y agrupación por fecha
   */
  const sesionesCompletadasAgrupadas = useMemo(() => {
    // Obtener todas las sesiones completadas de TODAS las clases (no solo las completadas)
    const todasLasSesiones: Array<{ clase: Clase; sesion: SesionCompletada }> = [];
    
    // Importante: iterar sobre TODAS las clases originales, no sobre filteredClases,
    // para no perder sesiones completadas de clases que aún tienen pendientes.
    clases.forEach((clase) => {
      // Validar que la clase tenga sesiones completadas y que sean válidas
      if (clase.sesiones_completadas && Array.isArray(clase.sesiones_completadas) && clase.sesiones_completadas.length > 0) {
        clase.sesiones_completadas.forEach((sesion) => {
          // Validar que la sesión tenga los campos requeridos
          if (sesion && sesion.id && sesion.fechaSesion && sesion.numeroSesion) {
            todasLasSesiones.push({ clase, sesion });
          }
        });
      }
    });

    // Agrupar sesiones por fecha
    const grupos: { [fecha: string]: Array<{ clase: Clase; sesion: SesionCompletada }> } = {};
    
    todasLasSesiones.forEach((item) => {
      const fecha = item.sesion.fechaSesion; // YYYY-MM-DD
      
      // Validar que la fecha no esté vacía
      if (fecha && fecha.trim() !== '') {
        if (!grupos[fecha]) {
          grupos[fecha] = [];
        }
        grupos[fecha].push(item);
      }
    });

    // Ordenar fechas de más reciente a más antigua
    const fechasOrdenadas = Object.keys(grupos)
      .filter(fecha => {
        // Validar que la fecha sea válida antes de ordenar
        const fechaDate = new Date(fecha);
        return !isNaN(fechaDate.getTime());
      })
      .sort((a, b) => {
        const fechaA = new Date(a).getTime();
        const fechaB = new Date(b).getTime();
        return fechaB - fechaA; // Más reciente primero
      });

    return {
      todasLasSesiones,
      sesionesPorFecha: fechasOrdenadas.map((fecha) => ({
        fecha,
        items: grupos[fecha] || [],
      })),
    };
  }, [clases]);

  /**
   * Obtiene la próxima fecha de clase como string para agrupar
   * Retorna null si no se puede calcular
   * Usa la misma lógica que getProximaClasePendiente
   */
  const getProximaFechaParaAgrupar = (clase: Clase): string | null => {
    return getProximaClasePendiente(clase);
  };

  // Agrupar pendientes por CADA fecha de clase pendiente
  const groupedPendientes = useMemo(() => {
    type Grupo = { label: string; fecha: Date; clases: Clase[] };

    const gruposMapa = new Map<string, Grupo>();

    clasesPendientes.forEach((clase) => {
      const jornadasType = getJornadaType(clase.jornada_tipo || '');
      const fechasPendientes = getTodasFechasPendientes(clase);

      fechasPendientes.forEach((fecha) => {
        const iso = fecha.toISOString().split('T')[0];
        const label = formatDateForGroup(iso, jornadasType);
        const key = `${iso}|${label}`;

        if (!gruposMapa.has(key)) {
          gruposMapa.set(key, { label, fecha: fecha, clases: [] });
        }
        gruposMapa.get(key)!.clases.push(clase);
      });
    });

    // Convertir a array y ordenar por fecha
    const gruposOrdenados = Array.from(gruposMapa.values()).sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime()
    );

    // Reconstruir objeto { label: Clase[] } preservando orden
    const sortedGroups: { [key: string]: Clase[] } = {};
    gruposOrdenados.forEach((grupo) => {
      // Ordenar clases dentro del grupo por hora inicial
      grupo.clases.sort((a, b) => {
        const horaA = a.horaInicial || '00:00:00';
        const horaB = b.horaInicial || '00:00:00';
        return horaA.localeCompare(horaB);
      });
      sortedGroups[grupo.label] = grupo.clases;
    });

    return sortedGroups;
  }, [clasesPendientes, currentTime]);

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

  /**
   * Renderiza el badge de estado de una clase
   * 
   * @param status Estado de la clase: 'EN CURSO', 'PENDIENTE', 'COMPLETADO'
   * @param clase Clase opcional para verificar si es próxima
   * @returns JSX del badge de estado
   */
  const getStatusBadge = (status: string, clase?: Clase): JSX.Element | null => {
    const esProxima = clase && esProximaClase(clase);
    
    switch (status) {
      case 'EN CURSO':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
            <span>En Curso</span>
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
            <span>{esProxima ? 'Próxima' : 'Pendiente'}</span>
          </span>
        );
      case 'COMPLETADO':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 shadow-sm">
            <i className="ki-outline ki-check text-xs dark:text-gray-300"></i>
            <span>Completado</span>
          </span>
        );
      default:
        return null;
    }
  };

  /**
   * Formatear fecha para el separador (ej: "26 de febrero")
   * Maneja casos de fechas inválidas o nulas
   */
  const formatearFechaSeparador = (fechaStr: string): string => {
    if (!fechaStr) {
      return 'Fecha no disponible';
    }
    
    try {
      // Parsear fechaSesion (formato YYYY-MM-DD) sin problemas de zona horaria
      const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
      const fecha = new Date(year, month - 1, day);
      
      // Validar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }
      
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      return `${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  /**
   * Formatea la fecha de sesión para mostrar en la tarjeta
   * Usa la misma fecha que se usa para agrupar (fechaSesion) para garantizar consistencia
   */
  const formatearFechaSesion = (fechaSesion: string): string => {
    if (!fechaSesion) {
      return 'Fecha no disponible';
    }
    
    try {
      // Parsear fechaSesion (formato YYYY-MM-DD) sin problemas de zona horaria
      const [year, month, day] = fechaSesion.split('T')[0].split('-').map(Number);
      const fecha = new Date(year, month - 1, day);
      
      // Validar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }
      
      // Usar Intl.DateTimeFormat para formatear (sin datos hardcodeados)
      const formatter = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      return formatter.format(fecha);
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  /**
   * Componente para renderizar una tarjeta de sesión completada
   * Cada sesión tiene su propia tarjeta independiente
   * Esto permite que en el futuro cada tarjeta pueda tener información específica
   * como lista de asistencia, actividades, etc.
   * 
   * @param clase - Información de la clase a la que pertenece la sesión
   * @param sesion - Información específica de la sesión completada
   */
  const SesionCompletadaCard: React.FC<{ 
    clase: Clase; 
    sesion: SesionCompletada;
  }> = ({ clase, sesion }) => {
    const jornadaType = getJornadaType(clase.jornada_tipo || '');
    const horario = getHorario(clase);
    
    // Formatear fecha usando fechaSesion directamente para garantizar consistencia con el agrupamiento
    const fechaMostrar = formatearFechaSesion(sesion.fechaSesion);

    return (
      <div
        className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md"
        onClick={() => handleNavigateToClase(clase)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-green-200 dark:border-green-600 flex items-center justify-center">
            <i className="ki-outline ki-check-circle text-lg text-green-600 dark:text-green-400"></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                {clase.materia_nombre || clase.programa_nombre || 'Sin nombre'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 shadow-sm">
                  <i className="ki-outline ki-check text-xs"></i>
                  <span>Completado</span>
                </span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Sesión {sesion.numeroSesion || 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-document text-sm"></i>
                <span>Ficha {clase.ficha_codigo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-sun text-sm"></i>
                <span>{jornadaType}</span>
              </div>
              {horario && (
                <div className="flex items-center gap-1.5">
                  <i className="ki-outline ki-time text-sm"></i>
                  <span>{horario}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-calendar text-sm"></i>
                <span className="capitalize">
                  {fechaMostrar}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 pt-1">
            <i className="ki-outline ki-right text-base text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Componente reutilizable para renderizar una tarjeta de clase
   */
  const ClaseCard: React.FC<{ clase: Clase; showProximaFecha?: boolean }> = ({ 
    clase, 
    showProximaFecha = false 
  }) => {
    const status = getStatus(clase);
    const jornadaType = getJornadaType(clase.jornada_tipo || '');
    const horario = getHorario(clase);
    const numSesiones = getNumSesiones(clase);
    const proximaClase = showProximaFecha ? getProximaClasePendiente(clase) : null;
    const sesionesCompletadas = clase.sesiones_completadas || [];
    const esCompletada = status === 'COMPLETADO';

    return (
      <div
        className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md"
        onClick={() => handleNavigateToClase(clase)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-600 flex items-center justify-center">
            <i className="ki-outline ki-book text-lg text-blue-600 dark:text-blue-400"></i>
          </div>
          <div className="flex-1 min-w-0">
            {/* Título y Badge en líneas separadas para mejor espaciado */}
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                {clase.materia_nombre || clase.programa_nombre || 'Sin nombre'}
              </h3>
              <div className="flex items-center">
                {getStatusBadge(status, clase)}
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-document text-sm"></i>
                <span>Ficha {clase.ficha_codigo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-sun text-sm"></i>
                <span>{jornadaType}</span>
              </div>
              {horario && (
                <div className="flex items-center gap-1.5">
                  <i className="ki-outline ki-time text-sm"></i>
                  <span>{horario}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-calendar text-sm"></i>
                <span>{numSesiones}</span>
              </div>
              {proximaClase && (
                <div className="flex items-center gap-1.5">
                  <i className="ki-outline ki-calendar-tick text-sm"></i>
                  <span>{proximaClase}</span>
                </div>
              )}
            </div>
            
          </div>
          <div className="flex-shrink-0 pt-1">
            <i className="ki-outline ki-right text-base text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
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

  const showAll = selectedStatus === 'Todos los estados';
  const showEnCurso = showAll || selectedStatus === 'En Curso';
  const showPendiente = showAll || selectedStatus === 'Pendiente';
  const showCompletado = showAll || selectedStatus === 'Completado';

  return (
    <div className="space-y-6">
      {/* Filtro de Estados */}
      <div className="flex items-center justify-end mb-4">
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="select w-auto rounded-full px-3 py-1.5 pr-7 text-xs font-medium bg-white dark:bg-coal-400 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
          >
            <option>Todos los estados</option>
            <option>En Curso</option>
            <option>Pendiente</option>
            <option>Completado</option>
          </select>
        </div>
      </div>

      {/* Clases En Curso */}
      {showEnCurso && clasesEnCurso.length > 0 && (
        <div className="space-y-3">
          {clasesEnCurso.map((clase) => (
            <ClaseCard key={clase.idHorarioMateria} clase={clase} />
          ))}
        </div>
      )}

      {/* Clases Pendientes - Agrupadas por fecha */}
      {showPendiente && Object.entries(groupedPendientes).map(([dateKey, clases]) => (
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
          {clases.map((clase) => (
            <ClaseCard key={clase.idHorarioMateria} clase={clase} showProximaFecha={true} />
          ))}
        </div>
      ))}

      {/* Clases Completadas - Una tarjeta por cada sesión */}
      {/* Mostrar sesiones completadas según el filtro seleccionado */}
      {showCompletado && sesionesCompletadasAgrupadas.todasLasSesiones.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Clases Completadas
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {sesionesCompletadasAgrupadas.todasLasSesiones.length} {sesionesCompletadasAgrupadas.todasLasSesiones.length === 1 ? 'sesión' : 'sesiones'}
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>
          {/* Agrupar por fecha y mostrar una tarjeta por sesión */}
          {sesionesCompletadasAgrupadas.sesionesPorFecha.map((grupo) => (
            <div key={grupo.fecha} className="space-y-3">
              {/* Separador de fecha */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex items-center gap-2">
                  <i className="ki-outline ki-calendar text-sm text-blue-600 dark:text-blue-400"></i>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {formatearFechaSeparador(grupo.fecha)}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {grupo.items.length} {grupo.items.length === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
              {/* Tarjetas de sesiones de esta fecha */}
              {grupo.items.map((item) => (
                <SesionCompletadaCard 
                  key={`${item.clase.idHorarioMateria}-${item.sesion.id}`} 
                  clase={item.clase} 
                  sesion={item.sesion} 
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaHistorialRAPs;

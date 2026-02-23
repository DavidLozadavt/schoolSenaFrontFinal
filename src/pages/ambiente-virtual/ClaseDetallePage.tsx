import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { Container } from '@/components/container';
import ModalJuiciosEvaluativos from '../programas-academicos/components/ModalJuiciosEvaluativos';
import StudentListByMateria from './ListaHorarioEstudiantes';

// Componente de Calendario
const CalendarComponent: React.FC<{
  fechaInicio: string;
  fechaFin: string;
  diaSemana?: string;
  todasLasFechasClase?: FechaClase[];
}> = ({
  fechaInicio,
  fechaFin,
  diaSemana,
  todasLasFechasClase = []
}) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Función para parsear fechas sin problemas de zona horaria
    const parseDate = (dateString: string): Date | null => {
      if (!dateString) return null;
      // Si viene en formato YYYY-MM-DD, parsear manualmente para evitar problemas de zona horaria
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      return new Date(dateString);
    };

    // Usar las fechas del horario directamente
    // Si fechaFin es NULL o vacía, usar solo fechaInicio (clase de un solo día)
    const fechaFinParaUsar = fechaFin && fechaFin.trim() !== '' ? fechaFin : fechaInicio;

    // Si no hay fechas, usar el mes actual
    const initialDate = fechaInicio ? parseDate(fechaInicio) || new Date() : new Date();
    const [currentMonth, setCurrentMonth] = useState(initialDate);

    const inicio = fechaInicio ? parseDate(fechaInicio) : null;
    const fin = fechaFinParaUsar ? parseDate(fechaFinParaUsar) : null;


    // Mapeo de nombres de días en español a números (0 = Domingo, 1 = Lunes, etc.)
    const mapeoDias: { [key: string]: number } = {
      'DOMINGO': 0,
      'LUNES': 1,
      'MARTES': 2,
      'MIERCOLES': 3,
      'MIÉRCOLES': 3,
      'JUEVES': 4,
      'VIERNES': 5,
      'SABADO': 6,
      'SÁBADO': 6
    };

    // Calcular todas las fechas de clase usando las fechas del backend
    const fechasClase = useMemo(() => {
      // Si tenemos todas las fechas del backend, usarlas directamente
      if (todasLasFechasClase && todasLasFechasClase.length > 0) {
        const fechas: Date[] = [];
        todasLasFechasClase.forEach((fechaClase) => {
          if (fechaClase.fechaInicial) {
            const fechaIni = parseDate(fechaClase.fechaInicial);
            if (fechaIni) {
              fechaIni.setHours(0, 0, 0, 0);
              // Si fechaFinal es NULL o igual a fechaInicial, es una clase de un solo día
              const fechaFin = fechaClase.fechaFinal ? parseDate(fechaClase.fechaFinal) : fechaIni;
              if (fechaFin) {
                fechaFin.setHours(0, 0, 0, 0);
                // Si son la misma fecha, agregar solo esa
                if (fechaIni.getTime() === fechaFin.getTime()) {
                  fechas.push(new Date(fechaIni));
                } else {
                  // Si hay rango, agregar todas las fechas en el rango que coincidan con el día
                  const diaNumero = mapeoDias[fechaClase.dia_semana?.toUpperCase() || ''];
                  if (diaNumero !== undefined) {
                    const fechaActual = new Date(fechaIni);
                    while (fechaActual <= fechaFin) {
                      if (fechaActual.getDay() === diaNumero) {
                        fechas.push(new Date(fechaActual));
                      }
                      fechaActual.setDate(fechaActual.getDate() + 1);
                    }
                  }
                }
              }
            }
          }
        });
        return fechas;
      }

      // Fallback: calcular basándose en fechaInicio y fechaFin (lógica antigua)
      if (!inicio || !fin || !diaSemana) {
        return [];
      }

      const diaNumero = mapeoDias[diaSemana.toUpperCase()];
      if (diaNumero === undefined) {
        return [];
      }

      const fechas: Date[] = [];
      const fechaActual = new Date(inicio);
      fechaActual.setHours(0, 0, 0, 0);
      const fechaFinal = new Date(fin);
      fechaFinal.setHours(0, 0, 0, 0);

      // Si fechaInicial y fechaFinal son la misma fecha, verificar solo esa fecha
      if (fechaActual.getTime() === fechaFinal.getTime()) {
        if (fechaActual.getDay() === diaNumero) {
          fechas.push(new Date(fechaActual));
        }
      } else {
        // Si son diferentes, calcular todas las fechas en el rango
        while (fechaActual <= fechaFinal) {
          if (fechaActual.getDay() === diaNumero) {
            fechas.push(new Date(fechaActual));
          }
          fechaActual.setDate(fechaActual.getDate() + 1);
        }
      }

      return fechas;
    }, [todasLasFechasClase, inicio, fin, diaSemana]);


    const daysOfWeek = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // D=Dom, L=Lun, M=Mar, X=Mié, J=Jue, V=Vie, S=Sáb
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

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days: (number | null)[] = [];
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        days.push(d);
      }
      return days;
    };

    const getDateStatus = (day: number): 'hoy' | 'proxima' | 'pasada' | 'normal' => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      date.setHours(0, 0, 0, 0);

      // Verificar si esta fecha es una fecha de clase
      const esFechaClase = fechasClase.some(fecha => {
        const fechaClase = new Date(fecha);
        fechaClase.setHours(0, 0, 0, 0);
        return fechaClase.getTime() === date.getTime();
      });

      if (!esFechaClase) {
        return 'normal';
      }

      // Si es una fecha de clase, determinar el estado
      // IMPORTANTE: Solo marcar como "hoy" si realmente es hoy Y es una fecha de clase
      const hoyTime = hoy.getTime();
      const dateTime = date.getTime();

      if (dateTime === hoyTime) {
        return 'hoy';
      }

      if (dateTime > hoyTime) {
        return 'proxima';
      }

      if (dateTime < hoyTime) {
        return 'pasada';
      }

      return 'normal';
    };

    const days = getDaysInMonth(currentMonth);
    const monthName = months[currentMonth.getMonth()];
    const year = currentMonth.getFullYear();

    const goToPreviousMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    return (
      <div>
        <div className="flex items-center justify-center mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <KeenIcon icon="left" className="text-sm" />
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize px-2">
              {monthName} {year}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <KeenIcon icon="right" className="text-sm" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-8"></div>;
            }
            const status = getDateStatus(day);
            return (
              <div
                key={index}
                className={`h-8 flex items-center justify-center text-sm rounded ${status === 'hoy'
                  ? 'bg-orange-200 text-orange-900 dark:bg-orange-500 dark:text-white font-semibold'
                  : status === 'proxima'
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-400 dark:text-white'
                    : status === 'pasada'
                      ? 'bg-green-100 text-green-900 dark:bg-green-400 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                {day}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-200 dark:bg-orange-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Hoy - Día de clase</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-400"></div>
            <span className="text-gray-700 dark:text-gray-300">Próximas clases</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-400"></div>
            <span className="text-gray-700 dark:text-gray-300">Clases pasadas</span>
          </div>
        </div>
      </div>
    );
  };

interface Clase {
  ficha_id: number;
  materia_nombre?: string;
  programa_nombre?: string;
  fechaInicial?: string;
  fechaFinal?: string;
  horaInicial?: string;
  horaFinal?: string;
  total_sesiones?: number;
  dia_semana?: string;
  jornada_tipo?: string;
  idGrado: number;
  instructor?: {
    id: number;
    persona?: {
      id: number;
      nombre1: string;
      nombre2?: string;
      apellido1: string;
      apellido2?: string;
      email?: string;
      rutaFotoUrl?: string;
    };
  };
  sede: {
    id: number;
  }
  [key: string]: any;
}

interface FechaClase {
  fechaInicial: string;
  fechaFinal: string | null;
  dia_semana: string;
}

interface Ficha {
  id: number;
  codigo: string;
  idSede: number;
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
      id: number;
      nombre1: string;
      nombre2?: string;
      apellido1: string;
      apellido2?: string;
      email?: string;
      rutaFotoUrl?: string;
    };
  };
  horarios?: any[];
}

interface Estudiante {
  id: number;
  persona?: {
    id: number;
    nombre1: string;
    nombre2?: string;
    apellido1: string;
    apellido2?: string;
    rutaFotoUrl?: string;
  };
  estado?: string;
}

type MenuOption = 'estudiantes' | 'agregar-actividades' | 'actividades-asignadas' | 'juicios-evaluativos';

const ClaseDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as any;
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [clase, setClase] = useState<Clase | null>(null);
  const [todasLasFechasClase, setTodasLasFechasClase] = useState<FechaClase[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEstudiante, setSearchEstudiante] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState<MenuOption>('estudiantes');
  const itemsPerPage = 11;
  const [currentTime, setCurrentTime] = useState(new Date());


  //Juicios evaluativos:
  const [juiciosEvaluativos, setJuiciosEvaluativos] = useState<boolean>(false);
  const [idFicha, setIdFicha] = useState<number | undefined>(0);
  const [idSede, setIdSede] = useState<number | undefined>(0);
  const [idGrado, setIdGrado] = useState<number | undefined>(0);
  const [idPrograma, setIdPrograma] = useState<string | undefined>('');
  const [evento, setEvento] = useState<boolean>(false);

  // Actualizar el tiempo actual cada segundo para el cronómetro en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchFicha = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Intentar primero con el nuevo endpoint que usa idHorarioMateria
        let response;
        try {
          response = await axios.get(`fichas/clase-horario/${id}`);
          // El nuevo endpoint devuelve { message, data: { clase, ficha, apertura } }
          const fichaData = response.data?.data?.ficha;
          const claseData = response.data?.data?.clase;

          if (fichaData) {
            setFicha(fichaData);
            if (claseData) {
              setClase(claseData);
            }
            // Obtener todas las fechas de clase para el calendario
            const fechasClase = response.data?.data?.todasLasFechasClase || [];
            setTodasLasFechasClase(fechasClase);
          } else {
            throw new Error('Ficha no encontrada en la respuesta');
          }
        } catch (horarioError: any) {
          // Si falla, intentar con el endpoint antiguo (por si acaso se pasa un ficha_id)
          console.log('Intentando con endpoint antiguo...');
          response = await axios.get(`fichas/${id}`);
          const fichaData = response.data?.data?.ficha || response.data;
          setFicha(fichaData);
          setClase(null); // El endpoint antiguo no tiene datos de clase
        }

        // Aquí deberías hacer una llamada para obtener los estudiantes de la ficha
        // Por ahora usamos un array vacío
        setEstudiantes([]);
      } catch (error: any) {
        console.error('Error al cargar la ficha:', error);
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          id: id
        });
        // Siempre establecer ficha como null en caso de error para mostrar el mensaje apropiado
        setFicha(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFicha();
  }, [id]);

  const filteredEstudiantes = useMemo(() => {
    if (!searchEstudiante) return estudiantes;
    const search = searchEstudiante.toLowerCase();
    return estudiantes.filter(
      (est) =>
        est.persona?.nombre1?.toLowerCase().includes(search) ||
        est.persona?.apellido1?.toLowerCase().includes(search) ||
        `${est.persona?.nombre1} ${est.persona?.apellido1}`.toLowerCase().includes(search)
    );
  }, [estudiantes, searchEstudiante]);

  const paginatedEstudiantes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEstudiantes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEstudiantes, currentPage]);

  const totalPages = Math.ceil(filteredEstudiantes.length / itemsPerPage);

  const getNumSesiones = (): number => {
    // Usar el total de sesiones de la clase específica
    if (clase?.total_sesiones !== undefined && clase.total_sesiones !== null) {
      return Number(clase.total_sesiones);
    }
    return 0;
  };

  const formatDate = (dateString: string): string => {
    // Parsear fecha sin problemas de zona horaria
    const parts = dateString.split('T')[0].split('-');
    let date: Date;
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      date = new Date(year, month, day);
    } else {
      date = new Date(dateString);
    }

    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthsNames = [
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
    return `${days[date.getDay()]}, ${date.getDate()} de ${monthsNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calcular la próxima fecha de clase si hoy no hay clase
  const calcularProximaFechaClase = (): string | null => {
    if (!clase?.fechaInicial || !clase?.fechaFinal || !clase?.dia_semana) return null;

    const mapeoDias: { [key: string]: number } = {
      'DOMINGO': 0,
      'LUNES': 1,
      'MARTES': 2,
      'MIERCOLES': 3,
      'MIÉRCOLES': 3,
      'JUEVES': 4,
      'VIERNES': 5,
      'SABADO': 6,
      'SÁBADO': 6
    };

    const diaNumero = mapeoDias[clase.dia_semana.toUpperCase()];
    if (diaNumero === undefined) return null;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Parsear fechas sin problemas de zona horaria
    const parseDate = (dateString: string): Date => {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      return new Date(dateString);
    };

    const fechaInicio = parseDate(clase.fechaInicial);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = parseDate(clase.fechaFinal);
    fechaFin.setHours(0, 0, 0, 0);

    // Buscar la próxima fecha de clase
    const fechaActual = new Date(Math.max(hoy.getTime(), fechaInicio.getTime()));

    while (fechaActual <= fechaFin) {
      if (fechaActual.getDay() === diaNumero) {
        return fechaActual.toISOString().split('T')[0];
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return null;
  };

  const proximaFechaClase = calcularProximaFechaClase();

  const getJornadaType = (nombreJornada: string): string => {
    const lower = nombreJornada?.toLowerCase() || '';
    if (lower.includes('mañana') || lower.includes('manana')) return 'Mañana';
    if (lower.includes('tarde')) return 'Tarde';
    if (lower.includes('noche')) return 'Noche';
    return nombreJornada || 'N/A';
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

  // Función para convertir hora string (HH:MM:SS o HH:MM) a minutos desde medianoche
  // El backend devuelve horas en formato 12h pero como si fueran 24h (ej: "04:00:00" = 4:00 PM si jornada es TARDE)
  const timeToMinutes = (timeString: string, jornadaTipo?: string): number => {
    if (!timeString) return 0;
    const time = timeString.substring(0, 5); // Obtener HH:MM
    let [hours, minutes] = time.split(':').map(Number);

    // Si jornada_tipo es TARDE o NOCHE, y la hora es menor a 12, sumar 12
    const jornadaTipoUpper = jornadaTipo?.toUpperCase() || '';
    const esTarde = jornadaTipoUpper.includes('TARDE');
    const esNoche = jornadaTipoUpper.includes('NOCHE') || jornadaTipoUpper.includes('NOCTURNA');

    if ((esTarde || esNoche) && hours < 12) {
      hours += 12;
    }

    return hours * 60 + minutes;
  };

  // Función para calcular la duración total de la clase en segundos
  const calcularDuracionClase = (): number => {
    if (!clase?.horaInicial || !clase?.horaFinal) return 0;
    const inicio = timeToMinutes(clase.horaInicial, clase.jornada_tipo);
    const fin = timeToMinutes(clase.horaFinal, clase.jornada_tipo);
    // Si la hora final es menor que la inicial, asumimos que cruza medianoche
    let duracionMinutos = 0;
    if (fin <= inicio) {
      duracionMinutos = (24 * 60 - inicio) + fin;
    } else {
      duracionMinutos = fin - inicio;
    }
    return duracionMinutos * 60; // Convertir a segundos
  };

  // Función para determinar el estado de la clase: 'pasada', 'pendiente', 'en_curso'
  const getEstadoClase = (): 'pasada' | 'pendiente' | 'en_curso' => {
    if (!clase?.fechaInicial || !clase?.horaInicial || !clase?.horaFinal || !clase?.fechaFinal) return 'pendiente';

    // Parsear fecha sin problemas de zona horaria
    const parseDate = (dateString: string): Date => {
      if (!dateString) return new Date();
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      return new Date(dateString);
    };

    const fechaInicio = parseDate(clase.fechaInicial);
    const fechaFin = parseDate(clase.fechaFinal);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(0, 0, 0, 0);

    // Si ya pasó la fecha final del curso completo
    if (fechaFin.getTime() < hoy.getTime()) {
      return 'pasada';
    }

    // Si aún no ha iniciado el curso completo
    if (fechaInicio.getTime() > hoy.getTime()) {
      return 'pendiente';
    }

    // Verificar si hoy es uno de los días de clase
    const esDiaDeClaseHoy = todasLasFechasClase.some(f => {
      if (!f.fechaInicial) return false;
      const d = parseDate(f.fechaInicial);
      d.setHours(0, 0, 0, 0);

      const dFin = f.fechaFinal ? parseDate(f.fechaFinal) : new Date(d);
      dFin.setHours(0, 0, 0, 0);

      if (d.getTime() === dFin.getTime()) {
        return d.getTime() === hoy.getTime();
      } else {
        const mapeoDias: { [key: string]: number } = {
          'DOMINGO': 0, 'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3, 'MIÉRCOLES': 3,
          'JUEVES': 4, 'VIERNES': 5, 'SABADO': 6, 'SÁBADO': 6
        };
        const diaNumero = mapeoDias[f.dia_semana?.toUpperCase() || ''];
        return d.getTime() <= hoy.getTime() && hoy.getTime() <= dFin.getTime() && hoy.getDay() === diaNumero;
      }
    });

    if (!esDiaDeClaseHoy) {
      // Si hoy no hay clase, está pendiente para la próxima
      return 'pendiente';
    }

    // Si es día de clase, verificar el rango de horas
    const ahora = currentTime;
    let [horaIni, minIni] = clase.horaInicial.substring(0, 5).split(':').map(Number);
    let [horaFin, minFin] = clase.horaFinal.substring(0, 5).split(':').map(Number);

    // Convertir horas según jornada_tipo (el backend devuelve 12h como si fueran 24h)
    const jornadaTipo = clase.jornada_tipo?.toUpperCase() || '';
    const esTarde = jornadaTipo.includes('TARDE');
    const esNoche = jornadaTipo.includes('NOCHE') || jornadaTipo.includes('NOCTURNA');

    if ((esTarde || esNoche) && horaIni < 12) {
      horaIni += 12;
    }
    if ((esTarde || esNoche) && horaFin < 12) {
      horaFin += 12;
    }

    const horaInicio = new Date(ahora);
    horaInicio.setHours(horaIni, minIni, 0, 0);

    const horaFinClase = new Date(ahora);
    horaFinClase.setHours(horaFin, minFin, 0, 0);

    // Si la hora final es menor que la inicial, asumimos que cruza medianoche
    if (horaFinClase.getTime() < horaInicio.getTime()) {
      horaFinClase.setDate(horaFinClase.getDate() + 1);
    }

    // Verificar si estamos dentro del rango de la clase
    if (ahora.getTime() >= horaInicio.getTime() && ahora.getTime() <= horaFinClase.getTime()) {
      return 'en_curso';
    }

    // Si ya pasó la hora de fin hoy
    if (ahora.getTime() > horaFinClase.getTime()) {
      return 'pasada';
    }

    // Si aún no ha comenzado la hora de hoy
    return 'pendiente';
  };

  // Función para calcular el tiempo transcurrido en segundos (solo si está en curso)
  const calcularTiempoTranscurrido = (): number => {
    const estado = getEstadoClase();
    if (estado !== 'en_curso' || !clase?.horaInicial) return 0;

    const ahora = currentTime;
    let [horaIni, minIni] = clase.horaInicial.substring(0, 5).split(':').map(Number);

    // Convertir horas según jornada_tipo
    const jornadaTipo = clase.jornada_tipo?.toUpperCase() || '';
    const esTarde = jornadaTipo.includes('TARDE');
    const esNoche = jornadaTipo.includes('NOCHE') || jornadaTipo.includes('NOCTURNA');

    if ((esTarde || esNoche) && horaIni < 12) {
      horaIni += 12;
    }

    const horaInicio = new Date(ahora);
    horaInicio.setHours(horaIni, minIni, 0, 0);

    const diffMs = ahora.getTime() - horaInicio.getTime();
    return Math.floor(diffMs / 1000); // Convertir a segundos
  };

  // Función para calcular el porcentaje de progreso (0-100)
  const calcularPorcentajeProgreso = (): number => {
    const estado = getEstadoClase();
    const duracionTotal = calcularDuracionClase(); // En segundos

    if (estado === 'pasada') {
      return 100; // Clase completada
    }
    if (estado === 'pendiente') {
      return 0; // Clase aún no inicia
    }
    if (estado === 'en_curso' && duracionTotal > 0) {
      const tiempoTranscurrido = calcularTiempoTranscurrido(); // En segundos
      const porcentaje = Math.min(100, Math.max(0, (tiempoTranscurrido / duracionTotal) * 100));
      return porcentaje;
    }
    return 0;
  };

  // Función para determinar el color según el progreso
  const getColorProgreso = (): { color: string; bgColor: string; textColor: string; estado: string } => {
    const estado = getEstadoClase();
    const porcentaje = calcularPorcentajeProgreso();

    // Clase pasada o pendiente: gris
    if (estado === 'pasada' || estado === 'pendiente') {
      return {
        color: '#9ca3af', // gray-400
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        textColor: 'text-gray-700 dark:text-gray-300',
        estado: estado === 'pasada' ? 'Completada' : 'Pendiente'
      };
    }

    // Clase en curso: semáforo según progreso
    if (porcentaje <= 33) {
      // Verde: inicio (0-33%)
      return {
        color: '#22c55e', // green-500
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-700 dark:text-green-300',
        estado: 'En curso'
      };
    } else if (porcentaje <= 66) {
      // Naranja: mitad (33-66%)
      return {
        color: '#f97316', // orange-500
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-700 dark:text-orange-300',
        estado: 'En curso'
      };
    } else {
      // Rojo: por finalizar (66-100%)
      return {
        color: '#ef4444', // red-500
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-700 dark:text-red-300',
        estado: 'En curso'
      };
    }
  };

  // Función para formatear el tiempo del cronómetro (HH:MM:SS / HH:MM:SS)
  const formatCronometro = (): string => {
    const estado = getEstadoClase();
    const duracionTotal = calcularDuracionClase(); // En segundos
    const horasTotal = Math.floor(duracionTotal / 3600);
    const minutosTotal = Math.floor((duracionTotal % 3600) / 60);
    const segundosTotal = duracionTotal % 60;
    const tiempoTotalStr = `${horasTotal.toString().padStart(2, '0')}:${minutosTotal.toString().padStart(2, '0')}:${segundosTotal.toString().padStart(2, '0')}`;

    if (estado === 'pasada') {
      // Clase pasada: mostrar la duración total
      return `${tiempoTotalStr} / ${tiempoTotalStr}`;
    }
    if (estado === 'pendiente') {
      // Clase pendiente: mostrar 00:00:00 / duración total
      return `00:00:00 / ${tiempoTotalStr}`;
    }
    if (estado === 'en_curso') {
      // Clase en curso: mostrar tiempo transcurrido / duración total
      const tiempoTranscurrido = calcularTiempoTranscurrido(); // En segundos
      const horasTrans = Math.floor(tiempoTranscurrido / 3600);
      const minutosTrans = Math.floor((tiempoTranscurrido % 3600) / 60);
      const segundosTrans = tiempoTranscurrido % 60;
      const tiempoTransStr = `${horasTrans.toString().padStart(2, '0')}:${minutosTrans.toString().padStart(2, '0')}:${segundosTrans.toString().padStart(2, '0')}`;
      return `${tiempoTransStr} / ${tiempoTotalStr}`;
    }
    return `00:00:00 / ${tiempoTotalStr}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <KeenIcon icon="document" className="text-6xl text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            No se encontró la clase
          </p>
        </div>
      </div>
    );
  }

  // Usar el instructor asignado a esta clase específica, no el instructor líder de la ficha
  const instructorClase = clase?.instructor;
  const nombreCompletoInstructor = instructorClase?.persona
    ? `${instructorClase.persona.nombre1} ${instructorClase.persona.nombre2 || ''} ${instructorClase.persona.apellido1} ${instructorClase.persona.apellido2 || ''}`.trim()
    : 'Sin asignar';

  const emailInstructor = instructorClase?.persona?.email || 'N/A';

  return (
    <Container>
      {/* Header con Info Cards */}
      <div className="mb-6">
        {/* Agregar juicios evaluativos */}
        <ModalJuiciosEvaluativos
          open={juiciosEvaluativos}
          onClose={() => {
            setJuiciosEvaluativos(false);
            setIdFicha(0);

          }}
          onSave={() => setEvento((pre) => !pre)}
          idFicha={idFicha}
          idPrograma={idPrograma}
          idSede={idSede}
          idGrado={idGrado}
        />
        <button
          onClick={() => navigate('/ambiente-virtual/historial-raps')}
          className="mb-3 flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <KeenIcon icon="left" className="text-sm" />
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Header Left */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {clase?.materia_nombre || 'Sin clase'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {clase?.programa_nombre || ficha.asignacion?.programa?.nombrePrograma || 'Programa académico'}
            </p>
          </div>

          {/* Info Cards - Compactas */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="p-3 min-w-[140px]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-600 flex items-center justify-center flex-shrink-0">
                  <KeenIcon icon="document" className="text-blue-600 dark:text-blue-400 text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Ficha</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {ficha.codigo}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 min-w-[140px]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-transparent dark:bg-transparent border border-yellow-200 dark:border-yellow-600 flex items-center justify-center flex-shrink-0">
                  <KeenIcon icon="sun" className="text-yellow-600 dark:text-yellow-400 text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Jornada</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {getJornadaType(ficha.jornada?.nombreJornada || '')}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 min-w-[140px]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-transparent dark:bg-transparent border border-green-200 dark:border-green-600 flex items-center justify-center flex-shrink-0">
                  <KeenIcon icon="calendar" className="text-green-600 dark:text-green-400 text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                    Número de Sesiones
                  </p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {getNumSesiones()} sesiones
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructor and Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 items-stretch">
        {/* Left Column: Instructor and Date/Time - Más ancha */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full">
          {/* Instructor Card */}
          <div className="card flex-1">
            <div className="card-body p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">Instructor</h2>
              {instructorClase?.persona ? (() => {
                const colorInfo = getColorProgreso();
                const porcentaje = calcularPorcentajeProgreso();
                const cronometroText = formatCronometro();

                return (
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      {/* Círculo de progreso con anillo dinámico */}
                      <div className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-700 relative">
                        {/* Anillo de progreso dinámico */}
                        <svg className="absolute inset-0 w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke={colorInfo.color}
                            strokeWidth="3"
                            strokeDasharray={`${porcentaje} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        {/* Foto del instructor */}
                        <div className="absolute inset-0 flex items-center justify-center p-1.5">
                          <img
                            src={instructorClase.persona.rutaFotoUrl || '/media/avatars/blank.png'}
                            alt={nombreCompletoInstructor}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2.5">
                        {nombreCompletoInstructor}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                        {emailInstructor}
                      </p>
                      {/* Cronómetro y badge en la misma línea debajo del correo */}
                      <div className="flex items-center gap-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${colorInfo.bgColor} ${colorInfo.textColor}`}>
                          <KeenIcon icon="time" className={`${colorInfo.textColor} text-sm`} />
                          <span>{cronometroText}</span>
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorInfo.bgColor} ${colorInfo.textColor}`}>
                          {colorInfo.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <p className="text-xs text-gray-500 dark:text-gray-400">No hay instructor asignado</p>
              )}
            </div>
          </div>

          {/* Date and Time Card */}
          {clase?.fechaInicial && clase?.fechaFinal && (
            <div className="card flex-1">
              <div className="card-body p-6 flex flex-col h-full">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">Fecha y Hora</h2>
                <div className="grid grid-cols-2 gap-6">
                  {/* Fecha de Inicio */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <KeenIcon icon="calendar" className="text-green-600 dark:text-green-400 text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">Fecha de Inicio</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2.5 leading-snug">
                        {formatDate(clase.fechaInicial)}
                      </p>
                      {clase.horaInicial && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Hora inicio: {formatTime12h(clase.horaInicial, clase.jornada_tipo)}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Fecha de Fin */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <KeenIcon icon="calendar" className="text-red-600 dark:text-red-400 text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">Fecha de Fin</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2.5 leading-snug">
                        {formatDate(clase.fechaFinal)}
                      </p>
                      {clase.horaFinal && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Hora fin: {formatTime12h(clase.horaFinal, clase.jornada_tipo)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Calendar - Mucho más pequeño */}
        <div className="lg:col-span-4">
          <div className="card h-full flex flex-col">
            <div className="card-body p-4 flex flex-col h-full">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Calendario de Clases
              </h2>
              <CalendarComponent
                fechaInicio={clase?.fechaInicial || ''}
                fechaFin={clase?.fechaFinal || ''}
                diaSemana={clase?.dia_semana}
                todasLasFechasClase={todasLasFechasClase}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Menu Lateral */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-body">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">MENÚ</h2>
              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveMenu('estudiantes')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors border border-transparent ${activeMenu === 'estudiantes'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="users" className={`text-base ${activeMenu === 'estudiantes' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>Estudiantes</span>
                </button>
                <button
                  onClick={() => setActiveMenu('agregar-actividades')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors border border-transparent ${activeMenu === 'agregar-actividades'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="plus-circle" className={`text-base ${activeMenu === 'agregar-actividades' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>Agregar Actividades</span>
                </button>
                <button
                  onClick={() => setActiveMenu('actividades-asignadas')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors border border-transparent ${activeMenu === 'actividades-asignadas'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="check-squared" className={`text-base ${activeMenu === 'actividades-asignadas' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>Actividades Asignadas</span>
                </button>
                <button
                  onClick={() => {
                    setJuiciosEvaluativos(true);
                    setIdFicha(clase?.ficha_id);
                    setIdPrograma(String(ficha.asignacion?.programa?.id));
                    setIdSede(ficha?.idSede)
                    setIdGrado(clase?.idGrado);
                  }
                  }
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors border border-transparent ${activeMenu === 'juicios-evaluativos'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="chart-simple" className={`text-base ${activeMenu === 'juicios-evaluativos' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>Juicios Evaluativos</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="card-body">
              {/* Estudiantes Section */}
              {activeMenu === 'estudiantes' && (
                <StudentListByMateria
                  materiaData={{
                    idMateria: locationState?.idMateria || clase?.idMateria || '',
                    idFicha: locationState?.ficha_id || ficha?.id || 0,
                    idJornada: ficha?.jornada?.id?.toString() || '',
                    idPrograma: ficha?.asignacion?.programa?.id?.toString() || '',
                    programa_nombre: locationState?.programa_nombre || ficha?.asignacion?.programa?.nombrePrograma,
                    estadoClase: (() => {
                      // Usar siempre el estado calculado en tiempo real para determinar si está 'EN_CURSO', 'PASADA', o 'PENDIENTE'
                      const finalStatus = getEstadoClase()?.toUpperCase();
                      console.log('--- DEBUG ESTADO CLASE ---', {
                        getEstadoClase: getEstadoClase(),
                        finalStatus
                      });
                      return finalStatus;
                    })()
                  }}
                />
              )}

              {/* Agregar Actividades Section */}
              {activeMenu === 'agregar-actividades' && (
                <div className="text-center py-12">
                  <KeenIcon icon="plus-circle" className="text-4xl text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No hay actividades</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Crea una nueva actividad para comenzar
                  </p>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors mx-auto">
                    <KeenIcon icon="plus" className="text-sm" />
                    <span>Crear Actividad</span>
                  </button>
                </div>
              )}

              {/* Actividades Asignadas Section */}
              {activeMenu === 'actividades-asignadas' && (
                <div className="text-center py-12">
                  <KeenIcon icon="check-squared" className="text-4xl text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No hay actividades asignadas</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Las actividades que asignes aparecerán aquí
                  </p>
                </div>
              )}

              {/* Juicios Evaluativos Section */}
              {activeMenu === 'juicios-evaluativos' && (
                <div className="text-center py-12">
                  <KeenIcon icon="chart-simple" className="text-4xl text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No hay juicios evaluativos</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Los juicios evaluativos aparecerán aquí cuando estén disponibles
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ClaseDetallePage;

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { Container } from '@/components/container';
import StudentListByMateria from './ListaHorarioEstudiantes';

// Componente de Calendario
const CalendarComponent: React.FC<{
  fechaInicio: string;
  fechaFin: string;
  diaSemana?: string;
  todasLasFechasClase?: FechaClase[];
  idDia?: number;
  idHorarioMateria?: number;
  sesionesCompletadas?: Array<{ fechaSesion: string; numeroSesion?: number }>;
  horaInicial?: string;
  horaFinal?: string;
  onDateClick?: (fecha: Date, idHorarioMateria: number) => void;
}> = ({
  fechaInicio,
  fechaFin,
  diaSemana,
  todasLasFechasClase = [],
  idDia,
  idHorarioMateria,
  sesionesCompletadas = [],
  horaInicial,
  horaFinal,
  onDateClick
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

    // Mapa de fechas a idHorarioMateria para navegación
    const mapaFechasHorarios = useMemo(() => {
      const mapa = new Map<string, number>();

      if (todasLasFechasClase && todasLasFechasClase.length > 0) {
        todasLasFechasClase.forEach((fechaClase) => {
          if (fechaClase.fechaInicial && fechaClase.idHorarioMateria) {
            const fechaIni = parseDate(fechaClase.fechaInicial);
            if (fechaIni) {
              fechaIni.setHours(0, 0, 0, 0);
              const fechaFin = fechaClase.fechaFinal ? parseDate(fechaClase.fechaFinal) : fechaIni;
              if (fechaFin) {
                fechaFin.setHours(0, 0, 0, 0);
                if (fechaIni.getTime() === fechaFin.getTime()) {
                  const fechaStr = fechaIni.toISOString().split('T')[0];
                  mapa.set(fechaStr, fechaClase.idHorarioMateria);
                } else {
                  if (fechaClase.idDia) {
                    const diaNumero = convertirIdDiaANumeroJS(fechaClase.idDia);
                    const fechaActual = new Date(fechaIni);
                    while (fechaActual <= fechaFin) {
                      if (fechaActual.getDay() === diaNumero) {
                        const fechaStr = fechaActual.toISOString().split('T')[0];
                        mapa.set(fechaStr, fechaClase.idHorarioMateria);
                      }
                      fechaActual.setDate(fechaActual.getDate() + 1);
                    }
                  }
                }
              }
            }
          }
        });
      }

      return mapa;
    }, [todasLasFechasClase]);

    // Calcular todas las fechas de clase usando las fechas del backend y sesiones completadas
    const fechasClase = useMemo(() => {
      const fechas: Date[] = [];

      // Si tenemos todas las fechas del backend, usarlas directamente
      if (todasLasFechasClase && todasLasFechasClase.length > 0) {
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
                  if (fechaClase.idDia) {
                    const diaNumero = convertirIdDiaANumeroJS(fechaClase.idDia);
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
      }

      // SIEMPRE calcular fechas basándose en fechaInicio, fechaFin e idDia como respaldo
      // Esto asegura que el calendario siempre muestre las fechas aunque todasLasFechasClase esté vacío
      // IMPORTANTE: Este cálculo debe ejecutarse SIEMPRE, incluso si todasLasFechasClase tiene datos
      // porque puede que todasLasFechasClase no tenga todas las fechas individuales
      if (fechaInicio && fechaFinParaUsar && idDia !== undefined && idDia !== null) {
        const inicio = parseDate(fechaInicio);
        const fin = parseDate(fechaFinParaUsar);
        if (inicio && fin && !isNaN(inicio.getTime()) && !isNaN(fin.getTime())) {
          inicio.setHours(0, 0, 0, 0);
          fin.setHours(0, 0, 0, 0);
          const diaNumero = convertirIdDiaANumeroJS(idDia);

          // Asegurarse de que el día número sea válido (0-6)
          if (diaNumero >= 0 && diaNumero <= 6) {
            const fechaActual = new Date(inicio);

            // Calcular todas las fechas en el rango que coincidan con el día de la semana
            // Usar un contador de seguridad para evitar bucles infinitos
            let contador = 0;
            const maxIteraciones = 10000; // Máximo de días a calcular (aproximadamente 27 años)

            while (fechaActual <= fin && contador < maxIteraciones) {
              if (fechaActual.getDay() === diaNumero) {
                const fechaClase = new Date(fechaActual);
                fechaClase.setHours(0, 0, 0, 0);
                // Verificar que no esté duplicada
                const existe = fechas.some(f => {
                  const fDate = new Date(f);
                  fDate.setHours(0, 0, 0, 0);
                  return fDate.getTime() === fechaClase.getTime();
                });
                if (!existe) {
                  fechas.push(fechaClase);
                }
              }
              fechaActual.setDate(fechaActual.getDate() + 1);
              contador++;
            }
          }
        }
      }

      // Agregar también las fechas de sesiones completadas
      sesionesCompletadas.forEach((sesion) => {
        if (sesion.fechaSesion) {
          const fechaSesion = parseDate(sesion.fechaSesion);
          if (fechaSesion) {
            fechaSesion.setHours(0, 0, 0, 0);
            // Verificar que no esté duplicada
            const existe = fechas.some(f => f.getTime() === fechaSesion.getTime());
            if (!existe) {
              fechas.push(new Date(fechaSesion));
            }
          }
        }
      });

      // Eliminar duplicados
      const fechasUnicas = fechas.filter((fecha, index, self) =>
        index === self.findIndex(f => f.getTime() === fecha.getTime())
      );

      return fechasUnicas.sort((a, b) => a.getTime() - b.getTime());
    }, [todasLasFechasClase, fechaInicio, fechaFinParaUsar, idDia, sesionesCompletadas, convertirIdDiaANumeroJS]);


    // Abreviaciones de días para el calendario (solo para visualización del header)
    // Usar Intl.DateTimeFormat para obtener las abreviaciones del navegador
    const getDayAbbreviation = (dayIndex: number): string => {
      const date = new Date(2024, 0, dayIndex + 1); // Crear fecha para ese día de la semana
      return new Intl.DateTimeFormat('es-ES', { weekday: 'narrow' }).format(date).toUpperCase();
    };

    const daysOfWeek = [0, 1, 2, 3, 4, 5, 6].map(getDayAbbreviation);

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

      // Formatear la fecha para comparación (YYYY-MM-DD)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      // Verificar si esta fecha es una fecha de clase usando comparación de strings
      let esFechaClase = false;
      let fechaEncontrada: Date | null = null;

      for (const fecha of fechasClase) {
        const fechaClase = new Date(fecha);
        fechaClase.setHours(0, 0, 0, 0);
        const fechaClaseStr = `${fechaClase.getFullYear()}-${String(fechaClase.getMonth() + 1).padStart(2, '0')}-${String(fechaClase.getDate()).padStart(2, '0')}`;

        // Comparar tanto por timestamp como por string para mayor seguridad
        if (fechaClaseStr === dateStr || fechaClase.getTime() === date.getTime()) {
          esFechaClase = true;
          fechaEncontrada = fechaClase;
          break;
        }
      }


      if (!esFechaClase) {
        return 'normal';
      }

      // Si es una fecha de clase, determinar el estado basándose en la fecha actual
      const hoyTime = hoy.getTime();
      const dateTime = date.getTime();

      if (dateTime === hoyTime) {
        return 'hoy';
      }

      if (dateTime > hoyTime) {
        return 'proxima';
      }

      // Si la fecha es menor que hoy, es pasada (sin importar si está completada o no)
      if (dateTime < hoyTime) {
        return 'pasada';
      }

      return 'normal';
    };

    // Verificar si una fecha tiene sesión completada
    const tieneSesionCompletada = (fecha: Date): boolean => {
      const fechaStr = fecha.toISOString().split('T')[0];
      return sesionesCompletadas.some(sesion => {
        if (!sesion.fechaSesion) return false;
        const sesionFecha = sesion.fechaSesion.split('T')[0];
        return sesionFecha === fechaStr;
      });
    };

    // Determinar el estado de una fecha específica
    const getEstadoFecha = (fecha: Date): 'completada' | 'pendiente' | 'en_curso' => {
      const fechaStr = fecha.toISOString().split('T')[0];
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaComparar = new Date(fecha);
      fechaComparar.setHours(0, 0, 0, 0);

      // Verificar si está completada
      const esCompletada = tieneSesionCompletada(fecha);
      if (esCompletada) {
        return 'completada';
      }

      // Si es hoy, verificar si está en curso
      if (fechaComparar.getTime() === hoy.getTime()) {
        if (horaInicial && horaFinal) {
          const ahora = new Date();
          const [hIni, mIni] = horaInicial.substring(0, 5).split(':').map(Number);
          const [hFin, mFin] = horaFinal.substring(0, 5).split(':').map(Number);

          const horaInicio = new Date(ahora);
          horaInicio.setHours(hIni, mIni, 0, 0);
          const horaFinalClase = new Date(ahora);
          horaFinalClase.setHours(hFin, mFin, 0, 0);

          if (horaFinalClase.getTime() < horaInicio.getTime()) {
            horaFinalClase.setDate(horaFinalClase.getDate() + 1);
          }

          if (ahora.getTime() >= horaInicio.getTime() && ahora.getTime() <= horaFinalClase.getTime()) {
            return 'en_curso';
          }
        }
        return 'pendiente';
      }

      // Si es pasada y no está completada, es pendiente (no se completó)
      if (fechaComparar.getTime() < hoy.getTime()) {
        return 'pendiente';
      }

      // Si es futura, es pendiente
      return 'pendiente';
    };

    // Manejar clic en una fecha del calendario - navegar directamente al detalle
    const handleDateClick = (day: number) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      date.setHours(0, 0, 0, 0);

      // Verificar si es una fecha de clase
      const esFechaClase = fechasClase.some(fecha => {
        const fechaClase = new Date(fecha);
        fechaClase.setHours(0, 0, 0, 0);
        return fechaClase.getTime() === date.getTime();
      });

      if (esFechaClase) {
        // Obtener el idHorarioMateria de la fecha clickeada
        const fechaStr = date.toISOString().split('T')[0];
        const idHorario = mapaFechasHorarios.get(fechaStr);

        // Si encontramos el idHorarioMateria, navegar al detalle
        if (idHorario) {
          if (onDateClick) {
            onDateClick(date, idHorario);
          }
        } else {
          // Si no encontramos el idHorarioMateria, usar el actual como fallback
          if (idHorarioMateria && onDateClick) {
            onDateClick(date, idHorarioMateria);
          }
        }
      }
    };

    const days = getDaysInMonth(currentMonth);
    // Usar Intl.DateTimeFormat para obtener el nombre del mes (sin datos hardcodeados)
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(currentMonth);
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
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const esFechaClase = status !== 'normal';

            return (
              <div
                key={index}
                onClick={() => esFechaClase && handleDateClick(day)}
                className={`h-8 flex items-center justify-center text-sm rounded transition-all ${status === 'hoy'
                  ? 'bg-orange-200 text-orange-900 dark:bg-orange-500 dark:text-white font-semibold cursor-pointer hover:bg-orange-300 dark:hover:bg-orange-600'
                  : status === 'proxima'
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-400 dark:text-white cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-500'
                    : status === 'pasada'
                      ? 'bg-green-100 text-green-900 dark:bg-green-400 dark:text-white cursor-pointer hover:bg-green-200 dark:hover:bg-green-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                title={esFechaClase ? 'Click para ver detalle de la clase' : ''}
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
  materia_nombre?: string;
  programa_nombre?: string;
  fechaInicial?: string;
  fechaFinal?: string;
  horaInicial?: string;
  horaFinal?: string;
  total_sesiones?: number;
  sesiones_dadas?: number;
  sesiones_completadas?: SesionCompletada[];
  dia_semana?: string;
  idDia: number; // ID del día desde la BD: 1=Lunes, 2=Martes, ..., 7=Domingo
  jornada_tipo?: string;
  estado?: string; // Estado calculado por el backend: 'PENDIENTE', 'EN CURSO', 'COMPLETADO'
  idHorarioMateria?: number;
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
  [key: string]: any;
}

interface FechaClase {
  idHorarioMateria?: number;
  fechaInicial: string;
  fechaFinal: string | null;
  dia_semana: string;
  idDia: number; // ID del día desde la BD: 1=Lunes, 2=Martes, ..., 7=Domingo
}

interface Ficha {
  id: number;
  codigo: string;
    idSede?: number;
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

  // Estado local para el estado de la clase (se actualiza en tiempo real)
  const [estadoClaseLocal, setEstadoClaseLocal] = useState<'pasada' | 'pendiente' | 'en_curso'>('pendiente');

  // Función para calcular el estado en tiempo real (sin depender de estadoClaseLocal)
  const calcularEstadoEnTiempoReal = (tiempoActual: Date): 'pasada' | 'pendiente' | 'en_curso' => {
    if (!clase?.fechaInicial || !clase?.fechaFinal || !clase?.horaInicial || !clase?.horaFinal || !clase?.idDia) {
      return 'pendiente';
    }

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

    const ahora = tiempoActual;
    const hoy = new Date(ahora);
    hoy.setHours(0, 0, 0, 0);

    const fechaInicio = parseDate(clase.fechaInicial);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = parseDate(clase.fechaFinal);
    fechaFin.setHours(0, 0, 0, 0);

    // Si ya pasó la fecha final del curso completo
    if (fechaFin.getTime() < hoy.getTime()) {
      return 'pasada';
    }

    // Si aún no ha iniciado el curso completo
    if (fechaInicio.getTime() > hoy.getTime()) {
      return 'pendiente';
    }

    // Verificar si hoy es un día de clase
    const diaNumero = convertirIdDiaANumeroJS(clase.idDia);
    if (ahora.getDay() !== diaNumero) {
      return 'pendiente';
    }

    // Verificar si estamos dentro del rango de horas de la clase
    const [hIni, mIni] = clase.horaInicial.substring(0, 5).split(':').map(Number);
    const [hFin, mFin] = clase.horaFinal.substring(0, 5).split(':').map(Number);

    const horaInicio = new Date(ahora);
    horaInicio.setHours(hIni, mIni, 0, 0);
    const horaFinal = new Date(ahora);
    horaFinal.setHours(hFin, mFin, 0, 0);

    // Si la hora final es menor que la inicial, asumimos que cruza medianoche
    if (horaFinal.getTime() < horaInicio.getTime()) {
      horaFinal.setDate(horaFinal.getDate() + 1);
    }

    // Si ya pasó la hora final, la clase está completada
    if (ahora.getTime() > horaFinal.getTime()) {
      return 'pasada';
    }

    // Si estamos dentro del rango de horas, está en curso
    if (ahora.getTime() >= horaInicio.getTime() && ahora.getTime() <= horaFinal.getTime()) {
      return 'en_curso';
    }

    // Por defecto, pendiente
    return 'pendiente';
  };

  // Actualizar el tiempo actual cada segundo para el cronómetro en tiempo real
  // También actualizar el estado de la clase automáticamente
  useEffect(() => {
    if (!clase) return;

    const interval = setInterval(() => {
      const nuevoTiempo = new Date();
      setCurrentTime(nuevoTiempo);

      // Actualizar estado de la clase en tiempo real
      const nuevoEstado = calcularEstadoEnTiempoReal(nuevoTiempo);
      setEstadoClaseLocal((estadoAnterior) => {
        // Si cambió de estado (especialmente a completada), loguear
        // Estado actualizado automáticamente
        return nuevoEstado;
      });
    }, 1000);

    // Calcular estado inicial
    const estadoInicial = calcularEstadoEnTiempoReal(new Date());
    setEstadoClaseLocal(estadoInicial);

    return () => clearInterval(interval);
  }, [clase]);

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
          response = await axios.get(`fichas/${id}`);
          const fichaData = response.data?.data?.ficha || response.data;
          setFicha(fichaData);
          setClase(null); // El endpoint antiguo no tiene datos de clase
        }

        // Aquí deberías hacer una llamada para obtener los estudiantes de la ficha
        // Por ahora usamos un array vacío
        setEstudiantes([]);
      } catch (error: any) {
        // Error al cargar la ficha - se maneja silenciosamente
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

  const getNumSesiones = (): string => {
    // Usar sesiones_dadas y total_sesiones de la clase específica
    const total = clase?.total_sesiones || 0;
    const dadas = clase?.sesiones_dadas || 0;
    return `${dadas}/${total} sesiones`;
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

    // Usar Intl.DateTimeFormat para formatear fecha (sin datos hardcodeados)
    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return formatter.format(date);
  };

  // Calcular la próxima fecha de clase si hoy no hay clase
  const calcularProximaFechaClase = (): string | null => {
    if (!clase?.fechaInicial || !clase?.fechaFinal || !clase?.idDia) return null;

    const diaNumero = convertirIdDiaANumeroJS(clase.idDia);

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

  /**
   * Obtiene el estado de la clase (usa el estado local actualizado en tiempo real)
   */
  const getEstadoClase = (): 'pasada' | 'pendiente' | 'en_curso' => {
    return estadoClaseLocal;
  };

  // ─── Solo para el botón Presente/Falta ──────────────────────────────────────
  // Usa las horas del backend TAL CUAL (sin ajuste de jornada).
  // Lógica: ¿Es hoy un día de clase dentro del rango de fechas Y dentro del horario?
  const esPeriodoAsistencia = (): boolean => {
    if (!clase?.fechaInicial || !clase?.fechaFinal || !clase?.horaInicial || !clase?.horaFinal) return false;

    const parseDate = (s: string): Date => {
      const parts = s.split('T')[0].split('-');
      return parts.length === 3
        ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
        : new Date(s);
    };

    const ahora = new Date();
    const hoy = new Date(ahora); hoy.setHours(0, 0, 0, 0);

    const fechaInicio = parseDate(clase.fechaInicial); fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = parseDate(clase.fechaFinal); fechaFin.setHours(0, 0, 0, 0);

    // 1. Hoy debe estar dentro del rango general del curso
    if (hoy.getTime() < fechaInicio.getTime() || hoy.getTime() > fechaFin.getTime()) return false;

    // 2. Hoy debe ser un día programado de clase
    const esDiaDeClase = todasLasFechasClase.some(f => {
      if (!f.fechaInicial) return false;
      const dIni = parseDate(f.fechaInicial); dIni.setHours(0, 0, 0, 0);
      const dFin = f.fechaFinal ? parseDate(f.fechaFinal) : new Date(dIni); dFin.setHours(0, 0, 0, 0);
      if (dIni.getTime() === dFin.getTime()) return dIni.getTime() === hoy.getTime();
      // Usar idDia directamente del backend (viene de la BD, sin mapeo hardcodeado)
      if (!f.idDia) return false;
      const diaNumero = convertirIdDiaANumeroJS(f.idDia);
      return diaNumero !== undefined
        && dIni.getTime() <= hoy.getTime()
        && hoy.getTime() <= dFin.getTime()
        && ahora.getDay() === diaNumero;
    });
    if (!esDiaDeClase) return false;

    // 3. Hora actual dentro del rango horaInicial–horaFinal del backend (sin ajuste de jornada)
    const [hIni, mIni] = clase.horaInicial.substring(0, 5).split(':').map(Number);
    const [hFin, mFin] = clase.horaFinal.substring(0, 5).split(':').map(Number);
    const inicio = new Date(ahora); inicio.setHours(hIni, mIni, 0, 0);
    const fin = new Date(ahora); fin.setHours(hFin, mFin, 0, 0);
    if (fin.getTime() < inicio.getTime()) fin.setDate(fin.getDate() + 1); // cruza medianoche

    return ahora.getTime() >= inicio.getTime() && ahora.getTime() <= fin.getTime();
  };
  // ────────────────────────────────────────────────────────────────────────────

  // Función para calcular el tiempo transcurrido en segundos (solo si está en curso)
  const calcularTiempoTranscurrido = (): number => {
    const estado = estadoClaseLocal;
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
    const estado = estadoClaseLocal;
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
    const estado = estadoClaseLocal;
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
    const estado = estadoClaseLocal;
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
                    {getNumSesiones()}
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
                // Usar estado local en tiempo real
                const estadoActual = estadoClaseLocal;
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
                          Hora inicio: {formatTime12h(clase.horaInicial)}
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
                          Hora fin: {formatTime12h(clase.horaFinal)}
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
              {clase?.fechaInicial ? (
                <CalendarComponent
                  fechaInicio={clase.fechaInicial}
                  fechaFin={clase.fechaFinal || clase.fechaInicial}
                  diaSemana={clase.dia_semana}
                  todasLasFechasClase={todasLasFechasClase}
                  idDia={clase.idDia}
                  idHorarioMateria={clase.idHorarioMateria}
                  sesionesCompletadas={clase.sesiones_completadas || []}
                  horaInicial={clase.horaInicial}
                  horaFinal={clase.horaFinal}
                  onDateClick={(fecha, idHorarioMateria) => {
                    // Navegar directamente al detalle de la clase
                    if (idHorarioMateria) {
                      navigate(`/ambiente-virtual/clase/${idHorarioMateria}`);
                    }
                  }}
                />
              ) : (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                  No hay fechas disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Menu Lateral */}
        <div className="lg:col-span-3">
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
                    setIdGrado(clase?.idGrado ?? 1);
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
        <div className="lg:col-span-9">
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
                    // estadoClase para el botón de asistencia: usa SOLO fechas, día y horas del backend (sin jornada)
                    estadoClase: (getEstadoClase() === 'en_curso' || esPeriodoAsistencia()) ? 'EN_CURSO' : 'PENDIENTE',
                    idHorarioMateria: id ? parseInt(id) : undefined
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

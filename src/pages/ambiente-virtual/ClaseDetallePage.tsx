import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { Container } from '@/components/container';
import { ModalCrearActividad, ModalVerActividad, ModalMaterialApoyo, ModalCrearCuestionario, ListaActividades, type Actividad } from './actividades';
import { VerGruposView } from './grupos';

// Componente de Calendario
const CalendarComponent: React.FC<{ fechaInicio: string; fechaFin: string }> = ({
  fechaInicio,
  fechaFin
}) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // Si no hay fechas, usar el mes actual
  const initialDate = fechaInicio ? new Date(fechaInicio) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate);

  const inicio = fechaInicio ? new Date(fechaInicio) : null;
  const fin = fechaFin ? new Date(fechaFin) : null;

  const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
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

    if (date.getTime() === hoy.getTime()) {
      return 'hoy';
    }
    
    // Solo verificar si hay fechas de inicio y fin
    if (inicio && fin && date >= inicio && date <= fin) {
      if (date > hoy) {
        return 'proxima';
      }
      if (date < hoy) {
        return 'pasada';
      }
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
              className={`h-8 flex items-center justify-center text-sm rounded ${
                status === 'hoy'
                  ? 'bg-orange-200 text-orange-900 dark:bg-orange-500 dark:text-white font-semibold'
                  : status === 'proxima'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-400 dark:text-white'
                  : status === 'pasada'
                  ? 'bg-green-100 text-green-900 dark:bg-green-400 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
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

type MenuOption = 'estudiantes' | 'agregar-actividades' | 'actividades-asignadas' | 'juicios-evaluativos' | 'ver-grupos';

const ClaseDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEstudiante, setSearchEstudiante] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState<MenuOption>('estudiantes');
  const itemsPerPage = 11;

  // Actividades
  const [actividadesDisponibles, setActividadesDisponibles] = useState<Actividad[]>([]);
  const [actividadesAsignadas, setActividadesAsignadas] = useState<Actividad[]>([]);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [modalActividadOpen, setModalActividadOpen] = useState(false);
  const [modalVerActividadOpen, setModalVerActividadOpen] = useState(false);
  const [actividadEditar, setActividadEditar] = useState<Actividad | null>(null);
  const [actividadVer, setActividadVer] = useState<Actividad | null>(null);
  const [actividadMaterialApoyo, setActividadMaterialApoyo] = useState<Actividad | null>(null);
  const [modalMaterialApoyoOpen, setModalMaterialApoyoOpen] = useState(false);
  const [modalCuestionarioOpen, setModalCuestionarioOpen] = useState(false);
  const [cuestionarioEditar, setCuestionarioEditar] = useState<Actividad | null>(null);
  const [idMateriaFicha, setIdMateriaFicha] = useState<number | null>(null);

  useEffect(() => {
    const fetchMateriaFicha = async () => {
      if (!id) return;
      try {
        const res = await axios.get(`trimestres-ficha/${id}`);
        const data = Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.data ?? [];
        const primerTrimestre = data[0];
        const primeraMateria = primerTrimestre?.materias?.[0];
        if (primeraMateria?.id) setIdMateriaFicha(primeraMateria.id);
      } catch {
        setIdMateriaFicha(null);
      }
    };
    fetchMateriaFicha();
  }, [id]);

  const fetchActividades = useCallback(async () => {
    setLoadingActividades(true);
    try {
      const [disponiblesRes, asignadasRes] = await Promise.allSettled([
        axios.get('actividades').catch(() => ({ data: [] })),
        id ? axios.get(`planeacionactividades/ficha/${id}`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      const disp = disponiblesRes.status === 'fulfilled' && Array.isArray(disponiblesRes.value?.data) ? disponiblesRes.value.data : disponiblesRes.status === 'fulfilled' && disponiblesRes.value?.data?.data ? disponiblesRes.value.data.data : [];
      const asig = asignadasRes.status === 'fulfilled' && Array.isArray(asignadasRes.value?.data) ? asignadasRes.value.data : asignadasRes.status === 'fulfilled' && asignadasRes.value?.data?.data ? asignadasRes.value.data.data : [];
      setActividadesDisponibles(disp);
      setActividadesAsignadas(Array.isArray(asig) ? asig.filter((a: any) => a.actividad || a) : []);
    } catch (e) {
      console.warn('Error cargando actividades:', e);
    } finally {
      setLoadingActividades(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeMenu === 'agregar-actividades' || activeMenu === 'actividades-asignadas') {
      fetchActividades();
    }
  }, [activeMenu, fetchActividades]);

  useEffect(() => {
    const fetchFicha = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await axios.get(`fichas/${id}`);
        setFicha(response.data);
        
        // Aquí deberías hacer una llamada para obtener los estudiantes de la ficha
        // Por ahora usamos un array vacío
        setEstudiantes([]);
      } catch (error) {
        console.error('Error al cargar la ficha:', error);
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
    if (ficha?.horarios && ficha.horarios.length > 0) {
      return ficha.horarios.length;
    }
    if (ficha?.asignacion?.fechaInicialClases && ficha?.asignacion?.fechaFinalClases) {
      const inicio = new Date(ficha.asignacion.fechaInicialClases);
      const fin = new Date(ficha.asignacion.fechaFinalClases);
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.ceil((diffDays / 7) * 3.5);
    }
    return 0;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
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

  const getJornadaType = (nombreJornada: string): string => {
    const lower = nombreJornada?.toLowerCase() || '';
    if (lower.includes('mañana') || lower.includes('manana')) return 'Mañana';
    if (lower.includes('tarde')) return 'Tarde';
    if (lower.includes('noche')) return 'Noche';
    return nombreJornada || 'N/A';
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

  const nombreCompletoInstructor = ficha.instructorLider?.persona
    ? `${ficha.instructorLider.persona.nombre1} ${ficha.instructorLider.persona.nombre2 || ''} ${ficha.instructorLider.persona.apellido1} ${ficha.instructorLider.persona.apellido2 || ''}`.trim()
    : 'Sin asignar';

  const emailInstructor = ficha.instructorLider?.persona?.email || 'N/A';

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
                {ficha.asignacion?.programa?.nombrePrograma || 'Sin programa'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {ficha.asignacion?.programa?.nombrePrograma || 'Programa académico'}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Left Column: Instructor and Date/Time */}
          <div className="lg:col-span-1 space-y-4">
            {/* Instructor Card */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Instructor</h2>
              {ficha.instructorLider?.persona ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      {/* Círculo de progreso */}
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        {/* Círculo gris de fondo */}
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        {/* Círculo rojo de progreso (aproximadamente 20% del círculo) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3"
                          strokeDasharray="20 100"
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Foto del instructor */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img
                          src={ficha.instructorLider.persona.rutaFotoUrl || '/media/avatars/blank.png'}
                          alt={nombreCompletoInstructor}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-600"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {nombreCompletoInstructor}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {emailInstructor}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <KeenIcon icon="time" className="text-red-500 text-sm" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">00:07 / 05:00</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      Iniciando
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">No hay instructor asignado</p>
              )}
              </div>
            </div>

            {/* Date and Time Card */}
            {ficha.asignacion?.fechaInicialClases && ficha.asignacion?.fechaFinalClases && (
              <div className="card">
                <div className="card-body">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Fecha y Hora</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <KeenIcon icon="calendar" className="text-green-600 dark:text-green-400 text-sm" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Fecha de Inicio</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {formatDate(ficha.asignacion.fechaInicialClases)}
                      </p>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                        Hora inicio: {ficha.jornada?.horaInicial || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <KeenIcon icon="calendar" className="text-red-600 dark:text-red-400 text-sm" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Fecha de Fin</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {formatDate(ficha.asignacion.fechaFinalClases)}
                      </p>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                        Hora fin: {ficha.jornada?.horaFinal || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Calendar */}
          <div className="lg:col-span-2 flex justify-end">
            <div className="card w-full max-w-md">
              <div className="card-body p-3">
                <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                  Calendario de Clases
                </h2>
              <CalendarComponent
                fechaInicio={ficha.asignacion?.fechaInicialClases || ''}
                fechaFin={ficha.asignacion?.fechaFinalClases || ''}
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
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors border border-transparent ${
                    activeMenu === 'estudiantes'
                      ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                  }`}
                >
                  <KeenIcon icon="users" className={`text-base ${activeMenu === 'estudiantes' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>Estudiantes</span>
                </button>
                <button
                  onClick={() => setActiveMenu('agregar-actividades')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors border border-transparent ${
                    activeMenu === 'agregar-actividades'
                      ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                  }`}
                >
                  <KeenIcon icon="plus-circle" className={`text-base ${activeMenu === 'agregar-actividades' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>Agregar Actividades</span>
                </button>
                <button
                  onClick={() => setActiveMenu('actividades-asignadas')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors border border-transparent ${
                    activeMenu === 'actividades-asignadas'
                      ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                  }`}
                >
                  <KeenIcon icon="check-squared" className={`text-base ${activeMenu === 'actividades-asignadas' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>Actividades Asignadas</span>
                </button>
                <button
                  onClick={() => setActiveMenu('juicios-evaluativos')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors border border-transparent ${
                    activeMenu === 'juicios-evaluativos'
                      ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                  }`}
                >
                  <KeenIcon icon="chart-simple" className={`text-base ${activeMenu === 'juicios-evaluativos' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>Juicios Evaluativos</span>
                </button>
                <button
                  onClick={() => setActiveMenu('ver-grupos')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors border border-transparent ${
                    activeMenu === 'ver-grupos'
                      ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                  }`}
                >
                  <KeenIcon icon="users" className={`text-base ${activeMenu === 'ver-grupos' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>Ver grupos</span>
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
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Buscar estudiante..."
                      value={searchEstudiante}
                      onChange={(e) => {
                        setSearchEstudiante(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="input flex-1 text-xs"
                    />
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                      <KeenIcon icon="clipboard" className="text-sm" />
                      <span>Llamado a lista</span>
                    </button>
                  </div>

                  {paginatedEstudiantes.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        {paginatedEstudiantes.map((estudiante) => {
                          const nombreCompleto = estudiante.persona
                            ? `${estudiante.persona.nombre1} ${estudiante.persona.nombre2 || ''} ${estudiante.persona.apellido1} ${estudiante.persona.apellido2 || ''}`.trim()
                            : 'Sin nombre';
                          const isOnline = estudiante.estado === 'EN LÍNEA' || estudiante.estado === 'ONLINE';

                          return (
                            <div
                              key={estudiante.id}
                              className="bg-gray-50 dark:bg-coal-300 rounded-lg p-3 border border-gray-200 dark:border-gray-900"
                            >
                              <div className="text-center">
                                <img
                                  src={estudiante.persona?.rutaFotoUrl || '/media/avatars/blank.png'}
                                  alt={nombreCompleto}
                                  className="w-12 h-12 rounded-full object-cover mx-auto mb-1.5"
                                />
                                <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                                  {nombreCompleto}
                                </p>
                                <p
                                  className={`text-[10px] font-medium mb-2 ${
                                    isOnline
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {isOnline ? 'EN LÍNEA' : 'DESCONECTADO'}
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                  <button className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    <KeenIcon icon="profile-user" className="text-gray-600 dark:text-gray-400 text-xs" />
                                  </button>
                                  <button className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    <KeenIcon icon="eye" className="text-gray-600 dark:text-gray-400 text-xs" />
                                  </button>
                                  <button className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    <KeenIcon icon="graduation" className="text-gray-600 dark:text-gray-400 text-xs" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Paginación */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Mostrando {(currentPage - 1) * itemsPerPage + 1}-
                            {Math.min(currentPage * itemsPerPage, filteredEstudiantes.length)} de{' '}
                            {filteredEstudiantes.length}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <KeenIcon icon="users" className="text-4xl text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchEstudiante ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Agregar Actividades Section */}
              {activeMenu === 'agregar-actividades' && (
                <ListaActividades
                  actividades={actividadesDisponibles}
                  loading={loadingActividades}
                  modo="agregar"
                  onVer={(act) => {
                    setActividadVer(act);
                    setModalVerActividadOpen(true);
                  }}
                  onMaterialApoyo={(act) => {
                    setActividadMaterialApoyo(act);
                    setModalMaterialApoyoOpen(true);
                  }}
                  onCrear={() => {
                    setActividadEditar(null);
                    setModalActividadOpen(true);
                  }}
                  onCrearCuestionario={() => {
                    setCuestionarioEditar(null);
                    setModalCuestionarioOpen(true);
                  }}
                  onAsignar={async (act) => {
                    if (!id || !act.id || !act.idMateria) return;
                    try {
                      const planeacionRes = await axios.get(`planeacion/ficha/${id}`);
                      const idPlaneacion = planeacionRes.data?.id ?? planeacionRes.data;
                      if (!idPlaneacion) {
                        console.warn('No se encontró planeación para esta ficha');
                        return;
                      }
                      await axios.post('planeacionactividades', {
                        idActividad: act.id,
                        idMateria: act.idMateria,
                        idPlaneacion
                      });
                      fetchActividades();
                    } catch (e) {
                      console.warn('Error asignando actividad:', e);
                    }
                  }}
                  onEditar={(act) => {
                    if (act.tipoActividad === 'cuestionario') {
                      setCuestionarioEditar(act);
                      setModalCuestionarioOpen(true);
                    } else {
                      setActividadEditar(act);
                      setModalActividadOpen(true);
                    }
                  }}
                  onEliminar={async (act) => {
                    if (!act.id || !window.confirm('¿Eliminar esta actividad?')) return;
                    try {
                      await axios.delete(`actividades/${act.id}`);
                      fetchActividades();
                    } catch (e: any) {
                      const msg = e.response?.data?.error || e.message || 'Error al eliminar';
                      alert(msg);
                    }
                  }}
                />
              )}

              {/* Actividades Asignadas Section */}
              {activeMenu === 'actividades-asignadas' && (
                <ListaActividades
                  actividades={actividadesAsignadas}
                  loading={loadingActividades}
                  modo="asignadas"
                  onVer={(act) => {
                    setActividadVer(act);
                    setModalVerActividadOpen(true);
                  }}
                  onMaterialApoyo={(act) => {
                    setActividadMaterialApoyo(act);
                    setModalMaterialApoyoOpen(true);
                  }}
                  onCrearCuestionario={() => {
                    setCuestionarioEditar(null);
                    setModalCuestionarioOpen(true);
                  }}
                  onQuitar={async (idPlaneacionActividad) => {
                    if (!window.confirm('¿Quitar esta actividad de la clase?')) return;
                    try {
                      await axios.delete(`planeacionactividades/${idPlaneacionActividad}`);
                      fetchActividades();
                    } catch (e) {
                      console.warn('Error quitando actividad:', e);
                    }
                  }}
                  onEditar={(act) => {
                    if (act.tipoActividad === 'cuestionario') {
                      setCuestionarioEditar(act);
                      setModalCuestionarioOpen(true);
                    } else {
                      setActividadEditar(act);
                      setModalActividadOpen(true);
                    }
                  }}
                />
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

              {/* Ver grupos Section */}
              {activeMenu === 'ver-grupos' && id && (
                <VerGruposView
                  idFicha={id}
                  fechaFinalClases={ficha?.asignacion?.fechaFinalClases}
                />
              )}
              </div>
            </div>
          </div>
        </div>

        <ModalCrearActividad
          open={modalActividadOpen}
          onClose={() => {
            setModalActividadOpen(false);
            setActividadEditar(null);
          }}
          onSave={fetchActividades}
          actividadEditar={actividadEditar}
          idMateria={idMateriaFicha ?? undefined}
        />
        <ModalVerActividad
          open={modalVerActividadOpen}
          onClose={() => {
            setModalVerActividadOpen(false);
            setActividadVer(null);
          }}
          actividad={actividadVer}
        />
        <ModalMaterialApoyo
          open={modalMaterialApoyoOpen}
          onClose={() => {
            setModalMaterialApoyoOpen(false);
            setActividadMaterialApoyo(null);
          }}
          actividad={actividadMaterialApoyo}
        />
        <ModalCrearCuestionario
          open={modalCuestionarioOpen}
          onClose={() => {
            setModalCuestionarioOpen(false);
            setCuestionarioEditar(null);
          }}
          onSave={fetchActividades}
          idMateria={idMateriaFicha ?? undefined}
          cuestionarioEditar={cuestionarioEditar}
        />
    </Container>
  );
};

export default ClaseDetallePage;

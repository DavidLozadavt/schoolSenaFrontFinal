import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthContext } from '@/auth/useAuthContext';
import { KeenIcon } from '@/components/keenicons';
import MultimediaCapsulas from '@/components/capsulas/MultimediaCapsulas';
import EventsDashboard from '@/components/capsulas/EventsDashboard';

// --- Interfaces de Datos ---
interface AreaAsistencia {
  idArea: number;
  nombreArea: string;
  asistencias: number;
  inasistencias: number;
  justificadas: number;
  total: number;
  porcentaje: number;
}

interface ResumenAsistencia {
  asistenciaGeneral: number;
  totalAsistencias: number;
  totalInasistencias: number;
  totalJustificadas: number;
  totalRegistros: number;
}

interface DashboardAsistencia {
  areas: AreaAsistencia[];
  resumen: ResumenAsistencia;
}

interface ActividadAprendiz {
  idCalificacionActividad: number;
  tituloActividad: string;
  estadoVisual: 'CALIFICADO' | 'POR_EVALUAR' | 'PENDIENTE' | 'SIN_ENTREGAR' | 'CORRECCION_SOLICITADA';
  fechaFinal?: string | null;
  fechaVencida?: boolean;
  materia?: { nombreMateria?: string };
}

// --- Normalización de Clases (Igual que en MisClases.tsx) ---
interface Sesion {
  fecha: string;
  horaInicial: string;
  horaFinal: string;
  estado: string;
}

interface MateriaNormalizada {
  idMateria: number;
  materia_nombre: string;
  profesor_nombre: string;
  aula_nombre: string;
  sesiones: Sesion[];
  sesiones_completadas: number;
}

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return v;
  const n = parseInt(String(v), 10);
  return isNaN(n) ? 0 : n;
};

const normalizarSesion = (s: Record<string, unknown>): Sesion => ({
  fecha: typeof s.fecha === 'string' ? s.fecha : '',
  horaInicial: typeof s.horaInicial === 'string' ? s.horaInicial.substring(0, 5) : '',
  horaFinal: typeof s.horaFinal === 'string' ? s.horaFinal.substring(0, 5) : '',
  estado: typeof s.estado === 'string' ? s.estado : 'PENDIENTE',
});

const normalizarMateria = (raw: Record<string, unknown>): MateriaNormalizada => ({
  idMateria: toNum(raw.idMateria),
  materia_nombre: typeof raw.materia_nombre === 'string' ? raw.materia_nombre : '',
  profesor_nombre: typeof raw.profesor_nombre === 'string' ? raw.profesor_nombre : '',
  aula_nombre: typeof raw.aula_nombre === 'string' ? raw.aula_nombre : '',
  sesiones_completadas: toNum(raw.sesiones_completadas),
  sesiones: Array.isArray(raw.sesiones) ? (raw.sesiones as Record<string, unknown>[]).map(normalizarSesion) : [],
});

const normalizarClases = (data: unknown[]): MateriaNormalizada[] => {
  if (!Array.isArray(data)) return [];
  const mapa = new Map<number, MateriaNormalizada>();
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue;
    const materia = normalizarMateria(raw as Record<string, unknown>);
    const existente = mapa.get(materia.idMateria);
    if (!existente) {
      mapa.set(materia.idMateria, materia);
      continue;
    }
    if (materia.sesiones.length > existente.sesiones.length) {
      mapa.set(materia.idMateria, materia);
    } else if (materia.sesiones.length === existente.sesiones.length && materia.sesiones_completadas > existente.sesiones_completadas) {
      mapa.set(materia.idMateria, materia);
    }
  }
  return Array.from(mapa.values());
};

// --- Helpers de Fecha ---
function fmtFecha(v?: string | null) {
  if (!v) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(v));
  } catch { return v; }
}

const formatearFechaDia = (fechaStr: string): string => {
  if (!fechaStr) return '';
  try {
    const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `${dias[fecha.getDay()]}, ${fecha.getDate()}`;
  } catch { return fechaStr; }
};

// --- Transformaciones de Dashboard ---
function transformGroupedToDashboard(groupedData: Record<string, any>): DashboardAsistencia {
  const areasMap: Record<string, AreaAsistencia> = {};
  let totalAsistencias = 0;
  let totalInasistencias = 0;
  let totalRegistros = 0;

  Object.entries(groupedData).forEach(([clave, materiaData]) => {
    const resMateria = materiaData.resumen || { asistio: 0, falto: 0, totalSesiones: 0 };
    const areaNombre = materiaData.areaConocimiento || 'Sin Área';

    if (!areasMap[areaNombre]) {
      areasMap[areaNombre] = {
        idArea: materiaData.idMateria || 0,
        nombreArea: areaNombre,
        asistencias: 0,
        inasistencias: 0,
        justificadas: 0,
        total: 0,
        porcentaje: 0
      };
    }
    areasMap[areaNombre].asistencias += resMateria.asistio;
    areasMap[areaNombre].inasistencias += resMateria.falto;
    areasMap[areaNombre].total += resMateria.totalSesiones;

    totalAsistencias += resMateria.asistio;
    totalInasistencias += resMateria.falto;
    totalRegistros += resMateria.totalSesiones;
  });

  const areas = Object.values(areasMap).map(area => ({
    ...area,
    porcentaje: area.total > 0 ? Math.round((area.asistencias / area.total) * 100) : 0
  }));

  const asistenciaGeneral = totalRegistros > 0 ? Math.round((totalAsistencias / totalRegistros) * 100) : 0;

  return {
    areas,
    resumen: { asistenciaGeneral, totalAsistencias, totalInasistencias, totalJustificadas: 0, totalRegistros }
  };
}

interface UpcomingSession {
  id: string;
  materia: string;
  fechaStr: string;
  fechaObj: Date;
  horaInicial: string;
  horaFinal: string;
  estado: string;
  profesor: string;
  aula: string;
}

function extractAllSessions(materias: MateriaNormalizada[]): UpcomingSession[] {
  const allSessions: UpcomingSession[] = [];

  materias.forEach(mat => {
    mat.sesiones.forEach((s, idx) => {
      if (!s.fecha) return;
      const [year, month, day] = s.fecha.split('T')[0].split('-').map(Number);
      const sDate = new Date(year, month - 1, day);

      allSessions.push({
        id: `${mat.idMateria}-${s.fecha}-${s.horaInicial}-${idx}`,
        materia: mat.materia_nombre || 'Materia sin nombre',
        fechaStr: s.fecha.split('T')[0],
        fechaObj: sDate,
        horaInicial: s.horaInicial,
        horaFinal: s.horaFinal,
        estado: s.estado,
        profesor: mat.profesor_nombre,
        aula: mat.aula_nombre
      });
    });
  });

  allSessions.sort((a, b) => {
    if (a.fechaStr !== b.fechaStr) return a.fechaStr.localeCompare(b.fechaStr);
    return a.horaInicial.localeCompare(b.horaInicial);
  });

  return allSessions;
}

const ESTADO_CFG: Record<string, { label: string; color: string; icon: string }> = {
  CALIFICADO: { label: 'Calificado', color: 'text-success bg-success/10', icon: 'check-circle' },
  POR_EVALUAR: { label: 'Por evaluar', color: 'text-warning bg-warning/10', icon: 'time' },
  PENDIENTE: { label: 'Pendiente', color: 'text-primary bg-primary/10', icon: 'information-2' },
  SIN_ENTREGAR: { label: 'Vencida', color: 'text-danger bg-danger/10', icon: 'cross-circle' },
  CORRECCION_SOLICITADA: { label: 'Corrección', color: 'text-purple-600 bg-purple-100', icon: 'refresh' },
};



// === MAIN DASHBOARD COMPONENT ===
const EstudiantesContent: React.FC = () => {
  const { user, persona } = useAuthContext();
  const userName = persona
    ? [persona.nombre1, persona.nombre2, persona.apellido1, persona.apellido2].filter(Boolean).join(' ')
    : (user?.persona
      ? [user.persona.nombre1, user.persona.nombre2, user.persona.apellido1, user.persona.apellido2].filter(Boolean).join(' ')
      : 'Aprendiz');
  const matriculaActiva = persona?.matriculas?.find((m:any) => m.estado === 'ACTIVO' || m.estado === 'ACTIVA') || persona?.matriculas?.[0];
  const fichaObj = user?.ficha || matriculaActiva?.ficha;
  const userFicha = fichaObj?.codigo ? `Ficha ${fichaObj.codigo}` : '';

  const [asistencia, setAsistencia] = useState<DashboardAsistencia | null>(null);
  const [actividades, setActividades] = useState<ActividadAprendiz[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  
  // Calendario state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resAsis, resActs, resClases] = await Promise.all([
          axios.get('mis-asistencias-generales').catch(() => ({ data: { data: {} } })),
          axios.get('actividades-aprendiz', { params: { per_page: 1000 } }).catch(() => ({ data: { data: [] } })),
          axios.get('fichas/estudiante/clases').catch(() => ({ data: { data: [] } }))
        ]);

        setAsistencia(transformGroupedToDashboard(resAsis.data?.data ?? {}));
        setActividades(Array.isArray(resActs.data?.data) ? resActs.data.data : []);

        // Usar normalizador idéntico al de MisClases para garantizar que las sesiones se procesen bien
        const materiasNormalizadas = normalizarClases(resClases.data?.data ?? []);
        setUpcomingSessions(extractAllSessions(materiasNormalizadas));

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pctGeneral = asistencia?.resumen.asistenciaGeneral ?? 0;
  const pendientes = actividades.filter((a) => a.estadoVisual === 'PENDIENTE').length;
  const vencidas = actividades.filter((a) => a.estadoVisual === 'SIN_ENTREGAR').length;
  const presentadas = actividades.filter((a) => a.estadoVisual === 'POR_EVALUAR').length;
  const calificadas = actividades.filter((a) => a.estadoVisual === 'CALIFICADO').length;
  const correcciones = actividades.filter((a) => a.estadoVisual === 'CORRECCION_SOLICITADA').length;

  const actAlerta = actividades.filter(a => a.estadoVisual === 'PENDIENTE' || a.estadoVisual === 'CORRECCION_SOLICITADA').sort((a, b) => {
    if (!a.fechaFinal) return 1;
    if (!b.fechaFinal) return -1;
    return new Date(a.fechaFinal).getTime() - new Date(b.fechaFinal).getTime();
  }).slice(0, 5);

  // Funciones y variables del calendario
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Lunes = 0
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const sessionsByDate = React.useMemo(() => {
    const map: Record<string, UpcomingSession[]> = {};
    upcomingSessions.forEach(s => {
      if (!map[s.fechaStr]) map[s.fechaStr] = [];
      map[s.fechaStr].push(s);
    });
    return map;
  }, [upcomingSessions]);

  const weeklySessions = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    return upcomingSessions.filter(s => s.fechaObj >= today && s.fechaObj <= endOfWeek);
  }, [upcomingSessions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500 text-sm font-medium">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-8 animate-fade-in">

      {/* HEADER FLAT LAYOUT */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">¡Hola, {userName}!</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">{userFicha}</p>
        </div>

        <div className="flex bg-white dark:bg-coal-400 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 gap-6 items-center">
          <div className="flex items-center gap-3 pr-6 border-r border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
              <KeenIcon icon="chart-pie-simple" className="text-2xl" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Asistencia</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{pctGeneral}%</p>
            </div>
          </div>
          <div className="flex gap-6 pr-2">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Presente</p>
              <p className="text-base font-black text-success leading-none">{asistencia?.resumen.totalAsistencias ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Faltas</p>
              <p className="text-base font-black text-danger leading-none">{asistencia?.resumen.totalInasistencias ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* REELS SECTION */}
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <KeenIcon icon="youtube" className="text-primary" /> C{"\u00E1"}psulas SENA
          </h2>
        </div>
        <MultimediaCapsulas />
      </div>

      {/* EVENTOS SECTION */}
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <KeenIcon icon="calendar-8" className="text-primary" /> Eventos
          </h2>
        </div>
        <EventsDashboard />
      </div>

      {/* TWO COLUMNS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* AGENDA / CLASES */}
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <KeenIcon icon="calendar-8" className="text-primary" /> Mi Calendario
            </h2>
            <div className="flex bg-gray-100 dark:bg-coal-500 rounded-lg p-1 self-start sm:self-auto">
              <button onClick={() => setCalendarView('month')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${calendarView === 'month' ? 'bg-white dark:bg-coal-300 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Mes</button>
              <button onClick={() => setCalendarView('week')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${calendarView === 'week' ? 'bg-white dark:bg-coal-300 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Semana</button>
            </div>
          </div>

          <div className="bg-white dark:bg-coal-400 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col min-h-[300px]">
            {calendarView === 'month' ? (
              <>
                {/* Controles del calendario */}
                <div className="flex items-center justify-between mb-2">
                  <button onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-coal-500 flex items-center justify-center text-gray-600 dark:text-gray-300">
                    <KeenIcon icon="left" />
                  </button>
                  <h3 className="font-bold text-gray-900 dark:text-white capitalize">{monthNames[month]} {year}</h3>
                  <button onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-coal-500 flex items-center justify-center text-gray-600 dark:text-gray-300">
                    <KeenIcon icon="right" />
                  </button>
                </div>
                
                {/* Grid del calendario */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase mb-2">
                  <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 flex-1">
                  {blanks.map(b => <div key={`blank-${b}`} className="h-8 md:h-10" />)}
                  {daysArray.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const daySessions = sessionsByDate[dateStr] || [];
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                    
                    return (
                      <div 
                        key={day} 
                        className={`relative h-8 md:h-10 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer group ${
                          isToday ? "bg-primary text-white font-black shadow-md shadow-primary/30" : 
                          "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-500 font-medium"
                        } ${daySessions.length > 0 && !isToday ? "bg-blue-50/50 dark:bg-coal-500/50 font-bold" : ""}`}
                      >
                        <span className="z-10">{day}</span>
                        
                        {daySessions.length > 0 && (
                          <div className="absolute bottom-1.5 flex gap-1 z-10">
                            {daySessions.slice(0, 3).map((_, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-primary'}`} />
                            ))}
                          </div>
                        )}
                        
                        {/* Tooltip con información de clases al hacer hover */}
                        {daySessions.length > 0 && (
                          <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 dark:bg-black text-white text-left text-xs rounded-xl p-3 shadow-2xl pointer-events-none border border-gray-700">
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 dark:bg-black rotate-45 border-r border-b border-gray-700"></div>
                            <p className="font-bold border-b border-gray-700 pb-1.5 mb-1.5 uppercase text-[10px] text-gray-400">
                              {day} de {monthNames[month]}
                            </p>
                            <div className="space-y-2">
                              {daySessions.map(s => (
                                <div key={s.id} className="bg-gray-800 rounded p-1.5">
                                  <p className="font-bold text-blue-300 line-clamp-1">{s.materia}</p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-gray-300 mt-1">
                                    <span className="flex items-center gap-0.5"><KeenIcon icon="time" /> {s.horaInicial}</span>
                                    <span className="flex items-center gap-0.5 truncate"><KeenIcon icon="geolocation" /> {s.aula}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Próximos 7 días</h3>
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">
                    {weeklySessions.length} clases
                  </span>
                </div>
                
                {weeklySessions.length > 0 ? (
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
                    {weeklySessions.map(session => {
                      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                      const isToday = session.fechaObj.toDateString() === new Date().toDateString();
                      return (
                        <div key={session.id} className="flex items-stretch gap-3 group">
                          <div className="flex flex-col items-center justify-center w-12 shrink-0 bg-gray-50 dark:bg-coal-500/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">{dias[session.fechaObj.getDay()]}</span>
                            <span className={`text-lg font-black leading-none ${isToday ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>{session.fechaObj.getDate()}</span>
                          </div>
                          
                          <div className="flex-1 bg-white dark:bg-coal-400 rounded-xl p-3 border border-gray-100 dark:border-gray-800 group-hover:border-primary/30 transition-colors shadow-sm">
                            <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-1">
                              {session.materia}
                            </h3>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                              <span className="flex items-center gap-1"><KeenIcon icon="time" /> {session.horaInicial} - {session.horaFinal}</span>
                              <span className="flex items-center gap-1 truncate"><KeenIcon icon="geolocation" /> {session.aula}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <KeenIcon icon="coffee" className="text-4xl text-gray-300 mb-3" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Semana libre</h3>
                    <p className="text-xs text-gray-500 mt-1">No tienes clases programadas para los próximos 7 días.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ACTIVIDADES */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <KeenIcon icon="notepad-edit" className="text-primary" /> Actividades
            </h2>
            <a href="/ambiente-virtual/actividades" className="text-sm font-bold text-primary hover:underline transition-all">Ir a actividades</a>
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            <div className="bg-white dark:bg-coal-400 rounded-xl p-2 shadow-sm border border-gray-100 dark:border-gray-800 text-center flex flex-col justify-center group hover:border-gray-300 transition-colors">
              <p className="text-[9px] font-bold text-gray-500 uppercase mb-1 leading-none">Todas</p>
              <p className="text-base font-black text-gray-900 dark:text-white leading-none">{actividades.length}</p>
            </div>
            <div className="bg-white dark:bg-coal-400 rounded-xl p-2 shadow-sm border border-gray-100 dark:border-gray-800 text-center flex flex-col justify-center group hover:border-gray-300 transition-colors">
              <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 leading-none">Pendientes</p>
              <p className="text-base font-black text-gray-900 dark:text-white leading-none">{pendientes}</p>
            </div>
            <div className="bg-white dark:bg-coal-400 rounded-xl p-2 shadow-sm border border-gray-100 dark:border-gray-800 text-center flex flex-col justify-center group hover:border-danger/30 transition-colors">
              <p className="text-[9px] font-bold text-danger uppercase mb-1 leading-none">Sin entregar</p>
              <p className="text-base font-black text-danger leading-none">{vencidas}</p>
            </div>
            <div className="bg-white dark:bg-coal-400 rounded-xl p-2 shadow-sm border border-gray-100 dark:border-gray-800 text-center flex flex-col justify-center group hover:border-warning/30 transition-colors">
              <p className="text-[9px] font-bold text-warning uppercase mb-1 leading-none">Por evaluar</p>
              <p className="text-base font-black text-warning leading-none">{presentadas}</p>
            </div>
            <div className="bg-white dark:bg-coal-400 rounded-xl p-2 shadow-sm border border-gray-100 dark:border-gray-800 text-center flex flex-col justify-center group hover:border-success/30 transition-colors">
              <p className="text-[9px] font-bold text-success uppercase mb-1 leading-none">Calificadas</p>
              <p className="text-base font-black text-success leading-none">{calificadas}</p>
            </div>
            <div className="bg-white dark:bg-coal-400 rounded-xl p-2 shadow-sm border border-gray-100 dark:border-gray-800 text-center flex flex-col justify-center group hover:border-purple-300 transition-colors">
              <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-1 leading-none">Corrección</p>
              <p className="text-base font-black text-purple-600 dark:text-purple-400 leading-none">{correcciones}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-coal-400 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-4 min-h-[220px]">
            {actAlerta.length > 0 ? (
              <div className="flex flex-col gap-3">
                {actAlerta.map(act => {
                  const cfg = ESTADO_CFG[act.estadoVisual] || ESTADO_CFG['PENDIENTE'];
                  const isVencida = act.estadoVisual === 'SIN_ENTREGAR' || act.fechaVencida;

                  return (
                    <div key={act.idCalificacionActividad} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow">
                      <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${cfg.color}`}>
                        <KeenIcon icon={cfg.icon} className="text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate mb-0.5">{act.tituloActividad}</h4>
                        <div className="text-xs text-gray-500 truncate">{act.materia?.nombreMateria || 'General'}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className={`text-[10px] font-bold ${isVencida ? 'text-danger' : 'text-gray-400'}`}>
                          {fmtFecha(act.fechaFinal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <KeenIcon icon="check-circle" className="text-4xl text-gray-300 mb-3" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">¡Estás al día!</h3>
                <p className="text-xs text-gray-500 mt-1">No tienes actividades pendientes por entregar.</p>
              </div>
            )}
          </div>
        </div>

      </div>


    </div>
  );
};

export default EstudiantesContent;
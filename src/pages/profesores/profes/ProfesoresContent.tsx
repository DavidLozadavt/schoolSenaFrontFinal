import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/auth/useAuthContext";
import { KeenIcon } from "@/components/keenicons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultadoPlano {
  idHorario: number;
  competencia: string;
  resultadoAprendizaje: string;
  horaInicial: string;
  horaFinal: string;
  fechaInicial: string;
  fechaFinal: string;
  idDia: number;
  duracionSesion: number;
  cantidadSesiones: number;
  duracionHoras: number;
}

function toIsoStartDate(date: string): string {
  return date.includes('T') ? date : `${date}T00:00:00`;
}

function safeDate(date: string): Date | null {
  const d = new Date(toIsoStartDate(date));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseIdDia(idDia: unknown): number | null {
  const raw = Number(idDia);
  if (!Number.isInteger(raw) || raw < 1 || raw > 7) return null;
  // En data: 1..7 (7 = Domingo). En JS Date: 0..6 (0 = Domingo).
  return raw === 7 ? 0 : raw;
}

function computeWeeklyOccurrencesInclusive(start: Date, end: Date, targetDay: number): number {
  // Calcula cuántas veces cae targetDay entre start..end inclusive.
  // start/end se asumen válidos.
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(23, 59, 59, 999);

  // Avanzar hasta el primer día objetivo dentro del rango.
  let current = new Date(s);
  let guard = 0;
  while (current.getDay() !== targetDay && current <= e) {
    current.setDate(current.getDate() + 1);
    guard++;
    if (guard > 7) break;
  }
  if (current > e) return 0;

  // Contar cada 7 días.
  let count = 0;
  guard = 0;
  while (current <= e) {
    count++;
    current.setDate(current.getDate() + 7);
    guard++;
    if (guard > 400) break; // safety (≈ >7 años)
  }
  return count;
}

function computeHorasFromHoraStrings(horaInicial?: string, horaFinal?: string): number | null {
  // Intenta derivar duración por sesión desde hh:mm:ss.
  if (!horaInicial || !horaFinal) return null;
  const [hi, mi] = horaInicial.split(':').map((x) => Number(x));
  const [hf, mf] = horaFinal.split(':').map((x) => Number(x));
  if ([hi, mi, hf, mf].some((n) => Number.isNaN(n))) return null;
  const startMin = hi * 60 + mi;
  const endMin = hf * 60 + mf;
  const diff = endMin - startMin;
  if (diff <= 0) return null;
  return diff / 60;
}

function deriveSesionesYHoras(rap: Pick<ResultadoPlano, 'fechaInicial' | 'fechaFinal' | 'idDia' | 'duracionSesion' | 'cantidadSesiones' | 'duracionHoras' | 'horaInicial' | 'horaFinal'>): {
  cantidadSesiones: number;
  duracionHoras: number;
} {
  const cantidadFromApi = Number(rap.cantidadSesiones ?? 0);
  const horasFromApi = Number(rap.duracionHoras ?? 0);

  // Si backend ya trae valores > 0, respetarlos.
  if (cantidadFromApi > 0 && horasFromApi > 0) {
    return { cantidadSesiones: cantidadFromApi, duracionHoras: horasFromApi };
  }

  const start = safeDate(rap.fechaInicial);
  const end = safeDate(rap.fechaFinal);
  const targetDay = parseIdDia(rap.idDia);
  if (!start || !end || targetDay === null) {
    return {
      cantidadSesiones: Math.max(0, cantidadFromApi),
      duracionHoras: Math.max(0, horasFromApi)
    };
  }

  const sesiones = computeWeeklyOccurrencesInclusive(start, end, targetDay);

  // Duración por sesión: preferir duracionSesion (horas), si no, derivar de horaInicial/horaFinal.
  const duracionSesionHoras =
    Number(rap.duracionSesion ?? 0) > 0
      ? Number(rap.duracionSesion)
      : computeHorasFromHoraStrings(rap.horaInicial, rap.horaFinal) ?? 0;

  const horas = sesiones * (duracionSesionHoras > 0 ? duracionSesionHoras : 0);

  return {
    cantidadSesiones: sesiones,
    duracionHoras: horas
  };
}

interface Ficha {
  idFicha: number;
  codigoFicha: string;
  programaFormacion: string;
  codigoPrograma: string;
  resultados: ResultadoPlano[];
}

interface Actividad {
  id: number;
  tituloActividad?: string;
  nombre?: string;
  titulo?: string;
  descripcionActividad?: string;
  descripcion?: string;
  estado?: string | { nombre?: string; estado?: string };
  fechaInicio?: string;
  fechaFin?: string;
  tipo_actividad?: { nombre?: string };
  materia?: { nombreMateria?: string };
}

const toNum = (v: unknown): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const toStr = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

const normalizarResultado = (raw: any): ResultadoPlano => ({
  idHorario: toNum(raw?.idHorario),
  competencia: toStr(raw?.competencia),
  resultadoAprendizaje: toStr(raw?.resultadoAprendizaje),
  horaInicial: toStr(raw?.horaInicial),
  horaFinal: toStr(raw?.horaFinal),
  fechaInicial: toStr(raw?.fechaInicial),
  fechaFinal: toStr(raw?.fechaFinal),
  idDia: toNum(raw?.idDia),
  duracionSesion: toNum(raw?.duracionSesion),
  cantidadSesiones: toNum(raw?.cantidadSesiones),
  duracionHoras: toNum(raw?.duracionHoras),
});

const normalizarFicha = (raw: any): Ficha => ({
  idFicha: toNum(raw?.idFicha),
  codigoFicha: toStr(raw?.codigoFicha),
  programaFormacion: toStr(raw?.programaFormacion),
  codigoPrograma: toStr(raw?.codigoPrograma),
  resultados: Array.isArray(raw?.resultados) ? raw.resultados.map(normalizarResultado) : [],
});

const normalizarActividad = (raw: any): Actividad => ({
  id: toNum(raw?.id ?? raw?.idActividad ?? raw?.idCalificacionActividad),
  tituloActividad: toStr(raw?.tituloActividad),
  nombre: toStr(raw?.nombre),
  titulo: toStr(raw?.titulo),
  descripcionActividad: toStr(raw?.descripcionActividad),
  descripcion: toStr(raw?.descripcion),
  estado: raw?.estado,
  fechaInicio: toStr(raw?.fechaInicio),
  fechaFin: toStr(raw?.fechaFin ?? raw?.fechaFinal),
  tipo_actividad: raw?.tipo_actividad,
  materia: raw?.materia,
});

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

function getInstructorSessions(fichas: Ficha[], currentMonth: Date): UpcomingSession[] {
  const sessions: UpcomingSession[] = [];
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month + 2, 0);

  for (const ficha of fichas) {
    for (const rap of (Array.isArray(ficha.resultados) ? ficha.resultados : [])) {
      if (!rap.fechaInicial || !rap.fechaFinal) {
        console.warn("RAP sin fechaInicial o fechaFinal", { ficha, rap });
        continue;
      }

      const rapStartStr = rap.fechaInicial.includes("T")
        ? rap.fechaInicial
        : `${rap.fechaInicial}T00:00:00`;

      const rapEndStr = rap.fechaFinal.includes("T")
        ? rap.fechaFinal
        : `${rap.fechaFinal}T00:00:00`;

      const rapStart = new Date(rapStartStr);
      const rapEnd = new Date(rapEndStr);

      if (isNaN(rapStart.getTime()) || isNaN(rapEnd.getTime())) {
        console.error("FECHA INVALIDA EN RAP", {
          codigoFicha: ficha.codigoFicha,
          programaFormacion: ficha.programaFormacion,
          rap,
          rapStartStr,
          rapEndStr,
          rapStart,
          rapEnd,
        });
        continue;
      }

      rapEnd.setHours(23, 59, 59, 999);

      const searchStart = new Date(
        Math.max(startDate.getTime(), rapStart.getTime())
      );

      const searchEnd = new Date(
        Math.min(endDate.getTime(), rapEnd.getTime())
      );

      if (isNaN(searchStart.getTime()) || isNaN(searchEnd.getTime())) {
        console.error("searchStart/searchEnd INVALIDO", {
          codigoFicha: ficha.codigoFicha,
          rap,
          startDate,
          endDate,
          rapStart,
          rapEnd,
          searchStart,
          searchEnd,
        });
        continue;
      }

      if (searchStart > searchEnd) {
        console.warn("RAP fuera del rango buscado", {
          codigoFicha: ficha.codigoFicha,
          rap,
          searchStart,
          searchEnd,
        });
        continue;
      }

      const rawIdDia = Number(rap.idDia);

      if (!Number.isInteger(rawIdDia) || rawIdDia < 1 || rawIdDia > 7) {
        console.error("idDia INVALIDO EN RAP", {
          codigoFicha: ficha.codigoFicha,
          idDia: rap.idDia,
          rap,
        });
        continue;
      }

      const targetDay = rawIdDia === 7 ? 0 : rawIdDia;

      let current = new Date(searchStart);
      current.setHours(0, 0, 0, 0);

      console.log("Procesando RAP", {
        codigoFicha: ficha.codigoFicha,
        idHorario: rap.idHorario,
        idDia: rap.idDia,
        targetDay,
        fechaInicial: rap.fechaInicial,
        fechaFinal: rap.fechaFinal,
        searchStart,
        searchEnd,
        current,
      });

      let safetyDaySearch = 0;

      while (current.getDay() !== targetDay) {
        safetyDaySearch++;

        if (safetyDaySearch > 7) {
          console.error("LOOP DETENIDO buscando targetDay", {
            codigoFicha: ficha.codigoFicha,
            rap,
            targetDay,
            current,
            searchEnd,
          });
          break;
        }

        current.setDate(current.getDate() + 1);
      }

      if (current > searchEnd) {
        console.warn("No hay dia valido dentro del rango", {
          codigoFicha: ficha.codigoFicha,
          rap,
          targetDay,
          current,
          searchEnd,
        });
        continue;
      }

      let safetySessions = 0;

      while (current <= searchEnd) {
        safetySessions++;

        if (safetySessions > 60) {
          console.error("LOOP DETENIDO creando sesiones", {
            codigoFicha: ficha.codigoFicha,
            rap,
            current,
            searchEnd,
            safetySessions,
          });
          break;
        }

        const dateStr = `${current.getFullYear()}-${String(
          current.getMonth() + 1
        ).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;

        sessions.push({
          id: `${rap.idHorario}-${dateStr}`,
          materia: rap.competencia || ficha.programaFormacion,
          fechaStr: dateStr,
          fechaObj: new Date(current),
          horaInicial: rap.horaInicial ? rap.horaInicial.substring(0, 5) : "00:00",
          horaFinal: rap.horaFinal ? rap.horaFinal.substring(0, 5) : "00:00",
          estado: "PENDIENTE",
          profesor: "",
          aula: `Ficha ${ficha.codigoFicha}`,
        });

        current.setDate(current.getDate() + 7);
      }
    }
  }

  return sessions.sort((a, b) => {
    if (a.fechaStr !== b.fechaStr) return a.fechaStr.localeCompare(b.fechaStr);
    return a.horaInicial.localeCompare(b.horaInicial);
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const FICHA_BG = [
  "bg-blue-100 dark:bg-blue-900/30 border-blue-600 dark:border-blue-500",
  "bg-green-100 dark:bg-green-900/30 border-green-600 dark:border-green-500",
  "bg-orange-100 dark:bg-orange-900/30 border-orange-500 dark:border-orange-400",
  "bg-amber-100 dark:bg-amber-900/30 border-amber-500 dark:border-amber-400",
  "bg-gray-100 dark:bg-gray-800 border-gray-500 dark:border-gray-400",
];
const FICHA_TEXT = [
  "text-blue-600 dark:text-blue-400",
  "text-green-600 dark:text-green-400",
  "text-orange-600 dark:text-orange-400",
  "text-amber-600 dark:text-amber-400",
  "text-gray-600 dark:text-gray-400",
];

function fmtH(h: string) { return h ? h.substring(0, 5) : "-"; }

function getEstadoLabel(estado: Actividad["estado"]): string {
  if (!estado) return "SIN ESTADO";
  if (typeof estado === "string") return estado.toUpperCase();
  return (estado.nombre || estado.estado || "SIN ESTADO").toUpperCase();
}

function getTitulo(act: Actividad): string {
  return act.tituloActividad || act.titulo || act.nombre || "Sin nombre";
}


// ─── REELS DATA & COMPONENT ──────────────────────────────────────────────────

const PROFESOR_REELS = [
  { id: 1, title: 'Tips para React', views: '1.2k', duration: '0:45', img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop' },
  { id: 2, title: '¿Qué es Tailwind?', views: '850', duration: '1:00', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400&auto=format&fit=crop' },
  { id: 3, title: 'Rutas en Next.js', views: '2.3k', duration: '0:55', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400&auto=format&fit=crop' },
  { id: 4, title: 'Mejorar tu lógica', views: '3k', duration: '1:30', img: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=400&auto=format&fit=crop' },
  { id: 5, title: 'Git Principiantes', views: '5k', duration: '2:15', img: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=400&auto=format&fit=crop' },
];

const ProfesorReelsViewer = ({ reels, initialIndex, onClose }: { reels: any[], initialIndex: number, onClose: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const duration = 5000;

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (currentIndex < reels.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return p + (100 / (duration / 50));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, reels.length, onClose]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      setIsPlaying(true);
    } else {
      onClose();
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const currentReel = reels[currentIndex];

  if (!currentReel) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center animate-fade-in" onClick={onClose}>
      <button className="absolute top-6 right-6 text-white/50 hover:text-white p-2 z-[10000]" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onClose(); }}>
        <KeenIcon icon="cross" className="text-3xl" />
      </button>

      <div className="absolute top-4 left-0 right-0 px-4 flex gap-1 z-20 max-w-[450px] mx-auto">
        {reels.map((r, i) => (
          <div key={r.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-75"
              style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      <div
        className="w-full sm:w-[450px] h-full sm:h-[90vh] bg-gray-900 relative flex flex-col justify-center sm:rounded-lg overflow-hidden"
        onClick={togglePlay}
      >
        <img src={currentReel.img} className="absolute inset-0 w-full h-full object-cover" alt={currentReel.title} />

        <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-w-resize" onClick={handlePrev}></div>
        <div className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-e-resize" onClick={handleNext}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
              <KeenIcon icon="play" className="text-4xl ml-2" />
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 z-10 pointer-events-none">
          <h3 className="text-white font-bold text-xl mb-1">{currentReel.title}</h3>
          <p className="text-white/80 text-sm">Cápsulas formativas SENA</p>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const ProfesoresContent: React.FC = () => {
  const { user, persona } = useAuthContext();
  const userName = persona
    ? [persona.nombre1, persona.nombre2, persona.apellido1, persona.apellido2].filter(Boolean).join(' ')
    : (user?.persona
      ? [user.persona.nombre1, user.persona.nombre2, user.persona.apellido1, user.persona.apellido2].filter(Boolean).join(' ')
      : 'Instructor');

  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [fichasPage, setFichasPage] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [playingReelIndex, setPlayingReelIndex] = useState<number | null>(null);

  // ── Fichas del instructor (endpoint autónomo, sin params) ───────────────
  useEffect(() => {
    axios.get("instructores/mi-dashboard")
      .then((r) => {
        const d = r.data?.fichas ?? r.data ?? [];
        const normalizadas = Array.isArray(d) ? d.map(normalizarFicha) : [];
        setFichas(normalizadas);
      })
      .catch(() => setFichas([]));
  }, []);

  // ── Actividades por evaluar ──────────────────────────────────────────
  useEffect(() => {
    axios.get("actividades-por-evaluar")
      .then((r) => {
        const d = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setActividades(Array.isArray(d) ? d.map(normalizarActividad) : []);
      })
      .catch(() => setActividades([]));
  }, []);

  // Filtramos para asegurar que solo se muestren las enviadas
  const actividadesPorEvaluar = useMemo(() =>
    actividades.filter(act => {
      const label = getEstadoLabel(act.estado);
      return label === 'ENVIADO';
    }),
    [actividades]
  )

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalFichas = fichas.length;
  const totalRAPs = fichas.reduce((a, f) => a + (Array.isArray(f.resultados) ? f.resultados.length : 0), 0);

  // En producción algunos backends devuelven cantidadSesiones/duracionHoras en 0 aunque haya fechas/idDia.
  // Derivamos valores si vienen en 0 para que KPIs y calendario sean consistentes.
  const totalSesiones = fichas.reduce(
    (a, f) =>
      a +
      (Array.isArray(f.resultados)
        ? f.resultados.reduce((b, r) => b + deriveSesionesYHoras(r).cantidadSesiones, 0)
        : 0),
    0
  );
  const totalHoras = fichas.reduce(
    (a, f) =>
      a +
      (Array.isArray(f.resultados)
        ? f.resultados.reduce((b, r) => b + deriveSesionesYHoras(r).duracionHoras, 0)
        : 0),
    0
  );

  // ── Fichas en formación y Paginación ─────────────────────────────────────
  const fichasFormacion = useMemo(() => fichas.filter(f => Array.isArray(f.resultados) && f.resultados.length > 0), [fichas]);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(fichasFormacion.length / itemsPerPage);
  const currentFichas = fichasFormacion.slice((fichasPage - 1) * itemsPerPage, fichasPage * itemsPerPage);

  // ── Conteos de Actividades ────────────────────────────────────────────────
  const vencidas = useMemo(() => actividades.filter(act => act.fechaFin && new Date(act.fechaFin) < new Date()).length, [actividades]);
  const pendientes = useMemo(() => actividades.filter(act => getEstadoLabel(act.estado) === 'PENDIENTE').length, [actividades]);
  const porCalificar = actividadesPorEvaluar.length;

  // ── Calendario ────────────────────────────────────────────────────────────
  const upcomingSessions = useMemo(() => getInstructorSessions(fichas, currentMonth), [fichas, currentMonth]);

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

  const sessionsByDate = useMemo(() => {
    const map: Record<string, UpcomingSession[]> = {};
    upcomingSessions.forEach(s => {
      if (!map[s.fechaStr]) map[s.fechaStr] = [];
      map[s.fechaStr].push(s);
    });
    return map;
  }, [upcomingSessions]);

  const weeklySessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    return upcomingSessions.filter(s => s.fechaObj >= today && s.fechaObj <= endOfWeek);
  }, [upcomingSessions]);

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      <header className="mb-2">
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight flex items-baseline gap-2">
          Dashboard de <span className="text-blue-600 dark:text-blue-400">Instructor</span>
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Bienvenido, <span className="text-gray-900 dark:text-gray-200 font-bold">{userName}</span>
        </p>
      </header>

      {/* ══ REELS SECTION (Full width) ══ */}
      <section className="w-full space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-red-500 rounded-full"></div>
          <h2 className="text-sm font-extrabold text-gray-800 dark:text-white uppercase tracking-wider">
            Cápsulas SENA
          </h2>
        </div>
        <div className="bg-white dark:bg-coal-400 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-3 w-full">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {PROFESOR_REELS.map((reel, idx) => (
              <div
                key={reel.id}
                onClick={() => setPlayingReelIndex(idx)}
                className="relative shrink-0 w-[112px] sm:w-[128px] md:w-[140px] aspect-[9/16] rounded-xl overflow-hidden group cursor-pointer border border-gray-200 dark:border-gray-800 shadow-sm"
              >
                <img src={reel.img} alt={reel.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40">
                    <KeenIcon icon="play" className="text-lg ml-1" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <h4 className="text-white font-bold text-[11px] leading-tight mb-1">{reel.title}</h4>
                  <div className="text-white/70 text-[10px] font-semibold">{reel.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ EVENTOS SECTION (Blank placeholder) ══ */}
      <section className="w-full space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
          <h2 className="text-sm font-extrabold text-gray-800 dark:text-white uppercase tracking-wider">
            Eventos
          </h2>
        </div>
        <div className="bg-white dark:bg-coal-400 rounded-2xl shadow-sm border border-dashed border-gray-200 dark:border-gray-700 min-h-[130px] w-full"></div>
      </section>

      {/* ══ KPI General ══ */}
      <div className="bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-blue-200 dark:border-blue-900/50 p-5 w-full mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 md:gap-8">
          <div className="text-center md:text-left flex-1 min-w-[100px]">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-blue-500 dark:text-blue-400 flex items-center justify-center md:justify-start gap-1"><span className="text-sm">📋</span> Fichas</p>
            <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-300 leading-none">{totalFichas}</p>
            <p className="text-[10px] mt-1 text-gray-500 uppercase tracking-wider">asignadas</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center md:text-left flex-1 min-w-[100px]">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-green-500 dark:text-green-400 flex items-center justify-center md:justify-start gap-1"><span className="text-sm">🎯</span> RAPs</p>
            <p className="text-3xl font-extrabold text-green-600 dark:text-green-300 leading-none">{totalRAPs}</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center md:text-left flex-1 min-w-[100px]">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-orange-500 dark:text-orange-400 flex items-center justify-center md:justify-start gap-1"><span className="text-sm">📅</span> Sesiones</p>
            <p className="text-3xl font-extrabold text-orange-600 dark:text-orange-300 leading-none">{totalSesiones}</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center md:text-left flex-1 min-w-[100px]">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-amber-500 dark:text-amber-400 flex items-center justify-center md:justify-start gap-1"><span className="text-sm">⏱️</span> Horas</p>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-300 leading-none">{totalHoras.toFixed(1)}</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
          <Link 
            to={fichas[0]?.resultados?.[0]?.idHorario ? `/ambiente-virtual/clase/${fichas[0].resultados[0].idHorario}` : "/ambiente-virtual/actividades"} 
            state={{ activeMenu: 'actividades-asignadas' }}
            className="text-center md:text-left flex-1 min-w-[120px] block hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all duration-300 p-2 rounded-xl group border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
          >
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-purple-500 dark:text-purple-400 flex items-center justify-center md:justify-start gap-1"><span className="text-sm transition-transform group-hover:scale-110">📝</span> Por evaluar</p>
            <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-300 leading-none">{actividadesPorEvaluar.length}</p>
            <p className="text-[10px] mt-1 text-gray-500 uppercase tracking-wider pl-8">pendientes</p>
          </Link>
        </div>
      </div>

      {/* ══ FICHAS SECTION (Full width) ══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
          <h2 className="text-sm font-extrabold text-gray-800 dark:text-white uppercase tracking-wider">
            Fichas, Sesiones y RAPs
          </h2>
        </div>

        {currentFichas.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-coal-400 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
            <span className="text-4xl">📋</span>
            <p className="mt-3 text-gray-500 dark:text-gray-400 font-semibold">Sin fichas asignadas en este periodo</p>
          </div>
        )}

        {currentFichas.map((ficha, fi) => {
          const isOpen = expanded[ficha.idFicha];
          const horasF = ficha.resultados.reduce((a, r) => a + r.duracionHoras, 0);
          const sesF = ficha.resultados.reduce((a, r) => a + r.cantidadSesiones, 0);
          return (
            <div key={ficha.idFicha} className="bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setExpanded((p) => ({ ...p, [ficha.idFicha]: !p[ficha.idFicha] }))}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-coal-300/30 transition-colors text-left"
              >
                <div className={`shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center ${FICHA_BG[fi % FICHA_BG.length]}`}>
                  <span className={`font-extrabold text-[10px] leading-none ${FICHA_TEXT[fi % FICHA_TEXT.length]}`}>
                    {ficha.codigoFicha?.slice(0, 5)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate">{ficha.programaFormacion}</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Ficha <strong>{ficha.codigoFicha}</strong> · Prog. {ficha.codigoPrograma}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-8 shrink-0 text-xs text-gray-500 dark:text-gray-400 px-4 border-l border-gray-100 dark:border-gray-700">
                  <div className="text-center"><p className="font-extrabold text-lg text-blue-600 dark:text-blue-400 leading-none">{ficha.resultados.length}</p><p className="text-[10px] uppercase mt-1">RAPs</p></div>
                  <div className="text-center"><p className="font-extrabold text-lg text-orange-500 dark:text-orange-400 leading-none">{sesF}</p><p className="text-[10px] uppercase mt-1">Sesiones</p></div>
                  <div className="text-center"><p className="font-extrabold text-lg text-green-600 dark:text-green-400 leading-none">{horasF.toFixed(0)}</p><p className="text-[10px] uppercase mt-1">Horas</p></div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 ml-2 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-coal-500/10">
                  {ficha.resultados.length === 0 ? <p className="text-center text-xs text-gray-400 py-8">Sin RAPs.</p> : (
                    <div className="overflow-x-auto p-4">
                      <table className="w-full text-xs min-w-[700px] bg-white dark:bg-coal-400 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-coal-300">
                            {["Competencia", "RAP / Resultado", "Día", "Horario", "Sesiones", "Horas"].map((h) => (
                              <th key={h} className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {ficha.resultados.map((rap, ri) => (
                            <tr key={`${rap.idHorario}-${ri}`} className="hover:bg-gray-50/80 dark:hover:bg-coal-300/30 transition-colors">
                              <td className="px-4 py-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400 max-w-[180px]"><span className="line-clamp-2">{rap.competencia || "—"}</span></td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[220px]"><span className="line-clamp-2">{rap.resultadoAprendizaje || "—"}</span></td>
                              <td className="px-4 py-3"><span className="inline-block px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-[10px] uppercase">{DIAS[rap.idDia] || "—"}</span></td>
                              <td className="px-4 py-3 font-mono text-[11px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-coal-500/30 rounded">{fmtH(rap.horaInicial)} - {fmtH(rap.horaFinal)}</td>
                              <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-extrabold text-xs">{rap.cantidadSesiones}</span></td>
                              <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-10 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-extrabold text-xs">{rap.duracionHoras.toFixed(1)}h</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button onClick={() => setFichasPage(p => Math.max(1, p - 1))} disabled={fichasPage === 1} className="px-4 py-2 rounded-lg bg-white dark:bg-coal-400 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-coal-300 transition-colors font-medium text-sm shadow-sm">Anterior</button>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Página {fichasPage} de {totalPages}</span>
            <button onClick={() => setFichasPage(p => Math.min(totalPages, p + 1))} disabled={fichasPage === totalPages} className="px-4 py-2 rounded-lg bg-white dark:bg-coal-400 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-coal-300 transition-colors font-medium text-sm shadow-sm">Siguiente</button>
          </div>
        )}
      </section>

      {/* ══ BOTTOM GRID: Calendar & Reels (Left) / Actividades (Right) ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        
        {/* LEFT COLUMN: Calendar and Reels */}
        <div className="space-y-8 border-r-0 lg:border-r border-gray-200 dark:border-gray-700 lg:pr-8">
          
          {/* CALENDARIO */}
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full"></div>
                <h2 className="text-sm font-extrabold text-gray-800 dark:text-white uppercase tracking-wider">
                  Mi Calendario
                </h2>
              </div>
              <div className="flex bg-gray-100 dark:bg-coal-500 rounded-lg p-1 self-start sm:self-auto">
                <button onClick={() => setCalendarView('month')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${calendarView === 'month' ? 'bg-white dark:bg-coal-300 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Mes</button>
                <button onClick={() => setCalendarView('week')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${calendarView === 'week' ? 'bg-white dark:bg-coal-300 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Semana</button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-coal-400 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col min-h-[320px]">
              {calendarView === 'month' ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-coal-500 flex items-center justify-center text-gray-600 dark:text-gray-300"><KeenIcon icon="left" /></button>
                    <h3 className="font-bold text-gray-900 dark:text-white capitalize">{monthNames[month]} {year}</h3>
                    <button onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-coal-500 flex items-center justify-center text-gray-600 dark:text-gray-300"><KeenIcon icon="right" /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase mb-2"><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div></div>
                  <div className="grid grid-cols-7 gap-1 flex-1">
                    {blanks.map(b => <div key={`blank-${b}`} className="h-8 md:h-10" />)}
                    {daysArray.map(day => {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const daySessions = sessionsByDate[dateStr] || [];
                      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                      return (
                        <div key={day} className={`relative h-8 md:h-10 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer group ${isToday ? "bg-primary text-white font-black shadow-md shadow-primary/30" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-500 font-medium"} ${daySessions.length > 0 && !isToday ? "bg-blue-50/50 dark:bg-coal-500/50 font-bold" : ""}`}>
                          <span className="z-10">{day}</span>
                          {daySessions.length > 0 && (
                            <div className="absolute bottom-1.5 flex gap-1 z-10">{daySessions.slice(0, 3).map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-primary'}`} />)}</div>
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
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">{weeklySessions.length} clases</span>
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
                              <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-1">{session.materia}</h3>
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
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Actividades */}
        <div className="space-y-6">
          <section className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                <h2 className="text-sm font-extrabold text-gray-800 dark:text-white uppercase tracking-wider">
                  Actividades por evaluar
                </h2>
              </div>
            </div>
            
            <div className="bg-white dark:bg-coal-400 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex flex-col h-full">
              {/* CONTEOS - Sleek and professional */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-coal-500/30 border border-gray-100 dark:border-gray-700/50 hover:border-red-200 dark:hover:border-red-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                      <KeenIcon icon="time" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">Vencidas</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Actividades fuera de plazo</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-red-600 dark:text-red-400">{vencidas}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-coal-500/30 border border-gray-100 dark:border-gray-700/50 hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <KeenIcon icon="document" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">Pendientes</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Por entregar de aprendices</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">{pendientes}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-coal-500/30 border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <KeenIcon icon="check-circle" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">Por Calificar</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Entregas listas para revisar</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{porCalificar}</span>
                </div>
              </div>

              {/* LISTA DE ACTIVIDADES RECIENTES (To match the visual grid from the image but sleek) */}
              <div className="mt-2 pt-5 border-t border-gray-100 dark:border-gray-700 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Entregas Recientes</h3>
                  <Link to="/ambiente-virtual/actividades" className="text-[10px] text-blue-600 hover:underline font-semibold">Ver todas</Link>
                </div>
                
                {actividadesPorEvaluar.length > 0 ? (
                  <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar max-h-[300px] pr-1">
                    {actividadesPorEvaluar.slice(0, 4).map(act => (
                      <div key={act.id} className="p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-white dark:bg-coal-400 group">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{getTitulo(act)}</h4>
                          <span className="shrink-0 text-[8px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-1.5 py-0.5 rounded">Enviado</span>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">{act.materia?.nombreMateria || 'Sin materia asignada'}</p>
                        <div className="flex items-center justify-between text-[9px] font-semibold text-gray-400">
                          <span className="flex items-center gap-1"><KeenIcon icon="calendar" className="text-[10px]" /> {act.fechaFin ? new Date(act.fechaFin).toLocaleDateString() : 'Sin fecha'}</span>
                          <Link to="/ambiente-virtual/actividades" className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Calificar →</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gray-50 dark:bg-coal-500/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <span className="text-2xl mb-2">🎉</span>
                    <p className="text-xs font-semibold text-gray-500">¡Al día! No hay entregas pendientes por revisar.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* REELS VIEWER MODAL */}
      {playingReelIndex !== null && (
        <ProfesorReelsViewer
          reels={PROFESOR_REELS}
          initialIndex={playingReelIndex}
          onClose={() => setPlayingReelIndex(null)}
        />
      )}
    </div>
  );
};
export default ProfesoresContent;

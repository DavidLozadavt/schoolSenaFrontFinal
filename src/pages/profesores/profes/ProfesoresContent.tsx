import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/auth/useAuthContext";
import { KeenIcon } from "@/components/keenicons";
import MultimediaCapsulas from "@/components/capsulas/MultimediaCapsulas";
import EventsDashboard from "@/components/capsulas/EventsDashboard";
import {
  calendarioInstructorEnRango,
  clasesInstructorConHistorial,
  fetchHistorialSesionesInstructor,
  sesionesCalendarioInstructorEnRango,
  type EstadoDiaCalendarioInstructor,
  type HistorialSesionInstructorItem
} from "@/utils/clasesAsignadasLogica";
import { useClasesInstructorAsignadas } from "@/hooks/useClasesInstructorAsignadas";

// --- Types ---

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

interface Ficha {
  idFicha: number;
  codigoFicha: string;
  programaFormacion: string;
  codigoPrograma: string;
  resultados: ResultadoPlano[];
}

interface FichaLider {
  idFicha: number;
  codigoFicha: string;
  programaFormacion: string;
  codigoPrograma: string;
  jornada: string;
  sede: string;
  porcentajeEjecucion: number;
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
  materia?: { nombreMateria?: string; idHorario?: number; idHorarioMateria?: number; id?: number };
  idHorario?: number;
  idHorarioMateria?: number;
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
  idFicha: toNum(raw?.idFicha ?? raw?.id),
  codigoFicha: toStr(raw?.codigoFicha ?? raw?.codigo),
  programaFormacion: toStr(raw?.programaFormacion ?? raw?.asignacion?.programa?.nombrePrograma),
  codigoPrograma: toStr(raw?.codigoPrograma ?? raw?.asignacion?.programa?.codigoPrograma),
  resultados: Array.isArray(raw?.resultados) ? raw.resultados.map(normalizarResultado) : [],
});

const normalizarFichaLider = (raw: any): FichaLider => ({
  idFicha: toNum(raw?.idFicha ?? raw?.id),
  codigoFicha: toStr(raw?.codigoFicha ?? raw?.codigo),
  programaFormacion: toStr(
    raw?.programaFormacion ??
    raw?.asignacion?.programa?.nombrePrograma ??
    raw?.asignacion?.programa?.nombre ??
    raw?.asignacion?.programa?.denominacion
  ),
  codigoPrograma: toStr(
    raw?.codigoPrograma ??
    raw?.asignacion?.programa?.codigoPrograma ??
    raw?.asignacion?.programa?.codigo
  ),
  jornada: toStr(raw?.jornada?.nombreJornada ?? raw?.jornada?.nombre ?? raw?.jornada?.jornada),
  sede: toStr(raw?.sede?.nombre ?? raw?.sede?.sede),
  porcentajeEjecucion: toNum(raw?.porcentajeEjecucion ?? raw?.porcentaje_ejecucion),
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
  idHorario: toNum(raw?.idHorario ?? raw?.id_horario ?? raw?.materia?.idHorario ?? raw?.materia?.id_horario),
  idHorarioMateria: toNum(raw?.idHorarioMateria ?? raw?.id_horario_materia ?? raw?.materia?.idHorarioMateria ?? raw?.materia?.id_horario_materia),
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

      if (!Number.isInteger(rawIdDia) || rawIdDia < 0 || rawIdDia > 7) {
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

  const uniqueSessionsMap = new Map<string, UpcomingSession>();
  sessions.forEach(s => {
    // Para RAPs sin idHorario el ID se construy   con undefined-fecha, lo reemplazamos si es el caso.
    const key = s.id.startsWith('undefined') || s.id.startsWith('null') || s.id.startsWith('0') 
      ? `${s.fechaStr}-${s.horaInicial}-${s.horaFinal}` 
      : s.id;
    if (!uniqueSessionsMap.has(key)) {
      uniqueSessionsMap.set(key, s);
    }
  });

  return Array.from(uniqueSessionsMap.values()).sort((a, b) => {
    if (a.fechaStr !== b.fechaStr) return a.fechaStr.localeCompare(b.fechaStr);
    return a.horaInicial.localeCompare(b.horaInicial);
  });
}

//           Constants                                                                                                                                                                                                 

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

function getDiaLabel(idDia: unknown): string {
  const d = toNum(idDia);
  if (d === 0 || d === 7) return "Dom";
  return DIAS[d] || "   ";
}

function parseLocalDate(value: unknown, endOfDay = false): Date | null {
  const raw = toStr(value).trim();
  if (!raw) return null;

  const date = new Date(raw.includes("T") ? raw : `${raw}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  if (Number.isNaN(date.getTime())) return null;

  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);

  return date;
}

function diffHoras(horaInicial: unknown, horaFinal: unknown): number {
  const parseTime = (value: unknown): number | null => {
    const raw = toStr(value).trim();
    const match = raw.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  };

  const start = parseTime(horaInicial);
  const end = parseTime(horaFinal);

  if (start === null || end === null) return 0;

  let diff = end - start;
  if (diff < 0) diff += 24 * 60;

  return Math.max(0, diff / 60);
}

function deriveSesionesYHoras(rap: ResultadoPlano, baseDate = new Date()) {
  const backendSesiones = toNum(rap.cantidadSesiones);
  const backendHoras = toNum(rap.duracionHoras);

  if (backendSesiones > 0 || backendHoras > 0) {
    return {
      cantidadSesiones: backendSesiones,
      duracionHoras: backendHoras,
    };
  }

  const rapStart = parseLocalDate(rap.fechaInicial);
  const rapEnd = parseLocalDate(rap.fechaFinal, true);

  if (!rapStart || !rapEnd) {
    return {
      cantidadSesiones: backendSesiones,
      duracionHoras: backendHoras,
    };
  }

  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const desde = new Date(Math.max(monthStart.getTime(), rapStart.getTime()));
  const hasta = new Date(Math.min(monthEnd.getTime(), rapEnd.getTime()));

  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime()) || desde > hasta) {
    return {
      cantidadSesiones: backendSesiones,
      duracionHoras: backendHoras,
    };
  }

  const rawIdDia = toNum(rap.idDia);

  if (!Number.isInteger(rawIdDia) || rawIdDia < 0 || rawIdDia > 7) {
    return {
      cantidadSesiones: backendSesiones,
      duracionHoras: backendHoras,
    };
  }

  const targetDay = rawIdDia === 7 ? 0 : rawIdDia;
  const duracionSesion = toNum(rap.duracionSesion) || diffHoras(rap.horaInicial, rap.horaFinal);

  let current = new Date(desde);
  current.setHours(0, 0, 0, 0);

  let safetyDaySearch = 0;

  while (current.getDay() !== targetDay && current <= hasta) {
    safetyDaySearch++;

    if (safetyDaySearch > 7) break;
    current.setDate(current.getDate() + 1);
  }

  let cantidadSesiones = 0;
  let safetySessions = 0;

  while (current <= hasta) {
    safetySessions++;

    if (safetySessions > 60) break;
    cantidadSesiones++;
    current.setDate(current.getDate() + 7);
  }

  return {
    cantidadSesiones,
    duracionHoras: Number((cantidadSesiones * duracionSesion).toFixed(2)),
  };
}

function getEstadoLabel(estado: Actividad["estado"]): string {
  if (!estado) return "SIN ESTADO";
  if (typeof estado === "string") return estado.toUpperCase();
  return (estado.nombre || estado.estado || "SIN ESTADO").toUpperCase();
}

function getTitulo(act: Actividad): string {
  return act.tituloActividad || act.titulo || act.nombre || "Sin nombre";
}

type ExpandableFichaItem = {
  idFicha: number;
  codigoFicha: string;
  programaFormacion: string;
  codigoPrograma: string;
  raps: number;
  sesiones: number;
  horas: number;
  resultados: ResultadoPlano[];
};

function getFichaMetrics(ficha: Ficha, baseDate = new Date()) {
  const resultados = Array.isArray(ficha.resultados) ? ficha.resultados : [];

  return resultados.reduce(
    (metrics, rap) => {
      const calculado = deriveSesionesYHoras(rap, baseDate);

      metrics.raps += 1;
      metrics.sesiones += calculado.cantidadSesiones;
      metrics.horas += calculado.duracionHoras;

      return metrics;
    },
    { raps: 0, sesiones: 0, horas: 0 }
  );
}

type ExpandableFichaSectionProps = {
  title: string;
  subtitle: string;
  accent: "blue" | "emerald";
  items: ExpandableFichaItem[];
  emptyText: string;
  emptyResultsText?: string;
};

const ExpandableFichaSection: React.FC<ExpandableFichaSectionProps> = ({
  title,
  subtitle,
  accent,
  items,
  emptyText,
  emptyResultsText = "Sin RAPs u horarios disponibles para esta ficha.",
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isBlue = accent === "blue";

  const styles = isBlue
    ? {
        wrapper: "border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-900/10",
        line: "bg-blue-600",
        count: "bg-blue-600 text-white",
        badge: "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
        pill: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300",
      }
    : {
        wrapper: "border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-900/10",
        line: "bg-emerald-500",
        count: "bg-emerald-600 text-white",
        badge: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
        pill: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300",
      };

  return (
    <section className={`rounded-2xl border ${styles.wrapper} p-3`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <div className={`w-1 h-5 rounded-full mt-0.5 ${styles.line}`} />

          <div className="min-w-0">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
              {title}
            </h3>

            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          </div>
        </div>

        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black ${styles.count}`}>
          {items.length} {items.length === 1 ? "ficha" : "fichas"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-coal-400/60 p-4 text-center">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {emptyText}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
          {items.map((item, idx) => {
            const isOpen = expandedId === item.idFicha;

            const resultadosCalculados = (item.resultados || []).map((rap) => {
              const calculado = deriveSesionesYHoras(rap);

              return {
                ...rap,
                cantidadSesionesCalculada: calculado.cantidadSesiones,
                duracionHorasCalculada: calculado.duracionHoras,
              };
            });

            return (
              <article
                key={`${title}-${item.idFicha || item.codigoFicha}-${idx}`}
                className="rounded-xl bg-white dark:bg-coal-400 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((prev) => (prev === item.idFicha ? null : item.idFicha))
                  }
                  className="w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-coal-300/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`shrink-0 w-9 h-9 rounded-lg border-2 flex items-center justify-center ${styles.badge}`}>
                      <span className="font-extrabold text-[9px] leading-none">
                        {item.codigoFicha?.slice(0, 5) || "----"}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase truncate">
                        {item.programaFormacion || "Sin programa"}
                      </h4>

                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        Ficha <strong>{item.codigoFicha || "-"}</strong> · Prog. {item.codigoPrograma || "-"}
                      </p>
                    </div>

                    <div className="hidden md:flex items-center gap-4 shrink-0 px-3 border-l border-gray-100 dark:border-gray-700">
                      <div className="text-center">
                        <p className="font-black text-sm text-blue-600 dark:text-blue-400 leading-none">
                          {item.raps}
                        </p>
                        <p className="text-[8px] uppercase mt-1 text-gray-400">RAPs</p>
                      </div>

                      <div className="text-center">
                        <p className="font-black text-sm text-orange-500 dark:text-orange-400 leading-none">
                          {item.sesiones}
                        </p>
                        <p className="text-[8px] uppercase mt-1 text-gray-400">Sesiones</p>
                      </div>

                      <div className="text-center">
                        <p className="font-black text-sm text-green-600 dark:text-green-400 leading-none">
                          {Number(item.horas).toFixed(0)}
                        </p>
                        <p className="text-[8px] uppercase mt-1 text-gray-400">Horas</p>
                      </div>
                    </div>

                    <span className={`hidden lg:inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${styles.pill}`}>
                      {isOpen ? "Ocultar" : "Ver"}
                    </span>

                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  <div className="md:hidden mt-2 grid grid-cols-3 gap-1.5">
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 py-1.5 text-center">
                      <p className="font-black text-xs text-blue-600 dark:text-blue-400">{item.raps}</p>
                      <p className="text-[8px] uppercase text-gray-500">RAPs</p>
                    </div>

                    <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 py-1.5 text-center">
                      <p className="font-black text-xs text-orange-500 dark:text-orange-400">{item.sesiones}</p>
                      <p className="text-[8px] uppercase text-gray-500">Sesiones</p>
                    </div>

                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 py-1.5 text-center">
                      <p className="font-black text-xs text-green-600 dark:text-green-400">{Number(item.horas).toFixed(0)}</p>
                      <p className="text-[8px] uppercase text-gray-500">Horas</p>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-coal-500/10 p-2">
                    {resultadosCalculados.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-4 text-center">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          {emptyResultsText}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {resultadosCalculados.map((rap, ri) => (
                          <div
                            key={`${rap.idHorario}-${ri}`}
                            className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-coal-400 px-3 py-2"
                          >
                            <div className="grid grid-cols-1 xl:grid-cols-[1fr_270px] gap-3 items-center">
                              <div className="min-w-0">
                                <div className="flex items-start gap-2">
                                  <span className="shrink-0 rounded-md bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-[8px] font-black uppercase text-blue-700 dark:text-blue-300">
                                    {getDiaLabel(rap.idDia)}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-0.5">
                                      Competencia
                                    </p>

                                    <p className="text-[10.5px] font-bold text-gray-800 dark:text-gray-100 leading-snug line-clamp-1">
                                      {rap.competencia || "Sin competencia registrada"}
                                    </p>

                                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mt-1 mb-0.5">
                                      RAP / Resultado
                                    </p>

                                    <p className="text-[10.5px] font-semibold text-gray-600 dark:text-gray-300 leading-snug line-clamp-1">
                                      {rap.resultadoAprendizaje || "Sin resultado registrado"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5">
                                <div className="rounded-md bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-gray-700 px-2 py-1.5 text-center">
                                  <p className="text-[8px] font-black uppercase text-gray-400">Horario</p>
                                  <p className="text-[10px] font-bold text-gray-700 dark:text-gray-200 mt-0.5 whitespace-nowrap">
                                    {fmtH(rap.horaInicial)} - {fmtH(rap.horaFinal)}
                                  </p>
                                </div>

                                <div className="rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 px-2 py-1.5 text-center">
                                  <p className="text-[8px] font-black uppercase text-orange-400">Sesiones</p>
                                  <p className="text-[11px] font-black text-orange-600 dark:text-orange-300 mt-0.5">
                                    {rap.cantidadSesionesCalculada}
                                  </p>
                                </div>

                                <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 px-2 py-1.5 text-center">
                                  <p className="text-[8px] font-black uppercase text-green-500">Horas</p>
                                  <p className="text-[11px] font-black text-green-600 dark:text-green-300 mt-0.5">
                                    {rap.duracionHorasCalculada.toFixed(1)}h
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

// ─── SEMAFORO DE HORAS RMI (HELPERS) ──────────────────────────────────────────

/** YYYY-MM desde una fecha (calendario local). */
function getPeriodoKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Normaliza clave de periodo del API a YYYY-MM para comparar con el mes del calendario. */
function normalizePeriodoKey(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (m) {
    const y = m[1];
    const mo = String(Number(m[2])).padStart(2, "0");
    return `${y}-${mo}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return getPeriodoKeyFromDate(d);
  return null;
}

function parsePeriodoToDate(periodoStr: string): Date | null {
  const key = normalizePeriodoKey(periodoStr);
  if (!key) return null;
  const d = new Date(`${key}-01T12:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

/** Horas de un periodo (misma prioridad de campos en todo el bloque RMI). */
function getHorasDePeriodo(p: any): number {
  return toNum(p?.horasAsignadas ?? p?.horas ?? p?.totalHoras ?? p?.duracionHoras);
}

function getHorasPeriodo(dataRmi: any[], monthStr: string): number {
  if (!Array.isArray(dataRmi)) return 0;
  const target = normalizePeriodoKey(monthStr);
  if (!target) return 0;
  let horas = 0;
  dataRmi.forEach((contrato) => {
    const periodos = contrato.periodos;
    if (!Array.isArray(periodos)) return;
    const p = periodos.find((x: any) => {
      const key =
        normalizePeriodoKey(x?.periodo) ??
        normalizePeriodoKey(x?.mes) ??
        normalizePeriodoKey(x?.periodoMes) ??
        normalizePeriodoKey(x?.anioMes);
      return key === target;
    });
    if (p) horas += getHorasDePeriodo(p);
  });
  return horas;
}

function getFechaInicioContrato(dataRmi: any[]): Date | null {
  if (!Array.isArray(dataRmi) || dataRmi.length === 0) return null;

  let earliestDate: Date | null = null;

  for (const contrato of dataRmi) {
    const rawDate =
      contrato.fechaInicio ||
      contrato.fecha_inicio ||
      contrato.fechaInicial ||
      contrato.fecha_inicial ||
      contrato.fechaInicioContrato ||
      contrato.fecha_inicio_contrato ||
      contrato.contrato?.fechaInicio ||
      contrato.contrato?.fecha_inicio;

    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        if (!earliestDate || d < earliestDate) earliestDate = d;
      }
    }

    if (Array.isArray(contrato.periodos) && contrato.periodos.length > 0) {
      const pSorted = [...contrato.periodos].sort((a, b) =>
        String(normalizePeriodoKey(a?.periodo ?? a?.mes) ?? "").localeCompare(
          String(normalizePeriodoKey(b?.periodo ?? b?.mes) ?? "")
        )
      );
      const p1 = pSorted[0]?.periodo ?? pSorted[0]?.mes;
      const d = parsePeriodoToDate(String(p1 ?? ""));
      if (d && (!earliestDate || d < earliestDate)) earliestDate = d;
    }
  }
  return earliestDate;
}

/** Meses calendario desde inicio (día 1) hasta el mes de `ref`, inclusive. Mínimo 0. */
function getMesesTranscurridos(fechaInicio: Date, ref: Date): number {
  const sy = fechaInicio.getFullYear();
  const sm = fechaInicio.getMonth();
  const ry = ref.getFullYear();
  const rm = ref.getMonth();
  const n = (ry - sy) * 12 + (rm - sm) + 1;
  return Math.max(0, n);
}

type SemaforoMes = {
  bg: string;
  text: string;
  bgLight: string;
  border: string;
  label: string;
};

/** Mensual: 0–154 rojo, 155–159 amarillo, 160 verde claro, >160 verde oscuro. */
function getSemaforoHorasMes(horas: number): SemaforoMes {
  const h = Number.isFinite(horas) ? horas : 0;
  if (h <= 154) {
    return {
      bg: "bg-red-500",
      text: "text-red-500 dark:text-red-400",
      bgLight: "bg-red-50 dark:bg-red-900/25",
      border: "border-red-200 dark:border-red-800",
      label: "Por debajo",
    };
  }
  if (h < 160) {
    return {
      bg: "bg-amber-400",
      text: "text-amber-600 dark:text-amber-400",
      bgLight: "bg-amber-50 dark:bg-amber-900/25",
      border: "border-amber-200 dark:border-amber-800",
      label: "Cerca de cumplir",
    };
  }
  if (h <= 160) {
    return {
      bg: "bg-green-400",
      text: "text-green-600 dark:text-green-400",
      bgLight: "bg-green-50 dark:bg-green-900/25",
      border: "border-green-200 dark:border-green-800",
      label: "Cumple",
    };
  }
  return {
    bg: "bg-green-600",
    text: "text-green-700 dark:text-green-500",
    bgLight: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-300 dark:border-green-800",
    label: "Por encima",
  };
}

type SemaforoAcum = {
  bg: string;
  text: string;
  bgLight: string;
  border: string;
  label: string;
};

/** Acumulado: falta ≥6 h → rojo; falta 1–5 → amarillo; igual meta → verde claro; supera → verde oscuro. Sin meta → neutro. */
function getSemaforoHorasAcumulado(horas: number, meta: number): SemaforoAcum {
  const h = Number.isFinite(horas) ? horas : 0;
  const m = Number.isFinite(meta) ? meta : 0;
  if (m <= 0) {
    return {
      bg: "bg-gray-400",
      text: "text-gray-500 dark:text-gray-400",
      bgLight: "bg-gray-50 dark:bg-coal-500/40",
      border: "border-gray-200 dark:border-gray-600",
      label: "Sin meta",
    };
  }
  const diff = m - h;
  if (diff >= 6) {
    return {
      bg: "bg-red-500",
      text: "text-red-500 dark:text-red-400",
      bgLight: "bg-red-50 dark:bg-red-900/25",
      border: "border-red-200 dark:border-red-800",
      label: "Por debajo",
    };
  }
  if (diff > 0 && diff < 6) {
    return {
      bg: "bg-amber-400",
      text: "text-amber-600 dark:text-amber-400",
      bgLight: "bg-amber-50 dark:bg-amber-900/25",
      border: "border-amber-200 dark:border-amber-800",
      label: "Cerca de cumplir",
    };
  }
  if (Math.abs(diff) < 0.01) {
    return {
      bg: "bg-green-400",
      text: "text-green-600 dark:text-green-400",
      bgLight: "bg-green-50 dark:bg-green-900/25",
      border: "border-green-200 dark:border-green-800",
      label: "Cumple",
    };
  }
  return {
    bg: "bg-green-600",
    text: "text-green-700 dark:text-green-500",
    bgLight: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-300 dark:border-green-800",
    label: "Por encima",
  };
}

// --- REELS DATA & COMPONENT ---

/** Mismos colores que el calendario del detalle de clase. */
function estiloCeldaMiCalendarioInstructor(estado: EstadoDiaCalendarioInstructor | undefined): {
  className: string;
  style?: React.CSSProperties;
} {
  switch (estado) {
    case 'hoy':
      return {
        className: 'font-semibold',
        style: { backgroundColor: '#fed7aa', color: '#9a3412' }
      };
    case 'completada':
      return {
        className: 'font-semibold',
        style: { backgroundColor: '#dcfce7', color: '#166534' }
      };
    case 'pendiente':
      return {
        className: 'font-semibold',
        style: { backgroundColor: '#dbeafe', color: '#1e3a8a' }
      };
    default:
      return {
        className:
          'text-gray-700 dark:text-gray-300 hover:ring-1 hover:ring-primary/20 font-medium'
      };
  }
}

function colorPuntoMiCalendarioInstructor(estado: EstadoDiaCalendarioInstructor | undefined): string {
  if (estado === 'hoy') return 'bg-[#9a3412]';
  if (estado === 'completada') return 'bg-[#166534]';
  if (estado === 'pendiente') return 'bg-[#1e3a8a]';
  return 'bg-primary';
}

// --- Main Component ---

const ProfesoresContent: React.FC = () => {
  const { user, persona } = useAuthContext();
  const userName = persona
    ? [persona.nombre1, persona.nombre2, persona.apellido1, persona.apellido2].filter(Boolean).join(' ')
    : (user?.persona
      ? [user.persona.nombre1, user.persona.nombre2, user.persona.apellido1, user.persona.apellido2].filter(Boolean).join(' ')
      : 'Instructor');

  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [fichasLider, setFichasLider] = useState<FichaLider[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const { clases: clasesHorarioInstructor } = useClasesInstructorAsignadas();
  const [historialSesionesInstructor, setHistorialSesionesInstructor] = useState<
    HistorialSesionInstructorItem[]
  >([]);

  const clasesInstructorCalendario = useMemo(
    () => clasesInstructorConHistorial(clasesHorarioInstructor, historialSesionesInstructor),
    [clasesHorarioInstructor, historialSesionesInstructor]
  );

  useEffect(() => {
    fetchHistorialSesionesInstructor()
      .then(setHistorialSesionesInstructor)
      .catch(() => setHistorialSesionesInstructor([]));
  }, []);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedFichaId, setSelectedFichaId] = useState<number | null>(null);
  const [fichaCalendarMonth, setFichaCalendarMonth] = useState(new Date());
  const [selectedFichaDay, setSelectedFichaDay] = useState(new Date());
  

  // Fichas donde el instructor da formación. Este endpoint trae resultados/RAPs y horarios.
  useEffect(() => {
    axios.get("instructores/mi-dashboard")
      .then((r) => {
        const d = r.data?.fichas ?? r.data ?? [];
        const normalizadas = Array.isArray(d) ? d.map(normalizarFicha) : [];
        setFichas(normalizadas);
      })
      .catch(() => setFichas([]));
  }, []);

  // Fichas donde el instructor es líder. Este endpoint trae ficha, programa, jornada y sede.
  useEffect(() => {
    axios.get("instructor-lider")
      .then((r) => {
        const d = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        const normalizadas = Array.isArray(d) ? d.map(normalizarFichaLider) : [];
        setFichasLider(normalizadas);
      })
      .catch(() => setFichasLider([]));
  }, []);

  useEffect(() => {
    if (fichas.length === 0) {
      if (selectedFichaId !== null) setSelectedFichaId(null);
      return;
    }

    const exists = fichas.some((f) => f.idFicha === selectedFichaId);

    if (selectedFichaId === null || !exists) {
      const today = new Date();
      setSelectedFichaId(fichas[0].idFicha);
      setFichaCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      setSelectedFichaDay(today);
    }
  }, [fichas, selectedFichaId]);

  //        Actividades por evaluar                                                                                                                               
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
      return label === 'ENVIADO' || label === 'POR_EVALUAR';
    }),
    [actividades]
  );

  // Calendario: misma lógica que detalle de clase (sesiones BD + pendientes + hoy).
  const calendarioInstructor = useMemo(() => {
    const anchor = calendarView === "day" ? selectedDay : currentMonth;
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month + 2, 0);
    return calendarioInstructorEnRango(clasesInstructorCalendario, startDate, endDate, new Date());
  }, [clasesInstructorCalendario, currentMonth, calendarView, selectedDay]);

  const upcomingSessions = useMemo((): UpcomingSession[] => {
    const anchor = calendarView === "day" ? selectedDay : currentMonth;
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month + 2, 0);
    return sesionesCalendarioInstructorEnRango(
      clasesInstructorCalendario,
      startDate,
      endDate,
      new Date()
    );
  }, [clasesInstructorCalendario, currentMonth, calendarView, selectedDay]);

  const estadoDiaCalendario = calendarioInstructor.estadoPorYmd;

  const resumenMesCalendario = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    let completadas = 0;
    let pendientes = 0;
    for (const [ymd, est] of Object.entries(estadoDiaCalendario)) {
      const parts = ymd.split('-').map(Number);
      if (parts.length !== 3 || parts[0] !== y || parts[1] - 1 !== m) continue;
      if (est === 'completada') completadas += 1;
      if (est === 'pendiente') pendientes += 1;
    }
    return { completadas, pendientes };
  }, [estadoDiaCalendario, currentMonth]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const { totalFichas, totalRAPs } = useMemo(() => {
    let fichasCount = 0;
    let rapsCount = 0;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    fichas.forEach(f => {
      let fichaHasRapInMonth = false;
      if (Array.isArray(f.resultados)) {
        f.resultados.forEach(rap => {
          const rapStart = parseLocalDate(rap.fechaInicial);
          const rapEnd = parseLocalDate(rap.fechaFinal, true);
          if (rapStart && rapEnd && rapStart <= monthEnd && rapEnd >= monthStart) {
            rapsCount++;
            fichaHasRapInMonth = true;
          }
        });
      }
      if (fichaHasRapInMonth) {
        fichasCount++;
      }
    });

    return { totalFichas: fichasCount, totalRAPs: rapsCount };
  }, [fichas, currentMonth]);

  const [dataRmi, setDataRmi] = useState<any[]>([]);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const idPerson = persona?.id ?? user?.persona?.id;
    if (!idPerson) return;
    
    axios.get("get_data_rmi_configuration_by_year", {
      params: { year, idPerson }
    })
    .then(r => setDataRmi(r.data))
    .catch(e => console.error("Error fetching RMI", e));
  }, [currentMonth.getFullYear(), persona?.id, user?.persona?.id]);

  // Las horas y sesiones se obtienen desde el endpoint de RMI, filtrando por el mes actual.
  const { totalSesiones, totalHoras } = useMemo(() => {
    const anchor = calendarView === "day" ? selectedDay : currentMonth;
    const monthStr = getPeriodoKeyFromDate(anchor);
    let sesiones = 0;
    let horas = 0;

    if (Array.isArray(dataRmi)) {
      dataRmi.forEach((contrato) => {
        const periodos = contrato.periodos;
        if (!Array.isArray(periodos)) return;
        const periodo = periodos.find((p: any) => {
          const key =
            normalizePeriodoKey(p?.periodo) ??
            normalizePeriodoKey(p?.mes) ??
            normalizePeriodoKey(p?.periodoMes);
          return key === monthStr;
        });
        if (periodo) {
          horas += getHorasDePeriodo(periodo);
          if (Array.isArray(periodo.detalles)) {
            sesiones += periodo.detalles.length;
          }
        }
      });
    }

    return { totalSesiones: sesiones, totalHoras: horas };
  }, [dataRmi, currentMonth, calendarView, selectedDay]);

  // ── Semáforo de Horas RMI (mes del calendario; en vista Día = mes del día seleccionado) ──
  const rmiCalculations = useMemo(() => {
    const anchor = calendarView === "day" ? selectedDay : currentMonth;
    const monthStr = getPeriodoKeyFromDate(anchor);
    const horasMes = getHorasPeriodo(dataRmi, monthStr);
    const semaforoMes = getSemaforoHorasMes(horasMes);

    let fechaInicio = getFechaInicioContrato(dataRmi);
    if (!fechaInicio) {
      fechaInicio = new Date(anchor.getFullYear(), 0, 1);
    }

    const startMonth = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    const refMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);

    let mesesTranscurridos = getMesesTranscurridos(startMonth, refMonth);
    if (refMonth < startMonth) {
      mesesTranscurridos = 0;
    }

    let acumuladoHoras = 0;
    if (Array.isArray(dataRmi) && mesesTranscurridos > 0) {
      dataRmi.forEach((contrato) => {
        if (!Array.isArray(contrato.periodos)) return;
        contrato.periodos.forEach((p: any) => {
          const pKey =
            normalizePeriodoKey(p?.periodo) ??
            normalizePeriodoKey(p?.mes) ??
            normalizePeriodoKey(p?.periodoMes);
          if (!pKey || pKey > monthStr) return;
          const pd = parsePeriodoToDate(pKey);
          if (pd && pd >= startMonth) {
            acumuladoHoras += getHorasDePeriodo(p);
          }
        });
      });
    }

    const metaAcumulada = mesesTranscurridos * 160;
    const semaforoAcumulado = getSemaforoHorasAcumulado(acumuladoHoras, metaAcumulada);

    const mesNombres = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
    const startM = fechaInicio.getMonth();
    const startY = fechaInicio.getFullYear();
    const textoInicio = `Desde ${mesNombres[startM]} ${startY}`;

    return {
      horasMes,
      semaforoMes,
      acumuladoHoras,
      metaAcumulada,
      semaforoAcumulado,
      mesesTranscurridos,
      textoInicio,
    };
  }, [dataRmi, currentMonth, calendarView, selectedDay]);

  // ── Fichas en formación ───────────────────────────────────────────────────
  const fichasFormacion = useMemo(() => fichas.filter(f => Array.isArray(f.resultados) && f.resultados.length > 0), [fichas]);

  //        Conteos de Actividades                                                                                                                                                 
  const calificadas = useMemo(() => actividades.filter(act => getEstadoLabel(act.estado) === 'CALIFICADO').length, [actividades]);
  const porCalificar = actividadesPorEvaluar.length;
  //        Calendario (Controles)                                                                                                                                                 

  const nextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(next);
    setSelectedFichaDay(next);
  };

  const prevMonth = () => {
    const previous = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(previous);
    setSelectedFichaDay(previous);
  };
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getMondayOfWeek = (date: Date) => {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);

    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    base.setDate(base.getDate() + diffToMonday);
    return base;
  };

  const isDateInRange = (date: Date, start: Date, end: Date) => {
    return date >= start && date <= end;
  };

  const changeWeek = (amount: number) => {
    const nextDate = new Date(selectedDay);
    nextDate.setDate(nextDate.getDate() + amount * 7);

    setSelectedDay(nextDate);
    setCurrentMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  };

  const prevWeek = () => changeWeek(-1);
  const nextWeek = () => changeWeek(1);

  const changeSelectedDay = (amount: number) => {
    const nextDate = new Date(selectedDay);
    nextDate.setDate(nextDate.getDate() + amount);

    setSelectedDay(nextDate);
    setCurrentMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Lunes = 0
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const fichaYear = fichaCalendarMonth.getFullYear();
  const fichaMonth = fichaCalendarMonth.getMonth();
  const fichaDaysInMonth = new Date(fichaYear, fichaMonth + 1, 0).getDate();
  const fichaFirstDayOfMonth = new Date(fichaYear, fichaMonth, 1).getDay();
  const fichaStartDay = fichaFirstDayOfMonth === 0 ? 6 : fichaFirstDayOfMonth - 1;
  const fichaDaysArray = Array.from({ length: fichaDaysInMonth }, (_, i) => i + 1);
  const fichaBlanks = Array.from({ length: fichaStartDay }, (_, i) => i);

  const changeFichaMonth = (amount: number) => {
    const next = new Date(fichaCalendarMonth.getFullYear(), fichaCalendarMonth.getMonth() + amount, 1);
    setFichaCalendarMonth(next);
    setSelectedFichaDay(next);
  };

  const prevFichaMonth = () => changeFichaMonth(-1);
  const nextFichaMonth = () => changeFichaMonth(1);


  const sessionsByDate = useMemo(() => {
    const map: Record<string, UpcomingSession[]> = {};
    upcomingSessions.forEach(s => {
      if (!map[s.fechaStr]) map[s.fechaStr] = [];
      map[s.fechaStr].push(s);
    });
    return map;
  }, [upcomingSessions]);

  const currentWeekRange = useMemo(() => {
    const start = getMondayOfWeek(selectedDay);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const label = `${start.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
    })} - ${end.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;

    return { start, end, label };
  }, [selectedDay]);

  const weeklySessions = useMemo(() => {
    return upcomingSessions.filter(
      (s) => s.fechaObj >= currentWeekRange.start && s.fechaObj <= currentWeekRange.end
    );
  }, [upcomingSessions, currentWeekRange]);

  const selectedFicha = useMemo(() => {
    return fichasFormacion.find((f) => f.idFicha === selectedFichaId) ?? null;
  }, [fichasFormacion, selectedFichaId]);

  const selectedFichaSessions = useMemo(() => {
    return selectedFicha ? getInstructorSessions([selectedFicha], fichaCalendarMonth) : [];
  }, [selectedFicha, fichaCalendarMonth]);

  const selectedFichaMonthSessions = useMemo(() => {
    return selectedFichaSessions.filter(
      (s) => s.fechaObj.getFullYear() === fichaYear && s.fechaObj.getMonth() === fichaMonth
    );
  }, [selectedFichaSessions, fichaYear, fichaMonth]);

  const selectedFichaSessionsByDate = useMemo(() => {
    const map: Record<string, UpcomingSession[]> = {};

    selectedFichaSessions.forEach((s) => {
      if (!map[s.fechaStr]) map[s.fechaStr] = [];
      map[s.fechaStr].push(s);
    });

    return map;
  }, [selectedFichaSessions]);

  const fichasFormacionAccordion = useMemo<ExpandableFichaItem[]>(() => {
    return fichasFormacion.map((ficha) => ({
      idFicha: ficha.idFicha,
      codigoFicha: ficha.codigoFicha,
      programaFormacion: ficha.programaFormacion,
      codigoPrograma: ficha.codigoPrograma,
      resultados: ficha.resultados || [],
      ...getFichaMetrics(ficha, currentMonth),
    }));
  }, [fichasFormacion, currentMonth]);

  const fichasLiderAccordion = useMemo<ExpandableFichaItem[]>(() => {
    return fichasLider.map((fichaLider) => {
      const fichaConHorario = fichas.find(
        (ficha) => ficha.idFicha === fichaLider.idFicha || ficha.codigoFicha === fichaLider.codigoFicha
      );

      const metrics = fichaConHorario
        ? getFichaMetrics(fichaConHorario, currentMonth)
        : { raps: 0, sesiones: 0, horas: 0 };

      return {
        idFicha: fichaLider.idFicha,
        codigoFicha: fichaLider.codigoFicha,
        programaFormacion: fichaLider.programaFormacion,
        codigoPrograma: fichaLider.codigoPrograma,
        resultados: fichaConHorario?.resultados || [],
        ...metrics,
      };
    });
  }, [fichasLider, fichas, currentMonth]);

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



      {/* --- CÁPSULAS SENA SECTION (Reels & Stories) --- */}
      <section className="w-full space-y-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <KeenIcon icon="youtube" className="text-primary text-xl" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">Cápsulas SENA</h2>
        </div>
        <MultimediaCapsulas />
      </section>
       {/* --- EVENTOS SECTION --- */}
      <section className="w-full space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
          <h2 className="text-sm font-extrabold text-gray-800 dark:text-white uppercase tracking-wider">
            Eventos
          </h2>
        </div>
        <EventsDashboard />
      </section>
      {/* --- HORARIO POR FICHA / RESUMEN DE RESPONSABILIDADES --- */}
      <section className="grid grid-cols-1 2xl:grid-cols-[1.05fr_0.95fr] gap-6">
        {/* IZQUIERDA: CALENDARIO + KPI */}
        <div className="bg-white dark:bg-coal-400 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
            <div>
              <h2 className="text-sm font-extrabold text-gray-800 dark:text-white uppercase tracking-wider">
                Horario por ficha
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Consulta el calendario y pasa el cursor sobre los días marcados para ver el detalle.
              </p>
            </div>
          </div>

          {fichasFormacion.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-coal-500/20 p-6 text-center">
              <KeenIcon icon="calendar" className="text-4xl text-gray-300 mb-3" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                No tienes fichas de formación asignadas
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Cuando tengas fichas de formación, aquí aparecerá tu horario.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
              {/* MINI CALENDARIO */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-coal-500/20 p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-1">
                      Filtro por ficha
                    </p>
                    <select
                      value={selectedFichaId ?? ""}
                      onChange={(e) => {
                        setSelectedFichaId(toNum(e.target.value));
                        setSelectedFichaDay(new Date(fichaYear, fichaMonth, 1));
                      }}
                      disabled={fichasFormacion.length === 0}
                      className="w-full min-w-[240px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-white outline-none focus:border-blue-400 disabled:opacity-60"
                    >
                      {fichasFormacion.map((ficha) => (
                        <option key={ficha.idFicha} value={ficha.idFicha}>
                          Ficha {ficha.codigoFicha} - {ficha.programaFormacion}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Sesiones del mes</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-300 mt-1">{selectedFichaSessions.length}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={prevFichaMonth}
                    className="w-8 h-8 rounded-full hover:bg-white dark:hover:bg-coal-400 flex items-center justify-center text-gray-600 dark:text-gray-300"
                  >
                    <KeenIcon icon="left" />
                  </button>

                  <div className="text-center">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white capitalize">
                      {monthNames[fichaMonth]} {fichaYear}
                    </h3>
                    <p className="text-[10px] font-semibold text-gray-400">
                      {selectedFicha ? `Ficha ${selectedFicha.codigoFicha}` : "Sin ficha"}
                    </p>
                  </div>

                  <button
                    onClick={nextFichaMonth}
                    className="w-8 h-8 rounded-full hover:bg-white dark:hover:bg-coal-400 flex items-center justify-center text-gray-600 dark:text-gray-300"
                  >
                    <KeenIcon icon="right" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-gray-400 uppercase mb-2">
                  <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {fichaBlanks.map((blank) => (
                    <div key={`ficha-blank-${blank}`} className="h-11" />
                  ))}

                  {fichaDaysArray.map((day) => {
                    const date = new Date(fichaYear, fichaMonth, day);
                    const dateStr = formatDateKey(date);
                    const daySessions = selectedFichaSessionsByDate[dateStr] ?? [];
                    const hasSessions = daySessions.length > 0;
                    const isSelected = selectedFichaDay.toDateString() === date.toDateString();

                    return (
                      <div key={`ficha-day-wrap-${day}`} className="relative group">
                        <button
                          key={`ficha-day-${day}`}
                          type="button"
                          onClick={() => setSelectedFichaDay(date)}
                          className={`relative h-11 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center border
                            ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                                : hasSessions
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  : "bg-white dark:bg-coal-400 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-blue-200"
                            }
                          `}
                        >
                          {day}
                          {hasSessions && (
                            <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                          )}
                        </button>

                        {hasSessions && (
                          <div className="pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 hidden w-64 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 shadow-xl p-3 group-hover:block">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Horario del día</p>
                                <p className="text-xs font-bold text-gray-800 dark:text-white mt-1">
                                  {date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                                </p>
                              </div>
                              <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-[10px] font-black text-blue-600 dark:text-blue-300">
                                {daySessions.length}
                              </span>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                              {daySessions.map((session) => (
                                <div key={session.id} className="rounded-xl bg-gray-50 dark:bg-coal-500/20 border border-gray-100 dark:border-gray-700 p-2.5">
                                  <p className="text-[11px] font-bold text-gray-800 dark:text-white line-clamp-2">{session.materia}</p>
                                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                    <span>{session.horaInicial} - {session.horaFinal}</span>
                                    <span className="truncate">{session.aula}</span>
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
              </div>

              {/* RESUMEN GENERAL */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-coal-400 p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                      Resumen general
                    </h3>
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1">
                      Indicadores principales del instructor.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-300">
                    <KeenIcon icon="chart-line-up" className="text-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-900/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500 dark:text-blue-400">Fichas</p>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-300 leading-none mt-2">{totalFichas}</p>
                    <p className="text-[10px] mt-2 text-gray-500 uppercase tracking-wider">Asignadas</p>
                  </div>
                  <div className="rounded-2xl bg-green-50/70 dark:bg-green-900/15 border border-green-100 dark:border-green-900/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-500 dark:text-green-400">RAPs</p>
                    <p className="text-3xl font-black text-green-600 dark:text-green-300 leading-none mt-2">{totalRAPs}</p>
                    <p className="text-[10px] mt-2 text-gray-500 uppercase tracking-wider">Programados</p>
                  </div>
                  <div className="rounded-2xl bg-orange-50/70 dark:bg-orange-900/15 border border-orange-100 dark:border-orange-900/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500 dark:text-orange-400">Sesiones</p>
                    <p className="text-3xl font-black text-orange-600 dark:text-orange-300 leading-none mt-2">{totalSesiones}</p>
                    <p className="text-[10px] mt-2 text-gray-500 uppercase tracking-wider">Planeadas</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500 dark:text-amber-400">Horas</p>
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-300 leading-none mt-2">{totalHoras.toFixed(1)}</p>
                    <p className="text-[10px] mt-2 text-gray-500 uppercase tracking-wider">Acumuladas</p>
                  </div>
                  <Link 
                    to="/ambiente-virtual/historial-raps"
                    state={{ activeMenu: 'actividades-asignadas' }}
                    className="col-span-2 rounded-2xl bg-purple-50/70 dark:bg-purple-900/15 border border-purple-100 dark:border-purple-900/30 p-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-500 dark:text-purple-400">Por evaluar</p>
                        <p className="text-3xl font-black text-purple-600 dark:text-purple-300 leading-none mt-2">{actividadesPorEvaluar.length}</p>
                        <p className="text-[10px] mt-2 text-gray-500 uppercase tracking-wider">Pendientes</p>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-white dark:bg-coal-400 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
                        <KeenIcon icon="document" className="text-xl" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DERECHA: FICHAS SEPARADAS POR TIPO */}
        <div className="space-y-4">
          <ExpandableFichaSection
            title="Fichas de formación"
            subtitle="Haz clic en una ficha para ver su detalle"
            accent="blue"
            items={fichasFormacionAccordion}
            emptyText="No tienes fichas de formación registradas."
          />

          <ExpandableFichaSection
            title="Fichas como líder"
            subtitle="Haz clic en una ficha para ver su detalle como líder"
            accent="emerald"
            items={fichasLiderAccordion}
            emptyText="No tienes fichas registradas como instructor líder."
            emptyResultsText="Esta ficha líder aún no tiene RAPs u horarios disponibles en el dashboard."
          />
        </div>
      </section>

            {/*        BOTTOM GRID: Calendario (Left) / Actividades (Right)        */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        
        {/* LEFT COLUMN: Calendar */}
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
                <button onClick={() => setCalendarView('day')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${calendarView === 'day' ? 'bg-white dark:bg-coal-300 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Día</button>
              </div>
            </div>
            
            {/* SEMÁFORO RMI */}
            <div className="bg-white dark:bg-coal-400 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 flex items-center gap-4 w-full">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-md ${rmiCalculations.semaforoMes.bg}`}>
                  <KeenIcon icon="time" className="text-xl" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Mensual</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white leading-none mt-0.5">
                    {rmiCalculations.horasMes.toFixed(1)} <span className="text-[10px] text-gray-400 font-semibold uppercase">/ 160h</span>
                  </p>
                  <p className={`text-[10px] font-bold uppercase mt-1 ${rmiCalculations.semaforoMes.text}`}>
                    {rmiCalculations.semaforoMes.label}
                  </p>
                </div>
              </div>
              
              <div className="hidden sm:block w-px h-10 bg-gray-100 dark:bg-gray-700"></div>
              
              <div className="flex-1 flex items-center justify-end gap-4 w-full">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acumulado</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white leading-none mt-0.5">
                    {rmiCalculations.acumuladoHoras.toFixed(1)} <span className="text-[10px] text-gray-400 font-semibold uppercase">/ {rmiCalculations.metaAcumulada}h</span>
                  </p>
                  <p className={`text-[10px] font-bold uppercase mt-1 ${rmiCalculations.semaforoAcumulado.text}`}>
                    {rmiCalculations.semaforoAcumulado.label}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    {rmiCalculations.textoInicio} · {rmiCalculations.mesesTranscurridos} meses × 160 h
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-md ${rmiCalculations.semaforoAcumulado.bg}`}>
                  <KeenIcon icon="chart-line-up" className="text-xl" />
                </div>
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
                      const estadoDia = estadoDiaCalendario[dateStr];
                      const { className: celdaCls, style: celdaStyle } =
                        estiloCeldaMiCalendarioInstructor(estadoDia);
                      const mostrarMarcador =
                        daySessions.length > 0 || (estadoDia && estadoDia !== 'normal');
                      return (
                        <div
                          key={day}
                          onClick={() => { setSelectedDay(new Date(year, month, day)); setCalendarView('day'); }}
                          className={`group relative h-8 md:h-10 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer ${celdaCls}`}
                          style={celdaStyle}
                        >
                          <span className="z-10">{day}</span>
                          {mostrarMarcador && daySessions.length > 0 && (
                            <>
                              <div className="absolute bottom-1.5 flex gap-1 z-10">
                                {daySessions.slice(0, 3).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full ${colorPuntoMiCalendarioInstructor(estadoDia)}`}
                                  />
                                ))}
                              </div>

                              <div className="pointer-events-none absolute left-1/2 bottom-full z-[80] mb-3 hidden w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-blue-900/10 ring-1 ring-black/5 group-hover:block dark:border-blue-900/50 dark:bg-coal-500 dark:shadow-black/30">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/75">Clases del día</p>
                                  <p className="mt-0.5 text-sm font-extrabold">
                                    {new Date(year, month, day).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                                  </p>
                                </div>

                                <div className="max-h-60 overflow-y-auto p-3">
                                  {daySessions.map((s) => (
                                    <div key={s.id} className="mb-2 last:mb-0 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-left dark:border-gray-700 dark:bg-coal-400">
                                      <div className="mb-1 flex items-center gap-2 text-[11px] font-black text-blue-600 dark:text-blue-300">
                                        <KeenIcon icon="time" className="text-xs" />
                                        <span>{s.horaInicial} - {s.horaFinal}</span>
                                      </div>
                                      <p className="line-clamp-2 text-xs font-bold leading-snug text-gray-900 dark:text-white">{s.materia}</p>
                                      <p className="mt-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">{s.aula}</p>
                                      <p className="mt-1 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                        {s.estado}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-blue-100 bg-white dark:border-blue-900/50 dark:bg-coal-500" />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-600 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: '#fed7aa' }} /> Hoy
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: '#dcfce7' }} /> Completada
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: '#dbeafe' }} /> Pendiente
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                    {resumenMesCalendario.completadas} día
                    {resumenMesCalendario.completadas === 1 ? '' : 's'} con sesión ·{' '}
                    {resumenMesCalendario.pendientes} pendiente
                    {resumenMesCalendario.pendientes === 1 ? '' : 's'} (misma regla que detalle de clase).
                  </p>
                </>
              ) : calendarView === 'week' ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={prevWeek}
                      className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-coal-500 flex items-center justify-center text-gray-600 dark:text-gray-300"
                    >
                      <KeenIcon icon="left" />
                    </button>

                    <div className="text-center">
                      <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                        {monthNames[month]} {year}
                      </h3>
                      <p className="text-[10px] font-semibold text-black dark:text-white mt-0.5">
                        Semana: {currentWeekRange.label}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">
                        {weeklySessions.length} clases
                      </span>
                    </div>

                    <button
                      onClick={nextWeek}
                      className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-coal-500 flex items-center justify-center text-gray-600 dark:text-gray-300"
                    >
                      <KeenIcon icon="right" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase mb-2">
                    <div>Lun</div>
                    <div>Mar</div>
                    <div>Mié</div>
                    <div>Jue</div>
                    <div>Vie</div>
                    <div>Sáb</div>
                    <div>Dom</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 flex-1">
                    {blanks.map(b => (
                      <div key={`blank-week-${b}`} className="h-8 md:h-10" />
                    ))}

                    {daysArray.map(day => {
                      const dayDate = new Date(year, month, day);
                      dayDate.setHours(0, 0, 0, 0);

                      const dateStr = formatDateKey(dayDate);
                      const isInSelectedWeek = isDateInRange(dayDate, currentWeekRange.start, currentWeekRange.end);
                      const daySessions = isInSelectedWeek ? sessionsByDate[dateStr] || [] : [];
                      const estadoDia = isInSelectedWeek ? estadoDiaCalendario[dateStr] : undefined;
                      const { className: celdaCls, style: celdaStyle } = isInSelectedWeek
                        ? estiloCeldaMiCalendarioInstructor(estadoDia)
                        : { className: 'text-gray-700 dark:text-gray-300 font-medium' };

                      return (
                        <div
                          key={`week-${day}`}
                          onClick={() => {
                            setSelectedDay(dayDate);
                            setCalendarView('day');
                          }}
                          className={`group relative h-8 md:h-10 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer ${celdaCls} ${
                            !isInSelectedWeek ? 'opacity-30 hover:opacity-60' : ''
                          }`}
                          style={isInSelectedWeek ? celdaStyle : undefined}
                        >
                          <span className="z-10">{day}</span>

                          {isInSelectedWeek && daySessions.length > 0 && (
                            <>
                              <div className="absolute bottom-1.5 flex gap-1 z-10">
                                {daySessions.slice(0, 3).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full ${colorPuntoMiCalendarioInstructor(estadoDia)}`}
                                  />
                                ))}
                              </div>

                              <div className="pointer-events-none absolute left-1/2 bottom-full z-[80] mb-3 hidden w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-blue-900/10 ring-1 ring-black/5 group-hover:block dark:border-blue-900/50 dark:bg-coal-500 dark:shadow-black/30">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                                    Clases de la semana
                                  </p>
                                  <p className="mt-0.5 text-sm font-extrabold">
                                    {dayDate.toLocaleDateString('es-CO', {
                                      weekday: 'long',
                                      day: 'numeric',
                                      month: 'long',
                                    })}
                                  </p>
                                </div>

                                <div className="max-h-60 overflow-y-auto p-3">
                                  {daySessions.map((s) => (
                                    <div
                                      key={s.id}
                                      className="mb-2 last:mb-0 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-left dark:border-gray-700 dark:bg-coal-400"
                                    >
                                      <div className="mb-1 flex items-center gap-2 text-[11px] font-black text-blue-600 dark:text-blue-300">
                                        <KeenIcon icon="time" className="text-xs" />
                                        <span>{s.horaInicial} - {s.horaFinal}</span>
                                      </div>

                                      <p className="line-clamp-2 text-xs font-bold leading-snug text-gray-900 dark:text-white">
                                        {s.materia}
                                      </p>

                                      <p className="mt-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                        {s.aula}
                                      </p>
                                      <p className="mt-1 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                        {s.estado}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-blue-100 bg-white dark:border-blue-900/50 dark:bg-coal-500" />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Día seleccionado</h3>
                      <p className="text-[10px] font-semibold text-gray-400 mt-0.5 capitalize">{selectedDay.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-coal-500 rounded p-1">
                      <button onClick={() => changeSelectedDay(-1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-coal-300 text-gray-600 dark:text-gray-300 shadow-sm transition-colors">
                        <KeenIcon icon="left" className="text-xs" />
                      </button>
                      <button onClick={() => changeSelectedDay(1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-coal-300 text-gray-600 dark:text-gray-300 shadow-sm transition-colors">
                        <KeenIcon icon="right" className="text-xs" />
                      </button>
                    </div>
                  </div>
                  
                  {(() => {
                    const dateStr = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`;
                    const daySessions = sessionsByDate[dateStr] || [];
                    if (daySessions.length === 0) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                          <KeenIcon icon="coffee" className="text-4xl text-gray-300 mb-3" />
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Día libre</h3>
                          <p className="text-xs text-gray-500 mt-1">No hay clases programadas para este día.</p>
                        </div>
                      );
                    }
                    return (
                      <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
                        {daySessions.map(session => (
                          <div key={session.id} className="flex items-stretch gap-3 group">
                            <div className={`flex flex-col items-center justify-center w-[72px] shrink-0 ${rmiCalculations.semaforoMes.bgLight} rounded-xl border ${rmiCalculations.semaforoMes.border}`}>
                              <span className={`text-[10px] font-bold ${rmiCalculations.semaforoMes.text} uppercase leading-none mb-1`}>Inicio</span>
                              <span className={`text-sm font-black ${rmiCalculations.semaforoMes.text} leading-none`}>{session.horaInicial}</span>
                            </div>
                            <div className="flex-1 bg-white dark:bg-coal-400 rounded-xl p-3 border border-gray-100 dark:border-gray-800 hover:border-primary/30 transition-colors shadow-sm">
                              <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-1">{session.materia}</h3>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                                <span className="flex items-center gap-1"><KeenIcon icon="time" /> Fin {session.horaFinal}</span>
                                <span className="flex items-center gap-1 truncate"><KeenIcon icon="geolocation" /> {session.aula}</span>
                                <span className={`flex items-center gap-1 truncate font-bold ${rmiCalculations.semaforoMes.text}`}><KeenIcon icon="flag" /> {rmiCalculations.semaforoMes.label}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
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
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-coal-500/30 border border-gray-100 dark:border-gray-700/50 hover:border-warning/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <KeenIcon icon="document" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">Por evaluar</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Entregas listas para revisar</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">{porCalificar}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-coal-500/30 border border-gray-100 dark:border-gray-700/50 hover:border-success/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                      <KeenIcon icon="check-circle" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">Calificadas</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Entregas ya evaluadas</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-green-600 dark:text-green-400">{calificadas}</span>
                </div>
              </div>

              {/* LISTA DE ACTIVIDADES RECIENTES (To match the visual grid from the image but sleek) */}
              <div className="mt-2 pt-5 border-t border-gray-100 dark:border-gray-700 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Entregas Recientes</h3>
                </div>
                
                {actividadesPorEvaluar.length > 0 ? (
                  <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar max-h-[300px] pr-1">
                    {actividadesPorEvaluar.slice(0, 4).map(act => (
                      <Link 
                        to={act.idHorarioMateria ? `/ambiente-virtual/clase/${act.idHorarioMateria}` : act.idHorario ? `/ambiente-virtual/clase/${act.idHorario}` : act.materia?.idHorario ? `/ambiente-virtual/clase/${act.materia.idHorario}` : act.materia?.idHorarioMateria ? `/ambiente-virtual/clase/${act.materia.idHorarioMateria}` : act.materia?.id ? `/ambiente-virtual/clase/${act.materia.id}` : "/ambiente-virtual/historial-raps"}
                        state={{ activeMenu: 'actividades-asignadas' }}
                        key={act.id} 
                        className="p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-white dark:bg-coal-400 group block"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{getTitulo(act)}</h4>
                          <span className="shrink-0 text-[8px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-1.5 py-0.5 rounded">Por evaluar</span>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">{act.materia?.nombreMateria || 'Sin materia asignada'}</p>
                        <div className="flex items-center justify-between text-[9px] font-semibold text-gray-400">
                          <span className="flex items-center gap-1"><KeenIcon icon="calendar" className="text-[10px]" /> {act.fechaFin ? new Date(act.fechaFin).toLocaleDateString() : 'Sin fecha'}</span>
                          
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gray-50 dark:bg-coal-500/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <span className="text-2xl mb-2">    </span>
                    <p className="text-xs font-semibold text-gray-500">¡Al día! No hay entregas pendientes por revisar.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

      </div>

    </div>
  );
};
export default ProfesoresContent;


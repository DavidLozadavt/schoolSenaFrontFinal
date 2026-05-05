import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useResponsive } from '@/hooks';
import { KeenIcon, ImageZoomModal, Toast, DefaultTooltip } from '@/components';
import { Container } from '@/components/container';
import StudentListByMateria from './ListaHorarioEstudiantes';
import {
  ModalCrearActividad,
  ModalVerActividad,
  ModalCrearCuestionario,
  ModalAsignarActividad,
  ModalAprendices,
  ModalAmpliarActividad,
  ModalMaterialApoyo,
  ListaActividades,
  MaterialApoyoFichaView,
  MaterialApoyoAprendiz,
  type Actividad
} from './actividades';
import { VerGruposView } from './grupos';
import CalificacionesFichaView from './calificaciones/CalificacionesFichaView';

/** YYYY-MM-DD en calendario local (no usar toISOString() para claves: desfasa el día en UTC). */
const formatYmdLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * idDía en BD (1=lun … 7=dom) → valor de Date.getDay() (0=dom … 6=sáb).
 * El API a veces envía string ("6"); sin Number() la comparación con getDay() falla y el calendario queda sin colores.
 */
const idDiaHorarioAGetDay = (idDia: unknown): number | null => {
  const n = Number(idDia);
  if (!Number.isFinite(n) || n < 1 || n > 7) return null;
  return n === 7 ? 0 : n;
};

/** Parse YYYY-MM-DD en hora local (misma regla que en el calendario). */
const parseYmdLocal = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
};

/** Texto tipo "Jueves" / "jue" / letra de calendario (L M X J V S D) → Date.getDay() (0–6). */
const diaSemanaTextoAGetDay = (diaSemana?: string): number | null => {
  if (!diaSemana?.trim()) return null;
  const t = diaSemana
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (t.length === 1) {
    const una: Record<string, number> = { d: 0, l: 1, m: 2, x: 3, j: 4, v: 5, s: 6 };
    const u = una[t];
    if (u !== undefined) return u;
  }
  if (t.includes('domingo') || t.startsWith('dom')) return 0;
  if (t.includes('lunes') || t.startsWith('lun')) return 1;
  if (t.includes('martes') || t.startsWith('mar')) return 2;
  if (t.includes('miercoles') || t.includes('miércoles') || t.startsWith('mie') || t === 'mi') return 3;
  if (t.includes('jueves') || t.startsWith('jue') || t === 'ju') return 4;
  if (t.includes('viernes') || t.startsWith('vie')) return 5;
  if (t.includes('sabado') || t.includes('sábado') || t.startsWith('sab')) return 6;
  return null;
};

/**
 * Día de la semana de la clase para pintar el calendario (0–6).
 * Orden: idDia BD → texto dia_semana → cualquier fila horario → idDia de la fila horario → 1.ª sesión → fechaInicial.
 */
/** Lee propiedades aunque el backend/PDO envíe otro casing (id_dia, iddia…). */
const getProp = (obj: unknown, ...names: string[]): unknown => {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as Record<string, unknown>;
  const keys = Object.keys(o);
  for (const name of names) {
    const hit = keys.find((k) => k.toLowerCase() === name.toLowerCase());
    if (hit !== undefined && o[hit] !== undefined && o[hit] !== null) return o[hit];
  }
  return undefined;
};

/** Texto para tooltips del calendario: el API puede usar camelCase o snake_case. */
const strFromRow = (r: Record<string, unknown>, ...names: string[]): string => {
  const v = getProp(r, ...names);
  return v === undefined || v === null ? '' : String(v);
};

/** Modo del día de la semana (0–6) más frecuente en sesiones con fecha. */
const inferirGetDayDesdeSesiones = (
  sesiones: Array<{ fechaSesion?: string }> | undefined
): number | null => {
  if (!sesiones?.length) return null;
  const counts = new Map<number, number>();
  for (const s of sesiones) {
    const d = parseYmdLocal(s.fechaSesion);
    if (!d) continue;
    const wd = d.getDay();
    counts.set(wd, (counts.get(wd) || 0) + 1);
  }
  let best: number | null = null;
  let n = 0;
  counts.forEach((c, wd) => {
    if (c > n) {
      n = c;
      best = wd;
    }
  });
  return best;
};

const resolverGetDayClaseCalendario = (opts: {
  idDia?: unknown;
  diaSemana?: string;
  fechaInicio?: string;
  filaHorario?: { idDia?: unknown; dia_semana?: string };
  filasHorario?: Array<{ idDia?: unknown; dia_semana?: string }>;
  primeraSesionFecha?: string;
  sesionesParaInferir?: Array<{ fechaSesion?: string }>;
}): number | null => {
  const a = idDiaHorarioAGetDay(opts.idDia);
  if (a !== null) return a;
  const b = diaSemanaTextoAGetDay(opts.diaSemana);
  if (b !== null) return b;
  if (opts.filasHorario?.length) {
    for (const fc of opts.filasHorario) {
      const idd = getProp(fc, 'idDia', 'id_dia', 'iddia');
      const ds = getProp(fc, 'dia_semana', 'diaSemana');
      const d =
        idDiaHorarioAGetDay(idd) ?? diaSemanaTextoAGetDay(ds != null ? String(ds) : undefined);
      if (d !== null) return d;
    }
  }
  const fid = getProp(opts.filaHorario, 'idDia', 'id_dia', 'iddia');
  const fds = getProp(opts.filaHorario, 'dia_semana', 'diaSemana');
  const c =
    idDiaHorarioAGetDay(fid) ??
    diaSemanaTextoAGetDay(fds != null ? String(fds) : undefined);
  if (c !== null) return c;
  const d1 = parseYmdLocal(opts.primeraSesionFecha);
  if (d1) return d1.getDay();
  const inf = inferirGetDayDesdeSesiones(opts.sesionesParaInferir);
  if (inf !== null) return inf;
  const d2 = parseYmdLocal(opts.fechaInicio);
  if (d2) return d2.getDay();
  return null;
};

/** Unifica forma del objeto `clase` (Laravel/PDO pueden mandar id_dia, iddia, etc.). */
const normalizarClaseDetalleApi = (raw: unknown): Clase | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const idDiaRaw = getProp(o, 'idDia', 'id_dia', 'iddia');
  const idDiaNum = idDiaRaw !== undefined ? Number(idDiaRaw) : NaN;
  const diaSem = getProp(o, 'dia_semana', 'diaSemana');
  const sesComp =
    getProp(o, 'sesiones_completadas', 'sesionesCompletadas') ?? o.sesiones_completadas;
  const idHmRaw = getProp(o, 'idHorarioMateria', 'id_horario_materia', 'idhorariomateria');
  const idHmNum = idHmRaw !== undefined ? Number(idHmRaw) : NaN;
  const rapRaw = getProp(o, 'rap_nombre', 'rapNombre');
  const rapNorm =
    rapRaw == null || rapRaw === '' || String(rapRaw).toLowerCase() === 'null'
      ? null
      : String(rapRaw).trim();
  const idMatRaw = getProp(o, 'idMateria', 'id_materia');
  const idMatNum = idMatRaw !== undefined ? Number(idMatRaw) : NaN;
  return {
    ...(o as Clase),
    idDia: Number.isFinite(idDiaNum) && idDiaNum >= 1 && idDiaNum <= 7 ? idDiaNum : (o as Clase).idDia,
    dia_semana: (diaSem != null ? String(diaSem) : (o as Clase).dia_semana) as string,
    fechaInicial: String(getProp(o, 'fechaInicial', 'fecha_inicial') ?? o.fechaInicial ?? ''),
    fechaFinal: String(getProp(o, 'fechaFinal', 'fecha_final') ?? o.fechaFinal ?? ''),
    sesiones_completadas: Array.isArray(sesComp) ? (sesComp as Clase['sesiones_completadas']) : [],
    ...(Number.isFinite(idHmNum) && idHmNum > 0 ? { idHorarioMateria: idHmNum } : {}),
    competencia_nombre: strFromRow(o, 'competencia_nombre', 'competenciaNombre'),
    rap_nombre: rapNorm,
    ...(Number.isFinite(idMatNum) && idMatNum > 0 ? { idMateria: idMatNum } : {})
  };
};

/** Misma lógica que Historial RAPs: competencia (negrita) + RAP (pequeño) + fallback por “código - texto”. */
const titulosCompetenciaYRapDetalle = (clase: Clase): { competencia: string; rap: string | null } => {
  const materia = String(clase.materia_nombre ?? '').trim();
  const compApi = String(clase.competencia_nombre ?? '').trim();
  let competencia =
    compApi || materia || String(clase.programa_nombre ?? '').trim() || 'Sin nombre';
  let rap =
    clase.rap_nombre != null && String(clase.rap_nombre).trim() !== ''
      ? String(clase.rap_nombre).trim()
      : null;

  if (!rap && materia.includes(' - ')) {
    const sep = ' - ';
    const i = materia.indexOf(sep);
    const tail = materia.slice(i + sep.length).trim();
    const head = materia.slice(0, i).trim();
    if (tail.length > 0 && head.length > 0) {
      rap = tail;
      if (compApi === materia) {
        competencia = head;
      }
    }
  }

  return { competencia, rap };
};

/** Normaliza filas de horario para idDia / dia_semana con cualquier casing. */
const normalizarFilaFechaClaseApi = (raw: unknown): FechaClase | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const idD = getProp(r, 'idDia', 'id_dia', 'iddia');
  const idn = idD !== undefined ? Number(idD) : NaN;
  const ds = getProp(r, 'dia_semana', 'diaSemana');
  const idHmRaw = getProp(r, 'idHorarioMateria', 'id_horario_materia') ?? r.idHorarioMateria;
  const idHmNum = Number(idHmRaw);
  const fallbackIdDia = Number(getProp(r, 'idDia', 'id_dia') ?? 0);
  const fechaInicial = String(getProp(r, 'fechaInicial', 'fecha_inicial') ?? r.fechaInicial ?? '');
  const fechaFinalRaw = getProp(r, 'fechaFinal', 'fecha_final') ?? r.fechaFinal;
  const fechaFinal =
    fechaFinalRaw === null || fechaFinalRaw === undefined ? null : String(fechaFinalRaw);

  return {
    ...(Number.isFinite(idHmNum) && idHmNum > 0 ? { idHorarioMateria: idHmNum } : {}),
    idDia: Number.isFinite(idn) ? idn : fallbackIdDia,
    dia_semana: ds != null ? String(ds) : String(getProp(r, 'dia_semana', 'diaSemana') ?? ''),
    fechaInicial,
    fechaFinal,
    ficha_codigo: strFromRow(r, 'ficha_codigo', 'fichaCodigo'),
    materia_nombre: strFromRow(r, 'materia_nombre', 'materiaNombre', 'nombreMateria'),
    programa_nombre: strFromRow(r, 'programa_nombre', 'programaNombre', 'nombrePrograma'),
    horaInicial: strFromRow(r, 'horaInicial', 'hora_inicial'),
    horaFinal: strFromRow(r, 'horaFinal', 'hora_final'),
    jornada_nombre: strFromRow(r, 'jornada_nombre', 'jornadaNombre', 'nombreJornada')
  };
};

/** Una fila de clase para tooltip por día (puede haber varias el mismo día). */
interface ClaseTooltipDia {
  idHorarioMateria: number;
  ficha_codigo: string;
  materia_nombre: string;
  programa_nombre: string;
  horaInicial: string;
  horaFinal: string;
  jornada_nombre: string;
}

/** Misma ficha + materia + franja horaria → un solo bloque en tooltip (evita duplicados por varios idHorarioMateria en BD). */
const claveFranjaTooltipDia = (row: ClaseTooltipDia): string =>
  `${String(row.ficha_codigo || '')
    .trim()
    .toLowerCase()}|${String(row.materia_nombre || '')
    .trim()
    .toLowerCase()}|${(row.horaInicial || '').substring(0, 5)}|${(row.horaFinal || '').substring(0, 5)}`;

/** Resumen de la clase actual (fallback si el API no trae fila para esa fecha). */
type ResumenClaseCalendario = {
  ficha_codigo?: string;
  materia_nombre?: string;
  programa_nombre?: string;
  horaInicial?: string;
  horaFinal?: string;
  idHorarioMateria?: number;
  jornada_nombre?: string;
};

/** Panel del tooltip del calendario: claro blanco/azul; en oscuro alineado al tema (coal). */
const CLASE_CALENDARIO_TOOLTIP_SURFACE =
  '!rounded-lg !max-w-[min(100vw-2rem,24rem)] !p-0 !text-left !bg-white !text-slate-900 !border !border-blue-200 !shadow-lg !overflow-hidden dark:!bg-coal-600 dark:!text-white dark:!border-gray-500/50';

/** Padding del contenido (va dentro del panel con overflow oculto en el borde). */
const CLASE_CALENDARIO_TOOLTIP_INNER_PAD = 'p-3';

function clasesBadgeEstadoCalendario(etiqueta: string): string {
  if (etiqueta === 'Tu clase en curso') {
    return 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200';
  }
  if (etiqueta === 'En curso') {
    return 'bg-blue-100 text-blue-900 dark:bg-blue-500/35 dark:text-blue-50';
  }
  if (etiqueta === 'Pendiente') {
    return 'bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100';
  }
  if (etiqueta === 'En espera') {
    return 'bg-white text-gray-700 border border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-gray-600';
  }
  if (etiqueta === 'Próximo') {
    return 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200';
  }
  if (etiqueta === 'Completada' || etiqueta === 'Sesión ya vista') {
    return 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/35 dark:text-emerald-100';
  }
  if (etiqueta === 'Pasada' || etiqueta === 'Clase pasada' || etiqueta === 'Día pasado') {
    return 'bg-slate-100 text-slate-700 dark:bg-white/12 dark:text-gray-200';
  }
  return 'bg-blue-50 text-blue-900 dark:bg-white/12 dark:text-gray-200';
}

/** Sesiones por idHorarioMateria (misma respuesta que `obtenerSesionesCompletadas` por bloque). */
type SesionesPorHorarioMap = Record<
  string,
  Array<{ fechaSesion: string; numeroSesion?: number; id?: number }>
>;

// Componente de Calendario
const CalendarComponent: React.FC<{
  fechaInicio: string;
  fechaFin: string;
  diaSemana?: string;
  todasLasFechasClase?: FechaClase[];
  idDia?: number;
  idHorarioMateria?: number;
  sesionesCompletadas?: Array<{ fechaSesion: string; numeroSesion?: number }>;
  /** Todas las sesiones registradas por horario (varias materias el mismo día). */
  sesionesCompletadasPorHorario?: SesionesPorHorarioMap;
  /** Instructor: varias franjas/día en tooltip. Aprendiz: solo esta materia/horario. */
  modoCalendario?: 'instructor' | 'aprendiz';
  horaInicial?: string;
  horaFinal?: string;
  resumenClaseActual?: ResumenClaseCalendario;
}> = ({
  fechaInicio,
  fechaFin,
  diaSemana,
  todasLasFechasClase = [],
  idDia,
  idHorarioMateria,
  sesionesCompletadas = [],
  sesionesCompletadasPorHorario = {},
  modoCalendario = 'instructor',
  horaInicial,
  horaFinal,
  resumenClaseActual
}) => {
    /** Aprendiz: solo esta clase; instructor: todas las franjas del API. */
    const todasLasFechasCalendario = useMemo(() => {
      if (modoCalendario === 'aprendiz' && idHorarioMateria != null) {
        const id = Number(idHorarioMateria);
        return todasLasFechasClase.filter((fc) => Number(fc.idHorarioMateria) === id);
      }
      return todasLasFechasClase;
    }, [modoCalendario, todasLasFechasClase, idHorarioMateria]);

    const sesionesCompletadasPorHorarioEfectivo = useMemo(() => {
      if (modoCalendario !== 'aprendiz' || idHorarioMateria == null) {
        return sesionesCompletadasPorHorario;
      }
      const m = sesionesCompletadasPorHorario || {};
      const id = Number(idHorarioMateria);
      const arr = m[id] ?? m[String(id)];
      if (Array.isArray(arr) && arr.length > 0) {
        return { [id]: arr } as SesionesPorHorarioMap;
      }
      return {} as SesionesPorHorarioMap;
    }, [modoCalendario, idHorarioMateria, sesionesCompletadasPorHorario]);

    const getSesionesParaHorario = useCallback(
      (rowId: number | undefined): Array<{ fechaSesion: string; numeroSesion?: number }> => {
        if (rowId == null) return [];
        const m = sesionesCompletadasPorHorarioEfectivo || {};
        const fromMap = m[rowId] ?? m[String(rowId)];
        if (Array.isArray(fromMap) && fromMap.length > 0) return fromMap;
        if (rowId === idHorarioMateria && sesionesCompletadas.length > 0) return sesionesCompletadas;
        return [];
      },
      [sesionesCompletadasPorHorarioEfectivo, idHorarioMateria, sesionesCompletadas]
    );

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

    // Calcular todas las fechas de clase usando las fechas del backend y sesiones completadas
    const fechasClase = useMemo(() => {
      const fechas: Date[] = [];

      const primeraSesionFecha = sesionesCompletadas.find((s) => s.fechaSesion)?.fechaSesion;
      const diaClaseJsResuelto = resolverGetDayClaseCalendario({
        idDia,
        diaSemana,
        fechaInicio,
        filasHorario: todasLasFechasCalendario,
        filaHorario: todasLasFechasCalendario[0],
        primeraSesionFecha,
        sesionesParaInferir: sesionesCompletadas
      });

      /** Rango real del horario: la clase a veces trae fechaFinal corta; horarioMateria puede ir más lejos. */
      let minRango: Date | null = null;
      let maxRango: Date | null = null;
      const bumpMin = (d: Date | null | undefined) => {
        if (!d || isNaN(d.getTime())) return;
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        if (!minRango || x.getTime() < minRango.getTime()) minRango = x;
      };
      const bumpMax = (d: Date | null | undefined) => {
        if (!d || isNaN(d.getTime())) return;
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        if (!maxRango || x.getTime() > maxRango.getTime()) maxRango = x;
      };

      bumpMin(parseDate(fechaInicio));
      bumpMax(parseDate(fechaFinParaUsar));
      todasLasFechasCalendario.forEach((fc) => {
        if (fc.fechaInicial) bumpMin(parseDate(fc.fechaInicial));
        if (fc.fechaFinal) bumpMax(parseDate(fc.fechaFinal));
        else if (fc.fechaInicial) bumpMax(parseDate(fc.fechaInicial));
      });

      // Si tenemos todas las fechas del backend, usarlas directamente (aprendiz: ya filtradas a esta materia)
      if (todasLasFechasCalendario && todasLasFechasCalendario.length > 0) {
        todasLasFechasCalendario.forEach((fechaClase) => {
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
                  const diaJs =
                    idDiaHorarioAGetDay(fechaClase.idDia) ?? diaSemanaTextoAGetDay(fechaClase.dia_semana);
                  if (diaJs !== null) {
                    const fechaActual = new Date(fechaIni);
                    while (fechaActual <= fechaFin) {
                      if (fechaActual.getDay() === diaJs) {
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

      // SIEMPRE: una ocurrencia por semana en [minRango, maxRango] con idDia (misma lógica que el backend)
      // Usa el rango unificado (clase + filas horarioMateria) para no cortar en abril si el horario sigue en mayo+.
      if (minRango && maxRango && diaClaseJsResuelto !== null) {
        const inicio = new Date(minRango);
        const fin = new Date(maxRango);
        if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime())) {
          inicio.setHours(0, 0, 0, 0);
          fin.setHours(0, 0, 0, 0);

          if (diaClaseJsResuelto >= 0 && diaClaseJsResuelto <= 6) {
            const fechaActual = new Date(inicio);
            let contador = 0;
            const maxIteraciones = 10000;

            while (fechaActual <= fin && contador < maxIteraciones) {
              if (fechaActual.getDay() === diaClaseJsResuelto) {
                const fechaClase = new Date(fechaActual);
                fechaClase.setHours(0, 0, 0, 0);
                const existe = fechas.some((f) => {
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

      // Sesiones ya dictadas: mismo rango extendido (coherente con sesiones en BD fuera del fechaFinal “corto” de clase)
      const cursoIni = minRango ? new Date(minRango) : null;
      const cursoFin = maxRango ? new Date(maxRango) : null;
      if (cursoIni) cursoIni.setHours(0, 0, 0, 0);
      if (cursoFin) cursoFin.setHours(0, 0, 0, 0);

      sesionesCompletadas.forEach((sesion) => {
        if (sesion.fechaSesion) {
          const fechaSesion = parseDate(sesion.fechaSesion);
          if (fechaSesion) {
            fechaSesion.setHours(0, 0, 0, 0);
            if (cursoIni && cursoFin) {
              if (
                fechaSesion.getTime() < cursoIni.getTime() ||
                fechaSesion.getTime() > cursoFin.getTime()
              ) {
                return;
              }
            }
            if (
              diaClaseJsResuelto !== null &&
              fechaSesion.getDay() !== diaClaseJsResuelto
            ) {
              return;
            }
            const existe = fechas.some((f) => f.getTime() === fechaSesion.getTime());
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
    }, [todasLasFechasCalendario, fechaInicio, fechaFinParaUsar, idDia, diaSemana, sesionesCompletadas]);

    const formatHora12Tooltip = (timeString: string, jornadaNombre: string): string => {
      if (!timeString) return '—';
      const time = timeString.substring(0, 5);
      const [hoursStr, minutes] = time.split(':');
      let hour24 = parseInt(hoursStr, 10);
      if (isNaN(hour24)) return timeString;
      const lowerJ = (jornadaNombre || '').toLowerCase();
      const esTardeONoche =
        lowerJ.includes('tarde') || lowerJ.includes('noche') || lowerJ.includes('nocturna');
      if (esTardeONoche && hour24 < 12) hour24 += 12;
      const esPM = hour24 >= 12;
      let hour12 = hour24 % 12;
      if (hour12 === 0) hour12 = 12;
      return `${hour12}:${minutes || '00'} ${esPM ? 'p. m.' : 'a. m.'}`;
    };

    /** Instructor: varias franjas ese día. Aprendiz: solo esta materia (una fila por día). */
    const clasesPorDiaCalendario = useMemo(() => {
      const map = new Map<string, ClaseTooltipDia[]>();

      const pickMejorFranjaDuplicada = (
        a: ClaseTooltipDia,
        b: ClaseTooltipDia,
        ymd: string,
        preferId: number | undefined
      ): ClaseTooltipDia => {
        if (preferId != null) {
          if (a.idHorarioMateria === preferId) return a;
          if (b.idHorarioMateria === preferId) return b;
        }
        const sesA = getSesionesParaHorario(a.idHorarioMateria).some(
          (s) => s.fechaSesion?.split('T')[0] === ymd
        );
        const sesB = getSesionesParaHorario(b.idHorarioMateria).some(
          (s) => s.fechaSesion?.split('T')[0] === ymd
        );
        if (sesA !== sesB) return sesA ? a : b;
        return a.idHorarioMateria <= b.idHorarioMateria ? a : b;
      };

      const agregar = (ymd: string, row: ClaseTooltipDia) => {
        if (!map.has(ymd)) map.set(ymd, []);
        const list = map.get(ymd)!;
        const k = claveFranjaTooltipDia(row);
        const dupIdx = list.findIndex((x) => claveFranjaTooltipDia(x) === k);
        if (dupIdx >= 0) {
          list[dupIdx] = pickMejorFranjaDuplicada(
            list[dupIdx],
            row,
            ymd,
            resumenClaseActual?.idHorarioMateria
          );
          return;
        }
        if (!list.some((x) => x.idHorarioMateria === row.idHorarioMateria)) {
          list.push(row);
        }
      };

      todasLasFechasCalendario.forEach((fc) => {
        if (!fc.fechaInicial || !fc.idHorarioMateria) return;
        const fechaIni = parseDate(fc.fechaInicial);
        if (!fechaIni) return;
        fechaIni.setHours(0, 0, 0, 0);
        const fechaFinFc = fc.fechaFinal ? parseDate(fc.fechaFinal) : fechaIni;
        if (!fechaFinFc) return;
        fechaFinFc.setHours(0, 0, 0, 0);

        const row: ClaseTooltipDia = {
          idHorarioMateria: fc.idHorarioMateria,
          ficha_codigo: fc.ficha_codigo || '',
          materia_nombre: fc.materia_nombre || '',
          programa_nombre: fc.programa_nombre || '',
          horaInicial: fc.horaInicial || '',
          horaFinal: fc.horaFinal || '',
          jornada_nombre: fc.jornada_nombre || ''
        };

        if (fechaIni.getTime() === fechaFinFc.getTime()) {
          agregar(formatYmdLocal(fechaIni), row);
        } else {
          const diaJs = idDiaHorarioAGetDay(fc.idDia) ?? diaSemanaTextoAGetDay(fc.dia_semana);
          if (diaJs !== null) {
            const cur = new Date(fechaIni);
            while (cur <= fechaFinFc) {
              if (cur.getDay() === diaJs) {
                agregar(formatYmdLocal(cur), row);
              }
              cur.setDate(cur.getDate() + 1);
            }
          }
        }
      });

      if (resumenClaseActual?.idHorarioMateria) {
        const fb: ClaseTooltipDia = {
          idHorarioMateria: resumenClaseActual.idHorarioMateria,
          ficha_codigo: resumenClaseActual.ficha_codigo || '',
          materia_nombre: resumenClaseActual.materia_nombre || '',
          programa_nombre: resumenClaseActual.programa_nombre || '',
          horaInicial: resumenClaseActual.horaInicial || '',
          horaFinal: resumenClaseActual.horaFinal || '',
          jornada_nombre: resumenClaseActual.jornada_nombre || ''
        };
        fechasClase.forEach((d) => {
          const ymd = formatYmdLocal(new Date(d));
          const list = map.get(ymd);
          if (!list?.some((x) => x.idHorarioMateria === fb.idHorarioMateria)) {
            agregar(ymd, fb);
          }
        });
      }

      map.forEach((list) => {
        list.sort((a, b) => (a.horaInicial || '').localeCompare(b.horaInicial || ''));
      });

      return map;
    }, [todasLasFechasCalendario, fechasClase, resumenClaseActual, getSesionesParaHorario]);

    const etiquetaEstadoTooltip = (diaCalendario: Date, row: ClaseTooltipDia): string => {
      const ahora = new Date();
      const hoy0 = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      hoy0.setHours(0, 0, 0, 0);
      const d0 = new Date(diaCalendario.getFullYear(), diaCalendario.getMonth(), diaCalendario.getDate());
      d0.setHours(0, 0, 0, 0);
      const ymd = formatYmdLocal(d0);

      const sesionesRow = getSesionesParaHorario(row.idHorarioMateria);
      const sesionRegistrada = sesionesRow.some((s) => s.fechaSesion?.split('T')[0] === ymd);

      let [hIni, mIni] = (row.horaInicial || '0:0').substring(0, 5).split(':').map(Number);
      let [hFin, mFin] = (row.horaFinal || '0:0').substring(0, 5).split(':').map(Number);
      const lowerJ = (row.jornada_nombre || '').toLowerCase();
      const esTardeONoche =
        lowerJ.includes('tarde') || lowerJ.includes('noche') || lowerJ.includes('nocturna');
      if (esTardeONoche && hIni < 12) hIni += 12;
      if (esTardeONoche && hFin < 12) hFin += 12;
      const hi = new Date(ahora);
      hi.setHours(hIni, mIni || 0, 0, 0);
      const hf = new Date(ahora);
      hf.setHours(hFin, mFin || 0, 0, 0);
      if (hf.getTime() < hi.getTime()) hf.setDate(hf.getDate() + 1);

      if (d0.getTime() < hoy0.getTime()) {
        if (sesionRegistrada) {
          return modoCalendario === 'aprendiz' ? 'Sesión ya vista' : 'Completada';
        }
        return modoCalendario === 'aprendiz' ? 'Clase pasada' : 'Pasada';
      }
      if (d0.getTime() > hoy0.getTime()) {
        return modoCalendario === 'aprendiz' ? 'En espera' : 'Pendiente';
      }

      // Mismo día: una fila en sesionMateria no implica clase terminada (puede crearse al iniciar/asistencia).
      if (ahora.getTime() < hi.getTime()) {
        return modoCalendario === 'aprendiz' ? 'Próximo' : 'Pendiente';
      }
      if (ahora.getTime() >= hi.getTime() && ahora.getTime() <= hf.getTime()) {
        return modoCalendario === 'aprendiz' ? 'Tu clase en curso' : 'En curso';
      }
      if (ahora.getTime() > hf.getTime()) {
        if (sesionRegistrada) {
          return modoCalendario === 'aprendiz' ? 'Sesión ya vista' : 'Completada';
        }
        return modoCalendario === 'aprendiz' ? 'Clase pasada' : 'Pasada';
      }
      return modoCalendario === 'aprendiz' ? 'En espera' : 'Pendiente';
    };

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

      const hoyLocal = new Date();
      hoyLocal.setHours(0, 0, 0, 0);
      const hoyTime = hoyLocal.getTime();
      const dateTime = date.getTime();

      // Naranja = día actual en el calendario (aunque no haya clase ese día).
      if (dateTime === hoyTime) {
        return 'hoy';
      }

      // Verificar si esta fecha es una fecha de clase usando comparación de strings
      let esFechaClase = false;

      for (const fecha of fechasClase) {
        const fechaClase = new Date(fecha);
        fechaClase.setHours(0, 0, 0, 0);
        const fechaClaseStr = `${fechaClase.getFullYear()}-${String(fechaClase.getMonth() + 1).padStart(2, '0')}-${String(fechaClase.getDate()).padStart(2, '0')}`;

        // Comparar tanto por timestamp como por string para mayor seguridad
        if (fechaClaseStr === dateStr || fechaClase.getTime() === date.getTime()) {
          esFechaClase = true;
          break;
        }
      }

      if (!esFechaClase) {
        return 'normal';
      }

      if (dateTime > hoyTime) {
        return 'proxima';
      }

      if (dateTime < hoyTime) {
        return 'pasada';
      }

      return 'normal';
    };

    // Sesiones registradas en BD para el mapa efectivo (instructor: todas las franjas; aprendiz: solo este horario)
    const tieneSesionCompletada = (fecha: Date): boolean => {
      const fechaStr = formatYmdLocal(fecha);
      for (const list of Object.values(sesionesCompletadasPorHorarioEfectivo || {})) {
        if (
          Array.isArray(list) &&
          list.some((sesion) => sesion.fechaSesion?.split('T')[0] === fechaStr)
        ) {
          return true;
        }
      }
      return sesionesCompletadas.some((sesion) => {
        if (!sesion.fechaSesion) return false;
        const sesionFecha = sesion.fechaSesion.split('T')[0];
        return sesionFecha === fechaStr;
      });
    };

    // Determinar el estado de una fecha específica
    const getEstadoFecha = (fecha: Date): 'completada' | 'pendiente' | 'en_curso' => {
      const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
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
        <div className="grid grid-cols-7 gap-1 overflow-visible">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-8"></div>;
            }
            const status = getDateStatus(day);
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const esFechaClase = status !== 'normal';
            const ymdKey = formatYmdLocal(date);
            const bloquesDia = clasesPorDiaCalendario.get(ymdKey) || [];

            /** Colores fijos (inline) para que no dependan de Tailwind/CSS del tema. */
            const layoutCal = 'h-8 w-full flex items-center justify-center text-sm rounded transition-colors';
            const estiloCal: React.CSSProperties | undefined =
              status === 'hoy'
                ? {
                    backgroundColor: '#fed7aa',
                    color: '#9a3412',
                    fontWeight: 600
                  }
                : status === 'proxima'
                  ? { backgroundColor: '#dbeafe', color: '#1e3a8a' }
                  : status === 'pasada'
                    ? { backgroundColor: '#dcfce7', color: '#166534' }
                    : undefined;

            const baseClass =
              status === 'normal'
                ? `${layoutCal} text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800`
                : `${layoutCal} cursor-default`;

            const celda = (
              <div className={baseClass} style={estiloCal}>
                {day}
              </div>
            );

            if (status === 'hoy') {
              return (
                <DefaultTooltip
                  key={index}
                  placement="top"
                  slotProps={{
                    popper: {
                      modifiers: [
                        { name: 'offset', options: { offset: [0, 10] } },
                        {
                          name: 'preventOverflow',
                          options: { padding: 12, altBoundary: true }
                        },
                        {
                          name: 'flip',
                          options: {
                            padding: 12,
                            fallbackPlacements: ['bottom', 'top', 'left', 'right']
                          }
                        }
                      ]
                    }
                  }}
                  enterDelay={200}
                  leaveDelay={0}
                  onOpen={() => {
                    requestAnimationFrame(() => {
                      const el = document.querySelector(
                        `[data-cal-dia-tooltip-scroll="${ymdKey}"]`
                      ) as HTMLElement | null;
                      if (el) el.scrollTop = 0;
                    });
                  }}
                  classes={{ tooltip: CLASE_CALENDARIO_TOOLTIP_SURFACE }}
                  title={
                    <div
                      data-cal-dia-tooltip-scroll={ymdKey}
                      className={[
                        CLASE_CALENDARIO_TOOLTIP_INNER_PAD,
                        'max-w-[min(100vw-2rem,22rem)] max-h-[min(65vh,21rem)] overflow-y-auto overscroll-contain space-y-2 text-left normal-case font-sans',
                        '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]'
                      ].join(' ')}
                    >
                      {bloquesDia.length > 0 ? (
                        bloquesDia.map((row) => {
                          const estadoEtiqueta = etiquetaEstadoTooltip(date, row);
                          return (
                            <div
                              key={claveFranjaTooltipDia(row)}
                              className="border-b border-slate-200 pb-2 last:border-0 last:pb-0 dark:border-white/15"
                            >
                              <p className="font-semibold leading-snug text-blue-900 dark:text-white">
                                {row.ficha_codigo ? `${row.ficha_codigo} — ` : ''}
                                {row.materia_nombre || 'Clase'}
                              </p>
                              {row.programa_nombre ? (
                                <p className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-gray-300">
                                  {row.programa_nombre}
                                </p>
                              ) : null}
                              <p className="mt-1 text-[11px] text-slate-800 dark:text-gray-200">
                                {formatHora12Tooltip(row.horaInicial, row.jornada_nombre)} —{' '}
                                {formatHora12Tooltip(row.horaFinal, row.jornada_nombre)}
                              </p>
                              <p
                                className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${clasesBadgeEstadoCalendario(estadoEtiqueta)}`}
                              >
                                {estadoEtiqueta}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-slate-800 dark:text-gray-200">
                          No hay clase el día de hoy.
                        </p>
                      )}
                    </div>
                  }
                >
                  {celda}
                </DefaultTooltip>
              );
            }

            if (esFechaClase && bloquesDia.length > 0) {
              return (
                <DefaultTooltip
                  key={index}
                  placement="top"
                  slotProps={{
                    popper: {
                      modifiers: [
                        { name: 'offset', options: { offset: [0, 10] } },
                        {
                          name: 'preventOverflow',
                          options: { padding: 12, altBoundary: true }
                        },
                        {
                          name: 'flip',
                          options: {
                            padding: 12,
                            fallbackPlacements: ['bottom', 'top', 'left', 'right']
                          }
                        }
                      ]
                    }
                  }}
                  enterDelay={200}
                  leaveDelay={0}
                  onOpen={() => {
                    requestAnimationFrame(() => {
                      const el = document.querySelector(
                        `[data-cal-dia-tooltip-scroll="${ymdKey}"]`
                      ) as HTMLElement | null;
                      if (el) el.scrollTop = 0;
                    });
                  }}
                  classes={{ tooltip: CLASE_CALENDARIO_TOOLTIP_SURFACE }}
                  title={
                    <div
                      data-cal-dia-tooltip-scroll={ymdKey}
                      className={[
                        CLASE_CALENDARIO_TOOLTIP_INNER_PAD,
                        'max-w-[min(100vw-2rem,22rem)] max-h-[min(65vh,21rem)] overflow-y-auto overscroll-contain space-y-2 text-left normal-case font-sans',
                        '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]'
                      ].join(' ')}
                    >
                      {bloquesDia.map((row) => {
                        const estadoEtiqueta = etiquetaEstadoTooltip(date, row);
                        return (
                        <div
                          key={claveFranjaTooltipDia(row)}
                          className="border-b border-slate-200 pb-2 last:border-0 last:pb-0 dark:border-white/15"
                        >
                          <p className="font-semibold leading-snug text-blue-900 dark:text-white">
                            {row.ficha_codigo ? `${row.ficha_codigo} — ` : ''}
                            {row.materia_nombre || 'Clase'}
                          </p>
                          {row.programa_nombre ? (
                            <p className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-gray-300">
                              {row.programa_nombre}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-slate-800 dark:text-gray-200">
                            {formatHora12Tooltip(row.horaInicial, row.jornada_nombre)} —{' '}
                            {formatHora12Tooltip(row.horaFinal, row.jornada_nombre)}
                          </p>
                          <p
                            className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${clasesBadgeEstadoCalendario(estadoEtiqueta)}`}
                          >
                            {estadoEtiqueta}
                          </p>
                        </div>
                        );
                      })}
                    </div>
                  }
                >
                  {celda}
                </DefaultTooltip>
              );
            }

            return (
              <div key={index} className={baseClass}>
                {day}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2 text-xs">
          {modoCalendario === 'aprendiz' ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-400"></div>
                <span className="text-gray-700 dark:text-gray-300">Verde — clases ya pasadas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-200 dark:bg-orange-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Naranja — hoy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-400"></div>
                <span className="text-gray-700 dark:text-gray-300">Azul — próximos días con clase</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-200 dark:bg-orange-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Hoy — día actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-400"></div>
                <span className="text-gray-700 dark:text-gray-300">Próximas clases</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-400"></div>
                <span className="text-gray-700 dark:text-gray-300">Clases pasadas</span>
              </div>
            </>
          )}
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
  competencia_nombre?: string;
  rap_nombre?: string | null;
  idMateria?: number;
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
  ficha_codigo?: string;
  materia_nombre?: string;
  programa_nombre?: string;
  horaInicial?: string;
  horaFinal?: string;
  jornada_nombre?: string;
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

type MenuOption = 'estudiantes' | 'agregar-actividades' | 'actividades-asignadas' | 'juicios-evaluativos' | 'ver-grupos' | 'calificaciones' | 'material-apoyo';

const ClaseDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    returnTo?: string;
    activeMenu?: MenuOption;
    ficha_id?: number;
    /** Desde Mis clases (aprendiz) vs historial RAPs (instructor). */
    vistaCalendario?: 'aprendiz' | 'instructor';
    [key: string]: unknown;
  } | null | undefined;

  const modoCalendario: 'instructor' | 'aprendiz' = useMemo(() => {
    const v = locationState?.vistaCalendario;
    if (v === 'aprendiz' || v === 'instructor') return v;
    return 'instructor';
  }, [locationState?.vistaCalendario]);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [clase, setClase] = useState<Clase | null>(null);
  const [todasLasFechasClase, setTodasLasFechasClase] = useState<FechaClase[]>([]);
  const [sesionesCompletadasPorHorario, setSesionesCompletadasPorHorario] =
    useState<SesionesPorHorarioMap>({});
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEstudiante, setSearchEstudiante] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState<MenuOption>(locationState?.activeMenu || 'estudiantes');
  const isDesktop = useResponsive('up', 'lg');
  /** En desktop: colapsado = solo iconos; expandido = menú con texto. En móvil siempre se muestran etiquetas. */
  const [menuClaseExpandido, setMenuClaseExpandido] = useState(false);
  const mostrarEtiquetasMenu = !isDesktop || menuClaseExpandido;
  const menuSoloIconos = isDesktop && !menuClaseExpandido;
  const itemsPerPage = 11;
  const [currentTime, setCurrentTime] = useState(new Date());


  //Juicios evaluativos:
  const [juiciosEvaluativos, setJuiciosEvaluativos] = useState<boolean>(false);
  const [idFicha, setIdFicha] = useState<number | undefined>(0);
  const [idSede, setIdSede] = useState<number | undefined>(0);
  const [idGrado, setIdGrado] = useState<number | undefined>(0);
  const [idPrograma, setIdPrograma] = useState<string | undefined>('');
  const [evento, setEvento] = useState<boolean>(false);

  // Actividades
  const [actividadesDisponibles, setActividadesDisponibles] = useState<Actividad[]>([]);
  const [actividadesAsignadas, setActividadesAsignadas] = useState<Actividad[]>([]);
  /** Por id actividad: total/aprendices con calificación (asignación parcial permitida) */
  const [coberturaActividades, setCoberturaActividades] = useState<
    Record<number, { total: number; asignados: number; faltan: number; entregaron?: number; pendientesEntrega?: number }>
  >({});
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [modalAsignarActividadOpen, setModalAsignarActividadOpen] = useState(false);
  const [actividadParaAsignar, setActividadParaAsignar] = useState<Actividad | null>(null);
  const [actividadesParaAsignar, setActividadesParaAsignar] = useState<Actividad[] | null>(null);
  const [assignSuccessCounter, setAssignSuccessCounter] = useState(0);
  const [modalCrearActividadOpen, setModalCrearActividadOpen] = useState(false);
  const [actividadParaEditar, setActividadParaEditar] = useState<Actividad | null>(null);
  const [modalCrearCuestionarioOpen, setModalCrearCuestionarioOpen] = useState(false);
  const [modalVerActividadOpen, setModalVerActividadOpen] = useState(false);
  const [actividadVer, setActividadVer] = useState<Actividad | null>(null);
  const [cuestionarioParaEditar, setCuestionarioParaEditar] = useState<{ id: number } | null>(null);
  const [modalAprendicesOpen, setModalAprendicesOpen] = useState(false);
  const [modalAmpliarOpen, setModalAmpliarOpen] = useState(false);
  const [actividadParaAmpliar, setActividadParaAmpliar] = useState<Actividad | null>(null);
  const [modalMaterialApoyoOpen, setModalMaterialApoyoOpen] = useState(false);
  const [actividadParaMaterialApoyo, setActividadParaMaterialApoyo] = useState<Actividad | null>(null);
  const [actividadParaVerAprendices, setActividadParaVerAprendices] = useState<Actividad | null>(null);
  const [zoomFoto, setZoomFoto] = useState<{ src: string; alt: string } | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  };

  const idFichaParaClase = useMemo(
    () => Number(locationState?.ficha_id || ficha?.id || 0) || 0,
    [locationState?.ficha_id, ficha?.id]
  );

  /** Texto de contexto RAP para Material de apoyo (sustituye al nombre del programa en el encabezado). */
  const materialApoyoRapContexto = useMemo(() => {
    const codigo = String(
      clase?.codigoMateria ?? clase?.codigo_materia ?? (clase as { codigo?: string } | null)?.codigo ?? ''
    ).trim();
    const nombre = String(clase?.materia_nombre ?? '').trim();
    if (!nombre && !codigo) return '';
    if (codigo && nombre) return `${codigo} — ${nombre}`;
    return nombre || codigo;
  }, [clase]);

  const materialApoyoIdRapContexto = useMemo(() => {
    const n = Number(locationState?.idMateria ?? clase?.idMateria ?? 0);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [locationState?.idMateria, clase?.idMateria]);

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
    const diaJs = idDiaHorarioAGetDay(clase.idDia);
    if (diaJs === null || ahora.getDay() !== diaJs) {
      return 'pendiente';
    }

    // Verificar si estamos dentro del rango de horas de la clase
    let [hIni, mIni] = clase.horaInicial.substring(0, 5).split(':').map(Number);
    let [hFin, mFin] = clase.horaFinal.substring(0, 5).split(':').map(Number);

    // Si jornada_tipo es TARDE o NOCHE, y la hora es menor a 12, sumar 12 (ajuste a 24h)
    const jornadaTipoUpper = clase.jornada_tipo?.toUpperCase() || '';
    const esTardeOEnoche = jornadaTipoUpper.includes('TARDE') || jornadaTipoUpper.includes('NOCHE') || jornadaTipoUpper.includes('NOCTURNA');

    if (esTardeOEnoche && hIni < 12) {
      hIni += 12;
    }
    if (esTardeOEnoche && hFin < 12) {
      hFin += 12;
    }

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
              const norm = normalizarClaseDetalleApi(claseData);
              setClase(norm ?? (claseData as Clase));
            }
            // Obtener todas las fechas de clase para el calendario
            const rawFechas = response.data?.data?.todasLasFechasClase || [];
            const fechasNorm = (Array.isArray(rawFechas) ? rawFechas : [])
              .map((row: unknown) => normalizarFilaFechaClaseApi(row))
              .filter((x): x is FechaClase => x != null);
            setTodasLasFechasClase(fechasNorm);
            const porH = response.data?.data?.sesionesCompletadasPorHorario;
            setSesionesCompletadasPorHorario(
              porH && typeof porH === 'object' ? (porH as SesionesPorHorarioMap) : {}
            );
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

  const fetchActividades = useCallback(async () => {
    if (!idFichaParaClase) return;
    setLoadingActividades(true);
    try {
      const idMateriaFiltro = Number(locationState?.idMateria || clase?.idMateria || 0) || undefined;
      const rawProg = ficha?.asignacion?.programa?.id;
      const idProgramaFiltro =
        rawProg !== undefined && rawProg !== null && String(rawProg) !== ''
          ? Number(rawProg)
          : undefined;
      const params: Record<string, string> = {};
      if (idMateriaFiltro) params.id_materia_clase = String(idMateriaFiltro);
      // Filtro estricto para evitar mezclar actividades de otras materias/RAP.
      if (idMateriaFiltro) {
        params.idMateria = String(idMateriaFiltro);
        params.idRap = String(idMateriaFiltro);
      }
      if (idProgramaFiltro != null && !Number.isNaN(idProgramaFiltro)) {
        params.id_programa = String(idProgramaFiltro);
      }

      const planeacionQs = new URLSearchParams();
      const idHorarioRuta = id ? parseInt(String(id), 10) : NaN;
      if (Number.isFinite(idHorarioRuta) && idHorarioRuta > 0) {
        planeacionQs.set('id_horario_materia', String(idHorarioRuta));
      }
      if (idMateriaFiltro) {
        planeacionQs.set('id_materia_clase', String(idMateriaFiltro));
        planeacionQs.set('idMateria', String(idMateriaFiltro));
        planeacionQs.set('idRap', String(idMateriaFiltro));
      }
      const planeacionUrl = `planeacionactividades/ficha/${idFichaParaClase}${
        planeacionQs.toString() ? `?${planeacionQs.toString()}` : ''
      }`;

      const [disponiblesRes, asignadasRes, coberturaRes] = await Promise.allSettled([
        axios.get('actividades', { params }).catch(() => ({ data: [] })),
        axios.get(planeacionUrl).catch(() => ({ data: [] })),
        axios.get(`fichas/${idFichaParaClase}/asignacion-actividades/cobertura`).catch(() => ({ data: null }))
      ]);
      const disp = disponiblesRes.status === 'fulfilled' && Array.isArray(disponiblesRes.value?.data) ? disponiblesRes.value.data : disponiblesRes.status === 'fulfilled' && disponiblesRes.value?.data?.data ? disponiblesRes.value.data.data : [];
      const asig = asignadasRes.status === 'fulfilled' && Array.isArray(asignadasRes.value?.data) ? asignadasRes.value.data : asignadasRes.status === 'fulfilled' && asignadasRes.value?.data?.data ? asignadasRes.value.data.data : [];
      setActividadesDisponibles(disp);
      setActividadesAsignadas(Array.isArray(asig) ? asig.filter((a: any) => a.actividad || a) : []);

      if (coberturaRes.status === 'fulfilled' && coberturaRes.value?.data) {
        const d = coberturaRes.value.data;
        const por = d.porActividad as
          | Record<string, { total: number; asignados: number; faltan: number; entregaron?: number; pendientesEntrega?: number }>
          | undefined;
        if (por && typeof por === 'object') {
          const next: Record<
            number,
            { total: number; asignados: number; faltan: number; entregaron?: number; pendientesEntrega?: number }
          > = {};
          Object.keys(por).forEach((k) => {
            const v = por[k];
            if (v && typeof v.asignados === 'number') {
              next[Number(k)] = {
                total: v.total ?? d.totalEnFicha ?? 0,
                asignados: v.asignados,
                faltan: v.faltan ?? Math.max(0, (v.total ?? 0) - v.asignados),
                ...(typeof v.entregaron === 'number' ? { entregaron: v.entregaron } : {}),
                ...(typeof v.pendientesEntrega === 'number' ? { pendientesEntrega: v.pendientesEntrega } : {})
              };
            }
          });
          setCoberturaActividades(next);
        } else {
          setCoberturaActividades({});
        }
      } else {
        setCoberturaActividades({});
      }
    } catch (e) {
      console.warn('Error cargando actividades:', e);
    } finally {
      setLoadingActividades(false);
    }
  }, [id, idFichaParaClase, locationState?.idMateria, clase?.idMateria, ficha?.asignacion?.programa?.id]);

  useEffect(() => {
    if ((activeMenu === 'agregar-actividades' || activeMenu === 'actividades-asignadas') && idFichaParaClase > 0) {
      fetchActividades();
    }
  }, [activeMenu, fetchActividades, idFichaParaClase]);

  const idsActividadesAsignadas = useMemo(() => {
    const set = new Set<number>();
    actividadesAsignadas.forEach((a: any) => {
      const act = a.actividad || a;
      const id = act?.id;
      if (id != null) set.add(Number(id));
    });
    return set;
  }, [actividadesAsignadas]);

  const handleEliminarActividad = useCallback(async (act: Actividad) => {
    if (!act?.id) return;
    if (idsActividadesAsignadas.has(act.id)) {
      alert('No se puede eliminar una actividad que está asignada a una clase. Quítela primero de la clase.');
      return;
    }
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    try {
      await axios.delete(`actividades/${act.id}`);
      fetchActividades();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al eliminar';
      alert(msg);
    }
  }, [idsActividadesAsignadas, fetchActividades]);

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

    const diaNumero = idDiaHorarioAGetDay(clase.idDia);
    if (diaNumero === null) return null;

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
        return `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(fechaActual.getDate()).padStart(2, '0')}`;
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

    // 2. Hoy debe ser un día programado de ESTA clase (mismo idHorarioMateria si hay varias franjas en el listado)
    const fechasParaAsistencia =
      clase?.idHorarioMateria != null
        ? todasLasFechasClase.filter(
            (f) => Number(f.idHorarioMateria) === Number(clase.idHorarioMateria)
          )
        : todasLasFechasClase;
    const listaDiasClase =
      fechasParaAsistencia.length > 0 ? fechasParaAsistencia : todasLasFechasClase;

    const esDiaDeClase = listaDiasClase.some(f => {
      if (!f.fechaInicial) return false;
      const dIni = parseDate(f.fechaInicial); dIni.setHours(0, 0, 0, 0);
      const dFin = f.fechaFinal ? parseDate(f.fechaFinal) : new Date(dIni); dFin.setHours(0, 0, 0, 0);
      if (dIni.getTime() === dFin.getTime()) return dIni.getTime() === hoy.getTime();
      // Usar idDia directamente del backend (viene de la BD, sin mapeo hardcodeado)
      if (f.idDia == null || Number.isNaN(Number(f.idDia))) return false;
      const diaNumero = idDiaHorarioAGetDay(f.idDia);
      return (
        diaNumero !== null &&
        dIni.getTime() <= hoy.getTime() &&
        hoy.getTime() <= dFin.getTime() &&
        ahora.getDay() === diaNumero
      );
    });
    if (!esDiaDeClase) return false;

    // 3. Hora actual dentro del rango horaInicial–horaFinal del backend (sin ajuste de jornada)
    let [hIni, mIni] = clase.horaInicial.substring(0, 5).split(':').map(Number);
    let [hFin, mFin] = clase.horaFinal.substring(0, 5).split(':').map(Number);

    // Si jornada_tipo es TARDE o NOCHE, y la hora es menor a 12, sumar 12 (ajuste a 24h)
    const jornadaTipoUpper = clase.jornada_tipo?.toUpperCase() || '';
    const esTardeOEnoche = jornadaTipoUpper.includes('TARDE') || jornadaTipoUpper.includes('NOCHE') || jornadaTipoUpper.includes('NOCTURNA');

    if (esTardeOEnoche && hIni < 12) {
      hIni += 12;
    }
    if (esTardeOEnoche && hFin < 12) {
      hFin += 12;
    }

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

  /**
   * Volver al listado de clases (Mis clases) por defecto.
   * Solo Historial RAPs envía `returnTo` si el usuario abrió el detalle desde ahí.
   * (Ambiente virtual instructor ≠ aula virtual estudiante; rutas bajo /ambiente-virtual/.)
   */
  const rutaVolver = (() => {
    const r = locationState?.returnTo;
    if (typeof r === 'string' && r.startsWith('/ambiente-virtual/')) {
      return r;
    }
    return '/ambiente-virtual/mis-clases';
  })();

  return (
    <Container>
      {/* Header con Info Cards */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(rutaVolver)}
          className="mb-3 inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-white transition-colors"
          title="Volver al listado de clases"
        >
          <KeenIcon icon="left" className="text-lg font-bold text-current" />
          <span className="text-sm font-bold text-current">Volver</span>
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Header Left */}
          <div className="flex-1">
            {(() => {
              const tit = clase ? titulosCompetenciaYRapDetalle(clase) : { competencia: 'Sin clase', rap: null as string | null };
              const programaTxt =
                clase?.programa_nombre || ficha.asignacion?.programa?.nombrePrograma || 'Programa académico';
              return (
                <>
                  <h1 className="text-base font-bold text-gray-900 dark:text-white mb-0.5 leading-snug">
                    {tit.competencia}
                  </h1>
                  {tit.rap ? (
                    <p className="text-xs font-normal text-gray-700 dark:text-gray-300 mb-1 leading-snug">
                      {tit.rap}
                    </p>
                  ) : null}
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {programaTxt}
                  </p>
                </>
              );
            })()}
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
                        {/* Foto del instructor - hover: tooltip con nombre, click: zoom */}
                        <div className="absolute inset-0 flex items-center justify-center p-1.5">
                          <DefaultTooltip title={nombreCompletoInstructor} placement="top">
                            <button
                              type="button"
                              onClick={() => setZoomFoto({
                                src: instructorClase?.persona?.rutaFotoUrl || '/media/avatars/blank.png',
                                alt: nombreCompletoInstructor
                              })}
                              className="w-full h-full rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-1 overflow-hidden"
                            >
                              <img
                                src={instructorClase?.persona?.rutaFotoUrl || '/media/avatars/blank.png'}
                                alt={nombreCompletoInstructor}
                                className="w-full h-full rounded-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                              />
                            </button>
                          </DefaultTooltip>
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
                {modoCalendario === 'aprendiz'
                  ? 'Calendario de tus clases'
                  : 'Calendario de clases'}
              </h2>
              {clase?.fechaInicial ? (
                <CalendarComponent
                  key={`cal-${clase.idHorarioMateria}-${clase.fechaInicial}`}
                  fechaInicio={clase.fechaInicial}
                  fechaFin={clase.fechaFinal || clase.fechaInicial}
                  diaSemana={clase.dia_semana}
                  todasLasFechasClase={todasLasFechasClase}
                  idDia={clase.idDia}
                  idHorarioMateria={clase.idHorarioMateria}
                  sesionesCompletadas={clase.sesiones_completadas || []}
                  sesionesCompletadasPorHorario={sesionesCompletadasPorHorario}
                  modoCalendario={modoCalendario}
                  horaInicial={clase.horaInicial}
                  horaFinal={clase.horaFinal}
                  resumenClaseActual={{
                    ficha_codigo: ficha.codigo,
                    materia_nombre: clase.materia_nombre,
                    programa_nombre:
                      clase.programa_nombre || ficha.asignacion?.programa?.nombrePrograma || '',
                    horaInicial: clase.horaInicial,
                    horaFinal: clase.horaFinal,
                    idHorarioMateria: clase.idHorarioMateria,
                    jornada_nombre: ficha.jornada?.nombreJornada || ''
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

      {/* Bottom Section: menú colapsado (solo iconos, 1/12) o expandido (texto, 2/12) */}
      <div className="grid grid-cols-1 min-w-0 lg:grid-cols-12 gap-3 sm:gap-4 lg:items-start">
        <div
          className={`min-w-0 ${menuClaseExpandido ? 'lg:col-span-2' : 'lg:col-span-1'}`}
        >
          <div className="card min-w-0 self-start w-full">
            <div className={`card-body ${menuSoloIconos ? 'p-2 sm:p-2.5' : 'p-3.5 sm:p-4'}`}>
              {isDesktop ? (
                <button
                  type="button"
                  onClick={() => setMenuClaseExpandido((v) => !v)}
                  className={`w-full flex items-center rounded-lg py-1 text-left hover:bg-light/80 dark:hover:bg-coal-400/40 transition-colors ${mostrarEtiquetasMenu ? 'justify-between gap-2 mb-2.5 px-1 -mx-1' : 'justify-center mb-2'}`}
                  aria-expanded={menuClaseExpandido}
                  aria-controls="menu-clase-items"
                  id="menu-clase-heading"
                  title={menuClaseExpandido ? 'Ocultar etiquetas del menú' : 'Mostrar menú completo'}
                >
                  {mostrarEtiquetasMenu ? (
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">MENÚ</span>
                  ) : null}
                  <KeenIcon
                    icon="down"
                    className={`shrink-0 text-sm text-gray-500 dark:text-gray-400 transition-transform duration-200 ${menuClaseExpandido ? 'rotate-0' : '-rotate-90'}`}
                  />
                </button>
              ) : (
                <div className="mb-2.5 px-0.5" id="menu-clase-heading">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">MENÚ</span>
                </div>
              )}
              <div id="menu-clase-items" className="space-y-1">
                <button
                  type="button"
                  title="Estudiantes"
                  onClick={() => setActiveMenu('estudiantes')}
                  className={`w-full flex items-center rounded-lg text-xs font-medium transition-colors border border-transparent ${mostrarEtiquetasMenu ? 'gap-2 px-2 py-1.5 justify-start' : 'justify-center px-1.5 py-2'} ${activeMenu === 'estudiantes'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="users" className={`shrink-0 text-base ${activeMenu === 'estudiantes' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={mostrarEtiquetasMenu ? 'whitespace-nowrap' : 'sr-only'}>Estudiantes</span>
                </button>
                <button
                  type="button"
                  title="Crear actividad"
                  onClick={() => setActiveMenu('agregar-actividades')}
                  className={`w-full flex items-center rounded-lg text-xs font-medium transition-colors border border-transparent ${mostrarEtiquetasMenu ? 'gap-2 px-2 py-1.5 justify-start' : 'justify-center px-1.5 py-2'} ${activeMenu === 'agregar-actividades'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="plus-circle" className={`text-base shrink-0 ${activeMenu === 'agregar-actividades' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={mostrarEtiquetasMenu ? 'whitespace-nowrap' : 'sr-only'}>Crear actividad</span>
                </button>
                <button
                  type="button"
                  title="Calificar actividad"
                  onClick={() => setActiveMenu('actividades-asignadas')}
                  className={`w-full flex items-center rounded-lg text-xs font-medium transition-colors border border-transparent ${mostrarEtiquetasMenu ? 'gap-2 px-2 py-1.5 justify-start' : 'justify-center px-1.5 py-2'} ${activeMenu === 'actividades-asignadas'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="check-squared" className={`text-base shrink-0 ${activeMenu === 'actividades-asignadas' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={mostrarEtiquetasMenu ? 'whitespace-nowrap' : 'sr-only'}>Calificar actividad</span>
                </button>
                <button
                  type="button"
                  title="Ver grupos"
                  onClick={() => setActiveMenu('ver-grupos')}
                  className={`w-full flex items-center rounded-lg text-xs font-medium transition-colors border border-transparent ${mostrarEtiquetasMenu ? 'gap-2 px-2 py-1.5 justify-start' : 'justify-center px-1.5 py-2'} ${activeMenu === 'ver-grupos'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="users" className={`shrink-0 text-base ${activeMenu === 'ver-grupos' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={mostrarEtiquetasMenu ? 'whitespace-nowrap' : 'sr-only'}>Ver grupos</span>
                </button>
                <button
                  type="button"
                  title="Calificaciones"
                  onClick={() => setActiveMenu('calificaciones')}
                  className={`w-full flex items-center rounded-lg text-xs font-medium transition-colors border border-transparent ${mostrarEtiquetasMenu ? 'gap-2 px-2 py-1.5 justify-start' : 'justify-center px-1.5 py-2'} ${activeMenu === 'calificaciones'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="chart-line" className={`shrink-0 text-base ${activeMenu === 'calificaciones' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={mostrarEtiquetasMenu ? 'whitespace-nowrap' : 'sr-only'}>Calificaciones</span>
                </button>
                <button
                  type="button"
                  title="Juicios evaluativos"
                  onClick={() => setActiveMenu('juicios-evaluativos')}
                  className={`w-full flex items-center rounded-lg text-xs font-medium transition-colors border border-transparent ${mostrarEtiquetasMenu ? 'gap-2 px-2 py-1.5 justify-start' : 'justify-center px-1.5 py-2'} ${activeMenu === 'juicios-evaluativos'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="chart-simple" className={`shrink-0 text-base ${activeMenu === 'juicios-evaluativos' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={mostrarEtiquetasMenu ? 'whitespace-nowrap' : 'sr-only'}>Juicios evaluativos</span>
                </button>
                <button
                  type="button"
                  title="Material de apoyo"
                  onClick={() => setActiveMenu('material-apoyo')}
                  className={`w-full flex items-center rounded-lg text-xs font-medium transition-colors border border-transparent ${mostrarEtiquetasMenu ? 'gap-2 px-2 py-1.5 justify-start' : 'justify-center px-1.5 py-2'} ${activeMenu === 'material-apoyo'
                    ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
                    }`}
                >
                  <KeenIcon icon="document" className={`shrink-0 text-base ${activeMenu === 'material-apoyo' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className={mostrarEtiquetasMenu ? 'whitespace-nowrap' : 'sr-only'}>Material de apoyo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal: min-w-0 evita que tablas empujen scroll horizontal a la página */}
        <div className={`min-w-0 ${menuClaseExpandido ? 'lg:col-span-10' : 'lg:col-span-11'}`}>
          <div className="card min-w-0">
            <div className="card-body min-w-0 p-4 sm:p-5">
              {/* Estudiantes Section */}
              {activeMenu === 'estudiantes' && (
                <StudentListByMateria
                  materiaData={{
                    idMateria: locationState?.idMateria || clase?.idMateria || '',
                    idFicha: idFichaParaClase,
                    idJornada: ficha?.jornada?.id?.toString() || '',
                    idPrograma: ficha?.asignacion?.programa?.id?.toString() || '',
                    programa_nombre:
                      (typeof locationState?.programa_nombre === 'string'
                        ? locationState.programa_nombre
                        : undefined) ??
                      (typeof ficha?.asignacion?.programa?.nombrePrograma === 'string'
                        ? ficha.asignacion.programa.nombrePrograma
                        : undefined),
                    // estadoClase para el botón de asistencia: usa SOLO fechas, día y horas del backend (sin jornada)
                    estadoClase: (getEstadoClase() === 'en_curso' || esPeriodoAsistencia()) ? 'EN_CURSO' : 'PENDIENTE',
                    idHorarioMateria: id ? parseInt(id) : undefined,
                    ficha_codigo: ficha?.codigo
                  }}
                />
              )}

              {/* Agregar Actividades Section */}
              {activeMenu === 'agregar-actividades' && (
                <ListaActividades
                  actividades={actividadesDisponibles}
                  loading={loadingActividades}
                  modo="agregar"
                  onCrear={() => {
                    setActividadParaEditar(null);
                    setModalCrearActividadOpen(true);
                  }}
                  onCrearCuestionario={() => {
                    setCuestionarioParaEditar(null);
                    setModalCrearCuestionarioOpen(true);
                  }}
                  onAsignarActividades={(acts) => {
                    setActividadesParaAsignar(acts);
                    setActividadParaAsignar(null);
                    setModalAsignarActividadOpen(true);
                  }}
                  onVer={(act) => {
                    setActividadVer(act);
                    setModalVerActividadOpen(true);
                  }}
                  onEditar={(act) => {
                    if (act.tipoActividad === 'cuestionario' && act.id) {
                      setCuestionarioParaEditar({ id: act.id });
                      setModalCrearCuestionarioOpen(true);
                    } else {
                      setActividadParaEditar(act);
                      setModalCrearActividadOpen(true);
                    }
                  }}
                  onEliminar={handleEliminarActividad}
                  puedeEliminar={(act) => act?.id != null && !idsActividadesAsignadas.has(act.id)}
                  resetSelectionKey={assignSuccessCounter}                  coberturaActividades={coberturaActividades}
                  onMaterialApoyo={(act) => {
                    setActividadParaMaterialApoyo(act);
                    setModalMaterialApoyoOpen(true);
                  }}
                  idFicha={idFichaParaClase > 0 ? idFichaParaClase : undefined}
                />
              )}

              {/* Actividades Asignadas Section - Sin botón Asignar (ya están asignadas) */}
              {activeMenu === 'actividades-asignadas' && (
                <ListaActividades
                  actividades={actividadesAsignadas}
                  loading={loadingActividades}
                  modo="asignadas"
                  coberturaActividades={coberturaActividades}
                  idFicha={idFichaParaClase || undefined}
                  onVerAprendices={(act) => {
                    setActividadParaVerAprendices(act);
                    setModalAprendicesOpen(true);
                  }}
                  onCrearCuestionario={() => {
                    setCuestionarioParaEditar(null);
                    setModalCrearCuestionarioOpen(true);
                  }}
                  onVer={(act) => {
                    setActividadVer(act);
                    setModalVerActividadOpen(true);
                  }}
                  onEditar={(act) => {
                    if (act.tipoActividad === 'cuestionario' && act.id) {
                      setCuestionarioParaEditar({ id: act.id });
                      setModalCrearCuestionarioOpen(true);
                    } else {
                      setActividadParaEditar(act);
                      setModalCrearActividadOpen(true);
                    }
                  }}
                  onAmpliar={(act) => {
                    setActividadParaAmpliar(act);
                    setModalAmpliarOpen(true);
                  }}
                  mostrarCrearCuestionario={false}
                />
              )}

              {/* Ver grupos Section */}
              {activeMenu === 'ver-grupos' && idFichaParaClase > 0 && (
                <VerGruposView
                  idFicha={String(idFichaParaClase)}
                  fechaFinalClases={ficha?.asignacion?.fechaFinalClases}
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

              {/* Material de apoyo RAP: instructor CRUD por ficha; aprendiz solo lectura en el RAP de la clase */}
              {activeMenu === 'material-apoyo' && idFichaParaClase > 0 && modoCalendario === 'aprendiz' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Material de apoyo</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Recursos de consulta para este RAP (sin entrega ni calificación).
                    </p>
                  </div>
                  <MaterialApoyoAprendiz
                    idFicha={idFichaParaClase}
                    idRap={
                      Number(locationState?.idMateria ?? clase?.idMateria ?? 0) > 0
                        ? Number(locationState?.idMateria ?? clase?.idMateria)
                        : undefined
                    }
                    fichaCodigo={ficha?.codigo}
                    rapContextLabel={materialApoyoRapContexto || undefined}
                    emptyMessage="No hay material de apoyo disponible para este RAP."
                    hideGroupHeaders
                  />
                </div>
              )}
              {activeMenu === 'material-apoyo' && idFichaParaClase > 0 && modoCalendario !== 'aprendiz' && (
                <MaterialApoyoFichaView
                  idFicha={idFichaParaClase}
                  idMateria={locationState?.idMateria || clase?.idMateria || ''}
                  fichaCodigo={ficha?.codigo}
                  rapContextLabel={materialApoyoRapContexto || undefined}
                  idRapContext={materialApoyoIdRapContexto}
                />
              )}
              {activeMenu === 'material-apoyo' && idFichaParaClase <= 0 && (
                <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
                  <KeenIcon icon="document" className="text-4xl text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Material de apoyo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-4">
                    No hay ficha cargada para esta clase. Vuelve a entrar desde el detalle de la ficha o recarga la página.
                  </p>
                </div>
              )}

              {/* Calificaciones Section */}
              {activeMenu === 'calificaciones' && idFichaParaClase > 0 && (
                <CalificacionesFichaView
                  idFicha={idFichaParaClase}
                  idMateria={locationState?.idMateria || clase?.idMateria || ''}
                  idInstructor={clase?.instructor?.persona?.id}
                  instructorAsignado={
                    clase?.instructor?.persona
                      ? `${clase.instructor.persona.nombre1} ${clase.instructor.persona.apellido1}`.toUpperCase()
                      : 'NO ASIGNADO'
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales de actividades */}
      <ModalAsignarActividad
        open={modalAsignarActividadOpen && idFichaParaClase > 0}
        onClose={() => {
          setModalAsignarActividadOpen(false);
          setActividadParaAsignar(null);
          setActividadesParaAsignar(null);
        }}
        onSave={() => {
          fetchActividades();
          setActividadesParaAsignar(null);
          setActividadParaAsignar(null);
          setAssignSuccessCounter((c) => c + 1);
        }}
        onSuccess={showToast}
        idFicha={idFichaParaClase}
        actividad={actividadParaAsignar}
        actividades={actividadesParaAsignar}
      />
      <ModalCrearActividad
        open={modalCrearActividadOpen}
        onClose={() => {
          setModalCrearActividadOpen(false);
          setActividadParaEditar(null);
        }}
        onSave={() => {
          setModalCrearActividadOpen(false);
          setActividadParaEditar(null);
          fetchActividades();
        }}
        onSuccess={showToast}
        actividadEditar={actividadParaEditar}
        idMateria={Number(locationState?.idMateria || clase?.idMateria) || undefined}
      />
      <ModalVerActividad
        open={modalVerActividadOpen}
        onClose={() => {
          setModalVerActividadOpen(false);
          setActividadVer(null);
        }}
        actividad={actividadVer}
      />
      <ModalCrearCuestionario
        open={modalCrearCuestionarioOpen}
        onClose={() => {
          setModalCrearCuestionarioOpen(false);
          setCuestionarioParaEditar(null);
        }}
        onSave={() => {
          setModalCrearCuestionarioOpen(false);
          setCuestionarioParaEditar(null);
          fetchActividades();
        }}
        onSuccess={showToast}
        idMateria={Number(locationState?.idMateria || clase?.idMateria) || undefined}
        cuestionarioEditar={cuestionarioParaEditar}
      />
      <ModalAprendices
        open={modalAprendicesOpen}
        onClose={() => {
          setModalAprendicesOpen(false);
          setActividadParaVerAprendices(null);
        }}
        onSuccess={showToast}
        actividad={actividadParaVerAprendices}
        idFicha={idFichaParaClase}
        tituloActividad={actividadParaVerAprendices?.tituloActividad}
      />
      <ModalAmpliarActividad
        open={modalAmpliarOpen}
        onClose={() => {
          setModalAmpliarOpen(false);
          setActividadParaAmpliar(null);
        }}
        actividad={actividadParaAmpliar}
        idFicha={idFichaParaClase}
        onSave={() => fetchActividades()}
        onSuccess={showToast}
      />
      <ModalMaterialApoyo
        open={modalMaterialApoyoOpen}
        onClose={() => {
          setModalMaterialApoyoOpen(false);
          setActividadParaMaterialApoyo(null);
        }}
        onSuccess={showToast}
        actividad={actividadParaMaterialApoyo}
      />
      {zoomFoto && (
        <ImageZoomModal
          open={!!zoomFoto}
          onClose={() => setZoomFoto(null)}
          src={zoomFoto.src}
          alt={zoomFoto.alt}
          title={zoomFoto.alt}
        />
      )}
      <Toast
        message={toastMessage}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </Container>
  );
};

export default ClaseDetallePage;








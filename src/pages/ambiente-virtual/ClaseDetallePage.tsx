import React, { useState, useEffect, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  extraerHoraHHMM,
  filasCalendarioDesdeClasesAsignadas,
  horaClaveClaseAsignada,
  normalizarHoraCampoClaseApi,
  sesionesCompletadasPorHorarioDesdeClases,
  fechasVisiblesCalendarioClase,
  fechasVisiblesCalendarioMultiplesFranjas,
  fetchHistorialSesionesInstructor,
  ymdPendientesCalendarioFranjas,
  mesCalendarioInicialClase,
  claseOcurreEnFecha,
  sesionCompletadaEnFecha,
  sesionesCompletadasCalendarioDetalleClase,
  unificarSesionesCompletadas,
  ymdFromFechaSesion,
  ymdSetSesionesCompletadas,
  textoJornadaParaAjuste12h,
  titulosCompetenciaYRapUi,
  jsGetDayDesdeApiClase,
  calendarioInstructorEnRango,
  etiquetaEstadoBloqueCalendarioInstructor,
  clasesInstructorConHistorial,
  type BloqueCalendarioInstructorDia,
  type ClaseAsignadaInstructorBase,
  type HistorialSesionInstructorItem,
  normalizarInstructoresRapApi,
  instructoresVisiblesEnCurso,
  reemplazoActivoEnClase,
  nombreOtroInstructorReemplazo,
  type InstructorRapAsociado,
} from '@/utils/clasesAsignadasLogica';
import { useClasesInstructorAsignadas } from '@/hooks/useClasesInstructorAsignadas';
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
  ModalMoverActividadRap,
  ListaActividades,
  MaterialApoyoFichaView,
  MaterialApoyoAprendiz,
  type Actividad
} from './actividades';
import { VerGruposView } from './grupos';
import CalificacionesFichaView from './calificaciones/CalificacionesFichaView';
import JustificacionesInstructorPage from './JustificacionesInstructorPage';
import ListaAsistenciasGlobalPage from './ListaAsistenciasGlobalPage';

/** YYYY-MM-DD en calendario local (no usar toISOString() para claves: desfasa el día en UTC). */
const formatYmdLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * idDía numérico (solo si no hay `dia_semana` fiable) → `Date.getDay()`.
 * Preferir siempre `jsGetDayDesdeApiClase` en calendario y fechas.
 */

/** Evita `{}` u otros valores en `location.state` / APIs donde los hijos esperan `string | number`. */
const normalizeIdProp = (value: unknown): string | number => {
  if (typeof value === 'string' || typeof value === 'number') return value;
  return '';
};

/** idMateria numérico > 0, o undefined si no es válido. */
const parsePositiveMateriaId = (value: unknown): number | undefined => {
  const raw = normalizeIdProp(value);
  if (raw === '') return undefined;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
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

/**
 * Día de la semana de la clase para pintar el calendario (0–6): ver `jsGetDayDesdeApiClase` en util.
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
  const main = jsGetDayDesdeApiClase({
    idDia: opts.idDia,
    dia_semana: opts.diaSemana
  });
  if (main !== null) return main;
  if (opts.filasHorario?.length) {
    for (const fc of opts.filasHorario) {
      const idd = getProp(fc, 'idDia', 'id_dia', 'iddia');
      const ds = getProp(fc, 'dia_semana', 'diaSemana');
      const d = jsGetDayDesdeApiClase({
        idDia: idd,
        dia_semana: ds != null ? String(ds) : null
      });
      if (d !== null) return d;
    }
  }
  const fid = getProp(opts.filaHorario, 'idDia', 'id_dia', 'iddia');
  const fds = getProp(opts.filaHorario, 'dia_semana', 'diaSemana');
  const c = jsGetDayDesdeApiClase({
    idDia: fid,
    dia_semana: fds != null ? String(fds) : null
  });
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
  const materiaNombre = strFromRow(o, 'materia_nombre', 'materiaNombre', 'nombreMateria');
  const competenciaRaw = strFromRow(o, 'competencia_nombre', 'competenciaNombre').trim();
  const programaNombre =
    strFromRow(o, 'programa_nombre', 'programaNombre', 'nombrePrograma') ||
    String((o as Clase).programa_nombre ?? '');
  const competencia_nombre =
    competenciaRaw || materiaNombre.trim() || programaNombre.trim() || '';
  const hiRaw = strFromRow(o, 'horaInicial', 'hora_inicial') ?? String(o.horaInicial ?? '');
  const hfRaw = strFromRow(o, 'horaFinal', 'hora_final') ?? String(o.horaFinal ?? '');
  const jn =
    strFromRow(o, 'jornada_nombre', 'jornadaNombre', 'nombreJornada') ||
    String((o as Clase).jornada_nombre ?? '');
  const jt = strFromRow(o, 'jornada_tipo', 'jornadaTipo') || String((o as Clase).jornada_tipo ?? '');
  return {
    ...(o as Clase),
    idDia: Number.isFinite(idDiaNum) && idDiaNum >= 1 && idDiaNum <= 7 ? idDiaNum : (o as Clase).idDia,
    dia_semana: (diaSem != null ? String(diaSem) : (o as Clase).dia_semana) as string,
    fechaInicial: String(getProp(o, 'fechaInicial', 'fecha_inicial') ?? o.fechaInicial ?? ''),
    fechaFinal: String(getProp(o, 'fechaFinal', 'fecha_final') ?? o.fechaFinal ?? ''),
    sesiones_completadas: Array.isArray(sesComp) ? (sesComp as Clase['sesiones_completadas']) : [],
    ...(Number.isFinite(idHmNum) && idHmNum > 0 ? { idHorarioMateria: idHmNum } : {}),
    competencia_nombre,
    rap_nombre: rapNorm,
    idMateriaPadre: (() => {
      const v = getProp(o, 'idMateriaPadre', 'id_materia_padre');
      const n = v !== undefined ? Number(v) : NaN;
      return Number.isFinite(n) && n > 0 ? n : (o as Clase).idMateriaPadre;
    })(),
    ...(Number.isFinite(idMatNum) && idMatNum > 0 ? { idMateria: idMatNum } : {}),
    horaInicial: normalizarHoraCampoClaseApi(hiRaw),
    horaFinal: normalizarHoraCampoClaseApi(hfRaw),
    jornada_nombre: jn,
    jornada_tipo: jt,
    tipo_asignacion: (o.tipo_asignacion as string | null) ?? null,
    modalidad_rap: (o.modalidad_rap as string | null) ?? null,
    asignacion_vigente: !!(o.asignacion_vigente),
    reemplazo_vigente_por_otro: !!(o.reemplazo_vigente_por_otro),
    es_reemplazante: !!(o.es_reemplazante),
    instructores_rap: normalizarInstructoresRapApi(o.instructores_rap),
  };
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

  const materiaNombre = strFromRow(r, 'materia_nombre', 'materiaNombre', 'nombreMateria');
  const programaNombre = strFromRow(r, 'programa_nombre', 'programaNombre', 'nombrePrograma');
  const competenciaRaw = strFromRow(r, 'competencia_nombre', 'competenciaNombre').trim();
  const competencia_nombre =
    competenciaRaw || materiaNombre.trim() || programaNombre.trim() || '';

  return {
    ...(Number.isFinite(idHmNum) && idHmNum > 0 ? { idHorarioMateria: idHmNum } : {}),
    idDia: Number.isFinite(idn) ? idn : fallbackIdDia,
    dia_semana: ds != null ? String(ds) : String(getProp(r, 'dia_semana', 'diaSemana') ?? ''),
    fechaInicial,
    fechaFinal,
    ficha_codigo: strFromRow(r, 'ficha_codigo', 'fichaCodigo'),
    materia_nombre: materiaNombre,
    programa_nombre: programaNombre,
    horaInicial: normalizarHoraCampoClaseApi(strFromRow(r, 'horaInicial', 'hora_inicial')),
    horaFinal: normalizarHoraCampoClaseApi(strFromRow(r, 'horaFinal', 'hora_final')),
    jornada_nombre: strFromRow(r, 'jornada_nombre', 'jornadaNombre', 'nombreJornada'),
    jornada_tipo: strFromRow(r, 'jornada_tipo', 'jornadaTipo', 'tipoJornada'),
    competencia_nombre,
    rap_nombre: (() => {
      const rapRaw = getProp(r, 'rap_nombre', 'rapNombre');
      if (rapRaw == null || rapRaw === '' || String(rapRaw).toLowerCase() === 'null') return null;
      return String(rapRaw).trim();
    })(),
    idMateriaPadre: (() => {
      const v = getProp(r, 'idMateriaPadre', 'id_materia_padre');
      const n = v !== undefined ? Number(v) : NaN;
      return Number.isFinite(n) && n > 0 ? n : undefined;
    })()
  };
};

/** Una fila de clase para tooltip por día (puede haber varias el mismo día). */
interface ClaseTooltipDia {
  idHorarioMateria: number;
  ficha_codigo: string;
  materia_nombre: string;
  programa_nombre: string;
  competencia_nombre?: string;
  rap_nombre?: string | null;
  horaInicial: string;
  horaFinal: string;
  jornada_nombre: string;
  jornada_tipo?: string;
  /** Bloque por sesión ya guardada en BD (badge Completada, aunque hoy siga la franja). */
  bloqueSesionRegistrada?: boolean;
  numeroSesion?: number;
}

/** Misma ficha + franja + competencia + RAP (como en horario/listado) → un bloque; evita duplicar idHorarioMateria equivalentes. */
const claveFranjaTooltipDia = (row: ClaseTooltipDia): string => {
  const tit = titulosCompetenciaYRapUi({
    materia_nombre: row.materia_nombre,
    competencia_nombre: row.competencia_nombre,
    rap_nombre: row.rap_nombre ?? undefined,
    programa_nombre: row.programa_nombre
  });
  const comp = String(tit.competencia || '').trim().toLowerCase();
  const rap = String(tit.rap ?? '').trim().toLowerCase();
  return `${String(row.ficha_codigo || '')
    .trim()
    .toLowerCase()}|${horaClaveClaseAsignada(row.horaInicial || '')}|${horaClaveClaseAsignada(row.horaFinal || '')}|${comp}|${rap}`;
};

/** Resumen de la clase actual (fallback si el API no trae fila para esa fecha). */
type ResumenClaseCalendario = {
  ficha_codigo?: string;
  materia_nombre?: string;
  competencia_nombre?: string;
  rap_nombre?: string | null;
  programa_nombre?: string;
  horaInicial?: string;
  horaFinal?: string;
  idHorarioMateria?: number;
  jornada_nombre?: string;
  jornada_tipo?: string;
};

/** Panel del tooltip del calendario: claro blanco/azul; en oscuro alineado al tema (coal). */
const CLASE_CALENDARIO_TOOLTIP_SURFACE =
  '!rounded-lg !max-w-[min(100vw-2rem,24rem)] !p-0 !text-left !bg-white !text-slate-900 !border !border-blue-200 !shadow-lg !overflow-hidden dark:!bg-coal-600 dark:!text-white dark:!border-gray-500/50';

/** Padding del contenido (va dentro del panel con overflow oculto en el borde). */
const CLASE_CALENDARIO_TOOLTIP_INNER_PAD = 'p-3';

/** Cortes fijos en dos líneas para etiquetas largas del menú lateral de la clase. */
const LINEAS_MENU_CLASE: Record<string, readonly [string, string]> = {
  'Biblioteca de conocimiento': ['Biblioteca de', 'conocimiento'],
  'Justificaciones pendientes': ['Justificaciones', 'pendientes'],
  'Lista de asistencias': ['Lista de', 'asistencias'],
  'Juicios evaluativos': ['Juicios', 'evaluativos'],
  'Calificar actividad': ['Calificar', 'actividad'],
  'Crear actividad': ['Crear', 'actividad']
};

function EtiquetaMenuClase({ etiqueta }: { etiqueta: string }) {
  const lineas = LINEAS_MENU_CLASE[etiqueta];
  if (lineas) {
    return (
      <span className="flex min-w-0 max-w-full flex-1 flex-col gap-0 leading-[1.3] whitespace-normal">
        <span className="block max-w-full">{lineas[0]}</span>
        <span className="block max-w-full">{lineas[1]}</span>
      </span>
    );
  }
  return (
    <span className="block min-w-0 max-w-full flex-1 leading-snug whitespace-normal">{etiqueta}</span>
  );
}

function clasesBadgeEstadoCalendario(etiqueta: string): string {
  if (etiqueta === 'Tu clase en curso') {
    return 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200';
  }
  if (etiqueta === 'En curso' || etiqueta === 'Pendiente') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100';
  }
  if (etiqueta === 'En espera') {
    return 'bg-white text-gray-700 border border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-gray-600';
  }
  if (etiqueta === 'Próximo') {
    return 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200';
  }
  if (etiqueta === 'Completada' || etiqueta === 'Sesión ya vista') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-100';
  }
  if (etiqueta === 'Próximo') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100';
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
  /**
   * Clases para armar el tooltip por día.
   * Instructor: todas las del docente (varias fichas el mismo día, ej. mañana 3411909 + noche 3412038).
   * Aprendiz: solo la ficha/materia actual.
   */
  clasesFranjaCalendario?: ClaseAsignadaInstructorBase[];
  modoCalendario?: 'instructor' | 'aprendiz';
  horaInicial?: string;
  horaFinal?: string;
  resumenClaseActual?: ResumenClaseCalendario;
  /** Fila de `clases-asignadas` de esta franja (alineación con Mi horario). */
  filaClaseAsignada?: ClaseAsignadaInstructorBase | null;
  ahoraRef?: Date;
}> = ({
  fechaInicio,
  fechaFin,
  diaSemana,
  todasLasFechasClase = [],
  idDia,
  idHorarioMateria,
  sesionesCompletadas = [],
  sesionesCompletadasPorHorario = {},
  clasesFranjaCalendario = [],
  modoCalendario = 'instructor',
  horaInicial,
  horaFinal,
  resumenClaseActual,
  filaClaseAsignada = null,
  ahoraRef = new Date()
}) => {
    /** Todas las franjas de la ficha (ej. miércoles y viernes). */
    const todasLasFechasCalendario = useMemo(() => todasLasFechasClase, [todasLasFechasClase]);

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

    const [currentMonth, setCurrentMonth] = useState(() =>
      mesCalendarioInicialClase(fechaInicio, fechaFinParaUsar)
    );

    useEffect(() => {
      setCurrentMonth(mesCalendarioInicialClase(fechaInicio, fechaFinParaUsar));
    }, [fechaInicio, fechaFinParaUsar]);

    const inicio = fechaInicio ? parseDate(fechaInicio) : null;
    const fin = fechaFinParaUsar ? parseDate(fechaFinParaUsar) : null;

    /** Instructor: misma lógica que el dashboard (`ProfesoresContent`). */
    const calendarioInstructorMes = useMemo(() => {
      if (modoCalendario !== 'instructor' || clasesFranjaCalendario.length === 0) return null;
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();
      const startDate = new Date(y, m, 1);
      const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
      return calendarioInstructorEnRango(clasesFranjaCalendario, startDate, endDate, ahoraRef);
    }, [modoCalendario, clasesFranjaCalendario, currentMonth, ahoraRef]);

    const resumenMesCalendarioInstructor = useMemo(() => {
      if (!calendarioInstructorMes) return { completadas: 0, pendientes: 0 };
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();
      let completadas = 0;
      let pendientes = 0;
      for (const [ymd, est] of Object.entries(calendarioInstructorMes.estadoPorYmd)) {
        const parts = ymd.split('-').map(Number);
        if (parts.length !== 3 || parts[0] !== y || parts[1] - 1 !== m) continue;
        if (est === 'completada') completadas += 1;
        if (est === 'pendiente') pendientes += 1;
      }
      return { completadas, pendientes };
    }, [calendarioInstructorMes, currentMonth]);

    const clasesPorDiaCalendarioInstructor = useMemo((): Map<string, ClaseTooltipDia[]> | null => {
      if (!calendarioInstructorMes) return null;
      const map = new Map<string, ClaseTooltipDia[]>();
      for (const [ymd, bloques] of Object.entries(calendarioInstructorMes.porDia)) {
        map.set(
          ymd,
          bloques.map((b) => ({
            idHorarioMateria: b.idHorarioMateria,
            ficha_codigo: b.ficha_codigo,
            materia_nombre: b.materia_nombre,
            programa_nombre: b.programa_nombre,
            competencia_nombre: b.competencia_nombre,
            rap_nombre: b.rap_nombre ?? null,
            horaInicial: b.horaInicial,
            horaFinal: b.horaFinal,
            jornada_nombre: b.jornada_nombre,
            jornada_tipo: b.jornada_tipo,
            bloqueSesionRegistrada: b.bloqueSesionRegistrada,
            numeroSesion: b.numeroSesion
          }))
        );
      }
      return map;
    }, [calendarioInstructorMes]);

    /** Todas las fechas de sesiones completadas (misma lista que Mis formaciones → Completado). */
    const sesionesCompletadasUnificadas = useMemo(() => {
      const idHm = idHorarioMateria != null ? Number(idHorarioMateria) : NaN;
      const extra = Number.isFinite(idHm)
        ? (sesionesCompletadasPorHorarioEfectivo[idHm] ??
            sesionesCompletadasPorHorarioEfectivo[String(idHm)])
        : undefined;
      return unificarSesionesCompletadas(
        sesionesCompletadas,
        filaClaseAsignada?.sesiones_completadas,
        extra
      );
    }, [
      sesionesCompletadas,
      filaClaseAsignada,
      idHorarioMateria,
      sesionesCompletadasPorHorarioEfectivo
    ]);

    const filasCalendarioPayload = useMemo((): Array<
      Parameters<typeof fechasVisiblesCalendarioClase>[0]
    > => {
      const filas: Array<Parameters<typeof fechasVisiblesCalendarioClase>[0]> = [];
      const seenHm = new Set<number>();

      for (const fc of todasLasFechasCalendario) {
        const id = Number(fc.idHorarioMateria);
        if (!fc.fechaInicial?.trim() || !Number.isFinite(id) || seenHm.has(id)) continue;
        seenHm.add(id);
        const sesionesFranja =
          (sesionesCompletadasPorHorarioEfectivo[id] ??
            sesionesCompletadasPorHorarioEfectivo[String(id)]) ??
          (id === idHorarioMateria ? sesionesCompletadas : []);
        filas.push({
          fechaInicial: fc.fechaInicial,
          fechaFinal: fc.fechaFinal ?? null,
          idDia: fc.idDia,
          dia_semana: fc.dia_semana,
          horaInicial: fc.horaInicial,
          horaFinal: fc.horaFinal,
          jornada_nombre: fc.jornada_nombre,
          jornada_tipo: fc.jornada_tipo,
          sesiones_restantes: filaClaseAsignada?.sesiones_restantes,
          total_sesiones: filaClaseAsignada?.total_sesiones,
          sesiones_dadas: filaClaseAsignada?.sesiones_dadas,
          sesiones_completadas: Array.isArray(sesionesFranja) ? sesionesFranja : []
        });
      }

      if (filas.length === 0 && fechaInicio?.trim()) {
        filas.push({
          fechaInicial: fechaInicio,
          fechaFinal: fechaFinParaUsar,
          idDia,
          dia_semana: diaSemana,
          horaInicial: horaInicial ?? '',
          horaFinal: horaFinal ?? '',
          jornada_nombre: resumenClaseActual?.jornada_nombre,
          jornada_tipo: resumenClaseActual?.jornada_tipo,
          sesiones_restantes: filaClaseAsignada?.sesiones_restantes,
          total_sesiones: filaClaseAsignada?.total_sesiones,
          sesiones_dadas: filaClaseAsignada?.sesiones_dadas,
          sesiones_completadas: sesionesCompletadasUnificadas
        });
      }
      return filas;
    }, [
      todasLasFechasCalendario,
      filaClaseAsignada,
      fechaInicio,
      fechaFinParaUsar,
      idDia,
      diaSemana,
      sesionesCompletadasUnificadas,
      sesionesCompletadasPorHorarioEfectivo,
      sesionesCompletadas,
      idHorarioMateria,
      horaInicial,
      horaFinal,
      resumenClaseActual
    ]);

    /** Miércoles, viernes, etc.: ocurrencias programadas + sesiones en BD. */
    const fechasClase = useMemo(
      () => fechasVisiblesCalendarioMultiplesFranjas(filasCalendarioPayload, sesionesCompletadasUnificadas, ahoraRef),
      [filasCalendarioPayload, sesionesCompletadasUnificadas, ahoraRef]
    );

    /** Días sin sesión en BD pero con clase programada (azul). */
    const ymdPendienteClase = useMemo(
      () => ymdPendientesCalendarioFranjas(filasCalendarioPayload, sesionesCompletadasUnificadas, ahoraRef),
      [filasCalendarioPayload, sesionesCompletadasUnificadas, ahoraRef]
    );

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

    const rowTooltipDesdeClase = (c: ClaseAsignadaInstructorBase | FechaClase): ClaseTooltipDia => ({
      idHorarioMateria: Number(c.idHorarioMateria),
      ficha_codigo: String(c.ficha_codigo ?? ''),
      materia_nombre: String(c.materia_nombre ?? ''),
      programa_nombre: String(c.programa_nombre ?? ''),
      competencia_nombre: c.competencia_nombre,
      rap_nombre: c.rap_nombre ?? null,
      horaInicial: String(c.horaInicial ?? ''),
      horaFinal: String(c.horaFinal ?? ''),
      jornada_nombre: String(c.jornada_nombre ?? ''),
      jornada_tipo: String(c.jornada_tipo ?? '')
    });

    const filaCalendarioActual = useMemo((): ClaseAsignadaInstructorBase | null => {
      if (filaClaseAsignada?.fechaInicial?.trim()) {
        return {
          ...filaClaseAsignada,
          sesiones_completadas: sesionesCompletadasUnificadas
        };
      }
      if (!resumenClaseActual?.idHorarioMateria || !fechaInicio) return null;
      return {
        ficha_id: 0,
        ficha_codigo: resumenClaseActual.ficha_codigo ?? '',
        programa_nombre: resumenClaseActual.programa_nombre ?? '',
        materia_nombre: resumenClaseActual.materia_nombre ?? '',
        competencia_nombre: resumenClaseActual.competencia_nombre ?? '',
        rap_nombre: resumenClaseActual.rap_nombre ?? null,
        idMateriaPadre: null,
        jornada_nombre: resumenClaseActual.jornada_nombre ?? '',
        jornada_tipo: resumenClaseActual.jornada_tipo ?? '',
        dia_semana: diaSemana ?? '',
        idDia: idDia ?? 0,
        horaInicial: resumenClaseActual.horaInicial ?? '',
        horaFinal: resumenClaseActual.horaFinal ?? '',
        fechaInicial: fechaInicio,
        fechaFinal: fechaFinParaUsar,
        idHorarioMateria: resumenClaseActual.idHorarioMateria,
        sesiones_completadas: sesionesCompletadasUnificadas
      };
    }, [
      filaClaseAsignada,
      resumenClaseActual,
      fechaInicio,
      fechaFinParaUsar,
      diaSemana,
      idDia,
      sesionesCompletadasUnificadas
    ]);

    const ymdConSesionCompletada = useMemo(() => {
      const set = ymdSetSesionesCompletadas(sesionesCompletadasUnificadas);
      for (const s of sesionesCompletadas ?? []) {
        const ymd = ymdFromFechaSesion(s.fechaSesion);
        if (ymd) set.add(ymd);
      }
      if (filaCalendarioActual) {
        for (const s of filaCalendarioActual.sesiones_completadas ?? []) {
          const ymd = ymdFromFechaSesion(s.fechaSesion);
          if (ymd) set.add(ymd);
        }
      }
      return set;
    }, [sesionesCompletadasUnificadas, sesionesCompletadas, filaCalendarioActual]);

    /** API detalle + clases-asignadas: todas las materias/franjas de la ficha en el tooltip. */
    const franjasTooltipCalendario = useMemo(() => {
      const byHm = new Map<number, FechaClase | ClaseAsignadaInstructorBase>();
      const registrar = (fc: FechaClase | ClaseAsignadaInstructorBase) => {
        const id = Number(fc.idHorarioMateria);
        if (!Number.isFinite(id) || id <= 0 || !String(fc.fechaInicial ?? '').trim()) return;
        byHm.set(id, fc);
      };
      for (const fc of todasLasFechasCalendario) registrar(fc);
      for (const c of clasesFranjaCalendario) registrar(c);
      return Array.from(byHm.values());
    }, [todasLasFechasCalendario, clasesFranjaCalendario]);

    /** Tooltip por día: una fila por horario (sin duplicar programada + sesión). */
    const clasesPorDiaCalendario = useMemo(() => {
      const map = new Map<string, ClaseTooltipDia[]>();
      const clavesPorYmd = new Map<string, Set<string>>();

      const agregarEnDia = (ymd: string, row: ClaseTooltipDia, claveBloque: string) => {
        let claves = clavesPorYmd.get(ymd);
        if (!claves) {
          claves = new Set();
          clavesPorYmd.set(ymd, claves);
        }
        if (claves.has(claveBloque)) return;
        claves.add(claveBloque);
        const prev = map.get(ymd) ?? [];
        map.set(ymd, [...prev, row]);
      };

      const sesionesUnicasFranja = (
        c: ClaseAsignadaInstructorBase | FechaClase
      ): Array<{ fechaSesion: string; numeroSesion?: number }> => {
        const idHm = Number(c.idHorarioMateria);
        const listas = [
          ...(c as ClaseAsignadaInstructorBase).sesiones_completadas ?? [],
          ...getSesionesParaHorario(idHm)
        ];
        const visto = new Set<string>();
        const out: Array<{ fechaSesion: string; numeroSesion?: number }> = [];
        for (const s of listas) {
          const ymd = ymdFromFechaSesion(s.fechaSesion);
          if (!ymd) continue;
          const k = `${ymd}|${s.numeroSesion ?? ''}`;
          if (visto.has(k)) continue;
          visto.add(k);
          out.push(s);
        }
        return out;
      };

      const finVentanaFranjaEnDia = (row: ClaseTooltipDia, diaCalendario: Date): Date => {
        const ahora = ahoraRef;
        let [hIni, mIni] = (
          extraerHoraHHMM(row.horaInicial || '') ?? (row.horaInicial || '0:0').substring(0, 5)
        )
          .split(':')
          .map(Number);
        let [hFin, mFin] = (
          extraerHoraHHMM(row.horaFinal || '') ?? (row.horaFinal || '0:0').substring(0, 5)
        )
          .split(':')
          .map(Number);
        const lowerJ = textoJornadaParaAjuste12h({
          jornada_nombre: row.jornada_nombre,
          jornada_tipo: row.jornada_tipo
        });
        const esTardeONoche =
          lowerJ.includes('tarde') || lowerJ.includes('noche') || lowerJ.includes('nocturna');
        if (esTardeONoche && hIni < 12) hIni += 12;
        if (esTardeONoche && hFin < 12) hFin += 12;
        const hi = new Date(diaCalendario);
        hi.setHours(hIni, mIni || 0, 0, 0);
        const hf = new Date(diaCalendario);
        hf.setHours(hFin, mFin || 0, 0, 0);
        if (hf.getTime() < hi.getTime()) hf.setDate(hf.getDate() + 1);
        return hf;
      };

      /** Una sola tarjeta por idHorarioMateria y día. */
      const bloqueTooltipFranjaEnYmd = (
        c: ClaseAsignadaInstructorBase | FechaClase,
        dia: Date,
        ymd: string
      ): ClaseTooltipDia | null => {
        const sesionesHoy = sesionesUnicasFranja(c).filter(
          (s) => ymdFromFechaSesion(s.fechaSesion) === ymd
        );
        const ocurre = claseOcurreEnFecha(c, dia);
        if (!ocurre && sesionesHoy.length === 0) return null;

        const base = rowTooltipDesdeClase(c);
        const hf = finVentanaFranjaEnDia(base, dia);
        const franjaTerminada = ahoraRef.getTime() > hf.getTime();

        if (ocurre && !franjaTerminada) {
          return base;
        }
        if (sesionesHoy.length > 0) {
          const ultima = sesionesHoy[sesionesHoy.length - 1]!;
          return {
            ...base,
            bloqueSesionRegistrada: true,
            numeroSesion: ultima.numeroSesion
          };
        }
        if (ocurre) {
          return base;
        }
        return null;
      };

      const ymdsDia = new Set<string>([
        ...ymdConSesionCompletada,
        ...ymdPendienteClase,
        ...fechasClase.map((d) => formatYmdLocal(d)),
        formatYmdLocal(
          new Date(ahoraRef.getFullYear(), ahoraRef.getMonth(), ahoraRef.getDate())
        )
      ]);

      const porH = sesionesCompletadasPorHorarioEfectivo || {};
      for (const key of Object.keys(porH)) {
        for (const s of porH[key] ?? []) {
          const ymd = ymdFromFechaSesion(s.fechaSesion);
          if (ymd) ymdsDia.add(ymd);
        }
      }

      const lookupHm = new Map<number, ClaseAsignadaInstructorBase | FechaClase>();
      for (const fc of franjasTooltipCalendario) {
        const id = Number(fc.idHorarioMateria);
        if (id > 0) lookupHm.set(id, fc);
      }
      for (const c of clasesFranjaCalendario) {
        const id = Number(c.idHorarioMateria);
        if (id > 0) lookupHm.set(id, c);
      }

      for (const ymd of ymdsDia) {
        const parts = ymd.split('-').map(Number);
        if (parts.length !== 3) continue;
        const dia = new Date(parts[0], parts[1] - 1, parts[2]);
        dia.setHours(0, 0, 0, 0);
        const horariosYa = new Set<number>();

        const registrarFranja = (c: ClaseAsignadaInstructorBase | FechaClase) => {
          const idHm = Number(c.idHorarioMateria);
          if (!idHm || horariosYa.has(idHm)) return;
          const bloque = bloqueTooltipFranjaEnYmd(c, dia, ymd);
          if (!bloque) return;
          horariosYa.add(idHm);
          agregarEnDia(ymd, bloque, `hm|${idHm}|${ymd}`);
        };

        for (const c of clasesFranjaCalendario) registrarFranja(c);

        for (const key of Object.keys(porH)) {
          const idHm = Number(key);
          if (!Number.isFinite(idHm) || idHm <= 0 || horariosYa.has(idHm)) continue;
          const fc = lookupHm.get(idHm);
          if (fc) registrarFranja(fc);
        }
      }

      for (const [, rows] of map) {
        rows.sort((a, b) => (a.horaInicial || '').localeCompare(b.horaInicial || ''));
      }

      return map;
    }, [
      ymdConSesionCompletada,
      ymdPendienteClase,
      fechasClase,
      franjasTooltipCalendario,
      clasesFranjaCalendario,
      ahoraRef,
      getSesionesParaHorario,
      sesionesCompletadasPorHorarioEfectivo
    ]);

    const etiquetaEstadoTooltip = (diaCalendario: Date, row: ClaseTooltipDia): string => {
      if (calendarioInstructorMes) {
        return etiquetaEstadoBloqueCalendarioInstructor(
          diaCalendario,
          row as BloqueCalendarioInstructorDia,
          ahoraRef
        );
      }
      const ahora = ahoraRef;
      const hoy0 = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      hoy0.setHours(0, 0, 0, 0);
      const d0 = new Date(diaCalendario.getFullYear(), diaCalendario.getMonth(), diaCalendario.getDate());
      d0.setHours(0, 0, 0, 0);
      const ymd = formatYmdLocal(d0);

      if (row.bloqueSesionRegistrada) {
        return modoCalendario === 'aprendiz' ? 'Sesión ya vista' : 'Completada';
      }

      const sesionRegistrada = getSesionesParaHorario(row.idHorarioMateria).some(
        (s) => ymdFromFechaSesion(s.fechaSesion) === ymd
      );

      let [hIni, mIni] = (extraerHoraHHMM(row.horaInicial || '') ?? (row.horaInicial || '0:0').substring(0, 5))
        .split(':')
        .map(Number);
      let [hFin, mFin] = (extraerHoraHHMM(row.horaFinal || '') ?? (row.horaFinal || '0:0').substring(0, 5))
        .split(':')
        .map(Number);
      const lowerJ = textoJornadaParaAjuste12h({
        jornada_nombre: row.jornada_nombre,
        jornada_tipo: row.jornada_tipo
      });
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

    const contenidoBloqueTooltipDia = (diaCalendario: Date, row: ClaseTooltipDia) => {
      const tit = titulosCompetenciaYRapUi({
        materia_nombre: row.materia_nombre,
        competencia_nombre: row.competencia_nombre,
        rap_nombre: row.rap_nombre ?? undefined,
        programa_nombre: row.programa_nombre
      });
      const estadoEtiqueta = etiquetaEstadoTooltip(diaCalendario, row);
      return (
        <div
          key={`${claveFranjaTooltipDia(row)}|${row.bloqueSesionRegistrada ? 'ses' : 'prog'}|${row.numeroSesion ?? ''}`}
          className="border-b border-slate-200 pb-2 last:border-0 last:pb-0 dark:border-white/15"
        >
          <p className="font-semibold leading-snug text-blue-900 dark:text-white">{tit.competencia}</p>
          {row.ficha_codigo ? (
            <p className="mt-0.5 text-[11px] font-semibold text-slate-800 dark:text-gray-200">
              Ficha {row.ficha_codigo}
            </p>
          ) : null}
          {tit.rap ? (
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-700 dark:text-gray-200">
              {tit.rap}
            </p>
          ) : null}
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
    };

    // Cabecera: lunes → domingo (misma convención que idDia / horarios en BD).
    const diasSemanaCortos = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      // getDay(): 0=dom … 6=sáb. Grid con lunes en la 1.ª columna → huecos iniciales:
      const leadingEmpty = (firstDay.getDay() + 6) % 7;

      const days: (number | null)[] = [];
      for (let i = 0; i < leadingEmpty; i++) {
        days.push(null);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        days.push(d);
      }
      return days;
    };

    /**
     * Colores del calendario:
     * - Naranja: hoy (celda completa)
     * - Verde: cualquier día con sesión en `sesionMateria`
     * - Azul: clase programada ese día y aún sin sesión en BD
     */
    const getDateStatus = (day: number): 'hoy' | 'proxima' | 'pasada' | 'normal' => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      const dateStr = formatYmdLocal(date);

      if (calendarioInstructorMes) {
        const est = calendarioInstructorMes.estadoPorYmd[dateStr];
        if (est === 'hoy') return 'hoy';
        if (est === 'completada') return 'pasada';
        if (est === 'pendiente') return 'proxima';
        return 'normal';
      }

      const hoyLocal = new Date(ahoraRef.getFullYear(), ahoraRef.getMonth(), ahoraRef.getDate());
      hoyLocal.setHours(0, 0, 0, 0);

      if (date.getTime() === hoyLocal.getTime()) {
        return 'hoy';
      }

      if (ymdConSesionCompletada.has(dateStr)) {
        return 'pasada';
      }

      if (ymdPendienteClase.has(dateStr)) {
        return 'proxima';
      }

      return 'normal';
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
          {diasSemanaCortos.map((day, i) => (
            <div key={`dow-${i}`} className="text-center text-xs font-medium text-gray-700 dark:text-gray-300">
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
            const bloquesDia =
              (clasesPorDiaCalendarioInstructor ?? clasesPorDiaCalendario).get(ymdKey) || [];
            const bloquesTooltip = bloquesDia;

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
                        bloquesDia.map((row) => contenidoBloqueTooltipDia(date, row))
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

            if (esFechaClase && bloquesTooltip.length > 0) {
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
                      {bloquesTooltip.map((row) => contenidoBloqueTooltipDia(date, row))}
                    </div>
                  }
                >
                  {celda}
                </DefaultTooltip>
              );
            }

            return <React.Fragment key={index}>{celda}</React.Fragment>;
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2 text-xs">
          {modoCalendario === 'aprendiz' ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-400"></div>
                <span className="text-gray-700 dark:text-gray-300">Verde — sesión completada</span>
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
                <span className="text-gray-700 dark:text-gray-300">Pendientes (faltan por dictar)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-400"></div>
                <span className="text-gray-700 dark:text-gray-300">Completadas (sesión registrada)</span>
              </div>
              {calendarioInstructorMes ? (
                resumenMesCalendarioInstructor.completadas > 0 ||
                resumenMesCalendarioInstructor.pendientes > 0 ? (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                    {resumenMesCalendarioInstructor.completadas}{' '}
                    {resumenMesCalendarioInstructor.completadas === 1 ? 'día' : 'días'} con sesión
                    {resumenMesCalendarioInstructor.pendientes > 0
                      ? ` · ${resumenMesCalendarioInstructor.pendientes} pendiente${resumenMesCalendarioInstructor.pendientes === 1 ? '' : 's'}`
                      : ''}
                    . Usa ← → si faltan días en este mes.
                  </p>
                ) : null
              ) : sesionesCompletadasUnificadas.length > 0 ? (
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                  {sesionesCompletadasUnificadas.length} sesión
                  {sesionesCompletadasUnificadas.length === 1 ? '' : 'es'} completada
                  {ymdPendienteClase.size > 0
                    ? ` · ${ymdPendienteClase.size} pendiente${ymdPendienteClase.size === 1 ? '' : 's'}`
                    : ''}
                  . Usa ← → si faltan días en este mes.
                </p>
              ) : null}
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
  idMateriaPadre?: number;
  programa_nombre?: string;
  fechaInicial?: string;
  fechaFinal?: string;
  horaInicial?: string;
  horaFinal?: string;
  total_sesiones?: number;
  sesiones_dadas?: number;
  sesiones_restantes?: number;
  sesiones_completadas?: SesionCompletada[];
  dia_semana?: string;
  idDia: number; // ID del día desde la BD: 1=Lunes, 2=Martes, ..., 7=Domingo
  jornada_nombre?: string;
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
  tipo_asignacion?: string | null;
  modalidad_rap?: string | null;
  asignacion_vigente?: boolean;
  reemplazo_vigente_por_otro?: boolean;
  es_reemplazante?: boolean;
  instructores_rap?: InstructorRapAsociado[];
  contrato_id?: number;
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
  competencia_nombre?: string;
  rap_nombre?: string | null;
  idMateriaPadre?: number;
  programa_nombre?: string;
  horaInicial?: string;
  horaFinal?: string;
  jornada_nombre?: string;
  jornada_tipo?: string;
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

type MenuOption =
  | 'estudiantes'
  | 'agregar-actividades'
  | 'actividades-asignadas'
  | 'juicios-evaluativos'
  | 'ver-grupos'
  | 'calificaciones'
  | 'material-apoyo'
  | 'justificaciones-pendientes'
  | 'lista-asistencias';

const ClaseDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = location.state as {
    returnTo?: string;
    activeMenu?: MenuOption;
    ficha_id?: number;
    /** RAP / materia de clase (navegación desde calendario u horario). */
    idMateria?: number | string;
    programa_nombre?: string;
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
  const { clases: clasesInstructorCalendario } = useClasesInstructorAsignadas();
  const [historialSesionesInstructor, setHistorialSesionesInstructor] = useState<
    HistorialSesionInstructorItem[]
  >([]);
  const [sesionesCompletadasPorHorario, setSesionesCompletadasPorHorario] =
    useState<SesionesPorHorarioMap>({});
  const idHorarioMateriaClase = id ? parseInt(id, 10) : undefined;

  useEffect(() => {
    if (modoCalendario !== 'instructor') {
      setHistorialSesionesInstructor([]);
      return;
    }
    fetchHistorialSesionesInstructor()
      .then(setHistorialSesionesInstructor)
      .catch(() => setHistorialSesionesInstructor([]));
  }, [modoCalendario, id]);

  /** Misma fuente que Mis formaciones → Completado (historial + clases-asignadas). */
  const clasesInstructorParaCalendario = useMemo(
    (): ClaseAsignadaInstructorBase[] =>
      clasesInstructorConHistorial(clasesInstructorCalendario, historialSesionesInstructor),
    [clasesInstructorCalendario, historialSesionesInstructor]
  );

  const codigoFichaCalendario = String(ficha?.codigo ?? clase?.ficha_codigo ?? '').trim();

  const clasesFranjaMismaFicha = useMemo((): ClaseAsignadaInstructorBase[] => {
    if (!codigoFichaCalendario) return clasesInstructorParaCalendario;
    return clasesInstructorParaCalendario.filter(
      (c) => String(c.ficha_codigo ?? '').trim() === codigoFichaCalendario
    );
  }, [clasesInstructorParaCalendario, codigoFichaCalendario]);

  const todasLasFechasCalendarioApi = useMemo((): FechaClase[] => {
    const byHm = new Map<number, FechaClase>();
    const registrar = (fc: FechaClase) => {
      const id = Number(fc.idHorarioMateria);
      if (!Number.isFinite(id) || id <= 0 || !String(fc.fechaInicial ?? '').trim()) return;
      byHm.set(id, fc);
    };

    for (const fc of todasLasFechasClase) registrar(fc);
    if (modoCalendario === 'instructor' && clasesInstructorParaCalendario.length > 0) {
      for (const fc of filasCalendarioDesdeClasesAsignadas(
        clasesInstructorParaCalendario
      ) as FechaClase[]) {
        registrar(fc);
      }
    }

    let filas = Array.from(byHm.values());

    if (codigoFichaCalendario) {
      const mismaFicha = filas.filter(
        (fc) => String(fc.ficha_codigo ?? '').trim() === codigoFichaCalendario
      );
      if (mismaFicha.length > 0) filas = mismaFicha;
    } else if (idHorarioMateriaClase != null && Number.isFinite(idHorarioMateriaClase)) {
      const delHorario = filas.filter(
        (fc) => Number(fc.idHorarioMateria) === idHorarioMateriaClase
      );
      if (delHorario.length > 0) filas = delHorario;
    }
    return filas;
  }, [
    modoCalendario,
    clasesInstructorParaCalendario,
    todasLasFechasClase,
    idHorarioMateriaClase,
    codigoFichaCalendario
  ]);

  /** Misma fuente que Mis formaciones → Completado (ficha + todos los horarios relacionados). */
  const sesionesCalendarioFranja = useMemo(() => {
    const idHm = Number(clase?.idHorarioMateria ?? idHorarioMateriaClase ?? 0);
    const idsHorariosRelacionados = [
      ...new Set(
        [
          idHm,
          ...todasLasFechasClase.map((fc) => Number(fc.idHorarioMateria)),
          ...clasesInstructorParaCalendario
            .filter((c) => String(c.ficha_codigo ?? '') === String(ficha?.codigo ?? ''))
            .map((c) => c.idHorarioMateria)
        ].filter((n) => Number.isFinite(n) && n > 0)
      )
    ];
    return sesionesCompletadasCalendarioDetalleClase({
      idHorarioMateria: idHm,
      fichaCodigo: ficha?.codigo,
      historial: historialSesionesInstructor,
      clasesInstructor: clasesInstructorParaCalendario,
      sesionesPorHorario: sesionesCompletadasPorHorario,
      idsHorariosRelacionados,
      sesionesClaseDetalle: clase?.sesiones_completadas
    });
  }, [
    clase,
    clasesInstructorParaCalendario,
    ficha,
    todasLasFechasClase,
    idHorarioMateriaClase,
    sesionesCompletadasPorHorario,
    historialSesionesInstructor
  ]);

  const filaClaseCalendarioApi = useMemo((): ClaseAsignadaInstructorBase | null => {
    const idHm = clase?.idHorarioMateria ?? idHorarioMateriaClase;
    if (!idHm) return null;
    const fromApi = clasesInstructorParaCalendario.find((c) => c.idHorarioMateria === idHm);
    if (fromApi) {
      return { ...fromApi, sesiones_completadas: sesionesCalendarioFranja };
    }
    if (!clase?.fechaInicial) return null;
    return {
      ficha_id: 0,
      ficha_codigo: ficha?.codigo ?? '',
      programa_nombre: clase.programa_nombre ?? '',
      materia_nombre: clase.materia_nombre ?? '',
      competencia_nombre: clase.competencia_nombre ?? clase.materia_nombre ?? '',
      rap_nombre: clase.rap_nombre ?? null,
      idMateriaPadre: clase.idMateriaPadre ?? null,
      jornada_nombre: clase.jornada_nombre ?? ficha?.jornada?.nombreJornada ?? '',
      jornada_tipo: clase.jornada_tipo ?? clase.jornada_nombre ?? '',
      dia_semana: clase.dia_semana ?? '',
      idDia: clase.idDia,
      horaInicial: clase.horaInicial ?? '',
      horaFinal: clase.horaFinal ?? '',
      fechaInicial: clase.fechaInicial,
      fechaFinal: clase.fechaFinal ?? null,
      idHorarioMateria: idHm,
      sesiones_completadas: sesionesCalendarioFranja,
      total_sesiones: clase.total_sesiones,
      sesiones_dadas: clase.sesiones_dadas,
      sesiones_restantes: clase.sesiones_restantes
    };
  }, [clase, clasesInstructorParaCalendario, ficha, idHorarioMateriaClase, sesionesCalendarioFranja]);

  const sesionesCompletadasPorHorarioApi = useMemo((): SesionesPorHorarioMap => {
    if (modoCalendario === 'instructor' && clasesInstructorParaCalendario.length > 0) {
      return {
        ...sesionesCompletadasPorHorarioDesdeClases(clasesInstructorParaCalendario),
        ...sesionesCompletadasPorHorario
      };
    }
    return sesionesCompletadasPorHorario;
  }, [modoCalendario, clasesInstructorParaCalendario, sesionesCompletadasPorHorario]);

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEstudiante, setSearchEstudiante] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState<MenuOption>(locationState?.activeMenu || 'estudiantes');

  useEffect(() => {
    const menuQuery = searchParams.get('menu');
    if (
      menuQuery === 'justificaciones-pendientes' ||
      menuQuery === 'lista-asistencias'
    ) {
      setActiveMenu(menuQuery);
    }
  }, [searchParams]);

  const isDesktop = useResponsive('up', 'lg');
  /** En desktop: colapsado = solo iconos; expandido = menú con texto. En móvil siempre se muestran etiquetas. */
  const [menuClaseExpandido, setMenuClaseExpandido] = useState(true);
  const mostrarEtiquetasMenu = !isDesktop || menuClaseExpandido;
  const menuSoloIconos = isDesktop && !menuClaseExpandido;
  const claseBotonItemMenu = (activo: boolean) =>
    clsx(
      'w-full max-w-full min-w-0 rounded-lg border border-transparent text-xs font-medium transition-colors whitespace-normal',
      mostrarEtiquetasMenu
        ? 'flex items-start gap-2 px-2 py-2 text-left'
        : 'flex items-center justify-center px-1.5 py-2',
      activo
        ? 'bg-light dark:bg-coal-300 text-primary border-gray-200 dark:border-gray-100'
        : 'text-gray-700 dark:text-gray-300 hover:bg-light dark:hover:bg-coal-300 hover:border-gray-200 dark:hover:border-gray-100'
    );
  const claseIconoItemMenu = 'mt-0.5 shrink-0 text-base leading-none';
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
  const [modalMoverRapOpen, setModalMoverRapOpen] = useState(false);
  const [actividadParaMoverRap, setActividadParaMoverRap] = useState<Actividad | null>(null);
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

  const idHorarioMateriaRuta = useMemo(() => {
    const n = id ? parseInt(String(id), 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [id]);

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
    return parsePositiveMateriaId(locationState?.idMateria ?? clase?.idMateria);
  }, [locationState?.idMateria, clase?.idMateria]);

  /** string | number para componentes que no aceptan unknown (state con index signature). */
  const idMateriaClaseProp = useMemo(
    (): string | number => normalizeIdProp(locationState?.idMateria ?? clase?.idMateria),
    [locationState?.idMateria, clase?.idMateria]
  );

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
    const diaJs = jsGetDayDesdeApiClase(clase);
    if (diaJs === null || ahora.getDay() !== diaJs) {
      return 'pendiente';
    }

    // Verificar si estamos dentro del rango de horas de la clase
    const hiS = extraerHoraHHMM(clase.horaInicial) ?? clase.horaInicial.substring(0, 5);
    const hfS = extraerHoraHHMM(clase.horaFinal) ?? clase.horaFinal.substring(0, 5);
    let [hIni, mIni] = hiS.split(':').map(Number);
    let [hFin, mFin] = hfS.split(':').map(Number);

    const jornadaTipoUpper = textoJornadaParaAjuste12h(clase).toUpperCase();
    const esTardeOEnoche =
      jornadaTipoUpper.includes('TARDE') ||
      jornadaTipoUpper.includes('NOCHE') ||
      jornadaTipoUpper.includes('NOCTURNA');

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
        const response = await axios.get(`fichas/clase-horario/${id}`);
        const fichaData = response.data?.data?.ficha;
        const claseData = response.data?.data?.clase;

        if (fichaData) {
          setFicha(fichaData);
          if (claseData) {
            const norm = normalizarClaseDetalleApi(claseData);
            const sesionesRoot = response.data?.data?.sesionesCompletadas;
            const sesionesLista = Array.isArray(sesionesRoot)
              ? sesionesRoot
              : Array.isArray((response.data?.data as { sesiones_completadas?: unknown })?.sesiones_completadas)
                ? (response.data?.data as { sesiones_completadas: unknown[] }).sesiones_completadas
                : [];
            if (norm && sesionesLista.length > 0) {
              norm.sesiones_completadas = unificarSesionesCompletadas(
                norm.sesiones_completadas,
                sesionesLista as Array<{ fechaSesion?: unknown; numeroSesion?: number }>
              ) as Clase['sesiones_completadas'];
            }
            setClase(norm ?? (claseData as Clase));
          } else {
            setClase(null);
          }
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
          setFicha(null);
          setClase(null);
          setTodasLasFechasClase([]);
          setSesionesCompletadasPorHorario({});
        }

        setEstudiantes([]);
      } catch {
        setFicha(null);
        setClase(null);
        setTodasLasFechasClase([]);
        setSesionesCompletadasPorHorario({});
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
      const idMateriaFiltro = parsePositiveMateriaId(locationState?.idMateria ?? clase?.idMateria);
      const rawProg = ficha?.asignacion?.programa?.id;
      const idProgramaFiltro =
        rawProg !== undefined && rawProg !== null && String(rawProg) !== ''
          ? Number(rawProg)
          : undefined;
      const params: Record<string, string> = {};
      if (idMateriaFiltro) params.id_materia_clase = String(idMateriaFiltro);
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
    } catch {
      // Silencioso: el menú puede abrirse antes de tener ficha/contexto completo.
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
    if (!clase?.fechaInicial || !clase?.fechaFinal) return null;

    const diaNumero = jsGetDayDesdeApiClase(clase);
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
    const time = extraerHoraHHMM(timeString) ?? timeString.substring(0, 5);
    let [hours, minutes] = time.split(':').map(Number);

    const jornadaTipoUpper = (jornadaTipo || '').toUpperCase();
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
    const inicio = timeToMinutes(clase.horaInicial, clase.jornada_tipo || clase.jornada_nombre);
    const fin = timeToMinutes(clase.horaFinal, clase.jornada_tipo || clase.jornada_nombre);
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
      // Día de clase: prioriza dia_semana del API (coherente con Mi horario / RAPs)
      const diaNumero = jsGetDayDesdeApiClase(f);
      if (diaNumero == null) return false;
      return (
        diaNumero !== null &&
        dIni.getTime() <= hoy.getTime() &&
        hoy.getTime() <= dFin.getTime() &&
        ahora.getDay() === diaNumero
      );
    });
    if (!esDiaDeClase) return false;

    // 3. Hora actual dentro del rango horaInicial–horaFinal (misma lógica de jornada que el listado y el horario)
    const hiS = extraerHoraHHMM(clase.horaInicial) ?? clase.horaInicial.substring(0, 5);
    const hfS = extraerHoraHHMM(clase.horaFinal) ?? clase.horaFinal.substring(0, 5);
    let [hIni, mIni] = hiS.split(':').map(Number);
    let [hFin, mFin] = hfS.split(':').map(Number);

    const jornadaTipoUpper = textoJornadaParaAjuste12h(clase).toUpperCase();
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
    const hiS = extraerHoraHHMM(clase.horaInicial) ?? clase.horaInicial.substring(0, 5);
    let [horaIni, minIni] = hiS.split(':').map(Number);

    const jornadaTipo = textoJornadaParaAjuste12h(clase).toUpperCase();
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

  const instructoresCabecera: InstructorRapAsociado[] = (() => {
    if (!clase) return [];
    const mostrarVariosInstructores =
      estadoClaseLocal === 'en_curso' ||
      estadoClaseLocal === 'pendiente' ||
      clase.modalidad_rap === 'COMPARTIDO' ||
      reemplazoActivoEnClase(clase);
    if (mostrarVariosInstructores) {
      const vis = instructoresVisiblesEnCurso(clase);
      if (vis.length > 0) return vis;
    }
    if (instructorClase?.persona) {
      return [{
        idContrato: instructorClase.id,
        nombre: nombreCompletoInstructor,
        rutaFotoUrl: instructorClase.persona.rutaFotoUrl ?? null,
        rol: 'titular' as const,
      }];
    }
    return [];
  })();

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
              const tit = clase ? titulosCompetenciaYRapUi(clase) : { competencia: 'Sin clase', rap: null as string | null };
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
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Instructor</h2>
                {clase?.modalidad_rap === 'COMPARTIDO' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    <i className="ki-outline ki-people text-xs"></i>Compartido
                  </span>
                )}
                {(() => {
                  if (!clase || !reemplazoActivoEnClase(clase)) return null;
                  const nombreReemplazo = nombreOtroInstructorReemplazo(clase);
                  return (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      title={
                        nombreReemplazo
                          ? clase.reemplazo_vigente_por_otro
                            ? `Te reemplaza ${nombreReemplazo}`
                            : `Reemplazando a ${nombreReemplazo}`
                          : 'Reemplazo'
                      }
                    >
                      <i className="ki-outline ki-arrow-right-left text-xs"></i>
                      Reemplazo{nombreReemplazo ? ` — ${nombreReemplazo}` : ''}
                    </span>
                  );
                })()}
              </div>
              {instructoresCabecera.length > 0 ? (() => {
                const colorInfo = getColorProgreso();
                const porcentaje = calcularPorcentajeProgreso();
                const cronometroText = formatCronometro();

                return (
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {instructoresCabecera.map((inst) => (
                        <div key={inst.idContrato} className="relative">
                          <div className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-700 relative">
                            <svg className="absolute inset-0 w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="16" fill="none" stroke={colorInfo.color} strokeWidth="3" strokeDasharray={`${porcentaje} 100`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center p-1.5">
                              <DefaultTooltip title={inst.nombre} placement="top">
                                <button
                                  type="button"
                                  onClick={() => setZoomFoto({
                                    src: inst.rutaFotoUrl || '/media/avatars/blank.png',
                                    alt: inst.nombre
                                  })}
                                  className="w-full h-full rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-1 overflow-hidden"
                                >
                                  <img
                                    src={inst.rutaFotoUrl || '/media/avatars/blank.png'}
                                    alt={inst.nombre}
                                    className="w-full h-full rounded-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                                  />
                                </button>
                              </DefaultTooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      {instructoresCabecera.map((inst, idx) => (
                        <p key={inst.idContrato} className={clsx('text-sm font-semibold text-gray-900 dark:text-white', idx > 0 && 'mt-0.5')}>
                          {inst.nombre}
                        </p>
                      ))}
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 mt-1">
                        {emailInstructor}
                      </p>
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
          <div className="card h-fit self-start w-full">
            <div className="card-body grow-0 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {modoCalendario === 'aprendiz'
                  ? 'Calendario de tus clases'
                  : 'Calendario de clases'}
              </h2>
              {clase?.fechaInicial ? (
                <CalendarComponent
                  key={`cal-${clase.idHorarioMateria}-${sesionesCalendarioFranja.length}-${historialSesionesInstructor.length}`}
                  fechaInicio={clase.fechaInicial}
                  fechaFin={clase.fechaFinal || clase.fechaInicial}
                  diaSemana={clase.dia_semana}
                  todasLasFechasClase={todasLasFechasCalendarioApi}
                  clasesFranjaCalendario={
                    modoCalendario === 'instructor'
                      ? clasesInstructorParaCalendario
                      : clasesFranjaMismaFicha
                  }
                  idDia={clase.idDia}
                  idHorarioMateria={clase.idHorarioMateria}
                  sesionesCompletadas={sesionesCalendarioFranja}
                  sesionesCompletadasPorHorario={sesionesCompletadasPorHorarioApi}
                  modoCalendario={modoCalendario}
                  horaInicial={clase.horaInicial}
                  horaFinal={clase.horaFinal}
                  filaClaseAsignada={filaClaseCalendarioApi}
                  ahoraRef={currentTime}
                  resumenClaseActual={{
                    ficha_codigo: ficha.codigo,
                    materia_nombre: clase.materia_nombre,
                    competencia_nombre: clase.competencia_nombre,
                    rap_nombre: clase.rap_nombre,
                    programa_nombre:
                      clase.programa_nombre || ficha.asignacion?.programa?.nombrePrograma || '',
                    horaInicial: clase.horaInicial,
                    horaFinal: clase.horaFinal,
                    idHorarioMateria: clase.idHorarioMateria,
                    jornada_nombre: ficha.jornada?.nombreJornada || '',
                    jornada_tipo: ficha.jornada?.nombreJornada || ''
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

      {/* Menú ancho fijo + contenido al lado (flex evita hueco entre menú y panel). */}
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:gap-3">
        <div
          className={clsx(
            'min-w-0 w-full shrink-0 self-start',
            menuClaseExpandido ? 'lg:w-[13.75rem]' : 'lg:w-[4.25rem]'
          )}
        >
          <div className="card h-fit w-full max-w-full shrink-0 self-start overflow-hidden">
            <div
              className={`card-body grow-0 min-w-0 w-full max-w-full overflow-x-hidden ${menuSoloIconos ? 'p-2 sm:p-2.5' : 'p-3.5 sm:p-4'}`}
            >
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
              <div id="menu-clase-items" className="min-w-0 w-full max-w-full space-y-1 overflow-x-hidden">
                <button
                  type="button"
                  title="Estudiantes"
                  onClick={() => setActiveMenu('estudiantes')}
                  className={claseBotonItemMenu(activeMenu === 'estudiantes')}
                >
                  <KeenIcon
                    icon="users"
                    className={clsx(
                      claseIconoItemMenu,
                      activeMenu === 'estudiantes' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                    )}
                  />
                  {mostrarEtiquetasMenu ? <EtiquetaMenuClase etiqueta="Estudiantes" /> : null}
                </button>
                <button
                  type="button"
                  title="Crear actividad"
                  onClick={() => setActiveMenu('agregar-actividades')}
                  className={claseBotonItemMenu(activeMenu === 'agregar-actividades')}
                >
                  <KeenIcon
                    icon="plus-circle"
                    className={clsx(
                      claseIconoItemMenu,
                      activeMenu === 'agregar-actividades' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                    )}
                  />
                  {mostrarEtiquetasMenu ? <EtiquetaMenuClase etiqueta="Crear actividad" /> : null}
                </button>
                <button
                  type="button"
                  title="Calificar actividad"
                  onClick={() => setActiveMenu('actividades-asignadas')}
                  className={claseBotonItemMenu(activeMenu === 'actividades-asignadas')}
                >
                  <KeenIcon
                    icon="check-squared"
                    className={clsx(
                      claseIconoItemMenu,
                      activeMenu === 'actividades-asignadas' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                    )}
                  />
                  {mostrarEtiquetasMenu ? <EtiquetaMenuClase etiqueta="Calificar actividad" /> : null}
                </button>
                <button
                  type="button"
                  title="Ver grupos"
                  onClick={() => setActiveMenu('ver-grupos')}
                  className={claseBotonItemMenu(activeMenu === 'ver-grupos')}
                >
                  <KeenIcon
                    icon="users"
                    className={clsx(
                      claseIconoItemMenu,
                      activeMenu === 'ver-grupos' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                    )}
                  />
                  {mostrarEtiquetasMenu ? <EtiquetaMenuClase etiqueta="Ver grupos" /> : null}
                </button>
                <button
                  type="button"
                  title="Calificaciones"
                  onClick={() => setActiveMenu('calificaciones')}
                  className={claseBotonItemMenu(activeMenu === 'calificaciones')}
                >
                  <KeenIcon
                    icon="chart-line"
                    className={clsx(
                      claseIconoItemMenu,
                      activeMenu === 'calificaciones' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                    )}
                  />
                  {mostrarEtiquetasMenu ? <EtiquetaMenuClase etiqueta="Calificaciones" /> : null}
                </button>
                <button
                  type="button"
                  title="Juicios evaluativos"
                  onClick={() => setActiveMenu('juicios-evaluativos')}
                  className={claseBotonItemMenu(activeMenu === 'juicios-evaluativos')}
                >
                  <KeenIcon
                    icon="chart-simple"
                    className={clsx(
                      claseIconoItemMenu,
                      activeMenu === 'juicios-evaluativos' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                    )}
                  />
                  {mostrarEtiquetasMenu ? <EtiquetaMenuClase etiqueta="Juicios evaluativos" /> : null}
                </button>
                <button
                  type="button"
                  title="Biblioteca de conocimiento"
                  onClick={() => setActiveMenu('material-apoyo')}
                  className={claseBotonItemMenu(activeMenu === 'material-apoyo')}
                >
                  <KeenIcon
                    icon="document"
                    className={clsx(
                      claseIconoItemMenu,
                      activeMenu === 'material-apoyo' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                    )}
                  />
                  {mostrarEtiquetasMenu ? (
                    <EtiquetaMenuClase etiqueta="Biblioteca de conocimiento" />
                  ) : null}
                </button>
                {modoCalendario !== 'aprendiz' && (
                  <>
                    <button
                      type="button"
                      title="Justificaciones pendientes"
                      onClick={() => setActiveMenu('justificaciones-pendientes')}
                      className={claseBotonItemMenu(activeMenu === 'justificaciones-pendientes')}
                    >
                      <KeenIcon
                        icon="time"
                        className={clsx(
                          claseIconoItemMenu,
                          activeMenu === 'justificaciones-pendientes'
                            ? 'text-primary'
                            : 'text-gray-500 dark:text-gray-400'
                        )}
                      />
                      {mostrarEtiquetasMenu ? (
                        <EtiquetaMenuClase etiqueta="Justificaciones pendientes" />
                      ) : null}
                    </button>
                    <button
                      type="button"
                      title="Lista de asistencias"
                      onClick={() => setActiveMenu('lista-asistencias')}
                      className={claseBotonItemMenu(activeMenu === 'lista-asistencias')}
                    >
                      <KeenIcon
                        icon="chart-line-up"
                        className={clsx(
                          claseIconoItemMenu,
                          activeMenu === 'lista-asistencias' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                        )}
                      />
                      {mostrarEtiquetasMenu ? (
                        <EtiquetaMenuClase etiqueta="Lista de asistencias" />
                      ) : null}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal: min-w-0 evita que tablas empujen scroll horizontal a la página */}
        <div className="min-w-0 w-full flex-1">
          <div className="card min-w-0">
            <div className="card-body min-w-0 p-4 sm:p-5">
              {/* Estudiantes Section */}
              {activeMenu === 'estudiantes' && (
                <StudentListByMateria
                  materiaData={{
                    idMateria: idMateriaClaseProp,
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
                  onMoverActividad={(act) => {
                    setActividadParaMoverRap(act);
                    setModalMoverRapOpen(true);
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
                  onMoverActividad={(act) => {
                    setActividadParaMoverRap(act);
                    setModalMoverRapOpen(true);
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

              {/* Biblioteca de conocimiento (programa): aprendiz solo lectura; instructor CRUD según creador */}
              {activeMenu === 'material-apoyo' && idFichaParaClase > 0 && modoCalendario === 'aprendiz' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Biblioteca de conocimiento</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Recursos de consulta de todo tu programa de formación (sin entrega ni calificación). El RAP actual es solo referencia.
                    </p>
                  </div>
                  <MaterialApoyoAprendiz
                    fichaCodigo={ficha?.codigo}
                    rapContextLabel={materialApoyoRapContexto || undefined}
                    emptyMessage="No hay recursos en la biblioteca de conocimiento para tu programa."
                    hideGroupHeaders={false}
                  />
                </div>
              )}
              {activeMenu === 'material-apoyo' && idFichaParaClase > 0 && modoCalendario !== 'aprendiz' && (
                <MaterialApoyoFichaView
                  idFicha={idFichaParaClase}
                  idMateria={idMateriaClaseProp}
                  fichaCodigo={ficha?.codigo}
                  rapContextLabel={materialApoyoRapContexto || undefined}
                  idRapContext={materialApoyoIdRapContexto}
                />
              )}
              {activeMenu === 'material-apoyo' && idFichaParaClase <= 0 && (
                <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
                  <KeenIcon icon="document" className="text-4xl text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Biblioteca de conocimiento</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-4">
                    No hay ficha cargada para esta clase. Vuelve a entrar desde el detalle de la ficha o recarga la página.
                  </p>
                </div>
              )}

              {/* Calificaciones Section */}
              {activeMenu === 'calificaciones' && idFichaParaClase > 0 && (
                <CalificacionesFichaView
                  idFicha={idFichaParaClase}
                  idMateria={idMateriaClaseProp}
                  idInstructor={clase?.instructor?.persona?.id}
                  instructorAsignado={
                    clase?.instructor?.persona
                      ? `${clase.instructor.persona.nombre1} ${clase.instructor.persona.apellido1}`.toUpperCase()
                      : 'NO ASIGNADO'
                  }
                />
              )}

              {activeMenu === 'justificaciones-pendientes' && modoCalendario !== 'aprendiz' && (
                <JustificacionesInstructorPage
                  embedded
                  idFicha={idFichaParaClase > 0 ? idFichaParaClase : undefined}
                  idHorarioMateria={idHorarioMateriaClase}
                />
              )}

              {activeMenu === 'lista-asistencias' && modoCalendario !== 'aprendiz' && (
                <ListaAsistenciasGlobalPage
                  embedded
                  defaultIdFicha={idFichaParaClase > 0 ? idFichaParaClase : undefined}
                  defaultIdHorarioMateria={idHorarioMateriaClase}
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
      <ModalMoverActividadRap
        open={modalMoverRapOpen && idFichaParaClase > 0}
        onClose={() => {
          setModalMoverRapOpen(false);
          setActividadParaMoverRap(null);
        }}
        actividad={actividadParaMoverRap}
        idFicha={idFichaParaClase}
        idHorarioMateria={idHorarioMateriaRuta}
        onSave={() => fetchActividades()}
        onSuccess={showToast}
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








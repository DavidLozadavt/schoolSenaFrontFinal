import axios from 'axios';

/**
 * Clave de deduplicación de clases asignadas a **un** instructor.
 * Debe mantenerse alineado con `FichaController::clasesAsignadasInstructor` (Laravel).
 *
 * Una fila visible por: ficha + día de semana + franja horaria + jornada de la ficha;
 * si la BD trae varios `horarioMateria` equivalentes, se conserva el de menor `idHorarioMateria`.
 *
 * Las funciones `extraerHoraHHMM` / `normalizarHoraCampoClaseApi` / `textoJornadaParaAjuste12h`
 * deben usarse también en Mis formaciones (`ListaHistorialRAPs`) y en el detalle de clase / calendario
 * (`ClaseDetallePage`) para que horario, listado y calendario interpreten la misma hora y jornada.
 *
 * `titulosCompetenciaYRapUi` unifica el texto de competencia + RAP en esas tres vistas.
 * `jsGetDayDesdeApiClase` prioriza `dia_semana` del API sobre `idDia` para que el día coincida en todas.
 */

/** Fila mínima para el mismo título competencia/RAP en horario, historial y detalle. */
export type FilaTitulosCompetenciaRap = {
  materia_nombre?: string | null;
  competencia_nombre?: string | null;
  rap_nombre?: string | null;
  programa_nombre?: string | null;
};

/**
 * Competencia (título) + RAP (subtítulo). Misma regla que `HorarioInstructorPage` / `ListaHistorialRAPs`:
 * fallback a materia y programa; si no hay `rap_nombre` y `materia_nombre` trae " - ", se parte en competencia/RAP.
 */
export function titulosCompetenciaYRapUi(row: FilaTitulosCompetenciaRap): {
  competencia: string;
  rap: string | null;
} {
  const materia = String(row.materia_nombre ?? '').trim();
  const compStored = String(row.competencia_nombre ?? '').trim();
  let competencia =
    compStored || materia || String(row.programa_nombre ?? '').trim() || 'Sin nombre';
  let rap =
    row.rap_nombre != null && String(row.rap_nombre).trim() !== ''
      ? String(row.rap_nombre).trim()
      : null;

  if (!rap && materia.includes(' - ')) {
    const sep = ' - ';
    const i = materia.indexOf(sep);
    const tail = materia.slice(i + sep.length).trim();
    const head = materia.slice(0, i).trim();
    if (tail.length > 0 && head.length > 0) {
      rap = tail;
      if (compStored === materia) {
        competencia = head;
      }
    }
  }

  return { competencia, rap };
}

/** Texto "Martes"/"MIE"/... → `Date.getDay()` (0=dom … 6=sáb). */
export function diaSemanaTextoAGetDayEs(diaSemana?: string | null): number | null {
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
}

/** Convención histórica front: idDia 1=lun … 7=dom → `Date.getDay()`. */
export function idDiaNumericoSenaAGetDay(idDia: unknown): number | null {
  const n = Number(idDia);
  if (!Number.isFinite(n) || n < 1 || n > 7) return null;
  return n === 7 ? 0 : n;
}

/**
 * Día de semana JS alineado con el calendario: **prioriza** `dia_semana` del API (tabla `dia.dia`);
 * si falta o no se reconoce, usa `idDia` numérico 1=lun…7=dom.
 */
export function jsGetDayDesdeApiClase(c: {
  idDia?: unknown;
  dia_semana?: string | null;
}): number | null {
  const t = diaSemanaTextoAGetDayEs(c.dia_semana);
  if (t !== null) return t;
  return idDiaNumericoSenaAGetDay(c.idDia);
}

/** Columna 0=Lun … 6=Dom en grillas con cabecera Lun–Dom. */
export function columnaLunesPrimeroDesdeGetDay(getDayJs: number): number {
  return (getDayJs + 6) % 7;
}

/** Columna horario (0=Lun…) desde fila API; -1 si no se puede resolver. */
export function columnaHorarioApiClase(c: {
  idDia?: unknown;
  dia_semana?: string | null;
}): number {
  const d = jsGetDayDesdeApiClase(c);
  if (d === null) return -1;
  return columnaLunesPrimeroDesdeGetDay(d);
}

export type ClaseAsignadaClaveLogica = {
  ficha_id: number;
  idDia: number;
  horaInicial: string;
  horaFinal: string;
  jornada_nombre: string;
  jornada_tipo: string;
  idHorarioMateria: number;
};

/** Igual que `FichaController::horaClaveClaseAsignada` (primer HH:mm en la cadena; si no, 5 primeros caracteres). */
export function horaClaveClaseAsignada(v: string): string {
  const s = (v ?? '').trim();
  if (s === '') return '';
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) {
    const hh = String(parseInt(m[1]!, 10)).padStart(2, '0');
    const mm = String(parseInt(m[2]!, 10)).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return s.slice(0, 5);
}

/** Igual que `FichaController::jornadaClaveClaseAsignada` (preferir nombre; `mb_strtoupper` UTF-8 ≈ `toUpperCase`). */
export function jornadaClaveClaseAsignada(
  c: Pick<ClaseAsignadaClaveLogica, 'jornada_nombre' | 'jornada_tipo'>
): string {
  const n = (c.jornada_nombre ?? '').trim();
  const t = (c.jornada_tipo ?? '').trim();
  const s = n !== '' ? n : t;
  return s.toUpperCase();
}

/** Misma cadena que arma el `implode` en PHP para `unique`. */
export function claveLogicaClaseAsignadaInstructor(c: ClaseAsignadaClaveLogica): string {
  return [
    c.ficha_id,
    c.idDia,
    horaClaveClaseAsignada(c.horaInicial),
    horaClaveClaseAsignada(c.horaFinal),
    jornadaClaveClaseAsignada(c)
  ].join('|');
}

export function dedupeClasesPorIdHorarioMateria<T extends { idHorarioMateria: number }>(lista: T[]): T[] {
  const m = new Map<number, T>();
  for (const c of lista) {
    const id = Number(c.idHorarioMateria);
    if (!Number.isFinite(id) || id <= 0) continue;
    if (!m.has(id)) m.set(id, c);
  }
  return Array.from(m.values());
}

export function dedupeClasesAsignadasInstructorPorClaveLogica<T extends ClaseAsignadaClaveLogica>(lista: T[]): T[] {
  const porPk = dedupeClasesPorIdHorarioMateria(lista);
  const map = new Map<string, T>();
  for (const c of porPk) {
    const key = claveLogicaClaseAsignadaInstructor(c);
    const prev = map.get(key);
    if (!prev || c.idHorarioMateria < prev.idHorarioMateria) {
      map.set(key, c);
    }
  }
  return Array.from(map.values());
}

// ─── Hora en UI (horario, historial, detalle de clase): misma regla en todos lados ─────────────

/**
 * Extrae `HH:mm` de TIME, datetime SQL o ISO.
 * Si no hay patrón reconocible, devuelve el string recortado (fallback).
 */
export function extraerHoraHHMM(val: string): string | null {
  const v = (val || '').trim();
  if (!v) return null;
  let s = v;
  if (s.includes('T')) {
    const p = s.split('T').pop()!;
    s = p;
  }
  if (s.includes(' ')) {
    const parts = s.split(/\s+/);
    s = parts[parts.length - 1]!;
  }
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!m) return null;
  const hh = String(parseInt(m[1]!, 10)).padStart(2, '0');
  const mm = String(parseInt(m[2]!, 10)).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Campo hora del API → siempre `HH:mm` cuando se puede inferir (alineado con `HorarioInstructorPage`). */
export function normalizarHoraCampoClaseApi(raw: unknown): string {
  const s = String(raw ?? '').trim();
  return extraerHoraHHMM(s) ?? s;
}

/**
 * Texto para ajuste 12h→24h en franjas (tarde/noche): nombre o tipo de jornada, como en el horario semanal.
 */
export function textoJornadaParaAjuste12h(c: {
  jornada_nombre?: string | null;
  jornada_tipo?: string | null;
}): string {
  const n = (c.jornada_nombre ?? '').trim();
  const t = (c.jornada_tipo ?? '').trim();
  return (n || t).toLowerCase();
}

// ─── Fechas y ocurrencias (horario, Mis formaciones, dashboard, detalle) ───────

export function parseFechaYmdLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Normaliza `fechaSesion` del API (date, datetime o ISO) a YYYY-MM-DD local. */
export function ymdFromFechaSesion(fecha: unknown): string | null {
  if (fecha == null || fecha === '') return null;
  const s = String(fecha).trim();
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const head = (s.split('T')[0] ?? '').split(' ')[0]?.trim() ?? '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
  return null;
}

/** Une listas de sesiones completadas sin duplicar (misma franja / calendario detalle). */
export function unificarSesionesCompletadas(
  ...listas: Array<Array<{ fechaSesion?: unknown; numeroSesion?: number }> | undefined>
): SesionCalendarioClase[] {
  const porClave = new Map<string, SesionCalendarioClase>();
  for (const lista of listas) {
    for (const s of lista ?? []) {
      const ymd = ymdFromFechaSesion(s.fechaSesion);
      if (!ymd) continue;
      const key = `${ymd}|${s.numeroSesion ?? ''}`;
      if (!porClave.has(key)) {
        porClave.set(key, { fechaSesion: ymd, numeroSesion: s.numeroSesion });
      }
    }
  }
  return Array.from(porClave.values());
}

/** Conjunto de días con sesión en BD (verde en calendario). */
export function ymdSetSesionesCompletadas(sesiones: SesionCalendarioClase[]): Set<string> {
  const set = new Set<string>();
  for (const s of sesiones) {
    const ymd = ymdFromFechaSesion(s.fechaSesion);
    if (ymd) set.add(ymd);
  }
  return set;
}

/** ¿La franja recurrente cae en este día calendario? (día de semana + vigencia fechaInicial–fechaFinal). */
export function claseOcurreEnFecha(
  c: {
    fechaInicial?: string | null;
    fechaFinal?: string | null;
    idDia?: unknown;
    dia_semana?: string | null;
  },
  ref: Date
): boolean {
  if (!c.fechaInicial?.trim()) return false;
  const diaNumero = jsGetDayDesdeApiClase(c);
  if (diaNumero === null) return false;
  const hoy = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  hoy.setHours(0, 0, 0, 0);
  const fechaInicio = parseFechaYmdLocal(c.fechaInicial);
  fechaInicio.setHours(0, 0, 0, 0);
  const fechaFin = c.fechaFinal ? parseFechaYmdLocal(c.fechaFinal) : null;
  if (fechaFin) fechaFin.setHours(0, 0, 0, 0);
  return (
    ref.getDay() === diaNumero &&
    fechaInicio.getTime() <= hoy.getTime() &&
    (!fechaFin || hoy.getTime() <= fechaFin.getTime())
  );
}

export function claseOcurreHoy(
  c: Parameters<typeof claseOcurreEnFecha>[0],
  ahora: Date = new Date()
): boolean {
  return claseOcurreEnFecha(c, ahora);
}

export type FilaFranjaHoraria = {
  horaInicial?: string | null;
  horaFinal?: string | null;
  jornada_nombre?: string | null;
  jornada_tipo?: string | null;
};

/** Misma prioridad que `tipoJornadaVisual` en `HorarioInstructorPage`. */
export type TipoJornadaVisualClase = 'manana' | 'tarde' | 'noche' | 'otro';

export function tipoJornadaClaseAsignada(c: FilaFranjaHoraria): TipoJornadaVisualClase {
  const j = `${c.jornada_nombre ?? ''} ${c.jornada_tipo ?? ''}`.toLowerCase();
  if (j.includes('noche') || j.includes('nocturna')) return 'noche';
  if (j.includes('tarde')) return 'tarde';
  if (j.includes('mañana') || j.includes('manana') || j.includes('diurna')) return 'manana';
  return 'otro';
}

/**
 * Texto de jornada para ajuste 12h→24h (orden `jornada_tipo` → `jornada_nombre`, como el horario).
 */
export function textoJornadaAjuste12hHorario(c: FilaFranjaHoraria): string {
  const t = (c.jornada_tipo ?? '').trim();
  const n = (c.jornada_nombre ?? '').trim();
  return (t || n).toLowerCase();
}

/**
 * Minutos desde medianoche — idéntico a `horaAMinutos` + `planificarColumnaDia` del horario semanal.
 * Si `fin <= inicio`, la franja no se pinta en Mi horario ni debe listarse en formaciones.
 */
export function minutosFranjaHorarioClase(c: FilaFranjaHoraria): { start: number; end: number } | null {
  const jornada = textoJornadaAjuste12hHorario(c);
  const esTardeONoche =
    jornada.includes('tarde') || jornada.includes('noche') || jornada.includes('nocturna');

  const aMinutos = (h: string): number | null => {
    const t = extraerHoraHHMM(h);
    if (!t) return null;
    const parts = t.split(':');
    let hh = parseInt(parts[0]!, 10);
    const mm = parseInt(parts[1]!, 10) || 0;
    if (Number.isNaN(hh)) return null;
    if (esTardeONoche && hh < 12) hh += 12;
    return hh * 60 + mm;
  };

  const start = aMinutos(String(c.horaInicial ?? ''));
  const end = aMinutos(String(c.horaFinal ?? ''));
  if (start == null || end == null || end <= start) return null;
  return { start, end };
}

/** ¿La franja es válida para mostrarse en Mi horario? */
export function franjaHorarioValidaClase(c: FilaFranjaHoraria): boolean {
  return minutosFranjaHorarioClase(c) !== null;
}

export type FilaConteoSesionesClase = {
  total_sesiones?: number;
  sesiones_dadas?: number;
  sesiones_restantes?: number;
};

/** ¿Quedan sesiones por dictar en esta franja? (6/6 o 2/2 → no). */
export function claseTieneSesionesPorDictar(c: FilaConteoSesionesClase): boolean {
  const restantes = c.sesiones_restantes;
  if (typeof restantes === 'number' && !Number.isNaN(restantes)) {
    return restantes > 0;
  }
  const total = Number(c.total_sesiones) || 0;
  if (total <= 0) return true;
  const dadas = Number(c.sesiones_dadas) || 0;
  return dadas < total;
}

/** ¿Misma visibilidad que una columna del horario semanal? */
export function claseVisibleEnGrillaHorario(c: {
  idDia?: unknown;
  dia_semana?: string | null;
  horaInicial?: string | null;
  horaFinal?: string | null;
  jornada_nombre?: string | null;
  jornada_tipo?: string | null;
} & FilaConteoSesionesClase): boolean {
  return (
    columnaHorarioApiClase(c) >= 0 &&
    franjaHorarioValidaClase(c) &&
    claseTieneSesionesPorDictar(c)
  );
}

/** Ventana horaria local de una ocurrencia en `fechaDia`. */
export function obtenerVentanaHorariaEnFecha(
  c: FilaFranjaHoraria,
  fechaDia: Date,
  ahora: Date = new Date()
): { inicio: Date; fin: Date } | null {
  const mins = minutosFranjaHorarioClase(c);
  if (!mins) return null;
  const inicio = new Date(fechaDia.getFullYear(), fechaDia.getMonth(), fechaDia.getDate());
  inicio.setHours(Math.floor(mins.start / 60), mins.start % 60, 0, 0);
  const fin = new Date(fechaDia.getFullYear(), fechaDia.getMonth(), fechaDia.getDate());
  fin.setHours(Math.floor(mins.end / 60), mins.end % 60, 0, 0);
  if (fin.getTime() <= inicio.getTime()) fin.setDate(fin.getDate() + 1);
  void ahora;
  return { inicio, fin };
}

export function obtenerVentanaHorariaHoy(
  c: Parameters<typeof claseOcurreEnFecha>[0] &
    Parameters<typeof obtenerVentanaHorariaEnFecha>[0],
  ahora: Date = new Date()
): { inicio: Date; fin: Date } | null {
  if (!claseOcurreHoy(c, ahora)) return null;
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return obtenerVentanaHorariaEnFecha(c, hoy, ahora);
}

/** Próxima fecha calendario con clase pendiente (desde `desde`, por día de semana). */
export function calcularProximaFechaOcurrenciaClase(
  c: {
    fechaInicial?: string | null;
    fechaFinal?: string | null;
    idDia?: unknown;
    dia_semana?: string | null;
  },
  desde: Date = new Date()
): Date | null {
  if (!c.fechaInicial?.trim()) return null;
  const diaNumero = jsGetDayDesdeApiClase(c);
  if (diaNumero === null) return null;
  const hoy = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  hoy.setHours(0, 0, 0, 0);
  const fechaInicio = parseFechaYmdLocal(c.fechaInicial);
  fechaInicio.setHours(0, 0, 0, 0);
  const fechaFin = c.fechaFinal ? parseFechaYmdLocal(c.fechaFinal) : null;
  if (fechaFin) fechaFin.setHours(0, 0, 0, 0);
  let cursor = new Date(Math.max(fechaInicio.getTime(), hoy.getTime()));
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getDay() !== diaNumero) {
    cursor.setDate(cursor.getDate() + 1);
  }
  if (fechaFin && cursor.getTime() > fechaFin.getTime()) return null;
  return cursor;
}

export type SesionCalendarioClase = {
  fechaSesion: string;
  numeroSesion?: number;
};

export type ClaseAsignadaInstructorBase = ClaseAsignadaClaveLogica & {
  ficha_id: number;
  ficha_codigo: string;
  programa_nombre: string;
  materia_nombre: string;
  competencia_nombre: string;
  rap_nombre: string | null;
  idMateriaPadre: number | null;
  dia_semana: string;
  fechaInicial: string;
  fechaFinal: string | null;
  instructor_nombre?: string;
  aula_nombre?: string | null;
  sesiones_completadas?: SesionCalendarioClase[];
};

export type FilaCalendarioClaseAsignada = {
  idHorarioMateria?: number;
  fechaInicial: string;
  fechaFinal: string | null;
  dia_semana: string;
  idDia: number;
  ficha_codigo?: string;
  materia_nombre?: string;
  competencia_nombre?: string;
  rap_nombre?: string | null;
  programa_nombre?: string;
  horaInicial?: string;
  horaFinal?: string;
  jornada_nombre?: string;
  jornada_tipo?: string;
};

export type SesionCalendarioInstructorUi = {
  id: string;
  idHorarioMateria: number;
  materia: string;
  fechaStr: string;
  fechaObj: Date;
  horaInicial: string;
  horaFinal: string;
  estado: string;
  profesor: string;
  aula: string;
};

function toNumClaseApi(val: unknown): number {
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

function toNumOrNullClaseApi(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

/** Normalización única de `fichas/instructor/clases-asignadas`. */
export function normalizarClaseAsignadaInstructorDesdeApi(
  raw: Record<string, unknown>
): ClaseAsignadaInstructorBase & Record<string, unknown> {
  const idHorarioMateria = toNumClaseApi(raw.idHorarioMateria);
  const materiaNombre = String(raw.materia_nombre ?? '');
  const competenciaRaw =
    raw.competencia_nombre != null
      ? String(raw.competencia_nombre).trim()
      : raw.competenciaNombre != null
        ? String(raw.competenciaNombre).trim()
        : '';
  const competencia_nombre =
    competenciaRaw || materiaNombre || String(raw.programa_nombre ?? '');
  const rapSource = raw.rap_nombre ?? raw.rapNombre;
  const rapRaw =
    rapSource != null && rapSource !== '' && String(rapSource).toLowerCase() !== 'null'
      ? String(rapSource).trim()
      : '';
  const rap_nombre = rapRaw.length > 0 ? rapRaw : null;
  const aulaRaw = raw.aula_nombre != null ? String(raw.aula_nombre).trim() : '';

  const sesiones: SesionCalendarioClase[] = Array.isArray(raw.sesiones_completadas)
    ? (raw.sesiones_completadas as Record<string, unknown>[])
        .map((s) => {
          const ymd = ymdFromFechaSesion(s.fechaSesion);
          if (!ymd) return null;
          return {
            fechaSesion: ymd,
            numeroSesion: toNumClaseApi(s.numeroSesion)
          };
        })
        .filter((x): x is SesionCalendarioClase => x != null)
    : [];

  return {
    ...raw,
    ficha_id: toNumClaseApi(raw.ficha_id),
    ficha_codigo: String(raw.ficha_codigo ?? ''),
    programa_nombre: String(raw.programa_nombre ?? ''),
    materia_nombre: materiaNombre,
    competencia_nombre,
    rap_nombre,
    idMateriaPadre: toNumOrNullClaseApi(raw.idMateriaPadre),
    jornada_nombre: String(raw.jornada_nombre ?? ''),
    jornada_tipo: String(raw.jornada_tipo ?? ''),
    dia_semana: String(raw.dia_semana ?? ''),
    idDia: toNumClaseApi(raw.idDia),
    horaInicial: normalizarHoraCampoClaseApi(raw.horaInicial),
    horaFinal: normalizarHoraCampoClaseApi(raw.horaFinal),
    fechaInicial: String(raw.fechaInicial ?? ''),
    fechaFinal: raw.fechaFinal != null ? String(raw.fechaFinal) : null,
    idHorarioMateria,
    instructor_nombre: String(raw.instructor_nombre ?? ''),
    aula_nombre: aulaRaw.length > 0 ? aulaRaw : null,
    sesiones_completadas: sesiones
  };
}

/** Estado visual de un día (misma prioridad que calendario del detalle de clase). */
export type EstadoDiaCalendarioInstructor = 'hoy' | 'completada' | 'pendiente' | 'normal';

/** Bloque de clase en tooltip / lista del día (instructor). */
export type BloqueCalendarioInstructorDia = {
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
  bloqueSesionRegistrada?: boolean;
  numeroSesion?: number;
};

function finVentanaFranjaCalendario(
  row: Pick<BloqueCalendarioInstructorDia, 'horaInicial' | 'horaFinal' | 'jornada_nombre' | 'jornada_tipo'>,
  diaCalendario: Date,
  ahora: Date
): Date {
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
  void ahora;
  return hf;
}

function bloqueCalendarioDesdeClase(c: ClaseAsignadaInstructorBase): BloqueCalendarioInstructorDia {
  return {
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
  };
}

function claveBloqueCalendarioInstructor(row: BloqueCalendarioInstructorDia): string {
  const tit = titulosCompetenciaYRapUi(row);
  const comp = String(tit.competencia || '').trim().toLowerCase();
  const rap = String(tit.rap ?? '').trim().toLowerCase();
  return `${String(row.ficha_codigo || '')
    .trim()
    .toLowerCase()}|${horaClaveClaseAsignada(row.horaInicial || '')}|${horaClaveClaseAsignada(row.horaFinal || '')}|${comp}|${rap}`;
}

function sesionesUnicasFranjaInstructor(
  c: ClaseAsignadaInstructorBase
): Array<{ fechaSesion: string; numeroSesion?: number }> {
  const visto = new Set<string>();
  const out: Array<{ fechaSesion: string; numeroSesion?: number }> = [];
  for (const s of c.sesiones_completadas ?? []) {
    const ymd = ymdFromFechaSesion(s.fechaSesion);
    if (!ymd) continue;
    const k = `${ymd}|${s.numeroSesion ?? ''}`;
    if (visto.has(k)) continue;
    visto.add(k);
    out.push(s);
  }
  return out;
}

/** Una tarjeta por horario y día (sin duplicar programada + sesión). */
export function bloquesClaseEnDiaCalendarioInstructor(
  clases: ClaseAsignadaInstructorBase[],
  dia: Date,
  ymd: string,
  ahora: Date = new Date()
): BloqueCalendarioInstructorDia[] {
  const bloques: BloqueCalendarioInstructorDia[] = [];
  const horariosYa = new Set<number>();

  for (const c of clases) {
    const idHm = Number(c.idHorarioMateria);
    if (!idHm || horariosYa.has(idHm)) continue;

    const sesionesHoy = sesionesUnicasFranjaInstructor(c).filter(
      (s) => ymdFromFechaSesion(s.fechaSesion) === ymd
    );
    const ocurre = claseOcurreEnFecha(c, dia);
    if (!ocurre && sesionesHoy.length === 0) continue;

    const base = bloqueCalendarioDesdeClase(c);
    const hf = finVentanaFranjaCalendario(base, dia, ahora);
    const franjaTerminada = ahora.getTime() > hf.getTime();

    let bloque: BloqueCalendarioInstructorDia | null = null;
    if (ocurre && !franjaTerminada) {
      bloque = base;
    } else if (sesionesHoy.length > 0) {
      const ultima = sesionesHoy[sesionesHoy.length - 1]!;
      bloque = {
        ...base,
        bloqueSesionRegistrada: true,
        numeroSesion: ultima.numeroSesion
      };
    } else if (ocurre) {
      bloque = base;
    }

    if (!bloque) continue;
    horariosYa.add(idHm);
    bloques.push(bloque);
  }

  bloques.sort((a, b) => {
    if (a.bloqueSesionRegistrada !== b.bloqueSesionRegistrada) {
      return a.bloqueSesionRegistrada ? -1 : 1;
    }
    return (a.horaInicial || '').localeCompare(b.horaInicial || '');
  });
  return bloques;
}

/** Etiqueta de estado (alineada al tooltip del detalle de clase). */
export function etiquetaEstadoBloqueCalendarioInstructor(
  diaCalendario: Date,
  row: BloqueCalendarioInstructorDia,
  ahora: Date = new Date()
): string {
  if (row.bloqueSesionRegistrada) return 'Completada';

  const hoy0 = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  hoy0.setHours(0, 0, 0, 0);
  const d0 = new Date(diaCalendario.getFullYear(), diaCalendario.getMonth(), diaCalendario.getDate());
  d0.setHours(0, 0, 0, 0);

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
  const hi = new Date(ahora);
  hi.setHours(hIni, mIni || 0, 0, 0);
  const hf = new Date(ahora);
  hf.setHours(hFin, mFin || 0, 0, 0);
  if (hf.getTime() < hi.getTime()) hf.setDate(hf.getDate() + 1);

  if (d0.getTime() < hoy0.getTime()) return 'Pasada';
  if (d0.getTime() > hoy0.getTime()) return 'Pendiente';
  if (ahora.getTime() < hi.getTime()) return 'Pendiente';
  if (ahora.getTime() >= hi.getTime() && ahora.getTime() <= hf.getTime()) return 'En curso';
  return 'Pendiente';
}

/** Misma fusión que `ClaseDetallePage` → clases-asignadas + historial. */
export function clasesInstructorConHistorial(
  clases: ClaseAsignadaInstructorBase[],
  historial: HistorialSesionInstructorItem[]
): ClaseAsignadaInstructorBase[] {
  const porHm = new Map<number, ClaseAsignadaInstructorBase>();
  for (const c of clases) {
    porHm.set(c.idHorarioMateria, { ...c, sesiones_completadas: [...(c.sesiones_completadas ?? [])] });
  }
  for (const item of historial) {
    const raw = item.clase as Record<string, unknown>;
    const idHm = Number(raw.idHorarioMateria);
    if (!Number.isFinite(idHm) || idHm <= 0) continue;
    const ymd = ymdFromFechaSesion(item.sesion.fechaSesion);
    if (!ymd) continue;
    const ses = { fechaSesion: ymd, numeroSesion: Number(item.sesion.numeroSesion) };
    const prev = porHm.get(idHm);
    if (prev) {
      const list = [...(prev.sesiones_completadas ?? [])];
      if (!list.some((s) => ymdFromFechaSesion(s.fechaSesion) === ymd && s.numeroSesion === ses.numeroSesion)) {
        list.push(ses);
      }
      porHm.set(idHm, { ...prev, sesiones_completadas: list });
    } else {
      porHm.set(idHm, {
        ficha_id: Number(raw.ficha_id) || 0,
        ficha_codigo: String(raw.ficha_codigo ?? ''),
        programa_nombre: String(raw.programa_nombre ?? ''),
        materia_nombre: String(raw.materia_nombre ?? ''),
        competencia_nombre: String(raw.competencia_nombre ?? ''),
        rap_nombre: (raw.rap_nombre as string | null) ?? null,
        idMateriaPadre: null,
        jornada_nombre: String(raw.jornada_nombre ?? ''),
        jornada_tipo: String(raw.jornada_tipo ?? ''),
        dia_semana: String(raw.dia_semana ?? ''),
        idDia: Number(raw.idDia) || 0,
        horaInicial: String(raw.horaInicial ?? ''),
        horaFinal: String(raw.horaFinal ?? ''),
        fechaInicial: String(raw.fechaInicial ?? ''),
        fechaFinal: raw.fechaFinal != null ? String(raw.fechaFinal) : null,
        idHorarioMateria: idHm,
        sesiones_completadas: [ses]
      });
    }
  }
  return Array.from(porHm.values());
}

export type CalendarioInstructorRango = {
  porDia: Record<string, BloqueCalendarioInstructorDia[]>;
  estadoPorYmd: Record<string, EstadoDiaCalendarioInstructor>;
  sesionesCompletadasEnRango: number;
  diasPendientesEnRango: number;
};

/**
 * Calendario instructor en un rango: mismos días y clases que el detalle de clase
 * (`fechasVisibles` + pendientes + sesiones en BD), todas las fichas del docente.
 */
export function calendarioInstructorEnRango(
  clases: ClaseAsignadaInstructorBase[],
  rangeStart: Date,
  rangeEnd: Date,
  ahora: Date = new Date()
): CalendarioInstructorRango {
  const start = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
  start.setHours(0, 0, 0, 0);
  const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
  end.setHours(23, 59, 59, 999);

  const filas = clases
    .filter((c) => c.idHorarioMateria > 0 && c.fechaInicial?.trim())
    .map((c) => ({
      fechaInicial: c.fechaInicial,
      fechaFinal: c.fechaFinal ?? null,
      idDia: c.idDia,
      dia_semana: c.dia_semana,
      horaInicial: c.horaInicial,
      horaFinal: c.horaFinal,
      jornada_nombre: c.jornada_nombre,
      jornada_tipo: c.jornada_tipo,
      sesiones_restantes: (c as { sesiones_restantes?: number }).sesiones_restantes,
      total_sesiones: (c as { total_sesiones?: number }).total_sesiones,
      sesiones_dadas: (c as { sesiones_dadas?: number }).sesiones_dadas,
      sesiones_completadas: c.sesiones_completadas ?? []
    }));

  const sesionesUnificadas = unificarSesionesCompletadas(
    ...filas.map((f) => f.sesiones_completadas)
  );
  const ymdCompletadas = ymdSetSesionesCompletadas(sesionesUnificadas);
  const ymdPendientes = ymdPendientesCalendarioFranjas(filas, sesionesUnificadas, ahora);
  const hoyYmd = formatYmdLocal(ahora);

  const porDia: Record<string, BloqueCalendarioInstructorDia[]> = {};
  const estadoPorYmd: Record<string, EstadoDiaCalendarioInstructor> = {};
  let sesionesCompletadasEnRango = 0;
  let diasPendientesEnRango = 0;

  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const ymd = formatYmdLocal(cursor);
    const bloques = bloquesClaseEnDiaCalendarioInstructor(clases, cursor, ymd, ahora);
    if (bloques.length > 0) {
      porDia[ymd] = bloques;
    }

    let est: EstadoDiaCalendarioInstructor = 'normal';
    if (ymd === hoyYmd) est = 'hoy';
    else if (ymdCompletadas.has(ymd)) est = 'completada';
    else if (ymdPendientes.has(ymd)) est = 'pendiente';

    if (est !== 'normal' || bloques.length > 0) {
      estadoPorYmd[ymd] = est;
    }
    if (ymdCompletadas.has(ymd)) sesionesCompletadasEnRango += 1;
    if (ymdPendientes.has(ymd)) diasPendientesEnRango += 1;

    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    porDia,
    estadoPorYmd,
    sesionesCompletadasEnRango,
    diasPendientesEnRango
  };
}

function bloqueADisplaySesionInstructor(
  b: BloqueCalendarioInstructorDia,
  ymd: string,
  dia: Date,
  ahora: Date,
  c: ClaseAsignadaInstructorBase | undefined
): SesionCalendarioInstructorUi {
  const { competencia } = titulosCompetenciaYRapUi(b);
  const salon = c?.aula_nombre?.trim();
  const clave = `${b.idHorarioMateria}-${ymd}-${b.bloqueSesionRegistrada ? 's' : 'p'}-${b.numeroSesion ?? ''}-${claveBloqueCalendarioInstructor(b)}`;
  return {
    id: clave,
    idHorarioMateria: b.idHorarioMateria,
    materia: competencia,
    fechaStr: ymd,
    fechaObj: dia,
    horaInicial: b.horaInicial,
    horaFinal: b.horaFinal,
    estado: etiquetaEstadoBloqueCalendarioInstructor(dia, b, ahora),
    profesor: c?.instructor_nombre ?? '',
    aula: salon ? `${salon} · Ficha ${b.ficha_codigo}` : `Ficha ${b.ficha_codigo}`
  };
}

/** Ocurrencias en un rango para el dashboard (misma fuente que calendario detalle). */
export function sesionesCalendarioInstructorEnRango(
  clases: ClaseAsignadaInstructorBase[],
  rangeStart: Date,
  rangeEnd: Date,
  ahora: Date = new Date()
): SesionCalendarioInstructorUi[] {
  const porHm = new Map(clases.map((c) => [c.idHorarioMateria, c]));
  const { porDia } = calendarioInstructorEnRango(clases, rangeStart, rangeEnd, ahora);
  const sessions: SesionCalendarioInstructorUi[] = [];

  for (const [ymd, bloques] of Object.entries(porDia)) {
    const parts = ymd.split('-').map(Number);
    if (parts.length !== 3) continue;
    const dia = new Date(parts[0], parts[1] - 1, parts[2]);
    dia.setHours(0, 0, 0, 0);
    for (const b of bloques) {
      sessions.push(
        bloqueADisplaySesionInstructor(b, ymd, dia, ahora, porHm.get(b.idHorarioMateria))
      );
    }
  }

  return sessions.sort((a, b) => {
    if (a.fechaStr !== b.fechaStr) return a.fechaStr.localeCompare(b.fechaStr);
    return a.horaInicial.localeCompare(b.horaInicial);
  });
}

export function filasCalendarioDesdeClasesAsignadas(
  clases: ClaseAsignadaInstructorBase[]
): FilaCalendarioClaseAsignada[] {
  return clases
    .filter((c) => c.idHorarioMateria > 0 && c.fechaInicial.trim() !== '')
    .map((c) => ({
      idHorarioMateria: c.idHorarioMateria,
      fechaInicial: c.fechaInicial,
      fechaFinal: c.fechaFinal,
      dia_semana: c.dia_semana,
      idDia: c.idDia,
      ficha_codigo: c.ficha_codigo,
      materia_nombre: c.materia_nombre,
      competencia_nombre: c.competencia_nombre,
      rap_nombre: c.rap_nombre,
      programa_nombre: c.programa_nombre,
      horaInicial: c.horaInicial,
      horaFinal: c.horaFinal,
      jornada_nombre: c.jornada_nombre,
      jornada_tipo: c.jornada_tipo
    }));
}

export function sesionesCompletadasPorHorarioDesdeClases(
  clases: ClaseAsignadaInstructorBase[]
): Record<string, SesionCalendarioClase[]> {
  const out: Record<string, SesionCalendarioClase[]> = {};
  for (const c of clases) {
    const id = c.idHorarioMateria;
    if (!id) continue;
    const ses = c.sesiones_completadas ?? [];
    if (ses.length > 0) {
      out[String(id)] = ses;
      out[id] = ses;
    }
  }
  return out;
}

// ─── Agrupación semanal (Mis formaciones ↔ Mi horario) ─────────────────────────

export const DIAS_SEMANA_LUN_DOM = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
] as const;

export function startOfWeekMondayLocal(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function tituloSemanaCalendarioOffset(weekOffset: number, ref: Date = new Date()): string {
  if (weekOffset === 0) return 'Esta semana';
  if (weekOffset === 1) return 'Próxima semana';
  const lunes = startOfWeekMondayLocal(ref);
  lunes.setDate(lunes.getDate() + weekOffset * 7);
  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);
  const fmt = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return `Semana del ${fmt.format(lunes)} al ${fmt.format(domingo)}`;
}

export type GrupoDiaCalendarioClase<T> = {
  rowKey: string;
  labelTitulo: string;
  fechaYmd: string;
  fecha: Date;
  clases: T[];
};

export type SeccionSemanaCalendarioClase<T> = {
  weekOffset: number;
  tituloSemana: string;
  gruposDia: GrupoDiaCalendarioClase<T>[];
};

type FilaOcurrenciaSemana = {
  fechaInicial: string;
  fechaFinal?: string | null;
  idDia?: unknown;
  dia_semana?: string | null;
  horaInicial?: string;
  horaFinal?: string;
};

type FilaOcurrenciaConSesiones = FilaOcurrenciaSemana &
  FilaConteoSesionesClase & {
    sesiones_completadas?: SesionCalendarioClase[];
  };

/** ¿Ya hay `sesionMateria` registrada para esa fecha YYYY-MM-DD? */
export function sesionCompletadaEnFecha(
  c: { sesiones_completadas?: SesionCalendarioClase[] },
  fechaYmd: string
): boolean {
  const ymd = fechaYmd.split('T')[0];
  return (c.sesiones_completadas ?? []).some((s) => ymdFromFechaSesion(s.fechaSesion) === ymd);
}

/** Ocurrencia en curso en ese día calendario (ventana horaria local). */
export function ocurrenciaEnCursoEnFecha(
  c: FilaOcurrenciaConSesiones,
  fecha: Date,
  ahora: Date = new Date()
): boolean {
  const col = columnaHorarioApiClase(c);
  const colFecha = columnaLunesPrimeroDesdeGetDay(fecha.getDay());
  if (col < 0 || col !== colFecha) return false;
  const ventana = obtenerVentanaHorariaEnFecha(c, fecha, ahora);
  if (!ventana) return false;
  return ahora.getTime() >= ventana.inicio.getTime() && ahora.getTime() <= ventana.fin.getTime();
}

/** La franja cae en la semana calendario (solapa con fechaInicial–fechaFinal). */
export function claseVigenteEnSemana(
  c: { fechaInicial?: string | null; fechaFinal?: string | null },
  weekOffset: number,
  ref: Date = new Date()
): boolean {
  if (!c.fechaInicial?.trim()) return true;
  const lunes = startOfWeekMondayLocal(ref);
  lunes.setDate(lunes.getDate() + weekOffset * 7);
  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  const ini = parseFechaYmdLocal(c.fechaInicial);
  ini.setHours(0, 0, 0, 0);
  const fin = c.fechaFinal ? parseFechaYmdLocal(c.fechaFinal) : null;
  if (fin) fin.setHours(23, 59, 59, 999);
  if (fin && fin.getTime() < lunes.getTime()) return false;
  if (ini.getTime() > domingo.getTime()) return false;
  return true;
}

/** Rango horario 24h como en Mi horario. */
export function textoRangoHorarioClase(c: FilaFranjaHoraria): string {
  const mins = minutosFranjaHorarioClase(c);
  if (!mins) {
    const hi = extraerHoraHHMM(String(c.horaInicial ?? '')) ?? String(c.horaInicial ?? '');
    const hf = extraerHoraHHMM(String(c.horaFinal ?? '')) ?? String(c.horaFinal ?? '');
    return `${hi} - ${hf}`.trim();
  }
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return `${fmt(mins.start)} - ${fmt(mins.end)}`;
}

/**
 * Pendiente en un día de la semana (tras filtrar por columna = Mi horario):
 * - Mañana y resto de la semana → sí.
 * - Hoy hasta fin de franja → sí (noche aunque sea tarde).
 * - Hoy tras la franja solo si no hay sesión ese día.
 */
export function ocurrenciaPendienteEnDiaCalendario(
  c: FilaOcurrenciaConSesiones,
  fecha: Date,
  ahora: Date = new Date()
): boolean {
  if (!claseTieneSesionesPorDictar(c)) return false;
  if (ocurrenciaEnCursoEnFecha(c, fecha, ahora)) return false;

  const fechaYmd = formatYmdLocal(fecha);
  const hoyYmd = formatYmdLocal(ahora);

  if (fechaYmd < hoyYmd) return false;
  if (fechaYmd > hoyYmd) return true;

  const ventana = obtenerVentanaHorariaEnFecha(c, fecha, ahora);
  if (!ventana) return true;

  if (ahora.getTime() <= ventana.fin.getTime()) return true;

  return !sesionCompletadaEnFecha(c, fechaYmd);
}

/**
 * Días a resaltar en el calendario del detalle (misma regla que Mi horario + Mis formaciones).
 * Incluye sesiones ya registradas aunque la franja ya no aparezca en la grilla (6/6).
 * Las próximas fechas azules respetan `sesiones_restantes`.
 */
export function fechasDestacadasCalendarioClase(
  c: FilaOcurrenciaConSesiones & FilaFranjaHoraria,
  ahora: Date = new Date()
): Date[] {
  if (!c.fechaInicial?.trim()) return [];

  const toDiaLocal = (ymd: string): Date | null => {
    const d = parseFechaYmdLocal(ymd.split('T')[0]);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  let min = toDiaLocal(c.fechaInicial);
  let max = c.fechaFinal?.trim() ? toDiaLocal(c.fechaFinal) : min ? new Date(min) : null;
  if (max) max.setHours(0, 0, 0, 0);

  for (const s of c.sesiones_completadas ?? []) {
    const raw = ymdFromFechaSesion(s.fechaSesion);
    if (!raw) continue;
    const d = parseFechaYmdLocal(raw);
    d.setHours(0, 0, 0, 0);
    if (!min || d.getTime() < min.getTime()) min = new Date(d);
    if (!max || d.getTime() > max.getTime()) max = new Date(d);
  }

  if (!min || !max) return [];

  const fechas: Date[] = [];
  const seen = new Set<number>();
  const agregar = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const t = x.getTime();
    if (seen.has(t)) return;
    seen.add(t);
    fechas.push(x);
  };

  const hoyYmd = formatYmdLocal(ahora);
  const restantes =
    typeof c.sesiones_restantes === 'number' && !Number.isNaN(c.sesiones_restantes)
      ? c.sesiones_restantes
      : null;
  let pendientesFuturas = 0;

  const cursor = new Date(min);
  cursor.setHours(0, 0, 0, 0);
  const fin = new Date(max);
  fin.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= fin.getTime()) {
    const ymd = formatYmdLocal(cursor);

    if (sesionCompletadaEnFecha(c, ymd)) {
      agregar(cursor);
    } else if (claseOcurreEnFecha(c, cursor) && franjaHorarioValidaClase(c)) {
      if (ocurrenciaEnCursoEnFecha(c, cursor, ahora)) {
        agregar(cursor);
      } else if (ocurrenciaPendienteEnDiaCalendario(c, cursor, ahora)) {
        const esFutura = ymd > hoyYmd;
        if (esFutura && restantes != null && restantes >= 0) {
          if (pendientesFuturas < restantes) {
            agregar(cursor);
            pendientesFuturas += 1;
          }
        } else {
          agregar(cursor);
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return fechas.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Días visibles en el calendario del detalle: ocurrencias (pendiente/en curso) + todas las fechas con sesión en BD.
 */
export function fechasVisiblesCalendarioClase(
  c: FilaOcurrenciaConSesiones & FilaFranjaHoraria,
  ahora: Date = new Date()
): Date[] {
  const base = fechasDestacadasCalendarioClase(c, ahora);
  const seen = new Set(base.map((d) => d.getTime()));
  const out = [...base];

  for (const s of c.sesiones_completadas ?? []) {
    const raw = ymdFromFechaSesion(s.fechaSesion);
    if (!raw) continue;
    const d = parseFechaYmdLocal(raw);
    if (Number.isNaN(d.getTime())) continue;
    d.setHours(0, 0, 0, 0);
    if (!seen.has(d.getTime())) {
      seen.add(d.getTime());
      out.push(d);
    }
  }

  return out.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Días pendientes (azul en calendario): ocurrencias programadas sin sesión en BD.
 * Soporta varias franjas (ej. miércoles y viernes misma ficha).
 */
export function ymdPendientesCalendarioFranjas(
  filas: Array<FilaOcurrenciaConSesiones & FilaFranjaHoraria>,
  sesionesCompletadas: SesionCalendarioClase[],
  ahora: Date = new Date()
): Set<string> {
  const pendientes = new Set<string>();
  const completadas = ymdSetSesionesCompletadas(sesionesCompletadas);

  for (const c of filas) {
    if (!c.fechaInicial?.trim()) continue;
    const payload: FilaOcurrenciaConSesiones & FilaFranjaHoraria = {
      ...c,
      sesiones_completadas: sesionesCompletadas
    };

    let min = parseFechaYmdLocal(payload.fechaInicial);
    min.setHours(0, 0, 0, 0);
    let max = payload.fechaFinal?.trim()
      ? parseFechaYmdLocal(payload.fechaFinal)
      : new Date(min);
    max.setHours(0, 0, 0, 0);

    const cursor = new Date(min);
    while (cursor.getTime() <= max.getTime()) {
      const ymd = formatYmdLocal(cursor);
      if (
        !completadas.has(ymd) &&
        claseOcurreEnFecha(payload, cursor) &&
        franjaHorarioValidaClase(payload) &&
        ocurrenciaPendienteEnDiaCalendario(payload, cursor, ahora)
      ) {
        pendientes.add(ymd);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return pendientes;
}

/** Une fechas visibles de todas las franjas (miércoles, viernes, etc.). */
export function fechasVisiblesCalendarioMultiplesFranjas(
  filas: Array<FilaOcurrenciaConSesiones & FilaFranjaHoraria>,
  sesionesCompletadas: SesionCalendarioClase[],
  ahora: Date = new Date()
): Date[] {
  const seen = new Set<number>();
  const out: Date[] = [];
  for (const c of filas) {
    if (!c.fechaInicial?.trim()) continue;
    const visibles = fechasVisiblesCalendarioClase(
      { ...c, sesiones_completadas: sesionesCompletadas },
      ahora
    );
    for (const d of visibles) {
      const t = d.getTime();
      if (!seen.has(t)) {
        seen.add(t);
        out.push(new Date(d));
      }
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

/** ¿Alguna franja del instructor tiene sesión completada ese día? (Mis formaciones → Completado). */
export function diaConSesionCompletadaInstructor(
  clases: Array<{ sesiones_completadas?: SesionCalendarioClase[] }>,
  fecha: Date,
  idHorarioMateria?: number | null
): boolean {
  const ymd = formatYmdLocal(fecha);
  for (const c of clases) {
    if (idHorarioMateria != null) {
      const id = Number((c as { idHorarioMateria?: number }).idHorarioMateria);
      if (!Number.isFinite(id) || id !== Number(idHorarioMateria)) continue;
    }
    if (sesionCompletadaEnFecha(c, ymd)) return true;
  }
  return false;
}

/** Mes visible al abrir el calendario del detalle: hoy si está en vigencia; si no, inicio o fin. */
export function mesCalendarioInicialClase(
  fechaInicial: string | null | undefined,
  fechaFinal: string | null | undefined,
  ahora: Date = new Date(),
  sesionesCompletadas?: SesionCalendarioClase[]
): Date {
  const mesDe = (ymd: string): Date | null => {
    if (!ymd?.trim()) return null;
    const d = parseFechaYmdLocal(ymd.split('T')[0]);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };

  const hoyMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const ini = fechaInicial ? mesDe(fechaInicial) : null;
  const finRaw = fechaFinal?.trim() ? fechaFinal : fechaInicial;
  const fin = finRaw ? mesDe(finRaw) : ini;

  if (ini && hoyMes.getTime() < ini.getTime()) return ini;
  if (fin && hoyMes.getTime() > fin.getTime()) return fin;
  return hoyMes;
}

/**
 * Todas las sesiones completadas visibles en el calendario del detalle:
 * misma ficha + todos los horarios de la franja + historial + API detalle.
 */
export function sesionesCompletadasCalendarioDetalleClase(opts: {
  idHorarioMateria: number;
  fichaCodigo?: string | null;
  historial: HistorialSesionInstructorItem[];
  clasesInstructor: Array<{
    idHorarioMateria?: number;
    ficha_codigo?: string;
    sesiones_completadas?: SesionCalendarioClase[];
  }>;
  sesionesPorHorario?: Record<string, SesionCalendarioClase[] | undefined>;
  idsHorariosRelacionados?: number[];
  sesionesClaseDetalle?: SesionCalendarioClase[];
}): SesionCalendarioClase[] {
  const idHm = Number(opts.idHorarioMateria);
  const fichaCodigo = String(opts.fichaCodigo ?? '').trim();
  const idsHm = new Set<number>();
  if (Number.isFinite(idHm) && idHm > 0) idsHm.add(idHm);
  for (const n of opts.idsHorariosRelacionados ?? []) {
    if (Number.isFinite(n) && n > 0) idsHm.add(n);
  }

  const listas: Array<Array<{ fechaSesion?: unknown; numeroSesion?: number }> | undefined> = [
    opts.sesionesClaseDetalle
  ];

  const porH = opts.sesionesPorHorario ?? {};
  for (const hmId of idsHm) {
    listas.push(porH[hmId] ?? porH[String(hmId)]);
  }

  for (const item of opts.historial) {
    const raw = item.clase as Record<string, unknown>;
    const hm = Number(raw.idHorarioMateria);
    const fic = String(raw.ficha_codigo ?? '').trim();
    if (idsHm.has(hm) || (fichaCodigo.length > 0 && fic === fichaCodigo)) {
      listas.push([
        {
          fechaSesion: item.sesion.fechaSesion,
          numeroSesion: item.sesion.numeroSesion
        }
      ]);
    }
  }

  for (const c of opts.clasesInstructor) {
    const hm = Number(c.idHorarioMateria);
    const fic = String(c.ficha_codigo ?? '').trim();
    if (idsHm.has(hm) || (fichaCodigo.length > 0 && fic === fichaCodigo)) {
      listas.push(c.sesiones_completadas);
    }
  }

  const fusionadas = Number.isFinite(idHm) && idHm > 0
    ? fusionarSesionesCompletadasHistorial(
        opts.historial.filter((item) => {
          const raw = item.clase as Record<string, unknown>;
          const hm = Number(raw.idHorarioMateria);
          const fic = String(raw.ficha_codigo ?? '').trim();
          return idsHm.has(hm) || (fichaCodigo.length > 0 && fic === fichaCodigo);
        }),
        opts.clasesInstructor.filter((c) => {
          const hm = Number(c.idHorarioMateria);
          const fic = String(c.ficha_codigo ?? '').trim();
          return idsHm.has(hm) || (fichaCodigo.length > 0 && fic === fichaCodigo);
        })
      ).map((x) => x.sesion)
    : [];

  listas.push(fusionadas);

  return unificarSesionesCompletadas(...listas);
}

/**
 * Agrupa clases por día calendario de una semana (lun–dom), misma lógica de columnas que Mi horario.
 * `weekOffset` 0 = esta semana, 1 = la siguiente.
 */
export function gruposClasesPorDiasCalendarioSemana<T extends FilaOcurrenciaSemana>(
  clases: T[],
  weekOffset: number,
  ref: Date = new Date(),
  filtroOcurrencia?: (clase: T, fecha: Date) => boolean
): GrupoDiaCalendarioClase<T>[] {
  const lunes = startOfWeekMondayLocal(ref);
  lunes.setDate(lunes.getDate() + weekOffset * 7);
  const hoyYmd = formatYmdLocal(ref);
  const grupos: GrupoDiaCalendarioClase<T>[] = [];

  for (let col = 0; col < 7; col++) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + col);
    // Misma regla que Mi horario: columna por día de semana (no solo fecha del contrato).
    const delDia = clases
      .filter((c) => columnaHorarioApiClase(c) === col)
      .filter((c) => claseVisibleEnGrillaHorario(c))
      .filter((c) => (filtroOcurrencia ? filtroOcurrencia(c, fecha) : true))
      .sort((a, b) => (a.horaInicial || '').localeCompare(b.horaInicial || ''));

    if (delDia.length === 0) continue;

    const fechaYmd = formatYmdLocal(fecha);
    const nombreDia = DIAS_SEMANA_LUN_DOM[col];
    const fmtFecha = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long'
    });
    const labelTitulo =
      fechaYmd === hoyYmd
        ? `${nombreDia} (hoy)`
        : `${nombreDia}, ${fmtFecha.format(fecha)}`;

    grupos.push({
      rowKey: `${fechaYmd}|w${weekOffset}`,
      labelTitulo,
      fechaYmd,
      fecha,
      clases: delDia
    });
  }

  return grupos;
}

/** Esta semana + próxima (vista Mis formaciones pendientes). */
export function seccionesSemanaCalendarioClase<T extends FilaOcurrenciaSemana>(
  clases: T[],
  ref: Date = new Date(),
  semanas: number[] = [0, 1],
  filtroOcurrencia?: (clase: T, fecha: Date) => boolean
): SeccionSemanaCalendarioClase<T>[] {
  return semanas
    .map((weekOffset) => ({
      weekOffset,
      tituloSemana: tituloSemanaCalendarioOffset(weekOffset, ref),
      gruposDia: gruposClasesPorDiasCalendarioSemana(clases, weekOffset, ref, filtroOcurrencia)
    }))
    .filter((s) => s.gruposDia.length > 0);
}

export type HistorialSesionInstructorItem = {
  sesion: {
    id: number;
    numeroSesion: number;
    fechaSesion: string;
    fechaFormateada?: string;
    fechaCorta?: string;
    estado?: string;
    observacion?: string | null;
    evaluador_nombre?: string | null;
  };
  clase: Record<string, unknown>;
};

function claveOcurrenciaSesionHistorial(
  idHorarioMateria: number,
  sesion: { fechaSesion?: unknown; numeroSesion?: number }
): string {
  const ymd = ymdFromFechaSesion(sesion.fechaSesion);
  const n = sesion.numeroSesion ?? '';
  return `${idHorarioMateria}|${ymd ?? ''}|${n}`;
}

/**
 * Misma unión que Mis formaciones → Completado: historial API + `sesiones_completadas` de clases-asignadas.
 */
export function fusionarSesionesCompletadasHistorial<
  TClase extends { idHorarioMateria?: number; sesiones_completadas?: SesionCalendarioClase[] }
>(
  historial: Array<{
    sesion: { fechaSesion?: unknown; numeroSesion?: number };
    clase: { idHorarioMateria?: number; [key: string]: unknown };
  }>,
  clases: TClase[]
): Array<{ clase: TClase; sesion: SesionCalendarioClase }> {
  const porClave = new Map<string, { clase: TClase; sesion: SesionCalendarioClase }>();

  const insertar = (
    clase: TClase | { idHorarioMateria?: number; [key: string]: unknown },
    sesion: { fechaSesion?: unknown; numeroSesion?: number; [key: string]: unknown }
  ) => {
    const idHm = Number(clase.idHorarioMateria);
    if (!Number.isFinite(idHm) || idHm <= 0) return;
    const ymd = ymdFromFechaSesion(sesion.fechaSesion);
    if (!ymd) return;
    const norm: SesionCalendarioClase = {
      ...sesion,
      fechaSesion: ymd,
      numeroSesion: sesion.numeroSesion
    };
    const key = claveOcurrenciaSesionHistorial(idHm, norm);
    if (!porClave.has(key)) {
      porClave.set(key, { clase: clase as TClase, sesion: norm });
    }
  };

  for (const item of historial) {
    insertar(item.clase as TClase, item.sesion);
  }
  for (const clase of clases) {
    for (const sesion of clase.sesiones_completadas ?? []) {
      insertar(clase, sesion);
    }
  }

  return Array.from(porClave.values());
}

/** Sesiones completadas de una franja para el calendario del detalle (misma fuente que Completado). */
export function sesionesCompletadasFranjaCalendario(
  idHorarioMateria: number,
  historial: HistorialSesionInstructorItem[],
  clases: Array<{ idHorarioMateria?: number; sesiones_completadas?: SesionCalendarioClase[] }>,
  ...extras: Array<Array<{ fechaSesion?: unknown; numeroSesion?: number }> | undefined>
): SesionCalendarioClase[] {
  const idHm = Number(idHorarioMateria);
  const deFranja = Number.isFinite(idHm) && idHm > 0
    ? fusionarSesionesCompletadasHistorial(historial, clases)
        .filter((x) => Number(x.clase.idHorarioMateria) === idHm)
        .map((x) => x.sesion)
    : [];
  return unificarSesionesCompletadas(deFranja, ...extras);
}

/** Todas las sesiones registradas en `sesionMateria` (Mis formaciones → Completado). */
export async function fetchHistorialSesionesInstructor(
  idInstructor?: number | string | null
): Promise<HistorialSesionInstructorItem[]> {
  const url =
    idInstructor != null && String(idInstructor).trim() !== ''
      ? `fichas/instructor/${idInstructor}/historial-sesiones`
      : 'fichas/instructor/historial-sesiones';
  const { data } = await axios.get<{ data?: HistorialSesionInstructorItem[] }>(url);
  return Array.isArray(data?.data) ? data.data : [];
}

/** Carga unificada: `fichas/instructor/clases-asignadas`. */
export async function fetchClasesAsignadasInstructor(
  idInstructor?: number | string | null
): Promise<(ClaseAsignadaInstructorBase & Record<string, unknown>)[]> {
  const url =
    idInstructor != null && String(idInstructor).trim() !== ''
      ? `fichas/instructor/${idInstructor}/clases-asignadas`
      : 'fichas/instructor/clases-asignadas';
  const { data } = await axios.get<{ data?: unknown[] }>(url);
  const list = Array.isArray(data?.data) ? data.data : [];
  return dedupeClasesAsignadasInstructorPorClaveLogica(
    list.map((row) => normalizarClaseAsignadaInstructorDesdeApi(row as Record<string, unknown>))
  );
}

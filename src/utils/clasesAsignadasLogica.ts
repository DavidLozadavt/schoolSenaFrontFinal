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

import React, { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@/components/modal';
import {
  extraerHoraHHMM,
  titulosCompetenciaYRapUi,
  columnaHorarioApiClase,
  claseVisibleEnGrillaHorario,
  minutosFranjaHorarioClase,
  tipoJornadaClaseAsignada
} from '@/utils/clasesAsignadasLogica';
import { useClasesInstructorAsignadas } from '@/hooks/useClasesInstructorAsignadas';

/** Columnas Lun–Dom; BD `idDia` 1=Lun … 7=Dom. */
const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
const DIAS_LARGO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

const HORA_INICIO_DIA_MIN = 6 * 60;
const HORA_FIN_DIA_MIN = 22 * 60;
const RANGO_MINUTOS = HORA_FIN_DIA_MIN - HORA_INICIO_DIA_MIN;
/** Altura mínima en % del día para franjas muy cortas (clicable; pie de ficha siempre visible). */
const ALTURA_MIN_BLOQUE_PCT = 9;
/** Separación vertical entre tarjetas al apilar (evita solapes al crecer el contenido). */
const GAP_STACK_TARJETAS_PX = 12;

interface SesionCompletada {
  id: number;
  numeroSesion: number;
  fechaSesion: string;
  fechaFormateada: string;
  fechaCorta: string;
  estado: string;
  observacion?: string | null;
  evaluador_nombre?: string | null;
}

interface ClaseHorario {
  ficha_id: number;
  ficha_codigo: string;
  programa_nombre: string;
  materia_nombre: string;
  competencia_nombre: string;
  rap_nombre: string | null;
  idMateriaPadre: number | null;
  jornada_nombre: string;
  jornada_tipo: string;
  dia_semana: string;
  idDia: number;
  horaInicial: string;
  horaFinal: string;
  fechaInicial: string;
  fechaFinal: string | null;
  /** Vigencia del programa / ficha (aperturarprograma); para el título del periodo real feb–jul, etc. */
  periodo_fecha_inicial_clases: string | null;
  periodo_fecha_final_clases: string | null;
  estado: string;
  total_sesiones: number;
  sesiones_dadas?: number;
  sesiones_restantes?: number;
  sesiones_completadas?: SesionCompletada[];
  contrato_id: number;
  instructor_nombre: string;
  idGradoPrograma: number | null;
  grado_nombre: string | null;
  idHorarioMateria: number;
  idGradoMateria: number;
  idMateria: number;
  aula_nombre?: string | null;
}

type FiltroJornada = 'todos' | 'manana' | 'tarde' | 'noche';
type TipoJornadaVisual = 'manana' | 'tarde' | 'noche' | 'otro';

const MESES_ES = [
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
] as const;

function tipoJornadaVisual(clase: ClaseHorario): TipoJornadaVisual {
  return tipoJornadaClaseAsignada(clase);
}

function clasesTarjetaPorJornada(t: TipoJornadaVisual): string {
  switch (t) {
    case 'manana':
      return 'rounded-lg border border-sky-100 bg-sky-50/95 border-t-[3px] border-t-sky-500 shadow-sm dark:border-sky-900/40 dark:bg-sky-950/35 dark:border-t-sky-400';
    case 'tarde':
      return 'rounded-lg border border-amber-100 bg-amber-50/95 border-t-[3px] border-t-amber-500 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30 dark:border-t-amber-400';
    case 'noche':
      return 'rounded-lg border border-violet-100 bg-violet-50/95 border-t-[3px] border-t-violet-500 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/35 dark:border-t-violet-400';
    default:
      return 'rounded-lg border border-slate-200 bg-slate-50/95 border-t-[3px] border-t-slate-500 shadow-sm dark:border-gray-600 dark:bg-coal-300/40 dark:border-t-slate-400';
  }
}

/** Texto corto de jornada para la primera línea (como en la referencia: “Mañana”, “Tarde”, “Noche”). */
function etiquetaJornadaLinea(clase: ClaseHorario): string {
  const tv = tipoJornadaVisual(clase);
  if (tv === 'manana') return 'Mañana';
  if (tv === 'tarde') return 'Tarde';
  if (tv === 'noche') return 'Noche';
  const n = (clase.jornada_nombre || clase.jornada_tipo || '').trim();
  return n.length > 0 ? n : 'Jornada';
}

function claseTextoHoraJornada(jv: TipoJornadaVisual): string {
  switch (jv) {
    case 'manana':
      return 'text-sky-700 dark:text-sky-300';
    case 'tarde':
      return 'text-amber-800 dark:text-amber-300';
    case 'noche':
      return 'text-violet-800 dark:text-violet-300';
    default:
      return 'text-slate-600 dark:text-slate-300';
  }
}

/** Del 1 del mes en curso al 1 del mes siguiente (meses en minúscula, forma estándar en español). */
function textoRangoDel1Al1MesSiguiente(ref: Date = new Date()): string {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const mesActual = MESES_ES[m];
  const siguiente = new Date(y, m + 1, 1);
  const yN = siguiente.getFullYear();
  const mN = siguiente.getMonth();
  const mesSiguiente = MESES_ES[mN];
  if (y === yN) {
    return `del 1 de ${mesActual} al 1 de ${mesSiguiente} de ${y}`;
  }
  return `del 1 de ${mesActual} de ${y} al 1 de ${mesSiguiente} de ${yN}`;
}

function horaAMinutos(hora: string, jornadaTipo: string): number | null {
  const t = extraerHoraHHMM(hora);
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length < 2) return null;
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  if (Number.isNaN(h)) return null;
  const lowerJ = (jornadaTipo || '').toLowerCase();
  const esTardeONoche =
    lowerJ.includes('tarde') || lowerJ.includes('noche') || lowerJ.includes('nocturna');
  if (esTardeONoche && h < 12) h += 12;
  return h * 60 + m;
}

function formatoHoraCorta(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function normalizarClase(raw: Record<string, unknown>): ClaseHorario {
  const toNum = (val: unknown): number => {
    const n = Number(val);
    return Number.isNaN(n) ? 0 : n;
  };
  const toNumOrNull = (val: unknown): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  };

  const normalizarSesion = (s: Record<string, unknown>): SesionCompletada => ({
    id: toNum(s.id),
    numeroSesion: toNum(s.numeroSesion),
    fechaSesion: String(s.fechaSesion ?? ''),
    fechaFormateada: String(s.fechaFormateada ?? ''),
    fechaCorta: String(s.fechaCorta ?? ''),
    estado: String(s.estado ?? ''),
    observacion: s.observacion != null ? String(s.observacion) : null
  });

  const idHorarioMateria = toNum(raw.idHorarioMateria);
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
  const aula_nombre = aulaRaw.length > 0 ? aulaRaw : null;

  return {
    ficha_id: toNum(raw.ficha_id),
    ficha_codigo: String(raw.ficha_codigo ?? ''),
    programa_nombre: String(raw.programa_nombre ?? ''),
    materia_nombre: materiaNombre,
    competencia_nombre,
    rap_nombre,
    idMateriaPadre: toNumOrNull(raw.idMateriaPadre),
    jornada_nombre: String(raw.jornada_nombre ?? ''),
    jornada_tipo: String(raw.jornada_tipo ?? ''),
    dia_semana: String(raw.dia_semana ?? ''),
    idDia: toNum(raw.idDia),
    horaInicial: extraerHoraHHMM(String(raw.horaInicial ?? '')) ?? String(raw.horaInicial ?? '').trim(),
    horaFinal: extraerHoraHHMM(String(raw.horaFinal ?? '')) ?? String(raw.horaFinal ?? '').trim(),
    fechaInicial: String(raw.fechaInicial ?? ''),
    fechaFinal: raw.fechaFinal != null ? String(raw.fechaFinal) : null,
    periodo_fecha_inicial_clases: (() => {
      const v = raw.periodo_fecha_inicial_clases ?? raw.periodoFechaInicialClases;
      if (v == null || String(v).trim() === '' || String(v).toLowerCase() === 'null') return null;
      return String(v).trim();
    })(),
    periodo_fecha_final_clases: (() => {
      const v = raw.periodo_fecha_final_clases ?? raw.periodoFechaFinalClases;
      if (v == null || String(v).trim() === '' || String(v).toLowerCase() === 'null') return null;
      return String(v).trim();
    })(),
    estado: String(raw.estado ?? ''),
    total_sesiones: toNum(raw.total_sesiones),
    sesiones_dadas: toNum(raw.sesiones_dadas),
    sesiones_restantes: toNum(raw.sesiones_restantes),
    sesiones_completadas: Array.isArray(raw.sesiones_completadas)
      ? (raw.sesiones_completadas as Record<string, unknown>[]).map(normalizarSesion)
      : [],
    contrato_id: toNum(raw.contrato_id),
    instructor_nombre: String(raw.instructor_nombre ?? ''),
    idGradoPrograma: toNumOrNull(raw.idGradoPrograma),
    grado_nombre: raw.grado_nombre != null ? String(raw.grado_nombre) : null,
    idHorarioMateria,
    idGradoMateria: toNum(raw.idGradoMateria),
    idMateria: toNum(raw.idMateria),
    aula_nombre
  };
}

type BloqueConGeometria = ClaseHorario & {
  start: number;
  end: number;
  lane: number;
  laneCount: number;
};

type IntervaloClase = { c: ClaseHorario; start: number; end: number };

/** Máximo de clases solapadas en algún instante dentro de [start, end). */
function maxConcurrenciaEnVentana(
  start: number,
  end: number,
  intervalos: { start: number; end: number }[]
): number {
  const ts = new Set<number>([start]);
  for (const iv of intervalos) {
    if (iv.end <= start || iv.start >= end) continue;
    if (iv.start >= start && iv.start < end) ts.add(iv.start);
    if (iv.end > start && iv.end <= end) ts.add(iv.end);
  }
  let max = 0;
  for (const t of [...ts].sort((a, b) => a - b)) {
    const n = intervalos.filter((e) => e.start <= t && e.end > t).length;
    max = Math.max(max, n);
  }
  return Math.max(max, 1);
}

function intervalosSeSolapan(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Componentes conexos por solape de intervalos. */
function componentesSolape(items: IntervaloClase[]): IntervaloClase[][] {
  const n = items.length;
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (intervalosSeSolapan(items[i]!, items[j]!)) {
        adj[i]!.push(j);
        adj[j]!.push(i);
      }
    }
  }
  const seen = new Array(n).fill(false);
  const out: IntervaloClase[][] = [];
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    const stack = [i];
    seen[i] = true;
    const cur: IntervaloClase[] = [];
    while (stack.length) {
      const u = stack.pop()!;
      cur.push(items[u]!);
      for (const v of adj[u]!) {
        if (!seen[v]) {
          seen[v] = true;
          stack.push(v);
        }
      }
    }
    out.push(cur);
  }
  return out;
}

function picoConcurrenciaComponente(comp: IntervaloClase[]): number {
  const pts = new Set<number>();
  for (const e of comp) {
    pts.add(e.start);
    pts.add(e.end);
  }
  let max = 0;
  for (const t of [...pts].sort((a, b) => a - b)) {
    const k = comp.filter((e) => e.start <= t && e.end > t).length;
    max = Math.max(max, k);
  }
  return Math.max(max, 1);
}

/** Umbral: a partir de este número de clases a la vez, una columna muestra resumen en lugar de tiras finas. */
const UMBRAL_RESUMEN_SOLAPES = 4;

function asignarCarrilSolapes(intervalos: IntervaloClase[]): BloqueConGeometria[] {
  const conTiempos = [...intervalos].sort((a, b) => a.start - b.start || a.end - b.end);
  const finPorCarril: number[] = [];
  const salida: BloqueConGeometria[] = [];

  for (const { c, start, end } of conTiempos) {
    let carril = 0;
    while (carril < finPorCarril.length && finPorCarril[carril]! > start) {
      carril++;
    }
    if (carril === finPorCarril.length) finPorCarril.push(end);
    else finPorCarril[carril] = Math.max(finPorCarril[carril]!, end);

    salida.push({
      ...c,
      start,
      end,
      lane: carril,
      laneCount: 0
    });
  }

  const ivs = salida.map((b) => ({ start: b.start, end: b.end }));
  return salida.map((b) => ({
    ...b,
    laneCount: maxConcurrenciaEnVentana(b.start, b.end, ivs)
  }));
}

type ItemRenderDia =
  | { kind: 'single'; bloque: BloqueConGeometria }
  | { kind: 'resumen'; start: number; end: number; clases: ClaseHorario[] };

function planificarColumnaDia(diaClases: ClaseHorario[]): ItemRenderDia[] {
  const intervalos: IntervaloClase[] = diaClases
    .map((c) => {
      const mins = minutosFranjaHorarioClase(c);
      if (!mins) return null;
      return { c, start: mins.start, end: mins.end };
    })
    .filter(Boolean) as IntervaloClase[];

  if (intervalos.length === 0) return [];

  const comps = componentesSolape(intervalos);
  const resumen: ItemRenderDia[] = [];
  const sueltos: IntervaloClase[] = [];

  for (const comp of comps) {
    const pico = picoConcurrenciaComponente(comp);
    if (pico >= UMBRAL_RESUMEN_SOLAPES) {
      const start = Math.min(...comp.map((x) => x.start));
      const end = Math.max(...comp.map((x) => x.end));
      resumen.push({ kind: 'resumen', start, end, clases: comp.map((x) => x.c) });
    } else {
      sueltos.push(...comp);
    }
  }

  const bloques = asignarCarrilSolapes(sueltos);
  const singles: ItemRenderDia[] = bloques.map((bloque) => ({ kind: 'single', bloque }));
  const merged = [...singles, ...resumen].sort((a, b) => {
    const sa = a.kind === 'single' ? a.bloque.start : a.start;
    const sb = b.kind === 'single' ? b.bloque.start : b.start;
    return sa - sb;
  });
  return merged;
}

function scheduleCardKey(colIdx: number, kind: 'hm' | 'rs', id: string | number): string {
  return `c${colIdx}-${kind}-${id}`;
}

/** Por encima de esto se muestra acordeón (flecha + texto colapsado con …). Igual que estudiante. */
const UMBRAL_TEXTO_COMPETENCIA_ACORDEON = 52;

/** Altura fija colapsada: 2 líneas de competencia + pie ficha/aula (no depende de duración del bloque). */
const ALTURA_TARJETA_HORARIO_PX = 118;

type TarjetaClaseInstructorHorarioProps = {
  bloque: BloqueConGeometria;
  competencia: string;
  salon: string | undefined;
  jv: TipoJornadaVisual;
  lineaHoraJornada: string;
  cardKey: string;
  topPct: number;
  topPx: number | undefined;
  izqPct: number;
  anchoPct: number;
  expandido: boolean;
  onToggleExpandido: () => void;
  onAbrirDetalle: () => void;
};

const TarjetaClaseInstructorHorario: React.FC<TarjetaClaseInstructorHorarioProps> = ({
  bloque,
  competencia,
  salon,
  jv,
  lineaHoraJornada,
  cardKey,
  topPct,
  topPx,
  izqPct,
  anchoPct,
  expandido,
  onToggleExpandido,
  onAbrirDetalle
}) => {
  const textoCompetencia = competencia.trim();
  const conAcordeon = textoCompetencia.length > UMBRAL_TEXTO_COMPETENCIA_ACORDEON;
  const competenciaId = `competencia-horario-instructor-${bloque.idHorarioMateria}`;

  return (
    <button
      type="button"
      data-card-key={cardKey}
      data-card-start={String(bloque.start)}
      onClick={onAbrirDetalle}
      className={clsx(
        'absolute z-[1] flex flex-col items-stretch overflow-hidden px-2.5 pb-2.5 pt-1 text-left transition hover:brightness-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400/80',
        clasesTarjetaPorJornada(jv),
        expandido && 'z-[2]'
      )}
      style={{
        top: topPx != null ? `${topPx}px` : `${topPct}%`,
        left: `${izqPct + 0.5}%`,
        width: `${anchoPct - 1}%`,
        ...(expandido
          ? { height: 'auto', minHeight: ALTURA_TARJETA_HORARIO_PX }
          : {
              height: ALTURA_TARJETA_HORARIO_PX,
              minHeight: ALTURA_TARJETA_HORARIO_PX,
              maxHeight: ALTURA_TARJETA_HORARIO_PX
            })
      }}
    >
      {conAcordeon ? (
        <div
          role="button"
          tabIndex={0}
          className="absolute right-0.5 top-0.5 z-[2] flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-700 transition hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpandido();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onToggleExpandido();
            }
          }}
          aria-expanded={expandido}
          aria-controls={competenciaId}
          title={expandido ? 'Contraer competencia' : 'Ver competencia completa'}
        >
          <KeenIcon
            icon="down"
            className={clsx('text-sm transition-transform duration-200', expandido && 'rotate-180')}
          />
        </div>
      ) : null}

      <div className={clsx('min-w-0', conAcordeon && 'pr-7')}>
        <div
          className={`shrink-0 truncate text-[11px] font-semibold leading-tight ${claseTextoHoraJornada(jv)}`}
        >
          {lineaHoraJornada}
        </div>
        <p
          id={competenciaId}
          className={clsx(
            'mt-1.5 text-xs font-bold uppercase leading-snug text-gray-900 dark:text-gray-50 break-words',
            conAcordeon && !expandido && 'line-clamp-2'
          )}
        >
          {textoCompetencia}
        </p>
      </div>

      <div className="mt-2.5 shrink-0 border-t border-gray-900/10 pt-2 dark:border-white/10">
        <div className="truncate text-[10px] font-semibold text-gray-700 dark:text-gray-200">
          Ficha {bloque.ficha_codigo}
        </div>
        {salon ? (
          <div className="mt-0.5 truncate text-[10px] leading-snug text-gray-500 dark:text-gray-400">
            {salon}
          </div>
        ) : null}
      </div>
    </button>
  );
};

const HorarioInstructorPage: React.FC = () => {
  const navigate = useNavigate();
  const [filtroJornada, setFiltroJornada] = useState<FiltroJornada>('todos');
  const { clases: clasesApi, loading } = useClasesInstructorAsignadas();
  const [clases, setClases] = useState<ClaseHorario[]>([]);
  const [modalClase, setModalClase] = useState<ClaseHorario | null>(null);
  const [modalResumen, setModalResumen] = useState<ClaseHorario[] | null>(null);
  /** `top` en px tras apilar por altura real; si falta clave, se usa % por horario. */
  const [cardTopPx, setCardTopPx] = useState<Record<string, number>>({});
  /** Tarjetas con acordeón abierto (recalcula apilado para empujar las de abajo). */
  const [tarjetasExpandidas, setTarjetasExpandidas] = useState<Record<string, boolean>>({});
  const columnInnerRefs = useRef<(HTMLDivElement | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ]);

  useEffect(() => {
    setClases(clasesApi.map((r) => normalizarClase(r as Record<string, unknown>)) as ClaseHorario[]);
  }, [clasesApi]);

  const clasesFiltradas = useMemo(() => {
    let list = clases.filter((c) => claseVisibleEnGrillaHorario(c));
    if (filtroJornada === 'todos') return list;
    return list.filter((c) => tipoJornadaVisual(c) === filtroJornada);
  }, [clases, filtroJornada]);

  const nombreCabecera = useMemo(
    () => clases.find((c) => c.instructor_nombre?.trim())?.instructor_nombre?.trim() ?? '',
    [clases]
  );

  const itemsPorColumna = useMemo(() => {
    const cols: ClaseHorario[][] = Array.from({ length: 7 }, () => []);
    for (const c of clasesFiltradas) {
      const col = columnaHorarioApiClase(c);
      if (col < 0) continue;
      cols[col]!.push(c);
    }
    return cols.map((lista) => planificarColumnaDia(lista));
  }, [clasesFiltradas]);

  const recomputarApiladoTarjetasRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const recompute = () => {
      if (loading || clasesFiltradas.length === 0) {
        setCardTopPx({});
        return;
      }
      const next: Record<string, number> = {};
      for (let colIdx = 0; colIdx < 7; colIdx++) {
        const col = columnInnerRefs.current[colIdx];
        if (!col) continue;
        const h = col.clientHeight;
        if (h < 16) continue;
        const buttons = Array.from(col.querySelectorAll<HTMLButtonElement>('button[data-card-key]'));
        if (buttons.length === 0) continue;
        const parsed = buttons.map((el) => ({
          el,
          key: el.dataset.cardKey ?? '',
          start: Number(el.dataset.cardStart)
        }));
        parsed.sort((a, b) =>
          a.start !== b.start ? a.start - b.start : a.key.localeCompare(b.key)
        );
        let cursor = 0;
        let i = 0;
        while (i < parsed.length) {
          const st = parsed[i]!.start;
          if (Number.isNaN(st)) {
            i += 1;
            continue;
          }
          let j = i;
          while (j < parsed.length && parsed[j]!.start === st) j += 1;
          const batch = parsed.slice(i, j);
          const schedTop = ((st - HORA_INICIO_DIA_MIN) / RANGO_MINUTOS) * h;
          const top = Math.max(schedTop, cursor);
          for (const p of batch) {
            next[p.key] = top;
          }
          let maxBottom = top;
          for (const p of batch) {
            maxBottom = Math.max(maxBottom, top + p.el.offsetHeight);
          }
          cursor = maxBottom + GAP_STACK_TARJETAS_PX;
          i = j;
        }
      }
      setCardTopPx((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        if (
          prevKeys.length === nextKeys.length &&
          nextKeys.every((k) => prev[k] === next[k])
        ) {
          return prev;
        }
        return next;
      });
    };

    recomputarApiladoTarjetasRef.current = recompute;

    recompute();
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      recompute();
      raf2 = window.requestAnimationFrame(() => {
        recompute();
      });
    });

    const observers: ResizeObserver[] = [];
    if (typeof ResizeObserver !== 'undefined') {
      for (let colIdx = 0; colIdx < 7; colIdx++) {
        const col = columnInnerRefs.current[colIdx];
        if (!col) continue;
        const roCol = new ResizeObserver(() => {
          window.requestAnimationFrame(recompute);
        });
        roCol.observe(col);
        observers.push(roCol);

        const buttons = col.querySelectorAll<HTMLButtonElement>('button[data-card-key]');
        for (const btn of buttons) {
          const roBtn = new ResizeObserver(() => {
            window.requestAnimationFrame(recompute);
          });
          roBtn.observe(btn);
          observers.push(roBtn);
        }
      }
    }

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      observers.forEach((o) => o.disconnect());
    };
  }, [loading, clasesFiltradas, itemsPorColumna, tarjetasExpandidas]);

  const toggleTarjetaExpandida = useCallback((cardKey: string) => {
    setTarjetasExpandidas((prev) => {
      const next = { ...prev, [cardKey]: !prev[cardKey] };
      return next;
    });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        recomputarApiladoTarjetasRef.current();
      });
    });
  }, []);

  const irAClase = useCallback(
    (clase: ClaseHorario) => {
      const id = Number(clase.idHorarioMateria);
      if (!Number.isFinite(id) || id <= 0) return;
      navigate(`/ambiente-virtual/clase/${id}`, {
        state: {
          returnTo: '/ambiente-virtual/horario',
          vistaCalendario: 'instructor' as const,
          idMateria: clase.idMateria,
          idGradoMateria: clase.idGradoMateria,
          ficha_id: clase.ficha_id,
          materia_nombre: clase.materia_nombre,
          programa_nombre: clase.programa_nombre
        }
      });
    },
    [navigate]
  );

  const pillsFiltro: { id: FiltroJornada; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'manana', label: 'Mañana' },
    { id: 'tarde', label: 'Tarde' },
    { id: 'noche', label: 'Noche' }
  ];

  return (
    <Fragment>
      <Container>
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando horario…</p>
          </div>
        ) : clases.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">No hay clases asignadas para mostrar en el horario.</p>
          </div>
        ) : (
          <div className="w-full min-w-0">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 pt-1 sm:flex-row sm:items-center sm:justify-between dark:border-gray-600">
              <h1 className="min-w-0 flex-1 text-sm font-normal leading-snug break-words sm:text-base dark:text-gray-100">
                <span className="font-bold text-gray-900 dark:text-white">Mi horario</span>
                {nombreCabecera ? (
                  <>
                    <span className="select-none text-gray-400 dark:text-gray-500" aria-hidden>
                      {' '}
                      ·{' '}
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{nombreCabecera}</span>
                  </>
                ) : null}
                <span className="select-none text-gray-400 dark:text-gray-500" aria-hidden>
                  {' '}
                  ·{' '}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {textoRangoDel1Al1MesSiguiente(new Date())}
                </span>
              </h1>
              <div className="flex shrink-0 items-center gap-2">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100/90 p-1 dark:border-gray-600 dark:bg-coal-300/50">
                  {pillsFiltro.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFiltroJornada(p.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        filtroJornada === p.id
                          ? 'bg-white text-gray-900 shadow-sm dark:bg-coal-400 dark:text-white'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            {clasesFiltradas.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No hay clases para la jornada seleccionada.
              </div>
            ) : (
              <div className="overflow-x-auto pb-2 pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="grid min-h-[640px] min-w-[880px] grid-cols-7 gap-2">
                  {DIAS_CORTO.map((dia, colIdx) => (
                    <div
                      key={dia}
                      className="flex min-h-[640px] min-w-0 flex-col rounded-xl border border-slate-100 bg-slate-50/50 dark:border-gray-600/80 dark:bg-coal-500/30"
                    >
                      <div className="border-b border-slate-200 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-slate-700 dark:border-gray-600 dark:text-slate-200">
                        {dia}
                      </div>
                      <div
                        ref={(el) => {
                          columnInnerRefs.current[colIdx] = el;
                        }}
                        className="relative flex-1 overflow-visible bg-white/60 pb-6 dark:bg-coal-400/40"
                      >
                        {itemsPorColumna[colIdx]?.map((item) => {
                          if (item.kind === 'resumen') {
                            const { start, end, clases: lista } = item;
                            const listaVista = lista;
                            const topPct = Math.max(0, ((start - HORA_INICIO_DIA_MIN) / RANGO_MINUTOS) * 100);
                            const hPct = Math.max(
                              ALTURA_MIN_BLOQUE_PCT,
                              ((end - start) / RANGO_MINUTOS) * 100
                            );
                            const n = listaVista.length;
                            const cardKey = scheduleCardKey(colIdx, 'rs', `${start}-${end}`);
                            return (
                              <button
                                key={`resumen-${colIdx}-${start}-${end}`}
                                type="button"
                                data-card-key={cardKey}
                                data-card-start={String(start)}
                                onClick={() => {
                                  const ordenadas = [...listaVista].sort((a, b) => {
                                    const sa =
                                      horaAMinutos(a.horaInicial, a.jornada_tipo || a.jornada_nombre) ?? 0;
                                    const sb =
                                      horaAMinutos(b.horaInicial, b.jornada_tipo || b.jornada_nombre) ?? 0;
                                    return sa - sb || a.ficha_codigo.localeCompare(b.ficha_codigo);
                                  });
                                  setModalResumen(ordenadas);
                                }}
                                className="absolute left-1.5 right-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2 py-2 text-left text-xs shadow-sm transition hover:bg-slate-200/90 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700"
                                style={{
                                  top:
                                    cardTopPx[cardKey] != null
                                      ? `${cardTopPx[cardKey]}px`
                                      : `${topPct}%`,
                                  minHeight: `${hPct}%`,
                                  height: 'auto'
                                }}
                              >
                                <div className="font-bold text-slate-800 dark:text-slate-100">{n} clases en este horario</div>
                                <div className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">Toca para ver la lista</div>
                              </button>
                            );
                          }

                          const b = item.bloque;
                          const topPct = Math.max(0, ((b.start - HORA_INICIO_DIA_MIN) / RANGO_MINUTOS) * 100);
                          const carriles = Math.max(1, b.laneCount);
                          const anchoPct = 100 / carriles;
                          const izqPct = b.lane * anchoPct;
                          const { competencia } = titulosCompetenciaYRapUi(b);
                          const salon = b.aula_nombre?.trim();
                          const jv = tipoJornadaVisual(b);
                          const horaIni = formatoHoraCorta(b.start);
                          const horaFin = formatoHoraCorta(b.end);
                          const lineaHoraJornada = `${horaIni}-${horaFin} - ${etiquetaJornadaLinea(b)}`;
                          const cardKey = scheduleCardKey(colIdx, 'hm', b.idHorarioMateria);

                          return (
                            <TarjetaClaseInstructorHorario
                              key={b.idHorarioMateria}
                              bloque={b}
                              competencia={competencia}
                              salon={salon}
                              jv={jv}
                              lineaHoraJornada={lineaHoraJornada}
                              cardKey={cardKey}
                              topPct={topPct}
                              topPx={cardTopPx[cardKey]}
                              izqPct={izqPct}
                              anchoPct={anchoPct}
                              expandido={Boolean(tarjetasExpandidas[cardKey])}
                              onToggleExpandido={() => toggleTarjetaExpandida(cardKey)}
                              onAbrirDetalle={() => setModalClase(b)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-600 dark:bg-coal-500/40">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm border border-sky-500 bg-sky-200 dark:bg-sky-500/60" />
                  Mañana
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm border border-amber-500 bg-amber-200 dark:bg-amber-500/60" />
                  Tarde
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm border border-violet-600 bg-violet-200 dark:bg-violet-500/60" />
                  Noche
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total:{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">{clasesFiltradas.length}</span>{' '}
                {clasesFiltradas.length === 1 ? 'clase' : 'clases'} esta semana
              </p>
            </footer>
          </div>
        )}
      </Container>

      <Modal open={modalClase != null} onClose={() => setModalClase(null)} zIndex={120}>
        {modalClase ? (
          <ModalContent className="mx-4 max-w-md">
            <ModalHeader className="border-b border-gray-100 dark:border-gray-700">
              <div className="flex w-full items-start justify-between gap-3">
                <ModalTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  {DIAS_LARGO[
                    Math.max(
                      0,
                      Math.min(6, columnaHorarioApiClase(modalClase))
                    )
                  ] ?? 'Detalle'}
                </ModalTitle>
                <button
                  type="button"
                  aria-label="Cerrar"
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => setModalClase(null)}
                >
                  ×
                </button>
              </div>
            </ModalHeader>
            <ModalBody className="space-y-4 pt-4">
              {(() => {
                const s = horaAMinutos(modalClase.horaInicial, modalClase.jornada_tipo || modalClase.jornada_nombre);
                const e = horaAMinutos(modalClase.horaFinal, modalClase.jornada_tipo || modalClase.jornada_nombre);
                const rango =
                  s != null && e != null
                    ? `${formatoHoraCorta(s)} - ${formatoHoraCorta(e)} · ${modalClase.jornada_nombre || modalClase.jornada_tipo || 'Jornada'}`
                    : `${modalClase.horaInicial} - ${modalClase.horaFinal}`;
                return <p className="text-sm text-gray-500 dark:text-gray-400">{rango}</p>;
              })()}

              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  Ficha {modalClase.ficha_codigo}
                </p>
                <p className="mt-1 text-sm font-semibold uppercase leading-snug text-gray-900 dark:text-white">
                  {titulosCompetenciaYRapUi(modalClase).competencia}
                </p>
              </div>

              {titulosCompetenciaYRapUi(modalClase).rap ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-600 dark:bg-coal-300/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    RAP
                  </p>
                  <p className="mt-1 text-sm text-gray-800 dark:text-gray-100">
                    {titulosCompetenciaYRapUi(modalClase).rap}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <KeenIcon icon="geolocation" className="text-base" />
                <span>{modalClase.aula_nombre?.trim() ? modalClase.aula_nombre.trim() : 'Ambiente virtual'}</span>
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-500/50 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/50"
                onClick={() => {
                  irAClase(modalClase);
                  setModalClase(null);
                }}
              >
                Ver clase / Ambiente virtual
              </button>
            </ModalBody>
          </ModalContent>
        ) : (
          <></>
        )}
      </Modal>

      <Modal open={modalResumen != null} onClose={() => setModalResumen(null)} zIndex={125}>
        {modalResumen && modalResumen.length > 0 ? (
          <ModalContent className="mx-4 flex max-h-[85vh] max-w-lg flex-col overflow-hidden">
            <ModalHeader className="shrink-0 border-b border-gray-100 dark:border-gray-700">
              <div className="flex w-full items-start justify-between gap-3">
                <ModalTitle>Clases en este horario</ModalTitle>
                <button
                  type="button"
                  aria-label="Cerrar"
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => setModalResumen(null)}
                >
                  ×
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {modalResumen.length} {modalResumen.length === 1 ? 'actividad' : 'actividades'} en esta franja; elige
                una para ver el detalle.
              </p>
            </ModalHeader>
            <ModalBody className="min-h-0 flex-1 space-y-2 overflow-y-auto pt-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {modalResumen.map((c) => {
                const { competencia } = titulosCompetenciaYRapUi(c);
                return (
                  <button
                    key={c.idHorarioMateria}
                    type="button"
                    onClick={() => {
                      setModalResumen(null);
                      setModalClase(c);
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-gray-600 dark:bg-coal-400 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/30"
                  >
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Ficha {c.ficha_codigo}</div>
                    <div className="mt-1 line-clamp-4 text-xs leading-snug text-gray-700 dark:text-gray-200">
                      {competencia}
                    </div>
                  </button>
                );
              })}
            </ModalBody>
          </ModalContent>
        ) : (
          <></>
        )}
      </Modal>
    </Fragment>
  );
};

export default HorarioInstructorPage;

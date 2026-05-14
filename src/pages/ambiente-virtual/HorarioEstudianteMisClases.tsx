import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { KeenIcon } from '@/components';
import { Container } from '@/components/container';
import { Toolbar, ToolbarActions, ToolbarHeading } from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { normalizarClases, type Materia } from './MisClases';

interface HorarioEstudianteMisClasesProps {
  onVolver: () => void;
}

/** Columnas Lun–Dom; BD `idDia` 1=Lun … 7=Dom. */
const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

type JornadaVisual = 'manana' | 'tarde' | 'noche';

type FiltroJornada = 'todos' | JornadaVisual;

type BloqueEstudiante = {
  id: string;
  columna: number;
  start: number;
  end: number;
  competencia: string;
  instructor: string;
  aula: string;
  fichaCodigo: string;
};

type FilaTexto = {
  tipo: 'texto';
  id: string;
  competencia: string;
  horarioTexto: string;
  instructor: string;
};

const cortarHora = (s: string): string => {
  const t = (s || '').trim();
  if (!t) return '';
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1]!.padStart(2, '0')}:${m[2]}` : t.substring(0, 5);
};

function minutosHora(hora: string): number | null {
  const t = cortarHora(hora);
  if (!t) return null;
  const [h, min] = t.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(min) ? 0 : min);
}

function formatoHora24(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function ordenDiaSemana(nombreDia: string): number {
  const x = nombreDia
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const map: Record<string, number> = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
    domingo: 7,
    lun: 1,
    mar: 2,
    mie: 3,
    mier: 3,
    jue: 4,
    vie: 5,
    sab: 6,
    dom: 7
  };
  return map[x] ?? 99;
}

function diaNombreAColumna(nombreDia: string): number {
  const o = ordenDiaSemana(nombreDia);
  if (o < 1 || o > 7) return -1;
  return o - 1;
}

function jornadaPorHoraInicio(startMin: number): JornadaVisual {
  if (startMin < 12 * 60) return 'manana';
  if (startMin < 18 * 60) return 'tarde';
  return 'noche';
}

function etiquetaJornada(j: JornadaVisual): string {
  if (j === 'manana') return 'Mañana';
  if (j === 'tarde') return 'Tarde';
  return 'Noche';
}

function clasesTarjetaPorJornada(j: JornadaVisual): string {
  switch (j) {
    case 'manana':
      return 'rounded-lg border border-sky-100 bg-sky-50/95 border-t-[3px] border-t-sky-500 dark:border-sky-900/40 dark:bg-sky-950/35 dark:border-t-sky-400';
    case 'tarde':
      return 'rounded-lg border border-amber-100 bg-amber-50/95 border-t-[3px] border-t-amber-500 dark:border-amber-900/40 dark:bg-amber-950/30 dark:border-t-amber-400';
    default:
      return 'rounded-lg border border-violet-100 bg-violet-50/95 border-t-[3px] border-t-violet-500 dark:border-violet-900/40 dark:bg-violet-950/35 dark:border-t-violet-400';
  }
}

function claseTextoHoraJornada(j: JornadaVisual): string {
  switch (j) {
    case 'manana':
      return 'text-sky-700 dark:text-sky-300';
    case 'tarde':
      return 'text-amber-800 dark:text-amber-300';
    default:
      return 'text-violet-800 dark:text-violet-300';
  }
}

/** Una sola tarjeta si coinciden día, inicio, fin, competencia e instructor (evita duplicados por varios idHorarioMateria). */
function claveDedupe(b: BloqueEstudiante): string {
  const comp = b.competencia.trim().toUpperCase();
  const inst = b.instructor.trim().toLowerCase();
  return `${b.columna}|${b.start}|${b.end}|${comp}|${inst}`;
}

function dedupeBloques(bloques: BloqueEstudiante[]): BloqueEstudiante[] {
  const map = new Map<string, BloqueEstudiante>();
  for (const b of bloques) {
    const k = claveDedupe(b);
    if (!map.has(k)) map.set(k, b);
  }
  return [...map.values()];
}

function construirBloques(materias: Materia[]): BloqueEstudiante[] {
  const out: BloqueEstudiante[] = [];
  for (const m of materias) {
    const inst = (m.profesor_nombre || '').trim() || 'Sin asignar';
    const aula = (m.aula_nombre || '').trim();
    const ficha = (m.ficha_codigo || '').trim();
    for (const h of m.horarios) {
      const col = diaNombreAColumna(h.dia);
      if (col < 0) continue;
      const s = minutosHora(h.horaInicial);
      const e = minutosHora(h.horaFinal);
      if (s == null || e == null || e <= s) continue;
      out.push({
        id: `${m.idMateria}-${h.idHorarioMateria}`,
        columna: col,
        start: s,
        end: e,
        competencia: m.materia_nombre || 'Sin competencia',
        instructor: inst,
        aula,
        fichaCodigo: ficha
      });
    }
  }
  return dedupeBloques(out);
}

function construirFilasTexto(materias: Materia[]): FilaTexto[] {
  const filas: FilaTexto[] = [];
  const visto = new Set<string>();
  for (const m of materias) {
    if (m.horarios.length > 0) continue;
    if (!(m.horario_texto || '').trim()) continue;
    const inst = (m.profesor_nombre || '').trim() || 'Sin asignar';
    const comp = (m.materia_nombre || '').trim().toUpperCase();
    const k = `${comp}|${inst.toLowerCase()}|${m.horario_texto.trim()}`;
    if (visto.has(k)) continue;
    visto.add(k);
    filas.push({
      tipo: 'texto',
      id: `txt-${m.idMateria}`,
      competencia: m.materia_nombre || 'Sin competencia',
      horarioTexto: m.horario_texto.trim(),
      instructor: inst
    });
  }
  return filas;
}

const PILLS_FILTRO_JORNADA: { id: FiltroJornada; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'manana', label: 'Mañana' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noche', label: 'Noche' }
];

/** Por encima de esto se muestra acordeón (flecha + texto colapsado con …). */
const UMBRAL_TEXTO_COMPETENCIA_ACORDEON = 52;

const BloqueTarjetaHorario: React.FC<{ bloque: BloqueEstudiante }> = ({ bloque: b }) => {
  const [expandido, setExpandido] = useState(false);
  const competencia = b.competencia.trim();
  const conAcordeon = competencia.length > UMBRAL_TEXTO_COMPETENCIA_ACORDEON;
  const jv = jornadaPorHoraInicio(b.start);
  const lineaHora = `${formatoHora24(b.start)}-${formatoHora24(b.end)} - ${etiquetaJornada(jv)}`;

  return (
    <div
      className={`relative flex w-full flex-col px-2.5 pb-2.5 pt-1 text-left ${clasesTarjetaPorJornada(jv)}`}
    >
      {conAcordeon ? (
        <button
          type="button"
          className="absolute right-0.5 top-0.5 z-[2] flex h-7 w-7 items-center justify-center rounded-md text-gray-700 transition hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10"
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          aria-controls={`competencia-horario-${b.id}`}
          title={expandido ? 'Contraer competencia' : 'Ver competencia completa'}
        >
          <KeenIcon
            icon="down"
            className={clsx('text-sm transition-transform duration-200', expandido && 'rotate-180')}
          />
        </button>
      ) : null}

      <div className={clsx(conAcordeon && 'pr-7')}>
        <div
          className={`shrink-0 text-[11px] font-semibold leading-tight ${claseTextoHoraJornada(jv)}`}
        >
          {lineaHora}
        </div>
        <p
          id={`competencia-horario-${b.id}`}
          className={clsx(
            'mt-1.5 text-xs font-bold uppercase leading-snug text-gray-900 dark:text-gray-50 break-words',
            conAcordeon && !expandido && 'line-clamp-2'
          )}
        >
          {competencia}
        </p>
      </div>

      <div className="mt-2.5 shrink-0 border-t border-gray-900/10 pt-2 dark:border-white/10">
        {b.fichaCodigo ? (
          <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-200">
            Ficha {b.fichaCodigo}
          </div>
        ) : null}
        {b.aula ? (
          <div className="mt-0.5 text-[10px] leading-snug text-gray-500 dark:text-gray-400">{b.aula}</div>
        ) : null}
        <div className="mt-1 text-[10px] font-medium leading-snug text-gray-600 dark:text-gray-300">
          Instructor: {b.instructor}
        </div>
      </div>
    </div>
  );
};

const HorarioEstudianteMisClases: React.FC<HorarioEstudianteMisClasesProps> = ({ onVolver }) => {
  const { currentLayout } = useLayout();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [filtroJornada, setFiltroJornada] = useState<FiltroJornada>('todos');

  const fetchClases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<{ data: unknown[] }>('fichas/estudiante/clases');
      setMaterias(normalizarClases(response.data?.data ?? []));
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(
        axiosError?.response?.data?.error ??
          'No se pudo cargar el horario. Intenta de nuevo más tarde.'
      );
      setMaterias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClases();
  }, [fetchClases]);

  const columnasHorarioBase = useMemo(() => {
    const bloques = construirBloques(materias);
    const cols: BloqueEstudiante[][] = Array.from({ length: 7 }, () => []);
    for (const b of bloques) {
      if (b.columna >= 0 && b.columna < 7) cols[b.columna]!.push(b);
    }
    return cols.map((lista) => [...lista].sort((a, b) => a.start - b.start || a.end - b.end));
  }, [materias]);

  const columnasHorarioFiltradas = useMemo(() => {
    if (filtroJornada === 'todos') return columnasHorarioBase;
    return columnasHorarioBase.map((col) =>
      col.filter((b) => jornadaPorHoraInicio(b.start) === filtroJornada)
    );
  }, [columnasHorarioBase, filtroJornada]);

  const filasTexto = useMemo(() => construirFilasTexto(materias), [materias]);

  const hayContenido =
    columnasHorarioBase.some((c) => c.length > 0) || filasTexto.length > 0;

  const hayBloquesEnGrilla = columnasHorarioBase.some((c) => c.length > 0);

  const hayResultadosConFiltro = columnasHorarioFiltradas.some((c) => c.length > 0);

  return (
    <>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <button
                type="button"
                className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-transparent hover:bg-gray-100 dark:hover:bg-coal-300 rounded-lg px-2 py-1.5 -ml-2 mb-3"
                onClick={onVolver}
                title="Volver a mis clases"
              >
                <KeenIcon icon="arrow-left" className="text-sm" />
                <span className="text-sm font-medium">Volver a mis clases</span>
              </button>
              <div className="flex items-center gap-2">
                <KeenIcon icon="calendar" className="text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mi horario</h1>
              </div>
            </ToolbarHeading>
            {!loading && hayBloquesEnGrilla ? (
              <ToolbarActions>
                <div className="inline-flex shrink-0 rounded-full border border-slate-200 bg-slate-100/90 p-1 dark:border-gray-600 dark:bg-coal-300/50">
                  {PILLS_FILTRO_JORNADA.map((p) => (
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
              </ToolbarActions>
            ) : null}
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando horario…</p>
            </div>
          ) : error ? (
            <div
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {error}
            </div>
          ) : materias.length === 0 || !hayContenido ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <KeenIcon icon="calendar" className="text-4xl text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                No hay horario para mostrar
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {materias.length === 0
                  ? 'Cuando tengas clases asignadas, aparecerán aquí.'
                  : 'No se encontraron franjas horarias en tus materias. Consulta con tu centro si falta el horario en el sistema.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              {hayBloquesEnGrilla ? (
                <>
                  {!hayResultadosConFiltro ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 py-10 text-center text-sm text-gray-600 dark:border-gray-600 dark:bg-coal-500/20 dark:text-gray-400">
                      No hay clases para la jornada seleccionada.
                    </div>
                  ) : (
                    <div className="flex min-w-[720px] gap-0 divide-x divide-slate-200 dark:divide-gray-600">
                      {DIAS_CORTO.map((dia, colIdx) => (
                        <div key={dia} className="min-w-0 flex-1 px-1.5 sm:px-2">
                          <div className="sticky top-0 z-10 bg-gray-50/95 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-700 backdrop-blur-sm dark:bg-coal-400/95 dark:text-slate-200">
                            {dia}
                          </div>
                          <div className="flex flex-col gap-2 pb-4 pt-2">
                            {columnasHorarioFiltradas[colIdx]!.map((b) => (
                              <BloqueTarjetaHorario key={b.id} bloque={b} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-4 text-xs text-gray-600 dark:border-gray-600 dark:text-gray-300">
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
                </>
              ) : null}

              {filasTexto.length > 0 ? (
                <div className="mt-6 border-t border-slate-200 pt-4 dark:border-gray-600">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Otras materias (detalle en texto)
                  </p>
                  <ul className="space-y-2">
                    {filasTexto.map((f) => (
                      <li key={f.id} className="text-xs">
                        <span className="font-bold uppercase text-gray-900 dark:text-white">
                          {f.competencia}
                        </span>
                        <span className="mx-2 text-gray-400">·</span>
                        <span className="text-gray-600 dark:text-gray-300">{f.horarioTexto}</span>
                        <div className="mt-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                          Instructor: {f.instructor}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Container>
    </>
  );
};

export default HorarioEstudianteMisClases;

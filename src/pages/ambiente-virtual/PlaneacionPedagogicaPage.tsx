import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components';
import { useClasesInstructorAsignadas } from '@/hooks/useClasesInstructorAsignadas';
import {
  claseVisibleEnGrillaHorario,
  titulosCompetenciaYRapUi
} from '@/utils/clasesAsignadasLogica';
import {
  deletePlaneacion,
  downloadPlaneacionPdf,
  ESTADO_CLASS,
  ESTADO_LABEL,
  fechaCorta,
  listPlaneaciones,
  lunesDeSemana,
  normalizarGrado,
  type EstadoPlaneacion,
  type NivelPlaneacion,
  type PlaneacionPedagogica
} from '@/services/planeacionPedagogicaService';

const DIAS_CORTO: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom'
};

function horaCorta(v?: string | null): string {
  if (!v) return '--:--';
  const m = String(v).match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : String(v).slice(0, 5);
}

function detectNivel(programa: string): NivelPlaneacion {
  const p = programa.toUpperCase();
  if (p.includes('PRIMARIA') || p.includes('PREESCOLAR')) return 'PRIMARIA';
  return 'BACHILLER';
}

function mismaSemana(plan: PlaneacionPedagogica, lunes: string): boolean {
  return String(plan.semanaInicio).slice(0, 10) === lunes;
}

/** Semanal = varias clases; individual = una sola clase/materia. */
function esPlanSemanal(plan: PlaneacionPedagogica): boolean {
  const n = plan.clases_count ?? plan.clases?.length ?? 0;
  return n > 1;
}

function numClasesPlan(plan: PlaneacionPedagogica): number {
  return plan.clases_count ?? plan.clases?.length ?? 0;
}

type ClaseItem = ReturnType<typeof useClasesInstructorAsignadas>['clases'][number];

type MateriaGrupo = {
  key: string;
  competencia: string;
  rap: string;
  franjas: { idHm: number; idDia: number; hora: string }[];
  plan?: PlaneacionPedagogica;
};

const PlaneacionPedagogicaPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { clases, loading: loadingHorario, error, refetch } = useClasesInstructorAsignadas();
  const [planes, setPlanes] = useState<PlaneacionPedagogica[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [gruposAbiertos, setGruposAbiertos] = useState<Record<string, boolean>>({});
  const lunesActual = useMemo(() => lunesDeSemana(), []);

  const cargarPlanes = useCallback(async () => {
    setLoadingPlanes(true);
    try {
      setPlanes(await listPlaneaciones());
    } catch {
      setPlanes([]);
    } finally {
      setLoadingPlanes(false);
    }
  }, []);

  useEffect(() => {
    cargarPlanes();
  }, [cargarPlanes]);

  const visibles = useMemo(
    () =>
      clases.filter((c) => {
        if (!claseVisibleEnGrillaHorario(c)) return false;
        const d = Number(c.idDia ?? 0);
        return d >= 1 && d <= 5;
      }),
    [clases]
  );

  const planPorHorario = useMemo(() => {
    const map = new Map<number, PlaneacionPedagogica>();
    const ordenados = [...planes].sort((a, b) => {
      const aSem = mismaSemana(a, lunesActual) ? 0 : 1;
      const bSem = mismaSemana(b, lunesActual) ? 0 : 1;
      if (aSem !== bSem) return aSem - bSem;
      return b.id - a.id;
    });
    for (const p of ordenados) {
      for (const c of p.clases || []) {
        const hm = Number(c.idHorarioMateria ?? 0);
        if (hm && !map.has(hm)) map.set(hm, p);
      }
    }
    return map;
  }, [planes, lunesActual]);

  /** Solo planeaciones semanales (varias clases) de la ficha en la semana actual. */
  const planSemanalPorFicha = useMemo(() => {
    const map = new Map<number, PlaneacionPedagogica>();
    for (const p of planes) {
      if (!p.idFicha || !mismaSemana(p, lunesActual) || !esPlanSemanal(p)) continue;
      const prev = map.get(p.idFicha);
      if (!prev || numClasesPlan(p) > numClasesPlan(prev) || p.id > prev.id) {
        map.set(p.idFicha, p);
      }
    }
    return map;
  }, [planes, lunesActual]);

  const grupos = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        programa: string;
        ficha: string;
        fichaId: number;
        nivel: NivelPlaneacion;
        items: ClaseItem[];
      }
    >();

    for (const c of visibles) {
      const programa = String(c.programa_nombre ?? 'Sin programa');
      const ficha = String(c.ficha_codigo ?? 'S/C');
      const fichaId = Number(c.ficha_id ?? 0);
      const key = `${programa}||${ficha}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          programa,
          ficha,
          fichaId,
          nivel: detectNivel(programa),
          items: []
        });
      }
      map.get(key)!.items.push(c);
    }

    return Array.from(map.values()).map((g) => {
      // Agrupa por materia para no repetir filas (Lun + Mar de Mate = 1 fila)
      const porMateria = new Map<string, MateriaGrupo>();
      const sorted = [...g.items].sort(
        (a, b) =>
          Number(a.idDia ?? 0) - Number(b.idDia ?? 0) ||
          horaCorta(String(a.horaInicial ?? '')).localeCompare(
            horaCorta(String(b.horaInicial ?? ''))
          )
      );

      for (const clase of sorted) {
        const { competencia, rap } = titulosCompetenciaYRapUi(clase);
        const idHm = Number(clase.idHorarioMateria ?? 0);
        const idDia = Number(clase.idDia ?? 0);
        const matKey = competencia.trim().toLowerCase() || `hm-${idHm}`;
        if (!porMateria.has(matKey)) {
          porMateria.set(matKey, {
            key: matKey,
            competencia,
            rap: rap || '',
            franjas: [],
            plan: undefined
          });
        }
        const row = porMateria.get(matKey)!;
        row.franjas.push({
          idHm,
          idDia,
          hora: `${horaCorta(String(clase.horaInicial))}–${horaCorta(String(clase.horaFinal))}`
        });
        if (!row.plan && idHm) row.plan = planPorHorario.get(idHm);
        if (rap && !row.rap) row.rap = rap;
      }

      return {
        ...g,
        materias: Array.from(porMateria.values())
      };
    });
  }, [visibles, planPorHorario]);

  useEffect(() => {
    if (grupos.length === 0) return;
    setGruposAbiertos((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next: Record<string, boolean> = {};
      grupos.forEach((g, i) => {
        next[g.key] = i === 0; // solo el primero abierto
      });
      return next;
    });
  }, [grupos]);

  const onDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta planeación?')) return;
    try {
      await deletePlaneacion(id);
      enqueueSnackbar('Eliminada', { variant: 'success' });
      cargarPlanes();
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message || 'No se pudo eliminar', { variant: 'error' });
    }
  };

  return (
    <Container>
      <div data-no-uppercase className="pb-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 leading-tight">
              Planeación pedagógica
            </h1>
            <p className="mt-0.5 text-xs text-slate-600 max-w-xl">
              Semana laboral (lun–vie). Planifica, genera PDF y envía al coordinador.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                refetch();
                cargarPlanes();
              }}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <KeenIcon icon="arrows-circle" className="w-3.5 h-3.5 leading-none" />
              Actualizar
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-sky-600 px-2.5 text-xs font-semibold text-white hover:bg-sky-700"
              onClick={() =>
                navigate(`/ambiente-virtual/planeacion-pedagogica/nueva?semana=${lunesDeSemana()}`)
              }
            >
              <KeenIcon icon="plus" className="w-3.5 h-3.5 leading-none" />
              Planear toda la semana
            </button>
          </div>
        </div>

        {/* Mis planeaciones — compactas + scroll si hay muchas */}
        <section className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="text-sm font-semibold text-slate-800">Mis planeaciones</h2>
            {planes.length > 0 && (
              <span className="text-[11px] text-slate-500">{planes.length} registradas</span>
            )}
          </div>
          {loadingPlanes && (
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-slate-500 text-xs">
              Cargando…
            </div>
          )}
          {!loadingPlanes && planes.length === 0 && (
            <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/40 px-3 py-5 text-center text-slate-600 text-xs">
              Aún no tienes planeaciones. Usa el horario de abajo o{' '}
              <strong className="text-sky-800">Planear semana</strong>.
            </div>
          )}
          {!loadingPlanes && planes.length > 0 && (
            <div className="max-h-[280px] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-slate-50/40 p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {planes.map((p) => {
                  const nClases = p.clases_count ?? p.clases?.length ?? 0;
                  const estado = p.estado as EstadoPlaneacion;
                  return (
                    <article
                      key={p.id}
                      className="flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-sky-300 transition"
                    >
                      <div className="h-1 bg-gradient-to-r from-sky-500 to-emerald-500" />
                      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                              {fechaCorta(p.semanaInicio)} – {fechaCorta(p.semanaFin)}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {p.nivel === 'PRIMARIA' ? 'Primaria' : 'Bachiller'}
                              {p.grado ? ` · ${normalizarGrado(p.grado, p.nivel)}` : ''}
                              {` · ${nClases} ${nClases === 1 ? 'clase' : 'clases'}`}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border leading-none ${ESTADO_CLASS[estado]}`}
                          >
                            {ESTADO_LABEL[estado] || p.estado}
                          </span>
                        </div>
                        {p.estado === 'INCOMPLETA' && p.motivoIncompleta && (
                          <p className="text-[10px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 line-clamp-1">
                            {p.motivoIncompleta}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 line-clamp-1 min-h-[1rem]">
                          {p.proposito || 'Sin propósito'}
                        </p>
                        <div className="flex gap-1.5 mt-auto pt-1">
                          <button
                            type="button"
                            className="flex-1 inline-flex items-center justify-center rounded-md bg-sky-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-sky-700"
                            onClick={() => navigate(`/ambiente-virtual/planeacion-pedagogica/${p.id}`)}
                          >
                            Abrir
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                            onClick={async () => {
                              try {
                                await downloadPlaneacionPdf(p.id);
                              } catch {
                                enqueueSnackbar('No se pudo descargar el PDF', {
                                  variant: 'error'
                                });
                              }
                            }}
                          >
                            PDF
                          </button>
                          {(p.estado === 'BORRADOR' || p.estado === 'EN_EJECUCION') && (
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:text-rose-600"
                              onClick={() => onDelete(p.id)}
                              title="Eliminar"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Desde tu horario — materias agrupadas + acordeón + scroll */}
        <section>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Desde tu horario</h2>
              <p className="text-[10px] text-slate-500">
                En cada grupo: <strong>Planear semana</strong> (todas las materias). En cada fila:{' '}
                <strong>Planear clase</strong> (solo esa materia).
              </p>
            </div>
            {grupos.length > 0 && (
              <span className="text-[11px] text-slate-500 shrink-0">
                {grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'} · lun–vie
              </span>
            )}
          </div>

          {loadingHorario && (
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-5 text-center text-slate-500 text-xs">
              Cargando clases…
            </div>
          )}
          {!loadingHorario && error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-rose-700 text-xs">
              No se pudieron cargar las clases del horario.
            </div>
          )}
          {!loadingHorario && !error && grupos.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-slate-500 text-xs">
              No hay clases lun–vie en tu horario.
            </div>
          )}

          {!loadingHorario && !error && grupos.length > 0 && (
            <div className="space-y-2">
              {grupos.map((grupo) => {
                const planSemanal = planSemanalPorFicha.get(grupo.fichaId);
                const abierto = gruposAbiertos[grupo.key] ?? false;
                const planeadas = grupo.materias.filter((m) => m.plan).length;
                return (
                  <section
                    key={grupo.key}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                  >
                    <header className="flex flex-wrap items-center gap-2 px-3 py-2 bg-gradient-to-r from-sky-50 to-emerald-50/60 border-b border-sky-100">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        onClick={() =>
                          setGruposAbiertos((prev) => ({
                            ...prev,
                            [grupo.key]: !abierto
                          }))
                        }
                      >
                        <KeenIcon
                          icon={abierto ? 'down' : 'right'}
                          className="w-3.5 h-3.5 text-slate-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">
                            {grupo.programa}
                          </h3>
                          <p className="text-[10px] text-slate-500 truncate">
                            {grupo.ficha} · {grupo.nivel === 'PRIMARIA' ? 'Primaria' : 'Bachiller'} ·{' '}
                            {grupo.materias.length} materias
                            {planeadas > 0 ? ` · ${planeadas} con plan` : ''}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {planSemanal && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${ESTADO_CLASS[planSemanal.estado as EstadoPlaneacion]}`}
                          >
                            {ESTADO_LABEL[planSemanal.estado as EstadoPlaneacion]}
                          </span>
                        )}
                        {planSemanal ? (
                          <button
                            type="button"
                            className="rounded-md bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-700"
                            onClick={() =>
                              navigate(
                                `/ambiente-virtual/planeacion-pedagogica/${planSemanal.id}`
                              )
                            }
                          >
                            Abrir semana
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                            onClick={() =>
                              navigate(
                                `/ambiente-virtual/planeacion-pedagogica/nueva?ficha=${grupo.fichaId}&nivel=${grupo.nivel}&semana=${lunesActual}`
                              )
                            }
                          >
                            Planear semana
                          </button>
                        )}
                      </div>
                    </header>

                    {abierto && (
                      <div className="max-h-[320px] overflow-y-auto overscroll-contain">
                        <ul className="divide-y divide-slate-100">
                          {grupo.materias.map((mat) => {
                            const franjaTxt = mat.franjas
                              .map(
                                (f) =>
                                  `${DIAS_CORTO[f.idDia] ?? f.idDia} ${f.hora}`
                              )
                              .join(' · ');
                            const primerHm = mat.franjas[0]?.idHm ?? 0;
                            return (
                              <li
                                key={mat.key}
                                className="px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50/80"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 truncate">
                                      {mat.competencia}
                                    </p>
                                    {mat.plan && (
                                      <span
                                        className={`shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded border leading-none ${ESTADO_CLASS[mat.plan.estado as EstadoPlaneacion]}`}
                                      >
                                        {ESTADO_LABEL[mat.plan.estado as EstadoPlaneacion]}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate" title={franjaTxt}>
                                    {franjaTxt}
                                    {mat.rap ? ` · ${mat.rap}` : ''}
                                  </p>
                                </div>
                                {mat.plan ? (
                                  <button
                                    type="button"
                                    className="shrink-0 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-800 hover:bg-sky-100"
                                    onClick={() =>
                                      navigate(
                                        `/ambiente-virtual/planeacion-pedagogica/${mat.plan!.id}`
                                      )
                                    }
                                  >
                                    Abrir
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                                    onClick={() =>
                                      navigate(
                                        `/ambiente-virtual/planeacion-pedagogica/nueva?horario=${primerHm}&ficha=${grupo.fichaId}&nivel=${grupo.nivel}&semana=${lunesActual}`
                                      )
                                    }
                                    title="Planeación de esta materia únicamente"
                                  >
                                    Planear clase
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
};

export default PlaneacionPedagogicaPage;

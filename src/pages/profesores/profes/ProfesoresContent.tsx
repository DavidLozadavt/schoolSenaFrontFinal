import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

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
const DONUT_COLS = ["#2563eb", "#16a34a", "#f97316", "#d97706", "#6b7280", "#0284c7"];

function fmtH(h: string) { return h ? h.substring(0, 5) : "-"; }

function getEstadoLabel(estado: Actividad["estado"]): string {
  if (!estado) return "SIN ESTADO";
  if (typeof estado === "string") return estado.toUpperCase();
  return (estado.nombre || estado.estado || "SIN ESTADO").toUpperCase();
}

function getTitulo(act: Actividad): string {
  return act.tituloActividad || act.titulo || act.nombre || "Sin nombre";
}

function getDescripcion(act: Actividad): string | undefined {
  return act.descripcionActividad || act.descripcion;
}

// ─── Mini Charts ──────────────────────────────────────────────────────────────

interface BarData { label: string; value: number; color: string }
const BarChart: React.FC<{ data: BarData[]; height?: number }> = ({ data, height = 120 }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const bw = 100 / (data.length * 2 - 1);
  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {data.map((d, i) => {
          const bh = (d.value / max) * 90;
          return <rect key={i} x={i * bw * 2} y={100 - bh} width={bw} height={bh} rx="2" className={d.color} fill="currentColor" opacity={0.85} />;
        })}
      </svg>
      <div className="flex justify-around mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold text-center" style={{ width: `${100 / data.length}%` }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

interface DonutSlice { label: string; value: number; color: string }
const DonutChart: React.FC<{ slices: DonutSlice[]; size?: number }> = ({ slices, size = 120 }) => {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = 38; const cx = 50; const cy = 50;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const segs = slices.map((s) => { const dash = (s.value / total) * circ; const seg = { ...s, dash, gap: circ - dash, off }; off += dash; return seg; });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-100 dark:text-gray-700" />
      {segs.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="12"
          strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={circ / 4 - s.off} strokeLinecap="butt"
          style={{ transition: "stroke-dasharray 0.5s ease" }} />
      ))}
      <text x="50" y="47" textAnchor="middle" dominantBaseline="middle" className="fill-gray-700 dark:fill-gray-200" fontSize="13" fontWeight="800">{total}</text>
      <text x="50" y="57" textAnchor="middle" dominantBaseline="middle" fontSize="5" className="fill-gray-400">total</text>
    </svg>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string | number; bg: string; text: string; border: string; sub?: string }> =
  ({ icon, label, value, bg, text, border, sub }) => (
    <div className={`relative overflow-hidden rounded-lg shadow-md border-2 p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${text} opacity-70`}>{label}</p>
          <p className={`text-4xl font-extrabold leading-none ${text}`}>{value}</p>
          {sub && <p className={`text-xs mt-1 ${text} opacity-60`}>{sub}</p>}
        </div>
        <span className={`text-4xl opacity-20 select-none ${text}`}>{icon}</span>
      </div>
    </div>
  );

// ─── Main Component ────────────────────────────────────────────────────────────

const ProfesoresContent: React.FC = () => {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // ── Fichas del instructor (endpoint autónomo, sin params) ───────────────
  useEffect(() => {
    axios.get("instructores/mi-dashboard")
      .then((r) => {
        const d = r.data?.fichas ?? r.data ?? [];
        setFichas(Array.isArray(d) ? d : []);
      })
      .catch(() => setFichas([]));
  }, []);

  // ── Actividades del instructor ──────────────────────────────────────────
  useEffect(() => {
    axios.get("actividades")
      .then((r) => {
        const d = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setActividades(d);
      })
      .catch(() => setActividades([]));
  }, []);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalFichas   = fichas.length;
  const totalRAPs     = fichas.reduce((a, f) => a + f.resultados.length, 0);
  const totalSesiones = fichas.reduce((a, f) => a + f.resultados.reduce((b, r) => b + r.cantidadSesiones, 0), 0);
  const totalHoras    = fichas.reduce((a, f) => a + f.resultados.reduce((b, r) => b + r.duracionHoras, 0), 0);

  // ── Actividades por estado ────────────────────────────────────────────────
  const actsPorEstado = useMemo(() => {
    const map: Record<string, number> = {};
    actividades.forEach((a) => {
      const e = getEstadoLabel(a.estado);
      map[e] = (map[e] || 0) + 1;
    });
    return map;
  }, [actividades]);

  const donutActs: DonutSlice[] = [
    { label: "Activo",    value: actsPorEstado["ACTIVO"]    || 0, color: "#16a34a" },
    { label: "Borrador",  value: actsPorEstado["BORRADOR"]  || 0, color: "#9ca3af" },
    { label: "Publicado", value: actsPorEstado["PUBLICADO"] || 0, color: "#2563eb" },
    { label: "Pendiente", value: actsPorEstado["PENDIENTE"] || 0, color: "#d97706" },
    { label: "Inactivo",  value: actsPorEstado["INACTIVO"]  || 0, color: "#6b7280" },
  ].filter((s) => s.value > 0);

  // ── Gráficas ──────────────────────────────────────────────────────────────
  const sesXdia = useMemo(() => {
    const map: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    fichas.forEach((f) => f.resultados.forEach((r) => { if (r.idDia >= 1 && r.idDia <= 6) map[r.idDia] += r.cantidadSesiones; }));
    return map;
  }, [fichas]);

  const barDias: BarData[] = [1, 2, 3, 4, 5, 6].map((d) => ({
    label: DIAS[d], value: sesXdia[d],
    color: d === 6 ? "text-orange-400" : "text-blue-600 dark:text-blue-400",
  }));

  const donutRaps: DonutSlice[] = fichas.map((f, i) => ({
    label: f.codigoFicha, value: f.resultados.length, color: DONUT_COLS[i % DONUT_COLS.length],
  }));

  // ─── Badge de estado de actividad ─────────────────────────────────────────
  const BADGE: Record<string, string> = {
    ACTIVO:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    BORRADOR:  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    PUBLICADO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    INACTIVO:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-8 min-h-screen bg-gray-50 dark:bg-coal-500">
      <>
        {/* ══ KPIs ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon="📋" label="Fichas"      value={totalFichas}          sub="asignadas"    bg="bg-blue-100 dark:bg-blue-900/30"   text="text-blue-700 dark:text-blue-300"   border="border-blue-600 dark:border-blue-500" />
          <StatCard icon="🎯" label="RAPs"        value={totalRAPs}            sub="resultados"   bg="bg-green-100 dark:bg-green-900/30"  text="text-green-700 dark:text-green-300"  border="border-green-600 dark:border-green-500" />
          <StatCard icon="📅" label="Sesiones"    value={totalSesiones}        sub="del mes"      bg="bg-orange-100 dark:bg-orange-900/30" text="text-orange-700 dark:text-orange-300" border="border-orange-500 dark:border-orange-400" />
          <StatCard icon="⏱️" label="Horas"       value={totalHoras.toFixed(1)} sub="de formación" bg="bg-amber-100 dark:bg-amber-900/30"  text="text-amber-700 dark:text-amber-300"  border="border-amber-500 dark:border-amber-400" />
          <StatCard icon="📝" label="Actividades" value={actividades.length}   sub="creadas"      bg="bg-gray-100 dark:bg-gray-800"        text="text-gray-700 dark:text-gray-300"    border="border-gray-500 dark:border-gray-400" />
        </div>

        {/* ══ GRÁFICAS ══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sesiones por día */}
          <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase mb-4">📅 Sesiones por día</h3>
            {totalSesiones === 0
              ? <p className="text-center text-gray-400 text-xs py-10">Sin sesiones en este periodo</p>
              : <BarChart data={barDias} height={140} />
            }
          </div>

          {/* RAPs por ficha */}
          <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-5 flex flex-col items-center">
            <h3 className="self-start text-sm font-semibold text-gray-900 dark:text-white uppercase mb-4">🎯 RAPs por ficha</h3>
            {totalRAPs === 0
              ? <p className="text-center text-gray-400 text-xs py-10">Sin RAPs registrados</p>
              : (
                <>
                  <DonutChart slices={donutRaps} size={130} />
                  <ul className="mt-3 space-y-1.5 w-full">
                    {donutRaps.map((s, i) => (
                      <li key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                          <span className="text-gray-600 dark:text-gray-300 font-semibold truncate max-w-[110px]">{s.label}</span>
                        </span>
                        <span className="font-extrabold text-gray-800 dark:text-white">{s.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )
            }
          </div>

          {/* Actividades por estado */}
          <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-5 flex flex-col items-center">
            <h3 className="self-start text-sm font-semibold text-gray-900 dark:text-white uppercase mb-4">📝 Actividades por estado</h3>
            {donutActs.length === 0
              ? <p className="text-center text-gray-400 text-xs py-10">Sin actividades</p>
              : (
                <>
                  <DonutChart slices={donutActs} size={130} />
                  <ul className="mt-3 space-y-1.5 w-full">
                    {donutActs.map((s, i) => (
                      <li key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                          <span className="text-gray-600 dark:text-gray-300 font-semibold capitalize">{s.label}</span>
                        </span>
                        <span className="font-extrabold text-gray-800 dark:text-white">{s.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )
            }
          </div>
        </div>

        {/* ══ FICHAS + RAPs ══ */}
        <section className="space-y-4">
          <h2 className="text-base font-extrabold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-blue-600 inline-block" />
            Fichas, Sesiones y RAPs
          </h2>

          {fichas.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-coal-400 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
              <span className="text-4xl">📋</span>
              <p className="mt-3 text-gray-500 dark:text-gray-400 font-semibold">Sin fichas asignadas en este periodo</p>
            </div>
          )}

          {fichas.map((ficha, fi) => {
            const isOpen = expanded[ficha.idFicha];
            const horasF = ficha.resultados.reduce((a, r) => a + r.duracionHoras, 0);
            const sesF   = ficha.resultados.reduce((a, r) => a + r.cantidadSesiones, 0);
            return (
              <div key={ficha.idFicha} className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden">
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
                  <div className="hidden sm:flex items-center gap-5 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    <div className="text-center"><p className="font-extrabold text-lg text-blue-600 dark:text-blue-400 leading-none">{ficha.resultados.length}</p><p className="text-[10px] uppercase">RAPs</p></div>
                    <div className="text-center"><p className="font-extrabold text-lg text-orange-500 dark:text-orange-400 leading-none">{sesF}</p><p className="text-[10px] uppercase">Sesiones</p></div>
                    <div className="text-center"><p className="font-extrabold text-lg text-green-600 dark:text-green-400 leading-none">{horasF.toFixed(0)}</p><p className="text-[10px] uppercase">Horas</p></div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 ml-2 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    {ficha.resultados.length === 0
                      ? <p className="text-center text-xs text-gray-400 py-8">Sin RAPs.</p>
                      : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs min-w-[700px]">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-coal-300">
                                {["Competencia", "RAP / Resultado", "Día", "Horario", "Sesiones", "Horas"].map((h) => (
                                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {ficha.resultados.map((rap) => (
                                <tr key={rap.idHorario} className="hover:bg-gray-50/60 dark:hover:bg-coal-300/30 transition-colors">
                                  <td className="px-4 py-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400 max-w-[180px]"><span className="line-clamp-2">{rap.competencia || "—"}</span></td>
                                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[220px]"><span className="line-clamp-2">{rap.resultadoAprendizaje || "—"}</span></td>
                                  <td className="px-4 py-3"><span className="inline-block px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs">{DIAS[rap.idDia] || "—"}</span></td>
                                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">{fmtH(rap.horaInicial)} - {fmtH(rap.horaFinal)}</td>
                                  <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-extrabold text-sm">{rap.cantidadSesiones}</span></td>
                                  <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-12 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-extrabold text-sm">{rap.duracionHoras.toFixed(1)}h</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    }
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* ══ ACTIVIDADES ══ */}
        <section className="space-y-4">
          <h2 className="text-base font-extrabold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-amber-500 inline-block" />
            Actividades asignadas
          </h2>

          {actividades.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-coal-400 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
              <span className="text-4xl">📝</span>
              <p className="mt-3 text-gray-500 dark:text-gray-400 font-semibold">Sin actividades registradas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {actividades.map((act) => {
                const titulo  = getTitulo(act);
                const desc    = getDescripcion(act);
                const estado  = getEstadoLabel(act.estado);
                return (
                  <div key={act.id} className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg transition-shadow flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug flex-1 line-clamp-2">{titulo}</h4>
                      <span className={`shrink-0 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${BADGE[estado] || BADGE["BORRADOR"]}`}>
                        {estado}
                      </span>
                    </div>
                    {desc && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{desc}</p>}
                    <div className="grid grid-cols-2 gap-2 text-xs mt-auto">
                      {act.tipo_actividad?.nombre && (
                        <div className="bg-gray-50 dark:bg-coal-300 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Tipo</p>
                          <p className="font-semibold text-gray-700 dark:text-gray-200 truncate">{act.tipo_actividad.nombre}</p>
                        </div>
                      )}
                      {act.materia?.nombreMateria && (
                        <div className="bg-gray-50 dark:bg-coal-300 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Competencia</p>
                          <p className="font-semibold text-gray-700 dark:text-gray-200 truncate">{act.materia.nombreMateria}</p>
                        </div>
                      )}
                      {act.fechaInicio && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-medium mb-0.5">Inicio</p>
                          <p className="font-semibold text-blue-700 dark:text-blue-300">{act.fechaInicio}</p>
                        </div>
                      )}
                      {act.fechaFin && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-medium mb-0.5">Cierre</p>
                          <p className="font-semibold text-amber-700 dark:text-amber-300">{act.fechaFin}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </>
    </div>
  );
};

export default ProfesoresContent;

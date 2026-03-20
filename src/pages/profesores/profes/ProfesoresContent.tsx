import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/auth/useAuthContext";

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

  // ── Fichas del instructor (endpoint autónomo, sin params) ───────────────
  useEffect(() => {
    axios.get("instructores/mi-dashboard")
      .then((r) => {
        const d = r.data?.fichas ?? r.data ?? [];
        setFichas(Array.isArray(d) ? d : []);
      })
      .catch(() => setFichas([]));
  }, []);

  // ── Actividades por evaluar ──────────────────────────────────────────
  useEffect(() => {
    axios.get("actividades-por-evaluar")
      .then((r) => {
        const d = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setActividades(d);
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
  const totalRAPs = fichas.reduce((a, f) => a + f.resultados.length, 0);
  const totalSesiones = fichas.reduce((a, f) => a + f.resultados.reduce((b, r) => b + r.cantidadSesiones, 0), 0);
  const totalHoras = fichas.reduce((a, f) => a + f.resultados.reduce((b, r) => b + r.duracionHoras, 0), 0);



  // ─── Badge de estado de actividad ─────────────────────────────────────────
  const BADGE: Record<string, string> = {
    ACTIVO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    ENVIADO: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    BORRADOR: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    PUBLICADO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    INACTIVO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      <>
        {/* ══ HEADER PERSONALIZADO ═════════════════════════════════════ */}
        <header className="mb-2">
          <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight flex items-baseline gap-2">
            Dashboard de <span className="text-blue-600 dark:text-blue-400">Instructor</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Bienvenido, <span className="text-gray-900 dark:text-gray-200 font-bold">{userName}</span>
          </p>
        </header>

        {/* ══ KPI General consolidado ══ */}
        <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border-2 border-blue-500 p-5 w-full mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 md:gap-8">
            <div className="text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-blue-500 dark:text-blue-400 flex items-center justify-center md:justify-start gap-1"><span className="text-sm">📋</span> Fichas</p>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-300 leading-none">{totalFichas}</p>
              <p className="text-xs mt-1 text-gray-500 opacity-80">asignadas</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
            <div className="text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-green-500 dark:text-green-400 flex items-center justify-center md:justify-start gap-1"><span className="text-sm">🎯</span> RAPs</p>
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-300 leading-none">{totalRAPs}</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
            <div className="text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-orange-500 dark:text-orange-400 flex items-center justify-center md:justify-start gap-1"><span className="text-sm">📅</span> Sesiones</p>
              <p className="text-3xl font-extrabold text-orange-600 dark:text-orange-300 leading-none">{totalSesiones}</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
            <div className="text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-amber-500 dark:text-amber-400 flex items-center justify-center md:justify-start gap-1"><span className="text-sm">⏱️</span> Horas</p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-300 leading-none">{totalHoras.toFixed(1)}</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
            <Link 
              to={fichas.length > 0 && fichas[0].resultados.length > 0 ? `/ambiente-virtual/clase/${fichas[0].resultados[0].idHorario}` : "/ambiente-virtual/actividades"} 
              state={{ activeMenu: 'actividades-asignadas' }}
              className="text-center md:text-left flex-1 min-w-[120px] block hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:-translate-y-1 transition-all duration-300 p-2 rounded-xl group"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-purple-500 dark:text-purple-400 flex items-center justify-center md:justify-start gap-1"><span className="text-sm transition-transform group-hover:scale-110">📝</span> Por evaluar</p>
              <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-300 leading-none">{actividadesPorEvaluar.length}</p>
              <p className="text-xs mt-1 text-gray-500 opacity-80 pl-8">pendientes</p>
            </Link>
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
            const sesF = ficha.resultados.reduce((a, r) => a + r.cantidadSesiones, 0);
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

        {/* ══ ACTIVIDADES POR EVALUAR ══ */}
        <section className="space-y-4">
          <h2 className="text-base font-extrabold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-amber-500 inline-block" />
            Actividades por evaluar
          </h2>

          {actividadesPorEvaluar.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-coal-400 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
              <span className="text-4xl">✅</span>
              <p className="mt-3 text-gray-500 dark:text-gray-400 font-semibold">No hay actividades pendientes por calificar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {actividadesPorEvaluar.map((act) => {
                const titulo = getTitulo(act);
                const desc = getDescripcion(act);
                const estado = getEstadoLabel(act.estado);
                
                // Buscar el idHorarioMateria iterando sobre las fichas y comparando el nombre de la materia
                let idHorarioMatch = "";
                const nombreMat = act.materia?.nombreMateria?.toLowerCase() || "";
                for (const ficha of fichas) {
                  for (const rap of ficha.resultados) {
                    if (
                      rap.competencia?.toLowerCase() === nombreMat ||
                      rap.resultadoAprendizaje?.toLowerCase() === nombreMat
                    ) {
                      idHorarioMatch = rap.idHorario.toString();
                      break;
                    }
                  }
                  if (idHorarioMatch) break;
                }
                
                // Si no encontramos, enviamos al primero por defecto
                if (!idHorarioMatch && fichas.length > 0 && fichas[0].resultados.length > 0) {
                  idHorarioMatch = fichas[0].resultados[0].idHorario.toString();
                }

                // URL destino: si hay idHorario, lo llevamos a la clase. Si no, a las actividades generales
                const targetUrl = idHorarioMatch ? `/ambiente-virtual/clase/${idHorarioMatch}` : "/ambiente-virtual/actividades";

                return (
                  <Link 
                    key={act.id} 
                    to={targetUrl} 
                    state={{ activeMenu: 'actividades-asignadas' }} // Para que abra automáticamente la pestaña
                    className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug flex-1 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{titulo}</h4>
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
                  </Link>
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

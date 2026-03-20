import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuthContext } from '@/auth/useAuthContext';

interface AreaAsistencia {
  idArea: number;
  nombreArea: string;
  asistencias: number;
  inasistencias: number;
  justificadas: number;
  total: number;
  porcentaje: number;
}

interface ResumenAsistencia {
  asistenciaGeneral: number;
  totalAsistencias: number;
  totalInasistencias: number;
  totalJustificadas: number;
  totalRegistros: number;
}

interface RegistroAsistencia {
  id: number;
  fecha: string;
  nombreMateria: string;
  asistio: boolean;
  estaJustificada: boolean;
  estado: string;
}

interface DashboardAsistencia {
  areas: AreaAsistencia[];
  resumen: ResumenAsistencia;
  detalles: RegistroAsistencia[];
}

interface ActividadAprendiz {
  idCalificacionActividad: number;
  tituloActividad: string;
  estadoVisual: 'CALIFICADO' | 'POR_EVALUAR' | 'PENDIENTE' | 'SIN_ENTREGAR';
  fechaFinal?: string | null;
  fechaVencida?: boolean;
  calificacionNumerica?: string | null;
  area?: { nombre?: string };
  materia?: { nombreMateria?: string };
}

// ─── Estado badge config ──────────────────────────────────────────────────────

const ESTADO_CFG: Record<string, { label: string; chip: string; hex: string }> = {
  CALIFICADO:   { label: 'Calificado',   chip: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   hex: '#16a34a' },
  POR_EVALUAR:  { label: 'Por evaluar',  chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   hex: '#d97706' },
  PENDIENTE:    { label: 'Pendiente',    chip: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',           hex: '#9ca3af' },
  SIN_ENTREGAR: { label: 'Sin entregar', chip: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',            hex: '#dc2626' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtFecha(v?: string | null) {
  if (!v) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(v));
  } catch { return v; }
}

// ─── Función para transformar asistencias raw a DashboardAsistencia ───────────
function transformAsistenciasToDashboard(asistenciasRaw: any[]): DashboardAsistencia {
  const areasMap: Record<number, AreaAsistencia> = {};
  const detalles: RegistroAsistencia[] = [];
  let totalAsistencias = 0;
  let totalInasistencias = 0;
  let totalJustificadas = 0;

  asistenciasRaw.forEach((asistencia) => {
    // Soportar tanto camelCase como snake_case y diferentes estructuras de relación
    const sesion = asistencia.sesionMateria || asistencia.sesion_materia;
    const horario = sesion?.horarioMateria || sesion?.horario_materia;
    const grado = horario?.gradoMateria || horario?.grado_materia;
    
    // Si no viene por sesión, intentar por matrícula académica
    const matriculaDoc = asistencia.matriculaAcademica || asistencia.matricula_academica;
    const materia = grado?.materia || matriculaDoc?.materia;
    const area = materia?.areaConocimiento || materia?.area_conocimiento;
    
    if (!area) return; // Saltar si no tiene área asociada

    const idArea = area.id;
    const nombreArea = area.nombreAreaConocimiento || area.nombre_area_conocimiento;

    if (!areasMap[idArea]) {
      areasMap[idArea] = {
        idArea,
        nombreArea,
        asistencias: 0,
        inasistencias: 0,
        justificadas: 0,
        total: 0,
        porcentaje: 0
      };
    }

    const estaJustificada = asistencia.justificacion?.estado === 'APROBADO';
    const asistio = !!asistencia.asistio;

    if (asistio) {
      areasMap[idArea].asistencias++;
      totalAsistencias++;
    } else if (estaJustificada) {
      areasMap[idArea].justificadas++;
      totalJustificadas++;
    } else {
      areasMap[idArea].inasistencias++;
      totalInasistencias++;
    }
    areasMap[idArea].total++;

    // Agregar a detalles
    detalles.push({
      id: asistencia.id,
      fecha: sesion?.fechaSesion || sesion?.fecha_sesion || '',
      nombreMateria: materia?.nombreMateria || materia?.nombre_materia || 'Sin Materia',
      asistio: asistio,
      estaJustificada: estaJustificada,
      estado: asistio ? 'Presente' : (estaJustificada ? 'Inasistencia Justificada' : 'Ausente')
    });
  });

  // Calcular porcentajes por área
  const areas = Object.values(areasMap).map(area => ({
    ...area,
    porcentaje: area.total > 0 ? Math.round((area.asistencias / area.total) * 100) : 0
  }));

  // Ordenar detalles por fecha descendente
  detalles.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const totalRegistros = totalAsistencias + totalInasistencias + totalJustificadas;
  const asistenciaGeneral = totalRegistros > 0 
    ? Math.round((totalAsistencias / totalRegistros) * 100) 
    : 0;

  return {
    areas,
    resumen: {
      asistenciaGeneral,
      totalAsistencias,
      totalInasistencias,
      totalJustificadas,
      totalRegistros
    },
    detalles
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  icon: string; label: string; value: string | number;
  bg: string; text: string; border: string; sub?: string;
}> = ({ icon, label, value, bg, text, border, sub }) => (
  <div className={`relative overflow-hidden rounded-lg shadow-md border-2 p-5 ${bg} ${border}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${text} opacity-70`}>{label}</p>
        <p className={`text-3xl font-extrabold leading-none ${text}`}>{value}</p>
        {sub && <p className={`text-xs mt-1 ${text} opacity-60`}>{sub}</p>}
      </div>
      <span className={`text-3xl opacity-20 select-none ${text}`}>{icon}</span>
    </div>
  </div>
);

interface DonutSlice { label: string; value: number; hexColor: string }
const DonutChart: React.FC<{ slices: DonutSlice[]; size?: number; center?: string | number }> = ({
  slices, size = 130, center
}) => {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = 36; const cx = 50; const cy = 50;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const segs = slices.map((s) => {
    const dash = (s.value / total) * circ;
    const seg = { ...s, dash, gap: circ - dash, off };
    off += dash;
    return seg;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="14"
        className="text-gray-100 dark:text-gray-700" />
      {segs.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.hexColor} strokeWidth="14"
          strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={circ / 4 - s.off}
          strokeLinecap="butt" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      ))}
      <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
        className="fill-gray-800 dark:fill-gray-100" fontSize="14" fontWeight="800">
        {center ?? total}
      </text>
      <text x="50" y="57" textAnchor="middle" dominantBaseline="middle"
        fontSize="5" className="fill-gray-400">total</text>
    </svg>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const EstudiantesContent: React.FC = () => {
  const { user, persona } = useAuthContext();
  const userName = persona 
    ? [persona.nombre1, persona.nombre2, persona.apellido1, persona.apellido2].filter(Boolean).join(' ')
    : (user?.persona 
        ? [user.persona.nombre1, user.persona.nombre2, user.persona.apellido1, user.persona.apellido2].filter(Boolean).join(' ')
        : 'Aprendiz');
  
  const [asistencia, setAsistencia] = useState<DashboardAsistencia | null>(null);
  const [actividades, setActividades] = useState<ActividadAprendiz[]>([]);
  const [loadingA, setLoadingA] = useState(true);
  const [loadingActs, setLoadingActs] = useState(true);

  // ── Fetch asistencias por área (usa usuario autenticado) ────────────────
  useEffect(() => {
    setLoadingA(true);
    axios.get('mis-asistencias-generales')
      .then((r) => {
        const rawData = r.data?.data ?? [];
        if (Array.isArray(rawData)) {
          // Transformar los datos raw al formato DashboardAsistencia
          const dashboardData = transformAsistenciasToDashboard(rawData);
          setAsistencia(dashboardData);
        } else {
          setAsistencia(null);
        }
      })
      .catch((error) => {
        console.error('Error fetching asistencias:', error);
        setAsistencia(null);
      })
      .finally(() => setLoadingA(false));
  }, []);

  // ── Fetch actividades del aprendiz ──────────────────────────────────────
  useEffect(() => {
    setLoadingActs(true);
    axios.get('actividades-aprendiz')
      .then((r) => {
        const d = r.data?.data ?? [];
        setActividades(Array.isArray(d) ? d : []);
      })
      .catch((error) => {
        console.error('Error fetching actividades:', error);
        setActividades([]);
      })
      .finally(() => setLoadingActs(false));
  }, []);

  // ── Derived: asistencia ─────────────────────────────────────────────────
  const resumen = asistencia?.resumen;
  const totalPresentes   = resumen?.totalAsistencias   ?? 0;
  const totalJustificadas = resumen?.totalJustificadas ?? 0;
  const totalAusentes      = resumen?.totalInasistencias ?? 0;
  const totalRegistros     = resumen?.totalRegistros     ?? 0;
  const pctGeneral         = resumen?.asistenciaGeneral  ?? 0;
  const areas              = asistencia?.areas ?? [];
  const detalles           = asistencia?.detalles ?? [];

  // ── Derived: actividades ────────────────────────────────────────────────
  const pendientes  = actividades.filter((a) => a.estadoVisual === 'PENDIENTE').length;
  const vencidas    = actividades.filter((a) => a.estadoVisual === 'SIN_ENTREGAR' && a.fechaVencida).length;
  const presentadas = actividades.filter((a) => a.estadoVisual === 'POR_EVALUAR').length;
  const calificadas = actividades.filter((a) => a.estadoVisual === 'CALIFICADO').length;

  const donutActs: DonutSlice[] = [
    { label: 'Calificado',   value: calificadas,  hexColor: '#16a34a' },
    { label: 'Por evaluar',  value: presentadas,  hexColor: '#d97706' },
    { label: 'Pendiente',    value: pendientes,   hexColor: '#9ca3af' },
    { label: 'Sin entregar', value: vencidas,     hexColor: '#dc2626' },
  ].filter((s) => s.value > 0);

  const donutAsistencia: DonutSlice[] = [
    { label: 'Presentes',    value: totalPresentes,    hexColor: '#2563eb' },
    { label: 'Justificadas', value: totalJustificadas, hexColor: '#10b981' },
    { label: 'Ausentes',     value: totalAusentes,     hexColor: '#dc2626' },
  ].filter((s) => s.value > 0);

  // Actividades a mostrar en alerta (solo pendientes, máx 5)
  const actAlerta = useMemo(() =>
    [...actividades]
      .filter((a) => a.estadoVisual === 'PENDIENTE')
      .slice(0, 5),
    [actividades]
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      <>
          {/* ══ HEADER PERSONALIZADO ═════════════════════════════════════ */}
          <header className="mb-2">
            <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight flex items-baseline gap-2">
              Dashboard de <span className="text-blue-600 dark:text-blue-400">Aprendiz</span>
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Bienvenido, <span className="text-gray-900 dark:text-gray-200 font-bold">{userName}</span>
            </p>
          </header>

          {/* ══ SECCIÓN ASISTENCIA ═══════════════════════════════════════ */}
           <section className="space-y-3">
            <h2 className="text-sm font-bold dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
              <span className="w-1 h-4 rounded-full bg-blue-600 inline-block" />
              Asistencia
            </h2>

            {/* Contenedor Grid Asistencia */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
              
              {/* KPI Asistencia */}
              <div className="lg:col-span-3 bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center border-r border-gray-50 dark:border-gray-800 last:border-0">
                    <p className="text-[10px] font-bold uppercase text-gray-400">Total</p>
                    <p className="text-2xl font-black text-gray-800 dark:text-white leading-none mt-1">{totalRegistros}</p>
                    <p className="text-[9px] mt-1 text-gray-400">sesiones</p>
                  </div>
                  <div className="text-center border-r border-gray-50 dark:border-gray-800 last:border-0 text-blue-600 dark:text-blue-400">
                    <p className="text-[10px] font-bold uppercase opacity-70">Presentes</p>
                    <p className="text-2xl font-black leading-none mt-1">{totalPresentes}</p>
                    <p className="text-[9px] mt-1 opacity-70">✅ registrados</p>
                  </div>
                  <div className="text-center border-r border-gray-50 dark:border-gray-800 last:border-0 text-emerald-600 dark:text-emerald-400">
                    <p className="text-[10px] font-bold uppercase opacity-70">Justificadas</p>
                    <p className="text-2xl font-black leading-none mt-1">{totalJustificadas}</p>
                    <p className="text-[9px] mt-1 opacity-70">🛡 avaladas</p>
                  </div>
                  <div className="text-center text-red-600 dark:text-red-400">
                    <p className="text-[10px] font-bold uppercase opacity-70">Ausencias</p>
                    <p className="text-2xl font-black leading-none mt-1">{totalAusentes}</p>
                    <p className="text-[9px] mt-1 opacity-70">❌ faltas</p>
                  </div>
                </div>
              </div>

              {/* Gráfica Asistencia */}
              <div className="lg:col-span-2 bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-6">
                <div className="shrink-0 relative">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-50 dark:text-gray-800" />
                    <circle cx="50" cy="50" r="40" fill="none"
                      stroke={pctGeneral >= 80 ? '#16a34a' : pctGeneral >= 60 ? '#d97706' : '#dc2626'}
                      strokeWidth="8"
                      strokeDasharray={`${(pctGeneral / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                      strokeDashoffset={2 * Math.PI * 40 / 4}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                    <text x="50" y="48" textAnchor="middle" dominantBaseline="middle" fill="currentColor" className="text-gray-900 dark:text-white font-black" fontSize="18">{pctGeneral}%</text>
                    <text x="50" y="62" textAnchor="middle" dominantBaseline="middle" fontSize="6" className="fill-gray-400 font-bold uppercase tracking-tighter">Tasa</text>
                  </svg>
                </div>
                <div className="flex-1 space-y-1">
                  {donutAsistencia.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-gray-500 font-semibold italic">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.hexColor }} />
                        {s.label}
                      </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══ SECCIÓN ACTIVIDADES ══════════════════════════════════════ */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
              <span className="w-1 h-4 rounded-full bg-amber-500 inline-block" />
              Actividades
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* KPI Actividades */}
              <div className="lg:col-span-3 bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <a href="/ambiente-virtual/actividades" className="text-center border-r border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-coal-300/50 transition-colors rounded-lg py-1">
                    <p className="text-[10px] font-bold uppercase text-gray-400">Pendientes</p>
                    <p className="text-2xl font-black text-gray-800 dark:text-white leading-none mt-1">{pendientes}</p>
                    <p className="text-[9px] mt-1 text-gray-400">⏳ por hacer</p>
                  </a>
                  <a href="/ambiente-virtual/actividades" className="text-center border-r border-gray-50 dark:border-gray-800 last:border-0 text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-coal-300/50 transition-colors rounded-lg py-1">
                    <p className="text-[10px] font-bold uppercase opacity-70">Vencidas</p>
                    <p className="text-2xl font-black leading-none mt-1">{vencidas}</p>
                    <p className="text-[9px] mt-1 opacity-70">🚨 sin entrega</p>
                  </a>
                  <a href="/ambiente-virtual/actividades" className="text-center border-r border-gray-50 dark:border-gray-800 last:border-0 text-amber-600 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-coal-300/50 transition-colors rounded-lg py-1">
                    <p className="text-[10px] font-bold uppercase opacity-70">Entregadas</p>
                    <p className="text-2xl font-black leading-none mt-1">{presentadas}</p>
                    <p className="text-[9px] mt-1 opacity-70">📤 por evaluar</p>
                  </a>
                  <a href="/ambiente-virtual/actividades" className="text-center text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-coal-300/50 transition-colors rounded-lg py-1">
                    <p className="text-[10px] font-bold uppercase opacity-70">Calificadas</p>
                    <p className="text-2xl font-black leading-none mt-1">{calificadas}</p>
                    <p className="text-[9px] mt-1 opacity-70">🏅 revisadas</p>
                  </a>
                </div>
              </div>

              {/* Gráfica Actividades (Gauge circular igual a asistencia) */}
              <div className="lg:col-span-2 bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-6">
                 <div className="shrink-0 relative">
                   {/* Usamos el porcentaje de calificadas como métrica de éxito similar al gauge de asistencia */}
                   {(() => {
                     const totalActs = actividades.length || 1;
                     const pctCalificadas = Math.round((calificadas / totalActs) * 100);
                     return (
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-50 dark:text-gray-800" />
                        <circle cx="50" cy="50" r="40" fill="none"
                          stroke="#16a34a"
                          strokeWidth="8"
                          strokeDasharray={`${(pctCalificadas / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                          strokeDashoffset={2 * Math.PI * 40 / 4}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                        <text x="50" y="48" textAnchor="middle" dominantBaseline="middle" fill="currentColor" className="text-gray-900 dark:text-white font-black" fontSize="18">{pctCalificadas}%</text>
                        <text x="50" y="62" textAnchor="middle" dominantBaseline="middle" fontSize="6" className="fill-gray-400 font-bold uppercase tracking-tighter">Éxito</text>
                      </svg>
                     );
                   })()}
                 </div>
                 <div className="flex-1 space-y-1">
                   {donutActs.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-gray-500 font-semibold italic">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.hexColor }} />
                        {s.label}
                      </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">{s.value}</span>
                    </div>
                  ))}
                 </div>
              </div>
            </div>

            {/* Pendientes - Lista refinada */}
            {actAlerta.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">⚠️ Próximas a vencer</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {actAlerta.map((act) => {
                    const cfg = ESTADO_CFG[act.estadoVisual] ?? ESTADO_CFG['PENDIENTE'];
                    return (
                      <a 
                        key={act.idCalificacionActividad}
                        href="ambiente-virtual/actividades"
                        className="group flex flex-col p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-coal-400 hover:border-amber-400 dark:hover:border-amber-500 transition-all hover:shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.chip}`}>
                            {cfg.label}
                          </span>
                          {act.fechaFinal && (
                            <span className="text-[9px] font-bold text-gray-400 group-hover:text-amber-600 transition-colors">
                              📅 {fmtFecha(act.fechaFinal)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-1 mb-0.5">{act.tituloActividad}</p>
                        <p className="text-[10px] text-gray-400 italic font-medium truncate">
                          {act.area?.nombre || act.materia?.nombreMateria || 'General'}
                        </p>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
      </>
    </div>
  );
};

export default EstudiantesContent;
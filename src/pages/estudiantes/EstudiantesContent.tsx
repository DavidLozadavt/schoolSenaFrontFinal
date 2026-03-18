import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

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

  // Actividades a mostrar en alerta (pendientes + vencidas, máx 5)
  const actAlerta = useMemo(() =>
    [...actividades]
      .filter((a) => a.estadoVisual === 'PENDIENTE' || (a.estadoVisual === 'SIN_ENTREGAR' && a.fechaVencida))
      .slice(0, 5),
    [actividades]
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-8 min-h-screen bg-gray-50 dark:bg-coal-500">
      <>
          {/* ══ SECCIÓN ASISTENCIA ═══════════════════════════════════════ */}
          <section className="space-y-4">
            <h2 className="text-base font-extrabold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-blue-600 inline-block" />
              Asistencia
            </h2>

            {/* KPIs asistencia */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard icon="✅" label="Presentes" value={totalPresentes} sub="asistidas"
                bg="bg-blue-100 dark:bg-blue-900/30" text="text-blue-700 dark:text-blue-300"
                border="border-blue-600 dark:border-blue-500" />
              <KpiCard icon="🛡" label="Justificadas" value={totalJustificadas} sub="excusadas"
                bg="bg-emerald-100 dark:bg-emerald-900/30" text="text-emerald-700 dark:text-emerald-300"
                border="border-emerald-600 dark:border-emerald-500" />
              <KpiCard icon="❌" label="Ausencias" value={totalAusentes} sub="sin excusa"
                bg="bg-red-100 dark:bg-red-900/20" text="text-red-700 dark:text-red-300"
                border="border-red-500 dark:border-red-400" />
              <KpiCard icon="📋" label="Total" value={totalRegistros} sub="registradas"
                bg="bg-gray-100 dark:bg-gray-800" text="text-gray-700 dark:text-gray-300"
                border="border-gray-500 dark:border-gray-400" />
              <KpiCard icon="📊" label="% Asistencia" value={`${pctGeneral}%`}
                sub={pctGeneral >= 80 ? '¡Excelente!' : pctGeneral >= 60 ? 'Puede mejorar' : '⚠ Riesgo'}
                bg={pctGeneral >= 80 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}
                text={pctGeneral >= 80 ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}
                border={pctGeneral >= 80 ? 'border-green-600 dark:border-green-500' : 'border-orange-500 dark:border-orange-400'} />
            </div>

            {/* Gráficas asistencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Donut asistencia general + gauge */}
              <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-5 flex flex-col items-center gap-4">
                <h3 className="self-start text-sm font-semibold text-gray-900 dark:text-white uppercase">
                  🎯 Tasa general de asistencia
                </h3>

                {/* Gauge circular */}
                <div className="relative flex items-center justify-center">
                  <svg width="150" height="150" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="12"
                      className="text-gray-100 dark:text-gray-700" />
                    <circle cx="50" cy="50" r="38" fill="none"
                      stroke={pctGeneral >= 80 ? '#16a34a' : pctGeneral >= 60 ? '#d97706' : '#dc2626'}
                      strokeWidth="12"
                      strokeDasharray={`${(pctGeneral / 100) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                      strokeDashoffset={2 * Math.PI * 38 / 4}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                    <text x="50" y="45" textAnchor="middle" dominantBaseline="middle"
                      fill={pctGeneral >= 80 ? '#16a34a' : pctGeneral >= 60 ? '#d97706' : '#dc2626'}
                      fontSize="16" fontWeight="800">{pctGeneral}%</text>
                    <text x="50" y="57" textAnchor="middle" dominantBaseline="middle"
                      fontSize="5" className="fill-gray-400">asistencia</text>
                  </svg>
                </div>

                {totalRegistros === 0
                  ? <p className="text-xs text-gray-400">Sin sesiones registradas aún</p>
                  : (
                    <ul className="w-full space-y-1.5">
                      {donutAsistencia.map((s, i) => (
                        <li key={i} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.hexColor }} />
                            <span className="text-gray-600 dark:text-gray-300 font-semibold">{s.label}</span>
                          </span>
                          <span className="font-extrabold text-gray-800 dark:text-white">{s.value}</span>
                        </li>
                      ))}
                    </ul>
                  )
                }
              </div>

              {/* Asistencia por área */}
              <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase mb-4">
                  📚 Asistencia por área
                </h3>
                {areas.length === 0
                  ? <p className="text-center text-gray-400 text-xs py-10">Sin datos por área aún</p>
                  : (
                    <div className="space-y-3">
                      {areas.map((area) => (
                        <div key={area.idArea}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-300 font-medium truncate max-w-[180px]">
                              {area.nombreArea}
                            </span>
                            <span className={`font-extrabold ml-2 ${area.porcentaje >= 80 ? 'text-green-600 dark:text-green-400' : area.porcentaje >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                              {area.porcentaje}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-700 ${area.porcentaje >= 80 ? 'bg-green-500' : area.porcentaje >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                              style={{ width: `${area.porcentaje}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {area.asistencias} presentes · {area.inasistencias} ausencias · {area.justificadas} justificadas
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>

            {/* Nuevo: Detalle de clases recientes */}
            <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden">
               <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-coal-500/50">
                  <h3 className="text-sm font-extrabold text-gray-800 dark:text-white uppercase flex items-center gap-2">
                    📅 Historial de Asistencia Reciente
                  </h3>
                  <span className="text-[10px] text-gray-400 bg-white dark:bg-coal-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm">
                    Últimas {detalles.length} sesiones
                  </span>
               </div>
               {detalles.length === 0 ? (
                 <div className="p-10 text-center text-gray-400 text-xs italic">
                    No hay registros detallados disponibles.
                 </div>
               ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] uppercase text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-coal-500/30">
                      <tr>
                        <th className="px-4 py-2 font-bold">Fecha</th>
                        <th className="px-4 py-2 font-bold">Clase / Materia</th>
                        <th className="px-4 py-2 font-bold">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {detalles.slice(0, 10).map((reg) => (
                        <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-coal-300/50 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 font-medium font-mono">
                            {fmtFecha(reg.fecha)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-800 dark:text-white font-bold">
                            {reg.nombreMateria}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                              reg.asistio 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                : reg.estaJustificada 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {reg.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {detalles.length > 10 && (
                    <div className="p-2 text-center border-t border-gray-100 dark:border-gray-700 bg-gray-50/20">
                      <p className="text-[10px] text-gray-400 italic">Mostrando solo las 10 sesiones más recientes</p>
                    </div>
                  )}
                </div>
               )}
            </div>
          </section>

          {/* ══ SECCIÓN ACTIVIDADES ══════════════════════════════════════ */}
          <section className="space-y-4">
            <h2 className="text-base font-extrabold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-amber-500 inline-block" />
              Actividades
            </h2>

            {/* KPIs actividades */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon="⏳" label="Pendientes" value={pendientes} sub="por responder"
                bg="bg-gray-100 dark:bg-gray-800" text="text-gray-700 dark:text-gray-300"
                border="border-gray-500 dark:border-gray-400" />
              <KpiCard icon="🚨" label="Vencidas" value={vencidas} sub="sin entregar"
                bg="bg-red-100 dark:bg-red-900/20" text="text-red-700 dark:text-red-300"
                border="border-red-500 dark:border-red-400" />
              <KpiCard icon="📤" label="Presentadas" value={presentadas} sub="por calificar"
                bg="bg-amber-100 dark:bg-amber-900/30" text="text-amber-700 dark:text-amber-300"
                border="border-amber-500 dark:border-amber-400" />
              <KpiCard icon="🏅" label="Calificadas" value={calificadas} sub="con nota"
                bg="bg-green-100 dark:bg-green-900/30" text="text-green-700 dark:text-green-300"
                border="border-green-600 dark:border-green-500" />
            </div>

            {/* Gráficas actividades */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Donut estados */}
              <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-5 flex flex-col items-center">
                <h3 className="self-start text-sm font-semibold text-gray-900 dark:text-white uppercase mb-4">
                  📝 Estado de actividades
                </h3>
                {actividades.length === 0
                  ? <p className="text-center text-gray-400 text-xs py-8">Sin actividades registradas</p>
                  : (
                    <>
                      <DonutChart slices={donutActs} center={actividades.length} />
                      <ul className="mt-3 space-y-1.5 w-full">
                        {donutActs.map((s, i) => (
                          <li key={i} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.hexColor }} />
                              <span className="text-gray-600 dark:text-gray-300 font-semibold">{s.label}</span>
                            </span>
                            <span className="font-extrabold text-gray-800 dark:text-white">{s.value}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )
                }
              </div>

              {/* Pendientes y vencidas */}
              <div className="md:col-span-2 bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase mb-4">
                  ⚠️ Pendientes y vencidas
                </h3>
                {actAlerta.length === 0
                  ? (
                    <div className="text-center py-10">
                      <span className="text-4xl">🎉</span>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mt-2">¡Todo al día!</p>
                      <p className="text-gray-400 text-xs mt-1">No tienes actividades pendientes ni vencidas</p>
                    </div>
                  )
                  : (
                    <div className="space-y-2.5">
                      {actAlerta.map((act) => {
                        const cfg = ESTADO_CFG[act.estadoVisual] ?? ESTADO_CFG['PENDIENTE'];
                        const isVen = act.estadoVisual === 'SIN_ENTREGAR' && act.fechaVencida;
                        return (
                          <div key={act.idCalificacionActividad}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              isVen
                                ? 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-coal-300'
                            }`}>
                            <div className={`w-1 self-stretch rounded-full shrink-0 ${isVen ? 'bg-red-500' : 'bg-gray-400'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                                {act.tituloActividad}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {act.area?.nombre || act.materia?.nombreMateria || 'Sin área'}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              {act.fechaFinal && (
                                <p className={`text-xs font-semibold ${isVen ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {isVen ? '🚨 ' : '📅 '}{fmtFecha(act.fechaFinal)}
                                </p>
                              )}
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${cfg.chip}`}>
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                }
              </div>
            </div>

            {/* Tabla completa */}
            {actividades.length > 0 && (
              <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase">
                    📋 Todas las actividades
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-coal-300">
                        {['Actividad', 'Área', 'Cierre', 'Estado', 'Nota'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {actividades.map((act) => {
                        const cfg = ESTADO_CFG[act.estadoVisual] ?? ESTADO_CFG['PENDIENTE'];
                        const nota = act.calificacionNumerica ? parseFloat(act.calificacionNumerica).toFixed(1) : null;
                        const isVen = act.estadoVisual === 'SIN_ENTREGAR' && act.fechaVencida;
                        return (
                          <tr key={act.idCalificacionActividad}
                            className="hover:bg-gray-50/60 dark:hover:bg-coal-300/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white max-w-[200px]">
                              <span className="line-clamp-2">{act.tituloActividad}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[140px]">
                              <span className="line-clamp-1">{act.area?.nombre || act.materia?.nombreMateria || '—'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${isVen ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                {fmtFecha(act.fechaFinal)}
                                {isVen && <span className="ml-1 text-[9px] font-bold uppercase text-red-500">vencida</span>}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${cfg.chip}`}>
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {nota
                                ? <span className={`font-extrabold text-sm ${parseFloat(nota) >= 3 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{nota}</span>
                                : <span className="text-gray-400">—</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
      </>
    </div>
  );
};

export default EstudiantesContent;
import React, { useState, useEffect } from 'react';
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

const ESTADO_CFG: Record<string, { label: string; chip: string; hex: string }> = {
  CALIFICADO:   { label: 'Calificado',   chip: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   hex: '#16a34a' },
  POR_EVALUAR:  { label: 'Por evaluar',  chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   hex: '#d97706' },
  PENDIENTE:    { label: 'Pendiente',    chip: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',           hex: '#9ca3af' },
  SIN_ENTREGAR: { label: 'Sin entregar', chip: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',            hex: '#dc2626' },
};

function fmtFecha(v?: string | null) {
  if (!v) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(v));
  } catch { return v; }
}

function transformGroupedToDashboard(groupedData: Record<string, any>): DashboardAsistencia {
  const areasMap: Record<string, AreaAsistencia> = {};
  const detalles: RegistroAsistencia[] = [];
  let totalAsistencias = 0;
  let totalInasistencias = 0;
  let totalRegistros = 0;

  Object.entries(groupedData).forEach(([clave, materiaData]) => {
    const resMateria = materiaData.resumen || { asistio:0, falto:0, totalSesiones:0 };
    const areaNombre = materiaData.areaConocimiento || 'Sin Área';

    if (!areasMap[areaNombre]) {
      areasMap[areaNombre] = {
        idArea: materiaData.idMateria || 0,
        nombreArea: areaNombre,
        asistencias: 0,
        inasistencias: 0,
        justificadas: 0,
        total: 0,
        porcentaje: 0
      };
    }

    areasMap[areaNombre].asistencias += resMateria.asistio;
    areasMap[areaNombre].inasistencias += resMateria.falto;
    areasMap[areaNombre].total += resMateria.totalSesiones;

    totalAsistencias += resMateria.asistio;
    totalInasistencias += resMateria.falto;
    totalRegistros += resMateria.totalSesiones;

    const sessionList = materiaData.asistencias || [];
    sessionList.forEach((asist: any) => {
      detalles.push({
        id: asist.id,
        fecha: asist.fechaSesion || '',
        nombreMateria: materiaData.nombreMateria || 'Materia',
        asistio: !!asist.asistio,
        estaJustificada: asist.estado === 'Inasistencia Justificada',
        estado: asist.estado || ''
      });
    });
  });

  const areas = Object.values(areasMap).map(area => ({
    ...area,
    porcentaje: area.total > 0 ? Math.round((area.asistencias / area.total) * 100) : 0
  }));

  const asistenciaGeneral = totalRegistros > 0 ? Math.round((totalAsistencias / totalRegistros) * 100) : 0;

  return {
    areas,
    resumen: {
      asistenciaGeneral,
      totalAsistencias,
      totalInasistencias,
      totalJustificadas: 0,
      totalRegistros
    },
    detalles
  };
}

const EstudiantesContent: React.FC = () => {
  const { user, persona } = useAuthContext();
  const userName = persona 
    ? [persona.nombre1, persona.nombre2, persona.apellido1, persona.apellido2].filter(Boolean).join(' ')
    : (user?.persona 
        ? [user.persona.nombre1, user.persona.nombre2, user.persona.apellido1, user.persona.apellido2].filter(Boolean).join(' ')
        : 'Aprendiz');
  
  const [asistencia, setAsistencia] = useState<DashboardAsistencia | null>(null);
  const [groupedAsistencia, setGroupedAsistencia] = useState<Record<string, any>>({});
  const [actividades, setActividades] = useState<ActividadAprendiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resAsis, resActs] = await Promise.all([
          axios.get('mis-asistencias-generales'),
          axios.get('actividades-aprendiz')
        ]);
        
        const rawAsis = resAsis.data?.data ?? {};
        setGroupedAsistencia(rawAsis);
        setAsistencia(transformGroupedToDashboard(rawAsis));
        
        const rawActs = resActs.data?.data ?? [];
        setActividades(Array.isArray(rawActs) ? rawActs : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPresentes   = asistencia?.resumen.totalAsistencias ?? 0;
  const totalAusentes      = asistencia?.resumen.totalInasistencias ?? 0;
  const totalRegistros     = asistencia?.resumen.totalRegistros ?? 0;
  const pctGeneral         = asistencia?.resumen.asistenciaGeneral ?? 0;

  const pendientes  = actividades.filter((a) => a.estadoVisual === 'PENDIENTE').length;
  const vencidas    = actividades.filter((a) => a.estadoVisual === 'SIN_ENTREGAR' && a.fechaVencida).length;
  const presentadas = actividades.filter((a) => a.estadoVisual === 'POR_EVALUAR').length;
  const calificadas = actividades.filter((a) => a.estadoVisual === 'CALIFICADO').length;

  const actAlerta = actividades.filter(a => a.estadoVisual === 'PENDIENTE').sort((a,b) => {
    if(!a.fechaFinal) return 1;
    if(!b.fechaFinal) return -1;
    return new Date(a.fechaFinal).getTime() - new Date(b.fechaFinal).getTime();
  }).slice(0, 3);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 lg:p-6 space-y-8">
      {/* Bienvenida */}
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-xl font-extrabold text-gray-800 dark:text-white tracking-tight">¡Hola, {userName}! 👋</h1>
        <p className="text-sm text-gray-400 font-medium">Aquí tienes el resumen de tu proceso formativo hasta hoy.</p>
      </div>

      {/* KPIs Generales de Asistencia */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white dark:bg-coal-400 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">Resumen General</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Total</p>
                <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">{totalRegistros}</p>
              </div>
              <div className="text-center text-blue-600">
                <p className="text-[10px] font-bold uppercase opacity-70 mb-2 text-gray-400">Presentes</p>
                <p className="text-3xl font-black leading-none">{totalPresentes}</p>
              </div>
              <div className="text-center text-red-500">
                <p className="text-[10px] font-bold uppercase opacity-70 mb-2 text-gray-400">Faltas</p>
                <p className="text-3xl font-black leading-none">{totalAusentes}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-coal-400 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 flex items-center gap-8">
             <div className="shrink-0">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={pctGeneral >= 80 ? '#10b981' : '#f59e0b'} strokeWidth="8"
                    strokeDasharray={`${(pctGeneral/100) * 264} 264`}
                    strokeDashoffset="66" strokeLinecap="round" className="transition-all duration-1000" />
                  <text x="50" y="55" textAnchor="middle" className="fill-gray-900 dark:fill-white font-black text-2xl">{pctGeneral}%</text>
                </svg>
             </div>
             <div className="space-y-1">
                <p className="text-xs font-black dark:text-white uppercase">Nivel de Asistencia</p>
                <p className="text-[10px] text-gray-400 leading-tight">Mantenerte por arriba del 80% asegura que no pierdas competencias por inasistencia.</p>
             </div>
          </div>
        </div>

        {/* 📊 DESGLOSE POR MATERIA */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">📊 Desglose por Materia</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(groupedAsistencia).map(([key, data]: [string, any]) => {
              const res = data.resumen || {};
              const pct = res.porcentajeAsistencia || 0;
              const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
              
              return (
                <div key={key} className="bg-white dark:bg-coal-400 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      <h3 className="text-xs font-black text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight mb-1">{data.nombreMateria}</h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{data.areaConocimiento}</p>
                    </div>
                    <span className="text-xs font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">{pct}%</span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-5 overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Sesiones</p>
                      <p className="text-xs font-black dark:text-white">{res.totalSesiones}</p>
                    </div>
                    <div className="text-blue-600">
                      <p className="text-[8px] font-bold uppercase mb-0.5 opacity-60">Asistió</p>
                      <p className="text-xs font-black">{res.asistio}</p>
                    </div>
                    <div className="text-red-500">
                      <p className="text-[8px] font-bold uppercase mb-0.5 opacity-60">Faltó</p>
                      <p className="text-xs font-black">{res.falto}</p>
                    </div>
                  </div>

                  {res.justificadas > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center text-[10px]">
                      <span className="text-emerald-600 font-bold uppercase tracking-tighter">🛡 Justificadas</span>
                      <span className="font-black text-emerald-600">{res.justificadas}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Actividades */}
      <section className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Gestión de Actividades</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white dark:bg-coal-400 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Pendientes</p>
              <p className="text-2xl font-black">{pendientes}</p>
           </div>
           <div className="bg-white dark:bg-coal-400 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center text-red-500">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Vencidas</p>
              <p className="text-2xl font-black">{vencidas}</p>
           </div>
           <div className="bg-white dark:bg-coal-400 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center text-amber-500">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Por Evaluar</p>
              <p className="text-2xl font-black">{presentadas}</p>
           </div>
           <div className="bg-white dark:bg-coal-400 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center text-green-500">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Calificadas</p>
              <p className="text-2xl font-black">{calificadas}</p>
           </div>
        </div>

        {actAlerta.length > 0 && (
          <div className="space-y-4">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Próximos Vencimientos</p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {actAlerta.map(act => (
                  <a key={act.idCalificacionActividad} href="/ambiente-virtual/actividades" className="bg-white dark:bg-coal-400 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-500 transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${ESTADO_CFG[act.estadoVisual]?.chip}`}>
                         {ESTADO_CFG[act.estadoVisual]?.label}
                       </span>
                       <span className="text-[9px] font-bold text-gray-400">📅 {fmtFecha(act.fechaFinal)}</span>
                    </div>
                    <p className="text-xs font-black leading-tight line-clamp-2 mb-1">{act.tituloActividad}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase truncate">{act.materia?.nombreMateria || 'General'}</p>
                  </a>
                ))}
             </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default EstudiantesContent;
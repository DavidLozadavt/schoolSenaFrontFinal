import React from "react";
import Chart from "react-apexcharts"; 

const Icons = {
  Academic: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
};

export const DashboardCoordinador: React.FC = () => {
  const chartOptions: any = {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#1B84FF'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.1 } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { categories: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'], labels: { style: { colors: '#99A1B7' } } },
    yaxis: { labels: { style: { colors: '#99A1B7' } } },
    grid: { borderColor: 'rgba(153, 161, 183, 0.1)' }
  };

  const chartSeries = [{ name: 'Asistencia', data: [88, 94, 91, 95, 94] }];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-coal-500 p-6 lg:p-7.5 font-sans">
      
      {/* HEADER - Ahora a ancho completo */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-7.5 gap-4">
        <div>
          <h1 className="text-2.5xl font-bold text-gray-900 dark:text-gray-800 tracking-tight">
            Dashboard Coordinador
          </h1>
          <p className="mt-1 font-medium text-gray-500 text-2sm">
            Edu-Care Sede Principal <span className="mx-1.25 text-gray-300">|</span> Período 2025 <span className="mx-1.25 text-gray-300">|</span> <span className="font-semibold text-primary">Jornada Mañana</span>
          </p>
        </div>
       {/*  <div className="flex gap-2.75">
          <button className="text-gray-700 bg-white border border-gray-200 btn btn-sm dark:bg-coal-300 dark:border-coal-100 dark:text-gray-400 shadow-light">
            Filtrar Sede
          </button>
          <button className="btn btn-sm btn-primary shadow-primary">
            Nueva Circular
          </button>
        </div>*/}
      </header>

      {/* KPIs (Sección A) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7.5 mb-7.5">
        {[
          { title: "Clases Hoy", value: "42", icon: Icons.Calendar, color: "text-primary", bg: "bg-primary-light" },
          { title: "Asistencia Hoy", value: "94%", icon: Icons.Users, color: "text-success", bg: "bg-success-light" },
          { title: "Docentes sin Reporte", value: "03", icon: Icons.Alert, color: "text-danger", bg: "bg-danger-light" },
          { title: "Estudiantes en Riesgo", value: "18", icon: Icons.Academic, color: "text-warning", bg: "bg-warning-light" },
        ].map((kpi) => (
          <div key={kpi.title} className="bg-white dark:bg-coal-300 p-7.5 rounded-xl shadow-card border border-gray-200 dark:border-coal-100 transition-all hover:scale-105">
            <div className={`w-10 h-10 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-4.5`}>
              <kpi.icon />
            </div>
            <div className="flex flex-col">
              <span className="text-2.5xl font-bold text-gray-900 dark:text-white leading-none mb-1.25">{kpi.value}</span>
              <span className="font-bold tracking-widest text-gray-500 uppercase text-2xs">{kpi.title}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ALERTAS OPERATIVAS (Sección B) */}
      <section className="mb-7.5">
        <h2 className="text-md font-bold text-gray-800 dark:text-gray-100 mb-4.5">Pendientes de Gestión</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5">
          <AlertCard title="Grupos sin planilla" value={5} type="danger" />
          <AlertCard title="Evaluaciones pendientes" value={8} type="warning" />
          <AlertCard title="Casos de convivencia" value={2} type="danger" />
          <AlertCard title="Inasistencia recurrente" value={10} type="warning" />
        </div>
      </section>

      {/* CONTROL ACADÉMICO + CALENDARIO (Sección C) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-7.5 mb-7.5">
        
        {/* GRÁFICA DE ASISTENCIA SEMANAL */}
        <div className="bg-white dark:bg-coal-300 p-7.5 rounded-xl shadow-card border border-gray-200 dark:border-coal-100 lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-md dark:text-white">Tendencia</h3>
            <span className="px-2 py-1 font-bold rounded text-2xs text-success bg-success-light">Semana Actual</span>
          </div>
          <Chart options={chartOptions} series={chartSeries} type="area" height={220} />
        </div>

        {/* ASISTENCIA POR GRADO */}
        <div className="bg-white dark:bg-coal-300 p-7.5 rounded-xl shadow-card border border-gray-200 dark:border-coal-100 lg:col-span-1">
          <div className="flex justify-between items-center mb-6.5">
            <h3 className="font-bold text-gray-900 text-md dark:text-white">Asistencia por Grado</h3>
            <span className="font-bold uppercase cursor-pointer text-primary text-2xs hover:underline">Ver Reporte</span>
          </div>
          <div className="space-y-6">
            {[
              { label: "Grado 6° A", p: 92, color: "bg-success" },
              { label: "Grado 7° B", p: 85, color: "bg-primary" },
              { label: "Grado 8° C", p: 68, color: "bg-danger" },
              { label: "Grado 9° A", p: 95, color: "bg-success" }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-2 font-semibold text-2sm">
                  <span className="text-gray-700 dark:text-gray-400">{item.label}</span>
                  <span className="text-gray-500">{item.p}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-coal-200 rounded-progress overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.p}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MINI CALENDARIO (Ahora debajo de la línea del header, a la derecha) */}
        <div className="flex flex-col justify-center p-6 bg-white border border-gray-200 dark:bg-coal-300 rounded-xl shadow-card dark:border-coal-100 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold tracking-wider text-gray-800 uppercase dark:text-white">Marzo 2025</span>
            <div className="flex gap-2">
              <span className="p-1.5 text-gray-400 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-coal-200 transition-colors">‹</span>
              <span className="p-1.5 text-gray-400 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-coal-200 transition-colors">›</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2 font-bold text-center text-gray-400 uppercase text-4xs">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="py-1">{d}</div>)}
            {[...Array(31)].map((_, i) => (
              <div key={i} className={`py-2 text-2sm rounded-md transition-all cursor-pointer hover:bg-primary-light hover:text-primary ${i + 1 === 12 ? 'bg-primary text-white shadow-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACCIONES RÁPIDAS (Sección D) */}
      <section className="bg-white dark:bg-coal-300 p-7.5 rounded-xl shadow-card border border-gray-200 dark:border-coal-100">
        <h2 className="mb-6 font-bold tracking-widest text-gray-400 uppercase text-2xs">Acciones de Gestión</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4.5">
          {["Caso Convivencia", "Abrir Seguimiento", "Exportar Riesgo", "Listados"].map((label) => (
            <button key={label} className="flex flex-col items-center justify-center p-4.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-coal-100 text-gray-600 dark:text-gray-400 font-bold text-2sm hover:bg-primary-light hover:border-primary hover:text-primary transition-all gap-2">
              <span className="text-lg">⊕</span>
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const AlertCard = ({ title, value, type }: { title: string; value: number; type: 'danger' | 'warning' }) => {
  const styles = {
    danger: "bg-danger-light text-danger border-danger-clarity",
    warning: "bg-warning-light text-warning-active border-warning-clarity"
  };

  return (
    <div className={`${styles[type]} p-5 rounded-xl border flex flex-col justify-between hover:scale-105 cursor-pointer transition-all duration-300`}>
      <span className="mb-2 font-bold tracking-wider uppercase text-2xs opacity-90">{title}</span>
      <div className="flex items-end justify-between">
        <span className="text-2.5xl font-black">{value}</span>
        <span className="text-4xs font-bold bg-white dark:bg-black dark:bg-opacity-20 bg-opacity-40 px-1.75 py-0.75 rounded uppercase shadow-sm">
          Atender
        </span>
      </div>
    </div>
  );
};

export default DashboardCoordinador;
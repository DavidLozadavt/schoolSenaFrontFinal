import React from 'react';
import Chart from 'react-apexcharts';

const Icons = {
  School: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3l9 5-9 5-9-5 9-5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5 10v6a7 7 0 0014 0v-6"
      />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5-2M9 20H4v-2a3 3 0 015-2M12 7a4 4 0 110 8 4 4 0 010-8z"
      />
    </svg>
  ),
  Alert: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 3v18h18M9 17V9M13 17V5M17 17v-7"
      />
    </svg>
  )
};

export const DashboardRector: React.FC = () => {
  const chartOptions: any = {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#1B84FF'],
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.1 }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
      labels: { style: { colors: '#99A1B7' } }
    },
    yaxis: { labels: { style: { colors: '#99A1B7' } } },
    grid: { borderColor: 'rgba(153,161,183,0.1)' }
  };

  const chartSeries = [{ name: 'Asistencia General', data: [89, 91, 93, 92, 94] }];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-coal-500 p-6 lg:p-7.5 font-sans">
      {/* HEADER */}
      <header className="mb-7.5">
        <h1 className="text-2.5xl font-bold text-gray-900 dark:text-white">Dashboard Rectoría</h1>
        <p className="mt-1 text-gray-500 font-medium text-2sm">
          Institución Educativa Edu-Care · Año Lectivo 2026
        </p>
      </header>

      {/* KPIs INSTITUCIONALES */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7.5 mb-7.5">
        {[
          {
            title: 'Estudiantes Totales',
            value: '1.284',
            icon: Icons.Users,
            bg: 'bg-primary-light',
            color: 'text-primary'
          },
          {
            title: 'Docentes Activos',
            value: '72',
            icon: Icons.School,
            bg: 'bg-success-light',
            color: 'text-success'
          },
          {
            title: 'Casos Críticos',
            value: '6',
            icon: Icons.Alert,
            bg: 'bg-danger-light',
            color: 'text-danger'
          },
          {
            title: 'Asistencia Promedio',
            value: '94%',
            icon: Icons.Chart,
            bg: 'bg-warning-light',
            color: 'text-warning'
          }
        ].map((kpi) => (
          <div
            key={kpi.title}
            className="bg-white dark:bg-coal-300 p-7.5 rounded-xl shadow-card border border-gray-200 dark:border-coal-100 hover:scale-105 transition-all"
          >
            <div
              className={`w-10 h-10 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-4`}
            >
              <kpi.icon />
            </div>
            <span className="text-2.5xl font-bold text-gray-900 dark:text-white">{kpi.value}</span>
            <span className="block mt-1 text-gray-500 font-bold uppercase text-2xs tracking-widest">
              {kpi.title}
            </span>
          </div>
        ))}
      </section>

      {/* GRÁFICA + ALERTAS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-7.5 mb-7.5">
        {/* TENDENCIA GENERAL */}
        <div className="bg-white dark:bg-coal-300 p-7.5 rounded-xl shadow-card border dark:border-coal-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-md text-gray-900 dark:text-white">
              Tendencia Institucional
            </h3>
            <span className="text-success text-2xs font-bold bg-success-light px-2 py-1 rounded">
              Año Actual
            </span>
          </div>
          <Chart options={chartOptions} series={chartSeries} type="area" height={240} />
        </div>

        {/* ALERTAS CLAVE */}
        <div className="space-y-4">
          <RectorAlert title="Riesgo Académico Alto" value={14} />
          <RectorAlert title="Convivencia Escalada" value={3} />
          <RectorAlert title="Grupos sin Seguimiento" value={5} />
        </div>
      </section>

      {/* ACCIONES ESTRATÉGICAS */}
      <section className="bg-white dark:bg-coal-300 p-7.5 rounded-xl shadow-card border dark:border-coal-100">
        <h2 className="mb-6 font-bold tracking-widest text-gray-400 uppercase text-2xs">
          Acciones Estratégicas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4.5">
          {['Ver Informes', 'Plan de Mejora', 'Seguimiento Casos', 'Exportar Datos'].map((a) => (
            <button
              key={a}
              className="p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-coal-100
              font-bold text-2sm text-gray-600 dark:text-gray-400
              hover:bg-primary-light hover:border-primary hover:text-primary transition-all"
            >
              {a}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const RectorAlert = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-danger-light text-danger p-5 rounded-xl border border-danger-clarity hover:scale-105 transition-all">
    <span className="block font-bold uppercase text-2xs tracking-wider mb-1">{title}</span>
    <span className="text-2.5xl font-black">{value}</span>
  </div>
);

export default DashboardRector;

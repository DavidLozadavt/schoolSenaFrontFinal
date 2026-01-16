import React from 'react';
import {
  Calendar,
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

/* ===== DATA MOCK ===== */

const upcomingEvents = [
  {
    id: 1,
    title: 'Robot Fest',
    description: 'Feria de tecnología',
    date: '14 Dic 2025',
    time: '10:00 am'
  },
  {
    id: 2,
    title: 'Webinar Minecraft',
    description: 'Nuevas herramientas educativas',
    date: '21 Dic 2025',
    time: '11:00 am'
  }
];

const todayClasses = [
  {
    id: 1,
    subject: 'Programación',
    hour: '08:00 - 09:30',
    teacher: 'Ing. Carlos Pérez',
    status: 'En curso',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  },
  {
    id: 2,
    subject: 'Matemáticas',
    hour: '10:00 - 11:30',
    teacher: 'Lic. Ana Gómez',
    status: 'Próxima',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  }
];

const kpis = [
  {
    label: 'Promedio',
    value: '4.2',
    icon: TrendingUp,
    color: 'text-indigo-600 dark:text-indigo-400'
  },
  {
    label: 'Asistencia',
    value: '92%',
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    label: 'Materias',
    value: '6',
    icon: BookOpen,
    color: 'text-cyan-600 dark:text-cyan-400'
  },
  {
    label: 'Pendientes',
    value: '3',
    icon: AlertTriangle,
    color: 'text-orange-500 dark:text-orange-400'
  }
];

const tasks = [
  {
    id: 1,
    title: 'Tarea Programación',
    subject: 'Programación',
    date: '20 Sep'
  },
  {
    id: 2,
    title: 'Parcial Matemáticas',
    subject: 'Matemáticas',
    date: '23 Sep'
  }
];

const subjects = [
  {
    id: 1,
    name: 'Programación',
    teacher: 'Carlos Pérez',
    avg: 4.5,
    progress: 80,
    status: 'Bien'
  },
  {
    id: 2,
    name: 'Matemáticas',
    teacher: 'Ana Gómez',
    avg: 3.6,
    progress: 60,
    status: 'Puede mejorar'
  },
  {
    id: 3,
    name: 'Física',
    teacher: 'Juan López',
    avg: 2.9,
    progress: 40,
    status: 'En riesgo'
  }
];

/* ===== COMPONENT ===== */

const EstudiantesDashboard = () => {
  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100">

      {/* ===== HEADER ===== */}
      <div className="rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            ¡Hola, Juan! 👋
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Grado 10° A · {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-lg
          bg-emerald-200 text-emerald-800
          dark:bg-emerald-900/30 dark:text-emerald-300 font-semibold">
          🟢 Al día
        </div>
      </div>

      {/* ===== GRID PRINCIPAL ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ===== CLASES DE HOY ===== */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">📚 Clases de hoy</h3>

          <div className="rounded-xl p-4
            bg-blue-100 text-blue-800
            dark:bg-blue-900/30 dark:text-blue-300">
            <h4 className="font-semibold">Programación</h4>
            <p className="text-sm opacity-90">Ing. Carlos Pérez</p>
            <div className="flex justify-between items-center mt-2 text-sm">
              <span>08:00 - 09:30</span>
              <span className="font-medium">En curso</span>
            </div>
          </div>

          <div className="rounded-xl p-4
            bg-emerald-100 text-emerald-800
            dark:bg-emerald-900/30 dark:text-emerald-300">
            <h4 className="font-semibold">Matemáticas</h4>
            <p className="text-sm opacity-90">Lic. Ana Gómez</p>
            <div className="flex justify-between items-center mt-2 text-sm">
              <span>10:00 - 11:30</span>
              <span className="font-medium">Próxima</span>
            </div>
          </div>
        </div>

        {/* ===== KPIs ===== */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Promedio', value: '4.2', color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Asistencia', value: '92%', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Materias', value: '6', color: 'text-cyan-600 dark:text-cyan-400' },
            { label: 'Pendientes', value: '3', color: 'text-orange-500 dark:text-orange-400' }
          ].map((kpi, i) => (
            <div
              key={i}
              className="rounded-xl p-6 shadow-sm
                bg-neutral-100 dark:bg-neutral-900
                border border-neutral-200 dark:border-neutral-700
                flex flex-col items-center">
              <span className={`text-2xl font-bold ${kpi.color}`}>
                {kpi.value}
              </span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {kpi.label}
              </span>
            </div>
          ))}
        </div>

        {/* ===== DERECHA ===== */}
        <div className="space-y-6">

          {/* Pendientes */}
          <div className="rounded-xl p-6
            bg-neutral-100 dark:bg-neutral-900
            border border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold mb-4">📅 Pendientes</h3>

            <div className="space-y-3">
              {['Tarea Programación', 'Parcial Matemáticas'].map((t, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3
                    bg-neutral-50 dark:bg-neutral-800
                    border border-neutral-200 dark:border-neutral-700">
                  <p className="font-medium">{t}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Programación · 20 Sep
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Eventos */}
          <div className="rounded-xl p-6
            bg-neutral-100 dark:bg-neutral-900
            border border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">🎉 Próximos eventos</h3>
              <span className="text-sm text-indigo-600 dark:text-indigo-400 cursor-pointer">
                Ver todos
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg
                  bg-indigo-200 text-indigo-800
                  dark:bg-indigo-900/30 dark:text-indigo-300
                  flex items-center justify-center font-semibold">
                  14
                </div>
                <div>
                  <p className="font-medium">Robot Fest</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Feria de tecnología
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ===== MIS ASIGNATURAS ===== */}
      <div>
        <h3 className="font-semibold text-lg mb-4">
          📘 Mis asignaturas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subjects.map(subject => (
            <div
              key={subject.id}
              className="
                rounded-xl p-4 shadow-sm
                bg-neutral-100 dark:bg-neutral-900
                border border-neutral-200 dark:border-neutral-700
              "
            >
              <h4 className="font-semibold">
                {subject.name}
              </h4>

              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                {subject.teacher}
              </p>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Promedio
                </span>
                <span className="font-semibold">
                  {subject.avg}
                </span>
              </div>

              <div className="w-full bg-neutral-300 dark:bg-neutral-700 rounded-full h-2 mb-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${subject.progress}%` }}
                />
              </div>

              <span
                className={`text-xs font-medium ${
                  subject.status === 'Bien'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : subject.status === 'Puede mejorar'
                    ? 'text-orange-500 dark:text-orange-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {subject.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default EstudiantesDashboard;
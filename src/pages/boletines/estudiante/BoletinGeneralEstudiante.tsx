import React from 'react';
import clsx from 'clsx';

// Tipos (reutilizados de tu código)
type EstadoBoletin = 'LISTO' | 'PENDIENTE' | 'SIN_NOTAS';
type EstadoAcademico = 'APROBADO' | 'EN_RIESGO' | 'REPROBADO';

interface EstudianteBoletin {
  idEstudiante: number;
  documento: string;
  nombre: string;
  email: string;
  asistencia: number;
  promedio: number;
  estadoAcademico: EstadoAcademico;
  estadoBoletin: EstadoBoletin;
  programa: string;
  jornada: string;
  codigoFicha: string;
}

// Configuración de colores y estilos (reutilizada)
const coloresAvatar = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
];

const obtenerColorAvatar = (id: number) => coloresAvatar[id % coloresAvatar.length];

const obtenerIniciales = (nombre: string): string => {
  const partes = nombre.trim().split(' ').filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
};

const configEstadoBoletin: Record<EstadoBoletin, { label: string; clases: string }> = {
  LISTO: { label: 'Listo', clases: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' },
  PENDIENTE: { label: 'Pendiente', clases: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' },
  SIN_NOTAS: { label: 'Sin notas', clases: 'bg-gray-100 dark:bg-coal-300 text-gray-700 dark:text-gray-300' },
};

const configEstadoAcademico: Record<EstadoAcademico, { label: string; clases: string }> = {
  APROBADO: { label: 'Aprobado', clases: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' },
  EN_RIESGO: { label: 'En riesgo', clases: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' },
  REPROBADO: { label: 'Reprobado', clases: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300' },
};

// Componente de barra de progreso
const BarraProgreso: React.FC<{ valor: number; className?: string }> = ({ valor, className }) => (
  <div className={clsx('h-2 rounded-full bg-gray-200 dark:bg-coal-200 overflow-hidden', className)}>
    <div
      className={clsx('h-full rounded-full transition-all duration-300', {
        'bg-green-500 dark:bg-green-400': valor >= 80,
        'bg-orange-400 dark:bg-orange-400': valor >= 60 && valor < 80,
        'bg-red-500 dark:bg-red-400': valor < 60,
      })}
      style={{ width: `${Math.min(valor, 100)}%` }}
    />
  </div>
);

// Componente principal
const BoletinGeneralEstudiante: React.FC = () => {
  // Datos quemados de un estudiante (ejemplo: Jorge Porras Sandoval)
  const estudiante: EstudianteBoletin = {
    idEstudiante: 303,
    documento: "3344556699",
    nombre: "Jorge Porras Sandoval",
    email: "jorge.porras@colegioejemplo.edu.co",
    asistencia: 70,
    promedio: 2.8,
    estadoAcademico: "REPROBADO",
    estadoBoletin: "SIN_NOTAS",
    programa: "Bachillerato - Grado 9°",
    jornada: "Mañana",
    codigoFicha: "BAC-9A",
  };

  const colores = obtenerColorAvatar(estudiante.idEstudiante);
  const estadoBoletin = configEstadoBoletin[estudiante.estadoBoletin];
  const estadoAcademico = configEstadoAcademico[estudiante.estadoAcademico];

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Boletín académico</p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reporte de desempeño</h1>
      </div>

      {/* Tarjeta principal del estudiante */}
      <div className="bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
        {/* Avatar y nombre */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div
              className={clsx(
                'flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold',
                colores.bg,
                colores.text
              )}
            >
              {obtenerIniciales(estudiante.nombre)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{estudiante.nombre}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                CC {estudiante.documento} • {estudiante.email}
              </p>
            </div>
          </div>
        </div>

        {/* Información académica */}
        <div className="p-6">
          {/* Ficha y programa */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ficha:</span>
              <span className="inline-flex text-sm font-medium px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {estudiante.codigoFicha}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Programa:</span> {estudiante.programa} • <span className="font-medium">Jornada:</span> {estudiante.jornada}
            </p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-coal-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Asistencia</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{estudiante.asistencia}%</span>
              </div>
              <BarraProgreso valor={estudiante.asistencia} />
            </div>
            <div className="bg-gray-50 dark:bg-coal-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Promedio</span>
                <span
                  className={clsx('text-lg font-bold', {
                    'text-green-700 dark:text-green-400': estudiante.promedio >= 4,
                    'text-orange-600 dark:text-orange-400': estudiante.promedio >= 3 && estudiante.promedio < 4,
                    'text-red-600 dark:text-red-400': estudiante.promedio < 3,
                  })}
                >
                  {estudiante.promedio.toFixed(1)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-coal-200">
                <div
                  className={clsx('h-full rounded-full', {
                    'bg-green-500 dark:bg-green-400': estudiante.promedio >= 4,
                    'bg-orange-400 dark:bg-orange-400': estudiante.promedio >= 3,
                    'bg-red-500 dark:bg-red-400': estudiante.promedio < 3,
                  })}
                  style={{ width: `${Math.min(estudiante.promedio * 20, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Estados */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase block mb-1">Estado académico</span>
              <span className={clsx('inline-flex text-sm font-medium px-3 py-1.5 rounded', estadoAcademico.clases)}>
                {estadoAcademico.label}
              </span>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase block mb-1">Estado boletín</span>
              <span className={clsx('inline-flex text-sm font-medium px-3 py-1.5 rounded', estadoBoletin.clases)}>
                {estadoBoletin.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones (opcional) */}
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-400 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-coal-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar PDF
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Enviar por correo
        </button>
      </div>
    </div>
  );
};

export default BoletinGeneralEstudiante;
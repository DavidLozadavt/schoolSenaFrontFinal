import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import clsx from 'clsx';
import BoletinViewModal from './BoletinViewModal';

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
}

interface FichaBoletin {
  idFicha: number;
  codigo: string;
  programa: string;
  jornada: string;
  totalEstudiantes: number;
  boletinesListos: number;
  estudiantes: EstudianteBoletin[];
}

interface ResumenBoletines {
  totalFichas: number;
  totalEstudiantes: number;
  totalListos: number;
  totalPendientes: number;
}

type FiltroEstado = 'todos' | 'listos' | 'pendientes';

// ─── Datos obtenidos desde la API ──────────────────────────

// ─── Normalización ────────────────────────────────────────────────────────────

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
};

const normalizarEstadoBoletin = (v: unknown): EstadoBoletin => {
  if (v === 'LISTO' || v === 'PENDIENTE' || v === 'SIN_NOTAS') return v;
  return 'PENDIENTE';
};

const normalizarEstadoAcademico = (v: unknown): EstadoAcademico => {
  if (v === 'APROBADO' || v === 'EN_RIESGO' || v === 'REPROBADO') return v;
  return 'EN_RIESGO';
};

const normalizarEstudiante = (raw: Record<string, unknown>): EstudianteBoletin => ({
  idEstudiante: toNum(raw.idEstudiante),
  documento: typeof raw.documento === 'string' ? raw.documento : '',
  nombre: typeof raw.nombre === 'string' ? raw.nombre : '',
  email: typeof raw.email === 'string' ? raw.email : '',
  asistencia: toNum(raw.asistencia),
  promedio: toNum(raw.promedio),
  estadoAcademico: normalizarEstadoAcademico(raw.estadoAcademico),
  estadoBoletin: normalizarEstadoBoletin(raw.estadoBoletin)
});

const normalizarFicha = (raw: Record<string, unknown>): FichaBoletin => ({
  idFicha: toNum(raw.idFicha),
  codigo: typeof raw.codigo === 'string' ? raw.codigo : '',
  programa: typeof raw.programa === 'string' ? raw.programa : '',
  jornada: typeof raw.jornada === 'string' ? raw.jornada : '',
  totalEstudiantes: toNum(raw.totalEstudiantes),
  boletinesListos: toNum(raw.boletinesListos),
  estudiantes: Array.isArray(raw.estudiantes)
    ? (raw.estudiantes as Record<string, unknown>[]).map(normalizarEstudiante)
    : []
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const obtenerIniciales = (nombre: string): string => {
  const partes = nombre.trim().split(' ').filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
};

const coloresAvatar = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' }
];

const obtenerColorAvatar = (id: number) => coloresAvatar[id % coloresAvatar.length];

const configEstadoBoletin: Record<EstadoBoletin, { label: string; icon: string; clases: string }> =
  {
    LISTO: {
      label: 'Listo',
      icon: 'check',
      clases:
        'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
    },
    PENDIENTE: {
      label: 'Pendiente',
      icon: 'time',
      clases:
        'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700'
    },
    SIN_NOTAS: {
      label: 'Sin notas',
      icon: 'lock',
      clases:
        'bg-gray-100 dark:bg-coal-300 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    }
  };

const configEstadoAcademico: Record<EstadoAcademico, { label: string; clases: string }> = {
  APROBADO: {
    label: 'Aprobado',
    clases: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
  },
  EN_RIESGO: {
    label: 'En riesgo',
    clases: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
  },
  REPROBADO: {
    label: 'Reprobado',
    clases: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
  }
};

const colorBarra = (pct: number): string => {
  if (pct >= 80) return 'bg-green-500 dark:bg-green-400';
  if (pct >= 60) return 'bg-orange-400 dark:bg-orange-400';
  return 'bg-red-500 dark:bg-red-400';
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: number | string;
  accent?: string;
}> = ({ label, value, accent }) => (
  <div className="bg-gray-50 dark:bg-coal-300 rounded-lg p-3">
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className={clsx('text-2xl font-semibold', accent ?? 'text-gray-900 dark:text-white')}>
      {value}
    </p>
  </div>
);

const BarraProgreso: React.FC<{ valor: number; className?: string }> = ({ valor, className }) => (
  <div
    className={clsx('h-1.5 rounded-full bg-gray-200 dark:bg-coal-200 overflow-hidden', className)}
  >
    <div
      className={clsx('h-full rounded-full transition-all duration-300', colorBarra(valor))}
      style={{ width: `${Math.min(valor, 100)}%` }}
    />
  </div>
);

const BadgeEstadoBoletin: React.FC<{ estado: EstadoBoletin }> = ({ estado }) => {
  const cfg = configEstadoBoletin[estado];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border',
        cfg.clases
      )}
    >
      <KeenIcon icon={cfg.icon} className="text-xs" />
      {cfg.label}
    </span>
  );
};

const BadgeEstadoAcademico: React.FC<{ estado: EstadoAcademico }> = ({ estado }) => {
  const cfg = configEstadoAcademico[estado];
  return (
    <span
      className={clsx('inline-flex items-center text-xs font-medium px-2 py-1 rounded', cfg.clases)}
    >
      {cfg.label}
    </span>
  );
};

// ─── Fila de estudiante ───────────────────────────────────────────────────────

const FilaEstudiante: React.FC<{
  estudiante: EstudianteBoletin;
  onVerBoletin: (id: number) => void;
  onDescargar: (id: number) => void;
}> = ({ estudiante, onVerBoletin, onDescargar }) => {
  const colores = obtenerColorAvatar(estudiante.idEstudiante);

  return (
    <div className="grid grid-cols-[2fr_1fr_80px_1fr_100px_72px] gap-3 items-center py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      {/* Estudiante */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={clsx(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
            colores.bg,
            colores.text
          )}
        >
          {obtenerIniciales(estudiante.nombre)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {estudiante.nombre}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">CC {estudiante.documento}</p>
        </div>
      </div>

      {/* Asistencia */}
      <div>
        <span className="text-sm text-gray-700 dark:text-gray-300">{estudiante.asistencia}%</span>
        <BarraProgreso valor={estudiante.asistencia} className="mt-1 w-14" />
      </div>

      {/* Promedio */}
      <span
        className={clsx('text-sm font-semibold', {
          'text-green-700 dark:text-green-400': estudiante.promedio >= 4,
          'text-orange-600 dark:text-orange-400':
            estudiante.promedio >= 3 && estudiante.promedio < 4,
          'text-red-600 dark:text-red-400': estudiante.promedio < 3
        })}
      >
        {estudiante.promedio.toFixed(1)}
      </span>

      {/* Estado académico */}
      <BadgeEstadoAcademico estado={estudiante.estadoAcademico} />

      {/* Estado boletín */}
      <BadgeEstadoBoletin estado={estudiante.estadoBoletin} />

      {/* Acciones */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-coal-300 text-gray-500 dark:text-gray-400 transition-colors"
          title="Ver boletín"
          onClick={() => onVerBoletin(estudiante.idEstudiante)}
        >
          <KeenIcon icon="eye" className="text-base" />
        </button>
      </div>
    </div>
  );
};

// ─── Card de ficha ────────────────────────────────────────────────────────────

const CardFicha: React.FC<{
  ficha: FichaBoletin;
  filtroEstado: FiltroEstado;
  busqueda: string;
  onVerBoletin: (idEstudiante: number) => void;
  onDescargar: (idEstudiante: number) => void;
  onEnviarMasivo: (idFicha: number) => void;
}> = ({ ficha, filtroEstado, busqueda, onVerBoletin, onDescargar, onEnviarMasivo }) => {
  const [expandida, setExpandida] = useState(false);
  const ITEMS_INICIALES = 5;

  const porcentajeListos =
    ficha.totalEstudiantes > 0
      ? Math.round((ficha.boletinesListos / ficha.totalEstudiantes) * 100)
      : 0;

  const estudiantesFiltrados = useMemo(() => {
    return ficha.estudiantes.filter((e) => {
      const coincideBusqueda =
        busqueda === '' ||
        e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.documento.includes(busqueda);

      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'listos' && e.estadoBoletin === 'LISTO') ||
        (filtroEstado === 'pendientes' && e.estadoBoletin !== 'LISTO');

      return coincideBusqueda && coincideEstado;
    });
  }, [ficha.estudiantes, busqueda, filtroEstado]);

  const estudiantesVisibles = expandida
    ? estudiantesFiltrados
    : estudiantesFiltrados.slice(0, ITEMS_INICIALES);

  const todosListos = ficha.boletinesListos === ficha.totalEstudiantes;

  return (
    <div className="bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
      {/* Encabezado ficha */}
      <div className="bg-gray-50 dark:bg-coal-300 px-4 py-3 flex items-center justify-between gap-3 flex-wrap border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2.5 min-w-0">
          <KeenIcon
            icon="people"
            className="text-base text-gray-500 dark:text-gray-400 flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {ficha.codigo}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              — {ficha.programa}
            </span>
          </div>
          <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex-shrink-0">
            {ficha.jornada}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-gray-200 dark:bg-coal-200 overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all', {
                  'bg-green-500 dark:bg-green-400': porcentajeListos === 100,
                  'bg-orange-400': porcentajeListos < 100
                })}
                style={{ width: `${porcentajeListos}%` }}
              />
            </div>
            <span
              className={clsx('text-xs', {
                'text-green-700 dark:text-green-400 font-medium': todosListos,
                'text-gray-500 dark:text-gray-400': !todosListos
              })}
            >
              {ficha.boletinesListos} / {ficha.totalEstudiantes} listos
              {todosListos && ' ✓'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setExpandida((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-400 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-300 transition-colors"
          >
            <KeenIcon icon="eye" className="text-xs" />
            {expandida ? 'Colapsar' : 'Ver todos'}
          </button>
        </div>
      </div>

      {/* Tabla de estudiantes */}
      {estudiantesVisibles.length > 0 ? (
        <div className="px-4">
          {/* Encabezados columnas */}
          <div className="grid grid-cols-[2fr_1fr_80px_1fr_100px_72px] gap-3 py-2 border-b border-gray-100 dark:border-gray-700">
            {['Estudiante', 'Asistencia', 'Promedio', 'Estado', 'Boletín', ''].map((h) => (
              <span
                key={h}
                className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
              >
                {h}
              </span>
            ))}
          </div>

          {estudiantesVisibles.map((estudiante) => (
            <FilaEstudiante
              key={estudiante.idEstudiante}
              estudiante={estudiante}
              onVerBoletin={onVerBoletin}
              onDescargar={onDescargar}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No se encontraron estudiantes con los filtros actuales.
          </p>
        </div>
      )}

      {/* Footer con "ver más" */}
      {estudiantesFiltrados.length > ITEMS_INICIALES && (
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-coal-300 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Mostrando {estudiantesVisibles.length} de {estudiantesFiltrados.length} estudiantes
          </span>
          <button
            type="button"
            onClick={() => setExpandida((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <KeenIcon icon={expandida ? 'arrow-up' : 'arrow-down'} className="text-xs" />
            {expandida ? 'Ver menos' : `Ver ${estudiantesFiltrados.length - ITEMS_INICIALES} más`}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const BoletinGeneralAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fichas, setFichas] = useState<FichaBoletin[]>([]);
  const [boletinAbierto, setBoletinAbierto] = useState<number | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [fichaSeleccionada, setFichaSeleccionada] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const fetchBoletines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<{ data: unknown[] }>('coordinador/boletines');
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setFichas(
        data
          .filter((item) => item && typeof item === 'object')
          .map((item) => normalizarFicha(item as Record<string, unknown>))
      );
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(
        axiosError?.response?.data?.error ??
          'No se pudieron cargar los boletines. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoletines();
  }, [fetchBoletines]);

  const resumen = useMemo<ResumenBoletines>(() => {
    const totalEstudiantes = fichas.reduce((acc, f) => acc + f.totalEstudiantes, 0);
    const totalListos = fichas.reduce((acc, f) => acc + f.boletinesListos, 0);
    return {
      totalFichas: fichas.length,
      totalEstudiantes,
      totalListos,
      totalPendientes: totalEstudiantes - totalListos
    };
  }, [fichas]);

  const fichasFiltradas = useMemo(() => {
    if (fichaSeleccionada === 'todas') return fichas;
    return fichas.filter((f) => String(f.idFicha) === fichaSeleccionada);
  }, [fichas, fichaSeleccionada]);

  const handleVerBoletin = useCallback((idEstudiante: number) => {
    setBoletinAbierto(idEstudiante);
  }, []);

  const handleDescargar = useCallback(async (idEstudiante: number) => {
    try {
      const response = await axios.get(`coordinador/boletines/${idEstudiante}/pdf`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `boletin_${idEstudiante}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error('Error al descargar PDF del estudiante:', idEstudiante);
    }
  }, []);

  const handleEnviarMasivo = useCallback(async (idFicha: number) => {
    try {
      await axios.post(`coordinador/boletines/ficha/${idFicha}/enviar`);
    } catch {
      console.error('Error al enviar boletines de ficha:', idFicha);
    }
  }, []);

  const handleExportarGeneral = useCallback(async () => {
    try {
      const response = await axios.get('coordinador/boletines/exportar', {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'boletines_general.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error('Error al exportar boletines');
    }
  }, []);

  // ─── Estados de carga / error / vacío ──────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando boletines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <KeenIcon
          icon="cross-circle"
          className="text-4xl text-red-400 dark:text-red-500 mx-auto mb-3"
        />
        <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
          Error al cargar los boletines
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchBoletines}
          className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-coal-300 transition-colors"
        >
          <KeenIcon icon="arrows-circle" className="text-base" />
          Reintentar
        </button>
      </div>
    );
  }

  if (fichas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <KeenIcon
          icon="document"
          className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-3"
        />
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          No hay boletines disponibles
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Aún no se han generado boletines para este periodo.
        </p>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="print:hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Panel de coordinación</p>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white uppercase">
              Boletines de estudiantes
            </h1>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total fichas" value={resumen.totalFichas} />
          <StatCard label="Estudiantes" value={resumen.totalEstudiantes} />
          <StatCard
            label="Boletines listos"
            value={resumen.totalListos}
            accent="text-green-700 dark:text-green-400"
          />
          <StatCard
            label="Pendientes"
            value={resumen.totalPendientes}
            accent="text-orange-600 dark:text-orange-400"
          />
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <KeenIcon
              icon="magnifier"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-coal-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500"
            />
          </div>

          {/* Selector de ficha */}
          <select
            value={fichaSeleccionada}
            onChange={(e) => setFichaSeleccionada(e.target.value)}
            className="text-sm py-2 pl-3 pr-8 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-coal-300 text-gray-900 dark:text-white focus:outline-none focus:border-blue-400 dark:focus:border-blue-500"
          >
            <option value="todas">Todas las fichas</option>
            {fichas.map((f) => (
              <option key={f.idFicha} value={String(f.idFicha)}>
                {f.codigo} — {f.programa}
              </option>
            ))}
          </select>

          {/* Tabs de estado */}
          <div className="flex items-center gap-1 ml-auto">
            {(
              [
                { key: 'todos', label: 'Todos' },
                { key: 'listos', label: 'Listos' },
                { key: 'pendientes', label: 'Pendientes' }
              ] as { key: FiltroEstado; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFiltroEstado(key)}
                className={clsx(
                  'text-xs font-medium px-3 py-1.5 rounded transition-colors',
                  filtroEstado === key
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-coal-300'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de fichas */}
        <div className="space-y-3">
          {fichasFiltradas.map((ficha) => (
            <CardFicha
              key={ficha.idFicha}
              ficha={ficha}
              filtroEstado={filtroEstado}
              busqueda={busqueda}
              onVerBoletin={handleVerBoletin}
              onDescargar={handleDescargar}
              onEnviarMasivo={handleEnviarMasivo}
            />
          ))}
        </div>
      </div>
      <BoletinViewModal
        idEstudiante={boletinAbierto}
        open={boletinAbierto !== null}
        onClose={() => setBoletinAbierto(null)}
      />
    </div>
  );
};

export default BoletinGeneralAdmin;

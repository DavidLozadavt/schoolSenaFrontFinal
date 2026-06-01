import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { KeenIcon, ImageZoomModal } from '@/components';
import { MisActividadesAvatarFallback } from '@/components/user/MisActividadesAvatarFallback';
import ModalAprendices from './ModalAprendices';
import type { Actividad } from './ModalCrearActividad';
import {
  compactReactSelectClassNames,
  compactReactSelectNoOptions
} from '@/components/forms/compactReactSelect';

export interface ActividadInstructorResumen {
  idActividad: number;
  titulo: string;
  descripcion?: string | null;
  idFicha: number;
  codigoFicha?: string | null;
  idMateria: number;
  materiaNombre?: string | null;
  idRap?: number;
  rapNombre?: string | null;
  codigoRap?: string | null;
  fechaInicio?: string | null;
  fechaLimite?: string | null;
  estadoGeneral: string;
  vencida?: boolean;
  tipoActividad?: string | null;
  modalidad?: 'individual' | 'grupal';
  totalAsignados: number;
  totalEntregaron: number;
  totalPendientes: number;
  totalCalificados: number;
  totalPorEvaluar: number;
  totalSinEntregar: number;
  totalCorreccionSolicitada?: number;
  idHorarioMateria?: number | null;
  creador?: {
    idPersona?: number | null;
    nombre?: string;
    fotoPerfil?: string | null;
  };
}

type ChipFiltro =
  | 'TODAS'
  | 'ACTIVAS'
  | 'VENCIDAS'
  | 'CON_ENTREGAS'
  | 'SIN_ENTREGAS'
  | 'POR_EVALUAR'
  | 'CALIFICADAS'
  | 'CORRECCION';

const chipsFiltro: Array<{ id: ChipFiltro; label: string }> = [
  { id: 'TODAS', label: 'Todas' },
  { id: 'ACTIVAS', label: 'Activas' },
  { id: 'VENCIDAS', label: 'Vencidas' },
  { id: 'CON_ENTREGAS', label: 'Con entregas' },
  { id: 'SIN_ENTREGAS', label: 'Sin entregas' },
  { id: 'POR_EVALUAR', label: 'Por evaluar' },
  { id: 'CALIFICADAS', label: 'Calificadas' },
  { id: 'CORRECCION', label: 'Corrección solicitada' }
];

const estadoGeneralLabel: Record<string, string> = {
  activa: 'Activa',
  vencida: 'Vencida',
  parcial: 'Parcial',
  asignada: 'Asignada',
  no_asignada: 'No asignada',
  por_evaluar: 'Por evaluar',
  calificada: 'Calificada'
};

const estadoGeneralChip: Record<string, string> = {
  activa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  vencida: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  parcial: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  por_evaluar: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  calificada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  no_asignada: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
};

const formatearFecha = (value?: string | null, incluirHora = false): string => {
  if (!value) return '-';
  try {
    const fecha = new Date(value);
    const opts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    if (incluirHora && (value.includes('T') || value.includes(' '))) {
      opts.hour = '2-digit';
      opts.minute = '2-digit';
    }
    return new Intl.DateTimeFormat('es-CO', opts).format(fecha);
  } catch {
    return value;
  }
};

/** Misma regla que ActividadesAprendiz / ListaActividades para URLs de foto de persona. */
const getPerfilPublicUrl = (path?: string | null): string | null => {
  if (!path || !String(path).trim()) return null;
  const p = String(path).trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = p.startsWith('/') ? p.slice(1) : p;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const pickCreadorFoto = (creador?: ActividadInstructorResumen['creador']): string | null => {
  if (!creador) return null;
  const raw = creador as Record<string, unknown>;
  const candidates = [creador.fotoPerfil, raw.rutaFoto, raw.ruta_foto, raw.foto_perfil];
  for (const c of candidates) {
    if (typeof c === 'string') {
      const t = c.trim();
      if (t && t.toLowerCase() !== 'null') return getPerfilPublicUrl(t) ?? t;
    }
  }
  return null;
};

const coincideChip = (a: ActividadInstructorResumen, chip: ChipFiltro): boolean => {
  switch (chip) {
    case 'TODAS':
      return true;
    case 'ACTIVAS':
      return a.estadoGeneral === 'activa' || (!a.vencida && a.estadoGeneral !== 'vencida');
    case 'VENCIDAS':
      return a.vencida === true || a.estadoGeneral === 'vencida';
    case 'CON_ENTREGAS':
      return a.totalEntregaron > 0;
    case 'SIN_ENTREGAS':
      return a.totalEntregaron === 0 && a.totalAsignados > 0;
    case 'POR_EVALUAR':
      return a.totalPorEvaluar > 0 || a.estadoGeneral === 'por_evaluar';
    case 'CALIFICADAS':
      return a.totalAsignados > 0 && a.totalCalificados === a.totalAsignados;
    case 'CORRECCION':
      return (a.totalCorreccionSolicitada ?? 0) > 0;
    default:
      return true;
  }
};

/** Mismo tamaño de página que Mis Actividades del aprendiz (`ActividadesAprendiz`). */
const PAGE_SIZE = 15;

/** Textos informativos en modo oscuro: blanco (referencia nombre instructor / título actividad). */
const clsLabelFiltro = 'text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block';
const clsTextoEstadoFiltros = 'text-xs font-semibold text-gray-600 dark:text-white';
const clsChipInactivo =
  'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-coal-400 dark:text-white dark:border-gray-600 dark:hover:bg-coal-500';
const clsTextoInfoTarjeta = 'text-[11px] text-gray-600 dark:text-white';
const clsLabelInfoTarjeta = 'font-semibold text-gray-800 dark:text-white';
const clsIconoInfoTarjeta = 'text-xs shrink-0 text-gray-500 dark:text-white';
const clsLabelContador = 'text-[9px] uppercase tracking-wide text-gray-500 dark:text-white';
const clsTextoPaginacion = 'text-xs text-gray-500 dark:text-white';
const clsTextoPaginaActual = 'text-xs text-gray-600 dark:text-white px-2';

/** Selects de filtros: en dark, texto blanco (react-select aplica color inline; heredar + Tailwind). */
const selectClassNamesMisActividades = {
  ...compactReactSelectClassNames,
  control: () =>
    `${compactReactSelectClassNames.control()} dark:text-white`,
  valueContainer: () => 'text-gray-900 dark:text-white text-sm',
  singleValue: () => 'text-gray-900 dark:!text-white text-sm',
  placeholder: () => 'text-gray-400 dark:!text-white/90 text-sm',
  input: () => 'text-gray-900 dark:!text-white text-sm',
  menu: () => `${compactReactSelectClassNames.menu()} dark:text-white`,
  menuList: () => `${compactReactSelectClassNames.menuList()} dark:text-white`,
  option: (state: { isFocused: boolean; isSelected: boolean }) =>
    `${compactReactSelectClassNames.option(state)} dark:!text-white ${
      state.isSelected ? '!text-white' : ''
    }`,
  dropdownIndicator: () =>
    'text-gray-500 dark:!text-white hover:text-gray-700 dark:hover:!text-white/80',
  clearIndicator: () =>
    'text-gray-400 dark:!text-white/80 hover:text-gray-600 dark:hover:!text-white'
};

const selectStylesMisActividades = {
  singleValue: (base: Record<string, unknown>) => ({ ...base, color: 'inherit' }),
  placeholder: (base: Record<string, unknown>) => ({ ...base, color: 'inherit' }),
  input: (base: Record<string, unknown>) => ({ ...base, color: 'inherit' })
};

const actividadParaModal = (a: ActividadInstructorResumen): Actividad => ({
  id: a.idActividad,
  tituloActividad: a.titulo,
  descripcionActividad: a.descripcion ?? undefined,
  tipoActividad: (a.tipoActividad as Actividad['tipoActividad']) || 'con evidencia',
  idMateria: a.idMateria,
  idEstado: 1,
  idCompany: 1
});

const AvatarCreadorInstructor: React.FC<{
  creador?: ActividadInstructorResumen['creador'];
  nombreCompleto: string;
  onZoom: (src: string, alt: string) => void;
}> = ({ creador, nombreCompleto, onZoom }) => {
  const [broken, setBroken] = useState(false);
  const src = useMemo(() => pickCreadorFoto(creador), [creador]);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!src || broken) {
    return <MisActividadesAvatarFallback variant="md" />;
  }

  return (
    <button
      type="button"
      onClick={() => onZoom(src, nombreCompleto)}
      className="shrink-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-1"
      title="Ampliar foto"
      aria-label={`Foto de ${nombreCompleto}`}
    >
      <img
        src={src}
        alt={nombreCompleto}
        referrerPolicy="no-referrer"
        className="w-10 h-10 rounded-full object-cover border-2 border-primary/60 cursor-pointer hover:opacity-90 transition-opacity"
        onError={() => setBroken(true)}
      />
    </button>
  );
};

const MisActividadesInstructor: React.FC = () => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState<ActividadInstructorResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chip, setChip] = useState<ChipFiltro>('TODAS');
  const [fichaSel, setFichaSel] = useState<number | null>(null);
  const [materiaSel, setMateriaSel] = useState<number | null>(null);
  const [rapSel, setRapSel] = useState<number | null>(null);
  const [modalAprendices, setModalAprendices] = useState<ActividadInstructorResumen | null>(null);
  const [zoomFoto, setZoomFoto] = useState<{ src: string; alt: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchActividades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get('ambiente-virtual/instructor/mis-actividades');
      setActividades(Array.isArray(data?.data) ? data.data : []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No fue posible cargar tus actividades';
      setError(msg);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActividades();
  }, [fetchActividades]);

  const opcionesFicha = useMemo(() => {
    const map = new Map<number, string>();
    actividades.forEach((a) => {
      if (a.idFicha) {
        map.set(a.idFicha, a.codigoFicha ? String(a.codigoFicha) : `Ficha ${a.idFicha}`);
      }
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((x, y) => x.label.localeCompare(y.label));
  }, [actividades]);

  const opcionesMateria = useMemo(() => {
    const map = new Map<number, string>();
    actividades
      .filter((a) => !fichaSel || a.idFicha === fichaSel)
      .forEach((a) => {
        if (a.idMateria && a.materiaNombre) {
          map.set(a.idMateria, a.materiaNombre);
        }
      });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [actividades, fichaSel]);

  const opcionesRap = useMemo(() => {
    const map = new Map<number, string>();
    actividades
      .filter((a) => (!fichaSel || a.idFicha === fichaSel) && (!materiaSel || a.idMateria === materiaSel))
      .forEach((a) => {
        const id = a.idRap ?? a.idMateria;
        const label = a.rapNombre
          ? a.codigoRap
            ? `${a.codigoRap} - ${a.rapNombre}`
            : a.rapNombre
          : a.materiaNombre;
        if (id && label) {
          map.set(id, label);
        }
      });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [actividades, fichaSel, materiaSel]);

  const filtradas = useMemo(() => {
    return actividades.filter((a) => {
      if (fichaSel && a.idFicha !== fichaSel) return false;
      if (materiaSel && a.idMateria !== materiaSel) return false;
      if (rapSel && (a.idRap ?? a.idMateria) !== rapSel) return false;
      if (!coincideChip(a, chip)) return false;
      return true;
    });
  }, [actividades, fichaSel, materiaSel, rapSel, chip]);

  useEffect(() => {
    setCurrentPage(1);
  }, [fichaSel, materiaSel, rapSel, chip]);

  const totalFiltradas = filtradas.length;
  const lastPage = Math.max(1, Math.ceil(totalFiltradas / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [currentPage, lastPage]);

  const paginadas = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtradas.slice(start, start + PAGE_SIZE);
  }, [filtradas, currentPage]);

  /** Misma ruta/state que Mis formaciones → clase (ListaHistorialRAPs). Panel estudiantes, sin modales. */
  const irAlRap = (a: ActividadInstructorResumen) => {
    const idHm = a.idHorarioMateria;
    if (!idHm || idHm <= 0) {
      navigate('/ambiente-virtual/historial-raps');
      return;
    }
    navigate(`/ambiente-virtual/clase/${idHm}`, {
      state: {
        returnTo: '/ambiente-virtual/instructor/mis-actividades',
        vistaCalendario: 'instructor' as const,
        activeMenu: 'estudiantes',
        ficha_id: a.idFicha,
        idMateria: a.idRap ?? a.idMateria,
        materia_nombre: a.rapNombre ?? a.materiaNombre
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className={clsLabelFiltro}>Ficha</label>
            <Select
              isClearable
              placeholder="Todas las fichas"
              options={opcionesFicha}
              value={opcionesFicha.find((o) => o.value === fichaSel) ?? null}
              onChange={(opt) => {
                setFichaSel(opt?.value ?? null);
                setMateriaSel(null);
                setRapSel(null);
              }}
              classNames={selectClassNamesMisActividades}
              styles={selectStylesMisActividades}
              noOptionsMessage={compactReactSelectNoOptions}
            />
          </div>
          <div>
            <label className={clsLabelFiltro}>Asignatura</label>
            <Select
              isClearable
              placeholder="Todas las asignaturas"
              options={opcionesMateria}
              value={opcionesMateria.find((o) => o.value === materiaSel) ?? null}
              onChange={(opt) => {
                setMateriaSel(opt?.value ?? null);
                setRapSel(null);
              }}
              isDisabled={opcionesMateria.length === 0}
              classNames={selectClassNamesMisActividades}
              styles={selectStylesMisActividades}
              noOptionsMessage={compactReactSelectNoOptions}
            />
          </div>
          <div>
            <label className={clsLabelFiltro}>RAP</label>
            <Select
              isClearable
              placeholder="Todos los RAP"
              options={opcionesRap}
              value={opcionesRap.find((o) => o.value === rapSel) ?? null}
              onChange={(opt) => setRapSel(opt?.value ?? null)}
              isDisabled={opcionesRap.length === 0}
              classNames={selectClassNamesMisActividades}
              styles={selectStylesMisActividades}
              noOptionsMessage={compactReactSelectNoOptions}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={clsTextoEstadoFiltros}>ESTADO:</span>
          {chipsFiltro.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setChip(item.id)}
              className={clsx(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                chip === item.id ? 'bg-primary text-white' : clsChipInactivo
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filtradas.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center dark:bg-coal-400 dark:border-gray-700">
            <KeenIcon icon="check-squared" className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">No hay actividades para este filtro</p>
            <p className="text-xs text-gray-500 dark:text-white mt-1">
              Prueba con otra ficha, asignatura o estado.
            </p>
          </div>
        ) : (
          <>
          <div className="space-y-3">
            {paginadas.map((a) => {
              const estadoLbl = estadoGeneralLabel[a.estadoGeneral] ?? a.estadoGeneral;
              const chipEstado =
                estadoGeneralChip[a.estadoGeneral] ??
                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
              const nombreCreador = a.creador?.nombre ?? 'Instructor';

              return (
                <article
                  key={`${a.idActividad}-${a.idFicha}`}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:bg-coal-400 dark:border-gray-700 border-l-4 border-l-primary"
                >
                  <div className="px-4 py-3">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <AvatarCreadorInstructor
                              creador={a.creador}
                              nombreCompleto={nombreCreador}
                              onZoom={(srcZoom, alt) => setZoomFoto({ src: srcZoom, alt })}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-light whitespace-nowrap w-full min-w-[7.5rem]"
                              onClick={() => setModalAprendices(a)}
                            >
                              <KeenIcon icon="eye" className="me-1" />
                              Ver estado
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-light whitespace-nowrap w-full min-w-[7.5rem]"
                              onClick={() => irAlRap(a)}
                              title={
                                a.idHorarioMateria
                                  ? 'Ir al RAP de esta actividad'
                                  : 'No hay horario de clase enlazado; abre Mis formaciones'
                              }
                            >
                              <KeenIcon icon="entrance-right" className="me-1" />
                              Ir al RAP
                            </button>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{nombreCreador}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{a.titulo}</h3>
                              <span
                                className={clsx(
                                  'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                                  chipEstado
                                )}
                              >
                                {estadoLbl}
                              </span>
                              {a.tipoActividad ? (
                                <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 capitalize">
                                  {a.tipoActividad}
                                </span>
                              ) : null}
                              <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                {a.modalidad ?? 'individual'}
                              </span>
                            </div>
                            <div className={clsx('flex flex-wrap gap-x-4 gap-y-1 mt-2', clsTextoInfoTarjeta)}>
                              <span>
                                <span className={clsLabelInfoTarjeta}>Ficha:</span>{' '}
                                {a.codigoFicha ?? a.idFicha}
                              </span>
                              <span>
                                <span className={clsLabelInfoTarjeta}>Asignatura:</span>{' '}
                                {a.materiaNombre ?? '-'}
                              </span>
                              {a.rapNombre ? (
                                <span>
                                  <span className={clsLabelInfoTarjeta}>RAP:</span>{' '}
                                  {a.codigoRap ? `${a.codigoRap} - ` : ''}
                                  {a.rapNombre}
                                </span>
                              ) : null}
                            </div>
                            <div className={clsx('flex flex-wrap gap-x-4 gap-y-1 mt-2', clsTextoInfoTarjeta)}>
                              <span className="inline-flex items-center gap-1">
                                <KeenIcon icon="calendar" className={clsIconoInfoTarjeta} />
                                <span>
                                  <span className={clsLabelInfoTarjeta}>Inicio:</span>{' '}
                                  {formatearFecha(a.fechaInicio)}
                                </span>
                              </span>
                              <span
                                className={clsx(
                                  'inline-flex items-center gap-1',
                                  a.vencida && '!text-red-600 dark:!text-red-400 font-medium'
                                )}
                              >
                                <KeenIcon
                                  icon="calendar-tick"
                                  className={clsx(clsIconoInfoTarjeta, a.vencida && '!text-red-600 dark:!text-red-400')}
                                />
                                <span>
                                  <span className={clsLabelInfoTarjeta}>Límite:</span>{' '}
                                  {formatearFecha(a.fechaLimite, true)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-x-4 gap-y-2 shrink-0 min-w-[180px] lg:min-w-[200px]">
                        {[
                          ['Asignados', a.totalAsignados, 'text-slate-800 dark:text-slate-100'],
                          ['Entregaron', a.totalEntregaron, 'text-primary dark:text-blue-400'],
                          ['Pendientes', a.totalPendientes, 'text-amber-700 dark:text-amber-300'],
                          ['Calificados', a.totalCalificados, 'text-emerald-700 dark:text-emerald-300'],
                          ['Por evaluar', a.totalPorEvaluar, 'text-purple-700 dark:text-purple-300'],
                          ['Sin entregar', a.totalSinEntregar, 'text-red-700 dark:text-red-300']
                        ].map(([label, val, color]) => (
                          <div key={String(label)} className="text-center lg:text-right">
                            <dt className={clsLabelContador}>{label}</dt>
                            <dd className={clsx('text-sm font-bold tabular-nums', color)}>{val}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                </article>
              );
            })}

          </div>

          {totalFiltradas > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className={clsTextoPaginacion}>
                Mostrando {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                {Math.min(currentPage * PAGE_SIZE, totalFiltradas)} de {totalFiltradas}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || loading}
                  className="btn btn-sm btn-light px-3 text-xs h-8 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className={clsTextoPaginaActual}>
                  Página {currentPage} de {lastPage}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  disabled={currentPage >= lastPage || loading}
                  className="btn btn-sm btn-light px-3 text-xs h-8 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      <ModalAprendices
        open={!!modalAprendices}
        onClose={() => setModalAprendices(null)}
        actividad={modalAprendices ? actividadParaModal(modalAprendices) : null}
        idFicha={modalAprendices?.idFicha ?? 0}
        tituloActividad={modalAprendices?.titulo}
      />

      {zoomFoto && (
        <ImageZoomModal
          open
          src={zoomFoto.src}
          alt={zoomFoto.alt}
          onClose={() => setZoomFoto(null)}
        />
      )}
    </>
  );
};

export default MisActividadesInstructor;

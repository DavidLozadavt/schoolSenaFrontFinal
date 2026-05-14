import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { KeenIcon, ImageZoomModal, DefaultTooltip } from '@/components';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import axios from 'axios';
import Select from 'react-select';
import type { Actividad } from './ModalCrearActividad';
import { compactReactSelectClassNames, compactReactSelectNoOptions, normalizeText } from '@/components/forms/compactReactSelect';

const DROPDOWN_WIDTH = 180;
const DROPDOWN_ITEM_HEIGHT = 40;
const DROPDOWN_PADDING = 16;

/** Panel alineado al de tooltips informativos del calendario (ClaseDetallePage). */
const TOOLTIP_COBERTURA_SURFACE =
  '!rounded-xl !max-w-[min(100vw-1rem,18rem)] !p-0 !text-left !font-sans !normal-case !bg-white !text-slate-900 !border !border-slate-200/90 !shadow-lg !overflow-hidden dark:!bg-coal-600 dark:!text-white dark:!border-gray-500/50';

type CoberturaActividadItem = { total: number; asignados: number; faltan: number; entregaron?: number; pendientesEntrega?: number };

/** Resumen de entregas (modo actividades asignadas): mismo endpoint de cobertura, campos entregaron / pendientesEntrega. */
const ResumenEntregasTooltipContenido: React.FC<{
  c: CoberturaActividadItem | undefined;
}> = ({ c }) => {
  if (!c) {
    return (
      <div className="p-3.5 max-h-[min(70vh,14rem)] overflow-y-auto overscroll-contain">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Resumen de entregas</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-gray-300">
          Aún no hay datos de entregas para esta actividad. Abre <span className="font-medium">Calificar</span> para ver el detalle por aprendiz.
        </p>
      </div>
    );
  }
  const totalAsign = c.asignados ?? 0;
  const ent = c.entregaron ?? 0;
  const pend = c.pendientesEntrega ?? Math.max(0, totalAsign - ent);
  return (
    <div className="p-3.5 max-h-[min(70vh,14rem)] overflow-y-auto overscroll-contain">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2.5">Resumen de entregas</p>
      <dl className="m-0 space-y-0">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/90 py-2.5 first:pt-0 dark:border-white/10">
          <dt className="m-0 text-xs font-medium text-slate-600 dark:text-gray-300">Total asignados</dt>
          <dd className="m-0 text-sm font-bold tabular-nums text-slate-900 dark:text-white">{totalAsign}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/90 py-2.5 dark:border-white/10">
          <dt className="m-0 text-xs font-medium text-slate-600 dark:text-gray-300">Entregaron</dt>
          <dd className="m-0 text-sm font-bold tabular-nums text-primary">{ent}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-2.5 pb-0">
          <dt className="m-0 text-xs font-medium text-slate-600 dark:text-gray-300">Pendientes por entregar</dt>
          <dd className="m-0 text-sm font-bold tabular-nums text-amber-600 dark:text-amber-300">{pend}</dd>
        </div>
      </dl>
    </div>
  );
};

const CoberturaAsignacionTooltipContenido: React.FC<{
  c: CoberturaActividadItem | undefined;
}> = ({ c }) => {
  if (!c) {
    return (
      <div className="p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Estado de asignación</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-gray-300">
          Aún no hay cobertura calculada para esta actividad. Puedes asignar desde el switch: si un aprendiz ya tiene la
          actividad, <span className="font-medium text-slate-800 dark:text-gray-100">no se duplicará</span> para ese
          destinatario.
        </p>
      </div>
    );
  }
  return (
    <div className="p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2.5">Cobertura en la ficha</p>
      <dl className="m-0 space-y-0">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/90 py-2.5 first:pt-0 dark:border-white/10">
          <dt className="m-0 text-xs font-medium text-slate-600 dark:text-gray-300">Total estudiantes</dt>
          <dd className="m-0 text-sm font-bold tabular-nums text-slate-900 dark:text-white">{c.total}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/90 py-2.5 dark:border-white/10">
          <dt className="m-0 text-xs font-medium text-slate-600 dark:text-gray-300">Asignados</dt>
          <dd className="m-0 text-sm font-bold tabular-nums text-primary">{c.asignados}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-2.5 pb-0">
          <dt className="m-0 text-xs font-medium text-slate-600 dark:text-gray-300">Faltan por asignar</dt>
          <dd className="m-0 text-sm font-bold tabular-nums text-amber-600 dark:text-amber-300">{c.faltan}</dd>
        </div>
      </dl>
    </div>
  );
};

/** Switch para marcar actividades a asignar: inactivo gris, activo azul. */
const SeleccionActividadSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
}> = ({ checked, onChange, disabled, title, 'aria-label': ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    title={title}
    disabled={disabled}
    onClick={() => {
      if (!disabled) onChange();
    }}
    className={`
      relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full border transition-colors duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
      ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      ${
        checked
          ? 'border-blue-500 bg-blue-500 dark:border-blue-500 dark:bg-blue-600'
          : 'border-gray-300 bg-gray-200 dark:border-gray-500 dark:bg-gray-600'
      }
    `}
  >
    <span
      className={`
        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-out
        ${checked ? 'translate-x-7' : 'translate-x-0.5'}
      `}
    />
  </button>
);

/** Dropdown compacto para acciones de actividad - usa Portal, posición dinámica arriba/abajo */
const DropdownAcciones: React.FC<{
  act: Actividad;
  item: Actividad & { id?: number };
  modo: 'agregar' | 'asignadas';
  idFicha?: number;
  onVer?: (a: Actividad) => void;
  onAsignarActividad?: (a: Actividad) => void;
  onVerAprendices?: (a: Actividad) => void;
  onAmpliar?: (a: Actividad) => void;
  onQuitar?: (id: number) => void;
  onMaterialApoyo?: (a: Actividad) => void;
  onMoverActividad?: (a: Actividad) => void;
  onEditar?: (a: Actividad) => void;
  onEliminar?: (a: Actividad) => void;
  puedeEliminar?: (a: Actividad) => boolean;
}> = (props) => {
  const { act, item, modo, idFicha } = props;
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const items: { icon: string; label: string; onClick: () => void }[] = [];
  if (props.onVer) items.push({ icon: 'eye', label: 'Ver actividad', onClick: () => props.onVer!(act) });
  if (modo === 'asignadas' && idFicha && props.onVerAprendices) items.push({ icon: 'check-squared', label: 'Calificar', onClick: () => props.onVerAprendices!(act) });
  if (modo === 'asignadas' && idFicha && props.onAmpliar) items.push({ icon: 'calendar', label: 'Ampliar actividad', onClick: () => props.onAmpliar!(act) });
  if (modo === 'asignadas' && props.onQuitar && item.id != null) items.push({ icon: 'cross', label: 'Quitar', onClick: () => props.onQuitar!(item.id!) });
  if (props.onMaterialApoyo) items.push({ icon: 'folder', label: 'Material de la actividad', onClick: () => props.onMaterialApoyo!(act) });
  if (idFicha && props.onMoverActividad && act.id != null) {
    items.push({ icon: 'arrow-two-diagonals', label: 'Mover actividad', onClick: () => props.onMoverActividad!(act) });
  }
  if (props.onEditar) items.push({ icon: 'pencil', label: 'Editar actividad', onClick: () => props.onEditar!(act) });
  if (props.onEliminar && (!props.puedeEliminar || props.puedeEliminar(act))) items.push({ icon: 'trash', label: 'Eliminar', onClick: () => props.onEliminar!(act) });

  useEffect(() => {
    if (!abierto) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (ref.current?.contains(target)) return;
      if (target.closest?.('[data-id="dropdown-acciones-portal"]')) return;
      setAbierto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [abierto]);

  useEffect(() => {
    if (abierto && ref.current && items.length > 0) {
      const rect = ref.current.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const spaceBelow = viewportH - rect.bottom;
      const estimatedHeight = items.length * DROPDOWN_ITEM_HEIGHT + DROPDOWN_PADDING;
      const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
      const left = Math.max(8, Math.min(rect.right - DROPDOWN_WIDTH, window.innerWidth - DROPDOWN_WIDTH - 8));
      const top = openUp ? rect.top - estimatedHeight - 6 : rect.bottom + 6;
      setDropdownPos({ top, left });
    } else {
      setDropdownPos(null);
    }
  }, [abierto, items.length]);

  if (items.length === 0) return null;

  const dropdownContent = abierto && dropdownPos && (
    <div
      data-id="dropdown-acciones-portal"
      className="fixed z-[9999] min-w-[180px] max-w-[220px] py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-400 shadow-xl"
      style={{ top: dropdownPos.top, left: dropdownPos.left }}
    >
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          onClick={() => { it.onClick(); setAbierto(false); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-500 transition-colors"
        >
          <KeenIcon icon={it.icon as any} className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer whitespace-nowrap"
        title="Ver acciones"
      >
        Ver acciones
      </button>
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
};

const ACTIVIDADES_POR_PAGINA = 20;
const MAX_PALABRAS = 6;

const truncarAPalabras = (texto: string | undefined, maxPalabras: number = MAX_PALABRAS): string => {
  if (!texto || !String(texto).trim()) return '-';
  const palabras = String(texto).trim().split(/\s+/);
  if (palabras.length <= maxPalabras) return texto;
  return palabras.slice(0, maxPalabras).join(' ') + '…';
};

const getFotoUrl = (path: string | undefined): string => {
  if (!path) return '/media/avatars/blank.png';
  if (path.startsWith('http')) return path;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const truncarCaracteres = (texto: string | undefined, max: number = 35): string => {
  if (!texto || !String(texto).trim()) return '-';
  const s = String(texto).trim();
  return s.length <= max ? s : s.slice(0, max) + '…';
};

const formatearFecha = (value?: string | null, incluirHora = false): string => {
  if (!value) return '-';
  try {
    const fecha = new Date(value);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    if (incluirHora && (value.includes('T') || value.includes(' '))) {
      opts.hour = '2-digit';
      opts.minute = '2-digit';
    }
    return new Intl.DateTimeFormat('es-CO', opts).format(fecha);
  } catch {
    return value;
  }
};

/** Formato compacto: fecha arriba, hora abajo (ej: "26 Mar 2026" / "11:59 PM") */
const formatearFechaCompacta = (value?: string | null): { fecha: string; hora: string } => {
  if (!value) return { fecha: '-', hora: '' };
  try {
    const d = new Date(value);
    const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    const tieneHora = value.includes('T') || value.includes(' ');
    const hora = tieneHora ? new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }).format(d) : '';
    return { fecha, hora };
  } catch {
    return { fecha: value, hora: '' };
  }
};

const CeldaConTooltip: React.FC<{ textoCompleto: string; textoTruncado: string }> = ({ textoCompleto, textoTruncado }) => {
  const necesitaTooltip = textoCompleto !== textoTruncado && textoCompleto.length > 0 && textoCompleto !== '-';
  return (
    <span
      className={`${necesitaTooltip ? 'cursor-help underline decoration-dotted decoration-gray-400' : ''}`}
      title={necesitaTooltip ? `Más información: ${textoCompleto}` : undefined}
    >
      {textoTruncado}
    </span>
  );
};

interface ItemActividad {
  actividad?: Actividad;
  id?: number;
  fechaInicial?: string | null;
  fechaFinal?: string | null;
  fechaVencida?: boolean;
  fechaInactiva?: boolean;
}

/** Fila de `GET fichas/{idFicha}/asignacion-actividades/{idActividad}/cobertura-detalle` (modo agregar). */
interface AprendizCoberturaAsignacionItem {
  idMatricula: number;
  identificacion: string;
  nombreCompleto: string;
  rutaFoto: string | null;
}

/** Fila de `GET actividades/{id}/fichas/{idFicha}/aprendices` para detalle de entregas. */
interface AprendizEntregaDetalle {
  idCalificacionActividad: number;
  nombreAprendiz: string;
  identificacion: string;
  rutaFoto: string | null;
  estado: 'PENDIENTE' | 'ENVIADO' | 'CALIFICADO' | 'CORRECCION_SOLICITADA';
  archivo?: string | null;
  fechaCalificacion?: string | null;
  fechaActualizacionRegistro?: string | null;
  nombreGrupo?: string | null;
}

interface ListaActividadesProps {
  actividades: (Actividad & ItemActividad)[];
  loading?: boolean;
  onCrear?: () => void;
  onCrearCuestionario?: () => void;
  onVer?: (actividad: Actividad) => void;
  onAsignar?: (actividad: Actividad) => void;
  onAsignarActividad?: (actividad: Actividad) => void;
  /** Asignar varias actividades a la vez (solo en modo agregar) */
  onAsignarActividades?: (actividades: Actividad[]) => void;
  onQuitar?: (idPlaneacionActividad: number) => void;
  onMaterialApoyo?: (actividad: Actividad) => void;
  onEditar?: (actividad: Actividad) => void;
  onEliminar?: (actividad: Actividad) => void;
  /** Solo se muestra el botón eliminar si esta función retorna true. Si no se pasa, se usa onEliminar cuando existe. */
  puedeEliminar?: (actividad: Actividad) => boolean;
  /** Ver aprendices asignados y calificar (solo en modo asignadas) */
  onVerAprendices?: (actividad: Actividad) => void;
  /** Trasladar actividad a otro RAP de la misma ficha (requiere idFicha) */
  onMoverActividad?: (actividad: Actividad) => void;
  /** Ampliar actividad (solo en modo asignadas) */
  onAmpliar?: (actividad: Actividad) => void;
  /** ID de ficha: modal de aprendices (asignadas) y detalle de cobertura al clic en estado (agregar). */
  idFicha?: number;
  /** Si false, no se muestra el botón Crear cuestionario (ej. en Actividades asignadas) */
  mostrarCrearCuestionario?: boolean;
  modo: 'agregar' | 'asignadas';
  emptyMessage?: string;
  /** Incrementar para limpiar la selección (ej. tras asignación masiva exitosa) */
  resetSelectionKey?: number;
  /**
   * Cobertura por actividad en la ficha (aprendices con registro en calificacionActividad).
   * El estado "Parcial/Completo" es informativo; el switch solo se desactiva si no queda nadie por asignar.
   */
  coberturaActividades?: Record<number, CoberturaActividadItem>;
}

const ListaActividades: React.FC<ListaActividadesProps> = ({
  actividades,
  loading = false,
  onCrear,
  onCrearCuestionario,
  onVer,
  onAsignar,
  onAsignarActividades,
  onQuitar,
  onMaterialApoyo,
  onEditar,
  onEliminar,
  puedeEliminar,
  onVerAprendices,
  onMoverActividad,
  onAmpliar,
  idFicha,
  mostrarCrearCuestionario = true,
  modo,
  emptyMessage,
  resetSelectionKey,
  coberturaActividades
}) => {
  const codigoVistaActividad = (act: Actividad, indiceFila: number) =>
    act.id != null
      ? `ACT-${String(act.id).padStart(3, '0')}`
      : `ACT-${String(indiceFila + 1).padStart(3, '0')}`;

  const switchAsignacionBloqueado = (id: number) => {
    const c = coberturaActividades?.[id];
    if (!c) return false;
    return c.total > 0 && c.faltan === 0;
  };

  const nombreCompleto = (p: Actividad['persona']) => {
    if (!p) return 'Sin asignar';
    return `${p.nombre1 || ''} ${p.nombre2 || ''} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim() || 'Sin asignar';
  };
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  /** Selección en la tabla principal (modo agregar, asignación masiva) */
  const [seleccionIds, setSeleccionIds] = useState<Set<number>>(new Set());
  const [confirmAsignarOpen, setConfirmAsignarOpen] = useState(false);
  const [avisoAsignarSinSeleccion, setAvisoAsignarSinSeleccion] = useState(false);
  const [zoomFoto, setZoomFoto] = useState<{ src: string; alt: string } | null>(null);
  const [modalEntregables, setModalEntregables] = useState<{
    open: boolean;
    actividad: Actividad | null;
    filas: AprendizEntregaDetalle[];
    loading: boolean;
    error: string;
  }>({ open: false, actividad: null, filas: [], loading: false, error: '' });
  const [busquedaEntregas, setBusquedaEntregas] = useState('');

  const [modalCoberturaAsignacion, setModalCoberturaAsignacion] = useState<{
    open: boolean;
    actividad: Actividad | null;
    loading: boolean;
    error: string;
    totalEnFicha: number;
    asignados: number;
    faltan: number;
    detalleAsignados: AprendizCoberturaAsignacionItem[];
    detallePendientes: AprendizCoberturaAsignacionItem[];
  }>({
    open: false,
    actividad: null,
    loading: false,
    error: '',
    totalEnFicha: 0,
    asignados: 0,
    faltan: 0,
    detalleAsignados: [],
    detallePendientes: []
  });
  const [busquedaCobertura, setBusquedaCobertura] = useState('');

  const cerrarModalCoberturaAsignacion = () => {
    setModalCoberturaAsignacion({
      open: false,
      actividad: null,
      loading: false,
      error: '',
      totalEnFicha: 0,
      asignados: 0,
      faltan: 0,
      detalleAsignados: [],
      detallePendientes: []
    });
    setBusquedaCobertura('');
  };

  const { asignadosFiltrados, pendientesAsignarFiltrados } = useMemo(() => {
    const q = normalizeText(busquedaCobertura);
    if (!q) {
      return {
        asignadosFiltrados: modalCoberturaAsignacion.detalleAsignados,
        pendientesAsignarFiltrados: modalCoberturaAsignacion.detallePendientes
      };
    }
    const match = (r: AprendizCoberturaAsignacionItem) => {
      const nombre = normalizeText(r.nombreCompleto);
      const doc = normalizeText(r.identificacion);
      return nombre.includes(q) || doc.includes(q);
    };
    return {
      asignadosFiltrados: modalCoberturaAsignacion.detalleAsignados.filter(match),
      pendientesAsignarFiltrados: modalCoberturaAsignacion.detallePendientes.filter(match)
    };
  }, [busquedaCobertura, modalCoberturaAsignacion.detalleAsignados, modalCoberturaAsignacion.detallePendientes]);

  const abrirModalCoberturaAsignacion = (act: Actividad) => {
    if (!idFicha || act.id == null) return;
    setModalCoberturaAsignacion({
      open: true,
      actividad: act,
      loading: true,
      error: '',
      totalEnFicha: 0,
      asignados: 0,
      faltan: 0,
      detalleAsignados: [],
      detallePendientes: []
    });
    axios
      .get<{
        totalEnFicha?: number;
        asignados?: number;
        faltan?: number;
        detalleAsignados?: AprendizCoberturaAsignacionItem[];
        detallePendientes?: AprendizCoberturaAsignacionItem[];
      }>(`fichas/${idFicha}/asignacion-actividades/${act.id}/cobertura-detalle`)
      .then((res) => {
        const d = res.data;
        setModalCoberturaAsignacion((prev) => ({
          ...prev,
          loading: false,
          error: '',
          totalEnFicha: typeof d.totalEnFicha === 'number' ? d.totalEnFicha : 0,
          asignados: typeof d.asignados === 'number' ? d.asignados : 0,
          faltan: typeof d.faltan === 'number' ? d.faltan : 0,
          detalleAsignados: Array.isArray(d.detalleAsignados) ? d.detalleAsignados : [],
          detallePendientes: Array.isArray(d.detallePendientes) ? d.detallePendientes : []
        }));
      })
      .catch(() => {
        setModalCoberturaAsignacion((prev) => ({
          ...prev,
          loading: false,
          error: 'No se pudo cargar el detalle de cobertura. Intenta de nuevo.',
          totalEnFicha: 0,
          asignados: 0,
          faltan: 0,
          detalleAsignados: [],
          detallePendientes: []
        }));
      });
  };

  const cerrarModalEntregables = () => {
    setModalEntregables({ open: false, actividad: null, filas: [], loading: false, error: '' });
    setBusquedaEntregas('');
  };

  const abrirModalEntregables = (act: Actividad) => {
    if (!idFicha || act.id == null) return;
    setModalEntregables({ open: true, actividad: act, filas: [], loading: true, error: '' });
    axios
      .get<{ data?: AprendizEntregaDetalle[] }>(`actividades/${act.id}/fichas/${idFicha}/aprendices`)
      .then((res) => {
        const raw = res.data?.data;
        const filas = Array.isArray(raw) ? raw : [];
        setModalEntregables((prev) => ({ ...prev, filas, loading: false, error: '' }));
      })
      .catch(() => {
        setModalEntregables((prev) => ({
          ...prev,
          loading: false,
          error: 'No se pudo cargar el detalle de entregas. Intenta de nuevo.',
          filas: []
        }));
      });
  };

  const textoFechaEntrega = (row: AprendizEntregaDetalle): string => {
    if (row.estado === 'CALIFICADO' && row.fechaCalificacion) {
      return `Calificado: ${formatearFecha(row.fechaCalificacion, true)}`;
    }
    if (
      (row.estado === 'ENVIADO' ||
        row.estado === 'CALIFICADO' ||
        row.estado === 'CORRECCION_SOLICITADA') &&
      row.fechaActualizacionRegistro
    ) {
      return `Última actividad: ${formatearFecha(row.fechaActualizacionRegistro, true)}`;
    }
    if (row.estado === 'ENVIADO' || row.estado === 'CALIFICADO' || row.estado === 'CORRECCION_SOLICITADA') {
      return row.estado === 'CORRECCION_SOLICITADA' ? 'Corrección solicitada' : 'Entrega registrada';
    }
    return 'Sin entrega';
  };

  const badgeEstadoEntrega = (estado: AprendizEntregaDetalle['estado']) => {
    if (estado === 'CALIFICADO') {
      return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/25 dark:text-blue-200 dark:border-blue-800';
    }
    if (estado === 'ENVIADO') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-800';
    }
    if (estado === 'CORRECCION_SOLICITADA') {
      return 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-900/25 dark:text-violet-200 dark:border-violet-800';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/25 dark:text-amber-200 dark:border-amber-800';
  };

  const etiquetaEstadoEntrega = (estado: AprendizEntregaDetalle['estado']) => {
    if (estado === 'CALIFICADO') return 'Calificado';
    if (estado === 'ENVIADO') return 'Entregado';
    if (estado === 'CORRECCION_SOLICITADA') return 'Corrección';
    return 'Pendiente';
  };

  const { entregadosLista, pendientesLista } = useMemo(() => {
    const filas = modalEntregables.filas;
    const entregados = filas.filter(
      (r) =>
        r.estado === 'ENVIADO' || r.estado === 'CALIFICADO' || r.estado === 'CORRECCION_SOLICITADA'
    );
    const pendientes = filas.filter((r) => r.estado === 'PENDIENTE');
    return { entregadosLista: entregados, pendientesLista: pendientes };
  }, [modalEntregables.filas]);

  const { entregadosFiltrados, pendientesFiltrados } = useMemo(() => {
    const q = normalizeText(busquedaEntregas);
    if (!q) return { entregadosFiltrados: entregadosLista, pendientesFiltrados: pendientesLista };
    const match = (r: AprendizEntregaDetalle) => {
      const nombre = normalizeText(r.nombreAprendiz);
      const doc = normalizeText(r.identificacion);
      const grupo = normalizeText(r.nombreGrupo);
      const estado = normalizeText(r.estado);
      return nombre.includes(q) || doc.includes(q) || grupo.includes(q) || estado.includes(q);
    };
    return {
      entregadosFiltrados: entregadosLista.filter(match),
      pendientesFiltrados: pendientesLista.filter(match)
    };
  }, [busquedaEntregas, entregadosLista, pendientesLista]);

  const resumenDetalleEntregas = useMemo(() => {
    const filas = modalEntregables.filas;
    const totalAsignados = filas.length;
    const entregaron = filas.filter(
      (r) => r.estado === 'ENVIADO' || r.estado === 'CALIFICADO' || r.estado === 'CORRECCION_SOLICITADA'
    ).length;
    const pendientesEntrega = filas.filter((r) => r.estado === 'PENDIENTE').length;
    return { totalAsignados, entregaron, pendientesEntrega };
  }, [modalEntregables.filas]);

  const actividadesFiltradas = useMemo(() => {
    if (!actividades || !Array.isArray(actividades)) return [];
    if (!busqueda.trim()) return actividades;
    const q = busqueda.toLowerCase().trim();
    return actividades.filter((item) => {
      const act = item.actividad || item;
      const autor = nombreCompleto(act.persona).toLowerCase();
      const titulo = (act.tituloActividad || '').toLowerCase();
      const entregables = (act.entregables || '').toLowerCase();
      const materia = `${act.materia?.codigo || ''} ${act.materia?.nombreMateria || ''}`.toLowerCase();
      const tipo = (act.tipoActividad || '').toLowerCase();
      const descripcion = (act.descripcionActividad || '').toLowerCase();
      return (
        autor.includes(q) ||
        titulo.includes(q) ||
        entregables.includes(q) ||
        materia.includes(q) ||
        tipo.includes(q) ||
        descripcion.includes(q)
      );
    });
  }, [actividades, busqueda]);

  const actividadesPaginadas = useMemo(() => {
    const list = actividadesFiltradas ?? [];
    const inicio = (paginaActual - 1) * ACTIVIDADES_POR_PAGINA;
    return list.slice(inicio, inicio + ACTIVIDADES_POR_PAGINA);
  }, [actividadesFiltradas, paginaActual]);
  const totalPaginas = Math.ceil((actividadesFiltradas?.length ?? 0) / ACTIVIDADES_POR_PAGINA);

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  useEffect(() => {
    setSeleccionIds(new Set());
    setAvisoAsignarSinSeleccion(false);
  }, [resetSelectionKey]);

  const toggleSeleccionFila = (id: number) => {
    if (switchAsignacionBloqueado(id)) return;
    setAvisoAsignarSinSeleccion(false);
    setSeleccionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const solicitarAsignacionMasiva = () => {
    if (!onAsignarActividades) return;
    if (seleccionIds.size === 0) {
      setAvisoAsignarSinSeleccion(true);
      return;
    }
    setAvisoAsignarSinSeleccion(false);
    setConfirmAsignarOpen(true);
  };

  const confirmarAsignacionMasiva = () => {
    if (!onAsignarActividades) return;
    const list = actividadesFiltradas ?? [];
    const acts = list
      .map((item) => item.actividad || item)
      .filter((act): act is Actividad => act.id != null && seleccionIds.has(act.id));
    if (acts.length > 0) {
      onAsignarActividades(acts);
      setSeleccionIds(new Set());
    }
    setConfirmAsignarOpen(false);
  };

  const actividadesParaConfirmar = useMemo(() => {
    const list = actividadesFiltradas ?? [];
    return list
      .map((item) => item.actividad || item)
      .filter((act): act is Actividad => act.id != null && seleccionIds.has(act.id));
  }, [actividadesFiltradas, seleccionIds]);

  const defaultEmpty =
    modo === 'agregar'
      ? 'No hay actividades disponibles. Crea una nueva para comenzar.'
      : 'No hay actividades asignadas. Las actividades que asignes aparecerán aquí.';

  if (loading) {
    return (
        <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!actividades || !Array.isArray(actividades) || actividades.length === 0) {
    return (
      <div className="text-center py-12">
        <KeenIcon
          icon={modo === 'agregar' ? 'plus-circle' : 'check-squared'}
          className="text-4xl text-gray-400 mx-auto mb-3"
        />
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          {emptyMessage || defaultEmpty.split('.')[0]}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {emptyMessage ? '' : defaultEmpty.split('.').slice(1).join('.').trim()}
        </p>
        {modo === 'agregar' && onCrear && (
          <button
            onClick={onCrear}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors mx-auto"
          >
            <KeenIcon icon="plus" className="text-sm" />
            <span>Crear Actividad</span>
          </button>
        )}
      </div>
    );
  }

  const mostrarColumnaSeleccion = modo === 'agregar' && !!onAsignarActividades;
  const headers = mostrarColumnaSeleccion
    ? ['', 'Código', 'Autor', 'Título', 'Entregables', 'Materia', 'Estado', 'Tipo', 'Acciones']
    : modo === 'agregar'
      ? ['Código', 'Autor', 'Título', 'Entregables', 'Materia', 'Estado', 'Tipo', 'Acciones']
      : ['Código', 'Autor', 'Título', 'Entregables', 'Materia', 'Estado', 'Fecha límite', 'Tipo', 'Acciones'];

  const tituloSeccion = modo === 'agregar' ? 'Agregar actividades' : 'Actividades asignadas';

  return (
    <div className="min-w-0 max-w-full space-y-4 animate-fade-in">
      <div className="flex flex-col gap-3 min-w-0 sm:gap-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-center uppercase tracking-tight">
          {tituloSeccion}
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <KeenIcon icon="search" className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, autor, materia, entregables..."
              value={busqueda}
              onChange={handleBusquedaChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm shadow-sm transition-all"
            />
          </div>
        </div>
      </div>
      {(actividadesFiltradas?.length ?? 0) === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          No hay resultados para tu búsqueda. Intenta con otros términos.
        </div>
      ) : (
      <div className="w-full min-w-0 max-w-full overflow-x-auto md:overflow-x-visible">
        <table
          className="w-full min-w-0 table-fixed"
          style={{ tableLayout: 'fixed' }}
        >
          <colgroup>
            {mostrarColumnaSeleccion && <col style={{ width: 48 }} />}
            <col style={{ width: '4.5%' }} />
            <col style={{ width: '6.5%' }} />
            <col style={{ width: modo === 'asignadas' ? '16%' : '20%' }} />
            <col style={{ width: modo === 'asignadas' ? '12%' : '14%' }} />
            <col style={{ width: modo === 'asignadas' ? '12%' : '14%' }} />
            <col style={{ width: '7.5rem' }} />
            {modo === 'asignadas' && <col style={{ width: '9%' }} />}
            <col style={{ width: '6.5rem' }} />
            <col style={{ width: '7.25rem' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {headers.map((h, hi) => (
                <th
                  key={h || `col-${hi}`}
                  className={`py-2.5 px-1.5 sm:px-2 text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase ${
                    h === 'Código' ? 'pr-2 sm:pr-4' : ''
                  } ${h === 'Autor' ? 'pl-1 pr-2' : ''} ${['Estado', 'Tipo', 'Acciones'].includes(h) ? 'px-2 sm:px-3 text-center' : h === '' ? 'text-center w-11' : 'text-left'}`}
                >
                  {h === '' && mostrarColumnaSeleccion ? (
                    <span className="sr-only">Incluir en asignación</span>
                  ) : (
                    h
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {actividadesPaginadas.map((item, idx) => {
              const act = item.actividad || item;
              const indiceGlobal = (paginaActual - 1) * ACTIVIDADES_POR_PAGINA + idx;
              const codigo = indiceGlobal + 1;
              const { fecha, hora } = formatearFechaCompacta((item as ItemActividad).fechaFinal);
              return (
                <tr
                  key={act.id || act.tituloActividad}
                  className="hover:bg-gray-50 dark:hover:bg-coal-400/50 transition-colors"
                >
                  {mostrarColumnaSeleccion && (
                    <td className="py-3 px-0.5 align-middle text-center w-12 min-w-0">
                      {act.id != null && (
                        <SeleccionActividadSwitch
                          checked={seleccionIds.has(act.id)}
                          onChange={() => toggleSeleccionFila(act.id!)}
                          disabled={switchAsignacionBloqueado(act.id)}
                          title={
                            switchAsignacionBloqueado(act.id)
                              ? 'Todos los aprendices de la ficha ya tienen esta actividad. No se pueden añadir más destinatarios.'
                              : 'Incluir o quitar de la asignación a aprendices o grupos aún no cubiertos'
                          }
                          aria-label={
                            switchAsignacionBloqueado(act.id)
                              ? 'Cobertura completa, no se puede añadir a la asignación'
                              : seleccionIds.has(act.id)
                                ? 'Quitar actividad de la asignación'
                                : 'Añadir actividad a la asignación'
                          }
                        />
                      )}
                    </td>
                  )}
                  <td className="py-3 px-2 sm:px-3 text-xs font-semibold text-gray-700 dark:text-gray-300 align-middle min-w-0" style={{ minWidth: 48 }}>
                    {codigo}
                  </td>
                  <td className="py-3 pl-1 pr-2 align-middle min-w-0" style={{ minWidth: 52 }}>
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setZoomFoto({
                          src: getFotoUrl(act.persona?.rutaFotoUrl || act.persona?.rutaFoto),
                          alt: nombreCompleto(act.persona)
                        })}
                        title={nombreCompleto(act.persona)}
                        className="relative shrink-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 block"
                      >
                        <img
                          src={getFotoUrl(act.persona?.rutaFotoUrl || act.persona?.rutaFoto)}
                          alt={nombreCompleto(act.persona)}
                          className="w-11 h-11 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-coal-200 rounded-full" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-3 align-middle overflow-hidden min-w-0 max-w-0">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-800 dark:text-gray-200 uppercase leading-relaxed truncate block" title={act.tituloActividad || ''}>
                        {act.tituloActividad || '-'}
                      </span>
                      {onVer && (
                        <button
                          type="button"
                          onClick={() => onVer(act)}
                          className="self-start text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 uppercase tracking-tighter decoration-dotted underline underline-offset-2"
                        >
                          Ver más
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-3 align-middle overflow-hidden min-w-0 max-w-0">
                    <span className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 uppercase font-medium leading-relaxed truncate block" title={act.entregables || '-'}>
                      {act.entregables || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-2 sm:px-3 align-middle overflow-hidden min-w-0 max-w-0">
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 uppercase font-medium leading-relaxed truncate block" title={`${act.materia?.codigo ? act.materia.codigo + ' - ' : ''}${act.materia?.nombreMateria || '-'}`.trim() || '-'}>
                      {`${act.materia?.codigo ? act.materia.codigo + ' - ' : ''}${act.materia?.nombreMateria || '-'}`.trim() || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-1.5 sm:px-2 align-middle text-center min-w-0 w-[6.5rem] sm:w-[7.5rem] max-w-[7.5rem]">
                    {modo === 'agregar' ? (
                      (() => {
                        const c = act.id != null ? coberturaActividades?.[act.id] : undefined;
                        let estadoTexto = 'No asignado';
                        let estadoClases =
                          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600';
                        if (c) {
                          if (c.asignados === 0) {
                            estadoTexto = 'No asignado';
                          } else if (c.faltan > 0) {
                            estadoTexto = 'Parcial';
                            estadoClases =
                              'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800';
                          } else {
                            estadoTexto = 'Asignado';
                            estadoClases =
                              'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
                          }
                        }
                        const puedeVerCoberturaDetalle = Boolean(idFicha && act.id != null);
                        return (
                          <DefaultTooltip
                            placement="top"
                            title={<CoberturaAsignacionTooltipContenido c={c} />}
                            classes={{ tooltip: TOOLTIP_COBERTURA_SURFACE }}
                            slotProps={{
                              popper: {
                                modifiers: [
                                  { name: 'offset', options: { offset: [0, 10] } },
                                  { name: 'preventOverflow', options: { padding: 12, altBoundary: true } },
                                  {
                                    name: 'flip',
                                    options: { padding: 12, fallbackPlacements: ['bottom', 'top', 'left', 'right'] }
                                  }
                                ]
                              }
                            }}
                            enterDelay={200}
                            leaveDelay={0}
                          >
                            {puedeVerCoberturaDetalle ? (
                              <button
                                type="button"
                                onClick={() => abrirModalCoberturaAsignacion(act)}
                                className={`inline-flex max-w-full cursor-pointer px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-coal-400 ${estadoClases}`}
                                title="Ver cobertura de asignación por estudiante"
                              >
                                {estadoTexto}
                              </button>
                            ) : (
                              <span
                                className={`inline-flex max-w-full px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border cursor-help ${estadoClases}`}
                              >
                                {estadoTexto}
                              </span>
                            )}
                          </DefaultTooltip>
                        );
                      })()
                    ) : (
                      (() => {
                        const itemAct = item as ItemActividad;
                        let esVencida = itemAct.fechaVencida === true;
                        let esInactiva = itemAct.fechaInactiva === true;
                        if (esVencida === false && itemAct.fechaFinal) {
                          try {
                            const f = new Date(itemAct.fechaFinal);
                            esVencida = !isNaN(f.getTime()) && new Date() > f;
                          } catch {
                            esVencida = false;
                          }
                        }
                        if (esInactiva === false && itemAct.fechaInicial) {
                          try {
                            const fi = new Date(itemAct.fechaInicial);
                            esInactiva = !isNaN(fi.getTime()) && new Date() < fi;
                          } catch {
                            esInactiva = false;
                          }
                        }
                        const estadoTexto = esVencida ? 'Vencida' : esInactiva ? 'Inactiva' : 'Activa';
                        const estadoClases = esVencida
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                          : esInactiva
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
                        const cobEnt = act.id != null ? coberturaActividades?.[act.id] : undefined;
                        const puedeVerDetalleEntregas = Boolean(idFicha && act.id != null);
                        return (
                          <DefaultTooltip
                            placement="top"
                            title={<ResumenEntregasTooltipContenido c={cobEnt} />}
                            classes={{ tooltip: TOOLTIP_COBERTURA_SURFACE }}
                            slotProps={{
                              popper: {
                                modifiers: [
                                  { name: 'offset', options: { offset: [0, 10] } },
                                  { name: 'preventOverflow', options: { padding: 12, altBoundary: true } },
                                  {
                                    name: 'flip',
                                    options: { padding: 12, fallbackPlacements: ['bottom', 'top', 'left', 'right'] }
                                  }
                                ]
                              }
                            }}
                            enterDelay={200}
                            leaveDelay={0}
                          >
                            {puedeVerDetalleEntregas ? (
                              <button
                                type="button"
                                onClick={() => abrirModalEntregables(act)}
                                className={`inline-flex max-w-full cursor-pointer px-3 py-1 sm:px-4 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap shrink-0 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-coal-400 ${estadoClases}`}
                                title="Ver estudiantes y estado de entrega"
                              >
                                {estadoTexto}
                              </button>
                            ) : (
                              <span
                                className={`inline-flex max-w-full cursor-help px-3 py-1 sm:px-4 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap shrink-0 ${estadoClases}`}
                              >
                                {estadoTexto}
                              </span>
                            )}
                          </DefaultTooltip>
                        );
                      })()
                    )}
                  </td>
                  {modo === 'asignadas' && (
                    <td className="py-3 px-1.5 sm:px-2 align-middle overflow-hidden text-center min-w-0 max-w-0">
                      <div className="flex min-w-0 flex-col leading-tight" title={formatearFecha((item as ItemActividad).fechaFinal, true)}>
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{fecha}</span>
                        {hora && <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{hora}</span>}
                      </div>
                    </td>
                  )}
                  <td className="py-3 px-1 sm:px-2 align-middle text-center min-w-0 max-w-[7rem]">
                    <span className="inline-flex max-w-full px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 whitespace-nowrap shrink-0 justify-center truncate" title={act.tipoActividad === 'cuestionario' ? 'Cuestionario' : (act.tipoActividad || '-')}>
                      {act.tipoActividad === 'cuestionario' ? 'Cuestionario' : (act.tipoActividad || '-')}
                    </span>
                  </td>
                  <td className="py-3 px-1.5 sm:px-2 align-middle text-center min-w-0 w-[6.5rem] sm:w-[7.5rem]">
                    <div className="flex items-center justify-center min-w-0">
                      <DropdownAcciones
                        act={act}
                        item={item}
                        modo={modo}
                        idFicha={idFicha}
                        onVer={onVer}
                        onVerAprendices={onVerAprendices}
                        onAmpliar={onAmpliar}
                        onQuitar={onQuitar}
                        onMaterialApoyo={onMaterialApoyo}
                        onMoverActividad={onMoverActividad}
                        onEditar={onEditar}
                        onEliminar={onEliminar}
                        puedeEliminar={puedeEliminar}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      {modo === 'agregar' && onAsignarActividades && confirmAsignarOpen && (
        <Modal open={confirmAsignarOpen} onClose={() => setConfirmAsignarOpen(false)} zIndex={120}>
          <div className="flex min-h-[100dvh] w-full items-center justify-center p-3 sm:py-10 sm:px-5 box-border pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-2xl sm:max-w-3xl md:max-w-4xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
            <ModalContent className="!flex w-full !max-w-none !flex-col !overflow-hidden !rounded-2xl border border-gray-200/80 bg-white !shadow-2xl dark:border-gray-600/60 dark:bg-coal-400 sm:min-w-[min(100%,32rem)] md:min-w-[40rem] max-h-[min(94dvh,960px)] !p-0">
              <ModalHeader className="border-b border-gray-100 dark:border-gray-600/80 px-5 sm:px-6 py-3.5">
                <ModalTitle>Confirma la asignación a la ficha</ModalTitle>
                <button type="button" className="btn btn-sm btn-icon btn-light btn-clear" onClick={() => setConfirmAsignarOpen(false)}>
                  <KeenIcon icon="cross" />
                </button>
              </ModalHeader>
              <div className="min-h-0 max-h-[min(80dvh,820px)] overflow-y-auto [scrollbar-gutter:stable]">
                <ModalBody className="!p-0">
                  <div className="space-y-3 px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  Has seleccionado <strong className="text-base text-gray-900 dark:text-white">{actividadesParaConfirmar.length}</strong>{' '}
                  {actividadesParaConfirmar.length === 1 ? 'actividad' : 'actividades'}.
                  A continuación podrás elegir <strong>estudiantes</strong>, <strong>grupos</strong> y <strong>fechas</strong>.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Si un aprendiz ya recibió la actividad, el sistema <strong>no la duplicará</strong> al mismo destinatario; podrás seguir asignando a quienes falten.
                </p>
                  </div>
                {actividadesParaConfirmar.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-gray-600/50 px-5 sm:px-6 pb-5 sm:pb-6 pt-4">
                    <p className="mb-3 sm:mb-4 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200">
                      Resumen de actividades
                    </p>
                    <div
                      className="max-h-[min(58dvh,36rem)] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50/95 to-white p-4 sm:p-6 dark:border-gray-600 dark:from-coal-500/25 dark:to-coal-400/15"
                    >
                      <ul className="m-0 list-none space-y-5 p-0 sm:space-y-6">
                        {actividadesParaConfirmar.map((a, i) => (
                          <li
                            key={a.id ?? i}
                            className="border-b border-dotted border-gray-200/90 pb-5 last:mb-0 last:border-0 last:pb-0 dark:border-gray-500/80"
                          >
                            <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Código: {codigoVistaActividad(a, i)}
                            </p>
                            <p className="mb-0 mt-2.5 sm:mt-3 text-sm sm:text-base font-medium leading-relaxed text-gray-900 dark:text-white">
                              {a.tituloActividad || '—'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                </ModalBody>
              </div>
              <div className="flex flex-col-reverse gap-2.5 border-t border-gray-200/90 bg-light px-5 py-4 sm:flex-row sm:justify-end sm:gap-3.5 sm:px-6 sm:py-4 dark:border-gray-600/50 dark:bg-coal-300/40">
                  <button
                    type="button"
                    onClick={() => setConfirmAsignarOpen(false)}
                    className="w-full min-w-[7.5rem] rounded-lg border border-transparent bg-gray-200/90 px-5 py-2.5 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-100 sm:w-auto hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmarAsignacionMasiva}
                    className="w-full min-w-[7.5rem] rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white sm:w-auto hover:bg-green-700"
                  >
                    Continuar
                  </button>
              </div>
            </ModalContent>
            </div>
          </div>
        </Modal>
      )}
      {(actividadesFiltradas?.length ?? 0) > 0 && totalPaginas > 1 && (
        <div className="flex flex-col xl:flex-row items-center justify-center mt-4 px-4 py-3 bg-white dark:bg-coal-300 border border-gray-200 dark:border-coal-100 rounded-xl shadow-sm gap-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Mostrando {(paginaActual - 1) * ACTIVIDADES_POR_PAGINA + 1}-
            {Math.min(paginaActual * ACTIVIDADES_POR_PAGINA, actividadesFiltradas?.length ?? 0)} de {actividadesFiltradas?.length ?? 0}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${paginaActual === 1 ? 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-coal-300 dark:text-gray-500' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-coal-400 dark:border-coal-100 dark:text-white dark:hover:bg-coal-500 shadow-sm'}`}
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${paginaActual === totalPaginas ? 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-coal-300 dark:text-gray-500' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-coal-400 dark:border-coal-100 dark:text-white dark:hover:bg-coal-500 shadow-sm'}`}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
      {modo === 'agregar' && (onCrear || onCrearCuestionario || onAsignarActividades) && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          {onAsignarActividades && (
            <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <strong className="text-gray-900 dark:text-white">{seleccionIds.size}</strong> actividad(es) con asignación activa (switch)
              </span>
              {avisoAsignarSinSeleccion && (
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400" role="status">
                  Debes activar al menos un switch de actividad antes de asignar.
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-start gap-2 sm:gap-3">
            {onAsignarActividades && (
              <button
                type="button"
                onClick={solicitarAsignacionMasiva}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors uppercase shadow-sm"
              >
                <KeenIcon icon="users" className="text-sm" />
                Asignar actividades
              </button>
            )}
            {onCrearCuestionario && mostrarCrearCuestionario && (
              <button
                type="button"
                onClick={onCrearCuestionario}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors uppercase shadow-sm"
              >
                <KeenIcon icon="document" className="text-sm" />
                Crear cuestionario
              </button>
            )}
            {onCrear && (
              <button
                type="button"
                onClick={onCrear}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors uppercase shadow-sm"
              >
                <KeenIcon icon="plus" className="text-sm" />
                Crear actividad
              </button>
            )}
          </div>
        </div>
      )}
      {modalCoberturaAsignacion.open && (
        <Modal open={modalCoberturaAsignacion.open} onClose={cerrarModalCoberturaAsignacion} zIndex={125}>
          <div className="flex min-h-[100dvh] w-full items-center justify-center p-3 sm:px-5 sm:py-10 box-border pointer-events-none">
            <div className="pointer-events-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl" onMouseDown={(e) => e.stopPropagation()}>
              <ModalContent className="!flex !max-h-[min(92dvh,720px)] w-full !max-w-none !flex-col !overflow-hidden !rounded-2xl border border-gray-200/90 bg-white !p-0 shadow-2xl dark:border-gray-600/60 dark:bg-coal-400">
                <ModalHeader className="!shrink-0 border-b border-gray-100 px-4 py-3 dark:border-gray-600/80 sm:px-5">
                  <ModalTitle className="text-left text-base">Cobertura de asignación</ModalTitle>
                  <button
                    type="button"
                    className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                    onClick={cerrarModalCoberturaAsignacion}
                    title="Cerrar"
                  >
                    <KeenIcon icon="cross" />
                  </button>
                </ModalHeader>
                <ModalBody className="!flex !min-h-0 !flex-1 !flex-col !gap-0 !overflow-hidden !p-0">
                  {modalCoberturaAsignacion.actividad && (
                    <div className="shrink-0 border-b border-gray-100 bg-gray-50/90 px-4 py-3 dark:border-gray-600/50 dark:bg-coal-500/30 sm:px-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actividad</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {modalCoberturaAsignacion.actividad.tituloActividad || '—'}
                      </p>
                    </div>
                  )}
                  {!modalCoberturaAsignacion.loading && !modalCoberturaAsignacion.error && (
                    <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-600/50 dark:bg-coal-400/95 sm:px-5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Resumen</p>
                      <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                        <div className="rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-2.5 dark:border-gray-600/60 dark:bg-coal-500/25">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Total estudiantes
                          </dt>
                          <dd className="mt-0.5 text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                            {modalCoberturaAsignacion.totalEnFicha}
                          </dd>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 dark:border-emerald-800/40 dark:bg-emerald-900/20">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">Asignados</dt>
                          <dd className="mt-0.5 text-lg font-bold tabular-nums text-emerald-800 dark:text-emerald-100">
                            {modalCoberturaAsignacion.asignados}
                          </dd>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-900/20">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                            Faltan por asignar
                          </dt>
                          <dd className="mt-0.5 text-lg font-bold tabular-nums text-amber-900 dark:text-amber-100">
                            {modalCoberturaAsignacion.faltan}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                  {!modalCoberturaAsignacion.loading && !modalCoberturaAsignacion.error && (
                    <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-600/50 dark:bg-coal-400/95 sm:px-5">
                      <Select
                        inputId="buscar-cobertura"
                        placeholder="Buscar estudiante por nombre, documento o grupo..."
                        isClearable
                        isSearchable
                        menuIsOpen={false}
                        controlShouldRenderValue={false}
                        classNamePrefix="react-select-ciudad-exp"
                        classNames={compactReactSelectClassNames}
                        noOptionsMessage={compactReactSelectNoOptions}
                        value={null}
                        inputValue={busquedaCobertura}
                        onInputChange={(val) => {
                          setBusquedaCobertura(val || '');
                          return val;
                        }}
                      />
                      {busquedaCobertura.trim() ? (
                        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                          Mostrando {asignadosFiltrados.length + pendientesAsignarFiltrados.length} de {modalCoberturaAsignacion.totalEnFicha} estudiantes
                        </p>
                      ) : null}
                    </div>
                  )}
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
                    {modalCoberturaAsignacion.loading && (
                      <div className="flex justify-center py-12">
                        <span className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-b-transparent border-primary" />
                      </div>
                    )}
                    {!modalCoberturaAsignacion.loading && modalCoberturaAsignacion.error && (
                      <p className="text-center text-sm text-red-600 dark:text-red-400">{modalCoberturaAsignacion.error}</p>
                    )}
                    {!modalCoberturaAsignacion.loading && !modalCoberturaAsignacion.error && (
                      <div className="space-y-6">
                        <section>
                          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                            <KeenIcon icon="users" className="text-base" />
                            Ya asignados ({asignadosFiltrados.length}{busquedaCobertura.trim() ? ` de ${modalCoberturaAsignacion.detalleAsignados.length}` : ''})
                          </h3>
                          {asignadosFiltrados.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-3 py-3 text-xs text-gray-500 dark:border-gray-600 dark:bg-coal-500/20 dark:text-gray-400">
                              {busquedaCobertura.trim() ? 'No hay coincidencias en asignados.' : 'Aún no hay aprendices con esta actividad asignada en la ficha.'}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {asignadosFiltrados.map((row) => (
                                <div
                                  key={row.idMatricula}
                                  className="flex gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm dark:border-gray-600/50 dark:bg-coal-500/20"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setZoomFoto({ src: getFotoUrl(row.rutaFoto || undefined), alt: row.nombreCompleto })
                                    }
                                    className="relative h-10 w-10 shrink-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                    title="Ampliar foto"
                                  >
                                    <img
                                      src={getFotoUrl(row.rutaFoto || undefined)}
                                      alt=""
                                      className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-gray-600 cursor-zoom-in"
                                    />
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{row.nombreCompleto}</p>
                                    {row.identificacion ? (
                                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{row.identificacion}</p>
                                    ) : null}
                                    <span className="mt-1.5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-200">
                                      Asignado
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                        <section>
                          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                            <KeenIcon icon="time" className="text-base" />
                            Pendientes por asignar ({pendientesAsignarFiltrados.length}{busquedaCobertura.trim() ? ` de ${modalCoberturaAsignacion.detallePendientes.length}` : ''})
                          </h3>
                          {pendientesAsignarFiltrados.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-emerald-200/80 bg-emerald-50/40 px-3 py-3 text-xs text-emerald-900/90 dark:border-emerald-800/50 dark:bg-emerald-900/15 dark:text-emerald-100">
                              {busquedaCobertura.trim() ? 'No hay coincidencias en pendientes.' : 'No quedan aprendices por asignar: la cobertura de asignación está completa para esta actividad.'}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {pendientesAsignarFiltrados.map((row) => (
                                <div
                                  key={row.idMatricula}
                                  className="flex gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm dark:border-gray-600/50 dark:bg-coal-500/20"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setZoomFoto({ src: getFotoUrl(row.rutaFoto || undefined), alt: row.nombreCompleto })
                                    }
                                    className="relative h-10 w-10 shrink-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                    title="Ampliar foto"
                                  >
                                    <img
                                      src={getFotoUrl(row.rutaFoto || undefined)}
                                      alt=""
                                      className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-gray-600 cursor-zoom-in"
                                    />
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{row.nombreCompleto}</p>
                                    {row.identificacion ? (
                                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{row.identificacion}</p>
                                    ) : null}
                                    <span className="mt-1.5 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-100">
                                      Pendiente por asignar
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      </div>
                    )}
                  </div>
                </ModalBody>
              </ModalContent>
            </div>
          </div>
        </Modal>
      )}
      {modalEntregables.open && (
        <Modal open={modalEntregables.open} onClose={cerrarModalEntregables} zIndex={125}>
          <div className="flex min-h-[100dvh] w-full items-center justify-center p-3 sm:px-5 sm:py-10 box-border pointer-events-none">
            <div className="pointer-events-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl" onMouseDown={(e) => e.stopPropagation()}>
              <ModalContent className="!flex !max-h-[min(92dvh,720px)] w-full !max-w-none !flex-col !overflow-hidden !rounded-2xl border border-gray-200/90 bg-white !p-0 shadow-2xl dark:border-gray-600/60 dark:bg-coal-400">
                <ModalHeader className="!shrink-0 border-b border-gray-100 px-4 py-3 dark:border-gray-600/80 sm:px-5">
                  <ModalTitle className="text-left text-base">Estudiantes y entregas</ModalTitle>
                  <button
                    type="button"
                    className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                    onClick={cerrarModalEntregables}
                    title="Cerrar"
                  >
                    <KeenIcon icon="cross" />
                  </button>
                </ModalHeader>
                <ModalBody className="!flex !min-h-0 !flex-1 !flex-col !gap-0 !overflow-hidden !p-0">
                  {modalEntregables.actividad && (
                    <div className="shrink-0 border-b border-gray-100 bg-gray-50/90 px-4 py-3 dark:border-gray-600/50 dark:bg-coal-500/30 sm:px-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actividad</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{modalEntregables.actividad.tituloActividad || '—'}</p>
                      {modalEntregables.actividad.entregables?.trim() ? (
                        <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{modalEntregables.actividad.entregables}</p>
                      ) : null}
                    </div>
                  )}
                  {!modalEntregables.loading && !modalEntregables.error && (
                    <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-600/50 dark:bg-coal-400/95 sm:px-5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Resumen</p>
                      <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                        <div className="rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-2.5 dark:border-gray-600/60 dark:bg-coal-500/25">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total asignados</dt>
                          <dd className="mt-0.5 text-lg font-bold tabular-nums text-gray-900 dark:text-white">{resumenDetalleEntregas.totalAsignados}</dd>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 dark:border-emerald-800/40 dark:bg-emerald-900/20">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">Entregaron</dt>
                          <dd className="mt-0.5 text-lg font-bold tabular-nums text-emerald-800 dark:text-emerald-100">{resumenDetalleEntregas.entregaron}</dd>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-900/20">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">Pendientes de entrega</dt>
                          <dd className="mt-0.5 text-lg font-bold tabular-nums text-amber-900 dark:text-amber-100">{resumenDetalleEntregas.pendientesEntrega}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                  {!modalEntregables.loading && !modalEntregables.error && (
                    <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-600/50 dark:bg-coal-400/95 sm:px-5">
                      <Select
                        inputId="buscar-entregas"
                        placeholder="Buscar estudiante por nombre, documento, grupo o estado..."
                        isClearable
                        isSearchable
                        menuIsOpen={false}
                        controlShouldRenderValue={false}
                        classNamePrefix="react-select-ciudad-exp"
                        classNames={compactReactSelectClassNames}
                        noOptionsMessage={compactReactSelectNoOptions}
                        value={null}
                        inputValue={busquedaEntregas}
                        onInputChange={(val) => {
                          setBusquedaEntregas(val || '');
                          return val;
                        }}
                      />
                      {busquedaEntregas.trim() ? (
                        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                          Mostrando {entregadosFiltrados.length + pendientesFiltrados.length} de {resumenDetalleEntregas.totalAsignados} asignados
                        </p>
                      ) : null}
                    </div>
                  )}
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
                    {modalEntregables.loading && (
                      <div className="flex justify-center py-12">
                        <span className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-b-transparent border-primary" />
                      </div>
                    )}
                    {!modalEntregables.loading && modalEntregables.error && (
                      <p className="text-center text-sm text-red-600 dark:text-red-400">{modalEntregables.error}</p>
                    )}
                    {!modalEntregables.loading && !modalEntregables.error && (
                      <div className="space-y-6">
                        <section>
                          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                            <KeenIcon icon="check-circle" className="text-base" />
                            Entregaron ({entregadosFiltrados.length}{busquedaEntregas.trim() ? ` de ${entregadosLista.length}` : ''})
                          </h3>
                          {entregadosFiltrados.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-3 py-3 text-xs text-gray-500 dark:border-gray-600 dark:bg-coal-500/20 dark:text-gray-400">
                              {busquedaEntregas.trim() ? 'No hay coincidencias en entregados.' : 'Nadie ha entregado aún esta actividad.'}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {entregadosFiltrados.map((row) => (
                                <div
                                  key={row.idCalificacionActividad}
                                  className="flex gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm dark:border-gray-600/50 dark:bg-coal-500/20"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setZoomFoto({ src: getFotoUrl(row.rutaFoto || undefined), alt: row.nombreAprendiz })
                                    }
                                    className="relative h-10 w-10 shrink-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                    title="Ampliar foto"
                                  >
                                    <img
                                      src={getFotoUrl(row.rutaFoto || undefined)}
                                      alt=""
                                      className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-gray-600 cursor-zoom-in"
                                    />
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{row.nombreAprendiz}</p>
                                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{row.identificacion}</p>
                                    {row.nombreGrupo ? (
                                      <p className="mt-0.5 truncate text-[10px] text-gray-500 dark:text-gray-400">Grupo: {row.nombreGrupo}</p>
                                    ) : null}
                                    <span
                                      className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${badgeEstadoEntrega(row.estado)}`}
                                    >
                                      {etiquetaEstadoEntrega(row.estado)}
                                    </span>
                                    <p className="mt-1 text-[11px] leading-snug text-gray-600 dark:text-gray-300">{textoFechaEntrega(row)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                        <section>
                          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                            <KeenIcon icon="time" className="text-base" />
                            Pendientes de entrega ({pendientesFiltrados.length}{busquedaEntregas.trim() ? ` de ${pendientesLista.length}` : ''})
                          </h3>
                          {pendientesFiltrados.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-emerald-200/80 bg-emerald-50/40 px-3 py-3 text-xs text-emerald-900/90 dark:border-emerald-800/50 dark:bg-emerald-900/15 dark:text-emerald-100">
                              {busquedaEntregas.trim() ? 'No hay coincidencias en pendientes.' : 'Todos los aprendices asignados ya entregaron o están calificados.'}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {pendientesFiltrados.map((row) => (
                                <div
                                  key={row.idCalificacionActividad}
                                  className="flex gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm dark:border-gray-600/50 dark:bg-coal-500/20"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setZoomFoto({ src: getFotoUrl(row.rutaFoto || undefined), alt: row.nombreAprendiz })
                                    }
                                    className="relative h-10 w-10 shrink-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                    title="Ampliar foto"
                                  >
                                    <img
                                      src={getFotoUrl(row.rutaFoto || undefined)}
                                      alt=""
                                      className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-gray-600 cursor-zoom-in"
                                    />
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{row.nombreAprendiz}</p>
                                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{row.identificacion}</p>
                                    {row.nombreGrupo ? (
                                      <p className="mt-0.5 truncate text-[10px] text-gray-500 dark:text-gray-400">Grupo: {row.nombreGrupo}</p>
                                    ) : null}
                                    <span
                                      className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${badgeEstadoEntrega(row.estado)}`}
                                    >
                                      {etiquetaEstadoEntrega(row.estado)}
                                    </span>
                                    <p className="mt-1 text-[11px] leading-snug text-gray-600 dark:text-gray-300">{textoFechaEntrega(row)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      </div>
                    )}
                  </div>
                </ModalBody>
              </ModalContent>
            </div>
          </div>
        </Modal>
      )}
      {zoomFoto && (
        <ImageZoomModal
          open={!!zoomFoto}
          onClose={() => setZoomFoto(null)}
          src={zoomFoto.src}
          alt={zoomFoto.alt}
          title={zoomFoto.alt}
        />
      )}
    </div>
  );
};

export default ListaActividades;

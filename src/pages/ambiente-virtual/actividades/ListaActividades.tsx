import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { KeenIcon, ImageZoomModal } from '@/components';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import axios from 'axios';
import type { Actividad } from './ModalCrearActividad';

const DROPDOWN_WIDTH = 180;
const DROPDOWN_ITEM_HEIGHT = 40;
const DROPDOWN_PADDING = 16;

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
  if (modo === 'agregar' && props.onAsignarActividad) items.push({ icon: 'users', label: 'Asignar actividad', onClick: () => props.onAsignarActividad!(act) });
  if (modo === 'asignadas' && idFicha && props.onVerAprendices) items.push({ icon: 'document', label: 'Ver entregas', onClick: () => props.onVerAprendices!(act) });
  if (modo === 'asignadas' && idFicha && props.onVerAprendices) items.push({ icon: 'check-squared', label: 'Calificar', onClick: () => props.onVerAprendices!(act) });
  if (modo === 'asignadas' && idFicha && props.onAmpliar) items.push({ icon: 'calendar', label: 'Ampliar actividad', onClick: () => props.onAmpliar!(act) });
  if (modo === 'asignadas' && props.onQuitar && item.id != null) items.push({ icon: 'cross', label: 'Quitar', onClick: () => props.onQuitar!(item.id!) });
  if (props.onMaterialApoyo) items.push({ icon: 'folder', label: 'Material de apoyo', onClick: () => props.onMaterialApoyo!(act) });
  if (props.onEditar) items.push({ icon: 'pencil', label: 'Editar actividad', onClick: () => props.onEditar!(act) });
  if (props.onEliminar && (!props.puedeEliminar || props.puedeEliminar(act))) items.push({ icon: 'trash', label: 'Eliminar', onClick: () => props.onEliminar!(act) });

  useEffect(() => {
    if (!abierto) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
        title="Acciones"
      >
        <KeenIcon icon="dots-vertical" className="w-4 h-4" />
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
  /** Ampliar actividad (solo en modo asignadas) */
  onAmpliar?: (actividad: Actividad) => void;
  /** ID de ficha para el modal de aprendices */
  idFicha?: number;
  /** Si false, no se muestra el botón Crear cuestionario (ej. en Actividades asignadas) */
  mostrarCrearCuestionario?: boolean;
  modo: 'agregar' | 'asignadas';
  emptyMessage?: string;
  /** Incrementar para limpiar la selección (ej. tras asignación masiva exitosa) */
  resetSelectionKey?: number;
  /** IDs de actividades ya asignadas a la ficha (solo modo agregar, para mostrar Asignado/No asignado) */
  idsActividadesAsignadas?: Set<number>;
}

const ListaActividades: React.FC<ListaActividadesProps> = ({
  actividades,
  loading = false,
  onCrear,
  onCrearCuestionario,
  onVer,
  onAsignar,
  onAsignarActividad,
  onAsignarActividades,
  onQuitar,
  onMaterialApoyo,
  onEditar,
  onEliminar,
  puedeEliminar,
  onVerAprendices,
  onAmpliar,
  idFicha,
  mostrarCrearCuestionario = true,
  modo,
  emptyMessage,
  resetSelectionKey,
  idsActividadesAsignadas
}) => {
  const nombreCompleto = (p: Actividad['persona']) => {
    if (!p) return 'Sin asignar';
    return `${p.nombre1 || ''} ${p.nombre2 || ''} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim() || 'Sin asignar';
  };
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [seleccionModal, setSeleccionModal] = useState<Set<number>>(new Set());
  const [zoomFoto, setZoomFoto] = useState<{ src: string; alt: string } | null>(null);

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
    if (!modalAsignarOpen) setSeleccionModal(new Set());
  }, [modalAsignarOpen]);

  const toggleActividadModal = (id: number) => {
    setSeleccionModal((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleTodasModal = () => {
    const list = actividadesFiltradas ?? [];
    if (seleccionModal.size === list.length) {
      setSeleccionModal(new Set());
    } else {
      setSeleccionModal(new Set(list.map((item) => (item.actividad || item).id).filter((id): id is number => id != null)));
    }
  };
  const handleAsignarDesdeModal = () => {
    const list = actividadesFiltradas ?? [];
    const seleccionadas = list.filter((item) => {
      const act = item.actividad || item;
      return act.id != null && seleccionModal.has(act.id);
    });
    const acts = seleccionadas.map((item) => item.actividad || item) as Actividad[];
    if (acts.length > 0) {
      onAsignarActividades?.(acts);
      setModalAsignarOpen(false);
      setSeleccionModal(new Set());
    }
  };

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

  const headers = modo === 'agregar'
    ? ['Código', 'Autor', 'Título', 'Entregables', 'Materia', 'Estado', 'Tipo', 'Acciones']
    : ['Código', 'Autor', 'Título', 'Entregables', 'Materia', 'Estado', 'Fecha límite', 'Tipo', 'Acciones'];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="flex-1 relative">
          <KeenIcon icon="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Buscar por título, autor, materia, entregables..."
            value={busqueda}
            onChange={handleBusquedaChange}
            className="input w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400"
          />
        </div>
        {(modo === 'agregar' || modo === 'asignadas') && (onCrear || onCrearCuestionario || onAsignarActividades) && (
          <div className="flex gap-1.5 shrink-0 flex-wrap">
            {modo === 'agregar' && onAsignarActividades && (
              <button
                onClick={() => setModalAsignarOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium"
              >
                <KeenIcon icon="users" className="text-sm" />
                Asignar actividades
              </button>
            )}
            {onCrearCuestionario && mostrarCrearCuestionario && (
              <button
                onClick={onCrearCuestionario}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
              >
                <KeenIcon icon="document" className="text-sm" />
                Crear cuestionario
              </button>
            )}
            {onCrear && (
              <button
                onClick={onCrear}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
              >
                <KeenIcon icon="plus" className="text-sm" />
                Crear Actividad
              </button>
            )}
          </div>
        )}
      </div>
      {(actividadesFiltradas?.length ?? 0) === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          No hay resultados para tu búsqueda. Intenta con otros términos.
        </div>
      ) : (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
        <table className="w-full table-fixed" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '3%' }} />
            <col style={{ width: '4%' }} />
            <col style={{ width: modo === 'asignadas' ? '20%' : '26%' }} />
            <col style={{ width: modo === 'asignadas' ? '14%' : '18%' }} />
            <col style={{ width: modo === 'asignadas' ? '14%' : '18%' }} />
            <col style={{ width: '10%' }} />
            {modo === 'asignadas' && <col style={{ width: '10%' }} />}
            <col style={{ width: '10%' }} />
            <col style={{ width: '5%' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-coal-500/30">
              {headers.map((h) => (
                <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 align-middle">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actividadesPaginadas.map((item, idx) => {
              const act = item.actividad || item;
              const indiceGlobal = (paginaActual - 1) * ACTIVIDADES_POR_PAGINA + idx;
              const codigo = indiceGlobal + 1;
              const { fecha, hora } = formatearFechaCompacta((item as ItemActividad).fechaFinal);
              return (
                <tr
                  key={act.id || act.tituloActividad}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/80 dark:hover:bg-coal-400/30 transition-colors min-h-[48px]"
                >
                  <td className="py-3 px-3 text-xs font-medium text-gray-600 dark:text-gray-400 align-middle">
                    {codigo}
                  </td>
                  <td className="py-3 px-3 align-middle">
                    <button
                      type="button"
                      onClick={() => setZoomFoto({
                        src: getFotoUrl(act.persona?.rutaFotoUrl || act.persona?.rutaFoto),
                        alt: nombreCompleto(act.persona)
                      })}
                      title={nombreCompleto(act.persona)}
                      className="shrink-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 block mx-auto"
                    >
                      <img
                        src={getFotoUrl(act.persona?.rutaFotoUrl || act.persona?.rutaFoto)}
                        alt={nombreCompleto(act.persona)}
                        className="w-8 h-8 rounded-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                      />
                    </button>
                  </td>
                  <td className="py-3 px-3 align-middle overflow-hidden">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-white" title={act.tituloActividad || ''} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.tituloActividad || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-middle overflow-hidden">
                    <span className="block truncate text-xs text-gray-600 dark:text-gray-400" title={act.entregables || '-'} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.entregables || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-middle overflow-hidden">
                    <span className="block truncate text-xs text-gray-600 dark:text-gray-400" title={`${act.materia?.codigo ? act.materia.codigo + ' - ' : ''}${act.materia?.nombreMateria || '-'}`.trim() || '-'} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {`${act.materia?.codigo ? act.materia.codigo + ' - ' : ''}${act.materia?.nombreMateria || '-'}`.trim() || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-middle">
                    {modo === 'agregar' ? (
                      (() => {
                        const estaAsignada = act.id != null && (idsActividadesAsignadas?.has(act.id) ?? false);
                        const estadoTexto = estaAsignada ? 'Asignado' : 'No asignado';
                        const estadoClases = estaAsignada
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
                        return (
                          <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${estadoClases}`}>
                            {estadoTexto}
                          </span>
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
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : esInactiva
                            ? 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                        return (
                          <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${estadoClases}`}>
                            {estadoTexto}
                          </span>
                        );
                      })()
                    )}
                  </td>
                  {modo === 'asignadas' && (
                    <td className="py-3 px-3 align-middle overflow-hidden">
                      <div className="flex flex-col leading-tight min-w-0" title={formatearFecha((item as ItemActividad).fechaFinal, true)}>
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{fecha}</span>
                        {hora && <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{hora}</span>}
                      </div>
                    </td>
                  )}
                  <td className="py-3 px-3 align-middle">
                    <span className="inline-flex px-1.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {act.tipoActividad === 'cuestionario' ? 'Cuestionario' : (act.tipoActividad || '-')}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-middle">
                    <div className="flex items-center justify-end">
                      <DropdownAcciones
                        act={act}
                        item={item}
                        modo={modo}
                        idFicha={idFicha}
                        onVer={onVer}
                        onAsignarActividad={onAsignarActividad}
                        onVerAprendices={onVerAprendices}
                        onAmpliar={onAmpliar}
                        onQuitar={onQuitar}
                        onMaterialApoyo={onMaterialApoyo}
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
      {modo === 'agregar' && onAsignarActividades && modalAsignarOpen && (
        <Modal open={modalAsignarOpen} onClose={() => setModalAsignarOpen(false)} zIndex={120}>
          <ModalContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <ModalHeader>
              <ModalTitle>Asignar actividades</ModalTitle>
              <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={() => setModalAsignarOpen(false)}>
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>
            <ModalBody className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={toggleTodasModal}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {seleccionModal.size === (actividadesFiltradas?.length ?? 0) ? 'Desmarcar todas' : 'Seleccionar todas'}
                </button>
                <span className="text-xs text-gray-500">
                  {seleccionModal.size} seleccionada(s)
                </span>
              </div>
              <ul className="space-y-2">
                {(actividadesFiltradas ?? []).map((item) => {
                  const act = item.actividad || item;
                  if (act.id == null) return null;
                  const checked = seleccionModal.has(act.id);
                  return (
                    <li key={act.id}>
                      <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-coal-500/30 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleActividadModal(act.id!)}
                          className="rounded border-gray-300"
                        />
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                          {act.tituloActividad || 'Sin título'}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0">
                          {act.tipoActividad === 'cuestionario' ? 'Cuestionario' : act.tipoActividad || '-'}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setModalAsignarOpen(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAsignarDesdeModal}
                  disabled={seleccionModal.size === 0}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Asignar {seleccionModal.size} actividad(es)
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
      {(actividadesFiltradas?.length ?? 0) > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Mostrando {(paginaActual - 1) * ACTIVIDADES_POR_PAGINA + 1}-
            {Math.min(paginaActual * ACTIVIDADES_POR_PAGINA, actividadesFiltradas?.length ?? 0)} de {actividadesFiltradas?.length ?? 0}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Siguiente
            </button>
          </div>
        </div>
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

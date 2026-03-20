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

  const tituloSeccion = modo === 'agregar' ? 'Agregar actividades' : 'Actividades asignadas';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center uppercase tracking-tight">
          {tituloSeccion}
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
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
          {(modo === 'agregar' || modo === 'asignadas') && (onCrear || onCrearCuestionario || onAsignarActividades) && (
            <div className="flex gap-2 shrink-0 flex-wrap">
              {modo === 'agregar' && onAsignarActividades && (
                <button
                  onClick={() => setModalAsignarOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors uppercase shadow-sm"
                >
                  <KeenIcon icon="users" className="text-sm" />
                  Asignar actividades
                </button>
              )}
              {onCrearCuestionario && mostrarCrearCuestionario && (
                <button
                  onClick={onCrearCuestionario}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors uppercase shadow-sm"
                >
                  <KeenIcon icon="document" className="text-sm" />
                  Crear cuestionario
                </button>
              )}
              {onCrear && (
                <button
                  onClick={onCrear}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors uppercase shadow-sm"
                >
                  <KeenIcon icon="plus" className="text-sm" />
                  Crear actividad
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {(actividadesFiltradas?.length ?? 0) === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          No hay resultados para tu búsqueda. Intenta con otros términos.
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full table-fixed min-w-[1100px]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: modo === 'asignadas' ? '17%' : '22%' }} />
            <col style={{ width: modo === 'asignadas' ? '12%' : '15%' }} />
            <col style={{ width: modo === 'asignadas' ? '12%' : '15%' }} />
            <col style={{ width: '118px' }} />
            {modo === 'asignadas' && <col style={{ width: '9%' }} />}
            <col style={{ width: '130px' }} />
            <col style={{ width: '150px' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {headers.map((h) => (
                <th key={h} className={`py-4 px-4 text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase ${h === 'Código' ? 'pr-6' : ''} ${h === 'Autor' ? 'pl-2 pr-6' : ''} ${['Estado', 'Tipo', 'Acciones'].includes(h) ? 'px-5 text-center' : 'text-left'}`}>
                  {h}
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
                  <td className="py-5 px-4 pr-6 text-xs font-semibold text-gray-700 dark:text-gray-300 align-middle" style={{ minWidth: 60 }}>
                    {codigo}
                  </td>
                  <td className="py-5 pl-2 pr-6 align-middle" style={{ minWidth: 80 }}>
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
                  <td className="py-5 px-4 align-middle overflow-hidden max-w-[220px]">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 uppercase leading-relaxed truncate block" title={act.tituloActividad || ''}>
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
                  <td className="py-5 px-4 align-middle overflow-hidden max-w-[180px]">
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 uppercase font-medium leading-relaxed truncate block" title={act.entregables || '-'}>
                      {act.entregables || '-'}
                    </span>
                  </td>
                  <td className="py-5 px-4 align-middle overflow-hidden max-w-[180px]">
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 uppercase font-medium leading-relaxed truncate block" title={`${act.materia?.codigo ? act.materia.codigo + ' - ' : ''}${act.materia?.nombreMateria || '-'}`.trim() || '-'}>
                      {`${act.materia?.codigo ? act.materia.codigo + ' - ' : ''}${act.materia?.nombreMateria || '-'}`.trim() || '-'}
                    </span>
                  </td>
                  <td className="py-5 px-5 align-middle text-center w-[118px]">
                    {modo === 'agregar' ? (
                      (() => {
                        const estaAsignada = act.id != null && (idsActividadesAsignadas?.has(act.id) ?? false);
                        const estadoTexto = estaAsignada ? 'Asignado' : 'No asignado';
                        const estadoClases = estaAsignada
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                          : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600';
                        return (
                          <span className={`inline-flex px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap shrink-0 ${estadoClases}`}>
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
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                          : esInactiva
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
                        return (
                          <span className={`inline-flex px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap shrink-0 ${estadoClases}`}>
                            {estadoTexto}
                          </span>
                        );
                      })()
                    )}
                  </td>
                  {modo === 'asignadas' && (
                    <td className="py-5 px-4 align-middle overflow-hidden text-center">
                      <div className="flex flex-col leading-tight min-w-0" title={formatearFecha((item as ItemActividad).fechaFinal, true)}>
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{fecha}</span>
                        {hora && <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{hora}</span>}
                      </div>
                    </td>
                  )}
                  <td className="py-5 px-5 align-middle text-center w-[130px]">
                    <span className="inline-flex px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 whitespace-nowrap shrink-0 justify-center" title={act.tipoActividad === 'cuestionario' ? 'Cuestionario' : (act.tipoActividad || '-')}>
                      {act.tipoActividad === 'cuestionario' ? 'Cuestionario' : (act.tipoActividad || '-')}
                    </span>
                  </td>
                  <td className="py-5 px-5 align-middle text-center w-[150px]">
                    <div className="flex items-center justify-center">
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

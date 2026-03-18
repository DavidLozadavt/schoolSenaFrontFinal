import React, { useState, useMemo, useEffect } from 'react';
import { KeenIcon } from '@/components';
import type { Actividad } from './ModalCrearActividad';

const ACTIVIDADES_POR_PAGINA = 20;
const MAX_PALABRAS = 6;

const truncarAPalabras = (texto: string | undefined, maxPalabras: number = MAX_PALABRAS): string => {
  if (!texto || !String(texto).trim()) return '-';
  const palabras = String(texto).trim().split(/\s+/);
  if (palabras.length <= maxPalabras) return texto;
  return palabras.slice(0, maxPalabras).join(' ') + '…';
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
  resetSelectionKey
}) => {
  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState<Set<number>>(new Set());
  const nombreCompleto = (p: Actividad['persona']) => {
    if (!p) return 'Sin asignar';
    return `${p.nombre1 || ''} ${p.nombre2 || ''} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim() || 'Sin asignar';
  };
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  const actividadesFiltradas = useMemo(() => {
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
    const inicio = (paginaActual - 1) * ACTIVIDADES_POR_PAGINA;
    return actividadesFiltradas.slice(inicio, inicio + ACTIVIDADES_POR_PAGINA);
  }, [actividadesFiltradas, paginaActual]);
  const totalPaginas = Math.ceil(actividadesFiltradas.length / ACTIVIDADES_POR_PAGINA);

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
    if (resetSelectionKey != null && resetSelectionKey > 0) {
      setActividadesSeleccionadas(new Set());
    }
  }, [resetSelectionKey]);

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

  if (!actividades || actividades.length === 0) {
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

  const mostrarSeleccion = modo === 'agregar' && onAsignarActividades;
  const toggleActividad = (id: number) => {
    setActividadesSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleTodasActividades = () => {
    if (actividadesSeleccionadas.size === actividadesPaginadas.length) {
      setActividadesSeleccionadas(new Set());
    } else {
      setActividadesSeleccionadas(new Set(actividadesPaginadas.map((item) => (item.actividad || item).id).filter((id): id is number => id != null)));
    }
  };
  const handleAsignarSeleccionadas = () => {
    const seleccionadas = actividadesFiltradas.filter((item) => {
      const act = item.actividad || item;
      return act.id != null && actividadesSeleccionadas.has(act.id);
    });
    const acts = seleccionadas.map((item) => item.actividad || item) as Actividad[];
    if (acts.length > 0) onAsignarActividades?.(acts);
  };

  const headers = mostrarSeleccion ? ['', 'Código', 'Autor', 'Título', 'Entregables', 'Materia', 'Estado', 'Tipo', 'Acciones'] : ['Código', 'Autor', 'Título', 'Entregables', 'Materia', 'Estado', 'Tipo', 'Acciones'];

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
          <div className="flex gap-2 shrink-0 flex-wrap">
            {modo === 'agregar' && onAsignarActividades && actividadesSeleccionadas.size > 0 && (
              <button
                onClick={handleAsignarSeleccionadas}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium"
              >
                <KeenIcon icon="users" className="text-sm" />
                Asignar {actividadesSeleccionadas.size} seleccionada(s)
              </button>
            )}
            {onCrearCuestionario && mostrarCrearCuestionario && (
            <button
              onClick={onCrearCuestionario}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <KeenIcon icon="document" className="text-sm" />
              Crear cuestionario
            </button>
          )}
            {onCrear && (
              <button
                onClick={onCrear}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <KeenIcon icon="plus" className="text-sm" />
                Crear Actividad
              </button>
            )}
          </div>
        )}
      </div>
      {actividadesFiltradas.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          No hay resultados para tu búsqueda. Intenta con otros términos.
        </div>
      ) : (
      <div className="">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {headers.map((h) => (
                <th key={h === '' ? 'sel' : h} className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {h === '' && mostrarSeleccion ? (
                    <input
                      type="checkbox"
                      checked={actividadesPaginadas.length > 0 && actividadesPaginadas.every((item) => (item.actividad || item).id != null && actividadesSeleccionadas.has((item.actividad || item).id!))}
                      onChange={toggleTodasActividades}
                      className="rounded border-gray-300"
                    />
                  ) : (
                    h
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actividadesPaginadas.map((item, idx) => {
              const act = item.actividad || item;
              const indiceGlobal = (paginaActual - 1) * ACTIVIDADES_POR_PAGINA + idx;
              const codigo = indiceGlobal + 1;
              return (
                <tr
                  key={act.id || act.tituloActividad}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-coal-400/50 transition-colors"
                >
                  {mostrarSeleccion && (
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={act.id != null && actividadesSeleccionadas.has(act.id)}
                        onChange={() => act.id != null && toggleActividad(act.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="py-3 px-3 text-xs font-medium text-gray-900 dark:text-white">
                    {codigo}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={act.persona?.rutaFotoUrl || act.persona?.rutaFoto || '/media/avatars/blank.png'}
                        alt={nombreCompleto(act.persona)}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300 text-center max-w-[80px] truncate block">
                        {nombreCompleto(act.persona)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="max-w-[180px]">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        <CeldaConTooltip
                          textoCompleto={act.tituloActividad || ''}
                          textoTruncado={truncarAPalabras(act.tituloActividad)}
                        />
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300 max-w-[140px]">
                    <CeldaConTooltip
                      textoCompleto={act.entregables || '-'}
                      textoTruncado={truncarAPalabras(act.entregables)}
                    />
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300 max-w-[160px]">
                    <CeldaConTooltip
                      textoCompleto={`${act.materia?.codigo ? act.materia.codigo + ' - ' : ''}${act.materia?.nombreMateria || '-'}`.trim() || '-'}
                      textoTruncado={truncarAPalabras(`${act.materia?.codigo ? act.materia.codigo + ' - ' : ''}${act.materia?.nombreMateria || '-'}`.trim() || '-')}
                    />
                  </td>
                  <td className="py-3 px-3">
                    {(() => {
                      const itemAct = item as ItemActividad;
                      // Estado calculado solo por: fecha inicio, fecha límite y hora actual
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
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estadoClases}`}>
                          {estadoTexto}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300 capitalize">
                    {act.tipoActividad === 'cuestionario' ? 'Cuestionario' : (act.tipoActividad || '-')}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-start gap-2">
                      {modo === 'agregar' && onAsignarActividad && (
                        <button
                          onClick={() => onAsignarActividad(act)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                          <KeenIcon icon="users" className="text-xs" />
                          Asignar actividad
                        </button>
                      )}
                      {modo === 'asignadas' && onQuitar && (item as { id?: number }).id != null && (
                        <button
                          onClick={() => onQuitar((item as { id: number }).id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded"
                          title="Quitar de asignadas"
                        >
                          <KeenIcon icon="cross" className="text-xs" />
                          Quitar
                        </button>
                      )}
                      <div className="flex items-center gap-1.5">
                        {modo === 'asignadas' && idFicha && onVerAprendices && (
                          <button
                            onClick={() => onVerAprendices(act)}
                            className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 relative"
                            title="Ver aprendices asignados"
                          >
                            <KeenIcon icon="users" className="text-sm" />
                          </button>
                        )}
                        {modo === 'asignadas' && idFicha && onAmpliar && (
                          <button
                            onClick={() => onAmpliar(act)}
                            className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                            title="Ampliar actividad"
                          >
                            <KeenIcon icon="calendar" className="text-sm" />
                          </button>
                        )}
                        {onVer && (
                          <button
                            onClick={() => onVer(act)}
                            className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                            title="Ver"
                          >
                            <KeenIcon icon="eye" className="text-sm" />
                          </button>
                        )}
                        {onMaterialApoyo && (
                          <button
                            onClick={() => onMaterialApoyo(act)}
                            className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                            title="Material de apoyo"
                          >
                            <KeenIcon icon="folder" className="text-sm" />
                          </button>
                        )}
                        {onEditar && (
                          <button
                            onClick={() => onEditar(act)}
                            className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                            title="Editar"
                          >
                            <KeenIcon icon="pencil" className="text-sm" />
                          </button>
                        )}
                        {onEliminar && (!puedeEliminar || puedeEliminar(act)) && (
                          <button
                            onClick={() => onEliminar(act)}
                            className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600"
                            title="Eliminar (solo si no está asignada)"
                          >
                            <KeenIcon icon="trash" className="text-sm" />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      {actividadesFiltradas.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Mostrando {(paginaActual - 1) * ACTIVIDADES_POR_PAGINA + 1}-
            {Math.min(paginaActual * ACTIVIDADES_POR_PAGINA, actividadesFiltradas.length)} de {actividadesFiltradas.length}
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
    </div>
  );
};

export default ListaActividades;

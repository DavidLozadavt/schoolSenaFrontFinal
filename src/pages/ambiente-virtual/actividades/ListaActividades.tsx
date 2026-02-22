import React, { useState, useMemo } from 'react';
import { KeenIcon } from '@/components';
import type { Actividad } from './ModalCrearActividad';

const ACTIVIDADES_POR_PAGINA = 6;

interface ListaActividadesProps {
  actividades: (Actividad & { actividad?: Actividad; id?: number })[];
  loading?: boolean;
  onCrear?: () => void;
  onCrearCuestionario?: () => void;
  onVer?: (actividad: Actividad) => void;
  onAsignar?: (actividad: Actividad) => void;
  onQuitar?: (idPlaneacionActividad: number) => void;
  onMaterialApoyo?: (actividad: Actividad) => void;
  onEditar?: (actividad: Actividad) => void;
  onEliminar?: (actividad: Actividad) => void;
  modo: 'agregar' | 'asignadas';
  emptyMessage?: string;
}

const ListaActividades: React.FC<ListaActividadesProps> = ({
  actividades,
  loading = false,
  onCrear,
  onCrearCuestionario,
  onVer,
  onAsignar,
  onQuitar,
  onMaterialApoyo,
  onEditar,
  onEliminar,
  modo,
  emptyMessage
}) => {
  const nombreCompleto = (p: Actividad['persona']) => {
    if (!p) return 'Sin asignar';
    return `${p.nombre1 || ''} ${p.nombre2 || ''} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim() || 'Sin asignar';
  };
  const [paginaActual, setPaginaActual] = useState(1);
  const actividadesPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * ACTIVIDADES_POR_PAGINA;
    return actividades.slice(inicio, inicio + ACTIVIDADES_POR_PAGINA);
  }, [actividades, paginaActual]);
  const totalPaginas = Math.ceil(actividades.length / ACTIVIDADES_POR_PAGINA);

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

  const headers = ['Código', 'Autor', 'Título', 'Entregables', 'Materia', 'Estado', 'Tipo', 'Acciones'];

  return (
    <div className="space-y-3">
      {(modo === 'agregar' || modo === 'asignadas') && (onCrear || onCrearCuestionario) && (
        <div className="flex justify-end gap-2 mb-3">
          {onCrearCuestionario && (
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {headers.map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actividadesPaginadas.map((item, idx) => {
              const act = item.actividad || item;
              const codigo = (paginaActual - 1) * ACTIVIDADES_POR_PAGINA + idx + 1;
              return (
                <tr
                  key={act.id || act.tituloActividad}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-coal-400/50 transition-colors"
                >
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
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{act.tituloActividad}</p>
                      {act.descripcionActividad && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                          {act.descripcionActividad}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300">
                    {act.entregables || '-'}
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300">
                    {act.materia?.codigo ? `${act.materia.codigo} - ` : ''}
                    {act.materia?.nombreMateria || '-'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {act.estado?.estado || 'ACTIVO'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300 capitalize">
                    {act.tipoActividad === 'cuestionario' ? 'Cuestionario' : (act.tipoActividad || '-')}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-start gap-2">
                      {modo === 'agregar' && onAsignar && (
                        <button
                          onClick={() => onAsignar(act)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                          <KeenIcon icon="check" className="text-xs" />
                          Asignar
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
                        {onEliminar && (
                          <button
                            onClick={() => onEliminar(act)}
                            className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600"
                            title="Eliminar"
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
      {actividades.length > ACTIVIDADES_POR_PAGINA && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Mostrando {(paginaActual - 1) * ACTIVIDADES_POR_PAGINA + 1}-
            {Math.min(paginaActual * ACTIVIDADES_POR_PAGINA, actividades.length)} de {actividades.length}
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

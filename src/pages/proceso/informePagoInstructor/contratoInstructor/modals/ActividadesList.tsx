import React from 'react';
import { ActividadContrato } from '../types';

interface ActividadesListProps {
  actividades: ActividadContrato[];
  loading: boolean;
  baseActividadIds: number[];
  onEdit: (actividad: ActividadContrato) => void;
  onDelete: (id: number) => void;
  onShowHelp: () => void;
}

export const ActividadesList: React.FC<ActividadesListProps> = ({
  actividades,
  loading,
  baseActividadIds,
  onEdit,
  onDelete,
  onShowHelp
}) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <i className="ki-outline ki-notification-status text-gray-400" />
        Actividades Registradas
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-coal-400 text-gray-600 dark:text-gray-400">
          {actividades.length}
        </span>
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : actividades.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-coal-400 rounded-lg border border-gray-200 dark:border-coal-300 flex flex-col items-center">
          <i className="ki-outline ki-file-deleted text-4xl text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            No hay actividades registradas
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-5">
            Para este contrato se requieren 6 actividades base.
          </p>
          <button
            onClick={onShowHelp}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-all"
          >
            <i className="ki-outline ki-information text-base" />
            Ver ayuda y generar actividades
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {actividades.map((actividad, index) => (
            <div
              key={actividad.id}
              className="bg-white dark:bg-coal-400 rounded-lg border border-gray-200 dark:border-coal-300 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <i className="ki-outline ki-document text-indigo-600 dark:text-indigo-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Actividad # {index + 1}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(actividad.created_at).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(actividad)}
                    className="w-7 h-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors"
                    title="Editar"
                  >
                    <i className="ki-outline ki-pencil text-blue-600 dark:text-blue-400 text-sm" />
                  </button>
                  {!baseActividadIds.includes(actividad.id) && (
                    <button
                      onClick={() => onDelete(actividad.id)}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors"
                      title="Eliminar"
                    >
                      <i className="ki-outline ki-trash text-red-600 dark:text-red-400 text-sm" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Obligaciones:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {actividad.obligaciones}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Acciones Realizadas:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {actividad.accionesRealizadas}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Evidencias:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {actividad.evidencias}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

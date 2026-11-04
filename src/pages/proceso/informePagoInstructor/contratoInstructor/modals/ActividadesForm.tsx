import React from 'react';
import { ActividadFormData } from '../types';

interface ActividadesFormProps {
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  formData: ActividadFormData;
  onFormChange: (data: ActividadFormData) => void;
  onToggle: (open: boolean) => void;
  onSave: () => void;
  onCancel?: () => void;
}

export const ActividadesForm: React.FC<ActividadesFormProps> = ({
  isOpen,
  isEditing,
  loading,
  formData,
  onFormChange,
  onToggle,
  onSave,
  onCancel
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-xl p-5 mb-6 border border-blue-200 dark:border-blue-500/30">
      <div
        onClick={() => onToggle(!isOpen)}
        className="cursor-pointer flex items-center justify-between mb-4"
      >
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <i className="ki-outline ki-add-item text-blue-600 dark:text-blue-400" />
          {isEditing ? 'Editar Actividad' : 'Nueva Actividad'}
        </h3>

        <i
          className={`ki-outline ${
            isOpen ? 'ki-up' : 'ki-down'
          } text-gray-500 transition-transform`}
        />
      </div>

      {isOpen && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Obligaciones
            </label>
            <textarea
              rows={3}
              value={formData.obligaciones}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  obligaciones: e.target.value.toUpperCase()
                })
              }
              placeholder="DESCRIPCIÓN DE LAS OBLIGACIONES..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Acciones Realizadas
            </label>
            <textarea
              rows={3}
              value={formData.accionesRealizadas}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  accionesRealizadas: e.target.value.toUpperCase()
                })
              }
              placeholder="DESCRIPCIÓN DE LAS ACCIONES REALIZADAS..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Evidencias
            </label>
            <textarea
              rows={3}
              value={formData.evidencias}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  evidencias: e.target.value.toUpperCase()
                })
              }
              placeholder="EVIDENCIAS PRESENTADAS..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            {isEditing && onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-300 transition-all"
              >
                Cancelar edición
              </button>
            )}
            <button
              onClick={onSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <i className="ki-outline ki-check text-sm" />
                  {isEditing ? 'Actualizar' : 'Crear Actividad'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

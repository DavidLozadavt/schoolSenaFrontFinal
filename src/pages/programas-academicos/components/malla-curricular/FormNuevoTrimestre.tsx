import React from 'react';
import { Save, X } from 'lucide-react';

interface FormNuevoTrimestreProps {
  trimestre: any;
  guardando: boolean;
  onActualizarFechaFin: (fecha: string) => void;
  onAbrirMaterias: () => void;
  onGuardar: () => void;
  onCancelar: () => void;
  trimestres: any[];
}

const formatearFecha = (fecha: string) =>
  fecha ? new Date(fecha).toISOString().split('T')[0] : '';

export const FormNuevoTrimestre: React.FC<FormNuevoTrimestreProps> = ({
  trimestre,
  trimestres,
  guardando,
  onActualizarFechaFin,
  onAbrirMaterias,
  onGuardar,
  onCancelar
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-coal-500 rounded-xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200 dark:border-gray-600">
          <h3 className="text-2xl font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <span className="text-primary">#{trimestre.numeroGrado}</span> 
            TRIMESTRE
            <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">NUEVO</span>
          </h3>
          <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            EN EDICIÓN
          </span>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={trimestre.length > 0 ? formatearFecha(trimestre.fechaInicio) : formatearFecha(new Date().toISOString().split('T')[0])}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-coal-400 text-gray-600 dark:text-gray-300"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Calculada desde el último trimestre
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={trimestre.fechaFin}
              min={formatearFecha(trimestre.fechaInicio)}
              onChange={(e) => onActualizarFechaFin(e.target.value)}
              className="w-full px-4 py-2 border-2 border-primary dark:border-primary rounded-lg bg-white dark:bg-coal-400 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Materias - Mostrar IDs */}
        <div className="mb-6">
          <h4 className="text-sm font-black uppercase text-gray-700 dark:text-gray-200 border-l-4 border-primary pl-3 mb-4">
            Competencias Asignadas
          </h4>

          {trimestre.materias && trimestre.materias.length > 0 ? (
            <div className="bg-gray-50 dark:bg-coal-400 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600">
              <div className="flex flex-wrap gap-2">
                {trimestre.materias.map((idMateria: number) => (
                  <span 
                    key={idMateria}
                    className="px-3 py-1.5 bg-primary text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-md"
                  >
                    <i className="ki-outline ki-book text-sm"></i>
                    Competencia ID: {idMateria}
                  </span>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-2">
                  <i className="ki-outline ki-check-circle text-primary"></i>
                  Total: {trimestre.materias.length} competencia(s) seleccionada(s)
                </p>
                <p className="text-4xs text-primary font-mono mt-1">
                  IDs: [{trimestre.materias.join(', ')}]
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 dark:bg-coal-400 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <i className="ki-outline ki-book text-3xl text-gray-400 mb-2 block"></i>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No hay competencias asignadas
              </p>
            </div>
          )}

          <button
            onClick={onAbrirMaterias}
            className="w-full py-3 mt-4 font-bold text-gray-600 dark:text-gray-300 uppercase transition-all border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary hover:text-white hover:bg-primary text-sm hover:shadow-lg active:scale-95"
          >
            <i className="mr-2 ki-outline ki-plus"></i>
            Agregar Competencias
          </button>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-600">
          <button
            onClick={onGuardar}
            disabled={guardando}
            className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-bold uppercase text-sm hover:bg-primary-active transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Trimestre
              </>
            )}
          </button>

          <button
            onClick={onCancelar}
            disabled={guardando}
            className="py-3 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold uppercase text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <X size={16} />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onGenerateActividades: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  loading,
  onClose,
  onGenerateActividades
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-coal-500 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-coal-300 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="ki-outline ki-information text-blue-500" />
            Básico - 6 Actividades Requeridas
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-400 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <i className="ki-outline ki-cross text-gray-500 dark:text-gray-400 text-lg" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Aquí se crean 6 actividades base predefinidas que se registrarán para tu contrato.
            Como instructor, es fundamental que estas actividades formen parte de tu plan de
            trabajo. Puedes generarlas automáticamente aquí y luego editarlas en caso de
            requerir precisiones, pero no podrán eliminarse.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-coal-300 flex justify-end gap-3 bg-gray-50 dark:bg-coal-400/50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onGenerateActividades}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <i className="ki-outline ki-check text-base" />
                Generar las 6 Actividades Base
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

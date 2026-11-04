import React from 'react';

interface MissingFieldsModalProps {
  isOpen: boolean;
  missingFields: string[];
  onClose: () => void;
}

export const MissingFieldsModal: React.FC<MissingFieldsModalProps> = ({
  isOpen,
  missingFields,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-coal-500 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-coal-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center">
              <i className="ki-outline ki-information-4 text-yellow-600 dark:text-yellow-400 text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Campos faltantes
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Completa los siguientes campos antes de continuar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-400 flex items-center justify-center transition-colors"
          >
            <i className="ki-outline ki-cross text-gray-500 dark:text-gray-400 text-lg" />
          </button>
        </div>

        <div className="p-6">
          <ul className="space-y-2">
            {missingFields.map((field, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-3"
              >
                <i className="ki-outline ki-circle-small text-yellow-500 mt-1" />
                <span>{field}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-coal-300 flex justify-end gap-3 bg-gray-50 dark:bg-coal-400/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

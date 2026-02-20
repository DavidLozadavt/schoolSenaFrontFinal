import React from "react";

interface ModalErrorProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

const ModalError: React.FC<ModalErrorProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in">
      <div className="bg-white dark:bg-coal-400 dark:border-coal-100 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <i className="ki-filled ki-cross-circle text-red-600 text-xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            No se pudo completar la acción
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {message}
        </p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};


export default ModalError;
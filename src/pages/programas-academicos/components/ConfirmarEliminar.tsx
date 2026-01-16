import React from 'react';

interface ConfirmarEliminarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nombrePrograma?: string;
}

const ConfirmarEliminar = ({ isOpen, onClose, onConfirm, nombrePrograma }: ConfirmarEliminarProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-coal-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm overflow-hidden bg-white border border-gray-200 dark:bg-coal-600 rounded-xl shadow-modal dark:border-coal-100">
        <div className="p-7.5 text-center">
          {/* Icono de Alerta con tus colores de Danger */}
          <div className="flex items-center justify-center mx-auto mb-5 rounded-full w-14 h-14 bg-danger-light dark:bg-danger/10">
            <i className="text-2xl ki-outline ki-trash text-danger"></i>
          </div>
          
          <h3 className="mb-2 font-bold tracking-wider text-gray-900 uppercase text-md dark:text-gray-dark-900">
            ¿Confirmar Eliminación?
          </h3>
          
          <p className="mb-6 leading-relaxed text-gray-500 text-2sm dark:text-gray-dark-500">
            Estás a punto de eliminar el programa <br />
            <span className="font-bold text-gray-800 uppercase dark:text-white">{nombrePrograma || 'este programa'}</span>. 
            Esta acción no se puede deshacer.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 font-bold tracking-widest uppercase border border-gray-300 btn btn-sm btn-light text-2xs dark:border-coal-100"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={() => { onConfirm(); onClose(); }}
              className="px-6 py-2 font-bold tracking-widest uppercase btn btn-sm btn-danger text-2xs shadow-danger"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarEliminar;
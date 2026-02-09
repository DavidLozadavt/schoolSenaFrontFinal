import { KeenIcon } from '@/components';
import React from 'react';

interface ModalEliminarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;

  /** Texto configurable */
  titulo?: string;
  entidad?: string; // "sede", "programa", "usuario", etc.
  nombre?: string;

  /** Opcionales */
  descripcion?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  loading?: boolean;
}

const ModalEliminar: React.FC<ModalEliminarProps> = ({
  isOpen,
  onClose,
  onConfirm,
  titulo = '¿Confirmar eliminación?',
  entidad = 'elemento',
  nombre,
  descripcion,
  textoConfirmar = 'Eliminar',
  textoCancelar = 'Cancelar',
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in">
      <div className="bg-white dark:bg-coal-400 dark:border-coal-100 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        <div className="bg-white dark:bg-coal-400 dark:border-coal-100 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
          <div className="flex items-center gap-4 mb-4">
            {/* Icono */}
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <KeenIcon icon="information" className="text-2xl text-red-600" />
            </div>
            <div>
              <h3 className="mb-2 font-bold text-gray-900">
                {titulo}
              </h3>
              <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
            </div>
          </div>

          {/* Descripción */}
          <p className="text-sm text-gray-600 mb-6">
            {descripcion ? (
              descripcion
            ) : (
              <div className='text-sm text-gray-600 mb-6'>
                Estás a punto de eliminar {entidad}{' '}
                {nombre && (
                  <>
                    <br />
                    <span className="font-bold">{nombre}</span>
                  </>
                )}
              </div>
            )}
          </p>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            >
              {textoCancelar}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            >
              {loading ? 'Eliminando...' : textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalEliminar;

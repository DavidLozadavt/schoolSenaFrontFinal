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
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-coal-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm overflow-hidden bg-white border border-gray-200 rounded-xl shadow-modal">
        <div className="p-7.5 text-center">

          {/* Icono */}
          <div className="flex items-center justify-center mx-auto mb-5 rounded-full w-14 h-14 bg-danger-light">
            <i className="text-2xl ki-outline ki-trash text-danger"></i>
          </div>

          {/* Título */}
          <h3 className="mb-2 font-bold tracking-wider text-gray-900 uppercase text-md">
            {titulo}
          </h3>

          {/* Descripción */}
          <p className="mb-6 leading-relaxed text-gray-500 text-2sm">
            {descripcion ? (
              descripcion
            ) : (
              <>
                Estás a punto de eliminar {entidad}{' '}
                {nombre && (
                  <>
                    <br />
                    <span className="font-bold text-gray-800 uppercase">
                      {nombre}
                    </span>
                  </>
                )}
                . Esta acción no se puede deshacer.
              </>
            )}
          </p>

          {/* Botones */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 font-bold tracking-widest uppercase border border-gray-300 btn btn-sm btn-light text-2xs"
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
              className="px-6 py-2 font-bold tracking-widest uppercase btn btn-sm btn-danger text-2xs shadow-danger disabled:opacity-50"
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

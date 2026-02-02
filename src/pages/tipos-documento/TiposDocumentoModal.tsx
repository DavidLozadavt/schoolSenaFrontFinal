import { useState } from 'react';
import { TipoDocumentoContent } from './TipoDocumentoContent';
import { ModalTipoDocumento } from './ModalTipoDocumento';

interface TiposDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal que muestra el contenido original de Tipos de Documentos
 * (Config de Documentos → Tipos de Documentos) para usarse desde Programas.
 */
const TiposDocumentoModal = ({ isOpen, onClose }: TiposDocumentoModalProps) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(0);

  if (!isOpen) return null;

  const handleAfterSave = () => {
    setReloadContent((prev) => prev + 1);
    setCreateModalOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-[95vw] xl:max-w-7xl max-h-[90vh] flex flex-col bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-gray-800 dark:text-white">
                Tipos de Documentos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Gestiona los tipos de documento
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="btn btn-sm btn-light"
              >
                Nuevo tipo de documento
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white"
              >
                <i className="text-lg ki-filled ki-cross" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-auto p-5">
            <TipoDocumentoContent reload={reloadContent} />
          </div>
        </div>
      </div>

      <ModalTipoDocumento
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleAfterSave}
      />
    </>
  );
};

export { TiposDocumentoModal };

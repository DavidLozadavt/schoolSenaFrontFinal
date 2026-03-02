import React, { useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

// Definimos endpoints por entidad
const ENDPOINTS: Record<string, { upload: string; procedure: string }> = {
  trabajadores: {
    upload: '/cargar-trabajadores',
    procedure: '/ejecutar_procedimiento_trabajadores'
  },
  estudiantes: {
    upload: '/cargar-estudiantes',
    procedure: '/procedimientoEstudiantes'
  },
  productos: {
    upload: '/cargar-productos',
    procedure: '/procedimientoProductos'
  },
  infraestructura: {
    upload: '/cargar-infraestructura',
    procedure: '/procedimientoInfraestructura'
  },
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (file: File | null, entity?: string) => void;
  entity?: string;
}

const ModalMigracionDatos = ({ open, onClose, onSave, entity = 'trabajadores' }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const label = entity?.charAt(0).toUpperCase() + entity?.slice(1);

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSave = async () => {
    if (!file) {
      enqueueSnackbar('Debes seleccionar un archivo', { variant: 'warning' });
      return;
    }

    const delay = (ms: number) =>
      new Promise(resolve => setTimeout(resolve, ms));

    try {
      const formData = new FormData();
      formData.append('archivo', file);

      await axios.post('/cargar-trabajadores', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('Archivo cargado, procesando información...', {
        variant: 'info',
      });

      await delay(4000);

      await axios.post('/ejecutar_procedimiento_trabajadores');

      enqueueSnackbar('Proceso finalizado correctamente', {
        variant: 'success',
      });

      onClose();

    } catch (error: any) {
      console.error('Error en migración:', error);

      enqueueSnackbar(
        error.response?.data?.message || 'Error en la carga o ejecución',
        { variant: 'error' }
      );
    }
  };


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 items-center justify-center px-4">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl dark:border-coal-100 bg-white dark:bg-coal-400 shadow-xl">
        {/* Cerrar */}
        <button
          type="button"
          aria-label="Cerrar modal"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 px-6 py-4 border-b">
          Carga masiva de {label}
        </h2>

        <ModalBody className="grid gap-5 px-0 py-5">
          <form className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="mb-6">
              <p className="text-xs font-bold mb-2 text-gray-800 dark:text-gray-100 uppercase">
                Archivo Excel <span className="text-gray-500">(XLSX, XLS, CSV)</span>
              </p>

              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  id="fileUpload"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="fileUpload"
                  className="flex items-center justify-between gap-4 w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-coal-100 rounded-xl cursor-pointer transition hover:border-blue-500 focus-within:border-blue-500 bg-white dark:bg-coal-400"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📄</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {file ? file.name : 'Seleccionar archivo Excel'}
                    </span>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white font-medium transition hover:bg-blue-700">
                    Examinar
                  </span>
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 mt-6 border-t pt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-300 transition-colors duration-200"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-sm text-white transition-colors duration-200 ${!file ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }`}
                onClick={handleSave}
                disabled={!file}
              >
                Subir
              </button>
            </div>
          </form>
        </ModalBody>
      </div>
    </div>
  );
};

export { ModalMigracionDatos };
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


  return (
    <Modal open={open}>
      <ModalContent className="border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 max-w-[700px] top-[15%] p-0 rounded-xl">
        <ModalHeader className="relative justify-center border-none pt-8">
          <ModalTitle>
            <h2 className="text-2xl font-semibold text-gray-800 text-center">
              Carga masiva de {label}.
            </h2>
          </ModalTitle>

          <button
            className="absolute top-4 right-4 btn btn-sm btn-icon btn-light btn-clear"
            onClick={onClose}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Archivo Excel</label>
            
            {/* 🔹 INPUT FILE CORREGIDO */}
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
                className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md text-sm shadow hover:bg-gray-50 transition-colors inline-block"
              >
                Seleccionar archivo
              </label>
              <span className="ml-3 text-sm text-gray-600">
                {file ? file.name : 'Sin archivos seleccionados'}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-800 mb-2">Instrucciones:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Descarga la plantilla haciendo clic en "DESCARGAR"</li>
              <li>• Llena los datos siguiendo el formato de las columnas</li>
              <li>• No modifiques los nombres de las columnas</li>
              <li>• Formatos admitidos: .xlsx, .xls, .csv</li>
            </ul>
          </div>

          <hr className="my-6" />

          <div className="flex justify-end gap-3 mt-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              CANCELAR
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-primary" 
              onClick={handleSave}
              disabled={!file}
            >
              SUBIR
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalMigracionDatos };
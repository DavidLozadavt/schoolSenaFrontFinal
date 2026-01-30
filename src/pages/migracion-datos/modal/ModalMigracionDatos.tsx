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
  entity?: string; // cualquier entidad
}

const ModalMigracionDatos = ({ open, onClose, onSave, entity = 'trabajadores' }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState<File | null>(null);

  const label = entity?.charAt(0).toUpperCase() + entity?.slice(1);

  // 🔹 Resetear archivo cuando se abre o cierra el modal
  React.useEffect(() => {
    if (!open) setFile(null); // se cierra modal → limpiar archivo
    if (open) setFile(null);  // se abre modal → iniciar vacío
  }, [open, entity]);

  const handleSave = async () => {
    if (!file) {
      enqueueSnackbar('Debes seleccionar un archivo', { variant: 'warning' });
      return;
    }

    const config = ENDPOINTS[entity];
    if (!config) {
      enqueueSnackbar('Entidad no válida', { variant: 'error' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('archivo', file);

      await axios.post(config.upload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await axios.post(config.procedure);

      enqueueSnackbar(`Archivo cargado correctamente para ${label}`, { variant: 'success' });

      onSave?.(file, entity);

      onClose();
    } catch (error: any) {
      console.error(error);
      enqueueSnackbar(
        error?.response?.data?.message || 'Error en la carga o ejecución del proceso',
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
            <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2">
              <input
                type="file"
                className="hidden"
                id="fileUpload"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="fileUpload"
                className="cursor-pointer bg-white border px-4 py-2 rounded-md text-sm shadow"
              >
                Seleccionar archivo
              </label>
              <span className="text-sm text-gray-500 truncate">
                {file ? file.name : 'Sin archivos seleccionados'}
              </span>
            </div>
          </div>

          <hr className="my-6" />

          <div className="flex justify-end gap-3 mt-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              CANCELAR
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleSave}>
              SUBIR
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalMigracionDatos };

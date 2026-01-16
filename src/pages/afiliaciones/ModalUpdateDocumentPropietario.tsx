import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  documento?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalUpdateDocumentPropietario = ({ open, onClose, documento, onSave }: ModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [fechaVigencia, setFechaVigencia] = useState<string>(''); 
  const [errors, setErrors] = useState<{ file?: string; fechaVigencia?: string }>({});

  useEffect(() => {
    if (open) {
      setFile(null);
      setFechaVigencia(documento?.fecha_vigencia || ''); 
      setErrors({});
    }
  }, [open, documento]);

  const validateFields = () => {
    const newErrors: { file?: string; fechaVigencia?: string } = {};

    if (!file) {
      newErrors.file = 'Debe adjuntar un archivo.';
    }
    if (!fechaVigencia) {
      newErrors.fechaVigencia = 'Debe seleccionar una fecha .';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) return;

    try {
      const data = new FormData();
      if (documento?.id) {
        data.append('idDocumento', documento.id + '');
      }
      if (file) {
        data.append('rutaFile', file);
      }
      if (fechaVigencia) {
        data.append('fecha_vigencia', fechaVigencia);
      }

      await axios.post(`update_documento_propietario`, data);

      setFile(null);
      setFechaVigencia('');
      setErrors({});
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error('Error al archivar:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Actualizar Documento</ModalTitle>

          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2">
              {documento?.desc}
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              className={`file-input ${errors.file ? 'border-red-500' : ''}`}
            />
            {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
          </div>

          <div>
            <label htmlFor="fechaVigencia" className="block text-sm font-medium mb-2">
           {documento?.tipoFecha}
            </label>
            <input
              type="date"
              id="fechaVigencia"
              value={fechaVigencia}
              onChange={(e) => setFechaVigencia(e.target.value)}
              className={`input w-full ${errors.fechaVigencia ? 'border-red-500' : ''}`}
            />
            {errors.fechaVigencia && (
              <p className="text-red-500 text-sm mt-1">{errors.fechaVigencia}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4 ">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalUpdateDocumentPropietario };

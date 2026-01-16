import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { ContratoInterface } from './model/ContratoInterface';
import { DocumentoContrato } from './model/DocumentosContratoInterface';

interface ModalProps {
  open: boolean;
  documento?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalUpdateDocument = ({ open, onClose, documento, onSave }: ModalProps) => {
  const [file, setFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<{ observacion?: string; file?: string }>({});

  useEffect(() => {
    if (open) {
      setFile(null);
      setErrors({});
    }
  }, [open]);

  const validateFields = () => {
    const newErrors: { observacion?: string; file?: string } = {};

    if (!file) {
      newErrors.file = 'Debe adjuntar un archivo.';
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

      await axios.post(`update_documento_contrato`, data);

      setFile(null);
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

          <div className="flex justify-end gap-3 mt-4 px-4">
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

export { ModalUpdateDocument };

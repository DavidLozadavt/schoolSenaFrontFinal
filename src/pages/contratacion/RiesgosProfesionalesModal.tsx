import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const RiesgosProfesionalesModal = ({ open, onClose, onSave }: ModalProps) => {
  const [codigo, setCodigo] = useState('');
  const [clase, setClase] = useState('');

  const [errorCodigo, setErrorCodigo] = useState('');
  const [errorClase, setErrorClase] = useState('');

  useEffect(() => {
    if (open) {
      setCodigo('');
      setClase('');
      setErrorCodigo('');
      setErrorClase('');
    }
  }, [open]);

  const handleSave = async () => {
    let hasError = false;

    if (!codigo) {
      setErrorCodigo('El código es obligatorio.');
      hasError = true;
    } else {
      setErrorCodigo('');
    }

    if (!clase) {
      setErrorClase('La clase es obligatoria.');
      hasError = true;
    } else {
      setErrorClase('');
    }

    if (hasError) return;

    try {
      await axios.post('store_actividades_riesgo_profesional', {
        codigo,
        clase
      });

      setCodigo('');
      setClase('');

      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Nueva Actividad de Riesgo Profesional</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="relative w-[calc(100%-2rem)] mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Escriba el código"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            />
            {errorCodigo && <p className="text-red-500 text-sm mt-1">{errorCodigo}</p>}
          </div>

          <div className="relative w-[calc(100%-2rem)] mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la actividad </label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Escriba la clase"
              type="text"
              value={clase}
              onChange={(e) => setClase(e.target.value.toUpperCase())}
            />
            {errorClase && <p className="text-red-500 text-sm mt-1">{errorClase}</p>}
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

export { RiesgosProfesionalesModal };

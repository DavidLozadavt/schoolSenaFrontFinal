import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const BancoModal = ({ open, onClose, onSave }: ModalProps) => {
  const [nombre, setNombre] = useState('');

  const [errorNombre, setErrorNombre] = useState('');

  useEffect(() => {
    if (open) {
      setNombre('');

      setErrorNombre('');
    }
  }, [open]);

  const handleSave = async () => {
    let hasError = false;

    if (!nombre) {
      setErrorNombre('El nombre del banco es obligatorio.');
      hasError = true;
    } else {
      setErrorNombre('');
    }

    if (hasError) return;

    try {
      await axios.post('store_banco', {
        nombre
      });

      setNombre('');

      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setNombre(value);

    if (value) {
      setErrorNombre('');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{nombre ? 'Editar Banco' : 'Nuevo Banco'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="relative w-[calc(100%-2rem)] mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Banco</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Escriba el nombre del banco"
              type="text"
              value={nombre}
              onChange={handleNombreChange}
            />
            {errorNombre && <p className="text-red-500 text-sm mt-1">{errorNombre}</p>}
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

export { BancoModal };

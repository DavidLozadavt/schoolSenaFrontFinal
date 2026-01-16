import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { MedioPagoInterface } from './model/MedioPagoInterface';

interface ModalProps {
  open: boolean;
  medioPago?: MedioPagoInterface;
  onClose: () => void;
  onSave?: () => void;
}

const ModalMedioPago = ({ open, onClose, medioPago, onSave }: ModalProps) => {
  const [detalleMedioPago, setMedioPago] = useState(medioPago?.detalleMedioPago || '');

  useEffect(() => {
    if (open) {
      setMedioPago('');
    }
  }, [open]);

  useEffect(() => {
    if (medioPago) {
      setMedioPago(medioPago.detalleMedioPago);
    }
  }, [medioPago]);

  const handleSave = async () => {
    try {
      if (medioPago) {
        await axios.put(`medio_pagos/${medioPago.id}`, { detalleMedioPago });
      } else {
        await axios.post('medio_pagos', { detalleMedioPago });
      }
      setMedioPago('');
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{medioPago ? 'Editar Medio de Pago' : 'Nuevo Medio de Pago'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <input
            className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
            placeholder="Ingrese el medio de pago"
            type="text"
            value={detalleMedioPago}
            onChange={(e) => setMedioPago(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalMedioPago };

import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { PaymentType } from './model/TipoPagoInterface';

interface ModalProps {
  open: boolean;
  paymentType?: PaymentType;
  onClose: () => void;
  onSave?: () => void;
}

const ModalTipoPago = ({ open, onClose, paymentType, onSave }: ModalProps) => {
  
  const [detalleTipoPago, setDetalleTipoPago] = useState(paymentType?.detalleTipoPago || '');

  useEffect(() => {
    if (paymentType) {
      setDetalleTipoPago(paymentType.detalleTipoPago);
    }
  }, [paymentType]);

  const handleSave = async () => {
    try {
      if (paymentType) {
        await axios.put(`tipo_pagos/${paymentType.id}`, { detalleTipoPago });
      } else {
        await axios.post('tipo_pagos', { detalleTipoPago });
      }
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
          <ModalTitle>{paymentType ? 'Editar Tipo de Pago' : 'Nuevo Tipo de Pago'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <input
            className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
            placeholder="Ingrese el tipo de pago"
            type="text"
            value={detalleTipoPago}
            onChange={(e) => setDetalleTipoPago(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalTipoPago };

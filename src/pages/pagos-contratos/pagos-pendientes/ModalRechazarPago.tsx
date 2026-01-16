import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';


interface ModalProps {
  open: boolean;
  pago?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalRechazarPago = ({ open, onClose, pago, onSave }: ModalProps) => {
  const [observacion, setObservacion] = useState('');
  const [errors, setErrors] = useState<{ observacion?: string; file?: string }>({});

  useEffect(() => {
    if (open) {
      setObservacion('');
    }
  }, [open]);

  const validateFields = () => {
    const newErrors: { observacion?: string } = {};
    if (!observacion.trim()) {
      newErrors.observacion = 'La observación es requerida.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSave = async () => {
    if (!validateFields()) return;

    try {

      const payload = {
        observacion: observacion,
        idPersona: pago.transaccion?.contratos[0]?.persona?.id,
        idPago: pago?.id
      };
  

      await axios.post(`rechazo_documento_estado`, payload);
      setObservacion('');

      setErrors({});
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error('Error al archivar:', error);
    }
  };


  const handleObservacionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setObservacion(e.target.value);
    setErrors((prev) => ({ ...prev, observacion: '' }));
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Rechazar Pago</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div>
            <label htmlFor="observacion" className="block text-sm font-medium mb-2">
              Observación
            </label>
            <textarea
              id="observacion"
              value={observacion}
              onChange={handleObservacionChange}
              className={`textarea ${errors.observacion ? 'border-red-500' : ''}`}
              rows={4}
              placeholder="Escribe una observación..."
            ></textarea>
            {errors.observacion && (
              <p className="text-red-500 text-sm mt-1">{errors.observacion}</p>
            )}
          </div>


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

export { ModalRechazarPago };

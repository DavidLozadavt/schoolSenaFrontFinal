import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalCambiarEstado = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [observacion, setObservacion] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setObservacion('');
      setError('');
    }
  }, [open]);

  const validateField = (value: string): string => {
    return value.trim() ? '' : 'La observación es requerida.';
  };

  const handleSave = async () => {
    const error = validateField(observacion);
    setError(error);
    if (error) return;

    try {
      await axios.put(`change_status_afiliacion/${data?.id}`, { observacion });
      enqueueSnackbar('Cambio de estado guardado con éxito.', { variant: 'success' });
      if (onSave) onSave();
      onClose();
    } catch (error: unknown) {
      enqueueSnackbar('Error al guardar el cambio de estado.', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[540px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Cambiar Estado de la Vinculación</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="observacion" className="block text-sm mb-2 font-medium">
              Observación
            </label>
            <textarea
              id="observacion"
              className={`textarea p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Ingrese una observación"
              value={observacion}
              rows={5}
              onChange={(e) => {
                setObservacion(e.target.value);
                setError(validateField(e.target.value));
              }}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalCambiarEstado };

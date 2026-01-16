import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalTipoVehiculo = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [tipo, setTipo] = useState(data?.tipo || '');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      setTipo('');
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setTipo(data.tipo || '');
    }
  }, [data]);

  const validateField = (value: string): string => {
    if (!value.trim()) {
      return 'El tipo es requerido.';
    }
    return '';
  };

  const validate = () => {
    const error = validateField(tipo);
    setError(error);
    return !error;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      tipo: tipo.trim()
    };

    try {
      if (data) {
        await axios.put(`tipo_vehiculos/${data.id}`, payload);
        enqueueSnackbar('Tipo de vehículo actualizado con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('tipo_vehiculos', payload);
        enqueueSnackbar('Tipo de vehículo guardado con éxito.', {
          variant: 'success'
        });
      }
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        enqueueSnackbar('Este tipo ya existe.', { variant: 'warning' });
      } else {
        enqueueSnackbar('Error al guardar los datos.', {
          variant: 'solid',
          state: 'danger'
        });
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>
            {data ? 'Editar Tipo de Vehículo' : 'Nuevo Tipo de Vehículo'}
          </ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={onClose}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label
              htmlFor="tipo"
              className="block text-sm mb-2 font-medium"
            >
              Tipo de Vehículo
            </label>
            <input
              id="tipo"
              type="text"
              className={`input p-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              placeholder="Ingrese el tipo de vehículo"
              value={tipo}
              onChange={(e) => {
                 const value = e.target.value.toUpperCase();
                setTipo(value);
                const validationError = validateField(value);
                setError(validationError);
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

export { ModalTipoVehiculo };
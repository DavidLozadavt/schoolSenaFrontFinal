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

const ModalVehiculoAux = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [placa, setPlaca] = useState(data?.placa || '');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      setPlaca('');
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setPlaca(data.placa || '');
    }
  }, [data]);

  const formatPlaca = (value: string) => {
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    
    if (cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
    }
    return cleaned.slice(0, 7);
  };

  const validateField = (value: string): string => {
    const regex = /^[A-Z]{3}-\d{3}$/;
    if (!regex.test(value)) {
      return 'La placa debe tener el formato AAA-111.';
    }
    return '';
  };

  const validate = () => {
    const validationError = validateField(placa);
    setError(validationError);
    return !validationError;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      placa: placa.trim()
    };

    try {
      if (data) {
        await axios.put(`vehiculo_auxiliar/${data.id}`, payload);
        enqueueSnackbar('Vehículo actualizado con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('store_vehiculo_auxiliar', payload);
        enqueueSnackbar('Vehículo guardado con éxito.', {
          variant: 'success'
        });
      }
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        enqueueSnackbar('Esta placa ya existe.', { variant: 'warning' });
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
            {data ? 'Editar Vehículo' : 'Nuevo Vehículo'}
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
              htmlFor="placa"
              className="block text-sm mb-2 font-medium"
            >
              Placa
            </label>
            <input
              id="placa"
              type="text"
              className={`input p-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              placeholder="Ejemplo: ABC-123"
              value={placa}
              onChange={(e) => {
                const formatted = formatPlaca(e.target.value);
                setPlaca(formatted);
                setError(validateField(formatted));
              }}
              maxLength={7}
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

export { ModalVehiculoAux };
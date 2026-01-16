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

const ModalModeloVehiculo = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [modelo, setModelo] = useState(data?.modelo || '');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      setModelo('');
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setModelo(data.modelo || '');
    }
  }, [data]);

  const validateField = (value: string): string => {
    if (!value || !/^\d{4}$/.test(value)) {
      return 'El modelo es requerido y debe ser un número de 4 dígitos.';
    }
    return '';
  };

  const validate = () => {
    const error = validateField(modelo);
    setError(error);
    return !error;
  };

 
  const handleSave = async () => {
    if (!validate()) return;
  
    const payload = {
      modelo: Number(modelo)
    };
  
    try {
      if (data) {
        await axios.put(`modelos/${data.id}`, payload);
        enqueueSnackbar('Modelo actualizado con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('modelos', payload);
        enqueueSnackbar('Modelo guardado con éxito.', {
          variant: 'success'
        });
      }
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        enqueueSnackbar('Este modelo ya existe.', { variant: 'warning' });
      } else {
        enqueueSnackbar('Error al guardar los datos.', { variant: 'solid', state: 'danger' });
      }
    }
  };
  
  

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Modelo de Vehículo' : 'Nuevo Modelo de Vehículo'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="modelo" className="block text-sm mb-2 font-medium">
              Modelo de Vehículo
            </label>
            <input
              id="modelo"
              type="text"
              className={`input p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Ingrese el modelo de vehículo (4 dígitos)"
              value={modelo}
              onChange={(e) => {
                const value = e.target.value;
                setModelo(value);
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

export { ModalModeloVehiculo };

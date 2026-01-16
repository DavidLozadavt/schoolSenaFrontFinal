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

const ModalMarcaVehiculo = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [marca, setMarca] = useState(data?.marca || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMarca('');
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setMarca(data.marca || '');
    }
  }, [data]);

  const validateField = (value: string): string => {
    if (!value) {
      return 'El nombre de la marca es requerido.';
    }
    return '';
  };

  const validate = () => {
    const marcaError = validateField(marca);
    setError(marcaError);

    return !marcaError;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = { marca };

    try {
      if (data) {
        await axios.put(`marcas/${data.id}`, payload);
        enqueueSnackbar('Marca actualizada con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('marcas', payload);
        enqueueSnackbar('Marca guardada con éxito.', {
          variant: 'success'
        });
      }
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        enqueueSnackbar('Esta marca ya existe.', { variant: 'warning' });
      } else {
        enqueueSnackbar('Error al guardar los datos.', { variant: 'solid', state: 'danger' });
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Marca' : 'Nueva Marca'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="marca" className="block text-sm mb-2 font-medium">
              Nombre de la Marca
            </label>
            <input
              id="marca"
              type="text"
              className={`input p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Ingrese el nombre de la marca"
              value={marca}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setMarca(value);
                const error = validateField(value);
                setError(error);
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

export { ModalMarcaVehiculo };

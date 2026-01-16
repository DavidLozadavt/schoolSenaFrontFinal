import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalCategoriaServicioProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalCategoriaServicio = ({ open, data, onClose, onSave }: ModalCategoriaServicioProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNombre(data?.nombre || '');
      setError('');
    }
  }, [open, data]);

  const validate = () => {
    if (!nombre.trim()) {
      setError('El nombre de la categoría es requerido');
      return false;
    }
    setError('');
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (data) {
        await axios.put(`/category_services/${data.id}`, { nombre });
        enqueueSnackbar('Categoría actualizada.', { variant: 'success' });
      } else {
        await axios.post('/category_services', { nombre });
        enqueueSnackbar('Categoría creada.', { variant: 'success' });
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar la categoría.', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} >
      <ModalContent className="max-w-[400px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Categoría' : 'Nueva Categoría'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label className="block mb-1 text-sm font-medium">Nombre de categoría</label>
            <input
              type="text"
              className="input border rounded-md w-full p-2"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalCategoriaServicio };
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ModalClaseProducto = ({ open, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [errors, setErrors] = useState<{ nombreClaseProducto?: string; descripcion?: string }>({});
  const [nombreClaseProducto, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    if (open) {
      setNombre('');
      setDescripcion('');
      setErrors({});
    }
  }, [open]);

  const validateField = (field: string, value: string): string => {
    if (!value.trim())
      return field === 'nombreClaseProducto'
        ? 'El Nombre es obligatorio'
        : 'La Descripción es obligatoria';
    return '';
  };

  const handleFieldChange = (field: 'nombreClaseProducto' | 'descripcion', value: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev, [field]: validateField(field, value) };
      if (value.trim()) delete newErrors[field];
      return newErrors;
    });
  };

  const validate = () => {
    const newErrors = {
      nombreClaseProducto: validateField('nombreClaseProducto', nombreClaseProducto),
      descripcion: validateField('descripcion', descripcion)
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = { nombreClaseProducto, descripcion };

    try {
      await axios.post('clase_productos', payload);
      enqueueSnackbar('Guardado con éxito.', { variant: 'success' });
      if (onSave) onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar los datos.', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{'Nueva Clase de Producto'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="nombreClaseProducto" className="block mb-1 text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombreClaseProducto"
              className={`input p-2 border ${errors.nombreClaseProducto ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Nombre"
              value={nombreClaseProducto}
              onChange={(e) => {
                setNombre(e.target.value);
                handleFieldChange('nombreClaseProducto', e.target.value);
              }}
            />
            {errors.nombreClaseProducto && (
              <p className="text-red-500 text-sm mt-1">{errors.nombreClaseProducto}</p>
            )}
          </div>

          <div>
            <label htmlFor="descripcion" className="block mb-1 text-sm font-medium">
              Descripción
            </label>
            <textarea
              id="descripcion"
              className={`textarea p-2 border ${errors.descripcion ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Descripción"
              rows={2}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                handleFieldChange('descripcion', e.target.value);
              }}
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
            )}
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

export { ModalClaseProducto };

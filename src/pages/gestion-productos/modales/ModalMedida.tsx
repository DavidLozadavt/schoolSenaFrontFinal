import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ModalMedida = ({ open, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [valor, setValor] = useState('');
  const [unidad, setUnidad] = useState('');
  const [errors, setErrors] = useState<{ valor?: string; unidad?: string }>({});

  useEffect(() => {
    if (open) {
      setValor('');
      setUnidad('');
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const newErrors: any = {};
    if (!valor.trim()) newErrors.valor = 'El valor es obligatorio';
    if (!unidad.trim()) newErrors.unidad = 'La unidad es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      await axios.post('medidas', { valor, unidadMedida: unidad });
      enqueueSnackbar('Medida creada.', { variant: 'success' });
      if (onSave) onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al crear medida.', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{'Nueva Medida'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label className="block mb-1 text-sm font-medium">Valor</label>
            <input
              className={`input p-2 border ${errors.valor ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
            {errors.valor && <p className="text-red-500 text-sm mt-1">{errors.valor}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Unidad</label>
            <input
              className={`input p-2 border ${errors.unidad ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
            />
            {errors.unidad && <p className="text-red-500 text-sm mt-1">{errors.unidad}</p>}
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

export { ModalMedida };

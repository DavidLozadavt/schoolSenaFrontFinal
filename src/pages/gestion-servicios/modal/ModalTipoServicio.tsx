import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalTipoServicioProps {
  open: boolean;
  data?: any;
  clases: any[]; // clases ya cargadas desde el padre
  onClose: () => void;
  onSave?: () => void;
}

const ModalTipoServicio = ({ open, data, clases, onClose, onSave }: ModalTipoServicioProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [claseId, setClaseId] = useState('');
  const [errors, setErrors] = useState({ nombre: '', descripcion: '', clase: '' });

  useEffect(() => {
    if (open) {
      if (data) {
        setNombre(data.nombreTipoServicio || '');
        setDescripcion(data.descripcion || '');
        setClaseId(data.idClaseServicio || '');
      } else {
        setNombre('');
        setDescripcion('');
        setClaseId('');
      }
      setErrors({ nombre: '', descripcion: '', clase: '' });
    }
  }, [open, data]);

  const validate = () => {
    const newErrors = {
      nombre: nombre.trim() ? '' : 'El nombre es requerido.',
      descripcion: descripcion.trim() ? '' : 'La descripción es requerida.',
      clase: claseId ? '' : 'Selecciona una clase de servicio.'
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (data) {
        await axios.put(`tipo_servicios/${data.id}`, {
          nombreTipoServicio: nombre,
          descripcion,
          idClaseServicio: claseId
        });
        enqueueSnackbar('Tipo de servicio actualizado.', { variant: 'success' });
      } else {
        await axios.post('tipo_servicios', {
          nombreTipoServicio: nombre,
          descripcion,
          idClaseServicio: claseId
        });
        enqueueSnackbar('Tipo de servicio creado.', { variant: 'success' });
      }

      if (onSave) await onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar el tipo de servicio.', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} >
      <ModalContent className="max-w-[500px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label className="block mb-1 text-sm font-medium">Nombre</label>
            <input
              type="text"
              className="input border rounded-md w-full p-2"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {errors.nombre && <p className="text-red-500 text-xs">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Descripción</label>
            <textarea
              rows={2}
              className="textarea border rounded-md w-full p-2"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            {errors.descripcion && <p className="text-red-500 text-xs">{errors.descripcion}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Clase de Servicio</label>
            <select
              value={claseId}
              onChange={(e) => setClaseId(e.target.value)}
              className="input border rounded-md w-full p-2"
            >
              <option value="">Selecciona una clase</option>
              {clases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombreClaseServicio}
                </option>
              ))}
            </select>
            {errors.clase && <p className="text-red-500 text-xs">{errors.clase}</p>}
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

export { ModalTipoServicio };
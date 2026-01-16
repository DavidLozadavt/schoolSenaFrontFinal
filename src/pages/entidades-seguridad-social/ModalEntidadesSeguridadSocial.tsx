import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  entidad?: any;
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const tiposEntidad = ['EPS', 'PENSION', 'ARL', 'CESANTIAS', 'CAJA COMPENSACION'];

const ModalEntidadesSeguridadSocial = ({ open, onClose, onSave, entidad }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [nit, setNit] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [errorCodigo, setErrorCodigo] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [errorTipo, setErrorTipo] = useState('');

  useEffect(() => {
    if (open) {
      if (entidad) {
        setCodigo(entidad.codigo || '');
        setNombre(entidad.nombre || '');
        setNit(entidad.nit || '');
        setTipo(entidad.tipo || '');
        setDescripcion(entidad.descripcion || '');
      } else {
        setCodigo('');
        setNombre('');
        setNit('');
        setTipo('');
        setDescripcion('');
      }
      setErrorCodigo('');
      setErrorNombre('');
      setErrorTipo('');
    }
  }, [open, entidad]);

  const handleSave = async () => {
    let hasError = false;

    if (!codigo) {
      setErrorCodigo('El código es obligatorio.');
      hasError = true;
    } else {
      setErrorCodigo('');
    }

    if (!nombre) {
      setErrorNombre('El nombre es obligatorio.');
      hasError = true;
    } else {
      setErrorNombre('');
    }

    if (!tipo) {
      setErrorTipo('El tipo de entidad es obligatorio.');
      hasError = true;
    } else {
      setErrorTipo('');
    }

    if (hasError) return;

    try {
      const data = { codigo, nombre, nit, tipo, descripcion };

      if (entidad?.id) {
        await axios.put(`entidades_seguridad_social/${entidad.id}`, data);
        enqueueSnackbar('Actualizado con éxito.', { variant: 'success' });
      } else {
        await axios.post('entidades_seguridad_social', data);
        enqueueSnackbar('Guardado con éxito.', { variant: 'success' });
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{entidad ? 'Editar Entidad' : 'Nueva Entidad'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
         
          <div className="relative">
            <label className="block text-sm font-medium mb-1 ml-1">Código</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Código"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            {errorCodigo && <p className="text-red-500 text-sm mt-1">{errorCodigo}</p>}
          </div>

         
          <div className="relative">
            <label className="block text-sm font-medium mb-1 ml-1">Nombre</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {errorNombre && <p className="text-red-500 text-sm mt-1">{errorNombre}</p>}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1 ml-1">NIT (opcional)</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="NIT"
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1 ml-1">Tipo de entidad</label>
            <select
              className="input p-2 border border-gray-300 rounded-md w-full"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Seleccione el tipo de entidad</option>
              {tiposEntidad.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errorTipo && <p className="text-red-500 text-sm mt-1">{errorTipo}</p>}
          </div>

        
          <div className="relative">
            <label className="block text-sm font-medium mb-1 ml-1">Descripción (opcional)</label>
            <textarea
              className="textarea p-2 border border-gray-300 rounded-md w-full"
              placeholder="Descripción"
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalEntidadesSeguridadSocial };

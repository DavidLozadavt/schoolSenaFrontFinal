import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { DetalleRevision } from './model/DetalleRevisionModel';

interface ModalProps {
  open: boolean;
  detalleRevision?: DetalleRevision;
  onClose: () => void;
  onSave?: () => void;
}

const tiposDetalle = [
  'PARTE EXTERNA DE VEHICULO',
  'MOTOR',
  'INTERIOR DEL VEHICULO',
  'DOCUMENTACION DEL VEHICULO'
];

const ModalDetalleRevision = ({ open, onClose, detalleRevision, onSave }: ModalProps) => {
  const [nombre, setNombre] = useState('');
  const [tipoDetalle, setTipoDetalle] = useState(tiposDetalle[0]);

  useEffect(() => {
    if (open) {
      setNombre(detalleRevision?.nombre ?? '');
      setTipoDetalle(detalleRevision?.tipoDetalle ?? tiposDetalle[0]);
    }
  }, [open, detalleRevision]);

  const handleSave = async () => {
    try {
      const payload = { nombre, tipoDetalle };

      if (detalleRevision) {
        await axios.put(`detalle_revision/${detalleRevision.id}`, payload);
      } else {
        await axios.post('detalle_revision', payload);
      }

      setNombre('');
      setTipoDetalle(tiposDetalle[0]);
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error al guardar detalle de revisión:', error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>
            {detalleRevision ? 'Editar Detalle de Revisión' : 'Nuevo Detalle de Revisión'}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div>
            <label htmlFor="idDepartamentoOrigen" className="block mb-1 text-sm font-medium">
              Nombre del Detalle
            </label>
            <input
              className="input"
              placeholder="Ingrese el nombre del detalle"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="idDepartamentoOrigen" className="block mb-1 text-sm font-medium">
              Tipo de Detalle
            </label>
            <select
              className="input "
              value={tipoDetalle}
              onChange={(e) => setTipoDetalle(e.target.value)}
            >
              {tiposDetalle.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalDetalleRevision;

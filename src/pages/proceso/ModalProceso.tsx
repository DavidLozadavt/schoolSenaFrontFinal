import React, { useEffect, useState } from 'react';
import { ProcesoInterface } from './model/ProcesoInterface';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components/keenicons';

interface ModalProps {
  open: boolean;
  process?: ProcesoInterface;
  onClose: () => void;
  onSave?: () => void;
}

const ModalProceso = ({ open, process, onClose, onSave }: ModalProps) => {
  const [nombreProceso, setNombreProceso] = useState(process?.nombreProceso || '');
  const [descripcion, setDescripcionProceso] = useState(process?.descripcion || '');

  useEffect(() => {
    if (process) {
      setNombreProceso(process.nombreProceso);
      setDescripcionProceso(process.descripcion);
    } else {
      setNombreProceso('');
      setDescripcionProceso('');
    }
  }, [process, open]);

  const handleSave = async () => {
    try {
      if (process) {
        await axios.put(`procesos/${process.id}`, { nombreProceso, descripcion });
      } else {
        await axios.post('procesos', { nombreProceso, descripcion });
      }
      if (onSave) {
        onSave();
      }
      setNombreProceso('');
      setDescripcionProceso('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    setNombreProceso('');
    setDescripcionProceso('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{process ? 'Editar Proceso' : 'Nuevo Proceso'}</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={handleClose}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="w-[calc(100%-2rem)] mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Proceso</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Nombre Proceso"
              type="text"
              value={nombreProceso}
              onChange={(e) => setNombreProceso(e.target.value)}
            />
          </div>

          <div className="w-[calc(100%-2rem)] mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Descripción"
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcionProceso(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary btn-sm" onClick={handleClose}>
              Cancelar
            </button>
            <button onClick={handleSave} className="btn btn-primary btn-sm">
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalProceso;

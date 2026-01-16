import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  tipoContrato?: any;
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ModalTipoContrato = ({ open, onClose, onSave, tipoContrato }: ModalProps) => {
  const [nombreTipoContrato, setNombreTipoContrato] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [errorDescripcion, setErrorDescripcion] = useState('');

  useEffect(() => {
    if (open) {
      if (tipoContrato) {
        setNombreTipoContrato(tipoContrato.nombreTipoContrato || '');
        setDescripcion(tipoContrato.descripcion || '');
      } else {
        setNombreTipoContrato('');
        setDescripcion('');
      }
      setErrorNombre('');
      setErrorDescripcion('');
    }
  }, [open, tipoContrato]);

  const handleSave = async () => {
    let hasError = false;

    if (!nombreTipoContrato) {
      setErrorNombre('El nombre del tipo de contrato es obligatorio.');
      hasError = true;
    } else {
      setErrorNombre('');
    }

    if (!descripcion) {
      setErrorDescripcion('La descripción es obligatoria.');
      hasError = true;
    } else {
      setErrorDescripcion('');
    }

    if (hasError) return;

    try {
      if (tipoContrato?.id) {
        await axios.put(`tipo_contrato/${tipoContrato.id}`, {
          nombreTipoContrato,
          descripcion
        });
      } else {
        await axios.post('tipo_contrato', {
          nombreTipoContrato,
          descripcion
        });
      }

      setNombreTipoContrato('');
      setDescripcion('');

      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNombreTipoContrato(e.target.value);
    if (e.target.value) {
      setErrorNombre('');
    }
  };

  const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescripcion(e.target.value);
    if (e.target.value) {
      setErrorDescripcion('');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Nuevo Tipo de Contrato</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="relative">
            <input
              className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
              placeholder="Nombre del Tipo de Contrato"
              type="text"
              value={nombreTipoContrato}
              onChange={handleNombreChange}
            />
            {errorNombre && <p className="text-red-500 text-sm mt-1 ml-5">{errorNombre}</p>}
          </div>

          <div className="relative">
            <textarea
              className="textarea p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
              placeholder="Descripción"
              rows={5}
              value={descripcion}
              onChange={handleDescripcionChange}
            />
            {errorDescripcion && (
              <p className="text-red-500 text-sm mt-1 ml-5">{errorDescripcion}</p>
            )}
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

export { ModalTipoContrato };

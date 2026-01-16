import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const RolModal = ({ open, onClose, onSave }: ModalProps) => {
  const [name, setName] = useState('');
  const [valor, setValor] = useState('');
  const [valorNumber, setValorNumber] = useState<number | null>(null);
  const [errorNombre, setErrorNombre] = useState('');
  const [errorvalor, setErrorvalor] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setValor('');
      setErrorNombre('');
      setErrorvalor('');
    }
  }, [open]);

  const handleSave = async () => {
    let hasError = false;

    if (!name) {
      setErrorNombre('El nombre del rol es obligatorio.');
      hasError = true;
    } else {
      setErrorNombre('');
    }

    if (valorNumber === null || valorNumber === 0) {
      setErrorvalor('El salario es obligatorio.');
      hasError = true;
    } else {
      setErrorvalor('');
    }

    if (hasError) return;

    try {
      await axios.post('roles', {
        name,
        valor: valorNumber
      });

      setName('');
      setValor('');
      setValorNumber(null);

      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setName(value);

    if (value) {
      setErrorNombre('');
    }
  };

  const parseCurrency = (value: string) => {
    return value.replace(/[^0-9]/g, '');
  };

  const formatCurrency = (value: string) => {
    if (!value) return '';
    const number = parseInt(value, 10);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(number);
  };

  const handleValorChange = (e: any) => {
    const numericValue = parseCurrency(e.target.value);
    setValor(formatCurrency(numericValue));
    setValorNumber(Number(numericValue));
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{name ? 'Editar Rol' : 'Nuevo Rol'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="relative w-[calc(100%-2rem)] mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Ej: Administrador"
              type="text"
              value={name}
              onChange={handleNombreChange}
            />
            {errorNombre && <p className="text-red-500 text-sm mt-1">{errorNombre}</p>}
          </div>

          <div className="relative w-[calc(100%-2rem)] mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Salario</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Ej: $ 1.500.000"
              type="text"
              value={valor}
              onChange={handleValorChange}
            />
            {errorvalor && <p className="text-red-500 text-sm mt-1">{errorvalor}</p>}
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

export { RolModal };

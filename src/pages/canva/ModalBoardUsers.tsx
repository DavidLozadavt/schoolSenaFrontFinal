import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
interface ModalProps {
  open: boolean;
  persons?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalBoardUsers = ({ open, onClose, persons, onSave }: ModalProps) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const idBoard = localStorage.getItem('idBoard');

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
    }
  }, [open]);

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    const data = { users: selectedIds, idBoard: idBoard };
    try {
      await axios.post(`assign_board`, data);
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Agregar Miembros</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-1 px-0 py-5">
          {persons.map((person: any) => (
            <div key={person.id} className="flex items-center gap-4 p-2 border-b">
              <img
                src={person.persona.rutaFotoUrl}
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
              />

              <div className="flex-1">
                <p className="font-bold">
                  {person.persona.nombre1} {person.persona.nombre2} {person.persona.apellido1}{' '}
                  {person.persona.apellido2}
                </p>
                <p className="text-sm text-gray-600">{person.email}</p>
              </div>

              <input
                type="checkbox"
                className="form-checkbox"
                checked={selectedIds.includes(person.id)}
                onChange={() => handleCheckboxChange(person.id)}
              />
            </div>
          ))}

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={selectedIds.length === 0}
            >
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalBoardUsers };

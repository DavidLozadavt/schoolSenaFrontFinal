import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useConfirm } from '@/hooks';
interface ModalProps {
  open: boolean;
  persons?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalBoardDeleteUsers = ({ open, onClose, persons, onSave }: ModalProps) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const idBoard = localStorage.getItem('idBoard');
  const { confirmAction } = useConfirm();

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

  const handleDeleteUsersConfirm = () => {
    confirmAction(
      'Esta acción eliminará estos usuarios y borrará también las asignaciones en las tarjetas.',
      handleSave
    );
  };

  const handleSave = async () => {
    const data = { users: selectedIds, idBoard: idBoard };
    try {
      await axios.post(`delete_assign_board`, data);
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Desasignar Usuarios</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-1 px-0 py-5">
          {persons.map((person: any) => (
            <div key={person.id} className="flex items-center gap-4 p-2 border-b">
              <img
                src={person.user.persona.rutaFotoUrl}
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
              />

              <div className="flex-1">
                <p className="font-bold">
                  {person?.user?.persona?.nombre1} {person?.user?.persona?.nombre2}{' '}
                  {person?.user?.persona.apellido1} {person?.user?.persona?.apellido2}
                </p>
                <p className="text-sm text-gray-600">{person?.user?.email}</p>
              </div>

              <input
                type="checkbox"
                className="form-checkbox"
                checked={selectedIds.includes(person?.user?.id)}
                onChange={() => handleCheckboxChange(person?.user?.id)}
              />
            </div>
          ))}

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleDeleteUsersConfirm}
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

export { ModalBoardDeleteUsers };

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
interface ModalProps {
  open: boolean;
  users?: any;
  idChecklist?: number | null;
  onClose: () => void;
  onSave?: () => void;
}

const ModalAssingUserChecklist = ({ open, onClose, users, idChecklist, onSave }: ModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    if (open) {
      setSelectedUserId(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!selectedUserId) {
      enqueueSnackbar('No se ha seleccionado ningún usuario.', {
        variant: 'solid',
        state: 'warning'
      });

      return;
    }

    try {
      const data = {
        idCheckListItem: idChecklist,
        user: selectedUserId
      };

      await axios.post('assign_check_item', data);

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[350px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Asignar Usuario</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          {users.length > 0 ? (
            users.map((user: any) => (
              <div
                key={user?.user?.id}
                className="flex items-center justify-between p-2 rounded shadow-sm"
              >
                <div className="flex items-center cursor-pointer">
                  <img
                    src={user?.user?.persona?.rutaFotoUrl}
                    alt={`${user?.user?.persona?.nombre1} ${user?.user?.persona?.apellido1}`}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-semibold">
                      {user?.user?.persona.nombre1} {user?.user?.persona.nombre2}{' '}
                      {user?.user?.persona.apellido1}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedUserId === user?.user?.id}
                  onChange={() => handleSelectUser(user?.user?.id)}
                  className="ml-3 w-4.5 h-4.5 border border-gray-400 rounded-sm cursor-pointer"
                />
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-gray-500 font-medium mt-2">
              No hay usuarios por asignar
            </div>
          )}

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

export { ModalAssingUserChecklist };

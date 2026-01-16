import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  grupo?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalGrupo = ({ open, onClose, grupo, onSave }: ModalProps) => {
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (grupo) {
      setNombreGrupo(grupo.nombreGrupo);
    } else {
      setNombreGrupo('');
    }
  }, [grupo]);

  useEffect(() => {
    if (open && !grupo) {
      setNombreGrupo('');
      setSelectedIds([]);
      fetchUsers();
    }
  }, [open, grupo]);

  const handleSave = async () => {
    try {
      const data = {
        nombreGrupo: nombreGrupo,
        selectedIds: selectedIds
      };

      if (grupo) {
        await axios.post(`update_grupo/${grupo.id}`, data);
      } else {
        await axios.post('store_grupo', data);
      }

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('get_users_and_groups');
      const data = response.data;

      const users = Array.isArray(data.activationCompanyUsers) ? data.activationCompanyUsers : [];
      const personas = users.map((user: any) => user.user).filter(Boolean);
      setPersons(personas);
    } catch (error) {
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{grupo ? 'Editar Grupo' : 'Nuevo Grupo'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="w-[calc(100%-2rem)] mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Ingrese el nombre del grupo"
              type="text"
              value={nombreGrupo}
              onChange={(e) => setNombreGrupo(e.target.value)}
            />
          </div>

          <p className="text-center text-sm">Seleccione los participantes</p>

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
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              disabled={!nombreGrupo.trim() || selectedIds.length === 0}
              className="btn btn-sm btn-primary"
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalGrupo };

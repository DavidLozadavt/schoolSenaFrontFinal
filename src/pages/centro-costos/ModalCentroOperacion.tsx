import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalCentroOperacion = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [nombre, setNombre] = useState(data?.nombre || '');
  const [idResponsable, setIdResponsable] = useState(data?.idResponsable || '');

  const [errors, setErrors] = useState({
    nombre: '',
    idResponsable: ''
  });

  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('lista_usuarios');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
      if (!data) {
        setNombre('');
        setIdResponsable('');
      }
    }
  }, [open, data]);

  const handleSave = async () => {
    const newErrors = {
      nombre: nombre.trim() === '' ? 'El nombre es obligatorio.' : '',
      idResponsable: idResponsable === '' ? 'Debe seleccionar un responsable.' : ''
    };

    setErrors(newErrors);

    if (newErrors.nombre || newErrors.idResponsable) {
      enqueueSnackbar('Por favor complete los campos obligatorios.', { variant: 'warning' });
      return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('idResponsable', idResponsable);

    try {
      if (data) {
        await axios.post(`store_centros_operaciones/${data.id}`, formData);
        enqueueSnackbar('Centro de operaciones actualizado con éxito.', { variant: 'success' });
      } else {
        await axios.post('store_centros_operaciones', formData);
        enqueueSnackbar('Centro de operaciones guardado con éxito.', { variant: 'success' });
      }
      if (onSave) onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar los datos.', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>
            {data ? 'Editar Centro de Operaciones' : 'Nuevo Centro de Operaciones'}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
        
          <div>
            <label htmlFor="nombre" className="block mb-1 text-sm font-medium">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="nombre"
              type="text"
              className={`input p-2 border ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' }));
              }}
            />
            {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
          </div>

          <div>
            <label htmlFor="idResponsable" className="block mb-1 text-sm font-medium">
              Responsable <span className="text-red-500">*</span>
            </label>
            <select
              id="idResponsable"
              className={`input p-2 border ${
                errors.idResponsable ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              value={idResponsable}
              onChange={(e) => {
                setIdResponsable(e.target.value);
                if (errors.idResponsable) setErrors((prev) => ({ ...prev, idResponsable: '' }));
              }}
            >
              <option value="">Seleccione un responsable</option>
              {users.map((user: any) => (
                <option key={user.user.id} value={user.user.id}>
                  {`${user.user.persona.nombre1} ${user.user.persona.apellido1}`}
                </option>
              ))}
            </select>
            {errors.idResponsable && (
              <p className="mt-1 text-sm text-red-500">{errors.idResponsable}</p>
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

export { ModalCentroOperacion };

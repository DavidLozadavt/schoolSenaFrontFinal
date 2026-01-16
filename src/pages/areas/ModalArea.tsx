import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  data?: any;
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ModalArea = ({ open, onClose, onSave, data }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idSede, setIdSede] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [errorSede, setErrorSede] = useState('');
  const [sedes, setSedes] = useState([]);

  useEffect(() => {
    if (open) {
      if (data) {
        setNombre(data.nombre || '');
        setDescripcion(data.descripcion || '');
        setIdSede(data.idSede || '');
      } else {
        setNombre('');
        setDescripcion('');
        setIdSede('');
      }
      setErrorNombre('');
      setErrorSede('');
    }
  }, [open, data]);

  const handleSave = async () => {
    let hasError = false;

    if (!nombre.trim()) {
      setErrorNombre('El nombre del área es obligatorio.');
      hasError = true;
    } else {
      setErrorNombre('');
    }

    if (!idSede) {
      setErrorSede('Debe seleccionar una sede.');
      hasError = true;
    } else {
      setErrorSede('');
    }

    if (hasError) return;

    const payload = {
      nombre,
      descripcion,
      idSede
    };

    try {
      if (data?.id) {
        await axios.put(`areas/${data.id}`, payload);
        enqueueSnackbar('Área actualizada con éxito.', { variant: 'success' });
      } else {
        await axios.post('areas', payload);
        enqueueSnackbar('Área guardada con éxito.', { variant: 'success' });
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSedes = async () => {
    try {
      const response = await axios.get('sedes');
      setSedes(response.data);
    } catch (error) {
      console.error('Error fetching sedes:', error);
    }
  };

  useEffect(() => {
    fetchSedes();
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Área' : 'Nueva Área'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          {/* Nombre */}
          <div className="relative">
            <input
              className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
              placeholder="Nombre del área"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {errorNombre && <p className="text-red-500 text-sm mt-1 ml-5">{errorNombre}</p>}
          </div>

          {/* Descripción */}
          <div className="relative">
            <textarea
              className="textarea p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
              placeholder="Descripción (opcional)"
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          {/* Sede */}
          <div className="relative">
            <select
              className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
              value={idSede}
              onChange={(e) => setIdSede(e.target.value)}
            >
              <option value="">Seleccione la sede</option>
              {sedes.map((sede: any) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
            </select>
            {errorSede && <p className="text-red-500 text-sm mt-1 ml-5">{errorSede}</p>}
          </div>

          {/* Botones */}
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

export { ModalArea };

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalLugares = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [nombre, setNombre] = useState(data?.nombre || '');
  const [tipoLugar, setTipoLugar] = useState(data?.tipoLugar || '');
  const [idDepartamento, setIdDepartamento] = useState(data?.idDepartamento || '');
  const [idCiudad, setIdCiudad] = useState(data?.idCiudad || '');
  const [errors, setErrors] = useState<{
    nombre: string;
    tipoLugar: string;
    idDepartamento: string;
    idCiudad: string;
  }>({
    nombre: '',
    tipoLugar: '',
    idDepartamento: '',
    idCiudad: ''
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  useEffect(() => {
    if (open) {
      fetchDepartamentos();
      setNombre('');
      setTipoLugar('');
      setIdDepartamento('');
      setIdCiudad('');
      setErrors({
        nombre: '',
        tipoLugar: '',
        idDepartamento: '',
        idCiudad: ''
      });
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setNombre(data.nombre);
      setTipoLugar(data.tipoLugar);
      setIdDepartamento(data.idDepartamento);
      setIdCiudad(data.idCiudad);
    }
  }, [data]);

  const fetchDepartamentos = async () => {
    try {
      const response = await axios.get('departamentos');
      setDepartamentos(response.data);
    } catch (error) {
      console.error('Error fetching departamentos:', error);
    }
  };

  const fetchCiudadesPorDepartamento = async (departamentoId: string) => {
    try {
      const response = await axios.get(`ciudades/departamento/${departamentoId}`);
      setCiudades(response.data);
    } catch (error) {
      console.error('Error fetching ciudades:', error);
    }
  };

  useEffect(() => {
    if (idDepartamento) {
      fetchCiudadesPorDepartamento(idDepartamento);
    } else {
      setCiudades([]);
    }
  }, [idDepartamento]);

  const validate = () => {
    const newErrors = {
      nombre: '',
      tipoLugar: '',
      idDepartamento: '',
      idCiudad: ''
    };

    if (!nombre.trim()) newErrors.nombre = 'El nombre es requerido.';
    if (!tipoLugar) newErrors.tipoLugar = 'El tipo de lugar es requerido.';
    if (!idDepartamento) newErrors.idDepartamento = 'El departamento es requerido.';
    if (!idCiudad) newErrors.idCiudad = 'La ciudad es requerida.';

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      idCiudad,
      nombre,
      tipoLugar
    };

    try {
      if (data) {
        await axios.put(`places/${data.id}`, payload);
        enqueueSnackbar('Lugar actualizado con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('places', payload);
        enqueueSnackbar('Lugar guardado con éxito.', {
          variant: 'success'
        });
      }
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar los datos.', {
        variant: 'solid',
        state: 'danger'
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Lugar' : 'Nuevo Lugar'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="idDepartamento" className="block mb-1 text-sm font-medium">
              Departamento
            </label>
            <select
              id="idDepartamento"
              className={`input p-2 border ${errors.idDepartamento ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={idDepartamento}
              onChange={(e) => {
                setIdDepartamento(e.target.value);
                if (errors.idDepartamento) setErrors((prev) => ({ ...prev, idDepartamento: '' }));
              }}
            >
              <option value="">Seleccione un departamento</option>
              {departamentos.map((departamento: any) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.descripcion}
                </option>
              ))}
            </select>
            {errors.idDepartamento && <p className="mt-1 text-sm text-red-500">{errors.idDepartamento}</p>}
          </div>

          <div>
            <label htmlFor="idCiudad" className="block mb-1 text-sm font-medium">
              Ciudad
            </label>
            <select
              id="idCiudad"
              className={`input p-2 border ${errors.idCiudad ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={idCiudad}
              onChange={(e) => {
                setIdCiudad(e.target.value);
                if (errors.idCiudad) setErrors((prev) => ({ ...prev, idCiudad: '' }));
              }}
              disabled={!idDepartamento}
            >
              <option value="">Seleccione una ciudad</option>
              {ciudades.map((ciudad: any) => (
                <option key={ciudad.id} value={ciudad.id}>
                  {ciudad.descripcion}
                </option>
              ))}
            </select>
            {errors.idCiudad && <p className="mt-1 text-sm text-red-500">{errors.idCiudad}</p>}
          </div>
          <div>
            <label htmlFor="tipoLugar" className="block mb-1 text-sm font-medium">
              Tipo de Lugar
            </label>
            <select
              id="tipoLugar"
              className={`input p-2 border ${errors.tipoLugar ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={tipoLugar}
              onChange={(e) => {
                setTipoLugar(e.target.value);
                if (errors.tipoLugar) setErrors((prev) => ({ ...prev, tipoLugar: '' }));
              }}
            >
              <option value="">Seleccione un tipo</option>
              <option value="VEREDA">VEREDA</option>
              <option value="CORREGIMIENTO">CORREGIMIENTO</option>
            </select>
            {errors.tipoLugar && <p className="mt-1 text-sm text-red-500">{errors.tipoLugar}</p>}
          </div>

          <div>
            <label htmlFor="nombre" className="block mb-1 text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombre"
              className={`input p-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' }));
              }}
              placeholder="Nombre"
            />
            {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
          </div>

        

          <div className="flex justify-end gap-3 px-4 mt-4">
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

export default ModalLugares;
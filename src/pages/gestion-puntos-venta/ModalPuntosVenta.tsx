import React, { useState, useEffect } from 'react';
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

const ModalPuntosVenta = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [idSede, setIdSede] = useState(data?.idSede || '');
  const [nombre, setNombre] = useState(data?.nombre || '');
  const [imagenUrl, setImagenUrl] = useState(data?.imagenUrl || '');
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState(data?.tipo || '');
  const [errors, setErrors] = useState<{ idSede: string; nombre: string; imagenUrl: string; tipo: string }>({
    idSede: '',
    nombre: '',
    imagenUrl: '',
    tipo: ''
  });
  const [sedes, setSedes] = useState([]);
  const tiposEnum = ['Tienda', 'Ventanilla', 'Servicios', 'Otro']; 

  useEffect(() => {
    if (open) {
      fetchSedes();
      setIdSede('');
      setNombre('');
      setImagenUrl('');
      setImagenFile(null);
      setErrors({ idSede: '', nombre: '', imagenUrl: '', tipo: '' });
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setIdSede(data.idSede);
      setNombre(data.nombre);
      setImagenUrl(data.imagenUrl);
      setTipo(data.tipo);
    }
  }, [data]);

  const fetchSedes = async () => {
    try {
      const response = await axios.get('sedes');
      setSedes(response.data);
    } catch (error) {
      console.error('Error fetching sedes:', error);
    }
  };

  const validate = () => {
    const newErrors: { idSede: string; nombre: string; imagenUrl: string ; tipo:string} = {
      idSede: '',
      nombre: '',
      imagenUrl: '',
      tipo:''
    };

    if (!idSede) newErrors.idSede = 'La sede es requerida.';
    if (!nombre.trim()) newErrors.nombre = 'La descripción es requerida.';

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append('idSede', idSede);
    formData.append('nombre', nombre);
    formData.append('tipo', tipo);
    if (imagenFile) {
      formData.append('imagenUrl', imagenFile);
    }

    try {
      if (data) {
        await axios.post(`punto_de_ventas_edit/${data.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        enqueueSnackbar('Punto de venta actualizado con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('punto_de_ventas', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        enqueueSnackbar('Punto de venta guardado con éxito.', {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagenFile(e.target.files[0]);
      setImagenUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Punto de Ventas' : 'Nuevo Punto de Ventas'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="idSede" className="block mb-1 text-sm font-medium">
              Sede
            </label>
            <select
              id="idSede"
              className={`input p-2 border ${errors.idSede ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={idSede}
              onChange={(e) => {
                setIdSede(e.target.value);
                if (errors.idSede) setErrors((prev) => ({ ...prev, idSede: '' }));
              }}
            >
              <option value="">Seleccione una sede</option>
              {sedes.map((sede: any) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
            </select>
            {errors.idSede && <p className="mt-1 text-sm text-red-500">{errors.idSede}</p>}
          </div>
          <div>
            <label htmlFor="tipo" className="block mb-1 text-sm font-medium">Tipo</label>
            <select
              id="tipo"
              className={`input p-2 border ${errors.tipo ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                if (errors.tipo) setErrors((prev) => ({ ...prev, tipo: '' }));
              }}
            >
              <option value="">Seleccione un tipo</option>
              {tiposEnum.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.tipo && <p className="mt-1 text-sm text-red-500">{errors.tipo}</p>}
          </div>
          <div>
            <label htmlFor="nombre" className="block mb-1 text-sm font-medium">
              Nombre
            </label>
            <textarea
              id="nombre"
              className={`textarea p-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Descripción"
              rows={5}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' }));
              }}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
            )}
          </div>

          <div>
            <label htmlFor="imagen" className="block mb-1 text-sm font-medium">
              Imagen
            </label>
            <input
              type="file"
              id="imagen"
              accept="image/*"
              onChange={handleImageChange}
             className="file-input"
            />
            {errors.imagenUrl && (
              <p className="mt-1 text-sm text-red-500">{errors.imagenUrl}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 px-4 mt-4">
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

export default ModalPuntosVenta;
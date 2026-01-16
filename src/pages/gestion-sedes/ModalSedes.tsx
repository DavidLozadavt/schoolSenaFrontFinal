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

const ModalSedes = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [idSede, setIdSede] = useState(data?.idSede || '');
  const [nombre, setNombre] = useState(data?.nombre || '');
  const [direccion, setDireccion] = useState(data?.direccion || '');
  const [descripcion, setDescripcion] = useState(data?.descripcion || '');
  const [email, setEmail] = useState(data?.email || '');
  const [celular, setCelular] = useState(data?.celular || '');
  const [telefono, setTelefono] = useState(data?.telefono || '');
  const [idResponsable, setIdResponsable] = useState(data?.idResponsable || '');
  const [imagen, setImagen] = useState<File | null>(null); // Cambio aquí
  const [errors, setErrors] = useState<{
    nombre: string;
    direccion: string;
    email: string;
    celular: string;
    telefono: string;
    idResponsable: string;
    imagen: string;
    descripcion: string;
  }>({
    nombre: '',
    direccion: '',
    email: '',
    celular: '',
    telefono: '',
    idResponsable: '',
    imagen: '',
    descripcion: ''
  });

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (open) {
      fetchUsers();
      if (!data) {
        setNombre('');
        setDireccion('');
        setEmail('');
        setCelular('');
        setTelefono('');
        setIdResponsable('');
        setImagen(null); // Cambio aquí
        setDescripcion('');
        setErrors({
          nombre: '',
          direccion: '',
          email: '',
          celular: '',
          telefono: '',
          idResponsable: '',
          imagen: '',
          descripcion: ''
        });
      }
    }
  }, [open, data]);

  useEffect(() => {
    if (data) {
      setNombre(data.nombre);
      setDireccion(data.direccion);
      setEmail(data.email);
      setCelular(data.celular);
      setTelefono(data.telefono);
      setIdResponsable(data.idResponsable);
      setImagen(data.imagen); // Cambio aquí (si la imagen es una URL)
      setDescripcion(data.descripcion);
    }
  }, [data]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('lista_usuarios');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching sedes:', error);
    }
  };

  const validate = () => {
    const newErrors: {
      nombre: string;
      direccion: string;
      email: string;
      celular: string;
      telefono: string;
      idResponsable: string;
      imagen: string;
      descripcion: string;
    } = {
      nombre: '',
      direccion: '',
      email: '',
      celular: '',
      telefono: '',
      idResponsable: '',
      imagen: '',
      descripcion: ''
    };

    if (!nombre.trim()) newErrors.nombre = 'El nombre es requerido.';
    if (!direccion.trim()) newErrors.direccion = 'La dirección es requerida.';
    if (!email.trim()) newErrors.email = 'El email es requerido.';
    if (!celular.trim()) newErrors.celular = 'El celular es requerido.';
    if (!telefono.trim()) newErrors.telefono = 'El teléfono es requerido.';
    if (!idResponsable) newErrors.idResponsable = 'El responsable es requerido.';
    if (!imagen) newErrors.imagen = 'La imagen es requerida.'; // Cambio aquí
    if (!descripcion.trim()) newErrors.descripcion = 'La descripción es requerida.';

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    const formData = new FormData(); // Crear FormData
    formData.append('nombre', nombre);
    formData.append('direccion', direccion);
    formData.append('email', email);
    formData.append('celular', celular);
    formData.append('telefono', telefono);
    formData.append('idResponsable', idResponsable);
    formData.append('descripcion', descripcion);
    if (imagen) {
      formData.append('imagen', imagen);
    }

    try {
      if (data) {
        await axios.post(`sede_update/${data.id}`, formData);
        enqueueSnackbar('Sede actualizada con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('sedes', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        enqueueSnackbar('Sede guardada con éxito.', {
          variant: 'success'
        });
      }
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar los datos.', {
        variant: 'error'
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Sede' : 'Nueva Sede'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="idResponsable" className="block mb-1 text-sm font-medium">
              Responsable
            </label>
            <select
              id="idResponsable"
              className={`input p-2 border ${errors.idResponsable ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
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
            {errors.idResponsable && <p className="mt-1 text-sm text-red-500">{errors.idResponsable}</p>}
          </div>

          <div>
            <label htmlFor="nombre" className="block mb-1 text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              className={`input p-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' }));
              }}
            />
            {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
          </div>

          <div>
            <label htmlFor="direccion" className="block mb-1 text-sm font-medium">
              Dirección
            </label>
            <input
              id="direccion"
              type="text"
              className={`input p-2 border ${errors.direccion ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={direccion}
              onChange={(e) => {
                setDireccion(e.target.value);
                if (errors.direccion) setErrors((prev) => ({ ...prev, direccion: '' }));
              }}
            />
            {errors.direccion && <p className="mt-1 text-sm text-red-500">{errors.direccion}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`input p-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="celular" className="block mb-1 text-sm font-medium">
              Celular
            </label>
            <input
              id="celular"
              type="text"
              className={`input p-2 border ${errors.celular ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={celular}
              onChange={(e) => {
                setCelular(e.target.value);
                if (errors.celular) setErrors((prev) => ({ ...prev, celular: '' }));
              }}
            />
            {errors.celular && <p className="mt-1 text-sm text-red-500">{errors.celular}</p>}
          </div>

          <div>
            <label htmlFor="telefono" className="block mb-1 text-sm font-medium">
              Teléfono
            </label>
            <input
              id="telefono"
              type="text"
              className={`input p-2 border ${errors.telefono ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                if (errors.telefono) setErrors((prev) => ({ ...prev, telefono: '' }));
              }}
            />
            {errors.telefono && <p className="mt-1 text-sm text-red-500">{errors.telefono}</p>}
          </div>

          <div>
            <label htmlFor="descripcion" className="block mb-1 text-sm font-medium">
              Descripción
            </label>
            <textarea
              id="descripcion"
              className={`textarea p-2 border ${errors.descripcion ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Descripción"
              rows={5}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (errors.descripcion) setErrors((prev) => ({ ...prev, descripcion: '' }));
              }}
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-500">{errors.descripcion}</p>
            )}
          </div>

          <div>
            <label htmlFor="imagen" className="block mb-1 text-sm font-medium">
              Imagen
            </label>
            <input
              id="imagen"
              type="file"
               className="file-input"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImagen(e.target.files[0]); 
                  if (errors.imagen) setErrors((prev) => ({ ...prev, imagen: '' }));
                }
              }}
            />
            {errors.imagen && <p className="mt-1 text-sm text-red-500">{errors.imagen}</p>}
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

export { ModalSedes };
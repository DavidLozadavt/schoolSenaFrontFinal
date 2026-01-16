import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Modal, ModalContent, ModalBody, ModalHeader, ModalTitle
} from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

interface TipoIdentificacion {
  id: number;
  codigo: string;
  detalle: string;
}

const ModalClienteNuevo = ({ open, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [nombre, setNombre] = useState('');
  const [tipoIdentificacion, setidTipoIdentificacion] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tiposDocumento, setTiposDocumento] = useState<TipoIdentificacion[]>([]);

  const [errors, setErrors] = useState({
    nombre: '',
    idTipoIdentificacion: '',
    identificacion: '',
    email: '',
    direccion: '',
    telefono: ''
  });

  useEffect(() => {
    if (open) {
      setNombre('');
      setidTipoIdentificacion('');
      setIdentificacion('');
      setEmail('');
      setDireccion('');
      setTelefono('');
      setErrors({
        nombre: '',
        idTipoIdentificacion: '',
        identificacion: '',
        email: '',
        direccion: '',
        telefono: ''
      });

      axios.get('tipo_identificaciones')
        .then((res) => {
          setTiposDocumento(res.data);
        })
        .catch(() => {
          enqueueSnackbar('Error al cargar tipos de identificación', { variant: 'error' });
        });
    }
  }, [open]);

  const validate = () => {
    const newErrors = {
      nombre: nombre.trim() ? '' : 'Ingrese el nombre',
      idTipoIdentificacion: tipoIdentificacion ? '' : 'Seleccione el tipo',
      identificacion: identificacion.trim() ? '' : 'Ingrese la identificación',
      email: email.trim() ? '' : 'Ingrese el email',
      direccion: direccion.trim() ? '' : 'Ingrese la dirección',
      telefono: telefono.trim() ? '' : 'Ingrese el teléfono'
    };

    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await axios.post('terceros', {
        nombre,
        tipoIdentificacion,
        identificacion,
        email,
        direccion,
        telefono
      });

      enqueueSnackbar('Cliente registrado con éxito.', { variant: 'success' });
      if (onSave) onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al registrar cliente.', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>Registrar Cliente</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-3 px-0 py-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={`input ${errors.nombre ? 'border-red-500' : ''}`}
              placeholder="Ingrese el nombre"
            />
            {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Tipo de Identificación</label>
            <select
              value={tipoIdentificacion}
              onChange={(e) => setidTipoIdentificacion(e.target.value)}
              className={`input ${errors.idTipoIdentificacion ? 'border-red-500' : ''}`}
            >
              <option value="">Seleccione</option>
              {tiposDocumento.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.detalle}
                </option>
              ))}
            </select>

            {errors.idTipoIdentificacion && (
              <p className="text-sm text-red-500">{errors.idTipoIdentificacion}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Identificación</label>
            <input
              value={identificacion}
              onChange={(e) => setIdentificacion(e.target.value)}
              className={`input ${errors.identificacion ? 'border-red-500' : ''}`}
              placeholder="Ingrese la identificación"
            />
            {errors.identificacion && (
              <p className="text-sm text-red-500">{errors.identificacion}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Ingrese el email"
              type="email"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Dirección</label>
            <input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className={`input ${errors.direccion ? 'border-red-500' : ''}`}
              placeholder="Ingrese la dirección"
            />
            {errors.direccion && <p className="text-sm text-red-500">{errors.direccion}</p>}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Teléfono</label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={`input ${errors.telefono ? 'border-red-500' : ''}`}
              placeholder="Ingrese el teléfono"
            />
            {errors.telefono && <p className="text-sm text-red-500">{errors.telefono}</p>}
          </div>

          <div className="flex justify-end gap-3 px-4 mt-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>
              Aceptar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalClienteNuevo;

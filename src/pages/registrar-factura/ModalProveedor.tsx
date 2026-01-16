import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { TerceroInterface } from './models/TerceroInterface';

interface ModalProps {
  open: boolean;
  data?: TerceroInterface;
  onClose: () => void;
  onSave?: () => void;
}

const ModalTercero = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [tiposIdentificacion, setTiposIdentificacion] = useState<
    { id: number; codigo: string; detalle: string }[]
  >([]);
  const [tipoIdentificacion, setTipoIdentificacion] = useState(data?.idTipoIdentificacion || '');

  const [nit, setNit] = useState(data?.identificacion || '');
  const [nombre, setNombre] = useState(data?.nombre || '');
  const [email, setCorreo] = useState(data?.email || '');
  const [digitoVerficacion, setDigito] = useState(data?.digitoVerficacion || '');
  const [telefono, setTelefono] = useState(data?.telefono || '');
  const [direccion, setDirecciones] = useState(data?.direccion || '');
  const [retenciones, setRetenciones] = useState(data?.retenciones || false);
  const [responsableIva, setResponsablesIva] = useState(data?.responsableIva || false);
  const [errors, setErrors] = useState({
    nit: '',
    nombre: '',
    email: '',
    digitoVerficacion: '',
    telefono: '',
    direccion: ''
  });

  useEffect(() => {
    if (open) {
      axios
        .get('/tipo_identificaciones')
        .then((res) => setTiposIdentificacion(res.data))
        .catch(() =>
          enqueueSnackbar('Error al cargar tipos de identificación.', { variant: 'error' })
        );
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setNit('');
      setNombre('');
      setCorreo('');
      setDigito('');
      setTelefono('');
      setDirecciones('');
      setRetenciones(false);
      setResponsablesIva(false);
      setErrors({
        nit: '',
        nombre: '',
        email: '',
        digitoVerficacion: '',
        telefono: '',
        direccion: ''
      });
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setNit(data.identificacion || '');
      setNombre(data.nombre || '');
      setCorreo(data.email || '');
      setDigito(data.digitoVerficacion || '');
      setTelefono(data.telefono || '');
      setDirecciones(data.direccion || '');
      setRetenciones(data.retenciones || false);
      setResponsablesIva(data.responsableIva || false);
    }
  }, [data]);

  const validateField = (field: string, value: string): string => {
    if (field === 'nit') {
      if (!value || isNaN(Number(value))) {
        return 'El NIT es requerido y debe ser un número válido.';
      }
    }

    if (field === 'nombre') {
      if (!value) {
        return 'El nombre es requerido.';
      }
    }

    if (field === 'email') {
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'El correo electrónico es inválido.';
      }
    }

    if (field === 'digito') {
      if (!value || isNaN(Number(value))) {
        return 'El dígito es requerido y debe ser un número válido.';
      }
    }

    if (field === 'telefono') {
      if (!value || isNaN(Number(value))) {
        return 'El teléfono es requerido y debe ser un número válido.';
      }
    }

    if (field === 'direcciones') {
      if (!value) {
        return 'La dirección es requerida.';
      }
    }

    return '';
  };

  const handleFieldChange = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validate = () => {
    const nitError = validateField('nit', nit);
    const nombreError = validateField('nombre', nombre);
    const correoError = validateField('email', email);
    const digitoError = validateField('digitoVerficacion', digitoVerficacion);
    const telefonoError = validateField('telefono', telefono);
    const direccionesError = validateField('direccion', direccion);

    setErrors({
      nit: nitError,
      nombre: nombreError,
      email: correoError,
      digitoVerficacion: digitoError,
      telefono: telefonoError,
      direccion: direccionesError
    });

    return (
      !nitError &&
      !nombreError &&
      !correoError &&
      !digitoError &&
      !telefonoError &&
      !direccionesError
    );
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      identificacion: nit, // acá cambio
      nombre,
      email,
      digitoVerficacion,
      telefono,
      direccion,
      retenciones,
      responsableIva,
      idTipoIdentificacion: tipoIdentificacion
    };

    try {
      if (data) {
        await axios.put(`terceros/${data.id}`, payload);
        enqueueSnackbar('Tercero actualizado con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('terceros', payload);
        enqueueSnackbar('Provedor guardado con éxito.', {
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
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editando proveedor' : 'Crenado nuevo proveedor'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="tipoIdentificacion" className="block mb-1 text-sm font-medium">
              Tipo de Identificación
            </label>
            <select
              id="tipoIdentificacion"
              className="select p-2 border border-gray-300 rounded-md w-full"
              value={tipoIdentificacion}
              onChange={(e) => setTipoIdentificacion(e.target.value)}
            >
              <option value="">Seleccione un tipo</option>
              {tiposIdentificacion.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.detalle} ({tipo.codigo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="nit" className="block mb-1 text-sm font-medium">
              NIT
            </label>
            <input
              id="nit"
              className={`input p-2 border ${errors.nit ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="NIT"
              value={nit}
              onChange={(e) => {
                setNit(e.target.value);
                handleFieldChange('nit', e.target.value);
              }}
            />
            {errors.nit && <p className="text-red-500 text-sm mt-1">{errors.nit}</p>}
          </div>

          <div>
            <label htmlFor="digito" className="block mb-1 text-sm font-medium">
              Dígito de Verificación
            </label>
            <input
              id="digito"
              className={`input p-2 border ${errors.digitoVerficacion ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Dígito"
              value={digitoVerficacion}
              onChange={(e) => {
                setDigito(e.target.value);
                handleFieldChange('digitoVerficacion', e.target.value);
              }}
            />
            {errors.digitoVerficacion && (
              <p className="text-red-500 text-sm mt-1">{errors.digitoVerficacion}</p>
            )}
          </div>

          <div>
            <label htmlFor="nombre" className="block mb-1 text-sm font-medium">
              Razón Social
            </label>
            <input
              id="nombre"
              className={`input p-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder=" Razón Social"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                handleFieldChange('nombre', e.target.value);
              }}
            />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label htmlFor="correo" className="block mb-1 text-sm font-medium">
              Correo Electrónico
            </label>
            <input
              id="correo"
              className={`input p-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => {
                setCorreo(e.target.value);
                handleFieldChange('email', e.target.value);
              }}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="telefono" className="block mb-1 text-sm font-medium">
              Teléfono
            </label>
            <input
              id="telefono"
              className={`input p-2 border ${errors.telefono ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                handleFieldChange('telefono', e.target.value);
              }}
            />
            {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
          </div>

          <div>
            <label htmlFor="direcciones" className="block mb-1 text-sm font-medium">
              Direccion
            </label>
            <textarea
              id="direcciones"
              className={`textarea p-2 border ${errors.direccion ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Direcciones"
              rows={3}
              value={direccion}
              onChange={(e) => {
                setDirecciones(e.target.value);
                handleFieldChange('direccion', e.target.value);
              }}
            />
            {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
          </div>

          <div>
            <label htmlFor="retenciones" className="block mb-1 text-sm font-medium">
              Retenciones
            </label>
            <input
              id="retenciones"
              type="checkbox"
              checked={retenciones}
              onChange={(e) => setRetenciones(e.target.checked)}
            />
          </div>

          <div>
            <label htmlFor="responsablesIva" className="block mb-1 text-sm font-medium">
              Responsables de IVA
            </label>
            <input
              id="responsableIva"
              type="checkbox"
              checked={responsableIva}
              onChange={(e) => setResponsablesIva(e.target.checked)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalTercero };

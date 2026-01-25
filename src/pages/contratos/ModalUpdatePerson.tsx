import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { ContratoInterface } from './model/ContratoInterface';

interface ModalUpdatePersonProps {
  open: boolean;
  onClose: () => void;
  contrato: ContratoInterface;
  onSave: () => void;
}

const ModalUpdatePerson = ({ open, onClose, contrato, onSave }: ModalUpdatePersonProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    nombre1: '',
    nombre2: '',
    apellido1: '',
    apellido2: '',
    identificacion: '',
    idtipoIdentificacion: '',
    email: '',
    celular: '',
    telefonoFijo: '',
    fechaNac: '',
    direccion: '',
    sexo: '',
    rh: '',
    idciudadNac: '',
    idciudadUbicacion: ''
  });

  const [tiposIdentificacion, setTiposIdentificacion] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [ciudadesNac, setCiudadesNac] = useState<any[]>([]);
  const [ciudadesUbicacion, setCiudadesUbicacion] = useState<any[]>([]);

  useEffect(() => {
    if (open && contrato?.persona) {
      const persona = contrato.persona as any;
      
      const tipoIdValue = persona.tipoIdentificacion?.id 
        || persona.idTipoIdentificacion 
        || persona.idtipoIdentificacion
        || '';
      
      setFormData({
        nombre1: persona.nombre1 || '',
        nombre2: persona.nombre2 || '',
        apellido1: persona.apellido1 || '',
        apellido2: persona.apellido2 || '',
        identificacion: persona.identificacion || '',
        idtipoIdentificacion: tipoIdValue ? String(tipoIdValue) : '',
        email: persona.email || '',
        celular: persona.celular || '',
        telefonoFijo: persona.telefonoFijo || '',
        fechaNac: persona.fechaNac ? persona.fechaNac.split('T')[0] : '',
        direccion: persona.direccion || '',
        sexo: persona.sexo || '',
        rh: persona.rh || '',
        idciudadNac: persona.idCiudadNac?.toString() || persona.CiudadNac?.id?.toString() || persona.ciudadNac?.id?.toString() || '',
        idciudadUbicacion: persona.idCiudadUbicacion?.toString() || persona.ciudadUbicacion?.id?.toString() || ''
      });
    }
  }, [open, contrato]);

  const fetchTiposIdentificacion = useCallback(async () => {
    try {
      const response = await axios.get('contrato-tipos-identificacion');
      setTiposIdentificacion(response.data);
    } catch (err) {
      console.error('Error al cargar tipos de identificación:', err);
    }
  }, []);

  const fetchDepartamentos = useCallback(async () => {
    try {
      const response = await axios.get('departamentos');
      setDepartamentos(response.data);
    } catch (err) {
      console.error('Error al cargar departamentos:', err);
    }
  }, []);

  const fetchCiudades = useCallback(async (idDepartamento: number, tipo: 'nac' | 'ubicacion') => {
    try {
      const response = await axios.get(`ciudades/departamento/${idDepartamento}`);
      if (tipo === 'nac') {
        setCiudadesNac(response.data);
      } else {
        setCiudadesUbicacion(response.data);
      }
    } catch (err) {
      console.error('Error al cargar ciudades:', err);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchTiposIdentificacion();
      fetchDepartamentos();
      setError('');
    }
  }, [open, fetchTiposIdentificacion, fetchDepartamentos]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!contrato?.persona?.id) {
      setError('No se encontró la persona');
      return;
    }

    if (!formData.idtipoIdentificacion) {
      setError('El tipo de identificación es obligatorio');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const dataToSend: any = {
        nombre1: formData.nombre1,
        apellido1: formData.apellido1,
        identificacion: formData.identificacion,
        email: formData.email,
        celular: formData.celular,
        idtipoIdentificacion: Number(formData.idtipoIdentificacion)
      };

      if (formData.nombre2) {
        dataToSend.nombre2 = formData.nombre2;
      }
      if (formData.apellido2) {
        dataToSend.apellido2 = formData.apellido2;
      }
      if (formData.fechaNac) {
        dataToSend.fechaNac = formData.fechaNac;
      }
      if (formData.direccion) {
        dataToSend.direccion = formData.direccion;
      }
      if (formData.idciudadNac) {
        dataToSend.idciudadNac = Number(formData.idciudadNac);
      }
      if (formData.idciudadUbicacion) {
        dataToSend.idciudadUbicacion = Number(formData.idciudadUbicacion);
      }
      if (formData.telefonoFijo) {
        dataToSend.telefonoFijo = formData.telefonoFijo;
      }
      if (formData.sexo) {
        dataToSend.sexo = formData.sexo;
      }
      if (formData.rh) {
        dataToSend.rh = formData.rh;
      }
      
      await axios.post(`update_contrato_persona/${contrato.persona.id}`, dataToSend);

      enqueueSnackbar('Datos de la persona actualizados correctamente', { variant: 'success' });
      onSave();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar los datos';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4 max-h-[85vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>Editar Datos de la Persona</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          {error && (
            <div className="px-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Tipo de Identificación <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.idtipoIdentificacion}
                onChange={(e) => handleInputChange('idtipoIdentificacion', e.target.value)}
                className="select w-full"
                required
              >
                <option value="">Seleccione el tipo</option>
                {tiposIdentificacion.map((tipo) => (
                  <option key={tipo.id} value={String(tipo.id)}>
                    {tipo.nombre || tipo.descripcion || tipo.tipoIdentificacion || tipo.detalle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Identificación <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.identificacion}
                onChange={(e) => handleInputChange('identificacion', e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Primer Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre1}
                onChange={(e) => handleInputChange('nombre1', e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Segundo Nombre</label>
              <input
                type="text"
                value={formData.nombre2}
                onChange={(e) => handleInputChange('nombre2', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Primer Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.apellido1}
                onChange={(e) => handleInputChange('apellido1', e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Segundo Apellido</label>
              <input
                type="text"
                value={formData.apellido2}
                onChange={(e) => handleInputChange('apellido2', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Celular <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.celular}
                onChange={(e) => handleInputChange('celular', e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono Fijo</label>
              <input
                type="text"
                value={formData.telefonoFijo}
                onChange={(e) => handleInputChange('telefonoFijo', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={formData.fechaNac}
                onChange={(e) => handleInputChange('fechaNac', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Sexo</label>
              <select
                value={formData.sexo}
                onChange={(e) => handleInputChange('sexo', e.target.value)}
                className="select w-full"
              >
                <option value="">Seleccione</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">RH</label>
              <select
                value={formData.rh}
                onChange={(e) => handleInputChange('rh', e.target.value)}
                className="select w-full"
              >
                <option value="">Seleccione</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Dirección</label>
              <textarea
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                className="input w-full"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={saving || !formData.nombre1 || !formData.apellido1 || !formData.identificacion || !formData.email || !formData.idtipoIdentificacion}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalUpdatePerson };

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { TipoDocumentoInterface } from '../contratacion/model/TipoDocumentoInterface';
import { PersonaInterface } from '../contratacion/model/PersonaInterface';

import { toAbsoluteUrl } from '@/utils';
import { validationFieldPerson } from './utils/validationFieldPerson';

interface ModalProps {
  open: boolean;
  persona?: any;
  onClose: () => void;
  onSave: () => void;
}

interface FormErrors {
  [key: string]: string;
}

const defaultImage = toAbsoluteUrl('/media/avatars/300-35.png');

const ModalUsuarios = ({ open, onClose, persona, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [tipoIdentificaciones, setTipoIdentificacion] = useState<TipoDocumentoInterface[]>([]);
  const [selectedFilePersona, setSelectedFilePersona] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [formDataPersona, setFormDataPersona] = useState<PersonaInterface>({
    nombre1: '',
    apellido1: '',
    nombre2: '',
    idTipoIdentificacion: '',
    identificacion: '',
    rh: '',
    contrasena: '',
    sexo: '',
    fechaNac: '',

    apellido2: '',
    email: '',
    direccion: '',
    celular: '',
    telefonoFijo: ''
  });

  useEffect(() => {
    if (open) {
      if (persona) {
        setFormDataPersona({
          id: persona.persona?.id || undefined,
          nombre1: persona.persona?.nombre1 || '',
          apellido1: persona.persona?.apellido1 || '',
          nombre2: persona.persona?.nombre2 || '',
          idTipoIdentificacion: persona.persona?.idTipoIdentificacion || '',
          identificacion: persona.persona?.identificacion || '',
          rh: persona.persona?.rh || '',
          sexo: persona.persona?.sexo || '',
          fechaNac: persona.persona?.fechaNac || '',

          apellido2: persona.persona?.apellido2 || '',
          email: persona.email || '',
          direccion: persona.persona?.direccion || '',
          celular: persona.persona?.celular || '',
          telefonoFijo: persona.persona?.telefonoFijo || '',
          contrasena: ''
        });

        setSelectedFilePersona(persona.persona?.rutaFotoUrl || null);
      } else {
        setFormDataPersona({
          id: undefined,
          nombre1: '',
          apellido1: '',
          nombre2: '',
          idTipoIdentificacion: '',
          identificacion: '',
          rh: '',
          sexo: '',
          fechaNac: '',

          apellido2: '',
          email: '',
          direccion: '',
          celular: '',
          telefonoFijo: '',
          contrasena: ''
        });
        setSelectedFilePersona(null);
      }

      setErrors({});
    }
  }, [open, persona]);

  const handleChangeFormPerson = (e: any) => {
    const { name, value } = e.target;
    const error = validationFieldPerson(name, value);

    setFormDataPersona((prevData) => ({
      ...prevData,
      [name]: value
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error || undefined
    }));
  };

  const fetchTipoIdentificacion = async () => {
    try {
      const response = await axios.get('contrato-tipos-identificacion');
      setTipoIdentificacion(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilePersonaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setSelectedFilePersona(file);

    if (file) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors['rutaFoto'];
        return newErrors;
      });
    }
  };

  const handleFilePersonaDelete = () => {
    setSelectedFilePersona(null);
  };

  const handleSave = () => {
    let validationErrors: Partial<any> = {};
    const isEdit = Boolean(formDataPersona.id);

    Object.entries(formDataPersona).forEach(([name, value]) => {
      const error = validationFieldPerson(name, value, isEdit);
      if (error) {
        validationErrors[name] = error;
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const user = {
      ...formDataPersona,
      foto: selectedFilePersona
    };

    handleSubmitUsuario(user);
  };

  const handleSubmitUsuario = async (propietario: any) => {
    const data = new FormData();

    Object.entries(propietario).forEach(([key, value]) => {
      if (key === 'foto') return;
      if (value !== undefined && value !== null) {
        data.append(key, String(value));
      }
    });

    if (propietario.foto instanceof File) {
      data.append('rutaFotoFile', propietario.foto);
    }

    try {
      if (propietario.id) {
        await axios.post(`update_user/${persona?.id}`, data);
        enqueueSnackbar('Usuario actualizado con éxito.', { variant: 'success' });
      } else {
        await axios.post(`usuarios`, data);
        enqueueSnackbar('Usuario guardado con éxito.', { variant: 'success' });
      }

      onSave();
    } catch (error) {
      setLoading(false);
      enqueueSnackbar('Error al guardar el usuario.', {
        variant: 'error'
      });
    }
  };

  const [previewSrc, setPreviewSrc] = useState<string>(defaultImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedFilePersona instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewSrc(reader.result as string);
      };
      reader.readAsDataURL(selectedFilePersona);
    } else if (persona?.persona?.rutaFotoUrl) {
      setPreviewSrc(persona.persona.rutaFotoUrl);
    } else {
      setPreviewSrc(defaultImage);
    }
  }, [selectedFilePersona, persona]);

  useEffect(() => {
    fetchTipoIdentificacion();
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[980px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{persona ? 'Editar Usuario' : 'Nuevo Usuario'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <form>
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="flex-1 basis-[68%]">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 gap-6 mb-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo Identificación *</label>
                    <select
                      name="idTipoIdentificacion"
                      value={formDataPersona.idTipoIdentificacion}
                      onChange={handleChangeFormPerson}
                      className="input"
                    >
                      <option value="">Seleccione una Opción</option>
                      {tipoIdentificaciones.map((tipoIdentificacion) => (
                        <option key={tipoIdentificacion.id} value={tipoIdentificacion.id}>
                          {tipoIdentificacion.codigo}
                        </option>
                      ))}
                    </select>
                    {errors.idTipoIdentificacion && (
                      <p className="text-red-500 text-sm mt-1">{errors.idTipoIdentificacion}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Identificación *</label>
                    <input
                      type="text"
                      name="identificacion"
                      placeholder="Ingrese su identificación"
                      value={formDataPersona.identificacion}
                      onChange={handleChangeFormPerson}
                      className={`input ${errors.identificacion ? 'border-red-500' : ''}`}
                    />
                    {errors.identificacion && (
                      <p className="text-red-500 text-sm mt-1">{errors.identificacion}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 gap-6 mb-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Primer Nombre *</label>
                    <input
                      type="text"
                      name="nombre1"
                      placeholder="Ingrese su primer nombre"
                      value={formDataPersona.nombre1}
                      onChange={handleChangeFormPerson}
                      className={`input ${errors.nombre1 ? 'border-red-500' : ''}`}
                    />
                    {errors.nombre1 && (
                      <p className="text-red-500 text-sm mt-1">{errors.nombre1}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Segundo Nombre</label>
                    <input
                      type="text"
                      placeholder="Ingrese su segundo nombre"
                      name="nombre2"
                      value={formDataPersona.nombre2}
                      onChange={handleChangeFormPerson}
                      className="input"
                    />
                    {errors.nombre2 && (
                      <p className="text-red-500 text-sm mt-1">{errors.nombre2}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 gap-6 mb-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Primer Apellido *</label>
                    <input
                      type="text"
                      name="apellido1"
                      placeholder="Ingrese su primer apellido"
                      value={formDataPersona.apellido1}
                      onChange={handleChangeFormPerson}
                      className="input"
                    />{' '}
                    {errors.apellido1 && (
                      <p className="text-red-500 text-sm mt-1">{errors.apellido1}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Segundo Apellido</label>
                    <input
                      type="text"
                      name="apellido2"
                      placeholder="Ingrese su segundo apellido"
                      value={formDataPersona.apellido2}
                      onChange={handleChangeFormPerson}
                      className="input"
                    />
                    {errors.apellido2 && (
                      <p className="text-red-500 text-sm mt-1">{errors.apellido2}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="basis-[35%] flex items-center justify-center">
                <div className="w-48 h-48 border rounded-lg overflow-hidden shadow">
                  <img src={previewSrc} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium mb-2">Sexo *</label>
                <select
                  name="sexo"
                  value={formDataPersona.sexo}
                  onChange={handleChangeFormPerson}
                  className="input"
                >
                  <option value="">Seleccione una Opción</option>

                  <option value="F">FEMENINO</option>
                  <option value="M">MASCULINO</option>
                  <option value="O">OTRO</option>
                </select>
                {errors.sexo && <p className="text-red-500 text-sm mt-1">{errors.sexo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rh *</label>
                <select
                  name="rh"
                  value={formDataPersona.rh}
                  onChange={handleChangeFormPerson}
                  className="input"
                >
                  <option value="">Seleccione una Opción</option>

                  <option value="A+">A POSITIVO</option>
                  <option value="A-">A NEGATIVO</option>
                  <option value="AB+">AB POSTITIVO</option>
                  <option value="AB-">AB NEGATIVO</option>
                  <option value="B+">B POSITIVO</option>
                  <option value="B-">B NEGATIVO</option>
                  <option value="O+">O POSITIVO</option>
                  <option value="O-">O NEGATIVO</option>
                </select>
                {errors.rh && <p className="text-red-500 text-sm mt-1">{errors.rh}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Foto *</label>

                {!selectedFilePersona ? (
                  <input
                    type="file"
                    name="rutaFoto"
                    onChange={handleFilePersonaChange}
                    className="file-input"
                  />
                ) : (
                  <div className="flex items-center">
                    <p className="text-sm input flex justify-between w-full items-center">
                      {selectedFilePersona instanceof File
                        ? selectedFilePersona.name
                        : 'Imagen actual'}
                      <span
                        onClick={handleFilePersonaDelete}
                        className="ml-2 cursor-pointer text-red-500 hover:text-red-700"
                        title="Eliminar imagen"
                      >
                        <KeenIcon icon="trash" />
                      </span>
                    </p>
                  </div>
                )}

                {errors['rutaFoto'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['rutaFoto']}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium mb-2">Dirección *</label>
                <input
                  type="text"
                  name="direccion"
                  placeholder="Ingrese la dirección"
                  value={formDataPersona.direccion}
                  onChange={handleChangeFormPerson}
                  className={`input ${errors.direccion ? 'border-red-500' : ''}`}
                />
                {errors.direccion && (
                  <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Correo Electronico *</label>
                <input
                  type="text"
                  name="email"
                  placeholder="Ingrese el Correo Electronico"
                  value={formDataPersona.email}
                  onChange={handleChangeFormPerson}
                  className={`input ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="contrasena"
                    placeholder="Ingrese una contraseña"
                    value={formDataPersona.contrasena || ''}
                    onChange={handleChangeFormPerson}
                    className={`input pr-10 ${errors.contrasena ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <KeenIcon icon="eye-slash" /> : <KeenIcon icon="eye" />}
                  </button>
                </div>
                {errors.contrasena && (
                  <p className="text-red-500 text-sm mt-1">{errors.contrasena}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  name="fechaNac"
                  value={formDataPersona.fechaNac}
                  onChange={handleChangeFormPerson}
                  className="input"
                  max={new Date().toISOString().split('T')[0]}
                />

                {errors.fechaNac && <p className="text-red-500 text-sm mt-1">{errors.fechaNac}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Celular *</label>
                <input
                  type="text"
                  name="celular"
                  placeholder="Ingrese el celular"
                  value={formDataPersona.celular}
                  onChange={handleChangeFormPerson}
                  className={`input ${errors.celular ? 'border-red-500' : ''}`}
                />
                {errors.celular && <p className="text-red-500 text-sm mt-1">{errors.celular}</p>}
              </div>
            </div>
          </form>

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

export { ModalUsuarios };

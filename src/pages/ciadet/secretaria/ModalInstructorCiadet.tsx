import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { TipoDocumentoInterface } from '@/pages/contratacion/model/TipoDocumentoInterface';
import { PersonaInterface } from '@/pages/contratacion/model/PersonaInterface';
import { toAbsoluteUrl } from '@/utils';
import { validationFieldPerson } from '@/pages/usuarios/utils/validationFieldPerson';

interface ModalInstructorCiadetProps {
  open: boolean;
  persona?: any; // ActivationCompanyUser o User para editar
  onClose: () => void;
  onSave: () => void;
}

interface FormErrors {
  [key: string]: string;
}

const defaultImage = toAbsoluteUrl('/media/avatars/300-35.png');

const ModalInstructorCiadet: React.FC<ModalInstructorCiadetProps> = ({
  open,
  onClose,
  persona,
  onSave
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [tipoIdentificaciones, setTipoIdentificaciones] = useState<TipoDocumentoInterface[]>([]);
  const [selectedFilePersona, setSelectedFilePersona] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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

  const [previewSrc, setPreviewSrc] = useState<string>(defaultImage);

  useEffect(() => {
    if (open) {
      if (persona) {
        // Extraer objeto persona de la activación o del objeto directo
        const pData = persona.persona || persona.user?.persona || persona;
        const emailVal = persona.email || persona.user?.email || pData.email || '';

        setFormDataPersona({
          id: pData?.id || undefined,
          nombre1: pData?.nombre1 || '',
          apellido1: pData?.apellido1 || '',
          nombre2: pData?.nombre2 || '',
          idTipoIdentificacion: pData?.idTipoIdentificacion || '',
          identificacion: pData?.identificacion || '',
          rh: pData?.rh || '',
          sexo: pData?.sexo || '',
          fechaNac: pData?.fechaNac || '',
          apellido2: pData?.apellido2 || '',
          email: emailVal,
          direccion: pData?.direccion || '',
          celular: pData?.celular || '',
          telefonoFijo: pData?.telefonoFijo || '',
          contrasena: ''
        });

        setSelectedFilePersona(null);
        if (pData?.rutaFotoUrl) {
          setPreviewSrc(pData.rutaFotoUrl);
        } else {
          setPreviewSrc(defaultImage);
        }
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
        setPreviewSrc(defaultImage);
      }

      setErrors({});
    }
  }, [open, persona]);

  useEffect(() => {
    fetchTipoIdentificacion();
  }, []);

  const fetchTipoIdentificacion = async () => {
    try {
      const response = await axios.get('contrato-tipos-identificacion');
      setTipoIdentificaciones(response.data || []);
    } catch (error) {
      console.error('Error al cargar tipos de identificación:', error);
    }
  };

  const handleChangeFormPerson = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isEdit = Boolean(formDataPersona.id);
    const error = validationFieldPerson(name, value, isEdit);

    setFormDataPersona((prevData) => ({
      ...prevData,
      [name]: value
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error || ''
    }));
  };

  const handleFilePersonaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setSelectedFilePersona(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewSrc(reader.result as string);
      };
      reader.readAsDataURL(file);

      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors['rutaFoto'];
        return newErrors;
      });
    }
  };

  const handleFilePersonaDelete = () => {
    setSelectedFilePersona(null);
    setPreviewSrc(defaultImage);
  };

  const handleSave = async () => {
    let validationErrors: FormErrors = {};
    const isEdit = Boolean(formDataPersona.id);

    Object.entries(formDataPersona).forEach(([name, value]) => {
      const error = validationFieldPerson(name, value, isEdit);
      if (error) {
        validationErrors[name] = error;
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      enqueueSnackbar('Por favor corriga los errores en el formulario.', { variant: 'warning' });
      return;
    }

    setErrors({});
    setLoading(true);

    const data = new FormData();
    Object.entries(formDataPersona).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        data.append(key, String(value));
      }
    });

    if (selectedFilePersona instanceof File) {
      data.append('rutaFotoFile', selectedFilePersona);
    }

    try {
      if (formDataPersona.id) {
        // Editar Instructor
        const userId = persona.user?.id || persona.id;
        await axios.post(`update_user/${userId}`, data);

        // Asegurar que el rol asignado sea INSTRUCTOR CIADET
        const activationId = persona.id;
        if (activationId) {
          await axios.put('asignar_roles', {
            idActivation: activationId,
            roles: ['INSTRUCTOR CIADET']
          });
        }

        enqueueSnackbar('Instructor CIADET actualizado con éxito.', { variant: 'success' });
      } else {
        // Crear nuevo Instructor
        const responseUser = await axios.post('usuarios', data);
        const newUser = responseUser.data;

        // Buscar activación asociada al nuevo usuario para asignarle el rol INSTRUCTOR CIADET
        if (newUser && newUser.id) {
          try {
            const listRes = await axios.get('lista_usuarios_paginado', {
              params: { search: formDataPersona.identificacion }
            });
            const createdActivation = (listRes.data?.data || []).find(
              (act: any) => act.user_id === newUser.id || act.user?.id === newUser.id
            );

            if (createdActivation) {
              await axios.put('asignar_roles', {
                idActivation: createdActivation.id,
                roles: ['INSTRUCTOR CIADET']
              });
            }
          } catch (roleErr) {
            console.error('Error al asignar rol INSTRUCTOR CIADET:', roleErr);
          }
        }

        enqueueSnackbar('Instructor CIADET creado y rol asignado con éxito.', {
          variant: 'success'
        });
      }

      onSave();
    } catch (error: any) {
      console.error('Error al guardar instructor:', error);
      enqueueSnackbar('Error al guardar los datos del instructor.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[960px] top-[5%] p-4">
        <ModalHeader className="border-b pb-3">
          <ModalTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
            <i className="ki-outline ki-user-edit text-blue-600 text-2xl" />
            {formDataPersona.id ? 'Editar Instructor CIADET' : 'Nuevo Instructor CIADET'}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-4 px-1 py-4">
          {/* Banner de Rol Bloqueado */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <i className="ki-outline ki-security-user text-xl" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  Rol Automático Asignado
                </p>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  INSTRUCTOR CIADET
                </p>
              </div>
            </div>
            <span className="badge badge-primary badge-outline text-xs px-3 py-1 flex items-center gap-1">
              <i className="ki-outline ki-lock text-xs" /> Rol Fijo CIADET
            </span>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              {/* Formulario Principal */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Tipo Identificación *
                    </label>
                    <select
                      name="idTipoIdentificacion"
                      value={formDataPersona.idTipoIdentificacion}
                      onChange={handleChangeFormPerson}
                      className="input input-sm w-full"
                    >
                      <option value="">Seleccione una Opción</option>
                      {tipoIdentificaciones.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.codigo} {tipo.detalle ? `- ${tipo.detalle}` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.idTipoIdentificacion && (
                      <p className="text-red-500 text-xs mt-1">{errors.idTipoIdentificacion}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Identificación *
                    </label>
                    <input
                      type="text"
                      name="identificacion"
                      placeholder="Número de documento"
                      value={formDataPersona.identificacion}
                      onChange={handleChangeFormPerson}
                      className={`input input-sm w-full ${errors.identificacion ? 'border-red-500' : ''}`}
                    />
                    {errors.identificacion && (
                      <p className="text-red-500 text-xs mt-1">{errors.identificacion}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Primer Nombre *
                    </label>
                    <input
                      type="text"
                      name="nombre1"
                      placeholder="Ingrese primer nombre"
                      value={formDataPersona.nombre1}
                      onChange={handleChangeFormPerson}
                      className={`input input-sm w-full ${errors.nombre1 ? 'border-red-500' : ''}`}
                    />
                    {errors.nombre1 && (
                      <p className="text-red-500 text-xs mt-1">{errors.nombre1}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Segundo Nombre
                    </label>
                    <input
                      type="text"
                      name="nombre2"
                      placeholder="Segundo nombre (opcional)"
                      value={formDataPersona.nombre2}
                      onChange={handleChangeFormPerson}
                      className="input input-sm w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Primer Apellido *
                    </label>
                    <input
                      type="text"
                      name="apellido1"
                      placeholder="Ingrese primer apellido"
                      value={formDataPersona.apellido1}
                      onChange={handleChangeFormPerson}
                      className={`input input-sm w-full ${errors.apellido1 ? 'border-red-500' : ''}`}
                    />
                    {errors.apellido1 && (
                      <p className="text-red-500 text-xs mt-1">{errors.apellido1}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Segundo Apellido
                    </label>
                    <input
                      type="text"
                      name="apellido2"
                      placeholder="Segundo apellido (opcional)"
                      value={formDataPersona.apellido2}
                      onChange={handleChangeFormPerson}
                      className="input input-sm w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Vista Previa de la Foto */}
              <div className="w-full lg:w-44 flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-coal-600 rounded-xl border border-gray-200 dark:border-coal-300">
                <div className="w-36 h-36 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-coal-400 relative group mb-2">
                  <img
                    src={previewSrc}
                    alt="Foto del Instructor"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[11px] text-gray-400 font-medium">Foto Perfil Instructor</p>
              </div>
            </div>

            {/* Fila Secundarios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Sexo *
                </label>
                <select
                  name="sexo"
                  value={formDataPersona.sexo}
                  onChange={handleChangeFormPerson}
                  className="input input-sm w-full"
                >
                  <option value="">Seleccione Sexo</option>
                  <option value="M">MASCULINO</option>
                  <option value="F">FEMENINO</option>
                  <option value="O">OTRO</option>
                </select>
                {errors.sexo && <p className="text-red-500 text-xs mt-1">{errors.sexo}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  RH *
                </label>
                <select
                  name="rh"
                  value={formDataPersona.rh}
                  onChange={handleChangeFormPerson}
                  className="input input-sm w-full"
                >
                  <option value="">Seleccione RH</option>
                  <option value="A+">A POSITIVO</option>
                  <option value="A-">A NEGATIVO</option>
                  <option value="AB+">AB POSITIVO</option>
                  <option value="AB-">AB NEGATIVO</option>
                  <option value="B+">B POSITIVO</option>
                  <option value="B-">B NEGATIVO</option>
                  <option value="O+">O POSITIVO</option>
                  <option value="O-">O NEGATIVO</option>
                </select>
                {errors.rh && <p className="text-red-500 text-xs mt-1">{errors.rh}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Foto de Perfil
                </label>
                {!selectedFilePersona ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFilePersonaChange}
                    className="file-input file-input-sm w-full"
                  />
                ) : (
                  <div className="flex items-center justify-between bg-white dark:bg-coal-600 px-3 py-1.5 rounded-lg border text-xs">
                    <span className="truncate max-w-[150px]">
                      {selectedFilePersona instanceof File
                        ? selectedFilePersona.name
                        : 'Imagen adjunta'}
                    </span>
                    <button
                      type="button"
                      onClick={handleFilePersonaDelete}
                      className="text-red-500 hover:text-red-700 ml-2"
                      title="Eliminar foto"
                    >
                      <KeenIcon icon="trash" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Fila Contacto y Credenciales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="ejemplo@gmail.com"
                  value={formDataPersona.email}
                  onChange={handleChangeFormPerson}
                  className={`input input-sm w-full ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  placeholder="Dirección de residencia"
                  value={formDataPersona.direccion}
                  onChange={handleChangeFormPerson}
                  className={`input input-sm w-full ${errors.direccion ? 'border-red-500' : ''}`}
                />
                {errors.direccion && (
                  <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Contraseña {formDataPersona.id ? '(Opcional)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="contrasena"
                    placeholder="Contraseña de acceso"
                    value={formDataPersona.contrasena || ''}
                    onChange={handleChangeFormPerson}
                    className={`input input-sm w-full pr-9 ${errors.contrasena ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <KeenIcon icon={showPassword ? 'eye-slash' : 'eye'} />
                  </button>
                </div>
                {errors.contrasena && (
                  <p className="text-red-500 text-xs mt-1">{errors.contrasena}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  name="fechaNac"
                  value={formDataPersona.fechaNac}
                  onChange={handleChangeFormPerson}
                  className="input input-sm w-full"
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.fechaNac && <p className="text-red-500 text-xs mt-1">{errors.fechaNac}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Celular *
                </label>
                <input
                  type="text"
                  name="celular"
                  placeholder="Número celular"
                  value={formDataPersona.celular}
                  onChange={handleChangeFormPerson}
                  className={`input input-sm w-full ${errors.celular ? 'border-red-500' : ''}`}
                />
                {errors.celular && <p className="text-red-500 text-xs mt-1">{errors.celular}</p>}
              </div>
            </div>
          </form>

          <div className="flex justify-end gap-3 mt-4 pt-3 border-t">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-2"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <KeenIcon icon="check-circle" />
                  {formDataPersona.id ? 'Guardar Cambios' : 'Crear Instructor CIADET'}
                </>
              )}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalInstructorCiadet;

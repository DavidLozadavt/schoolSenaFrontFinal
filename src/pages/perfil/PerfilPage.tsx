import { useLayout } from '@/providers';
import { Container } from '@/components/container';
import { toAbsoluteUrl } from '@/utils';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { TipoDocumentoInterface } from '../contratacion/model/TipoDocumentoInterface';
import { PersonaInterface } from '../contratacion/model/PersonaInterface';
import { validationFieldPerson } from './utils/validationFieldPerson';

interface FormErrors {
  [key: string]: string;
}

const PerfilPage = () => {
  const authContext = useAuthContext();
  const { persona, getUserAuthenticated } = authContext;

  const { enqueueSnackbar } = useSnackbar();
  const defaultImage = toAbsoluteUrl('/media/avatars/300-35.png');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tipoIdentificaciones, setTipoIdentificacion] = useState<TipoDocumentoInterface[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [selectedFilePersona, setSelectedFilePersona] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>(defaultImage);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [formDataPersona, setFormDataPersona] = useState<PersonaInterface>({
    nombre1: '',
    apellido1: '',
    nombre2: '',
    idtipoIdentificacion: '',
    identificacion: '',
    rh: '',
    sexo: '',
    fechaNac: '',
    idCiudadUbicacion: '',
    departamento: '',
    apellido2: '',
    email: '',
    direccion: '',
    celular: '',
    telefonoFijo: ''
  });

  useEffect(() => {
    if (persona) {
      setFormDataPersona({
        id: persona.id || undefined,
        nombre1: persona.nombre1 || '',
        apellido1: persona.apellido1 || '',
        nombre2: persona.nombre2 || '',
        idtipoIdentificacion: persona.idTipoIdentificacion || '',
        identificacion: persona.identificacion || '',
        rh: persona.rh || '',
        sexo: persona.sexo || '',
        fechaNac: persona.fechaNac || '',
        idCiudadUbicacion: persona.idCiudadUbicacion || '',
        departamento: persona.ciudad_ubicacion?.departamento?.id || '',
        apellido2: persona.apellido2 || '',
        email: persona.email || '',
        direccion: persona.direccion || '',
        celular: persona.celular || '',
        telefonoFijo: persona.telefonoFijo || ''
      });
      setSelectedFilePersona(persona.foto || null);
    } else {
      setFormDataPersona({
        nombre1: '',
        apellido1: '',
        nombre2: '',
        idtipoIdentificacion: '',
        identificacion: '',
        rh: '',
        sexo: '',
        fechaNac: '',
        idCiudadUbicacion: '',
        departamento: '',
        apellido2: '',
        email: '',
        direccion: '',
        celular: '',
        telefonoFijo: ''
      });
      setSelectedFilePersona(null);
    }
    setErrors({});
  }, [persona]);

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

    if (name === 'departamento') {
      fetchCiudades(value);
    }
  };

  useEffect(() => {
    if (persona?.ciudad_ubicacion?.departamento?.id) {
      fetchCiudades(persona.ciudad_ubicacion.departamento.id);
    }
  }, [persona?.ciudad_ubicacion?.departamento?.id]);

  useEffect(() => {
    fetchTipoIdentificacion();
    fetchDepartamentos();
  }, []);

  const fetchDepartamentos = async () => {
    try {
      const response = await axios.get('departamentos');
      setDepartamentos(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCiudades = async (idDepartamento: number) => {
    try {
      const response = await axios.get(`ciudades/departamento/${idDepartamento}`);
      setCiudades(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    if (selectedFilePersona instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewSrc(reader.result as string);
      };
      reader.readAsDataURL(selectedFilePersona);
    } else if (persona?.rutaFotoUrl) {
      setPreviewSrc(persona.rutaFotoUrl);
    } else {
      setPreviewSrc(defaultImage);
    }
  }, [selectedFilePersona, persona]);

  const handleSubmitPropietarios = async () => {
    let validationErrors: Partial<any> = {};

    Object.entries(formDataPersona).forEach(([name, value]) => {
      const error = validationFieldPerson(name, value);
      if (error) {
        validationErrors[name] = error;
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      enqueueSnackbar('Por favor corrija los errores en el formulario', { variant: 'error' });
      return;
    }

    setErrors({});

    const data = new FormData();

    // Agregar todos los campos del formulario
    Object.entries(formDataPersona).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        data.append(key, String(value));
      }
    });

    // Agregar archivo de foto si existe
    if (selectedFilePersona instanceof File) {
      data.append('rutaFotoFile', selectedFilePersona);
    }

    try {
      setSaving(true);
      await axios.post(`update_person`, data);
      await getUserAuthenticated();
      enqueueSnackbar('Datos actualizados con éxito.', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al actualizar los datos.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Elimina el useEffect duplicado
  useEffect(() => {
    fetchTipoIdentificacion();
    fetchDepartamentos();
  }, []);

  return (
    <Container>
      <style>
        {`
            .hero-bg {
              background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-1.png')}');
            }
            .dark .hero-bg {
              background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-1-dark.png')}');
            }
          `}
      </style>

      <div className="bg-center bg-cover bg-no-repeat hero-bg">
        <Container>
          <div className="flex flex-col items-center gap-2 lg:gap-3 py-4 lg:py-5">
            <img
              src={persona?.rutaFotoUrl}
              className="w-[120px] h-[120px] rounded-full border-4 border-success object-cover"
            />

            <div className="flex items-center gap-1.5">
              <div className="text-lg leading-5 font-semibold text-gray-800">
                {persona?.nombre1} {persona?.nombre2} {persona?.apellido1} {persona?.apellido2}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-1 lg:gap-3 text-sm">
              <div className="flex gap-1 items-center">
                <a
                  href={`mailto:${persona?.email}`}
                  target="_blank"
                  className="text-gray-600 hover:text-primary"
                  rel="noreferrer"
                >
                  {persona?.email}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="rounded-xl shadow-lg p-6">
          <form>
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="flex-1 basis-[68%]">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 gap-6 mb-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo Identificación *</label>
                    <select
                      name="idtipoIdentificacion"
                      value={formDataPersona.idtipoIdentificacion}
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
                    {errors.idtipoIdentificacion && (
                      <p className="text-red-500 text-sm mt-1">{errors.idtipoIdentificacion}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Identificación *</label>
                    <input
                      type="text"
                      name="identificacion"
                      placeholder="Ingrese su identificación"
                      value={formDataPersona.identificacion}
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
                      placeholder="Ingrese su primer apellido"
                      value={formDataPersona.apellido1}
                      onChange={handleChangeFormPerson}
                      className="input"
                    />
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
                      disabled
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
                    ref={fileInputRef}
                  />
                ) : (
                  <div className="flex items-center">
                    <p className="text-sm input flex justify-between w-full items-center">
                      {selectedFilePersona.name}
                      <span onClick={handleFilePersonaDelete} className="ml-2 cursor-pointer">
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
                <label className="block text-sm font-medium mb-2">
                  Departamento de Ubicación *
                </label>
                <select
                  name="departamento"
                  value={formDataPersona.departamento}
                  onChange={handleChangeFormPerson}
                  className="input"
                >
                  <option value="">Seleccione un departamento</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento.id} value={departamento.id}>
                      {departamento.descripcion}
                    </option>
                  ))}
                </select>
                {errors.departamento && (
                  <p className="text-red-500 text-sm mt-1">{errors.departamento}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ciudad de Ubicación *</label>
                <select
                  name="idCiudadUbicacion"
                  value={formDataPersona.idCiudadUbicacion}
                  onChange={handleChangeFormPerson}
                  className="input"
                >
                  <option value="">Seleccione una ciudad</option>
                  {ciudades.map((ciudad) => (
                    <option key={ciudad.id} value={ciudad.id}>
                      {ciudad.descripcion}
                    </option>
                  ))}
                </select>
                {errors.idCiudadUbicacion && (
                  <p className="text-red-500 text-sm mt-1">{errors.idCiudadUbicacion}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  name="fechaNac"
                  disabled
                  value={formDataPersona.fechaNac}
                  onChange={handleChangeFormPerson}
                  className="input"
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.fechaNac && <p className="text-red-500 text-sm mt-1">{errors.fechaNac}</p>}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono Fijo</label>
                <input
                  type="text"
                  name="telefonoFijo"
                  placeholder="Ingrese el teléfono "
                  value={formDataPersona.telefonoFijo}
                  onChange={handleChangeFormPerson}
                  className={`input ${errors.telefonoFijo ? 'border-red-500' : ''}`}
                />
              </div>
            </div>
          </form>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                // Resetear a los valores originales de la persona
                if (persona) {
                  setFormDataPersona({
                    id: persona.id || undefined,
                    nombre1: persona.nombre1 || '',
                    apellido1: persona.apellido1 || '',
                    nombre2: persona.nombre2 || '',
                    idtipoIdentificacion: persona.idTipoIdentificacion || '',
                    identificacion: persona.identificacion || '',
                    rh: persona.rh || '',
                    sexo: persona.sexo || '',
                    fechaNac: persona.fechaNac || '',
                    idCiudadUbicacion: persona.idCiudadUbicacion || '',
                    departamento: persona.ciudad_ubicacion?.departamento?.id || '',
                    apellido2: persona.apellido2 || '',
                    email: persona.email || '',
                    direccion: persona.direccion || '',
                    celular: persona.celular || '',
                    telefonoFijo: persona.telefonoFijo || ''
                  });
                  setSelectedFilePersona(persona.foto || null);
                }
                setErrors({});
              }}
              disabled={saving}
            >
              Cancelar
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleSubmitPropietarios}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Todo'}
            </button>
          </div>
        </div>
      </Container>
    </Container>
  );
};

export { PerfilPage };
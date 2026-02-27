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
import { Link } from 'react-router-dom';
import { ResetPasswordModal } from '@/auth/pages/jwt/reset-password/ModalResetPassword/ModalResetPassword';

interface FormErrors {
  [key: string]: string;
}

const PerfilPage = () => {
  const authContext = useAuthContext();
  const { persona, getUserAuthenticated, auth } = authContext;
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

  // Estados para el proceso de 2 pasos
  const [needsPasswordUpdate, setNeedsPasswordUpdate] = useState(false);
  const [step, setStep] = useState(1); // 1: perfil, 2: contraseña
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

  const checkProfileAccess = async () => {
    try {
      const response = await axios.get('profile/access-check', {
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNeedsPasswordUpdate(response.data.needs_password_update);
      
      if (response.data.needs_password_update) {
        setStep(1);
        enqueueSnackbar('Paso 1: Actualice su información personal', { 
          variant: 'info' 
        });
      }
      
    } catch (error) {
      console.error('Error checking profile access:', error);
      // Fallback por roles si el API no funciona
      const roles = authContext.roles || [];
      const needsUpdate = roles.includes('DOCENTEUP') || roles.includes('ESTUDIANTEUP');
      setNeedsPasswordUpdate(needsUpdate);
      
      if (needsUpdate) {
        setStep(1);
        enqueueSnackbar('Paso 1: Actualice su información personal', { 
          variant: 'info' 
        });
      }
    }
  };

  useEffect(() => {
    if (auth) {
      checkProfileAccess();
    }
  }, [auth]);

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


  useEffect(() => {
    if (selectedFilePersona instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewSrc(reader.result as string);
      reader.readAsDataURL(selectedFilePersona);
    } else if (persona?.rutaFotoUrl) {
      setPreviewSrc(persona.rutaFotoUrl);
    } else {
      setPreviewSrc(defaultImage);
    }
  }, [selectedFilePersona, persona]);

  // Manejo de campos del formulario
  const handleChangeFormPerson = (e: any) => {
    const { name, value } = e.target;
    const error = validationFieldPerson(name, value);

    setFormDataPersona((prevData) => ({ ...prevData, [name]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: error || undefined }));

    if (name === 'departamento') fetchCiudades(value);
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

  const handleFilePersonaDelete = () => setSelectedFilePersona(null);


  useEffect(() => {
    fetchTipoIdentificacion();
    fetchDepartamentos();
    
    if (persona?.ciudad_ubicacion?.departamento?.id) {
      fetchCiudades(persona.ciudad_ubicacion.departamento.id);
    }
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

  const handleSubmitPropietarios = async () => {
    let validationErrors: Partial<any> = {};
    Object.entries(formDataPersona).forEach(([name, value]) => {
      const error = validationFieldPerson(name, value);
      if (error) validationErrors[name] = error;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      enqueueSnackbar('Por favor corrija los errores en el formulario', { variant: 'error' });
      return;
    }

    setErrors({});
    const data = new FormData();
    Object.entries(formDataPersona).forEach(([key, value]) => {
      if (value !== undefined && value !== null) data.append(key, String(value));
    });
    if (selectedFilePersona instanceof File) data.append('rutaFotoFile', selectedFilePersona);

    try {
      setSaving(true);
      
      await axios.post(`update_person`, data);
      await getUserAuthenticated();
      
      if (needsPasswordUpdate) {

        setProfileUpdated(true);
        setStep(2);
        enqueueSnackbar('Paso 1 completado. Ahora actualice su contraseña', { variant: 'success' });
        setTimeout(() => {
          setShowPasswordModal(true);
        }, 1000);
      } else {
        enqueueSnackbar('Datos actualizados con éxito.', { variant: 'success' });
      }
      
    } catch (error) {
      enqueueSnackbar('Error al actualizar los datos.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditing = () => {
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
  };


  const handlePasswordChangeSuccess = async () => {
    setShowPasswordModal(false);
    
    try {
      console.log('Verificando estado después de cambiar contraseña...');
      
      // Verificar el estado actual del perfil
      const response = await axios.get('profile/access-check', {
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response del access-check:', response.data);
      
      // Actualizar el estado local
      setNeedsPasswordUpdate(response.data.needs_password_update);
      
      if (!response.data.needs_password_update) {
        enqueueSnackbar('¡Proceso completado! Redirigiendo al inicio de sesión...', { variant: 'success' });
        console.log('Ejecutando logout en 2 segundos...');
        
        setTimeout(() => {
          console.log('Ejecutando logout...');
          authContext.logout();
        }, 2000);
      } else {
        enqueueSnackbar('Contraseña actualizada, pero el proceso no se completó. Contacte al administrador.', { variant: 'warning' });
      }
      
    } catch (error) {
      enqueueSnackbar('Error al verificar el estado de la contraseña.', { variant: 'error' });
      console.error('Error en handlePasswordChangeSuccess:', error);
    }
  };


  const renderStepIndicator = () => {
    if (!needsPasswordUpdate) return null;
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-center">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Perfil</span>
          </div>
          <div className={`w-16 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Contraseña</span>
          </div>
        </div>
      </div>
    );
  };

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

      {/* Header */}
      <div className="bg-center bg-cover bg-no-repeat hero-bg">
        <Container>
          <div className="flex flex-col items-center gap-2 lg:gap-3 py-4 lg:py-5">
            <img
              src={previewSrc}
              className="w-[120px] h-[120px] rounded-full border-4 border-success object-cover"
            />
            <div className="text-lg leading-5 font-semibold text-gray-800">
              {persona?.nombre1} {persona?.nombre2} {persona?.apellido1} {persona?.apellido2}
            </div>
            <div className="flex flex-wrap justify-center gap-1 lg:gap-3 text-sm">
              <a href={`mailto:${persona?.email}`} className="text-gray-600 hover:text-primary">
                {persona?.email}
              </a>
            </div>
          </div>
        </Container>
      </div>

      {/* Indicador de pasos */}
      {renderStepIndicator()}
      
      {/* Alerta si necesita actualizar contraseña */}
      {needsPasswordUpdate && (
        <div className={`p-4 mb-6 border-l-4 ${
          step === 1 ? 'bg-blue-50 border-blue-400' : 'bg-yellow-50 border-yellow-400'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <KeenIcon icon={step === 1 ? "information" : "warning"} className={`h-5 w-5 ${step === 1 ? 'text-blue-400' : 'text-yellow-400'}`} />
            </div>
            <div className="ml-3">
              <p className={`text-sm ${step === 1 ? 'text-blue-700' : 'text-yellow-700'}`}>
                <strong>Proceso de activación en 2 pasos:</strong> 
                {step === 1 && ' Complete su información personal para continuar.'}
                {step === 2 && ' Establezca su nueva contraseña para finalizar.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Perfil */}
      <div className={`rounded-xl shadow-lg p-6 ${step === 2 && profileUpdated ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-lg">
            {step === 1 ? 'Paso 1: Editar Información Personal' : 'Información Personal (Completada)'}
          </h2>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCancelEditing}
              disabled={saving || step === 2}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmitPropietarios}
              disabled={saving || step === 2}
            >
              {saving ? 'Guardando...' : step === 1 ? 'Continuar al Paso 2' : 'Guardado'}
            </button>
          </div>
        </div>

        <form>
          <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 basis-[65%]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo Identificación *</label>
                  <select
                    name="idtipoIdentificacion"
                    value={formDataPersona.idtipoIdentificacion}
                    onChange={handleChangeFormPerson}
                    className="input"
                    disabled={step === 2}
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
                    value={formDataPersona.identificacion}
                    disabled
                    className="input bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Primer Nombre *</label>
                  <input
                    type="text"
                    name="nombre1"
                    placeholder="Ingrese su primer nombre"
                    value={formDataPersona.nombre1}
                    onChange={handleChangeFormPerson}
                    className={`input ${errors.nombre1 ? 'border-red-500' : ''}`}
                    disabled={step === 2}
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
                    disabled={step === 2}
                  />
                  {errors.nombre2 && (
                    <p className="text-red-500 text-sm mt-1">{errors.nombre2}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Primer Apellido *</label>
                  <input
                    type="text"
                    name="apellido1"
                    placeholder="Ingrese su primer apellido"
                    value={formDataPersona.apellido1}
                    onChange={handleChangeFormPerson}
                    className="input"
                    disabled={step === 2}
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
                    className="input"
                    disabled={step === 2}
                  />
                  {errors.apellido2 && (
                    <p className="text-red-500 text-sm mt-1">{errors.apellido2}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="basis-[35%] flex flex-col items-center justify-center gap-4">
              <div className="w-48 h-48 border rounded-lg overflow-hidden shadow">
                <img src={previewSrc} alt="Vista previa" className="w-full h-full object-cover" />
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium mb-2">Foto</label>
                {!selectedFilePersona ? (
                  <input
                    type="file"
                    name="rutaFoto"
                    onChange={handleFilePersonaChange}
                    className="file-input w-full"
                    ref={fileInputRef}
                    disabled={step === 2}
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sexo *</label>
              <select
                name="sexo"
                value={formDataPersona.sexo}
                onChange={handleChangeFormPerson}
                className="input"
                disabled={step === 2}
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
                disabled={step === 2}
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
              <label className="block text-sm font-medium mb-2">Fecha de Nacimiento *</label>
              <input
                type="date"
                name="fechaNac"
                value={formDataPersona.fechaNac}
                onChange={handleChangeFormPerson}
                className="input"
                max={new Date().toISOString().split('T')[0]}
                disabled={step === 2}
              />
              {errors.fechaNac && <p className="text-red-500 text-sm mt-1">{errors.fechaNac}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Departamento de Ubicación *</label>
              <select
                name="departamento"
                value={formDataPersona.departamento}
                onChange={handleChangeFormPerson}
                className="input"
                disabled={step === 2}
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
                disabled={step === 2}
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
              <label className="block text-sm font-medium mb-2">Dirección *</label>
              <input
                type="text"
                name="direccion"
                placeholder="Ingrese la dirección"
                value={formDataPersona.direccion}
                onChange={handleChangeFormPerson}
                className={`input ${errors.direccion ? 'border-red-500' : ''}`}
                disabled={step === 2}
              />
              {errors.direccion && (
                <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Correo Electrónico *</label>
              <input
                type="text"
                name="email"
                placeholder="Ingrese el Correo Electrónico"
                value={formDataPersona.email}
                onChange={handleChangeFormPerson}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                disabled={step === 2}
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
                disabled={step === 2}
              />
              {errors.celular && <p className="text-red-500 text-sm mt-1">{errors.celular}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Teléfono Fijo</label>
              <input
                type="text"
                name="telefonoFijo"
                placeholder="Ingrese el teléfono"
                value={formDataPersona.telefonoFijo}
                onChange={handleChangeFormPerson}
                className={`input ${errors.telefonoFijo ? 'border-red-500' : ''}`}
                disabled={step === 2}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Sección de Seguridad - Solo en paso 2 */}
      {needsPasswordUpdate && step === 2 && (
        <div className="rounded-xl shadow-lg p-6 mt-6 bg-yellow-50">
          <h2 className="font-semibold text-lg mb-4 text-yellow-800">
            <KeenIcon icon="lock" className="mr-2" />
            Paso 2: Establecer Contraseña
          </h2>
          <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <KeenIcon icon="key" className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Último paso:</strong> Establezca su contraseña para completar el proceso de activación.
                </p>
              </div>
            </div>
          </div>
          <button
            className="btn btn-warning w-full"
            onClick={() => setShowPasswordModal(true)}
          >
            <KeenIcon icon="key" className="mr-2" />
            Establecer Contraseña (Finalizar)
          </button>
        </div>
      )}

      {/* Modal de Cambio de Contraseña */}
      <ResetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userEmail={persona?.email || ''}
        onSuccess={handlePasswordChangeSuccess}
      />
    </Container>
  );
};

export { PerfilPage };
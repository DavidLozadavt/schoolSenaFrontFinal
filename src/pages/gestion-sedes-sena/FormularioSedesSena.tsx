import axios from 'axios';
import { useFormik } from 'formik';
import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import Select from 'react-select';
import ModalError from './ModalError';

interface Props {
  idSede?: string;
  setIdSede: (idSede: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (message: string) => void;
  mode?: 'create' | 'edit';
}

interface Persona {
  nombre1: string;
  apellido1: string;
  identificacion: string;
}

interface Responsable {
  id: number;
  persona: Persona;
}

interface Ciudades {
  id: number;
  descripcion: string;
}

interface Empresa {
  id: number;
  razonSocial: string;
}

interface CentroFormacion {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: {
    descripcion: string;
  };
}

interface FormValues {
  nombre: string;
  jefeInmediato: string;
  descripcion: string;
  ciudad: { value: number; label: string } | null;
  empresa: { value: number; label: string } | null;
  centroFormacion: { value: number; label: string } | null;
  direccion: string;
  email: string;
  telefono: string;
  celular: string;
  responsable: { value: number; label: string } | null;
  urlImagen: File | null;
}

const validationSchema = Yup.object({
  nombre: Yup.string()
    .trim()
    .min(3, 'Debe tener al menos 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .required('El nombre es obligatorio'),

  ciudad: Yup.object().nullable().required('La ciudad es obligatoria'),

  responsable: Yup.object().nullable(),

  empresa: Yup.object().nullable().required('La regional es obligatoria'),

  centroFormacion: Yup.object().nullable().required('El centro de formación es obligatorio'),

  jefeInmediato: Yup.string()
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Solo letras'),

  direccion: Yup.string()
    .trim()
    .min(5, 'Dirección muy corta'),

  descripcion: Yup.string()
    .max(250, 'Máximo 250 caracteres')
    .nullable(),

  email: Yup.string().email('Correo inválido'),

  telefono: Yup.string()
    .matches(/^[0-9]+$/, 'Solo números')
    .min(7, 'Debe tener al menos 7 dígitos')
    .max(10, 'Máximo 10 dígitos'),

  celular: Yup.string()
    .matches(/^[0-9]+$/, 'Solo números')
    .length(10, 'Debe tener 10 dígitos'),

  urlImagen: Yup.mixed<File>()
    .nullable()
    .test('fileType', 'Solo se permiten imágenes PNG o JPG', (value?: File | null) => {
      if (!value) return true;
      return ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(value.type);
    })
    .test('fileSize', 'La imagen debe pesar menos de 2MB', (value?: File | null) => {
      if (!value) return true;
      return value.size <= 2 * 1024 * 1024;
    })
});

const FormularioSedesSena: React.FC<Props> = ({
  idSede,
  setIdSede,
  isModalOpen,
  setIsModalOpen,
  setEvento,
  showToast,
  mode = 'create'
}) => {
  const [ciudades, setCiudades] = useState<Ciudades[]>([]);
  const [regionales, setRegionales] = useState<Empresa[]>([]);
  const [centrosFormacion, setCentrosFormacion] = useState<CentroFormacion[]>([]);
  const [responsable, setResponsable] = useState<Responsable[]>([]);
  const [imagenActual, setImagenActual] = useState<string | null>(null);

  // Manejar el error
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar datos iniciales (ciudades, regionales, usuarios)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ciudadesRes, regionalesRes, usuariosRes] = await Promise.all([
          axios.get('ciudades'),
          axios.get('regional'),
          axios.get('sedesSena/users')
        ]);
        setCiudades(ciudadesRes.data);
        setRegionales(regionalesRes.data);
        setResponsable(usuariosRes.data);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    loadData();
  }, []);

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      nombre: '',
      jefeInmediato: '',
      descripcion: '',
      ciudad: null,
      empresa: null,
      centroFormacion: null,
      direccion: '',
      email: '',
      telefono: '',
      celular: '',
      responsable: null,
      urlImagen: null
    },

    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const formData = new FormData();

        // En modo crear, todos los campos son obligatorios
        if (mode === 'create') {
          formData.append('nombre', values.nombre);
          formData.append('jefeInmediato', values.jefeInmediato);
          formData.append('descripcion', values.descripcion);
          formData.append('direccion', values.direccion);
          formData.append('email', values.email);
          formData.append('telefono', values.telefono);
          formData.append('celular', values.celular);

          if (values.ciudad) {
            formData.append('idCiudad', String(values.ciudad.value));
          }

          if (values.responsable) {
            formData.append('idResponsable', String(values.responsable.value));
          }

          if (values.empresa) {
            formData.append('idEmpresa', String(values.empresa.value));
          }

          if (values.centroFormacion) {
            formData.append('idCentroFormacion', String(values.centroFormacion.value));
          }

          if (values.urlImagen) {
            formData.append('urlImagen', values.urlImagen);
          }
        } else {
          // En modo editar, solo enviar campos modificados
          if (values.nombre) formData.append('nombre', values.nombre);
          if (values.jefeInmediato) formData.append('jefeInmediato', values.jefeInmediato);
          if (values.descripcion) formData.append('descripcion', values.descripcion);
          if (values.direccion) formData.append('direccion', values.direccion);
          if (values.email) formData.append('email', values.email);
          if (values.telefono) formData.append('telefono', values.telefono);
          if (values.celular) formData.append('celular', values.celular);

          if (values.ciudad) {
            formData.append('idCiudad', String(values.ciudad.value));
          }

          if (values.responsable) {
            formData.append('idResponsable', String(values.responsable.value));
          }

          if (values.empresa) {
            formData.append('idEmpresa', String(values.empresa.value));
          }

          if (values.centroFormacion) {
            formData.append('idCentroFormacion', String(values.centroFormacion.value));
          }

          if (values.urlImagen) {
            formData.append('urlImagen', values.urlImagen);
          }
        }

        let response;
        if (mode === 'create') {
          response = await axios.post('sedesSena', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          formData.append('_method', 'PATCH');
          response = await axios.post(`sedesSena/${idSede}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }

        showToast(
          mode === 'create' ? 'Sede creada correctamente' : 'Sede actualizada correctamente'
        );

        setTimeout(() => {
          setEvento((prev) => !prev);
          resetForm();
          setIsModalOpen(false);
          setIdSede('');
          setImagenActual(null);
        }, 1000);
      } catch (error: any) {
        console.log(error)
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleUppercase = (field: string, value: string) => {
    formik.setFieldValue(field, value.toUpperCase());
  };

  // Cargar datos de la sede en modo edición
  useEffect(() => {
    if (mode === 'edit' && idSede) {
      const loadSede = async () => {
        try {
          const res = await axios.get(`sedesSena/${idSede}`);
          const data = res.data.data;

          // Cargar centros de formación de la regional
          if (data.idEmpresa) {
            const centrosRes = await axios.get(`centrosFormacion/regional/${data.idEmpresa}`);
            setCentrosFormacion(centrosRes.data.data);
          }

          // Mapear los datos a la estructura del formulario
          formik.setValues({
            nombre: data.nombre || '',
            jefeInmediato: data.jefeInmediato || '',
            descripcion: data.descripcion || '',
            ciudad: data.idCiudad
              ? {
                  value: data.idCiudad,
                  label: data.ciudad?.descripcion || ''
                }
              : null,
            empresa: data.idEmpresa
              ? {
                  value: data.idEmpresa,
                  label: data.empresa?.razonSocial || ''
                }
              : null,
            centroFormacion: data.idCentroFormacion
              ? {
                  value: data.idCentroFormacion,
                  label: data.centro_formacion?.nombre || ''
                }
              : null,
            direccion: data.direccion || '',
            email: data.email || '',
            telefono: data.telefono || '',
            celular: data.celular || '',
            responsable: data.idResponsable
              ? {
                  value: data.idResponsable,
                  label: data.responsable
                    ? `${data.responsable.persona?.nombre1} ${data.responsable.persona?.apellido1}`
                    : ''
                }
              : null,
            urlImagen: null
          });

          setImagenActual(data.rutaFotoUrl);
        } catch (error) {
          console.error('Error al cargar la sede:', error);
          setErrorMessage('Error al cargar la sede');
          setErrorOpen(true);
        }
      };

      loadSede();
    } else {
      // Resetear en modo crear
      formik.resetForm();
      setImagenActual(null);
      setCentrosFormacion([]);
    }
  }, [idSede, mode]);

  // Cargar centros de formación cuando se selecciona una regional
  const handleChangeRegional = async (value: { value: number; label: string } | null) => {
    formik.setFieldValue('empresa', value);
    formik.setFieldValue('centroFormacion', null);
    setCentrosFormacion([]);

    if (!value) return;

    try {
      const res = await axios.get(`centrosFormacion/regional/${value.value}`);
      setCentrosFormacion(res.data.data);
    } catch (error) {
      console.error('Error cargando centros de formación:', error);
      setCentrosFormacion([]);
    }
  };

  const optionsCiudades = ciudades.map((val) => ({
    value: val.id,
    label: val.descripcion
  }));

  const optionsRegionales = regionales.map((val) => ({
    value: val.id,
    label: val.razonSocial
  }));

  const optionsCentrosFormacion = centrosFormacion.map((val) => ({
    value: val.id,
    label: `${val.nombre} - ${val?.ciudad?.descripcion || ''}`
  }));

  const optionsResponsables = responsable
    .filter((val) => val.persona !== null)
    .map((val) => ({
      value: val.id,
      label: `${val.persona!.nombre1} ${val.persona!.apellido1} - ${val.persona!.identificacion}`
    }));

  if (!isModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl dark:border-coal-100 bg-white dark:bg-coal-400  shadow-xl">
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(false);
              setIdSede('');
              formik.resetForm();
              setImagenActual(null);
            }}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>

          {/* Header fijo */}
          <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">
            {mode === 'edit' ? 'Editar sede' : 'Crear sede'}
          </h2>

          {/* Form con scroll */}
          <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ciudad */}
              <div>
                <label className="text-sm font-medium text-gray-700">Ciudad</label>
                <Select
                  options={optionsCiudades}
                  placeholder="Selecciona la ciudad..."
                  isClearable
                  value={formik.values.ciudad}
                  onChange={(value) => formik.setFieldValue('ciudad', value)}
                  onBlur={() => formik.setFieldTouched('ciudad', true)}
                  classNamePrefix="react-select"
                  classNames={{
                    control: () =>
                      `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                    singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                    placeholder: () => 'text-gray-400 dark:text-gray-300',
                    input: () => 'text-gray-900 dark:text-gray-100',
                    menu: () => 'bg-white dark:bg-coal-500',
                    option: ({ isFocused, isSelected }) =>
                      `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                    indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                    dropdownIndicator: () =>
                      'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                    clearIndicator: () =>
                      'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                  }}
                />
                {formik.touched.ciudad && formik.errors.ciudad && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.ciudad}</p>
                )}
              </div>

              {/* Regional */}
              <div>
                <label className="text-sm font-medium text-gray-700">Regional</label>
                <Select
                  options={optionsRegionales}
                  placeholder="Selecciona la regional..."
                  isClearable
                  value={formik.values.empresa}
                  onChange={handleChangeRegional}
                  onBlur={() => formik.setFieldTouched('empresa', true)}
                  classNames={{
                    control: () =>
                      `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                    singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                    placeholder: () => 'text-gray-400 dark:text-gray-300',
                    input: () => 'text-gray-900 dark:text-gray-100',
                    menu: () => 'bg-white dark:bg-coal-500',
                    option: ({ isFocused, isSelected }) =>
                      `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                    indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                    dropdownIndicator: () =>
                      'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                    clearIndicator: () =>
                      'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                  }}
                />
                {formik.touched.empresa && formik.errors.empresa && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.empresa}</p>
                )}
              </div>

              {/* Centro de Formación */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Centro de Formación</label>
                <Select
                  options={optionsCentrosFormacion}
                  placeholder={
                    !formik.values.empresa
                      ? 'Primero selecciona una regional...'
                      : centrosFormacion.length === 0
                        ? 'No hay centros de formación disponibles'
                        : 'Selecciona el centro de formación...'
                  }
                  isClearable
                  isDisabled={!formik.values.empresa || centrosFormacion.length === 0}
                  value={formik.values.centroFormacion}
                  onChange={(value) => formik.setFieldValue('centroFormacion', value)}
                  onBlur={() => formik.setFieldTouched('centroFormacion', true)}
                  classNamePrefix="react-select"
                  classNames={{
                    control: () =>
                      `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                    singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                    placeholder: () => 'text-gray-400 dark:text-gray-300',
                    input: () => 'text-gray-900 dark:text-gray-100',
                    menu: () => 'bg-white dark:bg-coal-500',
                    option: ({ isFocused, isSelected }) =>
                      `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                    indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                    dropdownIndicator: () =>
                      'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                    clearIndicator: () =>
                      'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                  }}
                />
                {formik.touched.centroFormacion && formik.errors.centroFormacion && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.centroFormacion}</p>
                )}
              </div>

              {/* Responsable de la Sede */}
              <div>
                <label className="text-sm font-medium text-gray-700">Responsable de la sede</label>
                <Select
                  options={optionsResponsables}
                  placeholder="Selecciona el responsable..."
                  isClearable
                  value={formik.values.responsable}
                  onChange={(value) => formik.setFieldValue('responsable', value)}
                  onBlur={() => formik.setFieldTouched('responsable', true)}
                  classNames={{
                    control: () =>
                      `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                    singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                    placeholder: () => 'text-gray-400 dark:text-gray-300',
                    input: () => 'text-gray-900 dark:text-gray-100',
                    menu: () => 'bg-white dark:bg-coal-500',
                    option: ({ isFocused, isSelected }) =>
                      `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                    indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                    dropdownIndicator: () =>
                      'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                    clearIndicator: () =>
                      'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                  }}
                />
                {formik.touched.responsable && formik.errors.responsable && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.responsable}</p>
                )}
              </div>

              {/* Nombre ocupa 2 columnas */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nombre de la sede</label>
                <input
                  {...formik.getFieldProps('nombre')}
                  type="text"
                  onChange={(e) => handleUppercase('nombre', e.target.value)}
                  onBlur={formik.handleBlur}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none dark:border-coal-100 bg-white dark:bg-coal-400
                  ${
                    formik.touched.nombre && formik.errors.nombre
                      ? 'border-red-500'
                      : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
                />
                {formik.touched.nombre && formik.errors.nombre && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.nombre}</p>
                )}
              </div>

              {/* Jefe inmediato */}
              <div>
                <label className="text-sm font-medium text-gray-700">Jefe inmediato</label>
                <input
                  type="text"
                  {...formik.getFieldProps('jefeInmediato')}
                  onChange={(e) => handleUppercase('jefeInmediato', e.target.value)}
                  onBlur={formik.handleBlur}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
                />
                {formik.touched.jefeInmediato && formik.errors.jefeInmediato && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.jefeInmediato}</p>
                )}
              </div>

              {/* Dirección */}
              <div>
                <label className="text-sm font-medium text-gray-700">Dirección</label>
                <input
                  type="text"
                  {...formik.getFieldProps('direccion')}
                  onChange={(e) => handleUppercase('direccion', e.target.value)}
                  onBlur={formik.handleBlur}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
                />
                {formik.touched.direccion && formik.errors.direccion && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.direccion}</p>
                )}
              </div>

              {/* Descripcion */}
              <div>
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <input
                  type="text"
                  {...formik.getFieldProps('descripcion')}
                  onChange={(e) => handleUppercase('descripcion', e.target.value)}
                  onBlur={formik.handleBlur}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
                />
                {formik.touched.descripcion && formik.errors.descripcion && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.descripcion}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-700">Correo</label>
                <input
                  type="email"
                  {...formik.getFieldProps('email')}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="text"
                  {...formik.getFieldProps('telefono')}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
                />
                {formik.touched.telefono && formik.errors.telefono && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.telefono}</p>
                )}
              </div>

              {/* Celular */}
              <div>
                <label className="text-sm font-medium text-gray-700">Celular</label>
                <input
                  type="text"
                  {...formik.getFieldProps('celular')}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
                />
                {formik.touched.celular && formik.errors.celular && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.celular}</p>
                )}
              </div>

              {/* Preview imagen nueva */}
              {formik.values.urlImagen && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Vista previa</p>
                  <img
                    src={URL.createObjectURL(formik.values.urlImagen)}
                    alt="Preview"
                    className="h-20 rounded-lg border object-contain"
                  />
                </div>
              )}

              {/* Imagen */}
              <div className="md:col-span-2">
                <p className="text-xs font-bold mb-2 text-gray-800">
                  Imagen de la sede <span className="text-gray-500">(PNG, JPG, WEBP)</span>
                </p>

                <label
                  htmlFor="urlImagen"
                  className="
                  flex items-center justify-between gap-4
                  w-full px-4 py-3
                  border-2 border-dashed rounded-xl
                  cursor-pointer
                  transition
                  hover:border-blue-500
                  focus-within:border-blue-500
                "
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">
                      {formik.values.urlImagen
                        ? formik.values.urlImagen.name
                        : 'Seleccionar imagen'}
                    </span>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white">
                    Examinar
                  </span>

                  <input
                    id="urlImagen"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] || null;
                      formik.setFieldValue('urlImagen', file);
                    }}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-gray-500 mt-1">
                  Solo imágenes PNG, JPG o WEBP · Máx 2MB
                </p>

                {formik.touched.urlImagen && formik.errors.urlImagen && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.urlImagen}</p>
                )}
              </div>

              {/* Imagen actual */}
              {imagenActual && !formik.values.urlImagen && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Imagen actual</p>
                  <img
                    src={`${imagenActual}`}
                    alt="Imagen actual"
                    className="h-20 rounded-lg border object-contain"
                  />
                </div>
              )}
            </div>

            {/* Footer fijo */}
            <div className="flex justify-end gap-2 mt-6 border-t pt-4">
              <button
                type="button"
                onClick={() => {
                  formik.resetForm();
                  setIsModalOpen(false);
                  setIdSede('');
                  setImagenActual(null);
                }}
                className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm
                hover:bg-blue-700 transition disabled:opacity-50"
              >
                {formik.isSubmitting
                  ? mode === 'create'
                    ? 'Creando...'
                    : 'Actualizando...'
                  : mode === 'create'
                    ? 'Crear'
                    : 'Actualizar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ModalError isOpen={errorOpen} message={errorMessage} onClose={() => setErrorOpen(false)} />
    </>
  );
};

export default FormularioSedesSena;

import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import ModalError from '../gestion-sedes-sena/ModalError';

interface Props {
  idCentroFormacion?: string;
  setIdCentroFormacion: (idCentroFormacion: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (message: string) => void;
  mode?: 'create' | 'edit';
}

interface Ciudades {
  id: number;
  descripcion: string;
  iddepartamento: number;
  departamento: {
    descripcion: string;
  };
}

interface Empresa {
  id: number;
  razonSocial: string;
  idCiudad: number;
  ciudad: {
    iddepartamento: number;
  };
}

interface FormValues {
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  subdirector: string;
  correoSubdirector: string;
  idCiudad: number | null;
  idEmpresa: number | null;
  foto: File | null;
}

const validationSchema = Yup.object({
  nombre: Yup.string().required('El nombre es obligatorio'),
  direccion: Yup.string().required('La dirección es obligatoria'),
  telefono: Yup.string().required('El teléfono es obligatorio'),
  correo: Yup.string().email('Correo inválido').required('El correo es obligatorio'),
  subdirector: Yup.string().required('El nombre del subdirector es obligatorio'),
  correoSubdirector: Yup.string()
    .email('Correo inválido')
    .required('El correo del subdirector es obligatorio'),
  idCiudad: Yup.number().nullable().required('Seleccione una ciudad'),
  idEmpresa: Yup.number().nullable().required('Seleccione una Regional'),
  foto: Yup.mixed<File>()
    .nullable()
    .test('fileType', 'Solo se permiten imágenes PNG o JPG', (value?: File | null) => {
      if (!value) return true;
      return ['image/png', 'image/jpeg', 'image/jpg'].includes(value.type);
    })
    .test('fileSize', 'La imagen debe pesar menos de 2MB', (value?: File | null) => {
      if (!value) return true;
      return value.size <= 2 * 1024 * 1024;
    })
});

const FormularioCentrosFormacion: React.FC<Props> = ({
  idCentroFormacion,
  setIdCentroFormacion,
  isModalOpen,
  setIsModalOpen,
  setEvento,
  showToast,
  mode = 'create'
}) => {
  const [fotoActual, setFotoActual] = useState<string | null>(null);
  const [ciudades, setCiudades] = useState<Ciudades[]>([]);
  const [regionales, setRegionales] = useState<Empresa[]>([]);
  const [handleError, setHandleError] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string>('');

  const formik = useFormik<FormValues>({
    initialValues: {
      nombre: '',
      direccion: '',
      telefono: '',
      correo: '',
      subdirector: '',
      correoSubdirector: '',
      idCiudad: null,
      idEmpresa: null,
      foto: null
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formData = new FormData();
        formData.append('nombre', values.nombre);
        formData.append('direccion', values.direccion);
        formData.append('telefono', values.telefono);
        formData.append('correo', values.correo);
        formData.append('subdirector', values.subdirector);
        formData.append('correoSubdirector', values.correoSubdirector);

        if (values.idCiudad !== null) {
          formData.append('idCiudad', String(values.idCiudad));
        }

        if (values.idEmpresa !== null) {
          formData.append('idEmpresa', String(values.idEmpresa));
        }

        if (values.foto) {
          formData.append('foto', values.foto);
        }

        if (mode === 'create') {
          await axios.post('centrosFormacion/user', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          showToast('Centro de formación creado correctamente');
        } else {
          formData.append('_method', 'PATCH');
          await axios.post(`centrosFormacion/${idCentroFormacion}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          showToast('Centro de formación actualizado correctamente');
        }

        setIsModalOpen(false);
        setEvento((prev) => !prev);
        formik.resetForm();
        setFotoActual(null);
      } catch (error: any) {
        console.error('Error:', error);
        setMessageError(`No se pudo crear la regional: ${values.nombre}`);
        setHandleError(true);
      } finally {
        setSubmitting(false);
      }
    }
  });

  // Cargar ciudades y regionales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ciudadesRes, regionalesRes] = await Promise.all([
          axios.get('ciudades'),
          axios.get('regional')
        ]);
        setCiudades(ciudadesRes.data);
        setRegionales(regionalesRes.data);
      } catch (error) {}
    };

    loadData();
  }, []);

  // Cargar datos en modo edición
  useEffect(() => {
    const loadCentroFormacion = async () => {
      if (mode === 'edit' && idCentroFormacion) {
        try {
          const res = await axios.get(`centrosFormacion/${idCentroFormacion}`);
          const data = res.data.data;

          formik.setValues({
            nombre: data.nombre ?? '',
            direccion: data.direccion ?? '',
            telefono: data.telefono ?? '',
            correo: data.correo ?? '',
            subdirector: data.subdirector ?? '',
            correoSubdirector: data.correoSubdirector ?? '',
            idCiudad: data.idCiudad ?? data.ciudad?.id ?? null,
            idEmpresa: data.idEmpresa ?? data.empresa?.id ?? null,
            foto: null
          });
          setFotoActual(data.rutaFotoUrl);
        } catch (error) {
          console.error('Error cargando centro:', error);
          showToast('Error al cargar el centro de formación');
        }
      } else if (mode === 'create') {
        formik.resetForm();
        setFotoActual(null);
      }
    };

    if (isModalOpen) {
      loadCentroFormacion();
    }
  }, [idCentroFormacion, mode, isModalOpen]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isModalOpen) {
      formik.resetForm();
      setFotoActual(null);
    }
  }, [isModalOpen]);

  const selectedRegional = regionales.find((r) => r.id === formik.values.idEmpresa);
  const regionalDepartamentoId = selectedRegional?.ciudad?.iddepartamento;

  const filteredCiudades = regionalDepartamentoId
    ? ciudades.filter((c) => c.iddepartamento === regionalDepartamentoId)
    : [];

  const options = filteredCiudades.map((val) => ({
    value: val.id,
    label: `${val.descripcion} - ${val.departamento.descripcion}`
  }));

  const options2 = regionales.map((val) => ({
    value: val.id,
    label: val.razonSocial
  }));

  const handleUppercase = (field: string, value: string) => {
    formik.setFieldValue(field, value.toUpperCase());
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl dark:border-coal-100 bg-white dark:bg-coal-400  shadow-xl">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={() => {
            setIsModalOpen(false);
            setIdCentroFormacion('');
            formik.resetForm();
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">
          {mode === 'create' ? 'Crear centro de formación' : 'Editar Centro de formación'}
        </h2>

        <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Regional */}
            <div>
              <label className="text-sm font-medium text-gray-700">Regional *</label>
              <Select
                options={options2}
                placeholder="Selecciona la Regional..."
                isClearable
                value={options2.find((option) => option.value === formik.values.idEmpresa) || null}
                onChange={(option) => {
                  formik.setFieldValue('idEmpresa', option ? option.value : null);
                  formik.setFieldValue('idCiudad', null); // Reset city when regional changes
                  formik.setFieldTouched('idEmpresa', true);
                }}
                onBlur={() => formik.setFieldTouched('idEmpresa', true)}
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
              {formik.touched.idEmpresa && formik.errors.idEmpresa && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.idEmpresa}</p>
              )}
            </div>

            {/* Ciudad */}
            <div>
              <label className="text-sm font-medium text-gray-700">Ciudad *</label>
              <Select
                options={options}
                placeholder={formik.values.idEmpresa ? "Selecciona la ciudad..." : "Selecciona primero una Regional"}
                isClearable
                isDisabled={!formik.values.idEmpresa}
                value={options.find((option) => option.value === formik.values.idCiudad) || null}
                onChange={(option) => {
                  formik.setFieldValue('idCiudad', option ? option.value : null);
                  formik.setFieldTouched('idCiudad', true);
                }}
                onBlur={() => formik.setFieldTouched('idCiudad', true)}
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
              {formik.touched.idCiudad && formik.errors.idCiudad && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.idCiudad}</p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre *</label>
              <input
                type="text"
                {...formik.getFieldProps('nombre')}
                onChange={(e) => handleUppercase('nombre', e.target.value)}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
              />
              {formik.touched.nombre && formik.errors.nombre && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.nombre}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección *</label>
              <input
                type="text"
                {...formik.getFieldProps('direccion')}
                onChange={(e) => handleUppercase('direccion', e.target.value)}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
              />
              {formik.touched.direccion && formik.errors.direccion && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.direccion}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-sm font-medium text-gray-700">Teléfono *</label>
              <input
                type="text"
                {...formik.getFieldProps('telefono')}
                onChange={(e) => handleUppercase('telefono', e.target.value)}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
              />
              {formik.touched.telefono && formik.errors.telefono && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.telefono}</p>
              )}
            </div>

            {/* Correo */}
            <div>
              <label className="text-sm font-medium text-gray-700">Correo *</label>
              <input
                type="email"
                {...formik.getFieldProps('correo')}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
              />
              {formik.touched.correo && formik.errors.correo && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.correo}</p>
              )}
            </div>

            {/* Subdirector */}
            <div>
              <label className="text-sm font-medium text-gray-700">Subdirector *</label>
              <input
                type="text"
                {...formik.getFieldProps('subdirector')}
                onChange={(e) => handleUppercase('subdirector', e.target.value)}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
              />
              {formik.touched.subdirector && formik.errors.subdirector && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.subdirector}</p>
              )}
            </div>

            {/* CorreoSubdirector */}
            <div>
              <label className="text-sm font-medium text-gray-700">Correo del subdirector *</label>
              <input
                type="email"
                {...formik.getFieldProps('correoSubdirector')}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
              />
              {formik.touched.correoSubdirector && formik.errors.correoSubdirector && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.correoSubdirector}</p>
              )}
            </div>

            {/** Imagen */}
            <div className="md:col-span-2 mt-4">
              <p className="text-xs font-bold mb-2 text-gray-800">
                Logo o imagen <span className="text-gray-500">(PNG, JPG)</span>
              </p>

              <label
                htmlFor="foto"
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
                    {formik.values.foto ? formik.values.foto.name : 'Seleccionar imagen'}
                  </span>
                </div>

                <span className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white">
                  Examinar
                </span>

                <input
                  id="foto"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0] || null;
                    formik.setFieldValue('foto', file);
                  }}
                  className="hidden"
                />
              </label>

              <p className="text-xs text-gray-500 mt-1">Solo imágenes PNG o JPG · Máx 2MB</p>

              {formik.touched.foto && formik.errors.foto && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.foto}</p>
              )}
            </div>

            {/* Preview de imagen nueva */}
            {formik.values.foto && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Vista previa</p>
                <img
                  src={URL.createObjectURL(formik.values.foto)}
                  alt="Preview"
                  className="h-32 rounded-lg border object-contain"
                />
              </div>
            )}

            {/* Imagen actual en modo edición */}
            {fotoActual && !formik.values.foto && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Imagen actual</p>
                <img
                  src={`${fotoActual}`}
                  alt="Logo actual"
                  className="h-32 rounded-lg border object-contain"
                />
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 mt-6 border-t pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                formik.resetForm();
                setFotoActual(null);
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
      <ModalError
        isOpen={handleError}
        message={messageError}
        onClose={() => {
          setHandleError(false);
          setMessageError('');
        }}
      />
    </div>
  );
};

export default FormularioCentrosFormacion;

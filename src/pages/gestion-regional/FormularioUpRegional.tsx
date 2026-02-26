import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Select from 'react-select';
import Toast from '../programas-academicos/components/Toast';
interface Props {
  idRegional?: string;
  setIdRegional: (idRegional: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
  mode?: 'create' | 'edit';
}

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Ciudades {
  id: number;
  descripcion: string;
}
interface FormValues {
  razonSocial: string;
  nit: string;
  representanteLegal: string;
  direccion: string;
  email: string;
  digitoVerificacion: number;
  idCiudad: number;
  rutaLogo: File | null;
}

const validationSchema = Yup.object({
  razonSocial: Yup.string(),
  nit: Yup.string(),
  representanteLegal: Yup.string(),
  direccion: Yup.string(),
  email: Yup.string().email('Email inválido'),
  digitoVerificacion: Yup.number()
    .typeError('Debe ser un número')
    .min(1, 'Debe ser entre 1 y 9')
    .max(9, 'Debe ser entre 1 y 9')
    .required('El dígito de verificación es obligatorio'),
  idCiudad: Yup.number()
    .typeError('Debe seleccionar una ciudad')
    .required('La ciudad es obligatoria'),
  rutaLogo: Yup.mixed<File>()
    .nullable()
    .test('fileType', 'Solo se permiten imágenes PNG o JPG', (value?: File | null) => {
      if (!value) return true;
      return ['image/png', 'image/jpeg'].includes(value.type);
    })
    .test('fileSize', 'La imagen debe pesar menos de 2MB', (value?: File | null) => {
      if (!value) return true;
      return value.size <= 2 * 1024 * 1024;
    })
});

const FormularioUpRegional: React.FC<Props> = ({
  idRegional,
  setIdRegional,
  isModalOpen,
  setIsModalOpen,
  setEvento,
  mode = 'create'
}) => {
  const [logoActual, setLogoActual] = useState<string | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '' });

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      razonSocial: '',
      nit: '',
      representanteLegal: '',
      direccion: '',
      email: '',
      digitoVerificacion: 0,
      idCiudad: null as any,
      rutaLogo: null
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formData = new FormData();

        // Agregar campos según el modo
        if (mode === 'create') {
          // En crear, todos los campos son obligatorios
          formData.append('razonSocial', values.razonSocial);
          formData.append('nit', values.nit);
          formData.append('representanteLegal', values.representanteLegal);
          formData.append('direccion', values.direccion);
          formData.append('email', values.email);
          formData.append('digitoVerificacion', values.digitoVerificacion.toString());
          formData.append('idCiudad', values.idCiudad.toString());
        } else {
          // En editar, solo enviar campos modificados
          if (values.razonSocial) formData.append('razonSocial', values.razonSocial);
          if (values.nit) formData.append('nit', values.nit);
          if (values.representanteLegal)
            formData.append('representanteLegal', values.representanteLegal);
          if (values.direccion) formData.append('direccion', values.direccion);
          if (values.email) formData.append('email', values.email);
          if (values.digitoVerificacion)
            formData.append('digitoVerificacion', values.digitoVerificacion.toString());
          if (values.idCiudad) formData.append('idCiudad', values.idCiudad.toString());
        }

        // Agregar el archivo de imagen si existe
        if (values.rutaLogo) {
          formData.append('rutaLogo', values.rutaLogo);
        }

        let response;
        if (mode === 'create') {
          // Crear nueva regional
          response = await axios.post('regional', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          // Actualizar regional existente
          formData.append('_method', 'PATCH');
          response = await axios.post(`regional/${idRegional}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        }
        // Mostrar toast de éxito
        setToast({
          isOpen: true,
          message:
            mode === 'create'
              ? 'Regional creada correctamente'
              : 'Regional actualizada correctamente'
        });

        // Cerrar modal después de un breve delay
        setTimeout(() => {
          setIsModalOpen(false);
          setIdRegional('');
          formik.resetForm();
          setEvento((prev) => !prev);
        }, 1000);

        setEvento((prev) => !prev);
      } catch (error: any) {
        alert(
          error.response?.data?.message ||
            `Error al ${mode === 'create' ? 'crear' : 'actualizar'} la regional`
        );
      } finally {
        setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    // Solo cargar datos si es modo edición y hay ID
    if (mode === 'edit' && idRegional) {
      const loadRegional = async () => {
        try {
          const res = await axios.get(`regional/${idRegional}`);
          formik.setValues({
            ...res.data.data,
            rutaLogo: null
          });
          setLogoActual(res.data.data.rutaLogoUrl);
        } catch (error) {
          alert('Error al cargar la regional');
        }
      };
      loadRegional();
    } else {
      // Resetear el formulario si es modo crear
      formik.resetForm();
      setLogoActual(null);
    }
  }, [idRegional, mode]);

  const [ciudades, setCiudades] = useState<Ciudades[]>([]);
  useEffect(() => {
    const loadData = async () => {
      const res = await axios.get('ciudades');
      setCiudades(res.data);
    };
    loadData();
  }, []);

  const options = ciudades.map((val) => ({
    value: val.id,
    label: val.descripcion
  }));

  const handleUppercase = (field: string, value: string) => {
    formik.setFieldValue(field, value.toUpperCase());
  };

  if (!isModalOpen) return null;
  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className=" relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl dark:border-coal-100 bg-white dark:bg-coal-400  shadow-xl">
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(false);
              setIdRegional('');
              formik.resetForm();
            }}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>

          <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">
            {mode === 'edit' ? 'Editar Regional' : 'Crear Regional'}
          </h2>

          <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]" >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ciudad */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Ciudad</label>
                <Select
                  options={options}
                  isClearable
                  placeholder="Seleccione una ciudad"
                  value={options.find((option) => option.value === formik.values.idCiudad) || null}
                  onChange={(option) => {
                    formik.setFieldValue('idCiudad', option ? option.value : null);
                  }}
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
              </div>
              {/* Razón Social */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Razón Social</label>
                <input
                  type="text"
                  {...formik.getFieldProps('razonSocial')}
                  onChange={(e) => handleUppercase('razonSocial', e.target.value)}
                  onBlur={formik.handleBlur}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
                />
              </div>
              {/* NIT */}
              <div>
                <label className="text-sm font-medium text-gray-700">NIT</label>
                <input
                  type="text"
                  {...formik.getFieldProps('nit')}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none dark:border-coal-100 bg-white dark:bg-coal-400 
                  ${
                    formik.touched.nit && formik.errors.nit
                      ? 'border-red-500'
                      : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
                  placeholder="890123456"
                />
                {formik.touched.nit && formik.errors.nit && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.nit}</p>
                )}
              </div>

              {/* Dígito de Verificación */}
              <div>
                <label className="text-sm font-medium text-gray-700">Dígito Verificación</label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  {...formik.getFieldProps('digitoVerificacion')}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none dark:border-coal-100 bg-white dark:bg-coal-400 
                  ${
                    formik.touched.digitoVerificacion && formik.errors.digitoVerificacion
                      ? 'border-red-500'
                      : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
                  placeholder="1-9"
                />
                {formik.touched.digitoVerificacion && formik.errors.digitoVerificacion && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.digitoVerificacion}</p>
                )}
              </div>

              {/* Representante Legal */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Director General</label>
                <input
                  type="text"
                  {...formik.getFieldProps('representanteLegal')}
                  onChange={(e) => handleUppercase('representanteLegal', e.target.value)}
                  onBlur={formik.handleBlur}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
                />
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Dirección</label>
                <input
                  type="text"
                  {...formik.getFieldProps('direccion')}
                  onChange={(e) => handleUppercase('direccion', e.target.value)}
                  onBlur={formik.handleBlur}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
                />
              </div>

              {formik.values.rutaLogo && (
                <img
                  src={URL.createObjectURL(formik.values.rutaLogo)}
                  alt="Preview"
                  className="h-20 rounded-lg border object-contain mt-3"
                />
              )}

              {/** Imagen */}
              <div className="md:col-span-2 mt-4">
                <p className="text-xs font-bold mb-2 text-gray-800">
                  Logo o imagen <span className="text-gray-500">(PNG, JPG)</span>
                </p>

                <label
                  htmlFor="rutaLogo"
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
                      {formik.values.rutaLogo ? formik.values.rutaLogo.name : 'Seleccionar imagen'}
                    </span>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white">
                    Examinar
                  </span>

                  <input
                    id="rutaLogo"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] || null;
                      formik.setFieldValue('rutaLogo', file);
                    }}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-gray-500 mt-1">Solo imágenes PNG o JPG · Máx 2MB</p>

                {formik.touched.rutaLogo && formik.errors.rutaLogo && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.rutaLogo}</p>
                )}
              </div>
              {logoActual && !formik.values.rutaLogo && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Imagen actual</p>
                  <img
                    src={`${logoActual}`}
                    alt="Logo actual"
                    className="h-20 rounded-lg border object-contain"
                  />
                </div>
              )}

              {/* Email */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...formik.getFieldProps('email')}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
                />
              </div>
            </div>
            {/* Footer fijo */}
            <div className="flex justify-end gap-2 mt-6 border-t pt-4">
              <button
                type="button"
                onClick={() => {
                  formik.resetForm();
                  setIsModalOpen(false);
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
      {/* Toast de éxito */}
      <Toast
        message={toast.message}
        isOpen={toast.isOpen}
        onClose={() => setToast({ isOpen: false, message: '' })}
      />
    </div>
  );
};

export default FormularioUpRegional;

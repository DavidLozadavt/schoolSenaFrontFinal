import axios from 'axios';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import Select from 'react-select';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
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
}

const validationSchema = Yup.object({
  razonSocial: Yup.string().required('La razón social es obligatoria'),
  nit: Yup.string().required('El NIT es obligatorio'),
  representanteLegal: Yup.string().required('El director general es obligatorio'),
  direccion: Yup.string().required('La dirección es obligatoria'),
  email: Yup.string().email('Email inválido').required('El email es obligatorio'),
  digitoVerificacion: Yup.number()
    .typeError('Debe ser un número')
    .min(1, 'Debe ser entre 1 y 9')
    .max(9, 'Debe ser entre 1 y 9')
    .required('El dígito de verificación es obligatorio'),
  idCiudad: Yup.number()
    .typeError('Debe seleccionar una ciudad')
    .required('La ciudad es obligatoria')
});

const FormularioRegional: React.FC<Props> = ({ isModalOpen, setIsModalOpen, setEvento }) => {
  const [ciudades, setCiudades] = useState<Ciudades[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const formik = useFormik<FormValues>({
    initialValues: {
      razonSocial: '',
      nit: '',
      representanteLegal: '',
      direccion: '',
      email: '',
      digitoVerificacion: 0,
      idCiudad: null as any
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await axios.post('regional', values);

        // Mostrar animación de éxito
        setShowSuccess(true);

        // Esperar a que se vea la animación antes de cerrar
        setTimeout(() => {
          setIsModalOpen(false);
          setEvento((prev) => !prev);
          setShowSuccess(false);
        }, 1500);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al guardar la regional');
      } finally {
        setSubmitting(false);
      }
    }
  });

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

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header fijo */}
        <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">Crear Regional</h2>

        {/* Form con scroll */}
        <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ciudad - Ocupa 2 columnas */}
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
                noOptionsMessage={() => 'No se encontraron ciudades'}
                classNamePrefix="react-select"
              />
              {formik.touched.idCiudad && formik.errors.idCiudad && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.idCiudad}</p>
              )}
            </div>

            {/* Razón Social - Ocupa 2 columnas */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Razón Social</label>
              <input
                type="text"
                {...formik.getFieldProps('razonSocial')}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none
                  ${
                    formik.touched.razonSocial && formik.errors.razonSocial
                      ? 'border-red-500'
                      : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
                placeholder="Ej: Regional SENA Valle"
              />
              {formik.touched.razonSocial && formik.errors.razonSocial && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.razonSocial}</p>
              )}
            </div>

            {/* NIT */}
            <div>
              <label className="text-sm font-medium text-gray-700">NIT</label>
              <input
                type="text"
                {...formik.getFieldProps('nit')}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none
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
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none
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

            {/* Director General - Ocupa 2 columnas */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Director General</label>
              <input
                type="text"
                {...formik.getFieldProps('representanteLegal')}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none
                  ${
                    formik.touched.representanteLegal && formik.errors.representanteLegal
                      ? 'border-red-500'
                      : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
                placeholder="Ej: Juan Pérez García"
              />
              {formik.touched.representanteLegal && formik.errors.representanteLegal && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.representanteLegal}</p>
              )}
            </div>

            {/* Dirección - Ocupa 2 columnas */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Dirección</label>
              <input
                type="text"
                {...formik.getFieldProps('direccion')}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none
                  ${
                    formik.touched.direccion && formik.errors.direccion
                      ? 'border-red-500'
                      : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
                placeholder="Ej: Calle 10 # 5-20"
              />
              {formik.touched.direccion && formik.errors.direccion && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.direccion}</p>
              )}
            </div>

            {/* Email - Ocupa 2 columnas */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...formik.getFieldProps('email')}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none
                  ${
                    formik.touched.email && formik.errors.email
                      ? 'border-red-500'
                      : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
                placeholder="regional@sena.edu.co"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
              )}
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
              {formik.isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioRegional;

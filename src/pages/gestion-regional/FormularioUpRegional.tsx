import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Select from 'react-select';

interface Props {
  idRegional: string;
  setIdRegional: (idRegional: string) => void;
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
    .required('La ciudad es obligatoria')
});

const FormularioUpRegional: React.FC<Props> = ({
  idRegional,
  setIdRegional,
  isModalOpen,
  setIsModalOpen,
  setEvento
}) => {
  const formik = useFormik<FormValues>({
    enableReinitialize: true,
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
        // Enviar solo campos modificados
        const payload = Object.fromEntries(
          Object.entries(values).filter(([_, value]) => value !== '' && value !== 0)
        );

        await axios.patch(`regional/${idRegional}`, payload);

        alert('Regional actualizada correctamente');
        setEvento((prev) => !prev);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al actualizar la regional');
      } finally {
        setSubmitting(false);
        setIsModalOpen(false);
        setIdRegional('');
      }
    }
  });

  useEffect(() => {
    if (!idRegional) return;

    const loadRegional = async () => {
      try {
        const res = await axios.get(`regional/${idRegional}`);
        formik.setValues(res.data.data);
      } catch (error) {
        alert('Error al cargar la regional');
      }
    };

    loadRegional();
  }, [idRegional]);

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

  if (!isModalOpen) return null;
  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 relative">
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

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar regional</h2>

          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
            {/* Ciudad */}

            <div>
              <label className="text-sm font-medium text-gray-700">Ciudad</label>
              <Select
                options={options}
                isClearable
                placeholder="Seleccione una ciudad"
                value={options.find((option) => option.value === formik.values.idCiudad) || null}
                onChange={(option) => {
                  formik.setFieldValue('idCiudad', option ? option.value : null);
                }}
              />
            </div>
            {/* Razón Social */}
            <div>
              <label className="text-sm font-medium text-gray-700">Razón Social</label>
              <input
                type="text"
                {...formik.getFieldProps('razonSocial')}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            {/* Representante Legal */}
            <div>
              <label className="text-sm font-medium text-gray-700">Director General</label>
              <input
                type="text"
                {...formik.getFieldProps('representanteLegal')}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección</label>
              <input
                type="text"
                {...formik.getFieldProps('direccion')}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...formik.getFieldProps('email')}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            {/* Dígito de Verificación */}
            <div>
              <label className="text-sm font-medium text-gray-700">Dígito Verificación</label>
              <input
                type="number"
                {...formik.getFieldProps('digitoVerificacion')}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {formik.touched.digitoVerificacion && formik.errors.digitoVerificacion && (
                <p className="text-xs text-red-500">{formik.errors.digitoVerificacion}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className={`px-4 py-2 rounded-lg text-sm text-white transition
              ${formik.isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {formik.isSubmitting ? 'Actualizando...' : 'Actualizar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioUpRegional;

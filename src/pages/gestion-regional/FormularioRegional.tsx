import axios from 'axios';
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
}

interface Departamentos {
  id: number;
  codigo: string;
  descripcion: string;
}

interface FormValues {
  departamento: { value: number; label: string } | null;
  nombre: string;
  telefono: string;
  direccion: string;
}

const validationSchema = Yup.object({
  departamento: Yup.object().nullable().required('Seleccione un departamento'),
  nombre: Yup.string().required('El nombre es obligatorio'),
  telefono: Yup.string().required('El teléfono es obligatorio'),
  direccion: Yup.string().required('La dirección es obligatoria')
});

const FormularioRegional: React.FC<Props> = ({ isModalOpen, setIsModalOpen }) => {
  const [departamentos, setDepartamentos] = useState<Departamentos[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const res = await axios.get('departamentos');
      setDepartamentos(res.data);
    };
    loadData();
  }, []);

  const options = departamentos.map((val) => ({
    value: val.id,
    label: val.descripcion
  }));

  const formik = useFormik<FormValues>({
    initialValues: {
      departamento: null,
      nombre: '',
      telefono: '',
      direccion: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const res = await axios.post('regional', {
          ...values,
          idDepartamento: values.departamento?.value
        });
      } catch (error: any) {
        alert('La regional ya existe');
      } finally {
        setIsModalOpen(false);
      }
    }
  });

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Crear regional</h2>

        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          {/* Departamento */}
          <div>
            <label className="text-sm font-medium text-gray-700">Departamento</label>
            <Select
              options={options}
              placeholder="Selecciona el departamento..."
              isClearable
              value={formik.values.departamento}
              onChange={(value) => formik.setFieldValue('departamento', value)}
            />
            {formik.touched.departamento && formik.errors.departamento && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.departamento}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              {...formik.getFieldProps('nombre')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {formik.touched.nombre && formik.errors.nombre && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.nombre}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="text"
              {...formik.getFieldProps('telefono')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {formik.touched.telefono && formik.errors.telefono && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.telefono}</p>
            )}
          </div>

          {/* Dirección */}
          <div>
            <label className="text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              {...formik.getFieldProps('direccion')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {formik.touched.direccion && formik.errors.direccion && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.direccion}</p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm
                hover:bg-blue-700 transition"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioRegional;

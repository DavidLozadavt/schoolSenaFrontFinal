import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (message:string) => void;
}

interface Ciudades {
  id: number;
  descripcion: string;
}

interface Empresa {
  id: number;
  razonSocial: string;
}
interface FormValues {
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  subdirector: string;
  correosubdirector: string;
  ciudad: { value: number; label: string } | null;
  empresa: { value: number; label: string } | null;
}

const validationSchema = Yup.object({
  nombre: Yup.string().required('El nombre es obligatorio'),
  direccion: Yup.string().required('La dirección es obligatoria'),
  telefono: Yup.string().required('El teléfono es obligatorio'),
  correo: Yup.string().required('El correo es obligatorio'),
  subdirector: Yup.string().required('El nombre del subdirector obligatorio'),
  correosubdirector: Yup.string().required('El correo del subdirector es obligatorio'),
  ciudad: Yup.object().nullable().required('Seleccione una ciudad'),
  empresa: Yup.object().nullable().required('Seleccione una Regional'),
});

const FormularioCentrosFormacion: React.FC<Props> = ({
  isModalOpen,
  setIsModalOpen,
  setEvento,
  showToast
}) => {
  const [ciudades, setCiudades] = useState<Ciudades[]>([]);
  const [regionales, setRegionales] = useState<Empresa[]>([]);

  useEffect(() => {
  const loadData = async () => {
    try {
      const [ciudadesRes, regionalesRes] = await Promise.all([
        axios.get('ciudades'),
        axios.get('regional'),
      ]);
      setCiudades(ciudadesRes.data);
      setRegionales(regionalesRes.data);
    } catch (error) {
    }
  };

  loadData();
}, []);


  const options = ciudades.map((val) => ({
    value: val.id,
    label: val.descripcion
  }));
  const options2 = regionales.map((val) => ({
    value: val.id,
    label: val.razonSocial
  }));

  const formik = useFormik<FormValues>({
    initialValues: {
      nombre: '',
      direccion: '',
      telefono: '',
      correo: '',
      subdirector: '',
      correosubdirector: '',
      ciudad: null,
      empresa: null,
    },
    validationSchema,
    onSubmit: async (values, {setSubmitting}) => {
      console.log(values)
      try {
        await axios.post('centrosFormacion/user', {
          ...values,
          idCiudad: values.ciudad?.value,
          idEmpresa: values.empresa?.value
        });
        showToast('Centro de formación creado correctamente');
        setIsModalOpen(false);
        setEvento((prev) => !prev);
      } catch (error: any) {
        alert('Error al registrar');
      } finally {
        setSubmitting(false);
        setIsModalOpen(false);
      }
    }
  });
  if (!isModalOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Crear centro de formación</h2>

        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          {/* Ciudad */}
          <div>
            <label className="text-sm font-medium text-gray-700">Ciudad</label>
            <Select
              options={options}
              placeholder="Selecciona el ciudad..."
              isClearable
              value={formik.values.ciudad}
              onChange={(value) => formik.setFieldValue('ciudad', value)}
            />
            {formik.touched.ciudad && formik.errors.ciudad && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.ciudad}</p>
            )}
          </div>

          {/* Regional */}
          <div>
            <label className="text-sm font-medium text-gray-700">Regional</label>
            <Select
              options={options2}
              placeholder="Selecciona la Regional..."
              isClearable
              value={formik.values.empresa}
              onChange={(value) => formik.setFieldValue('empresa', value)}
            />
            {formik.touched.empresa && formik.errors.empresa && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.empresa}</p>
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
          {/* Correo */}
          <div>
            <label className="text-sm font-medium text-gray-700">Correo</label>
            <input
              type="text"
              {...formik.getFieldProps('correo')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {formik.touched.correo && formik.errors.correo && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.correo}</p>
            )}
          </div>
          {/* Subdirector */}
          <div>
            <label className="text-sm font-medium text-gray-700">Subdirector</label>
            <input
              type="text"
              {...formik.getFieldProps('subdirector')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {formik.touched.subdirector && formik.errors.subdirector && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.subdirector}</p>
            )}
          </div>
          {/* CorreoSubdirector */}
          <div>
            <label className="text-sm font-medium text-gray-700">correo del subdirector</label>
            <input
              type="text"
              {...formik.getFieldProps('correosubdirector')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {formik.touched.correosubdirector && formik.errors.correosubdirector && (
              <p className="text-xs text-red-500 mt-1">{formik.errors.correosubdirector}</p>
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

export default FormularioCentrosFormacion;

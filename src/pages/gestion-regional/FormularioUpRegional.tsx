import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

interface Props {
  idRegional: string;
  setIdRegional: (idRegional: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}

interface FormValues {
  nombre: string;
  telefono: string;
  direccion: string;
}

const validationSchema = Yup.object({
  nombre: Yup.string(),
  telefono: Yup.string(),
  direccion: Yup.string()
});

const FormularioUpRegional: React.FC<Props> = ({
  idRegional,
  setIdRegional,
  isModalOpen,
  setIsModalOpen,
  setEvento
}) => {
  const formik = useFormik<FormValues>({
    initialValues: {
      nombre: '',
      telefono: '',
      direccion: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = Object.fromEntries(
          Object.entries(values).filter(([_, value]) => value !== '')
        );

        await axios.patch(`regional/${idRegional}`, payload);
        alert('Actualizado');
        setEvento(prev =>!prev);
      } catch (error) {
        alert('Error al actualizar la regional');
      } finally {
        setIsModalOpen(false);
        setIdRegional('');
      }
    }
  });

  if (!isModalOpen) return null;
  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar regional</h2>

          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
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
                Actualizar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioUpRegional;

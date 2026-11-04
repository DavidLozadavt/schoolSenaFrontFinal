import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import ModalError from '../gestion-sedes-sena/ModalError';
import Toast from '../programas-academicos/components/Toast';

interface Props {
  isModalOpen: boolean;
  setReloadTipos: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: (isModalOpen: boolean) => void;
  mode?: 'create' | 'edit';
}

interface FormValues {
  nombre: string;
}

const validationSchema = Yup.object({
  nombre: Yup.string().required('El nombre es obligatorio')
});

const FormularioTipoInfraestructura: React.FC<Props> = ({
  isModalOpen,
  setReloadTipos,
  setIsModalOpen,
  mode = 'create'
}) => {
  const [handleError, setHandleError] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string>('');

  const [handleSuccess, setHandleSuccess] = useState<boolean>(false);
  const [messageSuccess, setMessageSuccess] = useState<string>('');

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      nombre: ''
    },

    validationSchema,

    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = {
          nombre: values.nombre
        };

        if (mode === 'create') {
          await axios.post('tiposInfraestructuras', payload);

          setReloadTipos((prev) => !prev);

          setHandleSuccess(true);
          setMessageSuccess('Creado correctamente');

          setTimeout(() => {
            resetForm();
            setIsModalOpen(false);
            setHandleSuccess(false);
          }, 700);
        }
      } catch (error) {
        setHandleError(true);
        setMessageError('No se pudo crear, revisa si el tipo ya existe.');
      } finally {
        setSubmitting(false);
      }
    }
  });
  const handleUppercase = (field: string, value: string) => {
    formik.setFieldValue(field, value.toUpperCase());
  };
  if (!isModalOpen) return null;
  return (
    <div className="fixed inset-0 z-85 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl dark:border-coal-100 bg-white dark:bg-coal-400  shadow-xl">
        {/* Botón cerrar */}
        <button
          onClick={() => {
            setIsModalOpen(false);
            formik.resetForm();
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">
          {mode === 'create' ? 'Crear tipo de ambiente' : 'Editar'}
        </h2>
        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              <input
                {...formik.getFieldProps('nombre')}
                onChange={(e) => handleUppercase('nombre', e.target.value)}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
              />
              {formik.touched.nombre && formik.errors.nombre && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.nombre}</p>
              )}
            </div>
          </div>
          {/* Footer */}
          <div className="flex justify-end gap-2 mt-6 border-t pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
              {formik.isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
      <Toast
        isOpen={handleSuccess}
        message={messageSuccess}
        onClose={() => setHandleSuccess(false)}
      />
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

export default FormularioTipoInfraestructura;

import { KeenIcon } from '@/components';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import React, { useState } from 'react';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Toast from '../programas-academicos/components/Toast';
import ModalError from '../gestion-sedes-sena/ModalError';

interface Red {
  id: number;
  nombre: string;
  descripcion: string | null;
  foto: string;
  fotoUrl: string | null;
}

interface ModalProps {
  open: boolean;
  red?: Red;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onSave?: () => void; // 🔥 solo notifica
  mode?: 'create' | 'edit';
}

interface FormValues {
  nombre: string;
  descripcion: string;
  foto: File | null;
}
const validationSchema = Yup.object({
  nombre: Yup.string()
    .trim()
    .min(3, 'Debe tener al menos 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .required('El nombre es obligatorio'),
  descripcion: Yup.string()
    .trim()
    .min(3, 'Debe tener al menos 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .nullable(),
  foto: Yup.mixed<File>()
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

const FormularioRedes: React.FC<ModalProps> = ({
  open,
  red,
  onClose,
  onSave,
  setEvento,
  mode = 'create'
}) => {
  const handleClose = () => {
    onClose();
  };

  const [handleError, setHandleError] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string>('');
  const [handleSuccess, setHandleSuccess] = useState<boolean>(false);
  const [messageSuccess, setMessageSuccess] = useState<string>('');

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      nombre: red?.nombre || '',
      descripcion: red?.descripcion || '',
      foto: null
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const formData = new FormData();
        formData.append('nombre', values.nombre);
        formData.append('descripcion', values.descripcion ?? '');

        if (values.foto) {
          formData.append('foto', values.foto);
        }

        if (mode === 'create') {
          await axios.post('red', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setMessageSuccess('Red creada correctamente');
        } else {
          formData.append('_method', 'PUT');

          await axios.post(`red/${red?.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setMessageSuccess('Red actualizada correctamente');
        }

        setHandleSuccess(true);

        setTimeout(() => {
          resetForm();
          setHandleSuccess(false);
          onClose();
          setEvento((prev) => !prev);
        }, 1200);
      } catch (error) {
        setHandleError(true);
        setMessageError('No se pudo cargar el archivo, intenta nuevamente.');
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleUppercase = (field: string, value: string) => {
    formik.setFieldValue(field, value.toUpperCase());
  };
  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[640px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{mode === 'edit' ? 'Editar red' : 'Crear red'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={handleClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <form onSubmit={formik.handleSubmit}>
          <ModalBody className="grid gap-5 px-0 py-5">
            <div className="w-[calc(100%-2rem)] mx-auto mt-4">
              {/* Nombre ocupa 2 columnas */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nombre de la red</label>
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
              {/* Descripcion ocupa 2 columnas */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Descripcion de la red</label>
                <input
                  {...formik.getFieldProps('descripcion')}
                  type="text"
                  onChange={(e) => handleUppercase('descripcion', e.target.value)}
                  onBlur={formik.handleBlur}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none dark:border-coal-100 bg-white dark:bg-coal-400
                  ${
                    formik.touched.descripcion && formik.errors.descripcion
                      ? 'border-red-500'
                      : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
                />
                {formik.touched.descripcion && formik.errors.descripcion && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.descripcion}</p>
                )}
              </div>
              {/* Upload de foto */}
              <div className="w-[calc(100%-2rem)] mx-auto mt-4">
                <p className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Seleccionar imagen
                  <span className="text-gray-500 dark:text-gray-400 font-normal">
                    (JPG, PNG o WEBP)
                  </span>
                </p>

                <label
                  htmlFor="foto"
                  className={`
                              flex items-center justify-between gap-4
                              w-full px-4 py-3
                              border-2 border-dashed rounded-xl
                              cursor-pointer
                              transition-all
                              ${
                                formik.touched.foto && formik.errors.foto
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                                  : 'border-gray-300 dark:border-coal-100 hover:border-blue-500 dark:hover:border-blue-400'
                              }
                              ${formik.values.foto ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-400' : ''}
                            `}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{formik.values.foto ? '🌄' : '🖼️'}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {formik.values.foto ? formik.values.foto.name : 'seleccionar imagen'}
                    </span>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0">
                    Examinar
                  </span>

                  <input
                    id="foto"
                    name="foto"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] || null;
                      formik.setFieldValue('foto', file);
                      formik.setFieldTouched('foto', true);
                    }}
                    onBlur={formik.handleBlur}
                    className="hidden"
                  />
                </label>

                {/* Info del foto */}
                {formik.values.foto && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Tamaño:</strong> {(formik.values.foto.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                {/* Hint */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Solo imágenes JPG, PNG o WEBP · Máximo 2MB
                </p>

                {/* Error de validación */}
                {formik.touched.foto && formik.errors.foto && (
                  <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <KeenIcon icon="information-2" className="text-sm" />
                    {formik.errors.foto}
                  </p>
                )}
              </div>
            </div>
            {/* Botones */}
            <div className="flex justify-end gap-3 mt-4 px-4">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClose}
                disabled={formik.isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? 'Cargando...' : 'Guardar'}
              </button>
            </div>
          </ModalBody>
        </form>
        {/* Toast de éxito */}
        <Toast
          isOpen={handleSuccess}
          message={messageSuccess}
          onClose={() => setHandleSuccess(false)}
        />

        {/* Modal de error */}
        <ModalError
          isOpen={handleError}
          message={messageError}
          onClose={() => {
            setHandleError(false);
            setMessageError('');
          }}
        />
      </ModalContent>
    </Modal>
  );
};

export default FormularioRedes;

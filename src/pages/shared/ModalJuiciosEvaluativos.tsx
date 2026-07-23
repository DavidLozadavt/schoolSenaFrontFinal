import { KeenIcon, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components';
import { Modal } from '@mui/material';
import React, { useState } from 'react';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import Toast from '@/pages/programas-academicos/components/Toast';
import ModalError from '@/pages/gestion-sedes-sena/ModalError';
import axios from 'axios';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  idFicha: number | undefined;
  idPrograma: string | undefined;
  idSede: number | undefined;
  idGrado: number | undefined;
}

interface FormValues {
  archivo: File | null;
}

const validationSchema = Yup.object({
  archivo: Yup.mixed()
    .required('El archivo es obligatorio')
    .test('fileType', 'Solo se permiten archivos XLS o XLSX', (value) => {
      if (!value) return false;
      if (!(value instanceof File)) return false;
      const validTypes = [
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
      ];
      return validTypes.includes(value.type);
    })
    .test('fileSize', 'El archivo no puede superar los 5MB', (value) => {
      if (!value) return true;
      return value instanceof File && value.size <= 5 * 1024 * 1024;
    })
});

const ModalJuiciosEvaluativos: React.FC<ModalProps> = ({
  open,
  onClose,
  onSave,
  idFicha,
  idPrograma,
  idSede,
  idGrado
}) => {
  const [handleError, setHandleError] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string>('');
  const [handleSuccess, setHandleSuccess] = useState<boolean>(false);
  const [messageSuccess, setMessageSuccess] = useState<string>('');

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      archivo: null
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (!values.archivo) {
          setHandleError(true);
          setMessageError('Debe seleccionar un archivo');
          return;
        }

        const formData = new FormData();
        formData.append('archivo', values.archivo);
        formData.append('idFicha', String(idFicha));
        if (idPrograma) {
          formData.append('idPrograma', idPrograma);
        }
        if (idSede) {
          formData.append('idSede', String(idSede));
        }
        formData.append('idGrado', String(idGrado));

        await axios.post('raps', formData);

        setHandleSuccess(true);
        setMessageSuccess('Archivo cargado correctamente');

        setTimeout(() => {
          resetForm();
          setHandleSuccess(false);
          onClose();
          onSave();
        }, 700);
      } catch (error: any) {
        setHandleError(true);
        setMessageError(
          error?.response?.data?.error || 'No se pudo cargar el archivo, intenta nuevamente.'
        );
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleClose = () => {
    formik.resetForm();
    setHandleError(false);
    setHandleSuccess(false);
    onClose();
  };

  if (idFicha === 0) return null;
  if (!idFicha) return null;
  if (!idPrograma) return null;
  if (!idSede) return null;
  if (!idGrado) return null;

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Cargar Juicios Evaluativos</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={handleClose}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <form onSubmit={formik.handleSubmit}>
          <ModalBody className="grid gap-3 px-0 py-5">
            {/* Upload de archivo */}
            <div className="w-[calc(100%-2rem)] mx-auto mt-4">
              <p className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
                Archivo Excel de juicios evaluativos{' '}
                <span className="text-gray-500 dark:text-gray-400 font-normal">(XLS o XLSX)</span>
              </p>

              <label
                htmlFor="archivo"
                className={`
                  flex items-center justify-between gap-4
                  w-full px-4 py-3
                  border-2 border-dashed rounded-xl
                  cursor-pointer
                  transition-all
                  ${
                    formik.touched.archivo && formik.errors.archivo
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                      : 'border-gray-300 dark:border-coal-100 hover:border-blue-500 dark:hover:border-blue-400'
                  }
                  ${formik.values.archivo ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-400' : ''}
                `}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{formik.values.archivo ? '📊' : '📄'}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {formik.values.archivo
                      ? formik.values.archivo.name
                      : 'Seleccionar archivo Excel'}
                  </span>
                </div>

                <span className="text-xs px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0">
                  Examinar
                </span>

                <input
                  id="archivo"
                  name="archivo"
                  type="file"
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0] || null;
                    formik.setFieldValue('archivo', file);
                    formik.setFieldTouched('archivo', true);
                  }}
                  onBlur={formik.handleBlur}
                  className="hidden"
                />
              </label>

              {/* Info del archivo */}
              {formik.values.archivo && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Tamaño:</strong> {(formik.values.archivo.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              {/* Hint */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Solo archivos XLS o XLSX · Máximo 5MB
              </p>

              {/* Error de validación */}
              {formik.touched.archivo && formik.errors.archivo && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <KeenIcon icon="information-2" className="text-sm" />
                  {formik.errors.archivo}
                </p>
              )}
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
                disabled={formik.isSubmitting || !formik.values.archivo}
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

export default ModalJuiciosEvaluativos;

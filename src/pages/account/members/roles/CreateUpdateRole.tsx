import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import axios from 'axios';

import { useSnackbar } from 'notistack';
import { RoleModel } from './models/_Role';

interface ModalProps {
  data?: any;
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const roleSchema = Yup.object().shape({
  roleName: Yup.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .required('El nombre del rol es requerido'),
  valor: Yup.number()
    .typeError('Debe ser un número')
    .positive('Debe ser mayor que 0')
    .required('El salario es requerido')
});

const initialValues = {
  roleName: '',
  valor: ''
};

const CreateUpdateRole = ({ open, onClose, data, onSave }: ModalProps) => {
  console.log(data);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const tieneSalario = !!data?.salario;

  const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);

  const formik = useFormik({
    initialValues: data
      ? {
          roleName: data.name || '',
          valor: tieneSalario ? formatCOP(data.salario.valor) : ''
        }
      : initialValues,
    validationSchema: Yup.object().shape({
      roleName: Yup.string()
        .min(3, 'Mínimo 3 caracteres')
        .max(40, 'Máximo 40 caracteres')
        .required('El nombre del rol es requerido'),
      valor: tieneSalario
        ? Yup.string()
            .matches(/^\$?\s?[\d.,]+$/, 'Formato inválido')
            .required('El salario es requerido')
        : Yup.string().nullable()
    }),
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);

      try {
        let payload: any = {
          name: values.roleName
        };

        if (tieneSalario) {
          const valorNumerico = Number(String(values.valor).replace(/[^\d]/g, ''));
          payload.valor = valorNumerico;
          payload.salario = 'SI';
        } else {
          payload.salario = 'SI';
        }

        let response;

        if (data) {
          response = await axios.put(`roles/${data.id}`, payload);
          enqueueSnackbar('Rol actualizado exitosamente', { variant: 'success' });
        } else {
          response = await axios.post('roles', payload);
          enqueueSnackbar('Rol creado exitosamente', { variant: 'success' });
        }

        if (onSave) {
          onSave();
        }

        if ([200, 201].includes(response.status)) {
          resetForm();
          onClose();
        } else {
          enqueueSnackbar('Error al guardar el rol', {
            variant: 'solid',
            state: 'danger'
          });
        }
      } catch (error) {
        enqueueSnackbar('Ocurrió un error inesperado al actualizar el rol', {
          state: 'danger'
        });
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Rol' : 'Nuevo Rol'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <form onSubmit={formik.handleSubmit}>
          <ModalBody className="grid gap-5 px-0 py-5">
            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol</label>
              <input
                className="input p-2 border border-gray-300 rounded-md w-full"
                placeholder="Ej: Administrador"
                type="text"
                {...formik.getFieldProps('roleName')}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  formik.setFieldValue('roleName', value);
                }}
              />

              {formik.touched.roleName && typeof formik.errors.roleName === 'string' && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.roleName}</p>
              )}
            </div>

            {tieneSalario && (
              <div className="relative w-[calc(100%-2rem)] mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">Salario</label>
                <input
                  className="input p-2 border border-gray-300 rounded-md w-full"
                  placeholder="Ej: $ 1.500.000"
                  type="text"
                  {...formik.getFieldProps('valor')}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/[^\d]/g, '');
                    formik.setFieldValue(
                      'valor',
                      soloNumeros ? formatCOP(parseInt(soloNumeros, 10)) : ''
                    );
                  }}
                />
                {formik.touched.valor && typeof formik.errors.valor === 'string' && (
                  <p className="text-red-500 text-sm mt-1">{formik.errors.valor}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4 px-4">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </ModalBody>
        </form>
      </ModalContent>
    </Modal>
  );
};

export { CreateUpdateRole };

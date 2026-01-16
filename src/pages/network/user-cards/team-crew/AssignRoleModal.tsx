import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';

import { ActivationCompanyUser } from '../../models/_ActivationCompanyUser';
import { RoleModel } from '@/pages/account/members/roles/models/_Role';

interface IAssignedRolesProps {
  open: boolean;
  onSave: () => void;
  roles: RoleModel[];
  activation: ActivationCompanyUser | null;
  onClose: () => void;
  onRolesAssigned: (activation: ActivationCompanyUser) => void;
}

const roleSchema = Yup.object().shape({
  roles: Yup.array()
    .of(Yup.number().required('El rol es requerido'))
    .min(1, 'Debes seleccionar al menos un rol')
    .required('Los roles son requeridos')
});

const AssignRoleModal = ({
  open,
  roles,
  activation,
  onClose,
  onSave,
  onRolesAssigned
}: IAssignedRolesProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const initialValues = {
    roles: activation?.roles?.map((role) => role.id) || []
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: roleSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.put('asignar_roles', {
          idActivation: activation ? activation.id : null,
          roles: values.roles
        });

        enqueueSnackbar('Roles asignados exitosamente', {
          variant: 'success'
        });

        if (response.status === 200 || response.status === 201) {
          onRolesAssigned(response.data);
          resetForm();
          onSave();
        } else {
          enqueueSnackbar('Error al asignar los roles', {
            variant: 'error'
          });
        }
      } catch {
        setError('Hubo un problema al asignar los roles. Inténtalo de nuevo.');
        enqueueSnackbar('Ocurrió un error inesperado al asignar roles', {
          variant: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Asignar Roles</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-col gap-1 w-full">
              <div className="divide-y divide-gray-200 border rounded">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="switch flex items-center justify-between px-4 py-2"
                  >
                    <span className="switch-label text-gray-700">{role.name}</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={formik.values.roles.includes(role.id)}
                      onChange={() => {
                        const currentRoles = formik.values.roles || [];
                        if (currentRoles.includes(role.id)) {
                          formik.setFieldValue(
                            'roles',
                            currentRoles.filter((r) => r !== role.id)
                          );
                        } else {
                          formik.setFieldValue('roles', [...currentRoles, role.id]);
                        }
                      }}
                    />
                  </label>
                ))}
              </div>

              {formik.touched.roles && formik.errors.roles && (
                <span role="alert" className="text-danger text-xs mt-1">
                  {formik.errors.roles}
                </span>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4 px-4">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={loading || !formik.isValid}
              >
                {loading ? 'Guardando...' : 'Asignar roles'}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { AssignRoleModal };

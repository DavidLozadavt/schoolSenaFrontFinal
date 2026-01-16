import { KeenIcon } from '@/components';
import { CommonHexagonBadge } from '@/partials/common';
import { PermissionModel } from '../models/_Permission';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { ToolbarDescription } from '@/partials/toolbar';
import { Container } from '@/components/container';
import { useSnackbar } from 'notistack';
import { RoleModel } from '../../roles/models/_Role';

const PermissionsToggle = React.memo(() => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionModel[]>([]);
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchRolesAndPermissions = async () => {
      try {
        const rolesResponse = await axios.get('roles');
        setRoles(rolesResponse.data);
        const permissionsResponse = await axios.get('permisos');
        setPermissions(permissionsResponse.data);
      } catch (err) {
        setError('Hubo un error al obtener los datos');
      } finally {
        setLoading(false);
      }
    };
    fetchRolesAndPermissions();
  }, []);

  const handleRoleChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = Number(event.target.value);
    setSelectedRole(roleId);

    const response = await axios.get(`permisos_rol?rol=${roleId}`);
    setActivePermissions(response.data);
  }, []);

  const handlePermissionChange = useCallback((permissionId: string) => {
    setActivePermissions((prevState) =>
      prevState.includes(permissionId)
        ? prevState.filter((id) => id !== permissionId)
        : [...prevState, permissionId]
    );
  }, []);

  const assignPermissions = useCallback(async () => {
    if (selectedRole === null) return;

    setSaving(true);
    try {
      const permissionIds = permissions
        .filter((permission) => activePermissions.includes(permission.name))
        .map((permission) => permission.id);

      const payload = {
        idRol: selectedRole,
        funciones: permissionIds
      };

      await axios.put('asignar_rol_permiso', payload);
      enqueueSnackbar('Permisos asignados correctamente', {
        variant: 'success'
      });
    } catch (err) {
      enqueueSnackbar('Hubo un error al asignar los permisos', {
        variant: 'error'
      });
    } finally {
      setSaving(false);
    }
  }, [selectedRole, activePermissions, permissions, enqueueSnackbar]);

  const totalPages = Math.ceil(permissions.length / itemsPerPage);

  const renderItem = useCallback(
    (item: PermissionModel, index: number) => {
      const isChecked = activePermissions.includes(item.name);

      return (
        <div
          key={index}
          className="rounded-xl border p-4 flex items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-3.5">
            <CommonHexagonBadge
              stroke="stroke-gray-300"
              fill="fill-gray-100"
              size="size-[45px]"
              badge={<KeenIcon icon="security-user" className="text-lg text-gray-500" />}
            />
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 leading-none font-medium text-sm text-gray-900">
                {item.name}
              </span>
              <span className="text-2sm text-gray-700">{item.description}</span>
            </div>
          </div>
          <div className="switch switch-sm">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handlePermissionChange(item.name)}
            />
          </div>
        </div>
      );
    },
    [activePermissions, handlePermissionChange]
  );

  const handlePageClick = useCallback((selectedItem: { selected: number }) => {
    setCurrentPage(selectedItem.selected);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const currentItems = permissions.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  if (error) return <div>{error}</div>;

  return (
    <Container>
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold leading-none text-gray-900 mb-2">
              Asignar Permisos
            </h1>
            <ToolbarDescription>Gestiona y asigna permisos a los roles</ToolbarDescription>
          </div>

          <div className="flex items-center gap-3">
            <select className="select w-48" value={selectedRole || ''} onChange={handleRoleChange}>
              <option value="" disabled>
                Seleccionar un rol
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-body grid grid-cols-1 lg:grid-cols-2 gap-5 py-5 lg:py-7.5">
          {currentItems.map((item, index) => renderItem(item, index))}

          <div className="flex justify-end items-center col-span-1 lg:col-span-2">
            <button
              type="button"
              className="btn btn-primary btn-sm "
              onClick={assignPermissions}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        <div className="card-footer flex justify-end items-center gap-4 text-gray-600 text-2sm font-medium">
          <button className="btn" onClick={handlePreviousPage} disabled={currentPage === 0}>
            <KeenIcon icon="black-left" />
          </button>
          <span>{`Página ${currentPage + 1} de ${totalPages}`}</span>
          <button
            className="btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
          >
            <KeenIcon icon="black-right" />
          </button>
        </div>
      </div>
    </Container>
  );
});

export default PermissionsToggle;

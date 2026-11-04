import { Fragment, useEffect, useState, useMemo, useContext, useCallback, useRef } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { KeenIcon, DataGrid } from '@/components';
import { CommonAvatar } from '@/partials/common';

import { ActivationCompanyUser } from '../network/models/_ActivationCompanyUser';
import axios from 'axios';
import { AssignRoleModal } from '../network/user-cards/team-crew/AssignRoleModal';
import { ModalUsuarios } from './ModalUsuarios';
import { useConfirm } from '@/hooks';
import { enqueueSnackbar } from 'notistack';
import { RoleModel } from '../account/members/roles/models/_Role';
import clsx from 'clsx';
import { AuthContext } from '@/auth/providers/JWTProvider';

interface IAvatar {
  className: string;
  image?: string;
  imageClass?: string;
  fallback?: string;
  badgeClass: string;
}

interface IMiniCardsContentItem {
  avatar: IAvatar;
  name: string;
  email: string;
  verify: boolean;
}
interface IMiniCardsContentItems extends Array<IMiniCardsContentItem> {}

interface usuariosContentTypeProps {
  reload: boolean;
}

const UsuariosContent = ({ reload }: usuariosContentTypeProps) => {
  const authContext = useContext(AuthContext);

  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [activation, setActivation] = useState<ActivationCompanyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<ActivationCompanyUser[]>([]);
  const [modalUserOpen, setUserModalOpen] = useState(false);
  const { confirmAction } = useConfirm();

  const [user, setUser] = useState<ActivationCompanyUser[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('1');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [total, setTotal] = useState(0);

  const fetchRoles = async () => {
    try {
      const response = await axios.get('roles');
      setRoles(response.data);
    } catch (err) {
      setError('Hubo un error al obtener los roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const response = await axios.get('lista_usuarios_paginado', {
          params: {
            search: search || undefined,
            per_page: perPage,
            page,
            state_id: statusFilter || undefined,
            sort_order: sortOrder,
            role_id: roleFilter || undefined
          }
        });

        setUsers(response.data.data);
        setCurrentPage(response.data.current_page);
        setTotalPages(response.data.last_page);
        setTotal(response.data.total);
      } catch (err) {
        setError('Hubo un error al obtener los usuarios');
      } finally {
        setLoading(false);
      }
    },
    [search, perPage, statusFilter, sortOrder, roleFilter]
  );

  const fetchUsersRef = useRef(fetchUsers);
  fetchUsersRef.current = fetchUsers;

  const handleOpenRoles = (activation: ActivationCompanyUser) => {
    setRolesModalOpen(true);
    setActivation(activation);
    handleRolesAssigned(activation);
  };

  const handleCloseRoles = () => {
    setRolesModalOpen(false);
    setActivation(null);
  };

  const handleRolesAssigned = (updatedUser: ActivationCompanyUser) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === updatedUser.id ? { ...user, roles: updatedUser.roles } : user
      )
    );
  };

  const handleConfirmDelete = (idUser?: number) => {
    if (idUser === undefined) return;
    confirmAction('Esta acción eliminara el usuario.', () => handleDeleteUser(idUser));
  };

  const handleDeleteUser = async (idUser: number) => {
    try {
      await axios.delete(`usuarios/${idUser}`);
      enqueueSnackbar('Usuario eliminado correctamente.', { variant: 'success' });
      fetchUsers();
    } catch (error: unknown) {
      enqueueSnackbar('Error al eliminar el usuario.', { variant: 'error' });
    }
  };

  const handleSaveAsignRol = () => {
    setRolesModalOpen(false);
    fetchUsers();
  };

  const handleSave = () => {
    setUserModalOpen(false);
    fetchUsers();
  };

  const handleEdit = (user: any) => {
    setUser(user.user);
    setUserModalOpen(true);
  };

  const handleToggleStatus = (idUser: number, currentEstado: string) => {
    const nuevoEstado = currentEstado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    confirmAction(
      `¿Seguro que deseas cambiar el estado del usuario a ${nuevoEstado}?`,
      async () => {
        try {
          await axios.post(`update_status_user/${idUser}`, {
            estado: nuevoEstado
          });

          enqueueSnackbar(`Estado cambiado a ${nuevoEstado}.`, { variant: 'success' });
          fetchUsers();
        } catch (error: unknown) {
          enqueueSnackbar('Error al cambiar el estado del usuario.', { variant: 'error' });
        }
      }
    );
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsersRef.current(currentPage);
  }, [reload]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchUsersRef.current(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, statusFilter, sortOrder, roleFilter, perPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchUsers(page);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.user?.persona,
        id: 'usuario',
        header: () => 'Usuario',
        enableSorting: true,
        cell: (info) => {
          const persona = info.getValue() as any;
          const row = info.row.original;
          const nombreCompleto = persona
            ? `${persona.nombre1 ?? ''} ${persona.apellido1 ?? ''}`.trim()
            : 'Centro de formación';
          const foto = persona?.rutaFotoUrl;
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden relative">
                <CommonAvatar
                  className="w-full h-full object-cover"
                  image={foto}
                  fallback={nombreCompleto.charAt(0)}
                  imageClass="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{nombreCompleto}</span>
                <span className="text-xs text-gray-500">{row.user?.email}</span>
              </div>
            </div>
          );
        },
        meta: { className: 'min-w-[250px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.user?.persona?.identificacion ?? '—',
        id: 'identificacion',
        header: () => 'Identificación',
        enableSorting: true,
        cell: (info) => <span className="text-sm text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'w-[150px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.roles,
        id: 'rol',
        header: () => 'Rol',
        enableSorting: false,
        cell: (info) => {
          const roles = info.getValue() as any[];
          if (!roles || roles.length === 0) {
            return <span className="text-sm text-gray-500">Sin rol</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {roles.map((rol: any) => (
                <span key={rol.id} className="badge badge-light badge-sm">
                  {rol.name}
                </span>
              ))}
            </div>
          );
        },
        meta: { className: 'w-[150px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.estado?.estado,
        id: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => {
          const estado = info.getValue() as string;
          return estado ? (
            <button
              onClick={() => handleToggleStatus(info.row.original.user.id, estado)}
              className={clsx('badge badge-outline cursor-pointer transition', {
                'badge-danger': estado === 'INACTIVO',
                'badge-primary': estado === 'ACTIVO'
              })}
            >
              {estado}
            </button>
          ) : null;
        },
        meta: { className: 'w-[120px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        id: 'acciones',
        header: () => 'Acciones',
        enableSorting: false,
        cell: (info) => {
          const item = info.row.original;
          const persona = item.user?.persona;
          return (
            <div className="flex items-center gap-2">
              <button
                title="Asignar Roles"
                className="btn btn-sm btn-icon btn-clear btn-primary"
                onClick={() => handleOpenRoles(item)}
              >
                <KeenIcon icon="toggle-on" />
              </button>

              {persona && (
                <button
                  className="btn btn-sm btn-icon btn-clear btn-secondary"
                  title="Editar Usuario"
                  onClick={() => handleEdit(item)}
                >
                  <KeenIcon icon="pencil" />
                </button>
              )}

              <button
                title="Eliminar Usuario"
                className="btn btn-sm btn-icon btn-clear btn-danger"
                onClick={() => handleConfirmDelete(item.user.id)}
              >
                <KeenIcon icon="trash" />
              </button>
            </div>
          );
        },
        meta: { className: 'w-[120px]' }
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Fragment>
      <div className="flex items-center justify-between gap-2.5 flex-wrap mb-7.5">
        <h3 className="text-md text-gray-900 font-medium">
          Mostrando {users.length} de {total} Usuarios
        </h3>

        <div className="flex items-center flex-wrap gap-2.5">
          <select
            className="select select-sm w-28"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="1">Activos</option>
            <option value="2">Inactivos</option>
            <option value="4">Pendientes</option>
            <option value="18">Por actualizar</option>
          </select>

          <select
            className="select select-sm w-36"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todos los roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id?.toString() ?? ''}>
                {role.name}
              </option>
            ))}
          </select>

          <select
            className="select select-sm w-32"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="1">Más recientes</option>
            <option value="3">Más antiguos</option>
          </select>

          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                placeholder="Buscar usuarios"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="card card-grid min-w-full">
        <div className="card-body">
          <DataGrid
            columns={columns}
            data={users}
            nativePagination={false}
            pagination={{ page: 0, size: perPage }}
          />
        </div>
      </div>

      <div className="card-footer mt-3 justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
        <div className="flex items-center gap-2">
          Mostrando
          <select
            className="select select-sm w-16"
            value={perPage}
            onChange={(e) => {
              setPerPage(+e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="15">15</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
          Por página
        </div>
        <div className="flex items-center gap-4 order-1 md:order-2">
          <span>
            {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, total)} de {total}
          </span>
          <div className="pagination flex gap-2">
            <button
              className="btn"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <KeenIcon icon="black-left" />
            </button>

            {(() => {
              const pages = [];
              const delta = 2;

              pages.push(
                <button
                  key={1}
                  className={`btn ${currentPage === 1 ? 'btn-active' : ''}`}
                  onClick={() => handlePageChange(1)}
                >
                  1
                </button>
              );

              if (currentPage > delta + 2) {
                pages.push(
                  <span key="dots-start" className="flex items-center px-2">
                    ...
                  </span>
                );
              }

              const startPage = Math.max(2, currentPage - delta);
              const endPage = Math.min(totalPages - 1, currentPage + delta);

              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    className={`btn ${currentPage === i ? 'btn-active' : ''}`}
                    onClick={() => handlePageChange(i)}
                  >
                    {i}
                  </button>
                );
              }

              if (currentPage < totalPages - delta - 1) {
                pages.push(
                  <span key="dots-end" className="flex items-center px-2">
                    ...
                  </span>
                );
              }

              if (totalPages > 1) {
                pages.push(
                  <button
                    key={totalPages}
                    className={`btn ${currentPage === totalPages ? 'btn-active' : ''}`}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}

            <button
              className="btn"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <KeenIcon icon="black-right" />
            </button>
          </div>
        </div>
      </div>

      <AssignRoleModal
        open={rolesModalOpen}
        roles={roles}
        activation={activation}
        onClose={handleCloseRoles}
        onRolesAssigned={handleRolesAssigned}
        onSave={handleSaveAsignRol}
      />

      <ModalUsuarios
        open={modalUserOpen}
        persona={user}
        onClose={() => setUserModalOpen(false)}
        onSave={handleSave}
      />
    </Fragment>
  );
};

export { UsuariosContent, type IMiniCardsContentItem, type IMiniCardsContentItems };

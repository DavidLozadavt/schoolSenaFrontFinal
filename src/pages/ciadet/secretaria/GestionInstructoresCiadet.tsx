import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useConfirm } from '@/hooks';
import { KeenIcon } from '@/components';
import { CommonAvatar } from '@/partials/common';
import { ActivationCompanyUser } from '@/pages/network/models/_ActivationCompanyUser';
import ModalInstructorCiadet from './ModalInstructorCiadet';
import clsx from 'clsx';

const GestionInstructoresCiadet: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { confirmAction } = useConfirm();

  const [users, setUsers] = useState<ActivationCompanyUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('1');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // Modal states
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedInstructor, setSelectedInstructor] = useState<ActivationCompanyUser | null>(null);

  // Fetch users (filtered for instructors / CIADET)
  const fetchInstructors = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const response = await axios.get('lista_usuarios_paginado', {
          params: {
            search: search,
            per_page: perPage,
            page: page,
            state_id: statusFilter,
            sort_order: sortOrder
          }
        });

        const allUsers: ActivationCompanyUser[] = response.data?.data || [];
        setUsers(allUsers);
        setCurrentPage(response.data?.current_page || 1);
        setTotalPages(response.data?.last_page || 1);
        setTotal(response.data?.total || 0);
      } catch (error) {
        console.error('Error al cargar instructores:', error);
        enqueueSnackbar('Error al obtener la lista de instructores', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [search, perPage, statusFilter, sortOrder, enqueueSnackbar]
  );

  useEffect(() => {
    fetchInstructors(currentPage);
  }, [fetchInstructors, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, statusFilter, sortOrder, perPage]);

  // Instructor list filter: highlight users with INSTRUCTOR CIADET or INSTRUCTOR roles
  const filteredInstructors = useMemo(() => {
    return users.filter((u) => {
      // If user has roles, check if any matches instructor
      const userRoles = u.roles || [];
      const hasInstructorRole =
        userRoles.length === 0 ||
        userRoles.some(
          (r: any) =>
            r.name?.toUpperCase().includes('INSTRUCTOR') ||
            r.name?.toUpperCase().includes('CIADET') ||
            r.name?.toUpperCase().includes('DOCENTE')
        );
      return hasInstructorRole;
    });
  }, [users]);

  const handleOpenCreateModal = () => {
    setSelectedInstructor(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (instructor: ActivationCompanyUser) => {
    setSelectedInstructor(instructor);
    setModalOpen(true);
  };

  const handleSaveModal = () => {
    setModalOpen(false);
    setSelectedInstructor(null);
    fetchInstructors(currentPage);
  };

  const handleToggleStatus = (idUser: number, currentEstado: string) => {
    const nuevoEstado = currentEstado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    confirmAction(`¿Desea cambiar el estado del instructor a ${nuevoEstado}?`, async () => {
      try {
        await axios.post(`update_status_user/${idUser}`, {
          estado: nuevoEstado
        });
        enqueueSnackbar(`Estado del instructor cambiado a ${nuevoEstado}.`, {
          variant: 'success'
        });
        fetchInstructors(currentPage);
      } catch (error) {
        enqueueSnackbar('Error al cambiar el estado del instructor.', { variant: 'error' });
      }
    });
  };

  const handleDeleteInstructor = (idUser: number) => {
    confirmAction(
      '¿Está seguro de que desea eliminar este instructor? Esta acción no se puede deshacer.',
      async () => {
        try {
          await axios.delete(`usuarios/${idUser}`);
          enqueueSnackbar('Instructor eliminado correctamente.', { variant: 'success' });
          fetchInstructors(currentPage);
        } catch (error) {
          enqueueSnackbar('Error al eliminar el instructor.', { variant: 'error' });
        }
      }
    );
  };

  // KPI Calculations
  const activeCount = users.filter((u) => u.estado?.estado === 'ACTIVO').length;
  const inactiveCount = users.filter((u) => u.estado?.estado === 'INACTIVO').length;

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-coal-500 p-6 rounded-2xl border border-gray-200 dark:border-coal-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <i className="ki-outline ki-teacher text-2xl" />
            </span>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Gestión de Instructores CIADET
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Panel de la Secretaría para el registro, edición y asignación del rol{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              INSTRUCTOR CIADET
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInstructors(currentPage)}
            className="btn btn-sm btn-light flex items-center gap-2"
          >
            <KeenIcon icon="arrows-loop" />
            Actualizar
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-sm btn-primary flex items-center gap-2 shadow-sm"
          >
            <KeenIcon icon="user-plus" />
            Crear Instructor CIADET
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-coal-500 p-4 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <label className="input input-sm w-full">
            <KeenIcon icon="magnifier" />
            <input
              type="text"
              placeholder="Buscar por nombre, identificación o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            className="select select-sm w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="1">Activos</option>
            <option value="2">Inactivos</option>
          </select>

          <select
            className="select select-sm w-36"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="1">Más Recientes</option>
            <option value="3">Más Antiguos</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">
            Instructores CIADET
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando lista de instructores...
          </div>
        ) : filteredInstructors.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <i className="ki-outline ki-user-cross text-4xl text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No se encontraron instructores con los filtros seleccionados.</p>
            <button onClick={handleOpenCreateModal} className="btn btn-xs btn-primary mt-2">
              <KeenIcon icon="plus" /> Registrar Primer Instructor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-coal-400/50 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider border-b border-gray-100 dark:border-coal-300">
                <tr>
                  <th className="px-6 py-3.5">Instructor</th>
                  <th className="px-6 py-3.5">Identificación</th>
                  <th className="px-6 py-3.5">Rol Asignado</th>
                  <th className="px-6 py-3.5">Contacto</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-coal-300 text-gray-700 dark:text-gray-300">
                {filteredInstructors.map((item) => {
                  const persona = item.user?.persona;
                  const fullName = persona
                    ? `${persona.nombre1 || ''} ${persona.nombre2 || ''} ${persona.apellido1 || ''} ${persona.apellido2 || ''}`
                        .replace(/\s+/g, ' ')
                        .trim()
                    : 'Instructor ID: ' + item.user_id;

                  const foto = persona?.rutaFotoUrl;
                  const estadoStr = item.estado?.estado || 'ACTIVO';
                  const rolesList = item.roles || [];

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-coal-400/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0">
                            <CommonAvatar
                              className="w-full h-full object-cover"
                              image={foto}
                              fallback={fullName.charAt(0) || 'I'}
                              imageClass="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {fullName}
                            </span>
                            <span className="text-xs text-gray-400">{item.user?.email || '—'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-coal-600 px-2.5 py-1 rounded-md">
                          CC: {persona?.identificacion || '—'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {rolesList.length > 0 ? (
                            rolesList.map((r: any) => (
                              <span
                                key={r.id || r.name}
                                className={clsx('badge badge-xs font-semibold px-2.5 py-1', {
                                  'badge-primary':
                                    r.name?.toUpperCase().includes('CIADET') ||
                                    r.name?.toUpperCase().includes('INSTRUCTOR'),
                                  'badge-light':
                                    !r.name?.toUpperCase().includes('CIADET') &&
                                    !r.name?.toUpperCase().includes('INSTRUCTOR')
                                })}
                              >
                                {r.name}
                              </span>
                            ))
                          ) : (
                            <span className="badge badge-primary badge-xs font-semibold px-2.5 py-1">
                              INSTRUCTOR CIADET
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs space-y-0.5">
                          <p className="text-gray-700 dark:text-gray-300">
                            <i className="ki-outline ki-phone text-xs text-gray-400 mr-1" />
                            {persona?.celular || persona?.telefonoFijo || 'N/A'}
                          </p>
                          <p className="text-gray-400">
                            <i className="ki-outline ki-geolocation text-xs mr-1" />
                            {persona?.direccion || 'Sin dirección'}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {item.user?.id && (
                          <button
                            onClick={() =>
                              item.user?.id && handleToggleStatus(item.user.id, estadoStr)
                            }
                            className={clsx(
                              'badge badge-outline cursor-pointer transition font-semibold text-xs px-2.5 py-1',
                              {
                                'badge-danger': estadoStr === 'INACTIVO',
                                'badge-primary': estadoStr === 'ACTIVO'
                              }
                            )}
                            title="Haz clic para cambiar de estado"
                          >
                            {estadoStr}
                          </button>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            className="btn btn-sm btn-icon btn-clear btn-secondary"
                            title="Editar Instructor"
                            onClick={() => handleOpenEditModal(item)}
                          >
                            <KeenIcon icon="pencil" />
                          </button>

                          {item.user?.id && (
                            <button
                              className="btn btn-sm btn-icon btn-clear btn-danger"
                              title="Eliminar Instructor"
                              onClick={() => item.user?.id && handleDeleteInstructor(item.user.id)}
                            >
                              <KeenIcon icon="trash" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer & Pagination */}
        <div className="card-footer px-6 py-4 justify-between flex-col md:flex-row gap-3 text-gray-600 text-xs font-medium border-t border-gray-100 dark:border-coal-300 flex items-center">
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
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            Por página
          </div>

          <div className="flex items-center gap-4">
            <span>
              {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, total)} de{' '}
              {total}
            </span>

            <div className="pagination flex gap-1">
              <button
                className="btn btn-xs"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                <KeenIcon icon="black-left" />
              </button>

              <span className="btn btn-xs btn-active px-3">{currentPage}</span>

              <button
                className="btn btn-xs"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <KeenIcon icon="black-right" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Creación / Edición con Rol INSTRUCTOR CIADET */}
      <ModalInstructorCiadet
        open={modalOpen}
        persona={selectedInstructor}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
      />
    </div>
  );
};

export default GestionInstructoresCiadet;

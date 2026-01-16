import { useCallback, useEffect, useState } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { ActivationCompanyUser } from '../../models/_ActivationCompanyUser';

import { AssignRoleModal } from './AssignRoleModal';
import { RoleModel } from '@/pages/account/members/roles/models/_Role';

const NetworkUserCardsTeamCrewContent = () => {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [activation, setActivation] = useState<ActivationCompanyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<ActivationCompanyUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ActivationCompanyUser[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<number | null>(null); // Estado del filtro (1 = Activos, 2 = Inactivos)
  const itemsPerPage = 10;

  // useEffect(() => {
  //   const fetchRoles = async () => {
  //     try {
  //       const response = await axios.get('roles');
  //       setRoles(response.data);
  //     } catch (err) {
  //       setError("Hubo un error al obtener los roles");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchRoles();
  // }, []);

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     try {
  //       const response = await axios.get('lista_usuarios');
  //       setUsers(response.data);
  //     } catch (err) {
  //       setError("Hubo un error al obtener los usuarios");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchUsers();
  // }, []);

  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchesState = filterState === null || user.state_id === filterState;

      const fullName = [
        user.user?.persona?.nombre1,
        user.user?.persona?.nombre2,
        user.user?.persona?.apellido1,
        user.user?.persona?.apellido2,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = fullName.includes(searchTerm.toLowerCase());

      return matchesState && matchesSearch;
    });

    setFilteredUsers(filtered);
  }, [users, filterState, searchTerm]);


  const handleOpen = (activation: ActivationCompanyUser) => {
    setProfileModalOpen(true);
    setActivation(activation);
    handleRolesAssigned(activation);
  };

  const handleClose = () => {
    setProfileModalOpen(false);
    setActivation(null);
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const handleRolesAssigned = (updatedUser: ActivationCompanyUser) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === updatedUser.id ? { ...user, roles: updatedUser.roles } : user
      )
    );
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return (
      <div>
        {error}
        <button onClick={() => setLoading(true)}>Reintentar</button>
      </div>
    );
  }

  const currentItems = filteredUsers.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
      <div className="flex flex-wrap items-center gap-5 justify-between">
        <h3 className="text-md text-gray-900 font-medium">Mirando {filteredUsers.length} usuarios</h3>

        <div className="flex items-center flex-wrap gap-5">
          <div className="flex items-center gap-2.5">
            <select
              className="select select-sm w-28"
              value={filterState ?? ""}
              onChange={(e) => setFilterState(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Todos</option>
              <option value="1">Activos</option>
              <option value="2">Inactivos</option>
            </select>
          </div>
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                placeholder="Buscar usuarios"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5">
        {currentItems.map((user) => (
          <div key={user.id} className="card overflow-hidden grow justify-between">
            <div className="p-5 mb-5">
              <div className="flex justify-center mb-2">
                <img
                  alt={user.user?.persona.nombre1}
                  className="w-32 h-32 shrink-0 rounded-full"
                  src={user.user?.persona?.rutaFotoUrl}
                />
              </div>
              <div className="text-center mb-7">
                <a className="text-lg font-medium text-gray-900 hover:text-primary" href="">
                  {user.user?.persona.nombre1 + ' ' + user.user?.persona.apellido1}
                </a>
                <div className={`text-sm ${user.estado?.estado === 'INACTIVO' ? 'text-red-500' : user.estado?.estado === 'ACTIVO' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {user.estado?.estado}
                </div>
              </div>

              <div className="grid justify-center gap-1.5 mb-7.5">
                <span className="text-xs uppercase text-gray-600 text-center">Roles</span>
                <div className="flex -space-x-2">
                  <div className="flex">
                    <span className="text-sm uppercase text-gray-600 text-center">
                      {user.roles?.map((role) => role.name).join(" - ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center flex-wrap gap-2 lg:gap-5">
                <div className="grid grid-cols-1 content-between gap-1.5 shrink-0 rounded-md px-2.5 py-2 min-w-24 max-w-auto">
                  <button className='btn btn-success' onClick={() => handleOpen(user)}>Asignar roles</button>
                </div>
              </div>
            </div>
            <div className="progress progress-primary">
              <div className="progress-bar" style={{ width: '100%' }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* <AssignRoleModal
        open={profileModalOpen}
        roles={roles}
        activation={activation}
        onClose={handleClose}
        onRolesAssigned={handleRolesAssigned}
      /> */}

      <div className="flex grow justify-center pt-5 lg:pt-7.5">
        <div className="flex justify-center space-x-3 my-3">
          <button
            className="btn btn-secondary"
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
          >
            {'<'}
          </button>
          <span>{`Página ${currentPage + 1} de ${totalPages}`}</span>
          <button
            className="btn btn-secondary"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
          >
            {'>'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { NetworkUserCardsTeamCrewContent };

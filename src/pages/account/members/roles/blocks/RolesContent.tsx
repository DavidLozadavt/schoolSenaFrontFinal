import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';

import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';
import { CreateUpdateRole } from '../CreateUpdateRole';

interface rolesTypeProps {
  reload: boolean;
}

const RolesContent = ({ reload }: rolesTypeProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const StorageFilteredId = 'filtered_roles';
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rol, setRol] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(StorageFilteredId) || '');

  const { confirmAction } = useConfirm();

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchRoles = async () => {
    try {
      const response = await axios.get('roles');
      setRoles(response.data);
    } catch (err) {
      setError(`Error al cargar los datos: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteRol = async (id: number | undefined) => {
    try {
      await axios.delete(`roles/${id}`);
      fetchRoles();
    } catch (err) {
      enqueueSnackbar('Error al guardar eliminar', {
        variant: 'error'
      });
    }
  };

  const handleAfterSave = () => {
    fetchRoles();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchRoles();
  }, [reload]);

  const handleDelete = (id?: number) => {
    confirmAction('Esta acción eliminará el rol', () => deleteRol(id));
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'w-[100px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorKey: 'name',
        header: () => 'Nombre',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'salario.valor',
        header: () => 'Sueldo',
        enableSorting: true,
        cell: (info) => {
          const value = info.getValue<number | null>();

          if (!value && value !== 0) {
            return <span className="text-sm font-medium text-gray-500">No aplica</span>;
          }

          const formatted = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(value);

          return <span className="text-sm font-medium text-gray-900">{formatted}</span>;
        },
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-medium' }
      },

      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setRol(row.original);
              setIsModalOpen(true);
            }}
          >
            <KeenIcon icon="notepad-edit" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      },
      {
        id: 'delete',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => handleDelete(row.original.id)}
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      }
    ],
    /* eslint-disable react-hooks/exhaustive-deps */
    []
  );
  const filteredData = useMemo(() => {
    if (!searchTerm) return roles;

    return roles.filter((e) => {
      const nombre = e.name ?? ''; 
      return nombre.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, roles]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Roles</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar rol"
              className="pl-8 input input-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card-body">
        <DataGrid
          key={JSON.stringify(filteredData)}
          columns={columns}
          data={filteredData}
          pagination={{ size: 10 }}
        />
      </div>

      <CreateUpdateRole
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setRol(undefined);
        }}
        data={rol}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { RolesContent };

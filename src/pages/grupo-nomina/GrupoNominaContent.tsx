import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ModalGrupoNomina } from './ModalGrupoNomina';
import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';

interface props {
  reload?: boolean;
}

const GrupoNominaContent = ({ reload }: props) => {
  const { enqueueSnackbar } = useSnackbar();
  const { confirmAction } = useConfirm();

  const StorageFilteredId = 'filtered_grupos_nomina';
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(StorageFilteredId) || '');

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchGrupos = async () => {
    try {
      const response = await axios.get('grupos_nomina');
      setGrupos(response.data);
    } catch (err) {
      setError(`Error al cargar los grupos: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteGrupo = async (id: number | undefined) => {
    try {
      await axios.delete(`grupos_nomina/${id}`);
      fetchGrupos();
      enqueueSnackbar('Grupo eliminado con éxito.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Error al eliminar el grupo.', { variant: 'error' });
    }
  };

  const handleAfterSave = () => {
    fetchGrupos();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchGrupos();
  }, [reload]);

  const handleDelete = (id?: number) => {
    confirmAction('Esta acción eliminará el grupo de nómina.', () => deleteGrupo(id));
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
        accessorKey: 'nombreGrupo',
        header: () => 'Nombre del Grupo',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'sabados',
        header: () => 'Sábados',
        cell: (info) => (
          <span className="text-sm font-medium text-gray-700">
            {info.getValue() === '1' ? 'Sí' : 'No'}
          </span>
        ),
        meta: { className: 'w-[100px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'domingos',
        header: () => 'Domingos',
        cell: (info) => (
          <span className="text-sm font-medium text-gray-700">
            {info.getValue() === '1' ? 'Sí' : 'No'}
          </span>
        ),
        meta: { className: 'w-[100px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'festivos',
        header: () => 'Festivos',
        cell: (info) => (
          <span className="text-sm font-medium text-gray-700">
            {info.getValue() === '1' ? 'Sí' : 'No'}
          </span>
        ),
        meta: { className: 'w-[100px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'trabajoDiaPorMedio',
        header: () => 'Trabajo día por medio',
        cell: (info) => (
          <span className="text-sm font-medium text-gray-700">
            {info.getValue() === '1' ? 'Sí' : 'No'}
          </span>
        ),
        meta: { className: 'w-[180px]', cellClassName: 'text-gray-700 font-medium' }
      },

      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setGrupoSeleccionado(row.original);
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
    if (!searchTerm) return grupos;
    return grupos.filter((g) => g.nombreGrupo.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, grupos]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Grupos de Nómina</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar por nombre"
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

      <ModalGrupoNomina
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setGrupoSeleccionado(undefined);
        }}
        grupo={grupoSeleccionado}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { GrupoNominaContent };

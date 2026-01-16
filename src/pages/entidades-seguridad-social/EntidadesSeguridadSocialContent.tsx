import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';

import { useConfirm } from '@/hooks';
import { ModalEntidadesSeguridadSocial } from './ModalEntidadesSeguridadSocial';
import { useSnackbar } from 'notistack';

interface entityTypeProps {
  reload: boolean;
}

const EntidadesSeguridadSocialContent = ({ reload }: entityTypeProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const StorageFilteredId = 'filtered_id_entidades_seguridad_social';
  const [entidades, setEntidades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(StorageFilteredId) || '');

  const { confirmAction } = useConfirm();

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchEntidades = async () => {
    try {
      const response = await axios.get('entidades_seguridad_social');
      setEntidades(response.data);
    } catch (err) {
      setError(`Error al cargar las entidades: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntidad = async (id: number | undefined) => {
    try {
      await axios.delete(`entidades_seguridad_social/${id}`);
      fetchEntidades();
    } catch (err) {
      enqueueSnackbar('Error al eliminar', {
        variant: 'error'
      });
    }
  };

  const handleAfterSave = () => {
    fetchEntidades();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchEntidades();
  }, [reload]);

  const handleDelete = (id?: number) => {
    confirmAction('Esta acción eliminará la entidad', () => deleteEntidad(id));
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
        accessorKey: 'nombre',
        header: () => 'Nombre',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'tipo',
        header: () => 'Tipo de Entidad',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'descripcion',
        header: () => 'Descripción',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[300px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorKey: 'codigo',
        header: () => 'Código Pila',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[130px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorKey: 'nit',
        header: () => 'Nit',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[110px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setEntidadSeleccionada(row.original);
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
    if (!searchTerm) return entidades;
    return entidades.filter(
      (e) =>
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, entidades]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Entidades de Seguridad Social</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o tipo de entidad"
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

      <ModalEntidadesSeguridadSocial
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEntidadSeleccionada(undefined);
        }}
        entidad={entidadSeleccionada}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { EntidadesSeguridadSocialContent };

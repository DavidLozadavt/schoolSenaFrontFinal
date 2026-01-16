import { useEffect, useMemo, useState } from 'react';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { DetalleRevision } from './model/DetalleRevisionModel';
import ModalDetalleRevision from './ModalDetalleRevision';
import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';

interface DetalleContentProps {
  reload: boolean;
}

const DetalleRevisionContent = ({ reload }: DetalleContentProps) => {
  const storageFilterId = 'detalles-filter';
  const [detallesRevision, setdetallesRevision] = useState<DetalleRevision[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selecteddetalleRevision, setSelecteddetalleRevision] = useState<
    DetalleRevision | undefined
  >(undefined);
  const { confirmAction } = useConfirm();
  const { enqueueSnackbar } = useSnackbar();

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<DetalleRevision>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: {
          className: 'w-[100px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.nombre,
        id: 'detalle',
        header: () => 'Detalle',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.nombre}
          </Link>
        ),
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
            {
        accessorFn: (row) => row.tipoDetalle,
        id: 'Tipo',
        header: () => 'Tipo Detalle',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.tipoDetalle}
          </Link>
        ),
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setSelecteddetalleRevision(row.original);
              setIsModalOpen(true);
            }}
          >
            <KeenIcon icon="notepad-edit" />
          </button>
        ),
        meta: {
          className: 'w-[60px]'
        }
      },
      {
        id: 'delete',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              confirmAction(`¿Estás seguro de que deseas eliminar: ${row.original.nombre}? `, () =>
                deleteDetalleRevision(row.original.id)
              );
            }}
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: {
          className: 'w-[60px]'
        }
      }
    ],
    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchdetallesRevision = async () => {
    setLoading(true);
    try {
      const response = await axios.get('detalle_revision');
      setdetallesRevision(response.data);
    } catch (error) {
      setError('Error al cargar los medios de pago');
    } finally {
      setLoading(false);
    }
  };

  const deleteDetalleRevision = async (idDetalle: number) => {
    try {
      const response = await axios.delete(`detalle_revision/${idDetalle}`);
      await fetchdetallesRevision();
    } catch (error: any) {
      const mensaje = error.response?.data?.message || 'Error al eliminar el detalle de revisión.';
      enqueueSnackbar(mensaje, { variant: 'error' });
      console.error('Error al eliminar el detalle de revisión:', error);
    }
  };

  useEffect(() => {
    fetchdetallesRevision();
  }, [reload]);

  const handleAfterSave = () => {
    fetchdetallesRevision();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return detallesRevision;
    return detallesRevision.filter((detail) =>
      detail.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, detallesRevision]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Detalles revision</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Detalle"
              className="input input-sm pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
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
          sorting={[{ id: 'id', desc: false }]}
        />
      </div>

      <ModalDetalleRevision
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelecteddetalleRevision(undefined);
        }}
        detalleRevision={selecteddetalleRevision}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export default DetalleRevisionContent;

import { useEffect, useMemo, useState } from 'react';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';
import { DescuentoPlanillaModel } from './model/DescuentoPlanillamodel';
import ModalDescuentoPlanilla from './ModalDescuentoPlanilla';
import { formatCOP } from '@/utils/formatters';

interface DescuentoContentProps {
  reload: boolean;
}

const DescuentoPlanillaContent = ({ reload }: DescuentoContentProps) => {
  const storageFilterId = 'descuento-planilla-filter';
  const [descuentosRevision, setdescuentosRevision] = useState<DescuentoPlanillaModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDescuentoPlanilla, setSelectedDescuentoPlanilla] = useState<
    DescuentoPlanillaModel | undefined
  >(undefined);
  const { confirmAction } = useConfirm();
  const { enqueueSnackbar } = useSnackbar();

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<DescuentoPlanillaModel>[]>(
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
        id: 'Descuento',
        header: () => 'Descuento',
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
        accessorFn: (row) => row.porcentaje,
        id: 'porcentaje',
        header: () => 'Porcentaje',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.porcentaje}%
          </Link>
        ),
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.valor,
        id: 'valor',
        header: () => 'Valor',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {formatCOP(info.row.original.valor)}
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
              setSelectedDescuentoPlanilla(row.original);
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
                deleteDescuentoRevision(row.original.id)
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

  const fetchdescuentosRevision = async () => {
    setLoading(true);
    try {
      const response = await axios.get('descuentos_planilla');
      setdescuentosRevision(response.data);
    } catch (error) {
      setError('Error al cargar los medios de pago');
    } finally {
      setLoading(false);
    }
  };

  const deleteDescuentoRevision = async (idDescuento: number) => {
    try {
      const response = await axios.delete(`descuentos_planilla/${idDescuento}`);
      await fetchdescuentosRevision();
    } catch (error: any) {
      const mensaje =
        error.response?.data?.message || 'Error al eliminar el Descuento de revisión.';
      enqueueSnackbar(mensaje, { variant: 'error' });
      console.error('Error al eliminar el Descuento de revisión:', error);
    }
  };

  useEffect(() => {
    fetchdescuentosRevision();
  }, [reload]);

  const handleAfterSave = () => {
    fetchdescuentosRevision();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return descuentosRevision;
    return descuentosRevision.filter((detail) =>
      detail.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, descuentosRevision]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Descuentos Planilla</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Descuento"
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

      <ModalDescuentoPlanilla
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDescuentoPlanilla(undefined);
        }}
        descuentoPlanilla={selectedDescuentoPlanilla}
        onSave={handleAfterSave}
      />
    </div>
  );
};
export default DescuentoPlanillaContent;

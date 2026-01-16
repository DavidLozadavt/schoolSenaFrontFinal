import { useEffect, useMemo, useState } from 'react';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { ModalCentroCostos } from './ModalCentroCostos';
import { useConfirm } from '@/hooks';

interface ContentProps {
  reload: boolean;
}

const CentroCostosContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'centerC-filter';
  const [centrosCostos, setCentrosCostos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [centroCostos, setCentroCostos] = useState<any | undefined>(undefined);
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.codigo,
        id: 'codigo',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: {
          className: 'w-[100px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.sede,
        id: 'sede',
        header: () => 'Sede',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.sede?.nombre}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.area,
        id: 'area',
        header: () => 'Área',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.area?.nombre}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.presupuesto,
        id: 'presupuesto',
        header: () => 'Presupuesto',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'COP' }).format(
              info.row.original.presupuesto
            )}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.descripcion,
        id: 'descripcion',
        header: () => 'Descripción',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.descripcion}</span>,
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.ano,
        id: 'ano',
        header: () => 'Año',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.año}</span>,
        meta: {
          className: 'w-[100px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => <span className="text-sm font-medium ">{info.row.original.estado}</span>,
        meta: {
          className: 'w-[150px]',
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
              setIsModalOpen(true);
              setCentroCostos(row.original);
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
            onClick={() => {
              deletePaymentType(row.original.id);
            }}
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchCentros = async () => {
    setLoading(true);
    try {
      const response = await axios.get('cost_centers');
      setCentrosCostos(response.data);
    } catch (error) {
      setError('Error al cargar los centros de costos');
    } finally {
      setLoading(false);
    }
  };

  const deletePaymentType = async (id: number) => {
    confirmAction('Esta acción eliminará esta configuración.', async () => {
      try {
        await axios.delete(`cost_centers/${id}`);
        fetchCentros();
      } catch (err) {
        setError(`Error al eliminar el tipo de pago: ${err}`);
      }
    });
  };

  useEffect(() => {
    fetchCentros();
  }, [reload]);

  const handleAfterSave = () => {
    fetchCentros();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return centrosCostos;

    return centrosCostos.filter(
      (centroC) =>
        centroC.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroC.presupuesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroC.area?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroC.año.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroC.sede?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, centrosCostos]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Centros de Costo</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar Centros de Costo"
              className="pl-8 input input-sm"
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
        />
      </div>

      <ModalCentroCostos
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCentroCostos(undefined);
        }}
        data={centroCostos}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { CentroCostosContent };

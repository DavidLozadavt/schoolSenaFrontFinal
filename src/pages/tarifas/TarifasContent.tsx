import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { TarifasInterface } from './model/TarifasInterface';
import { ModalTarifas } from './ModalTarifas';
import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';

interface TarifasContentProps {
  reload: boolean;
}

const TarifasContent = ({ reload }: TarifasContentProps) => {
  const storageFilterId = 'tarifas-filter';
  const [tarifas, setTarifas] = useState<TarifasInterface[]>([]);
  const { confirmAction } = useConfirm();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTarifa, setSelectedTarifa] = useState<TarifasInterface | undefined>(undefined);

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<TarifasInterface>[]>(
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
        accessorFn: (row) => row.clase_vehiculo?.nombre || 'N/A',
        id: 'clase_vehiculo',
        header: () => 'Clase de Vehículo',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.clase_vehiculo?.nombre || 'N/A'}
          </Link>
        ),
        meta: {
          className: 'min-w-[200px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.tarifa,
        id: 'tarifa',
        header: () => 'Tarifa',
        enableSorting: true,
        cell: (info) => {
          const valor = Math.round(info.row.original.tarifa);
          const formatoColombiano = new Intl.NumberFormat('es-CO').format(valor);
          return <span className="text-gray-700">${formatoColombiano}</span>;
        },
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.porcentaje,
        id: 'porcentaje',
        header: () => 'Porcentaje',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.porcentaje !== null ? `${info.row.original.porcentaje}%` : '-'}
          </span>
        ),
        meta: {
          className: 'min-w-[120px]',
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
              setSelectedTarifa(row.original);
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
              const tarifa = row.original;
              confirmAction(
                `¿Estás seguro de eliminar la tarifa de ${tarifa.clase_vehiculo?.nombre || 'esta clase'}?`,
                async () => {
                  await handleDeleteTarifa(tarifa.id);
                }
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

  const fetchTarifas = async () => {
    setLoading(true);
    try {
      const response = await axios.get('clase_vehiculo_tarifas');
      setTarifas(response.data);
    } catch (error) {
      setError('Error al cargar las tarifas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTarifas();
  }, [reload]);

  const handleAfterSave = () => {
    fetchTarifas();
    setIsModalOpen(false);
  };

  const handleDeleteTarifa = async (tarifaId: number) => {
    try {
      await axios.delete(`clase_vehiculo_tarifas/${tarifaId}`);
      enqueueSnackbar('Tarifa eliminada correctamente.', {
        variant: 'success'
      });
      fetchTarifas();
    } catch (error) {
      enqueueSnackbar('Error al eliminar la tarifa.', {
        variant: 'error'
      });
      console.error('Error al eliminar tarifa:', error);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return tarifas;
    return tarifas.filter((tarifa) => {
      const clase_vehiculo = tarifa.clase_vehiculo?.nombre?.toLowerCase() || '';
      const tarifaValue = tarifa.tarifa.toString();
      const porcentajeValue = tarifa.porcentaje?.toString() || '';

      return (
        clase_vehiculo.includes(searchTerm.toLowerCase()) ||
        tarifaValue.includes(searchTerm) ||
        porcentajeValue.includes(searchTerm)
      );
    });
  }, [searchTerm, tarifas]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Tarifas</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar por clase, tarifa o porcentaje"
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
          sorting={[{ id: 'clase_vehiculo', desc: false }]}
        />
      </div>

      <ModalTarifas
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTarifa(undefined);
        }}
        tarifa={selectedTarifa}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { TarifasContent };

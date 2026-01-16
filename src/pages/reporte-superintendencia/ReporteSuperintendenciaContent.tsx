import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';

import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';

import clsx from 'clsx';
import { ModalReporteSuperintendencia } from './ModalReporteSuperintendencia';

interface contentProps {
  reload: boolean;
}

const ReporteSuperintendenciaContent = ({ reload }: contentProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const StorageFilteredId = 'filtered_report_superintendencia';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectItem, setSelectItem] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(StorageFilteredId) || '');

  const { confirmAction } = useConfirm();

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchData = async (search = '') => {
    try {
      const response = await axios.get('get_report_superintendencia', {
        params: { search }
      });

      setResults(response.data);
    } catch (err) {
      setError(`Error al cargar reportes: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: number | undefined) => {
    try {
      await axios.delete(`delete_report_superintendencia/${id}`);
      fetchData();
    } catch (err) {
      enqueueSnackbar('Error al eliminar el registro', { variant: 'error' });
    }
  };

  const handleAfterSave = () => {
    fetchData();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchData();
  }, [reload]);

  const handleDelete = (id?: number) => {
    confirmAction('Esta acción eliminará el registro ', () => deleteItem(id));
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'id',
        enableSorting: true,
        header: () => 'Código',
        cell: (info) => <span>{info.getValue() as number}</span>,
        meta: { className: 'w-[80px]' }
      },
      {
        id: 'responsable',
        header: () => 'Responsable',
        enableSorting: true,
        cell: ({ row }) => {
          const responsable = row.original?.nombreResponsable;
          if (!responsable) return <span className="text-gray-500">Sin responsable</span>;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{responsable}</span>
            </div>
          );
        },
        meta: { className: 'min-w-[200px]' }
      },
      {
        id: 'conductor',
        header: () => 'Conductor',
        enableSorting: true,
        cell: ({ row }) => {
          const persona = row.original?.nombreConductor;
          if (!persona) return <span className="text-gray-500">Sin conductor</span>;
          return <span className="text-gray-900 font-medium">{persona}</span>;
        },
        meta: { className: 'min-w-[180px]' }
      },
      {
        header: () => 'Vehículo',
        id: 'vehiculo',
        enableSorting: true,
        cell: ({ row }) => {
          const vehiculo = row.original?.placaVehiculo;
          return <span className="text-gray-900">{vehiculo || 'Sin placa'}</span>;
        },
        meta: { className: 'min-w-[120px]' }
      },
      {
        header: () => 'Fecha',
        id: 'fecha',
        enableSorting: true,
        cell: ({ row }) => {
          const fecha = row.original?.fechaCreacion;
          if (!fecha) return <span className="text-gray-500">Sin fecha</span>;

          const d = new Date(fecha);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();

          return <span className="text-gray-700">{`${day}-${month}-${year}`}</span>;
        },
        meta: { className: 'min-w-[130px]' }
      },
      {
        accessorKey: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => {
          let estado = info.getValue() as string | null;

          estado = estado ? estado.toUpperCase() : null;

          return (
            <span
              className={clsx('badge badge-outline', {
                'badge-primary': estado === 'ENVIADO',
                'badge-warning': estado === 'PENDIENTE',
                'badge-secondary': !estado
              })}
            >
              {estado || 'SIN ESTADO'}
            </span>
          );
        },
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700 font-medium' }
      },

      {
        id: 'edit',
        header: () => '',

        cell: ({ row }) => (
          <button
            onClick={() => {
              setSelectItem(row.original);
              setIsModalOpen(true);
            }}
            className="btn btn-sm btn-icon btn-clear btn-light"
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
            onClick={() => handleDelete(row.original.id)}
            className="btn btn-sm btn-icon btn-clear btn-light"
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
    if (!searchTerm) return results;

    return results.filter((e) => {
      const term = searchTerm.toLowerCase();

      const estado = (e.estado || '').toLowerCase();
      const fecha = e.created_at ? new Date(e.created_at).toLocaleDateString().toLowerCase() : '';
      const placa = (e.vehiculo_aux?.placa || '').toLowerCase();
      const persona =
        `${e.persona_aux?.nombre1 || ''} ${e.persona_aux?.apellido1 || ''}`.toLowerCase();
      const responsable =
        `${e.responsable?.persona?.nombre1 || ''} ${e.responsable?.persona?.apellido1 || ''}`.toLowerCase();
      const emailResponsable = (e.responsable?.email || '').toLowerCase();

      return (
        estado.includes(term) ||
        fecha.includes(term) ||
        placa.includes(term) ||
        persona.includes(term) ||
        responsable.includes(term) ||
        emailResponsable.includes(term)
      );
    });
  }, [searchTerm, results]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Reporte Aux</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar por placa o identificación..."
              className="pl-8 input input-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchData(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      <div className="card-body">
        <DataGrid
          key={JSON.stringify(results)}
          columns={columns}
          data={results}
          pagination={{ size: 10 }}
        />
      </div>

      <ModalReporteSuperintendencia
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectItem(undefined);
        }}
        data={selectItem}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { ReporteSuperintendenciaContent };

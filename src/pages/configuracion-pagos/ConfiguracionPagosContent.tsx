import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import { ModalConfiguracionPagos } from './ModalConfiguracionPagos';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';

interface contentProps {
  reload: boolean;
}

const ConfiguracionPagosContent = ({ reload }: contentProps) => {
  const StorageFilteredId = 'filtered_configuracion_pago';
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSelected, setDataSelected] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(StorageFilteredId) || '';
  });
  const { confirmAction } = useConfirm();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`configuraciones_pago`);
      setDatos(response.data);
    } catch (err) {
      setError(`Error fetching configuraciones de pago: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(
    async (id: number) => {
      confirmAction('Esta acción eliminará esta configuración de pago.', async () => {
        try {
          await axios.delete(`delete_configuracion_pago/${id}`);
          enqueueSnackbar('Configuración de pago eliminada exitosamente', { variant: 'success' });
          fetchData();
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            'Error al eliminar la configuración de pago';
          enqueueSnackbar(errorMessage, { variant: 'error' });
          throw err;
        }
      });
    },
    [confirmAction, enqueueSnackbar]
  );

  const handleAfterSave = () => {
    fetchData();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchData();
  }, [reload]);

  const columns = useMemo<ColumnDef<any>[]>(
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
        accessorFn: (row) => row.titulo,
        id: 'titulo',
        header: () => 'Título del Pago',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.titulo}
          </Link>
        ),
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.configuracionPagoVigenciaActual?.valor ?? row.valor,

        id: 'valor',

        header: () => 'Valor',

        enableSorting: true,

        cell: (info) => {
          const valor =
            info.row.original.configuracionPagoVigenciaActual?.valor ??
            info.row.original.valor ??
            0;

          return (
            <span className="text-gray-700">
              $
              {new Intl.NumberFormat('es-CO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(valor)}
            </span>
          );
        },

        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.asignacion_proceso_pago.proceso.nombrePrceso,
        id: 'proceso',
        header: () => 'Proceso',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.asignacion_proceso_pago?.proceso?.nombreProceso || 'N/A'}
          </Link>
        ),
        meta: { className: 'min-w-[250px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorKey: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => {
          const estado = info.row.original.estado as string;

          return (
            <span
              className={clsx('badge badge-outline', {
                'badge-primary': estado === 'ACTIVO',
                'badge-warning': estado === 'INACTIVO'
              })}
            >
              {estado}
            </span>
          );
        },
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setDataSelected(row.original);
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
    [handleDelete]
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return datos;

    const lowerTerm = searchTerm.toLowerCase();

    return datos.filter((item) => {
      const titulo = item.configuracion_pago?.titulo?.toLowerCase() || '';
      const proceso = item.proceso?.nombreProceso?.toLowerCase() || '';
      const valor = item.configuracion_pago?.valor?.toString() || '';

      return titulo.includes(lowerTerm) || proceso.includes(lowerTerm) || valor.includes(lowerTerm);
    });
  }, [searchTerm, datos]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Configuración de Pagos</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar..."
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

      <ModalConfiguracionPagos
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDataSelected(undefined);
        }}
        data={dataSelected}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { ConfiguracionPagosContent };

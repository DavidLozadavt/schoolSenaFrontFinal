import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';

import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';

import clsx from 'clsx';
import { ModalReemplazo } from './ModalReemplazo';

interface contentProps {
  reload: boolean;
}

const ReemplazosContent = ({ reload }: contentProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const StorageFilteredId = 'filtered_results_reemplazso';
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

  const fetchData = async () => {
    try {
      const response = await axios.get('get_reemplazos');
      setResults(response.data);
    } catch (err) {
      setError(`Error al cargar results: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAfterSave = () => {
    fetchData();
    setIsModalOpen(false);
  };

  const handleDelete = (id?: number) => {
    confirmAction('Esta acción eliminará el registro ', () => deleteItem(id));
  };

  const deleteItem = async (id: number | undefined) => {
    try {
      await axios.delete(`delete_reemplazo/${id}`);
      fetchData();
    } catch (err) {
      enqueueSnackbar('Error al eliminar el registro', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [reload]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
   
     {
        id: 'contrato_reemplazo',
        header: () => 'Trabajador Reemplazado',
        cell: ({ row }) => {
          const persona = row.original?.contrato_reemplazo?.persona;
          return (
            <div className="flex flex-col items-center">
              <img
                src={persona?.rutaFotoUrl || '/default/user.svg'}
                alt="Foto"
                className="w-10 h-10 rounded-full object-cover mb-2"
              />
              <span className="text-gray-700 font-medium text-center">
                {persona?.nombre1} {persona?.apellido1}
              </span>
              <span className="text-xs text-gray-500">CC: {persona?.identificacion}</span>
            </div>
          );
        },
        meta: { className: 'min-w-[150px]', cellClassName: 'items-center justify-center' }
      },
      {
        id: 'contrato_trabajador',
        header: () => 'Trabajador Reemplazante',
        cell: ({ row }) => {
          const persona = row.original?.contrato_trabajador?.persona;
          return (
            <div className="flex flex-col items-center">
              <img
                src={persona?.rutaFotoUrl || '/default/user.svg'}
                alt="Foto"
                className="w-10 h-10 rounded-full object-cover mb-2"
              />
              <span className="text-gray-700 font-medium text-center">
                {persona?.nombre1} {persona?.apellido1}
              </span>
              <span className="text-xs text-gray-500">CC: {persona?.identificacion}</span>
            </div>
          );
        },
        meta: { className: 'min-w-[150px]', cellClassName: 'items-center justify-center' }
      },
     
      {
        accessorKey: 'fechaInicial',
        header: () => 'Fecha Inicial',
        cell: (info) => <span className="text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700' }
      },
      {
        accessorKey: 'fechaFinal',
        header: () => 'Fecha Final',
        cell: (info) => <span className="text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700' }
      },
      {
        accessorKey: 'exedente',
        header: () => 'Excedente',
        cell: (info) => {
          const value = info.getValue<number>();
          return (
            <span className="text-sm font-medium text-gray-900">
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
              }).format(value || 0)}
            </span>
          );
        },
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'observacion',
        header: () => 'Observación',
        cell: (info) => <span className="text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700' }
      },
      {
        accessorKey: 'estado',
        header: () => 'Estado',
        cell: (info) => {
          const estado = info.getValue() as string;
          return (
            <span
              className={clsx('badge badge-outline', {
                'badge-success': estado === 'ACTIVO',
                'badge-danger': estado === 'FINALIZADO'
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
        cell: ({ row }) => {
          const pago = row.original?.pago;
          return (
            <button
              className="btn btn-sm btn-icon btn-clear btn-light"
              disabled={!!pago} 
              onClick={() => {
                if (pago) return;
                setSelectItem(row.original);
                setIsModalOpen(true);
              }}
            >
              <KeenIcon icon="notepad-edit" />
            </button>
          );
        },
        meta: { className: 'w-[60px]' }
      },
      {
        id: 'delete',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => {
          const pago = row.original?.pago;
          return (
            <button
              className="btn btn-sm btn-icon btn-clear btn-light"
              disabled={!!pago}
              onClick={() => handleDelete(row.original.id)}
            >
              <KeenIcon icon="trash" />
            </button>
          );
        },
        meta: { className: 'w-[60px]' }
      }
    ],
    /* eslint-disable react-hooks/exhaustive-deps */
    []
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return results;

    const term = searchTerm.toLowerCase();

    return results.filter((e) => {
      const trabajador = e.contrato_trabajador?.persona;
      const reemplazo = e.contrato_reemplazo?.persona;

      const nombreTrabajador =
        `${trabajador?.nombre1 || ''} ${trabajador?.apellido1 || ''}`.toLowerCase();
      const nombreReemplazo =
        `${reemplazo?.nombre1 || ''} ${reemplazo?.apellido1 || ''}`.toLowerCase();

      const identificacionTrabajador = (trabajador?.identificacion || '').toLowerCase();
      const identificacionReemplazo = (reemplazo?.identificacion || '').toLowerCase();

      const estado = (e.estado || '').toLowerCase();
      const observacion = (e.observacion || '').toLowerCase();
      const exedente = String(e.exedente || '').toLowerCase();
      const fechaInicial = (e.fechaInicial || '').toLowerCase();
      const fechaFinal = (e.fechaFinal || '').toLowerCase();

      return (
        nombreTrabajador.includes(term) ||
        nombreReemplazo.includes(term) ||
        identificacionTrabajador.includes(term) ||
        identificacionReemplazo.includes(term) ||
        estado.includes(term) ||
        observacion.includes(term) ||
        exedente.includes(term) ||
        fechaInicial.includes(term) ||
        fechaFinal.includes(term)
      );
    });
  }, [searchTerm, results]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Reemplazos</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar ..."
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

      <ModalReemplazo
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
export { ReemplazosContent };

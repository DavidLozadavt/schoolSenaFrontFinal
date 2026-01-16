import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import { ModalConfiguracionPagos } from './ModalConfiguracionPagos';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface contentProps {
  reload: boolean;
}

const ConfiguracionPagosContent = ({ reload }: contentProps) => {
  const StorageFilteredId = 'filtered_idTipoDocumento';
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSelected, setDataSelected] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(StorageFilteredId) || '';
  });

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`configuraciones_pago`);
      setDatos(response.data);
    } catch (err) {
      setError(`Error fetching payment methods: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteData = async (id: number) => {
    try {
      await axios.delete(`delete_configuracion_pago/${id}`);
      setDatos((data) => data.filter((data) => data.id !== id));
    } catch (err) {
      console.log(`Error deleting data: ${err}`);
    }
  };

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
        accessorFn: (row) => row.configuracion_pago.titulo,
        id: 'titulo',
        header: () => 'Título del Pago',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.configuracion_pago.titulo}
          </Link>
        ),
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.configuracion_pago.valor,
        id: 'valor',
        header: () => 'Valor',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            $
            {new Intl.NumberFormat('es-CO', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(info.row.original.configuracion_pago.valor)}
          </span>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.proceso.nombreProceso,
        id: 'proceso',
        header: () => 'Proceso',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.proceso.nombreProceso}
          </Link>
        ),
        meta: { className: 'min-w-[250px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorKey: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => {
          const estado = info.row.original.configuracion_pago.estado as string;

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
            onClick={() => {
              if (
                window.confirm(
                  `¿Estás seguro de que deseas eliminar el pago: ${row.original.configuracion_pago.titulo}?`
                )
              ) {
                deleteData(row.original.id);
              }
            }}
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      }
    ],
    []
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

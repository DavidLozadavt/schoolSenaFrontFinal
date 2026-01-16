import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';

import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';

import clsx from 'clsx';
import { ModalBonificacion } from './ModalBonificacion';

interface contentProps {
  reload: boolean;
}

const BonificacionContent = ({ reload }: contentProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const StorageFilteredId = 'filtered_bonificaciones';
  const [bonificaciones, setBonificaciones] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bonificacion, setBonificacion] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(StorageFilteredId) || '');

  const { confirmAction } = useConfirm();

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchBonificaciones = async () => {
    try {
      const response = await axios.get('get_bonificaciones');
      setBonificaciones(response.data);
    } catch (err) {
      setError(`Error al cargar bonificaciones: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAfterSave = () => {
    fetchBonificaciones();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchBonificaciones();
  }, [reload]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'trabajador',
        header: () => 'Trabajador',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col items-center">
            <img
              src={row.original?.contrato?.persona?.rutaFotoUrl || '/default/user.svg'}
              alt="Foto"
              className="w-10 h-10 rounded-full object-cover mb-2"
            />
            <span className="text-gray-700 font-medium text-center">
              {row.original?.contrato?.persona?.nombre1}{' '}
              {row.original?.contrato?.persona?.apellido1}
            </span>
          </div>
        ),
        meta: { className: 'min-w-[130px]', cellClassName: 'items-center justify-center' }
      },
      {
        id: 'identificacion',
        enableSorting: true,
        header: () => 'Identificación',
        cell: ({ row }) => (
          <span className="text-gray-700">{row.original?.contrato?.persona?.identificacion}</span>
        ),
        meta: { className: 'min-w-[130px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorKey: 'descripcion',
        header: () => 'Descripción',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'valor',
        header: () => 'Valor',
        enableSorting: true,
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
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'fechaInicial',
        header: () => 'Fecha Inicial',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorKey: 'fechaFinal',
        header: () => 'Fecha Final',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorKey: 'observacion',
        header: () => 'Observación',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorKey: 'frecuencia',
        header: () => 'Frecuencia',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => {
          const estado = info.getValue() as string;
          return (
            <span
              className={clsx('badge badge-outline', {
                'badge-danger': estado === 'FINALIZADP',
                'badge-primary': estado === 'APROBADO',
                'badge-warning': estado === 'PENDIENTE'
              })}
            >
              {estado}
            </span>
          );
        },
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700 font-medium' }
      }
    ],
    []
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return bonificaciones;

    const term = searchTerm.toLowerCase();

    return bonificaciones.filter((e) => {
      const persona = e.contrato?.persona;
      const nombre = `${persona?.nombre1 || ''} ${persona?.apellido1 || ''}`.toLowerCase();
      const estado = (e.estado || '').toLowerCase();
      const fechaInicio = (e.fechaInicio || '').toLowerCase();
      const fechaFin = (e.fechaFin || '').toLowerCase();

      return (
        nombre.includes(term) ||
        estado.includes(term) ||
        fechaInicio.includes(term) ||
        fechaFin.includes(term)
      );
    });
  }, [searchTerm, bonificaciones]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Bonificaciones</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar .."
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

      <ModalBonificacion
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBonificacion(undefined);
        }}
        data={bonificacion}
        onSave={handleAfterSave}
      />
    </div>
  );
};
export { BonificacionContent };

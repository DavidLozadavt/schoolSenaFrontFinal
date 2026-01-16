import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';

import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';

import clsx from 'clsx';
import { ModalHorasExtraAdmin } from './ModalHorasExtraAdmin';
import { ModalObservacacionesHorasExtra } from '../ModalObservacacionesHorasExtra';
import { ModalConfirmarHorasExtraAdmin } from './ModalConfirmarHorasExtraAdmin';

interface contentProps {
  reload: boolean;
}

const HorasExtraAdminContent = ({ reload }: contentProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const StorageFilteredId = 'filtered_horas_extra_admin';
  const [horasExtra, setHorasExtra] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [horaExtra, setHoraExtra] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(StorageFilteredId) || '');
  const [isModalOpenObservacion, setIsModalOpenObservacion] = useState(false);
  const [isModalOpenComentario, setIsModalOpenComentario] = useState(false);
  const [solicitud, setSolicitud] = useState<any | undefined>(undefined);
  const { confirmAction } = useConfirm();

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchHorasExtra = async () => {
    try {
      const response = await axios.get('horas_extra_supervisor');
      setHorasExtra(
        response.data ? (Array.isArray(response.data) ? response.data : [response.data]) : []
      );
    } catch (err) {
      setError(`Error al cargar horas extra: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteHoraExtra = async (id: number | undefined) => {
    try {
      await axios.delete(`horas_extra_trabajador/${id}`);
      fetchHorasExtra();
    } catch (err) {
      enqueueSnackbar('Error al eliminar el registro', { variant: 'error' });
    }
  };

  const handleAfterSave = () => {
    fetchHorasExtra();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchHorasExtra();
  }, [reload]);

  const handleDelete = (id?: number) => {
    confirmAction('Esta acción eliminará el registro de hora extra', () => deleteHoraExtra(id));
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'w-[80px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        id: 'trabajador',
        header: () => 'Trabajador',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col items-center">
            <img
              src={row.original?.contrato?.persona?.rutaFotoUrl}
              alt="Foto"
              className="w-10 h-10 rounded-full object-cover mb-2"
            />
            <span className="text-gray-700 font-medium text-center">
              {row.original.contrato?.persona?.nombre1} {row.original.contrato?.persona?.apellido1}
            </span>
          </div>
        ),
        meta: {
          className: 'min-w-[130px]',
          cellClassName: 'items-center justify-center'
        }
      },
      {
        accessorFn: (row) => row.identificacion,
        id: 'identificacion',
        header: () => 'Identificación',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original?.contrato?.persona?.identificacion}
          </span>
        ),
        meta: {
          className: 'min-w-[130px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorKey: 'numeroHoras',
        header: () => 'Número de Horas',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as number}</span>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-medium' }
      },

      {
        accessorKey: 'configuracion_hora_extra.detalle',
        header: () => 'Configuración Horas Extra',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as number}</span>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'valorHoraExtra',
        header: () => 'Valor',
        enableSorting: true,
        cell: (info) => {
          const value = info.getValue<number | null>();
          if (!value && value !== 0) {
            return <span className="text-sm font-medium text-gray-500">No aplica</span>;
          }
          const formatted = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(value);
          return <span className="text-sm font-medium text-gray-900">{formatted}</span>;
        },
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorFn: (row) => row.fecha,
        id: 'fecha',
        header: () => 'Fecha',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original?.fecha}</span>,
        meta: {
          className: 'min-w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
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
                'badge-danger': estado === 'RECHAZADO',
                'badge-primary': estado === 'APROBADO',
                'badge-warning': estado === 'PENDIENTE'
              })}
            >
              {estado}
            </span>
          );
        },
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700 font-medium' }
      },

      {
        id: 'acciones',
        header: () => 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const estado = row.original.estado;

          return (
            <div className="flex items-center justify-center gap-2">
              {estado !== 'APROBADO' && (
                <button
                  className="p-2 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                  title="Aceptar"
                  onClick={() => {
                    setIsModalOpenComentario(true);
                    setSolicitud(row.original);
                  }}
                >
                  <KeenIcon icon="double-check" className="text-xl text-green-600" />
                </button>
              )}

              <button
                className="p-2 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                title="Observación"
                onClick={() => {
                  setIsModalOpenObservacion(true);
                  setSolicitud(row.original);
                }}
              >
                <KeenIcon icon="messages" className="text-xl text-blue-600" />
              </button>
            </div>
          );
        },
        meta: {
          className: 'w-[100px]'
        }
      }
    ],
    []
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return horasExtra;
    return horasExtra.filter((e) =>
      (e.estado || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, horasExtra]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Horas Extra</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar por estado..."
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

      <ModalHorasExtraAdmin
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setHoraExtra(undefined);
        }}
        data={horaExtra}
        onSave={handleAfterSave}
      />

      <ModalObservacacionesHorasExtra
        open={isModalOpenObservacion}
        onClose={() => {
          setIsModalOpenObservacion(false);
          setSolicitud(undefined);
        }}
        data={solicitud}
      />

      <ModalConfirmarHorasExtraAdmin
        open={isModalOpenComentario}
        onClose={() => {
          setIsModalOpenComentario(false);
        }}
        onSave={handleAfterSave}
        data={solicitud}
      />
    </div>
  );
};

export { HorasExtraAdminContent };

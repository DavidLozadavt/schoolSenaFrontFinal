import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';

import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';

import clsx from 'clsx';
import { ModalOtrasDeducciones } from './ModalOtrasDeducciones';
import { ModalConfirmarDeduccion } from './ModalConfirmarDeduccion';

interface contentProps {
  reload: boolean;
}

const OtrasDeducciones = ({ reload }: contentProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const StorageFilteredId = 'filtered_deducciones';
  const [deducciones, setDeducciones] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deduccion, setDeduccion] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(StorageFilteredId) || '');
  const [isModalOpenFinalizar, setIsModalFinalizar] = useState(false);
  const { confirmAction } = useConfirm();

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchDeducciones = async () => {
    try {
      const response = await axios.get('get_deducciones');
      setDeducciones(response.data);
    } catch (err) {
      setError(`Error al cargar deducciones: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteDeduccion = async (id: number | undefined) => {
    try {
      await axios.delete(`get_deducciones/${id}`);
      fetchDeducciones();
    } catch (err) {
      enqueueSnackbar('Error al eliminar el registro', { variant: 'error' });
    }
  };

  const handleAfterSave = () => {
    fetchDeducciones();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchDeducciones();
  }, [reload]);

  const handleDelete = (id?: number) => {
    confirmAction('Esta acción eliminará el registro de deducción', () => deleteDeduccion(id));
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
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
        accessorKey: 'tipo_concepto.nombre',
        header: () => 'Descripción',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'valor',
        header: () => 'Valor Parcial',
        enableSorting: true,
        cell: (info) => {
          const row = info.row.original;
          const valor = row.valor ?? 0;
          const coutasPagadas = row.coutasPagadas ?? 0;
          const calculado = valor * coutasPagadas;

          if (!calculado && calculado !== 0) {
            return <span className="text-sm font-medium text-gray-500">No aplica</span>;
          }

          const formatted = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(calculado);

          return <span className="text-sm font-medium text-gray-900">{formatted}</span>;
        },
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'valorFinal',
        header: () => 'Valor Final',
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
        id: 'fechaInicio',
        header: () => 'Fecha Inicio',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original?.fechaInicio}</span>,
        meta: {
          className: 'min-w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaFin,
        id: 'fechaFin',
        header: () => 'Fecha Final',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original?.fechaFin}</span>,
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
          const archivoUrl = row.original.archivoUrl;
          const estado = row.original.estado;

          return (
            <div className="flex items-center justify-center gap-2">
              {archivoUrl && !archivoUrl.includes('default/user.svg') && (
                <button
                  title="Ver Archivo Comprobante"
                  className="btn btn-sm btn-icon btn-light btn-success"
                  onClick={() => window.open(archivoUrl, '_blank')}
                >
                  <KeenIcon icon="eye" />
                </button>
              )}

              {/* {estado === 'APROBADO' && (
                <button
                  title="Finalizar"
                  className="btn btn-sm btn-icon btn-light btn-success"
                  onClick={() => {
                    setIsModalFinalizar(true);
                    setDeduccion(row.original);
                  }}
                >
                  <KeenIcon icon="check" />
                </button>
              )} */}
            </div>
          );
        }
      }
    ],
    []
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return deducciones;

    const term = searchTerm.toLowerCase();

    return deducciones.filter((e) => {
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
  }, [searchTerm, deducciones]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Deducciones</h3>
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

      <ModalOtrasDeducciones
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDeduccion(undefined);
        }}
        data={deduccion}
        onSave={handleAfterSave}
      />

      <ModalConfirmarDeduccion
        open={isModalOpenFinalizar}
        onClose={() => {
          setIsModalFinalizar(false);
          setDeduccion(undefined);
        }}
        data={deduccion}
        onSave={handleAfterSave}
      />
    </div>
  );
};
export { OtrasDeducciones };

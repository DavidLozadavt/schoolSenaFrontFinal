import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';

import { useConfirm } from '@/hooks';

import { TerceroInterface } from '../registrar-compra/models/TerceroInterface';
import { ModalSocio } from './ModalSocio';



interface ContentProps {
  reload: boolean;
}

const SociosContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'terceroCompra-filter';
  const [terceros, setTerceros] = useState<TerceroInterface[]>([]);
  const [tercero, setTercero] = useState<TerceroInterface | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const handleTercero = useCallback(
    (tercero: TerceroInterface) => {
      navigate(`/gestion-cuentas/aportes-socios/registrar-aporte`, { state: tercero });
    },
    [navigate]
  );

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.nombre,
        id: 'nombre',
        header: () => 'Razón Social',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.nombre}</span>,
        meta: {
          className: 'min-w-[220px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.identificacion,
        id: 'identificacion',
        header: () => 'Nit',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.identificacion} - {info.row.original.digitoVerficacion}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.email,
        id: 'email',
        header: () => 'Correo',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.email}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.direccion,
        id: 'direccion',
        header: () => 'Dirección',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.direccion}</span>,
        meta: {
          className: 'min-w-[110px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.telefono,
        id: 'telefono',
        header: () => 'Teléfono',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.telefono}</span>,
        meta: {
          className: 'min-w-[110px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        id: 'shop',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
          title='Registrar aporte'
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              handleTercero(row.original);
            }}
          >
            <KeenIcon icon="dollar" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
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
              setTercero(row.original);
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
              deleteTercero(row.original.id);
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

  const fetchTerceros = async () => {
    setLoading(true);
    try {
      const response = await axios.get('get_socios');
      setTerceros(response.data);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };

  const deleteTercero = async (id: number) => {
    confirmAction('Esta acción eliminará este tercero.', async () => {
      try {
        await axios.delete(`terceros/${id}`);
        fetchTerceros();
      } catch (err) {
        setError(`Error al eliminar : ${err}`);
      }
    });
  };

  useEffect(() => {
    fetchTerceros();
  }, [reload]);

  const handleAfterSave = () => {
    fetchTerceros();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return terceros;

    return terceros.filter((tercero) => {
      const term = searchTerm.toLowerCase();

      return (
        tercero.nombre?.toLowerCase().includes(term) ||
        tercero.identificacion?.toLowerCase().includes(term) ||
        tercero.email?.toLowerCase().includes(term) ||
        tercero.direccion?.toLowerCase().includes(term) ||
        tercero.telefono?.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, terceros]);

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Socios</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar socio"
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
        />
      </div>

      <ModalSocio
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTercero(undefined);
        }}
        data={tercero}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { SociosContent };

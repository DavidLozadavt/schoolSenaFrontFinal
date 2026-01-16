import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';

import { useConfirm } from '@/hooks';
import { ModalComision } from './ModalComision';

interface ContentProps {
  reload: boolean;
}

const ComisionContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'comision-filter';
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comision, setComision] = useState<any | undefined>(undefined);
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
        accessorFn: (row) => row.valorMenor,
        id: 'valorMenor',
        header: () => 'Valor Menor',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'COP' }).format(
              info.row.original.valorMenor
            )}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.valorMayor,
        id: 'valorMayor',
        header: () => 'Valor Mayor',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'COP' }).format(
              info.row.original.valorMayor
            )}
          </span>
        ),
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
        cell: (info) => <span className="text-gray-700">{info.row.original.porcentaje} %</span>,
        meta: {
          className: 'min-w-[150px]',
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
              setComision(row.original);
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
              deleteComision(row.original.id);
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

  const fetchComisiones = async () => {
    setLoading(true);
    try {
      const response = await axios.get('comisiones');
      setComisiones(response.data);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };

  const deleteComision = async (id: number) => {
    confirmAction('Esta acción eliminará esta comisión.', async () => {
      try {
        await axios.delete(`comisiones/${id}`);
        fetchComisiones();
      } catch (err) {
        setError(`Error al eliminar : ${err}`);
      }
    });
  };

  useEffect(() => {
    fetchComisiones();
  }, [reload]);

  const handleAfterSave = () => {
    fetchComisiones();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return comisiones;

    return comisiones.filter((dat) => {
      const porcentaje = String(dat.porcentaje || '').toLowerCase();
      const valorMayor = String(dat.valorMayor || '').toLowerCase();
      const valorMenor = String(dat.valorMenor || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      return (
        porcentaje.includes(search) || valorMayor.includes(search) || valorMenor.includes(search)
      );
    });
  }, [searchTerm, comisiones]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Comisiones</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Comisiones"
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

      <ModalComision
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setComision(undefined);
        }}
        data={comision}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { ComisionContent };

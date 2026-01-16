import React, { useEffect, useMemo, useState } from 'react';
import { Conecctions } from './model/ConexionesInterface';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { DataGrid } from '@/components/data-grid';
import ModalConexiones from './ModalConexiones';

interface ConectionsProps {
  reload: boolean;
}
function ConexionesContent({ reload }: ConectionsProps) {
  const storageFilterId = 'Conexion-filter';
  const [conexiones, setconexiones] = useState<Conecctions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [selectedConexion, setSelectedConexion] = useState<Conecctions | undefined>(undefined);

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<Conecctions>[]>(
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
        accessorFn: (row) => row.usc,
        id: 'usc',
        header: () => 'USC',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.usc}
          </Link>
        ),

        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.psc,
        id: 'psc',
        header: () => 'PSC',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.psc}
          </Link>
        ),

        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.h,
        id: 'h',
        header: () => 'H',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.h}
          </Link>
        ),

        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.port,
        id: 'port',
        header: () => 'Port',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.port}
          </Link>
        ),

        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.nbd,
        id: 'nbd',
        header: () => 'NBD',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.nbd}
          </Link>
        ),

        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.nombre,
        id: 'nombre',
        header: () => 'Nombre',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.nombre}
          </Link>
        ),

        meta: {
          className: 'min-w-[250px]',
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
              setSelectedConexion(row.original);
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
              if (
                window.confirm(
                  `¿Estás seguro de que deseas eliminar el Conexion: ${row.original.nombre}?`
                )
              ) {
                deleteconecction(row.original.id);
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

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchconecction = async () => {
    setLoading(true);
    try {
      const response = await axios.get('conexiones_source');
      setconexiones(response.data);
    } catch (error) {
      setError('Error al cargar los conexiones');
    } finally {
      setLoading(false);
    }
  };

  const deleteconecction = async (id: number) => {
    try {
      await axios.delete(`conexiones_source/${id}`);
      setconexiones((prevconecction) => prevconecction.filter((conecction) => conecction.id !== id));
      enqueueSnackbar('Conexion eliminada correctamente', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(`Error al eliminar el Conexion: ${err}`, { variant: 'error' });
    }
  };

  const handleAfterSave = () => {
    fetchconecction();
    setIsModalOpen(false);
    enqueueSnackbar('Conexion Actualizado', { variant: 'success' });
  };

  useEffect(() => {
    fetchconecction();
  }, [reload]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return conexiones;
    return conexiones.filter((pros) =>
      pros.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, conexiones]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">conexiones</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Medio de Pago"
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

      <ModalConexiones
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedConexion(undefined);
        }}
        conecction={selectedConexion}
        onSave={handleAfterSave}
      />
    </div>
  );
}

export default ConexionesContent;

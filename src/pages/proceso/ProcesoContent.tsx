import React, { useEffect, useMemo, useState } from 'react';

import { ProcesoInterface } from './model/ProcesoInterface';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import axios from 'axios';
import { DataGrid } from '@/components';
import ModalProceso from './ModalProceso';
import { enqueueSnackbar, useSnackbar } from 'notistack';


interface ProcesoProps {
  reload: boolean;
}
const ProcesoContent = ({ reload }: ProcesoProps) => {
  const storageFilterId = 'proceso-filter';
  const [procesos, setProcesos] = useState<ProcesoInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [selectedProceso, setSelectedProceso] = useState<ProcesoInterface | undefined>(
    undefined
  );

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });


  const columns = useMemo<ColumnDef<ProcesoInterface>[]>(
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
        accessorFn: (row) => row.nombreProceso,
        id: 'nombrePros',
        header: () => 'Nombre Proceso',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.nombreProceso}
          </Link>
        ),

        
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.descripcion,
        id: 'descripcion',
        header: () => 'Descripción',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.descripcion}
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
              setSelectedProceso(row.original);
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
              if (window.confirm(`¿Estás seguro de que deseas eliminar el proceso: ${row.original.nombreProceso}?`)) {
                deleteProcess(row.original.id);
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


  const fetchProcess = async () => {
    setLoading(true);
    try {
      const response = await axios.get('procesos');
      setProcesos(response.data);
    } catch (error) {
      setError('Error al cargar los procesos');
    } finally {
      setLoading(false);
    }
  };


  const deleteProcess = async (id: number) => {
    try {
      await axios.delete(`procesos/${id}`);
      setProcesos((prevProcess) =>
        prevProcess.filter((process) => process.id !== id)
      );
      enqueueSnackbar('Proceso eliminado correctamente', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(`Error al eliminar el proceso: ${err}`, { variant: 'error' });
    }
  };

  const handleAfterSave = () => {
    fetchProcess();
    setIsModalOpen(false);
    enqueueSnackbar('Proceso Actualizado', { variant: 'success' });
  };

  useEffect(() => {
    fetchProcess();
  }, [reload]);


  const filteredData = useMemo(() => {
    if (!searchTerm) return procesos;
    return procesos.filter((pros) =>
      pros.nombreProceso.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, procesos]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Procesos</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Procesos"
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

      <ModalProceso
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProceso(undefined);
        }}
        process={selectedProceso}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export default ProcesoContent;

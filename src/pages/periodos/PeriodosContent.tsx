import React, { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataGrid } from '@/components';
import { KeenIcon } from '@/components/keenicons';
import ModalPeriodo, { PeriodoInterface } from './ModalPeriodo';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import { enqueueSnackbar } from 'notistack';

interface Periodo {
  id: string;
  nombrePeriodo: string;
  fechaInicial: string;
  fechaFinal: string;
}

interface PeriodosProps {
  reload?: boolean;
}

const PeriodosContent: React.FC<PeriodosProps> = ({ reload = false }) => {
  const storageFilterId = 'periodo-filter';
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodoInterface | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { confirmAction } = useConfirm();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchPeriodos();
  }, [reload]);

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const deletePeriodo = (id: string) => {
    confirmAction('¿Eliminar este periodo permanentemente?', async () => {
      try {
        await axios.delete(`periodos/${id}`);
        fetchPeriodos();
        enqueueSnackbar('Periodo eliminado correctamente', {
          variant: 'success'
        });
      } catch (err) {
        console.error('❌ Error eliminando periodo', err);

        enqueueSnackbar('Error al eliminar el periodo', {
          variant: 'error'
        });
      }
    });
  };

  const openEdit = (p: Periodo) => {
    setSelectedPeriodo({
      id: p.id,
      nombrePeriodo: p.nombrePeriodo,
      fechaInicio: p.fechaInicial,
      fechaFin: p.fechaFinal
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPeriodo(undefined);
  };

  const handleAfterSave = async () => {
    setIsModalOpen(false);
    setSelectedPeriodo(undefined);
    fetchPeriodos();
  };

  const columns = useMemo<ColumnDef<Periodo>[]>(
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
        accessorFn: (row) => row.nombrePeriodo,
        id: 'nombre',
        header: () => 'Nombre periodo',
        enableSorting: true,
        cell: (info) => (
          <span className="leading-none font-medium text-sm text-gray-900">
            {info.row.original.nombrePeriodo}
          </span>
        ),
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaInicial,
        id: 'fechaInicio',
        header: () => 'Fecha Inicial',
        enableSorting: true,
        cell: (info) => (
          <span className="leading-none font-medium text-sm text-gray-900">
            {info.row.original.fechaInicial}
          </span>
        ),
        meta: {
          className: 'min-w-[160px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaFinal,
        id: 'fechaFin',
        header: () => 'Fecha Final',
        enableSorting: true,
        cell: (info) => (
          <span className="leading-none font-medium text-sm text-gray-900">
            {info.row.original.fechaFinal}
          </span>
        ),
        meta: {
          className: 'min-w-[160px]',
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
            onClick={() => openEdit(row.original)}
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
              deletePeriodo(row.original.id);
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

  const fetchPeriodos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('periodos');
      setPeriodos(response.data);
    } catch (error) {
      setError('Error al cargar los periodos');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return periodos;

    return periodos.filter((p) => p.nombrePeriodo.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, periodos]);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Cargando periodos...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Periodos</h3>

        <div className="flex gap-6 items-center">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Periodos"
              className="input input-sm pl-8"
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

      <ModalPeriodo
        open={isModalOpen}
        periodo={selectedPeriodo}
        onClose={handleModalClose}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export default PeriodosContent;

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';

import { useConfirm } from '@/hooks';
import { ModalTipoIncapacidad } from './ModalTipoIncapacidad';
import { TipoIncapacidadInterface } from './models/TipoIncapacidadInterface';

interface ContentProps {
  reload: boolean;
}


const TipoIncapacidadesContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'tipoIncapcidad-filter';
  const [incapacidades, setIncapacidades] = useState<TipoIncapacidadInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incapacidad, setIncapacidad] = useState<TipoIncapacidadInterface | undefined>(undefined);
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

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
        accessorFn: (row) => row.tipoIncapacidad,
        id: 'tipoIncapacidad',
        header: () => 'Tipo de Incapacidad',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.tipoIncapacidad}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.responsable,
        id: 'responsable',
        header: () => 'Responsable',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.responsable}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.porcentajeDePagoEmpleador ,
        id: 'porcentajeDePagoEmpleador ',
        header: () => 'Porcentaje de Pago',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">{info.row.original.porcentajeDePagoEmpleador }%</span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.duracionCubierta,
        id: 'duracionCubierta',
        header: () => 'Duración Cubierta',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.duracionCubierta}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.descripcion,
        id: 'descripcion',
        header: () => 'Descripción',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.descripcion}</span>,
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
              setIsModalOpen(true);
              setIncapacidad(row.original);
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
              deleteTipoIncapacidad(row.original.id);
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

  const fetchTipoIncapacidades = async () => {
    setLoading(true);
    try {
      const response = await axios.get('tipos_incapacidades');
      setIncapacidades(response.data);
    } catch (error) {
      setError('Error al cargar los tipos de incapacidad');
    } finally {
      setLoading(false);
    }
  };

  const deleteTipoIncapacidad = async (id: number) => {
    confirmAction('Esta acción eliminará este tipo de Incapacidad.', async () => {
      try {
        await axios.delete(`tipos_incapacidades/${id}`);
        fetchTipoIncapacidades();
      } catch (err) {
        setError(`Error al eliminar el tipo de pago: ${err}`);
      }
    });
  };

  useEffect(() => {
    fetchTipoIncapacidades();
  }, [reload]);

  const handleAfterSave = () => {
    fetchTipoIncapacidades();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return incapacidades;

    return incapacidades.filter(
      (centroC) =>
        centroC.tipoIncapacidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroC.responsable?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroC.porcentajeDePagoEmpleador .toString().includes(searchTerm) ||
        centroC.duracionCubierta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroC.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, incapacidades]);

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Tipos de Incapacidad</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Tipos de Incapacidad"
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

      <ModalTipoIncapacidad
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIncapacidad(undefined);
        }}
        data={incapacidad}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { TipoIncapacidadesContent };

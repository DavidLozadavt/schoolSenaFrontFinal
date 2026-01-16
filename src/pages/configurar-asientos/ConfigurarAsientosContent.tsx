import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { MapaAsientosInterface } from './model/MapaAsientosInterface';
import { ModalConfigurarAsientos } from './ModalConfigurarAsientos';
import { ModalPreviewMapa } from './ModalPreviewMapa';
import { useConfirm } from '@/hooks';

interface ConfigurarAsientosContentProps {
  reload: boolean;
}

const ConfigurarAsientosContent = ({ reload }: ConfigurarAsientosContentProps) => {
  const storageFilterId = 'mapas-asientos-filter';
  const { enqueueSnackbar } = useSnackbar();
    const { confirmAction } = useConfirm();
  
  const [mapasAsientos, setMapasAsientos] = useState<MapaAsientosInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedMapa, setSelectedMapa] = useState<MapaAsientosInterface | undefined>(undefined);

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<MapaAsientosInterface>[]>(
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
        accessorFn: (row) => row.nombreMapa,
        id: 'nombreMapa',
        header: () => 'Nombre del Mapa',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.nombreMapa}
          </Link>
        ),
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.claseVehiculo?.nombre || 'N/A',
        id: 'clase_vehiculo',
        header: () => 'Clase de Vehículo',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.claseVehiculo?.nombre || 'Sin asignar'}
          </span>
        ),
        meta: {
          className: 'min-w-[180px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.cantidadAsientos,
        id: 'cantidadAsientos',
        header: () => 'Cantidad Asientos',
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center gap-2">
            <KeenIcon icon="abstract-26" className="w-4 h-4 text-blue-600" />
            <span className="text-gray-700">{info.row.original.cantidadAsientos}</span>
          </div>
        ),
        meta: {
          className: 'w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.tipoDistribucion,
        id: 'tipoDistribucion',
        header: () => 'Distribución',
        enableSorting: true,
        cell: (info) => (
          <span className="badge badge-sm badge-outline badge-primary">
            {info.row.original.tipoDistribucion}
          </span>
        ),
        meta: {
          className: 'w-[130px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.ladoPuerta,
        id: 'ladoPuerta',
        header: () => 'Puerta',
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center gap-2">
            <KeenIcon 
              icon={info.row.original.ladoPuerta === 'izquierda' ? 'arrow-left' : 'arrow-right'} 
              className="w-4 h-4 text-amber-600" 
            />
            <span className="text-gray-700 capitalize">{info.row.original.ladoPuerta}</span>
          </div>
        ),
        meta: {
          className: 'w-[130px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        id: 'preview',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setSelectedMapa(row.original);
              setIsPreviewModalOpen(true);
            }}
            title="Ver preview del mapa"
          >
            <KeenIcon icon="eye" />
          </button>
        ),
        meta: {
          className: 'w-[60px]'
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
              setSelectedMapa(row.original);
              setIsModalOpen(true);
            }}
            title="Editar mapa"
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
              const mapa = row.original;
              confirmAction(
                `¿Estás seguro de eliminar el mapa "${mapa.nombreMapa}" con ${mapa.cantidadAsientos} asientos?`,
                async () => {
                  await handleDelete(mapa.id);
                }
              );
            }}
            title="Eliminar mapa"
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: {
          className: 'w-[60px]'
        }
      }
    ],
    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchMapasAsientos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/mapas-asientos');
      if (response.data.success) {
        setMapasAsientos(response.data.data || []);
      } else {
        setMapasAsientos([]);
      }
    } catch (error) {
      console.error('Error al cargar mapas:', error);
      setError('Error al cargar los mapas de asientos');
      enqueueSnackbar('Error al cargar los mapas de asientos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapasAsientos();
  }, [reload]);

  const handleAfterSave = () => {
    fetchMapasAsientos();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await axios.delete(`/mapas-asientos/${id}`);
      if (response.data.success) {
        enqueueSnackbar('Mapa eliminado exitosamente', { variant: 'success' });
        fetchMapasAsientos();
      } else {
        enqueueSnackbar('Error al eliminar el mapa', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error al eliminar mapa:', error);
      enqueueSnackbar('Error al eliminar el mapa', { variant: 'error' });
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return mapasAsientos;
    return mapasAsientos.filter((mapa) =>
      mapa.nombreMapa.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, mapasAsientos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <KeenIcon icon="loading" className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <KeenIcon icon="information-circle" className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Mapas de Asientos</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar mapa de asientos"
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
          sorting={[{ id: 'nombreMapa', desc: false }]}
        />
      </div>

      <ModalConfigurarAsientos
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMapa(undefined);
        }}
        mapa={selectedMapa}
        onSave={handleAfterSave}
      />

      <ModalPreviewMapa
        open={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedMapa(undefined);
        }}
        mapa={selectedMapa}
      />
    </div>
  );
};

export { ConfigurarAsientosContent };
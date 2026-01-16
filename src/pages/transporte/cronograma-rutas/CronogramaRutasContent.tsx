import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { ViajesModel } from './model/ViajesInterface';
import ModalAsignarConductor from './ModalAsignarConductor';
import ModalAsignarVehiculo from './ModalAsignarVehiculo';
import ModalAgendarViajes from './ModalAgendarViajes';

interface CronogramaRutasContentProps {
  reload: boolean;
}
const CronogramaRutasContent = ({ reload }: CronogramaRutasContentProps) => {
  const StorageFilteredId = 'filtered_id';
  const [viajes, setviajes] = useState<ViajesModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<ViajesModel | undefined>(
    undefined
  );
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1
  });
  const [selectedViajeId, setSelectedViajeId] = useState<number | null>(null);
  const [isVehiculoModalOpen, setIsVehiculoModalOpen] = useState(false);
  const [isModalAgendarOpen, setIsModalAgendarOpen] = useState(false);
  const [isConductorModalOpen, setIsConductorModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(StorageFilteredId) || '';
  });

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchViajes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('viajes', {
        params: {
          page: page
        }
      });
      setviajes(response.data.viajes);
      setPagination({
        total: response.data.total,
        currentPage: page
      });
    } catch (err) {
      setError(`Error fetching viajes: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteViajes = async (id: number) => {
    try {
      await axios.delete(`viajes/${id}`);
      setviajes((prevviajes) => prevviajes.filter((paymentType) => paymentType.id !== id));
    } catch (err) {
      setError(`Error deleting payment type: ${err}`);
    }
  };

  const handleAfterSave = () => {
    fetchViajes();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchViajes();
  }, [reload]);

  const columns = useMemo<ColumnDef<ViajesModel>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        className: 'min-w-[120px]',
        cellClassName: 'text-gray-700 font-normal'
      },
      {
        accessorFn: (row) => row.idVehiculo,
        id: 'Vehiculo',
        header: () => 'Vehículo',
        enableSorting: true,
        cell: (info) => {
          const vehiculo = info.row.original.vehiculo;
          const imagenVehiculo = vehiculo?.rutaUrl || '/public/media/images/default.png';

          return (
            <div className="flex items-center gap-2">
              <img
                src={imagenVehiculo}
                alt="Vehículo"
                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-75"
                onClick={() => {
                  setSelectedViajeId(info.row.original.id);
                  setIsVehiculoModalOpen(true);
                }}
                title={vehiculo ? `${vehiculo.marca.marca} ${vehiculo.placa}` : 'No asignado'}
              />
              {vehiculo ? (
                <span className="text-xs">
                  {vehiculo.marca.marca} || {vehiculo.placa}
                </span>
              ) : (
                <span className="text-xs">No asignado</span>
              )}
            </div>
          );
        },
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.idConductor,
        id: 'Conductor',
        header: () => 'Conductor',
        enableSorting: true,
        cell: (info) => {
          const conductor = info.row.original.conductor;
          const imagenConductor =
            conductor?.persona.rutaFotoUrl || '/public/media/brand-logos/user.svg';

          return (
            <div className="flex items-center gap-2">
              <img
                src={imagenConductor}
                alt="Conductor"
                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-75"
                onClick={() => {
                  setSelectedViajeId(info.row.original.id);
                  setIsConductorModalOpen(true);
                }}
              />
              {conductor ? (
                <span className="text-xs">{`${conductor.persona.nombre1} ${conductor.persona.apellido1}`}</span>
              ) : (
                <span className="text-xs">No asignado</span>
              )}
            </div>
          );
        },
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.ruta.ciudad_origen.descripcion,
        id: 'Origen',
        header: () => 'Origen',
        enableSorting: true,
        cell: (info) => 
          <span  className="text-gray-700" >
            {info.row.original.ruta.ciudad_origen.descripcion}
          </span >
        ,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      
      {
        accessorFn: (row) => row.ruta.ciudad_destino.descripcion,
        id: 'Destino',
        header: () => 'Destino',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">{info.row.original.ruta.ciudad_destino.descripcion}</span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.ruta.ciudad_destino.descripcion,
        id: 'tiquetes',
        header: () => 'Tiquetes',
        enableSorting: true,
        cell: (info) => (
          <span  className="text-gray-700" >
            {10}
          </span >
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => (
          <span  className="text-gray-700" >
            {info.row.original.estado}
          </span >
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.agendar_viajes?.dia ?? 'No agendado',
        id: 'dia',
        header: () => 'Día',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700 ">
            {info.row.original.agendar_viajes?.dia ?? 'No agendado'}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.agendar_viajes?.hora ?? 'No agendado',
        id: 'hora',
        header: () => 'Hora',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.agendar_viajes?.hora ?? 'No agendado'}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        id: 'agendar',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setSelectedViajeId(row.original.id);
              setIsModalAgendarOpen(true);
            }}
          >
            <KeenIcon icon="calendar-add" />
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
              if (
                window.confirm(`¿Estás seguro de que deseas eliminar el viaje: ${row.original.id}?`)
              ) {
                deleteViajes(row.original.id);
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

  const filteredData = useMemo(() => {8
    if (!searchTerm) return viajes;
    return viajes.filter((paymentType) =>
      paymentType.ruta.ciudad_origen.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, viajes]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Cronograma Rutas</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar cronograma"
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
          sorting={[{ id: 'nombreTipo', desc: false }]}
        />
      </div>
      <ModalAsignarConductor
        open={isConductorModalOpen}
        onClose={() => {
          setIsConductorModalOpen(false);
          setSelectedViajeId(null);
        }}
        idViaje={selectedViajeId ?? 0}
        onSave={(conductor) => {
          fetchViajes();
        }}
      />
      <ModalAsignarVehiculo
        open={isVehiculoModalOpen}
        onClose={() => {
          setIsVehiculoModalOpen(false);
          setSelectedViajeId(null);
        }}
        idViaje={selectedViajeId ?? 0}
        onSave={(vehiculo, observacion) => {
          fetchViajes();
        }}
      />
      <ModalAgendarViajes
        open={isModalAgendarOpen}
        onClose={() => {
          setIsModalAgendarOpen(false);
          setSelectedViajeId(null);
        }}
        idViaje={selectedViajeId ?? 0}
        onSave={() => {
          fetchViajes();
        }}
      />
    </div>
  );
};

export default CronogramaRutasContent;

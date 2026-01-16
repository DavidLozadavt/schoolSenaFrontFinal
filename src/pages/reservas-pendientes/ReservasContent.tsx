import { useEffect, useMemo, useState } from 'react';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import Spinner from '@/components/loaders/Spinner';
import { Reserva } from './model/ReservasInterface';

interface ContentProps {
  reload: boolean;
}



const ReservasContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'reservas-filter';
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
    from: 0,
    to: 0,
    prev_page_url: null,
    next_page_url: null
  });

  useEffect(() => {
    fetchReservas(pagination.current_page);
  }, [reload]);

  const fetchReservas = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`reservas?page=${page}`);
      setReservas(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
        per_page: response.data.per_page,
        from: response.data.from,
        to: response.data.to,
        prev_page_url: response.data.prev_page_url,
        next_page_url: response.data.next_page_url
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error al cargar reservas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    confirmAction('Esta acción eliminará la reserva permanentemente', async () => {
      try {
        await axios.delete(`reservas/${id}`);
        fetchReservas(pagination.current_page);
      } catch (err: any) {
        console.error('Error al eliminar reserva:', err);
      }
    });
  };

  const formatFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      RESERVADO: {
        class: 'border border-blue-400 text-blue-600',
        text: 'Reservado'
      },
      REDIMIDO: {
        class: 'border border-green-400 text-green-600',
        text: 'Redimido'
      },
      CANCELADO: {
        class: 'border border-red-400 text-red-600',
        text: 'Cancelado'
      },
      PENDIENTE: {
        class: 'border border-yellow-400 text-yellow-600',
        text: 'Pendiente'
      }
    };

    return (
      badges[estado] || {
        class: 'border border-gray-400 ',
        text: estado
      }
    );
  };

  const columns = useMemo<ColumnDef<Reserva>[]>(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Código',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-semibold ">{info.getValue() as string}</span>
            <span className="text-xs ">#{info.row.original.id}</span>
          </div>
        ),
        meta: { className: 'min-w-[140px]' }
      },
      {
        accessorFn: (row) => row.tercero.nombre,
        id: 'cliente',
        header: 'Cliente',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium ">{info.getValue() as string}</span>
            <span className="text-xs ">{info.row.original.tercero.identificacion}</span>
            {info.row.original.tercero.telefono && (
              <span className="text-xs ">{info.row.original.tercero.telefono}</span>
            )}
          </div>
        ),
        meta: { className: 'min-w-[180px]' }
      },
      {
        accessorFn: (row) => row.ruta.descripcion,
        id: 'ruta',
        header: 'Ruta',
        cell: (info) => {
          const ruta = info.row.original.ruta;
          const origen = ruta.ciudad_origen?.descripcion || 'N/A';
          const destino = ruta.ciudad_destino?.descripcion || 'N/A';
          
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-medium ">
                <span className='font-medium'>{origen}</span>
                <KeenIcon icon="right" className="text-xs" />
                <span className='font-medium'>{destino}</span>
              </div>
              <div className="flex items-center gap-1 text-xs  mt-1">
                <KeenIcon icon="geolocation" className="text-sm" />
                <span>{ruta.distancia}</span>
                <span>•</span>
                <KeenIcon icon="time" className="text-sm" />
                <span>{ruta.tiempoEstimado}</span>
              </div>
              <span className="text-xs font-semibold text-green-600 mt-1">
                {formatPrecio(ruta.precio)}
              </span>
            </div>
          );
        },
        meta: { className: 'min-w-[220px]' }
      },
      {
        accessorFn: (row) => row.viaje.numeroPlanillaViaje,
        id: 'viaje',
        header: 'Planilla',
        cell: (info) => (
          <div className="flex flex-col items-center">
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded">{info.getValue() as string}</span>
            {/* <span className="text-xs  mt-1">Estado: {info.row.original.viaje.estado}</span> */}
          </div>
        ),
        meta: { className: 'min-w-[130px]', cellClassName: 'text-center' }
      },
      {
        accessorKey: 'cantidad',
        header: 'Tickets',
        cell: (info) => (
          <div className="flex items-center justify-center">
            <span className="px-3 py-1 text-sm font-bold text-blue-600 bg-blue-50 rounded-full border border-blue-200">
              {info.getValue() as number}
            </span>
          </div>
        ),
        meta: { className: 'min-w-[100px]', cellClassName: 'text-center' }
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: (info) => {
          const badge = getEstadoBadge(info.getValue() as string);
          return (
            <div className="flex justify-center">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.class}`}>
                {badge.text}
              </span>
            </div>
          );
        },
        meta: { className: 'min-w-[120px]', cellClassName: 'text-center' }
      },
      {
        accessorKey: 'created_at',
        header: 'Fecha Reserva',
        cell: (info) => (
          <span className="text-sm text-gray-700">{formatFecha(info.getValue() as string)}</span>
        ),
        meta: { className: 'min-w-[180px]' }
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              className="btn btn-sm btn-icon btn-clear btn-light"
              title="Ver QR"
              onClick={() => window.open(row.original.url_qr, '_blank')}
            >
              <KeenIcon icon="barcode" />
            </button>
            <button
              className="btn btn-sm btn-icon btn-clear btn-light"
              title="Ver detalles"
            >
              <KeenIcon icon="eye" />
            </button>
            <button
              className="btn btn-sm btn-icon btn-clear btn-light"
              title="Eliminar"
              onClick={() => handleDelete(row.original.id)}
            >
              <KeenIcon icon="trash" />
            </button>
          </div>
        ),
        meta: { className: 'min-w-[150px]' }
      }
    ],
    []
  );

  const filteredReservas = useMemo(() => {
    if (!searchTerm) return reservas;

    const lowerSearch = searchTerm.toLowerCase();
    return reservas.filter(
      (reserva) =>
        reserva.codigo.toLowerCase().includes(lowerSearch) ||
        reserva.tercero.nombre.toLowerCase().includes(lowerSearch) ||
        reserva.tercero.identificacion.includes(lowerSearch) ||
        reserva.estado.toLowerCase().includes(lowerSearch) ||
        reserva.ruta.descripcion.toLowerCase().includes(lowerSearch)
    );
  }, [reservas, searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    localStorage.setItem(storageFilterId, value);
  };

  if (loading && reservas.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <KeenIcon icon="information-circle" className="text-danger" />
        <span>Error al cargar las reservas: {error}</span>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Reservas de Tickets</h3>
        <div className="flex items-center gap-2">
          <label className="input input-sm">
            <KeenIcon icon="magnifier" />
            <input
              type="text"
              placeholder="Buscar reservas..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="card-body">
        <DataGrid
          columns={columns}
          data={filteredReservas}
          nativePagination={true}
          sorting={[{ id: 'created_at', desc: true }]}
          rowSelect={false}
        />
      </div>
    </div>
  );
};

export default ReservasContent;
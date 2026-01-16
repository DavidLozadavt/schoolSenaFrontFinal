import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { DataGrid, KeenIcon } from '@/components';
import ModalRechazarSolicitud from './ModalRechazarSolicitud';
import clsx from 'clsx';

interface Solicitud {
  id: number;
  estado: string;
  cantidad: string;
  producto: {
    caracteristicas: string;
    codigoProducto: string;
  };
  almacenOrigen: {
    nombreAlmacen: string;
  };
  almacenDestino: {
    nombreAlmacen: string;
  };
}

interface ContentProps {
  reload?: boolean;
  onOpenRechazo?: (id: number) => void;
  onOpenTrazabilidad?: (id: number) => void;
}

const SolicitudAlmacenContent = ({ reload, onOpenRechazo, onOpenTrazabilidad }: ContentProps) => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [openRechazarModal, setOpenRechazarModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('get_solicitudes_almacen');

      if (Array.isArray(data)) setSolicitudes(data);
      else if (Array.isArray(data.data)) setSolicitudes(data.data);
      else if (Array.isArray(data.solicitudes)) setSolicitudes(data.solicitudes);
      else setSolicitudes([]);
    } catch (error) {
      console.error(error);
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, [reload]);

  // FILTROS
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return solicitudes
      .filter((s) => (q ? s.producto?.caracteristicas?.toLowerCase().includes(q) : true))
      .filter((s) => {
        // Normalizamos
        const estado = s.estado?.toUpperCase().trim();
        const filtro = estadoFilter.toUpperCase().trim();

        return filtro ? estado === filtro : true;
      });
  }, [solicitudes, searchTerm, estadoFilter]);

  const paginated = filtered.slice(0, limit);

  const aprobarSolicitud = async (id: number) => {
    try {
      await axios.post(`aprobar_producto_almacen/${id}`);
      fetchSolicitudes();
    } catch (error) {
      console.error(error);
      alert('Error al aprobar la solicitud');
    }
  };

  const abrirModalRechazo = (id: number) => {
    // Si el padre quiere manejar el modal de rechazo, usar su handler
    if (onOpenRechazo) {
      onOpenRechazo(id);
      return;
    }

    setSolicitudSeleccionada(id);
    setOpenRechazarModal(true);
  };

  const columns = useMemo<ColumnDef<Solicitud>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        cell: (info) => <span>{info.row.original.id}</span>,
        meta: { className: 'w-[100px]' }
      },
      {
        accessorFn: (row) => row.producto?.caracteristicas,
        id: 'producto',
        header: () => 'Producto',
        cell: (info) => <span>{info.row.original.producto?.caracteristicas}</span>,
        meta: { className: 'min-w-[200px]' }
      },
      {
        accessorFn: (row) => row.cantidad,
        id: 'cantidad',
        header: () => 'Cantidad',
        cell: (info) => <span>{info.row.original.cantidad}</span>,
        meta: { className: 'w-[100px]' }
      },
      {
        accessorFn: (row) => row.producto?.codigoProducto,
        id: 'codigoProducto',
        header: () => 'Código Producto',
        cell: (info) => <span>{info.row.original.producto?.codigoProducto}</span>,
        meta: { className: 'min-w-[150px]' }
      },
      {
        accessorFn: (row) => row.almacenOrigen?.nombreAlmacen,
        id: 'origen',
        header: () => 'Almacén Origen',
        cell: (info) => <span>{info.row.original.almacenOrigen?.nombreAlmacen}</span>,
        meta: { className: 'min-w-[180px]' }
      },
      {
        accessorFn: (row) => row.almacenDestino?.nombreAlmacen,
        id: 'destino',
        header: () => 'Almacén Destino',
        cell: (info) => <span>{info.row.original.almacenDestino?.nombreAlmacen}</span>,
        meta: { className: 'min-w-[180px]' }
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => {
          const estado = info.getValue() as string;

          return (
            <span
              className={clsx('badge badge-outline', {
                'text-orange-600 border-orange-600': estado === 'AGOTADO',
                'text-red-600 border-red-600': estado === 'RECHAZADO',
                'text-orange-700 border-orange-600': estado === 'PENDIENTE'
              })}
            >
              {estado}
            </span>
          );
        },
        meta: { className: 'w-[140px]' }
      },
      {
        id: 'acciones',
        header: () => 'Acciones',
        cell: ({ row }) => {
          const estado = row.original.estado;

          return (
            <div className="flex justify-center gap-2">
              <button
                title="Aprobar"
                onClick={() => aprobarSolicitud(row.original.id)}
                className="btn btn-sm btn-light bg-green-600 hover:bg-green-700 text-white"
              >
                ✓
              </button>

              {estado !== 'RECHAZADO' && (
                <button
                  onClick={() => abrirModalRechazo(row.original.id)}
                  className="btn btn-sm btn-light bg-red-600 hover:bg-red-700 text-white"
                >
                  ✕
                </button>
              )}

              <button
                onClick={() => {
                  // Si el padre provee el handler de trazabilidad, invocarlo
                  if (onOpenTrazabilidad) {
                    onOpenTrazabilidad(row.original.id);
                    return;
                  }
                  // Fallback: abrir en una nueva ventana o mostrar alerta
                  console.warn('onOpenTrazabilidad no está definido. Id:', row.original.id);
                }}
                className="btn btn-sm btn-light bg-sky-600 hover:bg-sky-700 text-white"
                title="Ver trazabilidad"
              >
                ☰
              </button>
            </div>
          );
        },

        meta: { className: 'w-[140px]' }
      }
    ],
    [solicitudes, estadoFilter, onOpenTrazabilidad]
  );

  if (loading) {
    return <div className="p-4 text-center text-neutral-500">Cargando solicitudes...</div>;
  }

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Solicitudes</h3>

        <div className="flex gap-6">
          <select
            className="select select-sm w-48"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="APROBADO">APROBADO</option>
            <option value="RECHAZADO">RECHAZADO</option>
          </select>

          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="input input-sm pl-8 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Modal de rechazo */}
      <ModalRechazarSolicitud
        open={openRechazarModal}
        onClose={() => setOpenRechazarModal(false)}
        solicitudId={solicitudSeleccionada}
        onSave={() => {
          fetchSolicitudes();
          setOpenRechazarModal(false);
        }}
      />

      <div className="card-body">
        <DataGrid columns={columns} data={filtered} pagination={{ size: limit }} />
      </div>
    </div>
  );
};

export default SolicitudAlmacenContent;

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { NotaCredito } from './model/FacturacionElectronicaInterface';

interface NotasCreditoProps {
  reload: boolean;
}

const NotasCreditoContent = ({ reload }: NotasCreditoProps) => {
  const storageFilterId = 'notas-credito-filter';
  const [notasCredito, setNotasCredito] = useState<NotaCredito[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const [estadoFiltro, setEstadoFiltro] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    validadas: 0,
    error: 0
  });

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      pending: {
        class: 'border border-gray-400 text-gray-600',
        text: 'Pendiente'
      },
      sending: {
        class: 'border border-blue-400 text-blue-600',
        text: 'Enviando'
      },
      validated: {
        class: 'border border-green-400 text-green-600',
        text: 'Validada'
      },
      error: {
        class: 'border border-red-400 text-red-600',
        text: 'Error'
      },
      cancelled: {
        class: 'border border-yellow-400 text-yellow-600',
        text: 'Cancelada'
      }
    };

    return (
      badges[estado] || {
        class: 'border border-gray-300 text-gray-600',
        text: estado
      }
    );
  };

  const columns = useMemo<ColumnDef<NotaCredito>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: false,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: { className: 'w-[100px]', cellClassName: 'text-gray-700 font-normal' },
      },
      {
        accessorFn: (row) => row.number,
        id: 'number',
        header: () => 'Número de Nota',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to={info.row.original.qr_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            {info.row.original.number || 'Sin número'}
          </Link>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-normal' },
      },
      {
        accessorFn: (row) => row.devolucion.tercero.nombre_completo,
        id: 'tercero',
        header: () => 'Tercero',
        enableSorting: true,
        cell: (info) => (
          <div className="flex flex-col">
            <span className="text-gray-700 font-medium">
              {info.row.original.devolucion.tercero.nombre_completo}
            </span>
            <span className="text-gray-500 text-xs">
              {info.row.original.devolucion.tercero.identificacion || 'Sin identificación'}
            </span>
          </div>
        ),
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700 font-normal' },
      },
      {
        accessorFn: (row) => row.reference_code,
        id: 'reference_code',
        header: () => 'Código referencia',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700 text-xs">{info.row.original.reference_code}</span>,
        meta: { className: 'min-w-[180px]', cellClassName: 'text-gray-700 font-normal' },
      },
      {
        accessorFn: (row) => row.devolucion.cantidad_tickets,
        id: 'cantidad_tickets',
        header: () => 'Tickets',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.devolucion.cantidad_tickets}
          </span>
        ),
        meta: { className: 'w-[100px]', cellClassName: 'text-center' },
      },
      {
        accessorFn: (row) => row.devolucion.tickets,
        id: 'detalle_tickets',
        header: () => 'Detalle Tickets',
        cell: (info) => {
          const tickets = info.row.original.devolucion.tickets;
          return (
            <div className="flex flex-col gap-1">
              {tickets.map((ticket, index) => (
                <div key={index} className="text-xs">
                  <span className="font-medium">{ticket.numero_ticket}</span>
                  <span className="text-gray-500"> - ${parseFloat(ticket.valor).toLocaleString()}</span>
                </div>
              ))}
            </div>
          );
        },
        meta: { className: 'min-w-[150px]' },
      },
      {
        accessorFn: (row) => row.status,
        id: 'status',
        header: () => 'Estado',
        cell: (info) => {
          const badge = getEstadoBadge(info.row.original.status);
          return (
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.class}`}
            >
              {badge.text}
            </span>
          );
        },
        meta: { className: 'w-[150px]', cellClassName: 'text-gray-700 font-normal' },
      },
      {
        accessorFn: (row) => row.validated_at,
        id: 'validated_at',
        header: () => 'Fecha de validación',
        cell: (info) => {
          const validatedAt = info.row.original.validated_at;

          if (!validatedAt) return <span className="text-gray-400">Pendiente</span>;

          const date = new Date(validatedAt);

          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();

          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');

          return (
            <span className="text-gray-700 text-xs">
              {`${day}-${month}-${year} ${hours}:${minutes}:${seconds}`}
            </span>
          );
        },
        meta: { className: 'min-w-[180px]', cellClassName: 'text-gray-700 font-normal' },
      },
      {
        id: 'ver_qr',
        header: () => 'Ver QR',
        cell: ({ row }) =>
          row.original.qr_url ? (
            <Link
              to={row.original.qr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-icon btn-light"
              title="Ver QR"
            >
              <KeenIcon icon="scan-barcode" />
            </Link>
          ) : (
            <span className="text-gray-400">—</span>
          ),
        meta: { className: 'w-[80px]' },
      },
      {
        id: 'ver_pdf',
        header: () => 'Ver PDF',
        cell: ({ row }) =>
          row.original.pdf_path ? (
            <Link
              to={row.original.pdf_path}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-icon btn-light"
              title="Ver PDF"
            >
              <img src="/public/media/file-types/pdf.svg" alt="pdf" className="w-5 h-5" />
            </Link>
          ) : (
            <span className="text-gray-400">—</span>
          ),
        meta: { className: 'w-[80px]' },
      },
    ],
    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchNotasCredito = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/notas-credito');
      setNotasCredito(response.data.data.items || []);
      setStats(response.data.stats || { total: 0, pendientes: 0, validadas: 0, error: 0 });
    } catch (error) {
      console.error(error);
      setError('Error al cargar las notas de crédito');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotasCredito();
  }, [reload]);

  const filteredData = useMemo(() => {
    let filtered = notasCredito;

    // Filtrar por estado
    if (estadoFiltro !== 'all') {
      filtered = filtered.filter((nota) => nota.status === estadoFiltro);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((nota) =>
        (nota.number || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (nota.reference_code || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (nota.devolucion?.tercero?.nombre_completo || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (nota.devolucion?.tercero?.identificacion || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [searchTerm, estadoFiltro, notasCredito]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Notas de Crédito</h3>
        <div className="flex gap-3 items-center">
          {/* Estadísticas */}
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-gray-100 rounded">
              Total: <strong>{stats.total}</strong>
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              Validadas: <strong>{stats.validadas}</strong>
            </span>
            {stats.pendientes > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                Pendientes: <strong>{stats.pendientes}</strong>
              </span>
            )}
            {stats.error > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                Error: <strong>{stats.error}</strong>
              </span>
            )}
          </div>

          {/* Filtro de estado */}
          <div className="relative">
            <select
              className="select select-sm w-[180px]"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="sending">Enviando</option>
              <option value="validated">Validada</option>
              <option value="error">Error</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar por número, tercero..."
              className="input input-sm pl-8 w-[250px]"
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
          sorting={[{ id: 'id', desc: true }]}
        />
      </div>
    </div>
  );
};

export default NotasCreditoContent;

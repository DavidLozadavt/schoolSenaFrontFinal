import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { FacturaElectronica } from './model/FacturacionElectronicaInterface';

interface FacturaElectronicaProps {
  reload: boolean;
}

const FacturacionElectronicaContent = ({ reload }: FacturaElectronicaProps) => {
  const storageFilterId = 'facturas-filter';
  const [facturaElectronica, setFacturaElectronica] = useState<FacturaElectronica[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<FacturaElectronica | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const [estadoFiltro, setEstadoFiltro] = useState<string>('all');
  const [loadingRetry, setLoadingRetry] = useState(false);

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      pending: {
        class: 'border border-gray-400 text-gray-600 ',
        text: 'Pendiente'
      },
      sending: {
        class: 'border border-blue-400 text-blue-600 ',
        text: 'Enviando'
      },
      validated: {
        class: 'border border-green-400 text-green-600 ',
        text: 'Validada'
      },
      error: {
        class: 'border border-red-400 text-red-600',
        text: 'Error'
      },
      cancelled: {
        class: 'border border-yellow-400 text-yellow-600 ',
        text: 'Cancelada'
      }
    };

    return (
      badges[estado] || {
        class: 'border border-gray-300 text-gray-600 ',
        text: estado
      }
    );
  };

  const columns = useMemo<ColumnDef<FacturaElectronica>[]>(
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
        header: () => 'Número de Factura',
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
        accessorFn: (row) => row.ticket.tercero.nombre,
        id: 'id',
        header: () => 'Terceo',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.ticket.tercero.nombre}- {info.row.original.ticket.tercero.identificacion}</span>,
        meta: { className: 'w-[180px]', cellClassName: 'text-gray-700 font-normal' },
      },
        {
        accessorFn: (row) => row.reference_code,
        id: 'id',
        header: () => 'Código referencia',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.reference_code}</span>,
        meta: { className: 'w-[150px]', cellClassName: 'text-gray-700 font-normal' },
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
        accessorFn: (row) => row.email_status,
        id: 'email_status',
        header: () => 'Estado Email',
        cell: (info) => (
          <span className="text-gray-700">{info.row.original.email_status || 'Pendiente'}</span>
        ),
        meta: { className: 'w-[150px]', cellClassName: 'text-gray-700 font-normal' },
      },
        {
          accessorFn: (row) => row.sent_at,
          id: 'send_at',
          header: () => 'Fecha de envío',
          cell: (info) => {
            const sentAt = info.row.original.sent_at;

            if (!sentAt) return <span>--</span>;

            const date = new Date(sentAt);

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // meses empiezan en 0
            const year = date.getFullYear();

            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            return (
              <span className="text-gray-700">
                {`${day}-${month}-${year} ${hours}:${minutes}:${seconds}`}
              </span>
            );
          },
          meta: { className: 'w-[180px]', cellClassName: 'text-gray-700 font-normal' },
        },


      {
        id: 'ver',
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
        id: 'ver',
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
              {/* <KeenIcon icon="subtitle" /> */}
              <img src="/public/media/file-types/pdf.svg" alt="pdf" />
            </Link>
          ) : (
            <span className="text-gray-400">—</span>
          ),
        meta: { className: 'w-[80px]' },
      },
    //   {
    //     id: 'edit',
    //     header: () => '',
    //     enableSorting: false,
    //     cell: ({ row }) => (
    //       <button
    //         className="btn btn-sm btn-icon btn-clear btn-light"
    //         onClick={() => {
    //           setSelectedFactura(row.original);
    //           setIsModalOpen(true);
    //         }}
    //       >
    //         <KeenIcon icon="notepad-edit" />
    //       </button>
    //     ),
    //     meta: { className: 'w-[60px]' },
    //   },
    ],
    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchFacturaElectronica = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/get_facturas_electronicas');
      setFacturaElectronica(response.data.data || []);
    } catch (error) {
      console.error(error);
      setError('Error al cargar las facturas electrónicas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturaElectronica();
  }, [reload]);

  const handleAfterSave = () => {
    fetchFacturaElectronica();
    setIsModalOpen(false);
  };

  const handleRetryFacturas = async () => {
    setLoadingRetry(true);
    try {
      await axios.post('/facturas_electronicas/retry');
      await fetchFacturaElectronica();
    } catch (error) {
      console.error('Error al reintentar facturas:', error);
      setError('Error al reintentar el envío de facturas');
    } finally {
      setLoadingRetry(false);
    }
  };

  const hayFacturasConProblemas = useMemo(() => {
    return facturaElectronica.some(
      (fact) => fact.status === 'error' || fact.status === 'pending'
    );
  }, [facturaElectronica]);

  const filteredData = useMemo(() => {
    let filtered = facturaElectronica;

    // Filtrar por estado
    if (estadoFiltro !== 'all') {
      filtered = filtered.filter((fact) => fact.status === estadoFiltro);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((fact) =>
        (fact.number || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (fact.reference_code || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (fact.ticket?.tercero?.nombre || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (fact.ticket?.tercero?.identificacion || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [searchTerm, estadoFiltro, facturaElectronica]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Facturas Electrónicas</h3>
        <div className="flex gap-3">
          {hayFacturasConProblemas && (
            <button
              onClick={handleRetryFacturas}
              disabled={loadingRetry}
              className="btn btn-sm btn-primary flex items-center gap-2"
              title="Reintentar envío de facturas con error o pendientes"
            >
              <KeenIcon icon="arrows-circle" className={loadingRetry ? 'animate-spin' : ''} />
              {loadingRetry ? 'Reintentando...' : 'Reintentar Envío'}
            </button>
          )}
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

export default FacturacionElectronicaContent;

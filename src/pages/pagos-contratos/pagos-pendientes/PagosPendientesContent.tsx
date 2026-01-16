import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';

const PagosPendientesContent = () => {
  const storageFilterId = 'payments-pendientes-filter';
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [stateFilter, setStateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const navigate = useNavigate();

  const handlePago = useCallback(
    (data: any) => {
      navigate('/gestion-contratos/pagos-pendientes/pago', { state: data });
    },
    [navigate]
  );

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: {
          className: 'w-[5px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.transaccion?.contratos[0]?.persona?.nombre1,
        id: 'nombre',
        header: () => 'Nombre',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.transaccion?.contratos[0]?.persona?.nombre1}{' '}
            {info.row.original.transaccion?.contratos[0]?.persona?.nombre2}{' '}
            {info.row.original.transaccion?.contratos[0]?.persona?.apellido1}
          </Link>
        ),
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.transaccion?.contratos[0]?.persona?.identificacion,
        id: 'identificacion',
        header: () => 'Identificación',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.transaccion?.contratos[0]?.persona?.identificacion}
          </Link>
        ),
        meta: {
          className: 'min-w-[200px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.valor,
        id: 'valor',
        header: () => 'Valor',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original?.valor}
          </Link>
        ),
        meta: {
          className: 'min-w-[180px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fecha,
        id: 'fecha',
        header: () => 'Fecha de Pago',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original?.fechaPago}
          </Link>
        ),
        meta: {
          className: 'min-w-[180px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original?.estado?.estado}
          </Link>
        ),
        meta: {
          className: 'min-w-[180px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        id: 'see',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => handlePago(row.original)}
          >
            <KeenIcon icon="eye" />
          </button>
        ),
        meta: {
          className: 'w-[60px]'
        }
      }
    ],
    [handlePago]
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchPaymentPendientes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('pagos_pendientes');
      setPayments(response.data);
    } catch (error) {
      setError('Error al cargar los tipos de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentPendientes();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter((payment) => {
        return (
          payment.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.transaccion?.contratos[0]?.persona?.nombre1
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.transaccion?.contratos[0]?.persona?.nombre2
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.transaccion?.contratos[0]?.persona?.apellido1
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.transaccion?.contratos[0]?.persona?.identificacion
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.valor?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.fechaPago?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.estado?.estado?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (stateFilter) {
      filtered = filtered.filter((payment) => payment.estado?.estado === stateFilter);
    }

    return filtered;
  }, [searchTerm, stateFilter, payments]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Pagos Pendientes</h3>
        <div className="flex gap-6">
          <select
            className="select select-sm w-28"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="">TODOS</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="EN ESPERA">EN ESPERA</option>
          </select>

          <div className="relative flex items-center gap-4">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />

            <input
              type="text"
              placeholder="Buscar Pago"
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
    </div>
  );
};

export { PagosPendientesContent };

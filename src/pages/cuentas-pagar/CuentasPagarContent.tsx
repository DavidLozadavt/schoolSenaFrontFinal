import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';

import { useConfirm } from '@/hooks';
import { FacturaInterface } from './models/FacturaInterface';
import { ModalTercero } from './ModalTercero';
import { ModalPagoCuentaPendiente } from './ModalPagoCuentaPendiente';

const CuentasPagarContent = () => {
  const storageFilterId = 'facturasCP-filter';
  const [facturas, setFacturas] = useState<FacturaInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpenPago, setIsModalOpenPago] = useState(false);
  const [isModalOpenTercero, setIsModalOpenTercero] = useState(false);
  const [factura, setFactura] = useState<FacturaInterface | undefined>(undefined);
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.codigo,
        id: 'codigo',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: {
          className: 'w-[100px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.numeroFactura,
        id: 'numeroFactura',
        header: () => 'Número de Factura',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.numeroFactura}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fecha,
        id: 'fecha',
        header: () => 'Fecha',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.fecha}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.valorMasIva,
        id: 'valorMasIva',
        header: () => 'Valor Total',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-ES', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(info.row.original.valorMasIva)}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.valor_total,
        id: 'valor_total',
        header: () => 'Valor Cancelado (Pagado)',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-ES', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(info.row.original.valor_total)}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.excedente_total,
        id: 'excedente_total',
        header: () => 'Valor a Pagar',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-ES', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(info.row.original.excedente_total)}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        id: 'tercero',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            title="Tercero"
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setIsModalOpenTercero(true);
              setFactura(row.original);
            }}
          >
            <KeenIcon icon="user-square" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      },
      {
        id: 'factura',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <a
            href={row.original.rutaFacturaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1"
            title="Factura"
          >
            <KeenIcon icon="tablet-text-down" className="text-xl" />
          </a>
        ),
        meta: { className: 'w-[60px]' }
      },

      {
        id: 'pay',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            onClick={() => {
              setIsModalOpenPago(true);
              setFactura(row.original);
            }}
            className="btn btn-sm btn-icon btn-clear btn-light"
          >
            <KeenIcon icon="dollar" />
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

  const fetchFacturas = async () => {
    setLoading(true);
    try {
      const response = await axios.get('facturas');
      setFacturas(response.data);
    } catch (error) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  const handleAfterSave = () => {
    fetchFacturas();
    setIsModalOpenPago(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return facturas;

    return facturas.filter(
      (data) =>
        data.fecha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.valorMasIva.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, facturas]);

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Cuentas Por Pagar</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Cuentas Por Pagar"
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

      <ModalTercero
        open={isModalOpenTercero}
        onClose={() => {
          setIsModalOpenTercero(false);
          setFactura(undefined);
        }}
        data={factura}
      />

      <ModalPagoCuentaPendiente
        open={isModalOpenPago}
        onClose={() => {
          setIsModalOpenPago(false);
          setFactura(undefined);
        }}
        data={factura}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { CuentasPagarContent };

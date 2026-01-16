import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { MedioPagoInterface } from './model/MedioPagoInterface';
import { ModalMedioPago } from './ModalMedioPago';

interface MedioPagoContentProps {
  reload: boolean;
}

const MedioPagoContent = ({ reload }: MedioPagoContentProps) => {
  const storageFilterId = 'payments-filter';
  const [paymentMethods, setPaymentMethods] = useState<MedioPagoInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedioPago, setSelectedMedioPago] = useState<MedioPagoInterface | undefined>(
    undefined
  );

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<MedioPagoInterface>[]>(
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
        accessorFn: (row) => row.detalleMedioPago,
        id: 'nombreMedio',
        header: () => 'Nombre Medio de Pago',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.detalleMedioPago}
          </Link>
        ),
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
              setSelectedMedioPago(row.original);
              setIsModalOpen(true);
            }}
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
            onClick={() => alert(`Clicked on delete for ${row.original.detalleMedioPago}`)}
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

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await axios.get('medio_pagos');
      setPaymentMethods(response.data);
    } catch (error) {
      setError('Error al cargar los medios de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [reload]);

  const handleAfterSave = () => {
    fetchPaymentMethods();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return paymentMethods;
    return paymentMethods.filter((payment) =>
      payment.detalleMedioPago.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, paymentMethods]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Métodos de Pago</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Medio de Pago"
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
          sorting={[{ id: 'nombreMedio', desc: false }]}
        />
      </div>

      <ModalMedioPago
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMedioPago(undefined);
        }}
        medioPago={selectedMedioPago}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { MedioPagoContent };

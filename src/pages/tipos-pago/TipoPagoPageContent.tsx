import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { PaymentType } from './model/TipoPagoInterface';
import { ModalTipoPago } from './ModalTipoPago';

interface PaymentTypeContentProps {
  reload: boolean;
}
const TipoPagoPageContent = ({ reload }: PaymentTypeContentProps) => {
  const StorageFilteredId = 'filtered_id';
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType | undefined>(
    undefined
  );
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(StorageFilteredId) || '';
  });
  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchPaymentTypes = async () => {
    try {
      const response = await axios.get('tipo_pagos');
      setPaymentTypes(response.data);
    } catch (err) {
      setError(`Error fetching payment methods: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deletePaymentType = async (id: number) => {
    try {
      await axios.delete(`tipo_pagos/${id}`);
      setPaymentTypes((prevPaymentTypes) =>
        prevPaymentTypes.filter((paymentType) => paymentType.id !== id)
      );
    } catch (err) {
      setError(`Error deleting payment type: ${err}`);
    }
  };//borsrr la data
  
  const handleAfterSave = () => {
    fetchPaymentTypes();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, [reload]);

  const columns = useMemo<ColumnDef<PaymentType>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: { className: 'w-[100px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.detalleTipoPago,
        id: 'nombreTipo',
        header: () => 'Nombre Tipo de Pago',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.detalleTipoPago}
          </Link>
        ),
        meta: { className: 'min-w-[250px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setSelectedPaymentType(row.original);
              setIsModalOpen(true);
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
              if (window.confirm(`¿Estás seguro de que deseas eliminar el tipo de pago: ${row.original.detalleTipoPago}?`)) {
                deletePaymentType(row.original.id);
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

  const filteredData = useMemo(() => {
    if (!searchTerm) return paymentTypes;
    return paymentTypes.filter((paymentType) =>
      paymentType.detalleTipoPago.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, paymentTypes]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Tipos De Pago</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar Tipo de Pago"
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

      <ModalTipoPago
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPaymentType(undefined);
        }}
        paymentType={selectedPaymentType}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { TipoPagoPageContent };

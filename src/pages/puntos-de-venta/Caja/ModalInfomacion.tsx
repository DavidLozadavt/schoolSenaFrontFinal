import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { DataGrid, KeenIcon } from '@/components';
import { useConfirm } from '@/hooks';

import { ColumnDef } from '@tanstack/react-table';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
}

const ModalInfomacion = ({ open, onClose, data }: ModalProps) => {
  const storageFilterId = 'pointV-filter';
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const [repote, setReporte] = useState<any[]>([]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.foto,
        id: 'foto',
        header: () => 'Cajero',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col items-center">
            <img
              src={row.original.usuario.persona.rutaFotoUrl}
              alt="Foto"
              className="object-cover w-10 h-10 mb-2 rounded-full"
            />
            <span className="font-medium text-center text-gray-700">
              {row.original.usuario.persona.nombre1} {' '}
              {row.original.usuario.persona.apellido1}
            </span>
          </div>
        ),
        meta: {
          className: 'w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fecha,
        id: 'fecha',
        header: () => 'Fecha de Apertura',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.fecha}</span>,
        meta: {
          className: 'min-w-[190px]',
          cellClassName: 'text-gray-700 font-normal'
        }

      },

      {
        accessorFn: (row) => row.valorefectivo,
        id: 'valorFectivo',
        header: () => 'Valor Fectivo',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'COP' }).format(
              info.row.original.valorEfectivo
            )}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.valorgasto,
        id: 'valorGasto',
        header: () => 'Valor Gasto',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'COP' }).format(
              info.row.original.valorGasto
            )}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.valotransaccion,
        id: 'valorTransaccion',
        header: () => 'Valor Transacción',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'COP' }).format(
              info.row.original.valorTransaccion
            )}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.observacion,
        id: 'Observacion',
        header: () => 'Observación',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.observacion}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

    ],
    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchReporteCajas = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`get_boxes_by_point_of_sale/${data}`);
      setReporte(response.data);
    } catch (error) {
      setError('Error al cargar los puntos de venta');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      fetchReporteCajas();
    }
  }, [data]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return repote;

    return repote.filter(
      (report) =>
        report.fecha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.usuario?.persona.identificacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.usuario?.persona.nombre1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.usuario?.persona.apellido1?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, repote]);

  if (loading) {

  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[960px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>{'Punto de Ventas - Reporte de Cierres de Caja'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div className="flex-wrap py-5 card-header">
            <h3 className="card-title"></h3>
            <div className="flex gap-6">
              <div className="relative">
                <KeenIcon
                  icon="magnifier"
                  className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
                />
                <input
                  type="text"
                  placeholder="Buscar"
                  className="pl-8 input input-sm"
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
          <div className="flex justify-end gap-3 px-4 mt-4">
            {/* <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button> */}
          </div>  
          
          </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalInfomacion;
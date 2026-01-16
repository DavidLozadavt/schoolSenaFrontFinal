import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ModalTipoContrato } from './ModalTipoContrato';
import { useConfirm } from '@/hooks';

interface documentTypeProps {
  reload: boolean;
}

const TipoContratoContent = ({ reload }: documentTypeProps) => {
  const StorageFilteredId = 'filtered_idTipoContratos';
  const [tipoContratos, setTipoContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoContrato, setTipoContrato] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(StorageFilteredId) || '';
  });
  const { confirmAction } = useConfirm();

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchTipoContrato = async () => {
    try {
      const response = await axios.get('tipo_contrato');
      setTipoContratos(response.data);
    } catch (err) {
      setError(`Error fetching  data: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocumentType = async (id: number | undefined) => {
    try {
      await axios.delete(`tipo_contrato/${id}`);
      fetchTipoContrato();
    } catch (err) {
      setError(`Error deleting type contract: ${err}`);
    }
  };

  const handleAfterSave = () => {
    fetchTipoContrato();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchTipoContrato();
  }, [reload]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'w-[100px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.nombreTipoContrato,
        id: 'nombreTipoContrato',
        header: () => 'Nombre',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[250px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.descripcion,
        id: 'descripcion',
        header: () => 'Descripción',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[350px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setTipoContrato(row.original);
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
              handleDeleteContrato(row.original.id);
            }}
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      }
    ],
    /* eslint-disable react-hooks/exhaustive-deps */
    []
  );

  const handleDeleteContrato = (id?: number) => {
    confirmAction('Esta acción eliminará el tipo de contrato.', () => deleteDocumentType(id));
  };


  const filteredData = useMemo(() => {
    if (!searchTerm) return tipoContratos;
    return tipoContratos.filter((res) =>
      res.detalleTipoPago.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, tipoContratos]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Tipos De Contrato</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar Tipos de Contrato"
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
        />
      </div>

      <ModalTipoContrato
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTipoContrato(undefined);
        }}
        tipoContrato={tipoContrato}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { TipoContratoContent };

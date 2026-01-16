import { useEffect, useMemo, useState } from 'react';
import { IdocuensType, TipoDocumento } from './model/TipoDocumentInterface';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ModalTipoDocumento } from './ModalTipoDocumento';

interface documentTypeProps {
  reload: boolean;
}

const TipoDocumentoContent = ({ reload }: documentTypeProps) => {
  const StorageFilteredId = 'filtered_idTipoDocumento';
  const [documentTypes, setDocumentTypes] = useState<IdocuensType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<IdocuensType | undefined>(
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
      const response = await axios.get('tipo_documentos');
      setDocumentTypes(response.data);
    } catch (err) {
      setError(`Error fetching payment methods: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocumentType = async (id: number) => {
    try {
      await axios.delete(`tipo_documentos/${id}`);
      setDocumentTypes((prevDocumentTypes) =>
        prevDocumentTypes.filter((documentType) => documentType.id !== id)
      );
    } catch (err) {
      console.log(`Error deleting payment type: ${err}`);
    }
  };

  const handleAfterSave = () => {
    fetchPaymentTypes();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, [reload]);

  const columns = useMemo<ColumnDef<IdocuensType>[]>(
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
        accessorFn: (row) => row.tipoDocumento.tituloDocumento,
        id: 'nombreTipo',
        header: () => 'Nombre Tipo de Documento',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.tipoDocumento.tituloDocumento}
          </Link>
        ),
        meta: { className: 'min-w-[250px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.tipoDocumento.descripcion,
        id: 'descripcion',
        header: () => 'Descripcion',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.tipoDocumento.descripcion}
          </Link>
        ),
        meta: { className: 'min-w-[250px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.tipoDocumento.estado.estado,
        id: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.tipoDocumento.estado.estado}
          </Link>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.proceso.nombreProceso,
        id: 'proceso',
        header: () => 'Proceso',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.proceso.nombreProceso}
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
              setSelectedDocumentType(row.original);
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
              if (
                window.confirm(
                  `¿Estás seguro de que deseas eliminar el tipo de pago: ${row.original.tipoDocumento.tituloDocumento}?`
                )
              ) {
                deleteDocumentType(row.original.tipoDocumento.id);
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
    if (!searchTerm) return documentTypes;

    const lowerTerm = searchTerm.toLowerCase();

    return documentTypes.filter((item) => {
      const titulo = item.tipoDocumento?.tituloDocumento?.toLowerCase() || '';
      const estado = item.tipoDocumento?.estado?.estado?.toLowerCase() || '';
      const proceso = item.proceso?.nombreProceso?.toLowerCase() || '';

      return (
        titulo.includes(lowerTerm) || estado.includes(lowerTerm) || proceso.includes(lowerTerm)
      );
    });
  }, [searchTerm, documentTypes]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Tipos De Documento</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar Tipos de Documento"
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

      <ModalTipoDocumento
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDocumentType(undefined);
        }}
        documentmentType={selectedDocumentType}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { TipoDocumentoContent };

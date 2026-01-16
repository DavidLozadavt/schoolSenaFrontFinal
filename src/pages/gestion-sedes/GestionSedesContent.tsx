import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import { ModalSedes } from './ModalSedes';

interface ContentProps {
  reload: boolean;
}

const GestionSedesContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'sede-filter';
  const [GestionSedes, setGestionSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sede, setSedes] = useState<any | undefined>(undefined);
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
  
    {
        accessorFn: (row) => row.estado,
        id: 'responsable',
        header: () => 'Responsable',
        enableSorting: true,
        cell: ({ row }) => (
            <div className="flex flex-col items-center">
              <img
                src={row.original.responsable?.persona?.rutaFotoUrl } 
                alt="Foto"
                className="object-cover w-10 h-10 mb-2 rounded-full"
              />
              <span className="font-medium text-center text-gray-700">
                {row.original.responsable?.persona?.nombre1}{' '}
                {row.original.responsable?.persona?.apellido1}
              </span>
            </div>
          ),
         meta: {
          className: 'w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.nombre,
        id: 'nombre',
        header: () => 'Nombre',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.nombre}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.direccion,
        id: 'direccion',
        header: () => 'Direccion',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.direccion ?? 'N/A'}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
        
      },
      {
        accessorFn: (row) => row.descripcion,
        id: 'descripcion',
        header: () => 'Descripción',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.descripcion ?? 'N/A'}</span>,
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.telefono,
        id: 'telefono',
        header: () => 'Telefono',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.telefono  ?? 'N/A'}</span>,
        meta: {
          className: 'w-[100px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.foto,
        id: 'foto',
        header: () => 'Foto',
        enableSorting: true,
        cell: ({ row }) => (
            <div className="flex flex-col items-center">
              <img
                src={row.original.rutaImagenUrl } 
                alt="Foto"
                className="object-cover w-10 h-10 mb-2 rounded-full"
              />
              {/* <span className="font-medium text-center text-gray-700">
                {row.original.responsable?.persona?.nombre1}{' '}
                {row.original.responsable?.persona?.apellido1}
              </span> */}
            </div>
          ),
         meta: {
          className: 'w-[150px]',
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
              setIsModalOpen(true);
              setSedes(row.original);
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
              deletePaymentType(row.original.id);
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

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchCentros = async () => {
    setLoading(true);
    try {
      const response = await axios.get('sedes');
      setGestionSedes(response.data);
    } catch (error) {
      setError('Error al cargar las sedes');
    } finally {
      setLoading(false);
    }
  };

  const deletePaymentType = async (id: number) => {
    confirmAction('Esta acción eliminará esta sede.', async () => {
      try {
        await axios.delete(`sedes/${id}`);
        fetchCentros();
      } catch (err) {
        setError(`Error al eliminar el tipo de pago: ${err}`);
      }
    });
  };

  useEffect(() => {
    fetchCentros();
  }, [reload]);

  const handleAfterSave = () => {
    fetchCentros();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return GestionSedes;

    return GestionSedes.filter(
      (sede) =>
        sede.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sede.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sede.responsable?.persona?.nombre1?.toLowerCase().includes(searchTerm.toLowerCase()) 
        // sede.año.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // sede.sede?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, GestionSedes]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Gestion Sedes</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar Sedes"
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
  
      <ModalSedes
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSedes(undefined);
        }}
        data={sede}
        onSave={handleAfterSave}
      />

  
    </div>
  );
};

export { GestionSedesContent };

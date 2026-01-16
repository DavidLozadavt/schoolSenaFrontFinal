import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import ModalPuntosVenta from './ModalPuntosVenta';

interface ContentProps {
  reload: boolean;
}


const PuntosVentaContent = ({ reload }: ContentProps) => {

  const storageFilterId = 'pointV-filter';
  const [PuntosVenta, setPuntosVenta] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [PuntoVentas, setPuntoVentas] = useState<any | undefined>(undefined);
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
        accessorFn: (row) => row.foto,
        id: 'foto',
        header: () => 'foto',
        enableSorting: true,
        cell: ({ row }) => (
            <div className="flex flex-col items-center">
              <img
                src={row.original.imagenUrl } 
                alt="Foto"
                className="object-cover w-10 h-10 mb-2 rounded-full"
              />
            </div>
          ),
         meta: {
          className: 'w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.mombre,
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
        accessorFn: (row) => row.sede,
        id: 'sede',
        header: () => 'Sede',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.sede?.nombre}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.tipo,
        id: 'tipo',
        header: () => 'Tipo',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.tipo?? 'N/A'}</span>,
        meta: {
          className: 'min-w-[150px]',
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
              setPuntoVentas(row.original);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchCentros = async () => {
    setLoading(true);
    try {
      const response = await axios.get('punto_de_ventas');
      setPuntosVenta(response.data);
    } catch (error) {
      setError('Error al cargar los puntos de venta');
    } finally {
      setLoading(false);
    }
  };

  const deletePaymentType = async (id: number) => {
    confirmAction('Esta acción eliminará esta configuración.', async () => {
      try {
        await axios.delete(`punto_de_ventas/${id}`);
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
    if (!searchTerm) return PuntosVenta;

    return PuntosVenta.filter(
      (PointV) =>
        PointV.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        PointV.sede?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, PuntosVenta]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Puntos de venta</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar punto de venta"
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

      <ModalPuntosVenta
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPuntoVentas(undefined);
        }}
        data={PuntoVentas}
        onSave={handleAfterSave}
      />
    </div>
  );
};


export default PuntosVentaContent
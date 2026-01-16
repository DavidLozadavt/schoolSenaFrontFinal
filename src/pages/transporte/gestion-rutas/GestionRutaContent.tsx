import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import ModalInfoRuta from './ModalInfoRuta';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import ModalGestionSubRuta from './SubRutas/ModalGestionSubRuta';
import ModalGestionRuta from './ModalGestionRuta';
import { useSnackbar } from 'notistack';

interface ContentProps {
  reload: boolean;
}

const GestionRutaContent = ({ reload }: ContentProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const StorageFilteredId = 'filtered_id';
  const [rutas, setRutas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalSubRutaOpen, setIsModalSubRutaOpen] = useState(false);
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [ruta, setRuta] = useState<any | undefined>(undefined);
  const { confirmAction } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRutaId, setSelectedRutaId] = useState<number | null>(null);
  const [reloadContent, setReloadContent] = useState(false);

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(StorageFilteredId) || '';
  });

  const fetchRutas = async () => {
    setLoading(true);
    try {
      const response = await axios.get('rutas');
      const formattedData = response.data
        .filter((ruta: any) => !ruta.rutaIda.idRutaPadre)
        .map((ruta: any) => ({
          id: ruta.rutaIda.id,
          codigo: ruta.rutaIda.id,
          origen: ruta.rutaIda.ciudad_origen?.descripcion ?? 'N/A',
          destino: ruta.rutaIda.ciudad_destino?.descripcion ?? 'N/A',
          presupuesto: ruta.rutaIda.precio ?? 0,
          descripcion: ruta.rutaIda.descripcion ?? 'Sin descripción',
          distancia: ruta.rutaIda.distancia ?? 'Desconocida',
          tiempo: ruta.rutaIda.tiempoEstimado ?? 'Desconocido'
        }));

      setRutas(formattedData);
    } catch (error) {
      setError('Error al cargar las rutas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRutas();
  }, [reload]);

 useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const deleteRoute = async (id: number) => {
    confirmAction('Esta acción eliminará esta configuración.', async () => {
      try {
        const response = await axios.delete(`rutas/${id}`);
        
        if (response.status === 200 || response.status === 204) {
          fetchRutas();
          enqueueSnackbar('Ruta eliminada correctamente.', {
            variant: 'solid',
            state: 'success',
          });
        }
      } catch (err) {
        enqueueSnackbar(
          'No se puede eliminar la ruta. Puede que tenga subrutas asociadas o esté en uso.',
          {
            variant: 'solid',
            state: 'danger',
          }
        );
        console.error('Error eliminando ruta:', err);
      }
    });
  };
  
  

  const handleModalClose = () => {
    setModalOpen(false);
  };
  const handleModalEditClose = () => {
    setIsModalEditOpen(false);
  };
  const handleModalOpen = () => {
    setModalOpen(true);
  };

  const handleInfoClick = (idRutaPadre: number) => {
    setSelectedRutaId(idRutaPadre);
    handleModalOpen();
  };

  const handleModalCloseSubRuta = () => {
    setIsModalSubRutaOpen(false);
    setSelectedRutaId(null);
  };

  const handleAddSubRuta = (idRutaPadre: number) => {
    setSelectedRutaId(idRutaPadre);
    setIsModalSubRutaOpen(true);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setIsModalSubRutaOpen(false);
  };

const filteredData = useMemo(() => {
  if (!searchTerm) return rutas;

  return rutas.filter((ruta) => {
    const term = searchTerm.toLowerCase();
    return (
      ruta.origen?.toLowerCase().includes(term) ||
      ruta.destino?.toLowerCase().includes(term) ||
      ruta.descripcion?.toLowerCase().includes(term) ||
      ruta.tiempo?.toLowerCase().includes(term) ||
      ruta.distancia?.toLowerCase().includes(term) ||
      ruta.presupuesto?.toString().includes(term)
    );
  });
}, [searchTerm, rutas]);


  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.codigo,
        id: 'codigo',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.codigo}</span>,
        meta: {
          className: 'w-[100px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.origen,
        id: 'origen',
        header: () => 'Origen',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.origen}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.destino,
        id: 'destino',
        header: () => 'Destino',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.destino}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.distancia,
        id: 'distancia',
        header: () => 'Distancia',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.distancia}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.descripcion,
        id: 'tiempo',
        header: () => 'Tiempo',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.tiempo}</span>,
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
              setIsModalEditOpen(true);
              setRuta(row.original);
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
              deleteRoute(row.original.id);
            }}
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      },
      {
        id: 'show',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              handleInfoClick(row.original.id);
            }}
          >
            <KeenIcon icon="eye" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      },
      {
        id: 'add',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              handleAddSubRuta(row.original.id);
            }}
          >
            <KeenIcon icon="plus" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      }
    ],
    []
  );

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Rutas</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar Rutas..."
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
      <ModalInfoRuta 
      idRutaPadre={selectedRutaId}
       open={modalOpen}
       onClose={handleModalClose} />

      <ModalGestionSubRuta
        open={isModalSubRutaOpen}
        onClose={handleModalCloseSubRuta}
        idRutaPadre={selectedRutaId}
        onSave={handleAfterSave}
      />
      <ModalGestionRuta
        open={isModalEditOpen}
        onClose={handleModalEditClose}
        data={ruta}
       onSave={handleAfterSave}
      />
    </div>
  );
};

export default GestionRutaContent;

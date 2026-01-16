import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import Spinner from '@/components/loaders/Spinner';
import { ModalCambiarEstado } from './ModalCambiarEstado';
import Swal from 'sweetalert2';
import { ModalVehiculoAfiliacion } from './ModalVehiculoAfiliacion';
import { ModalTrazabilidadAfiliacion } from './ModalTrazabilidadAfiliacion';
import { ModalHistorialAfiliacion } from './ModalHistorialAfiliacion';
import { ModalContratoVinculacionContent } from './ModalContratoVinculacionContent';

interface ContentProps {
  reload: boolean;
}

const AfiliacionesContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'afiliacionesCont-filter';
  const [afiliaciones, setAfiliaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenCambiarEstado, setIsModalOpenCambiarEstado] = useState(false);
  const [isModalTrazabilidad, setIsModalTrazabilidad] = useState(false);
  const [isModalHistorial, setIsModalHistorial] = useState(false);
  const [contratosModal, setContratosModal] = useState<boolean>(false);
  const [afiliacion, setAfiliacion] = useState<any | undefined>(undefined);
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
    from: 0,
    to: 0,
    prev_page_url: null,
    next_page_url: null
  });

  const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;

  const isDarkMode = theme === 'dark';
  const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
  const color = isDarkMode ? 'white' : '#4B5675';
  const iconColor = isDarkMode ? 'white' : '#4B5675';

  const handleConfirmChageState = async () => {
    Swal.fire({
      title: '¿Estás seguro?',
      icon: 'warning',
      text: 'Esta acción cambiará el estado de la vinculación',
      showCancelButton: true,
      confirmButtonText: 'Sí, Confirmar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-sm btn-danger',
        cancelButton: 'btn btn-sm btn-light'
      },
      background,
      color,
      iconColor
    }).then((result: any) => {
      if (result.isConfirmed) {
        setIsModalOpenCambiarEstado(true);
      }
    });
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'propietario',
        header: () => 'Propietario',
        enableSorting: true,
        cell: ({ row }) => {
          const propietario = row.original.propietario?.[0];

          if (!propietario) {
            return <span className="text-gray-500 italic">Sin propietario administrador</span>;
          }

          return (
            <div className="flex flex-col items-center">
              <img
                src={propietario.rutaFotoUrl}
                alt="Foto"
                className="w-10 h-10 rounded-full object-cover mb-2"
              />
              <span className="text-gray-700 font-medium text-center">
                {propietario.nombre1} {propietario.apellido1}
              </span>
            </div>
          );
        },
        meta: {
          className: 'min-w-[130px]',
          cellClassName: 'items-center justify-center'
        }
      },

      {
        accessorFn: (row) => row.fechaAfiliacion,
        id: 'fechaAfiliacion',
        header: () => 'Fecha de Vinculación',
        enableSorting: true,
        cell: (info) => {
          const fecha = info.row.original.fechaAfiliacion;
          return (
            <span className="text-gray-700">
              {fecha ? fecha : 'Aún no registra fecha de vinculación'}
            </span>
          );
        },
        meta: {
          className: 'min-w-[180px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaFinalAfiliacion,
        id: 'fechaFinalAfiliacion',
        header: () => 'Fecha Final de Vinculación',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">{info.row.original.fechaFinalAfiliacion}</span>
        ),
        meta: {
          className: 'min-w-[160px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.numero,
        id: 'numero',
        header: () => 'Número de orden',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.numero}</span>,
        meta: {
          className: 'min-w-[160px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) =>
          row.vehiculo.length > 0 ? row.vehiculo[0].placa : 'No hay vehículos activos',
        id: 'vehiculo[0].placa',
        header: () => 'Placa',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.vehiculo.length > 0
              ? info.row.original.vehiculo[0].placa
              : 'No hay vehículos activos'}
          </span>
        ),
        meta: {
          className: 'min-w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.tipoVinculacion,
        id: 'tipoVinculacion',
        header: () => 'Tipo de Vinculación',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.tipo_afiliacion[0].tipoAfiliacion}
          </span>
        ),
        meta: {
          className: 'w-[160px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => (
          <span
            onClick={() => {
              handleConfirmChageState();
              setAfiliacion(info.row.original);
            }}
            className={`badge text-sm badge-outline cursor-pointer ${
              info.row.original.estado === 'INACTIVO'
                ? 'badge-danger'
                : info.row.original.estado === 'PENDIENTE'
                  ? 'badge-warning'
                  : 'badge-primary'
            }`}
          >
            {info.row.original.estado}
          </span>
        ),

        meta: {
          className: 'w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        id: 'afiliacion',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            title="Vehículos, propietarios y conductores"
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setAfiliacion(row.original);
              setIsModalOpen(true);
            }}
          >
            <KeenIcon icon="car" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      },
      {
        id: 'historial',
        header: () => '',

        enableSorting: false,
        cell: ({ row }) => (
          <button
            title="Historial"
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setAfiliacion(row.original);
              setIsModalHistorial(true);
            }}
          >
            <KeenIcon icon="book" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      },
      {
        id: 'contrato',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            title="Contrato"
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setAfiliacion(row.original);
              setContratosModal(true);
            }}
          >
            <KeenIcon icon="bookmark-2" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      },

      {
        id: 'trazabilidad',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setAfiliacion(row.original);
              setIsModalTrazabilidad(true);
            }}
          >
            <KeenIcon icon="chart-line-up" />
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

  const fetchVinculaciones = async (page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`get_afiliaciones`, {
        params: {
          page,
          per_page: perPage,
          search: searchTerm
        }
      });

      setAfiliaciones(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
        from: response.data.from,
        to: response.data.to,
        per_page: perPage,
        next_page_url: response.data.next_page_url,
        prev_page_url: response.data.prev_page_url
      });
    } catch (error) {
      setError('Error al cargar las vinculaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVinculaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, searchTerm]);

  const handleAfterSave = () => {
    fetchVinculaciones();
    setIsModalOpenCambiarEstado(false);
  };

  // const filteredData = useMemo(() => {
  //   if (!searchTerm) return afiliaciones;

  //   return afiliaciones.filter(
  //     (resp) =>
  //       resp.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       resp.fechaAfiliacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       resp.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       resp.vehiculo[0]?.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       resp.tipo_afiliacion[0].tipoAfiliacion.toLowerCase().includes(searchTerm.toLowerCase())
  //   );
  // }, [searchTerm, afiliaciones]);

  return (
    <div className="card card-grid min-w-full">
      {loading && <Spinner />}
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Vinculaciones</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Vinculaciones"
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
        <div className="card-body">
          <DataGrid
            key={JSON.stringify(afiliaciones)}
            columns={columns}
            nativePagination={true}
            data={afiliaciones}
          />
        </div>

        {/* <div className="card-footer justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
          <div className="flex items-center gap-2">
            Mostrando
            <select
              className="select select-sm w-16"
              value={pagination.per_page}
              onChange={(e) => fetchVinculaciones(1, +e.target.value)}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            Por página
          </div>
          <div className="flex items-center gap-4 order-1 md:order-2">
            <span>
              {pagination.from} - {pagination.to} de {pagination.total}
            </span>
            <div className="pagination flex gap-2">
              <button
                className="btn"
                disabled={!pagination.prev_page_url}
                onClick={() => fetchVinculaciones(pagination.current_page - 1)}
              >
                <KeenIcon icon="black-left" />
              </button>
              {[...Array(pagination.last_page)].map((_, index) => (
                <button
                  key={index + 1}
                  className={`btn ${pagination.current_page === index + 1 ? 'btn-active' : ''}`}
                  onClick={() => fetchVinculaciones(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                className="btn"
                disabled={!pagination.next_page_url}
                onClick={() => fetchVinculaciones(pagination.current_page + 1)}
              >
                <KeenIcon icon="black-right" />
              </button>
            </div>
          </div>
        </div> */}
      </div>

      <ModalCambiarEstado
        open={isModalOpenCambiarEstado}
        onClose={() => {
          setIsModalOpenCambiarEstado(false);
          setAfiliacion(undefined);
        }}
        data={afiliacion}
        onSave={handleAfterSave}
      />

      <ModalVehiculoAfiliacion
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAfiliacion(undefined);
        }}
        data={afiliacion}
        onSave={handleAfterSave}
      />

      <ModalContratoVinculacionContent
        open={contratosModal}
        onClose={() => {
          setContratosModal(false);
        }}
        data={afiliacion}
      />

      <ModalTrazabilidadAfiliacion
        open={isModalTrazabilidad}
        onClose={() => {
          setIsModalTrazabilidad(false);
          setAfiliacion(undefined);
        }}
        data={afiliacion}
      />

      <ModalHistorialAfiliacion
        open={isModalHistorial}
        onClose={() => {
          setIsModalHistorial(false);
          setAfiliacion(undefined);
        }}
        data={afiliacion}
      />
    </div>
  );
};

export { AfiliacionesContent };

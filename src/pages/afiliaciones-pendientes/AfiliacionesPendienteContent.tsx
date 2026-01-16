import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import Spinner from '@/components/loaders/Spinner';

import { ModalVehiculoAfiliacion } from './ModalVehiculoAfiliacion';
import { ModalFormPersonaNatural } from './ModalFormPersonaNatural';
import { ModalFormPersonaJuridica } from './ModalFormPersonaJuridica';
import { ModalAceptarRechazarVinculacion } from './ModalAceptarRechazarVinculacion';

interface ContentProps {
  reload: boolean;
}

const AfiliacionesPendienteContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'afiliaciones-pendiente-Cont-filter';
  const [afiliaciones, setAfiliaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalAcceptReject, setIsModalAcceptReject] = useState(false);
  const [isModalNatural, setIsModalNatural] = useState(false);
  const [isModalJuridica, setIsModalJuridica] = useState(false);

  const [afiliacion, setAfiliacion] = useState<any | undefined>(undefined);

  const [propietario, setPropietario] = useState<any | undefined>(undefined);
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
        accessorFn: (row) => row.created_at,
        id: 'created_at',
        header: () => 'Fecha de Creación Vinculación',
        enableSorting: true,
        cell: (info) => {
          const fecha = info.row.original.created_at;
          if (!fecha) {
            return <span className="text-gray-700">Aún no registra fecha de creación</span>;
          }

          const date = new Date(fecha);
          const dia = String(date.getDate()).padStart(2, '0');
          const mes = String(date.getMonth() + 1).padStart(2, '0');
          const anio = date.getFullYear();

          const horas = String(date.getHours()).padStart(2, '0');
          const minutos = String(date.getMinutes()).padStart(2, '0');

          const fechaFormateada = `${dia}-${mes}-${anio} ${horas}:${minutos}`;

          return <span className="text-gray-700">{fechaFormateada}</span>;
        },
        meta: {
          className: 'min-w-[200px]',
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
        id: 'completarInfo',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => {
          const propietario = row.original.propietario?.[0];

          return (
            <button
              title="Completar información propietaro"
              className="btn btn-sm btn-icon btn-clear btn-light"
              onClick={() => {
                setPropietario(propietario);

                if (propietario?.tipoTitular === 'PERSONA NATURAL') {
                  setIsModalNatural(true);
                } else if (propietario?.tipoTitular === 'PERSONA JURIDICA') {
                  setIsModalJuridica(true);
                } else {
                  console.warn('tipoTitular no definido');
                }
              }}
            >
              <KeenIcon icon="pencil" />
            </button>
          );
        },
        meta: { className: 'w-[60px]' }
      },
      {
        id: 'aceptar',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => {
          const propietario = row.original.propietario?.[0];
          const vehiculo = row.original.vehiculo?.[0];

          const handleDownloadPdf = async () => {
            if (!propietario || !vehiculo) {
              console.warn('Propietario o vehículo no encontrado');
              return;
            }

            try {
              let url = '';
              if (propietario.tipoTitular === 'PERSONA NATURAL') {
                url = `/pdf_persona_natural/${propietario.id}/${vehiculo.id}`;
              } else if (propietario.tipoTitular === 'PERSONA JURIDICA') {
                url = `/pdf_persona_juridica/${propietario.id}/${vehiculo.id}`;
              } else {
                console.warn('tipoTitular no definido');
                return;
              }

              const response = await axios.get(url, {
                responseType: 'blob' 
              });

              const fileURL = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = fileURL;
              link.setAttribute('download', 'afiliacion.pdf');
              document.body.appendChild(link);
              link.click();
              link.remove();
            } catch (error) {
              console.error('Error descargando el PDF:', error);
            }
          };

          return (
            <button
              title="Generar PDF"
              onClick={handleDownloadPdf}
              className="btn btn-sm btn-icon btn-clear btn-light"
            >
              <KeenIcon icon="file-down" className="text-xl text-blue-600" />
            </button>
          );
        },
        meta: { className: 'w-[60px]' }
      },

      {
        id: 'aceptar',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => {
          const propietario = row.original.propietario?.[0]?.id;
          const vehiculo = row.original.vehiculo?.[0]?.id;

          return (
            <button
              title="Aceptar o rechazar"
              onClick={() => {
                setAfiliacion(row.original);
                setIsModalAcceptReject(true);
              }}
              className="btn btn-sm btn-icon btn-clear btn-light"
            >
              <KeenIcon icon="double-check" className="text-xl text-green-600" />
            </button>
          );
        },
        meta: { className: 'w-[60px]' }
      }
    ],

    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchVinculaciones = async (page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`get_afiliaciones_pendientes`, {
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
  };

  return (
    <div className="card card-grid min-w-full">
      {loading && <Spinner />}
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Vinculaciones Pendientes</h3>
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

      <ModalVehiculoAfiliacion
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAfiliacion(undefined);
        }}
        data={afiliacion}
        onSave={handleAfterSave}
      />

      <ModalAceptarRechazarVinculacion
        open={isModalAcceptReject}
        onClose={() => {
          setIsModalAcceptReject(false);
          setAfiliacion(undefined);
        }}
        afiliacion={afiliacion}
        onSave={handleAfterSave}
      />

      <ModalFormPersonaNatural
        open={isModalNatural}
        onClose={() => {
          setIsModalNatural(false);
          setAfiliacion(undefined);
        }}
        propietario={propietario}
        onSave={handleAfterSave}
      />

      <ModalFormPersonaJuridica
        open={isModalJuridica}
        onClose={() => {
          setIsModalJuridica(false);
          setAfiliacion(undefined);
        }}
        propietario={propietario}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { AfiliacionesPendienteContent };

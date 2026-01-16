import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { Fragment, useRef } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { useLayout } from '@/providers';

import { useConfirm } from '@/hooks';
import { ModalObservacacionesVacaciones } from '../ModalObservacacionesVacaciones';
import { ModalCommentsVacaciones } from './ModalCommentsVacaciones';
import { SolicitudVacacionesSupervisorInterface } from '../models/SolicitudesSupervisor';
import { ModalCreateSolicitudVacaciones } from './ModalCreateSolicitudVacaciones';
import clsx from 'clsx';

interface ContentProps {
  reload?: boolean;
}

const SolicitudVacacionesAdminPage = ({ reload }: ContentProps) => {
  const { currentLayout } = useLayout();
  const storageFilterId = 'solicitud_vacaciones_admin-filter';
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenObservacion, setIsModalOpenObservacion] = useState(false);
  const [isModalOpenComentario, setIsModalOpenComentario] = useState(false);
  const { confirmAction } = useConfirm();
  const [solicitud, setSolicitud] = useState<SolicitudVacacionesSupervisorInterface | undefined>(
    undefined
  );
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const [solicitudes, setSolicitudes] = useState<SolicitudVacacionesSupervisorInterface[]>([]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'trabajador',
        header: () => 'Trabajador',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col items-center">
            <img
              src={row.original.vacaciones[0]?.contrato?.persona?.rutaFotoUrl}
              alt="Foto"
              className="w-10 h-10 rounded-full object-cover mb-2"
            />
            <span className="text-gray-700 font-medium text-center">
              {row.original.vacaciones[0]?.contrato?.persona?.nombre1}{' '}
              {row.original.vacaciones[0]?.contrato?.persona?.apellido1}
            </span>
          </div>
        ),
        meta: {
          className: 'min-w-[130px]',
          cellClassName: 'items-center justify-center'
        }
      },
      {
        accessorFn: (row) => row.identificacion,
        id: 'identificacion',
        header: () => 'Identificación',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.vacaciones[0]?.contrato?.persona?.identificacion}
          </span>
        ),
        meta: {
          className: 'min-w-[130px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaSolicitud,
        id: 'fechaSolicitud',
        header: () => 'Fecha Solicitud',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.fechaSolicitud}</span>,
        meta: {
          className: 'min-w-[130px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaLiquidacion,
        id: 'fechaLiquidacion',
        header: () => 'Fecha Liquidación',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.fechaLiquidacion}</span>,
        meta: {
          className: 'min-w-[130px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaEjecucion,
        id: 'fechaEjecucion',
        header: () => 'Fecha Ejecución',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.fechaEjecucion}</span>,
        meta: {
          className: 'min-w-[130px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.periodos,
        id: 'periodos',
        header: () => 'Periodo',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.periodos}</span>,
        meta: {
          className: 'min-w-[100px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.numDias,
        id: 'numDias',
        header: () => 'N° de Días',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.numDias}</span>,
        meta: {
          className: 'min-w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.valor,
        id: 'valor',
        header: () => 'Valor',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {`$ ${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(
              info.row.original.valor
            )}`}
          </span>
        ),
        meta: {
          className: 'min-w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaFinal,
        id: 'fechaFinal',
        header: () => 'Fecha Final',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.fechaFinal}</span>,
        meta: {
          className: 'min-w-[130px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
             accessorKey: 'estado',
             header: () => 'Estado',
             enableSorting: true,
             cell: (info) => {
               const estado = info.getValue() as string;
     
               return (
                 <span
                   className={clsx('badge badge-outline', {
                     'badge-danger': estado === 'RECHAZADO',
                     'badge-primary': estado === 'ACEPTADO',
                     'badge-warning': estado === 'PENDIENTE'
                   })}
                 >
                   {estado}
                 </span>
               );
             },
             meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700 font-medium' }
           },
      {
        id: 'acciones',
        header: () => 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.estado !== 'ACEPTADO' && (
              <button
                className="p-2 rounded-lg hover:bg-gray-300  transition-colors cursor-pointer"
                title="Aceptar"
                onClick={() => {
                  setIsModalOpenComentario(true);
                  setSolicitud(row.original);
                }}
              >
                <KeenIcon icon="double-check" className="text-xl text-green-600" />
              </button>
            )}

            <button
              className="p-2 rounded-lg hover:bg-gray-300  transition-colors cursor-pointer"
              title="Observación"
              onClick={() => {
                setIsModalOpenObservacion(true);
                setSolicitud(row.original);
              }}
            >
              <KeenIcon icon="messages" className="text-xl text-blue-600" />
            </button>
          </div>
        ),
        meta: {
          className: 'w-[100px]'
        }
      }
    ],
    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await axios.post('solicitud_vacaciones_by_supervisor');
      setSolicitudes(response.data.solicitudes);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleAfterSave = () => {
    fetchSolicitudes();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return solicitudes;

    return solicitudes.filter((dat) => {});
  }, [searchTerm, solicitudes]);

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <h1 className="text-xl font-semibold leading-none text-gray-900">
                Solicitud de Vacaciones - Supervisor
              </h1>
              <ToolbarDescription>Gestiona Las Solicitudes de Vacaciones</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-light" onClick={handleModalOpen}>
                Crear Solicitud
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="card card-grid min-w-full">
          <div className="card-header flex-wrap py-5">
            <h3 className="card-title">Solicitudes de Vacaciones</h3>
            <div className="flex gap-6">
              <div className="relative">
                <KeenIcon
                  icon="magnifier"
                  className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
                />
                <input
                  type="text"
                  placeholder="Buscar Solicitudes"
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
            />
          </div>

          <ModalObservacacionesVacaciones
            open={isModalOpenObservacion}
            onClose={() => {
              setIsModalOpenObservacion(false);
            }}
            data={solicitud}
          />

          <ModalCommentsVacaciones
            open={isModalOpenComentario}
            onClose={() => {
              setIsModalOpenComentario(false);
              setSolicitud(undefined);
            }}
            data={solicitud}
            onSave={handleAfterSave}
          />
        </div>
      </Container>

      <Container>
        <ModalCreateSolicitudVacaciones
          open={isModalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />
      </Container>
    </Fragment>
  );
};

export { SolicitudVacacionesAdminPage };

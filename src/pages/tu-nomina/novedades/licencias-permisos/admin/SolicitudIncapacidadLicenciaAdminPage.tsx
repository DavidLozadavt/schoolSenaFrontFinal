import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';

import { useConfirm } from '@/hooks';
import { SolicitudesIncapacidadInterface } from '../../models/SolicitudesIncapacidadInterface';
import { ModalAceptarSolicitudLicencia } from './ModalAceptarSolicitudLicencia';
import { ModalObservacacionesLicencias } from '../ModalObservacacionesLicencias';
import { ModalCreateIncapacidadLicencia } from './ModalCreateIncapacidadLicencia';
import clsx from 'clsx';
import { ModalExtenderSolicitudIncapacidadLicenciaAdmin } from './ModalExtenderSolicitudIncapacidadLicenciaAdmin';
import { ModalTrazabilidadLicencias } from './ModalTrazabilidadLicencias';

interface ContentProps {
  reload?: boolean;
}

const SolicitudIncapacidadLicenciaAdminPage = ({ reload }: ContentProps) => {
  const { currentLayout } = useLayout();
  const storageFilterId = 'solicitud_incapacidad_admin-filter';
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenObservacion, setIsModalOpenObservacion] = useState(false);
  const [isModalOpenComentario, setIsModalOpenComentario] = useState(false);
  const [isModalExtenderSolicitud, setIsModalExtenderSolicitud] = useState(false);
  const [solicitud, setSolicitud] = useState<SolicitudesIncapacidadInterface | undefined>(
    undefined
  );
  const [solicitudes, setSolicitudes] = useState<SolicitudesIncapacidadInterface[]>([]);
  const [isModalTrazabilidad, setIsModalTrazabilidad] = useState(false);
  const { confirmAction } = useConfirm();

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'trabajador',
        header: () => 'Trabajador',
        enableSorting: true,
        cell: ({ row }) => {
          const persona = row.original?.contrato?.persona;
          return (
            <div className="flex flex-col items-center text-center">
              <img
                src={persona?.rutaFotoUrl}
                alt="Foto"
                className="w-10 h-10 rounded-full object-cover mb-2 border border-gray-300 dark:border-gray-600"
              />
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {persona?.nombre1} {persona?.apellido1}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {persona?.identificacion}
              </span>
            </div>
          );
        },
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'items-center justify-center'
        }
      },
      {
        accessorFn: (row) => row.tipo,
        id: 'tipo',
        header: () => 'Tipo',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.tipo_incapacidad.tipoIncapacidad}
          </span>
        ),
        meta: {
          className: 'min-w-[120px]',
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
        accessorFn: (row) => row.fechaInicial,
        id: 'fechaInicial	',
        header: () => 'Fecha Inicial',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.fechaInicial}</span>,
        meta: {
          className: 'min-w-[130px]',
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
        cell: (info) => (
          <span className="text-gray-700">
            {`$ ${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(
              info.row.original.valor
            )}`}
          </span>
        ),
        meta: {
          className: 'min-w-[130px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.responsable,
        id: 'responsable',
        header: () => 'Responsable',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">{info.row.original.tipo_incapacidad.responsable}</span>
        ),
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
        cell: ({ row }) => {
          const solicitud = row.original;
          const tipo = solicitud?.tipo_incapacidad;
          const puedeExtender = tipo?.actualizar === 'SI';
          const noExtender = solicitud?.noExtender === true;
          const esSolicitudPrincipal = solicitud?.idSolicitudPrincipal === null;

          return (
            <div className="flex justify-center gap-1">
             
              <button
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Aceptar"
                onClick={() => {
                  setIsModalOpenComentario(true);
                  setSolicitud(solicitud);
                }}
              >
                <KeenIcon icon="double-check" className="text-xl text-green-600" />
              </button>

              <button
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Observación"
                onClick={() => {
                  setIsModalOpenObservacion(true);
                  setSolicitud(solicitud);
                }}
              >
                <KeenIcon icon="messages" className="text-xl text-blue-600" />
              </button>

              {puedeExtender && !noExtender && (
                <button
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Extender"
                  onClick={() => {
                    setIsModalExtenderSolicitud(true);
                    setSolicitud(solicitud);
                  }}
                >
                  <KeenIcon icon="double-right-arrow" className="text-xl text-green-600" />
                </button>
              )}

  
              {esSolicitudPrincipal && (
                <button
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Trazabilidad de la solicitud"
                  onClick={() => {
                    setIsModalTrazabilidad(true);
                    setSolicitud(solicitud);
                  }}
                >
                  <KeenIcon icon="book" className="text-xl text-green-600" />
                </button>
              )}
            </div>
          );
        },
        meta: {
          className: 'w-[120px]'
        }
      }
    ],
    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchSoliciutudesIncapacidadPersona = async () => {
    setLoading(true);
    try {
      const response = await axios.get('solicitud_inc_personas');
      setSolicitudes(response.data.solicitudes);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoliciutudesIncapacidadPersona();
  }, []);

  const handleAfterSave = () => {
    fetchSoliciutudesIncapacidadPersona();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return solicitudes;

    return solicitudes.filter((dat) => {
      const fechaSolicitudMatch = dat.fechaSolicitud.includes(searchTerm);
      const fechaInicialMatch = dat.fechaInicial.includes(searchTerm);
      const fechaFinalMatch = dat.fechaFinal.includes(searchTerm);
      const tipoIncapacidadMatch = dat.tipo_incapacidad?.tipoIncapacidad
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      return fechaSolicitudMatch || fechaInicialMatch || fechaFinalMatch || tipoIncapacidadMatch;
    });
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
                Solicitud de Incapacidades y Licencias - Supervisor
              </h1>
              <ToolbarDescription>
                Gestiona Las Solicitudes de Incapacidades y Licencias
              </ToolbarDescription>
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
            <h3 className="card-title">Solicitudes de Incapacidades y Licencias</h3>
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

          <ModalObservacacionesLicencias
            open={isModalOpenObservacion}
            onClose={() => {
              setIsModalOpenObservacion(false);
            }}
            data={solicitud}
          />

          <ModalAceptarSolicitudLicencia
            open={isModalOpenComentario}
            onClose={() => {
              setIsModalOpenComentario(false);
            }}
            onSave={handleAfterSave}
            data={solicitud}
          />

          <ModalCreateIncapacidadLicencia
            open={isModalOpen}
            onClose={handleModalClose}
            onSave={handleAfterSave}
          />

          <ModalExtenderSolicitudIncapacidadLicenciaAdmin
            open={isModalExtenderSolicitud}
            onClose={() => {
              setIsModalExtenderSolicitud(false);
              setSolicitud(undefined);
            }}
            data={solicitud}
            onSave={handleAfterSave}
          />

          <ModalTrazabilidadLicencias
            open={isModalTrazabilidad}
            onClose={() => {
              setIsModalTrazabilidad(false);
              setSolicitud(undefined);
            }}
            data={solicitud}
            onSave={handleAfterSave}
          />
        </div>
      </Container>
    </Fragment>
  );
};

export { SolicitudIncapacidadLicenciaAdminPage };

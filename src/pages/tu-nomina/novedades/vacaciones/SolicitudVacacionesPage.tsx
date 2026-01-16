import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { Fragment, useRef } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarActions, ToolbarDescription, ToolbarHeading } from '@/partials/toolbar';
import { useLayout } from '@/providers';

import { useConfirm } from '@/hooks';
import { ModalSolictudVacaciones } from './ModalSolictudVacaciones';
import { ModalObservacacionesVacaciones } from './ModalObservacacionesVacaciones';
import { SolicitudVacacionInterface } from './models/SolicitudesInterface';
import clsx from 'clsx';

interface ContentProps {
  reload?: boolean;
}

const SolicitudVacacionesPage = ({ reload }: ContentProps) => {
  const { currentLayout } = useLayout();
  const storageFilterId = 'solcitudes_vacaciones_empleado-filter';
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenObservacion, setIsModalOpenObservacion] = useState(false);
  const { confirmAction } = useConfirm();
  const [solicitud, setSolicitud] = useState<SolicitudVacacionInterface | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const [solicitudes, setSolicitudes] = useState<SolicitudVacacionInterface[]>([]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'codigo',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: {
          className: 'min-w-[90px]',
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
          className: 'min-w-[120px]',
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
          className: 'min-w-[120px]',
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
          className: 'min-w-[120px]',
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
          className: 'min-w-[110px]',
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
          const estado = row.original.estado;

          return (
            <div className="text-center">
              {estado !== 'ACEPTADO' && (
                <button
                  className="p-1"
                  title="Editar"
                  onClick={() => {
                    setIsModalOpen(true);
                    setSolicitud(row.original);
                  }}
                >
                  <KeenIcon icon="notepad-edit" className="text-xl" />
                </button>
              )}{' '}
              <button
                title="Observación"
                onClick={() => {
                  setIsModalOpenObservacion(true);
                  setSolicitud(row.original);
                }}
              >
                <KeenIcon icon="messages" className="text-xl" />
              </button>
            </div>
          );
        },
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
      const response = await axios.get('solicitud_vacaciones');
      setSolicitudes(response.data);
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

    return solicitudes.filter((dat) => {
      const fechaSolicitud = String(dat.fechaSolicitud || '').toLowerCase();
      const fechaEjecucion = String(dat.fechaEjecucion || '').toLowerCase();
      const periodos = String(dat.periodos || '').toLowerCase();
      const estado = String(dat.estado || '').toLowerCase();
      const numDias = String(dat.numDias || '').toLowerCase();
      const valor = String(dat.valor || '').toLowerCase();
      const fechaFinal = String(dat.fechaFinal || '').toLowerCase();

      const search = searchTerm.toLowerCase();

      return (
        fechaSolicitud.includes(search) ||
        fechaEjecucion.includes(search) ||
        periodos.includes(search) ||
        estado.includes(search) ||
        numDias.includes(search) ||
        valor.includes(search) ||
        fechaFinal.includes(search)
      );
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
                Solicitud de Vacaciones - Trabajador
              </h1>
              <ToolbarDescription>Gestiona Tus Solicitudes de Vacaciones</ToolbarDescription>
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

          <ModalSolictudVacaciones
            open={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSolicitud(undefined);
            }}
            onSave={handleAfterSave}
            data={solicitud}
          />

          <ModalObservacacionesVacaciones
            open={isModalOpenObservacion}
            onClose={() => {
              setIsModalOpenObservacion(false);
              setSolicitud(undefined);
            }}
            data={solicitud}
          />
        </div>
      </Container>
    </Fragment>
  );
};

export { SolicitudVacacionesPage };

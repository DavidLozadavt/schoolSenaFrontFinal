import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { ViajesModel } from '@/pages/transporte/cronograma-rutas/model/ViajesInterface';
import ModalAsignarConductor from '@/pages/transporte/cronograma-rutas/ModalAsignarConductor';
import ModalAsignarVehiculo from '@/pages/transporte/cronograma-rutas/ModalAsignarVehiculo';
import ModalAgendarViajes from '@/pages/transporte/cronograma-rutas/ModalAgendarViajes';
import Temporizador from './TemporizadorViaje';
import { useConfirm } from '@/hooks';

import ModalVentaTickets from './VentaTickets/ModalVentaTickets';
import ModalObservaciones from './ModalObservaciones';
import ModalPdfViewer from './ModalPdfViewer';
import ModalRevisionPreoperacional from './MoldalRevisionPreoperacional';
import { useSnackbar } from 'notistack';
import ModalDescuentosPlanillaViaje from './MoldalDescuentosPlanillaViaje';
import { CommonAvatar } from '@/partials/common';
import ModalReservaTickets from './VentaTickets/ModalReservaTickets';

interface CajaContentProps {
  reload?: boolean;
  idPunto?: any;
}

const CajaContent = ({ reload, idPunto }: CajaContentProps) => {
  const StorageFilteredId = 'filtered_id';
  const [viajes, setViajes] = useState<ViajesModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1
  });
  const [selectedViajeId, setSelectedViajeId] = useState<number | null>(null);
  const { confirmAction } = useConfirm();

  const [isVehiculoModalOpen, setIsVehiculoModalOpen] = useState(false);
  const [isModalAgendarOpen, setIsModalAgendarOpen] = useState(false);
  const [isConductorModalOpen, setIsConductorModalOpen] = useState(false);
  const [isModalVentaTicketsOpen, setIsModalVentaTicketsOpen] = useState(false);
  const [isModalObservacionesOpen, setIsModalObservacionesOpen] = useState(false);
  const [selectedViaje, setSelectedViaje] = useState<ViajesModel | null>(null);
  const [modalPdfOpen, setModalPdfOpen] = useState(false);
  const [isModalRevisionOpen, setIsModalRevisionOpen] = useState(false);
  const [isModalDescuentosOpen, setIsModalDescuentosOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedRutaId, setSelectedRutaId] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const [accionPendiente, setAccionPendiente] = useState<{
    tipo: string | null;
    viajeId: number | null;
  }>({ tipo: null, viajeId: null });

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(StorageFilteredId) || '';
  });
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<{ [key: number]: number }>({});
  const [idCajaTienda, setIdCajaTienda] = useState<number | null>(null);
  const [isModalReservaTicketsOpen, setIsModalReservaTicketsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchViajes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('viajes', { params: { page } });
      setViajes(response.data.viajes);
      setPagination({
        total: response.data.total,
        currentPage: page
      });
    } catch (err) {
      setError(`Error fetching viajes: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViajes(pagination.currentPage);
  }, [reload]);

  const handleTimeUpdate = (id: number, time: number) => {
    setTiempoTranscurrido((prev) => ({
      ...prev,
      [id]: time
    }));
  };

  const actualizarEstadoViaje = async (id: number) => {
    try {
      await axios.patch(`/viajes/${id}`, {
        estado: 'EN VIAJE'
      });
      await registrarCambioEstado(id, 'EN VIAJE', tiempoTranscurrido[id]);
      fetchViajes(pagination.currentPage);
      generatePlanillaPDF(id);
    } catch (err) {
      setError(`Error actualizando el estado del viaje: ${err}`);
    }
  };

  const cambiarEstadoAPlanilla = async (id: number) => {
    try {
      await axios.patch(`/viajes/${id}`, {
        estado: 'PLANILLA'
      });
      await registrarCambioEstado(id, 'PLANILLA', tiempoTranscurrido[id]);
      fetchViajes(pagination.currentPage);
    } catch (err) {
      setError(`Error cambiando el estado a planilla: ${err}`);
    }
  };

  const cambiarEstadoCancelado = async (id: number) => {
    try {
      await axios.patch(`/viajes/${id}`, {
        estado: 'CANCELADO'
      });
      await registrarCambioEstado(id, 'CANCELADO', tiempoTranscurrido[id]);
      fetchViajes(pagination.currentPage);
    } catch (err) {
      setError(`Error cambiando el estado a cancelado: ${err}`);
    }
  };

  const registrarCambioEstado = async (
    idViaje: number,
    estado: string,
    tiempoTranscurrido: number
  ) => {
    try {
      await axios.post('/estado_viaje', {
        estado: estado,
        idViaje: idViaje,
        tiempoTranscurrido: tiempoTranscurrido
      });
    } catch (err) {
      console.error(`Error registrando el cambio de estado: ${err}`);
    }
  };

  const generatePlanillaPDF = async (idViaje: number) => {
    try {
      const response = await axios.get('/generate_planilla_pdf', {
        params: {
          idViaje: idViaje,
          action: 'generate_ticket'
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      setPdfUrl(url);
      setModalPdfOpen(true);
    } catch (err) {
      setError(`Error generando la planilla PDF: ${err}`);
    }
  };

  const generateTiketAlcoholimetria = async (idViaje: number) => {
    try {
      const response = await axios.get('/generate_alcoholimetria_conductor', {
        params: {
          idViaje: idViaje,
          action: 'generate_ticket_alcoholimetria'
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      setPdfUrl(url);
      setModalPdfOpen(true);
    } catch (err) {
      setError(`Error generando la planilla PDF: ${err}`);
    }
  };
  const handleAfterSave = () => {
    fetchViajes();
    setIsModalOpen(false);
  };

  useEffect(() => {
    axios
      .get(`caja-latest/${idPunto}`)
      .then((res) => {
        setIdCajaTienda(res.data.id);
      })
      .catch((error) => {
        console.error('Error al obtener la caja:', error);
      });
    fetchViajes();
  }, [reload, idPunto]);

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      PLANILLA: {
        class: 'border border-yellow-400 text-yellow-600 bg-yellow-220',
        text: 'Planilla'
      },
      'EN VIAJE': {
        class: 'border border-green-400 text-green-600 bg-green-220',
        text: 'En viaje'
      },
      CANCELADO: {
        class: 'border border-red-400 text-red-600 bg-red-220',
        text: 'Cancelado'
      },
      PENDIENTE: {
        class: 'border border-gray-400 text-gray-600 bg-gray-200',
        text: 'Pendiente'
      },
      APROBADO: {
        class: 'border border-green-400 text-green-600 bg-green-50',
        text: 'Aprobado'
      }
    };

    return (
      badges[estado] || {
        class: 'border border-gray-300 text-gray-600 bg-gray-50',
        text: estado
      }
    );
  };
  const columns = useMemo<ColumnDef<ViajesModel>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        className: 'min-w-[120px]',
        cellClassName: 'text-gray-700 font-normal'
      },

      {
        accessorFn: (row) => row.id,
        id: 'tiempo',
        enableSorting: true,
        cell: (info) => (
          <Temporizador
            estado={info.row.original.estado}
            id={info.row.original.id}
            onTimeUpdate={(time) => handleTimeUpdate(info.row.original.id, time)}
          />
        ),
        className: 'min-w-[120px]',
        cellClassName: 'text-gray-700 font-normal'
      },

      {
        accessorFn: (row) => row.idVehiculo,
        id: 'Vehiculo',
        header: () => 'Vehículo',
        enableSorting: true,
        cell: (info) => {
          const vehiculo = info.row.original.vehiculo;
          const imagenVehiculo = vehiculo?.rutaUrl || '/public/media/images/default.png';

          const handleOpenModal = () => {
            setSelectedViaje(info.row.original);
            setSelectedViajeId(info.row.original.id);
            setIsVehiculoModalOpen(true);
          };

          return (
            <div
              className="flex items-center gap-2 cursor-pointer p-1 rounded"
              onClick={handleOpenModal}
            >
              <div
                className=" rounded-full overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                <CommonAvatar
                  image={imagenVehiculo}
                  className="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden bg-gray-100"
                  imageClass="w-full h-full object-contain"
                />
              </div>

              {vehiculo ? (
                <span className="text-xs">
                  {vehiculo.marca.marca} || {vehiculo.placa}
                </span>
              ) : (
                <span className="text-xs">No asignado</span>
              )}
            </div>
          );
        },
        meta: {
          className: 'min-w-[200px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.idConductor,
        id: 'Conductor',
        header: () => 'Conductor',
        enableSorting: true,
        cell: (info) => {
          const { conductor, conductor_auxiliar } = info.row.original;

          const imagenConductor =
            conductor?.persona?.rutaFotoUrl || '/public/media/brand-logos/user.svg';
          const imagenAuxiliar =
            conductor_auxiliar?.persona?.rutaFotoUrl || '/public/media/brand-logos/user.svg';

          const handleOpenModal = () => {
            setSelectedViajeId(info.row.original.id);
            setIsConductorModalOpen(true);
          };

          return (
            <div
              className="flex flex-col gap-1 cursor-pointer p-1 rounded"
              onClick={handleOpenModal}
            >
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <CommonAvatar
                    image={imagenConductor}
                    className="w-10 h-10 rounded-full"
                    imageClass="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs">
                  {conductor
                    ? `${conductor.persona.nombre1} ${conductor.persona.apellido1}`
                    : 'No asignado'}
                </span>
              </div>

              {conductor_auxiliar && (
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    <CommonAvatar
                      image={imagenAuxiliar}
                      className="w-10 h-10 rounded-full"
                      imageClass="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs">
                    {`${conductor_auxiliar.persona.nombre1} ${conductor_auxiliar.persona.apellido1} (Aux)`}
                  </span>
                </div>
              )}
            </div>
          );
        },

        meta: {
          className: 'min-w-[200px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.ruta.ciudad_origen.descripcion,
        id: 'Origen',
        header: () => 'Origen',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">{info.row.original.ruta.ciudad_origen.descripcion}</span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.ruta.ciudad_destino.descripcion,
        id: 'Destino',
        header: () => 'Destino',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">{info.row.original.ruta.ciudad_destino.descripcion}</span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => {
          const totalTickets =
            row.tickets?.reduce((total, ticket) => total + (ticket.cantidad ?? 0), 0) || 0;
          const totalRecaudado =
            row.tickets?.reduce((total, ticket) => {
              const precioRuta = ticket.ruta?.precio ?? 0;
              const cantidad = ticket.cantidad ?? 0;
              return total + precioRuta * cantidad;
            }, 0) || 0;

          return { totalTickets, totalRecaudado };
        },
        id: 'tiquetes',
        header: () => 'Tiquetes / Recaudo',
        enableSorting: true,
        cell: (info) => {
          const tickets = info.row.original.tickets ?? [];
          const totalTickets = tickets.reduce((total, ticket) => total + (ticket.cantidad ?? 0), 0);
          const totalRecaudado = tickets.reduce((total, ticket) => {
            const precioRuta = ticket.ruta?.precio ?? 0;
            const cantidad = ticket.cantidad ?? 0;
            return total + precioRuta * cantidad;
          }, 0);

          return (
            <div className="flex flex-col text-center">
              <span className="text-gray-700 font-semibold">{totalTickets} tiquetes</span>
              <span className="text-green-600 text-sm">
                ${totalRecaudado.toLocaleString('es-CO')}
              </span>
            </div>
          );
        },
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => {
          const estado = info.row.original.estado;
          const badge = getEstadoBadge(estado);

          return (
            <span className={`${badge.class} px-3 py-1 rounded-md text-xs font-medium`}>
              {badge.text}
            </span>
          );
        },
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.agendar_viajes?.hora ?? 'No agendado',
        id: 'hora',
        header: () => 'Hora',
        enableSorting: true,
        cell: (info) => {
          const hora = info.row.original.agendar_viajes?.hora;
          if (!hora) return <span>No agendado</span>;

          const horaFormateada = new Date(`1970-01-01T${hora}`).toLocaleTimeString('es-CO', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          return <span className="text-gray-700">{horaFormateada}</span>;
        },
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        id: 'acciones',
        header: () => 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const estado = row.original.estado;
          const conductor = row.original.conductor;
          const vehiculo = row.original.vehiculo;

          return (
            <div className="flex space-x-2">
              {estado === 'PENDIENTE' && conductor && vehiculo && (
                <button
                  className="btn btn-sm btn-icon btn-clear btn-light"
                  onClick={async () => {
                    const viaje = row.original;

                    if (!viaje.hasRevisionReciente) {
                      setSelectedViaje(viaje);
                      setAccionPendiente({ tipo: 'PLANILLA', viajeId: viaje.id });
                      setIsModalRevisionOpen(true);
                    } else {
                      await cambiarEstadoAPlanilla(viaje.id);
                      enqueueSnackbar('Estado cambiado a planilla correctamente.', {
                        variant: 'success'
                      });
                      fetchViajes();
                    }
                  }}
                  title="Cambiar estado a PLANILLA"
                >
                  <KeenIcon icon="book-open" />
                </button>
              )}

              {estado === 'PLANILLA' && (
                <button
                  className="btn btn-sm btn-icon btn-clear btn-light"
                  onClick={() => {
                    setSelectedViaje(row.original);
                    setAccionPendiente({ tipo: 'INICIAR_VIAJE', viajeId: row.original.id });
                    setIsModalDescuentosOpen(true);
                  }}
                  title="Iniciar viaje"
                >
                  <KeenIcon icon="bus" />
                </button>
              )}

              <button
                className="btn btn-sm btn-icon btn-clear btn-light"
                onClick={() => {
                  confirmAction(
                    `¿Estás seguro de que deseas cancelar el viaje:  ${row.original.ruta.ciudad_origen.descripcion}-${row.original.ruta.ciudad_destino.descripcion}?  `,
                    () => cambiarEstadoCancelado(row.original.id)
                  );
                }}
                title="Cancelar viaje"
              >
                <KeenIcon icon="cross-square" />
              </button>

              <button
                className="btn btn-sm btn-icon btn-clear btn-light"
                onClick={() => {
                  // Usar los datos del listado que ya incluyen toda la información necesaria
                  console.log('🎫 Viaje seleccionado para venta:', row.original);
                  setSelectedViaje(row.original);
                  setIsModalVentaTicketsOpen(true);
                }}
                title="Venta de tickets"
              >
                <KeenIcon icon="cheque" />
              </button>

              <button
                className="btn btn-sm btn-icon btn-clear btn-light"
                onClick={() => {
                  setSelectedViajeId(row.original.id);
                  setIsModalObservacionesOpen(true);
                }}
                title="Enviar mensaje"
              >
                <KeenIcon icon="message-text" />
              </button>

              {estado === 'PLANILLA' && conductor && (
                <button
                  className="btn btn-sm btn-icon btn-clear btn-light"
                  onClick={() => {
                    generateTiketAlcoholimetria(row.original.id);
                  }}
                  title="Alcoholimetría"
                >
                  <KeenIcon icon="thermometer" />
                </button>
              )}

              <button
                className="btn btn-sm btn-icon btn-clear btn-light"
                onClick={() => {
                  // Usar los datos del listado que ya incluyen toda la información necesaria
                  console.log('📅 Viaje seleccionado para reserva:', row.original);
                  setSelectedViaje(row.original);
                  setIsModalReservaTicketsOpen(true);
                }}
                title="Reserva tickets"
              >
                <KeenIcon icon="calendar" />
              </button>
            </div>
          );
        },
        meta: { className: 'w-[200px]' }
      }
    ],
    []
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return viajes;
    return viajes.filter((paymentType) =>
      paymentType.ruta.ciudad_origen.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, viajes]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title"></h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar ruta..."
              className="pl-8 input input-sm w-[400px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card-body w-full px-0">
        <DataGrid
          key={JSON.stringify(filteredData)}
          columns={columns}
          data={filteredData}
          pagination={{ size: 10 }}
          sorting={[{ id: 'id', desc: false }]}
        />
      </div>
      <ModalAsignarConductor
        open={isConductorModalOpen}
        onClose={() => {
          setIsConductorModalOpen(false);
          setSelectedViajeId(null);
        }}
        idViaje={selectedViajeId ?? 0}
        onSave={() => {
          fetchViajes();
        }}
        viajeData={selectedViaje!}
      />
      <ModalAsignarVehiculo
        open={isVehiculoModalOpen}
        onClose={() => {
          setIsVehiculoModalOpen(false);
          setSelectedViajeId(null);
        }}
        idViaje={selectedViajeId ?? 0}
        onSave={(vehiculo, observacion) => {
          fetchViajes();
        }}
        viaje={selectedViaje!}
      />
      <ModalAgendarViajes
        open={isModalAgendarOpen}
        onClose={() => {
          setIsModalAgendarOpen(false);
          setSelectedViajeId(null);
        }}
        idViaje={selectedViajeId ?? 0}
        onSave={() => {
          fetchViajes();
        }}
      />
      <ModalVentaTickets
        open={isModalVentaTicketsOpen}
        onClose={() => {
          setIsModalVentaTicketsOpen(false);
          setSelectedRutaId(null);
          setSelectedViaje(null);
          fetchViajes();
        }}
        viajeData={selectedViaje!}
        idCaja={idCajaTienda ?? null}
      />

      <ModalReservaTickets
        open={isModalReservaTicketsOpen}
        onClose={() => {
          setIsModalReservaTicketsOpen(false);
          setSelectedRutaId(null);
          setSelectedViaje(null);
          fetchViajes();
        }}
        viajeData={selectedViaje!}
        idCaja={idCajaTienda ?? null}
      />

      <ModalObservaciones
        open={isModalObservacionesOpen}
        onClose={() => {
          setIsModalObservacionesOpen(false);
          setSelectedViajeId(null);
        }}
        idViaje={selectedViajeId ?? 0}
      />

      <ModalPdfViewer
        isOpen={modalPdfOpen}
        onClose={() => {
          setModalPdfOpen(false);
          setPdfUrl(null);
        }}
        pdfUrl={pdfUrl}
      />
      <ModalRevisionPreoperacional
        open={isModalRevisionOpen}
        onClose={() => {
          setIsModalRevisionOpen(false);
          setSelectedViaje(null);
          setAccionPendiente({ tipo: null, viajeId: null });
        }}
        onSave={async (data) => {
          const hayRechazo = data.detalles.some((detalle: any) => detalle.estado === 'RECHAZADO');

          if (hayRechazo) {
            enqueueSnackbar(
              'El vehículo tiene una revisión rechazada. No se puede cambiar a planilla.',
              {
                variant: 'warning'
              }
            );
          } else if (accionPendiente?.tipo === 'PLANILLA' && accionPendiente?.viajeId) {
            await cambiarEstadoAPlanilla(accionPendiente.viajeId);
          }

          setIsModalRevisionOpen(false);
          setSelectedViaje(null);
          setAccionPendiente({ tipo: null, viajeId: null });
          fetchViajes();
        }}
        viaje={selectedViaje!}
      />
      <ModalDescuentosPlanillaViaje
        open={isModalDescuentosOpen}
        onClose={() => {
          setIsModalDescuentosOpen(false);
          setSelectedViaje(null);
        }}
        onSave={async (data) => {
          if (accionPendiente?.tipo === 'INICIAR_VIAJE' && accionPendiente?.viajeId) {
            await actualizarEstadoViaje(accionPendiente.viajeId);
            enqueueSnackbar('Viaje iniciado exitosamente.', { variant: 'success' });
          } else if (accionPendiente?.tipo === 'PLANILLA' && accionPendiente?.viajeId) {
            await cambiarEstadoAPlanilla(accionPendiente.viajeId);
            enqueueSnackbar('Estado cambiado a planilla correctamente.', { variant: 'success' });
          }

          setIsModalDescuentosOpen(false);
          setSelectedViaje(null);
          setAccionPendiente({ tipo: null, viajeId: null });
          fetchViajes();
        }}
        viaje={selectedViaje!}
      />
    </div>
  );
};

export default CajaContent;

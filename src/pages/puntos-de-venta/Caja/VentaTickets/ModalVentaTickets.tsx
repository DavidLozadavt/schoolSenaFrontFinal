import { useEffect, useState, useRef } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { PaymentType } from '@/pages/tipos-pago/model/TipoPagoInterface';
import { ViajesModel } from '@/pages/transporte/cronograma-rutas/model/ViajesInterface';
import { formatCOP } from '@/utils/formatters';
import { useSnackbar } from 'notistack';
import { Tercero } from '../../models/TerceroInterface';
import { useTicketSearch } from './Hooks/useTicketSearch';
import TicketAssignmentList from './TicketAssignmentList';
import MixedPaymentSelector from './MixedPaymentSelector';
import ModalTerceroTicket from './ModalTerceroTicket';
import ModalPdfViewer from '../ModalPdfViewer';
import RedeemTicketForm from './RedeemTicketForm';

interface ModalProps {
  open: boolean;
  paymentType?: PaymentType;
  onClose: () => void;
  onSave?: () => void;
  idRutaPadre?: number;
  viajeData: ViajesModel | null;
  idCaja: any;
}

const ModalVentaTickets = ({
  open,
  onClose,
  paymentType,
  onSave,
  idRutaPadre,
  viajeData,
  idCaja
}: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    asignacionTickets,
    actualizarIdentificacionTicket,
    actualizarTerceroTicket,
    aplicarATodos: aplicarTerceroATodos,
    ajustarCantidad,
    resetear: resetearTickets,
    limpiarCache
  } = useTicketSearch();

  const [hoveredStop, setHoveredStop] = useState<number | null>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRutaId, setSelectedRutaId] = useState<number | null>(null);
  const [selectedStop, setSelectedStop] = useState<any | null>(null);

  const [activeTab, setActiveTab] = useState<'vender' | 'redimir'>('vender');
  const [ticketSeleccionadoParaCrear, setTicketSeleccionadoParaCrear] = useState<number | null>(null);
  const [modalTerceroOpen, setModalTerceroOpen] = useState(false);
  const [cantidad, setCantidad] = useState<number>(1);
  
  const [tipoFacturacion, setTipoFacturacion] = useState<'viajero' | 'empresa'>('viajero');
  const [empresaFacturacion, setEmpresaFacturacion] = useState<Tercero | null>(null);
  const [nitEmpresa, setNitEmpresa] = useState<string>('');

  const [mediosPago, setMediosPago] = useState<any[]>([]);
  const [tiposPago, setTiposPago] = useState<any[]>([]);
  const [medioPagoSeleccionado, setMedioPagoSeleccionado] = useState<number | null>(null);
  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState<number | null>(null);
  const [tipoImpresion, setTipoImpresion] = useState('individual');
  const [loadingVenta, setLoadingVenta] = useState(false);

  const [pagosVenta, setPagosVenta] = useState<Array<{valor: number; idMedioPago: number}> | null>(null);
  const [pagosRedencion, setPagosRedencion] = useState<Array<{valor: number; idMedioPago: number}> | null>(null);
  const [medioPagoVentaSimple, setMedioPagoVentaSimple] = useState<number | null>(null);
  const [medioPagoRedencionSimple, setMedioPagoRedencionSimple] = useState<number | null>(null);

  const [codigoRedimir, setCodigoRedimir] = useState('');
  const [reservaEncontrada, setReservaEncontrada] = useState<any | null>(null);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [cantidadRedimir, setCantidadRedimir] = useState<number>(1);

  const [generarTicket] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [modalPdfOpen, setModalPdfOpen] = useState(false);
  const [precioRutaSeleccionada, setPrecioRutaSeleccionada] = useState<number>(0);
  const [nombreRutaSeleccionada, setNombreRutaSeleccionada] = useState<string>('');
  const [idLugarSeleccionado, setIdLugarSeleccionado] = useState<number | null>(null);
  
  const idLugarRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      resetearTodo();
      return;
    }

    const fetchData = async () => {
      if (!viajeData) return;

      setLoading(true);
      try {
        const response = await axios.get(`get_rutas_hijas/${viajeData.idRuta}`);
        const data = response.data;

        const formattedStops = [
          {
            name: data.ciudad_origen.descripcion,
            type: 'origen',
            price: data.valorTotal,
            id: viajeData.idRuta,
            distance: '0 km'
          },
          ...data.rutas_hijas.map((ruta: any) => ({
            name: ruta.lugar ? ruta.lugar.nombre : 'Parada intermedia',
            type: 'parada',
            price: ruta.valorTotal,
            id: ruta.id,
            distance: ruta.distancia
          })),
          {
            name: data.ciudad_destino.descripcion,
            type: 'destino',
            price: data.valorTotal,
            id: viajeData.idRuta,
            distance: data.distancia
          },
        ];

        setStops(formattedStops);
        setLoading(false);
      } catch (error) {
        setError('Error al cargar los datos');
        setLoading(false);
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    cargarMediosYTiposPago();
  }, [viajeData, open]);

  useEffect(() => {
    if (selectedStop) {
      cargarPrecioRutaSeleccionada();
    }
  }, [selectedRutaId, selectedStop]);

  useEffect(() => {
    ajustarCantidad(cantidad);
  }, [cantidad, ajustarCantidad]);

  useEffect(() => {
    if (tipoFacturacion === 'empresa' && asignacionTickets.length > 0) {
      const primerTicket = asignacionTickets[0];
      if (primerTicket.tercero && !empresaFacturacion) {
        setEmpresaFacturacion(primerTicket.tercero);
      }
    }
  }, [asignacionTickets, tipoFacturacion]);

  useEffect(() => {
    if (tipoFacturacion === 'viajero') {
      if (asignacionTickets.length > 0 && asignacionTickets[0].identificacion === '') {
        actualizarIdentificacionTicket(1, '222222222222');
      }
    } else {
      if (asignacionTickets.length > 0 && asignacionTickets[0].identificacion === '222222222222') {
        actualizarIdentificacionTicket(1, '');
      }
    }
  }, [tipoFacturacion]);

  const resetearTodo = () => {
    setSelectedRutaId(null);
    setSelectedStop(null);
    setStops([]);
    setLoading(true);
    setActiveTab('vender');
    resetearTickets();
    setCantidad(1);
    setCodigoRedimir('');
    setReservaEncontrada(null);
    setCantidadRedimir(1);
    setPagosVenta(null);
    setPagosRedencion(null);
    setMedioPagoVentaSimple(null);
    setMedioPagoRedencionSimple(null);
    setPrecioRutaSeleccionada(0);
    setTipoFacturacion('viajero');
    setEmpresaFacturacion(null);
    setNitEmpresa('');
    setNombreRutaSeleccionada('');
    setIdLugarSeleccionado(null);
    idLugarRef.current = null;
    limpiarCache();
  };

  const cargarMediosYTiposPago = async () => {
    try {
      const [mediosRes, tiposRes] = await Promise.all([
        axios.get('/medio_pagos'),
        axios.get('/tipo_pagos')
      ]);

      setMediosPago(mediosRes.data);
      setTiposPago(tiposRes.data);

      const medioEfectivo = mediosRes.data.find((m: any) => m.detalleMedioPago === 'EFECTIVO');
      const tipoContado = tiposRes.data.find((t: any) => t.detalleTipoPago === 'CONTADO');

      if (medioEfectivo) setMedioPagoSeleccionado(medioEfectivo.id);
      if (tipoContado) setTipoPagoSeleccionado(tipoContado.id);
    } catch (error) {
      enqueueSnackbar('Error al cargar medios o tipos de pago.', { variant: 'error' });
    }
  };

  const cargarPrecioRutaSeleccionada = async () => {
    if (!selectedStop) {
      setPrecioRutaSeleccionada(0);
      setNombreRutaSeleccionada('');
      setIdLugarSeleccionado(null);
      idLugarRef.current = null;
      return;
    }

    setPrecioRutaSeleccionada(selectedStop.price);
    setNombreRutaSeleccionada(selectedStop.name);

    if (selectedRutaId === viajeData?.idRuta) {
      const idLugar = viajeData?.ruta?.idLugar || null;
      setIdLugarSeleccionado(idLugar);
      idLugarRef.current = idLugar;
      return;
    }

    try {
      const response = await axios.get(`/rutas/${selectedRutaId}`);
      const idLugar = response.data?.idLugar || null;
      setIdLugarSeleccionado(idLugar);
      idLugarRef.current = idLugar;
    } catch (error) {
      console.error('Error al obtener precio de ruta:', error);
      setIdLugarSeleccionado(null);
      idLugarRef.current = null;
    }
  };

  const handleStopClick = (stop: any) => {
    const rutaId = stop.type === 'origen' || stop.type === 'destino' ? viajeData?.idRuta : stop.id;
    setSelectedRutaId(rutaId);
    setSelectedStop(stop);
    resetearTickets();
    setCantidad(1);
    setActiveTab('vender');
  };

  const aplicarATodos = (tercero: Tercero) => {
    aplicarTerceroATodos(tercero);
    enqueueSnackbar('Cliente aplicado a todos los tickets.', { variant: 'success' });
  };

  const abrirFormularioTercero = (numeroTicket: number) => {
    setTicketSeleccionadoParaCrear(numeroTicket);
    setModalTerceroOpen(true);
  };

  const handleTerceroCreado = async (terceroCreado: Tercero) => {
    if (ticketSeleccionadoParaCrear === 0) {
      actualizarIdentificacionTicket(1, terceroCreado.identificacion);
      await buscarEmpresaPorNit(terceroCreado.identificacion);
    } else if (ticketSeleccionadoParaCrear) {
      actualizarTerceroTicket(ticketSeleccionadoParaCrear, terceroCreado);
    }
    setModalTerceroOpen(false);
    setTicketSeleccionadoParaCrear(null);
  };

  const buscarEmpresaPorNit = async (nit: string) => {
    if (!nit.trim()) {
      setEmpresaFacturacion(null);
      return;
    }

    try {
      const response = await axios.get(`terceros?identificacion=${nit.trim()}`);
      if (response.data.length > 0) {
        setEmpresaFacturacion(response.data[0]);
        enqueueSnackbar('Empresa encontrada.', { variant: 'success' });
      } else {
        setEmpresaFacturacion(null);
        enqueueSnackbar('No se encontró empresa con ese NIT.', { variant: 'warning' });
      }
    } catch (error) {
      setEmpresaFacturacion(null);
      enqueueSnackbar('Error al buscar empresa.', { variant: 'error' });
    }
  };

  const venderTicket = async () => {
    const todosAsignados = asignacionTickets.every((a) => a.tercero !== null);

    if (!todosAsignados) {
      enqueueSnackbar('Por favor, asigna un cliente a todos los tickets antes de continuar.', {
        variant: 'warning'
      });
      return;
    }

    if (tipoFacturacion === 'empresa' && !empresaFacturacion) {
      enqueueSnackbar('Por favor, selecciona una empresa para facturar.', {
        variant: 'warning'
      });
      return;
    }

    if (!viajeData) {
      enqueueSnackbar('No hay información del viaje disponible.', { variant: 'error' });
      return;
    }

    if (!tipoPagoSeleccionado) {
      enqueueSnackbar('Selecciona el tipo de pago para continuar.', {
        variant: 'warning'
      });
      return;
    }

    if (!pagosVenta && !medioPagoVentaSimple) {
      enqueueSnackbar('Selecciona un medio de pago o configura el pago mixto.', {
        variant: 'warning'
      });
      return;
    }

    setLoadingVenta(true);

    try {
      const ticketsData = asignacionTickets.map((asignacion) => {
        const idLugarFinal = idLugarRef.current ?? null;
        
        const ticketBase = {
          idViaje: viajeData.id,
          idTercero: asignacion.tercero?.id ?? null,
          idConfiguracionVehiculo: viajeData.vehiculo?.configuracion_vehiculo?.id ?? null,
          idAgendaViaje: viajeData.agendar_viajes?.id ?? null,
          idRuta: selectedRutaId ?? null,
          idLugar: idLugarFinal,
          cantidad: 1,
          idCaja,
          idTipoPago: tipoPagoSeleccionado,
          ...(tipoFacturacion === 'empresa' && empresaFacturacion && {
            idTerceroFacturacion: empresaFacturacion.id,
            tipoFacturacion: 'empresa'
          })
        };

        if (pagosVenta && pagosVenta.length > 0) {
          return {
            ...ticketBase,
            pagos: pagosVenta
          };
        } else {
          return {
            ...ticketBase,
            idMedioPago: medioPagoVentaSimple
          };
        }
      });

      const { data: ticketsCreados } = await axios.post('/tickets', { tickets: ticketsData });

      if (onSave) {
        onSave();
      }

      enqueueSnackbar(`${asignacionTickets.length} ticket(s) vendido(s) exitosamente.`, {
        variant: 'success'
      });

      if (generarTicket && ticketsCreados) {
        await generarTicketPDF(ticketsCreados);
      }

      resetearTickets();
      setCantidad(1);
      setPagosVenta(null);
      setMedioPagoVentaSimple(null);
      
    } catch (error: any) {
      const mensajeError =
        error.response?.data?.message ||
        'Hubo un error al vender los tickets. Intenta nuevamente.';
      enqueueSnackbar(mensajeError, { variant: 'error' });
    } finally {
      setLoadingVenta(false);
    }
  };

  const buscarReservaPorCodigo = async () => {
    if (!codigoRedimir) {
      enqueueSnackbar('Por favor ingresa un código de ticket.', { variant: 'warning' });
      return;
    }

    setLoadingBusqueda(true);

    try {
      const { data } = await axios.get(`/reservas/codigo/${codigoRedimir}`, {
        params: { idViaje: viajeData?.id }
      });

      if (data?.success && data?.data) {
        setReservaEncontrada(data.data);
        setCantidadRedimir(1);
        enqueueSnackbar('Ticket encontrado correctamente.', { variant: 'success' });
      } else {
        setReservaEncontrada(null);
        enqueueSnackbar(data.message || 'No se encontró el ticket.', { variant: 'error' });
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al buscar ticket.', {
        variant: 'error'
      });
      setReservaEncontrada(null);
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const redimirReserva = async () => {
    if (!reservaEncontrada) {
      enqueueSnackbar('No hay reserva seleccionada.', { variant: 'warning' });
      return;
    }

    if (!tipoPagoSeleccionado) {
      enqueueSnackbar('Selecciona el tipo de pago para continuar.', { variant: 'warning' });
      return;
    }

    if (!pagosRedencion && !medioPagoRedencionSimple) {
      enqueueSnackbar('Selecciona un medio de pago o configura el pago mixto.', { variant: 'warning' });
      return;
    }

    if (!viajeData) {
      enqueueSnackbar('No hay información del viaje disponible.', { variant: 'error' });
      return;
    }

    if (cantidadRedimir > reservaEncontrada.cantidad) {
      enqueueSnackbar('La cantidad a redimir no puede ser mayor a la cantidad reservada.', {
        variant: 'warning'
      });
      return;
    }

    setLoadingVenta(true);

    try {
      const idLugarFinal = idLugarRef.current ?? null;
      
      const ticketDataBase = {
        idViaje: reservaEncontrada.viaje?.id || viajeData.id,
        idTercero: reservaEncontrada.tercero?.id,
        idConfiguracionVehiculo:
          reservaEncontrada.viaje?.vehiculo?.configuracion_vehiculo?.id ||
          viajeData.vehiculo?.configuracion_vehiculo?.id,
        idAgendaViaje:
          reservaEncontrada.viaje?.agendar_viajes?.id || viajeData.agendar_viajes?.id,
        idRuta: reservaEncontrada.ruta?.id || selectedRutaId,
        idLugar: idLugarFinal,
        cantidad: cantidadRedimir,
        idCaja,
        idTipoPago: tipoPagoSeleccionado,
        idReserva: reservaEncontrada.id
      };

      const ticketData = pagosRedencion && pagosRedencion.length > 0
        ? { ...ticketDataBase, pagos: pagosRedencion }
        : { ...ticketDataBase, idMedioPago: medioPagoRedencionSimple };

      const { data: ticketCreado } = await axios.post('/tickets', {
        tickets: [ticketData]
      });

      await axios.post(`/reservas_update/${reservaEncontrada.id}`, {
        cantidad: cantidadRedimir
      });

      enqueueSnackbar(`${cantidadRedimir} ticket(s) redimido(s) exitosamente.`, {
        variant: 'success'
      });

      if (generarTicket && ticketCreado) {
        await generarTicketPDF(ticketCreado);
      }

      if (onSave) {
        onSave();
      }

      setReservaEncontrada(null);
      setCodigoRedimir('');
      setCantidadRedimir(1);
    } catch (error: any) {
      const mensajeError =
        error.response?.data?.message || 'Error al crear el ticket desde la reserva.';
      enqueueSnackbar(mensajeError, { variant: 'error' });
    } finally {
      setLoadingVenta(false);
    }
  };

  const generarTicketPDF = async (ticketsCreados: any) => {
    if (viajeData) {
      try {
        let ticketIds: number[] = [];

        if (ticketsCreados.ticketIds) {
          ticketIds = ticketsCreados.ticketIds;
        } else if (Array.isArray(ticketsCreados)) {
          ticketIds = ticketsCreados.map((t: any) => t.id);
        } else if (ticketsCreados.tickets && Array.isArray(ticketsCreados.tickets)) {
          ticketIds = ticketsCreados.tickets.map((t: any) => t.id);
        }

        if (ticketIds.length === 0) {
          return;
        }

        const params = {
          idViaje: viajeData.id,
          action: 'generate_ticket',
          cantidad: cantidad,
          idRuta: selectedRutaId || null,
          tipoImpresion: tipoImpresion,
          ticketIds: ticketIds.join(','),
          idLugar: idLugarSeleccionado || null,
          
        };

        const response = await axios.get('/generate_ticket_pdf', {
          params,
          responseType: 'blob'
        });

        if (response.status === 200) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);

          setPdfUrl(url);
          setModalPdfOpen(true);

          enqueueSnackbar('Ticket generado exitosamente.', { variant: 'success' });
        }
      } catch (error) {
        enqueueSnackbar('Hubo un error al generar el ticket. Por favor, inténtalo de nuevo.', {
          variant: 'error'
        });
      }
    }
  };

  const handleMainClose = () => {
    resetearTodo();
    onClose();
  };

  const todosAsignados = asignacionTickets.every((a) => a.tercero !== null);
  const origen = stops.find((stop) => stop.type === 'origen')?.name || 'Origen';
  const destino = stops.find((stop) => stop.type === 'destino')?.name || 'Destino';

  // Atajos de teclado
  useEffect(() => {
    if (!open || modalTerceroOpen || modalPdfOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar si se está escribiendo en un input o textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Enter: Vender o Redimir ticket
      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'vender') {
          // Verificar que se puede vender
          if (
            selectedStop &&
            todosAsignados &&
            tipoPagoSeleccionado &&
            (pagosVenta || medioPagoVentaSimple) &&
            !loadingVenta
          ) {
            venderTicket();
          }
        } else if (activeTab === 'redimir') {
          // Si hay reserva encontrada, redimir
          if (
            reservaEncontrada &&
            tipoPagoSeleccionado &&
            (pagosRedencion || medioPagoRedencionSimple) &&
            !loadingVenta &&
            cantidadRedimir >= 1
          ) {
            redimirReserva();
          }
          // Si no hay reserva pero hay código, buscar
          else if (codigoRedimir && !reservaEncontrada && !loadingBusqueda) {
            buscarReservaPorCodigo();
          }
        }
      }

      // D: Cambiar destino (solo en tab vender)
      if ((e.key === 'd' || e.key === 'D') && activeTab === 'vender') {
        e.preventDefault();
        if (selectedStop) {
          setSelectedStop(null);
        }
      }

      // R: Cambiar a tab Redimir
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setActiveTab('redimir');
      }

      // V: Cambiar a tab Vender
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setActiveTab('vender');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    open,
    activeTab,
    selectedStop,
    todosAsignados,
    tipoPagoSeleccionado,
    pagosVenta,
    medioPagoVentaSimple,
    pagosRedencion,
    medioPagoRedencionSimple,
    loadingVenta,
    reservaEncontrada,
    codigoRedimir,
    loadingBusqueda,
    cantidadRedimir,
    modalTerceroOpen,
    modalPdfOpen
  ]);

  return (
    <>
      <Modal open={open} onClose={handleMainClose}>
        <ModalContent className="max-w-[1200px] top-[2%] p-4 max-h-[95vh]">
          <ModalHeader className="pb-3">
            <ModalTitle className="flex items-center gap-2 text-lg">
              <KeenIcon icon="ticket" className="w-5 h-5" />
              Venta de Tickets
            </ModalTitle>
            <button
              className="p-2 rounded-full transition-colors hover:bg-gray-100"
              onClick={handleMainClose}
              aria-label="Cerrar"
            >
              <KeenIcon icon="cross" className="w-5 h-5" />
            </button>
          </ModalHeader>

          <ModalBody className="px-4 py-4 overflow-y-auto space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : (
              <>
                {activeTab === 'vender' && (
                  <div className=" rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <div className=" border-b border-gray-200 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <KeenIcon icon="route" className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                              <h2 className="text-gray-800 font-semibold text-base">
                                Selecciona el destino
                              </h2>
                              <p className="text-gray-500 text-xs">
                                {origen} → {destino}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 ml-auto">
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                              <KeenIcon icon="car" className="w-5 h-5 text-blue-600" />
                              <div className="text-sm">
                                <p className="font-semibold text-gray-800">
                                  {viajeData?.vehiculo?.clase_vehiculo?.nombre || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {viajeData?.vehiculo?.placa || 'Sin placa'} - Afiliación: {viajeData?.vehiculo?.asignacion_propietarios?.[0]?.afiliacion?.numero || 'N/A'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                              <KeenIcon icon="user" className="w-5 h-5 text-green-600" />
                              <div className="text-sm">
                                <p className="font-semibold text-gray-800">
                                  {viajeData?.conductor?.persona?.nombre1 || ''} {viajeData?.conductor?.persona?.apellido1 || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-600">Conductor</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        {selectedStop && (
                          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 ml-4">
                            <KeenIcon icon="check-circle" className="w-4 h-4 text-gray-700" />
                            <span className="text-sm font-medium text-gray-700">
                              {selectedStop.name}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCOP(selectedStop.price)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="flex justify-between items-start gap-4 relative">
                        <div
                          className="absolute top-[30px] left-[30px] right-[30px] h-[2px] bg-gray-300 hidden md:block"
                          style={{ zIndex: 0 }}
                        ></div>

                        {stops.map((stop, index) => (
                          <div
                            key={index}
                            className="relative flex flex-col items-center cursor-pointer group flex-1 min-w-[140px]"
                            onClick={() => handleStopClick(stop)}
                          >
                            <div className="relative" style={{ zIndex: 10 }}>
                              <div
                                className={`w-[55px] h-[55px] rounded-full flex items-center justify-center transition-all duration-200 ${
                                  selectedStop?.id === stop.id
                                    ? 'bg-green shadow-lg ring-2 ring-green-500 ring-offset-2'
                                    : ' border-2 border-gray-300 hover:border-gray-400 hover:shadow-md'
                                }`}
                              >
                                {stop.type === 'origen' && (
                                  <KeenIcon
                                    icon="home"
                                    className={`h-6 ${selectedStop?.id === stop.id ? '' : 'text-gray-600'}`}
                                  />
                                )}
                                {stop.type === 'destino' && (
                                  <KeenIcon
                                    icon="flag"
                                    className={`h-6 ${selectedStop?.id === stop.id ? '' : 'text-gray-600'}`}
                                  />
                                )}
                                {stop.type === 'parada' && (
                                  <KeenIcon
                                    icon="geolocation"
                                    className={`h-6 ${selectedStop?.id === stop.id ? '' : 'text-gray-600'}`}
                                  />
                                )}
                              </div>

                              {selectedStop?.id === stop.id && (
                                <div
                                  className="absolute -top-3 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md"
                                  style={{ zIndex: 20 }}
                                >
                                  <KeenIcon icon="check" className="w-4 h-3 mb-1 text-white" />
                                </div>
                              )}
                            </div>

                            {index < stops.length - 1 && (
                              <div
                                className="absolute left-1/2 top-[30px] -translate-y-1/2 hidden md:block pointer-events-none"
                                style={{ zIndex: 5, marginLeft: 'calc(50% - 10px)' }}
                              >
                                <KeenIcon icon="right" className="w-5 h-5 text-gray-400" />
                              </div>
                            )}

                            <div className="text-center w-full mt-4">
                              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-medium mb-1.5 bg-gray-100 text-gray-600 uppercase tracking-wide">
                                {stop.type === 'origen'
                                  ? 'Origen'
                                  : stop.type === 'destino'
                                    ? 'Destino'
                                    : `Parada ${index}`}
                              </div>
                              <h3
                                className={`text-sm font-semibold mb-1.5 transition-colors ${
                                  selectedStop?.id === stop.id ? 'text-gray-900' : 'text-gray-700'
                                }`}
                              >
                                {stop.name}
                              </h3>
                              <div className="flex flex-col items-center gap-1">
                                <p className="text-base font-bold text-gray-900">
                                  {formatCOP(stop.price)}
                                </p>
                                {stop.distance && stop.distance !== '0 km' && (
                                  <p className="text-xs text-gray-500">{stop.distance}</p>
                                )}
                              </div>
                            </div>

                            {selectedStop?.id !== stop.id && (
                              <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-gray-300 transition-all duration-200 pointer-events-none"></div>
                            )}
                          </div>
                        ))}
                      </div>

                      {!selectedStop && (
                        <div className="mt-6 p-4  border border-gray-200 rounded-lg">
                          <p className="text-sm text-center text-gray-600">
                            Haz clic en cualquier parada para comenzar la venta de tickets
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pestañas - Siempre visibles */}
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab('vender')}
                      className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                        activeTab === 'vender'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <KeenIcon icon="handcart" className="w-4 h-4" />
                        Vender Tickets
                        <kbd className="px-2 py-0.5 text-xs bg-gray-100 rounded border border-gray-300 ml-2">V</kbd>
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('redimir')}
                      className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                        activeTab === 'redimir'
                          ? 'text-green-600 border-b-2 border-green-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <KeenIcon icon="barcode" className="w-4 h-4" />
                        Redimir Ticket
                        <kbd className="px-2 py-0.5 text-xs bg-gray-100 rounded border border-gray-300 ml-2">R</kbd>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Contenido de las pestañas */}
                {(selectedStop || activeTab === 'redimir') && (
                  <div className="space-y-6">

                    {activeTab === 'vender' ? (
                      <>
                        <div className="rounded-lg shadow-sm p-4 space-y-3 border border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <KeenIcon icon="document" className="w-4 h-4" />
                            ¿A quién facturar?
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setTipoFacturacion('viajero');
                                setEmpresaFacturacion(null);
                              }}
                              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                tipoFacturacion === 'viajero'
                                  ? ' bg-gray-100 border-blue-500'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <KeenIcon
                                  icon="profile-circle"
                                  className={`w-5 h-5 ${tipoFacturacion === 'viajero' ? 'text-blue-600' : 'text-gray-400'}`}
                                />
                                <div className="text-left">
                                  <p
                                    className={`text-sm font-semibold ${tipoFacturacion === 'viajero' ? 'text-blue-600' : 'text-gray-600'}`}
                                  >
                                    Al viajero
                                  </p>
                                  <p className="text-xs text-gray-500">Factura individual</p>
                                </div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setTipoFacturacion('empresa')}
                              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                tipoFacturacion === 'empresa'
                                  ? 'border-green-200 bg-grey-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <KeenIcon
                                  icon="office-bag"
                                  className={`w-5 h-5 ${tipoFacturacion === 'empresa' ? 'text-green-600' : 'text-gray-400'}`}
                                />
                                <div className="text-left">
                                  <p
                                    className={`text-sm font-semibold ${tipoFacturacion === 'empresa' ? 'text-green-600' : 'text-gray-600'}`}
                                  >
                                    A una empresa
                                  </p>
                                  <p className="text-xs text-gray-500">Factura corporativa</p>
                                </div>
                              </div>
                            </button>
                          </div>

                          {tipoFacturacion === 'empresa' && (
                            <div className="p-3  border border-green-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <KeenIcon
                                  icon="information-2"
                                  className="w-5 h-5 text-green-600 mt-0.5 shrink-0"
                                />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-green-800 mb-2">
                                    Ingresa el NIT de la empresa en el primer ticket
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => abrirFormularioTercero(0)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-blue-600 shrink-0"
                                  title="Crear empresa"
                                >
                                  <KeenIcon icon="plus-circle" className="w-6 h-6" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cantidad */}
                        <div className="rounded-xl shadow-sm p-4 space-y-3 border border-gray-100">
                          <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                            <KeenIcon icon="shopping-cart" className="w-4 h-4" />
                            Cantidad de Tickets
                          </h3>
                          <input
                            type="number"
                            value={cantidad}
                            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                            min="1"
                            max="20"
                            className="input p-3 border border-gray-300 rounded-md w-full focus:ring-2"
                            placeholder="Ej. 5"
                          />
                          {cantidad > 1 && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-bold text-blue-600">
                                Total: {formatCOP(precioRutaSeleccionada * cantidad)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Asignar clientes */}
                        <TicketAssignmentList
                          asignacionTickets={asignacionTickets}
                          cantidad={cantidad}
                          onIdentificacionChange={actualizarIdentificacionTicket}
                          onAbrirFormularioTercero={abrirFormularioTercero}
                          onAplicarATodos={aplicarATodos}
                        />

                        {/* Medios de pago */}
                        {todosAsignados && (
                          <MixedPaymentSelector
                            tiposPago={tiposPago}
                            mediosPago={mediosPago}
                            tipoPagoSeleccionado={tipoPagoSeleccionado}
                            valorTotal={precioRutaSeleccionada * cantidad}
                            onTipoPagoChange={setTipoPagoSeleccionado}
                            onPagosChange={(pagos, medioPagoSimple) => {
                              setPagosVenta(pagos);
                              setMedioPagoVentaSimple(medioPagoSimple ?? null);
                            }}
                            variant="venta"
                          />
                        )}

                        {/* Botones */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                          <button
                            onClick={() => setSelectedStop(null)}
                            className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            Cambiar Destino
                            <kbd className="px-2 py-0.5 text-xs bg-gray-200 rounded border border-gray-300">D</kbd>
                          </button>
                          <button
                            onClick={venderTicket}
                            disabled={
                              !todosAsignados ||
                              !tipoPagoSeleccionado ||
                              (!pagosVenta && !medioPagoVentaSimple) ||
                              loadingVenta
                            }
                            className="flex items-center gap-2 px-5 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            <KeenIcon icon="credit-cart" className="w-4 h-4" />
                            {loadingVenta
                              ? 'Procesando...'
                              : `Vender ${cantidad} ${cantidad === 1 ? 'Ticket' : 'Tickets'}`}
                            <kbd className="px-2 py-0.5 text-xs bg-blue-700 rounded border border-blue-800">Enter</kbd>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Redimir ticket */}
                        <RedeemTicketForm
                          codigoRedimir={codigoRedimir}
                          onCodigoChange={setCodigoRedimir}
                          onBuscar={buscarReservaPorCodigo}
                          loadingBusqueda={loadingBusqueda}
                          reservaEncontrada={reservaEncontrada}
                          cantidadRedimir={cantidadRedimir}
                          onCantidadChange={setCantidadRedimir}
                          onLimpiar={() => {
                            setReservaEncontrada(null);
                            setCodigoRedimir('');
                            setCantidadRedimir(1);
                          }}
                        />

                        {reservaEncontrada && (
                          <MixedPaymentSelector
                            tiposPago={tiposPago}
                            mediosPago={mediosPago}
                            tipoPagoSeleccionado={tipoPagoSeleccionado}
                            valorTotal={
                              reservaEncontrada.ruta?.precio || viajeData?.ruta?.precio || 0
                            }
                            onTipoPagoChange={setTipoPagoSeleccionado}
                            onPagosChange={(pagos, medioPagoSimple) => {
                              setPagosRedencion(pagos);
                              setMedioPagoRedencionSimple(medioPagoSimple ?? null);
                            }}
                            variant="redencion"
                          />
                        )}

                        {reservaEncontrada && (
                          <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                              onClick={redimirReserva}
                              disabled={
                                !reservaEncontrada ||
                                !tipoPagoSeleccionado ||
                                (!pagosRedencion && !medioPagoRedencionSimple) ||
                                loadingVenta ||
                                cantidadRedimir < 1
                              }
                              className="flex items-center gap-2 px-5 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              <KeenIcon icon="cheque" className="w-4 h-4" />
                              {loadingVenta
                                ? 'Procesando...'
                                : `Redimir ${cantidadRedimir} Ticket${cantidadRedimir > 1 ? 's' : ''}`}
                              <kbd className="px-2 py-0.5 text-xs bg-green-700 rounded border border-green-800">Enter</kbd>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Panel de atajos de teclado */}
            {!loading && !error && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <KeenIcon icon="keyboard" className="w-4 h-4" />
                    <span className="font-semibold">Atajos:</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-white rounded border border-gray-300">V</kbd>
                    <span>Vender</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-white rounded border border-gray-300">R</kbd>
                    <span>Redimir</span>
                  </div>
                  {activeTab === 'vender' && selectedStop && (
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-0.5 bg-white rounded border border-gray-300">D</kbd>
                      <span>Cambiar destino</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-white rounded border border-gray-300">Enter</kbd>
                    <span>{activeTab === 'vender' ? 'Vender tickets' : 'Buscar/Redimir'}</span>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <ModalTerceroTicket
        open={modalTerceroOpen}
        onClose={() => {
          setModalTerceroOpen(false);
          setTicketSeleccionadoParaCrear(null);
        }}
        onTerceroCreado={handleTerceroCreado}
        esEmpresa={ticketSeleccionadoParaCrear === 0}
      />

      <ModalPdfViewer
        isOpen={modalPdfOpen}
        onClose={() => {
          setModalPdfOpen(false);
          setPdfUrl(null);
        }}
        pdfUrl={pdfUrl}
      />
    </>
  );
};

export default ModalVentaTickets;

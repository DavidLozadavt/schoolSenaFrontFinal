import { useState, useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { ViajesModel } from '@/pages/transporte/cronograma-rutas/model/ViajesInterface';
import { useSnackbar } from 'notistack';
import ModalPdfViewer from '../ModalPdfViewer';
import ModalTerceroTicket from './ModalTerceroTicket';
import TicketAssignmentList from './TicketAssignmentList';
import RedeemTicketForm from './RedeemTicketForm';
import PaymentSelector from './PaymentSelector';
import MixedPaymentSelector from './MixedPaymentSelector';
import { Tercero } from '../../models/TerceroInterface';
import { useTicketSearch } from './Hooks/useTicketSearch';
import ModalMapaAsientos from './ModalMapaAsientos';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (ticketData: any) => void;
  viajeData: ViajesModel | null;
  selectedRutaId: number | null;
  idCaja: any;
  nombreLugarSeleccionado?: string;
  idLugar?: number | null;
}

const ModalCreateTicket = ({
  open,
  onClose,
  onSave,
  viajeData,
  selectedRutaId,
  idCaja,
  nombreLugarSeleccionado,
  idLugar
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
  
  const [modalMapaOpen, setModalMapaOpen] = useState(false);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState<number | null>(null);
  
  const idLugarRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      if (!mediosPago.length || !tiposPago.length) {
        cargarMediosYTiposPago();
      }
      cargarPrecioRutaSeleccionada();
    } else {
      resetearEstados();
      setIdLugarSeleccionado(null);
      idLugarRef.current = null;
    }
  }, [open, selectedRutaId, nombreLugarSeleccionado]);

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

  const resetearEstados = () => {
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
    setAsientoSeleccionado(null);

    limpiarCache();
  };

  const aplicarATodos = (tercero: Tercero) => {
    aplicarTerceroATodos(tercero);
    enqueueSnackbar('Cliente aplicado a todos los tickets.', { variant: 'success' });
  };

  const cargarPrecioRutaSeleccionada = async () => {
    if (!selectedRutaId) {
      setPrecioRutaSeleccionada(viajeData?.ruta?.precio || 0);
      setNombreRutaSeleccionada('');
      setIdLugarSeleccionado(null);
      idLugarRef.current = null;
      return;
    }

    if (nombreLugarSeleccionado) {
      setNombreRutaSeleccionada(nombreLugarSeleccionado);
    }

    if (selectedRutaId === viajeData?.idRuta) {
      setPrecioRutaSeleccionada(viajeData?.ruta?.precio || 0);
      const idLugar = viajeData?.ruta?.idLugar || null;
      setIdLugarSeleccionado(idLugar);
      idLugarRef.current = idLugar;
      if (!nombreLugarSeleccionado) {
        const origen = viajeData?.ruta?.ciudad_origen?.descripcion || '';
        const destino = viajeData?.ruta?.ciudad_destino?.descripcion || '';
        setNombreRutaSeleccionada(`${origen} → ${destino}`);
      }
      return;
    }

    try {
      const response = await axios.get(`/rutas/${selectedRutaId}`);
      setPrecioRutaSeleccionada(response.data?.precio || 0);
      
      const idLugar = response.data?.idLugar || null;
      setIdLugarSeleccionado(idLugar);
      idLugarRef.current = idLugar;
      
      if (!nombreLugarSeleccionado) {
        const origen = response.data?.ciudad_origen?.descripcion || '';
        const destino = response.data?.ciudad_destino?.descripcion || '';
        const lugar = response.data?.lugar?.nombre || '';
        
        if (lugar) {
          setNombreRutaSeleccionada(`${lugar} (${origen} → ${destino})`);
        } else {
          setNombreRutaSeleccionada(`${origen} → ${destino}`);
        }
      }
    } catch (error) {
      console.error('Error al obtener precio de ruta:', error);
      setPrecioRutaSeleccionada(viajeData?.ruta?.precio || 0);
      setIdLugarSeleccionado(null);
      idLugarRef.current = null;
      if (!nombreLugarSeleccionado) {
        setNombreRutaSeleccionada('');
      }
    }
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

  const abrirFormularioTercero = (numeroTicket: number) => {
    setTicketSeleccionadoParaCrear(numeroTicket);
    setModalTerceroOpen(true);
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
      const idLugarFinal = idLugarRef.current ?? idLugar ?? null;
      
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
        onSave(ticketCreado);
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
        const idLugarFinal = idLugarRef.current ?? idLugar ?? null;
        
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
        onSave(ticketsCreados);
      }

      if (Array.isArray(ticketsCreados)) {
        enqueueSnackbar(`${ticketsCreados.length} ticket(s) vendido(s) exitosamente.`, {
          variant: 'success'
        });
      } else if (ticketsCreados.tickets) {
        enqueueSnackbar(`${ticketsCreados.tickets.length} ticket(s) vendido(s) exitosamente.`, {
          variant: 'success'
        });
      }

      if (
        generarTicket &&
        ticketsCreados &&
        (Array.isArray(ticketsCreados) || ticketsCreados.tickets)
      ) {
        await generarTicketPDF(ticketsCreados);
      }

      handleClose();
    } catch (error: any) {
      const mensajeError =
        error.response?.data?.message ||
        'Hubo un error al vender los tickets. Intenta nuevamente.';
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
          ticketIds: ticketIds.join(',')
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
        } else {
          throw new Error('Respuesta no exitosa del servidor');
        }
      } catch (error) {
        enqueueSnackbar('Hubo un error al generar el ticket. Por favor, inténtalo de nuevo.', {
          variant: 'error'
        });
      }
    }
  };

  const handleClose = () => {
    resetearEstados();
    onClose();
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const todosAsignados = asignacionTickets.every((a) => a.tercero !== null);
      const pagoValido = pagosVenta || medioPagoVentaSimple;

      if (
        e.key === 'Enter' &&
        open &&
        !loadingVenta &&
        todosAsignados &&
        tipoPagoSeleccionado &&
        pagoValido &&
        activeTab === 'vender'
      ) {
        venderTicket();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, loadingVenta, activeTab, asignacionTickets, tipoPagoSeleccionado, pagosVenta, medioPagoVentaSimple]);

  const todosAsignados = asignacionTickets.every((a) => a.tercero !== null);

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <ModalContent className="max-w-[960px] top-[2%] p-4">
          <ModalHeader className="tp-5 flex justify-between items-center">
            <ModalTitle className="text-lg font-semibold flex items-center gap-2">
              <KeenIcon icon="ticket" className="w-5 h-5" />
              Gestión de Tickets
            </ModalTitle>
            <button
              className="p-2 rounded-full transition-colors hover:bg-gray-100"
              onClick={handleClose}
              aria-label="Cerrar"
            >
              <KeenIcon icon="cross" className="w-5 h-5" />
            </button>
          </ModalHeader>

          {/* PESTAÑAS */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('vender')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'vender'
                    ? 'text-blue-600 border-b-2 border-blue-600 '
                    : 'text-gray-600 hover:text-gray-800 '
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <KeenIcon icon="handcart" className="w-4 h-4" />
                  Vender Tickets
                </span>
              </button>

              <button
                onClick={() => setActiveTab('redimir')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'redimir'
                    ? 'text-green-600 border-b-2 border-green-600 '
                    : 'text-gray-600 hover:text-gray-800 '
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <KeenIcon icon="barcode" className="w-4 h-4" />
                  Redimir Ticket
                </span>
              </button>
            </div>
          </div>

          <ModalBody className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {activeTab === 'vender' && (
              <>
                {precioRutaSeleccionada > 0 && (
                  <div className="bg-gradient-to-r  to-indigo-50  border rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="bg-blue-600 rounded-full p-2 mt-1">
                          <KeenIcon icon="route" className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          {nombreRutaSeleccionada && (
                            <p className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1">
                              📍 {nombreRutaSeleccionada}
                            </p>
                          )}
                          <p className="text-xs font-medium text-gray-600 mb-1">Precio por ticket</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            }).format(precioRutaSeleccionada)}
                          </p>
                          {viajeData?.vehiculo?.clase_vehiculo?.mapas_asientos && 
                           viajeData.vehiculo.clase_vehiculo.mapas_asientos.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setModalMapaOpen(true)}
                                className="px-3 py-1.5 rounded-lg border border-blue-400 bg-white text-blue-700 hover:bg-blue-50 transition-colors text-xs font-semibold flex items-center gap-1.5"
                              >
                                <KeenIcon icon="map" className="w-4 h-4" />
                                Ver mapa de asientos
                              </button>
                              {asientoSeleccionado && (
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                  Asiento: {asientoSeleccionado}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {cantidad > 1 && (
                        <div className="text-right bg-white rounded-lg px-3 py-2 border border-blue-200">
                          <p className="text-xs text-gray-600 font-medium">Total {cantidad} tickets</p>
                          <p className="text-xl font-bold text-green-600">
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            }).format(precioRutaSeleccionada * cantidad)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-lg shadow-sm p-3 space-y-3 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <KeenIcon icon="document" className="w-4 h-4" />
                    ¿A quién facturaré?
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoFacturacion('viajero');
                        setEmpresaFacturacion(null);
                      }}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                        tipoFacturacion === 'viajero'
                          ? ''
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <KeenIcon 
                          icon="profile-circle" 
                          className={`w-5 h-5 ${tipoFacturacion === 'viajero' ? 'text-blue-600' : 'text-gray-400'}`} 
                        />
                        <div className="text-left">
                          <span className={`font-medium text-sm block ${
                            tipoFacturacion === 'viajero' ? 'text-blue-700' : 'text-gray-600'
                          }`}>
                            Viajero
                          </span>
                          <span className="text-xs text-gray-500">
                            Al pasajero
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoFacturacion('empresa')}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                        tipoFacturacion === 'empresa'
                          ? ''
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <KeenIcon 
                          icon="office-bag" 
                          className={`w-5 h-5 ${tipoFacturacion === 'empresa' ? 'text-green-600' : 'text-gray-400'}`} 
                        />
                        <div className="text-left">
                          <span className={`font-medium text-sm block ${
                            tipoFacturacion === 'empresa' ? 'text-green-700' : 'text-gray-600'
                          }`}>
                            Empresa
                          </span>
                          <span className="text-xs text-gray-500">
                            Corporativa
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>

                  {tipoFacturacion === 'empresa' && (
                    <div className="p-3  border  rounded-lg">
                      <div className="flex items-start gap-3">
                        <KeenIcon icon="information-2" className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-green-800 mb-1">Facturación Corporativa</p>
                          <p className="text-xs text-green-700">
                            Crea o busca la empresa en la sección de <strong>"Asignar Clientes"</strong> abajo. El primer cliente será la empresa facturadora.
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

                <div className="rounded-xl shadow-sm p-4 space-y-4 border border-gray-100">
                  <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <KeenIcon icon="shopping-cart" className="w-4 h-4" />
                    1️⃣ Cantidad de Tickets
                  </h3>
                  <input
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                    min="1"
                    max="20"
                    className="input p-2 border border-gray-300 rounded-md w-full focus:ring-2"
                    placeholder="Ej. 5"
                  />
                  <p className="text-xs text-gray-500">Máx. 20 tickets por venta.</p>
                </div>

                <TicketAssignmentList
                  asignacionTickets={asignacionTickets}
                  cantidad={cantidad}
                  onIdentificacionChange={actualizarIdentificacionTicket}
                  onAbrirFormularioTercero={abrirFormularioTercero}
                  onAplicarATodos={aplicarATodos}
                />

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

                {/* BOTONES VENTA */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
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
                  </button>
                </div>
              </>
            )}

            {activeTab === 'redimir' && (
              <>
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

                {/* Selector de pago - Componente separado */}
                {reservaEncontrada && (
                  <MixedPaymentSelector
                    tiposPago={tiposPago}
                    mediosPago={mediosPago}
                    tipoPagoSeleccionado={tipoPagoSeleccionado}
                    valorTotal={reservaEncontrada.ruta?.precio || viajeData?.ruta?.precio || 0}
                    onTipoPagoChange={setTipoPagoSeleccionado}
                    onPagosChange={(pagos, medioPagoSimple) => {
                      setPagosRedencion(pagos);
                      setMedioPagoRedencionSimple(medioPagoSimple ?? null);
                    }}
                    variant="redencion"
                  />
                )}

                {reservaEncontrada && (
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={handleClose}
                      className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
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
                    </button>
                  </div>
                )}
              </>
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

      <ModalMapaAsientos
        open={modalMapaOpen}
        onClose={() => setModalMapaOpen(false)}
        claseVehiculo={viajeData?.vehiculo?.clase_vehiculo || null}
        asientoSeleccionado={asientoSeleccionado}
        onSeleccionarAsiento={(asiento) => {
          setAsientoSeleccionado(asiento);
          if (asiento) {
            enqueueSnackbar(`Asiento ${asiento} seleccionado`, { variant: 'success' });
          } else {
            enqueueSnackbar('Selección de asiento limpiada', { variant: 'info' });
          }
        }}
      />
    </>
  );
};

export default ModalCreateTicket;
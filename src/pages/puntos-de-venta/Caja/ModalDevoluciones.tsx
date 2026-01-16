import { useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface ModalDevolucionesProps {
  open: boolean;
  onClose: () => void;
  idPunto?: string;
  onSave?: () => void;
}

interface TicketFactura {
  ticket_id: number;
  numero_ticket: string;
  cantidad: number;
  valor: string;
  valor_detalle_factura: string;
  cantidad_detalle_factura: string;
  detalle: string;
  estado: string;
  tercero: {
    id: number;
    nombre_completo: string;
    documento: string | null;
    telefono: string | null;
    email: string;
  };
  ruta: {
    id: number;
    origen: string | null;
    destino: string | null;
    lugar_ruta: {
      id: number;
      nombre: string;
      direccion: string | null;
    } | null;
  };
  lugar_ticket: {
    id: number;
    nombre: string;
  };
  fecha_creacion: string;
}

interface FacturaData {
  factura: {
    id: number;
    numeroFactura: string;
    fecha: string;
    valor: string;
    valorIva: string;
    valorMasIva: string;
    factura_electronica?: {
      id: number;
      reference_code: string;
      factus_id: string;
      prefix: string;
      number: string;
      cufe: string;
      status: string;
      email_status: string;
      pdf_path: string;
      xml_path: string | null;
      qr_url: string;
      validated_at: string;
      sent_at: string;
    };
  };
  total_tickets: number;
  tickets: TicketFactura[];
}

const ModalDevoluciones = ({ open, onClose, idPunto, onSave }: ModalDevolucionesProps) => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [numeroFactura, setNumeroFactura] = useState('');
  const [facturaData, setFacturaData] = useState<FacturaData | null>(null);
  const [ticketsSeleccionados, setTicketsSeleccionados] = useState<number[]>([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [loadingDevolucion, setLoadingDevolucion] = useState(false);
  const [motivoDevolucion, setMotivoDevolucion] = useState('');

  const buscarFactura = async () => {
    if (!numeroFactura.trim()) {
      enqueueSnackbar('Por favor ingresa un número de factura.', { variant: 'warning' });
      return;
    }

    setLoadingBusqueda(true);
    setFacturaData(null);
    setTicketsSeleccionados([]);

    try {
      const response = await axios.post(`/factura/detalles-por-numero`, {
        numeroFactura: numeroFactura.trim()
      });

      if (response.data?.success && response.data.data) {
        setFacturaData(response.data.data);
        enqueueSnackbar('Factura encontrada correctamente.', { variant: 'success' });
      } else {
        enqueueSnackbar('No se encontró la factura.', { variant: 'warning' });
      }
    } catch (error: any) {
      const mensaje = error.response?.data?.message || 'Error al buscar la factura.';
      enqueueSnackbar(mensaje, { variant: 'error' });
      setFacturaData(null);
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const toggleTicketSeleccion = (ticketId: number) => {
    setTicketsSeleccionados(prev => {
      if (prev.includes(ticketId)) {
        return prev.filter(id => id !== ticketId);
      } else {
        return [...prev, ticketId];
      }
    });
  };

  const seleccionarTodos = () => {
    if (!facturaData) return;
    // Filtrar solo los tickets que no están devueltos
    const ticketsDisponibles = facturaData.tickets
      .filter(t => t.estado !== 'DEVUELTO')
      .map(t => t.ticket_id);
    
    if (ticketsSeleccionados.length === ticketsDisponibles.length) {
      setTicketsSeleccionados([]);
    } else {
      setTicketsSeleccionados(ticketsDisponibles);
    }
  };

  const calcularTotalDevolucion = () => {
    if (!facturaData) return 0;
    return facturaData.tickets
      .filter(t => ticketsSeleccionados.includes(t.ticket_id))
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);
  };

  const procesarDevolucion = async () => {
    if (ticketsSeleccionados.length === 0) {
      enqueueSnackbar('Selecciona al menos un ticket para devolver.', { variant: 'warning' });
      return;
    }

    if (!motivoDevolucion.trim()) {
      enqueueSnackbar('Por favor ingresa el motivo de la devolución.', { variant: 'warning' });
      return;
    }

    if (!facturaData) {
      enqueueSnackbar('No hay información de factura disponible.', { variant: 'error' });
      return;
    }

    setLoadingDevolucion(true);

    try {
      // Procesar devolución de cada ticket seleccionado
      await axios.post(`devoluciones/crear-desde-tickets`, {
        idFactura: facturaData.factura.id,
        ticketIds: ticketsSeleccionados,
        motivo: motivoDevolucion.trim()
      });

      enqueueSnackbar(`${ticketsSeleccionados.length} ticket(s) devuelto(s) exitosamente.`, { 
        variant: 'success' 
      });
      
      // Llamar a onSave para actualizar los viajes
      if (onSave) {
        onSave();
      }
      
      handleClose();
    } catch (error: any) {
      const mensaje = error.response?.data?.message || 'Error al procesar la devolución.';
      enqueueSnackbar(mensaje, { variant: 'error' });
    } finally {
      setLoadingDevolucion(false);
    }
  };

  const handleClose = () => {
    setNumeroFactura('');
    setFacturaData(null);
    setTicketsSeleccionados([]);
    setMotivoDevolucion('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && numeroFactura.trim() && !loadingBusqueda) {
      buscarFactura();
    }
  };

  const totalFactura = facturaData ? parseFloat(facturaData.factura.valorMasIva) : 0;
  const totalDevolucion = calcularTotalDevolucion();
  const totalRestante = totalFactura - totalDevolucion;

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[900px] top-[2%]">
        <ModalHeader className="p-5 flex justify-between items-center border-b">
          <ModalTitle className="text-lg font-semibold flex items-center gap-2">
            Devoluciones de Tickets
          </ModalTitle>
          <button
            className="p-2 rounded-full transition-colors hover:bg-gray-100"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" className="w-5 h-5" />
          </button>
        </ModalHeader>

        <ModalBody className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Sección de búsqueda */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Factura <span className="text-gray-500 text-xs">(Presiona Enter para buscar)</span>
              </label>
              <input
                type="text"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ej. 00016"
                className="input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 "
                disabled={loadingBusqueda}
                autoFocus
              />
              {loadingBusqueda && (
                <div className="flex items-center gap-2 mt-2 ">
                  <KeenIcon icon="loading" className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Buscando factura...</span>
                </div>
              )}
            </div>
          </div>

          {/* Información de la factura */}
          {facturaData && (
            <div className="space-y-4">
              {/* Header de la factura */}
              <div className="border  rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <KeenIcon icon="check-circle" className="w-5 h-5" />
                      Factura #{facturaData.factura.numeroFactura}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-xs text-gray-600">Fecha</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(facturaData.factura.fecha).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Tickets</p>
                        <p className="font-semibold text-gray-800">{facturaData.total_tickets}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Valor Total</p>
                        <p className="font-semibold text-gray-800">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(totalFactura)}
                        </p>
                      </div>
                    </div>

                    {/* Información del Cliente (Tercero) */}
                    {facturaData.tickets.length > 0 && facturaData.tickets[0].tercero && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-600 mb-1">Cliente</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {facturaData.tickets[0].tercero.nombre_completo}
                        </p>
                        {facturaData.tickets[0].tercero.documento && (
                          <p className="text-xs text-gray-600">
                            Doc: {facturaData.tickets[0].tercero.documento}
                          </p>
                        )}
                        {facturaData.tickets[0].tercero.email && (
                          <p className="text-xs text-gray-600">
                            {facturaData.tickets[0].tercero.email}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Información de Factura Electrónica */}
                {facturaData.factura.factura_electronica && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-medium mb-2 flex items-center gap-1">
                          <KeenIcon icon="document" className="w-4 h-4" />
                          Factura Electrónica
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-800">
                            {facturaData.factura.factura_electronica.number}
                          </p>
                          <p className="text-xs text-gray-600">
                            Estado: <span className={`font-medium ${
                              facturaData.factura.factura_electronica.status === 'validated' 
                                ? 'text-green-600' 
                                : 'text-yellow-600'
                            }`}>
                              {facturaData.factura.factura_electronica.status === 'validated' ? 'Validada' : facturaData.factura.factura_electronica.status}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {facturaData.factura.factura_electronica.pdf_path && (
                          <a
                            href={facturaData.factura.factura_electronica.pdf_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <KeenIcon icon="file-down" className="w-3.5 h-3.5" />
                            Ver PDF
                          </a>
                        )}
                        {facturaData.factura.factura_electronica.qr_url && (
                          <a
                            href={facturaData.factura.factura_electronica.qr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <KeenIcon icon="code" className="w-3.5 h-3.5" />
                            Ver en DIAN
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen de devolución */}
              <div className="bg-gradient-to-r  border rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tickets disponibles</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {facturaData.tickets.filter(t => t.estado !== 'DEVUELTO').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tickets seleccionados</p>
                    <p className="text-2xl font-bold text-orange-600">{ticketsSeleccionados.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total a devolver</p>
                    <p className="text-2xl font-bold text-red-600">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      }).format(totalDevolucion)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total restante</p>
                    <p className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      }).format(totalRestante)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de tickets con checkboxes */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Tickets de la Factura
                  </h4>
                  <button
                    onClick={seleccionarTodos}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {ticketsSeleccionados.length === facturaData.tickets.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {facturaData.tickets.map((ticket) => {
                    const esDevuelto = ticket.estado === 'DEVUELTO';
                    return (
                      <div
                        key={ticket.ticket_id}
                        className={`px-4 py-3 border-b last:border-b-0 transition-colors ${
                          esDevuelto 
                            ? 'bg-red-50 opacity-60' 
                            : ticketsSeleccionados.includes(ticket.ticket_id) 
                              ? 'bg-blue-50' 
                              : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={esDevuelto || ticketsSeleccionados.includes(ticket.ticket_id)}
                            onChange={() => !esDevuelto && toggleTicketSeleccion(ticket.ticket_id)}
                            disabled={esDevuelto}
                            className={`mt-1 w-4 h-4 rounded focus:ring-2 ${
                              esDevuelto 
                                ? 'text-red-400 cursor-not-allowed' 
                                : 'text-blue-600 focus:ring-blue-500 cursor-pointer'
                            }`}
                          />
                          <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-600">Ticket</p>
                              <p className={`font-semibold ${esDevuelto ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                {ticket.numero_ticket}
                              </p>
                              {esDevuelto && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 text-xs font-medium text-red-700 bg-red-100 rounded">
                                  <KeenIcon icon="shield-cross" className="w-3 h-3" />
                                  DEVUELTO
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Cliente</p>
                              <p className={`font-medium ${esDevuelto ? 'text-gray-500' : 'text-gray-800'}`}>
                                {ticket.tercero.nombre_completo}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Destino</p>
                              <p className={`font-medium ${esDevuelto ? 'text-gray-500' : 'text-gray-800'}`}>
                                {ticket.lugar_ticket.nombre}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Valor</p>
                              <p className={`font-bold ${esDevuelto ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                {new Intl.NumberFormat('es-CO', {
                                  style: 'currency',
                                  currency: 'COP',
                                  minimumFractionDigits: 0
                                }).format(parseFloat(ticket.valor))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Motivo de devolución */}
              {ticketsSeleccionados.length > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de la Devolución *
                    </label>
                    <textarea
                      value={motivoDevolucion}
                      onChange={(e) => setMotivoDevolucion(e.target.value)}
                      placeholder="Describe el motivo de la devolución..."
                      rows={3}
                      className="input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Advertencia */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <KeenIcon icon="information-2" className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Importante</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Esta acción cancelará los {ticketsSeleccionados.length} ticket(s) seleccionado(s) y 
                          registrará la devolución de {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(totalDevolucion)}. Esta operación no se puede deshacer.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={handleClose}
              disabled={loadingDevolucion}
              className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            {facturaData && ticketsSeleccionados.length > 0 && (
              <button
                onClick={procesarDevolucion}
                disabled={!motivoDevolucion.trim() || loadingDevolucion}
                className="flex items-center gap-2 px-5 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loadingDevolucion ? (
                  <>
                    <KeenIcon icon="loading" className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <KeenIcon icon="check" className="w-4 h-4" />
                    Devolver {ticketsSeleccionados.length} Ticket(s)
                  </>
                )}
              </button>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalDevoluciones;

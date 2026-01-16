import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { PaymentType } from '@/pages/tipos-pago/model/TipoPagoInterface';
import { ViajesModel } from '@/pages/transporte/cronograma-rutas/model/ViajesInterface';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  paymentType?: PaymentType;
  onClose: () => void;
  onSave?: () => void;
  idRutaPadre?: number;
  viajeData: ViajesModel | null;
  idCaja: any;
}

interface Tercero {
  id: number;
  nombre: string;
  identificacion: string;
}

interface ReservaState {
  identificacion: string;
  cantidad: number;
  tercero: Tercero | null;
  buscando: boolean;
  guardando: boolean;
  success: boolean;
  error: string;
}

const InfoViaje = ({ viajeData }: { viajeData: ViajesModel }) => (
  <div className="border rounded-lg p-4">
    <div className="flex items-center gap-2 mb-3">
      <KeenIcon icon="route" className="w-5 h-5" />
      <h3 className="font-semibold">Información del Viaje</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="border rounded-md p-3">
        <p className="text-xs opacity-70 mb-1">Origen</p>
        <p className="font-semibold flex items-center gap-1">
          <KeenIcon icon="geolocation" className="w-4 h-4" />
          {viajeData.ruta.ciudad_origen.descripcion}
        </p>
      </div>
      <div className="border rounded-md p-3">
        <p className="text-xs opacity-70 mb-1">Destino</p>
        <p className="font-semibold flex items-center gap-1">
          <KeenIcon icon="map" className="w-4 h-4" />
          {viajeData.ruta.ciudad_destino.descripcion}
        </p>
      </div>
    </div>
  </div>
);

const BuscarCliente = ({ 
  identificacion, 
  buscando, 
  onIdentificacionChange, 
  onBuscar 
}: {
  identificacion: string;
  buscando: boolean;
  onIdentificacionChange: (value: string) => void;
  onBuscar: () => void;
}) => (
  <div className="border rounded-lg p-4 space-y-3">
    <div className="flex items-center gap-2">
      <KeenIcon icon="profile-user" className="w-5 h-5" />
      <label className="form-label font-semibold mb-0">Buscar Cliente</label>
    </div>
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <input
          type="text"
          className="input w-full pr-10"
          placeholder="Número de identificación"
          value={identificacion}
          onChange={(e) => onIdentificacionChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onBuscar()}
        />
        <KeenIcon icon="search-list" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
      </div>
      <button
        className="btn btn-primary flex items-center gap-2 min-w-[120px] justify-center"
        onClick={onBuscar}
        disabled={buscando}
      >
        {buscando ? (
          <>
            <KeenIcon icon="arrows-circle" className="animate-spin w-4 h-4" />
            Buscando...
          </>
        ) : (
          <>
            <KeenIcon icon="magnifier" className="w-3 h-4 mt-3" />
            Buscar
          </>
        )}
      </button>
    </div>
    <p className="text-xs opacity-70">Presione Enter o haga clic en Buscar</p>
  </div>
);

const TerceroInfo = ({ tercero }: { tercero: Tercero }) => (
  <div className="border-2 p-4 rounded-lg">
    <div className="flex items-center gap-2 mb-3">
      <div className="rounded-full p-1.5 border">
        <KeenIcon icon="verify" className="w-5 h-5" />
      </div>
      <span className="font-bold">✓ Cliente Encontrado</span>
    </div>
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-start gap-2">
        <KeenIcon icon="profile-circle" className="w-4 h-4 mt-0.5 opacity-70" />
        <div className="flex-1">
          <p className="text-xs opacity-70">Nombre</p>
          <p className="font-semibold">{tercero.nombre}</p>
        </div>
      </div>
      <div className="border-t pt-2 flex items-start gap-2">
        <KeenIcon icon="badge" className="w-4 h-4 mt-0.5 opacity-70" />
        <div className="flex-1">
          <p className="text-xs opacity-70">Identificación</p>
          <p className="font-semibold">{tercero.identificacion}</p>
        </div>
      </div>
    </div>
  </div>
);

const CantidadTickets = ({ 
  cantidad, 
  disabled, 
  onChange 
}: {
  cantidad: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) => (
  <div className={`border rounded-lg p-4 space-y-3 transition-all ${
    disabled ? 'opacity-50' : ''
  }`}>
    <div className="flex items-center gap-2">
      <KeenIcon icon="lots-shopping" className="w-5 h-5" />
      <label className="form-label font-semibold mb-0">Cantidad de Tickets</label>
    </div>
    <div className="relative">
      <input
        type="number"
        className="input w-full text-lg font-semibold pr-10"
        min="1"
        max="20"
        value={cantidad}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        disabled={disabled}
        placeholder="1"
      />
      <KeenIcon icon="ticket" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-50" />
    </div>
    <p className="text-xs opacity-70">
      {disabled ? 'Primero debe buscar un cliente' : 'Máximo 20 tickets por reserva'}
    </p>
  </div>
);

const AlertMessage = ({ 
  type, 
  message 
}: { 
  type: 'error' | 'success'; 
  message: string 
}) => {
  const isError = type === 'error';
  return (
    <div className="border-2 p-4 rounded-lg flex items-start gap-3">
      <div className="rounded-full p-1.5 border">
        <KeenIcon 
          icon={isError ? 'information-2' : 'check-circle'} 
          className="w-5 h-5"
        />
      </div>
      <div className="flex-1">
        <p className="font-semibold mb-1">{isError ? 'Error' : 'Éxito'}</p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

const ModalReservaTickets = ({
  open,
  onClose,
  onSave,
  idRutaPadre,
  viajeData,
  idCaja
}: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [state, setState] = useState<ReservaState>({
    identificacion: '',
    cantidad: 1,
    tercero: null,
    buscando: false,
    guardando: false,
    success: false,
    error: ''
  });

  const updateState = (updates: Partial<ReservaState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const buscarTercero = async () => {
    if (!state.identificacion.trim()) {
      updateState({ error: 'Ingrese una identificación' });
      return;
    }

    updateState({ buscando: true, error: '', tercero: null });

    try {
      const response = await axios.get(`terceros?identificacion=${state.identificacion}`);
      if (response.data && response.data.length > 0) {
        updateState({ tercero: response.data[0], buscando: false });
      } else {
        updateState({ 
          error: 'No se encontró un tercero con esa identificación',
          buscando: false 
        });
      }
    } catch (err: any) {
      updateState({ 
        error: err.response?.data?.message || 'Error al buscar el tercero',
        buscando: false 
      });
    }
  };

  const validarReserva = (): string | null => {
    if (!state.tercero) {
      return 'Primero debe buscar y seleccionar un tercero';
    }
    if (!viajeData?.agendar_viajes?.idViaje && !viajeData?.id) {
      return 'No hay información del viaje';
    }
    if (state.cantidad < 1) {
      return 'La cantidad debe ser mayor a 0';
    }
    return null;
  };

  const generarPDF = async (reservaId: number) => {
    try {
      const pdfResponse = await axios.get(`/reservas/${reservaId}/pdf`, {
        responseType: 'blob'
      });

      
      const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => window.URL.revokeObjectURL(url), 100);

      enqueueSnackbar('Reserva creada y ticket generado exitosamente', { 
        variant: 'success' 
      });
    } catch (pdfError: any) {
      enqueueSnackbar('Reserva creada pero hubo un error al generar el ticket', { 
        variant: 'warning' 
      });
    }
  };

  const handleReservar = async () => {
    const error = validarReserva();
    if (error) {
      updateState({ error });
      return;
    }

    updateState({ guardando: true, error: '' });

    try {
      const reservaData = {
        idViaje: viajeData!.agendar_viajes?.idViaje || viajeData!.id,
        idTercero: state.tercero!.id,
        cantidad: state.cantidad,
        idRuta: viajeData!.idRuta || idRutaPadre,
        estado: 'RESERVADO',
        generar_ticket: true
      };

      const response = await axios.post('/reservas', reservaData);

      if (response.data?.data?.id) {
        await generarPDF(response.data.data.id);
      } else {
        enqueueSnackbar('Reserva creada exitosamente', { variant: 'success' });
      }

      updateState({ success: true, guardando: false });
      
      setTimeout(() => {
        onSave?.();
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error al crear reserva:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al crear la reserva';
      updateState({ error: errorMessage, guardando: false });
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleClose = () => {
    setState({
      identificacion: '',
      cantidad: 1,
      tercero: null,
      buscando: false,
      guardando: false,
      success: false,
      error: ''
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[700px] top-[10%]">
      
          <ModalHeader className="tp-5 flex justify-between items-center">
            <ModalTitle className="text-lg font-semibold flex items-center gap-2">
              <KeenIcon icon="ticket" className="w-5 h-5" />
              Reserva de Tickets
            </ModalTitle>
            <button
              className="p-2 rounded-full transition-colors hover:bg-gray-100"
              onClick={handleClose}
              aria-label="Cerrar"
            >
              <KeenIcon icon="cross" className="w-5 h-5" />
            </button>
          </ModalHeader>
        
        <ModalBody className="space-y-5 p-5 max-h-[70vh] overflow-y-auto">
          {viajeData && <InfoViaje viajeData={viajeData} />}

          <BuscarCliente
            identificacion={state.identificacion}
            buscando={state.buscando}
            onIdentificacionChange={(value) => updateState({ identificacion: value })}
            onBuscar={buscarTercero}
          />

          {state.tercero && <TerceroInfo tercero={state.tercero} />}

          <CantidadTickets
            cantidad={state.cantidad}
            disabled={!state.tercero}
            onChange={(value) => updateState({ cantidad: value })}
          />

          {state.error && <AlertMessage type="error" message={state.error} />}
          {state.success && <AlertMessage type="success" message="Reserva creada exitosamente" />}
        </ModalBody>

        <div className="border-t p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <KeenIcon icon="information-5" className="w-5 h-5" />
            {state.tercero ? (
              <span>
                <strong>{state.tercero.nombre}</strong> - {state.cantidad} ticket(s)
              </span>
            ) : (
              <span>Busque un cliente para continuar</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              className="btn btn-light flex items-center gap-2"
              onClick={handleClose}
              disabled={state.guardando}
            >
              {/* <KeenIcon icon="cross-circle" className="w-4 h-4" /> */}
              Cancelar
            </button>
            <button
              className="btn btn-primary flex items-center gap-2 min-w-[160px] justify-center"
              onClick={handleReservar}
              disabled={!state.tercero || state.guardando || state.success}
            >
              {state.guardando ? (
                <>
                  <KeenIcon icon="arrows-circle" className="animate-spin w-5 h-5" />
                  Procesando...
                </>
              ) : (
                <>
                  {/* <KeenIcon icon="check-circle" className="w-5 h-5" /> */}
                  Confirmar Reserva
                </>
              )}
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default ModalReservaTickets;
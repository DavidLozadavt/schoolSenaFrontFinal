import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import ModalReporteVentanillas from './ModalReportePlanillas';
import CajaInputField from './components/CajaInputField';
import ModalTransacciones from './components/ModalTransacciones';

interface ModalProps {
  open: boolean;
  idPunto?: any;
  onClose: () => void;
  onSave?: (data: any) => void;
}

const ModalCerrarCaja = ({ open, idPunto, onClose, onSave }: ModalProps) => {
  const [valorEfectivo, setValorEfectivo] = useState<string>('0');
  const [valorGasto, setValorGasto] = useState<string>('0');
  const [valorTransaccion, setValorTransaccion] = useState<string>('0');
  const [valorPropinas, setValorPropinas] = useState<string>('0');
  const [valorCaja, setValorCaja] = useState<string>('0');
  const [exedente, setExedente] = useState<string>('0');
  const [observacion, setObservacion] = useState<string>('NO APLICA');
  const [idCajaTienda, setIdCajaTienda] = useState<number | null>(null);
  const [planillas, setPlanillas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados para controlar visibilidad de inputs
  const [hasEfectivo, setHasEfectivo] = useState<boolean>(false);
  const [hasTransferencias, setHasTransferencias] = useState<boolean>(false);
  const [hasGastos, setHasGastos] = useState<boolean>(false);

  const [totales, setTotales] = useState<{
    valorTiqueteado: number;

  } | null>(null);

  // Estados para modales de transacciones
  const [modalTransaccionesEfectivo, setModalTransaccionesEfectivo] = useState(false);
  const [modalTransaccionesTransferencias, setModalTransaccionesTransferencias] = useState(false);
  const [modalTransaccionesGastos, setModalTransaccionesGastos] = useState(false);

  const [modalOpenReporte, setModalOpenReporte] = useState(false);

  const handleModalOpenReporte = () => {
    setModalOpenReporte(true);
  };
  const handleModalCloseReporte = () => {
    setModalOpenReporte(false);
  };


  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const isObservacionInvalida = observacion.trim() === '';


  useEffect(() => {
    if (open) {
      setLoading(true);
      axios.get(`caja-latest/${idPunto}`)
        .then((res) => {
          const id = res.data.id;
          setIdCajaTienda(id);
          return axios.get(`planillas_usuario/${id}`);
        })
        .then((response) => {
          const { valorTiqueteado, viajes } = response.data;
          setPlanillas(viajes);
          setTotales({ valorTiqueteado });

          setValorCaja(valorTiqueteado?.toFixed(2) || '0');
        })
        .catch((error) => {
          console.error('Error al obtener datos:', error);
          enqueueSnackbar('Error al cargar las planillas', { variant: 'error' });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, idPunto]);

  useEffect(() => {
    if (idCajaTienda) {
      axios.get(`transacciones_efectivo/${idCajaTienda}`)
        .then(res => {
          const data = res.data || [];
          const hasData = data.length > 0;
          setHasEfectivo(hasData);
          if (hasData) {
            const total = data.reduce((acc: number, item: any) => {
              const valor = item.valor || item.monto || item.total || 0;
              const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
              return acc + (valorNumerico || 0);
            }, 0);
            setValorEfectivo(total.toFixed(2));
          }
        })
        .catch(err => console.error('Error al cargar efectivo:', err));

      axios.get(`transacciones_transferencias/${idCajaTienda}`)
        .then(res => {
          const data = res.data || [];
          const hasData = data.length > 0;
          setHasTransferencias(hasData);
          if (hasData) {
            const total = data.reduce((acc: number, item: any) => {
              const valor = item.valor || item.monto || item.total || 0;
              const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
              return acc + (valorNumerico || 0);
            }, 0);
            setValorTransaccion(total.toFixed(2));
          }
        })
        .catch(err => console.error('Error al cargar transferencias:', err));

      // Cargar gastos
      axios.get(`transacciones_gastos/${idCajaTienda}`)
        .then(res => {
          const data = res.data || [];
          const hasData = data.length > 0;
          setHasGastos(hasData);
          if (hasData) {
            const total = data.reduce((acc: number, item: any) => {
              const valor = item.valor || item.monto || item.total || 0;
              const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
              return acc + (valorNumerico || 0);
            }, 0);
            setValorGasto(total.toFixed(2));
          }
        })
        .catch(err => console.error('Error al cargar gastos:', err));
    }
  }, [idCajaTienda]);


  useEffect(() => {
    const totalCaja =
      parseFloat(totales?.valorTiqueteado?.toString() || '0') +
      parseFloat(valorEfectivo || '0') +
      parseFloat(valorTransaccion || '0') +
      parseFloat(valorPropinas || '0') -
      parseFloat(valorGasto || '0');

    setValorCaja(totalCaja.toFixed(2));
  }, [valorEfectivo, valorTransaccion, valorPropinas, valorGasto, totales]);

  const handleSave = async () => {
    try {
      const dataToSave = {
        valorEfectivo: parseFloat(valorEfectivo),
        valorGasto: parseFloat(valorGasto),
        valorTransaccion: parseFloat(valorTransaccion),
        valorPropinas: parseFloat(valorPropinas),
        valorCaja: parseFloat(valorCaja),
        observacion,
        idPuntoDeVenta: idPunto,
        exedente: parseFloat(exedente)
      };

      const response = await axios.post(`caja-cerrar/${idPunto}`, dataToSave);
      enqueueSnackbar('Caja cerrada correctamente', { variant: 'success' });
      onClose();
      if (onSave) {
        onSave(response.data);
      }
    } catch (error) {
      const errorMessage = (error as any).response?.data?.message || 'Error al cerrar la caja';
      console.error('Error del backend:', errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'warning' });
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <ModalContent className="max-w-[600px] top-[10%] p-4">
          <ModalHeader>
            <ModalTitle>{'Cerrar caja'}</ModalTitle>
            <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>
          <ModalBody className="grid gap-3 px-0 py-5">
          {hasGastos && (
            <CajaInputField
              id="valorGasto"
              label="Valor de Gastos"
              value={valorGasto}
              onChange={setValorGasto}
              showInfoButton
              onInfoClick={() => setModalTransaccionesGastos(true)}
              infoTitle="Ver transacciones de gastos"
            />
          )}

          {hasEfectivo && (
            <CajaInputField
              id="valorEfectivo"
              label="Valor en Efectivo"
              value={valorEfectivo}
              onChange={setValorEfectivo}
              showInfoButton
              onInfoClick={() => setModalTransaccionesEfectivo(true)}
              infoTitle="Ver transacciones en efectivo"
            />
          )}

          {hasTransferencias && (
            <CajaInputField
              id="valorTransaccion"
              label="Valor en Transferencias"
              value={valorTransaccion}
              onChange={setValorTransaccion}
              showInfoButton
              onInfoClick={() => setModalTransaccionesTransferencias(true)}
              infoTitle="Ver transacciones por transferencias"
            />
          )}

          <CajaInputField
            id="valorPropinas"
            label="Valor Propinas"
            value={valorPropinas}
            onChange={setValorPropinas}
          />

          <CajaInputField
            id="valorCaja"
            label="Caja"
            value={valorCaja}
            disabled
          />

          <CajaInputField
            id="exedente"
            label="Excedente"
            value={exedente}
            onChange={setExedente}
          />

          <div>
            <label htmlFor="observacion" className="block mb-1 text-sm font-medium">
              Observación
            </label>
            <textarea
              id="observacion"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className={`w-full p-2 rounded-md textarea ${isObservacionInvalida ? 'border-red-500' : 'border-gray-300'
                }`}
              rows={5}
              placeholder="Observación..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>

            <button
              className="btn btn-info"
              onClick={
                handleModalOpenReporte
              }>
              Ver reporte
              <KeenIcon icon="cheque" />
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isObservacionInvalida}>
              Guardar
            </button>
          </div>
        </ModalBody>
        <ModalReporteVentanillas
          open={modalOpenReporte}
          onClose={handleModalCloseReporte}
          idPunto={idPunto}
        />
      </ModalContent>
    </Modal>

    {/* Modales de Transacciones */}
    <ModalTransacciones
      open={modalTransaccionesEfectivo}
      onClose={() => setModalTransaccionesEfectivo(false)}
      idCaja={idCajaTienda}
      tipo="efectivo"
      onTotalCalculated={(total, hasData) => {
        setHasEfectivo(hasData);
        if (hasData) {
          setValorEfectivo(total.toFixed(2));
        }
      }}
    />

    <ModalTransacciones
      open={modalTransaccionesTransferencias}
      onClose={() => setModalTransaccionesTransferencias(false)}
      idCaja={idCajaTienda}
      tipo="transferencias"
      onTotalCalculated={(total, hasData) => {
        setHasTransferencias(hasData);
        if (hasData) {
          setValorTransaccion(total.toFixed(2));
        }
      }}
    />

    <ModalTransacciones
      open={modalTransaccionesGastos}
      onClose={() => setModalTransaccionesGastos(false)}
      idCaja={idCajaTienda}
      tipo="gastos"
      onTotalCalculated={(total, hasData) => {
        setHasGastos(hasData);
        if (hasData) {
          setValorGasto(total.toFixed(2));
        }
      }}
    />
    </>
  );
};

export default ModalCerrarCaja;

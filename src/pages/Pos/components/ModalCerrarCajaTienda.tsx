import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

interface ModalProps {
  open: boolean;
  idPunto?: any;
  onClose: () => void;
  onSave?: (data: any) => void;
}

const ModalCerrarCajaTienda = ({ open, idPunto, onClose, onSave }: ModalProps) => {
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

  const [stockMinimo, setStockMinimo] = useState<any[]>([]);
  const [totales, setTotales] = useState<{
    valorTiqueteado: number;
  } | null>(null);

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

  const fetchStockMinimo = async () => {
    try {
      const response = await axios.get(`get_stock_minimo_punto_venta/${idPunto}`);
      setStockMinimo(response.data);
    } catch (err) {
      console.error(`Error fetching  data: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchStockMinimo();
      axios
        .get(`caja-latest/${idPunto}`)
        .then((res) => {
          const id = res.data.id;
          setIdCajaTienda(id);

          // Llamar a ambos endpoints en paralelo
          return Promise.all([axios.get(`get_transaccion_caja/${id}`)]);
        })
        .then(([transaccionesResponse]) => {
          // Procesar transacciones y llenar los campos
          const transaccionData = transaccionesResponse.data;
          setValorEfectivo((transaccionData.suma_medio_pago_1 || 0).toString());
          setValorTransaccion((transaccionData.suma_medio_pago_4 || 0).toString());
          setValorGasto((transaccionData.suma_pagos_tipo_transaccion_9 || 0).toString());
          setValorPropinas((transaccionData.suma_pago_propina || 0).toString());

          // El valor de caja se calculará automáticamente en el otro useEffect
        })
        .catch((error) => {
          console.error('Error al obtener datos:', error);
          enqueueSnackbar('Error al cargar los datos de la caja', { variant: 'error' });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, idPunto]);

  useEffect(() => {
    const totalCaja =
      parseFloat(valorEfectivo || '0') +
      parseFloat(valorTransaccion || '0') +
      parseFloat(valorPropinas || '0') -
      parseFloat(valorGasto || '0');

    setValorCaja(totalCaja.toFixed(2));
  }, [valorEfectivo, valorTransaccion, valorPropinas, valorGasto]);

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
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Cerrar caja</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div className="relative">
            <label htmlFor="valorGasto" className="block mb-1 text-sm font-medium">
              Valor de Gastos
            </label>
            <div className="relative flex items-center">
              <NumericFormat
                id="valorGasto"
                value={valorGasto}
                onValueChange={({ value }) => setValorGasto(value)}
                className="w-full p-2 border border-gray-300 rounded-md input"
                thousandSeparator
                prefix="$"
              />
              <button
                type="button"
                className="absolute flex items-center justify-center w-5 h-5 text-sm text-white bg-green-500 rounded-full right-2"
                title="Información sobre gastos"
              >
                i
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="valorEfectivo" className="block mb-1 text-sm font-medium">
              Valor en Efectivo
            </label>
            <div className="relative flex items-center">
              <NumericFormat
                id="valorEfectivo"
                value={valorEfectivo}
                onValueChange={({ value }) => setValorEfectivo(value)}
                className="w-full p-2 border border-gray-300 rounded-md input"
                thousandSeparator
                prefix="$"
              />
              <button
                type="button"
                className="absolute flex items-center justify-center w-5 h-5 text-sm text-white bg-green-500 rounded-full right-2"
                title="Información sobre gastos"
              >
                i
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="valorTransaccion" className="block mb-1 text-sm font-medium">
              Valor en Transferencias
            </label>
            <div className="relative flex items-center">
              <NumericFormat
                id="valorTransaccion"
                value={valorTransaccion}
                onValueChange={({ value }) => setValorTransaccion(value)}
                className="w-full p-2 border border-gray-300 rounded-md input"
                thousandSeparator
                prefix="$"
              />
              <button
                type="button"
                className="absolute flex items-center justify-center w-5 h-5 text-sm text-white bg-green-500 rounded-full right-2"
                title="Información sobre gastos"
              >
                i
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="valorPropinas" className="block mb-1 text-sm font-medium">
              Valor Propinas
            </label>
            <NumericFormat
              id="valorPropinas"
              value={valorPropinas}
              onValueChange={({ value }) => setValorPropinas(value)}
              className="w-full p-2 border border-gray-300 rounded-md input"
              thousandSeparator
              prefix="$"
            />
          </div>

          <div>
            <label htmlFor="valorCaja" className="block mb-1 text-sm font-medium">
              Caja
            </label>
            <NumericFormat
              id="valorCaja"
              value={valorCaja}
              className="w-full p-2 border border-gray-300 rounded-md input"
              thousandSeparator
              prefix="$"
              disabled
              // style={{
              //   color: '#000',
              //   opacity: 1,
              //   WebkitTextFillColor: '#000'
              // }}
            />
          </div>

          <div>
            <label htmlFor="exedente" className="block mb-1 text-sm font-medium">
              Excedente
            </label>
            <NumericFormat
              id="exedente"
              value={exedente}
              onValueChange={({ value }) => setExedente(value)}
              className="w-full p-2 border border-gray-300 rounded-md input"
              thousandSeparator
              prefix="$"
            />
          </div>

          <div>
            <label htmlFor="observacion" className="block mb-1 text-sm font-medium">
              Observación
            </label>
            <textarea
              id="observacion"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className={`w-full p-2 rounded-md textarea ${
                isObservacionInvalida ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={5}
              placeholder="Observación..."
              required
            />
          </div>

          {/* Productos con stock bajo */}
          {stockMinimo.length > 0 && (
            <div className="p-4 border border-yellow-300 rounded-lg bg-yellow-50">
              <div className="flex items-center gap-2 mb-3">
                <KeenIcon icon="information-2" className="text-xl text-yellow-600" />
                <h3 className="text-sm font-semibold text-yellow-800">
                  ⚠️ Productos con Stock Mínimo ({stockMinimo.length})
                </h3>
              </div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-yellow-100">
                    <tr>
                      <th className="p-2 text-left">Producto</th>
                      <th className="p-2 text-center">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMinimo.map((item, index) => (
                      <tr key={index} className="border-t border-yellow-200">
                        <td className="p-2">{item.producto?.caracteristicas || 'N/A'}</td>
                        <td className="p-2 text-center font-semibold text-red-600">
                          {item.cantidad || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>

            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={isObservacionInvalida}
            >
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalCerrarCajaTienda;

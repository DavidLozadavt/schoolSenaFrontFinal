import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { Pago, MedioPagoModel, TipoPagoModel } from '../models/PagoModel';
import { Cliente } from '../models/ClienteModel';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  montoTotal: number;
  idShoppingCart?: number | null;
  ivaActivo?: any;
  idTercero?: number | null;
  idPunto?: number | null;
  onSuccess?: () => void;
  cliente: Cliente | null;
}

const PagoModal = ({
  open,
  onClose,
  montoTotal,
  idShoppingCart,
  ivaActivo,
  idPunto,
  onSuccess,
  cliente
}: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [fecha, setFecha] = useState<string>('');
  const [pagoMixto, setPagoMixto] = useState(false);
  const [facturaElectronica, setFacturaElectronica] = useState(false);
  const [mediosPago, setMediosPago] = useState<MedioPagoModel[]>([]);
  const [tiposPago, setTiposPago] = useState<TipoPagoModel[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [idCajaTienda, setIdCajaTienda] = useState<number | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFecha(today);

    axios
      .get('/medio_pagos')
      .then((res) => setMediosPago(res.data))
      .catch(() => enqueueSnackbar('Error cargando medios de pago', { variant: 'error' }));

    axios
      .get('/tipo_pagos')
      .then((res) => {
        setTiposPago(res.data);
        const tipoPorDefecto = res.data.find((t: any) => t.id === 2) || res.data[1] || res.data[0];

        if (tipoPorDefecto) {
          setPagos((prev) =>
            prev.map((p) => ({
              ...p,
              idTipoPago: tipoPorDefecto
            }))
          );
        }
      })
      .catch(() => enqueueSnackbar('Error cargando tipos de pago', { variant: 'error' }));

    axios
      .get(`caja-latest/${idPunto}`)
      .then((res) => {
        setIdCajaTienda(res.data.id);
      })
      .catch((error) => {
        console.error('Error al obtener la caja:', error);
      });

    setPagos([crearPagoVacio()]);
  }, []);

  // Resetear pagos cuando se desactiva pago mixto
  useEffect(() => {
    if (!pagoMixto) {
      setPagos([
        {
          valor: montoTotal.toString(),
          idTipoPago:
            tiposPago.find((t) => t.id === 2) ||
            (tiposPago.length > 1 ? tiposPago[1] : { id: 2, detalleTipoPago: 'CONTADO' }),
          idMedioPago: { id: 0, detalleMedioPago: '' },
          rutaComprobante: null,
          aporte: '',
          opcionPago: ''
        }
      ]);
    }
  }, [pagoMixto, montoTotal]);

  const crearPagoVacio = (): Pago => ({
    valor: '0',
    idTipoPago:
      tiposPago.find((t) => t.id === 2) ||
      (tiposPago.length > 1 ? tiposPago[1] : { id: 2, detalleTipoPago: 'CONTADO' }),
    idMedioPago: { id: 0, detalleMedioPago: '' },
    rutaComprobante: null,
    aporte: '',
    opcionPago: ''
  });

  const formatearPesoColombianoInput = (valor: string): string => {
    const soloNumeros = valor.replace(/\D/g, '');
    if (!soloNumeros) return '';
    return parseInt(soloNumeros).toLocaleString('es-CO');
  };

  const obtenerValorNumerico = (valorFormateado: string): number => {
    const soloNumeros = valorFormateado.replace(/\D/g, '');
    return soloNumeros ? parseInt(soloNumeros) : 0;
  };

  const calcularTotalPagos = (): number => {
    return pagos.reduce((total, pago) => {
      return total + obtenerValorNumerico(pago.valor);
    }, 0);
  };

  const calcularSaldoRestante = (): number => {
    return montoTotal - calcularTotalPagos();
  };

  const handleValorChange = (index: number, valorFormateado: string) => {
    const valorNumerico = obtenerValorNumerico(valorFormateado);
    const otrosPagos = pagos.reduce((total, pago, i) => {
      if (i !== index) {
        return total + obtenerValorNumerico(pago.valor);
      }
      return total;
    }, 0);

    // No permitir que el valor exceda el saldo disponible
    const saldoDisponible = montoTotal - otrosPagos;
    const valorFinal = Math.min(valorNumerico, saldoDisponible);

    handlePagoChange(index, 'valor', valorFinal.toString());
  };

  const handleAddPago = () => {
    setPagos([...pagos, crearPagoVacio()]);
  };

  const handleRemovePago = (index: number) => {
    const nuevos = [...pagos];
    nuevos.splice(index, 1);
    setPagos(nuevos);
  };

  const handlePagoChange = <K extends keyof Pago>(index: number, key: K, value: Pago[K]) => {
    const nuevos = [...pagos];
    nuevos[index][key] = value;
    setPagos(nuevos);
  };

  const handleGuardar = async () => {
    // Validar que todos los pagos tengan tipo y medio de pago
    const pagosValidos = pagos.every(
      (p) => p.idTipoPago?.id && p.idMedioPago?.id && obtenerValorNumerico(p.valor) > 0
    );

    if (!pagosValidos) {
      enqueueSnackbar('Por favor complete todos los campos de pago', { variant: 'error' });
      return;
    }

    // Validar que la suma de pagos coincida con el total
    const totalPagos = calcularTotalPagos();
    if (totalPagos !== montoTotal) {
      enqueueSnackbar(
        `La suma de pagos (${totalPagos.toLocaleString('es-CO')}) debe ser igual al total (${montoTotal.toLocaleString('es-CO')})`,
        { variant: 'error' }
      );
      return;
    }

    const formData = new FormData();
    formData.append('idShoppingCart', idShoppingCart?.toString() || '');
    formData.append('idTercero', JSON.stringify(cliente?.id));
    formData.append('idCaja', idCajaTienda?.toString() || '');

    pagos.forEach((pago, index) => {
      formData.append(`pagos[${index}][idTipoPago]`, pago.idTipoPago.id.toString());
      formData.append(`pagos[${index}][idMedioPago]`, pago.idMedioPago.id.toString());
      formData.append(`pagos[${index}][valor]`, obtenerValorNumerico(pago.valor).toString());
      formData.append(`pagos[${index}][fecha]`, fecha);
      formData.append(`pagos[${index}][facturaElectronica]`, facturaElectronica ? 'true' : 'false');

      if (pago.aporte) {
        formData.append(`pagos[${index}][aporte]`, pago.aporte);
      }

      if (pago.opcionPago) {
        formData.append(`pagos[${index}][opcionPago]`, pago.opcionPago);
      }

      if (pago.rutaComprobante instanceof File) {
        formData.append(`pagos[${index}][rutaComprobante]`, pago.rutaComprobante);
      }
    });

    try {
      const response = await axios.post('store_venta_contado', formData, {
        responseType: 'blob'
      });

      // Crear URL del blob y descargar automáticamente
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Crear un elemento <a> temporal para descargar
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo-venta-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Liberar la URL después de un tiempo
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      enqueueSnackbar('Pago realizado con éxito', { variant: 'success' });
      onSuccess!();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Error al realizar el pago', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Pago</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="px-4 flex flex-col gap-3">
            <div>
              <label className="font-semibold">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full input"
              />
            </div>

            <div className="flex items-center gap-4 mt-2">
              <label className="relative inline-flex cursor-pointer items-center gap-2">
                <span className="text-sm">Pago Mixto</span>
                <input
                  type="checkbox"
                  checked={pagoMixto}
                  onChange={(e) => setPagoMixto(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer relative h-5 w-9 rounded-full border bg-gray-300 after:absolute after:left-[2px] after:top-[1px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>

              <label
                className={`relative inline-flex cursor-pointer items-center gap-2 ${!pagoMixto ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm">Factura Electrónica</span>
                <input
                  type="checkbox"
                  checked={facturaElectronica}
                  onChange={(e) => setFacturaElectronica(e.target.checked)}
                  disabled={!pagoMixto}
                  className="peer sr-only"
                />
                <div className="peer relative h-5 w-9 rounded-full border bg-gray-300 after:absolute after:left-[2px] after:top-[1px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            {pagos.map((pago, i) => (
              <div key={i} className="border  rounded-lg p-4 mt-2 relative">
                <div className="font-bold mb-2">Pago {i + 1}</div>

                <div className="mt-2">
                  <label className="text-sm font-medium ">Tipo de Pago</label>
                  <select
                    disabled
                    className="w-full px-3 mt-1 select py-2 bg-gray-100 rounded-md"
                    value={pago.idTipoPago?.id || ''}
                    onChange={(e) => {
                      const tipo = tiposPago.find((tp) => tp.id === Number(e.target.value));
                      if (tipo) handlePagoChange(i, 'idTipoPago', tipo);
                    }}
                  >
                    <option value="">Seleccione...</option>
                    {tiposPago.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.detalleTipoPago}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2">
                  <label className="text-sm font-medium">Medio de Pago</label>
                  <select
                    className="w-full px-3 mt-1 select py-2 bg-gray-100 rounded-md"
                    value={pago.idMedioPago?.id || ''}
                    onChange={(e) => {
                      const medio = mediosPago.find((mp) => mp.id === Number(e.target.value));
                      if (medio) handlePagoChange(i, 'idMedioPago', medio);
                    }}
                  >
                    <option value="">Seleccione...</option>
                    {mediosPago.map((mp) => (
                      <option key={mp.id} value={mp.id}>
                        {mp.detalleMedioPago}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2">
                  <label className="text-sm font-medium">Valor</label>
                  <input
                    type="text"
                    className="w-full px-3 mt-1 input py-2 bg-gray-100 rounded-md"
                    value={
                      pagoMixto
                        ? formatearPesoColombianoInput(pago.valor)
                        : montoTotal.toLocaleString('es-CO')
                    }
                    onChange={(e) => handleValorChange(i, e.target.value)}
                    readOnly={!pagoMixto}
                    placeholder="0"
                  />
                </div>

                {pagoMixto && pagos.length > 1 && (
                  <button
                    className="btn btn-sm btn-danger mt-3"
                    onClick={() => handleRemovePago(i)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}

            {pagoMixto && (
              <>
                <div className="mt-4 p-3 border rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Total asignado:</span>
                    <span className="font-bold text-blue-600">
                      {calcularTotalPagos().toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="font-medium text-gray-700">Saldo restante:</span>
                    <span
                      className={`font-bold ${calcularSaldoRestante() === 0 ? 'text-green-400' : 'text-orange-400'}`}
                    >
                      {calcularSaldoRestante().toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                <button className="btn btn-sm btn-primary mt-2" onClick={handleAddPago}>
                  Agregar otro pago
                </button>
              </>
            )}

            <div className="mt-4 p-2 bg-gray-100 border border-gray-300 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Valor Total:</span>
                <span className="text-lg font-bold text-gray-900">
                  {montoTotal.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button onClick={handleGuardar} className="btn btn-sm btn-primary">
              Aceptar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PagoModal;

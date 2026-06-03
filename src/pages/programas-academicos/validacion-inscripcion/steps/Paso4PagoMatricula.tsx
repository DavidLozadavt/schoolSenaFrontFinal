import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Spinner from '@/components/loaders/Spinner';
import {
  MedioPagoOption,
  normalizarListaMedios,
  normalizarListaTipos,
  TipoPagoOption
} from '../../pagos/academicoPagoCatalogo';
import { FacturaSolicitudMock } from '../mockFacturaSolicitud';
import { formatearPeso } from '../validacionSolicitudTypes';
import { MedioTipoPagoSeleccion } from '../validacionSolicitudTypes';
import {
  mapFacturaApiToMock,
  registrarPagoFacturaAcademica
} from '../validacionInscripcionApi';

interface Props {
  factura: FacturaSolicitudMock | null;
  requiereRegistroPago: boolean;
  pagoRegistrado: boolean;
  medioSeleccionado: MedioTipoPagoSeleccion | null;
  tipoSeleccionado: MedioTipoPagoSeleccion | null;
  onMedioChange: (medio: MedioTipoPagoSeleccion | null) => void;
  onTipoChange: (tipo: MedioTipoPagoSeleccion | null) => void;
  onPagoRegistradoChange: (value: boolean) => void;
  onFacturaActualizada?: (factura: FacturaSolicitudMock) => void;
}

const Paso4PagoMatricula = ({
  factura,
  requiereRegistroPago,
  pagoRegistrado,
  medioSeleccionado,
  tipoSeleccionado,
  onMedioChange,
  onTipoChange,
  onPagoRegistradoChange,
  onFacturaActualizada
}: Props) => {
  const [mediosPago, setMediosPago] = useState<MedioPagoOption[]>([]);
  const [tiposPago, setTiposPago] = useState<TipoPagoOption[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [registrandoPago, setRegistrandoPago] = useState(false);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const cargarCatalogos = useCallback(async () => {
    setLoadingCatalogos(true);
    setError('');
    try {
      const [resMedios, resTipos] = await Promise.all([
        axios.get('medio_pagos'),
        axios.get('tipo_pagos')
      ]);
      const medios = normalizarListaMedios(resMedios.data);
      const tipos = normalizarListaTipos(resTipos.data);
      setMediosPago(medios);
      setTiposPago(tipos);
      if (tipos.length > 0 && !tipoSeleccionado) {
        const contado = tipos.find((t) => t.nombre.toLowerCase().includes('contado'));
        onTipoChange({ id: (contado ?? tipos[0]).id, nombre: (contado ?? tipos[0]).nombre });
      }
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar medios y tipos de pago.');
    } finally {
      setLoadingCatalogos(false);
    }
  }, [onTipoChange, tipoSeleccionado]);

  useEffect(() => {
    if (requiereRegistroPago) {
      cargarCatalogos();
    }
  }, [requiereRegistroPago, cargarCatalogos]);

  const totalFactura = factura?.total ?? 0;

  const puedeRegistrar = useMemo(
    () =>
      requiereRegistroPago &&
      medioSeleccionado !== null &&
      !pagoRegistrado &&
      !registrandoPago,
    [requiereRegistroPago, medioSeleccionado, pagoRegistrado, registrandoPago]
  );

  const handleRegistrarPago = async () => {
    if (!factura || !medioSeleccionado) return;

    setRegistrandoPago(true);
    setError('');
    setMensajeExito('');

    try {
      const respuesta = await registrarPagoFacturaAcademica(factura.idFactura, {
        idMedioPago: medioSeleccionado.id,
        idTipoPago: tipoSeleccionado?.id,
        valorAbono: factura.saldoPendiente > 0 ? factura.saldoPendiente : factura.total
      });

      const facturaActualizada = mapFacturaApiToMock(respuesta.factura, factura.idSolicitud);
      onFacturaActualizada?.(facturaActualizada);
      onPagoRegistradoChange(true);
      setMensajeExito(
        `Pago registrado correctamente. Transacción #${respuesta.idTransaccion} — ${formatearPeso(facturaActualizada.total)} con ${medioSeleccionado.nombre}.`
      );
    } catch (err: unknown) {
      console.error(err);
      const detalle =
        axios.isAxiosError(err) && err.response?.data
          ? (err.response.data as { error?: string; detalle?: string }).error ??
            (err.response.data as { detalle?: string }).detalle
          : null;
      setError(detalle ?? 'No se pudo registrar el pago. Verifique que la factura exista en el sistema.');
    } finally {
      setRegistrandoPago(false);
    }
  };

  if (!requiereRegistroPago) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">
          Pago de matrícula
        </h3>
        <div className="p-5 border border-emerald-200 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10">
          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
            No hay pago pendiente para registrar.
          </p>
          <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-300">
            La solicitud no requiere cobro o la factura ya está pagada. Continúe a validación final.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">Pago de matrícula</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Registre el pago del administrador según la factura asociada a la solicitud.
      </p>

      {factura && (
        <div className="p-4 border border-primary/30 rounded-xl bg-primary/5 dark:bg-primary/10">
          <p className="text-[10px] font-bold uppercase text-gray-500">Factura {factura.numeroFactura}</p>
          <p className="text-2xl font-black text-primary">{formatearPeso(totalFactura)}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Saldo pendiente: {formatearPeso(factura.saldoPendiente)}
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50 dark:bg-red-500/10 dark:text-red-300">
          {error}
          <button type="button" onClick={cargarCatalogos} className="block mt-2 text-xs font-bold underline">
            Reintentar
          </button>
        </div>
      )}

      {loadingCatalogos ? (
        <div className="flex flex-col items-center py-10">
          <Spinner />
          <p className="mt-2 text-sm text-gray-500">Cargando medios y tipos de pago…</p>
        </div>
      ) : (
        <>
          <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
            <h4 className="mb-2 text-xs font-bold uppercase text-gray-500">Tipo de registro</h4>
            <div className="flex flex-wrap gap-2">
              {tiposPago.map((tipo) => (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => onTipoChange({ id: tipo.id, nombre: tipo.nombre })}
                  className={`px-3 py-2 text-xs font-bold uppercase rounded-lg border ${
                    tipoSeleccionado?.id === tipo.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 dark:border-white/20'
                  }`}
                >
                  {tipo.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
            <h4 className="mb-2 text-xs font-bold uppercase text-gray-500">Medio de pago</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {mediosPago.map((medio) => (
                <button
                  key={medio.id}
                  type="button"
                  onClick={() => onMedioChange({ id: medio.id, nombre: medio.nombre })}
                  className={`flex items-center gap-3 p-3 text-left border rounded-xl ${
                    medioSeleccionado?.id === medio.id
                      ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                      : 'border-gray-200 dark:border-white/10'
                  }`}
                >
                  <i className={`ki-outline ${medio.icono} text-lg`} />
                  <span className="text-sm font-bold">{medio.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {pagoRegistrado ? (
            <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                {mensajeExito || 'Pago registrado correctamente. Puede continuar a validación final.'}
              </p>
              {factura.idTransaccion != null && (
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  Transacción #{factura.idTransaccion}
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={!puedeRegistrar}
              onClick={handleRegistrarPago}
              className="w-full py-2 text-xs font-bold text-white uppercase rounded-lg bg-primary hover:bg-primary-active disabled:opacity-50"
            >
              {registrandoPago ? 'Registrando pago…' : 'Registrar pago'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Paso4PagoMatricula;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from '@/components/loaders/Spinner';
import {
  AcademicoPagoPayload,
  guardarPayloadAcademico,
  leerPayloadAcademico
} from './academicoPagoTypes';
import {
  MedioPagoOption,
  normalizarListaMedios,
  normalizarListaTipos,
  TipoPagoOption
} from './academicoPagoCatalogo';

const formatearPeso = (valor: number): string =>
  valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

type LocationState = {
  academicoPagoPayload?: AcademicoPagoPayload;
};

const CheckoutMetodosPagoAcademicoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [payload, setPayload] = useState<AcademicoPagoPayload | null>(null);
  const [mediosPago, setMediosPago] = useState<MedioPagoOption[]>([]);
  const [tiposPago, setTiposPago] = useState<TipoPagoOption[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState('');
  const [idMedioSeleccionado, setIdMedioSeleccionado] = useState<number | null>(null);
  const [idTipoSeleccionado, setIdTipoSeleccionado] = useState<number | null>(null);

  useEffect(() => {
    const fromState = state?.academicoPagoPayload;
    if (fromState?.origen === 'ACADEMICO') {
      setPayload(fromState);
      guardarPayloadAcademico(fromState);
      return;
    }

    const fromStorage = leerPayloadAcademico();
    setPayload(fromStorage);
  }, [state]);

  const cargarCatalogos = useCallback(async () => {
    setLoadingCatalogos(true);
    setErrorCatalogos('');
    setIdMedioSeleccionado(null);
    setIdTipoSeleccionado(null);

    try {
      const [resMedios, resTipos] = await Promise.all([
        axios.get('medio_pagos'),
        axios.get('tipo_pagos')
      ]);

      const medios = normalizarListaMedios(resMedios.data);
      const tipos = normalizarListaTipos(resTipos.data);

      setMediosPago(medios);
      setTiposPago(tipos);

      if (tipos.length > 0) {
        const contado = tipos.find((t) => t.nombre.toLowerCase().includes('contado'));
        setIdTipoSeleccionado(contado?.id ?? tipos[0].id);
      }

      if (medios.length === 0) {
        setErrorCatalogos('No hay medios de pago disponibles en el catálogo.');
      }
    } catch (err) {
      console.error('Error al cargar catálogos de pago:', err);
      setErrorCatalogos('No se pudieron cargar los medios o tipos de pago. Verifique su sesión e intente de nuevo.');
      setMediosPago([]);
      setTiposPago([]);
    } finally {
      setLoadingCatalogos(false);
    }
  }, []);

  useEffect(() => {
    if (payload) {
      cargarCatalogos();
    }
  }, [payload, cargarCatalogos]);

  const conceptos = useMemo(() => payload?.conceptosSeleccionados ?? [], [payload]);

  const medioSeleccionado = useMemo(
    () => mediosPago.find((m) => m.id === idMedioSeleccionado) ?? null,
    [mediosPago, idMedioSeleccionado]
  );

  const tipoSeleccionado = useMemo(
    () => tiposPago.find((t) => t.id === idTipoSeleccionado) ?? null,
    [tiposPago, idTipoSeleccionado]
  );

  const handleRegistrarMock = () => {
    if (!payload || idMedioSeleccionado === null) return;

    console.log('Payload académico:', payload);
    console.log('Medio de pago seleccionado:', medioSeleccionado);
    console.log('Tipo de pago seleccionado:', tipoSeleccionado);
    console.log('Total seleccionado:', payload.totalSeleccionado);

    alert(
      `Maqueta: el administrador registró un pago de ${formatearPeso(payload.totalSeleccionado)} para ${payload.estudiante?.nombre ?? 'el estudiante'}, con medio ${medioSeleccionado?.nombre ?? 'seleccionado'}. Aún no se guarda en el servidor.`
    );

    // TODO: POST registrar cobro académico cuando exista endpoint
  };

  if (!payload) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          No hay un registro de pago en curso. Abra la billetera académica desde un programa y
          seleccione conceptos pendientes.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-xs font-bold text-white uppercase rounded-lg bg-primary hover:bg-primary-active"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 mb-2 text-xs font-bold uppercase text-gray-500 hover:text-primary dark:text-gray-400"
          >
            <i className="ki-outline ki-left text-sm" />
            Volver
          </button>
          <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase dark:text-white">
            Registro de pago académico
          </h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Gestión académica — el administrador registra el pago del estudiante. El aprendiz no
            realiza el cobro desde esta pantalla.
          </p>
        </div>
        <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          Registro sin guardar (maqueta)
        </span>
      </div>

      <div className="flex gap-3 p-4 border border-blue-200 rounded-xl bg-blue-50/80 dark:bg-blue-500/10 dark:border-blue-500/30">
        <i className="flex-shrink-0 text-lg text-blue-600 ki-outline ki-information-2 dark:text-blue-400" />
        <p className="text-xs text-blue-900 dark:text-blue-200">
          <span className="font-bold">Vista administrativa.</span> Usted está registrando el pago de
          un estudiante. Tras guardar (cuando exista backend), el estudiante podrá consultar qué
          conceptos quedaron pagados y cuáles siguen pendientes.
        </p>
      </div>

      {/* Resumen */}
      <div className="p-5 border border-gray-200 shadow-sm rounded-2xl bg-white dark:bg-coal-500 dark:border-white/10">
        <h2 className="text-sm font-black uppercase text-gray-900 dark:text-white">
          Resumen de pago académico
        </h2>
        <div className="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-2">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500">Transacción</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white">#{payload.idTransaccion}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500">Programa ID</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{payload.programaId}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500">Estudiante</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {payload.estudiante?.nombre ?? `ID ${payload.estudianteId}`}
            </p>
            {payload.estudiante?.documento ? (
              <p className="text-xs text-gray-600 dark:text-gray-300">
                CC {payload.estudiante.documento}
              </p>
            ) : (
              <p className="text-xs text-gray-500">ID interno: {payload.estudianteId}</p>
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500">Matrícula</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {payload.idMatricula ?? 'Pendiente de asignar'}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500">Registrado por</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {payload.registradoPor ?? 'ADMIN'}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500">Contexto</span>
            <p className="text-sm font-bold text-primary">{payload.contexto ?? payload.origen}</p>
          </div>
        </div>

        <p className="mt-4 text-2xl font-black text-primary">
          Total a registrar: {formatearPeso(payload.totalSeleccionado)}
        </p>

        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-gray-500">Conceptos a registrar</span>
          <ul className="mt-2 space-y-2">
            {conceptos.map((item) => (
              <li
                key={item.idPago}
                className="flex items-start justify-between gap-2 text-sm text-gray-800 dark:text-gray-200"
              >
                <span>
                  <span className="font-bold">{item.concepto}</span>
                  <span className="block text-xs text-gray-500">{item.descripcion}</span>
                </span>
                <span className="font-semibold whitespace-nowrap">{formatearPeso(item.valor)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {errorCatalogos && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border border-red-200 rounded-xl bg-red-50 dark:bg-red-500/10 dark:border-red-500/30">
          <p className="text-sm text-red-800 dark:text-red-300">{errorCatalogos}</p>
          <button
            type="button"
            onClick={cargarCatalogos}
            className="px-3 py-1.5 text-xs font-bold text-white uppercase rounded-lg bg-red-600 hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {loadingCatalogos ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 border border-gray-200 rounded-2xl bg-white dark:bg-coal-500 dark:border-white/10">
          <Spinner />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cargando medios y tipos de pago…
          </p>
        </div>
      ) : (
        <>
          {/* Tipo de pago */}
          <div className="p-5 border border-gray-200 rounded-2xl bg-white dark:bg-coal-500 dark:border-white/10">
            <h2 className="mb-1 text-sm font-black uppercase text-gray-900 dark:text-white">
              Tipo de registro
            </h2>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Clasificación contable del pago que registrará el administrador.
            </p>
            {tiposPago.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay tipos de pago disponibles.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tiposPago.map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => setIdTipoSeleccionado(tipo.id)}
                    className={`px-3 py-2 text-xs font-bold uppercase rounded-lg border transition-colors ${
                      idTipoSeleccionado === tipo.id
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 text-gray-700 hover:border-primary dark:border-white/20 dark:text-gray-300'
                    }`}
                  >
                    {tipo.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Medios de pago */}
          <div className="p-5 border border-gray-200 rounded-2xl bg-white dark:bg-coal-500 dark:border-white/10">
            <h2 className="mb-1 text-sm font-black uppercase text-gray-900 dark:text-white">
              Medio de pago
            </h2>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Selecciona el medio por el cual se registrará este pago.
            </p>
            {mediosPago.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay medios de pago disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {mediosPago.map((medio) => {
                  const activo = idMedioSeleccionado === medio.id;
                  return (
                    <button
                      key={medio.id}
                      type="button"
                      onClick={() => setIdMedioSeleccionado(medio.id)}
                      className={`flex items-center gap-3 p-4 text-left border rounded-xl transition-all ${
                        activo
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30 dark:bg-primary/10'
                          : 'border-gray-200 hover:border-primary/50 dark:border-white/10 dark:hover:border-primary/40'
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                          activo
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-600 dark:bg-coal-400'
                        }`}
                      >
                        <i className={`text-lg ki-outline ${medio.icono}`} />
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {medio.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-xs font-bold uppercase border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-gray-200 dark:hover:bg-coal-500"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={
            loadingCatalogos ||
            idMedioSeleccionado === null ||
            mediosPago.length === 0 ||
            Boolean(errorCatalogos && mediosPago.length === 0)
          }
          onClick={handleRegistrarMock}
          className="px-4 py-2 text-xs font-bold text-white uppercase rounded-lg bg-primary hover:bg-primary-active disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Registrar pago (maqueta)
        </button>
      </div>
    </div>
  );
};

export default CheckoutMetodosPagoAcademicoPage;

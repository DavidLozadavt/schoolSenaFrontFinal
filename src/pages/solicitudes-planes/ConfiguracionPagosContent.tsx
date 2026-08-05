import { Fragment, useEffect, useState } from 'react';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import {
  ConfiguracionPagos,
  configuracionPagosService,
  DiagnosticoPagos,
  ETIQUETA_LLAVE,
  ResultadoVerificacion
} from '@/services/configuracionPagosService';

const Indicador = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-sm">
    <KeenIcon
      icon={ok ? 'check-circle' : 'cross-circle'}
      className={ok ? 'text-success' : 'text-danger'}
    />
    <span className="text-gray-700">{children}</span>
  </div>
);

const Dato = ({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-1 text-sm">
    <span className="text-gray-500">{etiqueta}</span>
    <span className="text-end font-medium text-gray-900">{valor}</span>
  </div>
);

/**
 * Módulo "Configuración de Pagos" del sistema de planes de mensajes.
 *
 * Independiente del módulo `configuracion-pagos` ya existente (otro dominio),
 * que no se toca. Las llaves nunca se muestran: solo se informa si están
 * presentes y se pueden reemplazar. Un campo vacío conserva la llave guardada.
 */
const ConfiguracionPagosWompiContent = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [configuracion, setConfiguracion] = useState<ConfiguracionPagos | null>(null);
  const [diagnostico, setDiagnostico] = useState<DiagnosticoPagos | null>(null);
  const [verificacion, setVerificacion] = useState<ResultadoVerificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [verificando, setVerificando] = useState(false);

  // Llaves del formulario: siempre vacías al cargar.
  const [llaves, setLlaves] = useState({
    publicKey: '',
    privateKey: '',
    integritySecret: '',
    eventsSecret: ''
  });

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await configuracionPagosService.obtener();
      setConfiguracion(data.configuracion);
      setDiagnostico(data.diagnostico);
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al cargar la configuración.', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuardar = async () => {
    if (!configuracion) return;

    setGuardando(true);
    try {
      const respuesta = await configuracionPagosService.actualizar({
        modo: configuracion.modo,
        proveedor: configuracion.proveedor,
        moneda: configuracion.moneda,
        ivaPorcentaje: configuracion.ivaPorcentaje,
        mensajesGratuitos: configuracion.mensajesGratuitos,
        activo: configuracion.activo,
        horasMaxAprobacion: configuracion.horasMaxAprobacion,
        urlRetorno: configuracion.urlRetorno,
        urlWebhook: configuracion.urlWebhook,
        usarLlavesPropias: configuracion.usarLlavesPropias,
        // Solo se envían las llaves que el administrador escribió.
        ...Object.fromEntries(Object.entries(llaves).filter(([, valor]) => valor.trim() !== ''))
      });

      enqueueSnackbar(respuesta.message, { variant: 'success' });
      setConfiguracion(respuesta.configuracion);
      setDiagnostico(respuesta.diagnostico);
      setLlaves({ publicKey: '', privateKey: '', integritySecret: '', eventsSecret: '' });
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al guardar la configuración.', {
        variant: 'error'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleVerificar = async () => {
    setVerificando(true);
    try {
      const resultado = await configuracionPagosService.verificar();
      setVerificacion(resultado);
      setDiagnostico(resultado.diagnostico);

      enqueueSnackbar(
        resultado.valida
          ? 'La configuración es válida y Wompi responde correctamente.'
          : 'La configuración tiene problemas. Revise el detalle.',
        { variant: resultado.valida ? 'success' : 'warning' }
      );
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al verificar la configuración.', {
        variant: 'error'
      });
    } finally {
      setVerificando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
        <span className="spinner-border spinner-border-sm" />
        Cargando configuración...
      </div>
    );
  }

  if (!configuracion || !diagnostico) {
    return (
      <p className="py-16 text-center text-sm text-gray-400">No se pudo cargar la configuración.</p>
    );
  }

  return (
    <Fragment>
      {/* Diagnóstico */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title flex items-center gap-2">
            <KeenIcon icon="shield-tick" className="text-primary" />
            Diagnóstico del sistema de pagos
          </h4>
          <button
            className="btn btn-sm btn-primary flex items-center gap-1.5"
            onClick={handleVerificar}
            disabled={verificando}
          >
            {verificando ? (
              <>
                <span className="spinner-border spinner-border-sm" />
                Verificando...
              </>
            ) : (
              <>
                <KeenIcon icon="check-circle" />
                Verificar Configuración
              </>
            )}
          </button>
        </div>

        <div className="card-body grid md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <Dato
              etiqueta="Modo actual"
              valor={
                <span
                  className={`badge badge-sm ${
                    diagnostico.modo === 'PRODUCCION' ? 'badge-danger' : 'badge-warning'
                  }`}
                >
                  {diagnostico.modo}
                </span>
              }
            />
            <Dato etiqueta="Proveedor" valor={diagnostico.proveedor} />
            <Dato etiqueta="Moneda" valor={diagnostico.moneda} />
            <Dato etiqueta="IVA" valor={`${diagnostico.ivaPorcentaje}%`} />
            <Dato etiqueta="Mensajes gratuitos" valor={diagnostico.mensajesGratuitos} />
            <Dato
              etiqueta="Sistema de pagos"
              valor={
                <span
                  className={`badge badge-sm ${
                    diagnostico.sistemaActivo ? 'badge-success' : 'badge-light'
                  }`}
                >
                  {diagnostico.sistemaActivo ? 'Activo' : 'Inactivo'}
                </span>
              }
            />
            <Dato
              etiqueta="Origen de las llaves"
              valor={
                diagnostico.origenLlaves === 'ARCHIVO_ENV'
                  ? 'Archivo .env'
                  : 'Base de datos (cifradas)'
              }
            />
            <Dato etiqueta="API base" valor={diagnostico.baseApi} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase text-gray-700">Variables obligatorias</span>
            {Object.entries(diagnostico.variables).map(([llave, presente]) => (
              <Indicador key={llave} ok={presente}>
                {ETIQUETA_LLAVE[llave] ?? llave}: {presente ? 'configurada' : 'no configurada'}
              </Indicador>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-2">
              <Indicador ok={diagnostico.configuracionCompleta}>
                Configuración {diagnostico.configuracionCompleta ? 'completa' : 'incompleta'}
              </Indicador>
              <Indicador ok={diagnostico.webhookConfigurado}>
                Webhook {diagnostico.webhookConfigurado ? 'configurado' : 'sin Events Secret'}
              </Indicador>
              <Indicador ok={diagnostico.modoCoherente}>
                Modo{' '}
                {diagnostico.modoCoherente
                  ? 'coherente con la llave'
                  : 'incoherente con la llave'}
              </Indicador>
            </div>

            <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-2 text-2xs text-gray-600">
              <div className="break-all">
                <strong>URL de retorno:</strong> {diagnostico.urlRetorno || 'No configurada'}
              </div>
              <div className="break-all mt-1">
                <strong>URL del webhook:</strong> {diagnostico.urlWebhook || 'No configurada'}
              </div>
            </div>
          </div>
        </div>

        {verificacion && (
          <div className="card-footer flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className={`badge ${verificacion.valida ? 'badge-success' : 'badge-danger'}`}>
                {verificacion.valida ? 'Configuración válida' : 'Configuración con problemas'}
              </span>
              <span className="text-sm text-gray-600">{verificacion.conexion.mensaje}</span>
            </div>

            {verificacion.conexion.comercio && (
              <span className="text-2xs text-gray-500">
                Comercio: {verificacion.conexion.comercio}
              </span>
            )}

            {verificacion.problemas.length > 0 && (
              <ul className="list-disc ps-5 text-sm text-danger">
                {verificacion.problemas.map((problema, indice) => (
                  <li key={indice}>{problema}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Configuración general */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title flex items-center gap-2">
            <KeenIcon icon="setting-2" className="text-primary" />
            Configuración general
          </h4>
        </div>
        <div className="card-body grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="form-label text-xs">Modo del sistema</label>
            <select
              className="select select-sm"
              value={configuracion.modo}
              onChange={(e) =>
                setConfiguracion({
                  ...configuracion,
                  modo: e.target.value as 'SANDBOX' | 'PRODUCCION'
                })
              }
            >
              <option value="SANDBOX">Sandbox</option>
              <option value="PRODUCCION">Producción</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label text-xs">Proveedor de pagos</label>
            <select
              className="select select-sm"
              value={configuracion.proveedor}
              onChange={(e) => setConfiguracion({ ...configuracion, proveedor: e.target.value })}
            >
              <option value="WOMPI">Wompi</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label text-xs">Moneda</label>
            <input
              type="text"
              className="input input-sm"
              maxLength={10}
              value={configuracion.moneda}
              onChange={(e) =>
                setConfiguracion({ ...configuracion, moneda: e.target.value.toUpperCase() })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label text-xs">Porcentaje de IVA</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              className="input input-sm"
              value={Number(configuracion.ivaPorcentaje)}
              onChange={(e) =>
                setConfiguracion({ ...configuracion, ivaPorcentaje: Number(e.target.value) })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label text-xs">Mensajes gratuitos (usuarios nuevos)</label>
            <input
              type="number"
              min={0}
              className="input input-sm"
              value={configuracion.mensajesGratuitos}
              onChange={(e) =>
                setConfiguracion({ ...configuracion, mensajesGratuitos: Number(e.target.value) })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label text-xs">Estado del sistema de pagos</label>
            <select
              className="select select-sm"
              value={configuracion.activo ? '1' : '0'}
              onChange={(e) =>
                setConfiguracion({ ...configuracion, activo: e.target.value === '1' })
              }
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label text-xs">Horas máximas para aprobar solicitudes</label>
            <input
              type="number"
              min={1}
              className="input input-sm"
              value={configuracion.horasMaxAprobacion}
              onChange={(e) =>
                setConfiguracion({ ...configuracion, horasMaxAprobacion: Number(e.target.value) })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="form-label text-xs">URL de retorno</label>
            <input
              type="text"
              className="input input-sm"
              placeholder="https://tu-dominio/pago-plan/resultado"
              value={configuracion.urlRetorno ?? ''}
              onChange={(e) => setConfiguracion({ ...configuracion, urlRetorno: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <label className="form-label text-xs">URL del webhook</label>
            <input
              type="text"
              className="input input-sm"
              placeholder="https://tu-dominio/api/webhooks/wompi"
              value={configuracion.urlWebhook ?? ''}
              onChange={(e) => setConfiguracion({ ...configuracion, urlWebhook: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Llaves */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="card-title flex items-center gap-2">
            <KeenIcon icon="key" className="text-primary" />
            Llaves de Wompi
          </h4>
        </div>
        <div className="card-body flex flex-col gap-3">
          <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-gray-700">
            Las llaves se almacenan <strong>cifradas</strong> con la APP_KEY de Laravel y nunca se
            devuelven al navegador. Deje un campo vacío para conservar la llave ya guardada.
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={configuracion.usarLlavesPropias}
              onChange={(e) =>
                setConfiguracion({ ...configuracion, usarLlavesPropias: e.target.checked })
              }
            />
            Usar las llaves administradas desde el sistema (si se desmarca, se siguen leyendo del
            archivo .env)
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            {(Object.keys(llaves) as (keyof typeof llaves)[]).map((llave) => (
              <div key={llave} className="flex flex-col gap-1.5">
                <label className="form-label text-xs flex items-center gap-2">
                  {ETIQUETA_LLAVE[llave]}
                  <span
                    className={`badge badge-sm ${
                      diagnostico.variables[llave] ? 'badge-success' : 'badge-light'
                    }`}
                  >
                    {diagnostico.variables[llave] ? 'Configurada' : 'Sin configurar'}
                  </span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="input input-sm"
                  placeholder="Dejar vacío para no cambiarla"
                  value={llaves[llave]}
                  onChange={(e) => setLlaves({ ...llaves, [llave]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn btn-sm btn-light" onClick={cargar} disabled={guardando}>
          <KeenIcon icon="arrows-circle" />
          Descartar cambios
        </button>
        <button className="btn btn-sm btn-primary" onClick={handleGuardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </Fragment>
  );
};

export { ConfiguracionPagosWompiContent };

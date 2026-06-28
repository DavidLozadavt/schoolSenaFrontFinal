import { Fragment, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { MENSAJE_LICENCIA_ICFES_INACTIVA } from '@/utils/icfesLicenciaLogout';

interface EstadisticasResumen {
  promedio_actual: number;
  mejora_mes: number;
  estudiantes_participando: number;
  sesiones_mes?: number;
  periodo_promedio?: 'mes' | '30_dias' | 'historico' | 'sin_datos';
  tiene_datos?: boolean;
}

interface Configuracion {
  institucion?: {
    id_empresa: number;
    nombre: string;
    nit?: string;
    email?: string;
  };
  servicio_eduexce_activo: boolean;
  licencia_activa: boolean;
  licencia_rechazada?: boolean;
  fecha_vigencia_fin: string | null;
  id_institucion_eduexce: number | null;
  ultimo_error?: string | null;
  conteos?: {
    estudiantes_eduexce: number;
  };
  estadisticas?: EstadisticasResumen | null;
}

interface Estadisticas {
  nombre_institucion?: string;
  total_estudiantes?: number;
  estadisticas?: EstadisticasResumen;
}

const FEATURES = [
  'Listado de estudiantes y progreso',
  'Simulacros y práctica por áreas ICFES',
  'Seguimiento y alertas de rendimiento',
  'Notificaciones a estudiantes',
  'Reportes por materia',
  'App móvil para práctica ICFES'
];

function mensajeAmigable(err?: string | null): string {
  if (!err) return 'Ocurrió un error. Intente de nuevo.';
  if (err.length > 140) return 'Error al conectar con EduExce. Intente de nuevo.';
  return err;
}

function formatearFecha(fecha: string | null | undefined): string | null {
  if (!fecha) return null;
  const iso = String(fecha).slice(0, 10);
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

const EduExcePanelPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abriendoPanel, setAbriendoPanel] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const configRes = await axios.get<Configuracion>('eduexce/configuracion');
      setConfig(configRes.data);

      if (configRes.data.servicio_eduexce_activo) {
        if (configRes.data.estadisticas) {
          setStats({
            estadisticas: configRes.data.estadisticas,
            total_estudiantes: configRes.data.conteos?.estudiantes_eduexce
          });
        } else {
          try {
            const statsRes = await axios.get<Estadisticas>('eduexce/estadisticas');
            setStats(statsRes.data);
          } catch {
            setStats(null);
          }
        }
      } else {
        setStats(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo cargar la configuración ICFES');
    } finally {
      setLoading(false);
    }
  }, []);

  const abrirPanelIcfes = async () => {
    if (!config?.servicio_eduexce_activo) {
      enqueueSnackbar(
        config?.licencia_rechazada ? MENSAJE_LICENCIA_ICFES_INACTIVA : 'Active la licencia ICFES antes de abrir el panel.',
        { variant: 'warning' }
      );
      return;
    }

    // Abrir pestaña en el clic (antes del await) para no perder el gesto del usuario.
    const popup = window.open('about:blank', '_blank');
    if (!popup) {
      enqueueSnackbar(
        'Permita ventanas emergentes para abrir EduExce. School permanecerá en esta pestaña.',
        { variant: 'warning' }
      );
      return;
    }

    popup.opener = null;
    setAbriendoPanel(true);
    try {
      const { data } = await axios.get<{ url?: string; error?: string }>('eduexce/panel-sso', {
        timeout: 30000
      });
      if (data.url) {
        popup.location.replace(data.url);
      } else {
        popup.close();
        enqueueSnackbar(data.error || 'No se pudo abrir el panel ICFES', { variant: 'error' });
      }
    } catch (err: any) {
      popup.close();
      enqueueSnackbar(
        mensajeAmigable(err?.response?.data?.error || err?.message || 'Error al abrir panel ICFES'),
        { variant: 'error' }
      );
    } finally {
      setAbriendoPanel(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [cargar]);

  const servicioActivo = config?.servicio_eduexce_activo ?? false;
  const licenciaRechazada = config?.licencia_rechazada === true;
  const resumenStats = stats?.estadisticas ?? config?.estadisticas ?? null;
  const estudiantes =
    config?.conteos?.estudiantes_eduexce ??
    config?.conteos?.total_estudiantes ??
    stats?.total_estudiantes ??
    0;
  const promedioIcfes = resumenStats?.promedio_actual ?? 0;
  const tieneDatosPromedio = resumenStats?.tiene_datos ?? (resumenStats?.sesiones_mes ?? 0) > 0;
  const periodoPromedio = resumenStats?.periodo_promedio ?? 'mes';
  const mejoraMes = resumenStats?.mejora_mes ?? 0;
  const vigencia = formatearFecha(config?.fecha_vigencia_fin);

  const etiquetaPromedio =
    periodoPromedio === '30_dias'
      ? 'Promedio ICFES (30 días)'
      : periodoPromedio === 'historico'
        ? 'Promedio ICFES (histórico)'
        : 'Promedio ICFES (mes)';

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="ICFES / EduExce" />
            <ToolbarDescription>
              Operación ICFES de su institución. La licencia la otorga Virtual Technology.
            </ToolbarDescription>
          </ToolbarHeading>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={abriendoPanel || !servicioActivo || loading}
              onClick={abrirPanelIcfes}
            >
              <KeenIcon icon="exit-right" className="me-1" />
              {abriendoPanel ? 'Abriendo panel...' : 'Abrir panel ICFES'}
            </button>
          </div>
        </Toolbar>

        {loading && <div className="card p-8 text-center text-gray-500">Cargando...</div>}

        {error && !loading && (
          <div className="card p-6 border border-danger-clarity bg-danger-light mb-5">
            <p className="text-danger font-medium">{error}</p>
            <button type="button" className="btn btn-sm btn-danger mt-3" onClick={cargar}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && config && (
          <>
            {licenciaRechazada && (
              <div className="card p-5 mb-5 border border-danger-clarity bg-danger-light">
                <p className="text-danger font-medium text-center">{MENSAJE_LICENCIA_ICFES_INACTIVA}</p>
              </div>
            )}

            <div className="card mb-5 p-5 border-2 border-primary-clarity">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h4 className="font-bold text-lg text-gray-900 mb-1">
                    {config.institucion?.nombre || 'Institución'}
                  </h4>
                  <p className="text-sm text-gray-600 max-w-2xl">
                    {servicioActivo
                      ? 'La licencia ICFES la activa Virtual Technology. Consulte el progreso y la operación en el panel ICFES cuando la licencia esté activa.'
                      : licenciaRechazada
                        ? MENSAJE_LICENCIA_ICFES_INACTIVA
                        : 'Sin licencia activa. Solicite la activación a Virtual Technology para acceder al panel ICFES.'}
                  </p>
                  {vigencia && servicioActivo && (
                    <p className="text-xs text-gray-500 mt-2">Licencia vigente hasta: {vigencia}</p>
                  )}
                  {config.ultimo_error && (
                    <p className="text-xs text-danger mt-2">
                      Último error: {mensajeAmigable(config.ultimo_error)}
                    </p>
                  )}
                </div>

                <span
                  className={`badge shrink-0 ${servicioActivo ? 'badge-success' : 'badge-danger'} badge-lg`}
                >
                  {servicioActivo
                    ? 'Licencia ACTIVA'
                    : licenciaRechazada
                      ? 'Licencia INACTIVA'
                      : 'Sin licencia — contacte VT'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Servicio institucional</p>
                <p className={servicioActivo ? 'text-success font-bold text-lg' : 'text-danger font-bold text-lg'}>
                  {servicioActivo ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Estudiantes en la institución</p>
                <p className="text-2xl font-bold text-gray-900">{estudiantes}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{etiquetaPromedio}</p>
                {servicioActivo ? (
                  tieneDatosPromedio ? (
                    <>
                      <p className="text-2xl font-bold text-primary">{promedioIcfes}%</p>
                      {mejoraMes !== 0 && periodoPromedio === 'mes' && (
                        <p className={`text-xs mt-1 ${mejoraMes > 0 ? 'text-success' : 'text-danger'}`}>
                          {mejoraMes > 0 ? '+' : ''}
                          {mejoraMes}% vs mes anterior
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-gray-400">Sin práctica registrada</p>
                  )
                ) : (
                  <p className="text-sm font-medium text-gray-400">Pendiente</p>
                )}
              </div>
            </div>

            <div className="card mb-5 p-5">
              <h4 className="font-semibold mb-2">Lo que incluye EduExce (panel web)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {FEATURES.map((item) => (
                  <div key={item} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <KeenIcon icon="check-circle" className="text-success text-base shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Container>
    </Fragment>
  );
};

export { EduExcePanelPage };

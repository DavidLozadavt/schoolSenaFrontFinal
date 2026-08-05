import { Fragment, useEffect, useState } from 'react';
import ApexChart from 'react-apexcharts';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { dashboardPlanesService, ResumenDashboard } from '@/services/dashboardPlanesService';
import {
  ETIQUETA_ESTADO_WOMPI,
  ETIQUETA_METODO_WOMPI,
  EstadoWompi
} from '@/services/wompiPagosService';

const formatearPrecio = (valor: string | number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(valor ?? 0));

const Tarjeta = ({
  titulo,
  valor,
  icono,
  color
}: {
  titulo: string;
  valor: string | number;
  icono: string;
  color: string;
}) => (
  <div className="card">
    <div className="card-body flex items-center gap-3 py-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${color}/10`}>
        <KeenIcon icon={icono} className={`text-${color} text-lg`} />
      </span>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">{titulo}</span>
        <span className="text-lg font-semibold text-gray-900">{valor}</span>
      </div>
    </div>
  </div>
);

/**
 * Dashboard del Administrador VT (Mejora 7). Solo lectura.
 */
const DashboardPlanesContent = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [datos, setDatos] = useState<ResumenDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const fetchDatos = async () => {
    setLoading(true);
    try {
      setDatos(
        await dashboardPlanesService.getResumen({
          desde: desde || undefined,
          hasta: hasta || undefined
        })
      );
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al cargar el dashboard.', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !datos) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
        <span className="spinner-border spinner-border-sm" />
        Cargando dashboard...
      </div>
    );
  }

  if (!datos) {
    return <p className="py-16 text-center text-sm text-gray-400">No hay datos disponibles.</p>;
  }

  const { tarjetas, porMes, porMetodoPago, porEstadoPago, topPlanes, topUsuarios } = datos;

  return (
    <Fragment>
      {/* Filtro de rango */}
      <div className="flex flex-wrap items-end gap-2 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-2xs text-gray-500">Desde</label>
          <input
            type="date"
            className="input input-sm"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-2xs text-gray-500">Hasta</label>
          <input
            type="date"
            className="input input-sm"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
        <button className="btn btn-sm btn-primary" onClick={fetchDatos} disabled={loading}>
          <KeenIcon icon="magnifier" />
          Aplicar
        </button>
        <span className="text-2xs text-gray-500 ms-auto">
          Rango: {datos.rango.desde} → {datos.rango.hasta}
        </span>
      </div>

      {/* Tarjetas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Tarjeta titulo="Planes activos" valor={tarjetas.planesActivos} icono="package" color="primary" />
        <Tarjeta titulo="Planes vendidos" valor={tarjetas.planesVendidos} icono="handcart" color="success" />
        <Tarjeta titulo="Ingresos registrados" valor={formatearPrecio(tarjetas.ingresos)} icono="dollar" color="success" />
        <Tarjeta titulo="Solicitudes pendientes" valor={tarjetas.solicitudesPendientes} icono="time" color="warning" />
        <Tarjeta titulo="Pagos aprobados" valor={tarjetas.pagosAprobados} icono="check-circle" color="success" />
        <Tarjeta titulo="Pagos rechazados" valor={tarjetas.pagosRechazados} icono="cross-circle" color="danger" />
        <Tarjeta titulo="Mensajes vendidos" valor={tarjetas.mensajesVendidos.toLocaleString('es-CO')} icono="sms" color="info" />
        <Tarjeta titulo="Mensajes consumidos" valor={tarjetas.mensajesConsumidos.toLocaleString('es-CO')} icono="send" color="dark" />
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-3 mb-4">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Ventas e ingresos por mes</h4>
          </div>
          <div className="card-body">
            {porMes.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Sin ventas en el rango.</p>
            ) : (
              <ApexChart
                type="bar"
                height={280}
                series={[
                  { name: 'Ventas', data: porMes.map((m) => m.ventas) },
                  { name: 'Ingresos', data: porMes.map((m) => Number(m.ingresos)) }
                ]}
                options={{
                  chart: { toolbar: { show: false } },
                  xaxis: { categories: porMes.map((m) => m.mes) },
                  yaxis: [
                    { title: { text: 'Ventas' } },
                    { opposite: true, title: { text: 'Ingresos' } }
                  ],
                  dataLabels: { enabled: false },
                  legend: { position: 'top' }
                }}
              />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Transacciones por método de pago</h4>
          </div>
          <div className="card-body">
            {porMetodoPago.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Sin transacciones.</p>
            ) : (
              <ApexChart
                type="donut"
                height={280}
                series={porMetodoPago.map((m) => m.transacciones)}
                options={{
                  labels: porMetodoPago.map(
                    (m) => ETIQUETA_METODO_WOMPI[m.metodo] ?? m.metodo
                  ),
                  legend: { position: 'bottom' }
                }}
              />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Transacciones por estado</h4>
          </div>
          <div className="card-body">
            {porEstadoPago.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Sin transacciones.</p>
            ) : (
              <ApexChart
                type="pie"
                height={280}
                series={porEstadoPago.map((e) => e.transacciones)}
                options={{
                  labels: porEstadoPago.map(
                    (e) => ETIQUETA_ESTADO_WOMPI[e.status as EstadoWompi] ?? e.status
                  ),
                  legend: { position: 'bottom' }
                }}
              />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Top 10 planes más vendidos</h4>
          </div>
          <div className="card-body">
            {topPlanes.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Sin ventas en el rango.</p>
            ) : (
              <ApexChart
                type="bar"
                height={280}
                series={[{ name: 'Ventas', data: topPlanes.map((p) => p.ventas) }]}
                options={{
                  chart: { toolbar: { show: false } },
                  plotOptions: { bar: { horizontal: true } },
                  xaxis: { categories: topPlanes.map((p) => p.planNombre) },
                  dataLabels: { enabled: false }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Usuarios con mayor consumo */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Usuarios con mayor consumo de mensajes</h4>
        </div>
        <div className="card-body p-0 overflow-x-auto">
          {topUsuarios.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Todavía no hay consumo registrado.</p>
          ) : (
            <table className="table table-sm align-middle text-sm">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Mensajes consumidos</th>
                  <th>Disponibles</th>
                </tr>
              </thead>
              <tbody>
                {topUsuarios.map((usuario) => (
                  <tr key={usuario.userId}>
                    <td className="font-semibold text-gray-900">{usuario.nombre || '—'}</td>
                    <td className="text-xs text-gray-500">{usuario.email ?? '—'}</td>
                    <td>{usuario.mensajesConsumidos.toLocaleString('es-CO')}</td>
                    <td>{usuario.mensajesDisponibles.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export { DashboardPlanesContent };

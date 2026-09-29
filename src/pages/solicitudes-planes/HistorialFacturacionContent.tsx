import { Fragment, useEffect, useState } from 'react';
import clsx from 'clsx';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import {
  BADGE_ESTADO_PAGO,
  BADGE_ESTADO_SOLICITUD,
  ETIQUETA_ESTADO_SOLICITUD,
  FiltrosHistorial,
  historialFacturacionService,
  KpisFacturacion,
  OpcionesFiltros,
  RegistroFacturacion
} from '@/services/historialFacturacionService';
import { ETIQUETA_METODO_WOMPI } from '@/services/wompiPagosService';

/** Formatea un número tolerando null/undefined (datos incompletos del backend). */
const formatearNumero = (valor?: number | string | null) =>
  Number(valor ?? 0).toLocaleString('es-CO');

const formatearPrecio = (valor: string | number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(valor ?? 0));

const formatearFecha = (valor?: string | null) =>
  valor ? new Date(valor).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const Kpi = ({
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

const FILTROS_INICIALES: FiltrosHistorial = {
  desde: '',
  hasta: '',
  usuario: '',
  empresaId: '',
  planId: '',
  estadoPago: '',
  estadoSolicitud: '',
  metodoPago: '',
  buscar: ''
};

/**
 * Historial de Facturación. Solo lectura sobre compras ya registradas.
 * Mismo estilo visual del módulo de Estadísticas WhatsApp.
 */
const HistorialFacturacionContent = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [registros, setRegistros] = useState<RegistroFacturacion[]>([]);
  const [kpis, setKpis] = useState<KpisFacturacion | null>(null);
  const [opciones, setOpciones] = useState<OpcionesFiltros | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState<'excel' | 'pdf' | null>(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(true);

  const [filtros, setFiltros] = useState<FiltrosHistorial>(FILTROS_INICIALES);
  const [orden, setOrden] = useState('fechaPago');
  const [sentido, setSentido] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const parametros = (pagina = page): FiltrosHistorial => ({
    ...filtros,
    orden,
    sentido,
    page: pagina,
    per_page: 20
  });

  const fetchDatos = async (pagina = page) => {
    setLoading(true);
    try {
      const data = await historialFacturacionService.listar(parametros(pagina));
      setRegistros(data.registros?.data ?? []);
      setKpis(data.kpis ?? null);
      setTotalPages(data.registros?.last_page ?? 1);
      setTotal(data.registros?.total ?? 0);
      setPage(data.registros?.current_page ?? 1);
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al cargar el historial.', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOpciones = async () => {
    try {
      setOpciones(await historialFacturacionService.opciones());
    } catch {
      // Los selectores quedan vacíos; el listado sigue funcionando.
    }
  };

  useEffect(() => {
    fetchOpciones();
    fetchDatos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDatos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden, sentido]);

  const ordenarPor = (columna: string) => {
    if (orden === columna) {
      setSentido(sentido === 'asc' ? 'desc' : 'asc');
    } else {
      setOrden(columna);
      setSentido('desc');
    }
  };

  const Encabezado = ({ campo, children }: { campo: string; children: React.ReactNode }) => (
    <th
      className="cursor-pointer select-none whitespace-nowrap"
      onClick={() => ordenarPor(campo)}
      title="Ordenar"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {orden === campo && (
          <KeenIcon icon={sentido === 'asc' ? 'up' : 'down'} className="text-2xs" />
        )}
      </span>
    </th>
  );

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setTimeout(() => fetchDatos(1), 0);
  };

  const exportar = async (formato: 'excel' | 'pdf') => {
    setExportando(formato);
    try {
      const blob = await historialFacturacionService.exportar(formato, parametros(1));
      const url = URL.createObjectURL(blob);

      if (formato === 'pdf') {
        window.open(url, '_blank', 'noopener');
      } else {
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'historial_facturacion.xlsx';
        enlace.click();
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al generar el reporte.', {
        variant: 'error'
      });
    } finally {
      setExportando(null);
    }
  };

  return (
    <Fragment>
      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        <Kpi titulo="Total de ventas" valor={kpis?.totalVentas ?? 0} icono="handcart" color="primary" />
        <Kpi
          titulo="Total recaudado"
          valor={formatearPrecio(kpis?.totalRecaudado ?? 0)}
          icono="dollar"
          color="success"
        />
        <Kpi titulo="Pagos aprobados" valor={kpis?.pagosAprobados ?? 0} icono="check-circle" color="success" />
        <Kpi titulo="Pagos pendientes" valor={kpis?.pagosPendientes ?? 0} icono="time" color="warning" />
        <Kpi titulo="Pagos rechazados" valor={kpis?.pagosRechazados ?? 0} icono="cross-circle" color="danger" />
        <Kpi
          titulo="Promedio por compra"
          valor={formatearPrecio(kpis?.promedioCompra ?? 0)}
          icono="chart-line-up"
          color="info"
        />
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            className="input input-sm w-72"
            placeholder="Buscar por usuario, empresa, plan, referencia o transaction ID..."
            value={filtros.buscar ?? ''}
            onChange={(e) => setFiltros({ ...filtros, buscar: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && fetchDatos(1)}
          />
          <button className="btn btn-sm btn-icon btn-light" onClick={() => fetchDatos(1)}>
            <KeenIcon icon="magnifier" />
          </button>
        </div>

        <button
          className="btn btn-sm btn-light flex items-center gap-1.5"
          onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
        >
          <KeenIcon icon="filter" />
          Filtros
          <KeenIcon icon={filtrosAbiertos ? 'up' : 'down'} className="text-2xs" />
        </button>

        <div className="flex items-center gap-2 ms-auto">
          <button
            className="btn btn-sm btn-light flex items-center gap-1.5"
            onClick={() => exportar('excel')}
            disabled={exportando !== null}
          >
            {exportando === 'excel' ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <KeenIcon icon="file-sheet" />
            )}
            Exportar a Excel
          </button>
          <button
            className="btn btn-sm btn-light flex items-center gap-1.5"
            onClick={() => exportar('pdf')}
            disabled={exportando !== null}
          >
            {exportando === 'pdf' ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <KeenIcon icon="file-down" />
            )}
            Exportar a PDF
          </button>
        </div>
      </div>

      {/* Filtros colapsables */}
      {filtrosAbiertos && (
        <div className="card mb-4">
          <div className="card-header">
            <h4 className="card-title flex items-center gap-2">
              <KeenIcon icon="filter-tablet" className="text-primary" />
              Filtros de Búsqueda
            </h4>
          </div>
          <div className="card-body grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="form-label text-xs">Fecha desde</label>
              <input
                type="date"
                className="input input-sm"
                value={filtros.desde ?? ''}
                onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label text-xs">Fecha hasta</label>
              <input
                type="date"
                className="input input-sm"
                value={filtros.hasta ?? ''}
                onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label text-xs">Usuario</label>
              <input
                type="text"
                className="input input-sm"
                placeholder="Nombre o correo"
                value={filtros.usuario ?? ''}
                onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label text-xs">Empresa</label>
              <select
                className="select select-sm"
                value={filtros.empresaId ?? ''}
                onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value })}
              >
                <option value="">Todas las empresas</option>
                {(opciones?.empresas ?? []).map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label text-xs">Plan</label>
              <select
                className="select select-sm"
                value={filtros.planId ?? ''}
                onChange={(e) => setFiltros({ ...filtros, planId: e.target.value })}
              >
                <option value="">Todos los planes</option>
                {(opciones?.planes ?? []).map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label text-xs">Estado del pago</label>
              <select
                className="select select-sm"
                value={filtros.estadoPago ?? ''}
                onChange={(e) => setFiltros({ ...filtros, estadoPago: e.target.value })}
              >
                <option value="">Todos</option>
                {(opciones?.estadosPago ?? []).map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label text-xs">Estado de la solicitud</label>
              <select
                className="select select-sm"
                value={filtros.estadoSolicitud ?? ''}
                onChange={(e) => setFiltros({ ...filtros, estadoSolicitud: e.target.value })}
              >
                <option value="">Todos</option>
                {(opciones?.estadosSolicitud ?? []).map((estado) => (
                  <option key={estado} value={estado}>
                    {ETIQUETA_ESTADO_SOLICITUD[estado] ?? estado}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label text-xs">Método de pago</label>
              <select
                className="select select-sm"
                value={filtros.metodoPago ?? ''}
                onChange={(e) => setFiltros({ ...filtros, metodoPago: e.target.value })}
              >
                <option value="">Todos</option>
                {(opciones?.metodosPago ?? []).map((metodo) => (
                  <option key={metodo} value={metodo}>
                    {ETIQUETA_METODO_WOMPI[metodo] ?? metodo}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
              <button className="btn btn-sm btn-light flex items-center gap-1.5" onClick={limpiarFiltros}>
                <KeenIcon icon="arrows-circle" />
                Limpiar filtros
              </button>
              <button className="btn btn-sm btn-primary flex items-center gap-1.5" onClick={() => fetchDatos(1)}>
                <KeenIcon icon="magnifier" />
                Buscar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listado */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title flex items-center gap-2">
            <KeenIcon icon="bill" className="text-primary" />
            Compras registradas
          </h4>
          <span className="text-2xs text-gray-500">{total} registro(s)</span>
        </div>
        <div className="card-body p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
              <span className="spinner-border spinner-border-sm" />
              Cargando historial...
            </div>
          ) : registros.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-12 text-center">
              <KeenIcon icon="bill" className="text-3xl text-gray-300" />
              <p className="text-sm text-gray-500">No hay compras para los filtros aplicados.</p>
            </div>
          ) : (
            <table className="table table-sm align-middle text-sm">
              <thead>
                <tr>
                  <Encabezado campo="fechaPago">Fecha del pago</Encabezado>
                  <Encabezado campo="usuarioNombre">Usuario</Encabezado>
                  <Encabezado campo="empresaNombre">Empresa</Encabezado>
                  <Encabezado campo="planNombre">Plan</Encabezado>
                  <Encabezado campo="cantidadMensajes">Mensajes</Encabezado>
                  <Encabezado campo="valor">Valor pagado</Encabezado>
                  <th>Método</th>
                  <th>Referencia / Transaction ID</th>
                  <Encabezado campo="estadoPago">Estado pago</Encabezado>
                  <Encabezado campo="estadoSolicitud">Estado solicitud</Encabezado>
                  <th>Aprobado por</th>
                  <th>Fecha aprobación</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td className="text-xs text-gray-500 whitespace-nowrap">
                      {formatearFecha(registro.fechaPago)}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {registro.usuarioNombre || '—'}
                        </span>
                        <span className="text-2xs text-gray-500">{registro.usuarioEmail}</span>
                      </div>
                    </td>
                    <td>{registro.empresaNombre || '—'}</td>
                    <td>{registro.planNombre}</td>
                    <td>{formatearNumero(registro.cantidadMensajes)}</td>
                    <td className="font-semibold text-gray-900">{formatearPrecio(registro.valor)}</td>
                    <td>
                      {registro.pagoMetodo
                        ? (ETIQUETA_METODO_WOMPI[registro.pagoMetodo] ?? registro.pagoMetodo)
                        : registro.metodoPago || '—'}
                    </td>
                    <td className="text-2xs text-gray-500">
                      {registro.referenciaWompi ? (
                        <div className="flex flex-col">
                          <span>{registro.referenciaWompi}</span>
                          <span className="text-gray-400">{registro.transactionId ?? '—'}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span
                        className={clsx(
                          'badge badge-sm',
                          BADGE_ESTADO_PAGO[registro.estadoPago] ?? 'badge-light'
                        )}
                      >
                        {registro.estadoPago}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={clsx(
                            'badge badge-sm',
                            BADGE_ESTADO_SOLICITUD[registro.estadoSolicitud] ?? 'badge-light'
                          )}
                        >
                          {ETIQUETA_ESTADO_SOLICITUD[registro.estadoSolicitud] ??
                            registro.estadoSolicitud}
                        </span>
                        {registro.motivoRechazo && (
                          <span className="text-2xs text-danger">{registro.motivoRechazo}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-gray-600">
                      {registro.aprobadoPorNombre || registro.aprobadoPorEmail || '—'}
                    </td>
                    <td className="text-xs text-gray-500 whitespace-nowrap">
                      {formatearFecha(registro.fechaAprobacion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            className="btn btn-sm btn-light"
            disabled={page <= 1}
            onClick={() => fetchDatos(page - 1)}
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            className="btn btn-sm btn-light"
            disabled={page >= totalPages}
            onClick={() => fetchDatos(page + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </Fragment>
  );
};

export { HistorialFacturacionContent };

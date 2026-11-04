import { Fragment, useCallback, useEffect, useState } from 'react';
import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useSnackbar } from 'notistack';
import clsx from 'clsx';
import { KeenIcon } from '@/components';
import {
  messageStatisticsService,
  StatsFilterParams,
  DashboardData,
  MessageRow
} from '@/services/messageStatisticsService';

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'sent', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'read', label: 'Leído' },
  { value: 'failed', label: 'Error' },
];

const ESTADO_BADGE: Record<string, string> = {
  sent: 'badge-primary',
  delivered: 'badge-info',
  read: 'badge-success',
  failed: 'badge-danger',
};

const KpiCard = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => (
  <div className="card p-5 flex flex-row items-center gap-4">
    <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-xl', color)}>
      <KeenIcon icon={icon} />
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  </div>
);

type SortBy = 'fecha_envio' | 'estado' | 'template' | 'nombre' | 'programa' | 'ficha';

const EstadisticasWhatsAppContent = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [programa, setPrograma] = useState('');
  const [ficha, setFicha] = useState('');
  const [centro, setCentro] = useState('');
  const [estado, setEstado] = useState('');
  const [plantilla, setPlantilla] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('fecha_envio');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;

  const buildFilters = (): StatsFilterParams => ({
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    programa: programa || undefined,
    ficha: ficha || undefined,
    centro_formacion: centro || undefined,
    estado: estado || undefined,
    plantilla: plantilla || undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
  });

  const fetchAll = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const filters = buildFilters();
      const [dash, listado] = await Promise.all([
        messageStatisticsService.getDashboard(filters),
        messageStatisticsService.getListado({ ...filters, page, per_page: perPage }),
      ]);
      setDashboard(dash);
      setRows(listado.data);
      setCurrentPage(listado.current_page);
      setTotalPages(listado.last_page);
      setTotal(listado.total);
    } catch {
      enqueueSnackbar('Error al cargar las estadísticas.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaDesde, fechaHasta, programa, ficha, centro, estado, plantilla, sortBy, sortDir]);

  useEffect(() => {
    fetchAll(1);
  }, [fetchAll]);

  const handleSort = (columna: SortBy) => {
    if (sortBy === columna) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columna);
      setSortDir('desc');
    }
  };

  const sortIcon = (columna: SortBy) => {
    if (sortBy !== columna) return null;
    return <KeenIcon icon={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'} className="text-xs ml-1" />;
  };

  const handleExportar = async (formato: 'excel' | 'pdf') => {
    setExporting(formato);
    try {
      const blob = await messageStatisticsService.exportar(buildFilters(), formato);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = formato === 'excel' ? 'estadisticas_whatsapp.xlsx' : 'estadisticas_whatsapp.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('Error al generar el reporte.', { variant: 'error' });
    } finally {
      setExporting(null);
    }
  };

  const porDiaOptions: ApexOptions = {
    chart: { type: 'area', toolbar: { show: false } },
    colors: ['#16a34a'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { categories: dashboard?.porDia.map((d) => d.fecha) || [] },
  };

  const porMesOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    colors: ['#0ea5e9'],
    plotOptions: { bar: { borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: { categories: dashboard?.porMes.map((d) => d.mes) || [] },
  };

  const porProgramaOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    colors: ['#3b82f6'],
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    dataLabels: { enabled: true },
    xaxis: { categories: dashboard?.porPrograma.map((d) => d.programa) || [] },
  };

  const porFichaOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    colors: ['#a855f7'],
    plotOptions: { bar: { borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: { categories: dashboard?.porFicha.map((d) => d.ficha) || [] },
  };

  const porCentroOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    colors: ['#f59e0b'],
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: { categories: dashboard?.porCentro.map((d) => d.centro_formacion) || [] },
  };

  const plantillasOptions: ApexOptions = {
    chart: { type: 'donut' },
    labels: dashboard?.plantillasMasUsadas.map((d) => d.plantilla) || [],
    legend: { position: 'bottom' },
  };

  const estadosOptions: ApexOptions = {
    chart: { type: 'pie' },
    labels: dashboard?.estadosDistribucion.map((d) => d.estado || 'Sin estado') || [],
    colors: ['#3b82f6', '#06b6d4', '#22c55e', '#ef4444'],
    legend: { position: 'bottom' },
  };

  const Th = ({ columna, label }: { columna: SortBy; label: string }) => (
    <th className="p-3 text-left cursor-pointer select-none" onClick={() => handleSort(columna)}>
      <span className="flex items-center">{label} {sortIcon(columna)}</span>
    </th>
  );

  return (
    <Fragment>
      {/* Filtros */}
      <div className="card mb-5">
        <div className="card-body py-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Desde</label>
            <input type="date" className="input input-sm" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Hasta</label>
            <input type="date" className="input input-sm" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Programa</label>
            <input type="text" className="input input-sm w-[150px]" value={programa} onChange={(e) => setPrograma(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Ficha</label>
            <input type="text" className="input input-sm w-[120px]" value={ficha} onChange={(e) => setFicha(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Centro</label>
            <input type="text" className="input input-sm w-[150px]" value={centro} onChange={(e) => setCentro(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Estado</label>
            <select className="select select-sm w-[130px]" value={estado} onChange={(e) => setEstado(e.target.value)}>
              {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Plantilla</label>
            <input type="text" className="input input-sm w-[150px]" value={plantilla} onChange={(e) => setPlantilla(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="btn btn-sm btn-primary" onClick={() => fetchAll(1)} disabled={loading}>
              <KeenIcon icon="arrows-circle" /> Actualizar
            </button>
            <button className="btn btn-sm btn-light" onClick={() => handleExportar('excel')} disabled={!!exporting}>
              <KeenIcon icon="file-sheet" /> {exporting === 'excel' ? 'Generando...' : 'Excel'}
            </button>
            <button className="btn btn-sm btn-light" onClick={() => handleExportar('pdf')} disabled={!!exporting}>
              <KeenIcon icon="file-down" /> {exporting === 'pdf' ? 'Generando...' : 'PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label="Enviados" value={dashboard?.kpis.enviados ?? 0} icon="send" color="bg-blue-100 text-blue-600" />
        <KpiCard label="Entregados" value={dashboard?.kpis.entregados ?? 0} icon="check" color="bg-cyan-100 text-cyan-600" />
        <KpiCard label="Leídos" value={dashboard?.kpis.leidos ?? 0} icon="eye" color="bg-green-100 text-green-600" />
        <KpiCard label="Con error" value={dashboard?.kpis.errores ?? 0} icon="cross-circle" color="bg-red-100 text-red-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <KpiCard label="Plantillas distintas enviadas" value={dashboard?.kpis.totalPlantillasEnviadas ?? 0} icon="element-11" color="bg-indigo-100 text-indigo-600" />
        <KpiCard label="Conversaciones iniciadas" value={dashboard?.kpis.totalConversaciones ?? 0} icon="messages" color="bg-purple-100 text-purple-600" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Mensajes enviados por día</h4>
          <ApexChart options={porDiaOptions} series={[{ name: 'Mensajes', data: dashboard?.porDia.map((d) => d.total) || [] }]} type="area" height={260} />
        </div>
        <div className="card p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Mensajes enviados por mes</h4>
          <ApexChart options={porMesOptions} series={[{ name: 'Mensajes', data: dashboard?.porMes.map((d) => d.total) || [] }]} type="bar" height={260} />
        </div>
        <div className="card p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Mensajes por programa</h4>
          <ApexChart options={porProgramaOptions} series={[{ name: 'Mensajes', data: dashboard?.porPrograma.map((d) => d.total) || [] }]} type="bar" height={260} />
        </div>
        <div className="card p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Mensajes por ficha</h4>
          <ApexChart options={porFichaOptions} series={[{ name: 'Mensajes', data: dashboard?.porFicha.map((d) => d.total) || [] }]} type="bar" height={260} />
        </div>
        <div className="card p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Mensajes por centro de formación</h4>
          <ApexChart options={porCentroOptions} series={[{ name: 'Mensajes', data: dashboard?.porCentro.map((d) => d.total) || [] }]} type="bar" height={260} />
        </div>
        <div className="card p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Estados de los mensajes</h4>
          <ApexChart options={estadosOptions} series={dashboard?.estadosDistribucion.map((d) => d.total) || []} type="pie" height={260} />
        </div>
        <div className="card p-4 lg:col-span-2">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Plantillas más utilizadas</h4>
          <ApexChart options={plantillasOptions} series={dashboard?.plantillasMasUsadas.map((d) => d.total) || []} type="donut" height={260} />
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-auto align-middle text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <Th columna="fecha_envio" label="Fecha envío" />
                  <Th columna="nombre" label="Aspirante" />
                  <th className="p-3 text-left">Celular</th>
                  <Th columna="programa" label="Programa" />
                  <Th columna="ficha" label="Ficha" />
                  <Th columna="template" label="Plantilla" />
                  <Th columna="estado" label="Estado" />
                  <th className="p-3 text-left">Message ID</th>
                  <th className="p-3 text-left">Origen</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="p-6 text-center text-gray-400">Cargando...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={9} className="p-6 text-center text-gray-400">No hay mensajes registrados con estos filtros.</td></tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-gray-700">{r.fecha_envio || '—'}</td>
                      <td className="p-3 font-semibold text-gray-900">{r.nombre} {r.apellido}</td>
                      <td className="p-3 text-gray-700">{r.celular}</td>
                      <td className="p-3 text-gray-700">{r.programa}</td>
                      <td className="p-3 text-gray-700 font-mono">{r.ficha}</td>
                      <td className="p-3 text-gray-700">{r.template || 'Sin registrar'}</td>
                      <td className="p-3">
                        <span className={clsx('badge badge-sm badge-outline', ESTADO_BADGE[r.estado || ''] || 'badge-secondary')}>
                          {r.estado || '—'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 font-mono text-xs truncate max-w-[160px]">{r.waMessageId || '—'}</td>
                      <td className="p-3">
                        {r.esMigrado ? (
                          <span className="badge badge-sm badge-outline badge-warning" title="Copiado del último estado registrado antes de existir el historial completo">
                            Migrado
                          </span>
                        ) : (
                          <span className="badge badge-sm badge-outline badge-success">Real</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {total > 0 && (
          <div className="card-footer justify-between text-2sm text-gray-600">
            <span>{(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, total)} de {total}</span>
            <div className="flex gap-1.5">
              <button className="btn btn-sm btn-icon" disabled={currentPage === 1} onClick={() => fetchAll(currentPage - 1)}>
                <KeenIcon icon="black-left" />
              </button>
              <button className="btn btn-sm btn-icon" disabled={currentPage === totalPages} onClick={() => fetchAll(currentPage + 1)}>
                <KeenIcon icon="black-right" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Fragment>
  );
};

export { EstadisticasWhatsAppContent };

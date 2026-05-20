import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { KeenIcon } from '@/components';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';

interface FichaOption {
  idFicha: number;
  codigoFicha: string;
}

interface RegistroAsistenciaGlobal {
  id?: number;
  idAsistencia?: number;
  fecha: string;
  nombreEstudiante: string;
  identificacion?: string;
  codigoFicha?: string;
  nombreFicha?: string;
  nombreArea?: string;
  nombreMateria?: string;
  asistio?: boolean;
  estado?: string;
  estadoJustificacion?: string | null;
}

const extraerRegistros = (payload: unknown): RegistroAsistenciaGlobal[] => {
  if (Array.isArray(payload)) return payload as RegistroAsistenciaGlobal[];
  const root = payload as { data?: unknown; registros?: unknown };
  if (Array.isArray(root.registros)) return root.registros as RegistroAsistenciaGlobal[];
  if (Array.isArray(root.data)) return root.data as RegistroAsistenciaGlobal[];
  const nested = root.data as { data?: unknown; registros?: unknown };
  if (Array.isArray(nested?.registros)) return nested.registros as RegistroAsistenciaGlobal[];
  if (Array.isArray(nested?.data)) return nested.data as RegistroAsistenciaGlobal[];
  return [];
};

const extraerFichas = (payload: unknown): FichaOption[] => {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? (payload as { data: unknown[] }).data
      : [];

  const map = new Map<number, FichaOption>();
  for (const item of raw) {
    const r = item as Record<string, unknown>;
    const fichaObj = r.ficha as Record<string, unknown> | undefined;
    const id = Number(r.idFicha ?? r.id ?? fichaObj?.id);
    const codigo = String(r.codigoFicha ?? r.codigo ?? r.ficha_codigo ?? '');
    if (id && !map.has(id)) {
      map.set(id, { idFicha: id, codigoFicha: codigo || `Ficha ${id}` });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.codigoFicha.localeCompare(b.codigoFicha, 'es')
  );
};

const formatearFecha = (fechaStr: string): string => {
  if (!fechaStr) return '—';
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return fechaStr;
  }
};

const estadoVisual = (reg: RegistroAsistenciaGlobal): string => {
  if (reg.estado) return reg.estado;
  const ej = String(reg.estadoJustificacion ?? '').toUpperCase();
  if (ej === 'PENDIENTE') return 'Justificación pendiente';
  if (ej === 'RECHAZADO' || ej === 'RECHAZADA') return 'Justificación rechazada';
  if (['APROBADO', 'APROBADA', 'ACEPTADO', 'JUSTIFICADO'].includes(ej) || reg.estado === 'Inasistencia Justificada') {
    return 'Inasistencia justificada';
  }
  if (reg.asistio) return 'Presente';
  return 'Ausente';
};

export interface ListaAsistenciasGlobalPageProps {
  embedded?: boolean;
  defaultIdFicha?: number;
  defaultIdHorarioMateria?: number;
}

const ListaAsistenciasGlobalPage: React.FC<ListaAsistenciasGlobalPageProps> = ({
  embedded = false,
  defaultIdFicha,
  defaultIdHorarioMateria
}) => {
  const { currentLayout } = useLayout();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroAsistenciaGlobal[]>([]);
  const [fichas, setFichas] = useState<FichaOption[]>([]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [idFicha, setIdFicha] = useState(defaultIdFicha ? String(defaultIdFicha) : '');
  const [busqueda, setBusqueda] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    axios
      .get('fichas/instructor/clases-asignadas')
      .then((res) => setFichas(extraerFichas(res.data)))
      .catch(() => setFichas([]));
  }, []);

  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      if (idFicha) params.id_ficha = idFicha;
      if (defaultIdHorarioMateria) params.id_horario_materia = String(defaultIdHorarioMateria);
      if (busqueda.trim()) params.busqueda = busqueda.trim();

      const response = await axios.get('asistencias-instructor-global', { params });
      setRegistros(extraerRegistros(response.data));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        ax?.response?.data?.message ||
          ax?.response?.data?.error ||
          'No se pudo cargar la lista de asistencias.'
      );
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, idFicha, busqueda, defaultIdHorarioMateria]);

  useEffect(() => {
    fetchAsistencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Asistencias');

      try {
        const logoRes = await fetch('/media/images/sena/logo-sena-excel-rmi.png');
        if (logoRes.ok) {
          const blob = await logoRes.blob();
          const logoId = workbook.addImage({
            buffer: await blob.arrayBuffer(),
            extension: 'png'
          });
          worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 70, height: 70 } });
        }
      } catch {
        /* logo opcional */
      }

      worksheet.mergeCells('B2:G3');
      const titleCell = worksheet.getCell('B2');
      titleCell.value = 'LISTA GLOBAL DE ASISTENCIAS';
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF00401A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      const headerRow = worksheet.getRow(6);
      headerRow.values = [
        'Fecha',
        'Estudiante',
        'Identificación',
        'Ficha',
        'Área / Materia',
        'Estado'
      ];
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0072C6' } };
        cell.alignment = { horizontal: 'center' };
      });

      registros.forEach((r) => {
        worksheet.addRow([
          formatearFecha(r.fecha),
          r.nombreEstudiante || '—',
          r.identificacion || '—',
          r.codigoFicha || r.nombreFicha || '—',
          r.nombreArea || r.nombreMateria || '—',
          estadoVisual(r)
        ]);
      });

      worksheet.columns = [
        { width: 14 },
        { width: 32 },
        { width: 16 },
        { width: 14 },
        { width: 28 },
        { width: 22 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }),
        `Asistencias_Global_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch {
      alert('Error al generar el archivo Excel.');
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Permite ventanas emergentes para exportar a PDF.');
      return;
    }

    const logoUrl = `${window.location.origin}/media/images/sena/logo-sena.png`;
    const filtroTexto = [
      fechaDesde && `Desde: ${fechaDesde}`,
      fechaHasta && `Hasta: ${fechaHasta}`,
      idFicha && `Ficha: ${fichas.find((f) => String(f.idFicha) === idFicha)?.codigoFicha || idFicha}`
    ]
      .filter(Boolean)
      .join(' · ');

    const rows = registros
      .map(
        (r) => `
        <tr>
          <td>${formatearFecha(r.fecha)}</td>
          <td>${r.nombreEstudiante || '—'}</td>
          <td>${r.identificacion || '—'}</td>
          <td>${r.codigoFicha || r.nombreFicha || '—'}</td>
          <td>${r.nombreArea || r.nombreMateria || '—'}</td>
          <td>${estadoVisual(r)}</td>
        </tr>`
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lista global de asistencias</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #333; font-size: 12px; }
            h1 { text-align: center; color: #0072C6; font-size: 18px; margin-bottom: 8px; }
            .filtros { text-align: center; color: #666; margin-bottom: 20px; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #0072C6; color: white; }
            tr:nth-child(even) { background: #f9f9f9; }
            @media print { th { background: #eee !important; color: #000 !important; } }
          </style>
        </head>
        <body>
          <img src="${logoUrl}" style="width:60px;display:block;margin:0 auto 12px" onerror="this.style.display='none'" />
          <h1>Lista global de asistencias</h1>
          ${filtroTexto ? `<p class="filtros">${filtroTexto}</p>` : ''}
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Estudiante</th><th>ID</th><th>Ficha</th><th>Área</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6">Sin registros</td></tr>'}</tbody>
          </table>
          <script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close()},500)},300)}</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      {!embedded && currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Consulta las asistencias de todas tus fichas y aprendices con filtros por fecha
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <div className="relative">
                <button
                  type="button"
                  className="btn btn-sm btn-light border border-gray-300"
                  onClick={() => setShowExportMenu((v) => !v)}
                >
                  <KeenIcon icon="file-down" className="me-1" />
                  Exportar
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-coal-400">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-green-50"
                      onClick={() => {
                        setShowExportMenu(false);
                        exportToExcel();
                      }}
                    >
                      <KeenIcon icon="file-down" /> Excel
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50"
                      onClick={() => {
                        setShowExportMenu(false);
                        exportToPDF();
                      }}
                    >
                      <KeenIcon icon="file" /> PDF
                    </button>
                  </div>
                )}
              </div>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className={embedded ? 'space-y-4' : 'py-4 space-y-4'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="input input-sm w-full mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="input input-sm w-full mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Buscar estudiante
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre o documento..."
                className="input input-sm w-full mt-1"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="btn btn-sm btn-primary w-full"
                onClick={fetchAsistencias}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Aplicar filtros'}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                Registros ({registros.length})
              </p>
            </div>
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-coal-300 sticky top-0 z-10">
                  <tr>
                    {['Fecha', 'Estudiante', 'Identificación', 'Ficha', 'Área', 'Estado'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-12 text-center text-gray-500">
                        Cargando...
                      </td>
                    </tr>
                  ) : registros.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-12 text-center text-gray-500">
                        No hay registros con los filtros seleccionados
                      </td>
                    </tr>
                  ) : (
                    registros.map((r, i) => {
                      const estado = estadoVisual(r);
                      const color =
                        estado.includes('Presente') || estado.includes('presente')
                          ? 'text-green-600'
                          : estado.includes('justificad') || estado.includes('Justificad')
                            ? 'text-yellow-600'
                            : estado.includes('pendiente') || estado.includes('Pendiente')
                              ? 'text-amber-600'
                              : 'text-red-600';
                      return (
                        <tr key={r.id ?? r.idAsistencia ?? i} className="hover:bg-gray-50 dark:hover:bg-coal-300">
                          <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(r.fecha)}</td>
                          <td className="px-3 py-2">{r.nombreEstudiante || '—'}</td>
                          <td className="px-3 py-2">{r.identificacion || '—'}</td>
                          <td className="px-3 py-2">{r.codigoFicha || r.nombreFicha || '—'}</td>
                          <td className="px-3 py-2">{r.nombreArea || r.nombreMateria || '—'}</td>
                          <td className={`px-3 py-2 font-medium ${color}`}>{estado}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default ListaAsistenciasGlobalPage;

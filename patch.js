const fs = require('fs');
let content = fs.readFileSync('src/pages/ambiente-virtual/ReporteAsistencias.tsx', 'utf8');

// 1. Insert imports
content = content.replace(
  "import { getAsistenciaDocumentUrl } from '@/utils/asistenciaDocumentUrl';",
  "import { getAsistenciaDocumentUrl } from '@/utils/asistenciaDocumentUrl';\nimport ExcelJS from 'exceljs';"
);

// 2. Insert Export Logic
const exportLogic =   const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte de Asistencia');
      worksheet.columns = [
        { header: 'Fecha', key: 'fecha', width: 20 },
        { header: 'Área', key: 'area', width: 40 },
        { header: 'Estado', key: 'estado', width: 30 },
      ];
      registrosFiltrados.forEach(r => {
        let estadoStr = '';
        const estadoJ = r.estadoJustificacion?.toUpperCase() || r.justificacion?.estado?.toUpperCase();
        if (estadoJ === 'PENDIENTE') estadoStr = 'Pendiente de aprobación';
        else if (estadoJ === 'RECHAZADO' || estadoJ === 'RECHAZADA') estadoStr = 'Justificación rechazada';
        else if (r.estado === 'Inasistencia Justificada' || estadoJ === 'APROBADO' || estadoJ === 'APROBADA' || estadoJ === 'ACEPTADO' || estadoJ === 'JUSTIFICADO') estadoStr = 'Inasistencia justificada';
        else if (!r.asistio) estadoStr = 'Ausente';
        else estadoStr = 'Presente';
        
        worksheet.addRow({
          fecha: formatearFecha(r.fecha),
          area: r.nombreArea,
          estado: estadoStr
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Reporte_Asistencia.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Permite ventanas emergentes para exportar a PDF.'); return; }
    const rows = registrosFiltrados.map(r => {
        let estadoStr = '';
        const estadoJ = r.estadoJustificacion?.toUpperCase() || r.justificacion?.estado?.toUpperCase();
        if (estadoJ === 'PENDIENTE') estadoStr = 'Pendiente de aprobación';
        else if (estadoJ === 'RECHAZADO' || estadoJ === 'RECHAZADA') estadoStr = 'Justificación rechazada';
        else if (r.estado === 'Inasistencia Justificada' || estadoJ === 'APROBADO' || estadoJ === 'APROBADA' || estadoJ === 'ACEPTADO' || estadoJ === 'JUSTIFICADO') estadoStr = 'Inasistencia justificada';
        else if (!r.asistio) estadoStr = 'Ausente';
        else estadoStr = 'Presente';
        return "<tr><td>" + formatearFecha(r.fecha) + "</td><td>" + r.nombreArea + "</td><td>" + estadoStr + "</td></tr>";
    }).join('');
    printWindow.document.write("<html><head><title>Reporte de Asistencia</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f3f4f6}</style></head><body><h2>Reporte de Asistencia</h2><table><thead><tr><th>Fecha</th><th>Área</th><th>Estado</th></tr></thead><tbody>" + rows + "</tbody></table><script>window.onload=function(){window.print();window.close();}</script></body></html>");
    printWindow.document.close();
  };;

content = content.replace(
  "const [mensajeExito, setMensajeExito] = useState<string | null>(null);",
  "const [mensajeExito, setMensajeExito] = useState<string | null>(null);\n" + exportLogic
);

// 3. Header export button
const regexHeader = /<h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2\.5">\s*Registro Detallado\s*<\/h3>\s*<div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden">\s*<div className="overflow-x-auto max-h-\[420px\] overflow-y-auto">/;

const headerCode = \
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-coal-300">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  Registros ({registrosFiltrados.length})
                </p>

                <div className="relative" ref={exportMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="btn btn-sm btn-light border border-gray-300 flex items-center gap-2"
                  >
                    <KeenIcon icon="file-down" className="text-base" /> Exportar
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                      <div className="py-1" role="menu">
                        <button
                          type="button"
                          onClick={() => { setShowExportMenu(false); exportToPDF(); }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          Exportar PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowExportMenu(false); exportToExcel(); }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          Exportar Excel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
\;

content = content.replace(
  regexHeader,
  '<h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5">Registro Detallado</h3><div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden">\\n' + headerCode + '\\n<div className="overflow-x-auto max-h-[420px] overflow-y-auto">'
);

// 4. Modal
const regexModal = /\{/\* Modal de detalles de justificación \*/\}[\s\S]*?<\/Modal>\s*\)}/;

const modalCode = \
      {/* Modal de detalles de justificación */}
      {justificacionSeleccionada && (
        <Modal open={true} onClose={() => setJustificacionSeleccionada(null)}>
          <ModalContent className="max-w-[500px] top-[15%] p-4">
            <ModalHeader>
              <ModalTitle>Detalle de Justificación</ModalTitle>
              <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={() => setJustificacionSeleccionada(null)}>
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>
            <ModalBody className="py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-coal-300 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Tipo de Excusa</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {justificacionSeleccionada.excusa?.tipoExcusa ? (
                      <span className="inline-flex items-center rounded-md bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-bold text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                        {justificacionSeleccionada.excusa.tipoExcusa}
                      </span>
                    ) : (
                      'No especificado'
                    )}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-coal-300 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Estado Actual</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {justificacionSeleccionada.estado === 'APROBADA' || justificacionSeleccionada.estado === 'APROBADO' ? (
                      <span className="text-green-600 dark:text-green-400">Aprobada</span>
                    ) : justificacionSeleccionada.estado === 'RECHAZADA' || justificacionSeleccionada.estado === 'RECHAZADO' ? (
                      <span className="text-red-600 dark:text-red-400">Rechazada</span>
                    ) : (
                      <span className="text-yellow-600 dark:text-yellow-400">Pendiente</span>
                    )}
                  </p>
                </div>
              </div>

              {justificacionSeleccionada.excusa?.observacion && (
                <div className="bg-gray-50 dark:bg-coal-300 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Observación</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{justificacionSeleccionada.excusa.observacion}"</p>
                </div>
              )}

              {justificacionSeleccionada.excusa?.urlDocumento && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <KeenIcon icon="file" className="text-blue-600 dark:text-blue-400 text-lg" />
                    <div>
                      <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Documento de Soporte</p>
                      <p className="text-[11px] text-blue-600 dark:text-blue-400">Ver archivo adjunto</p>
                    </div>
                  </div>
                  {(() => {
                    const originalUrl = justificacionSeleccionada.excusa.urlDocumento;
                    let docUrl = originalUrl;
                    if (originalUrl && originalUrl.startsWith('http://')) {
                      try {
                        const urlObj = new URL(originalUrl);
                        if (urlObj.pathname.startsWith('/excusas/')) {
                          const base = (axios.defaults.baseURL || window.location.origin).replace(/\\/api\\/?$/, '');
                          docUrl = base + '/storage' + urlObj.pathname;
                        } else if (urlObj.pathname.startsWith('/storage/')) {
                          if (urlObj.hostname === 'localhost' && !urlObj.port) {
                            const base = (axios.defaults.baseURL || window.location.origin).replace(/\\/api\\/?$/, '');
                            docUrl = base + urlObj.pathname;
                          } else {
                            docUrl = originalUrl;
                          }
                        } else {
                          docUrl = originalUrl;
                        }
                      } catch {
                        docUrl = originalUrl;
                      }
                    } else if (originalUrl && !originalUrl.startsWith('http')) {
                      docUrl = getAsistenciaDocumentUrl(originalUrl);
                    }
                    return docUrl ? (
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          if (docUrl) {
                            window.open(docUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="btn btn-sm btn-primary shrink-0"
                      >
                        Abrir Documento
                      </a>
                    ) : null;
                  })()}
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
\;

content = content.replace(regexModal, modalCode);

fs.writeFileSync('src/pages/ambiente-virtual/ReporteAsistencias.tsx', content);

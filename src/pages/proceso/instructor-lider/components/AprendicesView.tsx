import React, { useState, useRef, useEffect } from 'react';
import { Aprendiz, Ficha } from '../types';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const MySwal = withReactContent(Swal);

const ESTADOS_MATRICULA = [
  'EN FORMACION',
  'RETIRO VOLUNTARIO',
  'TRASLADADO',
  'DESERCION',
  'CONDICIONADO'
];

type Props = {
  selectedFicha: Ficha;
  aprendices: Aprendiz[];
  loadingAprendices: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onBack: () => void;
  reloadAprendices: () => void;
};

const AprendicesView: React.FC<Props> = ({
  selectedFicha,
  aprendices,
  loadingAprendices,
  searchTerm,
  setSearchTerm,
  onBack,
  reloadAprendices
}) => {
  const [selectedAprendiz, setSelectedAprendiz] = useState<Aprendiz | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');
  const [saving, setSaving] = useState(false);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const filteredAprendices = aprendices.filter(
    (a) =>
      a.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.identificacion.includes(searchTerm)
  );

  const handleOpenModal = (aprendiz: Aprendiz) => {
    setSelectedAprendiz(aprendiz);
    setNuevoEstado(aprendiz.estadoMatricula);
    setObservacion('');
  };

  const handleCloseModal = () => {
    setSelectedAprendiz(null);
    setNuevoEstado('');
    setObservacion('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAprendiz) return;

    try {
      setSaving(true);
      await axios.post('instructor-lider/cambiar-estado-aprendiz', {
        idMatricula: selectedAprendiz.idMatricula,
        nuevoEstado,
        observacion
      });
      MySwal.fire({
        title: '¡Éxito!',
        text: 'El estado del aprendiz ha sido actualizado correctamente.',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });
      handleCloseModal();
      reloadAprendices();
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      MySwal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Ocurrió un error al actualizar el estado.',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Novedades');

      // Intentamos cargar el logo
      try {
        const response = await fetch('/media/images/sena/logo-sena-excel-rmi.png');

        if (response.ok) {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();

          const logoId = workbook.addImage({
            buffer: arrayBuffer,
            extension: 'png'
          });

          worksheet.addImage(logoId, {
            tl: { col: 0, row: 0 },
            ext: { width: 80, height: 80 }
          });
        }
      } catch (e) {
        console.warn('No se pudo cargar el logo para Excel', e);
      }

      // Estilo de encabezado del documento
      worksheet.mergeCells('B2:E3');

      const titleCell = worksheet.getCell('B2');
      titleCell.value = 'NOVEDADES DE APRENDICES';
      titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: 'FF00401A' }
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.getCell('A5').value = 'Programa:';
      worksheet.getCell('A5').font = { bold: true };
      worksheet.getCell('B5').value = selectedFicha.asignacion?.programa?.nombrePrograma || 'N/A';

      worksheet.getCell('A6').value = 'Ficha:';
      worksheet.getCell('A6').font = { bold: true };
      worksheet.getCell('B6').value = selectedFicha.codigo || 'N/A';

      // Tabla de estudiantes - Fila de encabezado
      const headerRow = worksheet.getRow(8);
      headerRow.values = ['#', 'Nombre Completo', 'Identificación', 'Estado', 'Email'];

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0072C6' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      });

      // Filas de datos (Solo aprendices con estado diferente a EN FORMACION)
      const aprendicesToExport = aprendices.filter(a => a.estadoMatricula !== 'EN FORMACION');

      aprendicesToExport.forEach((student, index) => {
        const row = worksheet.addRow([
          index + 1,
          student.nombreCompleto,
          student.identificacion,
          student.estadoMatricula,
          student.email || 'Sin correo electrónico'
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
          };

          if (colNumber === 1 || colNumber === 4) {
            cell.alignment = { horizontal: 'center' };
          }
        });
      });

      // Anchos de columna
      worksheet.getColumn(1).width = 5;
      worksheet.getColumn(2).width = 45;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 25;
      worksheet.getColumn(5).width = 35;

      const buffer = await workbook.xlsx.writeBuffer();

      const finalBlob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      saveAs(finalBlob, `Novedades_Aprendices_${selectedFicha.codigo}.xlsx`);
    } catch (error) {
      console.error('Error al generar Excel', error);
      alert('Hubo un error al generar el archivo Excel.');
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para exportar a PDF.');
      return;
    }

    const logoUrl = `${window.location.origin}/media/images/sena/logo-sena.png`;
    const aprendicesToExport = aprendices.filter(a => a.estadoMatricula !== 'EN FORMACION');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Novedades de Aprendices - ${selectedFicha.codigo}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
            .header-container { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-bottom: 3px solid #0072C6; padding-bottom: 15px; position: relative; }
            .logo { width: 80px; height: auto; position: absolute; left: 0; top: -10px; }
            h1 { text-align: center; font-size: 24px; margin: 0; color: #0072C6; text-transform: uppercase; letter-spacing: 1px; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 25px; background-color: #f8f9fa; padding: 15px 20px; border-radius: 6px; border: 1px solid #eaeaea; }
            .info-item p { margin: 0; font-size: 14px; }
            .info-item strong { color: #444; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
            th { background-color: #0072C6; color: white; font-weight: 600; text-transform: uppercase; font-size: 12px; }
            tr:nth-child(even) { background-color: #fcfcfc; }
            .text-center { text-align: center; }
            @media print {
              body { padding: 0; }
              .header-container { border-bottom: 3px solid #000; }
              h1 { color: #000; }
              th { background-color: #f0f0f0 !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .info-grid { background-color: transparent; border: none; padding: 0; margin-bottom: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <img src="${logoUrl}" class="logo" alt="Logo SENA" onerror="this.style.display='none'" />
            <h1>Novedades de Aprendices</h1>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <p><strong>Programa:</strong> ${selectedFicha.asignacion?.programa?.nombrePrograma || 'N/A'}</p>
            </div>
            <div class="info-item">
              <p><strong>Ficha:</strong> ${selectedFicha.codigo || 'N/A'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 5%">#</th>
                <th style="width: 40%">Nombre Completo</th>
                <th style="width: 20%">Identificación</th>
                <th class="text-center" style="width: 20%">Estado</th>
                <th style="width: 15%">Email</th>
              </tr>
            </thead>

            <tbody>
              ${aprendicesToExport.length > 0 ? aprendicesToExport
                .map(
                  (s, index) => `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${s.nombreCompleto}</td>
                      <td>${s.identificacion}</td>
                      <td class="text-center">${s.estadoMatricula}</td>
                      <td>${s.email || 'N/A'}</td>
                    </tr>
                  `
                )
                .join('') : '<tr><td colspan="5" class="text-center">No hay novedades registradas</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 rounded-lg hover:bg-gray-50 dark:hover:bg-coal-400 transition-colors shadow-sm"
          >
            <i className="ki-outline ki-left text-lg text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              Ficha: <span className="text-blue-600">{selectedFicha.codigo}</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedFicha.asignacion?.programa?.nombrePrograma || 'Programa no definido'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <i className="ki-outline ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Buscar aprendiz..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div ref={exportMenuRef} className="relative hidden md:block">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="h-10 px-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
            >
              <i className="ki-outline ki-file-down text-base" />
              <span className="hidden sm:inline">Exportar Novedades</span>
              <i className={`ki-outline ki-down text-sm transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-coal-400">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    exportToPDF();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-gray-200 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                    <i className="ki-outline ki-document text-base" />
                  </span>
                  <span>Exportar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    exportToExcel();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-gray-200 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300">
                    <i className="ki-outline ki-file-down text-base" />
                  </span>
                  <span>Exportar Excel</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="md:hidden w-full flex gap-2">
             <button
              onClick={() => exportToExcel()}
              className="flex-1 h-10 px-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
             >
                <i className="ki-outline ki-file-down text-base" />
                <span>Excel</span>
             </button>
             <button
              onClick={() => exportToPDF()}
              className="flex-1 h-10 px-4 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
             >
                <i className="ki-outline ki-document text-base" />
                <span>PDF</span>
             </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 bg-gray-50/50 dark:bg-coal-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
              <i className="ki-outline ki-people text-blue-600 dark:text-blue-400 text-base" />
            </div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
              Listado de Aprendices
            </h2>
          </div>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-coal-400 px-2.5 py-1 rounded-full">
            {filteredAprendices.length} aprendices
          </span>
        </div>

        <div className="p-0 overflow-x-auto">
          {loadingAprendices ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              <p className="text-sm text-gray-500">Cargando aprendices...</p>
            </div>
          ) : (
            <>
              {filteredAprendices.length > 0 ? (
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-coal-600 text-gray-600 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4 border-b border-gray-100 dark:border-coal-300">
                        Aprendiz
                      </th>
                      <th className="px-6 py-4 border-b border-gray-100 dark:border-coal-300">
                        Identificación
                      </th>
                      <th className="px-6 py-4 border-b border-gray-100 dark:border-coal-300">
                        Estado
                      </th>
                      <th className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-coal-300">
                    {filteredAprendices.map((aprendiz) => (
                      <tr
                        key={aprendiz.idMatricula}
                        className="hover:bg-gray-50 dark:hover:bg-coal-400 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-coal-300 flex items-center justify-center">
                              {aprendiz.rutaFoto ? (
                                <img
                                  src={aprendiz.rutaFoto}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <i className="ki-outline ki-user text-xl text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors">
                                {aprendiz.nombreCompleto}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                {aprendiz.email || 'Sin correo electrónico'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {aprendiz.identificacion}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              aprendiz.estadoMatricula === 'ACTIVO'
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                            }`}
                          >
                            {aprendiz.estadoMatricula}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              title="Registrar Novedad"
                              onClick={() => handleOpenModal(aprendiz)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-coal-400 text-gray-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 transition-all border border-transparent hover:border-amber-500/30"
                            >
                              <i className="ki-outline ki-notepad-edit text-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-20 text-center">
                  <i className="ki-outline ki-magnifier text-5xl text-gray-200 dark:text-coal-300 mb-4 inline-block" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No se encontraron aprendices con ese criterio
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedAprendiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-coal-500 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Registrar Novedad</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Aprendiz:</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {selectedAprendiz.nombreCompleto}
                </p>
                <p className="text-xs text-gray-400">{selectedAprendiz.identificacion}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado Actual
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-coal-600 border border-gray-200 dark:border-coal-400 rounded-lg text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {selectedAprendiz.estadoMatricula}
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="nuevoEstado"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nuevo Estado *
                </label>
                <select
                  id="nuevoEstado"
                  required
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-coal-600 border border-gray-200 dark:border-coal-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-800 dark:text-white"
                >
                  <option value="" disabled>
                    Seleccione un estado
                  </option>
                  {ESTADOS_MATRICULA.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="observacion"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Observación (Opcional)
                </label>
                <textarea
                  id="observacion"
                  rows={3}
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Detalles de la novedad..."
                  className="w-full px-3 py-2 bg-white dark:bg-coal-600 border border-gray-200 dark:border-coal-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-800 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-coal-300">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-coal-400 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || nuevoEstado === selectedAprendiz.estadoMatricula}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AprendicesView;

import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import logoSena from '/media/images/sena/logo-sena.png';
import { Instructor } from './interfaceInstructor';
import { Calendario } from '../programas-academicos/components/malla-curricular/Calendario';

interface RmiModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: Instructor;
  periodo?: string;
  fichas: any[];
}

const RmiModal: React.FC<RmiModalProps> = ({
  isOpen,
  onClose,
  instructor,
  periodo,
  fichas
}) => {
  if (!isOpen) return null;

  const { persona } = instructor;
  const fullName = `${persona.nombre1} ${persona.nombre2 ?? ''} ${persona.apellido1} ${persona.apellido2 ?? ''}`.trim();

  const [calendarioOpen, setCalendarioOpen] = React.useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = React.useState<any>(null);
  const [fichaSeleccionada, setFichaSeleccionada] = React.useState<number>(0);

  const handleVerHorario = async (r: any, idFicha: number) => {
    try {
      const response = await axios.get(`horario/ficha/${idFicha}`);
      const todos = response.data.data || [];

      const filtrados = todos.filter(
        (h: any) => h.idGradoMateria === r.idGradoMateria && h.idContrato === instructor.idContrato
      );

      setMateriaSeleccionada({
        id: r.idMateria,
        nombreMateria: r.resultadoAprendizaje,
        nombre: r.resultadoAprendizaje,
        idMateriaPadre: r.idMateriaPadre ?? 1,
        horasTotales: r.duracionHoras,
        horarios: {
          asignados: filtrados.filter((h: any) => h.estado === 'ASIGNADO'),
          sinAsignar: filtrados.filter((h: any) => h.estado === 'PENDIENTE')
        }
      });
      setFichaSeleccionada(idFicha);
      setCalendarioOpen(true);
    } catch (error) {
      console.error('Error cargando horarios:', error);
    }
  };

  const handleExportExcel = useCallback(() => {
    const dataToExport: any[] = [];

    // Información del instructor
    dataToExport.push({ 'REPORTE MENSUAL DEL INSTRUCTOR - RMI': '' });
    dataToExport.push({ 'PERÍODO': periodo || 'N/A' });
    dataToExport.push({ 'NOMBRE': fullName, 'CÉDULA': persona.identificacion });
    dataToExport.push({ 'CORREO ELECTRÓNICO': persona.email, 'NÚMERO DE CONTACTO': persona.celular });
    dataToExport.push({});

    // Encabezados
    const headers = ['No.', 'No. FICHA', 'PROGRAMA DE FORMACIÓN', 'COMPETENCIA', 'RESULTADO APRENDIZAJE', 'HORAS'];
    dataToExport.push(Object.fromEntries(headers.map((h) => [h, h])));

    // Datos de las fichas
    fichas.forEach((ficha: any, fichaIdx: number) => {
      ficha.resultados.forEach((r: any, rIdx: number) => {
        dataToExport.push({
          'No.': rIdx === 0 ? fichaIdx + 1 : '',
          'No. FICHA': rIdx === 0 ? ficha.codigoFicha : '',
          'PROGRAMA DE FORMACIÓN': rIdx === 0 ? ficha.programaFormacion : '',
          'COMPETENCIA': r.competencia || 'Sin competencia',
          'RESULTADO APRENDIZAJE': r.resultadoAprendizaje || 'Sin RAP',
          'HORAS': `${r.duracionHoras}h`
        });
      });
    });

    // Crear workbook
    const ws = XLSX.utils.json_to_sheet(dataToExport, { skipHeader: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RMI');

    // Ajustar ancho de columnas
    ws['!cols'] = headers.map(() => ({ wch: 25 }));

    // Descargar
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `RMI_${fullName.replace(/\s+/g, '_')}_${fecha}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  }, [fichas, fullName, persona, periodo]);

  return (
    <>
      <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-coal-500 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-200 dark:border-coal-300">
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-coal-300 bg-white dark:bg-coal-500 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <i className="ki-outline ki-book-square text-blue-600 dark:text-blue-400 text-xl" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-gray-800 dark:text-white">
                  Reporte Mensual del Instructor - RMI
                </h2>
                {periodo && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{periodo}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 text-gray-400 border border-gray-200 dark:border-coal-300 rounded-full hover:bg-red-500 hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto flex-1 p-5 bg-gray-50 dark:bg-coal-600 scroll-hide">
            {/* Encabezado RMI */}
            <div className="mb-5 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
              <div className="bg-primary text-white text-center py-2">
                <p className="text-xs font-black uppercase tracking-widest">
                  Reporte Mensual del Instructor - RMI
                </p>
              </div>
              <div className="grid grid-cols-[auto_1fr] divide-x divide-gray-200 dark:divide-coal-300 bg-white dark:bg-coal-500">
                <div className="flex items-center justify-center px-4 py-3">
                  <img src={logoSena} alt="SENA" className="h-16 w-auto object-contain" />
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-coal-300">
                  <div className="divide-y divide-gray-200 dark:divide-coal-300">
                    <div className="px-4 py-2">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Nombre</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-white uppercase">
                        {fullName}
                      </p>
                    </div>
                    <div className="px-4 py-2">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Cédula</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-white">
                        {persona.identificacion}
                      </p>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-coal-300">
                    <div className="px-4 py-2">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">
                        Correo Electrónico
                      </p>
                      <p className="text-xs font-bold text-gray-800 dark:text-white">
                        {persona.email}
                      </p>
                    </div>
                    <div className="px-4 py-2">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">
                        Número de Contacto
                      </p>
                      <p className="text-xs font-bold text-gray-800 dark:text-white">
                        {persona.celular}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-3">
              Fichas asignadas
            </h3>

            {fichas.length === 0 ? (
              <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 text-sm">
                No hay fichas asignadas
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">No.</th>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                          No. FICHA
                        </th>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                          PROGRAMA DE FORMACIÓN
                        </th>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                          COMPETENCIA
                        </th>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                          RESULTADO APRENDIZAJE
                        </th>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">HORAS</th>
                        <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">
                          HORARIO
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fichas.map((ficha: any, fichaIdx: number) =>
                        ficha.resultados.map((r: any, rIdx: number) => (
                          <tr
                            key={r.idHorario}
                            className={`border-t border-gray-200 dark:border-coal-300 ${
                              rIdx % 2 === 0
                                ? 'bg-white dark:bg-coal-500'
                                : 'bg-yellow-50/60 dark:bg-yellow-900/10'
                            } hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors`}
                          >
                            {rIdx === 0 && (
                              <td
                                rowSpan={ficha.resultados.length}
                                className="px-3 py-2 text-center font-bold text-gray-800 dark:text-white align-top border-r border-gray-200 dark:border-coal-300"
                              >
                                {fichaIdx + 1}
                              </td>
                            )}
                            {rIdx === 0 && (
                              <td
                                rowSpan={ficha.resultados.length}
                                className="px-3 py-2 font-bold text-gray-800 dark:text-white align-top border-r border-gray-200 dark:border-coal-300 whitespace-nowrap"
                              >
                                {ficha.codigoFicha}
                              </td>
                            )}
                            {rIdx === 0 && (
                              <td
                                rowSpan={ficha.resultados.length}
                                className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 align-top border-r border-gray-200 dark:border-coal-300"
                              >
                                {ficha.programaFormacion}
                              </td>
                            )}
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-coal-300">
                              {r.competencia ?? (
                                <span className="text-gray-400 italic">Sin competencia</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-coal-300">
                              {r.resultadoAprendizaje ?? (
                                <span className="text-gray-400 italic">Sin RAP</span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {r.duracionHoras}h
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleVerHorario(r, ficha.idFicha)}
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs bg-yellow-50 hover:bg-yellow-100 font-semibold text-yellow-700 dark:text-yellow-400 dark:bg-yellow-500/10 rounded-lg transition-all"
                                title="Ver horario"
                              >
                                <i className="ki-outline ki-calendar text-sm" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-3 border-t border-gray-100 dark:border-coal-300 bg-white dark:bg-coal-500 flex justify-end gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all"
            >
              <i className="ki-outline ki-file-down text-base" /> Exportar Excel
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
            >
              <X size={13} /> Cerrar
            </button>
          </div>
        </div>
      </div>
      <style>
        {`
          .scroll-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scroll-hide::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      {materiaSeleccionada && (
        <Calendario
          isOpen={calendarioOpen}
          onClose={() => {
            setCalendarioOpen(false);
            setMateriaSeleccionada(null);
          }}
          materia={materiaSeleccionada}
          idFicha={fichaSeleccionada}
          onAddSchedule={() => {}}
        />
      )}
    </>
  );
};

export default RmiModal;

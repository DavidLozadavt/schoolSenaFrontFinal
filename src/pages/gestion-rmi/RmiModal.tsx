import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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

  const handleExportExcel = useCallback(async () => {
    try {
      // 1. Cargar la plantilla desde la carpeta public
      // Asegúrate de colocar tu archivo de excel en la carpeta: public/plantillas/plantilla_rmi.xlsx
      const response = await fetch('/plantillas/plantilla_rmi.xlsx');
      
      if (!response.ok) {
        throw new Error('No se pudo cargar la plantilla. Verifica que el archivo exista en public/plantillas/plantilla_rmi.xlsx');
      }
      
      const arrayBuffer = await response.arrayBuffer();

      // 2. Cargar el libro de trabajo (workbook) con exceljs
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // 3. Obtener la hoja principal (asumimos que es la primera, índice 1 o por nombre)
      const worksheet = workbook.worksheets[0]; // La primera hoja

      // ==========================================
      // 4. Llenar los datos de encabezado (Instructor)
      // Ajuste de las celdas de origen basado en la captura
      worksheet.getCell('F2').value = periodo || 'N/A';
      worksheet.getCell('H3').value = fullName;
      worksheet.getCell('H5').value = persona.identificacion;
      worksheet.getCell('O3').value = persona.email;
      worksheet.getCell('O5').value = persona.celular;
      // ==========================================

      // ==========================================
      // 5. Llenar los datos de las fichas en la tabla
      // En la plantilla, la tabla de datos comienza en la fila 10
      // ==========================================
      let currentRow = 10; 

      // Calcular mes y año para la suma de fechas
      let targetYear = new Date().getFullYear();
      let targetMonth = new Date().getMonth() + 1;
      if (periodo && /^\\d{4}-\\d{2}$/.test(periodo)) {
        const [y, m] = periodo.split('-');
        targetYear = parseInt(y);
        targetMonth = parseInt(m);
      }

      // Nombre del mes arriba (celda O8)
      const nombresMeses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      worksheet.getCell('O8').value = nombresMeses[targetMonth - 1];

      // Generar la matriz de días del mes para el mini-calendario (6 semanas max)
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const calMatrix: (number | null)[][] = [];
      let currentWeek: (number | null)[] = [null, null, null, null, null, null];
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(targetYear, targetMonth - 1, d);
        const dayOfWeek = date.getDay(); // 0 is Domingo
        if (dayOfWeek === 0) continue; // Ignoramos el domingo para la cuadrícula
        const colIndex = dayOfWeek - 1; // 0=Lun .. 5=Sab
        currentWeek[colIndex] = d;
        if (colIndex === 5 || d === daysInMonth) {
          calMatrix.push([...currentWeek]);
          currentWeek = [null, null, null, null, null, null];
        }
      }

      const mapColumnasDias: Record<number, string> = {
        1: 'H', 2: 'I', 3: 'J', 4: 'K', 5: 'L', 6: 'M', 7: 'N'
      };
      const mapColumnasFechasStr = ['O', 'P', 'Q', 'R', 'S', 'T'];

      for (let fichaIdx = 0; fichaIdx < fichas.length; fichaIdx++) {
        const ficha = fichas[fichaIdx];

        // Traer horarios de esta ficha antes de procesar sus resultados
        let todos = [];
        try {
          const resHorario = await axios.get(`horario/ficha/${ficha.idFicha}`);
          todos = resHorario.data?.data || [];
        } catch (error) {
          console.error(`Error al cargar horarios de la ficha ${ficha.idFicha}`, error);
        }

        for (let rIdx = 0; rIdx < ficha.resultados.length; rIdx++) {
          const r = ficha.resultados[rIdx];
          
          // Por cada fila, le asignamos los valores a las columnas correspondientes
          if (rIdx === 0) {
            worksheet.getCell(`A${currentRow}`).value = fichaIdx + 1; // No.
            worksheet.getCell(`B${currentRow}`).value = ficha.codigoFicha; // No. Ficha
            worksheet.getCell(`C${currentRow}`).value = ficha.programaFormacion; // Programa Formación
          }
          
          worksheet.getCell(`D${currentRow}`).value = ''; // Actividad (vacío de momento)
          worksheet.getCell(`E${currentRow}`).value = r.competencia || 'Sin competencia'; // Competencia
          worksheet.getCell(`F${currentRow}`).value = r.resultadoAprendizaje || 'Sin RAP'; // RAP
          // Asumiendo la G:
          worksheet.getCell(`G${currentRow}`).value = r.fechaTerminacion || ''; // Fecha Terminacion

          // HORARIOS: Filtrar asignados para este resultado y este instructor
          const filtrados = todos.filter(
            (h: any) => h.idGradoMateria === r.idGradoMateria && h.idContrato === instructor.idContrato && h.estado === 'ASIGNADO'
          );

          let horasMesTotal = 0;
          const classDates = new Set<number>();

          filtrados.forEach((h: any) => {
            const horaIni = h.horaInicio || h.horaInicial;
            const horaFin = h.horaFin || h.horaFinal;

            if (horaIni && horaFin) {
              // 1. Poner texto de horas
              const colDia = mapColumnasDias[h.idDia];
              if (colDia) {
                const horarioText = `${horaIni} - ${horaFin}`;
                // Combinadas verticalmente, se escribe en currentRow
                const cell = worksheet.getCell(`${colDia}${currentRow}`);
                cell.value = horarioText;
                cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
              }

              // 2. Calcular los días que verdaderamente fueron dados de clase (entre inicio y fin)
              const [hI, mI] = horaIni.toString().split(':').map(Number);
              const [hF, mF] = horaFin.toString().split(':').map(Number);
              const sessionHours = ((hF * 60 + mF) - (hI * 60 + mI)) / 60;

              const fIniStr = h.fechaInicial || h.fechaInicio;
              const fFinStr = h.fechaFinal || h.fechaFin;
              if (fIniStr && fFinStr) {
                const [yI, mI_str, dI] = fIniStr.split('-').map(Number);
                const [yF, mF_str, dF] = fFinStr.split('-').map(Number);
                
                // Mapeo riguroso: SENA API idDia = 1(Lun) - 7(Dom), JS Date getDay = 0(Dom) - 6(Sab)
                let idDiaSena = Number(h.idDia);
                const jsDayRequired = idDiaSena === 7 ? 0 : idDiaSena;

                for (let i = 1; i <= daysInMonth; i++) {
                  const currentDayDate = new Date(targetYear, targetMonth - 1, i);
                  const isRequiredJSday = currentDayDate.getDay() === jsDayRequired;
                  
                  // Validación manual y dura de fecha >= inicio y fecha <= fin sin usar getTime
                  const currentVal = targetYear * 10000 + targetMonth * 100 + i;
                  const startVal = yI * 10000 + mI_str * 100 + dI;
                  const endVal = yF * 10000 + mF_str * 100 + dF;

                  if (isRequiredJSday && currentVal >= startVal && currentVal <= endVal) {
                    classDates.add(i);
                    horasMesTotal += sessionHours;
                  }
                }
              }
            }
          });

          // 3. Imprimir el calendario de este bloque iterando sobre la matriz
          for (let w = 0; w < calMatrix.length; w++) {
            for (let c = 0; c < 6; c++) {
              const dayDate = calMatrix[w][c];
              const cell = worksheet.getCell(`${mapColumnasFechasStr[c]}${currentRow + w}`);
              
              // ¡CRÍTICO! Romper la referencia compartida del estilo en celdas clonadas del template
              cell.style = { ...cell.style };

              if (dayDate) {
                cell.value = dayDate;
                cell.style.alignment = { horizontal: 'center', vertical: 'middle' };
                // Colorear en verde solo si en ese día puntual hay clase:
                if (classDates.has(dayDate)) {
                  cell.style.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF92D050' } // Verde limón
                  };
                  cell.style.font = { ...cell.style.font, bold: true, color: { argb: 'FFFFFFFF' } }; // Letra blanca y negrita
                } else {
                  // Limpiar fondo
                  cell.style.fill = { type: 'pattern', pattern: 'none' };
                  cell.style.font = { ...cell.style.font, bold: false, color: { argb: 'FF000000' } };
                }
              } else {
                cell.value = '';
                cell.style.fill = { type: 'pattern', pattern: 'none' };
                cell.style.font = { ...cell.style.font, bold: false, color: { argb: 'FF000000' } };
              }
            }
          }

          // 4. Las "horas totales" calculadas para el mes entero
          worksheet.getCell(`U${currentRow}`).value = horasMesTotal;

          // Asumimos que los bloques combinados verticalmente en la plantilla miden 7 celdas (filas 10 a 16)
          // Se desplaza en 7 el row para el proximo resultado/ficha si la iteracion continua.
          currentRow += 7;
        }
      }

      // 6. Configurar la descarga del archivo modificado
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `RMI_${fullName.replace(/\\s+/g, '_')}_${fecha}.xlsx`;
      
      // Descargarlo usando file-saver
      saveAs(blob, nombreArchivo);

    } catch (error) {
      console.error('Error al generar el RMI desde la plantilla:', error);
      alert('Error al generar el Excel: Asegúrate de haber ubicado la plantilla en la carpeta public/plantillas/plantilla_rmi.xlsx');
    }
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
          modoRmi={true}
        />
      )}
    </>
  );
};

export default RmiModal;

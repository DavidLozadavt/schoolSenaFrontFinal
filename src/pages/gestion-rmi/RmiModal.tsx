import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import axios from 'axios';
import logoSena from '/media/images/sena/logo-sena.png';
import { Instructor } from './interfaceInstructor';
import { Calendario } from '../programas-academicos/components/malla-curricular/Calendario';
import logoSenaExcel from '/media/images/sena/logo-sena-excel-rmi.png';
import { enqueueSnackbar } from 'notistack';

interface Actividad {
  id: number;
  descripcion: string;
  fechaInicial: string;
  fechaFinal: string;
  numeroHoras: number;
  rutaDocumentoUrl: string | null;
}

interface RmiModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: Instructor;
  periodo?: string;
  fichas: any[];
  actividades?: Actividad[];
  onRefresh?: () => void;
  readOnlyAsociacion?: boolean;
  onAceptar?: () => void;
  onRechazar?: () => void;
  onRevertir?: () => void;
  disableActionRmi?: boolean;
}

const RmiModal: React.FC<RmiModalProps> = ({
  isOpen,
  onClose,
  instructor,
  periodo,
  fichas,
  onRefresh,
  readOnlyAsociacion,
  actividades = [],
  onAceptar,
  onRechazar,
  onRevertir,
  disableActionRmi
}) => {
  if (!isOpen) return null;

  const { persona } = instructor;
  const fullName =
    `${persona.nombre1} ${persona.nombre2 ?? ''} ${persona.apellido1} ${persona.apellido2 ?? ''}`.trim();

  const totalHorasFormacion = fichas.reduce((accFicha, ficha) => {
    return accFicha + (ficha.resultados?.reduce((accResult: any, r: any) => {
      return accResult + (r.horarios?.reduce((accHorario: any, h: any) => {
        return accHorario + Number(h.duracionHoras || 0);
      }, 0) || 0);
    }, 0) || 0);
  }, 0);

  const totalOtrasActividades = actividades.reduce((sum, a) => sum + Number(a.numeroHoras || 0), 0);
  const totalHorasMes = totalHorasFormacion + totalOtrasActividades;

  const [calendarioOpen, setCalendarioOpen] = React.useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = React.useState<any>(null);
  const [fichaSeleccionada, setFichaSeleccionada] = React.useState<number>(0);

  const handleVerHorario = async (r: any, idFicha: number) => {
    try {
      const response = await axios.get(`horario/ficha/${idFicha}`);
      const todos = response.data.data || [];

      const filtrados = todos.filter(
        (h: any) =>
          Number(h.idGradoMateria) === Number(r.idGradoMateria) &&
          Number(h.idContrato) === Number(instructor.idContrato)
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

  const [loadingAssociation, setLoadingAssociation] = React.useState<number | null>(null);

  const handleEstadoAsociacion = async (idGradoMateria: number, estado: boolean) => {
    setLoadingAssociation(idGradoMateria);
    try {
      const res = await axios.patch(`set-estado-asociacion/${idGradoMateria}`, { estado });
      enqueueSnackbar(res.data.message || 'Estado de asociación actualizado correctamente', {
        variant: 'success'
      });
      onRefresh?.();
    } catch (error) {
      enqueueSnackbar('Error al actualizar el estado de asociación', { variant: 'error' });
    } finally {
      setLoadingAssociation(null);
    }
  };

  // nuevos helpers para correccion de reeemplazos en el excel
  const toNum = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return y * 10000 + m * 100 + d;
  };

  const intersectar = (aIni: number, aFin: number, bIni: number, bFin: number) => {
    const ini = Math.max(aIni, bIni);
    const fin = Math.min(aFin, bFin);
    return ini <= fin ? { ini, fin } : null;
  };

  type Segmento = {
    horario: any;
    desde: number; // yyyymmdd
    hasta: number;
    origen: 'DIRECTO' | 'COMPARTIDO' | 'REEMPLAZO';
    reemplazaA?: string;
  };

  const construirSegmentos = (
    todos: any[],
    idGradoMateria: number,
    idContratoInstructor: number
  ): Segmento[] => {
    const segmentos: Segmento[] = [];

    const horariosDelGrado = todos.filter(
      (h: any) => Number(h.idGradoMateria) === Number(idGradoMateria) && h.estado !== 'PENDIENTE'
    );

    horariosDelGrado.forEach((h: any) => {
      const fIniHorario = toNum(h.fechaInicial || h.fechaInicio);
      const fFinHorario = toNum(h.fechaFinal || h.fechaFin);
      const asignaciones = h.asignacionSesion || [];

      const esTitular = Number(h.idContrato) === Number(idContratoInstructor);

      if (esTitular) {
        // Restamos los tramos donde OTRO contrato lo reemplazó
        const reemplazosDeOtros = asignaciones.filter(
          (a: any) =>
            a.tipoAsignacion === 'REEMPLAZO' && Number(a.idContrato) !== Number(idContratoInstructor)
        );

        let libres: { ini: number; fin: number }[] = [{ ini: fIniHorario, fin: fFinHorario }];

        reemplazosDeOtros.forEach((a: any) => {
          const rIni = toNum(a.fechaInicio);
          const rFin = toNum(a.fechaFin);
          const nuevos: { ini: number; fin: number }[] = [];
          libres.forEach(({ ini, fin }) => {
            if (rFin < ini || rIni > fin) {
              nuevos.push({ ini, fin });
              return;
            }
            if (rIni > ini) nuevos.push({ ini, fin: rIni - 1 });
            if (rFin < fin) nuevos.push({ ini: rFin + 1, fin });
          });
          libres = nuevos;
        });

        libres.forEach(({ ini, fin }) => {
          if (ini <= fin) segmentos.push({ horario: h, desde: ini, hasta: fin, origen: 'DIRECTO' });
        });
      }

      // Tramos donde el instructor participa como compartido o reemplazo
      asignaciones
        .filter((a: any) => Number(a.idContrato) === Number(idContratoInstructor))
        .forEach((a: any) => {
          const rango = intersectar(toNum(a.fechaInicio), toNum(a.fechaFin), fIniHorario, fFinHorario);
          if (!rango) return;

          let reemplazaA: string | undefined;
          if (a.tipoAsignacion === 'REEMPLAZO' && h.contrato?.persona) {
            const p = h.contrato.persona;
            reemplazaA = `${p.nombre1} ${p.apellido1}`.trim();
          }

          segmentos.push({
            horario: h,
            desde: rango.ini,
            hasta: rango.fin,
            origen: a.tipoAsignacion === 'REEMPLAZO' ? 'REEMPLAZO' : 'COMPARTIDO',
            reemplazaA
          });
        });
    });

    return segmentos;
  };

  const handleExportExcel = useCallback(async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('RMI', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
      });

      // ── Colores ──
      const AZUL_HEADER = 'FF1F4E79';
      const AZUL_CLARO = 'FF9DC3E6';
      const AMARILLO = 'FFFFFF00';
      const VERDE = 'FF92D050';
      const BLANCO = 'FFFFFFFF';
      const NEGRO = 'FF000000';
      const GRIS_BORDE = 'FF000000';

      // ── Anchos de columna ──
      worksheet.columns = [
        { key: 'A', width: 13 },
        { key: 'B', width: 9.16 },
        { key: 'C', width: 30 },
        { key: 'D', width: 13 },
        { key: 'E', width: 13 },
        { key: 'F', width: 35 },
        { key: 'G', width: 20.66 },
        { key: 'H', width: 10 },
        { key: 'I', width: 13 },
        { key: 'J', width: 13 },
        { key: 'K', width: 13 },
        { key: 'L', width: 13 },
        { key: 'M', width: 13 },
        { key: 'N', width: 13 },
        { key: 'O', width: 4 },
        { key: 'P', width: 13 },
        { key: 'Q', width: 13 },
        { key: 'R', width: 13 },
        { key: 'S', width: 13 },
        { key: 'T', width: 13 },
        { key: 'U', width: 13 }
      ];

      // ── Helpers ──
      const borderThin: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: GRIS_BORDE } },
        bottom: { style: 'thin', color: { argb: GRIS_BORDE } },
        left: { style: 'thin', color: { argb: GRIS_BORDE } },
        right: { style: 'thin', color: { argb: GRIS_BORDE } }
      };
      const fillSolid = (argb: string): ExcelJS.Fill => ({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb }
      });
      const fontBold = (size = 9, color = NEGRO): Partial<ExcelJS.Font> => ({
        bold: true,
        size,
        color: { argb: color },
        name: 'Calibri'
      });
      const fontNormal = (size = 8, color = NEGRO): Partial<ExcelJS.Font> => ({
        bold: false,
        size,
        color: { argb: color },
        name: 'Calibri'
      });
      const alignCenter: Partial<ExcelJS.Alignment> = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      const alignLeft: Partial<ExcelJS.Alignment> = {
        horizontal: 'left',
        vertical: 'middle',
        wrapText: true
      };

      const styleCell = (
        cell: ExcelJS.Cell,
        opts: {
          value?: any;
          fill?: string;
          font?: Partial<ExcelJS.Font>;
          alignment?: Partial<ExcelJS.Alignment>;
          border?: Partial<ExcelJS.Borders>;
        }
      ) => {
        if (opts.value !== undefined) cell.value = opts.value;
        if (opts.fill) cell.fill = fillSolid(opts.fill);
        if (opts.font) cell.font = opts.font;
        if (opts.alignment) cell.alignment = opts.alignment;
        if (opts.border) cell.border = opts.border;
      };

      // ── Año y mes ──
      let targetYear = new Date().getFullYear();
      let targetMonth = new Date().getMonth() + 1;
      if (periodo && /^\d{4}-\d{2}$/.test(periodo)) {
        const [y, m] = periodo.split('-');
        targetYear = parseInt(y);
        targetMonth = parseInt(m);
      }

      const nombresMeses = [
        'ENERO',
        'FEBRERO',
        'MARZO',
        'ABRIL',
        'MAYO',
        'JUNIO',
        'JULIO',
        'AGOSTO',
        'SEPTIEMBRE',
        'OCTUBRE',
        'NOVIEMBRE',
        'DICIEMBRE'
      ];
      const nombreMes = nombresMeses[targetMonth - 1];
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

      // Matriz de semanas L-S sin domingo
      const calMatrix: (number | null)[][] = [];
      let currentWeek: (number | null)[] = [null, null, null, null, null, null];
      for (let d = 1; d <= daysInMonth; d++) {
        const dow = new Date(targetYear, targetMonth - 1, d).getDay();
        if (dow === 0) continue;
        const ci = dow - 1;
        currentWeek[ci] = d;
        if (ci === 5 || d === daysInMonth) {
          calMatrix.push([...currentWeek]);
          currentWeek = [null, null, null, null, null, null];
        }
      }

      const BLOCK_SIZE = Math.max(calMatrix.length, 5);
      const CAL_COLS = ['O', 'P', 'Q', 'R', 'S', 'T'];
      const mapDiaCols: Record<number, string> = {
        1: 'H',
        2: 'I',
        3: 'J',
        4: 'K',
        5: 'L',
        6: 'M',
        7: 'N'
      };

      // ════════════════════════════════════════
      // LOGO SENA
      // ════════════════════════════════════════
      const logoResponse = await fetch(logoSenaExcel);
      const logoArrayBuffer = await logoResponse.arrayBuffer();
      const uint8Array = new Uint8Array(logoArrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const logoId = workbook.addImage({
        base64: btoa(binary),
        extension: 'png'
      });

      // ════════════════════════════════════════
      // FILA 1 — Título
      // ════════════════════════════════════════
      worksheet.mergeCells('A1:U1');
      styleCell(worksheet.getCell('A1'), {
        value: 'REPORTE MENSUAL DEL INSTRUCTOR - RMI',
        fill: AZUL_HEADER,
        font: fontBold(12, BLANCO),
        alignment: alignCenter,
        border: borderThin
      });
      worksheet.getRow(1).height = 24;

      // ════════════════════════════════════════
      // FILAS 2-5 — Encabezado instructor
      // ════════════════════════════════════════
      worksheet.mergeCells('A2:A5');
      styleCell(worksheet.getCell('A2'), { fill: BLANCO, border: borderThin });
      worksheet.addImage(logoId, {
        tl: { col: 0, row: 1 } as any,
        br: { col: 1, row: 5 } as any,
        editAs: 'oneCell'
      });

      worksheet.mergeCells('B2:E5');
      styleCell(worksheet.getCell('B2'), {
        value: 'CENTRO DE TELEINFORMÁTICA Y PRODUCCIÓN INDUSTRIAL',
        fill: BLANCO,
        font: fontBold(9),
        alignment: alignCenter,
        border: borderThin
      });

      worksheet.mergeCells('F2:F5');
      styleCell(worksheet.getCell('F2'), {
        value: periodo || nombreMes,
        fill: AZUL_CLARO,
        font: fontBold(16),
        alignment: alignCenter,
        border: borderThin
      });

      worksheet.mergeCells('G2:N2');
      styleCell(worksheet.getCell('G2'), {
        value: 'NOMBRE',
        fill: AZUL_HEADER,
        font: fontBold(9, BLANCO),
        alignment: alignCenter,
        border: borderThin
      });
      worksheet.mergeCells('O2:U2');
      styleCell(worksheet.getCell('O2'), {
        value: 'CORREO ELECTRÓNICO',
        fill: AZUL_HEADER,
        font: fontBold(9, BLANCO),
        alignment: alignCenter,
        border: borderThin
      });

      worksheet.mergeCells('G3:N3');
      styleCell(worksheet.getCell('G3'), {
        value: fullName,
        fill: BLANCO,
        font: fontBold(10),
        alignment: alignCenter,
        border: borderThin
      });
      worksheet.mergeCells('O3:U3');
      styleCell(worksheet.getCell('O3'), {
        value: persona.email,
        fill: BLANCO,
        font: fontNormal(9),
        alignment: alignCenter,
        border: borderThin
      });

      worksheet.mergeCells('G4:N4');
      styleCell(worksheet.getCell('G4'), {
        value: 'CÉDULA',
        fill: AZUL_HEADER,
        font: fontBold(9, BLANCO),
        alignment: alignCenter,
        border: borderThin
      });
      worksheet.mergeCells('O4:U4');
      styleCell(worksheet.getCell('O4'), {
        value: 'NÚMERO DE CONTACTO',
        fill: AZUL_HEADER,
        font: fontBold(9, BLANCO),
        alignment: alignCenter,
        border: borderThin
      });

      worksheet.mergeCells('G5:N5');
      styleCell(worksheet.getCell('G5'), {
        value: persona.identificacion,
        fill: BLANCO,
        font: fontBold(10),
        alignment: alignCenter,
        border: borderThin
      });
      worksheet.mergeCells('O5:U5');
      styleCell(worksheet.getCell('O5'), {
        value: persona.celular,
        fill: BLANCO,
        font: fontBold(10),
        alignment: alignCenter,
        border: borderThin
      });

      worksheet.getRow(2).height = 21;
      worksheet.getRow(3).height = 24;
      worksheet.getRow(4).height = 21;
      worksheet.getRow(5).height = 24;

      // ════════════════════════════════════════
      // FILA 6 — Separador
      // ════════════════════════════════════════
      worksheet.mergeCells('A6:U6');
      styleCell(worksheet.getCell('A6'), { fill: AZUL_HEADER, border: borderThin });
      worksheet.getRow(6).height = 23;

      // ════════════════════════════════════════
      // FILA 7 — Encabezado tabla
      // ════════════════════════════════════════
      const headerCells: [string, string, string][] = [
        ['A7', 'A7', 'No'],
        ['B7', 'B7', 'No.\nFICHA'],
        ['C7', 'C7', 'PROGRAMA DE FORMACIÓN'],
        ['D7', 'D7', 'ACTIVIDAD'],
        ['E7', 'E7', 'COMPETENCIA'],
        ['F7', 'F7', 'RESULTADO APRENDIZAJE'],
        ['G7', 'G7', 'FECHA TERMINACIÓN\nRESULTADO DE\nAPRENDIZAJE'],
        ['H7', 'N7', 'HORARIO\nFormato 24 horas'],
        ['O7', 'T7', nombreMes],
        ['U7', 'U7', 'HORAS\nMES']
      ];
      headerCells.forEach(([from, to, val]) => {
        if (from !== to) worksheet.mergeCells(`${from}:${to}`);
        styleCell(worksheet.getCell(from), {
          value: val,
          fill: AZUL_HEADER,
          font: fontBold(9, BLANCO),
          alignment: alignCenter,
          border: borderThin
        });
      });
      worksheet.getRow(7).height = 44;

      // ════════════════════════════════════════
      // FILA 8 — Sub-encabezado días
      // ════════════════════════════════════════
      ['H', 'I', 'J', 'K', 'L', 'M', 'N'].forEach((col, i) => {
        styleCell(worksheet.getCell(`${col}8`), {
          value: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i],
          fill: AZUL_CLARO,
          font: fontBold(8),
          alignment: alignCenter,
          border: borderThin
        });
      });
      ['O', 'P', 'Q', 'R', 'S', 'T'].forEach((col, i) => {
        styleCell(worksheet.getCell(`${col}8`), {
          value: ['L', 'M', 'M', 'J', 'V', 'S'][i],
          fill: AZUL_CLARO,
          font: fontBold(8),
          alignment: alignCenter,
          border: borderThin
        });
      });
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'U'].forEach((col) => {
        styleCell(worksheet.getCell(`${col}8`), { fill: AZUL_HEADER, border: borderThin });
      });
      worksheet.getRow(8).height = 16;

      // ════════════════════════════════════════
      // Precargar horarios
      // ════════════════════════════════════════
      const horariosPorFicha: Record<number, any[]> = {};
      for (const ficha of fichas) {
        try {
          const res = await axios.get(`horario/ficha/${ficha.idFicha}`);
          horariosPorFicha[ficha.idFicha] = res.data?.data || [];
        } catch {
          horariosPorFicha[ficha.idFicha] = [];
        }
      }

      // Aplanar fichas + resultados
      const filas: { ficha: any; r: any; fichaIdx: number; rIdx: number }[] = [];
      for (let fichaIdx = 0; fichaIdx < fichas.length; fichaIdx++) {
        for (let rIdx = 0; rIdx < fichas[fichaIdx].resultados.length; rIdx++) {
          filas.push({
            ficha: fichas[fichaIdx],
            r: fichas[fichaIdx].resultados[rIdx],
            fichaIdx,
            rIdx
          });
        }
      }

      // ════════════════════════════════════════
      // BLOQUES DE DATOS
      // ════════════════════════════════════════
      const DATA_START = 9;

      for (let bloqueIdx = 0; bloqueIdx < filas.length; bloqueIdx++) {
        const { ficha, r, fichaIdx, rIdx } = filas[bloqueIdx];
        const startRow = DATA_START + bloqueIdx * BLOCK_SIZE;
        const endRow = startRow + BLOCK_SIZE - 1;

        // Fondo base
        for (let row = startRow; row <= endRow; row++) {
          for (let col = 1; col <= 21; col++) {
            styleCell(worksheet.getCell(row, col), { fill: BLANCO, border: borderThin });
          }
          worksheet.getRow(row).height = 14;
        }

        // Merge columnas de datos verticales
        const MERGE_COLS = [
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
          'I',
          'J',
          'K',
          'L',
          'M',
          'N',
          'U'
        ];
        MERGE_COLS.forEach((col) => {
          worksheet.mergeCells(`${col}${startRow}:${col}${endRow}`);
          styleCell(worksheet.getCell(`${col}${startRow}`), {
            fill: BLANCO,
            font: fontNormal(8),
            alignment: alignCenter,
            border: borderThin
          });
        });

        // Amarillo B y C
        styleCell(worksheet.getCell(`B${startRow}`), {
          fill: AMARILLO,
          font: fontBold(9),
          alignment: alignCenter
        });
        styleCell(worksheet.getCell(`C${startRow}`), {
          fill: AMARILLO,
          font: fontBold(9),
          alignment: alignCenter
        });

        // Datos de ficha
        if (rIdx === 0) {
          worksheet.getCell(`A${startRow}`).value = fichaIdx + 1;
          worksheet.getCell(`B${startRow}`).value = ficha.codigoFicha;
          worksheet.getCell(`C${startRow}`).value = ficha.programaFormacion;
        }
        worksheet.getCell(`E${startRow}`).value = r.competencia || '';
        worksheet.getCell(`E${startRow}`).alignment = alignLeft;
        worksheet.getCell(`F${startRow}`).value = r.resultadoAprendizaje || '';
        worksheet.getCell(`F${startRow}`).alignment = alignLeft;
        worksheet.getCell(`G${startRow}`).value = r.fechaTerminacion || '';

        // ── Horarios ──
        const todos = horariosPorFicha[ficha.idFicha] || [];

        const segmentos = construirSegmentos(todos, r.idGradoMateria, instructor.idContrato);
        
        let horasMesTotal = 0;
        const classDates = new Set<number>();
        const horariosPorDia: Record<string, string[]> = {};

        segmentos.forEach((seg) => {
          const h = seg.horario;
          const horaIni = h.horaInicio || h.horaInicial;
          const horaFin = h.horaFin || h.horaFinal;
          if (!horaIni || !horaFin) return;
        
          const colDia = mapDiaCols[h.idDia];
          if (colDia) {
            if (!horariosPorDia[colDia]) horariosPorDia[colDia] = [];
            const etiqueta = `${horaIni} - ${horaFin}`;
            if (!horariosPorDia[colDia].includes(etiqueta)) {
              horariosPorDia[colDia].push(etiqueta);
            }
          }
        
          const [hI, mI] = horaIni.toString().split(':').map(Number);
          const [hF, mF] = horaFin.toString().split(':').map(Number);
          const sessionHours = (hF * 60 + mF - (hI * 60 + mI)) / 60;
        
          const jsDayRequired = Number(h.idDia) === 7 ? 0 : Number(h.idDia);
          for (let i = 1; i <= daysInMonth; i++) {
            const isDay = new Date(targetYear, targetMonth - 1, i).getDay() === jsDayRequired;
            const cur = targetYear * 10000 + targetMonth * 100 + i;
            if (isDay && cur >= seg.desde && cur <= seg.hasta) {
              classDates.add(i);
              horasMesTotal += sessionHours;
            }
          }
        });

        Object.entries(horariosPorDia).forEach(([colDia, horarios]) => {
          const cell = worksheet.getCell(`${colDia}${startRow}`);
          cell.value = horarios.join('\n');
          cell.alignment = alignCenter;
          cell.font = fontNormal(8);
        });

        // ── Calendario ──
        for (let w = 0; w < calMatrix.length; w++) {
          for (let c = 0; c < 6; c++) {
            const dayDate = calMatrix[w][c];
            const cell = worksheet.getCell(`${CAL_COLS[c]}${startRow + w}`);
            if (dayDate) {
              cell.value = dayDate;
              cell.alignment = alignCenter;
              cell.font = classDates.has(dayDate) ? fontBold(8, BLANCO) : fontNormal(8);
              cell.fill = classDates.has(dayDate) ? fillSolid(VERDE) : fillSolid(BLANCO);
              cell.border = borderThin;
            } else {
              cell.value = '';
              cell.fill = fillSolid(BLANCO);
              cell.border = borderThin;
            }
          }
        }

        worksheet.getCell(`U${startRow}`).value = horasMesTotal;
        worksheet.getCell(`U${startRow}`).font = fontBold(10);
        worksheet.getCell(`U${startRow}`).alignment = alignCenter;
      }

      // ════════════════════════════════════════
      // TOTAL HORAS FORMACIÓN MES
      // ════════════════════════════════════════
      const totalRow = DATA_START + filas.length * BLOCK_SIZE;
      worksheet.mergeCells(`O${totalRow}:T${totalRow}`);
      styleCell(worksheet.getCell(`O${totalRow}`), {
        value: 'TOTAL HORAS FORMACIÓN MES',
        fill: AZUL_CLARO,
        font: fontBold(9),
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: borderThin
      });
      styleCell(worksheet.getCell(`U${totalRow}`), {
        value: { formula: `SUM(U${DATA_START}:U${totalRow - 1})` },
        fill: AZUL_CLARO,
        font: fontBold(11),
        alignment: alignCenter,
        border: borderThin
      });
      worksheet.getRow(totalRow).height = 37.5;
      // ════════════════════════════════════════
      // OTRAS ACTIVIDADES — datos reales
      // ════════════════════════════════════════
      const otraStart = totalRow + 1;
      const MAX_OTRAS = Math.max(actividades.length, 6); // mínimo 6 filas

      worksheet.mergeCells(`A${otraStart}:B${otraStart + MAX_OTRAS - 1}`);
      styleCell(worksheet.getCell(`A${otraStart}`), {
        value: 'OTRAS ACTIVIDADES',
        fill: AZUL_CLARO,
        font: fontBold(10),
        alignment: alignCenter,
        border: borderThin
      });

      // Encabezados
      worksheet.mergeCells(`C${otraStart}:E${otraStart}`);
      styleCell(worksheet.getCell(`C${otraStart}`), {
        value: 'ACTIVIDAD',
        fill: AZUL_HEADER,
        font: fontBold(9, BLANCO),
        alignment: alignCenter,
        border: borderThin
      });
      worksheet.mergeCells(`F${otraStart}:K${otraStart}`);
      styleCell(worksheet.getCell(`F${otraStart}`), {
        value: 'DESCRIPCIÓN',
        fill: AZUL_HEADER,
        font: fontBold(9, BLANCO),
        alignment: alignCenter,
        border: borderThin
      });
      styleCell(worksheet.getCell(`L${otraStart}`), {
        value: 'HORAS',
        fill: AZUL_HEADER,
        font: fontBold(9, BLANCO),
        alignment: alignCenter,
        border: borderThin
      });

      // Columna HORAS OTRAS ACTIVIDADES (suma)
      const totalOtras = actividades.reduce((s, a) => s + Number(a.numeroHoras || 0), 0);
      worksheet.mergeCells(`M${otraStart}:M${otraStart + MAX_OTRAS - 1}`);
      styleCell(worksheet.getCell(`M${otraStart}`), {
        value: 'HORAS\nOTRAS\nACTIVIDADES',
        fill: AZUL_CLARO,
        font: fontBold(8),
        alignment: alignCenter,
        border: borderThin
      });

      worksheet.mergeCells(`N${otraStart}:N${otraStart + MAX_OTRAS - 1}`);
      styleCell(worksheet.getCell(`N${otraStart}`), {
        value: totalOtras,
        fill: AZUL_CLARO,
        font: fontBold(11),
        alignment: alignCenter,
        border: borderThin
      });

      worksheet.mergeCells(`O${otraStart}:T${otraStart + MAX_OTRAS - 1}`);
      styleCell(worksheet.getCell(`O${otraStart}`), {
        value: 'TOTAL HORAS MES',
        fill: AZUL_CLARO,
        font: fontBold(10),
        alignment: alignCenter,
        border: borderThin
      });

      // Total horas mes = formación + otras actividades
      const totalFormacion =
        filas.length > 0 ? { formula: `SUM(U${DATA_START}:U${totalRow - 1})` } : 0;

      worksheet.mergeCells(`U${otraStart}:U${otraStart + MAX_OTRAS - 1}`);
      styleCell(worksheet.getCell(`U${otraStart}`), {
        value: { formula: `U${totalRow}+${totalOtras}` }, // suma horas formación + otras
        fill: AZUL_CLARO,
        font: fontBold(11),
        alignment: alignCenter,
        border: borderThin
      });

      // Filas de datos de actividades
      for (let i = 0; i < MAX_OTRAS; i++) {
        const row = otraStart + (i === 0 ? 1 : i); // fila 1 es encabezado
        const act = actividades[i - 1]; // i=0 es encabezado, datos desde i=1

        if (i === 0) continue; // saltar fila de encabezados

        const dataRow = otraStart + i;
        worksheet.mergeCells(`C${dataRow}:E${dataRow}`);
        worksheet.mergeCells(`F${dataRow}:K${dataRow}`);

        styleCell(worksheet.getCell(`C${dataRow}`), {
          value: act ? `Actividad ${i}` : '',
          fill: BLANCO,
          font: fontNormal(8),
          alignment: alignCenter,
          border: borderThin
        });
        styleCell(worksheet.getCell(`F${dataRow}`), {
          value: act ? act.descripcion : '',
          fill: BLANCO,
          font: fontNormal(8),
          alignment: alignLeft,
          border: borderThin
        });
        styleCell(worksheet.getCell(`L${dataRow}`), {
          value: act ? act.numeroHoras : '',
          fill: BLANCO,
          font: fontNormal(8),
          alignment: alignCenter,
          border: borderThin
        });
        worksheet.getRow(dataRow).height = 14;
      }
      worksheet.getRow(otraStart).height = 26;

      // ── Descargar ──
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const fecha = new Date().toISOString().split('T')[0];
      saveAs(blob, `RMI_${fullName.replace(/\s+/g, '_')}_${fecha}.xlsx`);
    } catch (error) {
      console.error('Error al generar el RMI:', error);
      alert(`Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }, [fichas, fullName, persona, periodo, instructor]);

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
                {periodo && <p className="text-xs text-gray-500 dark:text-gray-400">{periodo}</p>}
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
                <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-coal-300">
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
                  <div className="divide-y divide-gray-200 dark:divide-coal-300 bg-blue-50/50 dark:bg-blue-500/5">
                    <div className="px-4 py-2">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-semibold">
                        Horas Formación
                      </p>
                      <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                        {totalHorasFormacion}h
                      </p>
                    </div>
                    <div className="px-4 py-2">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-semibold">
                        Otras Act. / Total
                      </p>
                      <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                        {totalOtrasActividades}h / <span className="text-primary font-black">{totalHorasMes}h</span>
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
                        <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">
                          No.
                        </th>
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
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                          HORAS
                        </th>
                        <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">
                          ASOCIADO
                        </th>
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
                              {r.esCompartida && (
                                <div className="mt-1 flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1 w-fit text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                    <i className="ki-outline ki-users text-[10px]" /> Compartida
                                  </span>
                                  {r.compartidoCon?.length > 0 && (
                                    <span className="text-[10px] text-gray-500 italic block leading-tight">
                                      con {r.compartidoCon.join(', ')}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-coal-300">
                              {r.resultadoAprendizaje ?? (
                                <span className="text-gray-400 italic">Sin RAP</span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {r.horarios.reduce(
                                (acc: any, r: any) => acc + Number(r.duracionHoras || 0),
                                0
                              )}
                              h
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="switch">
                                <input
                                  type="checkbox"
                                  checked={r.estadoAsociacion}
                                  title="Asociado en Sofía Plus"
                                  onChange={(e) =>
                                    handleEstadoAsociacion(r.idGradoMateria, e.target.checked)
                                  }
                                  disabled={
                                    loadingAssociation === r.idGradoMateria || readOnlyAsociacion
                                  }
                                />
                              </div>
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
            {/* ── Otras Actividades ── */}
            {actividades.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-3">
                  Otras Actividades
                </h3>
                <div className="rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="px-3 py-2 text-left font-semibold">Descripción</th>
                        <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">
                          Fecha Inicial
                        </th>
                        <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">
                          Fecha Final
                        </th>
                        <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">
                          N° Horas
                        </th>
                        <th className="px-3 py-2 text-center font-semibold">Documento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividades.map((act, idx) => (
                        <tr
                          key={act.id}
                          className={`border-t border-gray-200 dark:border-coal-300 ${
                            idx % 2 === 0
                              ? 'bg-white dark:bg-coal-500'
                              : 'bg-blue-50/40 dark:bg-blue-900/10'
                          }`}
                        >
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                            {act.descripcion}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {act.fechaInicial?.slice(0, 10) ?? '-'}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {act.fechaFinal?.slice(0, 10) ?? '-'}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-gray-800 dark:text-white">
                            {act.numeroHoras}h
                          </td>
                          <td className="px-3 py-2 text-center">
                            {act.rutaDocumentoUrl ? (
                              <a
                                href={act.rutaDocumentoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-md hover:bg-green-100 transition-colors"
                              >
                                <i className="ki-outline ki-document text-sm" /> Ver
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">Sin documento</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Fila total */}
                      <tr className="border-t-2 border-primary bg-blue-50 dark:bg-blue-500/10">
                        <td
                          colSpan={3}
                          className="px-3 py-2 text-right font-bold text-gray-700 dark:text-gray-300"
                        >
                          Total horas otras actividades:
                        </td>
                        <td className="px-3 py-2 text-center font-black text-primary text-sm">
                          {actividades.reduce((sum, a) => sum + Number(a.numeroHoras || 0), 0)}h
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-3 border-t border-gray-100 dark:border-coal-300 bg-white dark:bg-coal-500 flex justify-end gap-2 shrink-0">
            {instructor.estado === 'PENDIENTE' && onAceptar && onRechazar && (
              <>
                <button
                  onClick={onAceptar}
                  className="flex items-center gap-2 px-4 py-2 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all"
                  disabled={disableActionRmi}
                >
                  {!disableActionRmi ? (
                    <i className="ki-outline ki-check-circle text-base" />
                  ) : (
                    <i className="ki-outline ki-loading text-base animate-spin" />
                  )}
                  Aceptar
                </button>
                <button
                  onClick={onRechazar}
                  className="flex items-center gap-2 px-4 py-2 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                  disabled={disableActionRmi}
                >
                  {!disableActionRmi ? (
                    <i className="ki-outline ki-cross-circle text-base" />
                  ) : (
                    <i className="ki-outline ki-loading text-base animate-spin" />
                  )}
                  Rechazar
                </button>
              </>
            )}

            {(instructor.estado === 'ACEPTADO' || instructor.estado === 'RECHAZADO') && onRevertir && (
              <button
                onClick={onRevertir}
                className="flex items-center gap-2 px-4 py-2 text-xs bg-yellow-50 hover:bg-yellow-100 font-semibold text-yellow-700 dark:text-yellow-400 dark:bg-yellow-500/10 rounded-lg transition-all"
                disabled={disableActionRmi}
              >
                {!disableActionRmi ? (
                  <i className="ki-outline ki-arrow-circle-left text-base" />
                ) : (
                  <i className="ki-outline ki-loading text-base animate-spin" />
                )}
                Revertir
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all"
            >
              <i className="ki-outline ki-file-down text-base" /> Exportar Excel
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-xs bg-gray-50 hover:bg-gray-100 font-semibold text-gray-700 dark:text-gray-400 dark:bg-coal-400 dark:hover:bg-coal-300 rounded-lg transition-all border border-gray-200 dark:border-coal-300"
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

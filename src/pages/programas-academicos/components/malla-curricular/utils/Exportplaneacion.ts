import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import axios from 'axios';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Materia {
  id: number;
  nombre: string | null;
  idMateriaPadre: number | null;
  hijas?: { id: number; nombre: string | null }[];
}

interface FaseProyectoRap {
  id: number;
  materia: Materia;
  idMateriaPadre: number | null;
}

interface Actividad {
  id: number;
  descripcionActividad: string;
  faseProyectoRap: FaseProyectoRap[];
}

interface Fase {
  id: number;
  descripcionFase: string;
  actividades: Actividad[];
  rapsGenerales: FaseProyectoRap[];
}

interface ProyectoFormativoData {
  proyectoFormativo: { id: number; nombre: string | null };
  fasesProyecto: Fase[];
}

interface FichaInfo {
  id: number;
  codigo: string;
  instructorLider?: string;
  jornada?: string;
  programa?: string;
}

// ─── Colores (ARGB) ───────────────────────────────────────────────────────────

const COLOR = {
  headerBg: 'FF92D050', // verde cabecera columnas
  faseBg: 'FFCCFFCC', // verde claro - fase de proyecto
  actividadBg: 'FFFFFFFF', // blanco - actividad
  rapBg: 'FFFFFFFF', // blanco - RAP
  titleRed: 'FFFF0000', // rojo título lateral
  borderColor: 'FF000000',
  headerText: 'FF000000',
  estadoBg: 'FF92D050'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BorderStyle = 'thin' | 'medium' | 'thick';

function border(style: BorderStyle = 'thin'): ExcelJS.Border {
  return { style, color: { argb: COLOR.borderColor } };
}

function allBorders(style: BorderStyle = 'thin'): Partial<ExcelJS.Borders> {
  const b = border(style);
  return { top: b, left: b, bottom: b, right: b };
}

function applyBorderToRange(
  ws: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  style: BorderStyle = 'thin'
) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(r, c);
      cell.border = allBorders(style);
    }
  }
}

function setCell(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: string | number | null,
  options: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    color?: string;
    bgColor?: string;
    hAlign?: ExcelJS.Alignment['horizontal'];
    vAlign?: ExcelJS.Alignment['vertical'];
    wrapText?: boolean;
    underline?: boolean;
  } = {}
) {
  const cell = ws.getCell(row, col);
  cell.value = value ?? '';
  cell.font = {
    name: 'Arial',
    size: options.size ?? 8,
    bold: options.bold ?? false,
    italic: options.italic ?? false,
    underline: options.underline ?? false,
    color: { argb: options.color ?? COLOR.headerText }
  };
  cell.alignment = {
    horizontal: options.hAlign ?? 'center',
    vertical: options.vAlign ?? 'middle',
    wrapText: options.wrapText ?? true
  };
  if (options.bgColor) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: options.bgColor } };
  }
}

// ─── Exportación principal ────────────────────────────────────────────────────

export async function exportarPlaneacionExcel(ficha: FichaInfo): Promise<void> {
  // 1. Fetch datos
  const { data }: { data: ProyectoFormativoData } = await axios.get(
    `/fichapry/${ficha.id}/proyecto-formativo`
  );

  const { proyectoFormativo, fasesProyecto } = data;

  // 2. Workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = 'VT School';
  wb.created = new Date();

  const ws = wb.addWorksheet('Planeación', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  // ─── Anchos de columna ────────────────────────────────────────────────────
  const colWidths = [14, 22, 30, 42, 8, 7, 9, 18, 8, 8, 16, 12, 12, 10];
  colWidths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // ─── Fila 1: info ficha ───────────────────────────────────────────────────
  ws.mergeCells('A1:B1');
  setCell(ws, 1, 1, `FICHA ${ficha.codigo}`, { bold: true, size: 9 });

  ws.mergeCells('C1:D1');
  setCell(ws, 1, 3, 'INSTRUCTOR LÍDER', { bold: true, size: 9 });

  ws.mergeCells('E1:H1');
  setCell(ws, 1, 5, ficha.instructorLider ?? '', { size: 9, hAlign: 'left' });

  // Título derecho - rojo
  ws.mergeCells('I1:N1');
  setCell(ws, 1, 9, 'PLANEACIÓN EJECUTÁNDOSE', {
    bold: true,
    size: 11,
    color: COLOR.titleRed,
    hAlign: 'right'
  });

  ws.getRow(1).height = 18;

  // ─── Fila 2: jornada + ficha + programa ──────────────────────────────────
  ws.mergeCells('A2:B2');
  setCell(ws, 2, 1, `JORNADA ${ficha.jornada ?? ''}`, { bold: true, size: 9 });

  ws.mergeCells('I2:N2');
  setCell(ws, 2, 9, `FICHA ${ficha.codigo}  ${ficha.programa ?? proyectoFormativo.nombre ?? ''}`, {
    bold: true,
    size: 11,
    color: COLOR.titleRed,
    hAlign: 'right'
  });

  ws.getRow(2).height = 18;

  // ─── Fila 3: encabezados ──────────────────────────────────────────────────
  const headers = [
    'FASE DE\nPROYECTO\nFORMATIVO',
    'ACTIVIDAD DE PROYECTO\nFORMATIVO (si el programa\nes titulada)',
    'COMPETENCIA',
    'RESULTADOS DE APRENDIZAJE',
    'TRIMESTRE',
    'HORAS',
    'NÚMERO DE\nSESIONES',
    'ACTIVIDAD DE\nAPRENDIZAJE',
    'TOTAL\nHORAS AL\n100%',
    'TOTAL\nHORAS AL\n80%',
    'INSTRUCTOR (A)',
    'FECHA DE\nINICIO',
    'FECHA FIN',
    'ESTADO'
  ];

  headers.forEach((h, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 8, bold: true, color: { argb: COLOR.headerText } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.headerBg } };
    cell.border = allBorders('medium');
  });

  ws.getRow(3).height = 42;

  // ─── Filas de datos ───────────────────────────────────────────────────────
  let currentRow = 4;

  for (const fase of fasesProyecto) {
    // Cada RAP puede ser padre (competencia) o hijo (resultado de aprendizaje).
    // El backend indica esto con idMateriaPadre: null => padre, !null => hijo.
    // Además, si una materia padre tiene hijas, se expande una fila por cada hija.
    const rapRows: Array<{
      actividadDesc: string | null;
      competencia: string | null;        // col 3 – materia padre
      resultadoAprendizaje: string | null; // col 4 – materia hija
      isFirst: boolean;
    }> = [];

    /** Convierte un RAP del backend en una o varias filas */
    function rapToRows(
      rap: FaseProyectoRap,
      actividadDesc: string | null,
      isFirstOfActivity: boolean
    ) {
      const mat = rap.materia;
      const esPadre = rap.idMateriaPadre === null;

      if (esPadre) {
        if (mat.hijas && mat.hijas.length > 0) {
          // Una fila por cada hija; la competencia aparece solo en la primera
          mat.hijas.forEach((hija, hijaIdx) => {
            rapRows.push({
              actividadDesc,
              competencia: hijaIdx === 0 ? (mat.nombre ?? null) : null,
              resultadoAprendizaje: hija.nombre ?? null,
              isFirst: isFirstOfActivity && hijaIdx === 0
            });
          });
        } else {
          // Padre sin hijas → solo competencia
          rapRows.push({
            actividadDesc,
            competencia: mat.nombre ?? null,
            resultadoAprendizaje: null,
            isFirst: isFirstOfActivity
          });
        }
      } else {
        // Materia hija directamente asignada → resultado de aprendizaje
        rapRows.push({
          actividadDesc,
          competencia: null,
          resultadoAprendizaje: mat.nombre ?? null,
          isFirst: isFirstOfActivity
        });
      }
    }

    if (fase.actividades.length === 0 && fase.rapsGenerales.length === 0) {
      rapRows.push({ actividadDesc: null, competencia: null, resultadoAprendizaje: null, isFirst: true });
    }

    // Procesar actividades
    for (const act of fase.actividades) {
      if (act.faseProyectoRap.length === 0) {
        rapRows.push({ actividadDesc: act.descripcionActividad, competencia: null, resultadoAprendizaje: null, isFirst: true });
      } else {
        act.faseProyectoRap.forEach((rap, idx) => {
          rapToRows(rap, act.descripcionActividad, idx === 0);
        });
      }
    }

    // Procesar RAPs generales (sin actividad)
    for (const rap of fase.rapsGenerales) {
      rapToRows(rap, null, true);
    }

    const faseStartRow = currentRow;
    const faseEndRow = currentRow + rapRows.length - 1;

    // ── Columna 1: FASE (merge vertical) ─────────────────────────────────
    if (rapRows.length > 1) {
      ws.mergeCells(faseStartRow, 1, faseEndRow, 1);
    }
    setCell(ws, faseStartRow, 1, fase.descripcionFase, {
      bold: true,
      size: 8,
      bgColor: COLOR.faseBg,
      hAlign: 'center',
      vAlign: 'middle',
      wrapText: true
    });

    // ── Agrupar actividades para merge ────────────────────────────────────
    interface ActGroup {
      desc: string | null;
      startRow: number;
      endRow: number;
    }
    const actGroups: ActGroup[] = [];
    let actStart = faseStartRow;
    let lastDesc: string | null | undefined = undefined;

    rapRows.forEach((r, i) => {
      const absRow = faseStartRow + i;
      if (r.actividadDesc !== lastDesc) {
        if (lastDesc !== undefined) {
          actGroups.push({ desc: lastDesc, startRow: actStart, endRow: absRow - 1 });
        }
        lastDesc = r.actividadDesc;
        actStart = absRow;
      }
      if (i === rapRows.length - 1) {
        actGroups.push({ desc: r.actividadDesc, startRow: actStart, endRow: absRow });
      }
    });

    // Escribir columna 2 (ACTIVIDAD) con merge por grupo
    for (const ag of actGroups) {
      if (ag.endRow > ag.startRow) {
        ws.mergeCells(ag.startRow, 2, ag.endRow, 2);
      }
      setCell(ws, ag.startRow, 2, ag.desc, {
        size: 8,
        hAlign: 'center',
        vAlign: 'middle',
        wrapText: true
      });
    }

    // ─── Escribir filas RAP ────────────────────────────────────────────────
    rapRows.forEach((r, i) => {
      const absRow = faseStartRow + i;
      ws.getRow(absRow).height = 28;

      // Col 3: COMPETENCIA (materia padre)
      setCell(ws, absRow, 3, r.competencia ?? '', {
        size: 8,
        hAlign: 'left',
        vAlign: 'middle',
        wrapText: true
      });

      // Col 4: RESULTADOS DE APRENDIZAJE (materia hija)
      setCell(ws, absRow, 4, r.resultadoAprendizaje ?? '', {
        size: 8,
        hAlign: 'left',
        vAlign: 'middle',
        wrapText: true
      });

      // Cols 5-13: vacías (se completan manualmente)
      for (let c = 5; c <= 13; c++) {
        setCell(ws, absRow, c, '', { size: 8 });
      }

      // Col 14: ESTADO con fondo verde
      setCell(ws, absRow, 14, '', { size: 8, bgColor: COLOR.estadoBg });
    });

    // Aplicar bordes a todo el bloque de la fase
    applyBorderToRange(ws, faseStartRow, faseEndRow, 1, 14);

    currentRow = faseEndRow + 1;
  }

  // ─── Guardar ──────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `Planeacion_Ficha_${ficha.codigo}.xlsx`);
}

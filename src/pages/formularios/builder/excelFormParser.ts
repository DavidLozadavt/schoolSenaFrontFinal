import * as XLSX from 'xlsx';
import type { FormData, FormOption, FormQuestion, QuestionType } from './formBuilderTypes';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  texto_corto: 'Texto corto',
  texto_largo: 'Texto largo',
  opcion_multiple: 'Opción múltiple',
  casillas: 'Casillas',
  desplegable: 'Desplegable',
  escala_lineal: 'Escala lineal',
  fecha: 'Fecha',
  hora: 'Hora',
  archivo: 'Archivo'
};

const OPTION_TYPES: QuestionType[] = ['opcion_multiple', 'casillas', 'desplegable'];

const normalize = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const cellText = (value: unknown): string => {
  if (value instanceof Date) return value.toLocaleDateString('es-CO');
  return String(value ?? '').trim();
};

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const splitOptions = (raw: string): string[] =>
  raw
    .split(/[;|,\n/]+/)
    .map((o) => o.trim().replace(/\.+$/, '').trim())
    .filter(Boolean)
    .map(capitalize);

const TYPE_ALIASES: Array<[QuestionType, string[]]> = [
  ['texto_largo', ['texto_largo', 'texto largo', 'largo', 'parrafo', 'textarea']],
  ['texto_corto', ['texto_corto', 'texto corto', 'texto', 'corto', 'text', 'correo', 'email', 'telefono']],
  ['casillas', ['casillas', 'casilla', 'checkbox', 'seleccion multiple', 'varias']],
  ['opcion_multiple', ['opcion_multiple', 'opcion multiple', 'opcion', 'radio', 'seleccion unica', 'unica']],
  ['desplegable', ['desplegable', 'lista', 'select', 'lista desplegable']],
  ['escala_lineal', ['escala_lineal', 'escala lineal', 'escala', 'calificacion']],
  ['fecha', ['fecha', 'date']],
  ['hora', ['hora', 'time']],
  ['archivo', ['archivo', 'adjunto', 'file', 'documento']]
];

/** "Número" se guarda como respuesta corta que solo admite dígitos (ver esSoloNumeros). */
export const NUMBER_TYPE_LABEL = 'Número';
const NUMBER_ALIASES = ['numero', 'numerico', 'solo numeros', 'number', 'entero', 'digitos'];

const typeFromAlias = (raw: unknown): QuestionType | null => {
  const key = normalize(raw);
  if (!key) return null;
  const match = TYPE_ALIASES.find(([, aliases]) => aliases.includes(key));
  return match ? match[0] : null;
};

/** Deduce el tipo de pregunta a partir del nombre del campo. */
const typeFromName = (label: string): QuestionType => {
  const name = normalize(label);
  if (/\bfecha\b|nacimiento/.test(name)) return 'fecha';
  if (/\bhora\b/.test(name)) return 'hora';
  if (/adjunt|archivo|soporte|certificado|\bfoto\b/.test(name)) return 'archivo';
  if (/observacion|comentario|descripcion|sugerencia|mensaje/.test(name)) return 'texto_largo';
  return 'texto_corto';
};

interface ParsedLabel {
  titulo: string;
  esObligatoria: boolean;
  opciones: string[];
}

/**
 * Interpreta un encabezado como "Cargo (coordinador, rector, docente) *":
 * el asterisco marca el campo como obligatorio y la lista entre paréntesis son sus opciones.
 */
const parseLabel = (raw: string): ParsedLabel => {
  let titulo = raw.trim();
  let esObligatoria = false;
  let opciones: string[] = [];

  if (/\*\s*$/.test(titulo)) {
    esObligatoria = true;
    titulo = titulo.replace(/\*\s*$/, '').trim();
  }

  const parens = titulo.match(/^(.*?)\(([^()]*)\)\s*$/);
  if (parens) {
    const candidates = splitOptions(parens[2]);
    if (candidates.length >= 2 && parens[1].trim()) {
      opciones = candidates;
      titulo = parens[1].trim();
    }
  }

  return { titulo: titulo.replace(/[:.]+$/, '').trim(), esObligatoria, opciones };
};

const buildQuestion = (
  index: number,
  titulo: string,
  tipo: QuestionType,
  esObligatoria: boolean,
  opciones: string[],
  descripcion?: string,
  soloNumeros = false
): FormQuestion => {
  const stamp = Date.now();
  const needsOptions = OPTION_TYPES.includes(tipo);
  const optionTexts = needsOptions && opciones.length === 0 ? ['Opción 1'] : opciones;
  const formOptions: FormOption[] = needsOptions
    ? optionTexts.map((texto, i) => ({ id: `new-o-${stamp}-${index}-${i}`, texto, orden: i + 1 }))
    : [];

  return {
    id: `new-q-${stamp}-${index}`,
    tipo,
    titulo,
    descripcion: descripcion || undefined,
    esObligatoria,
    orden: index + 1,
    opciones: formOptions,
    ...(tipo === 'escala_lineal' ? { configuracion: { min: 1, max: 5, minLabel: '', maxLabel: '' } } : {}),
    ...(tipo === 'texto_corto' && soloNumeros ? { configuracion: { soloNumeros: true } } : {})
  };
};

const optionTypeFor = (count: number): QuestionType => (count > 4 ? 'desplegable' : 'opcion_multiple');

const isTruthy = (value: unknown): boolean =>
  ['si', 'x', 'true', '1', 'yes', 'obligatorio', 'obligatoria', 'requerido'].includes(normalize(value));

/** Formato A: una fila por campo, con columnas Campo | Tipo | Obligatorio | Opciones | Descripción. */
const parseStructured = (header: unknown[], rows: unknown[][]): FormQuestion[] => {
  const cols = header.map(normalize);
  const find = (...names: string[]) => cols.findIndex((c) => names.some((n) => c === n || c.startsWith(n)));
  const iCampo = find('campo', 'pregunta', 'titulo', 'nombre');
  const iTipo = find('tipo');
  const iObligatorio = find('obligatori', 'requerid');
  const iOpciones = find('opcion');
  const iDescripcion = find('descripcion', 'ayuda', 'instruccion');

  const questions: FormQuestion[] = [];
  rows.forEach((row) => {
    const rawLabel = cellText(row[iCampo]);
    if (!rawLabel) return;

    const parsed = parseLabel(rawLabel);
    const explicitOptions = iOpciones >= 0 ? splitOptions(cellText(row[iOpciones])) : [];
    const opciones = explicitOptions.length ? explicitOptions : parsed.opciones;

    const soloNumeros = !opciones.length && NUMBER_ALIASES.includes(normalize(row[iTipo]));
    let tipo = soloNumeros ? 'texto_corto' : typeFromAlias(row[iTipo]);
    if (!tipo || (opciones.length && !OPTION_TYPES.includes(tipo))) {
      tipo = opciones.length ? optionTypeFor(opciones.length) : typeFromName(parsed.titulo);
    }

    questions.push(
      buildQuestion(
        questions.length,
        parsed.titulo,
        tipo,
        parsed.esObligatoria || (iObligatorio >= 0 && isTruthy(row[iObligatorio])),
        opciones,
        iDescripcion >= 0 ? cellText(row[iDescripcion]) : undefined,
        soloNumeros
      )
    );
  });
  return questions;
};

/** Formato B: los encabezados de la primera fila son los campos; las filas siguientes son datos de ejemplo. */
const parseHeaderRow = (header: unknown[], rows: unknown[][]): FormQuestion[] => {
  const questions: FormQuestion[] = [];
  header.forEach((cell, col) => {
    const rawLabel = cellText(cell);
    if (!rawLabel) return;

    const parsed = parseLabel(rawLabel);
    const samples = rows.map((r) => r[col]).filter((v) => cellText(v) !== '');
    let opciones = parsed.opciones;
    let tipo: QuestionType = opciones.length ? optionTypeFor(opciones.length) : typeFromName(parsed.titulo);

    if (!opciones.length && samples.length) {
      if (samples.every((v) => v instanceof Date)) {
        tipo = 'fecha';
      } else if (tipo === 'texto_corto') {
        // Pocos valores que se repiten => es una lista cerrada de opciones
        const distinct = Array.from(new Set(samples.map((v) => cellText(v))));
        if (distinct.length >= 2 && distinct.length <= 8 && samples.length >= distinct.length * 2) {
          opciones = distinct;
          tipo = optionTypeFor(distinct.length);
        }
      }
    }

    questions.push(buildQuestion(questions.length, parsed.titulo, tipo, parsed.esObligatoria, opciones));
  });
  return questions;
};

/** Formato C: una sola columna con un campo por fila (lista simple). */
const parseSingleColumn = (rows: unknown[][]): { titulo?: string; questions: FormQuestion[] } => {
  const labels = rows.map((r) => cellText(r.find((c) => cellText(c) !== ''))).filter(Boolean);
  let titulo: string | undefined;
  if (labels.length > 1 && normalize(labels[0]).startsWith('formulario')) {
    titulo = labels.shift();
  }

  const questions = labels.map((raw, i) => {
    const parsed = parseLabel(raw);
    const tipo = parsed.opciones.length ? optionTypeFor(parsed.opciones.length) : typeFromName(parsed.titulo);
    return buildQuestion(i, parsed.titulo, tipo, parsed.esObligatoria, parsed.opciones);
  });
  return { titulo, questions };
};

/**
 * Lee un archivo Excel/CSV y lo convierte en la estructura de un formulario interno.
 * Acepta tres formatos: tabla de campos (Campo/Tipo/...), encabezados como campos, o lista en una columna.
 */
export const parseExcelToForm = async (file: File): Promise<FormData> => {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) throw new Error('El archivo no contiene ninguna hoja.');

  const rows = (XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false }) as unknown[][]).filter(
    (row) => row.some((c) => cellText(c) !== '')
  );
  if (rows.length === 0) throw new Error('La hoja está vacía.');

  const fileTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  let titulo = /^(sheet|hoja)\s*\d*$/i.test(sheetName) ? fileTitle : sheetName;
  let preguntas: FormQuestion[];

  const [header, ...body] = rows;
  const headerCols = header.map(normalize);
  const isStructured =
    headerCols.some((c) => /^(campo|pregunta|titulo|nombre del campo)/.test(c)) && headerCols.some((c) => c.startsWith('tipo'));
  const isSingleColumn = rows.length > 1 && rows.every((r) => r.filter((c) => cellText(c) !== '').length <= 1);

  if (isStructured) {
    preguntas = parseStructured(header, body);
  } else if (isSingleColumn) {
    const result = parseSingleColumn(rows);
    preguntas = result.questions;
    if (result.titulo) titulo = result.titulo;
  } else {
    preguntas = parseHeaderRow(header, body);
  }

  if (preguntas.length === 0) throw new Error('No se detectaron campos en el archivo.');

  return {
    titulo: titulo || 'Formulario importado',
    descripcion: '',
    colorTema: '#6366f1',
    estado: 'borrador',
    requiereAutenticacion: false,
    preguntas
  };
};

/** Descarga una plantilla de ejemplo con el formato recomendado (una fila por campo). */
export const downloadExcelTemplate = () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Campo', 'Tipo', 'Obligatorio', 'Opciones', 'Descripción'],
    ['Nombre y apellidos', 'Texto corto', 'Sí', '', 'Escribe tu nombre completo'],
    ['Correo', 'Texto corto', 'Sí', '', ''],
    ['N. Teléfono', 'Número', 'No', '', 'Solo dígitos'],
    ['Cargo', 'Desplegable', 'Sí', 'Coordinador; Rector; Docente; Administrativo; Otro', ''],
    ['Fecha de la visita', 'Fecha', 'No', '', ''],
    ['Observaciones', 'Texto largo', 'No', '', '']
  ]);
  sheet['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 13 }, { wch: 52 }, { wch: 34 }];

  const tipos = XLSX.utils.aoa_to_sheet([
    ['Tipos válidos para la columna "Tipo"'],
    ...[...Object.values(QUESTION_TYPE_LABELS), NUMBER_TYPE_LABEL].map((label) => [label])
  ]);
  tipos['!cols'] = [{ wch: 40 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Formulario');
  XLSX.utils.book_append_sheet(workbook, tipos, 'Tipos');
  XLSX.writeFile(workbook, 'plantilla_formulario.xlsx');
};

/**
 * Tipos de documento permitidos en material de actividad / biblioteca de conocimiento.
 * Alineado con validación de entregas (ActividadesAprendiz) y backend ValidatesMaterialDocumentUpload.
 */

export const MATERIAL_DOCUMENTO_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'sql',
  'zip',
  'rar',
] as const;

export type MaterialDocumentoExtension = (typeof MATERIAL_DOCUMENTO_EXTENSIONS)[number];

export const MATERIAL_DOCUMENTO_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.sql,.zip,.rar';

export const MATERIAL_DOCUMENTO_FORMATOS_LABEL =
  'PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), SQL (.sql), ZIP o RAR';

/** Límite unificado de archivos académicos (material, biblioteca, entregas de actividad). */
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const FILE_SIZE_EXCEEDED_MESSAGE =
  'El archivo supera el tamaño máximo permitido de 50 MB.';

/** @deprecated Usar MAX_FILE_SIZE_BYTES */
export const MATERIAL_DOCUMENTO_MAX_BYTES = MAX_FILE_SIZE_BYTES;

/** Evidencia de entrega del aprendiz (Mis Actividades / Responder actividad). */
export const ENTREGA_EVIDENCIA_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'png',
  'jpg',
  'jpeg',
  'zip',
  'rar',
  'sql',
] as const;

export const ENTREGA_EVIDENCIA_ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.rar,.sql';

export const ENTREGA_EVIDENCIA_FORMATOS_LABEL =
  'PDF, DOC, DOCX, PNG, JPG, JPEG, ZIP, RAR, SQL';

const EXTENSION_SET = new Set<string>(MATERIAL_DOCUMENTO_EXTENSIONS);

export function extensionFromFileName(name?: string | null): string {
  const n = String(name ?? '').trim();
  const m = n.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : '';
}

export function extensionFromPath(path?: string | null): string {
  if (!path) return '';
  const clean = path.split('?')[0].split('#')[0];
  return extensionFromFileName(clean);
}

export function isAllowedMaterialDocumentoExtension(ext: string): boolean {
  return ext !== '' && EXTENSION_SET.has(ext);
}

/** Valida tamaño máximo; null si es válido. */
export function validateAcademicFileSize(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return FILE_SIZE_EXCEEDED_MESSAGE;
  }
  return null;
}

const ENTREGA_EVIDENCIA_EXTENSION_SET = new Set<string>(ENTREGA_EVIDENCIA_EXTENSIONS);

const ENTREGA_EVIDENCIA_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.rar',
  'application/x-rar-compressed',
  'image/png',
  'image/jpeg',
  'text/plain',
  'application/sql',
  'application/x-sql',
]);

/** Valida evidencia de entrega del aprendiz; null si es válido. */
export function validateEntregaEvidenciaFile(file: File): string | null {
  const ext = extensionFromFileName(file.name);
  const mime = String(file.type ?? '').trim().toLowerCase();

  const isAllowedByExt = ext !== '' && ENTREGA_EVIDENCIA_EXTENSION_SET.has(ext);
  const isAllowedByMime = mime !== '' && ENTREGA_EVIDENCIA_MIME_TYPES.has(mime);
  const isGenericMime = mime === '' || mime === 'application/octet-stream';

  if ((!isAllowedByExt && !isAllowedByMime) || (isGenericMime && !isAllowedByExt)) {
    return `Tipo de archivo no permitido. Solo se permiten: ${ENTREGA_EVIDENCIA_FORMATOS_LABEL}.`;
  }

  if (ext === 'sql') {
    const sqlMimes = new Set([
      'text/plain',
      'text/x-sql',
      'application/sql',
      'application/x-sql',
      'application/octet-stream',
    ]);
    if (mime && !sqlMimes.has(mime)) {
      return 'El archivo SQL no tiene un tipo válido.';
    }
  }

  return validateAcademicFileSize(file);
}

/** Valida archivo antes de subir; null si es válido. */
export function validateMaterialDocumentoFile(file: File): string | null {
  const ext = extensionFromFileName(file.name);
  const mime = String(file.type ?? '').trim().toLowerCase();

  if (!isAllowedMaterialDocumentoExtension(ext)) {
    return `Tipo de archivo no permitido. Solo se permiten: ${MATERIAL_DOCUMENTO_FORMATOS_LABEL}.`;
  }

  const genericMime = mime === '' || mime === 'application/octet-stream';
  if (genericMime && ext) {
    // Permitido por extensión (p. ej. .sql en Windows)
  } else if (ext === 'sql') {
    const sqlMimes = new Set(['text/plain', 'text/x-sql', 'application/sql', 'application/x-sql', 'application/octet-stream']);
    if (mime && !sqlMimes.has(mime)) {
      return 'El archivo SQL no tiene un tipo válido.';
    }
  }

  return validateAcademicFileSize(file);
}

export function materialDocumentoTypeLabel(ext: string): string {
  switch (ext) {
    case 'pdf':
      return 'PDF';
    case 'doc':
    case 'docx':
      return 'Word';
    case 'xls':
    case 'xlsx':
      return 'Excel';
    case 'ppt':
    case 'pptx':
      return 'PowerPoint';
    case 'sql':
      return 'SQL';
    case 'zip':
      return 'ZIP';
    case 'rar':
      return 'RAR';
    default:
      return 'Documento';
  }
}

/** Icono Keen para listados (misma idea que entregas: pdf vs documento genérico). */
export function materialDocumentoKeenIcon(ext: string): string {
  if (ext === 'pdf') return 'file-pdf';
  if (ext === 'sql') return 'code';
  if (ext === 'zip' || ext === 'rar') return 'file-sheet';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
  return 'file-added';
}

export function materialDocumentoBadgeClass(ext: string): string {
  if (ext === 'pdf') {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }
  if (ext === 'sql') {
    return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
  }
  if (ext === 'zip' || ext === 'rar') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

export function materialDocumentoActionLabel(ext: string): string {
  if (ext === 'pdf') return 'Abrir PDF';
  if (ext === 'sql') return 'Descargar SQL';
  if (ext === 'zip' || ext === 'rar') return 'Descargar archivo';
  return 'Abrir documento';
}

export function isPdfExtension(ext: string): boolean {
  return ext === 'pdf';
}

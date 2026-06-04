/**
 * Tipos de documento permitidos en material de actividad / biblioteca de conocimiento.
 * Alineado con validación de entregas (ActividadesAprendiz) y backend ValidatesMaterialDocumentUpload.
 */

import axios from 'axios';

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

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const FILE_SIZE_EXCEEDED_MESSAGE =
  'El archivo supera el límite permitido de 50 MB. Selecciona un archivo más liviano.';

export const MATERIAL_DOCUMENTO_FORMATOS_LABEL =
  'Formatos aceptados: PDF, Word, Excel, PowerPoint, SQL, ZIP, RAR. Máximo 50 MB.';

/** @deprecated Usar MAX_FILE_SIZE_BYTES */
export const MATERIAL_DOCUMENTO_MAX_BYTES = MAX_FILE_SIZE_BYTES;

export const ACTIVIDAD_DOCUMENTO_ACCEPT = '.pdf,.doc,.docx';

export const ACTIVIDAD_DOCUMENTO_FORMATOS_LABEL =
  'Formatos aceptados: PDF, Word (.doc, .docx). Máximo 50 MB.';

export const VIDEO_ACCEPT =
  'video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi';

export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi'] as const;

export const VIDEO_FORMATOS_LABEL =
  'Formatos permitidos: MP4, WebM, MOV o AVI. Máximo 50 MB.';

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

/** Valida tamaño máximo de archivos académicos; null si es válido. */
export function validateAcademicFileSize(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return FILE_SIZE_EXCEEDED_MESSAGE;
  }
  return null;
}

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

export const ENTREGA_EVIDENCIA_SIZE_EXCEEDED_MESSAGE =
  'El archivo supera el tamaño máximo permitido de 50 MB.';

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

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return ENTREGA_EVIDENCIA_SIZE_EXCEEDED_MESSAGE;
  }

  return null;
}

/** Documento base de actividad (PDF, Word). */
export function validateActividadDocumentoFile(file: File): string | null {
  const ext = extensionFromFileName(file.name);
  if (!['pdf', 'doc', 'docx'].includes(ext)) {
    return 'Tipo de archivo no permitido. Solo se permiten: PDF, Word (.doc, .docx).';
  }
  return validateAcademicFileSize(file);
}

/** Valida video de biblioteca; null si es válido. */
export function validateVideoFile(file: File): string | null {
  const ext = extensionFromFileName(file.name);
  if (!VIDEO_EXTENSIONS.includes(ext as (typeof VIDEO_EXTENSIONS)[number])) {
    return 'Tipo de video no permitido. Solo se permiten: MP4, WebM, MOV o AVI.';
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

  const sizeErr = validateAcademicFileSize(file);
  if (sizeErr) {
    return sizeErr;
  }

  return null;
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
  switch (ext) {
    case 'pdf':
      return 'Abrir PDF';
    case 'sql':
      return 'Descargar SQL';
    case 'doc':
    case 'docx':
      return 'Descargar Word';
    case 'xls':
    case 'xlsx':
      return 'Descargar Excel';
    case 'ppt':
    case 'pptx':
      return 'Descargar PowerPoint';
    case 'zip':
    case 'rar':
      return 'Descargar archivo';
    default:
      return 'Descargar archivo';
  }
}

export function isPdfExtension(ext: string): boolean {
  return ext === 'pdf';
}

/** Solo PDF se abre en el navegador; el resto se descarga. */
export function materialDocumentoShouldOpenInBrowser(ext: string): boolean {
  return isPdfExtension(ext);
}

/** Nombre de archivo para descarga (ruta almacenada o título + extensión). */
export function resolveMaterialDocumentoFileName(
  urlOrPath?: string | null,
  titulo?: string | null,
  fallback = 'documento'
): string {
  const clean = String(urlOrPath ?? '').split('?')[0].split('#')[0];
  const fromPath = clean.split('/').pop()?.trim() ?? '';
  if (fromPath && fromPath.includes('.')) {
    return fromPath;
  }

  const ext = extensionFromPath(clean || titulo);
  const baseRaw = String(titulo ?? '').trim() || fallback;
  const base = baseRaw.replace(/[<>:"/\\|?*]+/g, '_').trim() || fallback;
  if (ext && !base.toLowerCase().endsWith(`.${ext}`)) {
    return `${base}.${ext}`;
  }
  return base;
}

/** Base del servidor Laravel (sin /api) para archivos en /storage. */
function getApiStorageBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_APP_BACKEND_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim().replace(/\/$/, '');
  }
  const api = axios.defaults.baseURL || '';
  return api.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

/** URL absoluta al archivo público en storage. */
export function resolveMaterialDocumentoAbsoluteUrl(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null;
  const raw = String(urlOrPath).trim();
  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const parsed = new URL(raw);
      const base = getApiStorageBaseUrl();
      if (base && parsed.pathname.startsWith('/storage')) {
        return `${base}${parsed.pathname}`;
      }
      return raw;
    } catch {
      return raw;
    }
  }

  const base = getApiStorageBaseUrl();
  if (!base) return null;
  if (raw.startsWith('/storage/')) return `${base}${raw}`;
  if (raw.startsWith('storage/')) return `${base}/${raw}`;
  return `${base}/storage/${raw.replace(/^\/+/, '')}`;
}

/** Ruta relativa /storage/... (mismo origen que el SPA; en dev usa proxy de Vite). */
export function resolveMaterialDocumentoStoragePath(urlOrPath?: string | null): string | null {
  const absolute = resolveMaterialDocumentoAbsoluteUrl(urlOrPath);
  if (!absolute) return null;
  try {
    const pathname = new URL(absolute).pathname;
    return pathname.startsWith('/storage') ? pathname : `/storage${pathname}`;
  } catch {
    const raw = String(urlOrPath ?? '').trim();
    if (raw.startsWith('/storage/')) return raw;
    if (raw.startsWith('storage/')) return `/${raw}`;
    if (raw && !raw.startsWith('http')) return `/storage/${raw.replace(/^\/+/, '')}`;
    return null;
  }
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName || 'archivo';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

/** Enlace temporal con atributo download (sin fetch). */
export function forceDownloadMaterialDocumentoViaAnchor(url: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'archivo';
  link.target = '_self';
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Descarga vía blob (axios) — evita que SQL/Office se abran en el navegador. */
async function downloadMaterialDocumentoAsBlob(downloadUrl: string, fileName: string): Promise<void> {
  const response = await axios.get(downloadUrl, { responseType: 'blob' });
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  triggerBrowserDownload(blob, fileName);
}

export function openMaterialDocumentoInBrowser(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Abre PDF en pestaña nueva; cualquier otro formato se descarga. */
export async function actOnMaterialDocumento(
  url: string,
  ext: string,
  options?: { titulo?: string | null; urlPath?: string | null }
): Promise<void> {
  const source = options?.urlPath ?? url;
  const absoluteUrl = resolveMaterialDocumentoAbsoluteUrl(source) ?? url;
  const storagePath = resolveMaterialDocumentoStoragePath(source);

  if (materialDocumentoShouldOpenInBrowser(ext)) {
    openMaterialDocumentoInBrowser(absoluteUrl);
    return;
  }

  const fileName = resolveMaterialDocumentoFileName(source, options?.titulo);

  // 1) Misma origen (/storage/...) — evita CORS entre localhost:4200 y 127.0.0.1:8000
  if (storagePath) {
    try {
      await downloadMaterialDocumentoAsBlob(storagePath, fileName);
      return;
    } catch {
      /* intentar URL absoluta */
    }
  }

  // 2) URL absoluta del backend (storage público)
  try {
    await downloadMaterialDocumentoAsBlob(absoluteUrl, fileName);
    return;
  } catch {
    /* fallback enlace directo */
  }

  // 3) Sin fetch: enlace con download (útil si el archivo es público en el mismo host)
  forceDownloadMaterialDocumentoViaAnchor(absoluteUrl, fileName);
}

export function materialDocumentoActionIcon(ext: string): string {
  return materialDocumentoShouldOpenInBrowser(ext) ? 'eye' : 'download';
}

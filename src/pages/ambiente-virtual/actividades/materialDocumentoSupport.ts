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
  'txt',
  'csv',
  'zip',
  'rar',
] as const;

export type MaterialDocumentoExtension = (typeof MATERIAL_DOCUMENTO_EXTENSIONS)[number];

export const MATERIAL_DOCUMENTO_ACCEPT =
  [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.sql',
    '.txt',
    '.csv',
    '.zip',
    '.rar',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.rar',
    'application/x-rar-compressed',
    'text/plain',
    'text/csv',
    'application/csv',
    'application/sql',
  ].join(',');

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
/** Alias explícito para video de Biblioteca (mismo tope académico). */
export const MAX_VIDEO_SIZE_MB = MAX_FILE_SIZE_MB;
export const MAX_VIDEO_SIZE_BYTES = MAX_FILE_SIZE_BYTES;

export function fileSizeInMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function fileSizeExceededMessage(
  _file?: File,
  _kind: 'video' | 'documento' | 'archivo' = 'archivo'
): string {
  return FILE_SIZE_EXCEEDED_MESSAGE;
}

export const FILE_SIZE_EXCEEDED_MESSAGE = 'El archivo supera el máximo permitido de 50 MB.';

/** Log de desarrollo: nombre, MIME, bytes y MB del archivo seleccionado. */
export function logSelectedAcademicFile(file: File, context: string): void {
  if (!import.meta.env.DEV) return;
  const sizeMB = Number(fileSizeInMb(file.size));
  console.info(`[Biblioteca] ${context}`, {
    name: file.name,
    size: file.size,
    type: file.type || '(vacío)',
    sizeMB,
    limitMB: MAX_FILE_SIZE_MB,
    exceedsLimit: file.size > MAX_FILE_SIZE_BYTES,
  });
}

export const MATERIAL_DOCUMENTO_FORMATOS_LABEL =
  'Formatos aceptados: PDF, Word, Excel, PowerPoint, SQL, TXT, CSV, ZIP, RAR. Máximo 50 MB.';

/** @deprecated Usar MAX_FILE_SIZE_BYTES */
export const MATERIAL_DOCUMENTO_MAX_BYTES = MAX_FILE_SIZE_BYTES;

export const ACTIVIDAD_DOCUMENTO_ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const ACTIVIDAD_DOCUMENTO_FORMATOS_LABEL =
  'Formatos aceptados: PDF, Word (.doc, .docx). Máximo 50 MB.';

export const VIDEO_ACCEPT =
  'video/mp4,application/mp4,video/webm,video/quicktime,video/x-msvideo,video/avi,.mp4,.webm,.mov,.avi';

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
export function validateAcademicFileSize(
  file: File,
  kind: 'video' | 'documento' | 'archivo' = 'archivo'
): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return fileSizeExceededMessage(file, kind);
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

export const ENTREGA_EVIDENCIA_ACCEPT =
  '.pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.rar,.sql,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,application/zip,application/x-zip-compressed,application/vnd.rar,application/x-rar-compressed';

export const ENTREGA_EVIDENCIA_FORMATOS_LABEL =
  'PDF, DOC, DOCX, PNG, JPG, JPEG, ZIP, RAR, SQL';

export const ENTREGA_EVIDENCIA_SIZE_EXCEEDED_MESSAGE =
  'El archivo supera el tamaño máximo permitido de 50 MB.';

const ENTREGA_EVIDENCIA_EXTENSION_SET = new Set<string>(ENTREGA_EVIDENCIA_EXTENSIONS);

const ENTREGA_EVIDENCIA_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.ms-word',
  'application/x-msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-word.document.macroenabled.12',
  'application/CDFV2',
  'application/x-ole-storage',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.rar',
  'application/x-rar-compressed',
  'image/png',
  'image/jpeg',
  'text/plain',
  'application/sql',
  'application/x-sql',
  'application/octet-stream',
]);

/** Valida evidencia de entrega del aprendiz; null si es válido. */
export function validateEntregaEvidenciaFile(file: File): string | null {
  const ext = extensionFromFileName(file.name);
  const mime = String(file.type ?? '').trim().toLowerCase();

  const isAllowedByExt = ext !== '' && ENTREGA_EVIDENCIA_EXTENSION_SET.has(ext);
  const isAllowedByMime = mime !== '' && ENTREGA_EVIDENCIA_MIME_TYPES.has(mime);
  const isGenericMime = mime === '' || mime === 'application/octet-stream';

  // Prioridad por extensión (Word/PDF/etc.): evita rechazar .doc/.docx con MIME raro del SO.
  if (isAllowedByExt) {
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

  if ((!isAllowedByExt && !isAllowedByMime) || (isGenericMime && !isAllowedByExt)) {
    return `Tipo de archivo no permitido. Solo se permiten: ${ENTREGA_EVIDENCIA_FORMATOS_LABEL}.`;
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
  // Misma regla de tamaño que el resto de documentos académicos (50 MB).
  return validateAcademicFileSize(file);
}

/** Valida video de biblioteca; null si es válido. */
export function validateVideoFile(file: File): string | null {
  const ext = extensionFromFileName(file.name);
  if (!VIDEO_EXTENSIONS.includes(ext as (typeof VIDEO_EXTENSIONS)[number])) {
    return 'Formato de video no permitido. Solo se permiten: MP4, WebM, MOV o AVI.';
  }
  const mime = String(file.type ?? '').trim().toLowerCase();
  if (mime && /^(text\/|image\/|application\/json|application\/xml)/.test(mime)) {
    return 'Formato de video no permitido. Solo se permiten: MP4, WebM, MOV o AVI.';
  }
  return validateAcademicFileSize(file, 'video');
}

const firstErrorString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const found = value.find((v) => typeof v === 'string' && v.trim());
    return typeof found === 'string' ? found : undefined;
  }
  return undefined;
};

/** Extrae el primer mensaje útil de un error de carga (422 / 413 / PHP upload). */
export function formatMaterialUploadError(
  err: unknown,
  opts?: { videoFile?: File | null; documentoFile?: File | null }
): string {
  const ax = err as {
    response?: {
      status?: number;
      data?: {
        errors?: Record<string, string[] | string>;
        error?: string;
        message?: string;
      };
    };
    message?: string;
  };
  const videoFile = opts?.videoFile ?? null;
  const documentoFile = opts?.documentoFile ?? null;
  if (ax.response?.status === 413) {
    if (videoFile && videoFile.size > MAX_VIDEO_SIZE_BYTES) {
      return fileSizeExceededMessage(videoFile, 'video');
    }
    if (documentoFile && documentoFile.size > MAX_FILE_SIZE_BYTES) {
      return fileSizeExceededMessage(documentoFile, 'documento');
    }
    return `El archivo supera el máximo permitido de ${MAX_FILE_SIZE_MB} MB.`;
  }
  const errs = ax.response?.data?.errors;
  if (errs && typeof errs === 'object') {
    const videoMsg = firstErrorString(errs.video);
    if (videoMsg) {
      if (/failed to upload|uploaded/i.test(videoMsg)) {
        if (videoFile && videoFile.size > MAX_VIDEO_SIZE_BYTES) {
          return fileSizeExceededMessage(videoFile, 'video');
        }
        return 'El servidor no pudo recibir completamente el archivo.';
      }
      return videoMsg;
    }
    const docMsg = firstErrorString(errs.documento);
    if (docMsg) {
      if (/failed to upload|uploaded/i.test(docMsg)) {
        if (documentoFile && documentoFile.size > MAX_FILE_SIZE_BYTES) {
          return fileSizeExceededMessage(documentoFile, 'documento');
        }
        return 'El servidor no pudo recibir completamente el archivo.';
      }
      return docMsg;
    }
    const first = Object.values(errs)
      .map((v) => firstErrorString(v))
      .find((v): v is string => Boolean(v));
    if (first) {
      if (/failed to upload/i.test(first)) {
        return 'El servidor no pudo recibir completamente el archivo.';
      }
      return first;
    }
  }
  const msg = ax.response?.data?.error || ax.response?.data?.message || ax.message;
  if (typeof msg === 'string' && msg.trim()) {
    if (/failed to upload/i.test(msg)) {
      return 'El servidor no pudo recibir completamente el archivo.';
    }
    if (/storage|unable to write|disk/i.test(msg)) {
      return 'No fue posible guardar el archivo.';
    }
    return msg;
  }
  return 'Error al guardar';
}

/** Valida archivo antes de subir; null si es válido. */
export function validateMaterialDocumentoFile(file: File): string | null {
  const ext = extensionFromFileName(file.name);
  const mime = String(file.type ?? '').trim().toLowerCase();

  if (!isAllowedMaterialDocumentoExtension(ext)) {
    return 'El formato seleccionado no está permitido.';
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

  const sizeErr = validateAcademicFileSize(file, 'documento');
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
    case 'txt':
      return 'TXT';
    case 'csv':
      return 'CSV';
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

export function youtubeVideoId(raw?: string | null): string | null {
  const u = String(raw ?? '').trim();
  if (!u) return null;
  try {
    const url = new URL(u.startsWith('http') ? u : `https://${u}`);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const youtubeHosts = ['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'youtu.be'];
    if (!youtubeHosts.some((h) => host === h || host.endsWith(`.${h}`))) return null;
    const v = url.searchParams.get('v');
    if (v && /^[A-Za-z0-9_-]{6,32}$/.test(v)) return v;
    const pathMatch = url.pathname.match(/\/(embed|shorts|live|v)\/([A-Za-z0-9_-]{6,32})/);
    if (pathMatch?.[2]) return pathMatch[2];
    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return /^[A-Za-z0-9_-]{6,32}$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Si la URL es de YouTube, devuelve URL embed; si no, null. */
export function youtubeEmbedUrl(raw: string): string | null {
  const id = youtubeVideoId(raw);
  return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
}

export function youtubeWatchUrl(raw?: string | null): string | null {
  const id = youtubeVideoId(raw);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

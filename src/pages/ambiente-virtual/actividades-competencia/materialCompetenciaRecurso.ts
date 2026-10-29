import {
  MATERIAL_DOCUMENTO_EXTENSIONS,
  extensionFromFileName,
  extensionFromPath,
  materialDocumentoTypeLabel,
  validateAcademicFileSize,
  validateMaterialDocumentoFile,
  validateVideoFile,
  youtubeEmbedUrl,
  youtubeVideoId,
  youtubeWatchUrl,
} from '@/pages/ambiente-virtual/actividades/materialDocumentoSupport';
import { tipoMaterialDisplay } from '@/pages/ambiente-virtual/actividades/tipoMaterialApoyo';
import type {
  MaterialCompetenciaItem,
  MaterialCompetenciaNaturaleza,
  MaterialCompetenciaRecursoItem,
} from './materialCompetencia.types';

export const DOCUMENTO_COMPETENCIA_EXTENSIONS = [...MATERIAL_DOCUMENTO_EXTENSIONS, 'csv'] as const;

export const DOCUMENTO_COMPETENCIA_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.sql,.zip,.rar,.csv';

export const DOCUMENTO_COMPETENCIA_FORMATOS_LABEL =
  'Formatos aceptados: PDF, Word, Excel, PowerPoint, SQL, CSV, ZIP o RAR. Máximo 50 MB.';

export const MULTIMEDIA_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi', 'mp3'] as const;

export const AUDIO_EXTENSIONS = ['mp3'] as const;

export const MULTIMEDIA_ACCEPT =
  'video/mp4,video/webm,video/quicktime,video/x-msvideo,audio/mpeg,audio/mp3,.mp4,.webm,.mov,.avi,.mp3';

export const MULTIMEDIA_FORMATOS_LABEL =
  'Formatos permitidos: MP4, WebM, MOV, AVI (video) y MP3 (audio). Máximo 50 MB.';

export function validateDocumentoCompetenciaFile(file: File): string | null {
  const ext = extensionFromFileName(file.name);
  if (ext === 'csv') {
    return validateAcademicFileSize(file);
  }
  return validateMaterialDocumentoFile(file);
}

export function validateMultimediaCompetenciaFile(file: File): string | null {
  const ext = extensionFromFileName(file.name);
  if ((AUDIO_EXTENSIONS as readonly string[]).includes(ext)) {
    return validateAcademicFileSize(file);
  }
  return validateVideoFile(file);
}

export function esAudioFormato(formato?: string | null): boolean {
  return (AUDIO_EXTENSIONS as readonly string[]).includes(String(formato ?? '').toLowerCase());
}

export function clasificarEnlace(raw: string): {
  ok: boolean;
  url?: string;
  formato?: 'youtube' | 'pdf_externo' | 'enlace';
  mensaje?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, mensaje: 'Indique una URL.' };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, mensaje: 'La URL no es válida. Use http o https.' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, mensaje: 'La URL no es válida. Use http o https.' };
  }
  const href = url.toString();
  if (youtubeVideoId(href)) return { ok: true, url: href, formato: 'youtube' };
  const path = url.pathname.toLowerCase();
  if (path.endsWith('.pdf')) return { ok: true, url: href, formato: 'pdf_externo' };
  return { ok: true, url: href, formato: 'enlace' };
}

export function etiquetaFormatoEnlace(formato?: string | null): string {
  switch (formato) {
    case 'youtube':
      return 'YouTube';
    case 'pdf_externo':
      return 'PDF externo';
    default:
      return 'Página externa';
  }
}

export function recursosDelMaterial(item: MaterialCompetenciaItem): MaterialCompetenciaRecursoItem[] {
  if (Array.isArray(item.recursos) && item.recursos.length > 0) return item.recursos;
  const out: MaterialCompetenciaRecursoItem[] = [];
  if (item.urlDocumento || item.urlDocumentoUrl) {
    const ext = extensionFromPath(item.urlDocumentoUrl || item.urlDocumento || item.titulo);
    out.push({
      tipo: 'DOCUMENTO',
      titulo: item.titulo,
      nombre: item.titulo,
      ruta: item.urlDocumento,
      url: item.urlDocumentoUrl || item.urlDocumento,
      formato: ext || 'documento',
      naturaleza: 'documento',
      legacy: true,
    });
  }
  if (item.urlVideo || item.urlVideoUrl) {
    const src = item.urlVideoUrl || item.urlVideo || '';
    const yt = youtubeVideoId(src);
    if (yt) {
      out.push({
        tipo: 'ENLACE',
        titulo: item.titulo,
        nombre: item.titulo,
        url: src,
        urlExterna: src,
        formato: 'youtube',
        naturaleza: 'youtube',
        youtubeEmbedUrl: youtubeEmbedUrl(src),
        youtubeWatchUrl: youtubeWatchUrl(src),
        legacy: true,
      });
    } else {
      const ext = extensionFromPath(src);
      out.push({
        tipo: 'MULTIMEDIA',
        titulo: item.titulo,
        nombre: item.titulo,
        ruta: item.urlVideo,
        url: item.urlVideoUrl || item.urlVideo,
        formato: ext || 'video',
        naturaleza: esAudioFormato(ext) ? 'audio' : 'video',
        legacy: true,
      });
    }
  }
  if (item.urlAdicional?.trim()) {
    const clasif = clasificarEnlace(item.urlAdicional);
    out.push({
      tipo: 'ENLACE',
      titulo: item.titulo,
      nombre: item.titulo,
      url: clasif.url || item.urlAdicional,
      urlExterna: clasif.url || item.urlAdicional,
      formato: clasif.formato || 'enlace',
      naturaleza: clasif.formato === 'youtube' ? 'youtube' : clasif.formato === 'pdf_externo' ? 'pdf_externo' : 'enlace',
      youtubeEmbedUrl: youtubeEmbedUrl(item.urlAdicional),
      youtubeWatchUrl: youtubeWatchUrl(item.urlAdicional),
      legacy: true,
    });
  }
  return out;
}

export function recursosPorTipo(item: MaterialCompetenciaItem) {
  const todos = recursosDelMaterial(item);
  return {
    documentos: todos.filter((r) => r.tipo === 'DOCUMENTO'),
    multimedia: todos.filter((r) => r.tipo === 'MULTIMEDIA'),
    enlaces: todos.filter((r) => r.tipo === 'ENLACE'),
    todos,
  };
}

export function etiquetaTipoRecurso(item: MaterialCompetenciaItem): string {
  const { documentos, multimedia, enlaces } = recursosPorTipo(item);
  const partes: string[] = [];
  if (documentos.length) partes.push(documentos.length === 1 ? 'Documento' : `${documentos.length} documentos`);
  if (multimedia.length) partes.push(multimedia.length === 1 ? 'Multimedia' : `${multimedia.length} multimedia`);
  if (enlaces.length) partes.push(enlaces.length === 1 ? 'Enlace' : `${enlaces.length} enlaces`);
  if (partes.length) return partes.join(' · ');
  return tipoMaterialDisplay(item.tipoMaterial) || 'Recurso';
}

export function etiquetaNaturaleza(recurso: MaterialCompetenciaRecursoItem): string {
  switch (recurso.naturaleza) {
    case 'video':
      return 'VIDEO';
    case 'audio':
      return 'AUDIO';
    case 'youtube':
      return 'YouTube';
    case 'pdf_externo':
      return 'PDF';
    case 'documento':
      return materialDocumentoTypeLabel(String(recurso.formato || '')).toUpperCase();
    default:
      return 'Enlace';
  }
}

export function accionRecurso(recurso: MaterialCompetenciaRecursoItem): string {
  switch (recurso.naturaleza) {
    case 'video':
    case 'youtube':
      return 'Reproducir video';
    case 'audio':
      return 'Reproducir audio';
    case 'pdf_externo':
      return 'Ver PDF';
    case 'documento':
      return 'Ver documento';
    default:
      return 'Abrir enlace';
  }
}

export function nombreRecurso(recurso: MaterialCompetenciaRecursoItem): string {
  return (recurso.titulo || recurso.nombre || '').trim() || 'Recurso';
}

export function tieneVideoMaterial(item: MaterialCompetenciaItem): boolean {
  return recursosDelMaterial(item).some((r) => r.naturaleza === 'video' || r.naturaleza === 'youtube');
}

export function tieneDocumentoMaterial(item: MaterialCompetenciaItem): boolean {
  return recursosDelMaterial(item).some((r) => r.tipo === 'DOCUMENTO');
}

export function tieneEnlaceMaterial(item: MaterialCompetenciaItem): boolean {
  return recursosDelMaterial(item).some((r) => r.tipo === 'ENLACE');
}

export type { MaterialCompetenciaNaturaleza };

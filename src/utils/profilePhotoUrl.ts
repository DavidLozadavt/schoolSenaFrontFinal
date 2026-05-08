import axios from 'axios';

/** Mismo fallback que en actividades (ModalAprendices, ListaActividades, asignar actividad). */
export const AVATAR_DEFAULT = '/media/avatars/blank.png';

/**
 * Resuelve la URL pública de una foto de persona (ruta relativa o absoluta), alineado con
 * `getPerfilPublicUrl` en ActividadesAprendiz / `getFotoUrl` en ListaActividades.
 */
export function getPerfilPublicUrl(path?: string | null): string | null {
  if (!path || !String(path).trim()) return null;
  const p = String(path).trim();
  if (p.toLowerCase() === 'null') return null;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = p.startsWith('/') ? p.slice(1) : p;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
}

export type PersonaFotoFields = {
  rutaFotoUrl?: string | null;
  rutaFoto?: string | null;
};

/**
 * Orden: `rutaFotoUrl` (URL completa del API) y luego `rutaFoto` (ruta en storage).
 * Si nada es válido, devuelve el placeholder del sistema.
 */
export function resolvePersonaPhotoUrl(persona?: PersonaFotoFields | null): string {
  if (!persona) return AVATAR_DEFAULT;
  for (const c of [persona.rutaFotoUrl, persona.rutaFoto]) {
    const u = getPerfilPublicUrl(c);
    if (u) return u;
  }
  return AVATAR_DEFAULT;
}

/** URL de foto si existe; si no hay datos válidos, `null` (para fallback visual sin `<img src="">`). */
export function getResolvedPersonaPhotoUrl(persona?: PersonaFotoFields | null): string | null {
  if (!persona) return null;
  for (const c of [persona.rutaFotoUrl, persona.rutaFoto]) {
    const u = getPerfilPublicUrl(c);
    if (u) return u;
  }
  return null;
}

import axios from 'axios';

/** Mismo fallback que en actividades (ModalAprendices, ListaActividades, asignar actividad). */
export const AVATAR_DEFAULT = '/media/avatars/blank.png';

/**
 * Placeholders del API / del front que no son una fotografía real.
 * `Person::getRutaFotoUrl` devuelve `url('/default/user.svg')` cuando no hay foto;
 * `blank.png` es un robot, no la silueta azul de School.
 */
function esFotoPlaceholder(path: string): boolean {
  const s = path.toLowerCase();
  return (
    s.includes('blank.png') ||
    s.includes('default/user.svg') ||
    s.includes('default-avatar') ||
    s.includes('via.placeholder') ||
    /\/user\.svg(\?|$)/.test(s)
  );
}

/**
 * Evita usar el nombre de una persona (u otro texto) como si fuera ruta de imagen.
 * Si hay barra, URL o extensión de archivo, se considera ruta.
 */
function pareceTextoEnLugarDeRuta(path: string): boolean {
  const t = path.trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t)) return false;
  if (/[\\/]/.test(t)) return false;
  if (/\.(jpe?g|png|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(t)) return false;
  if (/\s/.test(t) || /@/.test(t)) return true;
  return false;
}

/**
 * Resuelve la URL pública de una foto de persona (ruta relativa o absoluta), alineado con
 * `getPerfilPublicUrl` en ActividadesAprendiz / `getFotoUrl` en ListaActividades.
 * Placeholders y textos que no son ruta devuelven `null` para que el avatar muestre la silueta.
 */
export function getPerfilPublicUrl(path?: string | null): string | null {
  if (!path || !String(path).trim()) return null;
  const p = String(path).trim();
  if (p.toLowerCase() === 'null') return null;
  if (esFotoPlaceholder(p) || pareceTextoEnLugarDeRuta(p)) return null;
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

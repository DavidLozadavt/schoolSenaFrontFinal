import { removeAuth } from '@/auth/_helpers';

export const LICENCIA_ICFES_INACTIVA_CODE = 'LICENCIA_ICFES_INACTIVA';

export const MENSAJE_LICENCIA_ICFES_INACTIVA =
  'La licencia de EduExce se ha inactivado. Contacte a Virtual Technology.';

export const LOGIN_LICENCIA_QUERY = 'licencia-revocada';

export const LOGIN_LICENCIA_PATH = '/auth/login';

/** Cierra sesión y redirige al login solo cuando VT revoca la licencia en una sesión activa. */
export function cerrarSesionPorLicenciaRevocada(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('login_message');
  } catch {
    /* ignore */
  }

  removeAuth();

  const destino = `${LOGIN_LICENCIA_PATH}?reason=${LOGIN_LICENCIA_QUERY}`;
  if (!window.location.pathname.includes('/auth')) {
    window.location.href = destino;
  }
}

export function esCodigoLicenciaIcfesInactiva(code: unknown): boolean {
  return code === LICENCIA_ICFES_INACTIVA_CODE;
}

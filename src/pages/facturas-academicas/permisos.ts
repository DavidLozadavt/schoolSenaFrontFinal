/**
 * Permiso de la vista /pagos/facturas-academicas.
 * Créelo manualmente en Gestión de usuarios → Permisos:
 *
 * - Nombre: GESTION_FACTURAS_ACADEMICAS
 * - Descripción: Gestión de Facturas
 * - Icono: file-text
 * - Ruta: /pagos/facturas-academicas
 * - Padre: GESTION_MEDIO_PAGOS
 */
export const PERMISO_GESTION_FACTURAS_ACADEMICAS = 'GESTION_FACTURAS_ACADEMICAS';

/** Permisos que permiten abrir /pagos/facturas-academicas (OR, igual que ProtectedRoute). */
export const PERMISOS_ACCESO_VER_FACTURAS = [
  PERMISO_GESTION_FACTURAS_ACADEMICAS,
  'GESTION_VALORES_ECONOMICOS'
] as const;

export const PERMISO_FACTURAS_ACADEMICAS_REGISTRO = {
  nombre: PERMISO_GESTION_FACTURAS_ACADEMICAS,
  descripcion: 'Gestión de Facturas',
  icono: 'file-text',
  ruta: '/pagos/facturas-academicas',
  padreSugerido: 'GESTION_MEDIO_PAGOS'
} as const;

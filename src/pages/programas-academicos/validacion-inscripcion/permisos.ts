/**
 * Permiso de la vista /gestion-academica/inscripciones/solicitudes.
 * Créelo manualmente en Gestión de usuarios → Permisos:
 *
 * - Nombre: GESTION_SOLICITUDES_INSCRIPCION
 * - Descripción: Solicitudes de inscripción
 * - Icono: document
 * - Ruta: /gestion-academica/inscripciones/solicitudes
 * - Padre: GESTION_ACADEMICA
 */
export const PERMISO_GESTION_SOLICITUDES_INSCRIPCION = 'GESTION_SOLICITUDES_INSCRIPCION';

/** Permisos que permiten abrir el listado y el wizard (OR, igual que ProtectedRoute). */
export const PERMISOS_ACCESO_VALIDACION_INSCRIPCION = [
  PERMISO_GESTION_SOLICITUDES_INSCRIPCION,
  'GESTION_ACADEMICA'
] as const;

export const PERMISO_SOLICITUDES_INSCRIPCION_REGISTRO = {
  nombre: PERMISO_GESTION_SOLICITUDES_INSCRIPCION,
  descripcion: 'Solicitudes de inscripción',
  icono: 'document',
  ruta: '/gestion-academica/inscripciones/solicitudes',
  padreSugerido: 'GESTION_ACADEMICA'
} as const;

/** Bandeja de comprobantes cargados desde el portal público. */
export const PERMISO_COMPROBANTES_INSCRIPCION_REGISTRO = {
  nombre: PERMISO_GESTION_SOLICITUDES_INSCRIPCION,
  descripcion: 'Comprobantes de inscripción',
  icono: 'file-up',
  ruta: '/gestion-academica/inscripciones/comprobantes',
  padreSugerido: 'GESTION_ACADEMICA'
} as const;

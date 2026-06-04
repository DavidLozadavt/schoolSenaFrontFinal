/**
 * Permiso de la vista /pagos/configuracion-valores-economicos.
 * Si no existe en BD, créelo manualmente en Gestión de usuarios → Permisos:
 *
 * - Nombre: GESTION_VALORES_ECONOMICOS
 * - Descripción: Configuración de valores económicos
 * - Icono: wallet
 * - Ruta: /pagos/configuracion-valores-economicos
 * - Padre: GESTION_MEDIO_PAGOS (o GESTION_MEDIO_PAGO según catálogo del entorno)
 */
export const PERMISO_GESTION_VALORES_ECONOMICOS = 'GESTION_VALORES_ECONOMICOS';

export const PERMISO_VALORES_ECONOMICOS_REGISTRO = {
  nombre: PERMISO_GESTION_VALORES_ECONOMICOS,
  descripcion: 'Configuración de valores económicos',
  icono: 'wallet',
  ruta: '/pagos/configuracion-valores-economicos',
  padreSugerido: 'GESTION_MEDIO_PAGOS'
} as const;

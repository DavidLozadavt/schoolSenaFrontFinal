/**
 * Normaliza nombres de permiso para comparación.
 * La UI de permisos puede guardar espacios ("GESTION TIPO PAGO")
 * mientras rutas y menú usan guiones bajos ("GESTION_TIPO_PAGO").
 */
export const normalizePermissionName = (permission: string): string =>
  permission.trim().replace(/\s+/g, '_').toUpperCase();

export const userHasAnyPermission = (
  requiredPermissions: string[],
  userPermissions: string[]
): boolean => {
  if (requiredPermissions.length === 0) {
    return true;
  }

  const normalizedUser = new Set(
    (userPermissions ?? []).map((perm) => normalizePermissionName(perm))
  );

  return requiredPermissions.some((perm) =>
    normalizedUser.has(normalizePermissionName(perm))
  );
};

export const ICFES_MODULE_PERMISSIONS = ['MODULO_ICFES', 'GESTION_ICFES'] as const;

export const ROL_ADMIN_INSTITUCION_EDUEXCE = 'ADMIN INSTITUCION EDUEXCE';

export const requiresIcfesInstitutionAccess = (requiredPermissions: string[]): boolean =>
  requiredPermissions.some((perm) =>
    (ICFES_MODULE_PERMISSIONS as readonly string[]).includes(normalizePermissionName(perm))
  );

/** Acceso Conectar ICFES: permiso MODULO_ICFES y no operar como centro SENA. */
export const canAccessModuloIcfes = (
  userPermissions: string[],
  userRoles: string[] | undefined,
  user?: { idCentroFormacion?: number | null } | null,
  centroF?: number
): boolean => {
  if (!userHasAnyPermission([...ICFES_MODULE_PERMISSIONS], userPermissions)) {
    return false;
  }

  if (user?.idCentroFormacion) {
    return false;
  }

  if (centroF && centroF !== 0) {
    return false;
  }

  const roles = (userRoles ?? []).map((r) => r.trim().toUpperCase());
  const senaCentroBlocked = roles.some(
    (r) =>
      r.includes('ADMIN CENTRO') ||
      r.includes('ADMIN REGIONAL') ||
      (r.includes('CENTRO') && r.includes('SENA')) ||
      (r.includes('REGIONAL') && r.includes('SENA') && !r.includes('EDUEXCE'))
  );

  return !senaCentroBlocked;
};

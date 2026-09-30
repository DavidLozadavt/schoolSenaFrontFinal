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

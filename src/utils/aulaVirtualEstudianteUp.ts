/** Permisos del aula virtual reutilizados para estudiantes de colegio (ESTUDIANTEUP). */
export const AULA_VIRTUAL_APRENDIZ_PERMISSIONS = [
  'AULA_VIRTUAL_APRENDIZ',
  'AULA_VIRTUAL_APRENDIZ_CLASES',
  'AULA_VIRTUAL_APRENDIZ_ACTIVIDADES',
  'AULA_VIRTUAL_APRENDIZ_GRUPOS',
  'AULA_VIRTUAL_APRENDIZ_BIBLIOTECA',
] as const;

export const ESTUDIANTE_UP_ROLE = 'ESTUDIANTEUP';

/** Estudiantes de colegio entran al dashboard con menú; no bloquear por activación pendiente (state 18). */
export const shouldSkipActivationGate = (
  roles: string[] | undefined,
  stateId?: number | null
): boolean =>
  stateId === 18 && Array.isArray(roles) && roles.includes(ESTUDIANTE_UP_ROLE);

export const isActivationGateActive = (
  roles: string[] | undefined,
  stateId?: number | null
): boolean => stateId === 18 && !shouldSkipActivationGate(roles, stateId);

export const isEstudianteUpAulaVirtualAccess = (
  roles: string[] | undefined,
  requiredPermissions: string[]
): boolean => {
  if (!Array.isArray(roles) || !roles.includes(ESTUDIANTE_UP_ROLE)) {
    return false;
  }

  const normalizedRequired = requiredPermissions.map((p) => p.trim().toUpperCase());

  return AULA_VIRTUAL_APRENDIZ_PERMISSIONS.some((perm) =>
    normalizedRequired.includes(perm)
  );
};

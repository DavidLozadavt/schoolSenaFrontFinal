import { exportarPlaneacionExcel } from '@/pages/programas-academicos/components/malla-curricular/utils/Exportplaneacion';

export interface FichaPlaneacionMeta {
  id: number;
  codigo: string;
  docFichaUrl?: string | null;
  docProgramaUrl?: string | null;
  idInstructorLider?: number | null;
  idProyectoFormativo?: number | null;
  instructorLiderNombre?: string;
  jornada?: string;
  programa?: string;
}

export function obtenerIdContratoActivo(
  contratos: Array<{ id?: number; idEstado?: number }> | undefined
): number | undefined {
  const activo = contratos?.find((c) => Number(c.idEstado) === 1);
  return activo?.id != null ? Number(activo.id) : undefined;
}

export function puedeDescargarPlaneacion(
  meta: FichaPlaneacionMeta | undefined,
  idContratoUsuario: number | undefined
): boolean {
  if (!meta?.id || !meta.idProyectoFormativo || Number(meta.idProyectoFormativo) <= 0) {
    return false;
  }
  if (!meta.idInstructorLider || !idContratoUsuario) return false;
  return Number(meta.idInstructorLider) === Number(idContratoUsuario);
}

export function metaPlaneacionDesdeFichaRaw(
  fichaRaw: Record<string, unknown>,
  fichaId: number,
  backUrl = ''
): FichaPlaneacionMeta {
  const persona = (fichaRaw.instructorLider as { persona?: Record<string, unknown> } | undefined)
    ?.persona;
  const nombreLider = persona
    ? `${String(persona.nombre1 ?? '')} ${String(persona.apellido1 ?? '')}`.trim()
    : '';

  const asignacion = fichaRaw.asignacion as
    | { programa?: { nombrePrograma?: string; documento?: string } }
    | undefined;
  const jornada = fichaRaw.jornada as { nombreJornada?: string } | undefined;
  const docFicha = fichaRaw.documento ? String(fichaRaw.documento) : null;
  const docPrograma = asignacion?.programa?.documento ? String(asignacion.programa.documento) : null;

  return {
    id: Number(fichaRaw.id ?? fichaId),
    codigo: String(fichaRaw.codigo ?? ''),
    docFichaUrl: docFicha ? `${backUrl}${docFicha}` : null,
    docProgramaUrl: docPrograma ? `${backUrl}${docPrograma}` : null,
    idInstructorLider:
      fichaRaw.idInstructorLider != null ? Number(fichaRaw.idInstructorLider) : null,
    idProyectoFormativo:
      fichaRaw.idProyectoFormativo != null ? Number(fichaRaw.idProyectoFormativo) : null,
    instructorLiderNombre: nombreLider,
    jornada: jornada?.nombreJornada ?? '',
    programa: asignacion?.programa?.nombrePrograma ?? ''
  };
}

export async function descargarPlaneacionFicha(meta: FichaPlaneacionMeta): Promise<void> {
  await exportarPlaneacionExcel({
    id: meta.id,
    codigo: meta.codigo,
    instructorLider: meta.instructorLiderNombre ?? '',
    jornada: meta.jornada ?? '',
    programa: meta.programa ?? ''
  });
}

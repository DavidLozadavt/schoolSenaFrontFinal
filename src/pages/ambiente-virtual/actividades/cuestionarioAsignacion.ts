/** Configuración temporal de preguntas por cuestionario (solo frontend → POST asignar). */

export interface PreguntaCuestionarioResumen {
  id: number;
  descripcion?: string;
  tipoPregunta?: string | null;
  urlDocumento?: string | null;
}

export interface ConfigCuestionarioAsignacion {
  /**
   * Cantidad de preguntas que recibirá cada aprendiz por intento,
   * seleccionadas automáticamente desde TODO el banco del cuestionario.
   */
  cantidadPreguntas: number;
}

/** Mapa idActividad → configuración confirmada */
export type ConfigCuestionariosMap = Record<number, ConfigCuestionarioAsignacion>;

export const esCuestionario = (tipoActividad?: string | null): boolean =>
  (tipoActividad || '').toLowerCase() === 'cuestionario';

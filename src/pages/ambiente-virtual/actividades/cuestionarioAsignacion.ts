/** Configuración temporal de preguntas por cuestionario (solo frontend → POST asignar). */
export type ModoPreguntasCuestionario = 'manual' | 'aleatorio';

export interface PreguntaCuestionarioResumen {
  id: number;
  descripcion?: string;
  tipoPregunta?: string | null;
  urlDocumento?: string | null;
}

export interface ConfigCuestionarioAsignacion {
  modo: ModoPreguntasCuestionario;
  idsPreguntas: number[];
}

/** Mapa idActividad → configuración confirmada */
export type ConfigCuestionariosMap = Record<number, ConfigCuestionarioAsignacion>;

export const seleccionarPreguntasAleatorias = (ids: number[], cantidad: number): number[] => {
  const pool = [...ids];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(cantidad, pool.length));
};

export const esCuestionario = (tipoActividad?: string | null): boolean =>
  (tipoActividad || '').toLowerCase() === 'cuestionario';

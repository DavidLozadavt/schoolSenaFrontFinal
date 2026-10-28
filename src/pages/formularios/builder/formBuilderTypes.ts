export type QuestionType = 'texto_corto' | 'texto_largo' | 'opcion_multiple' | 'casillas' | 'desplegable' | 'escala_lineal' | 'fecha' | 'hora' | 'archivo';

export interface FormOption {
  id?: string | number;
  texto: string;
  orden: number;
}

export interface FormQuestion {
  id?: string | number;
  tipo: QuestionType;
  titulo: string;
  descripcion?: string;
  esObligatoria: boolean;
  orden: number;
  opciones: FormOption[];
  configuracion?: Record<string, any>;
}

/**
 * "Número" no es un tipo propio en la base de datos (la columna `tipo` es un enum):
 * es una respuesta corta con `configuracion.soloNumeros`, que solo admite dígitos.
 */
export const esSoloNumeros = (q: Pick<FormQuestion, 'tipo' | 'configuracion'>): boolean =>
  q.tipo === 'texto_corto' && !!q.configuracion?.soloNumeros;

/**
 * "Dato único": el valor no puede repetirse entre las respuestas del formulario
 * (p. ej. la identificación). Solo aplica a respuestas cortas, incluido "Número";
 * el backend lo valida al enviar.
 */
export const esValorUnico = (q: Pick<FormQuestion, 'tipo' | 'configuracion'>): boolean =>
  q.tipo === 'texto_corto' && !!q.configuracion?.valorUnico;

/**
 * Dato que esta pregunta aporta a la escarapela del evento ('nombre' o
 * 'identificacion'). Sin marcar, el backend lo deduce por el título de la
 * pregunta ("Nombre completo", "Cédula"...).
 */
export type CampoEscarapela = 'nombre' | 'identificacion';

export const campoEscarapela = (q: Pick<FormQuestion, 'tipo' | 'configuracion'>): CampoEscarapela | '' =>
  q.tipo === 'texto_corto' ? q.configuracion?.campoEscarapela || '' : '';

export interface FormData {
  id?: number;
  slug?: string;
  titulo: string;
  descripcion?: string;
  colorTema: string;
  imagenCabecera?: string | null;
  estado: string;
  requiereAutenticacion: boolean;
  permiteMultiplesRespuestas?: boolean;
  fechaInicio?: string | null;
  fechaLimite?: string | null;
  limiteRespuestas?: number | null;
  mensajeCierre?: string | null;
  is_expired?: boolean;
  motivo_expiracion?: 'no_iniciado' | 'expirado' | 'pausado' | 'limite_alcanzado' | 'borrador' | null;
  respuestas_count?: number;
  preguntas: FormQuestion[];
}

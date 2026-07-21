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

export interface FormData {
  id?: number;
  slug?: string;
  titulo: string;
  descripcion?: string;
  colorTema: string;
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

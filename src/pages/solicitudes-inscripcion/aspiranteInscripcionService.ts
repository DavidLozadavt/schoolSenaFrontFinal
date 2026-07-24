import axios from 'axios';

export interface AspiranteInfo {
  nombre: string;
  apellido: string;
  celular: string;
  correo: string | null;
  centroFormacion: string;
  programa: string;
  ficha: string;
  estadoDocumental: string | null;
}

export interface FormularioPreguntaPublica {
  id: number;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  esObligatoria: boolean;
  orden: number;
  opciones?: { id: number; texto: string }[];
  configuracion?: { min?: number; max?: number; minLabel?: string; maxLabel?: string } | null;
}

export interface FormularioPublico {
  id: number;
  titulo: string;
  descripcion: string | null;
  colorTema?: string;
  imagenCabecera?: string | null;
  mensajeCierre?: string | null;
  fechaLimite?: string | null;
  preguntas: FormularioPreguntaPublica[];
}

export interface InscripcionAspiranteResponse {
  aspirante: AspiranteInfo;
  formulario: FormularioPublico;
  respuestaPrevia: { idPregunta: number; valor: string }[] | null;
  motivoNoDisponible: string | null;
}

const API_PATH = 'inscripcion-aspirante';

export const aspiranteInscripcionService = {
  getFormulario: async (token: string): Promise<InscripcionAspiranteResponse> => {
    const response = await axios.get<InscripcionAspiranteResponse>(`${API_PATH}/${token}`);
    return response.data;
  },

  responder: async (
    token: string,
    respuestas: { idPregunta: number; valor: string }[]
  ): Promise<{ success: boolean; estadoDocumental: string }> => {
    const response = await axios.post(`${API_PATH}/${token}/responder`, { respuestas });
    return response.data;
  },

  uploadAdjunto: async (file: File): Promise<{ success: boolean; url: string; path: string }> => {
    const formData = new FormData();
    formData.append('archivo', file);
    const response = await axios.post('formulario-publico/upload-adjunto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

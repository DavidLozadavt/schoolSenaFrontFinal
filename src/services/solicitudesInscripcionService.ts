import axios from 'axios';
import { PaginatedResponse } from './seguimientoAspirantesService';

export interface SolicitudAspirante {
  id: number;
  nombre: string;
  apellido: string;
  celular: string;
  correo: string | null;
  centro_formacion: string;
  programa: string;
  ficha: string;
  estado: string;
  estadoDocumental: string | null;
  fechaFormularioEnviado: string | null;
  tokenPublico: string | null;
}

export interface GetSolicitudesParams {
  page?: number;
  per_page?: number;
  estadoDocumental?: string;
  programa?: string;
  ficha?: string;
  centro_formacion?: string;
}

export interface HistorialItem {
  id: number;
  idAspirante: number;
  accion: string;
  motivo: string | null;
  idUsuarioRevisor: number | null;
  fecha: string;
  usuarioRevisor?: { id: number; email: string } | null;
}

export interface FormularioPregunta {
  id: number;
  tipo: string;
  titulo: string;
  esObligatoria: boolean;
}

export interface FormularioRespuestaDetalle {
  id: number;
  respuestas: { idPregunta: number; valor: string }[];
  formulario: {
    id: number;
    titulo: string;
    preguntas: FormularioPregunta[];
  };
}

export interface SolicitudDetalle {
  aspirante: SolicitudAspirante;
  respuesta: FormularioRespuestaDetalle | null;
  historial: HistorialItem[];
}

const API_PATH = 'solicitudes-inscripcion';

export const solicitudesInscripcionService = {
  getSolicitudes: async (params: GetSolicitudesParams): Promise<PaginatedResponse<SolicitudAspirante>> => {
    const response = await axios.get<PaginatedResponse<SolicitudAspirante>>(API_PATH, { params });
    return response.data;
  },

  getDetalle: async (id: number): Promise<SolicitudDetalle> => {
    const response = await axios.get<SolicitudDetalle>(`${API_PATH}/${id}`);
    return response.data;
  },

  aprobar: async (id: number): Promise<{ success: boolean; estadoDocumental: string }> => {
    const response = await axios.post(`${API_PATH}/${id}/aprobar`);
    return response.data;
  },

  rechazar: async (id: number, motivo: string): Promise<{ success: boolean; estadoDocumental: string }> => {
    const response = await axios.post(`${API_PATH}/${id}/rechazar`, { motivo });
    return response.data;
  },
};
